import { buildSignal, constant, type Signal } from "../anim/signal.js";
import { isKeyframes } from "../anim/keyframes.js";
import { checkPurity } from "../anim/expr.js";
import type { CtxBase } from "../anim/expr.js";
import { assignMissingIds, generateId } from "../ast/ids.js";
import { isNode, type CCNode } from "../ast/node.js";
import { CodeCutError } from "../errors.js";
import { getLook, type FontDecl } from "../theme.js";
import { registry as defaultRegistry, validateProps, type ComponentDef, type Registry } from "../schema/define.js";
import type { AnyControl } from "../schema/controls.js";
import { parseAngle } from "../values/angle.js";
import { parseColor, toCss } from "../values/color.js";
import { resolveLength, type Length } from "../values/length.js";
import { parseTimeLiteral, parseTimeSpec, snapToFrame, type Time, type TimeSpec } from "../values/time.js";
import type {
  TimelineMarker,
  RNode,
  ResolveIssue,
  ResolvedComp,
  ResolvedFont,
  ResolvedProject,
  ResolvedTheme,
} from "./types.js";

export interface ResolveOptions {
  registry?: Registry;
  /** Attach files/hashes to a declared font. Default leaves `files` empty (font gate reports it). */
  fontResolver?: (decl: FontDecl) => ResolvedFont;
  /** Duration in seconds of a media asset (ffprobe), when known. */
  mediaDuration?: (src: string) => number | undefined;
  /** Word timings for a Voiceover id. */
  words?: (voiceId: string) => Array<{ w: string; start: number; end: number }> | undefined;
  /** Assign `cc_` ids to elements without one (default true; lint reports them). */
  assignIds?: boolean;
}

interface Env {
  fps: number;
  opts: ResolveOptions;
  reg: Registry;
  issues: ResolveIssue[];
  byId: Map<string, RNode>;
  markers: TimelineMarker[];
  theme: ResolvedTheme;
  comp?: ResolvedComp;
}

const err = (env: Env, i: ResolveIssue) => env.issues.push(i);

/** Resolve themes, tokens, refs and expressions into a timed tree ready for the compiler. */
export function resolveProject(source: CCNode, opts: ResolveOptions = {}): ResolvedProject {
  const reg = opts.registry ?? defaultRegistry;
  if (source.name !== "Composition") {
    throw new CodeCutError("schema_violation", `Project root must be <Composition>, got <${source.name}>`, {
      fix: "Export a <Composition …> as the default export.",
    });
  }
  const root = source;
  const generated = opts.assignIds === false ? [] : assignMissingIds(root);
  const generatedIds = new Set(generated.map((g) => g.id));

  const fpsRaw = (root.props.fps as number | undefined) ?? 30;
  const env: Env = {
    fps: fpsRaw,
    opts,
    reg,
    issues: [],
    byId: new Map(),
    markers: [],
    theme: { tokens: {}, palette: {}, type: {}, easing: {} },
  };
  for (const g of generated) {
    err(env, {
      severity: "warning",
      rule: "missing-id",
      message: `<${g.node.name}> has no id; generated ${g.id}`,
      id: g.id,
      fix: `Add id="${g.id}" (saving the project writes it back).`,
    });
  }

  // Pass 1: skeleton
  const rootR = build(env, root, null, 0, generatedIds);
  const comp = resolveComp(env, rootR);
  env.comp = comp;
  env.theme = comp.theme;
  rootR.box = [comp.width, comp.height];

  // markers first (times needed by "@marker:x" references)
  collectMarkers(env, rootR);

  // Pass 2: timing, then props
  timeNode(env, rootR, new Set());
  for (const n of env.byId.values()) timeNode(env, n, new Set());
  assignBoxes(env, rootR);
  for (const n of env.byId.values()) resolveProps(env, n);

  const tracks = rootR.children
    .filter((c) => c.name === "Track")
    .map((t) => ({
      id: t.id,
      kind: String(t.props.kind ?? "video"),
      locked: !!t.props.locked,
      muted: !!t.props.muted,
      solo: !!t.props.solo,
    }));

  return { comp, root: rootR, byId: env.byId, markers: env.markers, issues: env.issues, tracks };
}

