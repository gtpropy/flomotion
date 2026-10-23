import type { Signal } from "../anim/signal.js";
import type { CCNode } from "../ast/node.js";

/** One animated DOM property. Compiled into GSAP (native tween or baked sampler). */
export interface Channel {
  /** CSS selector inside the page, usually `#<id>-<part>`. */
  target: string;
  /** GSAP property (x, y, rotation, opacity, strokeDashoffset, ...), or "text" for textContent. */
  prop: string;
  signal: Signal;
  /** CSS unit appended to numeric values (e.g. "px", "%"). */
  unit?: string;
  /** For `text` channels: formats a number to the visible string. */
  format?: (v: any) => string;
  /** Absolute interval to sample over (defaults to the element's span). */
  span?: [number, number];
}

/** A parent transform channel nudged by an effect. */
export interface Offset {
  prop: "x" | "y" | "z" | "rotation" | "rotationX" | "rotationY" | "scaleX" | "scaleY" | "scale" | "skewX" | "skewY" | "opacity";
  mode: "add" | "mul";
  signal: Signal<number>;
}

export interface Overlay {
  html: string;
  css?: string;
  channels?: Channel[];
}

/** What an effect contributes to its parent layer. */
export interface EffectOutput {
  /** Additive/multiplicative contributions to the parent's transform channels. */
  offsets?: Offset[];
  /** Entries appended, in source order, to the parent's CSS `filter` chain. */
  filters?: Signal<string>[];
  /** CSS `box-shadow`/`text-shadow` style fragments or other static CSS declarations. */
  style?: Record<string, string>;
  /** SVG markup placed in a hidden <svg><defs>, referenced by `filters` via url(#id). */
  defs?: string;
  /** Extra element placed inside the parent (grain, vignette). */
  overlay?: Overlay;
  /** Extra channels (e.g. animate an SVG filter attribute). */
  channels?: Channel[];
  css?: string;
  /** Sound events this effect wants (autoSound). */
  sounds?: SoundCue[];
}

export interface SoundCue {
  /** Tag such as "hit/land". */
  tag: string;
  /** Absolute time in seconds the cue should land on. */
  at: number;
  gain?: number;
  source: string;
}

export interface RenderOutput {
  /** Inner markup. `{{children}}` marks where nested layers render. */
  html: string;
  css?: string;
  channels?: Channel[];
  /** Host box style overrides (width/height/etc. in px or css). */
  box?: Record<string, string>;
  /** `false` hides the generic transform wrapper (non-visual elements). */
  visual?: boolean;
  /** Extra head/body markup (e.g. <audio>). */
  extra?: { audio?: AudioEvent[] };
  sounds?: SoundCue[];
}

export interface AudioEvent {
  id: string;
  src: string;
  /** Absolute composition time the clip starts at. */
  start: number;
  duration?: number;
  /** Offset into the source (trim / peak lead-in). */
  mediaStart?: number;
  gainDb?: number;
  bus: "voice" | "music" | "sfx";
  /** Playback rate for Clip speed. */
  rate?: number;
}

/** Resolved node as seen by renderers. Defined in resolve/types; re-exported for components. */
export interface RenderNodeRef {
  id: string;
  name: string;
  start: number;
  duration: number;
  node: CCNode;
}
