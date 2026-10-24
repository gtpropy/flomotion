import { FRAGMENT, flattenChildren, type CCNode } from "../ast/node.js";
import { FlomotionError } from "../errors.js";

type TagLike = ((props: any) => CCNode) | symbol | string;

function build(type: TagLike, props: Record<string, unknown>): CCNode {
  if (typeof type === "function") return type(props);
  if (typeof type === "symbol") {
    return { $cc: 1, name: FRAGMENT, props: {}, children: flattenChildren(props.children) };
  }
  throw new FlomotionError("unknown_component", `Unknown element <${String(type)}>`, {
    fix: "Only components created with defineComponent/defineEffect can be used as JSX tags.",
  });
}

export function jsx(type: TagLike, props: Record<string, unknown>, _key?: string): CCNode {
  return build(type, props ?? {});
}
export const jsxs = jsx;
export const jsxDEV = jsx;
export const Fragment = Symbol.for("flomotion.fragment");

export namespace JSX {
  export type Element = CCNode;
  export interface ElementChildrenAttribute {
    children: unknown;
  }
  export interface IntrinsicElements {}
  export interface ElementClass {}
}
