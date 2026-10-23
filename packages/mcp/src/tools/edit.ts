import { z } from "zod";
import {
  CodeCutError,
  EDIT_OPS,
  KEY_OPS,
  findById,
  runEdit,
  runKeyOp,
  serializeNode,
  snapToFrame,
  suggest,
  validateProps,
  type CCNode,
  type ComponentDef,
  type Patch,
  type PropIssue,
} from "@codecut/core";
import { registry } from "@codecut/components";
import { edit as coreEdit } from "@codecut/core";
import { lintProjectDir } from "@codecut/render";
import { TsxDoc } from "../codemod/tsx.js";
import { assertUnlocked, lowerFirst, outlineOf, subtreeIds, tool, writeResult } from "./util.js";

const { makeResult, uniqueId, itemsOf, timingOf } = coreEdit;
const props = z.record(z.string(), z.unknown());

/** Build a typed schema_violation from validation issues. */
export function schemaError(
  def: ComponentDef,
  id: string | undefined,
  issues: PropIssue[],
): CodeCutError {
  const head = issues[0]!;
  return new CodeCutError("schema_violation", `${id ? `#${id} ` : ""}${head.message}`, {
    fix: head.fix ?? `See codecut://schema/${def.name}`,
    details: issues,
  });
}

function defOrThrow(name: string, kind: "component" | "effect"): ComponentDef {
  const def = registry.get(name);
  if (!def) {
    const s = suggest(
      name,
      registry.list(kind).map((d) => d.name),
    );
    throw new CodeCutError(
      "schema_violation",
      `Unknown ${kind} "${name}"${s ? `. Did you mean "${s}"?` : ""}`,
      {
        fix: `See codecut://schema/<name>. ${kind === "effect" ? "Effects" : "Components"}: ${registry
          .list(kind)
          .map((d) => d.name)
          .join(", ")}`,
      },
    );
  }
  if (def.kind !== kind)
    throw new CodeCutError(
      "schema_violation",
      `${name} is ${def.kind === "effect" ? "an effect" : "a component"}, not ${kind === "effect" ? "an effect" : "a component"}`,
      { fix: def.kind === "effect" ? "Use effect_add." : "Use element_add." },
    );
  if (def.stub)
    throw new CodeCutError(
      "schema_violation",
      `${name} is a typed stub and cannot be rendered yet`,
      {
        fix: "See docs/later.md.",
      },
    );
  return def;
}

function checkParentAccepts(parent: CCNode, def: ComponentDef): void {
  const pdef = registry.get(parent.name);
  const rule = pdef?.children ?? "any";
  if (rule === "none")
    throw new CodeCutError(
      "schema_violation",
      `${parent.name} #${parent.props.id} cannot have children`,
      {
        fix: "Add it to the parent's parent instead.",
      },
    );
  if (rule === "effects" && def.kind !== "effect")
    throw new CodeCutError(
      "schema_violation",
      `${parent.name} #${parent.props.id} only accepts effects`,
      {
        fix: "Use effect_add, or add the element to a container.",
      },
    );
  if (Array.isArray(rule) && !rule.includes(def.name))
    throw new CodeCutError("schema_violation", `${parent.name} only accepts ${rule.join(", ")}`, {
      fix: `Pick one of ${rule.join(", ")}.`,
    });
}

function overlapCheck(root: CCNode, parent: CCNode, node: CCNode, allow?: boolean): void {
  if (allow || parent.name !== "Track") return;
  if (node.props.start === undefined && node.props.duration === undefined) return;
  const t = timingOf(root, node);
  for (const o of itemsOf(root, parent)) {
    if (t.start < o.end - 1e-9 && t.end > o.start + 1e-9)
      throw new CodeCutError(
        "overlap_rejected",
        `[${t.start}s, ${t.end}s) overlaps #${o.id} [${o.start}s, ${o.end}s)`,
        { fix: "Move it, trim the neighbour, or pass overlap:true." },
      );
  }
}

