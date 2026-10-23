// Typecheck every package, then bundle the CLI to packages/cli/dist/codecut.mjs.
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { build } from "esbuild";

execFileSync("npx", ["tsc", "-p", "tsconfig.json", "--noEmit"], { stdio: "inherit" });
mkdirSync("packages/cli/dist", { recursive: true });
await build({
  entryPoints: ["packages/cli/src/bin.ts"],
  outfile: "packages/cli/dist/codecut.mjs",
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
  banner: {
    js: "import { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url);",
  },
  external: [
    "puppeteer-core",
    "fontkit",
    "hyperframes",
    "gsap",
    "tsx",
    "ts-morph",
    "@modelcontextprotocol/sdk",
    "typescript",
  ],
  logLevel: "info",
});
console.log("build ok: packages/cli/dist/codecut.mjs");
