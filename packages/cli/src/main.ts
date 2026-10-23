import { cpSync, mkdirSync, rmSync, writeFileSync, existsSync, copyFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { homedir } from "node:os";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { join, resolve } from "node:path";
import { defineCommand } from "citty";
import { CODECUT_NAME, CodeCutError, isCodeCutError, listLooks } from "@codecut/core";
import {
  buildProject,
  collectFontDecls,
  loadProject,
  renderProjectDir,
  requireFfmpeg,
  snapshotFrames,
  syncFonts,
  hyperframesVersion,
  lintProjectDir,
  licenseReport,
  readLedger,
} from "@codecut/render";
import { registry, docsMarkdown, docsIndexMarkdown } from "@codecut/components";
import { serveStdio, startUi } from "@codecut/mcp";

const fail = (e: unknown): never => {
  if (isCodeCutError(e)) {
    console.error(`\n✖ ${e.code}: ${e.message}`);
    if (e.fix) console.error(`  fix: ${e.fix}`);
    if (process.env.CODECUT_DEBUG && e.details) console.error(JSON.stringify(e.details, null, 2));
  } else console.error(e);
  process.exit(1);
};

const dirArg = {
  type: "positional",
  required: false,
  description: "Project directory",
  default: ".",
} as const;

const render = defineCommand({
  meta: { name: "render", description: "Render a project to MP4" },
  args: {
    dir: dirArg,
    output: { type: "string", alias: "o", description: "Output file" },
    draft: { type: "boolean", description: "Fast low-quality draft" },
    software: {
      type: "boolean",
      description: "Software GL (SwiftShader) for cross-machine determinism",
    },
    "no-mix": { type: "boolean", description: "Skip the audio mix" },
  },
  async run({ args }) {
    try {
      requireFfmpeg();
      const dir = resolve(String(args.dir));
      console.log(`${CODECUT_NAME}: building ${dir}`);
      const b = await buildProject(dir, {
        log: (m) => console.log("  " + m),
        mix: !args["no-mix"],
      });
      for (const i of b.issues.filter((x) => x.severity === "warning"))
        console.log(`  ! ${i.rule}: ${i.message}`);
      const out = resolve(
        args.output ? String(args.output) : join(dir, "renders", `${b.loaded.node.props.id}.mp4`),
      );
      console.log(`  rendering with HyperFrames ${hyperframesVersion()} → ${out}`);
      const r = await renderProjectDir(b.dir, {
        output: out,
        quality: args.draft ? "draft" : "looks",
        software: !!args.software,
      });
      const lic = licenseReport(
        readLedger(dir),
        b.audio,
        b.fontsUsed,
        b.fonts.map((f) => f.family),
      );
      const stem = r.output.replace(/\.mp4$/, "");
      writeFileSync(
        `${stem}.licenses.json`,
        JSON.stringify({ used: lic.used, problems: lic.problems }, null, 2) + "\n",
      );
      if (lic.credits) writeFileSync(`${stem}.credits.txt`, lic.credits);
      for (const p of lic.problems) console.log(`  ! licence: ${p}`);
      console.log(`✔ ${r.output} (${(r.bytes / 1024 / 1024).toFixed(2)} MB)`);
      if (lic.credits) console.log(`  credits: ${stem}.credits.txt`);
    } catch (e) {
      fail(e);
    }
  },
});

const frame = defineCommand({
  meta: { name: "frame", description: "Render one frame to PNG" },
  args: {
    dir: dirArg,
    time: { type: "positional", required: true, description: "Time in seconds" },
    output: { type: "string", alias: "o" },
  },
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
  args: {
    dir: dirArg,
    count: { type: "string", default: "12" },
    times: { type: "string", description: "Comma separated seconds" },
  },
  async run({ args }) {
    try {
      const dir = resolve(String(args.dir));
      const b = await buildProject(dir, { mix: false });
      const dur = b.compile.ir.end;
      const times = args.times
        ? String(args.times).split(",").map(Number)
        : Array.from({ length: Number(args.count) }, (_, i) =>
            Math.min(dur - 0.05, ((i + 0.5) / Number(args.count)) * dur),
          );
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
  meta: {
    name: "sync",
    description: "Download missing fonts and write fonts.lock.json and the ledger",
  },
  args: { dir: dirArg, force: { type: "boolean" }, "update-lock": { type: "boolean" } },
  async run({ args }) {
    try {
      const { root, node } = await loadProject(String(args.dir));
      const { decls, allowSystem } = collectFontDecls(node);
      const r = await syncFonts({
        projectRoot: root,
        decls,
        allowSystem,
        force: !!args.force,
        updateLock: !!args["update-lock"],
        log: (m) => console.log("  " + m),
      });
      for (const s of r.synced)
        console.log(
          `${s.skipped ? "=" : "↓"} ${s.id} (${s.route}, ${s.files} file${s.files === 1 ? "" : "s"})${s.skipped ? " up to date" : ""}`,
        );
    } catch (e) {
      fail(e);
    }
  },
});
const lint = defineCommand({
  meta: {
    name: "lint",
    description: "Lint a project (schema, determinism, fonts, ledger, text rules)",
  },
  args: { dir: dirArg, json: { type: "boolean" } },
  async run({ args }) {
    try {
      const r = await lintProjectDir(String(args.dir));
      if (args.json) console.log(JSON.stringify(r.issues, null, 2));
      else {
        for (const i of r.issues)
          console.log(
            `${i.severity === "error" ? "✖" : i.severity === "warning" ? "!" : "·"} [${i.rule}] ${i.message}${i.fix ? `\n    fix: ${i.fix}` : ""}`,
          );
        console.log(`${r.errors} error(s), ${r.warnings} warning(s)`);
      }
      if (r.errors) process.exit(1);
    } catch (e) {
      fail(e);
    }
  },
});

const docs = defineCommand({
  meta: {
    name: "docs",
    description: "Generate reference docs for every component and effect from their schemas",
  },
  args: {
    out: { type: "string", default: "docs/components" },
    "skill-ref": {
      type: "string",
      description: "Also write one combined components.md for the skill",
    },
    "looks-dir": {
      type: "string",
      description: "Also write one <look>.json per Look (data, for the skill)",
    },
  },
  async run({ args }) {
    const out = resolve(String(args.out));
    mkdirSync(out, { recursive: true });
    const defs = registry.list().filter((d) => !/^(Test|CT|PBlock)/.test(d.name));
    for (const d of defs) writeFileSync(join(out, `${d.name}.md`), docsMarkdown(d));
    writeFileSync(join(out, "README.md"), docsIndexMarkdown(registry));
    if (args["skill-ref"]) {
      const f = resolve(String(args["skill-ref"]));
      mkdirSync(join(f, ".."), { recursive: true });
      writeFileSync(
        f,
        `# Components (generated from schemas: do not edit)\n\n${defs.map((d) => docsMarkdown(d)).join("\n---\n\n")}`,
      );
    }
    if (args["looks-dir"]) {
      const dir = resolve(String(args["looks-dir"]));
      mkdirSync(dir, { recursive: true });
      for (const l of listLooks())
        writeFileSync(join(dir, `${l.id}.json`), JSON.stringify(l, null, 2) + "\n");
    }
    console.log(`wrote ${defs.length} pages to ${out}`);
  },
});

const fonts = defineCommand({
  meta: { name: "fonts", description: "Font tools" },
  subCommands: { sync: fontsSync },
});

const init = defineCommand({
  meta: { name: "init", description: "Scaffold a new project" },
  args: {
    dir: { type: "positional", required: true },
    size: { type: "string", default: "1080x1920" },
  },
  async run({ args }) {
    const dir = resolve(String(args.dir));
    if (existsSync(join(dir, "project.tsx")))
      fail(new CodeCutError("invalid_edit", `${dir}/project.tsx already exists`));
    mkdirSync(join(dir, "assets"), { recursive: true });
    mkdirSync(join(dir, "fonts"), { recursive: true });
    const [w, h] = String(args.size).split("x").map(Number);
    writeFileSync(
      join(dir, "tsconfig.json"),
      JSON.stringify(
        {
          compilerOptions: {
            target: "ES2023",
            module: "ESNext",
            moduleResolution: "Bundler",
            strict: true,
            jsx: "react-jsx",
            jsxImportSource: "@codecut/core",
            skipLibCheck: true,
          },
        },
        null,
        2,
      ) + "\n",
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
    console.log(
      `Created ${dir}. Next: codecut fonts sync ${args.dir} && codecut render ${args.dir}`,
    );
  },
});

const mcp = defineCommand({
  meta: {
    name: "mcp",
    description: "Run the MCP server over stdio for a project folder (add it to Claude Code)",
  },
  args: {
    dir: { type: "string", default: ".", description: "Project folder (default: cwd)" },
    ui: {
      type: "boolean",
      description: "Also serve the live view and print its address to stderr",
    },
    port: { type: "string", description: "Live view port (default 4317)" },
  },
  async run({ args }) {
    try {
      // stdout belongs to the protocol: nothing else may print there
      await serveStdio(
        resolve(String(args.dir)),
        {},
        { ui: args.ui ? { port: args.port ? Number(args.port) : undefined } : false },
      );
    } catch (e) {
      fail(e);
    }
  },
});

const ui = defineCommand({
  meta: {
    name: "ui",
    description: "Open the live view: watch what Claude is doing to the project, in a browser",
  },
  args: {
    dir: { type: "string", default: ".", description: "Project folder (default: cwd)" },
    port: { type: "string", description: "Port (default 4317; the next free one is used)" },
    open: { type: "boolean", description: "Open the browser" },
  },
  async run({ args }) {
    try {
      const server = await startUi(resolve(String(args.dir)), {
        port: args.port ? Number(args.port) : undefined,
        strictPort: !!args.port,
      });
      console.log(`flomotion live view for ${resolve(String(args.dir))}`);
      console.log(`  ${server.url}`);
      console.log("Leave this running; the page updates as Claude works. Ctrl+C to stop.");
      if (args.open) {
        const cmd =
          process.platform === "darwin"
            ? "open"
            : process.platform === "win32"
              ? "cmd"
              : "xdg-open";
        spawn(cmd, process.platform === "win32" ? ["/c", "start", server.url] : [server.url], {
          stdio: "ignore",
          detached: true,
        }).unref();
      }
      await new Promise<void>((done) => {
        process.once("SIGINT", () => void server.close().then(done));
        process.once("SIGTERM", () => void server.close().then(done));
      });
    } catch (e) {
      fail(e);
    }
  },
});

/** The skill that ships with this install: next to the package (published) or in the repo (dev). */
export const SKILL_NAME = "flomotion-studio";
function skillSource(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  for (const rel of [
    `../skills/${SKILL_NAME}`,
    `../../../skills/${SKILL_NAME}`,
    `../../skills/${SKILL_NAME}`,
  ]) {
    const p = resolve(here, rel);
    if (existsSync(join(p, "SKILL.md"))) return p;
  }
  throw new CodeCutError(
    "asset_missing",
    "The flomotion-studio skill files were not found next to this install",
  );
}

/** Copy the skill into a Claude Code skills folder and say what to do next. */
function installSkill(args: { project?: boolean; dir?: string }) {
  const base = args.project
    ? join(resolve(String(args.dir ?? ".")), ".claude", "skills")
    : join(process.env.HOME ?? homedir(), ".claude", "skills");
  const dest = join(base, SKILL_NAME);
  mkdirSync(base, { recursive: true });
  rmSync(dest, { recursive: true, force: true }); // a reinstall replaces the old copy, never merges into it
  cpSync(skillSource(), dest, { recursive: true });
  console.log(`✔ Installed the ${SKILL_NAME} skill to ${dest}`);
  const old = join(base, "motion-studio");
  if (existsSync(old))
    console.log(
      `  ! An older skill "motion-studio" is also installed (${old}). ${SKILL_NAME} replaces it: remove it with  rm -rf "${old}"`,
    );
  console.log("");
  console.log("Next, in your video folder:");
  console.log("  claude mcp add flomotion -- npx -y flomotion mcp --dir . --ui");
  console.log("  claude");
  console.log(
    'Then ask for a video. Open the live view address the server prints (or run "flomotion ui") to watch it being made.',
  );
}

const skillArgs = {
  project: {
    type: "boolean",
    description: "Install for this folder only (./.claude/skills) instead of for all projects",
  },
  dir: { type: "string", default: ".", description: "Project folder for --project" },
} as const;

const installSkillCmd = defineCommand({
  meta: {
    name: "skill",
    description: "Install the flomotion-studio skill for Claude Code (all projects, or --project)",
  },
  args: skillArgs,
  run({ args }) {
    try {
      installSkill(args);
    } catch (e) {
      fail(e);
    }
  },
});

const install = defineCommand({
  meta: { name: "install", description: "Install parts of flomotion into Claude Code" },
  subCommands: { skill: installSkillCmd },
});

/** Older spelling from 0.2.0: `codecut skill install` (project-level by default, as before). */
const skillInstallLegacy = defineCommand({
  meta: { name: "install", description: "Same as `install skill` (kept from 0.2.0)" },
  args: { ...skillArgs, global: { type: "boolean", description: "Install for all projects" } },
  run({ args }) {
    try {
      installSkill({ project: !args.global, dir: args.dir });
    } catch (e) {
      fail(e);
    }
  },
});
const skill = defineCommand({
  meta: { name: "skill", description: "Skill commands (see `install skill`)" },
  subCommands: { install: skillInstallLegacy },
});

export const main = defineCommand({
  meta: { name: "codecut", description: `${CODECUT_NAME}: a code-first video editor` },
  subCommands: { render, frame, sheet, fonts, init, lint, docs, mcp, ui, install, skill },
});
