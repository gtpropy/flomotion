import {
  bool,
  defineEffect,
  enumOf,
  exprSignal,
  group,
  int,
  length,
  motionContribution,
  motionFields,
  noise1D,
  num,
  parseEase,
  resolveLength,
  text,
  time,
  type Offset,
  type RenderCtx,
  type Signal,
  type SoundCue,
} from "@codecut/core";
import { round } from "./util.js";

// ---------- pure math (also used by tests and docs) ----------

export interface ShakeParams {
  amp: number;
  freq: number;
  decay: number;
  seed?: number;
}
export interface ThudParams {
  amp: number;
  freq: number;
  damping: number;
}

/** Decaying noise: amp * e^(-decay t) * noise(t * freq). */
export const shake = (t: number, { amp, freq, decay, seed = 1 }: ShakeParams) =>
  amp * Math.exp(-decay * t) * noise1D(t * freq, seed);

/** Damped oscillation: amp * e^(-damping t) * cos(2π freq t). */
export const thud = (t: number, { amp, freq, damping }: ThudParams) =>
  amp * Math.exp(-damping * t) * Math.cos(2 * Math.PI * freq * t);

/** Seconds until an exponential envelope falls below 0.1%. */
export const settleTime = (rate: number) => (rate > 0 ? Math.log(1000) / rate : 1);

// ---------- helpers ----------

/** Default sound control: names the tag an impact wants; set to "" to silence. */
const soundControl = (tag: string) =>
  text({
    default: tag,
    sound: tag,
    description: `Sound tag for autoSound (default ${tag}); "" disables.`,
  });

const win = (rc: RenderCtx, dur?: number): [number, number] => {
  const a = rc.node.start;
  return [
    a,
    dur === undefined
      ? Math.min(rc.node.end, rc.node.parent?.end ?? rc.node.end)
      : Math.min(a + dur, rc.node.end),
  ];
};

const cue = (rc: RenderCtx, tag: string | undefined, at = rc.node.start): SoundCue[] =>
  tag ? [{ tag, at, source: rc.id }] : [];

const sig = (
  rc: RenderCtx,
  span: [number, number],
  fn: (tau: number) => number,
): Signal<number> => {
  const start = rc.node.start;
  return exprSignal(
    (t) => (t < start ? fn(0) : t > span[1] ? fn(span[1] - start) : fn(t - start)),
    "number",
    span,
  );
};

const off = (prop: Offset["prop"], mode: Offset["mode"], signal: Signal<number>): Offset => ({
  prop,
  mode,
  signal,
});

const durationOf = (p: { duration?: number }, rate: number, floor = 0.2) =>
  p.duration ?? Math.max(floor, settleTime(rate));

// ---------- impact effects ----------

export const Shake = defineEffect("Shake", {
  category: "impact",
  description:
    "Decaying noise shake of the parent: x, y and optional rotation. Deterministic (seeded noise of time).",
  sound: "hit/punch",
  controls: {
    amp: num({ min: 0, max: 400, default: 12, unit: "px" }),
    freq: num({ min: 0.1, max: 120, default: 14, unit: "Hz" }),
    decay: num({ min: 0, max: 60, default: 5, description: "Envelope e^(-decay·t)." }),
    axes: enumOf(["x", "y", "xy"], { default: "xy" }),
    seed: int({ default: 1 }),
    rotation: num({
      min: 0,
      max: 45,
      default: 0,
      unit: "deg",
      description: "Rotational shake amplitude.",
    }),
    sound: soundControl("hit/punch"),
  },
  apply: (p, rc) => {
    const dur = durationOf(p as { duration?: number }, p.decay);
    const span = win(rc, dur);
    const params = { amp: p.amp, freq: p.freq, decay: p.decay };
    const offsets: Offset[] = [];
    if (p.axes.includes("x"))
      offsets.push(
        off(
          "x",
          "add",
          sig(rc, span, (t) => shake(t, { ...params, seed: p.seed })),
        ),
      );
    if (p.axes.includes("y"))
      offsets.push(
        off(
          "y",
          "add",
          sig(rc, span, (t) => shake(t, { ...params, seed: p.seed + 101 })),
        ),
      );
    if (p.rotation > 0)
      offsets.push(
        off(
          "rotation",
          "add",
          sig(rc, span, (t) =>
            shake(t, { amp: p.rotation, freq: p.freq, decay: p.decay, seed: p.seed + 202 }),
          ),
        ),
      );
    return { offsets, sounds: cue(rc, p.sound) };
  },
});

