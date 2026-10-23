import {
  bool,
  color,
  defineComponent,
  defineEffect,
  enumOf,
  fill,
  group,
  length,
  list,
  num,
  ref,
  text,
  vec2,
  exprSignal,
  type Channel,
  type RNode,
  type RenderCtx,
  type Signal,
} from "@codecut/core";
import { atControl, at0, boxStroke, css, esc, fillCss, placement, round, type StrokeSpec } from "./util.js";

export const strokeControl = () =>
  group(
    {
      width: num({ min: 0, max: 200, default: 0, unit: "px" }),
      color: color({ default: "#000000" }),
      align: enumOf(["inside", "center", "outside"], { default: "center" }),
      cap: enumOf(["butt", "round", "square"], { default: "butt" }),
      join: enumOf(["miter", "round", "bevel"], { default: "miter" }),
      dash: list(num({ min: 0 })),
    },
    { label: "Stroke" },
  );

const boxOut = (rc: RenderCtx, w: number, h: number, at: unknown) => {
  const pl = placement(at, rc);
  return { box: { ...pl.box, width: `${round(w)}px`, height: `${round(h)}px` }, statics: pl.statics };
};

function rectLike(name: string, description: string, defaultRadius: number) {
  return defineComponent(name, {
    category: "shapes",
    description,
    children: "effects",
    controls: {
      at: atControl(),
      width: length({ default: 300 }),
      height: length({ default: 200 }),
      fill: fill({ default: "#ffffff" }),
      radius: length({ default: defaultRadius, description: "Corner radius (px or %)." }),
      stroke: strokeControl(),
    },
    render: (p, rc) => {
      const w = rc.px(p.width, "x");
      const h = rc.px(p.height, "y");
      const r = typeof p.radius === "string" ? p.radius : `${round(p.radius as number)}px`;
      const f = p.fill;
      return {
        html: `<div id="${rc.sub("shape")}" style="${css({
          width: "100%",
          height: "100%",
          background: fillCss(f, rc),
          "border-radius": r,
          "box-shadow": boxStroke(p.stroke as StrokeSpec),
        })}"></div>`,
        ...boxOut(rc, w, h, p.at),
      };
    },
  });
}

export const Rect = rectLike("Rect", "A rectangle with solid, gradient or image fill and an optional stroke.", 0);
export const RoundRect = rectLike("RoundRect", "A rounded rectangle (default radius 24 px).", 24);

export const Circle = defineComponent("Circle", {
  category: "shapes",
  description: "A circle (or ellipse when width and height differ).",
  children: "effects",
  controls: {
    at: atControl(),
    width: length({ default: 200, description: "Diameter (width)." }),
    height: length({ description: "Defaults to width." }),
    fill: fill({ default: "#ffffff" }),
    stroke: strokeControl(),
  },
  render: (p, rc) => {
    const w = rc.px(p.width, "x");
    const h = p.height === undefined ? w : rc.px(p.height, "y");
    return {
      html: `<div id="${rc.sub("shape")}" style="${css({
        width: "100%",
        height: "100%",
        background: fillCss(p.fill, rc),
        "border-radius": "50%",
        "box-shadow": boxStroke(p.stroke as StrokeSpec),
      })}"></div>`,
      ...boxOut(rc, w, h, p.at),
    };
  },
});

/** Stroke attributes for SVG shapes. */
function svgStroke(s: StrokeSpec | undefined): string {
  if (!s || !s.width) return 'stroke="none"';
  return `stroke="${s.color ?? "#000"}" stroke-width="${s.width}" stroke-linecap="${s.cap ?? "butt"}" stroke-linejoin="${s.join ?? "miter"}"${
    s.dash?.length ? ` stroke-dasharray="${s.dash.join(" ")}"` : ""
  }`;
}