export const elementAdd = tool({
  name: "element_add",
  title: "Add an element",
  description:
    "Add a component (Title, Rect, Scene, Card, …) under a parent. Props are validated against the component schema (see codecut://schema/{component}). Returns the new id, the patch, and an undo token.",
  input: {
    parent: z.string().describe("Id of the parent (Composition, Track, Scene, Group, …)."),
    type: z.string().describe("Component name, e.g. Title."),
    props: props.describe("Props as JSON. Keyframes are arrays like [[0,1],[1,2,'expo.out']]."),
    at: z.number().int().min(0).optional().describe("Child index to insert at (default: last)."),
    overlap: z.boolean().optional().describe("Allow overlapping another clip on a Track."),
  },
  async run(a, ctx) {
    ctx.requireProject();
    const loaded = await ctx.store.load();
    const root = loaded.node;
    const def = defOrThrow(a.type, "component");
    const hit = findById(root, a.parent);
    if (!hit)
      throw new CodeCutError("unknown_element", `No element with id "${a.parent}"`, {
        fix: "Use project_read to list ids.",
      });
    assertUnlocked(root, a.parent);
    checkParentAccepts(hit.node, def);
    const id = typeof a.props.id === "string" ? a.props.id : uniqueId(root, lowerFirst(a.type));
    if (findById(root, id))
      throw new CodeCutError("invalid_edit", `Id "${id}" is already used`, {
        fix: "Pick another id or omit it.",
      });
    const full = { ...a.props, id };
    const issues = validateProps(def, full);
    if (issues.length) throw schemaError(def, id, issues);
    const node: CCNode = { $cc: 1, name: a.type, props: { id, ...a.props }, children: [] };
    overlapCheck(root, hit.node, node, a.overlap);
    const index = a.at ?? hit.node.children.length;
    const result = makeResult(
      root,
      [{ op: "insert", parent: a.parent, index, node }],
      `add ${a.type} #${id} to #${a.parent}`,
      { id },
    );
    return { data: writeResult(await ctx.store.apply(result, loaded)) };
  },
});

export const elementSet = tool({
  name: "element_set",
  title: "Change props",
  description:
    "Set props on an element. A value of null removes the prop. Props that are expressions in the source file cannot be changed this way (typed error opaque_expression).",
  input: { id: z.string(), props },
  async run(a, ctx) {
    ctx.requireProject();
    const loaded = await ctx.store.load();
    const root = loaded.node;
    const hit = findById(root, a.id);
    if (!hit)
      throw new CodeCutError("unknown_element", `No element with id "${a.id}"`, {
        fix: "Use project_read to list ids.",
      });
    assertUnlocked(root, a.id);
    const def = registry.get(hit.node.name);
    const next = Object.fromEntries(
      Object.entries(a.props).map(([k, v]) => [k, v === null ? undefined : v]),
    );
    if (def) {
      const merged = { ...hit.node.props, ...next };
      const issues = validateProps(def, merged).filter((i) => i.prop in a.props);
      if (issues.length) throw schemaError(def, a.id, issues);
    }
    if ("id" in a.props && a.props.id !== a.id)
      throw new CodeCutError(
        "invalid_edit",
        "Ids are stable and cannot be changed with element_set",
        {
          fix: "Remove and re-add the element, or edit the source.",
        },
      );
    const patches: Patch[] = Object.entries(next).map(([prop, value]) => ({
      op: "setProp",
      id: a.id,
      prop,
      value,
    }));
    const result = makeResult(root, patches, `set ${Object.keys(a.props).join(", ")} on #${a.id}`);
    return { data: writeResult(await ctx.store.apply(result, loaded)) };
  },
});

export const elementRemove = tool({
  name: "element_remove",
  title: "Remove an element",
  description: "Remove an element and everything inside it.",
  input: { id: z.string() },
  async run(a, ctx) {
    ctx.requireProject();
    const loaded = await ctx.store.load();
    const hit = findById(loaded.node, a.id);
    if (!hit)
      throw new CodeCutError("unknown_element", `No element with id "${a.id}"`, {
        fix: "Use project_read to list ids.",
      });
    if (!hit.parent)
      throw new CodeCutError("invalid_edit", "The root Composition cannot be removed");
    assertUnlocked(loaded.node, a.id);
    const result = makeResult(
      loaded.node,
      [{ op: "remove", id: a.id }],
      `remove ${hit.node.name} #${a.id}`,
    );
    return { data: writeResult(await ctx.store.apply(result, loaded)) };
  },
});

