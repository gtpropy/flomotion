import type { CCNode } from "@codecut/components";

export const el = (name: string, props: Record<string, unknown> = {}, children: Array<CCNode | string> = []): CCNode => ({ $cc: 1, name, props, children });

const FONTS = () =>
  el("Fonts", { id: "fonts" }, [
    el("Font", { id: "display", family: "Space Grotesk", source: "google", variable: true, axes: { wght: [300, 700] }, subsets: ["latin"] }),
    el("Font", { id: "body", family: "Inter", source: "google", weights: [400, 600], subsets: ["latin"] }),
    el("Font", { id: "deva", family: "Noto Sans Devanagari", source: "google", weights: [400, 700], subsets: ["devanagari", "latin"] }),
  ]);

const comp = (id: string, duration: number, scenes: CCNode[], extra: CCNode[] = [], props: Record<string, unknown> = {}) =>
  el("Composition", { id, size: [1080, 1920], fps: 30, duration: `${duration}s`, background: "#10121a", ...props }, [FONTS(), el("Track", { id: "v1" }, scenes), ...extra]);

const scene = (id: string, start: number, dur: number, kids: CCNode[], extra: Record<string, unknown> = {}) => el("Scene", { id, start: `${start}s`, duration: `${dur}s`, ...extra }, kids);

/** A busy test card used to judge colour and mask effects. */
const card = (id: string, effects: CCNode[] = [], props: Record<string, unknown> = {}) =>
  el("Group", { id, ...props }, [
    el("Rect", { id: `${id}-bg`, width: 1080, height: 1920, fill: { type: "linear", angle: 160, stops: [[0, "#ff6b3d"], [0.5, "#3d7bff"], [1, "#2de0a5"]] } }),
    el("Circle", { id: `${id}-c`, width: 520, fill: "#f5e6c8", position: [0, -200] }),
    el("Rect", { id: `${id}-r`, width: 600, height: 240, fill: "#222a44", position: [0, 380] }),
    el("Text", { id: `${id}-t`, text: "Golden card", font: "body", weight: 600, size: 90, fill: "#ffffff", at: "center", position: [0, 380] }),
    ...effects,
  ]);

export interface GoldenCase {
  name: string;
  /** Needs the synced fonts (network on first run). */
  fonts: boolean;
  node: CCNode;
  times: number[];
  /** What this golden covers, for the report. */
  covers: string[];
}

const text = (id: string, props: Record<string, unknown>, kids: CCNode[] = []) => el("Text", { id, font: "body", size: 70, fill: "#ffffff", maxWidth: 980, align: "left", ...props }, kids);

