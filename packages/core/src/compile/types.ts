import type { Signal } from "../anim/signal.js";
import type { TextMeasurer } from "../fonts/measure.js";
import type { AudioEvent, Channel, Offset, SoundCue } from "../schema/render-types.js";
import type { Registry } from "../schema/define.js";
import type { ResolveIssue } from "../resolve/types.js";
import type { BakedChannel, StaticValue } from "./bake.js";

export interface CompileOptions {
  registry?: Registry;
  /** Cached text measurement (headless Chrome). */
  measure?: TextMeasurer;
  /** Map an asset reference to a root-relative path in the output project. */
  assetPath?: (src: string) => string;
  /** Path of the vendored GSAP file relative to index.html. */
  gsapPath?: string;
  /** Pre-mixed audio to embed as a single <audio id="cc-mix">. */
  mix?: { src: string; duration?: number };
}

export interface IRLayer {
  id: string;
  name: string;
  kind: "composition" | "track" | "layer" | "hidden";
  start: number;
  /** Visible end (a Scene gets extended while the next scene transitions in). */
  end: number;
  z: number;
  trackIndex?: number;
  children: IRLayer[];
  /** Inner markup of the xf element, `{{children}}` already substituted. */
  html: string;
  css: string;
  hostStyle: Record<string, string>;
  xfStyle: Record<string, string>;
  /** Pending transform contributions from effects / enter / exit / transitions. */
  offsets: Offset[];
  filters: Signal<string>[];
  channels: Channel[];
  /** Static GSAP props from the renderer (xPercent, ...). */
  statics: Record<string, number | string>;
  defs: string[];
  overlays: string[];
  /** True when this layer gets the generic transform stack. */
  visual: boolean;
  sounds: SoundCue[];
  audio: AudioEvent[];
  /** Node reference data for debugging / outlines. */
  source: { id: string };
  /** Filled by finalize: sampled/static page state. */
  baked: BakedChannel[];
  statics2: StaticValue[];
}

export interface CompileResult {
  html: string;
  ir: IRLayer;
  audio: AudioEvent[];
  sounds: SoundCue[];
  issues: ResolveIssue[];
  /** Font ids actually referenced by rendered text (for the font gate). */
  fontsUsed: string[];
  /** Stable summary of the IR for snapshots (no signals). */
  outline: unknown;
}
