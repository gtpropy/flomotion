import {
  bool,
  color3,
  curves,
  defineEffect,
  enumOf,
  evalSignal,
  exprSignal,
  file,
  mulberry32,
  num,
  type Channel,
  type CurveChannel,
  type CurvePoint,
  type RenderCtx,
  type Signal,
} from "@codecut/core";
import { effectWindow } from "./layerstyles.js";
import { round } from "./util.js";

const TABLE_N = 33;
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const bump = (y: number, c: number, w: number) => Math.max(0, 1 - Math.abs(y - c) / w) ** 2;

export interface GradeParams {
  exposure: number;
  contrast: number;
  saturation: number;
  vibrance: number;
  temperature: number;
  tint: number;
  highlights: number;
  shadows: number;
  whites: number;
  blacks: number;
}

/** Tone curve (applied to R, G, B alike): exposure in linear light, then contrast and tonal bands. */
export function toneTable(g: GradeParams): number[] {
  const out: number[] = [];
  for (let i = 0; i < TABLE_N; i++) {
    let y = i / (TABLE_N - 1);
    y = clamp01(Math.pow(Math.pow(y, 2.2) * Math.pow(2, g.exposure), 1 / 2.2));
    y = (y - 0.5) * (1 + g.contrast) + 0.5;
    y += (g.shadows / 100) * 0.2 * bump(y, 0.25, 0.3);
    y += (g.highlights / 100) * 0.2 * bump(y, 0.75, 0.3);
    y += (g.whites / 100) * 0.15 * y * y * y;
    y += (g.blacks / 100) * 0.1 * (1 - y) ** 3;
    out.push(round(clamp01(y), 4));
  }
  return out;
}

/** 5x4 colour matrix: white balance gains then saturation (luma preserving). */
export function gradeMatrix(g: GradeParams): number[] {
  const rg = 1 + (g.temperature / 100) * 0.15 + (g.tint / 100) * 0.05;
  const gg = 1 - (g.tint / 100) * 0.1;
  const bg = 1 - (g.temperature / 100) * 0.15 + (g.tint / 100) * 0.05;
  const s = Math.max(0, 1 + g.saturation + g.vibrance * 0.5);
  const [lr, lg, lb] = [0.2126, 0.7152, 0.0722];
  const sat = [
    [lr * (1 - s) + s, lg * (1 - s), lb * (1 - s)],
    [lr * (1 - s), lg * (1 - s) + s, lb * (1 - s)],
    [lr * (1 - s), lg * (1 - s), lb * (1 - s) + s],
  ];
  const gains = [rg, gg, bg];
  const m: number[] = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) m.push(round(sat[r]![c]! * gains[c]!, 5));
    m.push(0, 0);
  }
  m.push(0, 0, 0, 1, 0);
  return m;
}

const NEUTRAL: GradeParams = {
  exposure: 0,
  contrast: 0,
  saturation: 0,
  vibrance: 0,
  temperature: 0,
  tint: 0,
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,
};
const GRADE_KEYS = Object.keys(NEUTRAL) as Array<keyof GradeParams>;

type V3 = [number, number, number];

