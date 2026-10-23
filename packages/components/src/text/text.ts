import {
  bool,
  color,
  defineComponent,
  enumOf,
  evalProp,
  exprSignal,
  graphemes,
  int,
  noise1D,
  num,
  parseColor,
  richText,
  text,
  time,
  toCss,
  lerpColor,
  type Channel,
  type RNode,
  type RenderCtx,
  type RenderOutput,
  type Signal,
  type TextStyle,
} from "@codecut/core";
import { atControl, css, esc, fillCss, placement, round } from "../util.js";
import { animatorChannels, PRESETS, type AnimProps, type Order } from "./animator.js";
import { textStyleControls, typographyControls } from "./controls.js";
import { isSpace, setUnitTable, type By, type StyledChar, type UnitTable } from "./units.js";

type Item = string | number | RNode | VNode;
interface VNode {
  v: 1;
  open: string;
  close: string;
  children: Item[];
}

// ---------- rich text content ----------

/** Parse `**bold** _italic_ ==highlight== ~~strike~~` into virtual nodes. */
export function parseMarkup(src: string): Item[] {
  const rules: Array<[RegExp, string, string]> = [
    [/\*\*([^*]+)\*\*/, '<b style="font-weight:700">', "</b>"],
    [/(?<![\w])_([^_]+)_(?![\w])/, "<i>", "</i>"],
    [
      /==([^=]+)==/,
      '<span class="cc-mark" style="background:linear-gradient(#ffe14d,#ffe14d) no-repeat 0 85%/100% 45%">',
      "</span>",
    ],
    [/~~([^~]+)~~/, "<s>", "</s>"],
  ];
  const parse = (s: string): Item[] => {
    let best: { idx: number; len: number; inner: string; open: string; close: string } | undefined;
    for (const [re, open, close] of rules) {
      const m = re.exec(s);
      if (m && (best === undefined || m.index < best.idx))
        best = { idx: m.index, len: m[0].length, inner: m[1]!, open, close };
    }
    if (!best) return s ? [s] : [];
    return [
      ...(best.idx > 0 ? [s.slice(0, best.idx)] : []),
      { v: 1, open: best.open, close: best.close, children: parse(best.inner) } as VNode,
      ...parse(s.slice(best.idx + best.len)),
    ];
  };
  return parse(src);
}

const isV = (x: Item): x is VNode => typeof x === "object" && (x as VNode).v === 1;

interface RichOut {
  html: string;
  channels: Channel[];
  chars: StyledChar[];
  issues: string[];
}

/** Render rich content as nested HTML and, in parallel, as a flat list of styled characters. */
function rich(items: Item[], rc: RenderCtx): RichOut {
  const out: RichOut = { html: "", channels: [], chars: [], issues: [] };
  const walk = (list: Item[], open: string, close: string): string => {
    let html = "";
    for (const it of list) {
      if (typeof it === "string" || typeof it === "number") {
        const s = String(it);
        html += esc(s).replace(/\n/g, "<br>");
        for (const g of graphemes(s)) out.chars.push({ g, open, close });
      } else if (isV(it)) {
        html += it.open + walk(it.children, open + it.open, it.close + close) + it.close;
      } else {
        const node = it as RNode;
        const crc = rc.ctxFor(node);
        const r = node.def.render?.(node.props, crc) as RenderOutput | undefined;
        if (!r) continue;
        out.channels.push(...(r.channels ?? []));
        const [o, c] = r.html.split("{{children}}");
        html +=
          (o ?? "") + walk(node.content as Item[], open + (o ?? ""), (c ?? "") + close) + (c ?? "");
      }
    }
    return html;
  };
  out.html = walk(items, "", "");
  return out;
}

// ---------- state ----------

interface State {
  font: string;
  weight: number;
  width: number;
  style: string;
  size: number;
  leading: number;
  tracking: number;
  wordSpacing: number;
  indent: number;
  paragraphSpacing: number;
  baselineShift: number;
  axes: {
    wght?: number;
    wdth?: number;
    slnt?: number;
    ital?: number;
    opsz?: number;
    custom?: Record<string, number>;
  };
  [k: string]: any;
}

const readState = (rc: RenderCtx, t: number): State => {
  const s: Record<string, unknown> = {};
  for (const k of Object.keys(rc.node.props)) s[k] = evalProp(rc.node.props[k], t);
  return s as State;
};

function axesString(a: State["axes"] | undefined): string | undefined {
  if (!a) return undefined;
  const parts: string[] = [];
  for (const k of ["wght", "wdth", "slnt", "ital", "opsz"] as const)
    if (typeof a[k] === "number") parts.push(`'${k}' ${round(a[k]!, 2)}`);
  for (const [k, v] of Object.entries(a.custom ?? {})) parts.push(`'${k}' ${round(v, 3)}`);
  return parts.length ? parts.join(", ") : undefined;
}

