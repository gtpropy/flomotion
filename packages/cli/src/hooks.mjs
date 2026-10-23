// Node module hooks for the published CLI (registered by bin.ts; not used in the repo, where tsx does this).
//
// 1. Project files import "@codecut/components" and the JSX runtime "@codecut/core/jsx-runtime". In a published
//    install those names are not in any node_modules, so map them (and the public "codecut/…" names) to the files
//    of the running install. One copy of each module means one component registry, whatever else is installed.
// 2. TypeScript and TSX files outside node_modules are compiled with esbuild using the JSX runtime of
//    @codecut/core. Nothing depends on the working directory or on a tsconfig.json that may not exist yet.
import { readFileSync, existsSync, statSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { transformSync } from "esbuild";

const here = new URL("./", import.meta.url);
const LIBS = new Map([
  ["@codecut/core", "core.mjs"],
  ["@codecut/components", "components.mjs"],
  ["@codecut/core/jsx-runtime", "jsx-runtime.mjs"],
  ["@codecut/core/jsx-dev-runtime", "jsx-dev-runtime.mjs"],
  ["codecut/core", "core.mjs"],
  ["codecut/components", "components.mjs"],
  ["codecut/jsx-runtime", "jsx-runtime.mjs"],
  ["codecut/jsx-dev-runtime", "jsx-dev-runtime.mjs"],
]);
const TS = /\.(tsx?|jsx|mts)$/;
const isFile = (p) => existsSync(p) && statSync(p).isFile();

export async function resolve(specifier, context, nextResolve) {
  const lib = LIBS.get(specifier);
  if (lib) return { url: new URL(lib, here).href, format: "module", shortCircuit: true };
  // relative imports of project files: "./helpers" -> helpers.ts / helpers.tsx / helpers/index.ts, "./a.js" -> a.ts
  if (/^\.\.?\//.test(specifier) && context.parentURL?.startsWith("file:") && !context.parentURL.includes("/node_modules/")) {
    const base = fileURLToPath(new URL(specifier, context.parentURL));
    const tries = [];
    if (/\.[cm]?js$/.test(base)) tries.push(base.replace(/\.[cm]?js$/, ".ts"), base.replace(/\.[cm]?js$/, ".tsx"));
    if (!/\.\w+$/.test(base)) tries.push(`${base}.tsx`, `${base}.ts`, `${base}/index.tsx`, `${base}/index.ts`);
    const hit = tries.find(isFile);
    if (hit && !isFile(base)) return { url: pathToFileURL(hit).href, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  const path = url.startsWith("file:") ? fileURLToPath(url.split("?")[0]) : "";
  if (path && TS.test(path) && !path.includes("/node_modules/")) {
    const { code } = transformSync(readFileSync(path, "utf8"), {
      loader: path.endsWith("x") ? "tsx" : "ts",
      format: "esm",
      target: "es2023",
      jsx: "automatic",
      jsxImportSource: "@codecut/core",
      sourcefile: path,
      sourcemap: "inline",
    });
    return { format: "module", source: code, shortCircuit: true };
  }
  return nextLoad(url, context);
}