const svgFill = (f: unknown, rc: RenderCtx, defs: string[], id: string): string => {
  if (typeof f === "string") return `fill="${f}"`;
  if (f && typeof f === "object" && (f as { type?: string }).type === "linear") {
    const g = f as { angle?: number | string; stops: Array<[number, string]> };
    const a = (((typeof g.angle === "number" ? g.angle : parseFloat(String(g.angle ?? 180))) - 90) * Math.PI) / 180;
    defs.push(
      `<linearGradient id="${id}-g" x1="${round(0.5 - Math.cos(a) / 2)}" y1="${round(0.5 - Math.sin(a) / 2)}" x2="${round(0.5 + Math.cos(a) / 2)}" y2="${round(0.5 + Math.sin(a) / 2)}">${g.stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join("")}</linearGradient>`,
    );
    return `fill="url(#${id}-g)"`;
  }
  if (f && typeof f === "object" && (f as { type?: string }).type === "radial") {
    const g = f as { stops: Array<[number, string]> };
    defs.push(`<radialGradient id="${id}-g">${g.stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join("")}</radialGradient>`);
    return `fill="url(#${id}-g)"`;
  }
  void rc;
  return 'fill="none"';
};

export const Line = defineComponent("Line", {
  category: "shapes",
  description: "A line from one point to another. `trim` draws it on.",
  children: "effects",
  controls: {
    from: vec2({ animatable: true, default: [0, 0], unit: "px" }),
    to: vec2({ animatable: true, default: [300, 0], unit: "px" }),
    width: num({ min: 0, max: 200, default: 6, unit: "px" }),
    color: color({ default: "#ffffff" }),
    cap: enumOf(["butt", "round", "square"], { default: "round" }),
    trimStart: num({ animatable: true, min: 0, max: 1, default: 0 }),
    trimEnd: num({ animatable: true, min: 0, max: 1, default: 1 }),
  },
  render: (p, rc) => {
    const id = rc.sub("line");
    const f = at0<number[]>(rc, "from");
    const t = at0<number[]>(rc, "to");
    const channels: Channel[] = [
      { target: `#${id}`, prop: "attr:x1", signal: pick(p.from, 0) },
      { target: `#${id}`, prop: "attr:y1", signal: pick(p.from, 1) },
      { target: `#${id}`, prop: "attr:x2", signal: pick(p.to, 0) },
      { target: `#${id}`, prop: "attr:y2", signal: pick(p.to, 1) },
      ...trimChannels(id, p.trimStart, p.trimEnd),
    ];
    return {
      html: `<svg width="${rc.comp.width}" height="${rc.comp.height}" viewBox="0 0 ${rc.comp.width} ${rc.comp.height}" style="position:absolute;left:0;top:0;overflow:visible"><line id="${id}" x1="${f[0]}" y1="${f[1]}" x2="${t[0]}" y2="${t[1]}" pathLength="1" stroke="${p.color}" stroke-width="${p.width}" stroke-linecap="${p.cap}" stroke-dasharray="1 1" stroke-dashoffset="0"/></svg>`,
      box: { left: "0px", top: "0px", width: `${rc.comp.width}px`, height: `${rc.comp.height}px` },
      channels,
    };
  },
});

/** A scalar component of a vec Signal as its own Signal. */
function pick(sig: Signal, i: number): Signal<number> {
  if (sig.kind === "const") return { kind: "const", v: (sig.v as number[])[i] ?? 0 };
  return exprSignal((t) => {
    const v = evalAt(sig, t) as number[];
    return v[i] ?? 0;
  }, "number", undefined);
}
import { evalSignal as evalAt } from "@codecut/core";

