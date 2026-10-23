import {
  bool,
  enumOf,
  group,
  int,
  json,
  list,
  num,
  text,
  time,
  vec2,
  color,
  asset,
  length,
} from "./schema/controls.js";
import { defineComponent } from "./schema/define.js";

export const TRANSITION_TYPES = [
  "cut",
  "dissolve",
  "dipToColor",
  "wipe",
  "slide",
  "push",
  "flash",
  "whipPan",
  "zoomThrough",
  "glitch",
  "shader",
] as const;

export const DIRECTIONS8 = ["n", "ne", "e", "se", "s", "sw", "w", "nw"] as const;

const transition = () =>
  group(
    {
      type: enumOf(TRANSITION_TYPES, { default: "cut" }),
      duration: time({ unit: "s", default: 0.3 }),
      direction: enumOf(DIRECTIONS8, { description: "wipe / slide / push direction" }),
      color: color({ description: "dipToColor / flash colour" }),
      ease: text({ description: "Ease for the transition progress" }),
      intensity: num({ min: 0, max: 1, default: 1 }),
      name: text({ description: "shader(name): typed stub, later tier" }),
    },
    { label: "Transition into this scene", description: "Overlaps the end of the previous scene by `duration`." },
  );

const ident = () => ({ id: text({ label: "Id", description: "Stable unique id. Written back as cc_… when missing." }) });

export const Composition = defineComponent("Composition", {
  category: "structure",
  description: "Root of a project: size, frame rate, duration and theme.",
  traits: ["container"],
  children: "any",
  controls: {
    ...ident(),
    size: vec2({ default: [1920, 1080], unit: "px", description: "[width, height]" }),
    fps: int({ min: 1, max: 240, default: 30 }),
    duration: time({ unit: "s", required: true }),
    background: color({ default: "#000000" }),
    theme: text({ description: 'Look/Theme reference, e.g. "$look.kinetic"' }),
    colorSpace: enumOf(["srgb"], { default: "srgb", description: "SDR sRGB only for now." }),
    bpm: num({ min: 20, max: 400, description: "Tempo for ctx.beat(n)." }),
  },
});

export const TRACK_KINDS = ["video", "audio", "overlay", "graphics", "captions"] as const;

export const Track = defineComponent("Track", {
  category: "structure",
  description: "A lane of clips. Track order sets stacking (later tracks paint above earlier ones).",
  traits: ["container"],
  children: "any",
  controls: {
    ...ident(),
    label: text(),
    kind: enumOf(TRACK_KINDS, { default: "video" }),
    locked: bool({ default: false }),
    muted: bool({ default: false }),
    solo: bool({ default: false }),
    blend: enumOf(["normal", "multiply", "screen", "overlay", "soft-light", "hard-light", "difference", "add"], { default: "normal" }),
    opacity: num({ animatable: true, min: 0, max: 1, default: 1 }),
  },
});

export const Scene = defineComponent("Scene", {
  category: "structure",
  description: "A timed section. Child timing is relative to the Scene start.",
  traits: ["visual", "container"],
  children: "any",
  controls: {
    transition: transition(),
  },
});

export const Sequence = defineComponent("Sequence", {
  category: "structure",
  description: "Plays its children one after another. Each child starts when the previous ends plus `gap`.",
  traits: ["visual", "container"],
  children: "any",
  controls: {
    gap: time({ unit: "s", default: 0 }),
  },
});

export const Group = defineComponent("Group", {
  category: "structure",
  description: "Groups layers so they transform, fade and take effects together.",
  traits: ["visual", "container"],
  children: "any",
  controls: {
    width: length({ description: "Optional explicit box; defaults to the parent box." }),
    height: length(),
  },
  render: () => ({ html: "{{children}}" }),
});

export const Marker = defineComponent("Marker", {
  category: "structure",
  description: "A named point in time. Reference it with Time strings like \"@marker:drop\".",
  traits: [],
  children: "none",
  controls: {
    ...ident(),
    at: time({ unit: "s", required: true }),
    label: text(),
    color: color(),
  },
  render: () => ({ html: "", visual: false }),
});

export const Precomp = defineComponent("Precomp", {
  category: "structure",
  description: "Nested composition with its own timeline. Typed stub: not implemented yet.",
  traits: ["visual", "container"],
  stub: true,
  children: "any",
  controls: { src: asset(), loop: bool({ default: false }) },
});

export const Adjustment = defineComponent("Adjustment", {
  category: "structure",
  description: "Adjustment layer: effects apply to everything below it. Typed stub: not implemented yet.",
  traits: ["visual"],
  stub: true,
  children: "effects",
  controls: {},
});

export const FONT_SOURCES = ["google", "system"] as const;

export const Fonts = defineComponent("Fonts", {
  category: "typography",
  description: "Container declaring every font the project uses. Renders never touch the network.",
  traits: [],
  children: ["Font"],
  controls: { ...ident(), allowSystem: bool({ default: false, description: "Permit system fonts (output differs per machine)." }) },
});

export const Font = defineComponent("Font", {
  category: "typography",
  description:
    'A font. `source` is "google", "system", a project path (./fonts/X.woff2) or a URL. Path and URL sources need a `license`.',
  traits: [],
  children: "none",
  controls: {
    id: text({ required: true }),
    family: text({ required: true }),
    source: text({ default: "google", description: '"google" | "system" | "./fonts/File.woff2" | "https://…"' }),
    weights: list(int({ min: 1, max: 1000 })),
    styles: list(enumOf(["normal", "italic", "oblique"])),
    variable: bool({ default: false }),
    axes: json<Record<string, [number, number]>>({}, undefined),
    subsets: list(text()),
    unicodeRange: text(),
    fallback: list(text()),
    license: text({ description: "SPDX-ish licence id; required for path and URL sources." }),
  },
});

export const Keyframes = defineComponent("Keyframes", {
  category: "motion",
  description:
    "Element form of keyframes: animates `prop` of its parent. Same as writing the prop as a keyframe array.",
  traits: [],
  children: "none",
  controls: {
    id: text(),
    prop: text({ required: true, description: "Parent prop name, e.g. position." }),
    values: json<unknown[]>({}, undefined),
    keys: text({ description: 'Sidecar reference, e.g. "./promo.keys.json#t1.position".' }),
    mode: enumOf(["linear", "hold", "bezier", "auto", "continuous", "ease"]),
    spatial: enumOf(["linear", "bezier", "auto"]),
    orient: enumOf(["path"]),
    separate: bool({ default: false }),
    loop: json<"cycle" | "pingpong" | number>({}, undefined),
  },
  render: () => ({ html: "", visual: false }),
});