export const ColorGrade = defineEffect("ColorGrade", {
  category: "color",
  description:
    "Primary colour correction through SVG filters: basic controls plus lift/gamma/gain/offset wheels. Order: tone, white balance and saturation, then wheels. Apply to a layer or, as a child of Composition, to everything.",
  controls: {
    scope: enumOf(["layer", "composition"], {
      default: "layer",
      description: "Informational: a ColorGrade child of Composition grades the whole frame.",
    }),
    exposure: num({ min: -5, max: 5, step: 0.01, default: 0, animatable: true, unit: "EV" }),
    contrast: num({ min: -1, max: 1, step: 0.01, default: 0, animatable: true }),
    saturation: num({ min: -1, max: 1, step: 0.01, default: 0, animatable: true }),
    vibrance: num({ min: -1, max: 1, step: 0.01, default: 0, animatable: true }),
    temperature: num({ min: -100, max: 100, step: 1, default: 0, animatable: true }),
    tint: num({ min: -100, max: 100, step: 1, default: 0, animatable: true }),
    highlights: num({ min: -100, max: 100, step: 1, default: 0, animatable: true }),
    shadows: num({ min: -100, max: 100, step: 1, default: 0, animatable: true }),
    whites: num({ min: -100, max: 100, step: 1, default: 0, animatable: true }),
    blacks: num({ min: -100, max: 100, step: 1, default: 0, animatable: true }),
    lift: color3({ default: [0, 0, 0], ui: "wheel", animatable: true }),
    gamma: color3({ default: [1, 1, 1], ui: "wheel", animatable: true }),
    gain: color3({ default: [1, 1, 1], ui: "wheel", animatable: true }),
    offset: color3({ default: [0, 0, 0], ui: "wheel", animatable: true }),
    lut: file({
      accept: [".cube"],
      description: "Later: .cube LUTs need a WebGL pass. Typed stub; ignored with a warning.",
    }),
  },
  apply: (p, rc) => {
    const id = `${rc.id}-cg`;
    const S = (k: string) => rc.node.props[k] as Signal;
    const [w0, w1] = effectWindow(rc);
    const gradeAt = (t: number): GradeParams => {
      const g = { ...NEUTRAL };
      for (const k of GRADE_KEYS) g[k] = evalSignal(S(k), t) as number;
      return g;
    };
    const wheel = (k: string, t: number) => evalSignal(S(k), t) as V3;
    // outside the effect window the grade is neutral
    const gA = (t: number): GradeParams => (t >= w0 && t < w1 ? gradeAt(t) : NEUTRAL);
    const wA =
      (k: string, d: V3) =>
      (t: number): V3 =>
        t >= w0 && t < w1 ? wheel(k, t) : d;
    const lift = wA("lift", [0, 0, 0]);
    const gamma = wA("gamma", [1, 1, 1]);
    const gain = wA("gain", [1, 1, 1]);
    const offs = wA("offset", [0, 0, 0]);
    const t0 = w0;

    const ch: Channel[] = [];
    const add = (
      target: string,
      attr: string,
      fn: (t: number) => string | number,
      deps: string[],
    ) => {
      const dynamic = deps.some((k) => S(k).kind !== "const") || w0 > 0 || w1 < rc.node.parent!.end;
      if (!dynamic) return;
      ch.push({
        target: `#${target}`,
        prop: `attr:${attr}`,
        signal: exprSignal(fn, typeof fn(t0) === "number" ? "number" : "discrete", [w0, w1]),
        format: (v) => String(v),
        span: [w0, w1],
      });
    };
    const g0 = gA(t0);
    const tone = (t: number) => toneTable(gA(t)).join(" ");
    const mat = (t: number) => gradeMatrix(gA(t)).join(" ");
    const toneDeps = ["exposure", "contrast", "highlights", "shadows", "whites", "blacks"];
    for (const c of ["R", "G", "B"]) add(`${id}-t${c}`, "tableValues", tone, toneDeps);
    add(`${id}-m`, "values", mat, ["saturation", "vibrance", "temperature", "tint"]);
    ["R", "G", "B"].forEach((c, i) => {
      add(`${id}-l${c}`, "slope", (t) => round(gain(t)[i]!, 4), ["gain"]);
      add(`${id}-l${c}`, "intercept", (t) => round(lift(t)[i]! + offs(t)[i]!, 4), [
        "lift",
        "offset",
      ]);
      add(`${id}-g${c}`, "exponent", (t) => round(1 / Math.max(0.05, gamma(t)[i]!), 4), ["gamma"]);
    });
    const lin = (i: number) =>
      `<feFunc${"RGB"[i]} id="${id}-l${"RGB"[i]}" type="linear" slope="${round(gain(t0)[i]!, 4)}" intercept="${round(lift(t0)[i]! + offs(t0)[i]!, 4)}"/>`;
    const gam = (i: number) =>
      `<feFunc${"RGB"[i]} id="${id}-g${"RGB"[i]}" type="gamma" amplitude="1" exponent="${round(1 / Math.max(0.05, gamma(t0)[i]!), 4)}" offset="0"/>`;
    const tab = (i: number) =>
      `<feFunc${"RGB"[i]} id="${id}-t${"RGB"[i]}" type="table" tableValues="${toneTable(g0).join(" ")}"/>`;
    const defs = `<filter id="${id}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feComponentTransfer>${tab(0)}${tab(1)}${tab(2)}</feComponentTransfer><feColorMatrix id="${id}-m" type="matrix" values="${gradeMatrix(g0).join(" ")}"/><feComponentTransfer>${lin(0)}${lin(1)}${lin(2)}</feComponentTransfer><feComponentTransfer>${gam(0)}${gam(1)}${gam(2)}</feComponentTransfer></filter>`;
    return {
      defs,
      filters: [exprSignal((t) => (t >= w0 && t < w1 ? `url(#${id})` : ""), "discrete", [w0, w1])],
      channels: ch,
      issues: p.lut
        ? ["`lut` (.cube) needs a WebGL grading pass, which is a later tier; the LUT was ignored"]
        : undefined,
    };
  },
});

// ---------- Curves ----------

/** Monotone cubic (PCHIP) sampling of a curve at TABLE_N points. */
export function curveTable(points: CurvePoint[] | undefined): number[] {
  if (!points || points.length < 2)
    return Array.from({ length: TABLE_N }, (_, i) => i / (TABLE_N - 1));
  const pts = [...points].sort((a, b) => a.x - b.x);
  const xs = pts.map((q) => q.x);
  const ys = pts.map((q) => q.y);
  const n = xs.length;
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++)
    d.push((ys[i + 1]! - ys[i]!) / Math.max(1e-6, xs[i + 1]! - xs[i]!));
  const m: number[] = new Array(n).fill(0);
  m[0] = d[0]!;
  m[n - 1] = d[n - 2]!;
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1]! * d[i]! <= 0 ? 0 : (d[i - 1]! + d[i]!) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i]! / d[i]!;
    const b = m[i + 1]! / d[i]!;
    const s = a * a + b * b;
    if (s > 9) {
      const tau = 3 / Math.sqrt(s);
      m[i] = tau * a * d[i]!;
      m[i + 1] = tau * b * d[i]!;
    }
  }
  const out: number[] = [];
  for (let k = 0; k < TABLE_N; k++) {
    const x = k / (TABLE_N - 1);
    if (x <= xs[0]!) {
      out.push(round(clamp01(ys[0]!), 4));
      continue;
    }
    if (x >= xs[n - 1]!) {
      out.push(round(clamp01(ys[n - 1]!), 4));
      continue;
    }
    let i = 0;
    while (i < n - 2 && x > xs[i + 1]!) i++;
    const h = xs[i + 1]! - xs[i]!;
    const t = (x - xs[i]!) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    const y =
      (2 * t3 - 3 * t2 + 1) * ys[i]! +
      (t3 - 2 * t2 + t) * h * m[i]! +
      (-2 * t3 + 3 * t2) * ys[i + 1]! +
      (t3 - t2) * h * m[i + 1]!;
    out.push(round(clamp01(y), 4));
  }
  return out;
}

