import { z } from "zod";
import type { Animatable } from "../anim/types.js";
import type { ValueKind } from "../anim/keyframes.js";
import { CodeCutError } from "../errors.js";
import { parseAngle } from "../values/angle.js";
import { parseEase } from "../values/ease.js";
import { parseLength } from "../values/length.js";
import { parseTimeSpec } from "../values/time.js";
import type { Vec2, Vec3 } from "../values/vec.js";

export type ControlKind =
  | "num"
  | "int"
  | "bool"
  | "enum"
  | "text"
  | "richText"
  | "color"
  | "color3"
  | "vec2"
  | "vec3"
  | "angle"
  | "curve"
  | "curves"
  | "ease"
  | "file"
  | "asset"
  | "ref"
  | "list"
  | "group"
  | "time"
  | "length"
  | "fill"
  | "json";

/** Serializable condition: show / honour this control only when another prop matches. */
export interface When {
  prop: string;
  equals?: unknown;
  in?: unknown[];
}

export interface ControlOpts<T = unknown> {
  default?: T;
  /** Prop must be present. Everything else is optional. */
  required?: boolean;
  optional?: boolean;
  animatable?: boolean;
  min?: number;
  max?: number;
  step?: number;
  /** Display unit, e.g. "EV", "px", "deg", "s". */
  unit?: string;
  /** UI hint for the future inspector: "slider", "wheel", "curve", "dropdown", ... */
  ui?: string;
  when?: When;
  /** Sound tag this control triggers, e.g. "hit/land". */
  sound?: string;
  label?: string;
  description?: string;
}

/**
 * One declared control. Everything the UI, MCP, linter and docs need comes from here.
 * `A` records at the type level whether the prop accepts keyframes/expressions.
 */
export interface Control<T = unknown, A extends boolean = boolean> {
  readonly kind: ControlKind;
  readonly opts: ControlOpts<T>;
  readonly animatable: A;
  readonly valueKind: ValueKind;
  readonly tsType: string;
  /** Validates one static value (range-checked). */
  readonly value: z.ZodType<T>;
  /** Static value or keyframes: JSON representable (MCP wire format). */
  readonly wire: z.ZodType;
  /** Wire format plus expressions (functions) when animatable. */
  readonly prop: z.ZodType;
  /** Canonicalise a static value (e.g. vec expansion, angle strings to degrees). */
  readonly normalize: (v: unknown) => T;
  readonly values?: readonly string[];
  readonly item?: Control<any, any>;
  readonly fields?: Record<string, Control<any, any>>;
  /** Phantom to carry T. */
  readonly __t?: T;
}

export type AnyControl = Control<any, any>;
export type Controls = Record<string, AnyControl>;

type IsAnim<O> = O extends { animatable: true } ? true : false;

export type PropOf<C> = C extends Control<infer T, infer A> ? (A extends true ? Animatable<T> : T) : never;
export type PropsOf<Cs extends Controls> = { [K in keyof Cs]?: PropOf<Cs[K]> };

// ---------- shared zod pieces ----------

const timeSchema = z.union([z.number(), z.string()]);
const handleSchema = z.union([
  z.object({ ease: z.string() }),
  z.object({ speed: z.number(), influence: z.number() }),
]);

function keyframesSchema(value: z.ZodType): z.ZodType {
  const keyObj = z.object({
    t: timeSchema,
    v: value,
    in: handleSchema.optional(),
    out: handleSchema.optional(),
    hold: z.boolean().optional(),
    label: z.string().optional(),
  });
  const key = z.union([z.tuple([timeSchema, value]), z.tuple([timeSchema, value, z.string()]), keyObj]);
  const list = z.array(key).min(1);
  const track = z.object({
    keys: list,
    mode: z.enum(["linear", "hold", "bezier", "auto", "continuous", "ease"]).optional(),
    spatial: z.enum(["linear", "bezier", "auto"]).optional(),
    orient: z.literal("path").optional(),
    separate: z.boolean().optional(),
    loop: z.union([z.enum(["cycle", "pingpong"]), z.number()]).optional(),
    keysRef: z.string().optional(),
  });
  return z.union([list, track]);
}

const exprSchema = z.custom<(...a: any[]) => unknown>((v) => typeof v === "function", {
  message: "expected an expression function (t, ctx) => value",
});

