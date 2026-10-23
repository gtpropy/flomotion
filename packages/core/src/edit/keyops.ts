import { CodeCutError } from "../errors.js";
import { evalTrack, isKeyframes, normalizeTrack, type ValueKind } from "../anim/keyframes.js";
import type { InterpMode, Keyframe, KeyframeObject, KeyframeTrack } from "../anim/types.js";
import { cloneNode, type CCNode } from "../ast/node.js";
import { parseEase } from "../values/ease.js";
import { snapToFrame, type Time } from "../values/time.js";
import { elementOrThrow, makeResult, type EditResult, type Patch } from "./patch.js";

const fpsOf = (root: CCNode) => (typeof root.props.fps === "number" ? root.props.fps : 30);
const snap = (root: CCNode, t: number) => snapToFrame(t, fpsOf(root));

/** A property's keyframes in a uniform shape: sorted objects plus track options. */
interface KeySet {
  keys: Array<KeyframeObject<any> & { ease?: string }>;
  opts: Omit<KeyframeTrack<any>, "keys">;
}

const num = (t: Time, id: string): number => {
  if (typeof t === "number") return t;
  const m = /^(-?\d+(?:\.\d+)?)s?$/.exec(t.trim());
  if (!m)
    throw new CodeCutError(
      "opaque_expression",
      `Keyframe time ${JSON.stringify(t)} on #${id} is a reference; structured keyframe edits need literal times`,
      { fix: "Replace it with a literal time first." },
    );
  return Number(m[1]);
};

function read(
  root: CCNode,
  id: string,
  prop: string,
  create = false,
): { set: KeySet; node: CCNode; raw: unknown } {
  const { node } = elementOrThrow(root, id);
  const raw = node.props[prop];
  if (raw === undefined) {
    if (!create)
      throw new CodeCutError("invalid_edit", `#${id}.${prop} has no keyframes`, {
        fix: "Use keyAdd to create the first key.",
      });
    return { set: { keys: [], opts: {} }, node, raw };
  }
  if (typeof raw === "function")
    throw new CodeCutError(
      "opaque_expression",
      `#${id}.${prop} is an expression; it cannot be edited as keyframes`,
      { fix: "Replace the expression with keyframes first." },
    );
  if (!isKeyframes(raw)) {
    if (!create)
      throw new CodeCutError("invalid_edit", `#${id}.${prop} is a static value, not keyframes`, {
        fix: "Use keyAdd to turn it into keyframes.",
      });
    return { set: { keys: [], opts: {} }, node, raw };
  }
  const track: KeyframeTrack<any> = Array.isArray(raw)
    ? { keys: raw as Keyframe<any>[] }
    : (raw as KeyframeTrack<any>);
  const { keys, ...opts } = track;
  return {
    node,
    raw,
    set: {
      opts,
      keys: keys.map((k) => {
        if (Array.isArray(k))
          return { t: num(k[0], id), v: k[1], ...(k[2] !== undefined ? { ease: k[2] } : {}) };
        return { ...(k as KeyframeObject<any>), t: num((k as KeyframeObject<any>).t, id) };
      }),
    },
  };
}

function write(
  root: CCNode,
  id: string,
  prop: string,
  set: KeySet,
  desc: string,
  data?: Record<string, unknown>,
): EditResult {
  const keys = [...set.keys].sort((a, b) => (a.t as number) - (b.t as number));
  for (let i = 1; i < keys.length; i++) {
    if (keys[i]!.t === keys[i - 1]!.t)
      throw new CodeCutError(
        "duplicate_keyframe",
        `Two keyframes share time ${keys[i]!.t}s on #${id}.${prop}`,
        { fix: "Give each key a unique time (at least one frame apart)." },
      );
  }
  const short = keys.map((k) => {
    const extra = Object.keys(k).filter((x) => !["t", "v", "ease"].includes(x));
    if (!extra.length)
      return k.ease ? ([k.t, k.v, k.ease] as Keyframe<any>) : ([k.t, k.v] as Keyframe<any>);
    const { ease, ...rest } = k;
    return (ease ? { ...rest, in: rest.in ?? { ease } } : rest) as Keyframe<any>;
  });
  const hasOpts = Object.values(set.opts).some((v) => v !== undefined);
  const value = hasOpts ? { ...set.opts, keys: short } : short;
  const patch: Patch = { op: "setProp", id, prop, value };
  return makeResult(root, [patch], desc, data);
}