export const elementMove = tool({
  name: "element_move",
  title: "Move an element",
  description:
    "Move an element to another parent (`target`) and/or child position (`index`). To change when a clip plays use `edit` with op move.",
  input: {
    id: z.string(),
    target: z.string().optional().describe("New parent id (default: same parent)."),
    index: z
      .number()
      .int()
      .min(0)
      .optional()
      .describe("Child index in the target (default: last)."),
  },
  async run(a, ctx) {
    ctx.requireProject();
    const loaded = await ctx.store.load();
    const root = loaded.node;
    const hit = findById(root, a.id);
    if (!hit?.parent)
      throw new CodeCutError("unknown_element", `No movable element "${a.id}"`, {
        fix: "Use project_read to list ids.",
      });
    const target = a.target ? findById(root, a.target) : { node: hit.parent };
    if (!target) throw new CodeCutError("unknown_element", `No element with id "${a.target}"`);
    if (subtreeIds(hit.node).has(String(target.node.props.id)))
      throw new CodeCutError("invalid_edit", "Cannot move an element into itself");
    assertUnlocked(root, a.id);
    assertUnlocked(root, String(target.node.props.id));
    const def = registry.get(hit.node.name);
    if (def) checkParentAccepts(target.node, def);
    const same = target.node === hit.parent;
    let index = a.index ?? target.node.children.length;
    if (same && a.index === undefined) index = target.node.children.length - 1;
    const patches: Patch[] = [
      { op: "remove", id: a.id },
      { op: "insert", parent: String(target.node.props.id), index, node: hit.node },
    ];
    const result = makeResult(
      root,
      patches,
      `move ${hit.node.name} #${a.id} to #${target.node.props.id}[${index}]`,
    );
    return { data: writeResult(await ctx.store.apply(result, loaded)) };
  },
});

export const effectAdd = tool({
  name: "effect_add",
  title: "Add an effect",
  description:
    "Add an effect (Shake, Glow, Blur, ColorGrade, …) to a layer. Effects apply to their parent in source order. Returns the effect id.",
  input: { id: z.string().describe("Id of the layer."), effect: z.string(), props },
  async run(a, ctx) {
    ctx.requireProject();
    const loaded = await ctx.store.load();
    const root = loaded.node;
    const def = defOrThrow(a.effect, "effect");
    const hit = findById(root, a.id);
    if (!hit)
      throw new CodeCutError("unknown_element", `No element with id "${a.id}"`, {
        fix: "Use project_read to list ids.",
      });
    assertUnlocked(root, a.id);
    const id =
      typeof a.props.id === "string"
        ? a.props.id
        : uniqueId(root, `${a.id}-${lowerFirst(a.effect)}`);
    const issues = validateProps(def, { ...a.props, id });
    if (issues.length) throw schemaError(def, id, issues);
    const node: CCNode = { $cc: 1, name: a.effect, props: { id, ...a.props }, children: [] };
    const result = makeResult(
      root,
      [{ op: "insert", parent: a.id, index: hit.node.children.length, node }],
      `add ${a.effect} #${id} to #${a.id}`,
      { id },
    );
    return { data: writeResult(await ctx.store.apply(result, loaded)) };
  },
});

const keyArg = z.union([
  z.tuple([z.union([z.number(), z.string()]), z.unknown()]),
  z.tuple([z.union([z.number(), z.string()]), z.unknown(), z.string()]),
  z.object({
    t: z.union([z.number(), z.string()]),
    v: z.unknown(),
    ease: z.string().optional(),
  }),
]);

