import {
  bool,
  color,
  defineEffect,
  evalSignal,
  exprSignal,
  num,
  parseColor,
  toCss,
  vec2,
  type Channel,
  type RenderCtx,
  type Signal,
} from "@codecut/core";
import { round } from "./util.js";

const sig = <T>(rc: RenderCtx, prop: string): Signal<T> => (rc.node.props[prop] as Signal<T>);

/** Window during which an effect is active, in absolute seconds. */
export const effectWindow = (rc: RenderCtx): [number, number] => [rc.node.start, rc.node.end];

export function withAlpha(c: string, alpha: number): string {
  try {
    const p = parseColor(c);
    return toCss({ ...p, a: p.a * alpha });
  } catch {
    return c;
  }
}

/** Wraps a string producer so it is `none` outside the effect window. */
const windowed = (rc: RenderCtx, on: (t: number) => string): Signal<string> => {
  const [a, b] = effectWindow(rc);
  return exprSignal((t) => (t >= a && t < b ? on(t) : ""), "discrete", [a, b]);
};

export const DropShadow = defineEffect("DropShadow", {
  category: "layer-styles",
  description: "A soft shadow behind the layer's visible pixels.",
  controls: {
    x: num({ animatable: true, default: 0, unit: "px" }),
    y: num({ animatable: true, default: 12, unit: "px" }),
    blur: num({ animatable: true, min: 0, max: 200, default: 24, unit: "px" }),
    color: color({ default: "#000000" }),
    opacity: num({ animatable: true, min: 0, max: 1, default: 0.4 }),
  },
  apply: (p, rc) => ({
    filters: [
      windowed(rc, (t) => `drop-shadow(${round(evalSignal(sig<number>(rc, "x"), t))}px ${round(evalSignal(sig<number>(rc, "y"), t))}px ${round(evalSignal(sig<number>(rc, "blur"), t))}px ${withAlpha(p.color, evalSignal(sig<number>(rc, "opacity"), t))})`),
    ],
  }),
});

export const Glow = defineEffect("Glow", {
  category: "layer-styles",
  description: "A coloured halo around the layer's visible pixels.",
  controls: {
    color: color({ default: "#ffffff" }),
    radius: num({ animatable: true, min: 0, max: 300, default: 24, unit: "px" }),
    intensity: num({ animatable: true, min: 0, max: 3, default: 1, step: 0.05 }),
  },
  apply: (p, rc) => ({
    filters: [
      windowed(rc, (t) => {
        const r = evalSignal(sig<number>(rc, "radius"), t);
        const k = evalSignal(sig<number>(rc, "intensity"), t);
        const whole = Math.floor(k);
        const parts: string[] = [];
        for (let i = 0; i < whole; i++) parts.push(`drop-shadow(0 0 ${round(r)}px ${p.color})`);
        const frac = k - whole;
        if (frac > 0.001) parts.push(`drop-shadow(0 0 ${round(r)}px ${withAlpha(p.color, frac)})`);
        return parts.join(" ");
      }),
    ],
  }),
});

export const Blur = defineEffect("Blur", {
  category: "layer-styles",
  description: "Gaussian blur of the layer.",
  controls: { radius: num({ animatable: true, min: 0, max: 200, default: 8, unit: "px" }) },
  apply: (_p, rc) => ({
    filters: [windowed(rc, (t) => { const r = evalSignal(sig<number>(rc, "radius"), t); return r > 0.01 ? `blur(${round(r, 2)}px)` : ""; })],
  }),
});

export const Stroke = defineEffect("Stroke", {
  category: "layer-styles",
  description: "An outline around the layer's visible pixels (outside edge).",
  controls: {
    width: num({ animatable: true, min: 0, max: 100, default: 4, unit: "px" }),
    color: color({ default: "#000000" }),
  },
  apply: (p, rc) => {
    const id = `${rc.id}-stroke`;
    const w0 = rc.at<number>("width", rc.node.start);
    const defs = `<filter id="${id}" x="-25%" y="-25%" width="150%" height="150%" color-interpolation-filters="sRGB"><feMorphology id="${id}-m" in="SourceAlpha" operator="dilate" radius="${round(w0)}" result="d"/><feFlood flood-color="${p.color}" result="c"/><feComposite in="c" in2="d" operator="in" result="s"/><feMerge><feMergeNode in="s"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
    const channels: Channel[] = [];
    if (sig<number>(rc, "width").kind !== "const") {
      channels.push({ target: `#${id}-m`, prop: "attr:radius", signal: sig<number>(rc, "width") });
    }
    return { defs, filters: [windowed(rc, () => `url(#${id})`)], channels };
  },
});

export const Vignette = defineEffect("Vignette", {
  category: "layer-styles",
  description: "Darkens the edges of the layer.",
  controls: {
    amount: num({ animatable: true, min: 0, max: 1, default: 0.5, step: 0.01 }),
    size: num({ min: 0, max: 1, default: 0.55, step: 0.01, description: "Radius of the clear centre." }),
    softness: num({ min: 0, max: 1, default: 0.5, step: 0.01 }),
    color: color({ default: "#000000" }),
    roundness: num({ min: 0, max: 1, default: 0.5, step: 0.01, description: "0 = frame-shaped, 1 = circular." }),
    feather: bool({ default: true }),
  },
  apply: (p, rc) => {
    const id = `${rc.id}-vig`;
    const inner = round(p.size * 100 - p.softness * 30, 1);
    const outer = round(Math.min(100, p.size * 100 + p.softness * 45 + 15), 1);
    const [a, b] = effectWindow(rc);
    const amount = sig<number>(rc, "amount");
    return {
      overlay: {
        html: `<div id="${id}" class="cc-vignette" style="position:absolute;inset:0;pointer-events:none;opacity:${round(evalSignal(amount, a))};background:radial-gradient(${p.roundness > 0.5 ? "circle" : "ellipse"} at 50% 50%, rgba(0,0,0,0) ${Math.max(0, inner)}%, ${p.color} ${outer}%)"></div>`,
        channels: [{ target: `#${id}`, prop: "opacity", signal: exprSignal((t) => (t >= a && t < b ? (evalSignal(amount, t) as number) : 0), "number", [a, b]) }],
      },
    };
  },
});

export const layerStyleEffects = [DropShadow, Glow, Blur, Stroke, Vignette];
export { vec2 };
