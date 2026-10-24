import { exprSignal, type Signal } from "../anim/signal.js";
import type { Channel, Offset } from "../schema/render-types.js";
import type { RNode, ResolvedComp } from "../resolve/types.js";
import { noise1D } from "../values/noise.js";
import { parseEase } from "../values/ease.js";
import { parseColor, toCss } from "../values/color.js";

export interface TransitionSpec {
  type: string;
  duration?: number | string;
  direction?: string;
  color?: string;
  ease?: string;
  intensity?: number;
  name?: string;
}

interface Side {
  offsets: Offset[];
  filters: Signal<string>[];
  channels: Channel[];
}

export interface TransitionPlan {
  incoming: Side;
  outgoing: Side;
  overlays: Array<{ html: string; css?: string; channels: Channel[] }>;
  holdUntil: number;
  issues: string[];
}

const DIRS: Record<string, [number, number]> = {
  n: [0, -1],
  ne: [1, -1],
  e: [1, 0],
  se: [1, 1],
  s: [0, 1],
  sw: [-1, 1],
  w: [-1, 0],
  nw: [-1, -1],
};

const DEFAULT_EASE: Record<string, string> = {
  dissolve: "sine.inOut",
  dipToColor: "sine.inOut",
  wipe: "power2.inOut",
  slide: "expo.inOut",
  push: "expo.inOut",
  flash: "expo.out",
  whipPan: "expo.inOut",
  zoomThrough: "expo.inOut",
  glitch: "linear",
};

const empty = (): Side => ({ offsets: [], filters: [], channels: [] });
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

/** Clip a unit square by the half-plane `a*x + b*y <= c`; returns polygon points in %. */
export function halfPlanePolygon(a: number, b: number, c: number): string {
  const square: Array<[number, number]> = [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
  ];
  const out: Array<[number, number]> = [];
  for (let i = 0; i < 4; i++) {
    const p = square[i]!;
    const q = square[(i + 1) % 4]!;
    const fp = a * p[0] + b * p[1] - c;
    const fq = a * q[0] + b * q[1] - c;
    if (fp <= 0) out.push(p);
    if ((fp < 0 && fq > 0) || (fp > 0 && fq < 0)) {
      const t = fp / (fp - fq);
      out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
    }
  }
  if (out.length < 3) return "polygon(0% 0%, 0% 0%, 0% 0%)";
  return `polygon(${out.map(([x, y]) => `${Math.round(x * 1e4) / 100}% ${Math.round(y * 1e4) / 100}%`).join(", ")})`;
}

/**
 * Plan a transition INTO `scene` from `prev`. The incoming scene animates over its first `duration`
 * seconds while the previous scene holds underneath (its slot is extended until the end of the window).
 */