export const keyframeSet = tool({
  name: "keyframe_set",
  title: "Set keyframes",
  description:
    "Replace all keyframes of an animatable prop. Keys are [time, value, ease?] or {t, v, ease?}; times are seconds relative to the parent start and snap to the frame grid. Never linear: pass an ease on motion.",
  input: {
    id: z.string(),
    prop: z.string(),
    keys: z.array(keyArg).min(1),
  },
  async run(a, ctx) {
    ctx.requireProject();
    const loaded = await ctx.store.load();
    const root = loaded.node;
    const hit = findById(root, a.id);
    if (!hit)
      throw new CodeCutError("unknown_element", `No element with id "${a.id}"`, {
        fix: "Use project_read to list ids.",
      });
    assertUnlocked(root, a.id);
    const def = registry.get(hit.node.name);
    const control = def?.controls[a.prop];
    if (def && !control)
      throw new CodeCutError("schema_violation", `${def.name} has no prop "${a.prop}"`, {
        fix: `Valid props: ${Object.keys(def.controls).join(", ")}`,
      });
    if (control && !control.animatable)
      throw new CodeCutError("schema_violation", `${def!.name}.${a.prop} is not animatable`, {
        fix: "Set it with element_set, or animate a prop marked animatable.",
      });
    const fps = typeof root.props.fps === "number" ? root.props.fps : 30;
    const keys = a.keys.map((k) => {
      const [t, v, ease] = Array.isArray(k) ? [k[0], k[1], k[2]] : [k.t, k.v, k.ease];
      const secs = typeof t === "number" ? t : parseFloat(String(t));
      if (!Number.isFinite(secs) || (typeof t === "string" && !/^-?\d+(\.\d+)?s?$/.test(t.trim())))
        throw new CodeCutError(
          "invalid_time",
          `Keyframe time ${JSON.stringify(t)} is not a literal time`,
          {
            fix: "Use seconds as a number, e.g. 0.6.",
          },
        );
      return { t: snapToFrame(secs, fps), v, ease: ease as string | undefined };
    });
    keys.sort((x, y) => x.t - y.t);
    for (let i = 1; i < keys.length; i++)
      if (keys[i]!.t === keys[i - 1]!.t)
        throw new CodeCutError(
          "duplicate_keyframe",
          `Two keys share ${keys[i]!.t}s on #${a.id}.${a.prop}`,
          {
            fix: "Give each key its own time (at least one frame apart).",
          },
        );
    const value = keys.map((k) => (k.ease ? [k.t, k.v, k.ease] : [k.t, k.v]));
    if (def) {
      const issues = validateProps(def, { ...hit.node.props, [a.prop]: value }).filter(
        (i) => i.prop === a.prop,
      );
      if (issues.length) throw schemaError(def, a.id, issues);
    }
    const result = makeResult(
      root,
      [{ op: "setProp", id: a.id, prop: a.prop, value }],
      `set ${keys.length} keys on #${a.id}.${a.prop}`,
    );
    return { data: writeResult(await ctx.store.apply(result, loaded)) };
  },
});

export const editTool = tool({
  name: "edit",
  title: "Timeline edit",
  description: `Run a timeline edit. Timeline ops: ${Object.keys(EDIT_OPS).join(", ")}. Keyframe ops: ${Object.keys(KEY_OPS).join(", ")}. Args are the op's arguments (ids, times as seconds or "2s"). Overlaps and locked tracks are rejected with typed errors.`,
  input: { op: z.string(), args: z.record(z.string(), z.unknown()).default({}) },
  async run(a, ctx) {
    ctx.requireProject();
    const loaded = await ctx.store.load();
    const result =
      a.op in KEY_OPS ? runKeyOp(loaded.node, a.op, a.args) : runEdit(loaded.node, a.op, a.args);
    return { data: writeResult(await ctx.store.apply(result, loaded)) };
  },
});

