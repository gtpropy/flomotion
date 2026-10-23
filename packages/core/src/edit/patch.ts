import { CodeCutError } from "../errors.js";
import { cloneNode, findById, isNode, walk, type CCNode } from "../ast/node.js";

/** One structural change to the element tree, addressed by element id. Serializable; applied by codemods too. */
export type Patch =
  | {
      op: "setProp";
      id: string;
      prop: string;
      value: unknown;
      /** previous value; `undefined` + hadPrev=false means the prop did not exist */ prev?: unknown;
      hadPrev?: boolean;
    }
  | { op: "insert"; parent: string; index: number; node: CCNode }
  | { op: "remove"; id: string };

export interface EditResult {
  /** The edited tree (a new object; the input is untouched). */
  project: CCNode;
  patches: Patch[];
  /** Applying these to `project` restores the input. */
  undo: Patch[];
  /** One line for history and the agent feed. */
  description: string;
  /** Extra data some ops return (e.g. copied keyframes, ids created). */
  data?: Record<string, unknown>;
}

export function elementOrThrow(root: CCNode, id: string) {
  const hit = findById(root, id);
  if (!hit)
    throw new CodeCutError("unknown_element", `No element with id "${id}"`, {
      fix: "Use project_read to list ids.",
    });
  return hit;
}

/** Apply patches to a clone of `root`. Returns the new tree and the inverse patches (already in undo order). */
export function applyPatches(root: CCNode, patches: Patch[]): { project: CCNode; undo: Patch[] } {
  const project = cloneNode(root);
  const inverse: Patch[] = [];
  for (const p of patches) {
    switch (p.op) {
      case "setProp": {
        const { node } = elementOrThrow(project, p.id);
        const had = Object.prototype.hasOwnProperty.call(node.props, p.prop);
        const prev = node.props[p.prop];
        inverse.unshift({
          op: "setProp",
          id: p.id,
          prop: p.prop,
          value: prev,
          prev: p.value,
          hadPrev: had,
        });
        if (p.value === undefined) delete node.props[p.prop];
        else node.props = { ...node.props, [p.prop]: p.value };
        if (p.hadPrev === false && p.value === undefined) {
          /* undo of an added prop: removed above */
        }
        break;
      }
      case "insert": {
        const { node: parent } = elementOrThrow(project, p.parent);
        const idx = Math.max(0, Math.min(parent.children.length, p.index));
        parent.children.splice(idx, 0, cloneNode(p.node));
        inverse.unshift({ op: "remove", id: String(p.node.props.id) });
        break;
      }
      case "remove": {
        const { node, parent, index } = elementOrThrow(project, p.id);
        if (!parent) throw new CodeCutError("invalid_edit", "Cannot remove the root element");
        parent.children.splice(index, 1);
        inverse.unshift({
          op: "insert",
          parent: String(parent.props.id),
          index,
          node: cloneNode(node),
        });
        break;
      }
    }
  }
  return { project, undo: inverse };
}

/** Undo an edit: apply its undo patches to the edited project. */
export function undoEdit(project: CCNode, undo: Patch[]): CCNode {
  return applyPatches(project, undo).project;
}

/** Build an EditResult from patches. */
export function makeResult(
  root: CCNode,
  patches: Patch[],
  description: string,
  data?: Record<string, unknown>,
): EditResult {
  const { project, undo } = applyPatches(root, patches);
  return { project, patches, undo, description, data };
}

export function idsOf(root: CCNode): Set<string> {
  const s = new Set<string>();
  walk(root, (n) => {
    if (typeof n.props.id === "string") s.add(n.props.id);
  });
  return s;
}

export function uniqueId(root: CCNode, base: string): string {
  const ids = idsOf(root);
  if (!ids.has(base)) return base;
  let i = 2;
  while (ids.has(`${base}_${i}`)) i++;
  return `${base}_${i}`;
}

export { isNode };
