import { ID_PREFIX } from "../config.js";
import { hashSeed } from "../values/noise.js";
import { isNode, walk, type CCNode } from "./node.js";

/** Deterministic id from the structural path. Written back once, then stable. */
export function generateId(path: string): string {
  return ID_PREFIX + hashSeed(path).toString(36).padStart(7, "0");
}

export function collectIds(root: CCNode): Set<string> {
  const ids = new Set<string>();
  walk(root, (n) => {
    if (typeof n.props.id === "string") ids.add(n.props.id);
  });
  return ids;
}

/**
 * Give every element without an id a stable `cc_` id. Mutates the tree and returns what changed so a
 * codemod can write the ids back to the source on first save.
 */
export function assignMissingIds(root: CCNode): Array<{ node: CCNode; id: string; path: string }> {
  const used = collectIds(root);
  const added: Array<{ node: CCNode; id: string; path: string }> = [];
  const visit = (n: CCNode, path: string) => {
    if (typeof n.props.id !== "string") {
      let id = generateId(path);
      while (used.has(id)) id = generateId(path + "#" + id);
      used.add(id);
      n.props = { id, ...n.props };
      added.push({ node: n, id, path });
    }
    n.children.forEach((c, i) => {
      if (isNode(c)) visit(c, `${path}/${c.name}[${i}]`);
    });
  };
  visit(root, root.name);
  return added;
}
