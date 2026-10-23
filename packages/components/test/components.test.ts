import { describe, expect, it } from "vitest";
import {
  compileProject,
  registry,
  resolveProject,
  validateProps,
  type CCNode,
} from "../src/index.js";

const el = (
  name: string,
  props: Record<string, unknown> = {},
  children: Array<CCNode | string> = [],
): CCNode => ({ $cc: 1, name, props, children });

const WORDS = [
  { w: "Ship", start: 0.4, end: 0.7 },
  { w: "videos", start: 0.75, end: 1.2 },
  { w: "as", start: 1.25, end: 1.4 },
  { w: "code", start: 1.45, end: 2.0 },
];

const comp = (children: CCNode[], extra: Record<string, unknown> = {}) =>
  el(
    "Composition",
    { id: "c", size: [1080, 1920], fps: 30, duration: "3s", theme: "$look.kinetic", ...extra },
    [
      el("Fonts", { id: "fonts" }, []),
      el("Track", { id: "v1", kind: "video" }, [
        el("Scene", { id: "s1", start: "0s", duration: "3s" }, children),
      ]),
    ],
  );

const host = (effects: CCNode[]) =>
  el("Rect", { id: "host", width: 400, height: 300, fill: "#ff3366" }, effects);
const text = (props: Record<string, unknown> = {}, kids: Array<CCNode | string> = []) =>
  el("Text", { id: "t", text: "Ship videos as code", size: 90, ...props }, kids);