const same = (a: number, b: number) => Math.abs(a - b) < 1e-6;

export function keyAdd(
  root: CCNode,
  a: { id: string; prop: string; t: number | string; value: unknown; ease?: string },
): EditResult {
  const { set, node } = read(root, a.id, a.prop, true);
  const t = snap(root, num(a.t, a.id));
  if (
    set.keys.length === 0 &&
    node.props[a.prop] !== undefined &&
    !isKeyframes(node.props[a.prop])
  ) {
    // promote the static value to a key at 0 so the animation starts from it
    if (t > 0) set.keys.push({ t: 0, v: node.props[a.prop] });
  }
  if (set.keys.some((k) => same(k.t as number, t)))
    throw new CodeCutError("duplicate_keyframe", `#${a.id}.${a.prop} already has a key at ${t}s`, {
      fix: "Use keySet to change it.",
    });
  set.keys.push({ t, v: a.value, ...(a.ease ? { ease: a.ease } : {}) });
  return write(root, a.id, a.prop, set, `add key ${a.prop} @ ${t}s on #${a.id}`);
}

export function keySet(
  root: CCNode,
  a: {
    id: string;
    prop: string;
    t: number | string;
    value?: unknown;
    ease?: string;
    hold?: boolean;
    label?: string;
  },
): EditResult {
  const { set } = read(root, a.id, a.prop);
  const t = snap(root, num(a.t, a.id));
  const k = set.keys.find((x) => same(x.t as number, t));
  if (!k)
    throw new CodeCutError("invalid_edit", `#${a.id}.${a.prop} has no key at ${t}s`, {
      fix: "Use keyAdd to create one.",
    });
  if (a.value !== undefined) k.v = a.value;
  if (a.ease !== undefined) k.ease = a.ease;
  if (a.hold !== undefined) k.hold = a.hold || undefined;
  if (a.label !== undefined) k.label = a.label;
  return write(root, a.id, a.prop, set, `set key ${a.prop} @ ${t}s on #${a.id}`);
}

export function keyMove(
  root: CCNode,
  a: { id: string; prop: string; from: number | string; to: number | string },
): EditResult {
  const { set } = read(root, a.id, a.prop);
  const f = snap(root, num(a.from, a.id));
  const t = snap(root, num(a.to, a.id));
  const k = set.keys.find((x) => same(x.t as number, f));
  if (!k) throw new CodeCutError("invalid_edit", `#${a.id}.${a.prop} has no key at ${f}s`);
  if (set.keys.some((x) => x !== k && same(x.t as number, t)))
    throw new CodeCutError("duplicate_keyframe", `#${a.id}.${a.prop} already has a key at ${t}s`);
  k.t = t;
  return write(root, a.id, a.prop, set, `move key ${a.prop} ${f}s → ${t}s on #${a.id}`);
}

export function keyDelete(
  root: CCNode,
  a: { id: string; prop: string; t: number | string },
): EditResult {
  const { set } = read(root, a.id, a.prop);
  const t = snap(root, num(a.t, a.id));
  const before = set.keys.length;
  set.keys = set.keys.filter((x) => !same(x.t as number, t));
  if (set.keys.length === before)
    throw new CodeCutError("invalid_edit", `#${a.id}.${a.prop} has no key at ${t}s`);
  if (set.keys.length === 0)
    return makeResult(
      root,
      [{ op: "setProp", id: a.id, prop: a.prop, value: undefined }],
      `delete last key of ${a.prop} on #${a.id}`,
    );
  return write(root, a.id, a.prop, set, `delete key ${a.prop} @ ${t}s on #${a.id}`);
}

