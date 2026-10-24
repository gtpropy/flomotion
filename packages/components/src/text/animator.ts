import {
  bool,
  color,
  defineEffect,
  enumOf,
  evalSignal,
  exprSignal,
  group,
  hashSeed,
  int,
  lerpColor,
  mulberry32,
  num,
  parseColor,
  parseEase,
  signalSpan,
  smoothstep,
  text,
  time,
  toCss,
  type Channel,
  type Signal,
} from "@flomotion/core";
import { round } from "../util.js";
import { getUnitTable, type By, type UnitTable } from "./units.js";

export type Shape = "square" | "ramp" | "triangle" | "smooth" | "wave";

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

/** Influence of the selector window at normalised window position `w` (0 = window start, 1 = window end). */
export function shapeInfluence(shape: Shape, w: number): number {
  switch (shape) {
    case "square":
      return w >= 0 && w <= 1 ? 1 : 0;
    case "ramp":
      return clamp01(w);
    case "triangle":
      return w < 0 || w > 1 ? 0 : 1 - Math.abs(2 * w - 1);
    case "smooth":
      return smoothstep(0, 1, w);
    case "wave":
      return w < 0 || w > 1 ? 0 : Math.sin(Math.PI * w);
  }
}

export interface Selector {
  start: number;
  end: number;
  shape: Shape;
  seed: number;
  amount: number;
}

/** Unit position in 0..1 along the text, with seeded jitter. */
export function unitPosition(i: number, n: number, sel: Pick<Selector, "seed" | "amount">): number {
  const u = n > 1 ? i / (n - 1) : 0.5;
  if (!sel.amount) return u;
  const r = hashSeed(`${sel.seed}:${i}`) / 4294967296;
  return u + (r - 0.5) * 2 * sel.amount;
}

/** After Effects style range selector: influence of unit i at the given offset. */
export function selectorInfluence(sel: Selector, i: number, n: number, offset: number): number {
  const u = unitPosition(i, n, sel);
  const width = Math.max(1e-6, sel.end - sel.start);
  const w = (u - (sel.start + offset)) / width;
  return shapeInfluence(sel.shape, w);
}

export type Order = "forward" | "backward" | "center" | "edges" | "random";

/** Order index of unit i (0 = first to start). */
export function staggerOrder(order: Order, i: number, n: number, seed = 1): number {
  switch (order) {
    case "backward":
      return n - 1 - i;
    case "center":
      return Math.abs(i - (n - 1) / 2);
    case "edges":
      return (n - 1) / 2 - Math.abs(i - (n - 1) / 2);
    case "random": {
      const keys = Array.from({ length: n }, (_, k) => [k, hashSeed(`${seed}:${k}`)] as const).sort(
        (a, b) => a[1] - b[1],
      );
      return keys.findIndex(([k]) => k === i);
    }
    default:
      return i;
  }
}

export interface AnimProps {
  opacity?: number;
  x?: number;
  y?: number;
  yPercent?: number;
  scale?: number;
  rotation?: number;
  skew?: number;
  blur?: number;
  tracking?: number;
  weight?: number;
  fill?: string;
  strokeWidth?: number;
  shadow?: { x?: number; y?: number; blur?: number; color?: string };
}

export interface PresetSpec {
  by: By;
  props: AnimProps;
  stagger: number;
  unitDuration: number;
  ease: string;
  order?: Order;
  /** Looping wave instead of a one-off reveal. */
  wave?: { period: number; phase: number; shape: Shape };
  /** Replace characters with seeded noise until revealed. */
  scramble?: { window: number };
  /** Count numbers up. */
  counter?: boolean;
  mask?: boolean;
}

