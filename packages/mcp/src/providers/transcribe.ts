import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { FlomotionError } from "@flomotion/core";
import { runHyperframes, stripAnsi } from "@flomotion/render";
import type { Word } from "./voice.js";

export interface Transcriber {
  readonly name: string;
  transcribe(audioFile: string, opts?: { language?: string }): Promise<Word[]>;
}

const round = (n: number) => Math.round(n * 1000) / 1000;

/** Normalise the transcript shapes tools produce into `[{ w, start, end }]`. */
export function normalizeWords(raw: unknown): Word[] {
  const rows = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { words?: unknown })?.words)
      ? (raw as { words: unknown[] }).words
      : [];
  const out: Word[] = [];
  for (const r of rows as Array<Record<string, unknown>>) {
    const w = String(r.w ?? r.text ?? r.word ?? "").trim();
    const start = Number(r.start ?? r.from);
    const end = Number(r.end ?? r.to);
    if (w && Number.isFinite(start) && Number.isFinite(end))
      out.push({ w, start: round(start), end: round(end) });
  }
  return out;
}

/**
 * Local Whisper through `hyperframes transcribe` (whisper.cpp). If the runtime is missing it fails with install steps
 * instead of downloading anything on its own.
 */
export class HyperframesTranscriber implements Transcriber {
  readonly name = "whisper-cpp (via hyperframes transcribe)";
  async transcribe(audioFile: string, opts: { language?: string } = {}): Promise<Word[]> {
    const dir = mkdtempSync(join(tmpdir(), "flomotion-tr-"));
    try {
      mkdirSync(dir, { recursive: true });
      const args = ["transcribe", audioFile, "-d", dir, "--json", "--no-runtime-install"];
      if (opts.language) args.push("-l", opts.language);
      const r = await runHyperframes(args, { cwd: dir, timeoutMs: 20 * 60_000 });
      const text = stripAnsi(r.stdout);
      const last = text
        .split("\n")
        .reverse()
        .find((l) => l.trim().startsWith("{"));
      const j = last
        ? (JSON.parse(last) as { ok?: boolean; error?: string; transcriptPath?: string })
        : undefined;
      if (r.code !== 0 || !j?.ok) {
        throw new FlomotionError(
          "missing_dependency",
          `Transcription failed: ${j?.error ?? stripAnsi(r.stderr).split("\n").filter(Boolean).slice(-1)[0] ?? "unknown error"}`,
          {
            fix: "Ask the person to run `flomotion setup whisper` (it installs whisper.cpp and the speech model with their OK). Or use transcript_import with a transcript or captions they already have.",
          },
        );
      }
      const file = j.transcriptPath ? j.transcriptPath : join(dir, "transcript.json");
      if (!existsSync(file))
        throw new FlomotionError("missing_dependency", "Transcript file was not written");
      const words = normalizeWords(JSON.parse(readFileSync(file, "utf8")));
      if (!words.length)
        throw new FlomotionError("missing_dependency", "The transcript has no words");
      return words;
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }
}

export function writeWords(file: string, words: Word[]): void {
  writeFileSync(file, JSON.stringify(words, null, 2) + "\n");
}
