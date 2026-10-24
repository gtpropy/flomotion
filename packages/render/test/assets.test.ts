import { describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { makeAssetResolver, peakOffsetOf } from "../src/index.js";

describe("asset resolver", () => {
  it("finds a local sound in sounds/ when its cache copy is not there (a fresh checkout)", () => {
    const root = mkdtempSync(join(tmpdir(), "fm-assets-"));
    mkdirSync(join(root, "sounds"));
    writeFileSync(join(root, "sounds", "tick.wav"), "x");
    const ledger = {
      version: 1,
      entries: [
        { source: "local", kind: "sound", id: "tick", file: ".flomotion/assets/local/tick.wav" },
      ],
    } as never;
    const r = makeAssetResolver(root, ledger);
    expect(r.abs("local:tick")).toBe(join(root, "sounds", "tick.wav"));
    expect(r.missing).toEqual([]);
  });

  it("still reports a local sound that is nowhere as missing", () => {
    const root = mkdtempSync(join(tmpdir(), "fm-assets-"));
    const ledger = {
      version: 1,
      entries: [
        { source: "local", kind: "sound", id: "gone", file: ".flomotion/assets/local/gone.wav" },
      ],
    } as never;
    const r = makeAssetResolver(root, ledger);
    expect(r.abs("local:gone")).toBeUndefined();
    expect(r.missing).toEqual(["local:gone"]);
  });

  it("finds a named peak by the sound's ref, not only by its cache path", () => {
    const ledger = {
      version: 1,
      entries: [
        {
          source: "local",
          kind: "sound",
          id: "tick",
          file: ".flomotion/assets/local/tick.wav",
          peak: { tick: 0.003 },
        },
      ],
    } as never;
    const ev = { id: "s", src: "local:tick", start: 1, bus: "sfx" as const, peak: "tick" };
    expect(peakOffsetOf(ev, ledger, "/x/sounds/tick.wav")).toBe(0.003);
  });
});