// ---------- pass 1 ----------

function build(env: Env, node: CCNode, parent: RNode | null, depth: number, generatedIds: Set<string>): RNode {
  const def = env.reg.get(node.name);
  if (!def) {
    throw new CodeCutError("unknown_component", `Unknown component <${node.name}>`, {
      fix: `Known: ${env.reg.names().slice(0, 40).join(", ")}…`,
    });
  }
  const id = String(node.props.id);
  if (env.byId.has(id)) {
    err(env, { severity: "error", rule: "duplicate-id", message: `Duplicate id "${id}"`, id, fix: "Ids must be unique." });
  }

  // merge <Keyframes prop=… values=… /> children into the parent's raw props
  const raw: Record<string, unknown> = { ...node.props };
  const kfNodes = node.children.filter((c): c is CCNode => isNode(c) && c.name === "Keyframes");
  for (const k of kfNodes) {
    const prop = String(k.props.prop);
    if (raw[prop] !== undefined) {
      err(env, { severity: "error", rule: "keyframes-conflict", message: `<Keyframes prop="${prop}"> conflicts with an existing ${prop} prop on #${id}`, id, prop });
      continue;
    }
    const track: Record<string, unknown> = { keys: k.props.values ?? [] };
    for (const f of ["mode", "spatial", "orient", "separate", "loop"] as const) if (k.props[f] !== undefined) track[f] = k.props[f];
    if (k.props.keys) track.keysRef = k.props.keys;
    raw[prop] = track;
  }

  const r: RNode = {
    id,
    generatedId: generatedIds.has(id),
    name: node.name,
    def,
    source: node,
    props: {},
    raw,
    parent,
    children: [],
    effects: [],
    content: [],
    start: 0,
    duration: 0,
    end: 0,
    parentStart: 0,
    box: [0, 0],
    z: 0,
    depth,
  };
  env.byId.set(id, r);

  let layerIndex = 0;
  for (const c of node.children) {
    if (!isNode(c)) {
      r.content.push(c);
      continue;
    }
    if (c.name === "Keyframes") continue;
    const child = build(env, c, r, depth + 1, generatedIds);
    r.content.push(child);
    if (child.def.kind === "effect") r.effects.push(child);
    else if (child.def.traits.includes("inline")) {
      // inline spans live only in the parent's rich-text content, never as layers
    } else {
      child.z = ++layerIndex;
      r.children.push(child);
    }
  }
  return r;
}

function resolveComp(env: Env, rootR: RNode): ResolvedComp {
  const p = rootR.raw;
  const issuesBefore = env.issues.length;
  for (const i of validateProps(rootR.def, stripFns(p))) {
    err(env, { severity: "error", rule: "schema", message: i.message, id: rootR.id, prop: i.prop, fix: i.fix });
  }
  void issuesBefore;
  const size = (p.size as [number, number] | undefined) ?? [1920, 1080];
  const fps = (p.fps as number | undefined) ?? 30;
  env.fps = fps;
  const dur = p.duration === undefined ? 0 : parseTimeLiteral(p.duration as Time, fps);
  if (!(dur > 0)) {
    err(env, { severity: "error", rule: "schema", message: "Composition.duration is required and must be > 0", id: rootR.id, prop: "duration" });
  }
  const theme = resolveTheme(env, rootR, p.theme as string | undefined);
  const fontDecls = collectFonts(env, rootR, theme);
  const fonts = fontDecls.map(
    (d) => env.opts.fontResolver?.(d) ?? {
      id: d.id,
      family: d.family,
      files: [],
      fallback: d.fallback ?? [],
      source: (d.source === "google" ? "google" : d.source === "system" ? "system" : /^https?:/.test(d.source) ? "url" : "local") as ResolvedFont["source"],
      variable: !!d.variable,
      axes: d.axes,
      license: d.license,
    },
  );
  return {
    id: rootR.id,
    width: size[0],
    height: size[1],
    fps,
    duration: dur,
    background: tokenColor(theme, (p.background as string | undefined) ?? theme.tokens["background"] as string ?? "#000000"),
    theme,
    fonts,
    bpm: p.bpm as number | undefined,
  };
}

