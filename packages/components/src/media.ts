import {
  bool,
  color,
  defineComponent,
  enumOf,
  exprSignal,
  length,
  num,
  parseEase,
  parseTimeLiteral,
  ref,
  text,
  time,
  type AudioEvent,
  type Channel,
  type ComponentDef,
  type RenderCtx,
} from "@codecut/core";
import { atControl, css, esc, placement, round } from "./util.js";
import { renderText } from "./text/text.js";
import { textStyleControls, typographyControls } from "./text/controls.js";

const fit = () => enumOf(["cover", "contain", "fill"], { default: "cover" });

const fullBox = (
  rc: RenderCtx,
  p: { width?: number | string; height?: number | string; at?: unknown },
) => {
  const w = p.width === undefined ? rc.node.box[0] : rc.px(p.width, "x");
  const h = p.height === undefined ? rc.node.box[1] : rc.px(p.height, "y");
  const pl = placement(p.width === undefined && p.height === undefined ? "top-left" : p.at, rc);
  return {
    w,
    h,
    box: { ...pl.box, width: `${round(w)}px`, height: `${round(h)}px` },
    statics: pl.statics,
  };
};

export const Image = defineComponent("Image", {
  category: "media",
  description:
    "A still image. Defaults to filling its parent box; use the transform stack for Ken Burns moves.",
  children: "effects",
  controls: {
    at: atControl(),
    src: text({
      required: true,
      description: "Image file in the project, e.g. ./assets/logo.png.",
    }),
    width: length(),
    height: length(),
    fit: fit(),
    alt: text(),
  },
  render: (p, rc) => {
    const b = fullBox(rc, p);
    return {
      html: `<img src="${esc(rc.assetPath(String(p.src)))}" alt="${esc(String(p.alt ?? ""))}" style="width:100%;height:100%;object-fit:${p.fit};display:block">`,
      box: b.box,
      statics: b.statics,
    };
  },
});

const trimControls = () => ({
  in: time({ default: 0, unit: "s", description: "Source in point (trim)." }),
  out: time({ unit: "s", description: "Source out point." }),
  speed: num({ min: 0.1, max: 10, default: 1, step: 0.05 }),
  reverse: bool({
    default: false,
    description: "Reverse playback (needs a pre-rendered reversed copy: later).",
  }),
});

export const Video = defineComponent("Video", {
  category: "media",
  description:
    "A video file. Its picture is rendered by HyperFrames; its sound (if `volume` > 0) goes into the offline mix, so the <video> stays muted.",
  children: "effects",
  controls: {
    at: atControl(),
    src: text({ required: true }),
    width: length(),
    height: length(),
    fit: fit(),
    ...trimControls(),
    volume: num({
      min: -60,
      max: 12,
      default: -60,
      unit: "dB",
      description: "Gain of the clip's own audio in the mix; -60 mutes.",
    }),
    bus: enumOf(["sfx", "music", "voice"], { default: "sfx" }),
  },
  render: (p, rc) => {
    const b = fullBox(rc, p);
    const inT = parseTimeLiteral(p.in as number | string, rc.fps);
    const dur = rc.node.end - rc.node.start;
    const audio: AudioEvent[] =
      p.volume > -60
        ? [
            {
              id: `${rc.id}-a`,
              src: String(p.src),
              start: rc.node.start,
              duration: dur,
              mediaStart: inT,
              gainDb: p.volume,
              bus: p.bus,
              rate: p.speed,
              fromVideo: true,
            },
          ]
        : [];
    return {
      html: `<video id="${rc.sub("v")}" class="clip" src="${esc(rc.assetPath(String(p.src)))}" muted playsinline data-start="${rc.node.start}" data-duration="${round(dur, 4)}" data-media-start="${inT}"${p.speed !== 1 ? ` data-playback-rate="${p.speed}"` : ""} style="position:absolute;left:0;top:0;width:100%;height:100%;object-fit:${p.fit}"></video>`,
      box: b.box,
      statics: b.statics,
      extra: { audio },
      issues: p.reverse
        ? ["`reverse` needs a pre-rendered reversed copy of the clip (later); playing forward"]
        : undefined,
    };
  },
});

