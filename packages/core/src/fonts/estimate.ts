import { hashSeed } from "../values/noise.js";
import type { GlyphBox, LineBox, MeasureOptions, TextMeasurer, TextMetrics, TextStyle } from "./measure.js";

/** Stable cache key for a measurement request (text + style + width). Font file hashes are mixed in by callers. */
export function measureKey(text: string, style: TextStyle, opts: MeasureOptions = {}, salt = ""): string {
  const s = JSON.stringify([text, style, opts.maxWidth ?? null, salt]);
  return hashSeed(s).toString(36) + hashSeed(s.split("").reverse().join("")).toString(36);
}

const segmenter = typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter(undefined, { granularity: "grapheme" }) : null;

/** Split into grapheme clusters (so emoji and combining marks stay whole). */
export function graphemes(s: string): string[] {
  if (segmenter) return [...segmenter.segment(s)].map((g) => g.segment);
  return [...s];
}

/**
 * A deterministic layout estimate used when no Chrome measurement exists yet: average glyph width
 * 0.55 em, greedy word wrap. Good enough to plan; the real render uses the measured layout.
 */
export function estimateText(text: string, style: TextStyle, opts: MeasureOptions = {}): TextMetrics {
  const size = style.fontSize;
  const track = style.letterSpacing ?? 0;
  const avg = size * 0.55 + track;
  const lh = (style.lineHeight ?? 1.2) * size;
  const maxW = opts.maxWidth ?? Infinity;
  const paragraphs = text.split("\n");
  const lines: LineBox[] = [];
  let y = 0;
  let index = 0;
  for (const para of paragraphs) {
    const words = para.split(/(\s+)/).filter((w) => w.length > 0);
    let cur = "";
    let curStart = index;
    const flush = (endIndex: number) => {
      const t = cur.replace(/\s+$/, "");
      const gl = graphemes(t);
      const glyphs: GlyphBox[] = [];
      let x = 0;
      gl.forEach((g, i) => {
        glyphs.push({ ch: g, x, y, width: avg, height: lh, index: curStart + i });
        x += avg;
      });
      const wordsOut: LineBox["words"] = [];
      let wx = 0;
      let wi = curStart;
      for (const part of t.split(/(\s+)/)) {
        const w = graphemes(part).length * avg;
        if (part.trim()) wordsOut.push({ text: part, x: wx, y, width: w, height: lh, index: wi });
        wx += w;
        wi += graphemes(part).length;
      }
      lines.push({ text: t, x: 0, y, width: gl.length * avg, height: lh, baseline: y + lh * 0.8, glyphs, words: wordsOut });
      y += lh;
      void endIndex;
    };
    for (const w of words) {
      const wl = graphemes(w).length * avg;
      if (cur && !/^\s+$/.test(w) && (graphemes(cur).length * avg + wl > maxW)) {
        flush(index);
        curStart = index;
        cur = "";
      }
      cur += w;
      index += graphemes(w).length;
    }
    flush(index);
    index += 1; // newline
    curStart = index;
  }
  const width = Math.max(0, ...lines.map((l) => l.width));
  return { lines, width, height: y, key: measureKey(text, style, opts, "estimate") };
}

export interface MeasureRequest {
  text: string;
  style: TextStyle;
  opts: MeasureOptions;
  key: string;
}

/** Records every measurement a compile asks for and answers with estimates (compile pass 1). */
export class CollectingMeasurer implements TextMeasurer {
  readonly requests = new Map<string, MeasureRequest>();
  constructor(private salt = "") {}
  measureText(text: string, style: TextStyle, opts: MeasureOptions = {}): TextMetrics {
    const key = measureKey(text, style, opts, this.salt);
    this.requests.set(key, { text, style, opts, key });
    return { ...estimateText(text, style, opts), key };
  }
}

/** Answers from a finished cache; falls back to the estimate and records a miss. */
export class CacheMeasurer implements TextMeasurer {
  readonly misses = new Map<string, MeasureRequest>();
  constructor(
    private cache: Record<string, TextMetrics>,
    private salt = "",
  ) {}
  measureText(text: string, style: TextStyle, opts: MeasureOptions = {}): TextMetrics {
    const key = measureKey(text, style, opts, this.salt);
    const hit = this.cache[key];
    if (hit) return hit;
    this.misses.set(key, { text, style, opts, key });
    return { ...estimateText(text, style, opts), key };
  }
}