const stripFns = (p: Record<string, unknown>) => p;

function resolveTheme(env: Env, rootR: RNode, ref: string | undefined): ResolvedTheme {
  const theme: ResolvedTheme = { tokens: {}, palette: {}, type: {}, easing: {} };
  // inline <Theme>/<Look> elements declared under the composition
  const inline = rootR.source.children.filter((c): c is CCNode => isNode(c) && (c.name === "Theme" || c.name === "Look"));
  const lookId = ref?.match(/^\$(?:look|theme)\.([\w-]+)$/)?.[1];
  const look = lookId ? getLook(lookId) : undefined;
  if (ref && !look && !inline.some((n) => n.props.id === lookId)) {
    err(env, {
      severity: "error",
      rule: "unresolved-token",
      message: `Unknown theme ${ref}`,
      id: rootR.id,
      prop: "theme",
      fix: "Define it with <Theme id=…> or use a registered Look such as $look.kinetic.",
    });
  }
  if (look) {
    Object.assign(theme.palette, look.palette);
    Object.assign(theme.type, look.type);
    Object.assign(theme.easing, look.easing);
    theme.transition = look.transition;
    theme.grain = look.grain;
    theme.sound = look.sound;
    theme.id = look.id;
    if (look.background) theme.tokens["background"] = look.background;
  }
  for (const n of inline.filter((n) => !lookId || n.props.id === lookId)) {
    Object.assign(theme.palette, (n.props.palette as object) ?? {}, (n.props.brand as object) ?? {});
    Object.assign(theme.type, (n.props.type as object) ?? {});
    Object.assign(theme.easing, (n.props.easing as object) ?? {});
    if (n.props.transition) theme.transition = n.props.transition as { type: string; duration: number };
    if (typeof n.props.grain === "number") theme.grain = n.props.grain;
    if (n.props.sound) theme.sound = { ...(theme.sound ?? {}), ...(n.props.sound as object) } as Record<string, string>;
  }
  for (const [k, v] of Object.entries(theme.palette)) {
    theme.tokens[`brand.${k}`] = v;
    theme.tokens[`color.${k}`] = v;
    theme.tokens[`look.${k}`] = v;
  }
  for (const [k, v] of Object.entries(theme.type)) theme.tokens[`type.${k}`] = v;
  for (const [k, v] of Object.entries(theme.easing)) theme.tokens[`ease.${k}`] = v;
  return theme;
}

function collectFonts(env: Env, rootR: RNode, theme: ResolvedTheme): FontDecl[] {
  const decls: FontDecl[] = [];
  const seen = new Set<string>();
  const add = (d: FontDecl) => {
    if (!seen.has(d.id)) {
      seen.add(d.id);
      decls.push(d);
    }
  };
  const lookFonts = theme.id ? getLook(theme.id)?.fonts ?? [] : [];
  const fontsNode = rootR.source.children.find((c): c is CCNode => isNode(c) && c.name === "Fonts");
  if (fontsNode) {
    for (const f of fontsNode.children) {
      if (isNode(f) && f.name === "Font") {
        const p = f.props as Record<string, any>;
        add({
          id: p.id,
          family: p.family,
          source: p.source ?? "google",
          weights: p.weights,
          styles: p.styles,
          variable: p.variable,
          axes: p.axes,
          subsets: p.subsets,
          license: p.license,
          fallback: p.fallback,
        });
      }
    }
  }
  for (const f of lookFonts) add(f);
  void env;
  return decls;
}

function tokenColor(theme: ResolvedTheme, c: string): string {
  if (!c.startsWith("$")) return c;
  const v = theme.tokens[c.slice(1)];
  return typeof v === "string" ? v : c;
}

