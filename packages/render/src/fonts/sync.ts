import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { CODECUT_DIR, CodeCutError, type FontDecl } from "@codecut/core";
import { FontsourceSource, GoogleCssSource } from "./google.js";
import { declHash, lockEntry, readLock, recordLedger, writeJson, lockPath, readLedger } from "./lock.js";
import { LocalSource, SystemSource, UrlSource } from "./sources.js";
import type { FontContext, FontSource } from "./types.js";

export const defaultSources = (): FontSource[] => [new LocalSource(), new UrlSource(), new SystemSource(), new GoogleCssSource(), new FontsourceSource()];

export interface SyncOptions {
  projectRoot: string;
  decls: FontDecl[];
  fetch?: typeof fetch;
  log?: (m: string) => void;
  /** Re-download even when the lock matches. */
  force?: boolean;
  /** Accept changed hashes of local files into the lock. */
  updateLock?: boolean;
  allowSystem?: boolean;
  sources?: FontSource[];
}

export interface SyncReport {
  synced: Array<{ id: string; route: string; files: number; skipped?: boolean }>;
}

/** `codecut fonts sync`: fetch whatever is missing, write hashes to the lock and licences to the ledger. */
export async function syncFonts(opts: SyncOptions): Promise<SyncReport> {
  const ctx: FontContext = {
    projectRoot: opts.projectRoot,
    cacheDir: join(opts.projectRoot, CODECUT_DIR, "fonts"),
    log: opts.log ?? (() => {}),
    fetch: opts.fetch ?? fetch,
  };
  mkdirSync(ctx.cacheDir, { recursive: true });
  const sources = opts.sources ?? defaultSources();
  const lock = readLock(opts.projectRoot);
  const report: SyncReport = { synced: [] };
  for (const decl of opts.decls) {
    if (decl.source === "system" && !opts.allowSystem) {
      throw new CodeCutError("font_error", `Font "${decl.id}" uses a system font, which renders differently per machine`, { fix: "Add allowSystem to <Fonts> if you really want that." });
    }
    const existing = lock.fonts[decl.id];
    const fresh = existing && existing.declHash === declHash(decl);
    if (fresh && !opts.force && decl.source !== "system") {
      try {
        // verify files are still there and unchanged; otherwise fall through and re-sync
        const { resolveFromLock } = await import("./lock.js");
        resolveFromLock(opts.projectRoot, decl, lock);
        report.synced.push({ id: decl.id, route: existing.route, files: existing.files.length, skipped: true });
        continue;
      } catch (e) {
        if (!opts.updateLock && (e as CodeCutError).message.includes("hash mismatch") && !/^https?:|google/.test(decl.source)) throw e;
      }
    }
    const candidates = sources.filter((s) => s.matches(decl));
    let result;
    let lastErr: unknown;
    for (const src of candidates) {
      try {
        result = await src.sync(decl, ctx);
        break;
      } catch (e) {
        lastErr = e;
        ctx.log(`${src.name} failed for ${decl.id}: ${(e as Error).message}`);
      }
    }
    if (!result) throw lastErr ?? new CodeCutError("font_error", `No font source can provide "${decl.id}" (${decl.source})`);
    lock.fonts[decl.id] = lockEntry(decl, result);
    recordLedger(opts.projectRoot, decl, result);
    report.synced.push({ id: decl.id, route: result.route, files: result.files.length });
  }
  writeJson(lockPath(opts.projectRoot), lock);
  void readLedger;
  return report;
}