/** Copy keys (all, or those at `times`); the keys come back in `data.keys` for keyPaste. */
export function keyCopy(
  root: CCNode,
  a: { id: string; prop: string; times?: Array<number | string> },
): EditResult {
  const { set } = read(root, a.id, a.prop);
  const want = a.times?.map((t) => snap(root, num(t, a.id)));
  const keys = set.keys
    .filter((k) => !want || want.some((w) => same(w, k.t as number)))
    .map((k) => JSON.parse(JSON.stringify(k)));
  return makeResult(root, [], `copy ${keys.length} key(s) of ${a.prop} from #${a.id}`, { keys });
}

export function keyPaste(
  root: CCNode,
  a: {
    id: string;
    prop: string;
    keys: Array<KeyframeObject<any> & { ease?: string }>;
    at: number | string;
  },
): EditResult {
  const { set } = read(root, a.id, a.prop, true);
  if (!a.keys.length) throw new CodeCutError("invalid_edit", "nothing to paste");
  const base = Math.min(...a.keys.map((k) => num(k.t, a.id)));
  const at = snap(root, num(a.at, a.id));
  for (const k of a.keys) {
    const t = snap(root, at + num(k.t, a.id) - base);
    if (set.keys.some((x) => same(x.t as number, t)))
      throw new CodeCutError(
        "duplicate_keyframe",
        `paste would put two keys at ${t}s on #${a.id}.${a.prop}`,
      );
    set.keys.push({ ...k, t });
  }
  return write(
    root,
    a.id,
    a.prop,
    set,
    `paste ${a.keys.length} key(s) onto ${a.prop} of #${a.id} at ${at}s`,
  );
}

export function keyScale(
  root: CCNode,
  a: { id: string; prop: string; factor: number; origin?: number | string },
): EditResult {
  if (!(a.factor > 0)) throw new CodeCutError("invalid_edit", "factor must be > 0");
  const { set } = read(root, a.id, a.prop);
  const origin = a.origin === undefined ? (set.keys[0]!.t as number) : num(a.origin, a.id);
  for (const k of set.keys) k.t = snap(root, origin + ((k.t as number) - origin) * a.factor);
  return write(
    root,
    a.id,
    a.prop,
    set,
    `scale keys of ${a.prop} on #${a.id} by ${a.factor}× about ${origin}s`,
  );
}

export function keyEase(
  root: CCNode,
  a: { id: string; prop: string; t: number | string; ease: string },
): EditResult {
  parseEase(a.ease);
  return keySet(root, { id: a.id, prop: a.prop, t: a.t, ease: a.ease });
}

export function keyMode(
  root: CCNode,
  a: { id: string; prop: string; mode: InterpMode },
): EditResult {
  const { set } = read(root, a.id, a.prop);
  set.opts.mode = a.mode;
  return write(root, a.id, a.prop, set, `set ${a.prop} interpolation on #${a.id} to ${a.mode}`);
}

export function keyReverse(root: CCNode, a: { id: string; prop: string }): EditResult {
  const { set } = read(root, a.id, a.prop);
  const t0 = set.keys[0]!.t as number;
  const t1 = set.keys[set.keys.length - 1]!.t as number;
  const vals = set.keys.map((k) => k.v).reverse();
  set.keys.forEach((k, i) => {
    k.v = vals[i];
    void t0;
    void t1;
  });
  // mirror times so spacing reverses too
  const times = set.keys.map((k) => k.t as number);
  const mirrored = times.map((t) => snap(root, t0 + t1 - t)).reverse();
  set.keys.forEach((k, i) => (k.t = mirrored[i]!));
  return write(root, a.id, a.prop, set, `reverse keys of ${a.prop} on #${a.id}`);
}

