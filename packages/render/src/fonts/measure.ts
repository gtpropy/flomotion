import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  CacheMeasurer,
  CODECUT_DIR,
  CollectingMeasurer,
  type CCNode,
  type CompileOptions,
  type CompileResult,
  type MeasureRequest,
  type ResolveOptions,
  type ResolvedFont,
  type TextMetrics,
  compileProject,
  resolveProject,
} from "@codecut/core";
import { openFontPage } from "./chrome.js";
import { layoutCachePath, readJson, writeJson } from "./lock.js";
import { sha256 } from "./inspect.js";

export const fontSalt = (fonts: ResolvedFont[]) =>
  sha256(
    fonts
      .flatMap((f) => f.files.map((x) => `${f.id}:${x.hash}`))
      .sort()
      .join("|"),
  ).slice(0, 16);

/** Measure text in headless Chrome after fonts load: lines, glyph boxes and word boxes. */
export async function measureInChrome(
  root: string,
  fonts: ResolvedFont[],
  reqs: MeasureRequest[],
): Promise<Record<string, TextMetrics>> {
  if (!reqs.length) return {};
  const session = await openFontPage(root, fonts);
  try {
    const out = await session.page.evaluate(async (requests) => {
      const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
      const results: Record<string, unknown> = {};
      for (const r of requests) {
        const st = r.style as Record<string, any>;
        const loads = [
          `${st.fontStyle ?? "normal"} ${st.fontWeight ?? 400} ${st.fontSize}px ${st.fontFamily}`,
        ];
        await Promise.all(loads.map((l) => document.fonts.load(l, r.text || "x")));
        const div = document.createElement("div");
        const s = div.style;
        s.position = "absolute";
        s.left = "0";
        s.top = "0";
        s.visibility = "hidden";
        s.fontFamily = st.fontFamily;
        s.fontSize = st.fontSize + "px";
        if (st.fontWeight) s.fontWeight = String(st.fontWeight);
        if (st.fontStyle) s.fontStyle = st.fontStyle;
        if (st.letterSpacing) s.letterSpacing = st.letterSpacing + "px";
        if (st.wordSpacing) s.wordSpacing = st.wordSpacing + "px";
        if (st.lineHeight) s.lineHeight = String(st.lineHeight);
        if (st.textTransform) s.textTransform = st.textTransform;
        if (st.fontFeatureSettings) s.fontFeatureSettings = st.fontFeatureSettings;
        if (st.fontVariationSettings) s.fontVariationSettings = st.fontVariationSettings;
        if (st.direction) s.direction = st.direction;
        if (st.textAlign) s.textAlign = st.textAlign;
        if (st.hyphens) (s as any).hyphens = st.hyphens;
        if (st.textWrap) (s as any).textWrap = st.textWrap;
        s.whiteSpace = st.whiteSpace === "nowrap" ? "pre" : "pre-wrap";
        s.width = "max-content";
        if (r.opts.maxWidth) s.maxWidth = r.opts.maxWidth + "px";
        if (st.lang) div.lang = st.lang;
        div.textContent = r.text;
        document.body.appendChild(div);
        const node = div.firstChild as Text | null;
        const box = div.getBoundingClientRect();
        const glyphs: Array<{
          ch: string;
          x: number;
          y: number;
          width: number;
          height: number;
          index: number;
        }> = [];
        if (node) {
          let offset = 0;
          let gi = 0;
          const range = document.createRange();
          for (const { segment } of seg.segment(r.text)) {
            range.setStart(node, offset);
            range.setEnd(node, offset + segment.length);
            const rects = range.getClientRects();
            const rc = rects[0];
            if (rc && !/^\s+$/.test(segment))
              glyphs.push({
                ch: segment,
                x: rc.left - box.left,
                y: rc.top - box.top,
                width: rc.width,
                height: rc.height,
                index: gi,
              });
            else if (rc)
              glyphs.push({
                ch: segment,
                x: rc.left - box.left,
                y: rc.top - box.top,
                width: rc.width,
                height: rc.height,
                index: gi,
              });
            offset += segment.length;
            gi++;
          }
        }
        // group by visual line
        const lines: Array<{
          text: string;
          x: number;
          y: number;
          width: number;
          height: number;
          baseline: number;
          glyphs: typeof glyphs;
          words: Array<{
            text: string;
            x: number;
            y: number;
            width: number;
            height: number;
            index: number;
          }>;
        }> = [];
        for (const g of glyphs) {
          if (g.ch === "\n") continue;
          let line = lines.find((l) => Math.abs(l.y - g.y) < Math.max(2, g.height * 0.3));
          if (!line) {
            line = {
              text: "",
              x: g.x,
              y: g.y,
              width: 0,
              height: g.height,
              baseline: g.y + g.height * 0.8,
              glyphs: [],
              words: [],
            };
            lines.push(line);
          }
          line.glyphs.push(g);
          line.text += g.ch;
        }
        for (const l of lines) {
          const first = l.glyphs[0]!;
          const last = l.glyphs[l.glyphs.length - 1]!;
          l.x = first.x;
          l.width = last.x + last.width - first.x;
          // words
          let cur: typeof glyphs = [];
          const flush = () => {
            if (!cur.length) return;
            const a = cur[0]!;
            const z = cur[cur.length - 1]!;
            l.words.push({
              text: cur.map((c) => c.ch).join(""),
              x: a.x,
              y: a.y,
              width: z.x + z.width - a.x,
              height: a.height,
              index: a.index,
            });
            cur = [];
          };
          for (const g of l.glyphs) {
            if (/^\s+$/.test(g.ch)) flush();
            else cur.push(g);
          }
          flush();
          l.text = l.text.replace(/\s+$/, "");
        }
        results[r.key] = {
          lines,
          width: Math.max(0, ...lines.map((l) => l.width)),
          height: box.height,
          key: r.key,
        };
        div.remove();
      }
      return results;
    }, reqs as any);
    return out as Record<string, TextMetrics>;
  } finally {
    await session.close();
  }
}