function build<T, A extends boolean>(
  kind: ControlKind,
  opts: ControlOpts<T>,
  parts: {
    valueKind: ValueKind;
    tsType: string;
    value: z.ZodType<T>;
    normalize?: (v: unknown) => T;
    values?: readonly string[];
    item?: AnyControl;
    fields?: Record<string, AnyControl>;
    /** Extra schema accepted on the wire for animatable values (e.g. per-axis objects). */
    wireExtra?: z.ZodType[];
    /** JSON-only variant of `value` (no expressions), when `value` itself is not JSON safe. */
    wireValue?: z.ZodType;
  },
): Control<T, A> {
  const animatable = (opts.animatable ?? false) as A;
  const wire: z.ZodType = animatable
    ? z.union([parts.value, keyframesSchema(parts.value), ...(parts.wireExtra ?? [])] as any)
    : (parts.wireValue ?? parts.value);
  const prop: z.ZodType = animatable ? z.union([wire, exprSchema]) : wire;
  return {
    kind,
    opts,
    animatable,
    valueKind: parts.valueKind,
    tsType: parts.tsType,
    value: parts.value,
    wire,
    prop,
    normalize: parts.normalize ?? ((v) => v as T),
    values: parts.values,
    item: parts.item,
    fields: parts.fields,
  };
}

function numSchema(o: { min?: number; max?: number }, int = false): z.ZodType<number> {
  let s = int ? z.number().int() : z.number();
  if (o.min !== undefined) s = s.min(o.min);
  if (o.max !== undefined) s = s.max(o.max);
  return s as z.ZodType<number>;
}

// ---------- builders ----------

export type NumOpts = ControlOpts<number>;

export function num<const O extends NumOpts>(o: O = {} as O): Control<number, IsAnim<O>> {
  return build("num", o, { valueKind: "number", tsType: "number", value: numSchema(o) });
}

export function int<const O extends NumOpts>(o: O = {} as O): Control<number, IsAnim<O>> {
  return build("int", o, { valueKind: "number", tsType: "number", value: numSchema(o, true) });
}

export function bool<const O extends ControlOpts<boolean>>(o: O = {} as O): Control<boolean, IsAnim<O>> {
  return build("bool", o, { valueKind: "discrete", tsType: "boolean", value: z.boolean() });
}

export function enumOf<const V extends readonly [string, ...string[]], const O extends ControlOpts<V[number]>>(
  values: V,
  o: O = {} as O,
): Control<V[number], IsAnim<O>> {
  return build("enum", o, {
    valueKind: "discrete",
    tsType: values.map((v) => JSON.stringify(v)).join(" | "),
    value: z.enum(values) as unknown as z.ZodType<V[number]>,
    values,
  });
}
export { enumOf as enum_ };

export function text<const O extends ControlOpts<string> & { multiline?: boolean }>(
  o: O = {} as O,
): Control<string, IsAnim<O>> {
  return build("text", o, { valueKind: "discrete", tsType: "string", value: z.string() });
}

export function richText<const O extends ControlOpts<string>>(o: O = {} as O): Control<string, IsAnim<O>> {
  return build("richText", o, { valueKind: "discrete", tsType: "string", value: z.string() });
}

const colorRe = /^(#[0-9a-fA-F]{3,8}|rgba?\(.+\)|oklch\(.+\)|\$[\w.-]+|transparent|currentColor|[a-zA-Z]+)$/;
export type ColorValue = string;

export function color<const O extends ControlOpts<ColorValue>>(o: O = {} as O): Control<ColorValue, IsAnim<O>> {
  return build("color", o, {
    valueKind: "color",
    tsType: "Color",
    value: z.string().regex(colorRe, { message: 'expected a color: "#rrggbb", "oklch(L C H)" or "$token"' }),
  });
}

const rgbVec = z.tuple([z.number(), z.number(), z.number()]);
export function color3<const O extends ControlOpts<Vec3>>(o: O = {} as O): Control<Vec3, IsAnim<O>> {
  return build("color3", o, { valueKind: "vec", tsType: "Vec3", value: rgbVec as unknown as z.ZodType<Vec3> });
}

function vecNormalizer(len: 2 | 3, def?: readonly number[]) {
  return (v: unknown) => {
    const fb = def ?? new Array(len).fill(0);
    if (typeof v === "number") return new Array(len).fill(v);
    const a = v as number[];
    return Array.from({ length: len }, (_, i) => a[i] ?? fb[i] ?? 0);
  };
}

const vecComponents = (len: 2 | 3, o: { min?: number; max?: number }) => {
  const n = numSchema(o);
  const full = len === 2 ? z.tuple([n, n]) : z.tuple([n, n, n]);
  const short = z.tuple([n, n]);
  return len === 2 ? z.union([n, full]) : z.union([n, short, full]);
};

export function vec2<const O extends ControlOpts<Vec2 | number>>(o: O = {} as O): Control<Vec2 | number, IsAnim<O>> {
  return build("vec2", o, {
    valueKind: "vec",
    tsType: "number | Vec2",
    value: vecComponents(2, o) as unknown as z.ZodType<Vec2 | number>,
    normalize: vecNormalizer(2, o.default === undefined ? undefined : (Array.isArray(o.default) ? o.default : [o.default, o.default])) as any,
    wireExtra: [z.object({ x: z.any().optional(), y: z.any().optional() })],
  });
}

export function vec3<const O extends ControlOpts<Vec3 | Vec2 | number>>(
  o: O = {} as O,
): Control<Vec3 | Vec2 | number, IsAnim<O>> {
  return build("vec3", o, {
    valueKind: "vec",
    tsType: "number | Vec2 | Vec3",
    value: vecComponents(3, o) as unknown as z.ZodType<Vec3 | Vec2 | number>,
    normalize: vecNormalizer(3, o.default === undefined ? undefined : (Array.isArray(o.default) ? o.default : [o.default, o.default, o.default])) as any,
    wireExtra: [z.object({ x: z.any().optional(), y: z.any().optional(), z: z.any().optional() })],
  });
}

export function angle<const O extends ControlOpts<number | string>>(
  o: O = {} as O,
): Control<number | string, IsAnim<O>> {
  const base = z.union([numSchema(o), z.string().regex(/^-?[\d.]+\s*(deg|turn|rad|grad)?$/)]);
  return build("angle", o, {
    valueKind: "number",
    tsType: "Angle",
    value: base as unknown as z.ZodType<number | string>,
    normalize: (v) => parseAngle(v as number | string),
  });
}

export interface CurvePoint {
  x: number;
  y: number;
  /** Optional bezier handles relative to the point. */
  in?: [number, number];
  out?: [number, number];
}
const curvePoint = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  in: z.tuple([z.number(), z.number()]).optional(),
  out: z.tuple([z.number(), z.number()]).optional(),
});