const IMPURE =
  /\b(Math\.random|Date\.now|new\s+Date|performance\.now|requestAnimationFrame|setTimeout|setInterval|fetch\s*\(|crypto\.getRandomValues|XMLHttpRequest)\b/;

/** Syntax-check a JSX snippet and reject anything that is not a pure function of time. */
function parseSnippet(tsx: string): void {
  new TsxDoc(`export default (${tsx.trim()});`).assertParses();
  const m = IMPURE.exec(tsx);
  if (m)
    throw new CodeCutError(
      "impure_expression",
      `The TSX uses ${m[1]}, which makes the video differ between renders`,
      {
        fix: "Use ctx.noise(seed, freq) for randomness and the time t for animation. No clocks, timers or network.",
      },
    );
}

export const sceneWrite = tool({
  name: "scene_write",
  title: "Write a scene as TSX",
  description:
    "Replace one element (usually a Scene) with TSX you write. The TSX is parsed, written, re-read and linted first; if it does not parse or adds lint errors nothing changes. Missing imports are added. Use this for expressions or many elements at once; use element_* for single edits.",
  input: {
    id: z.string().describe("Id of the element to replace."),
    tsx: z
      .string()
      .describe('One JSX element, e.g. <Scene id="hook" start="0s" duration="3s">…</Scene>.'),
  },
  async run(a, ctx) {
    ctx.requireProject();
    parseSnippet(a.tsx);
    const loaded = await ctx.store.load();
    const hit = findById(loaded.node, a.id);
    if (!hit?.parent)
      throw new CodeCutError("unknown_element", `No replaceable element "${a.id}"`, {
        fix: "Use project_read to list ids.",
      });
    assertUnlocked(loaded.node, a.id);
    const before = await lintProjectDir(ctx.root, ctx.store.config().lint);
    const baseline = new Set(
      before.issues
        .filter((i) => i.severity === "error")
        .map((i) => `${i.rule}|${i.id}|${i.message}`),
    );
    const names: string[] = [];
    const nameRe = /<([A-Z][A-Za-z0-9]*)/g;
    for (let m = nameRe.exec(a.tsx); m; m = nameRe.exec(a.tsx)) names.push(m[1]!);
    let doc = new TsxDoc(ctx.store.source()).replaceElement(a.id, a.tsx);
    doc = doc.ensureImports(
      names.filter((n) => registry.has(n) || ["Composition", "Track", "Scene"].includes(n)),
    );
    doc.assertParses();
    const { undoToken } = await ctx.store.write(doc.text, `scene_write #${a.id}`, async () => {
      const lint = await lintProjectDir(ctx.root, ctx.store.config().lint);
      const fresh = lint.issues.filter(
        (i) => i.severity === "error" && !baseline.has(`${i.rule}|${i.id}|${i.message}`),
      );
      if (fresh.length)
        throw new CodeCutError(
          "schema_violation",
          `The new TSX adds ${fresh.length} lint error(s): ${fresh[0]!.message}`,
          {
            fix: fresh[0]!.fix ?? "Fix the lint errors and write it again.",
            details: fresh,
          },
        );
    });
    const ids = await ctx.store.ensureIds();
    const now = await ctx.store.load();
    const newHit = findById(now.node, a.id);
    const patches: Patch[] = [
      { op: "remove", id: a.id },
      ...(newHit?.parent
        ? [
            {
              op: "insert",
              parent: String(newHit.parent.props.id),
              index: newHit.index,
              node: newHit.node,
            } as Patch,
          ]
        : []),
    ];
    return {
      data: writeResult({
        patches: JSON.parse(
          JSON.stringify(
            patches.map((p) => (p.op === "insert" ? { ...p, node: serializeNode(p.node) } : p)),
          ),
        ),
        description: `replace #${a.id} with ${names[0] ?? "new"} TSX`,
        undoToken,
        data: { idsWritten: ids },
      }),
    };
  },
});

export const lintTool = tool({
  name: "lint",
  title: "Lint the project",
  description:
    "Check schema, determinism (impure expressions), fonts (lock, licence, missing glyphs), assets and ledger, text size, safe area and contrast. Run after every scene. `scope` limits issues to an element and its children.",
  input: { scope: z.string().optional().describe("Element id.") },
  readOnly: true,
  async run(a, ctx) {
    ctx.requireProject();
    const r = await lintProjectDir(ctx.root, ctx.store.config().lint);
    let issues = r.issues;
    if (a.scope) {
      const hit = findById(r.loaded.node, a.scope);
      if (!hit) throw new CodeCutError("unknown_element", `No element with id "${a.scope}"`);
      const ids = subtreeIds(hit.node);
      issues = issues.filter((i) => !i.id || ids.has(i.id));
    }
    return {
      data: {
        errors: issues.filter((i) => i.severity === "error").length,
        warnings: issues.filter((i) => i.severity === "warning").length,
        issues,
      },
    };
  },
});

export const projectRead = tool({
  name: "project_read",
  title: "Read the project outline",
  description:
    "Outline of the project: composition settings, tracks, scenes and element ids with their timing. `path` is an element id to start from (default: the root). `depth` limits nesting (default 3).",
  input: {
    path: z.string().optional(),
    depth: z.number().int().min(0).max(12).optional(),
  },
  readOnly: true,
  async run(a, ctx) {
    ctx.requireProject();
    const idsWritten = await ctx.store.ensureIds();
    const loaded = await ctx.store.load();
    const start = a.path ? findById(loaded.node, a.path)?.node : loaded.node;
    if (!start)
      throw new CodeCutError("unknown_element", `No element with id "${a.path}"`, {
        fix: "Use project_read without a path.",
      });
    return {
      data: {
        project: ctx.root,
        file: loaded.entry.replace(ctx.root + "/", ""),
        ...(idsWritten.length ? { idsWritten } : {}),
        outline: outlineOf(start, a.depth ?? 3),
      },
    };
  },
});
