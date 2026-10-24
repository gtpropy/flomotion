import { FlomotionError } from "../errors.js";

/** Seconds as a number, or a string: "1.5", "1.5s", "1500ms", "36f", "00:00:01:12". */
export type Time = number | string;

const round6 = (n: number) => Math.round(n * 1e6) / 1e6;

/** Snap seconds onto the composition frame grid. */
export const snapToFrame = (seconds: number, fps: number): number =>
  round6(Math.round(seconds * fps) / fps);

export const secondsToFrames = (seconds: number, fps: number): number => Math.round(seconds * fps);
export const framesToSeconds = (frames: number, fps: number): number => round6(frames / fps);

/** Parse a literal time (no references). Frames resolve against `fps`. */
export function parseTimeLiteral(input: Time, fps: number): number {
  if (typeof input === "number") {
    if (!Number.isFinite(input)) throw bad(input);
    return input;
  }
  const s = input.trim();
  let m: RegExpMatchArray | null;
  if ((m = s.match(/^(\d+):(\d{2}):(\d{2}):(\d+)$/))) {
    const [h, mi, se, fr] = m.slice(1).map(Number) as [number, number, number, number];
    return round6(h * 3600 + mi * 60 + se + fr / fps);
  }
  if ((m = s.match(/^(-?\d+(?:\.\d+)?|-?\.\d+)\s*(s|ms|f)?$/))) {
    const v = Number(m[1]);
    switch (m[2]) {
      case "ms":
        return round6(v / 1000);
      case "f":
        return round6(v / fps);
      default:
        return v;
    }
  }
  throw bad(input);
}

function bad(input: unknown) {
  return new FlomotionError("invalid_time", `Invalid time: ${JSON.stringify(input)}`, {
    fix: 'Use seconds (1.5), "1.5s", "36f" or "00:00:01:12".',
  });
}

/**
 * A time that may still need resolution against the project.
 * - literal:  1.5, "2s", "36f"
 * - abs:      "@12s"   (absolute composition time, ignores parent Scene offset)
 * - marker:   "@marker:name+0.2"
 * - ref:      "#id.start" | "#id.end" | "#id.duration" with optional +/- offset
 */
export type TimeSpec =
  | { kind: "literal"; seconds: number }
  | { kind: "abs"; seconds: number }
  | { kind: "marker"; name: string; offset: number }
  | { kind: "ref"; id: string; edge: "start" | "end" | "duration"; offset: number };

export function parseTimeSpec(input: Time, fps: number): TimeSpec {
  if (typeof input === "number") return { kind: "literal", seconds: parseTimeLiteral(input, fps) };
  const s = input.trim();
  if (s.startsWith("@marker:")) {
    const { head, offset } = splitOffset(s.slice("@marker:".length), fps);
    return { kind: "marker", name: head, offset };
  }
  if (s.startsWith("@")) return { kind: "abs", seconds: parseTimeLiteral(s.slice(1), fps) };
  if (s.startsWith("#")) {
    const { head, offset } = splitOffset(s.slice(1), fps);
    const m = head.match(/^([\w-]+)\.(start|end|duration)$/);
    if (!m) throw bad(input);
    return { kind: "ref", id: m[1]!, edge: m[2] as "start" | "end" | "duration", offset };
  }
  return { kind: "literal", seconds: parseTimeLiteral(s, fps) };
}

function splitOffset(s: string, fps: number): { head: string; offset: number } {
  const m = s.match(/^(.*?)([+-]\s*[\d.:]+(?:ms|s|f)?)?$/);
  if (!m) return { head: s, offset: 0 };
  const head = m[1]!.trim();
  if (!m[2]) return { head, offset: 0 };
  const sign = m[2].trim().startsWith("-") ? -1 : 1;
  return { head, offset: sign * parseTimeLiteral(m[2].trim().slice(1).trim(), fps) };
}

export function formatTime(seconds: number): string {
  return `${round6(seconds)}s`;
}

export function toTimecode(seconds: number, fps: number): string {
  const totalFrames = Math.round(seconds * fps);
  const f = totalFrames % Math.round(fps);
  const totalSec = Math.floor(totalFrames / Math.round(fps));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(totalSec / 3600))}:${pad(Math.floor(totalSec / 60) % 60)}:${pad(totalSec % 60)}:${pad(f)}`;
}
