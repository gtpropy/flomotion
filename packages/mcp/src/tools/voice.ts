import { extname } from "node:path";
import { z } from "zod";
import {
  FlomotionError,
  edit as coreEdit,
  findById,
  isNode,
  parseTimeLiteral,
  snapToFrame,
  type CCNode,
  type Patch,
} from "@flomotion/core";
import { loadVoiceWords, requireFfmpeg } from "@flomotion/render";
import { registry } from "@flomotion/components";
import { writeWords } from "../providers/transcribe.js";
import { tool, writeResult } from "./util.js";

const { makeResult } = coreEdit;

export const transcribe = tool({
  name: "transcribe",
  title: "Transcribe a recording",
  description:
    "Word timings for an audio file with local Whisper (whisper.cpp via hyperframes). Writes <audio>.words.json as [{w,start,end}] next to the audio, which a Voiceover loads. Fails with install steps when Whisper is missing.",
  input: { audio: z.string().describe("Path inside the project.") },
  async run(a, ctx) {
    ctx.requireProject();
    const abs = ctx.store.path(a.audio);
    requireFfmpeg();
    const words = await ctx.transcriber.transcribe(abs);
    const file =
      abs.replace(new RegExp(`${extname(abs).replace(".", "\\.")}$`), "") + ".words.json";
    writeWords(file, words);
    return {
      data: {
        file: file.replace(ctx.root + "/", ""),
        words: words.length,
        first: words.slice(0, 8),
        engine: ctx.transcriber.name,
        note: "Whisper can mishear: read the words against the script and fix the file by hand if needed.",
      },
    };
  },
});

export const voiceQuote = tool({
  name: "voice_quote",
  title: "Quote a voice",
  description:
    "Price a voice generation WITHOUT running it. Providers: recording (default: you supply a file, free), local-tts (free, macOS stub), elevenlabs (needs ELEVENLABS_API_KEY; spends credits). Show the quote to the user and wait for their yes before voice_generate with confirm:true.",
  input: {
    provider: z.enum(["recording", "local-tts", "elevenlabs"]),
    text: z.string().describe("The script to speak."),
    voice: z
      .string()
      .optional()
      .describe("recording: file path. local-tts: voice name. elevenlabs: voice id."),
    model: z.string().optional(),
  },
  readOnly: true,
  async run(a, ctx) {
    ctx.requireProject();
    const q = ctx.voice.quote({
      provider: a.provider,
      text: a.text,
      voice: a.voice,
      model: a.model,
    });
    const account = q.spends ? await ctx.voice.account(a.provider) : undefined;
    return {
      data: {
        ...q,
        ...(account
          ? {
              account: {
                ...account,
                enough: account.remaining >= q.credits,
                note:
                  account.remaining >= q.credits
                    ? `The account has ${account.remaining} characters left this period, enough for this.`
                    : `The account has only ${account.remaining} characters left this period; this needs about ${q.credits}.`,
              },
            }
          : {}),
        next: q.spends
          ? "Show this quote to the user. Do NOT call voice_generate until they agree; then pass confirm:true."
          : "Free. Call voice_generate with this quoteId.",
      },
    };
  },
});

export const voiceGenerate = tool({
  name: "voice_generate",
  title: "Generate or import the voice",
  description:
    "Run a quote from voice_quote. Providers that spend money refuse unless confirm is exactly true (error quote_required). Writes assets/voice/<id>.<ext> (+ word timings when the provider returns them) and a ledger entry.",
  input: {
    quoteId: z.string(),
    confirm: z.boolean().optional(),
    id: z.string().optional().describe("Name for the file (default: voice)."),
  },
  async run(a, ctx) {
    ctx.requireProject();
    const r = await ctx.voice.generate(a);
    return {
      data: {
        file: r.file,
        wordsFile: r.wordsFile,
        duration: r.duration,
        words: r.words,
        spent: r.quote.spends ? { credits: r.quote.credits, usd: r.quote.usd } : undefined,
        next: r.wordsFile
          ? "Word timings are saved. Add <Voiceover id src=… /> and <Captions voice=… />."
          : "No word timings yet. Run transcribe on this file (or supply <name>.words.json).",
      },
    };
  },
});

