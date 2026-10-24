import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The storyboard board: the person and Claude brainstorm on `ideas.md` and plan the video in `storyboard.md`.
 * Both are plain Markdown, read and written with ordinary file tools (no MCP tool), and the live view's
 * Storyboard tab shows them next to what Claude has actually built.
 *
 * storyboard.md: one `## N. Title · 0–3.3 s` heading per beat, then `- Key: value` lines.
 * ideas.md: one `- [ ] idea text (you)` or `- [x] idea text (claude)` line per idea.
 */
export interface Beat {
  n: number;
  title: string;
  start?: number;
  end?: number;
  /** Lower-cased keys: block, scene (ids), voice, on screen, motion, sound, why. */
  fields: Record<string, string>;
  /** Scene ids this beat is built from (from the `Scene:` line). */
  scenes: string[];
}

export interface Idea {
  index: number;
  text: string;
  from: "you" | "claude";
  done: boolean;
}

export interface Board {
  title?: string;
  /** Lines before the first beat heading (hero, tempo, notes). */
  intro: string;
  beats: Beat[];
  ideas: Idea[];
  storyboardFile?: string;
  ideasFile: string;
}

const TIME = /(\d+(?:\.\d+)?)\s*[-–—]\s*(\d+(?:\.\d+)?)\s*s?\b/;

export function parseStoryboard(text: string): Pick<Board, "title" | "intro" | "beats"> {
  const lines = text.replace(/\r/g, "").split("\n");
  let title: string | undefined;
  const intro: string[] = [];
  const beats: Beat[] = [];
  let cur: Beat | undefined;
  for (const line of lines) {
    const h1 = /^#\s+(.+)$/.exec(line);
    if (h1 && !cur && !title) {
      title = h1[1]!.trim();
      continue;
    }
    const h2 = /^##\s+(?:(\d+)[.)]\s*)?(.+)$/.exec(line);
    if (h2) {
      const heading = h2[2]!.trim();
      const t = TIME.exec(heading);
      const label = heading
        .replace(TIME, "")
        .replace(/[·|,;:()\s]+$/g, "")
        .replace(/^[·|,;:\s]+/, "")
        .trim();
      cur = {
        n: h2[1] ? Number(h2[1]) : beats.length + 1,
        title: label || heading,
        start: t ? Number(t[1]) : undefined,
        end: t ? Number(t[2]) : undefined,
        fields: {},
        scenes: [],
      };
      beats.push(cur);
      continue;
    }
    if (!cur) {
      if (line.trim()) intro.push(line);
      continue;
    }
    const kv = /^\s*[-*]\s+\**([A-Za-z][A-Za-z ]*?)\**\s*:\s*(.*)$/.exec(line);
    if (kv) {
      const key = kv[1]!.trim().toLowerCase();
      const val = kv[2]!.trim();
      cur.fields[key] = val;
      if (key === "scene" || key === "scenes")
        cur.scenes = val
          .split(/[,\s]+/)
          .map((s) => s.replace(/[`"']/g, "").trim())
          .filter(Boolean);
    }
  }
  return { title, intro: intro.join("\n").trim(), beats };
}

export function parseIdeas(text: string): Idea[] {
  const out: Idea[] = [];
  text
    .replace(/\r/g, "")
    .split("\n")
    .forEach((line) => {
      const m = /^\s*[-*]\s+\[( |x|X)\]\s+(.*?)(?:\s+\((you|claude)\))?\s*$/.exec(line);
      if (!m) return;
      out.push({
        index: out.length,
        text: m[2]!.trim(),
        from: m[3] === "claude" ? "claude" : "you",
        done: m[1] !== " ",
      });
    });
  return out;
}

/** Older projects wrote storyboard.json: show its scenes as beats rather than nothing. */
function legacyBeats(file: string): Beat[] {
  try {
    const j = JSON.parse(readFileSync(file, "utf8")) as { scenes?: Array<Record<string, unknown>> };
    return (j.scenes ?? []).map((s, i) => {
      const start = typeof s.start === "number" ? s.start : undefined;
      const dur = typeof s.duration === "number" ? s.duration : undefined;
      return {
        n: i + 1,
        title: String(s.id ?? `Beat ${i + 1}`),
        start,
        end: start !== undefined && dur !== undefined ? start + dur : undefined,
        fields: {
          block: String(s.block ?? ""),
          motion: String(s.motion ?? ""),
          sound: Array.isArray(s.sound) ? s.sound.join(", ") : String(s.sound ?? ""),
        },
        scenes: [String(s.id ?? "")].filter(Boolean),
      };
    });
  } catch {
    return [];
  }
}

export function readBoard(root: string): Board {
  const sb = join(root, "storyboard.md");
  const legacy = join(root, "storyboard.json");
  const ideasFile = join(root, "ideas.md");
  let parsed: Pick<Board, "title" | "intro" | "beats"> = { intro: "", beats: [] };
  let storyboardFile: string | undefined;
  if (existsSync(sb)) {
    parsed = parseStoryboard(readFileSync(sb, "utf8"));
    storyboardFile = "storyboard.md";
  } else if (existsSync(legacy)) {
    parsed = { intro: "", beats: legacyBeats(legacy) };
    storyboardFile = "storyboard.json";
  }
  return {
    ...parsed,
    ideas: existsSync(ideasFile) ? parseIdeas(readFileSync(ideasFile, "utf8")) : [],
    storyboardFile,
    ideasFile: "ideas.md",
  };
}

const HEADER =
  "# Ideas\n\nOne line per idea: `- [ ] text (you)` or `- [x] text (claude)`. Tick it when it is used or dropped.\n\n";

/** Append an idea; the person adds from the live view, Claude can edit the file directly. */
export function addIdea(root: string, text: string, from: "you" | "claude" = "you"): Idea[] {
  const clean = text.replace(/\s+/g, " ").trim().slice(0, 400);
  if (!clean)
    return parseIdeas(
      existsSync(join(root, "ideas.md")) ? readFileSync(join(root, "ideas.md"), "utf8") : "",
    );
  const file = join(root, "ideas.md");
  if (!existsSync(file)) writeFileSync(file, HEADER);
  const cur = readFileSync(file, "utf8");
  appendFileSync(file, `${cur.endsWith("\n") ? "" : "\n"}- [ ] ${clean} (${from})\n`);
  return parseIdeas(readFileSync(file, "utf8"));
}

/** Tick or untick the idea at `index` (its position among the idea lines). */
export function toggleIdea(root: string, index: number): Idea[] {
  const file = join(root, "ideas.md");
  if (!existsSync(file)) return [];
  let seen = -1;
  const lines = readFileSync(file, "utf8")
    .split("\n")
    .map((line) => {
      const m = /^(\s*[-*]\s+)\[( |x|X)\](\s+.*)$/.exec(line);
      if (!m) return line;
      seen++;
      return seen === index ? `${m[1]}[${m[2] === " " ? "x" : " "}]${m[3]}` : line;
    });
  writeFileSync(file, lines.join("\n"));
  return parseIdeas(lines.join("\n"));
}