export const CASES: GoldenCase[] = [
  {
    name: "text-styles",
    fonts: true,
    times: [0.6],
    covers: ["Text fill/gradient/stroke/shadow/glow/highlight/underline/case/tracking/features"],
    node: comp("g-text", 2, [
      scene("s", 0, 2, [
        text("a", { text: "Solid fill + tracking", at: [50, 140], tracking: 120, weight: 600 }),
        text("b", { text: "Gradient fill", at: [50, 300], size: 110, weight: 600, fill: { type: "linear", angle: 90, stops: [[0, "#ff3366"], [1, "#ffe14d"]] } }),
        text("c", { text: "Outside stroke", at: [50, 480], size: 130, weight: 600, fill: "#10121a", stroke: { width: 4, color: "#27e0ff", align: "outside" } }),
        text("d", { text: "Soft shadow", at: [50, 700], size: 110, weight: 600, shadow: [{ x: 0, y: 14, blur: 22, color: "#000000", opacity: 0.8 }, { x: 0, y: 0, blur: 6, color: "#ff3366", opacity: 1 }] }),
        text("e", { text: "Glow text", at: [50, 900], size: 110, weight: 600, fill: "#ffe14d", glow: { color: "#ff9a3d", radius: 28, intensity: 1.6 } }),
        text("f", { text: "Highlight box", at: [50, 1100], size: 90, weight: 600, highlight: { color: "#5b6bff", padding: 14, radius: 12 } }),
        text("g", { text: "underlined", at: [50, 1300], size: 90, weight: 600, underline: { thickness: 6, color: "#ffe14d", offset: 10 } }),
        text("h", { text: "Small caps 0123456789", at: [50, 1500], size: 80, case: "small-caps", numeric: "tabular", features: ["ss01"] }),
      ]),
    ]),
  },
  {
    name: "text-fonts-variable-devanagari",
    fonts: true,
    times: [0.05, 1.2, 2.4],
    covers: ["Variable-font axis animation (wght 300→700)", "Devanagari line", "Google font"],
    node: comp("g-fonts", 3, [
      scene("s", 0, 3, [
        text("v", { text: "Variable axis", font: "display", size: 150, at: [50, 300], axes: { wght: [[0, 300], [2.4, 700]] }, fill: "#27e0ff" }),
        text("d", { text: "नमस्ते दुनिया", font: "deva", size: 120, weight: 700, at: [50, 700], fill: "#ffe14d" }),
        text("i", { text: "Inter 400 and 600", font: "body", size: 80, at: [50, 1000], weight: 400 }),
        text("j", { text: "Inter semibold", font: "body", size: 80, at: [50, 1150], weight: 600 }),
      ]),
    ]),
  },
  {
    name: "text-animators",
    fonts: true,
    times: [0.15, 0.4, 0.9],
    covers: ["TextAnimator selector (offset sweep, randomize)", "presets: typewriter, rise, scramble, mask-reveal, tracking-in, blur-in"],
    node: comp("g-anim", 1.5, [
      scene("s", 0, 1.5, [
        text("sel", { text: "Selector sweep", font: "display", size: 110, weight: 700, at: [50, 200] }, [
          el("TextAnimator", { id: "sel-a", by: "char", selector: { start: 0, end: 1, offset: [[0, -1], [1, 1, "expo.out"]], shape: "smooth", randomize: { seed: 3, amount: 0.3 } }, props: { opacity: 0, y: 50, blur: 10, tracking: 200 } }),
        ]),
        text("tw", { text: "Typewriter preset", at: [50, 500], size: 84 }, [el("TextAnimator", { id: "tw-a", preset: "typewriter", stagger: 0.05 })]),
        text("rs", { text: "Rise preset by word", at: [50, 700], size: 84, weight: 600 }, [el("TextAnimator", { id: "rs-a", preset: "rise" })]),
        text("sc", { text: "SCRAMBLE", at: [50, 900], size: 110, weight: 700, font: "display" }, [el("TextAnimator", { id: "sc-a", preset: "scramble", stagger: 0.07 })]),
        text("mr", { text: "Mask reveal on lines", at: [50, 1100], size: 84, weight: 600, maxWidth: 600 }, [el("TextAnimator", { id: "mr-a", preset: "mask-reveal" })]),
        text("ti", { text: "Tracking in", at: [50, 1400], size: 84, weight: 600 }, [el("TextAnimator", { id: "ti-a", preset: "tracking-in" })]),
        text("bi", { text: "Blur in", at: [50, 1550], size: 84, weight: 600 }, [el("TextAnimator", { id: "bi-a", preset: "blur-in" })]),
      ]),
    ]),
  },
  {
    name: "color-grade-curves",
    fonts: true,
    times: [0.3, 1.3, 2.3],
    covers: ["ColorGrade (tone, white balance, saturation, wheels)", "Curves"],
    node: comp("g-color", 3, [
      scene("base", 0, 1, [card("c1")]),
      scene("grade", 1, 1, [card("c2", [el("ColorGrade", { id: "cg", exposure: 0.4, contrast: 0.3, saturation: -0.35, temperature: 40, tint: -10, shadows: 30, highlights: -25, lift: [0.02, 0, 0.06], gain: [1.05, 1, 0.9] })])]),
      scene("curves", 2, 1, [card("c3", [el("Curves", { id: "cv", curves: { rgb: [{ x: 0, y: 0.08 }, { x: 0.5, y: 0.3 }, { x: 1, y: 0.95 }], b: [{ x: 0, y: 0.15 }, { x: 1, y: 0.8 }] } })])]),
    ]),
  },
  {
    name: "masks",
    fonts: true,
    times: [0.1, 0.9, 1.6, 2.5],
    covers: ["Mask (ellipse reveal + feather, inverted rect)", "Matte (alpha)"],
    node: comp("g-mask", 3, [
      scene("ellipse", 0, 1.2, [card("m1", [el("Mask", { id: "mk1", shape: "ellipse", center: [0.5, 0.45], size: [[0, [0.05, 0.05]], [0.8, [0.9, 0.5], "expo.out"]], feather: 0.04 })])]),
      scene("invert", 1.2, 1, [card("m2", [el("Mask", { id: "mk2", shape: "roundrect", size: [0.6, 0.35], radius: 0.12, invert: true, feather: 0.02 })])]),
      scene("matte", 2.2, 0.8, [el("Circle", { id: "mt-src", width: 600, hidden: true }), card("m3", [el("Matte", { id: "mt", source: "#mt-src" })])]),
    ]),
  },
  {
    name: "transitions",
    fonts: true,
    times: [1.15, 2.15, 3.15, 4.15, 5.3, 6.15, 7.15, 8.15, 9.15],
    covers: ["dissolve, dipToColor, slide, push, flash, whipPan, zoomThrough, glitch, wipe"],
    node: (() => {
      const tx = ["dissolve", "dipToColor", "slide", "push", "flash", "whipPan", "zoomThrough", "glitch", "wipe"];
      const scenes = [scene("t0", 0, 1.2, [card("k0")])];
      tx.forEach((type, i) => {
        const start = 1 + i;
        scenes.push(scene(`t${i + 1}`, start, 1.2, [el("Rect", { id: `bg${i}`, width: 1080, height: 1920, fill: i % 2 ? "#ff3366" : "#27e0ff" }), el("Text", { id: `lb${i}`, text: type, font: "display", size: 140, weight: 700, fill: "#10121a", at: "center" })], { transition: { type, duration: 0.5, direction: "e", color: "#000000" } }));
      });
      return comp("g-tx", 10.5, scenes);
    })(),
  },
  {
    name: "wipe-directions",
    fonts: true,
    times: [1.2, 2.2, 3.2, 4.2, 5.2, 6.2, 7.2, 8.2],
    covers: ["wipe n ne e se s sw w nw (one golden for all eight)"],
    node: (() => {
      const dirs = ["n", "ne", "e", "se", "s", "sw", "w", "nw"];
      const scenes = [scene("w0", 0, 1.1, [card("wk0")])];
      dirs.forEach((d, i) => scenes.push(scene(`w${i + 1}`, 1 + i, 1.1, [el("Rect", { id: `wb${i}`, width: 1080, height: 1920, fill: i % 2 ? "#ff3366" : "#27e0ff" }), el("Text", { id: `wl${i}`, text: d.toUpperCase(), font: "display", size: 260, weight: 700, fill: "#10121a", at: "center" })], { transition: { type: "wipe", duration: 0.6, direction: d, ease: "linear" } })));
      return comp("g-wipe", 9.1, scenes);
    })(),
  },
  {
    name: "impacts",
    fonts: true,
    times: [0.55, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5],
    covers: ["Shake, Thud, PunchZoom, Slam, SquashStretch, Wobble, WhipPan, Glitch, RGBSplit, Pulse, Hitstop at fixed times"],
    node: (() => {
      const mk = (id: string, fx: CCNode) =>
        el("Group", { id }, [
          el("Rect", { id: `${id}-bg`, width: 1080, height: 1920, fill: "#10121a" }),
          el("RoundRect", { id: `${id}-box`, width: 420, height: 420, radius: 60, fill: { type: "linear", angle: 135, stops: [[0, "#ff3366"], [1, "#ffe14d"]] }, at: "center" }, [fx]),
          el("Text", { id: `${id}-l`, text: id.toUpperCase(), font: "display", size: 80, weight: 700, at: "bottom", position: [0, -300] }),
        ]);
      const list: Array<[string, CCNode]> = [
        ["shake", el("Shake", { id: "fx1", start: "0.2s", amp: 40, freq: 12, decay: 3, sound: "" })],
        ["thud", el("Thud", { id: "fx2", start: "0.2s", amp: 120, damping: 2.5, freq: 2, sound: "" })],
        ["punchzoom", el("PunchZoom", { id: "fx3", start: "0.2s", amount: 0.5, decay: 3, sound: "" })],
        ["slam", el("Slam", { id: "fx4", start: "0.1s", distance: 900, fall: 0.3, amp: 80, damping: 3, sound: "" })],
        ["squash", el("SquashStretch", { id: "fx5", start: "0.2s", amount: 0.4, damping: 2.5, sound: "" })],
        ["wobble", el("Wobble", { id: "fx6", start: "0.2s", amp: 25, damping: 2, sound: "" })],
        ["whip", el("WhipPan", { id: "fx7", start: "0.1s", whip: 0.5, sound: "" })],
        ["glitch", el("Glitch", { id: "fx8", start: "0.1s", duration: "0.8s", amount: 1.6, sound: "" })],
        ["rgb", el("RGBSplit", { id: "fx9", start: "0.1s", duration: "0.9s", amount: 40, decay: 1.5, sound: "" })],
        ["pulse", el("Pulse", { id: "fx10", start: "0.1s", amp: 0.25, freq: 2, count: 4, sound: "" })],
        ["hitstop", el("Hitstop", { id: "fx11", start: "0.3s", frames: 15, sound: "" })],
      ];
      const scenes = list.map(([n, fx], i) => scene(`i${i}`, i, 1, [mk(n, fx)]));
      const hs = scenes[10]!;
      ((hs.children[0] as CCNode).children[1] as CCNode).props.position = [[0, [-300, 0]], [1, [300, 0]]];
      return comp("g-impact", 11, scenes);
    })(),
  },
  {
    name: "blend-modes",
    fonts: true,
    times: [0.3],
    covers: ["All blend modes (one golden)"],
    node: (() => {
      const modes = ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "soft-light", "hard-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity", "add"];
      const kids: CCNode[] = [el("Rect", { id: "bgb", width: 1080, height: 1920, fill: { type: "linear", angle: 90, stops: [[0, "#ff3366"], [0.5, "#27e0ff"], [1, "#ffe14d"]] } })];
      modes.forEach((m, i) => kids.push(el("Circle", { id: `bm${i}`, width: 220, fill: "#3d7bff", blend: m, at: [60 + (i % 4) * 250, 120 + Math.floor(i / 4) * 300] })));
      return comp("g-blend", 1, [scene("s", 0, 1, kids)]);
    })(),
  },
  {
    name: "shapes-and-ui",
    fonts: true,
    times: [1.6],
    covers: ["Rect, RoundRect, Circle, Polygon, Path, Line", "UIMock, Card, GlassCard, Chip, Counter, ProgressRing, Chart, CodeBlock, Cursor"],
    node: comp("g-ui", 2, [
      scene("s", 0, 2, [
        el("Rect", { id: "bg", width: 1080, height: 1920, fill: { type: "linear", angle: 160, stops: [[0, "#1a0b2e"], [1, "#0b0b12"]] } }),
        el("Rect", { id: "r1", width: 200, height: 120, fill: "#ff3366", at: [40, 40] }),
        el("RoundRect", { id: "r2", width: 200, height: 120, radius: 40, fill: "#27e0ff", at: [270, 40] }),
        el("Circle", { id: "c1", width: 120, fill: "#ffe14d", at: [500, 40] }),
        el("Polygon", { id: "p1", sides: 6, radius: 60, fill: "#35d0a5", at: [650, 40] }),
        el("Path", { id: "pa", d: "M10 80 Q 52 10 95 80 T 180 80", viewBox: "0 0 190 100", width: 300, height: 160, stroke: { width: 6, color: "#ffffff" }, at: [780, 30] }),
        el("Line", { id: "ln", from: [40, 220], to: [1040, 220], width: 6, color: "#ffffff" }),
        el("Chip", { id: "chip", label: "Chip", dot: "#35d0a5", at: [40, 260] }),
        el("Counter", { id: "cnt", from: 0, to: 4821, over: 1, at: [40, 360], size: 110, align: "left", fill: "#ffe14d", font: "display" }),
        el("ProgressRing", { id: "ring", at: [40, 540], size: 300, thickness: 30, value: 0.72 }),
        el("Chart", { id: "ch1", type: "bar", at: [380, 540], width: 660, height: 300, data: [{ label: "A", value: 8 }, { label: "B", value: 14 }, { label: "C", value: 11 }, { label: "D", value: 19 }] }),
        el("Chart", { id: "ch2", type: "donut", at: [40, 900], width: 330, height: 330, thickness: 50, data: [{ value: 40 }, { value: 35 }, { value: 25 }] }),
        el("Chart", { id: "ch3", type: "line", at: [420, 900], width: 620, height: 330, data: [{ label: "1", value: 3 }, { label: "2", value: 9 }, { label: "3", value: 6 }, { label: "4", value: 14 }] }),
        el("Card", { id: "card", at: [40, 1290], width: 480, height: 200, padding: 24 }, [text("ct", { text: "Card", size: 60, at: [0, 0] })]),
        el("GlassCard", { id: "glass", at: [560, 1290], width: 480, height: 200, padding: 24 }, [text("gt", { text: "Glass", size: 60, at: [0, 0] })]),
        el("CodeBlock", { id: "code", at: [40, 1540], width: 700, size: 26, padding: 24, code: "const x = <Title />;\nrender(x);" }),
        el("UIMock", { id: "ui", at: [790, 1520], device: "phone", width: 250, height: 380, bezel: 10, radius: 36, notch: false }, [el("Rect", { id: "uis", width: 230, height: 360, fill: "#7c8cff", at: "top-left" })]),
        el("Cursor", { id: "cur", at: [120, 1100], size: 70 }),
      ]),
    ]),
  },
  {
    name: "layout",
    fonts: true,
    times: [0.3],
    covers: ["Stack, Grid, Center, SafeArea"],
    node: comp("g-layout", 1, [
      scene("s", 0, 1, [
        el("Rect", { id: "bg", width: 1080, height: 1920, fill: "#10121a" }),
        el("SafeArea", { id: "sa", preset: "reels" }, [
          el("Rect", { id: "saf", width: "100%", height: "100%", fill: "rgba(255,255,255,0.06)", at: "top-left" }),
          el("Stack", { id: "stk", direction: "row", gap: 24, width: 900, height: 200, align: "center", justify: "start", at: [0, 0] }, [el("Rect", { id: "a", width: 160, height: 120, fill: "#ff3366" }), el("Circle", { id: "b", width: 120, fill: "#ffe14d" }), el("Rect", { id: "c", width: 160, height: 160, fill: "#27e0ff" })]),
          el("Grid", { id: "grd", columns: 3, gap: 20, width: 900, height: 360, at: [0, 300] }, ["#ff3366", "#27e0ff", "#ffe14d", "#35d0a5", "#7c8cff", "#ff9a3d"].map((c, i) => el("RoundRect", { id: `g${i}`, width: 260, height: 160, radius: 24, fill: c }))),
          el("Center", { id: "ctr", width: 900 }, [text("cc", { text: "Centered", at: "center", size: 100, weight: 600 })]),
        ]),
      ]),
    ]),
  },
];