const FEATURE_NUMERIC: Record<string, string[]> = {
  tabular: ["tnum"],
  proportional: ["pnum"],
  lining: ["lnum"],
  oldstyle: ["onum"],
};

function featureString(
  features: string[] | undefined,
  numeric: string | undefined,
): string | undefined {
  const all = [...(features ?? []), ...(FEATURE_NUMERIC[numeric ?? ""] ?? [])];
  return all.length ? all.map((f) => `'${f}' 1`).join(", ") : undefined;
}

const CASE: Record<string, Record<string, string>> = {
  upper: { "text-transform": "uppercase" },
  lower: { "text-transform": "lowercase" },
  title: { "text-transform": "capitalize" },
  "small-caps": { "font-variant-caps": "small-caps" },
};

export function toTextStyle(s: State, rc: RenderCtx, size = s.size): TextStyle {
  return {
    fontFamily: rc.fontFamily(s.font),
    fontSize: size,
    fontWeight: s.weight,
    fontStyle: s.style,
    letterSpacing: (s.tracking / 1000) * size,
    wordSpacing: (s.wordSpacing / 1000) * size,
    lineHeight: s.leading,
    textTransform:
      s.case === "upper"
        ? "uppercase"
        : s.case === "lower"
          ? "lowercase"
          : s.case === "title"
            ? "capitalize"
            : undefined,
    fontFeatureSettings: featureString(s.features, s.numeric),
    fontVariationSettings: axesString(s.axes),
    direction: s.direction,
    lang: s.lang,
    textAlign: s.align,
    hyphens: s.hyphenate ? "auto" : undefined,
    textWrap: s.balance ? "balance" : undefined,
    whiteSpace: s.wrap === false ? "nowrap" : "normal",
  };
}

const strokeCss = (st: any): Record<string, string> => {
  if (!st || !(st.width > 0)) return {};
  const outside = st.align === "outside";
  return {
    "-webkit-text-stroke": `${round(outside ? st.width * 2 : st.width)}px ${st.color ?? "#000"}`,
    "paint-order": outside ? "stroke fill" : "normal",
    "stroke-linejoin": st.join ?? "round",
  };
};

const shadowList = (s: State): string[] => {
  const out: string[] = [];
  for (const sh of (s.shadow as any[]) ?? []) {
    const c = withAlphaColor(sh.color ?? "#000", sh.opacity ?? 0.4);
    out.push(`${round(sh.x ?? 0)}px ${round(sh.y ?? 8)}px ${round(sh.blur ?? 16)}px ${c}`);
  }
  const g = s.glow as any;
  if (g && g.radius > 0) {
    const reps = Math.max(1, Math.round(g.intensity ?? 1));
    for (let i = 0; i < reps; i++) out.push(`0 0 ${round(g.radius)}px ${g.color ?? "#fff"}`);
  }
  return out;
};

function withAlphaColor(c: string, a: number): string {
  try {
    const p = parseColor(c);
    return toCss({ ...p, a: p.a * a });
  } catch {
    return c;
  }
}

/** Colour of a linear gradient at fractional position t along its axis. */
function gradientAt(stops: Array<[number, string]>, t: number): string {
  const k = Math.min(1, Math.max(0, t));
  let i = 0;
  while (i < stops.length - 2 && k > stops[i + 1]![0]) i++;
  const [p0, c0] = stops[i]!;
  const [p1, c1] = stops[Math.min(stops.length - 1, i + 1)]!;
  const f = p1 === p0 ? 0 : Math.min(1, Math.max(0, (k - p0) / (p1 - p0)));
  try {
    return toCss(lerpColor(parseColor(c0), parseColor(c1), f));
  } catch {
    return c0;
  }
}

const isGradient = (f: unknown) =>
  typeof f === "object" &&
  f !== null &&
  ["linear", "radial", "image"].includes((f as { type?: string }).type ?? "");

// ---------- the renderer ----------

export interface SplitSpec {
  by?: By;
  preset: string;
  stagger?: number;
  unitDuration?: number;
  ease?: string;
  order: Order;
  seed: number;
  props: AnimProps;
}

