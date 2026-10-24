import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  FLOMOTION_DIR,
  FlomotionError,
  emptyLedger,
  upsertEntry,
  type FontDecl,
  type Ledger,
  type ResolvedFont,
} from "@flomotion/core";
import { sha256 } from "./inspect.js";
import type { FontFile, FontSyncResult } from "./types.js";

export interface LockedFont {
  family: string;
  source: string;
  declHash: string;
  route: string;
  variable: boolean;
  axes?: Record<string, [number, number]>;
  license: string;
  files: Array<{
    path: string;
    hash: string;
    weight: number | [number, number];
    style: string;
    unicodeRange?: string;
    format: FontFile["format"];
    subset?: string;
  }>;
}

export interface FontLock {
  version: 1;
  fonts: Record<string, LockedFont>;
}

export const lockPath = (root: string) => join(root, FLOMOTION_DIR, "fonts.lock.json");
export const ledgerPath = (root: string) => join(root, FLOMOTION_DIR, "ledger.json");
export const layoutCachePath = (root: string) => join(root, FLOMOTION_DIR, "layout-cache.json");

export function readJson<T>(path: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch {
    return fallback;
  }
}
export function writeJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(value, null, 2) + "\n");
}

export const readLock = (root: string): FontLock =>
  readJson(lockPath(root), { version: 1, fonts: {} });
export const readLedger = (root: string): Ledger => readJson(ledgerPath(root), emptyLedger());

export const declHash = (d: FontDecl) =>
  sha256(
    JSON.stringify({
      f: d.family,
      s: d.source,
      w: d.weights,
      st: d.styles,
      v: d.variable,
      a: d.axes,
      sub: d.subsets,
      ur: d.unicodeRange,
    }),
  );

export function lockEntry(decl: FontDecl, r: FontSyncResult): LockedFont {
  return {
    family: decl.family,
    source: decl.source,
    declHash: declHash(decl),
    route: r.route,
    variable: r.variable,
    axes: r.axes,
    license: r.license.license,
    files: r.files.map((f) => ({
      path: f.rel,
      hash: f.hash,
      weight: f.weight,
      style: f.style,
      unicodeRange: f.unicodeRange,
      format: f.format,
      subset: f.subset,
    })),
  };
}

export function recordLedger(root: string, decl: FontDecl, r: FontSyncResult): void {
  let ledger = readLedger(root);
  for (const f of r.files.length ? r.files : [undefined]) {
    ledger = upsertEntry(ledger, {
      source: r.route === "local" ? "local" : r.route === "url" ? "url" : "google-fonts",
      kind: "font",
      id: f ? `${decl.id}:${f.subset ?? f.style}:${f.hash.slice(0, 8)}` : decl.id,
      family: decl.family,
      file: f?.rel ?? "",
      hash: f?.hash ?? "",
      license: r.license.license,
      url: r.url,
      attributionRequired: r.license.attributionRequired,
      commercialOk: r.license.commercialOk,
      title: decl.family,
    });
  }
  writeJson(ledgerPath(root), ledger);
}

/**
 * Resolve a declared font from the lock with no network. Throws a font_error naming the font id and
 * path when the lock is missing, stale, or a file is missing or changed.
 */
export function resolveFromLock(root: string, decl: FontDecl, lock = readLock(root)): ResolvedFont {
  const system = decl.source === "system";
  const e = lock.fonts[decl.id];
  if (system) {
    return {
      id: decl.id,
      family: decl.family,
      files: [],
      fallback: decl.fallback ?? [],
      source: "system",
      variable: !!decl.variable,
    };
  }
  if (!e) {
    throw new FlomotionError(
      "font_error",
      `Font "${decl.id}" (${decl.family}) is not in .flomotion/fonts.lock.json`,
      { fix: "Run `flomotion fonts sync` to download and lock it." },
    );
  }
  if (e.declHash !== declHash(decl)) {
    throw new FlomotionError("font_error", `Font "${decl.id}" changed since it was locked`, {
      fix: "Run `flomotion fonts sync` to refresh the lock for the new declaration.",
    });
  }
  const files: ResolvedFont["files"] = [];
  for (const f of e.files) {
    const abs = join(root, f.path);
    if (!existsSync(abs)) {
      throw new FlomotionError("font_error", `Font "${decl.id}": file ${f.path} is missing`, {
        fix: "Restore the file or run `flomotion fonts sync`.",
        details: { id: decl.id, path: f.path },
      });
    }
    const hash = sha256(readFileSync(abs));
    if (hash !== f.hash) {
      throw new FlomotionError(
        "font_error",
        `Font "${decl.id}": ${f.path} changed on disk (hash mismatch)`,
        {
          fix: "If the change is intended, run `flomotion fonts sync --update-lock`.",
          details: { id: decl.id, path: f.path, expected: f.hash, actual: hash },
        },
      );
    }
    files.push({
      path: f.path,
      weight: f.weight,
      style: f.style,
      hash: f.hash,
      unicodeRange: f.unicodeRange,
      format: f.format,
    });
  }
  return {
    id: decl.id,
    family: decl.family,
    files,
    fallback: decl.fallback ?? [],
    source: decl.source === "google" ? "google" : /^https?:/.test(decl.source) ? "url" : "local",
    variable: e.variable,
    axes: e.axes,
    license: e.license,
  };
}