export const Clip = defineComponent("Clip", {
  category: "media",
  description:
    "A trimmed piece of video on a track: `in`/`out` select the source range, `speed` retimes it, `volume` is its mix gain.",
  children: "effects",
  controls: {
    at: atControl(),
    src: text({ required: true }),
    width: length(),
    height: length(),
    fit: fit(),
    ...trimControls(),
    volume: num({ min: -60, max: 12, default: -60, unit: "dB" }),
    bus: enumOf(["sfx", "music", "voice"], { default: "sfx" }),
  },
  render: (p, rc) => (Video.def.render as NonNullable<ComponentDef["render"]>)(p, rc),
});

const audioEvent = (rc: RenderCtx, p: any, bus: AudioEvent["bus"], at: number): AudioEvent => ({
  id: rc.id,
  src: String(p.src),
  start: at,
  duration: rc.node.end > at ? undefined : undefined,
  mediaStart: p.in === undefined ? undefined : parseTimeLiteral(p.in, rc.fps),
  gainDb: typeof p.gain === "number" ? p.gain : 0,
  bus,
  peak:
    p.peak === undefined || p.peak === ""
      ? undefined
      : isNaN(Number(p.peak))
        ? String(p.peak)
        : Number(p.peak),
  fadeIn: p.fadeIn,
  fadeOut: p.fadeOut,
  rate: p.speed,
});

export const Audio = defineComponent("Audio", {
  category: "media",
  description:
    "Background audio (music or ambience) on a bus. Mixed offline with FFmpeg; music ducks under voice.",
  traits: ["timed"],
  children: "none",
  controls: {
    src: text({ required: true }),
    in: time({ default: 0, unit: "s" }),
    gain: num({ min: -60, max: 12, default: 0, unit: "dB" }),
    bus: enumOf(["music", "sfx", "voice"], { default: "music" }),
    fadeIn: num({ min: 0, default: 0, unit: "s" }),
    fadeOut: num({ min: 0, default: 0, unit: "s" }),
    speed: num({ min: 0.1, max: 10, default: 1 }),
  },
  render: (p, rc) => {
    const ev = audioEvent(rc, p, p.bus, rc.node.start);
    ev.duration = rc.node.end - rc.node.start;
    return { html: "", visual: false, extra: { audio: [ev] } };
  },
});

export const Sound = defineComponent("Sound", {
  category: "media",
  description:
    "A sound effect placed on a moment. `at` is where the sound's peak should land; the clip starts early by its peak offset (`peak` is a number of seconds or a named peak from the ledger).",
  traits: [],
  children: "none",
  controls: {
    id: text({ required: true }),
    src: text({ required: true, description: '"freesound:12345" or a project file.' }),
    at: time({ unit: "s", required: true }),
    peak: text({ description: "Seconds, or a named peak (e.g. land) stored with the asset." }),
    gain: num({ min: -60, max: 12, default: 0, unit: "dB" }),
    in: time({ default: 0, unit: "s" }),
    speed: num({ min: 0.1, max: 10, default: 1 }),
    bus: enumOf(["sfx", "music", "voice"], { default: "sfx" }),
    tag: text({ description: "Sound tag it was chosen for, e.g. hit/land." }),
  },
  render: (p, rc) => {
    const at =
      rc.node.parentStart + (typeof p.at === "number" ? p.at : parseTimeLiteral(p.at, rc.fps));
    return { html: "", visual: false, extra: { audio: [audioEvent(rc, p, p.bus, at)] } };
  },
});

