import { describe, expect, it } from "vitest";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import "@codecut/components";
import {
  buildProject,
  collectFontDecls,
  lintProjectDir,
  loadProject,
  readLock,
  renderProjectDir,
  syncFonts,
} from "@codecut/render";

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "..", "..");
const online = await fetch("https://fonts.googleapis.com/css2?family=Inter", {
  signal: AbortSignal.timeout(8000),
}).then(
  (r) => r.ok,
  () => false,
);

/** Copy an example into tests/.tmp so imports of @codecut/* still resolve. */
function stage(name: string, from: string): string {
  const dir = join(repo, "tests", ".tmp", name);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  cpSync(join(repo, "examples", from), dir, {
    recursive: true,
    filter: (s) => !/[\\/](\.codecut|renders)([\\/]|$)/.test(s),
  });
  return dir;
}

describe.skipIf(!online)("text-heavy project: Google + local + variable fonts + Devanagari", () => {
  const dir = stage("typo", "typography");
  it("syncs fonts, lints clean of errors, renders, and the render makes no network requests", async () => {
    const { node, root } = await loadProject(dir);
    const { decls } = collectFontDecls(node);
    await syncFonts({ projectRoot: root, decls });
    const lint = await lintProjectDir(dir);
    expect(lint.issues.filter((i) => i.severity === "error")).toEqual([]);
    const b = await buildProject(dir);
    // the compiled page references no remote URLs at all
    const remote = (b.html.match(/https?:\/\/[^\s"')]+/g) ?? []).filter(
      (u) => !u.startsWith("http://www.w3.org/"),
    );
    expect(remote).toEqual([]);
    const log: string[] = [];
    const r = await renderProjectDir(b.dir, {
      output: join(dir, "renders", "typo.mp4"),
      quality: "draft",
      onLine: (l) => log.push(l),
    });
    expect(r.bytes).toBeGreaterThan(10_000);
    // HyperFrames' own font fetcher never ran and nothing 404'd
    const text = log.join("\n") + r.log;
    expect(text).not.toMatch(/Fetched .* font face/);
    expect(text).not.toMatch(/404 Not Found/);
  }, 600_000);

  it("double render: identical bytes", async () => {
    const b = await buildProject(dir);
    const a1 = await renderProjectDir(b.dir, {
      output: join(dir, "renders", "a.mp4"),
      quality: "draft",
    });
    const a2 = await renderProjectDir(b.dir, {
      output: join(dir, "renders", "b.mp4"),
      quality: "draft",
    });
    const h = (f: string) => createHash("sha256").update(readFileSync(f)).digest("hex");
    expect(h(a1.output)).toBe(h(a2.output));
  }, 900_000);

  it("a missing font file fails the build naming the font id and path", async () => {
    const lock = readLock(dir);
    const victim = join(dir, lock.fonts.display!.files[0]!.path);
    const backup = readFileSync(victim);
    rmSync(victim);
    await expect(buildProject(dir)).rejects.toThrow(/Font "display".*missing/);
    writeFileSync(victim, backup);
  }, 120_000);

  it("a changed font file fails unless the lock is updated", async () => {
    const lock = readLock(dir);
    const victim = join(dir, lock.fonts.body!.files[0]!.path);
    const backup = readFileSync(victim);
    writeFileSync(victim, Buffer.concat([backup, Buffer.from([0])]));
    await expect(buildProject(dir)).rejects.toThrow(/Font "body".*changed on disk/);
    writeFileSync(victim, backup);
    expect(readdirSync(dir)).toContain("project.tsx");
  }, 120_000);

  it("a Devanagari line in a Latin-only font is a lint error that lists the characters", async () => {
    const original = readFileSync(join(dir, "project.tsx"), "utf8");
    const broken = original.replace(/(id="t-deva"[\s\S]*?)font="deva"/, '$1font="display"');
    expect(broken).not.toBe(original);
    writeFileSync(join(dir, "project.tsx"), broken);
    const lint = await lintProjectDir(dir);
    const g = lint.issues.find((i) => i.rule === "missing-glyph");
    expect(g?.severity).toBe("error");
    expect(g?.message).toMatch(/U\+0928/);
    writeFileSync(join(dir, "project.tsx"), original);
  }, 120_000);
});

describe.skipIf(!online)("saas-promo compiles to stable HyperFrames HTML", () => {
  it("matches its snapshot (layer markup and a hash of the baked animation data)", async () => {
    const dir = stage("promo", "saas-promo");
    const { node, root } = await loadProject(dir);
    await syncFonts({ projectRoot: root, decls: collectFontDecls(node).decls });
    const b = await buildProject(dir, { mix: false, skipGate: true });
    const html = b.html;
    const markup = html.match(/<div id="root"[\s\S]*?<\/div>\n<script>/)![0];
    const baked = html.match(/window\.__ccBaked=([\s\S]*?);\n/)![1]!;
    const statics = html.match(/window\.__ccStatic=([\s\S]*?);\nwindow\.__ccBaked/)![1]!;
    const sum = (s: string) => createHash("sha256").update(s).digest("hex").slice(0, 16);
    expect({
      markup,
      bakedHash: sum(baked),
      bakedChannels: JSON.parse(baked).length,
      staticHash: sum(statics),
      bytes: html.length > 100_000,
    }).toMatchSnapshot();
    expect(existsSync(join(b.dir, "index.html"))).toBe(true);
  }, 300_000);
});