export interface LayoutCompileOptions {
  projectRoot: string;
  fonts: ResolvedFont[];
  resolve?: ResolveOptions;
  compile?: CompileOptions;
  maxPasses?: number;
}

/**
 * Compile with real text layout: pass 1 records which measurements are needed, Chrome measures the
 * misses (cached in .codecut/layout-cache.json by a hash of text, style, font hashes and width), and
 * we recompile until nothing is missing.
 */
export async function compileWithLayout(
  root: CCNode,
  o: LayoutCompileOptions,
): Promise<CompileResult & { measured: number; cacheHits: number }> {
  const salt = fontSalt(o.fonts);
  const cachePath = layoutCachePath(o.projectRoot);
  const cache = readJson<Record<string, TextMetrics>>(cachePath, {});
  let measured = 0;
  const run = (measurer: CacheMeasurer | CollectingMeasurer) => {
    const proj = resolveProject(structuredCloneNode(root), { ...o.resolve, assignIds: true });
    return compileProject(proj, { ...o.compile, measure: measurer });
  };
  // seed with a collecting pass
  const collecting = new CollectingMeasurer(salt);
  run(collecting);
  let need = [...collecting.requests.values()].filter((r) => !cache[r.key]);
  const hits = collecting.requests.size - need.length;
  for (let pass = 0; pass < (o.maxPasses ?? 6); pass++) {
    if (need.length) {
      const got = await measureInChrome(o.projectRoot, o.fonts, need);
      Object.assign(cache, got);
      measured += need.length;
      writeJson(cachePath, cache);
    }
    const cm = new CacheMeasurer(cache, salt);
    const out = run(cm);
    if (cm.misses.size === 0) return Object.assign(out, { measured, cacheHits: hits });
    need = [...cm.misses.values()];
  }
  throw new Error("text layout did not converge");
}

function structuredCloneNode(n: CCNode): CCNode {
  // expression props are functions: clone structurally, keep functions by reference
  const c = (v: unknown): unknown =>
    Array.isArray(v)
      ? v.map(c)
      : v && typeof v === "object"
        ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, c(x)]))
        : v;
  return {
    $cc: 1,
    name: n.name,
    props: c(n.props) as Record<string, unknown>,
    children: n.children.map((ch) => (typeof ch === "object" ? structuredCloneNode(ch) : ch)),
  };
}

export const layoutCacheExists = (root: string) =>
  existsSync(join(root, CODECUT_DIR, "layout-cache.json"));
