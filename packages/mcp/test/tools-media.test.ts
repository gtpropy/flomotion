import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { cleanup, connect, doubles, makeTone, ToolError, tmpProject, type Harness } from "./harness.js";
import type { HfCheck } from "../src/review.js";

let root: string;
let h: Harness;
let hf: HfCheck | undefined;
const src = () => readFileSync(`${root}/project.tsx`, "utf8");
const fails = async (p: Promise<unknown>, code: string) => {
  try {
    await p;
  } catch (e) {
    expect(e).toBeInstanceOf(ToolError);
    expect((e as ToolError).code).toBe(code);
    return e as ToolError;
  }
  throw new Error(`expected ${code} but the call succeeded`);
};
const probe = (f: string) =>
  JSON.parse(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration:stream=codec_name,width,height", "-of", "json", f], { encoding: "utf8" }));

beforeAll(async () => {
  root = tmpProject("media");
  const d = doubles(root, { hfCheck: async () => hf });
  h = await connect(root, d.deps);
  await h.call("project_create", { name: "Media Test", size: "540x960", fps: 30, duration: 4, look: "kinetic" });
  for (const id of ["display", "body", "mono"]) await h.call("font_get", { id });
  await h.call("sound_get", { id: "9001", tag: "hit/land" });
  await h.call("sound_get", { id: "9002", tag: "move/whip" });
  makeTone(join(root, "assets", "voice", "voice.wav"), 4, 200);
  makeTone(join(root, "assets", "music.wav"), 4, 110);
  await h.call("scene_write", {
    id: "main",
    tsx: `<Scene id="main" start="0s" duration="4s" scale={[[0, 1], [4, 1.08]]}>
  <Rect id="bg" width={540} height={960} fill="#1a0b2e" />
  <Title id="t1" text="Ship videos as code" at="center" size={64} maxWidth="86%" enter={{ from: "s", distance: 80, ease: "expo.out", duration: 0.5 }}>
    <Shake id="t1-shake" amp={6} freq={12} start="0.6s" sound="" />
  </Title>
  <Sound id="land" src="freesound:9001" at="0.6s" peak="land" tag="hit/land" />
  <Sound id="whip" src="freesound:9002" at="1.5s" peak="whip" gain={-6} tag="move/whip" />
</Scene>`,
  });
  await h.call("element_add", { parent: "media-test", type: "Audio", props: { id: "music", src: "assets/music.wav", gain: -12, start: "0s", duration: "4s" } });
  await h.call("element_add", { parent: "media-test", type: "Voiceover", props: { id: "vo", src: "assets/voice/voice.wav", gain: -3 } });
}, 120_000);
afterAll(async () => {
  await h.close();
  cleanup(root);
});

describe("frames", () => {
  it("frame_render writes a scaled PNG and attaches it", async () => {
    const r = await h.raw("frame_render", { time: 1 });
    expect(r.isError).toBeFalsy();
    const j = JSON.parse((r.content[0] as any).text);
    expect(j).toMatchObject({ time: 1, scale: 0.5 });
    const file = join(root, j.path);
    expect(existsSync(file)).toBe(true);
    const info = probe(file);
    expect(info.streams[0]).toMatchObject({ width: 270, height: 480 });
    expect(r.content.some((c) => c.type === "image" && (c as any).mimeType === "image/png")).toBe(true);
  }, 120_000);
  it("rejects a time after the end", async () => {
    await fails(h.call("frame_render", { time: 99 }), "invalid_time");
  });
  it("contact_sheet tiles evenly spaced frames", async () => {
    const r = await h.raw("contact_sheet", { count: 4 });
    const j = JSON.parse((r.content[0] as any).text);
    expect(j.times).toHaveLength(4);
    expect(j.frames).toHaveLength(4);
    expect(statSync(join(root, j.path)).size).toBeGreaterThan(2000);
    expect(r.content.some((c) => c.type === "image")).toBe(true);
  }, 120_000);
});

describe("mix_preview", () => {
  it("mixes offline, lands each sound's peak on its frame, and reports loudness", async () => {
    const r = await h.call("mix_preview", {});
    expect(existsSync(join(root, r.path))).toBe(true);
    expect(r.lufs).toBeLessThan(-8);
    expect(r.lufs).toBeGreaterThan(-24);
    expect(r.truePeak).toBeLessThanOrEqual(-0.5);
    const land = r.events.find((e: any) => e.id === "land");
    expect(land.peakLandsAt).toBeCloseTo(0.6, 2);
    expect(land.startsAt).toBeCloseTo(0.3, 1); // starts early by its measured peak offset
    expect(r.events.map((e: any) => e.bus).sort()).toEqual(["music", "sfx", "sfx", "voice"]);
    expect(r.note).toMatch(/not auditioned/i);
  }, 120_000);
  it("trims to a range", async () => {
    const r = await h.call("mix_preview", { range: [0, 1] });
    expect(probe(join(root, r.path)).format.duration).toBeCloseTo(1, 1);
  });
});

describe("render", () => {
  it("renders a draft MP4 and writes a credits file and licence report", async () => {
    const r = await h.call("render", { preset: "draft" });
    const file = join(root, r.file);
    const info = probe(file);
    expect(info.format.duration).toBeCloseTo(4, 0);
    expect(info.streams.map((s: any) => s.codec_name)).toEqual(expect.arrayContaining(["h264", "aac"]));
    expect(info.streams[0]).toMatchObject({ width: 540, height: 960 });
    expect(r.license.attribution).toEqual([expect.stringContaining("by swishy (CC-BY-4.0)")]);
    const credits = readFileSync(join(root, r.license.credits), "utf8");
    expect(credits).toContain("swishy");
    expect(credits).toContain("CC-BY-4.0");
    expect(credits).not.toContain("foleyfan"); // CC0 needs no credit
    const report = JSON.parse(readFileSync(join(root, r.license.report), "utf8"));
    expect(report.used.map((e: any) => e.id)).toEqual(expect.arrayContaining(["9001", "9002"]));
    expect(r.loudness.target).toBe(-14);
  }, 300_000);
  it("blocks the render on lint errors (a sound with no ledger entry)", async () => {
    await h.call("element_add", { parent: "main", type: "Sound", props: { id: "ghost", src: "freesound:424242", at: "2s" } });
    const e = await fails(h.call("render", { preset: "draft" }), "schema_violation");
    expect(e.message).toMatch(/lint error/);
    await h.call("element_remove", { id: "ghost" });
  }, 120_000);
  it("rejects format variants until phase 5", async () => {
    const e = await fails(h.call("render", { preset: "draft", variants: ["16:9"] }), "invalid_edit");
    expect(e.fix).toMatch(/later/);
  });
});

describe("review", () => {
  it("runs lint, mix, contact sheet and all 17 checks", async () => {
    hf = { layout: { findings: [] }, contrast: { findings: [] } };
    const r = await h.raw("review", { sheetCount: 4 });
    expect(r.isError).toBeFalsy();
    const j = JSON.parse((r.content[0] as any).text);
    expect(j.checks.map((c: any) => c.n)).toEqual(Array.from({ length: 17 }, (_, i) => i + 1));
    const by = Object.fromEntries(j.checks.map((c: any) => [c.n, c]));
    expect(by[1].status).toBe("pass"); // enter animation starts at 0
    expect(by[10].status).toBe("skipped"); // Shake has sound "" so no cue
    expect(by[11]).toMatchObject({ status: "pass" });
    expect(by[16].status).toBe("pass");
    expect(by[17]).toMatchObject({ status: "pass", detail: expect.stringContaining("1 credit") });
    expect(j.measured.layoutAndContrast).toBe(true);
    expect(j.next).toMatch(/second pass/);
    expect(r.content.some((c) => c.type === "image")).toBe(true);
  }, 300_000);
  it("uses measured layout findings from the rendered page and fails check 7", async () => {
    hf = { layout: { findings: [{ code: "text_overlap", severity: "error", message: "#t1 overlaps #q", time: 1.2 }] }, contrast: { findings: [{ code: "contrast_aa_failure", severity: "warning", message: "x", ratio: 2.84, text: "Mon", time: 1 }] } };
    const j = await h.call("review", { checklist: [7, 9], sheetCount: 4 });
    expect(j.checks).toHaveLength(2);
    expect(j.checks[0]).toMatchObject({ n: 7, status: "fail" });
    expect(j.checks[0].detail).toContain("overlaps");
    expect(j.checks[1]).toMatchObject({ n: 9, status: "warn" });
    expect(j.pass).toBe(false);
    expect(j.failing).toEqual([7]);
  }, 300_000);
  it("deep:false skips the rendered measurement and says so", async () => {
    const j = await h.call("review", { checklist: [7], deep: false, sheetCount: 4 });
    expect(j.measured.layoutAndContrast).toBe(false);
    expect(j.checks[0].status).toBe("manual");
  }, 300_000);
});

void src;