/** One fixture per registered definition: a project that exercises it. */
const FIXTURES: Record<string, () => CCNode> = {
  // structure
  Composition: () => comp([]),
  Track: () => comp([]),
  Scene: () => comp([host([])]),
  Sequence: () =>
    comp([
      el("Sequence", { id: "seq", gap: 0.1 }, [
        el("Rect", { id: "a", duration: "1s" }),
        el("Rect", { id: "b", duration: "1s" }),
      ]),
    ]),
  Group: () => comp([el("Group", { id: "g", opacity: 0.8 }, [el("Rect", { id: "a" })])]),
  Marker: () => comp([el("Marker", { id: "m", at: "1s", label: "beat" })]),
  Precomp: () => comp([el("Precomp", { id: "pc", src: "./sub.tsx" })]),
  Adjustment: () => comp([el("Adjustment", { id: "adj" })]),
  Keyframes: () =>
    comp([
      el("Rect", { id: "k" }, [
        el("Keyframes", {
          prop: "opacity",
          values: [
            [0, 0],
            [1, 1],
          ],
        }),
      ]),
    ]),
  Stagger: () =>
    comp([
      el("Stagger", { id: "st", each: 0.1 }, [
        el("Rect", { id: "a", duration: "1s" }),
        el("Rect", { id: "b", duration: "1s" }),
      ]),
    ]),
  Fonts: () => comp([]),
  Font: () =>
    el("Composition", { id: "c", size: [1080, 1920], fps: 30, duration: "3s" }, [
      el("Fonts", { id: "fonts" }, [
        el("Font", {
          id: "display",
          family: "Space Grotesk",
          source: "google",
          weights: [500, 700],
          variable: true,
        }),
      ]),
      el("Track", { id: "v1" }, [
        el("Scene", { id: "s1", start: "0s", duration: "3s" }, [text({ font: "display" })]),
      ]),
    ]),
  Theme: () =>
    el(
      "Composition",
      { id: "c", size: [1080, 1920], fps: 30, duration: "3s", theme: "$theme.mine" },
      [
        el("Theme", { id: "mine", palette: { bg: "#000", fg: "#fff" } }),
        el("Track", { id: "v1" }, [el("Scene", { id: "s1", start: "0s", duration: "3s" }, [])]),
      ],
    ),
  Look: () =>
    el(
      "Composition",
      { id: "c", size: [1080, 1920], fps: 30, duration: "3s", theme: "$look.mine" },
      [
        el("Look", { id: "mine", palette: { bg: "#000" } }),
        el("Track", { id: "v1" }, [el("Scene", { id: "s1", start: "0s", duration: "3s" }, [])]),
      ],
    ),
  // shapes
  Rect: () =>
    comp([
      el("Rect", {
        id: "r",
        width: 400,
        height: 300,
        fill: {
          type: "linear",
          angle: 135,
          stops: [
            [0, "#ff3366"],
            [1, "#27e0ff"],
          ],
        },
        stroke: { width: 6, color: "#fff", align: "outside" },
      }),
    ]),
  RoundRect: () => comp([el("RoundRect", { id: "r", width: 400, height: 300, radius: 48 })]),
  Circle: () => comp([el("Circle", { id: "c1", width: 300, fill: "$brand.primary" })]),
  Line: () =>
    comp([
      el("Line", {
        id: "l",
        from: [100, 100],
        to: [900, 400],
        width: 12,
        color: "#fff",
        trimEnd: [
          [0, 0],
          [1, 1],
        ],
      }),
    ]),
  Polygon: () => comp([el("Polygon", { id: "p", sides: 6, radius: 160, fill: "#ffe14d" })]),
  Path: () =>
    comp([
      el("Path", {
        id: "p",
        d: "M10 80 Q 52 10 95 80 T 180 80",
        viewBox: "0 0 190 100",
        width: 600,
        height: 320,
        stroke: { width: 6, color: "#fff" },
        trimEnd: [
          [0, 0],
          [1, 1, "expo.out"],
        ],
      }),
    ]),
  Svg: () =>
    comp([
      el("Svg", {
        id: "s",
        markup: '<svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" fill="#f36"/></svg>',
        width: 300,
        height: 300,
      }),
    ]),
  Mask: () =>
    comp([
      host([
        el("Mask", {
          id: "mk",
          shape: "ellipse",
          size: [
            [0, [0, 0]],
            [1, [1, 1], "expo.out"],
          ],
          feather: 0.05,
        }),
      ]),
    ]),
  Matte: () =>
    comp([
      el("Rect", { id: "src", width: 200, height: 200, hidden: true }),
      host([el("Matte", { id: "mt", source: "#src" })]),
    ]),
  // layout
  Stack: () =>
    comp([
      el("Stack", { id: "stk", direction: "column", gap: 24 }, [
        el("Rect", { id: "a", width: 200, height: 80 }),
        el("Rect", { id: "b", width: 200, height: 80 }),
      ]),
    ]),
  Grid: () =>
    comp([
      el("Grid", { id: "grd", columns: 2, gap: 16, width: 600, height: 400 }, [
        el("Rect", { id: "a", width: 100, height: 80 }),
        el("Rect", { id: "b", width: 100, height: 80 }),
      ]),
    ]),
  Center: () =>
    comp([el("Center", { id: "ctr" }, [el("Rect", { id: "a", width: 200, height: 80 })])]),
  SafeArea: () => comp([el("SafeArea", { id: "sa", preset: "reels" }, [text({ at: "bottom" })])]),
  // text
  Text: () =>
    comp([
      text({
        weight: 700,
        fill: {
          type: "linear",
          angle: 90,
          stops: [
            [0, "#ff3366"],
            [1, "#ffe14d"],
          ],
        },
        stroke: { width: 3, color: "#000" },
        shadow: [{ y: 6, blur: 12 }],
        underline: { thickness: 5 },
      }),
    ]),
  Title: () =>
    comp([
      el("Title", {
        id: "ti",
        text: "Ship videos as code",
        enter: { from: "sw", distance: 120, ease: "expo.out", duration: 0.6 },
      }),
    ]),
  SplitText: () =>
    comp([el("SplitText", { id: "sp", text: "Ship videos as code", preset: "rise" })]),
  Span: () => comp([text({}, [el("Span", { id: "sp", weight: 900, color: "#ffe14d" }, ["code"])])]),
  B: () => comp([text({ text: undefined }, [el("B", { id: "b" }, ["bold"]), " text"])]),
  I: () => comp([text({ text: undefined }, [el("I", { id: "i" }, ["italic"]), " text"])]),
  Highlight: () =>
    comp([
      text({ text: undefined }, [
        "Ship ",
        el(
          "Highlight",
          {
            id: "hl",
            progress: [
              [0, 0],
              [0.6, 1],
            ],
          },
          ["videos"],
        ),
      ]),
    ]),
  Underline: () =>
    comp([
      text({ text: undefined }, [
        "Ship ",
        el(
          "Underline",
          {
            id: "ul",
            progress: [
              [0, 0],
              [0.6, 1],
            ],
          },
          ["videos"],
        ),
      ]),
    ]),
  Strike: () => comp([text({ text: undefined }, [el("Strike", { id: "sk" }, ["old"]), " new"])]),
  TextAnimator: () =>
    comp([
      text({}, [
        el("TextAnimator", {
          id: "ta",
          by: "char",
          selector: {
            start: 0,
            end: 1,
            offset: [
              [0, -1],
              [1.2, 1, "expo.out"],
            ],
            shape: "smooth",
            randomize: { seed: 3, amount: 0.3 },
          },
          props: { opacity: 0, y: 40, blur: 12, tracking: 200, weight: 300 },
        }),
      ]),
    ]),
  // media
  Image: () => comp([el("Image", { id: "img", src: "./assets/logo.png" })]),
  Video: () => comp([el("Video", { id: "vid", src: "./assets/clip.mp4", duration: "2s" })]),
  Clip: () =>
    comp([el("Clip", { id: "clp", src: "./assets/clip.mp4", in: "1s", out: "3s", speed: 2 })]),
  Audio: () =>
    comp([el("Audio", { id: "mus", src: "./assets/music.mp3", gain: -12, duration: "3s" })]),
  Sound: () =>
    comp([el("Sound", { id: "snd", src: "freesound:12345", at: "0.6s", peak: "land", gain: -6 })]),
  Voiceover: () => comp([el("Voiceover", { id: "vo", src: "./assets/vo.wav" })]),
  Captions: () =>
    comp([
      el("Voiceover", { id: "vo", src: "./assets/vo.wav" }),
      el("Captions", { id: "cap", voice: "#vo", captionStyle: "karaoke", at: "bottom" }),
    ]),
  // ui
  UIMock: () =>
    comp([
      el("UIMock", { id: "ui", device: "phone" }, [
        el("Rect", { id: "scr", width: 400, height: 400, fill: "#7c8cff" }),
      ]),
    ]),
  Card: () => comp([el("Card", { id: "card", width: 700 }, [text({ id: "ct", size: 48 })])]),
  GlassCard: () =>
    comp([el("GlassCard", { id: "gc", width: 700 }, [text({ id: "gt", size: 48 })])]),
  Cursor: () =>
    comp([
      el("Cursor", {
        id: "cur",
        position: [
          [0, [200, 300]],
          [1, [700, 900], "expo.inOut"],
        ],
        clicks: ["1.1s"],
      }),
    ]),
  Chip: () => comp([el("Chip", { id: "chip", label: "New", dot: "#35d0a5" })]),
  Counter: () => comp([el("Counter", { id: "cnt", from: 0, to: 12840, prefix: "$" })]),
  ProgressRing: () =>
    comp([
      el("ProgressRing", {
        id: "ring",
        value: [
          [0, 0],
          [1.2, 0.82, "expo.out"],
        ],
      }),
    ]),
  Chart: () =>
    comp([
      el("Chart", {
        id: "ch",
        type: "bar",
        data: [
          { label: "Q1", value: 12 },
          { label: "Q2", value: 20 },
          { label: "Q3", value: 31 },
        ],
        progress: [
          [0, 0],
          [1, 1],
        ],
      }),
    ]),
  CodeBlock: () =>
    comp([
      el("CodeBlock", {
        id: "code",
        code: "const video = <Composition />;\nrender(video);",
        reveal: [
          [0, 0],
          [1.2, 1],
        ],
      }),
    ]),
  // effects
  DropShadow: () => comp([host([el("DropShadow", { id: "fx", y: 20, blur: 30 })])]),
  Glow: () => comp([host([el("Glow", { id: "fx", color: "#ff3366", radius: 40 })])]),
  Blur: () =>
    comp([
      host([
        el("Blur", {
          id: "fx",
          radius: [
            [0, 20],
            [1, 0],
          ],
        }),
      ]),
    ]),
  Stroke: () => comp([host([el("Stroke", { id: "fx", width: 8, color: "#fff" })])]),
  Vignette: () => comp([host([el("Vignette", { id: "fx", amount: 0.6 })])]),
  ColorGrade: () =>
    comp([
      host([
        el("ColorGrade", {
          id: "fx",
          contrast: 0.12,
          temperature: -8,
          saturation: 0.2,
          exposure: [
            [0, 0],
            [1, 0.5],
          ],
        }),
      ]),
    ]),
  Curves: () =>
    comp([
      host([
        el("Curves", {
          id: "fx",
          curves: {
            rgb: [
              { x: 0, y: 0 },
              { x: 0.5, y: 0.4 },
              { x: 1, y: 1 },
            ],
          },
        }),
      ]),
    ]),
  Grain: () => comp([host([el("Grain", { id: "fx", amount: 0.2 })])]),
  Shake: () => comp([host([el("Shake", { id: "fx", amp: 6, freq: 14, decay: 5, start: "0.6s" })])]),
  Thud: () => comp([host([el("Thud", { id: "fx", amp: 30, start: "0.5s" })])]),
  Impact: () => comp([host([el("Impact", { id: "fx", start: "0.5s" })])]),
  PunchZoom: () => comp([host([el("PunchZoom", { id: "fx", start: "0.5s" })])]),
  Slam: () => comp([host([el("Slam", { id: "fx", start: "0.3s" })])]),
  SquashStretch: () => comp([host([el("SquashStretch", { id: "fx", start: "0.5s" })])]),
  Wobble: () => comp([host([el("Wobble", { id: "fx", start: "0.5s" })])]),
  WhipPan: () => comp([host([el("WhipPan", { id: "fx", start: "0.2s" })])]),
  Glitch: () => comp([host([el("Glitch", { id: "fx", start: "0.5s", duration: "0.4s" })])]),
  RGBSplit: () =>
    comp([
      host([el("RGBSplit", { id: "fx", amount: 14, decay: 6, start: "0.5s", duration: "0.8s" })]),
    ]),
  Pulse: () => comp([host([el("Pulse", { id: "fx", start: "0.5s", count: 3 })])]),
  Hitstop: () =>
    comp([
      el(
        "Rect",
        {
          id: "host",
          width: 300,
          height: 300,
          position: [
            [0, [0, 0]],
            [2, [400, 0]],
          ],
        },
        [el("Hitstop", { id: "fx", start: "1s", frames: 6 })],
      ),
    ]),
  Enter: () => comp([host([el("Enter", { id: "fx", from: "w", distance: 200 })])]),
  Exit: () => comp([host([el("Exit", { id: "fx", to: "e", distance: 200 })])]),
  Animate: () =>
    comp([host([el("Animate", { id: "fx", prop: "scale", from: 0.5, to: 1, duration: "1s" })])]),
};