/** Draw-on: dasharray/offset from trimStart/trimEnd on a pathLength=1 element. */
function trimChannels(id: string, s: Signal, e: Signal): Channel[] {
  if (s.kind === "const" && e.kind === "const" && s.v === 0 && e.v === 1) return [];
  const start = (t: number) => Math.min(1, Math.max(0, evalAt(s, t) as number));
  const end = (t: number) => Math.min(1, Math.max(0, evalAt(e, t) as number));
  const len = (t: number) => Math.max(0, end(t) - start(t));
  return [
    { target: `#${id}`, prop: "attr:stroke-dasharray", signal: exprSignal((t) => `${round(len(t), 4)} ${round(1 - len(t) + 0.0001, 4)}`, "discrete"), format: (v) => String(v) },
    { target: `#${id}`, prop: "attr:stroke-dashoffset", signal: exprSignal((t) => round(-start(t), 4), "number") },
  ];
}

const polygonPoints = (p: any): Array<[number, number]> => {
  if (Array.isArray(p.points) && p.points.length >= 3) return p.points as Array<[number, number]>;
  const sides = Math.max(3, Math.round(p.sides ?? 6));
  const r = p.radius ?? 100;
  const rot = ((p.rotation ?? -90) * Math.PI) / 180;
  return Array.from({ length: sides }, (_, i) => [round(r + r * Math.cos(rot + (i * 2 * Math.PI) / sides)), round(r + r * Math.sin(rot + (i * 2 * Math.PI) / sides))] as [number, number]);
};

export const Polygon = defineComponent("Polygon", {
  category: "shapes",
  description: "A polygon from explicit `points`, or a regular polygon with `sides` and `radius`.",
  children: "effects",
  controls: {
    at: atControl(),
    points: list(vec2({ default: [0, 0] })),
    sides: num({ min: 3, max: 64, step: 1, default: 6 }),
    radius: num({ min: 1, default: 100, unit: "px" }),
    rotation0: num({ default: -90, unit: "deg", description: "Angle of the first vertex." }),
    fill: fill({ default: "#ffffff" }),
    stroke: strokeControl(),
  },
  render: (p, rc) => {
    const pts = polygonPoints({ ...p, rotation: p.rotation0 });
    const xs = pts.map((q) => q[0]);
    const ys = pts.map((q) => q[1]);
    const [x0, y0, x1, y1] = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
    const w = x1 - x0;
    const h = y1 - y0;
    const defs: string[] = [];
    const id = rc.sub("poly");
    const fillAttr = svgFill(p.fill, rc, defs, id);
    return {
      html: `<svg width="${round(w)}" height="${round(h)}" viewBox="${x0} ${y0} ${round(w)} ${round(h)}" style="overflow:visible;display:block"><defs>${defs.join("")}</defs><polygon id="${id}" points="${pts.map((q) => q.join(",")).join(" ")}" ${fillAttr} ${svgStroke(p.stroke)}/></svg>`,
      ...boxOut(rc, w, h, p.at),
    };
  },
});

export const Path = defineComponent("Path", {
  category: "shapes",
  description: "An SVG path in its own viewBox. `trimStart`/`trimEnd` animate a draw-on.",
  children: "effects",
  controls: {
    at: atControl(),
    d: text({ required: true, description: "SVG path data." }),
    viewBox: text({ default: "0 0 100 100" }),
    width: length({ default: 300 }),
    height: length({ default: 300 }),
    fill: fill({ default: "none" }),
    stroke: strokeControl(),
    trimStart: num({ animatable: true, min: 0, max: 1, default: 0 }),
    trimEnd: num({ animatable: true, min: 0, max: 1, default: 1 }),
  },
  render: (p, rc) => {
    const w = rc.px(p.width, "x");
    const h = rc.px(p.height, "y");
    const id = rc.sub("path");
    const defs: string[] = [];
    const fillAttr = svgFill(p.fill === "none" ? "none" : p.fill, rc, defs, id);
    return {
      html: `<svg width="${round(w)}" height="${round(h)}" viewBox="${esc(String(p.viewBox))}" style="overflow:visible;display:block"><defs>${defs.join("")}</defs><path id="${id}" d="${esc(String(p.d))}" pathLength="1" ${p.fill === "none" || !p.fill ? 'fill="none"' : fillAttr} ${svgStroke(p.stroke)} stroke-dasharray="1 1"/></svg>`,
      ...boxOut(rc, w, h, p.at),
      channels: trimChannels(id, p.trimStart, p.trimEnd),
    };
  },
});

