import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import { z } from "zod";
import { CODECUT_DIR, CodeCutError } from "@codecut/core";
import {
  licenseReport,
  lintProjectDir,
  loadVoiceWords,
  probeMedia,
  readLedger,
  requireFfmpeg,
} from "@codecut/render";
import { runChecklist, summarize, CHECKLIST, type MixFacts } from "../review.js";
import { tool } from "./util.js";

/** Export presets: render quality and master loudness. */
export const PRESETS = {
  draft: { quality: "draft", targetLufs: -14, description: "Fast low-quality check render." },
  social: {
    quality: "looks",
    targetLufs: -14,
    description: "Standard quality for social platforms (-14 LUFS).",
  },
  final: {
    quality: "delivery",
    targetLufs: -14,
    description: "Highest quality. Render only after the user approves the draft.",
  },
} as const;
export type PresetName = keyof typeof PRESETS;

const rel = (root: string, p: string) => relative(root, p);

function downscale(src: string, dest: string, scale: number): string {
  requireFfmpeg();
  mkdirSync(dirname(dest), { recursive: true });
  execFileSync("ffmpeg", ["-y", "-v", "error", "-i", src, "-vf", `scale=iw*${scale}:-2`, dest]);
  return dest;
}

export const frameRender = tool({
  name: "frame_render",
  title: "Render one frame",
  description:
    "Render one exact frame to a PNG and show it. Use it to check a look, a layout or a moment before building more. `scale` shrinks it (default 0.5).",
  input: {
    time: z.number().min(0).describe("Seconds."),
    scale: z.number().min(0.1).max(1).optional(),
  },
  readOnly: true,
  async run(a, ctx) {
    const b = await ctx.build();
    if (a.time > b.compile.ir.end)
      throw new CodeCutError(
        "invalid_time",
        `Time ${a.time}s is after the end (${b.compile.ir.end}s)`,
        {
          fix: "Pick a time inside the film.",
        },
      );
    const outDir = ctx.store.path(join(CODECUT_DIR, "frames"));
    const s = await ctx.snapshot(b.dir, { times: [a.time], outDir });
    let file = s.files[0];
    if (!file) throw new CodeCutError("render_failed", "No frame was written");
    const scale = a.scale ?? 0.5;
    if (scale < 1) file = downscale(file, join(outDir, `frame-${a.time}s@${scale}.png`), scale);
    return {
      data: { path: rel(ctx.root, file), time: a.time, scale },
      images: [{ path: file, mime: "image/png" }],
    };
  },
});

export const contactSheet = tool({
  name: "contact_sheet",
  title: "Contact sheet",
  description:
    "Render several frames and tile them into one image. Pass `times` (seconds) or `count` evenly spaced frames (default 12).",
  input: {
    times: z.array(z.number().min(0)).min(1).max(48).optional(),
    count: z.number().int().min(1).max(48).optional(),
  },
  readOnly: true,
  async run(a, ctx) {
    const b = await ctx.build();
    const end = b.compile.ir.end;
    const times =
      a.times ??
      Array.from(
        { length: a.count ?? 12 },
        (_, i) => Math.round(Math.min(end - 0.05, ((i + 0.5) / (a.count ?? 12)) * end) * 100) / 100,
      );
    const outDir = ctx.store.path(join(CODECUT_DIR, "sheet"));
    const s = await ctx.snapshot(b.dir, { times, outDir });
    if (!s.contactSheet) throw new CodeCutError("render_failed", "No contact sheet was written");
    return {
      data: {
        path: rel(ctx.root, s.contactSheet),
        times,
        frames: s.files.map((f) => rel(ctx.root, f)),
      },
      images: [{ path: s.contactSheet, mime: "image/jpeg" }],
    };
  },
});