export function renderText(p: any, rc: RenderCtx, split?: SplitSpec): RenderOutput {
  const t0 = rc.node.start;
  const s = readState(rc, t0);
  const issues: string[] = [];
  const id = rc.id;
  const tid = `${id}-text`;

  // content: markup string > text prop > children
  let items: Item[];
  if (typeof p.markup === "string" && p.markup) items = parseMarkup(p.markup);
  else if (typeof p.text === "string") items = [p.text];
  else items = rc.node.content as Item[];
  const r = rich(items, rc);
  const plain = r.chars.map((c) => c.g).join("");

  // which unit kinds are needed
  const needed = new Set<By>();
  if (split) needed.add(split.by ?? PRESETS[split.preset]?.by ?? "char");
  let mask = split ? !!PRESETS[split.preset]?.mask : false;
  for (const e of rc.node.effects) {
    if (e.name !== "TextAnimator") continue;
    const pr = PRESETS[String(e.raw.preset ?? "none")];
    needed.add(((e.raw.by as By | undefined) ?? pr?.by ?? "char") as By);
    if (pr?.mask) mask = true;
  }

  // layout width and fit
  const maxW =
    s.box?.width !== undefined ? rc.px(s.box.width, "x") : rc.px(s.maxWidth ?? "90%", "x");
  let size = s.size;
  if (s.fit && (s.fit.maxSize || s.fit.minSize || s.fit.maxLines)) {
    const hi = s.fit.maxSize ?? s.size;
    const lo = Math.min(hi, s.fit.minSize ?? Math.max(8, Math.round(s.size / 3)));
    const boxH = s.box?.height !== undefined ? rc.px(s.box.height, "y") : undefined;
    const fits = (sz: number) => {
      const m = measure(rc, plain, toTextStyle(s, rc, sz), maxW);
      return (
        m.lines.length <= (s.fit.maxLines ?? Infinity) &&
        (boxH === undefined || m.height <= boxH + 0.5) &&
        m.width <= maxW + 0.5
      );
    };
    let a = lo;
    let b = hi;
    if (fits(hi)) a = hi;
    else {
      for (let i = 0; i < 14 && b - a > 0.5; i++) {
        const mid = (a + b) / 2;
        if (fits(mid)) a = mid;
        else b = mid;
      }
    }
    size = Math.floor(a);
  }

  // lines (only when line units are needed)
  let lineOf: number[] | undefined;
  let lineCount = 0;
  if (needed.has("line")) {
    const m = measure(rc, plain, toTextStyle(s, rc, size), maxW);
    lineCount = m.lines.length;
    lineOf = new Array(r.chars.length).fill(0);
    const firsts = m.lines.map((l) => l.glyphs[0]?.index ?? 0);
    for (let i = 0; i < r.chars.length; i++) {
      let li = 0;
      for (let k = 0; k < firsts.length; k++) if (i >= firsts[k]!) li = k;
      lineOf[i] = li;
    }
  }

  // gradient fills cannot clip through animated inline-block units, so colour each character from the
  // gradient at its measured position instead
  const fillv = s.fill;
  const srcIndex = new Map(r.chars.map((c, i) => [c, i] as const));
  let charColor: ((i: number) => string) | undefined;
  if (
    needed.size &&
    fillv &&
    typeof fillv === "object" &&
    (fillv as { type?: string }).type === "linear"
  ) {
    const g = fillv as { angle?: number | string; stops: Array<[number, string]> };
    const m = measure(rc, plain, toTextStyle(s, rc, size), maxW);
    const glyphs = new Map<number, { x: number; y: number; width: number; height: number }>();
    for (const l of m.lines) for (const gl of l.glyphs) glyphs.set(gl.index, gl);
    const th =
      ((typeof g.angle === "number" ? g.angle : parseFloat(String(g.angle ?? 180))) * Math.PI) /
      180;
    const dx = Math.sin(th);
    const dy = -Math.cos(th);
    const W = Math.max(1, m.width);
    const H = Math.max(1, m.height);
    const L = Math.abs(W * dx) + Math.abs(H * dy) || 1;
    charColor = (i) => {
      const gl = glyphs.get(i);
      if (!gl) return gradientAt(g.stops, 0.5);
      const t =
        ((gl.x + gl.width / 2 - W / 2) * dx + (gl.y + gl.height / 2 - H / 2) * dy) / L + 0.5;
      return gradientAt(g.stops, t);
    };
  } else if (needed.size && isGradient(fillv))
    issues.push(
      "image/radial gradient fills are approximated with the first stop when text is split into units",
    );
  // inner markup (split or plain)
  const table: UnitTable = {
    char: [],
    word: [],
    line: [],
    target: { char: [], word: [], line: [] },
    charText: [],
    wordText: [],
    base: {
      weight: s.weight,
      tracking: s.tracking,
      fill: typeof s.fill === "string" ? s.fill : undefined,
      size,
    },
    mask,
  };
  let inner = r.html;
  if (needed.size) {
    const needLine = needed.has("line");
    const lines: StyledChar[][] = needLine
      ? Array.from({ length: Math.max(1, lineCount) }, () => [])
      : [r.chars];
    if (needLine) r.chars.forEach((c, i) => lines[lineOf![i]!]!.push(c));
    let ci = 0;
    let wi = 0;
    const htmlLines: string[] = [];
    lines.forEach((lineChars, li) => {
      // words
      const words: StyledChar[][] = [];
      let cur: StyledChar[] = [];
      const gaps: StyledChar[][] = [];
      let gap: StyledChar[] = [];
      for (const c of lineChars) {
        if (isSpace(c.g) || c.g === "\n") {
          if (cur.length) {
            words.push(cur);
            gaps.push([]);
            cur = [];
          }
          gap.push(c);
          gaps[gaps.length - 1] = gap;
        } else {
          if (gap.length) gap = [];
          cur.push(c);
        }
      }
      if (cur.length) {
        words.push(cur);
        gaps.push([]);
      }
      const wordHtml = words.map((w, k) => {
        const wid = `${id}-w${wi++}`;
        table.word.push(wid);
        table.target.word.push(wid);
        table.wordText.push(w.map((c) => c.g).join(""));
        const chars = w
          .map((c) => {
            const cid = `${id}-c${ci++}`;
            table.char.push(cid);
            table.target.char.push(cid);
            table.charText.push(c.g);
            const col = charColor ? `;color:${charColor(srcIndex.get(c)!)}` : "";
            return `${c.open}<span id="${cid}" class="cc-c" style="display:inline-block;white-space:pre${col}">${esc(c.g)}</span>${c.close}`;
          })
          .join("");
        const sep = k < words.length - 1 || false ? " " : "";
        return `<span id="${wid}" class="cc-w" style="display:inline-block;white-space:nowrap">${chars}</span>${sep}`;
      });
      if (needLine) {
        const lid = `${id}-l${li}`;
        table.line.push(lid);
        table.target.line.push(`${lid}-in`);
        htmlLines.push(
          `<span id="${lid}" class="cc-l" style="display:block;${mask ? "overflow:hidden;" : ""}white-space:nowrap"><span id="${lid}-in" style="display:block">${wordHtml.join("")}</span></span>`,
        );
      } else htmlLines.push(wordHtml.join(""));
    });
    inner = htmlLines.join("");
  } else {
    // still publish ids for animators that may be added later (none): empty table
  }
  setUnitTable(rc.node, table);

  // style
  const gradient = isGradient(fillv) && !charColor;
  if (fillv && typeof fillv === "object" && (fillv as { type?: string }).type === "video")
    issues.push("video fill clipped to letter shapes is not supported yet; using white");
  if (s.extrude && s.extrude.depth > 0) issues.push("`extrude` (3D text) is a later tier: ignored");
  if (s.stroke?.dash?.length)
    issues.push("dashed text strokes need SVG text and are not supported yet: ignored");
  if (s.stroke?.align === "inside")
    issues.push('`stroke.align="inside"` is approximated as centred');

  const channels: Channel[] = [...r.channels];
  const textSel = `#${tid}`;
  const style: Record<string, string | number | undefined> = {
    "font-family": rc.fontFamily(s.font),
    "font-size": `${round(size)}px`,
    "font-weight": round(s.weight, 1),
    "font-stretch": s.width !== 100 ? `${round(s.width, 1)}%` : undefined,
    "font-style": s.style,
    "letter-spacing": s.tracking ? `${round(s.tracking / 1000, 4)}em` : undefined,
    "word-spacing": s.wordSpacing ? `${round(s.wordSpacing / 1000, 4)}em` : undefined,
    "line-height": round(s.leading, 3),
    "text-align": s.align,
    "text-indent": s.indent ? `${s.indent}px` : undefined,
    direction: s.direction !== "ltr" ? s.direction : undefined,
    hyphens: s.hyphenate ? "auto" : undefined,
    "text-wrap": s.balance ? "balance" : undefined,
    "white-space":
      s.overflow === "ellipsis" || s.wrap === false || needed.has("line") ? "nowrap" : "normal",
    "font-feature-settings": featureString(s.features, s.numeric),
    "font-variation-settings": axesString(s.axes),
    "font-kerning": "normal",
    "column-count": s.columns > 1 ? s.columns : undefined,
    margin: undefined,
    "vertical-align": undefined,
    position: "relative",
    top: s.baselineShift ? `${round(-s.baselineShift)}px` : undefined,
    width: s.box?.width !== undefined ? "100%" : undefined,
    ...(CASE[s.case] ?? {}),
    ...(s.overflow === "ellipsis"
      ? { "text-overflow": "ellipsis", overflow: "hidden" }
      : s.overflow === "hidden"
        ? { overflow: "hidden" }
        : {}),
    ...strokeCss(s.stroke),
  };
  if (gradient) {
    Object.assign(style, {
      background: fillCss(fillv as any, rc),
      "-webkit-background-clip": "text",
      "background-clip": "text",
      color: "transparent",
      "-webkit-text-fill-color": "transparent",
    });
  } else {
    style.color = typeof fillv === "string" ? fillv : "#ffffff";
  }

  // shadows / blur / rgbSplit as one composite signal when anything is animated
  const sigOf = (k: string) => rc.node.props[k] as Signal<number> | undefined;
  const rgbSig = sigOf("rgbSplit");
  const blurSig = sigOf("blur");
  const strokeW = (rc.node.props.stroke as any)?.width as Signal<number> | undefined;
  const shadowsStatic = shadowList(s);
  const shadowAt = (t: number): string => {
    const parts = [...shadowsStatic];
    const rgb = rgbSig ? (evalProp(rgbSig, t) as number) : 0;
    if (rgb > 0.01 && !gradient)
      parts.push(
        `${round(rgb)}px 0 0 rgba(255,0,60,.85)`,
        `${round(-rgb)}px 0 0 rgba(0,220,255,.85)`,
      );
    return parts.join(", ");
  };
  const blurAt = (t: number): string => {
    const b = blurSig ? (evalProp(blurSig, t) as number) : 0;
    const parts: string[] = [];
    if (gradient) for (const sh of shadowsStatic) parts.push(`drop-shadow(${sh})`);
    if (b > 0.05) parts.push(`blur(${round(b, 2)}px)`);
    return parts.join(" ");
  };
  const span: [number, number] = [rc.node.start, rc.node.end];
  const dyn = (sg?: Signal) => !!sg && sg.kind !== "const";
  if (!gradient) {
    const sh0 = shadowAt(t0);
    if (dyn(rgbSig))
      channels.push({
        target: textSel,
        prop: "textShadow",
        signal: exprSignal(shadowAt, "discrete", span),
        span,
        format: (v) => String(v),
      });
    else if (sh0) style["text-shadow"] = sh0;
  }
  const f0 = blurAt(t0);
  if (dyn(blurSig))
    channels.push({
      target: textSel,
      prop: "filter",
      signal: exprSignal((t) => blurAt(t) || "none", "discrete", span),
      span,
      format: (v) => String(v),
    });
  else if (f0) style.filter = f0;
  if (rgbSig && gradient)
    issues.push("`rgbSplit` needs a solid fill; ignored for gradient/image fills");
  if (dyn(strokeW))
    channels.push({
      target: textSel,
      prop: "webkitTextStrokeWidth",
      signal: strokeW!,
      unit: "px",
      span,
    });

  // animatable face props
  const animated = (k: string) => dyn(sigOf(k));
  const chan = (
    prop: string,
    k: string,
    fn: (v: number) => number | string,
    unit?: string,
    vk: "number" | "discrete" = "number",
  ) => {
    if (!animated(k)) return;
    const sg = sigOf(k)!;
    channels.push({
      target: textSel,
      prop,
      signal: exprSignal((t) => fn(evalProp(sg, t) as number), vk, span),
      unit,
      span,
      format: vk === "discrete" ? (v) => String(v) : undefined,
    });
  };
  chan("fontWeight", "weight", (v) => round(v, 1));
  chan("fontSize", "size", (v) => round(v, 2), "px");
  chan("letterSpacing", "tracking", (v) => round(v / 1000, 5), "em");
  chan("wordSpacing", "wordSpacing", (v) => round(v / 1000, 5), "em");
  chan("lineHeight", "leading", (v) => round(v, 4));
  chan("fontStretch", "width", (v) => `${round(v, 1)}%`, undefined, "discrete");
  chan("top", "baselineShift", (v) => -round(v), "px");
  const axesProp = rc.node.props.axes as
    Record<string, Signal | Record<string, number>> | undefined;
  if (
    axesProp &&
    Object.entries(axesProp).some(
      ([k, v]) => k !== "custom" && (v as Signal)?.kind && (v as Signal).kind !== "const",
    )
  ) {
    channels.push({
      target: textSel,
      prop: "fontVariationSettings",
      signal: exprSignal(
        (t) => axesString(evalProp(axesProp, t) as State["axes"]) ?? "normal",
        "discrete",
        span,
      ),
      span,
      format: (v) => String(v),
    });
  }
  // glitch jitter (inner element so it never fights the layer transform)
  const gl = sigOf("glitch");
  if (gl && (dyn(gl) || (gl as any).v > 0)) {
    const step = (t: number) => Math.floor(((t - span[0]) * rc.fps) / 2);
    const amt = (t: number) => evalProp(gl, t) as number;
    channels.push({
      target: textSel,
      prop: "x",
      signal: exprSignal((t) => round(noise1D(step(t) * 3.7, 11) * 26 * amt(t)), "number", span),
      span,
    });
    channels.push({
      target: textSel,
      prop: "skewX",
      signal: exprSignal((t) => round(noise1D(step(t) * 2.3, 12) * 7 * amt(t)), "number", span),
      span,
    });
  }

  // decorations: whole-text wrappers (not applied in split mode)
  let content = inner;
  const decoOpen: string[] = [];
  const decoClose: string[] = [];
  const addDeco = (kind: "underline" | "strike") => {
    const d = s[kind];
    if (!d || !Object.keys(d).length || needed.size) {
      if (d && Object.keys(d).length && needed.size)
        issues.push(`${kind} is not applied when text is split into animated units`);
      return;
    }
    const raw = (rc.node.props[kind] as any)?.progress as Signal<number> | undefined;
    const animatedP = dyn(raw);
    const c = d.color ?? (typeof fillv === "string" ? fillv : "#fff");
    const th = d.thickness ?? 4;
    if (!animatedP && (d.progress ?? 1) >= 1) {
      style["text-decoration"] =
        `${kind === "underline" ? "underline" : "line-through"} ${d.style ?? "solid"} ${c}`;
      style["text-decoration-thickness"] = `${th}px`;
      if (kind === "underline") style["text-underline-offset"] = `${d.offset ?? 6}px`;
    } else {
      const sid = `${id}-${kind}`;
      const pos = kind === "underline" ? "0 100%" : "0 52%";
      decoOpen.push(
        `<span id="${sid}" class="cc-deco" style="background:linear-gradient(${c},${c}) no-repeat ${pos}/${round((d.progress ?? 1) * 100, 2)}% ${th}px;padding-bottom:${kind === "underline" ? (d.offset ?? 6) : 0}px">`,
      );
      decoClose.unshift("</span>");
      if (animatedP)
        channels.push({
          target: `#${sid}`,
          prop: "backgroundSize",
          signal: exprSignal(
            (t) =>
              `${round(Math.min(1, Math.max(0, evalProp(raw!, t) as number)) * 100, 2)}% ${th}px`,
            "discrete",
            span,
          ),
          span,
          format: (v) => String(v),
        });
    }
  };
  addDeco("underline");
  addDeco("strike");
  const hl = s.highlight;
  if (hl && Object.keys(hl).length && !needed.size) {
    const sid = `${id}-hl`;
    const raw = (rc.node.props.highlight as any)?.progress as Signal<number> | undefined;
    const col = withAlphaColor(hl.color ?? "#ffe14d", hl.opacity ?? 1);
    decoOpen.push(
      `<span id="${sid}" class="cc-hl" style="background:linear-gradient(${col},${col}) no-repeat 0 0/${round((hl.progress ?? 1) * 100, 2)}% 100%;padding:${hl.padding ?? 8}px;margin:-${hl.padding ?? 8}px;border-radius:${hl.radius ?? 6}px;-webkit-box-decoration-break:clone;box-decoration-break:clone">`,
    );
    decoClose.unshift("</span>");
    if (dyn(raw))
      channels.push({
        target: `#${sid}`,
        prop: "backgroundSize",
        signal: exprSignal(
          (t) => `${round(Math.min(1, Math.max(0, evalProp(raw!, t) as number)) * 100, 2)}% 100%`,
          "discrete",
          span,
        ),
        span,
        format: (v) => String(v),
      });
  } else if (hl && Object.keys(hl).length)
    issues.push("highlight is not applied when text is split into animated units");
  content = decoOpen.join("") + content + decoClose.join("");

  // outline box
  if (s.outline && s.outline.width > 0) {
    style["outline"] = `${s.outline.width}px solid ${s.outline.color ?? "#fff"}`;
    style["outline-offset"] = `${s.outline.gap ?? 4}px`;
  }

  // implicit animator (SplitText)
  if (split) {
    const a = animatorChannels(
      {
        by: split.by,
        preset: split.preset,
        props: split.props,
        stagger: split.stagger,
        unitDuration: split.unitDuration,
        ease: split.ease,
        order: split.order,
        seed: split.seed,
      },
      table,
      rc.node.start,
      rc.node.end,
      rc.fps,
    );
    channels.push(...a.channels);
    issues.push(...a.issues);
  }

  // box and valign
  const pl = placement(p.at, rc);
  const box: Record<string, string> = { ...pl.box };
  if (s.box?.width !== undefined || s.box?.height !== undefined) {
    if (s.box.width !== undefined) box.width = `${round(rc.px(s.box.width, "x"))}px`;
    if (s.box.height !== undefined) box.height = `${round(rc.px(s.box.height, "y"))}px`;
  } else {
    box.width = "max-content";
    box["max-width"] = `${round(maxW)}px`;
  }
  let html = `<div id="${tid}" class="cc-text" ${s.lang ? `lang="${esc(s.lang)}" ` : ""}${s.direction === "rtl" ? 'dir="rtl" ' : ""}style="${css(style)}">${content}</div>`;
  if (s.box?.height !== undefined && s.valign !== "top") {
    html = `<div style="display:flex;width:100%;height:100%;align-items:${s.valign === "middle" ? "center" : "flex-end"}">${html}</div>`;
  }
  return { html, box, statics: pl.statics, channels, issues: issues.length ? issues : undefined };
}

