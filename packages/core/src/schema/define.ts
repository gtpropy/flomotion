import { z } from "zod";
import { FRAGMENT, flattenChildren, type CCNode } from "../ast/node.js";
import { CodeCutError } from "../errors.js";
import {
  angle,
  bool,
  ease,
  enumOf,
  group,
  length,
  num,
  text,
  time,
  vec2,
  vec3,
  type AnyControl,
  type Controls,
  type PropsOf,
} from "./controls.js";
import type { EffectOutput, RenderOutput } from "./render-types.js";
import type { RenderCtx } from "../resolve/types.js";
import type { Signal } from "../anim/signal.js";

export type Trait = "visual" | "container" | "timed" | "inline";
export type Kind = "component" | "effect";

export type ResolvedProps<C extends Controls> = {
  [K in keyof C]: C[K]["animatable"] extends true ? Signal<any> : any;
};

export interface ComponentSpec<C extends Controls, T extends readonly Trait[] = readonly Trait[]> {
  category: string;
  description?: string;
  controls: C;
  /**
   * `visual` adds the transform stack and timing; `container` allows child layers;
   * `timed` adds only timing (audio, markers). Default: ["visual"].
   */
  traits?: T;
  /** Which children are allowed: "any" (default for containers), "none", "effects", or names. */
  children?: "any" | "none" | "effects" | readonly string[];
  render?: (props: ResolvedProps<C>, rc: RenderCtx) => RenderOutput;
  /** Marks a typed stub: schema exists, rendering is not implemented. */
  stub?: boolean;
  /** Which text slot receives plain-string children (e.g. "text"). */
  textChildren?: string;
  /** Box (px) children resolve `%` lengths against. Defaults to this node's own box. */
  childBox?: (raw: Record<string, unknown>, comp: { width: number; height: number }, parentBox: [number, number]) => [number, number];
}

export interface EffectSpec<C extends Controls> {
  category: string;
  description?: string;
  controls: C;
  /** Default sound tag, e.g. "hit/land". Used by autoSound. */
  sound?: string;
  apply?: (props: ResolvedProps<C>, rc: RenderCtx) => EffectOutput;
  stub?: boolean;
}

export interface ComponentDef<C extends Controls = Controls> {
  readonly kind: Kind;
  readonly name: string;
  readonly category: string;
  readonly description?: string;
  /** Full control set (own + mixins). */
  readonly controls: C;
  readonly ownKeys: readonly string[];
  readonly traits: readonly Trait[];
  readonly children: "any" | "none" | "effects" | readonly string[];
  readonly sound?: string;
  readonly stub: boolean;
  readonly textChildren?: string;
  readonly childBox?: ComponentSpec<any>["childBox"];
  readonly render?: (props: any, rc: RenderCtx) => RenderOutput;
  readonly apply?: (props: any, rc: RenderCtx) => EffectOutput;
  /** Zod object for the authoring form (expressions allowed). */
  readonly zod: z.ZodObject<any>;
  /** Zod object for the JSON wire form (MCP). */
  readonly wire: z.ZodObject<any>;
}

export type CommonProps = { children?: unknown; key?: string };

type VisualMixin = ReturnType<typeof timingControls> & ReturnType<typeof transformControls>;
type TimedMixin = ReturnType<typeof timingControls>;
type Mix<T extends readonly Trait[]> = "visual" extends T[number] ? VisualMixin : "timed" extends T[number] ? TimedMixin : {};
type EffectMixin = ReturnType<typeof effectCommon>;
export type Tag<C extends Controls> = ((props: PropsOf<C> & CommonProps) => CCNode) & { def: ComponentDef<C> };

// ---------- registry ----------

export class Registry {
  private defs = new Map<string, ComponentDef<any>>();
  register<C extends Controls>(def: ComponentDef<C>): ComponentDef<C> {
    this.defs.set(def.name, def);
    return def;
  }
  get(name: string): ComponentDef | undefined {
    return this.defs.get(name);
  }
  has(name: string): boolean {
    return this.defs.has(name);
  }
  list(kind?: Kind): ComponentDef[] {
    return [...this.defs.values()].filter((d) => !kind || d.kind === kind);
  }
  names(): string[] {
    return [...this.defs.keys()];
  }
}

/** Default registry. Definitions register themselves at import time and are read-only afterwards. */
export const registry = new Registry();

