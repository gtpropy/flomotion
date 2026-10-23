// Typecheck every package, then bundle the CLI and libraries to packages/cli/dist.
import { execFileSync } from "node:child_process";
import { bundle, OUT } from "./bundle.mjs";

execFileSync("npx", ["tsc", "-p", "tsconfig.json", "--noEmit"], { stdio: "inherit" });
await bundle({ logLevel: "info" });
console.log(`build ok: ${OUT}/bin.mjs`);