export const mixPreview = tool({
  name: "mix_preview",
  title: "Mix the audio",
  description:
    "Mix the project's audio offline (voice, music, sfx buses; music ducks under voice; master loudness) and write a WAV. Returns where each sound lands and the measured loudness. You cannot hear it: ask the user to listen.",
  input: {
    range: z
      .tuple([z.number().min(0), z.number().min(0)])
      .optional()
      .describe("[start, end] seconds."),
  },
  readOnly: true,
  async run(a, ctx) {
    const b = await ctx.build({ mix: true });
    if (!b.mix)
      throw new CodeCutError("asset_missing", "The project has no audio to mix", {
        fix: "Add a Voiceover, Audio or Sound first.",
      });
    const out = ctx.store.path(join(CODECUT_DIR, "previews", "mix.wav"));
    mkdirSync(dirname(out), { recursive: true });
    if (a.range) {
      requireFfmpeg();
      execFileSync("ffmpeg", [
        "-y",
        "-v",
        "error",
        "-i",
        b.mix.file,
        "-ss",
        String(a.range[0]),
        "-to",
        String(a.range[1]),
        out,
      ]);
    } else copyFileSync(b.mix.file, out);
    return {
      data: {
        path: rel(ctx.root, out),
        lufs: b.mix.lufs,
        truePeak: b.mix.truePeak,
        targetLufs: b.mix.targetLufs,
        duckAmount: b.mix.duckAmount,
        events: b.mix.events.map((e) => ({
          id: e.id,
          bus: e.bus,
          src: e.src,
          startsAt: e.startAt,
          peakLandsAt: e.landsAt,
          gainDb: e.gainDb,
        })),
        note: "Measured, not auditioned. Ask the user to listen to the sounds you picked.",
      },
    };
  },
});

export const renderTool = tool({
  name: "render",
  title: "Render the video",
  description: `Render to MP4. Presets: ${Object.entries(PRESETS)
    .map(([k, v]) => `${k} (${v.description})`)
    .join(
      "; ",
    )}. Lint errors block the render. Writes <name>.credits.txt and <name>.licenses.json next to the video. Render 'final' only after the user approved the draft.`,
  input: {
    preset: z.enum(["draft", "social", "final"]),
    range: z
      .tuple([z.number().min(0), z.number().min(0)])
      .optional()
      .describe("[start, end] seconds, trimmed after rendering."),
    variants: z.array(z.string()).optional().describe("Reserved for format variants (phase 5)."),
  },
  async run(a, ctx) {
    ctx.requireProject();
    if (a.variants?.length)
      throw new CodeCutError(
        "invalid_edit",
        "Format variants (9:16, 16:9, 1:1, 4:5) are not built yet",
        {
          fix: "Render once per format by changing the Composition size. See docs/later.md.",
        },
      );
    const preset = PRESETS[a.preset];
    const lint = await lintProjectDir(ctx.root, ctx.store.config().lint);
    if (lint.errors) {
      const first = lint.issues.find((i) => i.severity === "error")!;
      throw new CodeCutError(
        "schema_violation",
        `${lint.errors} lint error(s) block the render: ${first.message}`,
        {
          fix: first.fix ?? "Run lint and fix the errors.",
          details: lint.issues.filter((i) => i.severity === "error").slice(0, 10),
        },
      );
    }
    const b = await ctx.build({ mix: true, targetLufs: preset.targetLufs });
    const id = String(b.loaded.node.props.id);
    const full = ctx.store.path(join("renders", `${id}-${a.preset}.mp4`));
    mkdirSync(dirname(full), { recursive: true });
    const r = await ctx.render(b.dir, { output: full, quality: preset.quality });
    let file = r.output;
    if (a.range) {
      requireFfmpeg();
      const trimmed = full.replace(/\.mp4$/, `.${a.range[0]}-${a.range[1]}.mp4`);
      execFileSync("ffmpeg", [
        "-y",
        "-v",
        "error",
        "-i",
        full,
        "-ss",
        String(a.range[0]),
        "-to",
        String(a.range[1]),
        "-c:v",
        "libx264",
        "-c:a",
        "aac",
        trimmed,
      ]);
      file = trimmed;
    }
    const families = b.fonts.map((f) => f.family);
    const lic = licenseReport(readLedger(ctx.root), b.audio, b.fontsUsed, families);
    const stem = file.replace(/\.mp4$/, "");
    let creditsFile: string | undefined;
    if (lic.credits) {
      creditsFile = `${stem}.credits.txt`;
      writeFileSync(creditsFile, lic.credits);
    }
    const reportFile = `${stem}.licenses.json`;
    writeFileSync(
      reportFile,
      JSON.stringify({ used: lic.used, problems: lic.problems }, null, 2) + "\n",
    );
    const info = probeMedia(file);
    return {
      data: {
        file: rel(ctx.root, file),
        bytes: r.bytes,
        duration: info?.duration,
        size: info?.width ? `${info.width}x${info.height}` : undefined,
        loudness: b.mix
          ? { lufs: b.mix.lufs, truePeak: b.mix.truePeak, target: preset.targetLufs }
          : undefined,
        license: {
          report: rel(ctx.root, reportFile),
          credits: creditsFile ? rel(ctx.root, creditsFile) : undefined,
          entries: lic.used.length,
          attribution: lic.attribution.map(
            (e) => `${e.title ?? e.id} by ${e.author} (${e.license})`,
          ),
          problems: lic.problems,
        },
      },
    };
  },
});