/** Rove: retime interior keys so a vector property moves at constant speed along its path. */
export function keyRove(root: CCNode, a: { id: string; prop: string }): EditResult {
  const { set } = read(root, a.id, a.prop);
  if (set.keys.length < 3)
    return write(root, a.id, a.prop, set, `rove ${a.prop} on #${a.id}: nothing to do`);
  const dist = (x: number[], y: number[]) => Math.hypot(...x.map((v, i) => v - y[i]!));
  const vecs = set.keys.map((k) => (Array.isArray(k.v) ? (k.v as number[]) : [k.v as number]));
  const seg = vecs.slice(1).map((v, i) => dist(vecs[i]!, v));
  const total = seg.reduce((s, d) => s + d, 0) || 1;
  const t0 = set.keys[0]!.t as number;
  const t1 = set.keys[set.keys.length - 1]!.t as number;
  let acc = 0;
  for (let i = 1; i < set.keys.length - 1; i++) {
    acc += seg[i - 1]!;
    set.keys[i]!.t = snap(root, t0 + ((t1 - t0) * acc) / total);
  }
  return write(root, a.id, a.prop, set, `rove keys of ${a.prop} on #${a.id}`);
}

export function keyLoop(
  root: CCNode,
  a: { id: string; prop: string; loop: "cycle" | "pingpong" | number | false },
): EditResult {
  const { set } = read(root, a.id, a.prop);
  if (a.loop === false) delete set.opts.loop;
  else set.opts.loop = a.loop;
  return write(root, a.id, a.prop, set, `set ${a.prop} loop on #${a.id} to ${a.loop}`);
}