export const PRESETS: Record<string, PresetSpec> = {
  typewriter: {
    by: "char",
    props: { opacity: 0 },
    stagger: 0.045,
    unitDuration: 0.001,
    ease: "linear",
  },
  wave: {
    by: "char",
    props: { y: -26 },
    stagger: 0,
    unitDuration: 0,
    ease: "sine.inOut",
    wave: { period: 1.0, phase: 0.1, shape: "wave" },
  },
  scramble: {
    by: "char",
    props: {},
    stagger: 0.04,
    unitDuration: 0.001,
    ease: "linear",
    scramble: { window: 0.35 },
  },
  rise: {
    by: "word",
    props: { y: 44, opacity: 0 },
    stagger: 0.08,
    unitDuration: 0.55,
    ease: "expo.out",
  },
  slam: {
    by: "word",
    props: { scale: 2.4, opacity: 0 },
    stagger: 0.11,
    unitDuration: 0.38,
    ease: "back.out(1.6)",
  },
  "blur-in": {
    by: "word",
    props: { blur: 16, opacity: 0 },
    stagger: 0.06,
    unitDuration: 0.6,
    ease: "expo.out",
  },
  "mask-reveal": {
    by: "line",
    props: { yPercent: 108 },
    stagger: 0.12,
    unitDuration: 0.7,
    ease: "expo.out",
    mask: true,
  },
  "weight-pulse": {
    by: "char",
    props: { weight: 850 },
    stagger: 0,
    unitDuration: 0,
    ease: "sine.inOut",
    wave: { period: 1.4, phase: 0.08, shape: "triangle" },
  },
  "tracking-in": {
    by: "line",
    props: { tracking: 260, opacity: 0 },
    stagger: 0.1,
    unitDuration: 0.9,
    ease: "expo.out",
  },
  counter: {
    by: "word",
    props: {},
    stagger: 0,
    unitDuration: 1.2,
    ease: "expo.out",
    counter: true,
  },
};

const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#%&*+=<>?/";

/** Deterministic scramble glyph for unit i at frame step k. */
export const scrambleChar = (seed: number, i: number, k: number) =>
  CHARSET[Math.floor(mulberry32(hashSeed(`${seed}:${i}:${k}`))() * CHARSET.length)]!;

export type InfluenceFn = (i: number, n: number, tAbs: number) => number;

interface Base {
  weight: number;
  tracking: number;
  fill?: string;
}

/** Turn an influence function and animator props into per-unit channels. */
export function unitChannels(
  targets: string[],
  influence: InfluenceFn,
  props: AnimProps,
  base: Base,
  span: [number, number],
): Channel[] {
  const n = targets.length;
  const out: Channel[] = [];
  const fillTo = props.fill ? safeParse(props.fill) : undefined;
  const fillFrom = base.fill ? safeParse(base.fill) : undefined;
  targets.forEach((target, i) => {
    const infl = (t: number) => influence(i, n, t);
    const add = (
      prop: string,
      fn: (k: number) => number | string,
      vk: "number" | "discrete" = "number",
      extra: Partial<Channel> = {},
    ) =>
      out.push({
        target: `#${target}`,
        prop,
        signal: exprSignal((t) => fn(infl(t)), vk, span),
        span,
        ...extra,
      });
    const lerp = (a: number, b: number) => (k: number) => round(a + (b - a) * k, 4);
    if (props.opacity !== undefined)
      add("opacity", (k) => round(Math.min(1, Math.max(0, 1 + (props.opacity! - 1) * k)), 4));
    if (props.x !== undefined) add("x", lerp(0, props.x));
    if (props.y !== undefined) add("y", lerp(0, props.y));
    if (props.yPercent !== undefined) add("yPercent", lerp(0, props.yPercent));
    if (props.scale !== undefined) add("scale", lerp(1, props.scale));
    if (props.rotation !== undefined) add("rotation", lerp(0, props.rotation));
    if (props.skew !== undefined) add("skewX", lerp(0, props.skew));
    if (props.blur !== undefined)
      add(
        "filter",
        (k) => (props.blur! * k > 0.05 ? `blur(${round(props.blur! * k, 2)}px)` : "none"),
        "discrete",
        { format: (v) => String(v) },
      );
    if (props.tracking !== undefined)
      add(
        "letterSpacing",
        (k) => round((base.tracking + (props.tracking! - base.tracking) * k) / 1000, 5),
        "number",
        { unit: "em" },
      );
    if (props.weight !== undefined)
      add("fontWeight", (k) => round(base.weight + (props.weight! - base.weight) * k, 1));
    if (fillTo && fillFrom)
      add("color", (k) => toCss(lerpColor(fillFrom, fillTo, k)), "discrete", {
        format: (v) => String(v),
      });
    if (props.strokeWidth !== undefined)
      add("webkitTextStrokeWidth", lerp(0, props.strokeWidth), "number", { unit: "px" });
    if (props.shadow) {
      const s = props.shadow;
      add(
        "textShadow",
        (k) =>
          `${round((s.x ?? 0) * k)}px ${round((s.y ?? 0) * k)}px ${round((s.blur ?? 0) * k)}px ${s.color ?? "rgba(0,0,0,.5)"}`,
        "discrete",
        { format: (v) => String(v) },
      );
    }
  });
  return out;
}

const safeParse = (c: string) => {
  try {
    return parseColor(c);
  } catch {
    return undefined;
  }
};