export const Curves = defineEffect("Curves", {
  category: "color",
  description:
    "Tone curves per channel (rgb, r, g, b, luma). Points are 0..1 with a monotone cubic through them. `luma` is applied to all three channels equally.",
  controls: {
    curves: curves({ channels: ["rgb", "r", "g", "b", "luma"] as CurveChannel[] }),
  },
  apply: (p, rc) => {
    const id = `${rc.id}-curves`;
    const c = (p.curves ?? {}) as Partial<Record<CurveChannel, CurvePoint[]>>;
    const rgb = curveTable(c.rgb);
    const luma = curveTable(c.luma);
    const comp = (own: number[]) =>
      rgb.map((_, i) => own[Math.min(TABLE_N - 1, Math.round(rgb[i]! * (TABLE_N - 1)))]!);
    const lumaT = comp(luma);
    const per = (ch: "r" | "g" | "b") =>
      comp(curveTable(c[ch])).map(
        (_, i, arr) => lumaT[Math.min(TABLE_N - 1, Math.round(arr[i]! * (TABLE_N - 1)))]!,
      );
    const fn = (ch: "R" | "G" | "B", t: number[]) =>
      `<feFunc${ch} type="table" tableValues="${t.join(" ")}"/>`;
    const defs = `<filter id="${id}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feComponentTransfer>${fn("R", per("r"))}${fn("G", per("g"))}${fn("B", per("b"))}</feComponentTransfer></filter>`;
    const [a, b] = effectWindow(rc);
    return {
      defs,
      filters: [exprSignal((t) => (t >= a && t < b ? `url(#${id})` : ""), "discrete", [a, b])],
    };
  },
});

// ---------- Grain ----------

export const Grain = defineEffect("Grain", {
  category: "color",
  description:
    "Film grain: seeded fractal noise overlay. The noise re-seeds every `hold` frames from a seeded PRNG, so renders repeat exactly.",
  controls: {
    amount: num({ min: 0, max: 1, default: 0.12, step: 0.01, animatable: true }),
    size: num({
      min: 0.2,
      max: 4,
      default: 1,
      step: 0.05,
      description: "Grain size (higher = coarser).",
    }),
    hold: num({
      min: 1,
      max: 12,
      default: 2,
      step: 1,
      description: "Frames each noise pattern is held.",
    }),
    seed: num({ min: 0, max: 100000, default: 1, step: 1 }),
    mono: bool({ default: true }),
    blend: enumOf(["overlay", "soft-light", "multiply", "screen"], { default: "overlay" }),
  },
  apply: (p, rc) => {
    const id = `${rc.id}-grain`;
    const [a, b] = effectWindow(rc);
    const amount = rc.node.props.amount as Signal<number>;
    const fps = rc.fps;
    const seedAt = (t: number) =>
      Math.floor(mulberry32(p.seed * 7919 + Math.floor(((t - a) * fps) / p.hold))() * 100000);
    const freq = round(0.9 / p.size, 3);
    const html = `<svg id="${id}" class="cc-grain" width="100%" height="100%" style="position:absolute;inset:0;pointer-events:none;mix-blend-mode:${p.blend};opacity:${round(evalSignal(amount, a))}"><filter id="${id}-f" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence id="${id}-t" type="fractalNoise" baseFrequency="${freq}" numOctaves="2" seed="${seedAt(a)}" stitchTiles="stitch"/>${p.mono ? '<feColorMatrix type="saturate" values="0"/>' : ""}</filter><rect width="100%" height="100%" filter="url(#${id}-f)"/></svg>`;
    return {
      overlay: {
        html,
        channels: [
          {
            target: `#${id}-t`,
            prop: "attr:seed",
            signal: exprSignal(seedAt, "number", [a, b]),
            span: [a, b],
          },
          {
            target: `#${id}`,
            prop: "opacity",
            signal: exprSignal(
              (t) => (t >= a && t < b ? (evalSignal(amount, t) as number) : 0),
              "number",
              [a, b],
            ),
            span: [a, b],
          },
        ],
      },
    };
  },
});

export const colorEffects = [ColorGrade, Curves, Grain];
export type { RenderCtx };
