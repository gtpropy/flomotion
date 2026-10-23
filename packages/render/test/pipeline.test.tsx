import { describe, expect, it } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PNG } from "pngjs";
import { readFileSync } from "node:fs";
import { Composition, Track, Scene, defineComponent, num, color, resolveProject, compileProject } from "@codecut/core";
import { materialize, renderProjectDir, snapshotFrames } from "../src/index.js";

const Block = defineComponent("PBlock", {
  category: "test",
  controls: { w: num({ default: 60 }), fillColor: color({ default: "#ff0000" }) },
  render: (p, rc) => ({
    html: `<div style="width:${p.w}px;height:${p.w}px;background:${p.fillColor}"></div>`,
    box: { left: "0px", top: "100px", width: `${p.w}px`, height: `${p.w}px` },
  }),
});

const project = (
  <Composition id="pipe" size={[400, 300]} fps={30} duration="2s" background="#000000">
    <Track id="v1">
      <Scene id="s1" start="0s" duration="2s">
        <Block id="b1" position={[[0, [0, 0]], [1, [300, 0]]] as any} />
      </Scene>
    </Track>
  </Composition>
);

function redCenterX(file: string): number {
  const png = PNG.sync.read(readFileSync(file));
  const y = 100 + 30; // vertical middle of the block
  let min = Infinity;
  let max = -Infinity;
  for (let x = 0; x < png.width; x++) {
    const i = (y * png.width + x) * 4;
    if (png.data[i]! > 200 && png.data[i + 1]! < 60) {
      min = Math.min(min, x);
      max = Math.max(max, x);
    }
  }
  return (min + max) / 2;
}

describe("HyperFrames pipeline", () => {
  it("renders baked animation correctly at any seek order, and twice identically", async () => {
    const dir = mkdtempSync(join(tmpdir(), "cc-pipe-"));
    const compiled = compileProject(resolveProject(project));
    materialize(dir, compiled, { id: "pipe" });
    const times = [0, 0.5, 1.0, 0.2, 1.9];
    const snaps = await snapshotFrames(dir, { times, outDir: join(dir, "snaps") });
    expect(snaps.files).toHaveLength(times.length);
    const xs = snaps.files.map(redCenterX);
    // block centre = 30 + 300 * (t / 1s) clamped; linear 0..1s then held
    expect(Math.abs(xs[0]! - 30)).toBeLessThan(1.6);
    expect(Math.abs(xs[1]! - 180)).toBeLessThan(1.6);
    expect(Math.abs(xs[2]! - 330)).toBeLessThan(1.6);
    expect(Math.abs(xs[3]! - 90)).toBeLessThan(1.6);
    expect(Math.abs(xs[4]! - 330)).toBeLessThan(1.6);

    const a = await renderProjectDir(dir, { output: join(dir, "a.mp4"), quality: "draft" });
    const b = await renderProjectDir(dir, { output: join(dir, "b.mp4"), quality: "draft" });
    expect(a.bytes).toBeGreaterThan(1000);
    expect(readFileSync(a.output).equals(readFileSync(b.output))).toBe(true);
  }, 600_000);
});