const thudControls = () => ({
  amp: num({ min: 0, max: 600, default: 28, unit: "px" }),
  freq: num({ min: 0.1, max: 30, default: 3, unit: "Hz" }),
  damping: num({ min: 0, max: 60, default: 6 }),
  axis: enumOf(["x", "y"], { default: "y" }),
  squash: num({
    min: 0,
    max: 0.5,
    default: 0.06,
    step: 0.005,
    description: "Scale squash along the impact axis.",
  }),
  sound: soundControl("hit/land"),
});

const thudApply = (p: any, rc: RenderCtx) => {
  const span = win(rc, durationOf(p, p.damping));
  const g = (t: number) => thud(t, { amp: p.amp, freq: p.freq, damping: p.damping });
  const offsets: Offset[] = [off(p.axis === "y" ? "y" : "x", "add", sig(rc, span, g))];
  if (p.squash > 0 && p.amp > 0) {
    const env = (t: number) => g(t) / p.amp;
    const along = p.axis === "y" ? "scaleY" : "scaleX";
    const across = p.axis === "y" ? "scaleX" : "scaleY";
    offsets.push(
      off(
        along,
        "mul",
        sig(rc, span, (t) => 1 - p.squash * env(t)),
      ),
    );
    offsets.push(
      off(
        across,
        "mul",
        sig(rc, span, (t) => 1 + p.squash * 0.5 * env(t)),
      ),
    );
  }
  return { offsets, sounds: cue(rc, p.sound) };
};

export const Thud = defineEffect("Thud", {
  category: "impact",
  description:
    "A landing: damped oscillation along an axis with squash. y = amp·e^(-damping·t)·cos(2π·freq·t).",
  sound: "hit/land",
  controls: thudControls(),
  apply: thudApply,
});

export const Impact = defineEffect("Impact", {
  category: "impact",
  description: "Alias of Thud with a heavier default feel.",
  sound: "hit/land",
  controls: {
    ...thudControls(),
    amp: num({ min: 0, max: 600, default: 40, unit: "px" }),
    damping: num({ min: 0, max: 60, default: 5 }),
  },
  apply: thudApply,
});

export const PunchZoom = defineEffect("PunchZoom", {
  category: "impact",
  description: "A quick scale punch that settles: scale = 1 + amount·e^(-decay·t).",
  sound: "hit/punch",
  controls: {
    amount: num({ min: -1, max: 2, default: 0.12, step: 0.01 }),
    decay: num({ min: 0.5, max: 60, default: 9 }),
    sound: soundControl("hit/punch"),
  },
  apply: (p, rc) => {
    const span = win(rc, durationOf(p as { duration?: number }, p.decay));
    return {
      offsets: [
        off(
          "scale",
          "mul",
          sig(rc, span, (t) => 1 + p.amount * Math.exp(-p.decay * t)),
        ),
      ],
      sounds: cue(rc, p.sound),
    };
  },
});

