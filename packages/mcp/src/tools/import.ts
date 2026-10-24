import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, extname, join, relative } from "node:path";
import { z } from "zod";
import { FlomotionError, upsertEntry, type LedgerEntry } from "@flomotion/core";
import { ledgerPath, probeMedia, readLedger } from "@flomotion/render";
import { AUDIO_EXT, TEXT_EXT, assertReadable, listFiles } from "../assets.js";
import { tagsFromPath } from "../providers/library.js";
import { checkWords, parseTranscript, type Precision } from "../providers/transcript.js";
import { writeWords } from "../providers/transcribe.js";
import type { Context } from "../context.js";
import { tool } from "./util.js";

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "file";

const transcriptSource = z.object({
  source: z
    .string()
    .optional()
    .describe("Path of a transcript or captions file (srt, vtt, json, txt)."),
  text: z
    .string()
    .optional()
    .describe("The transcript text itself (plain, SRT, VTT, JSON, or lines starting with a time)."),
  format: z.enum(["srt", "vtt", "json", "text"]).optional(),
});

/** Parse a transcript for an audio file that is already in the project and write its word timings. */
function importTranscript(
  ctx: Context,
  audioRel: string,
  t: z.infer<typeof transcriptSource>,
  duration?: number,
) {
  const audio = ctx.store.path(audioRel);
  if (!existsSync(audio))
    throw new FlomotionError("asset_missing", `No audio at ${audioRel}`, {
      fix: "Import the voice first with voice_import.",
    });
  if (!t.source && !t.text)
    throw new FlomotionError("invalid_edit", "Give the transcript as `source` (a file) or `text`");
  const raw = t.source
    ? readFileSync(assertReadable(t.source, TEXT_EXT, 20 * 1024 * 1024), "utf8")
    : t.text!;
  const audioDuration = probeMedia(audio)?.duration;
  const fmt =
    t.format ??
    (t.source && /\.srt$/i.test(t.source)
      ? "srt"
      : t.source && /\.vtt$/i.test(t.source)
        ? "vtt"
        : t.source && /\.json$/i.test(t.source)
          ? "json"
          : undefined);
  const parsed = parseTranscript(raw, { format: fmt, duration: duration ?? audioDuration });
  const warnings = [...parsed.warnings, ...checkWords(parsed.words, audioDuration)];
  const file =
    audio.replace(new RegExp(`${extname(audio).replace(".", "\\.")}$`), "") + ".words.json";
  writeWords(file, parsed.words);
  return {
    file: relative(ctx.root, file),
    words: parsed.words.length,
    precision: parsed.precision as Precision,
    format: parsed.format,
    warnings,
    first: parsed.words.slice(0, 8),
    audioDuration,
    lastWordEnds: parsed.words[parsed.words.length - 1]?.end,
  };
}

const precisionAdvice = (p: Precision) =>
  p === "word"
    ? "Word-level: good for captions and for starting things on a word."
    : p === "cue"
      ? "Line-level: words are spread inside each line. Captions are fine; starting an element exactly on one word can be off by up to a line. Say so before you promise word-exact timing."
      : "Estimated from the text and the audio length only. Captions will drift from the speech. Ask for captions (SRT/VTT) or a word-level transcript, or run transcribe (Whisper), before you rely on timing.";

export const transcriptImport = tool({
  name: "transcript_import",
  title: "Use a transcript the person gives",
  description:
    "Turn a transcript or captions the person already has (SRT, VTT, word-level JSON from Whisper/ElevenLabs/a caption tool, text with a time on each line, or plain text) into word timings for a voice file in the project: <audio>.words.json, which a Voiceover and Captions read. Reports how exact the timing is (word, cue, estimated). Use this instead of transcribe when they already have the words.",
  input: {
    audio: z.string().describe("The voice file inside the project, e.g. assets/voice/voice.wav."),
    ...transcriptSource.shape,
    duration: z
      .number()
      .positive()
      .optional()
      .describe("Audio length in seconds, for plain text (measured from the file when omitted)."),
  },
  async run(a, ctx) {
    ctx.requireProject();
    const r = importTranscript(ctx, a.audio, a, a.duration);
    return {
      data: {
        ...r,
        advice: precisionAdvice(r.precision),
        next: "Add <Voiceover id src=… /> and <Captions voice=… />, then align_to_voice for word-tied motion.",
      },
    };
  },
});