export const Voiceover = defineComponent("Voiceover", {
  category: "media",
  description:
    "The narration. Loads the audio and its word timings (`voice.words.json`) so captions and `ctx.word(id, i)` can use them.",
  traits: [],
  children: "none",
  controls: {
    id: text({ required: true }),
    src: text({ required: true }),
    words: text({ description: "Word timings file (default: <src>.words.json)." }),
    at: time({ default: 0, unit: "s" }),
    gain: num({ min: -60, max: 12, default: 0, unit: "dB" }),
    script: text({
      multiline: true,
      description: "The spoken script (for review and caption fallback).",
    }),
  },
  render: (p, rc) => {
    const at =
      rc.node.parentStart + (typeof p.at === "number" ? p.at : parseTimeLiteral(p.at, rc.fps));
    return {
      html: "",
      visual: false,
      extra: { audio: [audioEvent(rc, { ...p, in: undefined }, "voice", at)] },
    };
  },
});

// ---------- Captions ----------

export interface Word {
  w: string;
  start: number;
  end: number;
}
export interface CaptionPage {
  words: Word[];
  start: number;
  end: number;
}

/** Group words into caption pages by line length and gap (pure; shared with .srt/.vtt export). */
export function paginateWords(
  words: Word[],
  opts: { maxChars: number; maxWords?: number; gap?: number; mode?: "line" | "word" },
): CaptionPage[] {
  const pages: CaptionPage[] = [];
  let cur: Word[] = [];
  const flush = () => {
    if (cur.length) pages.push({ words: cur, start: cur[0]!.start, end: cur[cur.length - 1]!.end });
    cur = [];
  };
  for (const w of words) {
    if (opts.mode === "word") {
      cur = [w];
      flush();
      continue;
    }
    const len = [...cur, w].map((x) => x.w).join(" ").length;
    const gapBreak = cur.length > 0 && w.start - cur[cur.length - 1]!.end > (opts.gap ?? 0.8);
    const endPunct = cur.length > 0 && /[.!?]$/.test(cur[cur.length - 1]!.w);
    if (
      cur.length &&
      (len > opts.maxChars || cur.length >= (opts.maxWords ?? 99) || gapBreak || endPunct)
    )
      flush();
    cur.push(w);
  }
  flush();
  return pages;
}