/** Normalised stagger influence: 1 before a unit starts, easing to 0 over `unitDuration`. */
export function staggerInfluence(
  spec: { stagger: number; unitDuration: number; ease: string; order: Order; seed: number },
  a: number,
): InfluenceFn {
  const e = parseEase(spec.ease);
  return (i, n, t) => {
    const delay = staggerOrder(spec.order, i, n, spec.seed) * spec.stagger;
    const d = Math.max(1e-6, spec.unitDuration);
    const q = clamp01((t - a - delay) / d);
    return 1 - e(q);
  };
}

export const TextAnimator = defineEffect("TextAnimator", {
  category: "text",
  description:
    "After Effects style text animator. A selector gives each character, word or line an influence from 0 to 1 over time; the `props` interpolate from the base value to the given value by that influence. Pure functions of time; randomness is seeded.",
  controls: {
    by: enumOf(["char", "word", "line"], { default: "char" }),
    preset: enumOf(
      [
        "none",
        "typewriter",
        "wave",
        "scramble",
        "rise",
        "slam",
        "blur-in",
        "mask-reveal",
        "weight-pulse",
        "tracking-in",
        "counter",
      ],
      { default: "none" },
    ),
    selector: group(
      {
        start: num({ default: 0, step: 0.01 }),
        end: num({ default: 1, step: 0.01 }),
        offset: num({
          animatable: true,
          default: 0,
          step: 0.01,
          description: "Slides the selector window along the text; keyframe it to sweep.",
        }),
        shape: enumOf(["square", "ramp", "triangle", "smooth", "wave"], { default: "smooth" }),
        randomize: group({
          seed: int({ default: 1 }),
          amount: num({ min: 0, max: 1, default: 0, step: 0.01 }),
        }),
      },
      { description: "Range selector. Omit to use `stagger` timing instead." },
    ),
    props: group(
      {
        opacity: num({ min: 0, max: 1 }),
        x: num({ unit: "px" }),
        y: num({ unit: "px" }),
        yPercent: num({ unit: "%" }),
        scale: num({ min: 0 }),
        rotation: num({ unit: "deg" }),
        skew: num({ unit: "deg" }),
        blur: num({ min: 0, unit: "px" }),
        tracking: num({ unit: "‰em" }),
        weight: num({ min: 1, max: 1000 }),
        fill: color(),
        strokeWidth: num({ min: 0, unit: "px" }),
        shadow: group({ x: num(), y: num(), blur: num({ min: 0 }), color: color() }),
      },
      { description: "Values at full influence (influence 1). Base values are the Text's own." },
    ),
    stagger: time({
      min: 0,
      unit: "s",
      description: "Seconds between units (stagger timing mode).",
    }),
    unitDuration: time({ min: 0, unit: "s", description: "Seconds each unit takes to settle." }),
    ease: text({ description: "Ease of each unit's settle (default per preset)." }),
    order: enumOf(["forward", "backward", "center", "edges", "random"], { default: "forward" }),
    seed: int({ default: 1 }),
    loop: bool({ default: false, description: "Wave presets keep running until the parent ends." }),
  },
  apply: (p, rc) => {
    const parent = rc.node.parent;
    const table = parent ? getUnitTable(parent) : undefined;
    if (!parent || !table)
      return { issues: ["TextAnimator must be a child of Text/Title with text content"] };
    const r = animatorChannels(
      {
        by: rc.node.raw.by !== undefined ? (p.by as By) : undefined,
        preset: p.preset as string,
        selector: p.selector as Record<string, any> | undefined,
        props: cleanProps(p.props as Record<string, unknown>) as AnimProps,
        stagger: p.stagger === undefined ? undefined : num_(p.stagger),
        unitDuration: p.unitDuration === undefined ? undefined : num_(p.unitDuration),
        ease: (p.ease as string | undefined) || undefined,
        order: p.order as Order,
        seed: p.seed as number,
      },
      table,
      rc.node.start,
      rc.node.end,
      rc.fps,
    );
    return { channels: r.channels, issues: r.issues };
  },
});

export interface AnimCfg {
  /** Explicit unit kind; otherwise the preset's, otherwise "char". */
  by?: By;
  preset: string;
  selector?: Record<string, any>;
  props: AnimProps;
  stagger?: number;
  unitDuration?: number;
  ease?: string;
  order: Order;
  seed: number;
}