function collectMarkers(env: Env, n: RNode) {
  if (n.name === "Marker") {
    const at = n.raw.at;
    try {
      const base = n.parent ? n.parent.name === "Composition" || n.parent.name === "Track" ? 0 : parentStartGuess(n.parent) : 0;
      const spec = parseTimeSpec(at as Time, env.fps);
      const abs = spec.kind === "abs" ? spec.seconds : spec.kind === "literal" ? spec.seconds + base : undefined;
      if (abs !== undefined) {
        env.markers.push({
          at: snapToFrame(abs, env.fps),
          label: n.raw.label as string | undefined,
          color: n.raw.color as string | undefined,
          id: n.id,
        });
      }
    } catch (e) {
      err(env, { severity: "error", rule: "invalid-time", message: (e as Error).message, id: n.id, prop: "at" });
    }
  }
  n.children.forEach((c) => collectMarkers(env, c));
}

/** Markers inside scenes use the scene start; computed from literal `start` props only. */
function parentStartGuess(n: RNode): number {
  let s = 0;
  for (let cur: RNode | null = n; cur && cur.name !== "Composition"; cur = cur.parent) {
    const st = cur.raw.start;
    if (st !== undefined) {
      try {
        const spec = parseTimeSpec(st as Time, 30);
        if (spec.kind === "abs") return spec.seconds + s;
        if (spec.kind === "literal") s += spec.seconds;
      } catch {
        /* reported later */
      }
    }
  }
  return s;
}

// ---------- pass 2: timing ----------

const timed = new WeakSet<RNode>();

function timeNode(env: Env, n: RNode, visiting: Set<string>): void {
  if (timed.has(n)) return;
  if (visiting.has(n.id)) {
    throw new CodeCutError("unresolved_ref", `Timing reference cycle through #${n.id}`, {
      fix: "Break the cycle: a start/end cannot depend on itself.",
    });
  }
  visiting.add(n.id);
  const fps = env.fps;
  const p = n.raw;
  const parent = n.parent;
  if (!parent) {
    n.start = 0;
    n.duration = env.comp ? env.comp.duration : parseTimeLiteral((p.duration as Time) ?? 0, fps);
    n.end = n.start + n.duration;
    n.parentStart = 0;
  } else {
    timeNode(env, parent, visiting);
    const base = parent.start;
    n.parentStart = base;
    const readSpec = (key: string): TimeSpec | undefined => {
      const v = p[key];
      if (v === undefined) return undefined;
      try {
        return parseTimeSpec(v as Time, fps);
      } catch (e) {
        err(env, { severity: "error", rule: "invalid-time", message: (e as Error).message, id: n.id, prop: key, fix: 'Use 1.5, "1.5s", "36f" or "00:00:01:12".' });
        return undefined;
      }
    };
    const toAbs = (spec: TimeSpec): number => {
      switch (spec.kind) {
        case "literal":
          return base + spec.seconds;
        case "abs":
          return spec.seconds;
        case "marker": {
          const m = env.markers.find((x) => x.id === spec.name || x.label === spec.name);
          if (!m) {
            err(env, { severity: "error", rule: "unresolved-ref", message: `Unknown marker "${spec.name}"`, id: n.id, fix: "Add <Marker at=… label=…/> with that label or id." });
            return base;
          }
          return m.at + spec.offset;
        }
        case "ref": {
          const t = env.byId.get(spec.id);
          if (!t) {
            err(env, { severity: "error", rule: "unresolved-ref", message: `Unknown element #${spec.id} in time reference`, id: n.id, fix: "Check the id." });
            return base;
          }
          timeNode(env, t, visiting);
          const v = spec.edge === "start" ? t.start : spec.edge === "end" ? t.end : t.duration;
          return v + spec.offset;
        }
      }
    };

    const startSpec = readSpec("start");
    const endSpec = readSpec("end");
    const durSpec = readSpec("duration");
    let start: number;
    if (n.def.kind === "effect") {
      start = startSpec ? toAbs(startSpec) : parent.start;
    } else if (startSpec) start = toAbs(startSpec);
    else if (parent.name === "Stagger") {
      const sibs = parent.children;
      const i = sibs.indexOf(n);
      const each = parent.raw.each === undefined ? 0.08 : parseTimeLiteral(parent.raw.each as Time, fps);
      const order = String(parent.raw.from ?? "start");
      const k = order === "end" ? sibs.length - 1 - i : order === "center" ? Math.abs(i - (sibs.length - 1) / 2) : order === "edges" ? (sibs.length - 1) / 2 - Math.abs(i - (sibs.length - 1) / 2) : i;
      start = parent.start + k * each;
    } else if (parent.name === "Sequence") {
      const prev = parent.children[parent.children.indexOf(n) - 1];
      const gap = typeof parent.raw.gap === "undefined" ? 0 : parseTimeLiteral(parent.raw.gap as Time, fps);
      if (prev) timeNode(env, prev, visiting);
      start = prev ? prev.end + gap : parent.start;
    } else start = base;
    if (n.name === "Marker" || n.name === "Sound" || n.name === "Voiceover" || n.name === "Font" || n.name === "Fonts") {
      const at = readSpec("at");
      if (at && n.name !== "Font" && n.name !== "Fonts") start = toAbs(at);
    }

    let end: number;
    if (endSpec) end = toAbs(endSpec);
    else if (durSpec) {
      end = start + (durSpec.kind === "literal" || durSpec.kind === "abs" ? durSpec.seconds : toAbs(durSpec) - start);
    } else {
      const media = typeof p.src === "string" ? env.opts.mediaDuration?.(String(p.src)) : undefined;
      const trim = mediaTrim(p);
      if (media !== undefined && mediaTimed(n.name)) {
        const rate = typeof p.speed === "number" && p.speed > 0 ? p.speed : 1;
        end = start + Math.max(0, (trim.out ?? media) - trim.in) / rate;
      } else {
        end = parent.end;
      }
    }
    start = snapToFrame(start, fps);
    end = snapToFrame(end, fps);
    n.start = start;
    n.end = Math.max(end, start);
    n.duration = snapToFrame(n.end - start, fps);
    if (n.end > parent.end + 1e-6 && n.def.kind !== "effect" && parent.name !== "Composition") {
      err(env, {
        severity: "warning",
        rule: "child-outside-parent",
        message: `#${n.id} ends at ${n.end}s, after its parent #${parent.id} (${parent.end}s); the child is clipped`,
        id: n.id,
        fix: "Shorten the child or lengthen the parent.",
      });
    }
  }

  // Scene transitions: the incoming scene animates over its first `duration` seconds while the
  // previous scene holds underneath, so the previous scene's slot extends by that amount.
  visiting.delete(n.id);
  timed.add(n);
}

