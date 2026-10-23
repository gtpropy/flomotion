// Bundle the CLI and the libraries that project files import into packages/cli/dist.
// Several entry points with code splitting: one copy of core and components is shared, so the component
// registry the CLI uses is the same one a project's `import … from "@codecut/components"` gets.
import { chmodSync, copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { build } from "esbuild";

export const OUT = "packages/cli/dist";
export const EXTERNAL = [
  "puppeteer-core",
  "fontkit",
  "hyperframes",
  "gsap",
  "tsx",
  "ts-morph",
  "@modelcontextprotocol/sdk",
  "typescript",
  "esbuild",
];

export async function bundle({ outdir = OUT, logLevel = "warning" } = {}) {
  rmSync(outdir, { recursive: true, force: true });
  mkdirSync(outdir, { recursive: true });
  await build({
    entryPoints: {
      bin: "packages/cli/src/bin.ts",
      core: "packages/core/src/index.ts",
      components: "packages/components/src/index.ts",
      "jsx-runtime": "packages/core/src/jsx/jsx-runtime.ts",
      "jsx-dev-runtime": "packages/core/src/jsx/jsx-dev-runtime.ts",
    },
    outdir,
    outExtension: { ".js": ".mjs" },
    chunkNames: "chunks/[name]-[hash]",
    splitting: true,
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node22",
    banner: {
      js: "import { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url);",
    },
    external: EXTERNAL,
    logLevel,
  });
  copyFileSync("packages/cli/src/hooks.mjs", `${outdir}/hooks.mjs`);
  // the source's shebang runs tsx for development; the bundle is plain node
  const bin = `${outdir}/bin.mjs`;
  writeFileSync(bin, readFileSync(bin, "utf8").replace(/^#!.*\n/, "#!/usr/bin/env node\n"));
  chmodSync(bin, 0o755);
  return outdir;
}