const compile = (root: CCNode) => {
  const project = resolveProject(root, {
    words: (id) => (id === "vo" ? WORDS : undefined),
    mediaDuration: () => 4,
  });
  const out = compileProject(project, { words: (id) => (id === "vo" ? WORDS : undefined) });
  return { project, out };
};

describe("every definition has a schema, a renderer, a unit test and a compile snapshot", () => {
  const all = registry
    .list()
    .filter(
      (d) => !d.name.startsWith("Test") && !d.name.startsWith("CT") && !d.name.startsWith("PBlock"),
    );
  it("has a fixture for every registered component and effect", () => {
    const missing = all.map((d) => d.name).filter((n) => !FIXTURES[n]);
    expect(missing).toEqual([]);
  });
  for (const def of all) {
    describe(def.name, () => {
      it("has a schema whose empty prop set only misses required props", () => {
        const issues = validateProps(def, {});
        expect(issues.filter((i) => i.code !== "required")).toEqual([]);
      });
      it("compiles without errors and matches its snapshot", () => {
        const { project, out } = compile(FIXTURES[def.name]!());
        const errors = [...project.issues, ...out.issues].filter((i) => i.severity === "error");
        expect(errors).toEqual([]);
        // snapshot the layer HTML only (not the shared runtime) so snapshots stay reviewable
        const body = out.html.match(/<div id="root"[\s\S]*?<\/div>\n<script>/)?.[0] ?? "";
        const data = out.html.match(/window\.__ccStatic=([\s\S]*?);\nwindow\.__ccBaked/)?.[1] ?? "";
        expect({
          body,
          statics: data.length > 2000 ? data.slice(0, 2000) + "…" : data,
          outline: out.outline,
          sounds: out.sounds,
          audio: out.audio,
        }).toMatchSnapshot();
        if (def.stub) expect(out.issues.some((i) => i.rule === "stub-not-rendered")).toBe(true);
      });
    });
  }
});