function kindFor(set: KeySet): ValueKind {
  const v = set.keys[0]?.v;
  if (Array.isArray(v)) return "vec";
  if (typeof v === "number") return "number";
  if (typeof v === "string" && /^(#|rgb|oklch)/i.test(v)) return "color";
  return "discrete";
}

/** Bake the evaluated curve into one key per step (default every frame) between two times. */
export function keyBake(
  root: CCNode,
  a: { id: string; prop: string; from?: number | string; to?: number | string; step?: number },
): EditResult {
  const { set } = read(root, a.id, a.prop);
  const fps = fpsOf(root);
  const track = normalizeTrack(
    { ...set.opts, keys: set.keys.map((k) => ({ ...k })) } as KeyframeTrack<any>,
    { fps, snap: false },
  );
  const from = a.from === undefined ? (set.keys[0]!.t as number) : num(a.from, a.id);
  const to = a.to === undefined ? (set.keys[set.keys.length - 1]!.t as number) : num(a.to, a.id);
  const step = a.step ?? 1 / fps;
  const kind = kindFor(set);
  const out: KeySet["keys"] = [];
  for (let t = from; t <= to + 1e-9; t += step) {
    const tt = snap(root, t);
    if (out.length && same(out[out.length - 1]!.t as number, tt)) continue;
    const v = evalTrack(track, tt, kind);
    out.push({
      t: tt,
      v:
        typeof v === "number"
          ? Math.round(v * 1e4) / 1e4
          : Array.isArray(v)
            ? v.map((x) => Math.round(x * 1e4) / 1e4)
            : v,
    });
  }
  const keep = set.keys.filter((k) => (k.t as number) < from - 1e-9 || (k.t as number) > to + 1e-9);
  const opts = { ...set.opts, mode: "linear" as InterpMode };
  delete opts.spatial;
  return write(
    root,
    a.id,
    a.prop,
    { keys: [...keep, ...out], opts },
    `bake ${a.prop} on #${a.id} (${out.length} keys)`,
  );
}

/** Drop keys that a straight line (in time) reproduces within `tolerance` (Ramer–Douglas–Peucker). */
export function keySimplify(
  root: CCNode,
  a: { id: string; prop: string; tolerance?: number },
): EditResult {
  const { set } = read(root, a.id, a.prop);
  const tol = a.tolerance ?? 0.01;
  const vecs = set.keys.map((k) => (Array.isArray(k.v) ? (k.v as number[]) : [k.v as number]));
  if (vecs.some((v) => v.some((x) => typeof x !== "number")))
    throw new CodeCutError("invalid_edit", "keySimplify works on numeric or vector keys");
  const t = set.keys.map((k) => k.t as number);
  const keep = new Set<number>([0, set.keys.length - 1]);
  const rec = (i: number, j: number) => {
    let worst = -1;
    let wi = -1;
    for (let k = i + 1; k < j; k++) {
      const f = (t[k]! - t[i]!) / (t[j]! - t[i]!);
      const err = Math.max(
        ...vecs[k]!.map((x, c) => Math.abs(x - (vecs[i]![c]! + (vecs[j]![c]! - vecs[i]![c]!) * f))),
      );
      if (err > worst) {
        worst = err;
        wi = k;
      }
    }
    if (worst > tol && wi >= 0) {
      keep.add(wi);
      rec(i, wi);
      rec(wi, j);
    }
  };
  rec(0, set.keys.length - 1);
  const before = set.keys.length;
  set.keys = set.keys.filter((_, i) => keep.has(i));
  return write(
    root,
    a.id,
    a.prop,
    set,
    `simplify ${a.prop} on #${a.id}: ${before} → ${set.keys.length} keys`,
  );
}

const AXES = ["x", "y", "z"];

/** Turn a vector track into independent per-axis tracks: position → { x:[…], y:[…], z:[…] }. */
export function keySeparate(root: CCNode, a: { id: string; prop: string }): EditResult {
  const { set } = read(root, a.id, a.prop);
  const dim = Array.isArray(set.keys[0]!.v) ? (set.keys[0]!.v as number[]).length : 0;
  if (!dim) throw new CodeCutError("invalid_edit", `#${a.id}.${a.prop} is not a vector property`);
  const value: Record<string, unknown> = {};
  for (let c = 0; c < dim; c++) {
    value[AXES[c]!] = set.keys.map((k) =>
      k.ease ? [k.t, (k.v as number[])[c], k.ease] : [k.t, (k.v as number[])[c]],
    );
  }
  return makeResult(
    root,
    [{ op: "setProp", id: a.id, prop: a.prop, value }],
    `separate ${a.prop} of #${a.id} into ${AXES.slice(0, dim).join(", ")}`,
  );
}

/** Inverse of keySeparate: merge x/y/z tracks that share key times into one vector track. */
export function keyCombine(root: CCNode, a: { id: string; prop: string }): EditResult {
  const { node } = elementOrThrow(root, a.id);
  const raw = node.props[a.prop] as Record<string, Keyframe<number>[]> | undefined;
  if (!raw || Array.isArray(raw) || typeof raw !== "object")
    throw new CodeCutError("invalid_edit", `#${a.id}.${a.prop} is not per-axis`);
  const axes = AXES.filter((x) => raw[x]);
  const lists = axes.map((x) =>
    raw[x]!.map((k) =>
      Array.isArray(k)
        ? { t: num(k[0], a.id), v: k[1] as number, ease: k[2] }
        : { t: num(k.t, a.id), v: k.v, ease: undefined },
    ),
  );
  const times = [...new Set(lists.flatMap((l) => l.map((k) => k.t)))].sort((p, q) => p - q);
  const track = lists.map((l) =>
    normalizeTrack(l.map((k) => (k.ease ? [k.t, k.v, k.ease] : [k.t, k.v])) as Keyframe<number>[], {
      fps: fpsOf(root),
      snap: false,
    }),
  );
  const keys = times.map(
    (t) =>
      [t, track.map((tr) => Math.round(evalTrack(tr, t, "number") * 1e4) / 1e4)] as Keyframe<
        number[]
      >,
  );
  return makeResult(
    root,
    [{ op: "setProp", id: a.id, prop: a.prop, value: keys }],
    `combine ${axes.join("")} of ${a.prop} on #${a.id}`,
  );
}

export const KEY_OPS = {
  keyAdd,
  keySet,
  keyMove,
  keyDelete,
  keyCopy,
  keyPaste,
  keyScale,
  keyEase,
  keyMode,
  keyReverse,
  keyRove,
  keyLoop,
  keyBake,
  keySimplify,
  keySeparate,
  keyCombine,
} as const;
export type KeyOpName = keyof typeof KEY_OPS;

export function runKeyOp(root: CCNode, op: string, args: Record<string, unknown>): EditResult {
  const fn = (KEY_OPS as Record<string, (r: CCNode, a: any) => EditResult>)[op];
  if (!fn)
    throw new CodeCutError("invalid_edit", `Unknown keyframe op "${op}"`, {
      fix: `Ops: ${Object.keys(KEY_OPS).join(", ")}`,
    });
  return fn(root, args);
}

export { cloneNode };