const mediaTimed = (name: string) => ["Video", "Audio", "Clip", "Voiceover", "Sound"].includes(name);
function mediaTrim(p: Record<string, unknown>): { in: number; out?: number } {
  const num = (v: unknown) => (typeof v === "number" ? v : typeof v === "string" ? parseTimeLiteral(v, 30) : undefined);
  return { in: num(p.in) ?? 0, out: num(p.out) };
}

function assignBoxes(env: Env, n: RNode): void {
  const comp = env.comp!;
  const childBox = n.def.childBox?.(n.raw, comp, n.box) ?? n.box;
  for (const c of n.children) {
    c.box = childBox;
    assignBoxes(env, c);
  }
  for (const e of n.effects) e.box = n.box;
}

// ---------- pass 2b: props ----------

function resolveProps(env: Env, n: RNode): void {
  const def = n.def;
  const comp = env.comp!;
  const raw = n.raw;
  for (const i of validateProps(def, raw)) {
    env.issues.push({
      severity: "error",
      rule: i.code === "unknown_prop" ? "unknown-prop" : i.code === "not_animatable" ? "not-animatable" : i.code === "required" ? "required-prop" : "invalid-value",
      message: i.message,
      id: n.id,
      prop: i.prop,
      fix: i.fix,
    });
  }
  const ctxBase: CtxBase = {
    fps: comp.fps,
    prop: (ref, t) => readRef(env, ref, t),
    beat: (k) => (comp.bpm ? (k * 60) / comp.bpm : k),
    word: (voice, i) => {
      const words = env.opts.words?.(voice);
      const w = words?.[i];
      if (!w) throw new CodeCutError("unresolved_ref", `ctx.word(${JSON.stringify(voice)}, ${i}) has no timing`, { fix: "Run transcribe for this voice first." });
      return w;
    },
  };
  const basis = { parent: Math.max(n.box[0], n.box[1]), vw: comp.width, vh: comp.height };
  const tok = (s: string): string => {
    if (!s.startsWith("$")) return s;
    const v = comp.theme.tokens[s.slice(1)];
    if (typeof v === "string") return v;
    env.issues.push({ severity: "error", rule: "unresolved-token", message: `Unknown token ${s}`, id: n.id, fix: "Define it in the Theme/Look." });
    return "#ff00ff";
  };

  const normStatic = (c: AnyControl, v: unknown): unknown => {
    switch (c.kind) {
      case "color":
        return typeof v === "string" ? safeColor(tok(v)) : v;
      case "angle":
        return parseAngle(v as number | string);
      case "vec2":
      case "vec3":
      case "color3":
        return c.kind === "color3" ? v : c.normalize(v);
      case "fill":
        return normFill(v, tok);
      case "length":
        return v;
      case "list":
        return Array.isArray(v) && c.item ? v.map((x) => normStatic(c.item!, x)) : v;
      case "group":
        return normGroup(c, v);
      default:
        return v;
    }
  };

  const normGroup = (c: AnyControl, v: unknown): unknown => {
    if (!v || typeof v !== "object" || !c.fields) return v;
    const out: Record<string, unknown> = {};
    for (const [k, fv] of Object.entries(v as object)) {
      const fc = c.fields[k];
      out[k] = fc ? normValue(fc, fv, `${c.kind}.${k}`) : fv;
    }
    return out;
  };

  const normValue = (c: AnyControl, v: unknown, label: string): unknown => {
    if (c.animatable) {
      if (typeof v === "function") {
        const issues = checkPurity(v as (...a: any[]) => unknown);
        for (const pi of issues) env.issues.push({ severity: "error", rule: "impure-expression", message: `${n.id}.${label}: ${pi.message}`, id: n.id, prop: label });
        let fn = v as (t: number, ctx: any) => unknown;
        if (c.kind === "vec2" || c.kind === "vec3") {
          const inner = fn;
          fn = (t, ctx) => c.normalize(inner(t, ctx));
        }
        return buildSignal(fn, { vk: c.valueKind, fps: comp.fps, keyBase: n.parentStart, exprBase: n.start, ctx: ctxBase });
      }
      if ((c.kind === "vec2" || c.kind === "vec3") && isSeparate(v)) {
        const o = v as Record<string, unknown>;
        const names = ["x", "y", "z"].slice(0, c.kind === "vec2" ? 2 : 3);
        const fallback = c.normalize(c.opts.default ?? 0) as number[];
        return {
          kind: "sep",
          parts: names.map((nm) => (o[nm] === undefined ? undefined : buildSignal(mapKeys(o[nm], (x) => x), { vk: "number", fps: comp.fps, keyBase: n.parentStart, exprBase: n.start, ctx: ctxBase }))),
          fallback,
        } satisfies Signal;
      }
      if (isKeyframes(v)) {
        const mapped = mapKeys(v, (x) => (c.kind === "length" ? resolveLength(x as Length, basis) : normStatic(c, x)));
        return buildSignal(mapped, {
          vk: c.valueKind,
          fps: comp.fps,
          keyBase: n.parentStart,
          exprBase: n.start,
          ctx: ctxBase,
          resolveTime: (t) => resolveKeyTime(env, n, t),
        });
      }
      return constant(c.kind === "length" ? v : normStatic(c, v));
    }
    return normStatic(c, v);
  };

  const out: Record<string, any> = {};
  for (const [k, c] of Object.entries(def.controls)) {
    let v = raw[k];
    if (v === undefined) v = c.opts.default;
    if (v === undefined) {
      if (c.animatable) out[k] = undefined;
      continue;
    }
    try {
      out[k] = c.kind === "time" && !(c.animatable) ? resolveGenericTime(env, n, v as Time) : normValue(c, v, k);
    } catch (e) {
      env.issues.push({ severity: "error", rule: "invalid-value", message: `${def.name}.${k}: ${(e as Error).message}`, id: n.id, prop: k, fix: (e as CodeCutError).fix });
    }
  }
  // animatable props with defaults still need signals even if undefined → constants
  for (const [k, c] of Object.entries(def.controls)) {
    if (c.animatable && out[k] === undefined && c.opts.default !== undefined) out[k] = normValue(c, c.opts.default, k);
  }
  n.props = out;
}

