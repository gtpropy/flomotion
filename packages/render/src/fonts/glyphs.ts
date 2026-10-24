import { join } from "node:path";
import type { ResolvedFont } from "@flomotion/core";
import { graphemes } from "@flomotion/core";
import { inspectFont } from "./inspect.js";

const IGNORABLE = new RegExp("[\\s\\u200b-\\u200f\\u2028\\u2029\\u00ad\\ufeff]", "u");

/** Characters of `text` that no file of `font` has a glyph for (union across subset files). */
export function missingGlyphs(root: string, font: ResolvedFont, text: string): string[] {
  if (font.source === "system" || !font.files.length) return [];
  const infos = font.files.map((f) => inspectFont(join(root, f.path)));
  const missing = new Set<string>();
  for (const g of graphemes(text)) {
    for (const ch of [...g]) {
      if (IGNORABLE.test(ch)) continue;
      const cp = ch.codePointAt(0)!;
      // combining marks and joiners ride along with their base: skip when the base exists
      if (/\p{M}|‍/u.test(ch)) continue;
      if (!infos.some((i) => i.glyphs(cp))) missing.add(ch);
    }
  }
  return [...missing];
}
