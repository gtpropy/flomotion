import type { Ease } from "../values/ease.js";
import type { Time } from "../values/time.js";

/** How a curve arrives at (`in`) or leaves (`out`) a keyframe. */
export type Handle = { ease: Ease } | { speed: number; influence: number };

export type InterpMode = "linear" | "hold" | "bezier" | "auto" | "continuous" | "ease";

export interface KeyframeObject<T> {
  /** Local time (relative to the parent Scene). */
  t: Time;
  v: T;
  in?: Handle;
  out?: Handle;
  hold?: boolean;
  label?: string;
}

/** Short form: `[time, value, ease?]`. The ease describes how the value ARRIVES at this key. */
export type KeyTuple<T> = [time: Time, value: T] | [time: Time, value: T, ease: Ease];
export type Keyframe<T> = KeyTuple<T> | KeyframeObject<T>;

/** Optional options carried by a keyframe list written as an object. */
export interface KeyframeTrack<T> {
  keys: Keyframe<T>[];
  mode?: InterpMode;
  spatial?: "linear" | "bezier" | "auto";
  orient?: "path";
  separate?: boolean;
  loop?: "cycle" | "pingpong" | number;
  /** Sidecar reference, e.g. "./promo.keys.json#t1.position". */
  keysRef?: string;
}

/** Evaluation context handed to expressions. `t` is local seconds. */
export interface Ctx {
  t: number;
  fps: number;
  /** Keyframed value for this property, when keys and an expression share it. */
  value: unknown;
  /** Read another element's prop at the same time: ctx.prop("#hero.opacity"). */
  prop(ref: string): unknown;
  /** Seeded smooth noise in [-1,1] at the current time: noise1D(t * freq, seed). */
  noise(seed?: number, freq?: number): number;
  /** Time in seconds of beat n (needs a tempo on the Composition or a beat map). */
  beat(n: number): number;
  /** Word timing from a Voiceover: ctx.word("vo", 3).start. */
  word(voiceId: string, i: number): { w: string; start: number; end: number };
  lerp(a: number, b: number, t: number): number;
  clamp(v: number, lo: number, hi: number): number;
  smoothstep(e0: number, e1: number, x: number): number;
  remap(v: number, inLo: number, inHi: number, outLo: number, outHi: number): number;
  spring(t: number, opts?: { stiffness?: number; damping?: number; mass?: number }): number;
}

export type Expr<T> = (t: number, ctx: Ctx) => T;

/** Partial per-axis animation for vector props (`separate`). */
export type SeparateVec<T extends number[]> = Partial<Record<"x" | "y" | "z", Animatable<number>>> & {
  __separate?: T;
};

export type Animatable<T> = T | Keyframe<T>[] | KeyframeTrack<T> | Expr<T>;

/** A keyframe after time resolution: seconds, normalised handles. */
export interface NormKey<T> {
  t: number;
  v: T;
  ease?: Ease;
  in?: Handle;
  out?: Handle;
  hold?: boolean;
  label?: string;
}

export interface NormTrack<T> {
  keys: NormKey<T>[];
  mode: InterpMode;
  spatial: "linear" | "bezier" | "auto";
  orient?: "path";
  loop?: "cycle" | "pingpong" | number;
}