const box = (id: string, fx: CCNode[], props: Record<string, unknown> = {}) =>
  el("RoundRect", { id, width: 300, height: 300, radius: 50, fill: { type: "linear", angle: 135, stops: [[0, "#ff3366"], [1, "#ffe14d"]] }, ...props }, fx);

CASES.push(
  {
    name: "layer-styles",
    fonts: true,
    times: [0.3],
    covers: ["DropShadow, Glow, Blur, Stroke (layer), Vignette, Grain"],
    node: comp("g-styles", 1, [
      scene("s", 0, 1, [
        el("Rect", { id: "bg", width: 1080, height: 1920, fill: "#2a2f45" }),
        box("b1", [el("DropShadow", { id: "e1", y: 30, blur: 40, opacity: 0.8 })], { at: [90, 150] }),
        box("b2", [el("Glow", { id: "e2", color: "#27e0ff", radius: 40, intensity: 2 })], { at: [480, 150] }),
        box("b3", [el("Blur", { id: "e3", radius: 14 })], { at: [90, 560] }),
        box("b4", [el("Stroke", { id: "e4", width: 14, color: "#ffffff" })], { at: [480, 560] }),
        el("Group", { id: "grp" }, [box("b5", [], { at: [90, 970] }), el("Vignette", { id: "e5", amount: 0.9, size: 0.3, softness: 0.6 })]),
        el("Group", { id: "grp2" }, [box("b6", [], { at: [480, 970] }), el("Grain", { id: "e6", amount: 0.9, size: 2 })]),
      ]),
    ]),
  },
  {
    name: "motion-enter-exit-animate-split",
    fonts: true,
    times: [0.35, 0.8, 1.6],
    covers: ["Enter, Exit, Animate, SplitText, Sequence, Stagger, Group, Keyframes"],
    node: comp("g-motion", 2, [
      scene("s", 0, 2, [
        el("Rect", { id: "bg", width: 1080, height: 1920, fill: "#10121a" }),
        box("en", [el("Enter", { id: "x1", from: "w", distance: 500, duration: "0.6s", blur: 12 }), el("Exit", { id: "x2", to: "e", distance: 500, duration: "0.5s" })], { at: [90, 150] }),
        box("an", [el("Animate", { id: "x3", prop: "scale", from: 0.3, to: 1, duration: "0.8s" })], { at: [480, 150] }),
        el("SplitText", { id: "sp", text: "Split text rises word by word", font: "display", size: 100, at: [60, 600], maxWidth: 900, align: "left", preset: "rise", stagger: 0.12 }),
        el("Stagger", { id: "st", each: 0.25 }, [0, 1, 2].map((i) => el("Circle", { id: `sc${i}`, width: 200, fill: ["#ff3366", "#27e0ff", "#ffe14d"][i], at: [90 + i * 300, 1000], enter: { from: "s", distance: 200, duration: 0.5 } }))),
        el("Rect", { id: "kf", width: 300, height: 120, fill: "#35d0a5", at: [90, 1400] }, [el("Keyframes", { prop: "position", values: [[0, [0, 0]], [1.2, [600, 0], "expo.inOut"]] })]),
      ]),
    ]),
  },
  {
    name: "captions",
    fonts: true,
    times: [0.6, 1.3, 2.4],
    covers: ["Captions (karaoke), Voiceover word timings", "SplitText"],
    node: comp("g-caps", 3, [
      scene("s", 0, 3, [
        el("Rect", { id: "bg", width: 1080, height: 1920, fill: "#1a1030" }),
        el("SafeArea", { id: "sa", preset: "reels" }, [el("Captions", { id: "cap", voice: "#vo", captionStyle: "karaoke", at: "bottom", size: 72, maxChars: 18, maxWords: 3, font: "display" })]),
      ]),
    ], [el("Voiceover", { id: "vo", src: "./vo.wav" })]),
  },
);
