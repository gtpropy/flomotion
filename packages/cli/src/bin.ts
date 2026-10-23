#!/usr/bin/env -S npx tsx
import { existsSync } from "node:fs";
import { register as registerHooks } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runMain } from "citty";
import { main } from "./main.js";

const here = dirname(fileURLToPath(import.meta.url));

if (existsSync(join(here, "hooks.mjs")) && existsSync(join(here, "components.mjs"))) {
  // Bundled/published install: project files (TSX) and "@codecut/*" imports are handled by our own hooks.
  registerHooks(join(here, "hooks.mjs"), import.meta.url);
} else if (
  !process.execArgv.some((a) => a.includes("tsx")) &&
  !process.env.TSX_TSCONFIG_PATH &&
  !("tsx" in process.versions)
) {
  // Running from the repo's sources outside tsx: register the loader so project TSX can be imported.
  try {
    const { register } = await import("tsx/esm/api");
    register();
  } catch {
    /* tsx missing: loading a project will report a clear error */
  }
}

runMain(main);