function resolveGenericTime(env: Env, n: RNode, v: Time): number {
  const spec = parseTimeSpec(v, env.fps);
  if (spec.kind === "literal") return spec.seconds;
  if (spec.kind === "abs") return spec.seconds - n.parentStart;
  return resolveKeyTime(env, n, v);
}

/** Key times are parent-local seconds; references resolve to absolute and shift by the parent start. */
function resolveKeyTime(env: Env, n: RNode, t: Time): number {
  const spec = parseTimeSpec(t, env.fps);
  switch (spec.kind) {
    case "literal":
      return spec.seconds;
    case "abs":
      return spec.seconds - n.parentStart;
    case "marker": {
      const m = env.markers.find((x) => x.id === spec.name || x.label === spec.name);
      if (!m) throw new CodeCutError("unresolved_ref", `Unknown marker "${spec.name}"`, { fix: "Add a <Marker label=…/>." });
      return m.at + spec.offset - n.parentStart;
    }
    case "ref": {
      const target = env.byId.get(spec.id);
      if (!target) throw new CodeCutError("unresolved_ref", `Unknown element #${spec.id}`, { fix: "Check the id." });
      const v = spec.edge === "start" ? target.start : spec.edge === "end" ? target.end : target.duration;
      return v + spec.offset - n.parentStart;
    }
  }
}