describe("effects that jump at their start are neutral before it", () => {
  /** Value the page shows at time t for `target`/`prop`: baked samples once active, else the static value. */
  const pageValue = (html: string, target: string, prop: string, t: number): unknown => {
    const st = JSON.parse(
      html.match(/window\.__ccStatic=([\s\S]*?);\nwindow\.__ccBaked/)![1]!,
    ) as unknown[][];
    const bk = JSON.parse(html.match(/window\.__ccBaked=([\s\S]*?);\n/)![1]!) as unknown[][];
    const baked = bk.find((b) => b[0] === target && b[1] === prop);
    const stat = st.find((s) => s[0] === target && s[1] === prop);
    if (!baked) return stat?.[2];
    const [, , t0, hz, samples] = baked as [string, string, number, number, unknown[]];
    if (t < t0) return stat?.[2];
    return samples[Math.min(samples.length - 1, Math.round((t - t0) * hz))];
  };
  it("RGBSplit shows no split and no filter before it starts, and does during its window", () => {
    const { out } = compile(FIXTURES.RGBSplit!());
    const id = "fx-rgb";
    expect(pageValue(out.html, `#${id}-r`, "attr:dx", 0.2)).toBe(0);
    expect(pageValue(out.html, `#${id}-r`, "attr:dx", 0.6)).not.toBe(0);
    const filterOf = (t: number) => pageValue(out.html, "#host-xf", "filter", t);
    expect(filterOf(0.2) ?? "").toBe("");
    expect(String(filterOf(0.6))).toContain(`url(#${id})`);
    expect(filterOf(2.5) ?? "").toBe("");
  });
  it("Glitch is neutral before its window", () => {
    const { out } = compile(FIXTURES.Glitch!());
    const f = pageValue(out.html, "#host-xf", "filter", 0.2);
    expect(f ?? "").toBe("");
    expect(pageValue(out.html, "#host-xf", "x", 0.2) ?? 0).toBe(0);
  });
});
