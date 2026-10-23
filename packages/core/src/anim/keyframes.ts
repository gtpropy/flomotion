import { CodeCutError } from "../errors.js";
import { cubicBezier, lerp, parseEase, type EaseFn } from "../values/ease.js";
import { lerpColor, parseColor, toCss, type RGBA } from "../values/color.js";
import { parseTimeLiteral, snapToFrame, type Time } from "../values/time.js";
import type {
  Handle,
  InterpMode,
  Keyframe,
  KeyframeObject,
  KeyframeTrack,
  NormKey,
  NormTrack,
} from "./types.js";

export type ValueKind = "number" | "vec" | "color" | "discrete";

const isObj = (x: unknown): x is Record<string, unknown> =>
  typeof x === "object" && x !== null && !Array.isArray(x);

/** Is this raw prop value a keyframe list/track (as opposed to a plain value)? */
export function isKeyframes(x: unknown): x is Keyframe<unknown>[] | KeyframeTrack<unknown> {
  if (isObj(x) && Array.isArray((x as any).keys) && typeof x !== "function") return true;
  if (!Array.isArray(x) || x.length === 0) return false;
  return x.every(
    (k) =>
      (Array.isArray(k) && k.length >= 2 && k.length <= 3 && isTimeLike(k[0])) ||
      (isObj(k) && "t" in k && "v" in k),
  );
}

const isTimeLike = (x: unknown) => typeof x === "number" || typeof x === "string";

export interface NormalizeOpts {
  fps: number;
  /** Resolve non-literal times ("#t1.end+0.2", "@marker:x", words, beats). Defaults to literal only. */
  resolveTime?: (t: Time) => number;
  snap?: boolean;
  defaultMode?: InterpMode;
}

/** Turn authoring keyframes into sorted, validated seconds-based keys. */
export function normalizeTrack<T>(
  raw: Keyframe<T>[] | KeyframeTrack<T>,
  opts: NormalizeOpts,
): NormTrack<T> {
  const track: KeyframeTrack<T> = Array.isArray(raw) ? { keys: raw } : raw;
  const resolve = opts.resolveTime ?? ((t: Time) => parseTimeLiteral(t, opts.fps));
  const keys: NormKey<T>[] = track.keys.map((k) => {
    const o: KeyframeObject<T> & { ease?: string } = Array.isArray(k)
      ? { t: k[0], v: k[1], ...(k[2] !== undefined ? { ease: k[2] } : {}) }
      : (k as KeyframeObject<T>);
    let t = resolve(o.t);
    if (opts.snap !== false) t = snapToFrame(t, opts.fps);
    const nk: NormKey<T> = { t, v: o.v };
    if ("ease" in o && typeof o.ease === "string") nk.ease = o.ease;
    if (o.in) nk.in = o.in;
    if (o.out) nk.out = o.out;
    if (o.hold) nk.hold = true;
    if (o.label) nk.label = o.label;
    return nk;
  });
  keys.sort((a, b) => a.t - b.t);
  for (let i = 1; i < keys.length; i++) {
    if (keys[i]!.t === keys[i - 1]!.t) {
      throw new CodeCutError(
        "duplicate_keyframe",
        `Two keyframes share time ${keys[i]!.t}s on one property`,
        { fix: "Give each keyframe on a property a unique time (move one by at least one frame)." },
      );
    }
  }
  return {
    keys,
    mode: track.mode ?? opts.defaultMode ?? "linear",
    spatial: track.spatial ?? "auto",
    orient: track.orient,
    loop: track.loop,
  };
}

/** Wrap time for looping tracks. Returns the time to evaluate at. */
function loopTime(track: NormTrack<unknown>, t: number): number {
  const ks = track.keys;
  if (!track.loop || ks.length < 2) return t;
  const t0 = ks[0]!.t;
  const d = ks[ks.length - 1]!.t - t0;
  if (d <= 0 || t <= t0) return t;
  const cycles = typeof track.loop === "number" ? track.loop : Infinity;
  const elapsed = t - t0;
  if (elapsed >= cycles * d) return t0 + d; // finite loops end holding the last value
  const n = Math.floor(elapsed / d);
  const rem = elapsed - n * d;
  if (track.loop === "pingpong") return t0 + (n % 2 === 0 ? rem : d - rem);
  return t0 + rem;
}