/** Measure text via the compile's measurer. Falls back to an estimate when none is wired. */
function measure(rc: RenderCtx, text: string, style: TextStyle, maxWidth: number) {
  if (rc.measure) return rc.measure.measureText(text, style, { maxWidth });
  return estimate(text, style, { maxWidth });
}
import { estimateText as estimate } from "@codecut/core";

// ---------- components ----------

const textControls = () => ({
  at: atControl(),
  text: richText({
    description:
      "The text. Children (strings, <Span>, <B>, <I>, <Highlight>, <Underline>) work too.",
  }),
  markup: richText({ description: 'Inline markup: "**bold** _italic_ ==highlight== ~~strike~~".' }),
  ...typographyControls(),
  ...textStyleControls(),
});

export const Text = defineComponent("Text", {
  category: "text",
  description:
    "Text with full typography: face, spacing, layout, case and OpenType features, fitting, decoration and styling. Add <TextAnimator> children for per-character, word or line animation.",
  children: "any",
  textChildren: "text",
  controls: textControls(),
  render: (p, rc) => renderText(p, rc),
});

export const Title = defineComponent("Title", {
  category: "text",
  description: "A headline: Text with display-face defaults (700 weight, centred, tight leading).",
  children: "any",
  textChildren: "text",
  controls: {
    ...textControls(),
    font: text({ default: "$type.display" }),
    weight: num({ animatable: true, min: 1, max: 1000, default: 700, step: 1, unit: "wght" }),
    size: num({ animatable: true, min: 1, max: 2000, default: 96, step: 1, unit: "px" }),
    align: enumOf(["left", "center", "right", "justify"], { default: "center" }),
    leading: num({ animatable: true, min: 0.5, max: 4, default: 1.05, step: 0.01 }),
    tracking: num({ animatable: true, min: -500, max: 2000, default: -15, step: 1, unit: "‰em" }),
  },
  render: (p, rc) => renderText(p, rc),
});