// ---------- shared control sets ----------

export const BLEND_MODES = [
  "normal",
  "multiply",
  "screen",
  "overlay",
  "darken",
  "lighten",
  "color-dodge",
  "color-burn",
  "soft-light",
  "hard-light",
  "difference",
  "exclusion",
  "hue",
  "saturation",
  "color",
  "luminosity",
  "add",
] as const;

/** Stable identity and timing, shared by everything placed in a composition. */
export const timingControls = () => ({
  id: text({ label: "Id", description: "Stable unique id. Written back as cc_… when missing." }),
  label: text({ label: "Label" }),
  start: time({
    label: "Start",
    unit: "s",
    description: 'Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.',
  }),
  duration: time({ label: "Duration", unit: "s", description: "Defaults to the rest of the parent." }),
  end: time({ label: "End", unit: "s", description: "Alternative to duration." }),
  hidden: bool({ default: false, label: "Hidden" }),
  link: text({ description: "Link group id: linked clips move, trim and split together." }),
});

/** The transform stack every visual layer carries. All animatable. */
export const transformControls = () => ({
  position: vec3({ animatable: true, default: [0, 0, 0], unit: "px", ui: "vec" }),
  rotation: vec3({ animatable: true, default: [0, 0, 0], unit: "deg", ui: "vec" }),
  scale: vec3({ animatable: true, default: [1, 1, 1], step: 0.01, ui: "vec" }),
  skew: vec2({ animatable: true, default: [0, 0], unit: "deg", ui: "vec" }),
  anchor: vec3({
    animatable: true,
    default: [50, 50, 0],
    unit: "%",
    ui: "vec",
    description: "Transform origin as % of the layer box (z in px).",
  }),
  opacity: num({ animatable: true, min: 0, max: 1, step: 0.01, default: 1, ui: "slider" }),
  crop: group(
    {
      top: length({ animatable: true, default: 0 }),
      right: length({ animatable: true, default: 0 }),
      bottom: length({ animatable: true, default: 0 }),
      left: length({ animatable: true, default: 0 }),
    },
    { label: "Crop" },
  ),
  flip: enumOf(["none", "x", "y", "xy"], { default: "none" }),
  blend: enumOf(BLEND_MODES, { default: "normal", ui: "dropdown" }),
  perspective: num({ animatable: true, min: 0, default: 0, unit: "px" }),
  z: num({ default: 0, step: 1, description: "Stacking override among siblings." }),
  enter: group(motionFields(), { label: "Enter", description: "Entrance motion at the start of the layer." }),
  exit: group(motionFields(), { label: "Exit", description: "Exit motion ending at the end of the layer." }),
});

export const MOTION_DIRECTIONS = ["n", "ne", "e", "se", "s", "sw", "w", "nw", "center", "z+", "z-"] as const;

/** Fields shared by the `enter`/`exit` props and the Enter/Exit effects. */
export function motionFields() {
  return {
    from: enumOf(MOTION_DIRECTIONS, { default: "s", description: "Direction the layer comes from (enter)." }),
    to: enumOf(MOTION_DIRECTIONS, { default: "s", description: "Direction the layer leaves toward (exit)." }),
    distance: length({ default: 120, description: "Travel distance in px (or vw/vh/%)." }),
    ease: ease({ default: "expo.out" }),
    duration: time({ default: 0.6, unit: "s" }),
    delay: time({ default: 0, unit: "s" }),
    fade: bool({ default: true }),
    blur: num({ min: 0, max: 200, default: 0, unit: "px" }),
    scale: num({ min: 0, max: 10, default: 1, description: "Scale at the start of an enter / end of an exit." }),
    rotate: angle({ default: 0 }),
  };
}

export const AT_PRESETS = [
  "center",
  "top",
  "bottom",
  "left",
  "right",
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
] as const;

export const effectCommon = () => ({
  id: text({ label: "Id" }),
  start: time({ unit: "s", description: "Start relative to the parent layer." }),
  duration: time({ unit: "s" }),
  enabled: bool({ default: true }),
});

// ---------- helpers ----------

function mergeControls<C extends Controls>(own: C, mixins: Controls[]): Controls {
  const out: Controls = {};
  for (const m of mixins) for (const [k, v] of Object.entries(m)) out[k] = v;
  for (const [k, v] of Object.entries(own)) out[k] = v; // own wins
  return out;
}

