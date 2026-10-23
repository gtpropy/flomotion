import { graphemes, type LineBox, type RNode } from "@codecut/core";

export type By = "char" | "word" | "line";

/** DOM ids of the animatable units of a Text, published by Text.render for TextAnimator. */
export interface UnitTable {
  char: string[];
  word: string[];
  line: string[];
  /** Id of the inner element each unit kind should be animated on. */
  target: { char: string[]; word: string[]; line: string[] };
  /** Text content of each char unit (for scramble). */
  charText: string[];
  /** Text content of each word unit (for counters). */
  wordText: string[];
  /** Base values at the start of the text, for interpolation. */
  base: {
    weight: number;
    tracking: number;
    fill?: string;
    size: number;
  };
  mask: boolean;
}

/** Published per Text node during render; read by TextAnimator.apply in the same compile. */
const tables = new WeakMap<RNode, UnitTable>();
export const setUnitTable = (n: RNode, t: UnitTable) => tables.set(n, t);
export const getUnitTable = (n: RNode): UnitTable | undefined => tables.get(n);

/** Which unit kinds the animator children of a node need. */
export function neededUnits(node: RNode, own: By[] = []): Set<By> {
  const s = new Set<By>(own);
  for (const e of node.effects) {
    if (e.name === "TextAnimator") s.add(((e.raw.by as By) ?? "char") as By);
  }
  return s;
}

export interface StyledChar {
  g: string;
  open: string;
  close: string;
}

export const isSpace = (g: string) => /^\s+$/.test(g);

/** Assign each non-newline grapheme of `chars` to a line, using a measured layout. */
export function lineOfChars(chars: StyledChar[], lines: LineBox[]): number[] {
  const out: number[] = new Array(chars.length).fill(0);
  if (!lines.length) return out;
  const firsts = lines.map((l) => l.glyphs[0]?.index ?? 0);
  for (let i = 0; i < chars.length; i++) {
    let li = 0;
    for (let k = 0; k < firsts.length; k++) if (i >= firsts[k]!) li = k;
    out[i] = li;
  }
  return out;
}

export const countGraphemes = (s: string) => graphemes(s).length;