const SECOND_PASS =
  "Now do a separate second pass: open the contact sheet image and judge checks marked manual/needs-eyes one by one (hero carried across beats, numbers add up, nothing overlaps, transitions have a reason, the Look is consistent). Fix failures with the edit tools, then call review again. Stop after 3 rounds and show the user what still fails. Do not claim the audio sounds right: you cannot hear it.";

export const reviewTool = tool({
  name: "review",
  title: "Review against the checklist",
  description: `Lint, mix, render a contact sheet and check the 17-point checklist (${CHECKLIST.map((c) => c.n).join(",")}). Returns pass/fail/warn/manual for each with fixes. Set deep:false to skip the slower rendered layout/contrast measurement. \`checklist\` limits to those item numbers.`,
  input: {
    checklist: z.array(z.number().int().min(1).max(17)).optional(),
    deep: z.boolean().optional(),
    sheetCount: z.number().int().min(4).max(24).optional(),
  },
  readOnly: true,
  async run(a, ctx) {
    ctx.requireProject();
    const lint = await lintProjectDir(ctx.root, ctx.store.config().lint);
    const b = await ctx.build({ mix: true });
    const ledger = readLedger(ctx.root);
    const mix: MixFacts | undefined = b.mix
      ? {
          lufs: b.mix.lufs,
          truePeak: b.mix.truePeak,
          targetLufs: b.mix.targetLufs,
          duckAmount: b.mix.duckAmount,
          events: b.mix.events.map((e) => ({ bus: e.bus, gainDb: e.gainDb })),
        }
      : undefined;
    const hf = a.deep === false ? undefined : await ctx.hfCheck(b.dir);
    const results = runChecklist(
      {
        tree: b.loaded.node,
        fps: Number(b.loaded.node.props.fps ?? 30),
        duration: b.compile.ir.end,
        ir: b.compile.ir,
        sounds: b.sounds,
        audio: b.audio,
        lint: lint.issues,
        ledger,
        license: licenseReport(
          ledger,
          b.audio,
          b.fontsUsed,
          b.fonts.map((f) => f.family),
        ),
        mix,
        hf,
        words: loadVoiceWords(ctx.root, b.loaded.node),
      },
      a.checklist,
    );
    const end = b.compile.ir.end;
    const n = a.sheetCount ?? 12;
    const times = Array.from(
      { length: n },
      (_, i) => Math.round(Math.min(end - 0.05, ((i + 0.5) / n) * end) * 100) / 100,
    );
    const s = await ctx.snapshot(b.dir, {
      times,
      outDir: ctx.store.path(join(CODECUT_DIR, "sheet")),
    });
    const summary = summarize(results);
    const data = {
      ...summary,
      lint: { errors: lint.errors, warnings: lint.warnings },
      measured: { layoutAndContrast: !!hf },
      checks: results,
      contactSheet: s.contactSheet ? rel(ctx.root, s.contactSheet) : undefined,
      times,
      next: summary.pass
        ? SECOND_PASS
        : `Fix the failing checks (${summary.failing.join(", ")}) first. ${SECOND_PASS}`,
    };
    // the live view shows the latest review
    mkdirSync(ctx.store.path(join(CODECUT_DIR, "review")), { recursive: true });
    writeFileSync(
      ctx.store.path(join(CODECUT_DIR, "review", "last.json")),
      JSON.stringify({ at: Date.now(), ...data }, null, 2) + "\n",
    );
    return {
      data,
      images: s.contactSheet ? [{ path: s.contactSheet, mime: "image/jpeg" }] : undefined,
    };
  },
});

void basename;