export const Slam = defineEffect("Slam", {
  category: "impact",
  description: "Drops in fast from above (ease-in), lands with a thud, squash and settle.",
  sound: "hit/boom",
  controls: {
    distance: length({ default: 700, description: "Fall distance." }),
    fall: time({ min: 0.05, max: 2, default: 0.22, unit: "s" }),
    ease: text({ default: "expo.in" }),
    amp: num({
      min: 0,
      max: 400,
      default: 30,
      unit: "px",
      description: "Landing bounce amplitude.",
    }),
    freq: num({ min: 0.1, max: 30, default: 3.5 }),
    damping: num({ min: 0, max: 60, default: 7 }),
    squash: num({ min: 0, max: 0.5, default: 0.1, step: 0.005 }),
    sound: soundControl("hit/boom"),
  },
  apply: (p, rc) => {
    const fall = typeof p.fall === "number" ? p.fall : parseFloat(String(p.fall));
    const dist = resolveLength(p.distance, {
      parent: rc.node.box[1],
      vw: rc.comp.width,
      vh: rc.comp.height,
    });
    const e = parseEase(p.ease);
    const span = win(rc, fall + Math.max(0.3, settleTime(p.damping)));
    const bounce = (t: number) =>
      -p.amp * Math.exp(-p.damping * t) * Math.abs(Math.sin(2 * Math.PI * p.freq * t));
    const env = (t: number) =>
      Math.exp(-p.damping * t) * Math.abs(Math.cos(2 * Math.PI * p.freq * t));
    return {
      offsets: [
        off(
          "y",
          "add",
          sig(rc, span, (t) => (t < fall ? -dist * (1 - e(t / fall)) : bounce(t - fall))),
        ),
        off(
          "scaleY",
          "mul",
          sig(rc, span, (t) => (t < fall ? 1 : 1 - p.squash * env(t - fall))),
        ),
        off(
          "scaleX",
          "mul",
          sig(rc, span, (t) => (t < fall ? 1 : 1 + p.squash * 0.6 * env(t - fall))),
        ),
      ],
      sounds: cue(rc, p.sound, rc.node.start + fall),
    };
  },
});

export const SquashStretch = defineEffect("SquashStretch", {
  category: "impact",
  description: "Volume-preserving squash and stretch oscillation (sy = 1 + a·env·cos, sx = 1/√sy).",
  sound: "ui/pop",
  controls: {
    amount: num({ min: 0, max: 0.9, default: 0.22, step: 0.01 }),
    freq: num({ min: 0.1, max: 30, default: 3.5 }),
    damping: num({ min: 0, max: 60, default: 6 }),
    sound: soundControl("ui/pop"),
  },
  apply: (p, rc) => {
    const span = win(rc, durationOf(p as { duration?: number }, p.damping));
    const sy = (t: number) =>
      1 + p.amount * Math.exp(-p.damping * t) * Math.cos(2 * Math.PI * p.freq * t);
    return {
      offsets: [
        off("scaleY", "mul", sig(rc, span, sy)),
        off(
          "scaleX",
          "mul",
          sig(rc, span, (t) => 1 / Math.sqrt(sy(t))),
        ),
      ],
      sounds: cue(rc, p.sound),
    };
  },
});

export const Wobble = defineEffect("Wobble", {
  category: "impact",
  description: "Damped rotational wobble: rot = amp·e^(-damping·t)·sin(2π·freq·t).",
  sound: "ui/tick",
  controls: {
    amp: num({ min: 0, max: 90, default: 8, unit: "deg" }),
    freq: num({ min: 0.1, max: 30, default: 3 }),
    damping: num({ min: 0, max: 60, default: 4 }),
    sound: soundControl("ui/tick"),
  },
  apply: (p, rc) => {
    const span = win(rc, durationOf(p as { duration?: number }, p.damping));
    return {
      offsets: [
        off(
          "rotation",
          "add",
          sig(
            rc,
            span,
            (t) => p.amp * Math.exp(-p.damping * t) * Math.sin(2 * Math.PI * p.freq * t),
          ),
        ),
      ],
      sounds: cue(rc, p.sound),
    };
  },
});

