import { isExpr, makeCtx, type CtxBase } from "./expr.js";
import { evalTrack, normalizeTrack, isKeyframes, type NormalizeOpts, type ValueKind } from "./keyframes.js";
import type { Expr, NormTrack } from "./types.js";

/**
 * A resolved animatable value. Evaluated at ABSOLUTE composition time `tAbs`:
 * keyframes read time relative to the parent Scene (`keyBase`), expressions read time relative to
 * their own element (`exprBase`), per the spec.
 */
export type Signal<T = any> =
  | { kind: "const"; v: T }
  | { kind: "track"; track: NormTrack<T>; vk: ValueKind; keyBase: number }
  | {
      kind: "expr";
      fn: Expr<T>;
      vk: ValueKind;
      exprBase: number;
      ctx: CtxBase;
      keys?: { track: NormTrack<T>; keyBase: number };
      /** Absolute interval over which the expression can differ from a constant. */
      span?: [number, number];
      /** Compiler-built composite: `fn` takes only t and needs no Ctx. */
      direct?: boolean;
    }
  | { kind: "sep"; parts: Array<Signal<number> | undefined>; fallback: number[] };

export const constant = <T>(v: T): Signal<T> => ({ kind: "const", v });

export function evalSignal<T>(sig: Signal<T>, tAbs: number): T {
  switch (sig.kind) {
    case "const":
      return sig.v;
    case "track":
      return evalTrack(sig.track, tAbs - sig.keyBase, sig.vk);
    case "expr": {
      if (sig.direct) return (sig.fn as (t: number) => T)(tAbs - sig.exprBase);
      const keyed = sig.keys ? evalTrack(sig.keys.track, tAbs - sig.keys.keyBase, sig.vk) : undefined;
      const t = tAbs - sig.exprBase;
      return sig.fn(t, makeCtx(sig.ctx, t, keyed)) as T;
    }
    case "sep":
      return sig.parts.map((p, i) => (p ? evalSignal(p, tAbs) : sig.fallback[i] ?? 0)) as T;
  }
}

export const isConst = (s: Signal): s is Extract<Signal, { kind: "const" }> => s.kind === "const";

/** Time interval over which a signal can change, or null when it is constant. */
export function signalSpan(sig: Signal, elementSpan: [number, number]): [number, number] | null {
  switch (sig.kind) {
    case "const":
      return null;
    case "track": {
      if (sig.track.keys.length < 2) return null;
      const a = sig.track.keys[0]!.t + sig.keyBase;
      let b = sig.track.keys[sig.track.keys.length - 1]!.t + sig.keyBase;
      if (sig.track.loop) b = Math.max(b, elementSpan[1]);
      return [a, b];
    }
    case "expr":
      return sig.span ?? elementSpan;
    case "sep": {
      let lo = Infinity;
      let hi = -Infinity;
      for (const p of sig.parts) {
        const s = p ? signalSpan(p, elementSpan) : null;
        if (s) {
          lo = Math.min(lo, s[0]);
          hi = Math.max(hi, s[1]);
        }
      }
      return lo === Infinity ? null : [lo, hi];
    }
  }
}

export interface BuildSignalOpts extends NormalizeOpts {
  vk: ValueKind;
  keyBase: number;
  exprBase: number;
  ctx: CtxBase;
}

/** Turn a raw authoring value (static, keyframes or expression) into a Signal. */
export function buildSignal<T>(raw: unknown, o: BuildSignalOpts): Signal<T> {
  if (isExpr(raw)) {
    return { kind: "expr", fn: raw as Expr<T>, vk: o.vk, exprBase: o.exprBase, ctx: o.ctx };
  }
  if (isKeyframes(raw)) {
    const track = normalizeTrack<T>(raw as any, o);
    return { kind: "track", track, vk: o.vk, keyBase: o.keyBase };
  }
  return { kind: "const", v: raw as T };
}

const SIGNAL_KINDS = new Set(["const", "track", "expr", "sep"]);
export const isSignal = (v: unknown): v is Signal =>
  typeof v === "object" && v !== null && !Array.isArray(v) && SIGNAL_KINDS.has((v as { kind?: string }).kind ?? "") &&
  ("v" in (v as object) || "track" in (v as object) || "fn" in (v as object) || "parts" in (v as object));

/** Evaluate a resolved prop (Signal, group of Signals, array or plain value) at absolute time t. */
export function evalProp<T = any>(v: unknown, t: number): T {
  if (isSignal(v)) return evalSignal(v, t) as T;
  if (Array.isArray(v)) return v.map((x) => evalProp(x, t)) as T;
  if (v && typeof v === "object") {
    return Object.fromEntries(Object.entries(v as object).map(([k, x]) => [k, evalProp(x, t)])) as T;
  }
  return v as T;
}

/** A pure expression Signal in absolute time (for compiler-built composites). */
export function exprSignal<T>(fn: (tAbs: number) => T, vk: "number" | "vec" | "color" | "discrete", span?: [number, number]): Signal<T> {
  return { kind: "expr", fn: (t) => fn(t), vk, exprBase: 0, ctx: { fps: 30 }, span, direct: true };
}