export function curve<const O extends ControlOpts<CurvePoint[]>>(o: O = {} as O): Control<CurvePoint[], IsAnim<O>> {
  return build("curve", o, {
    valueKind: "discrete",
    tsType: "CurvePoint[]",
    value: z.array(curvePoint).min(2) as unknown as z.ZodType<CurvePoint[]>,
  });
}

export type CurveChannel = "rgb" | "r" | "g" | "b" | "luma";
export function curves<
  const O extends ControlOpts<Partial<Record<CurveChannel, CurvePoint[]>>> & { channels?: readonly CurveChannel[] },
>(o: O = {} as O): Control<Partial<Record<CurveChannel, CurvePoint[]>>, IsAnim<O>> {
  const ch = (o.channels ?? ["rgb", "r", "g", "b", "luma"]) as readonly CurveChannel[];
  const shape = Object.fromEntries(ch.map((c) => [c, z.array(curvePoint).min(2).optional()]));
  return build("curves", o, {
    valueKind: "discrete",
    tsType: "Partial<Record<CurveChannel, CurvePoint[]>>",
    value: z.object(shape).strict() as unknown as z.ZodType<Partial<Record<CurveChannel, CurvePoint[]>>>,
  });
}

export function ease<const O extends ControlOpts<string>>(o: O = {} as O): Control<string, IsAnim<O>> {
  return build("ease", o, {
    valueKind: "discrete",
    tsType: "Ease",
    value: z.string().refine(
      (s) => {
        try {
          parseEase(s);
          return true;
        } catch {
          return false;
        }
      },
      { message: 'unknown ease; try "expo.out", "back.out(1.7)", "bezier(.2,.8,.2,1)" or "spring(180,18)"' },
    ),
  });
}

export function file<const O extends ControlOpts<string> & { accept?: readonly string[] }>(
  o: O = {} as O,
): Control<string, IsAnim<O>> {
  const accept = o.accept;
  return build("file", o, {
    valueKind: "discrete",
    tsType: "string",
    value: z.string().refine((s) => !accept || accept.some((ext) => s.toLowerCase().endsWith(ext)), {
      message: `expected a file with extension ${accept?.join(", ")}`,
    }),
  });
}

const assetRe = /^(\.{0,2}\/|assets\/|fonts\/)[^\s]*$|^[a-z]+:[^\s]+$|^[\w.-]+\.[a-z0-9]+$/i;
export function asset<const O extends ControlOpts<string> & { kinds?: readonly ("video" | "audio" | "image" | "font" | "model")[] }>(
  o: O = {} as O,
): Control<string, IsAnim<O>> {
  return build("asset", o, {
    valueKind: "discrete",
    tsType: "Asset",
    value: z.string().regex(assetRe, { message: 'expected an asset: "./clip.mp4", "freesound:12345" or "model:poly:abc"' }),
  });
}

