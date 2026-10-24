import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { mixAudio } from "../src/index.js";

const EXAMPLE = resolve(dirname(fileURLToPath(import.meta.url)), "../../../examples/flomotion-ad");

const ff = (...a: string[]) =>
  execFileSync("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-nostdin", ...a]);

describe("audio mix", () => {
  it("is byte-identical on every run with voice, music and sound effects (ducking included)", async () => {
    const dir = mkdtempSync(join(tmpdir(), "fm-mix-"));
    // the example ad's own voice and music (speech and a real mix make the compressor work), a synthetic effect
    copyFileSync(join(EXAMPLE, "assets/voice/voice.wav"), join(dir, "voice.wav"));
    copyFileSync(join(EXAMPLE, "sounds/music.wav"), join(dir, "music.wav"));
    ff(
      "-f",
      "lavfi",
      "-i",
      "sine=f=1800:d=0.12",
      "-af",
      "afade=t=out:d=0.12",
      join(dir, "tick.wav"),
    );
    const events = [
      { id: "vo", src: "voice.wav", start: 0, bus: "voice" as const },
      { id: "music", src: "music.wav", start: 0, bus: "music" as const, fadeOut: 1 },
      ...Array.from({ length: 40 }, (_, i) => ({
        id: `s${i}`,
        src: "tick.wav",
        start: 0.5 + i * 0.7,
        bus: "sfx" as const,
        gainDb: -8,
      })),
    ];
    const hashes = new Set<string>();
    for (let i = 0; i < 8; i++) {
      const out = join(dir, `mix-${i}.wav`);
      await mixAudio({
        root: dir,
        events,
        resolveSrc: (s) => join(dir, s),
        ledger: { version: 1, entries: [] },
        duration: 30,
        outFile: out,
      });
      hashes.add(createHash("sha256").update(readFileSync(out)).digest("hex"));
    }
    expect([...hashes]).toHaveLength(1);
  }, 120_000);
});