export const WhipPan = defineEffect("WhipPan", {
  category: "impact",
  description:
    "A fast whip move with motion blur: the layer swings in from (or out toward) a side.",
  sound: "move/whip",
  controls: {
    direction: enumOf(["e", "w", "n", "s"], { default: "e" }),
    mode: enumOf(["in", "out"], { default: "in" }),
    distance: length({ default: "100vw" }),
    whip: time({ min: 0.05, max: 2, default: 0.35, unit: "s" }),
    ease: text({ default: "expo.inOut" }),
    blur: num({ min: 0, max: 120, default: 36, unit: "px" }),
    sound: soundControl("move/whip"),
  },
  apply: (p, rc) => {
    const d = typeof p.whip === "number" ? p.whip : parseFloat(String(p.whip));
    const span = win(rc, d);
    const e = parseEase(p.ease);
    const horizontal = p.direction === "e" || p.direction === "w";
    const dist = resolveLength(p.distance, {
      parent: rc.node.box[horizontal ? 0 : 1],
      vw: rc.comp.width,
      vh: rc.comp.height,
    });
    const sign = p.direction === "e" || p.direction === "s" ? 1 : -1;
    const k = (t: number) => {
      const q = Math.min(1, Math.max(0, t / d));
      return p.mode === "in" ? 1 - e(q) : e(q);
    };
    return {
      offsets: [
        off(
          horizontal ? "x" : "y",
          "add",
          sig(rc, span, (t) => -sign * dist * k(t)),
        ),
      ],
      filters: [
        exprSignal(
          (t) => {
            const q = Math.min(1, Math.max(0, (t - rc.node.start) / d));
            const b = Math.sin(q * Math.PI) * p.blur;
            return t >= span[0] && t <= span[1] && b > 0.05 ? `blur(${round(b, 1)}px)` : "";
          },
          "discrete",
          span,
        ),
      ],
      sounds: cue(rc, p.sound),
    };
  },
});

export const Glitch = defineEffect("Glitch", {
  category: "impact",
  description:
    "Seeded digital glitch: jittering offset and skew, flicker and hue flips. Changes every other frame.",
  sound: "tech/glitch",
  controls: {
    amount: num({ min: 0, max: 3, default: 1, step: 0.05 }),
    seed: int({ default: 3 }),
    hold: int({ min: 1, max: 8, default: 2, description: "Frames each glitch state is held." }),
    sound: soundControl("tech/glitch"),
  },
  apply: (p, rc) => {
    const span = win(rc, undefined);
    const dur = rc.node.end - rc.node.start || 0.4;
    const span2: [number, number] = [rc.node.start, rc.node.start + dur];
    void span;
    const step = (t: number) => Math.floor(((t - rc.node.start) * rc.fps) / p.hold);
    const env = (t: number) => Math.max(0, 1 - (t - rc.node.start) / dur);
    const s = (fn: (t: number) => number) =>
      exprSignal((t) => (t >= span2[0] && t < span2[1] ? fn(t) : 0), "number", span2);
    return {
      offsets: [
        off(
          "x",
          "add",
          s((t) => noise1D(step(t) * 3.7, p.seed) * 48 * p.amount * env(t)),
        ),
        off(
          "skewX",
          "add",
          s((t) => noise1D(step(t) * 2.1, p.seed + 1) * 10 * p.amount * env(t)),
        ),
        off(
          "opacity",
          "mul",
          exprSignal(
            (t) =>
              t >= span2[0] && t < span2[1] && noise1D(step(t) * 5.3, p.seed + 2) > 0.7 ? 0.35 : 1,
            "number",
            span2,
          ),
        ),
      ],
      filters: [
        exprSignal(
          (t) =>
            t >= span2[0] && t < span2[1]
              ? `hue-rotate(${Math.round(noise1D(step(t) * 1.9, p.seed + 3) * 120 * p.amount * env(t))}deg)`
              : "",
          "discrete",
          span2,
        ),
      ],
      sounds: cue(rc, p.sound),
    };
  },
});

