import {
  bool,
  defineComponent,
  defineLook,
  enumOf,
  group,
  json,
  num,
  text,
  time,
  z,
  type LookSpec,
} from "@codecut/core";

/** Kinetic: bold display type, hard contrast, fast expo moves, flash and glitch accents. */
export const Kinetic = defineLook({
  id: "kinetic",
  name: "Kinetic",
  description: "Loud, fast and punchy. Space Grotesk display, hard colour, expo eases, flash cuts.",
  palette: {
    bg: "#0b0b12",
    fg: "#ffffff",
    primary: "#ff3366",
    accent: "#ffe14d",
    cyan: "#27e0ff",
    surface: "#17171f",
    muted: "#9aa0b4",
  },
  background: "#0b0b12",
  fonts: [
    {
      id: "display",
      family: "Space Grotesk",
      source: "google",
      weights: [500, 700],
      variable: true,
      axes: { wght: [300, 700] },
      subsets: ["latin"],
    },
    { id: "body", family: "Inter", source: "google", weights: [400, 600], subsets: ["latin"] },
    { id: "mono", family: "JetBrains Mono", source: "google", weights: [500], subsets: ["latin"] },
  ],
  type: {
    display: { font: "display", size: 104, weight: 700, tracking: -25, leading: 1.02 },
    body: { font: "body", size: 44, weight: 500, tracking: 0, leading: 1.3 },
    mono: { font: "mono", size: 34, weight: 500, tracking: 0, leading: 1.5 },
    numerals: { font: "display", size: 160, weight: 700, tracking: -30, leading: 1 },
  },
  easing: {
    in: "expo.out",
    out: "expo.in",
    pop: "back.out(1.8)",
    settle: "power3.out",
    spring: "spring(180,18)",
  },
  transition: { type: "flash", duration: 0.3 },
  grain: 0.1,
  sound: { "hit/land": "freesound:land", "move/whip": "freesound:whip", "ui/pop": "freesound:pop" },
});

/** Minimal: quiet type, lots of air, slow dissolves. */
export const Minimal = defineLook({
  id: "minimal",
  name: "Minimal",
  description: "Calm and precise. DM Sans, soft neutrals, slow eases, dissolves.",
  palette: {
    bg: "#f6f5f2",
    fg: "#14141a",
    primary: "#2f5bff",
    accent: "#14141a",
    surface: "#ffffff",
    muted: "#7a7a86",
  },
  background: "#f6f5f2",
  fonts: [
    {
      id: "display",
      family: "DM Sans",
      source: "google",
      weights: [500, 700],
      variable: true,
      axes: { wght: [300, 700] },
      subsets: ["latin"],
    },
    {
      id: "body",
      family: "DM Sans",
      source: "google",
      weights: [400, 500],
      variable: true,
      axes: { wght: [300, 700] },
      subsets: ["latin"],
    },
    { id: "mono", family: "IBM Plex Mono", source: "google", weights: [400], subsets: ["latin"] },
  ],
  type: {
    display: { font: "display", size: 88, weight: 600, tracking: -20, leading: 1.06 },
    body: { font: "body", size: 40, weight: 400, tracking: 0, leading: 1.4 },
    mono: { font: "mono", size: 32, weight: 400, tracking: 0, leading: 1.5 },
    numerals: { font: "display", size: 150, weight: 600, tracking: -25, leading: 1 },
  },
  easing: {
    in: "power3.out",
    out: "power3.in",
    pop: "back.out(1.2)",
    settle: "sine.inOut",
    spring: "spring(120,22)",
  },
  transition: { type: "dissolve", duration: 0.6 },
  grain: 0,
  sound: { "ui/pop": "freesound:soft-pop", "ui/tick": "freesound:tick" },
});

/** Sketch: marker type, warm paper, bouncy moves, wipes. */
export const Sketch = defineLook({
  id: "sketch",
  name: "Sketch",
  description:
    "Hand-drawn and playful. Permanent Marker display, paper colours, bouncy eases, wipes.",
  palette: {
    bg: "#fbf4e4",
    fg: "#2a2420",
    primary: "#e8452c",
    accent: "#2d7dd2",
    surface: "#fffaf0",
    muted: "#8c7f70",
  },
  background: "#fbf4e4",
  fonts: [
    {
      id: "display",
      family: "Permanent Marker",
      source: "google",
      weights: [400],
      subsets: ["latin"],
    },
    { id: "body", family: "Patrick Hand", source: "google", weights: [400], subsets: ["latin"] },
    { id: "mono", family: "Space Mono", source: "google", weights: [400], subsets: ["latin"] },
  ],
  type: {
    display: { font: "display", size: 96, weight: 400, tracking: 0, leading: 1.05 },
    body: { font: "body", size: 48, weight: 400, tracking: 0, leading: 1.25 },
    mono: { font: "mono", size: 32, weight: 400, tracking: 0, leading: 1.5 },
    numerals: { font: "display", size: 150, weight: 400, tracking: 0, leading: 1 },
  },
  easing: {
    in: "back.out(2)",
    out: "back.in(1.4)",
    pop: "elastic.out(1,0.5)",
    settle: "power2.out",
    spring: "spring(150,12)",
  },
  transition: { type: "wipe", duration: 0.45 },
  grain: 0.18,
  sound: { "ui/pop": "freesound:pop", "move/whip": "freesound:whoosh" },
});

export const looks: LookSpec[] = [Kinetic, Minimal, Sketch];

const themeControls = () => ({
  id: text({ required: true }),
  palette: json<Record<string, string>>({}, z.record(z.string(), z.string())),
  brand: json<Record<string, string>>(
    { description: "Alias of palette entries, addressable as $brand.<key>." },
    z.record(z.string(), z.string()),
  ),
  type: json<Record<string, unknown>>({}, z.record(z.string(), z.any())),
  easing: json<Record<string, string>>({}, z.record(z.string(), z.string())),
  transition: group({ type: text({ default: "dissolve" }), duration: time({ default: 0.4 }) }),
  grain: num({ min: 0, max: 1 }),
  sound: json<Record<string, string>>({}, z.record(z.string(), z.string())),
});

const themeDef = (name: string) =>
  defineComponent(name, {
    category: "brand",
    description:
      'Tokens for palette, type scale, easing set, default transition, grain and sound palette. Reference with theme="$look.<id>" on the Composition.',
    traits: [],
    children: "none",
    controls: themeControls(),
    render: () => ({ html: "", visual: false }),
  });
export const Theme = themeDef("Theme");
export const Look = themeDef("Look");
export { bool, enumOf };