export const SplitText = defineComponent("SplitText", {
  category: "text",
  description:
    "The simple form of TextAnimator: splits text into characters, words or lines and staggers a preset or custom props across them.",
  children: "any",
  textChildren: "text",
  controls: {
    ...textControls(),
    font: text({ default: "$type.display" }),
    weight: num({ animatable: true, min: 1, max: 1000, default: 700, step: 1, unit: "wght" }),
    size: num({ animatable: true, min: 1, max: 2000, default: 96, step: 1, unit: "px" }),
    align: enumOf(["left", "center", "right", "justify"], { default: "center" }),
    by: enumOf(["char", "word", "line"], {
      description: "Unit to split by (default: the preset's).",
    }),
    preset: enumOf(
      [
        "rise",
        "typewriter",
        "wave",
        "scramble",
        "slam",
        "blur-in",
        "mask-reveal",
        "weight-pulse",
        "tracking-in",
        "counter",
        "none",
      ],
      { default: "rise" },
    ),
    stagger: time({
      min: 0,
      unit: "s",
      description: "Seconds between units (0.05–0.1 reads well).",
    }),
    unitDuration: time({ min: 0, unit: "s" }),
    ease: text({}),
    order: enumOf(["forward", "backward", "center", "edges", "random"], { default: "forward" }),
    seed: int({ default: 1 }),
    from: color({ description: "Optional start fill colour to interpolate from (props.fill)." }),
  },
  render: (p, rc) => {
    const props: AnimProps = {};
    return renderText(p, rc, {
      by: p.by,
      preset: p.preset,
      stagger: p.stagger === undefined ? undefined : Number(p.stagger),
      unitDuration: p.unitDuration === undefined ? undefined : Number(p.unitDuration),
      ease: p.ease || undefined,
      order: p.order,
      seed: p.seed,
      props,
    });
  },
});

