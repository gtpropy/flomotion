import { mkdirSync, writeFileSync, existsSync, copyFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { defineCommand } from "citty";
import { CODECUT_NAME, CodeCutError, isCodeCutError } from "@codecut/core";
import {
  buildProject,
  collectFontDecls,
  loadProject,
  renderProjectDir,
  requireFfmpeg,
  snapshotFrames,
  syncFonts,
  hyperframesVersion,
} from "@codecut/render";
import "@codecut/components";

const fail = (e: unknown): never => {
  if (isCodeCutError(e)) {
    console.error(`\n✖ ${e.code}: ${e.message}`);
    if (e.fix) console.error(`  fix: ${e.fix}`);
    if (process.env.CODECUT_DEBUG && e.details) console.error(JSON.stringify(e.details, null, 2));
  } else console.error(e);
  process.exit(1);
};

const dirArg = { type: "positional", required: false, description: "Project directory", default: "." } as const;

const render = defineCommand({
  meta: { name: "render", description: "Render a project to MP4" },
  args: {
    dir: dirArg,
    output: { type: "string", alias: "o", description: "Output file" },
    draft: { type: "boolean", description: "Fast low-quality draft" },
    software: { type: "boolean", description: "Software GL (SwiftShader) for cross-machine determinism" },
    "no-mix": { type: "boolean", description: "Skip the audio mix" },
  },
  async run({ args }) {
    try {
      requireFfmpeg();
      const dir = resolve(String(args.dir));
      console.log(`${CODECUT_NAME}: building ${dir}`);
      const b = await buildProject(dir, { log: (m) => console.log("  " + m), mix: !args["no-mix"] });
      for (const i of b.issues.filter((x) => x.severity === "warning")) console.log(`  ! ${i.rule}: ${i.message}`);
      const out = resolve(args.output ? String(args.output) : join(dir, "renders", `${b.loaded.node.props.id}.mp4`));
      console.log(`  rendering with HyperFrames ${hyperframesVersion()} → ${out}`);
      const r = await renderProjectDir(b.dir, { output: out, quality: args.draft ? "draft" : "looks", software: !!args.software });
      console.log(`✔ ${r.output} (${(r.bytes / 1024 / 1024).toFixed(2)} MB)`);
    } catch (e) {
      fail(e);
    }
  },
});

const frame = defineCommand({
  meta: { name: "frame", description: "Render one frame to PNG" },
  args: { dir: dirArg, time: { type: "positional", required: true, description: "Time in seconds" }, output: { type: "string", alias: "o" } },
  async run({ args }) {
    try {
      const dir = resolve(String(args.dir));
      const b = await buildProject(dir, { mix: false });
      const outDir = resolve(args.output ? String(args.output) : join(dir, ".codecut", "frames"));
      const s = await snapshotFrames(b.dir, { times: [Number(args.time)], outDir });
      console.log(s.files[0]);
    } catch (e) {
      fail(e);
    }
  },
});

const sheet = defineCommand({
  meta: { name: "sheet", description: "Contact sheet of evenly spaced frames" },
  args: { dir: dirArg, count: { type: "string", default: "12" }, times: { type: "string", description: "Comma separated seconds" } },
  async run({ args }) {
    try {
      const dir = resolve(String(args.dir));
      const b = await buildProject(dir, { mix: false });
      const dur = b.compile.ir.end;
      const times = args.times ? String(args.times).split(",").map(Number) : Array.from({ length: Number(args.count) }, (_, i) => Math.min(dur - 0.05, ((i + 0.5) / Number(args.count)) * dur));
      const outDir = join(dir, ".codecut", "sheet");
      mkdirSync(outDir, { recursive: true });
      const s = await snapshotFrames(b.dir, { times, outDir });
      console.log(s.contactSheet ?? s.files.join("\n"));
    } catch (e) {
      fail(e);
    }
  },
});

const fontsSync = defineCommand({
  meta: { name: "sync", description: "Download missing fonts and write fonts.lock.json and the ledger" },
  args: { dir: dirArg, force: { type: "boolean" }, "update-lock": { type: "boolean" } },
  async run({ args }) {
    try {
      const { root, node } = await loadProject(String(args.dir));
      const { decls, allowSystem } = collectFontDecls(node);
      const r = await syncFonts({ projectRoot: root, decls, allowSystem, force: !!args.force, updateLock: !!args["update-lock"], log: (m) => console.log("  " + m) });
      for (const s of r.synced) console.log(`${s.skipped ? "=" : "↓"} ${s.id} (${s.route}, ${s.files} file${s.files === 1 ? "" : "s"})${s.skipped ? " up to date" : ""}`);
    } catch (e) {
      fail(e);
    }
  },
});
const fonts = defineCommand({ meta: { name: "fonts", description: "Font tools" }, subCommands: { sync: fontsSync } });

const init = defineCommand({
  meta: { name: "init", description: "Scaffold a new project" },
  args: { dir: { type: "positional", required: true }, size: { type: "string", default: "1080x1920" } },
  async run({ args }) {
    const dir = resolve(String(args.dir));
    if (existsSync(join(dir, "project.tsx"))) fail(new CodeCutError("invalid_edit", `${dir}/project.tsx already exists`));
    mkdirSync(join(dir, "assets"), { recursive: true });
    mkdirSync(join(dir, "fonts"), { recursive: true });
    const [w, h] = String(args.size).split("x").map(Number);
    writeFileSync(
      join(dir, "tsconfig.json"),
      JSON.stringify({ compilerOptions: { target: "ES2023", module: "ESNext", moduleResolution: "Bundler", strict: true, jsx: "react-jsx", jsxImportSource: "@codecut/core", skipLibCheck: true } }, null, 2) + "\n",
    );
    writeFileSync(
      join(dir, "project.tsx"),
      `import { Composition, Track, Scene, Title } from "@codecut/components";

export default (
  <Composition id="main" size={[${w}, ${h}]} fps={30} duration="5s" theme="$look.kinetic">
    <Track id="v1" kind="video">
      <Scene id="hello" start="0s" duration="5s">
        <Title id="t1" text="Hello, ${CODECUT_NAME}" at="center" enter={{ from: "s", distance: 120, ease: "expo.out", duration: 0.6 }} />
      </Scene>
    </Track>
  </Composition>
);
`,
    );
    void copyFileSync;
    console.log(`Created ${dir}. Next: codecut fonts sync ${args.dir} && codecut render ${args.dir}`);
  },
});

export const main = defineCommand({
  meta: { name: "codecut", description: `${CODECUT_NAME}: a code-first video editor` },
  subCommands: { render, frame, sheet, fonts, init },
});
