import { CodeCutError } from "@codecut/core";
import { normalizeWords } from "./transcribe.js";
import { wordsFromCharacters, type Word } from "./voice.js";

/** How exactly each word's time is known. Captions and "on the word" timing are only as good as this. */
export type Precision =
  | "word" // a word-level transcript (Whisper, ElevenLabs, a caption tool): good for captions and word-tied motion
  | "cue" // captions with a time per line: words inside a line are spread by length, so a word can be off by up to a line
  | "estimated"; // plain text only: spread over the audio length, a rough guide

export interface ParsedTranscript {
  words: Word[];
  precision: Precision;
  format:
    "json-words" | "json-segments" | "elevenlabs" | "srt" | "vtt" | "timestamped-text" | "text";
  warnings: string[];
}

const round = (n: number) => Math.round(n * 1000) / 1000;

/** `00:01:02,500`, `01:02.500`, `1:02`, `62.5`, `62.5s` → seconds. */
export function parseClock(t: string): number | undefined {
  const s = t.trim().replace(",", ".").replace(/s$/, "");
  const m = /^(?:(\d+):)?(\d+):(\d+(?:\.\d+)?)$/.exec(s);
  if (m) return Number(m[1] ?? 0) * 3600 + Number(m[2]) * 60 + Number(m[3]);
  const n = Number(s);
  return Number.isFinite(n) && s !== "" ? n : undefined;
}

/** Spread the words of a line over [start, end] in proportion to their length. */
export function spreadWords(text: string, start: number, end: number): Word[] {
  const ws = text.split(/\s+/).filter(Boolean);
  if (!ws.length) return [];
  const total = ws.reduce((n, w) => n + w.length + 1, 0);
  const span = Math.max(0.05, end - start);
  let t = start;
  return ws.map((w) => {
    const d = ((w.length + 1) / total) * span;
    const out = { w, start: round(t), end: round(t + d * 0.92) };
    t += d;
    return out;
  });
}

const stripTags = (s: string) =>
  s
    .replace(/<[^>]+>/g, "")
    .replace(/\{[^}]*\}/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .trim();

function parseCues(text: string): Array<{ start: number; end: number; text: string }> {
  const cues: Array<{ start: number; end: number; text: string }> = [];
  const blocks = text
    .replace(/\r/g, "")
    .replace(/^WEBVTT.*\n/, "")
    .split(/\n{2,}/);
  for (const b of blocks) {
    const lines = b.split("\n").filter((l) => l.trim() !== "");
    const i = lines.findIndex((l) => l.includes("-->"));
    if (i < 0) continue;
    const [a, rest] = lines[i]!.split("-->");
    const start = parseClock(a!.trim());
    const end = parseClock(rest!.trim().split(/\s+/)[0]!);
    const body = stripTags(lines.slice(i + 1).join(" "));
    if (start !== undefined && end !== undefined && body) cues.push({ start, end, text: body });
  }
  return cues;
}

/**
 * Turn whatever transcript the person has into `[{ w, start, end }]`: word-level JSON (Whisper, ElevenLabs,
 * hyperframes), segment JSON, SRT, VTT, text with a time at the start of each line, or plain text.
 * Plain text needs `duration`, and is only an estimate.
 */