// ---------- inline components ----------

const inline = <C extends Record<string, any>>(
  name: string,
  description: string,
  controls: C,
  open: (p: any, rc: RenderCtx) => string,
  channels?: (p: any, rc: RenderCtx) => Channel[],
) =>
  defineComponent(name, {
    category: "text",
    description,
    traits: ["inline"],
    children: "any",
    controls,
    render: (p: any, rc: RenderCtx) => ({
      html: `${open(p, rc)}{{children}}</span>`,
      visual: false,
      channels: channels?.(p, rc),
    }),
  });

export const Span = inline(
  "Span",
  "Inline run inside Text that overrides font, weight, colour, size and features.",
  {
    font: text(),
    weight: num({ min: 1, max: 1000 }),
    color: color(),
    size: num({ min: 0.1, max: 10, description: "Multiplier of the parent size (em)." }),
    tracking: num({ unit: "‰em" }),
    features: listCtl(text()),
    style: enumOf(["normal", "italic", "oblique"]),
  },
  (p, rc) =>
    `<span id="${rc.id}" style="${css({
      "font-family": p.font ? rc.fontFamily(p.font) : undefined,
      "font-weight": p.weight,
      color: p.color,
      "font-size": p.size ? `${p.size}em` : undefined,
      "letter-spacing": p.tracking ? `${round(p.tracking / 1000, 4)}em` : undefined,
      "font-feature-settings": featureString(p.features, undefined),
      "font-style": p.style,
    })}">`,
);

