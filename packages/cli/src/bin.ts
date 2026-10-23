#!/usr/bin/env -S npx tsx
import { runMain } from "citty";
import { main } from "./main.js";

// Project files are TSX. Under `tsx` they already load; in the bundled CLI (plain node) register the loader.
if (!process.execArgv.some((a) => a.includes("tsx")) && !process.env.TSX_TSCONFIG_PATH && !("tsx" in process.versions)) {
  try {
    const { register } = await import("tsx/esm/api");
    register();
  } catch {
    /* tsx missing: loading a project will report a clear error */
  }
}

runMain(main);