function zodShape(controls: Controls, form: "prop" | "wire"): Record<string, z.ZodType> {
  const shape: Record<string, z.ZodType> = {};
  for (const [k, c] of Object.entries(controls)) {
    const s = form === "prop" ? c.prop : c.wire;
    shape[k] = s.optional();
  }
  return shape;
}

function makeDef<C extends Controls>(
  kind: Kind,
  name: string,
  base: {
    category: string;
    description?: string;
    own: C;
    mixins: Controls[];
    traits: Trait[];
    children: "any" | "none" | "effects" | readonly string[];
    sound?: string;
    stub?: boolean;
    textChildren?: string;
    childBox?: ComponentSpec<any>["childBox"];
    render?: (props: any, rc: RenderCtx) => RenderOutput;
    apply?: (props: any, rc: RenderCtx) => EffectOutput;
  },
): ComponentDef<C> {
  if (!/^[A-Z][A-Za-z0-9]*$/.test(name)) {
    throw new CodeCutError("schema_violation", `Component name "${name}" must be PascalCase`);
  }
  if (!base.own || typeof base.own !== "object") {
    throw new CodeCutError("schema_violation", `${name}: components without a schema are rejected`, {
      fix: "Pass `controls` describing every prop.",
    });
  }
  const controls = mergeControls(base.own, base.mixins);
  if (!controls.id) controls.id = text({ label: "Id", description: "Stable unique id. Written back as cc_… when missing." });
  const def: ComponentDef<C> = {
    kind,
    name,
    category: base.category,
    description: base.description,
    controls: controls as C,
    ownKeys: Object.keys(base.own),
    traits: base.traits,
    children: base.children,
    sound: base.sound,
    stub: base.stub ?? false,
    textChildren: base.textChildren,
    childBox: base.childBox,
    render: base.render,
    apply: base.apply,
    zod: z.object(zodShape(controls, "prop")).strict(),
    wire: z.object(zodShape(controls, "wire")).strict(),
  };
  return registry.register(def);
}

function makeTag<C extends Controls>(def: ComponentDef<C>): Tag<C> {
  const tag = ((props: Record<string, unknown> = {}) => {
    const { children, key: _key, ...rest } = props as { children?: unknown; key?: string } & Record<string, unknown>;
    return { $cc: 1 as const, name: def.name, props: rest, children: flattenChildren(children) } satisfies CCNode;
  }) as Tag<C>;
  tag.def = def;
  Object.defineProperty(tag, "name", { value: def.name });
  return tag;
}

// ---------- public API ----------

/** The only way to add a component. Components without controls are rejected. */
export function defineComponent<C extends Controls, const T extends readonly Trait[] = readonly ["visual"]>(
  name: string,
  spec: ComponentSpec<C, T>,
): Tag<C & Mix<T>> {
  const traits: Trait[] = [...(spec.traits ?? ["visual"])];
  const mixins: Controls[] = [];
  if (traits.includes("visual") || traits.includes("timed")) mixins.push(timingControls());
  if (traits.includes("visual")) mixins.push(transformControls());
  const children = spec.children ?? (traits.includes("container") ? "any" : "effects");
  const def = makeDef("component", name, {
    category: spec.category,
    description: spec.description,
    own: spec.controls,
    mixins,
    traits,
    children,
    stub: spec.stub,
    textChildren: spec.textChildren,
    childBox: spec.childBox,
    render: spec.render as any,
  });
  return makeTag(def) as unknown as Tag<C & Mix<T>>;
}

/** Effects apply to their parent layer in source order. */
export function defineEffect<C extends Controls>(name: string, spec: EffectSpec<C>): Tag<C & EffectMixin> {
  const def = makeDef("effect", name, {
    category: spec.category,
    description: spec.description,
    own: spec.controls,
    mixins: [effectCommon()],
    traits: [],
    children: "none",
    sound: spec.sound,
    stub: spec.stub,
    apply: spec.apply as any,
  });
  return makeTag(def) as unknown as Tag<C & EffectMixin>;
}

/** Built-in fragment tag (no schema; flattened by the runtime). */
export const Fragment = Symbol.for("codecut.fragment");
export { FRAGMENT };

// ---------- validation ----------

export interface PropIssue {
  prop: string;
  code: "unknown_prop" | "not_animatable" | "invalid_value" | "required";
  message: string;
  fix?: string;
}

