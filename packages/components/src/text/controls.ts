import {
  bool,
  color,
  enumOf,
  fill,
  group,
  int,
  json,
  length,
  list,
  num,
  text,
  z,
} from "@codecut/core";

const decoration = (label: string) =>
  group(
    {
      style: enumOf(["solid", "dashed", "dotted", "wavy", "double"], { default: "solid" }),
      thickness: num({ min: 0, max: 100, default: 4, unit: "px" }),
      offset: num({ default: 6, unit: "px" }),
      color: color(),
      progress: num({
        animatable: true,
        min: 0,
        max: 1,
        default: 1,
        step: 0.01,
        description: "Draw-on amount, 0 to 1.",
      }),
    },
    { label },
  );

/** Typography props shared by Text, Title, Captions and any text-bearing component (spec 7A.4). */
export const typographyControls = () => ({
  // Face
  font: text({
    default: "$type.body",
    description: 'Font id or token, e.g. "display" or "$type.display".',
  }),
  weight: num({ animatable: true, min: 1, max: 1000, default: 400, step: 1, unit: "wght" }),
  width: num({
    animatable: true,
    min: 25,
    max: 200,
    default: 100,
    step: 1,
    unit: "%",
    description: "Font width (wdth axis).",
  }),
  style: enumOf(["normal", "italic", "oblique"], { default: "normal" }),
  size: num({ animatable: true, min: 1, max: 2000, default: 64, step: 1, unit: "px" }),
  axes: group(
    {
      wght: num({ animatable: true, min: 1, max: 1000 }),
      wdth: num({ animatable: true, min: 25, max: 200 }),
      slnt: num({ animatable: true, min: -90, max: 90 }),
      ital: num({ animatable: true, min: 0, max: 1 }),
      opsz: num({ animatable: true, min: 1, max: 1000 }),
      custom: json<Record<string, number>>({}, z.record(z.string(), z.number())),
    },
    {
      label: "Variable axes",
      description: "Animatable variable-font axes. `custom` takes static values for other axes.",
    },
  ),
  // Spacing
  leading: num({
    animatable: true,
    min: 0.5,
    max: 4,
    default: 1.15,
    step: 0.01,
    description: "Line height multiplier.",
  }),
  tracking: num({
    animatable: true,
    min: -500,
    max: 2000,
    default: 0,
    step: 1,
    unit: "‰em",
    description: "Letter spacing in thousandths of an em.",
  }),
  wordSpacing: num({ animatable: true, min: -500, max: 2000, default: 0, unit: "‰em" }),
  indent: num({ default: 0, unit: "px" }),
  paragraphSpacing: num({ default: 0, unit: "px" }),
  baselineShift: num({ animatable: true, default: 0, unit: "px" }),
  // Layout
  align: enumOf(["left", "center", "right", "justify"], { default: "left" }),
  valign: enumOf(["top", "middle", "bottom"], { default: "top" }),
  maxWidth: length({ default: "90%" }),
  box: group(
    { width: length(), height: length() },
    { description: "A fixed box; `valign` and `fit` use it." },
  ),
  wrap: bool({ default: true }),
  balance: bool({ default: false, description: "Balance line lengths." }),
  hyphenate: bool({ default: false }),
  overflow: enumOf(["visible", "hidden", "ellipsis"], { default: "visible" }),
  columns: int({ min: 1, max: 8, default: 1 }),
  direction: enumOf(["ltr", "rtl"], { default: "ltr" }),
  lang: text({ description: 'BCP-47 language, e.g. "en", "hi".' }),
  // Case and features
  case: enumOf(["none", "upper", "lower", "title", "small-caps"], { default: "none" }),
  features: list(text(), {
    description:
      'OpenType features: "liga", "kern", "tnum", "lnum", "onum", "ss01"…"ss20", "salt".',
  }),
  numeric: enumOf(["default", "tabular", "proportional", "lining", "oldstyle"], {
    default: "default",
  }),
  // Fitting
  fit: group(
    { minSize: num({ min: 1 }), maxSize: num({ min: 1 }), maxLines: int({ min: 1 }) },
    { description: "Shrinks the size until the text fits the box / line count." },
  ),
  // Decoration
  underline: decoration("Underline"),
  strike: decoration("Strike-through"),
  highlight: group(
    {
      color: color({ default: "#ffe14d" }),
      padding: num({ min: 0, default: 8, unit: "px" }),
      radius: num({ min: 0, default: 6, unit: "px" }),
      progress: num({
        animatable: true,
        min: 0,
        max: 1,
        default: 1,
        step: 0.01,
        description: "Wipe amount, 0 to 1.",
      }),
      opacity: num({ min: 0, max: 1, default: 1 }),
    },
    { label: "Highlight (marker box)" },
  ),
});

/** Fill, stroke and effects for text (spec 7A.5). */
export const textStyleControls = () => ({
  fill: fill({
    default: "#ffffff",
    description: "Solid, gradient, image or video clipped to the letter shapes.",
  }),
  stroke: group(
    {
      width: num({ animatable: true, min: 0, max: 100, default: 0, unit: "px" }),
      color: color({ default: "#000000" }),
      align: enumOf(["inside", "center", "outside"], {
        default: "center",
        description: "`inside` is approximated as `center` (CSS limitation).",
      }),
      join: enumOf(["miter", "round", "bevel"], { default: "round" }),
      dash: list(num({ min: 0 }), {
        description: "Dashed strokes need SVG text: not supported yet, ignored with a warning.",
      }),
    },
    { label: "Stroke" },
  ),
  shadow: list(
    group({
      x: num({ default: 0, unit: "px" }),
      y: num({ default: 8, unit: "px" }),
      blur: num({ min: 0, default: 16, unit: "px" }),
      color: color({ default: "#000000" }),
      opacity: num({ min: 0, max: 1, default: 0.4 }),
    }),
    { description: "Multiple shadows, drawn in order." },
  ),
  glow: group({
    color: color({ default: "#ffffff" }),
    radius: num({ min: 0, default: 20, unit: "px" }),
    intensity: num({ min: 0, max: 3, default: 1 }),
  }),
  outline: group(
    {
      width: num({ min: 0, default: 0, unit: "px" }),
      color: color({ default: "#ffffff" }),
      gap: num({ min: 0, default: 4, unit: "px" }),
    },
    { description: "A box outline around the text block." },
  ),
  blur: num({ animatable: true, min: 0, max: 200, default: 0, unit: "px" }),
  extrude: group(
    { depth: num({ min: 0, default: 0 }), color: color() },
    { description: "3D extrusion is a later tier: typed stub, ignored with a warning." },
  ),
  glitch: num({
    animatable: true,
    min: 0,
    max: 3,
    default: 0,
    step: 0.05,
    description: "Glitch amount (jitter, skew, hue flips).",
  }),
  rgbSplit: num({ animatable: true, min: 0, max: 60, default: 0, unit: "px" }),
});
