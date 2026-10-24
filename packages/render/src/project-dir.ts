import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { FlomotionError, FLOMOTION_DIR } from "@flomotion/core";
import type { CompileResult } from "@flomotion/core";
import { gsapFile } from "./env.js";

export interface Materialized {
  dir: string;
  indexPath: string;
}

/** Reject any path that escapes `root`. */
export function insideRoot(root: string, p: string): string {
  const abs = resolve(root, p);
  const rel = relative(resolve(root), abs);
  if (rel === ".." || rel.startsWith(".." + sep) || resolve(rel) === rel) {
    throw new FlomotionError("path_outside_project", `Path ${p} is outside the project folder`, {
      fix: "Use paths inside the project directory.",
    });
  }
  return abs;
}

export function ensureDir(p: string): string {
  mkdirSync(p, { recursive: true });
  return p;
}

export function buildDir(projectRoot: string, name = "build"): string {
  return ensureDir(join(projectRoot, FLOMOTION_DIR, name));
}

/**
 * Write a compiled project as a HyperFrames project directory: index.html, vendored GSAP,
 * hyperframes.json, meta.json, and any extra files (assets, fonts, mix).
 */
export function materialize(
  outDir: string,
  compiled: Pick<CompileResult, "html">,
  opts: { id: string; extraFiles?: Array<{ from: string; to: string }> } = { id: "flomotion" },
): Materialized {
  ensureDir(outDir);
  ensureDir(join(outDir, "vendor"));
  copyFileSync(gsapFile(), join(outDir, "vendor", "gsap.min.js"));
  writeFileSync(join(outDir, "index.html"), compiled.html);
  writeFileSync(
    join(outDir, "hyperframes.json"),
    JSON.stringify(
      {
        $schema: "https://hyperframes.heygen.com/schema/hyperframes.json",
        paths: { blocks: "compositions", components: "compositions/components", assets: "assets" },
        media: { autoProxy: false },
      },
      null,
      2,
    ),
  );
  writeFileSync(join(outDir, "meta.json"), JSON.stringify({ id: opts.id, name: opts.id }, null, 2));
  for (const f of opts.extraFiles ?? []) {
    if (!existsSync(f.from)) continue;
    const dest = join(outDir, f.to);
    ensureDir(dirname(dest));
    copyFileSync(f.from, dest);
  }
  return { dir: outDir, indexPath: join(outDir, "index.html") };
}

export const readText = (p: string) => readFileSync(p, "utf8");