export const RGBSplit = defineEffect("RGBSplit", {
  category: "impact",
  description:
    "Chromatic aberration: red and blue channels offset in opposite directions. `decay` fades it out.",
  sound: "tech/glitch",
  controls: {
    amount: num({ animatable: true, min: 0, max: 100, default: 10, unit: "px" }),
    angle: num({ min: -180, max: 180, default: 0, unit: "deg" }),
    decay: num({ min: 0, max: 60, default: 0 }),
    sound: soundControl("tech/glitch"),
  },
  apply: (p, rc) => {
    const id = `${rc.id}-rgb`;
    const a = rc.node.start;
    const b = rc.node.end;
    const amt = rc.node.props.amount as Signal<number>;
    const rad = (p.angle * Math.PI) / 180;
    const k = (t: number) =>
      t >= a && t < b
        ? (evalAmt(amt, t) as number) * (p.decay > 0 ? Math.exp(-p.decay * (t - a)) : 1)
        : 0;
    const dx = (sgn: number) => (t: number) => round(sgn * k(t) * Math.cos(rad), 3);
    const dy = (sgn: number) => (t: number) => round(sgn * k(t) * Math.sin(rad), 3);
    const ch = (m: string) => `<feColorMatrix in="SourceGraphic" type="matrix" values="${m}"/>`;
    const defs = `<filter id="${id}" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">${ch("1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0").replace("/>", ' result="r"/>')}<feOffset id="${id}-r" in="r" dx="0" dy="0" result="ro"/>${ch("0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0").replace("/>", ' result="g"/>')}${ch("0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0").replace("/>", ' result="b"/>')}<feOffset id="${id}-b" in="b" dx="0" dy="0" result="bo"/><feBlend in="ro" in2="g" mode="screen" result="rg"/><feBlend in="rg" in2="bo" mode="screen"/></filter>`;
    const num_ = (fn: (t: number) => number) => exprSignal(fn, "number", [a, b]);
    return {
      defs,
      filters: [exprSignal((t) => (t >= a && t < b ? `url(#${id})` : ""), "discrete", [a, b])],
      channels: [
        { target: `#${id}-r`, prop: "attr:dx", signal: num_(dx(1)), span: [a, b] },
        { target: `#${id}-r`, prop: "attr:dy", signal: num_(dy(1)), span: [a, b] },
        { target: `#${id}-b`, prop: "attr:dx", signal: num_(dx(-1)), span: [a, b] },
        { target: `#${id}-b`, prop: "attr:dy", signal: num_(dy(-1)), span: [a, b] },
      ],
      sounds: cue(rc, p.sound),
    };
  },
});
import { evalSignal as evalAmt } from "@codecut/core";

export const Pulse = defineEffect("Pulse", {
  category: "impact",
  description:
    "Repeating scale pulses: scale = 1 + amp·sin²(π·freq·t) for `count` beats (or until the parent ends when count is 0).",
  sound: "ui/tick",
  controls: {
    amp: num({ min: 0, max: 1, default: 0.06, step: 0.005 }),
    freq: num({ min: 0.1, max: 30, default: 2, unit: "Hz" }),
    count: int({ min: 0, max: 64, default: 4 }),
    sound: soundControl("ui/tick"),
  },
  apply: (p, rc) => {
    const dur = p.count > 0 ? p.count / p.freq : rc.node.end - rc.node.start;
    const span = win(rc, dur);
    return {
      offsets: [
        off(
          "scale",
          "mul",
          sig(rc, span, (t) => (t >= dur ? 1 : 1 + p.amp * Math.sin(Math.PI * p.freq * t) ** 2)),
        ),
      ],
      sounds:
        p.count > 0
          ? (Array.from(
              { length: p.count },
              (_, i) => cue(rc, p.sound, rc.node.start + i / p.freq)[0],
            ).filter(Boolean) as SoundCue[])
          : cue(rc, p.sound),
    };
  },
});

