import { z } from "zod";
import { CodeCutError, isNode, walk, type CCNode } from "@codecut/core";
import type { Context } from "../context.js";

export interface ToolOutput {
  /** JSON-able result shown to the model. */
  data: unknown;
  /** Image files to attach so the model can look at them. */
  images?: Array<{ path: string; mime: "image/png" | "image/jpeg" }>;
}

export interface ToolDef<S extends z.ZodRawShape = z.ZodRawShape> {
  name: string;
  title: string;
  description: string;
  input: S;
  /** Does not change the project or spend anything. */
  readOnly?: boolean;
  run(args: z.infer<z.ZodObject<S>>, ctx: Context): Promise<ToolOutput>;
}

export const tool = <S extends z.ZodRawShape>(def: ToolDef<S>): ToolDef<S> => def;

/** Props shown in an outline (enough to find things, not a full dump). */
const OUTLINE_PROPS = [
  "start",
  "duration",
  "end",
  "at",
  "kind",
  "locked",
  "muted",
  "text",
  "src",
  "theme",
  "size",
  "fps",
  "voice",
] as const;

export interface OutlineNode {
  id?: string;
  type: string;
  props?: Record<string, unknown>;
  children?: OutlineNode[];
  /** Number of children left out because of `depth`. */
  more?: number;
}

export function outlineOf(n: CCNode, depth: number): OutlineNode {
  const props: Record<string, unknown> = {};
  for (const k of OUTLINE_PROPS)
    if (n.props[k] !== undefined && typeof n.props[k] !== "function") props[k] = n.props[k];
  const kids = n.children.filter(isNode);
  const out: OutlineNode = {
    id: typeof n.props.id === "string" ? n.props.id : undefined,
    type: n.name,
    ...(Object.keys(props).length ? { props } : {}),
  };
  if (depth > 0 && kids.length) out.children = kids.map((c) => outlineOf(c, depth - 1));
  else if (kids.length) out.more = kids.length;
  return out;
}

/** Throw `track_locked` when any Track above (or at) the element is locked. */
export function assertUnlocked(root: CCNode, id: string): void {
  const chain: CCNode[] = [];
  const dfs = (n: CCNode, path: CCNode[]): boolean => {
    if (n.props.id === id) {
      chain.push(...path, n);
      return true;
    }
    return n.children.some((c) => isNode(c) && dfs(c, [...path, n]));
  };
  dfs(root, []);
  const t = chain.find((n) => n.name === "Track" && n.props.locked === true);
  if (t)
    throw new CodeCutError("track_locked", `Track #${t.props.id} is locked`, {
      fix: `Unlock it first: edit {op:"lockTrack", args:{track:"${t.props.id}", value:false}}.`,
    });
}

export function subtreeIds(n: CCNode): Set<string> {
  const s = new Set<string>();
  walk(n, (x) => {
    if (typeof x.props.id === "string") s.add(x.props.id);
  });
  return s;
}

export const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** A keyed bundle of what a write returns. */
export const writeResult = (r: {
  patches: unknown[];
  description: string;
  undoToken: string;
  data?: Record<string, unknown>;
}) => ({
  description: r.description,
  patches: r.patches,
  undoToken: r.undoToken,
  ...(r.data ?? {}),
});

export const timeArg = z.union([z.number(), z.string()]);
