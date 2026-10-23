import type { Signal } from "../anim/signal.js";
import type { CCNode } from "../ast/node.js";
import type { ComponentDef } from "../schema/define.js";
import type { Length } from "../values/length.js";

export interface ResolvedFont {
  id: string;
  family: string;
  /** Local file(s) relative to the project root, with lock hash. */
  files: Array<{ path: string; weight?: number | [number, number]; style?: string; hash?: string; unicodeRange?: string; format: string }>;
  fallback: string[];
  source: "google" | "local" | "url" | "system";
  variable: boolean;
  axes?: Record<string, [number, number]>;
  license?: string;
}

export interface TypeToken {
  font: string;
  size?: number;
  weight?: number;
  tracking?: number;
  leading?: number;
}

export interface ResolvedTheme {
  id?: string;
  /** Flat token map: "brand.primary" -> "#ff3366", "type.display" -> TypeToken. */
  tokens: Record<string, unknown>;
  palette: Record<string, string>;
  type: Record<string, TypeToken>;
  easing: Record<string, string>;
  transition?: { type: string; duration: number };
  grain?: number;
  sound?: Record<string, string>;
}

export interface ResolvedComp {
  id: string;
  width: number;
  height: number;
  fps: number;
  duration: number;
  background: string;
  theme: ResolvedTheme;
  fonts: ResolvedFont[];
  /** Tempo in BPM if the composition declares one (for ctx.beat). */
  bpm?: number;
}

export interface RNode {
  id: string;
  /** True when the id was generated because the source had none. */
  generatedId: boolean;
  name: string;
  def: ComponentDef;
  source: CCNode;
  /** Normalised props: animatable ones are Signals, everything else static. */
  props: Record<string, any>;
  /** Original props as written. */
  raw: Record<string, unknown>;
  parent: RNode | null;
  /** Child layers (non-effect). */
  children: RNode[];
  /** Effect children in source order. */
  effects: RNode[];
  /** Ordered children as written, nodes replaced by RNode, strings kept (rich text). */
  content: Array<RNode | string | number>;
  /** Absolute seconds. */
  start: number;
  duration: number;
  end: number;
  /** Absolute start of the container keyframe times are relative to. */
  parentStart: number;
  /** Parent box in px (basis for % lengths). */
  box: [number, number];
  /** Stacking order among siblings (source order unless `z` is set). */
  z: number;
  track?: string;
  depth: number;
}

export interface TimelineMarker {
  at: number;
  label?: string;
  color?: string;
  id: string;
}

export interface ResolveIssue {
  severity: "error" | "warning" | "info";
  rule: string;
  message: string;
  id?: string;
  prop?: string;
  fix?: string;
}

export interface ResolvedProject {
  comp: ResolvedComp;
  root: RNode;
  /** All nodes by id. */
  byId: Map<string, RNode>;
  markers: TimelineMarker[];
  issues: ResolveIssue[];
  /** Tracks in declaration order. */
  tracks: Array<{ id: string; kind: string; locked: boolean; muted: boolean; solo: boolean }>;
}

export interface RenderCtx {
  node: RNode;
  comp: ResolvedComp;
  project: ResolvedProject;
  id: string;
  fps: number;
  /** DOM id for a sub-element: `${id}-${suffix}`. */
  sub(suffix: string): string;
  /** Resolve a Length to px. `axis` picks the parent box dimension for `%`. */
  px(len: Length, axis?: "x" | "y"): number;
  /** Value of a resolved prop at absolute time t (Signals evaluated, constants returned). */
  at<T = any>(prop: string, t: number): T;
  /** Evaluate any signal at absolute time t. */
  evalSignal<T>(sig: Signal<T>, t: number): T;
  /** CSS font-family stack for a font id, token ("$type.display") or family name. */
  fontFamily(fontRef: string | undefined): string;
  /** Root-relative path for an asset reference ("./clip.mp4", "freesound:123"). */
  assetPath(src: string): string;
  /** Text measurement service (headless Chrome, cached). Undefined when unavailable. */
  measure?: import("../fonts/measure.js").TextMeasurer;
  /** Escape text for HTML. */
  esc(s: string): string;
}