import { list as listCtl } from "@codecut/core";

export const B = inline(
  "B",
  "Bold run inside Text.",
  { weight: num({ min: 1, max: 1000, default: 700 }) },
  (p, rc) => `<span id="${rc.id}" style="font-weight:${p.weight}">`,
);
export const I = inline(
  "I",
  "Italic run inside Text.",
  { skew: num({ default: 0 }) },
  (_p, rc) => `<span id="${rc.id}" style="font-style:italic">`,
);

export const Highlight = inline(
  "Highlight",
  "Marker-pen highlight behind an inline run. `progress` animates a left-to-right wipe.",
  {
    color: color({ default: "#ffe14d" }),
    padding: num({ min: 0, default: 6, unit: "px" }),
    radius: num({ min: 0, default: 6, unit: "px" }),
    progress: num({ animatable: true, min: 0, max: 1, default: 1, step: 0.01 }),
  },
  (p, rc) => {
    const prog = rc.at<number>("progress", rc.node.start);
    return `<span id="${rc.id}" class="cc-hl" style="background:linear-gradient(${p.color},${p.color}) no-repeat 0 0/${round(prog * 100, 2)}% 100%;padding:0 ${p.padding}px;margin:0 -${p.padding}px;border-radius:${p.radius}px;-webkit-box-decoration-break:clone;box-decoration-break:clone">`;
  },
  (p, rc) => {
    const sg = rc.node.props.progress as Signal<number>;
    if (sg.kind === "const") return [];
    return [
      {
        target: `#${rc.id}`,
        prop: "backgroundSize",
        signal: exprSignal(
          (t) => `${round(Math.min(1, Math.max(0, evalProp(sg, t) as number)) * 100, 2)}% 100%`,
          "discrete",
        ),
        format: (v) => String(v),
      },
    ];
  },
);