export function parseTranscript(
  input: string,
  opts: { format?: string; duration?: number } = {},
): ParsedTranscript {
  const text = input.replace(/^ /, "");
  const trimmed = text.trim();
  const warnings: string[] = [];
  const fmt = opts.format?.toLowerCase();

  if (fmt === "json" || (!fmt && /^(\{|\[\s*[{["\]])/.test(trimmed))) {
    let j: unknown;
    try {
      j = JSON.parse(trimmed);
    } catch {
      throw new CodeCutError("invalid_value", "The transcript looks like JSON but does not parse", {
        fix: "Check the file, or pass it as text.",
      });
    }
    // ElevenLabs alignment: { characters, character_start_times_seconds, character_end_times_seconds }
    const al = (j as { alignment?: unknown }).alignment ?? j;
    if (
      al &&
      typeof al === "object" &&
      Array.isArray((al as { characters?: unknown }).characters)
    ) {
      const words = wordsFromCharacters(al as Parameters<typeof wordsFromCharacters>[0]);
      if (words.length) return { words, precision: "word", format: "elevenlabs", warnings };
    }
    const words = normalizeWords(j);
    if (words.length) {
      // segments (a sentence per entry) rather than words: spread them
      const avg = words.reduce((n, w) => n + w.w.split(/\s+/).length, 0) / words.length;
      if (avg > 1.6) {
        const spread = words.flatMap((w) => spreadWords(w.w, w.start, w.end));
        warnings.push(
          "The JSON has a time per line, not per word: words are spread inside each line.",
        );
        return { words: spread, precision: "cue", format: "json-segments", warnings };
      }
      return { words, precision: "word", format: "json-words", warnings };
    }
    const segs = (j as { segments?: Array<{ text?: string; start?: number; end?: number }> })
      .segments;
    if (Array.isArray(segs)) {
      const spread = segs.flatMap((s) =>
        typeof s.start === "number" && typeof s.end === "number" && s.text
          ? spreadWords(s.text, s.start, s.end)
          : [],
      );
      if (spread.length) {
        warnings.push(
          "The JSON has a time per segment, not per word: words are spread inside each segment.",
        );
        return { words: spread, precision: "cue", format: "json-segments", warnings };
      }
    }
    throw new CodeCutError("invalid_value", "No words with times found in that JSON", {
      fix: "Expected [{ w|text|word, start, end }], { words: [...] }, { segments: [...] } or an ElevenLabs alignment.",
    });
  }

  if (
    fmt === "srt" ||
    fmt === "vtt" ||
    (!fmt && (text.includes("-->") || /^WEBVTT/.test(trimmed)))
  ) {
    const cues = parseCues(text);
    if (!cues.length)
      throw new CodeCutError("invalid_value", "No cues found in the captions file", {
        fix: "Check it is SRT or VTT.",
      });
    const words = cues.flatMap((c) => spreadWords(c.text, c.start, c.end));
    warnings.push(
      "Captions give a time per line, not per word: words are spread inside each line, so a word can be off by up to a line.",
    );
    return { words, precision: "cue", format: text.includes("WEBVTT") ? "vtt" : "srt", warnings };
  }

  // text with a time at the start of each line: "[00:03.2] Meet Pulse." or "0:03 Meet Pulse."
  const lines = trimmed
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const stamped = lines.map((l) =>
    /^[[(]?(\d+:\d+(?::\d+)?(?:[.,]\d+)?|\d+(?:\.\d+)?s)[\])]?\s*[-–:]?\s*(.+)$/.exec(l),
  );
  if (lines.length >= 2 && stamped.every(Boolean)) {
    const rows = stamped.map((m) => ({ start: parseClock(m![1]!)!, text: m![2]! }));
    const words = rows.flatMap((r, i) => {
      const end =
        rows[i + 1]?.start ??
        opts.duration ??
        r.start + Math.max(1.5, r.text.split(/\s+/).length * 0.4);
      return spreadWords(r.text, r.start, Math.min(end, r.start + 12));
    });
    warnings.push("A time per line: words are spread inside each line.");
    return { words, precision: "cue", format: "timestamped-text", warnings };
  }

  // plain text: spread over the audio
  const plain = trimmed.replace(/\s+/g, " ");
  if (!plain) throw new CodeCutError("invalid_value", "The transcript is empty");
  if (!opts.duration || opts.duration <= 0)
    throw new CodeCutError(
      "invalid_time",
      "Plain text has no times, so the audio length is needed to spread it",
      {
        fix: "Pass the audio file (its length is measured) or `duration`. Better: give captions (SRT/VTT) or a word-level transcript.",
      },
    );
  const ws = plain.split(" ");
  const weight = (w: string) => w.length + (/[.!?]$/.test(w) ? 6 : /[,;:]$/.test(w) ? 3 : 1);
  const total = ws.reduce((n, w) => n + weight(w), 0);
  let t = 0.15;
  const usable = Math.max(0.5, opts.duration - 0.3);
  const words = ws.map((w) => {
    const d = (weight(w) / total) * usable;
    const out = { w, start: round(t), end: round(t + Math.min(d * 0.9, d)) };
    t += d;
    return out;
  });
  warnings.push(
    "Plain text only: words are spread over the audio by length. Treat sync as approximate and check the captions by eye.",
  );
  return { words, precision: "estimated", format: "text", warnings };
}

/** Problems worth telling the person about: a word list that does not fit the audio. */
export function checkWords(words: Word[], audioDuration?: number): string[] {
  const w: string[] = [];
  if (!words.length) return ["No words"];
  for (let i = 1; i < words.length; i++)
    if (words[i]!.start < words[i - 1]!.start - 0.001)
      w.push(`word ${i} starts before word ${i - 1}: the times are not in order`);
  const last = words[words.length - 1]!.end;
  if (audioDuration && last > audioDuration + 1)
    w.push(
      `the last word ends at ${last}s but the audio is ${Math.round(audioDuration * 10) / 10}s: wrong file, or the times are for a different recording`,
    );
  if (audioDuration && last < audioDuration * 0.6)
    w.push(
      `the words end at ${last}s but the audio runs to ${Math.round(audioDuration * 10) / 10}s: part of the audio has no words`,
    );
  return w.slice(0, 5);
}