/** Shared by the TextAnimator effect and SplitText: per-unit channels for one animator. */
export function animatorChannels(
  cfg: AnimCfg,
  table: UnitTable,
  a: number,
  b: number,
  fps: number,
): { channels: Channel[]; issues: string[] } {
  const preset = cfg.preset !== "none" ? PRESETS[cfg.preset] : undefined;
  const by: By = cfg.by ?? preset?.by ?? "char";
  const targets = table.target[by];
  if (!targets?.length)
    return { channels: [], issues: [`no ${by} units to animate (empty text?)`] };
  const props: AnimProps = { ...(preset?.props ?? {}), ...cfg.props };
  const base: Base = {
    weight: table.base.weight,
    tracking: table.base.tracking,
    fill: table.base.fill,
  };
  const stagger = cfg.stagger ?? preset?.stagger ?? 0.06;
  const unitDuration = cfg.unitDuration ?? preset?.unitDuration ?? 0.5;
  const ease = cfg.ease || preset?.ease || "expo.out";
  const sel = cfg.selector;
  const hasSelector = sel && Object.keys(sel).length > 0;
  const channels: Channel[] = [];
  let span: [number, number] = [a, b];
  let influence: InfluenceFn;

  if (preset?.scramble) {
    const win = preset.scramble.window;
    const st = cfg.stagger ?? preset.stagger;
    span = [a, Math.min(b, a + targets.length * st + win + 0.1)];
    targets.forEach((target, i) => {
      const reveal = a + staggerOrder(cfg.order, i, targets.length, cfg.seed) * st + win;
      const real = table.charText[i] ?? "";
      const fmt = (t: number) =>
        t >= reveal || /^\s*$/.test(real)
          ? real
          : scrambleChar(cfg.seed, i, Math.floor(((t - a) * fps) / 2));
      channels.push({
        target: `#${target}`,
        prop: "text",
        signal: exprSignal(fmt, "discrete", span),
        span,
        format: (v) => String(v),
      });
    });
    return { channels, issues: [] };
  }
  if (preset?.counter)
    return { channels: counterChannels(table, a, unitDuration, ease), issues: [] };
  if (preset?.wave) {
    const w = preset.wave;
    influence = (i, n, t) => {
      const phase = (t - a) / w.period - (n > 1 ? (i / (n - 1)) * w.phase * n : 0);
      return shapeInfluence(w.shape, phase - Math.floor(phase));
    };
  } else if (hasSelector) {
    const offsetSig = sel!.offset as Signal<number> | undefined;
    const selector: Selector = {
      start: sel!.start ?? 0,
      end: sel!.end ?? 1,
      shape: (sel!.shape as Shape) ?? "smooth",
      seed: sel!.randomize?.seed ?? 1,
      amount: sel!.randomize?.amount ?? 0,
    };
    const offAt = (t: number) => (offsetSig ? (evalSignal(offsetSig, t) as number) : 0);
    const sp = offsetSig ? signalSpan(offsetSig, [a, b]) : null;
    span = sp ?? [a, b];
    influence = (i, n, t) => selectorInfluence(selector, i, n, offAt(t));
  } else {
    const total = (targets.length - 1) * stagger + unitDuration;
    span = [a, Math.min(b, a + total + 0.05)];
    influence = staggerInfluence(
      { stagger, unitDuration, ease, order: cfg.order, seed: cfg.seed },
      a,
    );
  }
  channels.push(...unitChannels(targets, influence, props, base, span));
  return { channels, issues: [] };
}

function num_(v: unknown): number {
  return typeof v === "number" ? v : parseFloat(String(v));
}

function cleanProps(o: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!o) return {};
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));
}

/** Count numeric words up from 0 to their value. */
function counterChannels(table: UnitTable, a: number, dur: number, ease: string): Channel[] {
  const e = parseEase(ease);
  const out: Channel[] = [];
  table.word.forEach((wid, i) => {
    const raw = table.wordText?.[i] ?? "";
    const m = raw.match(/^([^\d-]*)(-?[\d,]*\.?\d+)([^\d]*)$/);
    if (!m) return;
    const num = parseFloat(m[2]!.replace(/,/g, ""));
    const decimals = (m[2]!.split(".")[1] ?? "").length;
    const grouped = m[2]!.includes(",");
    const fmt = (v: number) => {
      const s = v.toFixed(decimals);
      return `${m[1]}${grouped ? Number(s).toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) : s}${m[3]}`;
    };
    const span: [number, number] = [a, a + dur];
    out.push({
      target: `#${wid}`,
      prop: "text",
      signal: exprSignal(
        (t) => fmt(num * e(clamp01((t - a) / Math.max(1e-6, dur)))),
        "discrete",
        span,
      ),
      span,
      format: (v) => String(v),
    });
  });
  return out;
}