const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");

function absoluteStart(root: CCNode, id: string, fps: number): number {
  const dfs = (n: CCNode, acc: number): number | undefined => {
    if (n.props.id === id) return acc;
    const own =
      n !== root && n.props.start !== undefined ? parseTimeLiteral(n.props.start as never, fps) : 0;
    for (const c of n.children) {
      if (!isNode(c)) continue;
      const r = dfs(c, acc + (n.props.id === id ? 0 : own));
      if (r !== undefined) return r;
    }
    return undefined;
  };
  return dfs(root, 0) ?? 0;
}

export const alignToVoice = tool({
  name: "align_to_voice",
  title: "Start things on spoken words",
  description:
    "Retime elements to words of a Voiceover. mapping: [{ id, word: <index or text>, edge?: 'start'|'end', prop?: 'start'|'at', offset?: seconds }]. Text matches the next occurrence after the previous entry. Do this after the voice exists.",
  input: {
    voiceId: z.string(),
    mapping: z
      .array(
        z.object({
          id: z.string(),
          word: z.union([z.number().int().min(0), z.string()]),
          edge: z.enum(["start", "end"]).optional(),
          prop: z.string().optional(),
          offset: z.number().optional(),
        }),
      )
      .min(1),
  },
  async run(a, ctx) {
    ctx.requireProject();
    const loaded = await ctx.store.load();
    const root = loaded.node;
    const voice = findById(root, a.voiceId);
    if (!voice || voice.node.name !== "Voiceover")
      throw new FlomotionError("unknown_element", `#${a.voiceId} is not a Voiceover`, {
        fix: "Add a <Voiceover id=… src=… /> first.",
      });
    const words = loadVoiceWords(ctx.root, root).get(a.voiceId);
    if (!words?.length)
      throw new FlomotionError("asset_missing", `No word timings for #${a.voiceId}`, {
        fix: "Run transcribe on the voice file, or provide <name>.words.json.",
      });
    const fps = typeof root.props.fps === "number" ? root.props.fps : 30;
    const patches: Patch[] = [];
    const report: Array<{
      id: string;
      word: string;
      wordIndex: number;
      absolute: number;
      prop: string;
      value: string;
    }> = [];
    let cursor = 0;
    for (const m of a.mapping) {
      let i: number;
      if (typeof m.word === "number") i = m.word;
      else {
        const target = norm(m.word);
        i = words.findIndex((w, k) => k >= cursor && norm(w.w) === target);
        if (i < 0) i = words.findIndex((w) => norm(w.w) === target);
        if (i < 0)
          throw new FlomotionError("invalid_edit", `The word "${m.word}" is not in the voice`, {
            fix: `Words: ${words
              .slice(0, 20)
              .map((w) => w.w)
              .join(" ")}…`,
          });
      }
      const w = words[i];
      if (!w)
        throw new FlomotionError(
          "invalid_edit",
          `The voice has ${words.length} words; no index ${i}`,
        );
      cursor = i + 1;
      const hit = findById(root, m.id);
      if (!hit)
        throw new FlomotionError("unknown_element", `No element with id "${m.id}"`, {
          fix: "Use project_read to list ids.",
        });
      const def = registry.get(hit.node.name);
      const prop = m.prop ?? (def?.controls.start ? "start" : "at");
      const abs = snapToFrame((m.edge === "end" ? w.end : w.start) + (m.offset ?? 0), fps);
      const parentAbs = hit.parent
        ? absoluteStart(root, String(hit.parent.props.id), fps) +
          (hit.parent !== root && hit.parent.props.start !== undefined
            ? parseTimeLiteral(hit.parent.props.start as never, fps)
            : 0)
        : 0;
      const value = `${Math.round((abs - parentAbs) * 1000) / 1000}s`;
      patches.push({ op: "setProp", id: m.id, prop, value });
      report.push({ id: m.id, word: w.w, wordIndex: i, absolute: abs, prop, value });
    }
    const result = makeResult(root, patches, `align ${patches.length} element(s) to #${a.voiceId}`);
    const w = await ctx.store.apply(result, loaded);
    return { data: { ...writeResult(w), aligned: report } };
  },
});