const isSeparate = (v: unknown) =>
  typeof v === "object" && v !== null && !Array.isArray(v) && !("keys" in v) && ("x" in v || "y" in v || "z" in v);

function mapKeys(raw: unknown, fn: (v: unknown) => unknown): unknown {
  if (Array.isArray(raw)) {
    return raw.map((k) => (Array.isArray(k) ? [k[0], fn(k[1]), ...k.slice(2)] : k && typeof k === "object" && "v" in k ? { ...k, v: fn((k as { v: unknown }).v) } : k));
  }
  if (raw && typeof raw === "object" && Array.isArray((raw as { keys?: unknown }).keys)) {
    return { ...(raw as object), keys: mapKeys((raw as { keys: unknown }).keys, fn) };
  }
  return fn(raw);
}

function safeColor(c: string): string {
  try {
    return toCss(parseColor(c));
  } catch {
    return c;
  }
}

function normFill(v: unknown, tok: (s: string) => string): unknown {
  if (typeof v === "string") return safeColor(tok(v));
  if (v && typeof v === "object" && "stops" in v) {
    const f = v as { stops: Array<[number, string]> };
    return { ...(v as object), stops: f.stops.map(([p, c]) => [p, safeColor(tok(c))]) };
  }
  return v;
}

/** ctx.prop("#id.prop") at absolute time t, for expressions. */
function readRef(env: Env, ref: string, t: number): unknown {
  const m = ref.match(/^#([\w-]+)\.([\w.]+)$/);
  if (!m) throw new CodeCutError("unresolved_ref", `Bad ref ${JSON.stringify(ref)}`, { fix: 'Use "#id.prop".' });
  const node = env.byId.get(m[1]!);
  if (!node) throw new CodeCutError("unresolved_ref", `Unknown element #${m[1]}`);
  const v = node.props[m[2]!];
  if (v && typeof v === "object" && "kind" in v) return evalSig(v as Signal, t);
  return v;
}

import { evalSignal as evalSig } from "../anim/signal.js";

export { generateId };
