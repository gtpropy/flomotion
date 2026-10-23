import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { PNG } from "pngjs";
import { docsMarkdown, listLooks } from "@codecut/core";
import { registry } from "@codecut/components";
import { TOOL_NAMES } from "../src/server.js";
import { CHECKLIST } from "../src/review.js";
import { SOUND_TAGS } from "../src/providers/sounds.js";
import { cleanup, connect, doubles, REPO, tmpProject } from "./harness.js";
// @ts-expect-error plain ESM script without types
import { bundle } from "../../../scripts/bundle.mjs";

const SKILL = join(REPO, "skills", "motion-studio");
const read = (p: string) => readFileSync(join(SKILL, p), "utf8");

describe("skills/motion-studio files", () => {
  const md = read("SKILL.md");
  it("has valid frontmatter that says when to use it", () => {
    const fm = /^---\nname: motion-studio\ndescription: (.+)\n---\n/.exec(md);
    expect(fm).toBeTruthy();
    expect(fm![1]!.length).toBeGreaterThan(80);
    expect(fm![1]).toMatch(/promo|explainer|video/i);
  });
  it("has all reference files from the brief", () => {
    for (const f of ["components", "motion", "sound", "typography", "saas-promo", "review"])
      expect(existsSync(join(SKILL, "references", `${f}.md`)), f).toBe(true);
    expect(existsSync(join(SKILL, "examples", "saas-promo", "project.tsx"))).toBe(true);
  });
  it("makes the agent stop at each approval gate and never fill the brief in", () => {
    for (const gate of [
      "### 1. Intake (OK)",
      "### 2. Script (OK)",
      "### 3. Look and style frames (OK)",
      "### 5. Storyboard (OK)",
      "### 9. Draft, then final (OK)",
    ])
      expect(md, gate).toContain(gate);
    expect(md).toMatch(/Stop at every gate/i);
    expect(md).toMatch(/Use only the user's own answers/i);
    expect(md).toMatch(/three hook options/i);
    expect(md).toMatch(/at most \*\*3 rounds\*\*/);
    expect(md).toMatch(/second pass/i);
  });
  it("states the honesty rules: cannot hear, cannot judge taste, quote then confirm", () => {
    expect(md).toMatch(/cannot hear/i);
    expect(md).toMatch(/taste/i);
    expect(md).toMatch(/voice_quote[\s\S]*confirm:true/);
    expect(md).toMatch(/Never confirm on your own/i);
  });
  it("the workflow order is intake, script, look, voice, storyboard, build, sound, review, draft/final", () => {
    const heads = [...md.matchAll(/^### (\d)\. (.+)$/gm)].map(
      (m) => `${m[1]} ${m[2]!.replace(/ \(OK\)/, "")}`,
    );
    expect(heads).toEqual([
      "1 Intake",
      "2 Script",
      "3 Look and style frames",
      "4 Voice",
      "5 Storyboard",
      "6 Build",
      "7 Sound",
      "8 Review",
      "9 Draft, then final",
    ]);
  });
  it("mentions every MCP tool by name", () => {
    for (const t of TOOL_NAMES) expect(md, t).toContain(t);
  });
  it("components.md is generated from the schemas and is current", () => {
    const defs = registry.list().filter((d) => !/^(Test|CT|PBlock)/.test(d.name));
    expect(read("references/components.md")).toBe(
      `# Components (generated from schemas: do not edit)\n\n${defs.map((d) => docsMarkdown(d)).join("\n---\n\n")}`,
    );
  });
  it("looks/*.json are the Looks as data and stay current", () => {
    for (const l of listLooks())
      expect(JSON.parse(read(`looks/${l.id}.json`))).toEqual(JSON.parse(JSON.stringify(l)));
    expect(listLooks().map((l) => l.id)).toEqual(["kinetic", "minimal", "sketch"]);
  });
  it("review.md covers all 17 checks and sound.md all tags", () => {
    const review = read("references/review.md");
    for (const c of CHECKLIST)
      expect(review, c.title).toContain(c.title.replace(/ \(line length, reading speed\)$/, ""));
    const sound = read("references/sound.md");
    for (const t of Object.keys(SOUND_TAGS)) expect(sound, t).toContain(`\`${t}\``);
  });
  it("every tool named in the references exists", () => {
    const all = [
      "SKILL.md",
      ...readdirSync(join(SKILL, "references")).map((f) => `references/${f}`),
    ]
      .map(read)
      .join("\n");
    const named = new Set([...all.matchAll(/`([a-z]+_[a-z_]+)`/g)].map((m) => m[1]!));
    const toolLike = [...named].filter(
      (n) =>
        /^(project|element|effect|keyframe|scene|frame|contact|sound|font|voice|history|mix)_/.test(
          n,
        ) || ["align_to_voice", "sound_auto"].includes(n),
    );
    for (const n of toolLike) expect(TOOL_NAMES, n).toContain(n);
  });
});

const png = (file: string) => PNG.sync.read(readFileSync(file));

describe("one hand-finished reference scene per Look", () => {
  for (const look of listLooks()) {
    it(`${look.id}: lints clean, renders, and uses the Look's background`, async () => {
      const root = tmpProject(`look-${look.id}`);
      const h = await connect(root, doubles(root).deps);
      try {
        copyFileSync(join(SKILL, "looks", `${look.id}.scene.tsx`), join(root, "project.tsx"));
        writeTsconfig(root);
        for (const f of look.fonts) await h.call("font_get", { id: f.id });
        const lint = await h.call("lint");
        expect(
          lint.errors,
          JSON.stringify(lint.issues.filter((i: any) => i.severity === "error")),
        ).toBe(0);
        const frame = await h.call("frame_render", { time: 1.6, scale: 0.5 });
        const img = png(join(root, frame.path));
        const px = (x: number, y: number) =>
          [0, 1, 2].map((c) => img.data[(y * img.width + x) * 4 + c]!);
        const bg = look.palette.bg!;
        const want = [1, 3, 5].map((i) => parseInt(bg.slice(i, i + 2), 16));
        const got = px(img.width - 8, img.height - 8);
        expect(
          Math.abs(got[0]! - want[0]!) +
            Math.abs(got[1]! - want[1]!) +
            Math.abs(got[2]! - want[2]!),
          `bottom corner ${got} vs ${want}`,
        ).toBeLessThan(90);
        // not a blank frame: lots of distinct colours
        const seen = new Set<number>();
        for (let i = 0; i < img.data.length; i += 4 * 97)
          seen.add(
            (img.data[i]! >> 4) * 256 + (img.data[i + 1]! >> 4) * 16 + (img.data[i + 2]! >> 4),
          );
        expect(seen.size).toBeGreaterThan(8);
        const tree = await h.call("project_read", { depth: 2 });
        expect(tree.outline.props.theme).toBe(`$look.${look.id}`);
        expect(tree.outline.children[0].children).toHaveLength(2);
      } finally {
        await h.close();
        cleanup(root);
      }
    }, 240_000);
  }
});

function writeTsconfig(root: string) {
  // the scene files are written without a scaffold, so give them the same tsconfig project_create writes
  const dir = tmpProject("tsc-probe");
  cleanup(dir);
  mkdirSync(root, { recursive: true });
  const f = join(root, "tsconfig.json");
  if (!existsSync(f))
    execFileSync("node", [
      "-e",
      `require('fs').writeFileSync(${JSON.stringify(f)}, JSON.stringify({compilerOptions:{target:"ES2023",module:"ESNext",moduleResolution:"Bundler",strict:true,jsx:"react-jsx",jsxImportSource:"@codecut/core",skipLibCheck:true}}))`,
    ]);
}

describe("codecut skill install (the bundled CLI)", () => {
  it("copies the skill into .claude/skills", async () => {
    await bundle();
    const dir = tmpProject("skill-install");
    try {
      const out = execFileSync(
        "node",
        [join(REPO, "packages/cli/dist/bin.mjs"), "skill", "install", "--dir", dir],
        { encoding: "utf8" },
      );
      expect(out).toContain("Installed the motion-studio skill");
      for (const f of [
        "SKILL.md",
        "references/motion.md",
        "looks/kinetic.json",
        "looks/sketch.scene.tsx",
      ])
        expect(existsSync(join(dir, ".claude", "skills", "motion-studio", f)), f).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 120_000);
});