export const Hitstop = defineEffect("Hitstop", {
  category: "impact",
  description:
    "Freezes the parent's own animation for a few frames at the hit moment, then resumes (time remap).",
  sound: "hit/punch",
  controls: {
    frames: int({ min: 1, max: 30, default: 4 }),
    sound: soundControl("hit/punch"),
  },
  apply: (p, rc) => {
    const hit = rc.node.start;
    const hold = p.frames / rc.fps;
    return {
      timeRemap: {
        map: (t) => (t < hit ? t : t < hit + hold ? hit : t - hold),
        unmap: (t) => (t <= hit ? t : t + hold),
      },
      sounds: cue(rc, p.sound),
    };
  },
});

// ---------- enter / exit / animate ----------

const motionEffect = (kind: "enter" | "exit") =>
  defineEffect(kind === "enter" ? "Enter" : "Exit", {
    category: "motion",
    description: `${kind === "enter" ? "Entrance" : "Exit"} motion for the parent layer. Same fields as the layer's \`${kind}\` prop.`,
    controls: { ...motionFields() },
    apply: (p, rc) => {
      const parent = rc.node.parent!;
      const span: [number, number] =
        kind === "enter" ? [rc.node.start, parent.end] : [parent.start, rc.node.end];
      const c = motionContribution(
        kind,
        p as any,
        kind === "enter" ? [rc.node.start, parent.end] : [parent.start, rc.node.end],
        {
          parent: Math.max(rc.node.box[0], rc.node.box[1]),
          vw: rc.comp.width,
          vh: rc.comp.height,
        },
      );
      void span;
      return { offsets: c.offsets, filters: c.filters };
    },
  });
export const Enter = motionEffect("enter");
export const Exit = motionEffect("exit");

export const ANIMATE_PROPS = [
  "x",
  "y",
  "z",
  "rotation",
  "rotationX",
  "rotationY",
  "scale",
  "scaleX",
  "scaleY",
  "skewX",
  "skewY",
  "opacity",
  "blur",
] as const;

export const Animate = defineEffect("Animate", {
  category: "motion",
  description:
    "Animates one transform property of the parent from `from` to `to`. Position, rotation and skew are added to the layer's own values; scale and opacity multiply them.",
  controls: {
    prop: enumOf(ANIMATE_PROPS, { default: "opacity" }),
    from: num({ default: 0 }),
    to: num({ default: 1 }),
    ease: text({ default: "expo.out" }),
    delay: time({ default: 0, unit: "s" }),
    hold: bool({
      default: true,
      description: "Stay at `to` afterwards (otherwise return to `from`).",
    }),
  },
  apply: (p, rc) => {
    const delay = typeof p.delay === "number" ? p.delay : parseFloat(String(p.delay));
    const a = rc.node.start + delay;
    const b = rc.node.end;
    const e = parseEase(p.ease);
    const v = (t: number) => {
      const q = b > a ? Math.min(1, Math.max(0, (t - a) / (b - a))) : 1;
      const k = p.hold ? e(q) : e(q) * 0 + (q >= 1 ? 0 : e(q));
      return p.from + (p.to - p.from) * k;
    };
    const s = exprSignal(v, "number", [a, b]);
    if (p.prop === "blur") {
      return {
        filters: [
          exprSignal((t) => (v(t) > 0.01 ? `blur(${round(v(t), 2)}px)` : ""), "discrete", [a, b]),
        ],
      };
    }
    const mul = ["scale", "scaleX", "scaleY", "opacity"].includes(p.prop);
    return { offsets: [off(p.prop as Offset["prop"], mul ? "mul" : "add", s)] };
  },
});

export const motionEffects = [
  Shake,
  Thud,
  Impact,
  PunchZoom,
  Slam,
  SquashStretch,
  Wobble,
  WhipPan,
  Glitch,
  RGBSplit,
  Pulse,
  Hitstop,
  Enter,
  Exit,
  Animate,
];
export { group };
