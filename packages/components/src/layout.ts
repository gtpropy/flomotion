import {
  defineComponent,
  enumOf,
  group,
  int,
  length,
  list,
  num,
  text,
  type ComponentDef,
  type ResolvedComp,
  type Vec2,
} from "@flomotion/core";
import { css, placement, round } from "./util.js";

export const SAFE_PRESETS = ["reels", "shorts", "tiktok", "feed"] as const;
export type SafePreset = (typeof SAFE_PRESETS)[number];

/** Safe-area insets as fractions of the frame (top, right, bottom, left). Derived from 1080x1920 guides. */
export const SAFE_INSETS: Record<
  SafePreset,
  { top: number; right: number; bottom: number; left: number }
> = {
  reels: { top: 250 / 1920, right: 120 / 1080, bottom: 340 / 1920, left: 60 / 1080 },
  shorts: { top: 220 / 1920, right: 140 / 1080, bottom: 380 / 1920, left: 60 / 1080 },
  tiktok: { top: 150 / 1920, right: 140 / 1080, bottom: 480 / 1920, left: 60 / 1080 },
  feed: { top: 0.05, right: 0.05, bottom: 0.05, left: 0.05 },
};

/** Safe rectangle in px for a preset on a composition. */
export function safeRect(
  preset: SafePreset,
  comp: Pick<ResolvedComp, "width" | "height">,
  override?: Partial<{ top: number; right: number; bottom: number; left: number }>,
) {
  const i = { ...SAFE_INSETS[preset], ...override };
  const x = comp.width * i.left;
  const y = comp.height * i.top;
  return {
    x,
    y,
    width: comp.width * (1 - i.left - i.right),
    height: comp.height * (1 - i.top - i.bottom),
  };
}

const lenOf = (v: unknown, fallback: string) =>
  v === undefined ? fallback : typeof v === "number" ? `${round(v)}px` : String(v);

const flexControls = () => ({
  width: length({ description: "Defaults to the full parent box." }),
  height: length(),
  gap: length({ default: 0 }),
  padding: length({ default: 0 }),
  align: enumOf(["start", "center", "end", "stretch"], { default: "center" }),
  justify: enumOf(["start", "center", "end", "space-between", "space-around"], {
    default: "center",
  }),
});

const sizeBox = (p: any, rc: any): Record<string, string> | undefined => {
  if (p.width === undefined && p.height === undefined) return undefined;
  const w = p.width === undefined ? rc.comp.width : rc.px(p.width, "x");
  const h = p.height === undefined ? rc.comp.height : rc.px(p.height, "y");
  return { ...placement("top-left", rc).box, width: `${round(w)}px`, height: `${round(h)}px` };
};

const ALIGN: Record<string, string> = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  stretch: "stretch",
  "space-between": "space-between",
  "space-around": "space-around",
};

export const Stack = defineComponent("Stack", {
  category: "layout",
  description: "Lays children out in a row or column with gap, alignment and padding (CSS flex).",
  traits: ["visual", "container"],
  children: "any",
  controls: {
    ...flexControls(),
    direction: enumOf(["row", "column"], { default: "column" }),
    wrap: enumOf(["nowrap", "wrap"], { default: "nowrap" }),
  },
  render: (p, rc) => ({
    html: `<div id="${rc.sub("flow")}" style="${css({ display: "flex", "flex-direction": p.direction, "flex-wrap": p.wrap, gap: lenOf(p.gap, "0px"), padding: lenOf(p.padding, "0px"), "align-items": ALIGN[p.align], "justify-content": ALIGN[p.justify], width: "100%", height: "100%", "box-sizing": "border-box" })}">{{children}}</div>`,
    box: sizeBox(p, rc),
    flow: true,
  }),
});

export const Grid = defineComponent("Grid", {
  category: "layout",
  description: 'A CSS grid. `columns` is a count or a list of track sizes ("1fr", "200px").',
  traits: ["visual", "container"],
  children: "any",
  controls: {
    ...flexControls(),
    columns: int({ min: 1, max: 24, default: 2 }),
    rows: int({ min: 1, max: 24 }),
    columnSizes: list(text()),
    rowSizes: list(text()),
  },
  render: (p, rc) => {
    const cols = p.columnSizes?.length ? p.columnSizes.join(" ") : `repeat(${p.columns}, 1fr)`;
    const rows = p.rowSizes?.length
      ? p.rowSizes.join(" ")
      : p.rows
        ? `repeat(${p.rows}, 1fr)`
        : undefined;
    return {
      html: `<div id="${rc.sub("flow")}" style="${css({ display: "grid", "grid-template-columns": cols, "grid-template-rows": rows, gap: lenOf(p.gap, "0px"), padding: lenOf(p.padding, "0px"), "align-items": ALIGN[p.align], "justify-items": ALIGN[p.justify] === "space-between" ? "center" : ALIGN[p.justify], width: "100%", height: "100%", "box-sizing": "border-box" })}">{{children}}</div>`,
      box: sizeBox(p, rc),
      flow: true,
    };
  },
});

export const Center = defineComponent("Center", {
  category: "layout",
  description: "Centres its children in the parent box.",
  traits: ["visual", "container"],
  children: "any",
  controls: {
    direction: enumOf(["row", "column"], { default: "column" }),
    gap: length({ default: 0 }),
  },
  render: (p) => ({
    html: `<div style="${css({ display: "flex", "flex-direction": p.direction, "align-items": "center", "justify-content": "center", gap: lenOf(p.gap, "0px"), width: "100%", height: "100%" })}">{{children}}</div>`,
    flow: true,
  }),
});

export const SafeArea = defineComponent("SafeArea", {
  category: "layout",
  description:
    "Constrains children to the platform-safe rectangle (reels, shorts, tiktok, feed). Children placed with `at` position inside it.",
  traits: ["visual", "container"],
  children: "any",
  controls: {
    preset: enumOf(SAFE_PRESETS, { default: "reels" }),
    inset: group(
      {
        top: num({ min: 0, max: 0.5 }),
        right: num({ min: 0, max: 0.5 }),
        bottom: num({ min: 0, max: 0.5 }),
        left: num({ min: 0, max: 0.5 }),
      },
      { description: "Override insets as fractions of the frame." },
    ),
  },
  childBox: (raw, comp) => {
    const r = safeRect((raw.preset as SafePreset) ?? "reels", comp, raw.inset as any);
    return [r.width, r.height];
  },
  render: (p, rc) => {
    const r = safeRect(p.preset, rc.comp, p.inset);
    return {
      html: `<div id="${rc.sub("safe")}" style="position:absolute;left:0;top:0;width:100%;height:100%">{{children}}</div>`,
      box: {
        left: `${round(r.x)}px`,
        top: `${round(r.y)}px`,
        width: `${round(r.width)}px`,
        height: `${round(r.height)}px`,
      },
    };
  },
});

export const layoutComponents: ComponentDef[] = [Stack.def, Grid.def, Center.def, SafeArea.def];
export type { Vec2 };
