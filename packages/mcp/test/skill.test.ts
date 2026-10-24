import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { PNG } from "pngjs";
import { docsMarkdown, getLook, listLooks } from "@flomotion/core";
import { registry } from "@flomotion/components";
import { TOOL_NAMES } from "../src/server.js";
import { CHECKLIST } from "../src/review.js";
import { SOUND_TAGS } from "../src/providers/sounds.js";
import { cleanup, connect, doubles, REPO, tmpProject } from "./harness.js";
// @ts-expect-error plain ESM script without types
import { bundle } from "../../../scripts/bundle.mjs";

const SKILL = join(REPO, "skills", "flomotion-studio");
const read = (p: string) => readFileSync(join(SKILL, p), "utf8");
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) =>
    statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)],
  );
const textFiles = () =>
  walk(SKILL).filter((f) => /\.(md|json)$/.test(f) && !f.includes("components.md"));

describe("skills/flomotion-studio: the package's main director skill", () => {
  const md = read("SKILL.md");
  it("has valid frontmatter that says when to use it", () => {
    const fm = /^---\nname: flomotion-studio\ndescription: (.+)\n---\n/.exec(md);
    expect(fm).toBeTruthy();
    expect(fm![1]!.length).toBeGreaterThan(80);
    expect(fm![1]).toMatch(/promo|explainer|video/i);
    expect(fm![1]).toMatch(/flomotion/);
  });
  it("keeps the user's rules: interview first, gates G0 to G6, honesty about hearing and taste", () => {
    expect(md).toMatch(/Interview first, extensively/);
    for (const g of [
      "G0 Interview",
      "G1 Direction",
      "G2 Script",
      "G3 Style frames",
      "G4 Storyboard",
      "G5 Draft",
      "G6 Final",
    ])
      expect(md, g).toContain(g);
    expect(md).toMatch(/cannot hear or judge taste/i);
    expect(md).toMatch(/Needs your review/);
    expect(md).toMatch(/Never invent the brief/);
    expect(md).toMatch(/voice_quote[\s\S]*confirm:true/);
  });
  it("tells the agent to check the setup first and to use the person's own material", () => {
    expect(md).toMatch(/setup_status/);
    expect(md).toMatch(/flomotion setup/);
    expect(md).toMatch(/never ask for a key in the chat/i);
    const interview = read("references/interview.md");
    expect(interview).toMatch(/Round 0/);
    for (const t of [
      "setup_status",
      "voice_import",
      "transcript_import",
      "sound_import",
      "asset_import",
      "brand_extract",
      "asset_capture",
    ])
      expect(
        interview + read("references/workflow.md") + read("references/assets.md"),
        t,
      ).toContain(t);
    expect(read("references/assets.md")).toMatch(/trademark/);
    expect(read("references/assets.md")).toMatch(/permission/);
    expect(read("references/workflow.md")).toMatch(/asset plan/i);
  });
  it("tells the agent about the live view", () => {
    expect(md).toMatch(/flomotion ui/);
    expect(md).toMatch(/brief\.json/);
  });
  it("every file in the skill parses and the references named in SKILL.md exist", () => {
    for (const f of walk(SKILL).filter((x) => x.endsWith(".json")))
      expect(() => JSON.parse(readFileSync(f, "utf8")), f).not.toThrow();
    for (const m of md.matchAll(/`((?:references|config|dataset|evals|looks)\/[\w./*-]+)`/g)) {
      const rel = m[1]!;
      if (rel.includes("*")) continue;
      expect(
        existsSync(join(SKILL, rel)) || existsSync(join(SKILL, rel.replace(/\/$/, ""))),
        rel,
      ).toBe(true);
    }
  });
  it("names no tool that the server does not have, and mentions every real tool", () => {
    const docs = textFiles()
      .map((f) => readFileSync(f, "utf8"))
      .join("\n");
    for (const gone of ["project_open", "project_info", "font_add", "font_lock"])
      expect(docs, gone).not.toContain(gone);
    const named = new Set([...docs.matchAll(/`([a-z]+_[a-z_]+)`/g)].map((m) => m[1]!));
    const toolLike = [...named]
      .filter((n) => !["font_error", "asset_missing"].includes(n)) // error codes, not tools
      .filter(
        (n) =>
          /^(project|element|effect|keyframe|scene|frame|contact|sound|font|voice|history|mix|setup|asset|transcript|brand)_/.test(
            n,
          ) || n === "align_to_voice",
      );
    for (const n of toolLike) expect(TOOL_NAMES, n).toContain(n);
    const tools = read("references/mcp-tools.md");
    for (const t of TOOL_NAMES) expect(tools, t).toContain(t);
  });
  it("mcp-tools.md lists every error code the server can return", () => {
    const tools = read("references/mcp-tools.md");
    for (const c of [
      "schema_violation",
      "opaque_expression",
      "track_locked",
      "overlap_rejected",
      "duplicate_keyframe",
      "impure_expression",
      "asset_missing",
      "license_blocked",
      "quote_required",
      "missing_dependency",
      "path_outside_project",
      "font_error",
      "render_failed",
    ])
      expect(tools, c).toContain(c);
  });
  it("checks.md maps every skill check id to a computed-by decision and says what is not run", () => {
    const checks = read("references/checks.md");
    const ids = [...checks.matchAll(/^\| `([a-z0-9-]+)` \|/gm)].map((m) => m[1]!);
    for (const id of [
      "motion-frame0",
      "no-dead-frames",
      "novelty-rate",
      "text-overlap",
      "safe-area",
      "contrast",
      "voice-sync",
      "sound-on-impact",
      "loudness",
      "hero-continuity",
      "assets-licensed",
      "credits-present",
      "determinism",
      "palette-adherence",
    ])
      expect(ids, id).toContain(id);
    expect(checks).toMatch(/palette-adherence` \| \*\*not run\*\*/);
    expect(checks).toMatch(/determinism` \| \*\*not run\*\*/);
    // every number it cites for the tool is a real review item
    for (const m of checks.matchAll(/`review` #(\d+)/g))
      expect(Number(m[1])).toBeLessThanOrEqual(CHECKLIST.length);
  });
  it("sound.md uses the real sound tags", () => {
    const sound = read("references/sound.md");
    for (const t of Object.keys(SOUND_TAGS)) expect(sound, t).toContain(t);
  });
  it("components.md is generated from the schemas and is current", () => {
    const defs = registry.list().filter((d) => !/^(Test|CT|PBlock)/.test(d.name));
    expect(read("references/components.md")).toBe(
      `# Components (generated from schemas: do not edit)\n\n${defs.map((d) => docsMarkdown(d)).join("\n---\n\n")}`,
    );
  });
  it("is the only skill in the repo", () => {
    expect(readdirSync(join(REPO, "skills"))).toEqual(["flomotion-studio"]);
  });
});

describe("the three skill looks exist in the engine and match their JSON", () => {
  for (const name of ["clean-light", "dark-product", "bold-kinetic"]) {
    it(name, () => {
      const j = JSON.parse(read(`looks/${name}.json`));
      const look = getLook(name)!;
      expect(look, `engine look ${name}`).toBeTruthy();
      const p = j.palette;
      expect(look.palette.bg).toBe(p.bg);
      expect(look.palette.surface).toBe(p.surface);
      expect(look.palette.text).toBe(p.text);
      expect(look.palette.textMuted).toBe(p.textMuted);
      for (const k of ["accent", "signal", "positive", "negative"])
        expect(look.palette[k], k).toBe(p[k]);
      p.blocks.forEach((c: string, i: number) =>
        expect(look.palette[`block${i + 1}`], `block${i + 1}`).toBe(c),
      );
      expect(look.palette.fg).toBe(p.text);
      expect(look.palette.primary).toBe(p.accent);
      expect(look.fonts.find((f) => f.id === "display")).toMatchObject({
        family: j.type.display.family,
        weights: j.type.display.weights,
      });
      expect(look.fonts.find((f) => f.id === "body")).toMatchObject({
        family: j.type.body.family,
        weights: j.type.body.weights,
      });
      expect(look.fonts.find((f) => f.id === "mono")!.family).toBe(j.type.mono.family);
      expect(look.type.display!.tracking).toBe(Math.round(j.type.display.tracking * 1000));
      expect(look.type.display!.leading).toBe(j.type.display.lineHeight);
      expect(look.easing.in).toBe(j.motion.easing.enter);
      expect(look.easing.out).toBe(j.motion.easing.exit);
      expect(look.easing.move).toBe(j.motion.easing.move);
      expect(look.easing.spring).toBe(
        `spring(${j.motion.easing.spring.stiffness},${j.motion.easing.spring.damping})`,
      );
      expect(look.grain).toBe(j.texture.grain);
      // the skill's minimum sizes for 9:16 hold for the tokens
      expect(look.type.body!.size).toBeGreaterThanOrEqual(44);
      expect(look.type.caption!.size).toBeGreaterThanOrEqual(40);
      expect(look.type.display!.size).toBeGreaterThanOrEqual(72);
    });
  }
  it("the engine's older looks are still there for the examples", () => {
    expect(listLooks().map((l) => l.id)).toEqual([
      "clean-light",
      "dark-product",
      "bold-kinetic",
      "kinetic",
      "minimal",
      "sketch",
    ]);
  });
});

const png = (file: string) => PNG.sync.read(readFileSync(file));

describe("block recipes (references/block-recipes.md) are real, lint clean and render", () => {
  const recipes = [...read("references/block-recipes.md").matchAll(/```tsx\n([\s\S]*?)```/g)].map(
    (m) => m[1]!.trim(),
  );
  it("has the 13 core blocks", () => {
    expect(recipes).toHaveLength(13);
    const names = [...read("references/block-recipes.md").matchAll(/^## (\d+) (.+)$/gm)].map((m) =>
      m[2]!.replace(/ \(.*\)/, ""),
    );
    expect(names).toEqual([
      "Hook",
      "Problem",
      "ProductReveal",
      "UIZoom",
      "FeatureCallout",
      "StatCounter",
      "ChartReveal",
      "Quote",
      "LogoStrip",
      "BeforeAfter",
      "Offer",
      "CtaCard",
      "Bridge",
    ]);
  });
  it("every text element sets its own fill (the default is white, invisible on a light look)", () => {
    for (const r of recipes)
      for (const m of r.matchAll(/<(Title|SplitText|Text|Counter)\b([\s\S]*?)(?:\/>|>)/g))
        expect(m[2], `${m[1]} without fill in: ${m[0].slice(0, 80)}`).toMatch(/\bfill=/);
  });
  for (const look of ["clean-light", "dark-product", "bold-kinetic"]) {
    it(`all 13 lint with zero errors and render in ${look}`, async () => {
      const root = tmpProject(`recipes-${look}`);
      const h = await connect(root, doubles(root).deps);
      try {
        const scenes = recipes.filter((r) => r.startsWith("<Scene"));
        const track = recipes.find((r) => r.startsWith("<Track"))!;
        const used = [
          ...new Set([...recipes.join("\n").matchAll(/<([A-Z]\w+)/g)].map((m) => m[1]!)),
        ];
        const imports = [...new Set([...used, "Composition", "Track", "Scene"])].sort().join(", ");
        writeFileSync(
          join(root, "project.tsx"),
          `import { ${imports} } from "@flomotion/components";\n\nexport default (\n  <Composition id="recipes" size={[1080, 1920]} fps={30} duration="38s" theme="$look.${look}">\n    <Track id="v1" kind="video">\n${scenes.join("\n")}\n    </Track>\n${track}\n  </Composition>\n);\n`,
        );
        writeFileSync(
          join(root, "tsconfig.json"),
          JSON.stringify({
            compilerOptions: {
              target: "ES2023",
              module: "ESNext",
              moduleResolution: "Bundler",
              strict: true,
              jsx: "react-jsx",
              jsxImportSource: "@flomotion/core",
              skipLibCheck: true,
            },
          }),
        );
        mkdirSync(join(root, "assets"), { recursive: true });
        for (const n of [1, 2, 3])
          execFileSync("ffmpeg", [
            "-y",
            "-v",
            "error",
            "-f",
            "lavfi",
            "-i",
            `color=c=0x8899aa:s=240x96`,
            "-frames:v",
            "1",
            join(root, "assets", `logo-${n}.png`),
          ]);
        for (const f of getLook(look)!.fonts) await h.call("font_get", { id: f.id });
        const lint = await h.call("lint");
        const errors = lint.issues.filter((i: any) => i.severity === "error");
        expect(errors, JSON.stringify(errors, null, 1)).toEqual([]);
        // frames in a few scenes are never blank: some pixels differ clearly from the look's background
        const bg = getLook(look)!.palette.bg!;
        const want = [1, 3, 5].map((i) => parseInt(bg.slice(i, i + 2), 16));
        const times = [1.6, 4.5, 8.5, 11.5, 14.5, 17.5, 20.5, 23.5, 26.5, 29, 32.5, 36];
        for (const t of times) {
          const f = await h.call("frame_render", { time: t, scale: 0.5 });
          if (process.env.KEEP_FRAMES) {
            mkdirSync(process.env.KEEP_FRAMES, { recursive: true });
            copyFileSync(join(root, f.path), join(process.env.KEEP_FRAMES, `${look}-${t}.png`));
          }
          const img = png(join(root, f.path));
          let ink = 0;
          for (let i = 0; i < img.data.length; i += 4) {
            const d =
              Math.abs(img.data[i]! - want[0]!) +
              Math.abs(img.data[i + 1]! - want[1]!) +
              Math.abs(img.data[i + 2]! - want[2]!);
            if (d > 90) ink++;
          }
          expect(
            ink / (img.data.length / 4),
            `${look}: frame at ${t}s looks blank`,
          ).toBeGreaterThan(0.004);
          if (t === 1.6) {
            // the hook headline must be readable: strongly different from the background, in the band where it sits
            const y0 = Math.floor(img.height * 0.2);
            const y1 = Math.floor(img.height * 0.6);
            let strong = 0;
            for (let y = y0; y < y1; y++)
              for (let x = 0; x < img.width; x++) {
                const i = (y * img.width + x) * 4;
                const d =
                  Math.abs(img.data[i]! - want[0]!) +
                  Math.abs(img.data[i + 1]! - want[1]!) +
                  Math.abs(img.data[i + 2]! - want[2]!);
                if (d > 380) strong++;
              }
            expect(
              strong / ((y1 - y0) * img.width),
              `${look}: the hook headline is not readable against the background`,
            ).toBeGreaterThan(0.005);
          }
        }
      } finally {
        await h.close();
        cleanup(root);
      }
    }, 400_000);
  }
});

describe("engine look reference scenes (examples/engine-looks)", () => {
  for (const look of ["kinetic", "minimal", "sketch"]) {
    it(`${look}: lints clean and renders`, async () => {
      const root = tmpProject(`engine-${look}`);
      const h = await connect(root, doubles(root).deps);
      try {
        writeFileSync(
          join(root, "project.tsx"),
          readFileSync(join(SKILL, "examples", "engine-looks", `${look}.scene.tsx`), "utf8"),
        );
        writeFileSync(
          join(root, "tsconfig.json"),
          JSON.stringify({
            compilerOptions: {
              target: "ES2023",
              module: "ESNext",
              moduleResolution: "Bundler",
              strict: true,
              jsx: "react-jsx",
              jsxImportSource: "@flomotion/core",
              skipLibCheck: true,
            },
          }),
        );
        for (const f of getLook(look)!.fonts) await h.call("font_get", { id: f.id });
        const lint = await h.call("lint");
        expect(lint.errors).toBe(0);
        const frame = await h.call("frame_render", { time: 1.6, scale: 0.5 });
        expect(statSync(join(root, frame.path)).size).toBeGreaterThan(3000);
      } finally {
        await h.close();
        cleanup(root);
      }
    }, 240_000);
  }
});

describe("flomotion install skill (the bundled CLI)", () => {
  const bin = join(REPO, "packages/cli/dist/bin.mjs");
  const run = (args: string[], home: string, cwd = home) =>
    execFileSync("node", [bin, ...args], {
      encoding: "utf8",
      cwd,
      env: { ...process.env, HOME: home, HYPERFRAMES_NO_TELEMETRY: "1" },
    });
  it("installs for all projects by default, replaces a previous copy, and warns about the old skill", async () => {
    await bundle();
    const home = tmpProject("install-home");
    try {
      mkdirSync(join(home, ".claude", "skills", "motion-studio"), { recursive: true });
      writeFileSync(join(home, ".claude", "skills", "motion-studio", "SKILL.md"), "old");
      const out = run(["install", "skill"], home);
      const dest = join(home, ".claude", "skills", "flomotion-studio");
      expect(out).toContain(`Installed the flomotion-studio skill to ${dest}`);
      expect(out).toContain('older skill "motion-studio"');
      expect(out).toContain("claude mcp add flomotion -- npx -y flomotion mcp --dir . --ui");
      for (const f of [
        "SKILL.md",
        "references/mcp-tools.md",
        "references/block-recipes.md",
        "references/components.md",
        "looks/clean-light.json",
        "looks/dark-product.json",
        "looks/bold-kinetic.json",
        "config/thresholds.json",
        "dataset/schema.json",
        "evals/README.md",
        "examples/saas-promo/project.tsx",
      ])
        expect(existsSync(join(dest, f)), f).toBe(true);
      expect(readFileSync(join(dest, "SKILL.md"), "utf8")).toBe(read("SKILL.md"));
      // reinstall replaces: a stray file from the previous copy is gone
      writeFileSync(join(dest, "stray.md"), "x");
      run(["install", "skill"], home);
      expect(existsSync(join(dest, "stray.md"))).toBe(false);
      expect(existsSync(join(dest, "SKILL.md"))).toBe(true);
    } finally {
      rmSync(home, { recursive: true, force: true });
    }
  }, 180_000);
  it("--project installs into the folder, and the flomotion alias and the 0.2.0 spelling still work", () => {
    const home = tmpProject("install-proj");
    const fakeHome = tmpProject("install-fakehome");
    try {
      run(["install", "skill", "--project", "--dir", home], fakeHome);
      expect(existsSync(join(home, ".claude", "skills", "flomotion-studio", "SKILL.md"))).toBe(
        true,
      );
      expect(existsSync(join(fakeHome, ".claude"))).toBe(false); // nothing leaked into the home folder
      const legacy = tmpProject("install-legacy");
      run(["skill", "install", "--dir", legacy], fakeHome);
      expect(existsSync(join(legacy, ".claude", "skills", "flomotion-studio", "SKILL.md"))).toBe(
        true,
      );
      rmSync(legacy, { recursive: true, force: true });
    } finally {
      rmSync(home, { recursive: true, force: true });
      rmSync(fakeHome, { recursive: true, force: true });
    }
  }, 120_000);
});