const ts = (s: number, sep: string) => {
  const ms = Math.round(s * 1000);
  const p = (n: number, l = 2) => String(n).padStart(l, "0");
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)}${sep}${p(ms % 1000, 3)}`;
};

export function toSrt(pages: CaptionPage[]): string {
  return pages
    .map(
      (pg, i) =>
        `${i + 1}\n${ts(pg.start, ",")} --> ${ts(pg.end, ",")}\n${pg.words.map((w) => w.w).join(" ")}\n`,
    )
    .join("\n");
}
export function toVtt(pages: CaptionPage[]): string {
  return `WEBVTT\n\n${pages.map((pg) => `${ts(pg.start, ".")} --> ${ts(pg.end, ".")}\n${pg.words.map((w) => w.w).join(" ")}\n`).join("\n")}`;
}

export const Captions = defineComponent("Captions", {
  category: "media",
  description:
    "Captions from a Voiceover's word timings. Styles: karaoke (active word recoloured), pop (active word scales), line (whole line), word (one word at a time). Export .srt/.vtt with the CLI or MCP.",
  children: "effects",
  controls: {
    voice: ref({ required: true, description: 'The Voiceover, e.g. "#vo".' }),
    captionStyle: enumOf(["karaoke", "pop", "line", "word"], { default: "karaoke" }),
    maxChars: num({
      min: 6,
      max: 80,
      default: 22,
      step: 1,
      description: "Max characters per line.",
    }),
    maxWords: num({ min: 1, max: 12, default: 4, step: 1 }),
    activeColor: color({ default: "#ffe14d" }),
    at: atControl(),
    hold: num({
      min: 0,
      max: 2,
      default: 0.15,
      unit: "s",
      description: "How long a page lingers after its last word.",
    }),
    ...typographyControls(),
    ...textStyleControls(),
    size: num({ animatable: true, min: 1, max: 2000, default: 64, step: 1, unit: "px" }),
    weight: num({ animatable: true, min: 1, max: 1000, default: 800, step: 1, unit: "wght" }),
    align: enumOf(["left", "center", "right", "justify"], { default: "center" }),
    font: text({ default: "$type.display" }),
  },
  render: (p, rc) => {
    const id = String(p.voice).replace(/^#/, "");
    const words = rc.words(id);
    if (!words?.length)
      return { html: "", issues: [`Voiceover ${p.voice} has no word timings yet; run transcribe`] };
    const pages = paginateWords(words, {
      maxChars: p.maxChars,
      maxWords: p.maxWords,
      mode: p.captionStyle === "word" ? "word" : "line",
    });
    const channels: Channel[] = [];
    let html = "";
    const tAbs = (s: number) => s; // word times are absolute composition seconds
    pages.forEach((pg, i) => {
      const pid = rc.sub(`p${i}`);
      const a = tAbs(pg.start);
      const b = Math.min(
        tAbs(pg.end) + p.hold,
        pages[i + 1] ? tAbs(pages[i + 1]!.start) : Infinity,
      );
      const body = pg.words
        .map((w, k) => {
          const wid = rc.sub(`p${i}w${k}`);
          return `<span id="${wid}" style="display:inline-block;white-space:pre">${esc(w.w)}${k < pg.words.length - 1 ? " " : ""}</span>`;
        })
        .join("");
      html += `<div id="${pid}" style="position:absolute;left:0;top:0;width:100%;text-align:${p.align};opacity:0">${body}</div>`;
      channels.push({
        target: `#${pid}`,
        prop: "opacity",
        signal: exprSignal((t) => (t >= a && t < b ? 1 : 0), "number", [
          Math.max(0, a - 0.05),
          b + 0.05,
        ]),
        span: [Math.max(0, a - 0.05), b + 0.05],
      });
      if (p.captionStyle === "karaoke" || p.captionStyle === "pop") {
        pg.words.forEach((w, k) => {
          const wid = rc.sub(`p${i}w${k}`);
          const ws = tAbs(w.start);
          const we = tAbs(w.end);
          const span: [number, number] = [a, b];
          const act = (t: number) => t >= ws && t < we;
          channels.push({
            target: `#${wid}`,
            prop: "color",
            signal: exprSignal((t) => (act(t) ? p.activeColor : "inherit"), "discrete", span),
            span,
            format: (v) => String(v),
          });
          if (p.captionStyle === "pop") {
            const q = (t: number) => Math.min(1, Math.max(0, (t - ws) / 0.2));
            const pe = parseEase("back.out(2.2)");
            channels.push({
              target: `#${wid}`,
              prop: "scale",
              signal: exprSignal(
                (t) => (act(t) ? round(1 + 0.2 * pe(q(t)), 4) : 1),
                "number",
                span,
              ),
              span,
            });
          }
        });
      }
    });
    // measure the tallest page with the text renderer so the box has a height
    const sample = pages.reduce(
      (m, pg) =>
        pg.words.map((w) => w.w).join(" ").length > m.length
          ? pg.words.map((w) => w.w).join(" ")
          : m,
      "",
    );
    const t = renderText({ ...p, text: sample, at: p.at }, rc);
    const boxCss = t.box ?? {};
    const style = (t.html.match(/<div id="[^"]+-text"[^>]*style="([^"]*)"/)?.[1] ?? "").replace(
      /position:relative;?/,
      "",
    );
    return {
      html: `<div id="${rc.sub("text")}" style="${style};position:relative;min-height:${round(rc.at<number>("size", rc.node.start) * rc.at<number>("leading", rc.node.start))}px">${html}</div>`,
      box: {
        ...boxCss,
        width: `${round(rc.px((rc.node.props.maxWidth as number | string) ?? "92%", "x"))}px`,
      },
      statics: t.statics,
      channels: [...(t.channels ?? []), ...channels],
      issues: t.issues,
    };
  },
});

export const mediaComponents: ComponentDef[] = [
  Image.def,
  Video.def,
  Clip.def,
  Audio.def,
  Sound.def,
  Voiceover.def,
  Captions.def,
];
export { css };
