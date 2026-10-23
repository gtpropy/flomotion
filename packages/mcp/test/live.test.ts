/**
 * The real services that need no key, called for real: Iconify and Openverse. Skipped when offline.
 * (Freesound, ElevenLabs, Pexels and Whisper need the person's key or install and are not covered here.)
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { cleanup, connect, tmpProject, type Harness } from "./harness.js";

const online = await fetch("https://api.iconify.design/collections?prefixes=lucide", {
  signal: AbortSignal.timeout(8000),
}).then(
  (r) => r.ok,
  () => false,
);

describe.skipIf(!online)("real Iconify and Openverse (no key)", () => {
  let root: string;
  let h: Harness;
  beforeAll(async () => {
    root = tmpProject("live");
    h = await connect(root, {
      env: { FLOMOTION_CONFIG: join(root, ".none.json") } as NodeJS.ProcessEnv,
    });
    await h.call("project_create", { name: "Live", size: "540x960", duration: 4 });
  });
  afterAll(async () => {
    await h.close();
    cleanup(root);
  });

  it("finds real icons with real licences and downloads one recoloured", async () => {
    const s = await h.call("asset_search", {
      query: "calendar",
      kind: "icon",
      limit: 8,
      source: "iconify",
    });
    expect(s.results.length).toBeGreaterThan(3);
    const lucide = s.results.find((r: any) => r.ref === "iconify:lucide/calendar");
    expect(lucide).toMatchObject({ license: "ISC", allowed: true, format: "svg" });
    for (const r of s.results) expect(r.license).not.toBe("unknown");
    const g = await h.call("asset_get", {
      ref: "iconify:lucide/calendar",
      color: "#4b5cff",
      height: 64,
    });
    const svg = readFileSync(join(root, g.path), "utf8");
    expect(svg).toContain("<svg");
    expect(svg.toLowerCase()).toContain("#4b5cff");
    expect(g.entry).toMatchObject({
      license: "ISC",
      author: "Lucide Contributors",
      commercialOk: true,
    });
  }, 60_000);

  it("a real brand logo set is flagged as trademark and needs permission", async () => {
    const s = await h.call("asset_search", {
      query: "slack",
      kind: "logo",
      limit: 4,
      source: "iconify",
    });
    expect(s.results[0]).toMatchObject({ trademark: true });
    expect(s.results.map((r: any) => r.ref)).toContain("iconify:logos/slack");
    const r = await h.raw("asset_get", { ref: "iconify:logos/slack" });
    expect(r.isError).toBe(true);
    const ok = await h.call("asset_get", { ref: "iconify:logos/slack", permission: true });
    expect(existsSync(join(root, ok.path))).toBe(true);
  }, 60_000);

  it("real Openverse photos: only CC0 and CC-BY come back, with their credit line", async () => {
    const s = await h
      .call("asset_search", {
        query: "office laptop",
        kind: "photo",
        limit: 4,
        source: "openverse",
      })
      .catch((e) => ({ error: e }));
    if ("error" in s) return; // anonymous Openverse allows 20 requests a minute: a busy minute is not a failure of flomotion
    expect(s.results.length).toBeGreaterThan(0);
    for (const r of s.results) {
      expect(["CC0-1.0", "PDM-1.0"].includes(r.license) || r.license.startsWith("CC-BY-")).toBe(
        true,
      );
      expect(r.license).not.toMatch(/SA|NC|ND/);
    }
    const first = s.results[0];
    const g = await h.call("asset_get", { ref: first.ref }).catch((e) => ({ error: e }));
    if ("error" in g) return; // the image host can be down or slow; the search result already proved the API
    const dims = execFileSync(
      "ffprobe",
      ["-v", "error", "-show_entries", "stream=width,height", "-of", "csv=p=0", join(root, g.path)],
      { encoding: "utf8" },
    ).trim();
    expect(dims).toMatch(/^\d+,\d+$/);
    expect(Math.max(...dims.split(",").map(Number))).toBeLessThanOrEqual(2400);
    expect(g.entry.assetKind).toBe("photo");
    if (g.entry.attributionRequired) expect(g.entry.note).toMatch(/CC BY|licensed under|by /i);
  }, 120_000);
});
