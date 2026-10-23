import { constant, evalSignal, exprSignal, type Signal } from "../anim/signal.js";
import { parseEase } from "../values/ease.js";
import { resolveLength, type Length, type LengthBasis } from "../values/length.js";
import { parseAngle } from "../values/angle.js";
import type { Offset } from "../schema/render-types.js";

export interface MotionSpec {
  from?: string;
  to?: string;
  distance?: Length;
  ease?: string;
  duration?: number | string;
  delay?: number | string;
  fade?: boolean;
  blur?: number;
  scale?: number;
  rotate?: number | string;
}

const DIR: Record<string, [number, number]> = {
  n: [0, -1],
  ne: [1, -1],
  e: [1, 0],
  se: [1, 1],
  s: [0, 1],
  sw: [-1, 1],
  w: [-1, 0],
  nw: [-1, -1],
};

const secs = (v: number | string | undefined, d: number) =>
  v === undefined ? d : typeof v === "number" ? v : parseFloat(v);

/**
 * Enter/exit motion as pure functions of time. `kind` enter ramps 0→1 over [start+delay, +duration];
 * exit ramps 1→0 over the last `duration` seconds before `end`.
 */
export function motionContribution(
  kind: "enter" | "exit",
  spec: MotionSpec,
  span: [number, number],
  basis: LengthBasis,
): { offsets: Offset[]; filters: Signal<string>[] } {
  const dir = (kind === "enter" ? spec.from : spec.to) ?? "s";
  const duration = Math.max(1e-3, secs(spec.duration, 0.6));
  const delay = secs(spec.delay, 0);
  const ease = parseEase(spec.ease ?? (kind === "enter" ? "expo.out" : "expo.in"));
  const dist = resolveLength(spec.distance ?? 120, basis);
  const fade = spec.fade ?? true;
  const blur = spec.blur ?? 0;
  const scaleEnd = spec.scale ?? 1;
  const rotate = spec.rotate === undefined ? 0 : parseAngle(spec.rotate);
  const [sa, sb] = span;
  // progress `a` of the motion: 0 = fully away, 1 = at rest
  const rest = (t: number): number => {
    if (kind === "enter") {
      const p = (t - (sa + delay)) / duration;
      return p <= 0 ? 0 : p >= 1 ? 1 : ease(p);
    }
    const p = (t - (sb - duration - delay)) / duration;
    // exit eases the move OUT (0 at rest → 1 away), so `rest` = 1 - eased
    return p <= 0 ? 1 : p >= 1 ? 0 : 1 - ease(p);
  };
  const away = (t: number) => 1 - rest(t);
  const span2: [number, number] =
    kind === "enter" ? [sa, sa + delay + duration] : [sb - duration - delay, sb];
  const sig = (fn: (t: number) => number): Signal<number> => exprSignal(fn, "number", span2);
  const offsets: Offset[] = [];
  const v = DIR[dir];
  if (v) {
    const norm = Math.hypot(v[0], v[1]);
    // entering from "sw" means starting at the south-west and moving to rest
    if (v[0] !== 0)
      offsets.push({ prop: "x", mode: "add", signal: sig((t) => (v[0]! / norm) * dist * away(t)) });
    if (v[1] !== 0)
      offsets.push({ prop: "y", mode: "add", signal: sig((t) => (v[1]! / norm) * dist * away(t)) });
  } else if (dir === "z+" || dir === "z-") {
    // z+ comes from the viewer (starts larger), z- from behind (starts smaller); distance 500 = ±100%
    const sign = dir === "z+" ? 1 : -1;
    offsets.push({
      prop: "scale",
      mode: "mul",
      signal: sig((t) => 1 + sign * (dist / 500) * away(t)),
    });
  } else if (dir === "center" && scaleEnd === 1) {
    offsets.push({ prop: "scale", mode: "mul", signal: sig((t) => Math.max(0, rest(t))) });
  }
  if (scaleEnd !== 1)
    offsets.push({ prop: "scale", mode: "mul", signal: sig((t) => 1 + (scaleEnd - 1) * away(t)) });
  if (rotate) offsets.push({ prop: "rotation", mode: "add", signal: sig((t) => rotate * away(t)) });
  if (fade) offsets.push({ prop: "opacity", mode: "mul", signal: sig((t) => rest(t)) });
  const filters: Signal<string>[] = [];
  if (blur > 0) {
    filters.push(
      exprSignal((t) => `blur(${Math.round(blur * away(t) * 100) / 100}px)`, "discrete", span2),
    );
  }
  return { offsets, filters };
}

export { constant, evalSignal };
