import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { isCodeCutError, lintTree, type LintConfig, type LintIssue, type ResolvedFont } from "@codecut/core";
import { safeRect } from "@codecut/components";
import { collectFontDecls, loadProject, loadVoiceWords, type LoadedProject } from "./project.js";
import { readLedger, readLock, resolveFromLock } from "./fonts/lock.js";
import { missingGlyphs } from "./fonts/glyphs.js";
import { probeMedia } from "./media-probe.js";

export interface LintResult {
  issues: LintIssue[];
  errors: number;
  warnings: number;
  loaded: LoadedProject;
}

/** Lint a project directory: schema, determinism, fonts (lock, ledger, glyph coverage), assets, text rules. */
export async function lintProjectDir(dir: string, config: Partial<LintConfig> = {}): Promise<LintResult> {
  const loaded = await loadProject(dir);
  const { root, node } = loaded;
  const ledger = readLedger(root);
  const { decls, allowSystem } = collectFontDecls(node);
  const lock = readLock(root);
  const issues: LintIssue[] = [];
  const fonts = new Map<string, ResolvedFont>();
  for (const d of decls) {
    try {
      fonts.set(d.id, resolveFromLock(root, d, lock));
    } catch (e) {
      if (isCodeCutError(e)) issues.push({ severity: "error", rule: "font-lock", message: e.message, id: d.id, fix: e.fix });
      else throw e;
    }
  }
  const words = loadVoiceWords(root, node);
  const res = lintTree(
    node,
    {
      config,
      ledger,
      allowSystemFonts: allowSystem,
      missingGlyphs: (id, text) => {
        const f = fonts.get(id);
        return f ? missingGlyphs(root, f, text) : [];
      },
      fileExists: (p) => existsSync(resolve(root, p)),
      safeRect: (preset, comp) => safeRect(preset as "reels", comp),
    },
    {
      fontResolver: (d) => fonts.get(d.id) ?? { id: d.id, family: d.family, files: [], fallback: d.fallback ?? [], source: d.source === "system" ? "system" : "google", variable: false },
      words: (id) => words.get(id),
      mediaDuration: (src) => {
        const p = resolve(root, src);
        return existsSync(p) ? probeMedia(p)?.duration : undefined;
      },
    },
  );
  issues.push(...res.issues);
  const seen = new Set<string>();
  const all = issues.filter((i) => (seen.has(JSON.stringify(i)) ? false : (seen.add(JSON.stringify(i)), true)));
  return { issues: all, errors: all.filter((i) => i.severity === "error").length, warnings: all.filter((i) => i.severity === "warning").length, loaded };
}

export { join };
