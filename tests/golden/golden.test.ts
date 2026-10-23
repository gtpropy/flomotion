import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import "@codecut/components";
import { buildLoaded, collectFontDecls, snapshotFrames, syncFonts } from "@codecut/render";
import { CASES } from "./cases.js";
import { contrastScore, dHash, hamming, thumbnail } from "./phash.js";

const here = dirname(fileURLToPath(import.meta.url));
const BASELINES = join(here, "baselines.json");
const FRAMES = join(here, "frames");
const TOLERANCE = 14; // of 256 bits (~5%): absorbs anti-aliasing, catches real regressions
const update = !!process.env.UPDATE_GOLDEN;

const online = await fetch("https://fonts.googleapis.com/css2?family=Inter", { signal: AbortSignal.timeout(8000) }).then((r) => r.ok, () => false);
const baselines: Record<string, string> = existsSync(BASELINES) ? JSON.parse(readFileSync(BASELINES, "utf8")) : {};

// one project root shared by all cases so fonts sync once
const root = join(here, ".root");
mkdirSync(root, { recursive: true });
// a silent voiceover and its (hand-written) word timings, for the captions case
if (!existsSync(join(root, "vo.wav"))) execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "lavfi", "-i", "anullsrc=r=48000:cl=mono", "-t", "3", join(root, "vo.wav")]);
writeFileSync(join(root, "vo.words.json"), JSON.stringify([{ w: "Ship", start: 0.4, end: 0.8 }, { w: "videos", start: 0.9, end: 1.4 }, { w: "as", start: 1.5, end: 1.7 }, { w: "code", start: 1.8, end: 2.4 }, { w: "today", start: 2.5, end: 2.9 }]));

describe("golden frames (perceptual hash, tolerance " + TOLERANCE + "/256 bits)", () => {
  let synced = false;
  for (const c of CASES) {
    it.skipIf(!online && c.fonts)(`${c.name}: ${c.covers.join("; ")}`, async () => {
      if (!synced) {
        const { decls } = collectFontDecls(CASES[0]!.node);
        await syncFonts({ projectRoot: root, decls });
        synced = true;
      }
      const out = await buildLoaded({ root, entry: join(root, "project.tsx"), node: c.node }, { outDir: join(tmpdir(), `cc-golden-${c.name}`), mix: false });
      expect(out.issues.filter((i) => i.severity === "error")).toEqual([]);
      const shots = mkdtempSync(join(tmpdir(), `cc-shots-${c.name}-`));
      const snap = await snapshotFrames(out.dir, { times: c.times, outDir: shots, software: true });
      expect(snap.files).toHaveLength(c.times.length);
      mkdirSync(FRAMES, { recursive: true });
      snap.files.forEach((file, i) => {
        const key = `${c.name}@${c.times[i]}`;
        expect(contrastScore(file), `${key} is blank`).toBeGreaterThan(3);
        const hash = dHash(file);
        if (update || !(key in baselines)) {
          baselines[key] = hash;
          writeFileSync(join(FRAMES, `${c.name}-${c.times[i]}.png`), thumbnail(file));
        } else {
          const d = hamming(hash, baselines[key]!);
          expect(d, `${key}: hash distance ${d} > ${TOLERANCE}`).toBeLessThanOrEqual(TOLERANCE);
        }
      });
      writeFileSync(BASELINES, JSON.stringify(Object.fromEntries(Object.entries(baselines).sort()), null, 2) + "\n");
    }, 300_000);
  }
});