export const Svg = defineComponent("Svg", {
  category: "shapes",
  description: "Inline SVG markup or an SVG file, sized to a box.",
  children: "effects",
  controls: {
    at: atControl(),
    markup: text({ multiline: true, description: "Inline <svg> markup." }),
    src: text({ description: "Path to an .svg file in the project." }),
    width: length({ default: 300 }),
    height: length({ default: 300 }),
  },
  render: (p, rc) => {
    const w = rc.px(p.width, "x");
    const h = rc.px(p.height, "y");
    const inner = p.markup
      ? String(p.markup)
      : p.src
        ? `<img src="${esc(rc.assetPath(String(p.src)))}" style="width:100%;height:100%;display:block">`
        : "";
    return { html: `<div style="width:100%;height:100%">${inner}</div>`, ...boxOut(rc, w, h, p.at) };
  },
});

// ---------- masks ----------

let _maskUnused = 0;
void _maskUnused;

type MaskShape = "rect" | "roundrect" | "ellipse";

/** Fractional-box geometry for a shape inside an SVG mask (objectBoundingBox units). */
function maskShapeMarkup(id: string, shape: MaskShape, cx: number, cy: number, w: number, h: number, radius: number, fillColor: string, filter?: string): string {
  const common = `id="${id}" fill="${fillColor}"${filter ? ` filter="url(#${filter})"` : ""}`;
  if (shape === "ellipse") return `<ellipse ${common} cx="${cx}" cy="${cy}" rx="${w / 2}" ry="${h / 2}"/>`;
  return `<rect ${common} x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" rx="${shape === "roundrect" ? radius : 0}" ry="${shape === "roundrect" ? radius : 0}"/>`;
}

export const Mask = defineEffect("Mask", {
  category: "shapes",
  description:
    "Masks its parent layer with a shape. Geometry is a fraction of the layer box (0..1), so size 0 to 1 reveals the whole layer.",
  controls: {
    shape: enumOf(["rect", "roundrect", "ellipse"], { default: "rect" }),
    center: vec2({ animatable: true, default: [0.5, 0.5], step: 0.01, unit: "box" }),
    size: vec2({ animatable: true, default: [1, 1], step: 0.01, unit: "box" }),
    radius: num({ animatable: true, min: 0, max: 0.5, default: 0.1, step: 0.01, unit: "box" }),
    feather: num({ animatable: true, min: 0, max: 0.5, default: 0, step: 0.005, unit: "box", description: "Edge softness." }),
    invert: bool({ default: false }),
    mode: enumOf(["alpha", "luma"], { default: "alpha", description: "Read the mask's alpha or its luminance." }),
  },
  apply: (p, rc) => {
    const id = `${rc.id}-mask`;
    const [cx, cy] = at0Vec(rc, "center", [0.5, 0.5]);
    const [w, h] = at0Vec(rc, "size", [1, 1]);
    const r0 = rc.at<number>("radius", rc.node.start);
    const f0 = rc.at<number>("feather", rc.node.start);
    const inside = p.invert ? "black" : "white";
    const outside = p.invert ? "white" : "black";
    const shapeId = `${id}-s`;
    const defs = `<filter id="${id}-f" x="-50%" y="-50%" width="200%" height="200%" primitiveUnits="objectBoundingBox"><feGaussianBlur id="${id}-b" stdDeviation="${f0}"/></filter><mask id="${id}" maskUnits="objectBoundingBox" maskContentUnits="objectBoundingBox" x="-0.5" y="-0.5" width="2" height="2" style="mask-type:${p.mode === "luma" ? "luminance" : "alpha"}"><rect x="-0.5" y="-0.5" width="2" height="2" fill="${outside}"/>${maskShapeMarkup(shapeId, p.shape, cx, cy, w, h, r0, inside, `${id}-f`)}</mask>`;
    const attrCh = (name: string, sig: Signal): Channel => ({ target: `#${shapeId}`, prop: `attr:${name}`, signal: sig });
    const comp = (f: (t: number) => number) => exprSignal(f, "number");
    const center = p.center as Signal;
    const size = p.size as Signal;
    const channels: Channel[] = [];
    if (center.kind !== "const" || size.kind !== "const") {
      const cxF = (t: number) => (evalAt(center, t) as number[])[0]!;
      const cyF = (t: number) => (evalAt(center, t) as number[])[1]!;
      const wF = (t: number) => (evalAt(size, t) as number[])[0]!;
      const hF = (t: number) => (evalAt(size, t) as number[])[1]!;
      if (p.shape === "ellipse") {
        channels.push(attrCh("cx", comp(cxF)), attrCh("cy", comp(cyF)), attrCh("rx", comp((t) => wF(t) / 2)), attrCh("ry", comp((t) => hF(t) / 2)));
      } else {
        channels.push(attrCh("x", comp((t) => cxF(t) - wF(t) / 2)), attrCh("y", comp((t) => cyF(t) - hF(t) / 2)), attrCh("width", comp(wF)), attrCh("height", comp(hF)));
      }
    }
    if ((p.feather as Signal).kind !== "const") {
      channels.push({ target: `#${id}-b`, prop: "attr:stdDeviation", signal: p.feather as Signal });
    }
    if (p.shape === "roundrect" && (p.radius as Signal).kind !== "const") {
      channels.push(attrCh("rx", p.radius as Signal), attrCh("ry", p.radius as Signal));
    }
    return { defs, style: { mask: `url(#${id})`, "-webkit-mask": `url(#${id})` }, channels };
  },
});