export const voiceImport = tool({
  name: "voice_import",
  title: "Use the person's own voice recording",
  description:
    "Bring the person's recording into the project (assets/voice/<id>.<ext>), measure it, record it in the ledger as supplied by them, and optionally import its transcript at the same time. The file may be anywhere on their computer; only audio is read. Free: no provider is called.",
  input: {
    source: z.string().describe("Path of the recording on the person's computer."),
    id: z.string().optional().describe("Name for the file (default: voice)."),
    transcript: transcriptSource
      .optional()
      .describe("Their transcript or captions, if they have them."),
  },
  async run(a, ctx) {
    ctx.requireProject();
    const real = assertReadable(a.source, AUDIO_EXT);
    const id = slug(a.id ?? "voice");
    const rel = join("assets", "voice", `${id}${extname(real).toLowerCase()}`);
    const dest = ctx.store.path(rel);
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(real, dest);
    const info = probeMedia(dest);
    if (!info?.hasAudio)
      throw new FlomotionError("asset_missing", `${basename(real)} has no audio`);
    const entry: LedgerEntry = {
      source: "own",
      kind: "voice",
      id,
      file: rel,
      hash: createHash("sha256").update(readFileSync(dest)).digest("hex"),
      license: "owned by the person",
      attributionRequired: false,
      commercialOk: true,
      duration: info.duration,
      title: basename(real),
      note: "recording supplied by the person",
    };
    writeFileSync(
      ledgerPath(ctx.root),
      JSON.stringify(upsertEntry(readLedger(ctx.root), entry), null, 2) + "\n",
    );
    const words = a.transcript ? importTranscript(ctx, rel, a.transcript) : undefined;
    return {
      data: {
        file: rel,
        duration: info.duration,
        ...(words ? { transcript: { ...words, advice: precisionAdvice(words.precision) } } : {}),
        voiceover: `<Voiceover id="vo" src="${rel}" />`,
        next: words
          ? 'Add the Voiceover (at the Composition level) and <Captions voice="#vo" />, then align_to_voice.'
          : "No word timings yet: ask for a transcript or captions (transcript_import), or run transcribe if Whisper is installed.",
      },
    };
  },
});

export const soundImport = tool({
  name: "sound_import",
  title: "Use the person's own sound effects",
  description:
    'Bring sound files the person has (one file or a folder, up to 40 files) into the project: copied to sounds/, listed in sounds/catalog.json with search words from the file names, peak measured, ledger entry written. The person must state their rights (own, licensed or permission). After this the sounds are found by sound_search and used as <Sound src="local:ID" />. For a big library use `flomotion setup` instead.',
  input: {
    source: z.string().describe("A sound file or a folder of sounds on the person's computer."),
    rights: z
      .enum(["own", "licensed", "permission"])
      .describe("Their statement: they made them, hold a licence, or have permission."),
    tag: z
      .string()
      .optional()
      .describe('The job tag to name the peak after (hit/land → peak="land").'),
    name: z.string().optional().describe("Name for a single file."),
    license: z
      .string()
      .optional()
      .describe("Licence text for the ledger, e.g. the pack's licence name."),
    author: z.string().optional(),
    url: z.string().optional(),
    recurse: z.boolean().optional(),
  },
  async run(a, ctx) {
    ctx.requireProject();
    const real = assertReadable(a.source, AUDIO_EXT);
    const files = statSync(real).isDirectory()
      ? listFiles(real, AUDIO_EXT, !!a.recurse, 41)
      : [real];
    if (!files.length) throw new FlomotionError("asset_missing", `No audio files in ${a.source}`);
    if (files.length > 40)
      throw new FlomotionError("invalid_edit", "More than 40 sound files in one import", {
        fix: "Import the few you need, or run `flomotion setup` and point it at the folder to build a searchable library.",
      });
    const catalogFile = ctx.store.path(join("sounds", "catalog.json"));
    const catalog: Array<Record<string, unknown>> = existsSync(catalogFile)
      ? JSON.parse(readFileSync(catalogFile, "utf8"))
      : [];
    const license =
      a.license ??
      (a.rights === "own"
        ? "owned by the person"
        : a.rights === "licensed"
          ? "licensed to the person"
          : "used with permission");
    const out: Array<{ ref: string; file: string; duration?: number; peak?: unknown }> = [];
    for (const f of files) {
      const id = slug(a.name && files.length === 1 ? a.name : basename(f, extname(f)));
      const rel = `${id}${extname(f).toLowerCase()}`;
      mkdirSync(dirname(catalogFile), { recursive: true });
      copyFileSync(f, ctx.store.path(join("sounds", rel)));
      const row = {
        id,
        name: basename(f, extname(f)).replace(/[_-]+/g, " "),
        tags: [...new Set([...tagsFromPath(basename(f)), ...(a.tag ? a.tag.split("/") : [])])],
        license,
        rights: a.rights,
        author: a.author ?? "the person",
        url: a.url ?? "",
        file: rel,
      };
      const at = catalog.findIndex((r) => r.id === id);
      if (at >= 0) catalog[at] = row;
      else catalog.push(row);
      writeFileSync(catalogFile, JSON.stringify(catalog, null, 2) + "\n");
      const got = await ctx.sound.get({ id: `local:${id}`, tag: a.tag });
      out.push({
        ref: got.ref,
        file: join("sounds", rel),
        duration: got.entry.duration,
        peak: got.entry.peak,
      });
    }
    return {
      data: {
        imported: out,
        rights: a.rights,
        use: `<Sound id="…" src="${out[0]!.ref}" at="…s" peak="${a.tag?.split("/").pop() ?? "main"}" />`,
        note: "Rights are what the person told us. Peaks are measured, not heard: ask them to listen.",
      },
    };
  },
});
