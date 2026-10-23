// Assemble the publishable `codecut` package in .publish/ from the bundle, the skill and the docs.
//   node scripts/pack.mjs           build the bundle and assemble .publish/
// Then: (cd .publish && npm pack)  /  (cd .publish && npm publish)
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { bundle } from "./bundle.mjs";

const OUT = ".publish";
const root = JSON.parse(readFileSync("package.json", "utf8"));
const cli = JSON.parse(readFileSync("packages/cli/package.json", "utf8"));
const version = cli.publishVersion ?? "0.2.0";

await bundle();
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
cpSync("packages/cli/dist", `${OUT}/dist`, { recursive: true });
cpSync("skills/motion-studio", `${OUT}/skills/motion-studio`, { recursive: true });
cpSync("packages/cli/PUBLISH_README.md", `${OUT}/README.md`);
cpSync("LICENSE", `${OUT}/LICENSE`);
cpSync("CHANGELOG.md", `${OUT}/CHANGELOG.md`);
for (const f of ["spec.md", "later.md", "hyperframes-notes.md", "gate2-manual-checklist.md"])
  cpSync(`docs/${f}`, `${OUT}/docs/${f}`);
cpSync("docs/components", `${OUT}/docs/components`, { recursive: true });

// versions come from what the workspace is tested with
const v = (name) => {
  const all = { ...root.dependencies, ...root.devDependencies, ...cli.dependencies };
  const x = all[name];
  if (!x || x.startsWith("workspace:") || x === "latest")
    throw new Error(`pin a version for ${name}`);
  return x;
};
const pkg = {
  name: "flomotion",
  version,
  description:
    "A code-first video editor: a video is one TSX file, edited by Claude through MCP and rendered with HyperFrames.",
  type: "module",
  license: "MIT",
  keywords: [
    "video",
    "motion-graphics",
    "mcp",
    "claude",
    "hyperframes",
    "tsx",
    "remotion-alternative",
  ],
  engines: { node: ">=22" },
  bin: { codecut: "./dist/bin.mjs", flomotion: "./dist/bin.mjs" },
  exports: {
    "./components": "./dist/components.mjs",
    "./core": "./dist/core.mjs",
    "./jsx-runtime": "./dist/jsx-runtime.mjs",
    "./jsx-dev-runtime": "./dist/jsx-dev-runtime.mjs",
    "./package.json": "./package.json",
  },
  files: ["dist", "skills", "docs", "README.md", "LICENSE", "CHANGELOG.md"],
  dependencies: {
    "@modelcontextprotocol/sdk": v("@modelcontextprotocol/sdk"),
    esbuild: v("esbuild"),
    fontkit: v("fontkit"),
    gsap: v("gsap"),
    hyperframes: v("hyperframes"),
    "puppeteer-core": v("puppeteer-core"),
    "ts-morph": v("ts-morph"),
    zod: "^4.6.7",
  },
};
writeFileSync(`${OUT}/package.json`, JSON.stringify(pkg, null, 2) + "\n");
console.log(`assembled ${OUT} (flomotion@${version})`);