const at0Vec = (rc: RenderCtx, prop: string, d: number[]): [number, number] => {
  const v = rc.at<number[]>(prop, rc.node.start);
  return [v[0] ?? d[0]!, v[1] ?? d[1]!];
};

const MATTE_SOURCES = ["Rect", "RoundRect", "Circle", "Polygon"];

export const Matte = defineEffect("Matte", {
  category: "shapes",
  description:
    "Uses another shape layer as a track matte (alpha or luma) for its parent. The source must be a Rect, RoundRect, Circle or Polygon; set the source layer `hidden` to avoid drawing it.",
  controls: {
    source: ref({ required: true }),
    mode: enumOf(["alpha", "luma"], { default: "alpha" }),
    invert: bool({ default: false }),
  },
  apply: (p, rc) => {
    const srcId = String(p.source).replace(/^#/, "");
    const src = rc.project.byId.get(srcId);
    const id = `${rc.id}-matte`;
    if (!src || !MATTE_SOURCES.includes(src.name)) {
      return { css: `/* Matte ${rc.id}: source ${srcId} is not a supported shape */` };
    }
    const inside = p.invert ? "black" : "white";
    const outside = p.invert ? "white" : "black";
    const shape: MaskShape = src.name === "Circle" ? "ellipse" : src.name === "RoundRect" ? "roundrect" : "rect";
    const radius = src.name === "RoundRect" ? 0.1 : 0;
    const defs = `<mask id="${id}" maskUnits="objectBoundingBox" maskContentUnits="objectBoundingBox" x="-0.5" y="-0.5" width="2" height="2" style="mask-type:${p.mode === "luma" ? "luminance" : "alpha"}"><rect x="-0.5" y="-0.5" width="2" height="2" fill="${outside}"/>${maskShapeMarkup(`${id}-s`, shape, 0.5, 0.5, 1, 1, radius, inside)}</mask>`;
    return { defs, style: { mask: `url(#${id})`, "-webkit-mask": `url(#${id})` } };
  },
});

export const shapeComponents = [Rect, RoundRect, Circle, Line, Polygon, Path, Svg];
export type { RNode };