/** Hermite basis on [0,1]. */
const hermite = (p: number, p0: number, p1: number, m0: number, m1: number) => {
  const p2 = p * p;
  const p3 = p2 * p;
  return (2 * p3 - 3 * p2 + 1) * p0 + (p3 - 2 * p2 + p) * m0 + (-2 * p3 + 3 * p2) * p1 + (p3 - p2) * m1;
};

/** Fritsch–Carlson monotone slopes (units per second): smooth, no overshoot. */
function monotoneSlopes(ts: number[], vs: number[]): number[] {
  const n = ts.length;
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) d.push((vs[i + 1]! - vs[i]!) / (ts[i + 1]! - ts[i]!));
  const m: number[] = new Array(n).fill(0);
  m[0] = d[0] ?? 0;
  m[n - 1] = d[n - 2] ?? 0;
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
  return m;
}

/** Catmull-Rom slopes (units per second): smooth, may overshoot. */
function catmullSlopes(ts: number[], vs: number[]): number[] {
  const n = ts.length;
  const m: number[] = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    const a = Math.max(0, i - 1);
    const b = Math.min(n - 1, i + 1);
    m[i] = b === a ? 0 : (vs[b]! - vs[a]!) / (ts[b]! - ts[a]!);
  }
  return m;
}

function segmentEase(a: NormKey<unknown>, b: NormKey<unknown>, dv: number): EaseFn | null {
  const h = (x?: Handle) => (x && "ease" in x ? parseEase(x.ease) : null);
  const inE = h(b.in);
  if (inE) return inE;
  if (b.ease) return parseEase(b.ease);
  const outE = h(a.out);
  if (outE) return outE;
  const outS = a.out && "speed" in a.out ? a.out : null;
  const inS = b.in && "speed" in b.in ? b.in : null;
  if (outS || inS) {
    const dur = b.t - a.t;
    const x1 = outS ? clamp01(outS.influence / 100) : 1 / 3;
    const y1 = outS && dv !== 0 ? (x1 * outS.speed * dur) / dv : x1;
    const x2 = inS ? 1 - clamp01(inS.influence / 100) : 2 / 3;
    const y2 = inS && dv !== 0 ? 1 - ((1 - x2) * inS.speed * dur) / dv : x2;
    return cubicBezier(x1, y1, x2, y2);
  }
  return null;
}
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

function findSegment(keys: NormKey<unknown>[], t: number): number {
  // index i such that keys[i].t <= t < keys[i+1].t (binary search)
  let lo = 0;
  let hi = keys.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (keys[mid]!.t <= t) lo = mid;
    else hi = mid;
  }
  return lo;
}

interface Cache {
  slopes?: number[][];
}
const caches = new WeakMap<NormTrack<any>, Cache>();

function numSlopes(track: NormTrack<any>, comp: number, mode: InterpMode): number[] {
  const c = caches.get(track) ?? {};
  caches.set(track, c);
  c.slopes ??= [];
  const key = comp + (mode === "auto" ? 0 : 100);
  if (!c.slopes[key]) {
    const ts = track.keys.map((k) => k.t);
    const vs = track.keys.map((k) => (comp < 0 ? (k.v as number) : (k.v as number[])[comp]!));
    c.slopes[key] = mode === "auto" ? monotoneSlopes(ts, vs) : catmullSlopes(ts, vs);
  }
  return c.slopes[key]!;
}

/** Evaluate a numeric track at local time t. */
export function evalNumber(track: NormTrack<number>, tIn: number): number {
  const ks = track.keys;
  if (ks.length === 0) throw new CodeCutError("invalid_value", "Keyframe track has no keys");
  const t = loopTime(track, tIn);
  if (t <= ks[0]!.t || ks.length === 1) return ks[0]!.v;
  const last = ks[ks.length - 1]!;
  if (t >= last.t) return last.v;
  const i = findSegment(ks, t);
  const a = ks[i]!;
  const b = ks[i + 1]!;
  if (a.hold || track.mode === "hold") return a.v;
  const p = (t - a.t) / (b.t - a.t);
  const e = segmentEase(a, b, b.v - a.v);
  if (e) return lerp(a.v, b.v, e(p));
  if (track.mode === "auto" || track.mode === "continuous") {
    const m = numSlopes(track, -1, track.mode);
    return hermite(p, a.v, b.v, m[i]! * (b.t - a.t), m[i + 1]! * (b.t - a.t));
  }
  return lerp(a.v, b.v, p);
}