const decoInline = (name: string, pos: string, label: string) =>
  inline(
    name,
    `${label} for an inline run. \`progress\` animates a draw-on from left to right.`,
    {
      color: color({ default: "#ffffff" }),
      thickness: num({ min: 0, default: 4, unit: "px" }),
      offset: num({ default: 4, unit: "px" }),
      progress: num({ animatable: true, min: 0, max: 1, default: 1, step: 0.01 }),
    },
    (p, rc) => {
      const prog = rc.at<number>("progress", rc.node.start);
      return `<span id="${rc.id}" class="cc-deco" style="background:linear-gradient(${p.color},${p.color}) no-repeat ${pos}/${round(prog * 100, 2)}% ${p.thickness}px;padding-bottom:${name === "Underline" ? p.offset : 0}px">`;
    },
    (p, rc) => {
      const sg = rc.node.props.progress as Signal<number>;
      if (sg.kind === "const") return [];
      return [
        {
          target: `#${rc.id}`,
          prop: "backgroundSize",
          signal: exprSignal(
            (t) =>
              `${round(Math.min(1, Math.max(0, evalProp(sg, t) as number)) * 100, 2)}% ${p.thickness}px`,
            "discrete",
          ),
          format: (v) => String(v),
        },
      ];
    },
  );
export const Underline = decoInline("Underline", "0 100%", "Underline");
export const Strike = decoInline("Strike", "0 52%", "Strike-through");

export const textComponents = [Text, Title, SplitText, Span, B, I, Highlight, Underline, Strike];
export { bool };
