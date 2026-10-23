import { AT_PRESETS, json, z, type Fill, type RenderCtx } from "@codecut/core";

export const round = (n: number, d = 3) => {
  const k = 10 ** d;
  return Math.round(n * k) / k;
};

/** Inline style string from a record, skipping undefined. */
export function css(style: Record<string, string | number | undefined | false>): string {
  return Object.entries(style)
    .filter(([, v]) => v !== undefined && v !== false && v !== "")
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
}

export const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const lengthLike = z.union([z.number(), z.string()]);

/** `at`: a placement preset or an explicit [x, y] from the top-left of the parent. */
export const atControl = () =>
  json<string | Array<number | string>>(
    { default: "center", description: `Placement: ${AT_PRESETS.join(" | ")} or [x, y] (px, %, vw, vh) from the top-left.` },
    z.union([z.enum(AT_PRESETS), z.tuple([lengthLike, lengthLike])]) as z.ZodType<string | Array<number | string>>,
  );

const PRESET: Record<string, { left: string; top: string; xp: number; yp: number }> = {
  center: { left: "50%", top: "50%", xp: -50, yp: -50 },
  top: { left: "50%", top: "0px", xp: -50, yp: 0 },
  bottom: { left: "50%", top: "100%", xp: -50, yp: -100 },
  left: { left: "0px", top: "50%", xp: 0, yp: -50 },
  right: { left: "100%", top: "50%", xp: -100, yp: -50 },
  "top-left": { left: "0px", top: "0px", xp: 0, yp: 0 },
  "top-right": { left: "100%", top: "0px", xp: -100, yp: 0 },
  "bottom-left": { left: "0px", top: "100%", xp: 0, yp: -100 },
  "bottom-right": { left: "100%", top: "100%", xp: -100, yp: -100 },
};

export interface Placement {
  box: Record<string, string>;
  statics: Record<string, number>;
}

/** CSS box + GSAP statics that place a shrink-wrapped layer at `at` inside its parent. */
export function placement(at: unknown, rc: RenderCtx): Placement {
  if (Array.isArray(at)) {
    const px = (v: number | string, axis: "x" | "y") => `${round(rc.px(v, axis))}px`;
    return { box: { left: px(at[0]!, "x"), top: px(at[1]!, "y") }, statics: {} };
  }
  const p = PRESET[typeof at === "string" ? at : "center"] ?? PRESET.center!;
  return { box: { left: p.left, top: p.top }, statics: { xPercent: p.xp, yPercent: p.yp } };
}

/** CSS `background` value for a Fill (solid / gradient / image). Video fills are handled by the caller. */
export function fillCss(fill: Fill | undefined, rc: RenderCtx): string {
  if (fill === undefined) return "transparent";
  if (typeof fill === "string") return fill;
  switch (fill.type) {
    case "linear": {
      const angle = typeof fill.angle === "number" ? fill.angle : parseFloat(String(fill.angle ?? 180));
      return `linear-gradient(${angle}deg, ${fill.stops.map(([p, c]) => `${c} ${round(p * 100, 2)}%`).join(", ")})`;
    }
    case "radial": {
      const [cx, cy] = fill.center ?? [50, 50];
      return `radial-gradient(circle at ${cx}% ${cy}%, ${fill.stops.map(([p, c]) => `${c} ${round(p * 100, 2)}%`).join(", ")})`;
    }
    case "image":
      return `url(${JSON.stringify(rc.assetPath(fill.src))}) center / ${fill.fit ?? "cover"} no-repeat`;
    case "video":
      return "#000";
  }
}

/** Resolve a Length (number|string) to px given a parent axis. */
export const px = (rc: RenderCtx, v: number | string | undefined, fallback: number, axis?: "x" | "y") =>
  v === undefined ? fallback : rc.px(v, axis);

/** First-frame static value of a prop that may be a Signal. */
export const at0 = <T = any>(rc: RenderCtx, prop: string): T => rc.at<T>(prop, rc.node.start);

export const num3 = (v: unknown, d: number[]): number[] => (Array.isArray(v) ? [v[0] ?? d[0]!, v[1] ?? d[1]!, v[2] ?? d[2]!] : d);

/** Stroke control group value shape used by shapes. */
export interface StrokeSpec {
  width?: number;
  color?: string;
  align?: "inside" | "center" | "outside";
  cap?: "butt" | "round" | "square";
  join?: "miter" | "round" | "bevel";
  dash?: number[];
}

/** box-shadow rings that emulate a stroke on a CSS box. */
export function boxStroke(s: StrokeSpec | undefined): string | undefined {
  if (!s || !s.width || s.width <= 0) return undefined;
  const c = s.color ?? "#000";
  const w = s.width;
  switch (s.align ?? "center") {
    case "inside":
      return `inset 0 0 0 ${w}px ${c}`;
    case "outside":
      return `0 0 0 ${w}px ${c}`;
    default:
      return `inset 0 0 0 ${round(w / 2)}px ${c}, 0 0 0 ${round(w / 2)}px ${c}`;
  }
}