function lev(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...new Array(b.length).fill(0)]) as number[][];
  for (let j = 0; j <= b.length; j++) d[0]![j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i]![j] = Math.min(d[i - 1]![j]! + 1, d[i]![j - 1]! + 1, d[i - 1]![j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length]![b.length]!;
}

export const suggest = (name: string, options: string[]): string | undefined =>
  options.map((o) => [o, lev(name.toLowerCase(), o.toLowerCase())] as const).sort((a, b) => a[1] - b[1]).find(([, d]) => d <= 2)?.[0];

const isKeyframeLike = (v: unknown) =>
  (Array.isArray(v) && v.length > 0 && v.every((k) => Array.isArray(k) || (typeof k === "object" && k !== null && "t" in k))) ||
  (typeof v === "object" && v !== null && !Array.isArray(v) && Array.isArray((v as any).keys));

/** Validate raw props against a definition. Returns issues; never throws. */
export function validateProps(def: ComponentDef, props: Record<string, unknown>): PropIssue[] {
  const issues: PropIssue[] = [];
  const names = Object.keys(def.controls);
  for (const [key, value] of Object.entries(props)) {
    const c: AnyControl | undefined = def.controls[key];
    if (!c) {
      const s = suggest(key, names);
      issues.push({
        prop: key,
        code: "unknown_prop",
        message: `${def.name} has no prop "${key}"${s ? `. Did you mean "${s}"?` : ""}`,
        fix: s ? `Rename to "${s}".` : `Valid props: ${names.join(", ")}`,
      });
      continue;
    }
    if (value === undefined) continue;
    if (!c.animatable && (typeof value === "function" || (c.kind !== "json" && c.kind !== "group" && c.kind !== "list" && c.kind !== "curve" && c.kind !== "curves" && c.kind !== "fill" && isKeyframeLike(value)))) {
      issues.push({
        prop: key,
        code: "not_animatable",
        message: `${def.name}.${key} is not animatable (got ${typeof value === "function" ? "an expression" : "keyframes"})`,
        fix: "Use a static value, or animate a prop marked animatable.",
      });
      continue;
    }
    const r = c.prop.safeParse(value);
    if (!r.success) {
      issues.push({
        prop: key,
        code: "invalid_value",
        message: `${def.name}.${key}: ${describeZod(r.error)}`,
        fix: rangeHint(c),
      });
    }
  }
  for (const [k, c] of Object.entries(def.controls)) {
    if (c.opts.required && props[k] === undefined) {
      issues.push({ prop: k, code: "required", message: `${def.name}.${k} is required`, fix: `Add ${k}=…` });
    }
  }
  return issues;
}

function describeZod(err: z.ZodError): string {
  const msgs = err.issues.flatMap((i) => {
    if (i.code === "invalid_union") {
      const inner = (i as any).errors?.flat?.() ?? [];
      const best = inner.find((x: any) => x.message && x.code !== "invalid_type") ?? inner[0];
      return [best?.message ?? "invalid value"];
    }
    return [i.message];
  });
  return [...new Set(msgs)].join("; ");
}

function rangeHint(c: AnyControl): string | undefined {
  const { min, max, unit } = c.opts;
  if (min !== undefined || max !== undefined) {
    return `Allowed range ${min ?? "-∞"} to ${max ?? "∞"}${unit ? ` ${unit}` : ""}.`;
  }
  if (c.values) return `One of: ${c.values.join(", ")}.`;
  return undefined;
}

/** Throw a schema_violation CodeCutError when any issue exists. */
export function assertProps(def: ComponentDef, props: Record<string, unknown>, id?: string): void {
  const issues = validateProps(def, props);
  if (issues.length) {
    const head = issues[0]!;
    throw new CodeCutError("schema_violation", `${id ? `#${id} ` : ""}${head.message}`, {
      fix: head.fix,
      details: issues,
    });
  }
}

/** Fill in declared defaults for props not provided. Static form only. */
export function applyDefaults(def: ComponentDef, props: Record<string, unknown>): Record<string, unknown> {
  const out = { ...props };
  for (const [k, c] of Object.entries(def.controls)) {
    if (out[k] === undefined && c.opts.default !== undefined) out[k] = c.opts.default;
  }
  return out;
}

export { angle };