export function ref<const O extends ControlOpts<string>>(o: O = {} as O): Control<string, IsAnim<O>> {
  return build("ref", o, {
    valueKind: "discrete",
    tsType: "Ref",
    value: z.string().regex(/^#[\w-]+(\.[\w.-]+)?$/, { message: 'expected a ref like "#hero" or "#hero.opacity"' }),
  });
}

export function time<const O extends ControlOpts<number | string>>(
  o: O = {} as O,
): Control<number | string, IsAnim<O>> {
  return build("time", o, {
    valueKind: "number",
    tsType: "Time",
    value: z.union([numSchema(o), z.string()]).refine(
      (v) => {
        if (typeof v === "number") return true;
        try {
          parseTimeSpec(v, 30);
          return true;
        } catch {
          return false;
        }
      },
      { message: 'expected a Time: 1.5, "1.5s", "36f", "00:00:01:12", "@12s", "#id.end+0.2" or "@marker:name"' },
    ) as unknown as z.ZodType<number | string>,
  });
}

export function length<const O extends ControlOpts<number | string>>(
  o: O = {} as O,
): Control<number | string, IsAnim<O>> {
  return build("length", o, {
    valueKind: "number",
    tsType: "Length",
    value: z.union([numSchema(o), z.string()]).refine(
      (v) => {
        try {
          parseLength(v);
          return true;
        } catch {
          return false;
        }
      },
      { message: 'expected a Length: 120, "50%", "10vw" or "10vh"' },
    ) as unknown as z.ZodType<number | string>,
  });
}

export type GradientStop = [position: number, color: string];
export type Fill =
  | string
  | { type: "linear"; angle?: number | string; stops: GradientStop[] }
  | { type: "radial"; center?: Vec2; radius?: number | string; stops: GradientStop[] }
  | { type: "image"; src: string; fit?: "cover" | "contain" }
  | { type: "video"; src: string; fit?: "cover" | "contain"; in?: number };

const stops = z.array(z.tuple([z.number().min(0).max(1), z.string()])).min(2);
const fillSchema = z.union([
  z.string().regex(colorRe),
  z.object({ type: z.literal("linear"), angle: z.union([z.number(), z.string()]).optional(), stops }),
  z.object({
    type: z.literal("radial"),
    center: z.tuple([z.number(), z.number()]).optional(),
    radius: z.union([z.number(), z.string()]).optional(),
    stops,
  }),
  z.object({ type: z.literal("image"), src: z.string(), fit: z.enum(["cover", "contain"]).optional() }),
  z.object({
    type: z.literal("video"),
    src: z.string(),
    fit: z.enum(["cover", "contain"]).optional(),
    in: z.number().optional(),
  }),
]);
export function fill<const O extends ControlOpts<Fill>>(o: O = {} as O): Control<Fill, IsAnim<O>> {
  return build("fill", o, { valueKind: "discrete", tsType: "Fill", value: fillSchema as unknown as z.ZodType<Fill> });
}

export function json<T = unknown, const O extends ControlOpts<T> = ControlOpts<T>>(
  o: O = {} as O,
  schema?: z.ZodType<T>,
): Control<T, IsAnim<O>> {
  return build("json", o, { valueKind: "discrete", tsType: "unknown", value: (schema ?? z.any()) as z.ZodType<T> });
}

export function list<T, const O extends ControlOpts<T[]>>(
  item: Control<T, any>,
  o: O = {} as O,
): Control<T[], IsAnim<O>> {
  return build("list", o, {
    valueKind: "discrete",
    tsType: `${item.tsType}[]`,
    value: z.array(item.value) as unknown as z.ZodType<T[]>,
    item,
  });
}

export type GroupValue<F extends Controls> = { [K in keyof F]?: PropOf<F[K]> };

export function group<F extends Controls, const O extends ControlOpts<GroupValue<F>>>(
  fields: F,
  o: O = {} as O,
): Control<GroupValue<F>, IsAnim<O>> {
  // Fields may themselves be animatable, so the group accepts each field's full prop form.
  const shape = Object.fromEntries(Object.entries(fields).map(([k, c]) => [k, c.prop.optional()]));
  const wireShape = Object.fromEntries(Object.entries(fields).map(([k, c]) => [k, c.wire.optional()]));
  return build("group", o, {
    valueKind: "discrete",
    tsType: `{ ${Object.entries(fields)
      .map(([k, c]) => `${k}?: ${c.animatable ? `Animatable<${c.tsType}>` : c.tsType}`)
      .join("; ")} }`,
    value: z.object(shape).strict() as unknown as z.ZodType<GroupValue<F>>,
    wireValue: z.object(wireShape).strict(),
    fields,
  });
}

/** Throw a typed error when a value fails its control. Convenience for tests and codemods. */
export function parseControlValue<T>(c: Control<T, any>, v: unknown, name = "value"): T {
  const r = c.prop.safeParse(v);
  if (!r.success) {
    throw new CodeCutError("schema_violation", `${name}: ${r.error.issues.map((i) => i.message).join("; ")}`);
  }
  return v as T;
}