/** Evaluate a vector track (Vec2/Vec3) at local time t. */
export function evalVec(track: NormTrack<number[]>, tIn: number): number[] {
  const ks = track.keys;
  if (ks.length === 0) throw new CodeCutError("invalid_value", "Keyframe track has no keys");
  const t = loopTime(track, tIn);
  if (t <= ks[0]!.t || ks.length === 1) return [...ks[0]!.v];
  const last = ks[ks.length - 1]!;
  if (t >= last.t) return [...last.v];
  const i = findSegment(ks, t);
  const a = ks[i]!;
  const b = ks[i + 1]!;
  if (a.hold || track.mode === "hold") return [...a.v];
  const p = (t - a.t) / (b.t - a.t);
  const dim = a.v.length;
  const e = segmentEase(a, b, 1);
  const pe = e ? e(p) : p;
  if (track.spatial === "linear") return a.v.map((x, c) => lerp(x, b.v[c]!, pe));
  // spatial path: Catmull-Rom through key positions, parameterised by key index, eased in time
  const pts = ks.map((k) => k.v);
  const p0 = pts[Math.max(0, i - 1)]!;
  const p1 = a.v;
  const p2 = b.v;
  const p3 = pts[Math.min(pts.length - 1, i + 2)]!;
  const out: number[] = [];
  for (let c = 0; c < dim; c++) {
    const m1 = (p2[c]! - p0[c]!) / 2;
    const m2 = (p3[c]! - p1[c]!) / 2;
    out.push(hermite(pe, p1[c]!, p2[c]!, m1, m2));
  }
  return out;
}

/** Heading in degrees of the spatial path at t (for `orient="path"`). */
export function pathAngle(track: NormTrack<number[]>, t: number, eps = 1 / 240): number {
  const a = evalVec(track, t - eps);
  const b = evalVec(track, t + eps);
  return (Math.atan2(b[1]! - a[1]!, b[0]! - a[0]!) * 180) / Math.PI;
}

/** Evaluate a color track; returns a CSS color string. */
export function evalColor(track: NormTrack<string>, tIn: number): string {
  const ks = track.keys;
  const t = loopTime(track, tIn);
  if (t <= ks[0]!.t || ks.length === 1) return ks[0]!.v;
  const last = ks[ks.length - 1]!;
  if (t >= last.t) return last.v;
  const i = findSegment(ks, t);
  const a = ks[i]!;
  const b = ks[i + 1]!;
  if (a.hold || track.mode === "hold") return a.v;
  const p = (t - a.t) / (b.t - a.t);
  const e = segmentEase(a, b, 1);
  const ca: RGBA = parseColor(a.v);
  const cb: RGBA = parseColor(b.v);
  return toCss(lerpColor(ca, cb, e ? e(p) : p));
}

/** Discrete values (strings, booleans): hold the left key's value. */
export function evalDiscrete<T>(track: NormTrack<T>, tIn: number): T {
  const ks = track.keys;
  const t = loopTime(track, tIn);
  if (t < ks[0]!.t || ks.length === 1) return ks[0]!.v;
  return ks[findSegment(ks, t) + (t >= ks[ks.length - 1]!.t ? 1 : 0)]!.v;
}

export function evalTrack(track: NormTrack<any>, t: number, kind: ValueKind): any {
  switch (kind) {
    case "number":
      return evalNumber(track, t);
    case "vec":
      return evalVec(track, t);
    case "color":
      return evalColor(track, t);
    default:
      return evalDiscrete(track, t);
  }
}

/** Time span covered by a track's keys (for baking). */
export const trackSpan = (track: NormTrack<unknown>): [number, number] => [
  track.keys[0]!.t,
  track.keys[track.keys.length - 1]!.t,
];
