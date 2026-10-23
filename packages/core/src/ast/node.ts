/**
 * The element tree built by the JSX runtime. Fully serializable apart from expression props
 * (functions), which serialize to their source text.
 */
export interface CCNode {
  $cc: 1;
  name: string;
  props: Record<string, unknown>;
  children: CCChild[];
}
export type CCChild = CCNode | string | number;

export const isNode = (x: unknown): x is CCNode =>
  typeof x === "object" && x !== null && (x as CCNode).$cc === 1;

export const FRAGMENT = "Fragment";

export function flattenChildren(input: unknown, out: CCChild[] = []): CCChild[] {
  if (input === undefined || input === null || input === false || input === true) return out;
  if (Array.isArray(input)) {
    for (const c of input) flattenChildren(c, out);
    return out;
  }
  if (isNode(input)) {
    if (input.name === FRAGMENT) {
      for (const c of input.children) out.push(c);
    } else {
      out.push(input);
    }
    return out;
  }
  if (typeof input === "string" || typeof input === "number") {
    out.push(input);
    return out;
  }
  throw new TypeError(`Unsupported child of type ${typeof input}`);
}

/** Walk every element node depth first. */
export function walk(
  node: CCNode,
  fn: (n: CCNode, parent: CCNode | null, index: number) => void,
  parent: CCNode | null = null,
  index = 0,
): void {
  fn(node, parent, index);
  node.children.forEach((c, i) => {
    if (isNode(c)) walk(c, fn, node, i);
  });
}

export function findById(
  root: CCNode,
  id: string,
): { node: CCNode; parent: CCNode | null; index: number } | null {
  let hit: { node: CCNode; parent: CCNode | null; index: number } | null = null;
  walk(root, (n, p, i) => {
    if (!hit && n.props.id === id) hit = { node: n, parent: p, index: i };
  });
  return hit;
}

/** Deep clone keeping functions by reference. */
export function cloneNode(n: CCNode): CCNode {
  return {
    $cc: 1,
    name: n.name,
    props: cloneValue(n.props) as Record<string, unknown>,
    children: n.children.map((c) => (isNode(c) ? cloneNode(c) : c)),
  };
}

function cloneValue(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(cloneValue);
  if (v && typeof v === "object") {
    return Object.fromEntries(Object.entries(v as object).map(([k, x]) => [k, cloneValue(x)]));
  }
  return v;
}

/** JSON form of a tree: expression functions become `{ $expr: "<source>" }`. */
export function serializeNode(n: CCNode): unknown {
  return {
    name: n.name,
    props: JSON.parse(
      JSON.stringify(n.props, (_k, v) =>
        typeof v === "function" ? { $expr: Function.prototype.toString.call(v) } : v,
      ),
    ),
    children: n.children.map((c) => (isNode(c) ? serializeNode(c) : c)),
  };
}
