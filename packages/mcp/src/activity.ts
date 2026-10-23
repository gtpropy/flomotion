import { appendFileSync, existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { CODECUT_DIR } from "@codecut/core";

/** One tool call, as the live view shows it. */
export interface ActivityEntry {
  /** Milliseconds since epoch (informational only; never read by the compiler). */
  t: number;
  tool: string;
  /** Arguments, shortened. */
  args: string;
  ok: boolean;
  ms: number;
  /** One line: the edit's description, or the error code and message. */
  summary: string;
  /** Undo token of a write, when there was one. */
  undo?: string;
}

/** One line for the live view when a tool has no edit description of its own. */
export function summarizeResult(tool: string, data: unknown): string {
  const d = (data ?? {}) as Record<string, any>;
  if (typeof d.description === "string") return d.description;
  const n = (a: unknown) => (Array.isArray(a) ? a.length : 0);
  switch (tool) {
    case "lint":
      return `${d.errors} error(s), ${d.warnings} warning(s)${d.errors ? `: ${d.issues?.find((i: any) => i.severity === "error")?.message ?? ""}` : ""}`;
    case "frame_render":
      return `frame at ${d.time}s`;
    case "contact_sheet":
      return `contact sheet of ${n(d.times)} frames`;
    case "review":
      return `${d.pass ? "no failing checks" : `failing: ${(d.failing ?? []).join(", ")}`}; needs eyes: ${(d.needsEyes ?? []).join(", ") || "none"}`;
    case "render":
      return `${d.file} (${d.duration ? `${Math.round(d.duration * 10) / 10}s` : "?"}, ${d.size ?? ""})`;
    case "mix_preview":
      return `mix ${d.lufs ?? "?"} LUFS, peak ${d.truePeak ?? "?"} dBTP, ${n(d.events)} events`;
    case "sound_search":
      return `${n(d.results)} sounds found`;
    case "sound_get":
      return `got ${d.ref} (${d.entry?.license ?? "?"}), peak ${d.entry?.peak?.main ?? "?"}s`;
    case "sound_auto":
      return d.dryRun
        ? `plan: ${n(d.plan)} impact(s) without a sound`
        : (d.note ?? "placed sounds");
    case "font_get":
      return `${d.family} (${d.route ?? "cached"}), ${n(d.files)} file(s)`;
    case "font_list":
      return `${n(d.fonts)} font(s)`;
    case "font_check":
      return d.ok ? "all glyphs present" : `missing: ${(d.missing ?? []).join(" ")}`;
    case "font_preview":
      return `preview of ${d.font}`;
    case "font_search":
      return `${n(d.results)} families`;
    case "voice_quote":
      return `quote ${d.quoteId}: ${d.characters} characters, ${d.credits} credits${d.spends ? " (needs the person's yes)" : " (free)"}`;
    case "voice_generate":
      return `voice saved to ${d.file}${d.spent ? `, spent ${d.spent.credits} credits` : ""}`;
    case "transcribe":
      return `${d.words} words transcribed (${d.engine})`;
    case "project_read":
      return "read the outline";
    case "history_list":
      return "listed snapshots";
    default:
      return `${tool} done`;
  }
}

export const activityFile = (root: string) => join(root, CODECUT_DIR, "activity.jsonl");

const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

/** Shorten arguments for the log: long TSX or text is cut, nothing secret is ever an argument. */
export function summarizeArgs(args: unknown): string {
  try {
    return clip(
      JSON.stringify(args, (_k, v) => (typeof v === "string" && v.length > 160 ? clip(v, 160) : v)),
      400,
    );
  } catch {
    return "";
  }
}

/** Append one entry. Logging must never break a tool call. */
export function logActivity(root: string, e: ActivityEntry): void {
  try {
    mkdirSync(join(root, CODECUT_DIR), { recursive: true });
    appendFileSync(activityFile(root), JSON.stringify(e) + "\n");
  } catch {
    /* read-only folder or similar: the tool call still succeeds */
  }
}

/** The last `n` entries, oldest first. */
export function readActivity(root: string, n = 80): ActivityEntry[] {
  const f = activityFile(root);
  if (!existsSync(f)) return [];
  const lines = readFileSync(f, "utf8").split("\n").filter(Boolean);
  const out: ActivityEntry[] = [];
  for (const l of lines.slice(-n)) {
    try {
      out.push(JSON.parse(l) as ActivityEntry);
    } catch {
      /* a half-written line */
    }
  }
  return out;
}

export const activitySize = (root: string): number => {
  const f = activityFile(root);
  return existsSync(f) ? statSync(f).size : 0;
};