export function transitionPlan(
  scene: RNode,
  prev: RNode,
  spec: TransitionSpec,
  comp: ResolvedComp,
): TransitionPlan {
  const d = Math.max(
    1 / comp.fps,
    typeof spec.duration === "number" ? spec.duration : parseFloat(String(spec.duration ?? 0.3)),
  );
  const t0 = scene.start;
  const t1 = t0 + d;
  const ease = parseEase(spec.ease ?? DEFAULT_EASE[spec.type] ?? "linear");
  const p = (t: number) => clamp01((t - t0) / d);
  const e = (t: number) => ease(p(t));
  const W = comp.width;
  const H = comp.height;
  const span: [number, number] = [t0, t1];
  const num = (fn: (t: number) => number) => exprSignal(fn, "number", span);
  const str = (fn: (t: number) => string) => exprSignal(fn, "discrete", span);
  const plan: TransitionPlan = {
    incoming: empty(),
    outgoing: empty(),
    overlays: [],
    holdUntil: t1,
    issues: [],
  };
  const dir = DIRS[spec.direction ?? "e"] ?? DIRS.e!;
  const tint = (c: string | undefined, fallback: string) => {
    const raw = c ?? fallback;
    const v = raw.startsWith("$")
      ? ((comp.theme.tokens[raw.slice(1)] as string | undefined) ?? fallback)
      : raw;
    try {
      return toCss(parseColor(v));
    } catch {
      return fallback;
    }
  };
  const overlay = (suffix: string, color: string, opacityAt: (t: number) => number) => {
    const id = `${scene.id}-${suffix}`;
    plan.overlays.push({
      html: `<div id="${id}" class="fm-tx" style="position:absolute;inset:0;background:${color};opacity:0;z-index:9000;pointer-events:none"></div>`,
      channels: [{ target: `#${id}`, prop: "opacity", signal: num(opacityAt), span }],
    });
  };
  const tri = (x: number) => (x < 0.5 ? x * 2 : (1 - x) * 2);

  switch (spec.type) {
    case "dissolve":
      plan.incoming.offsets.push({ prop: "opacity", mode: "mul", signal: num(e) });
      break;
    case "dipToColor":
      plan.incoming.offsets.push({
        prop: "opacity",
        mode: "mul",
        signal: num((t) => (p(t) < 0.5 ? 0 : 1)),
      });
      overlay("dip", tint(spec.color, "#000000"), (t) => ease(tri(p(t))));
      break;
    case "flash":
      plan.incoming.offsets.push({
        prop: "opacity",
        mode: "mul",
        signal: num((t) => (p(t) < 0.35 ? 0 : 1)),
      });
      overlay("flash", tint(spec.color, "#ffffff"), (t) => {
        const x = p(t);
        return x < 0.35
          ? ease(x / 0.35) * (spec.intensity ?? 1)
          : (1 - ease((x - 0.35) / 0.65)) * (spec.intensity ?? 1);
      });
      break;
    case "wipe": {
      // the edge travels toward `direction`; the incoming scene is revealed behind it
      const [dx, dy] = dir;
      const lo = Math.min(0, dx) + Math.min(0, dy);
      const hi = Math.max(0, dx) + Math.max(0, dy);
      plan.incoming.channels.push({
        target: `#${scene.id}`,
        prop: "clipPath",
        span,
        format: (v) => String(v),
        signal: str((t) => {
          const k = e(t);
          if (k >= 1) return "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)";
          return halfPlanePolygon(dx, dy, lo + k * (hi - lo));
        }),
      });
      break;
    }
    case "slide":
    case "push": {
      const [dx, dy] = dir;
      if (dx)
        plan.incoming.offsets.push({
          prop: "x",
          mode: "add",
          signal: num((t) => -dx * W * (1 - e(t))),
        });
      if (dy)
        plan.incoming.offsets.push({
          prop: "y",
          mode: "add",
          signal: num((t) => -dy * H * (1 - e(t))),
        });
      if (spec.type === "push") {
        if (dx)
          plan.outgoing.offsets.push({ prop: "x", mode: "add", signal: num((t) => dx * W * e(t)) });
        if (dy)
          plan.outgoing.offsets.push({ prop: "y", mode: "add", signal: num((t) => dy * H * e(t)) });
      }
      break;
    }
    case "whipPan": {
      const [dx, dy] = DIRS[spec.direction ?? "e"] ?? DIRS.e!;
      const blur = (t: number) =>
        Math.round(Math.sin(p(t) * Math.PI) * 40 * (spec.intensity ?? 1) * 10) / 10;
      for (const side of [plan.incoming, plan.outgoing])
        side.filters.push(str((t) => `blur(${blur(t)}px)`));
      if (dx)
        plan.incoming.offsets.push({
          prop: "x",
          mode: "add",
          signal: num((t) => -dx * W * (1 - e(t))),
        });
      if (dy)
        plan.incoming.offsets.push({
          prop: "y",
          mode: "add",
          signal: num((t) => -dy * H * (1 - e(t))),
        });
      if (dx)
        plan.outgoing.offsets.push({ prop: "x", mode: "add", signal: num((t) => dx * W * e(t)) });
      if (dy)
        plan.outgoing.offsets.push({ prop: "y", mode: "add", signal: num((t) => dy * H * e(t)) });
      break;
    }
    case "zoomThrough":
      plan.outgoing.offsets.push({ prop: "scale", mode: "mul", signal: num((t) => 1 + 2 * e(t)) });
      plan.outgoing.offsets.push({
        prop: "opacity",
        mode: "mul",
        signal: num((t) => 1 - clamp01((p(t) - 0.35) / 0.5)),
      });
      plan.incoming.offsets.push({
        prop: "scale",
        mode: "mul",
        signal: num((t) => 0.5 + 0.5 * e(t)),
      });
      plan.incoming.offsets.push({
        prop: "opacity",
        mode: "mul",
        signal: num((t) => clamp01(p(t) / 0.5)),
      });
      break;
    case "glitch": {
      const seed = 17;
      const step = (t: number) => Math.floor((t - t0) * comp.fps * 0.5); // new value every other frame
      plan.incoming.offsets.push({
        prop: "x",
        mode: "add",
        signal: num((t) => noise1D(step(t) * 3.1, seed) * 60 * (1 - p(t)) * (spec.intensity ?? 1)),
      });
      plan.incoming.offsets.push({
        prop: "opacity",
        mode: "mul",
        signal: num((t) => (p(t) < 0.2 ? (noise1D(step(t) * 5.7, seed + 1) > 0 ? 1 : 0.2) : 1)),
      });
      plan.incoming.filters.push(
        str(
          (t) => `hue-rotate(${Math.round(noise1D(step(t) * 2.3, seed + 2) * 90 * (1 - p(t)))}deg)`,
        ),
      );
      break;
    }
    case "shader":
      plan.issues.push(
        `shader("${spec.name ?? ""}") transitions are a typed stub (later tier); using dissolve`,
      );
      plan.incoming.offsets.push({ prop: "opacity", mode: "mul", signal: num(e) });
      break;
    default:
      break;
  }
  void prev;
  return plan;
}
