import { describe, expect, it } from "vitest";
import type { AudioEvent, CCNode, IRLayer, LintIssue, Ledger, SoundCue } from "@flomotion/core";
import { licenseReport } from "@flomotion/render";
import {
  CHECKLIST,
  activityOf,
  runChecklist,
  staticGaps,
  summarize,
  type ReviewInput,
} from "../src/review.js";

const node = (
  name: string,
  props: Record<string, unknown>,
  children: CCNode["children"] = [],
): CCNode => ({ $cc: 1, name, props, children });
const layer = (
  id: string,
  name: string,
  start: number,
  end: number,
  baked: IRLayer["baked"] = [],
  children: IRLayer[] = [],
  kind: IRLayer["kind"] = "layer",
): IRLayer =>
  ({
    id,
    name,
    kind,
    start,
    end,
    z: 0,
    children,
    baked,
    html: "",
    css: "",
    hostStyle: {},
    xfStyle: {},
    offsets: [],
    filters: [],
    channels: [],
    statics: {},
    defs: [],
    overlays: [],
    visual: true,
    flow: false,
    inFlow: false,
    sounds: [],
    audio: [],
    source: { id },
    statics2: [],
  }) as IRLayer;
/** A channel that changes during [from, to] seconds. */
const moves = (from: number, to: number, hz = 60): IRLayer["baked"][number] => {
  const n = Math.round((to - from) * hz) + 1;
  return { target: "x", prop: "x", t0: from, hz, samples: Array.from({ length: n }, (_, i) => i) };
};
const ledger: Ledger = { version: 1, entries: [] };

function base(over: Partial<ReviewInput> = {}): ReviewInput {
  const ir = layer(
    "c",
    "Composition",
    0,
    10,
    [],
    [
      layer(
        "v1",
        "Track",
        0,
        10,
        [],
        [
          ...[0, 2, 4, 6, 8].map((t, i) =>
            layer(`s${i + 1}`, "Scene", t, t + 2, [moves(t, t + 2)]),
          ),
        ],
        "track",
      ),
      layer("hero", "Rect", 0, 10, [moves(0, 10)]),
    ],
    "composition",
  );
  const tree = node("Composition", { id: "c", fps: 30, theme: "$look.kinetic" }, [
    node(
      "Track",
      { id: "v1" },
      ["s1", "s2", "s3", "s4", "s5"].map((id) => node("Scene", { id })),
    ),
  ]);
  return {
    tree,
    fps: 30,
    duration: 10,
    ir,
    sounds: [],
    audio: [],
    lint: [],
    ledger,
    license: licenseReport(ledger, [], []),
    ...over,
  };
}
const get = (r: ReturnType<typeof runChecklist>, n: number) => r.find((x) => x.n === n)!;
const issue = (rule: string, id = "t"): LintIssue => ({
  severity: "error",
  rule,
  message: `${rule} on ${id}`,
  id,
});

describe("checklist shape", () => {
  it("has the 17 items from the brief, in order", () => {
    expect(CHECKLIST.map((c) => c.n)).toEqual(Array.from({ length: 17 }, (_, i) => i + 1));
    expect(CHECKLIST.map((c) => c.title)).toContain("Frame 0 has motion");
    expect(CHECKLIST[16]!.title).toBe("CC-BY credits are present in the license report");
    expect(runChecklist(base()).map((r) => r.n)).toEqual(CHECKLIST.map((c) => c.n));
    expect(runChecklist(base(), [3, 4]).map((r) => r.n)).toEqual([3, 4]);
  });
  it("is pure: the same input gives the same output", () => {
    expect(runChecklist(base())).toEqual(runChecklist(base()));
  });
});

describe("motion checks (1-4) read the compiled animation, not pixels", () => {
  it("passes a film that always moves", () => {
    const r = runChecklist(base());
    expect(get(r, 1).status).toBe("pass");
    expect(get(r, 2).status).toBe("pass");
    expect(get(r, 2).detail).toContain("#hero");
    expect(get(r, 3).status).toBe("pass");
    expect(get(r, 4).status).toBe("pass");
  });
  it("1 fails when nothing moves at the start", () => {
    const ir = layer(
      "c",
      "Composition",
      0,
      10,
      [],
      [layer("a", "Rect", 0, 10, [moves(1, 3)])],
      "composition",
    );
    expect(get(runChecklist(base({ ir })), 1).status).toBe("fail");
  });
  it("2 asks for eyes when no layer spans four scenes", () => {
    const ir = layer(
      "c",
      "Composition",
      0,
      10,
      [],
      [
        layer(
          "v1",
          "Track",
          0,
          10,
          [],
          ["s1", "s2", "s3", "s4"].map((id, i) =>
            layer(id, "Scene", i * 2.5, i * 2.5 + 2.5, [moves(i * 2.5, i * 2.5 + 2.5)]),
          ),
          "track",
        ),
      ],
      "composition",
    );
    const r = get(runChecklist(base({ ir })), 2);
    expect(r.status).toBe("manual");
    expect(r.auto).toBe(false);
  });
  it("2 is skipped with fewer than four beats", () => {
    const tree = node("Composition", { id: "c" }, [node("Scene", { id: "s1" })]);
    expect(get(runChecklist(base({ tree })), 2).status).toBe("skipped");
  });
  it("3 and 4 find the long quiet stretch and name where it is", () => {
    const ir = layer(
      "c",
      "Composition",
      0,
      10,
      [],
      [layer("a", "Rect", 0, 1, [moves(0, 1)]), layer("b", "Rect", 6, 10, [moves(6, 10)])],
      "composition",
    );
    const r = runChecklist(base({ ir }));
    expect(get(r, 3)).toMatchObject({ status: "fail" });
    expect(get(r, 3).detail).toContain("Longest wait for something new: 6 s");
    expect(get(r, 4).status).toBe("fail");
    expect(get(r, 4).detail).toMatch(/^Static for more than 0\.5 s: 1(\.\d+)?-5\.9\d*s/);
  });
  it("staticGaps counts a gap only when longer than 0.5 s", () => {
    const act = activityOf(
      layer(
        "c",
        "Composition",
        0,
        3,
        [],
        [layer("a", "Rect", 0, 3, [moves(0, 1), moves(1.4, 3)])],
        "composition",
      ),
      30,
    );
    expect(staticGaps(act, 3, 30)).toEqual([]); // 0.4 s of stillness is allowed
    const act2 = activityOf(
      layer(
        "c",
        "Composition",
        0,
        3,
        [],
        [layer("a", "Rect", 0, 3, [moves(0, 1), moves(1.8, 3)])],
        "composition",
      ),
      30,
    );
    const gaps = staticGaps(act2, 3, 30);
    expect(gaps).toHaveLength(1);
    expect(gaps[0]![1] - gaps[0]![0]).toBeGreaterThan(0.5);
  });
});

describe("voice checks (5, 11, 12, 15)", () => {
  const voiceTree = (extra: CCNode[] = []) =>
    node("Composition", { id: "c", theme: "x" }, [
      node("Voiceover", { id: "vo", src: "v.wav" }),
      ...extra,
    ]);
  it("5: skipped without voice, manual without captions, pass-by-construction with captions", () => {
    expect(get(runChecklist(base()), 5).status).toBe("skipped");
    expect(get(runChecklist(base({ tree: voiceTree() })), 5).status).toBe("manual");
    const withCaps = voiceTree([node("Captions", { id: "cap", voice: "#vo" })]);
    expect(get(runChecklist(base({ tree: withCaps })), 5).status).toBe("pass");
  });
  it("11: music must duck at least 6 dB under the voice", () => {
    const mix = (duck: number, musicGain = -12) => ({
      targetLufs: -14,
      duckAmount: duck,
      lufs: -14,
      truePeak: -2,
      events: [
        { bus: "voice" as const, gainDb: 0 },
        { bus: "music" as const, gainDb: musicGain },
      ],
    });
    expect(get(runChecklist(base({ mix: mix(12) })), 11).status).toBe("pass");
    expect(get(runChecklist(base({ mix: mix(3) })), 11)).toMatchObject({ status: "fail" });
    expect(get(runChecklist(base({ mix: mix(6, 10) })), 11).status).toBe("fail");
    expect(get(runChecklist(base()), 11).status).toBe("skipped");
  });
  it("12: loudness within 1.5 LU of the target and under -1 dBTP", () => {
    const m = (lufs: number, tp = -2) => ({
      targetLufs: -14,
      duckAmount: 12,
      lufs,
      truePeak: tp,
      events: [],
    });
    expect(get(runChecklist(base({ mix: m(-14.4) })), 12).status).toBe("pass");
    expect(get(runChecklist(base({ mix: m(-18) })), 12).status).toBe("fail");
    expect(get(runChecklist(base({ mix: m(-14, 0.2) })), 12).status).toBe("fail");
  });
  it("15: caption line length and reading speed", () => {
    const words = (n: number, per: number) =>
      Array.from({ length: n }, (_, i) => ({
        w: "wordy",
        start: i * per,
        end: i * per + per * 0.9,
      }));
    const caps = node("Composition", { id: "c" }, [
      node("Voiceover", { id: "vo" }),
      node("Captions", { id: "cap", voice: "#vo", maxChars: 22, maxWords: 4 }),
    ]);
    const slow = new Map([["vo", words(8, 0.5)]]);
    const fast = new Map([["vo", words(8, 0.12)]]);
    expect(get(runChecklist(base({ tree: caps, words: slow })), 15).status).toBe("pass");
    const f = get(runChecklist(base({ tree: caps, words: fast })), 15);
    expect(f.status).toBe("fail");
    expect(f.detail).toContain("chars/s");
    const long = node("Composition", { id: "c" }, [
      node("Captions", { id: "cap", voice: "#vo", maxChars: 60 }),
    ]);
    expect(get(runChecklist(base({ tree: long })), 15).status).toBe("fail");
    expect(get(runChecklist(base({ tree: voiceTreeNoCaps() })), 15).status).toBe("warn");
  });
});
const voiceTreeNoCaps = () => node("Composition", { id: "c" }, [node("Voiceover", { id: "vo" })]);

describe("sound checks (10, 16, 17)", () => {
  const ev = (bus: AudioEvent["bus"], start: number): AudioEvent =>
    ({ id: "e", src: "freesound:1", start, gainDb: 0, bus }) as AudioEvent;
  const cue = (at: number): SoundCue => ({ tag: "hit/land", at, source: "slam" });
  it("10: every impact cue needs an sfx within 0.1 s", () => {
    expect(get(runChecklist(base()), 10).status).toBe("skipped");
    expect(get(runChecklist(base({ sounds: [cue(1)], audio: [ev("sfx", 1.05)] })), 10).status).toBe(
      "pass",
    );
    const bad = get(runChecklist(base({ sounds: [cue(1), cue(4)], audio: [ev("sfx", 1.05)] })), 10);
    expect(bad.status).toBe("fail");
    expect(bad.detail).toContain("@4s");
    expect(bad.fix).toContain("sound_auto");
    expect(get(runChecklist(base({ sounds: [cue(1)], audio: [ev("music", 1)] })), 10).status).toBe(
      "fail",
    );
  });
  it("16: downloaded assets need ledger entries; your own files do not", () => {
    const orig = { version: 1 as const, entries: [] };
    const missing = licenseReport(orig, [ev("sfx", 1)], []);
    expect(missing.problems).toEqual(["freesound:1 has no ledger entry"]);
    expect(
      get(runChecklist(base({ license: missing, lint: [issue("asset-no-ledger", "s")] })), 16)
        .status,
    ).toBe("fail");
    const own = licenseReport(orig, [{ ...ev("sfx", 1), src: "./assets/mine.wav" }], []);
    expect(own.problems).toEqual([]);
    expect(own.own).toEqual(["./assets/mine.wav"]);
    expect(get(runChecklist(base({ license: own })), 16).status).toBe("pass");
    // a ledger entry that is not cleared for commercial use is a warning with the reason, not a silent pass
    const risky = licenseReport(
      {
        version: 1,
        entries: [
          {
            source: "elevenlabs",
            kind: "voice",
            id: "v",
            file: "assets/voice.mp3",
            hash: "h",
            license: "ElevenLabs generated",
            attributionRequired: false,
            commercialOk: false,
          },
        ],
      },
      [{ ...ev("voice", 0), src: "assets/voice.mp3" }],
      [],
    );
    const w = get(runChecklist(base({ license: risky })), 16);
    expect(w.status).toBe("warn");
    expect(w.detail).toContain("not cleared for commercial use");
  });
  it("17: attribution entries need an author and produce credits", () => {
    const entry = {
      source: "freesound",
      kind: "sound" as const,
      id: "1",
      file: "x.mp3",
      hash: "h",
      license: "CC-BY-4.0",
      attributionRequired: true,
      commercialOk: true,
      author: "swishy",
      url: "https://f/1",
      title: "Whip",
    };
    const ok = licenseReport({ version: 1, entries: [entry] }, [ev("sfx", 1)], []);
    expect(ok.credits).toContain('"Whip" by swishy (CC-BY-4.0)');
    expect(get(runChecklist(base({ license: ok })), 17).status).toBe("pass");
    const anon = licenseReport(
      { version: 1, entries: [{ ...entry, author: "unknown" }] },
      [ev("sfx", 1)],
      [],
    );
    expect(get(runChecklist(base({ license: anon })), 17).status).toBe("fail");
    expect(get(runChecklist(base()), 17).status).toBe("pass");
  });
});

describe("layout, safe area, contrast, transitions, look (7, 8, 9, 13, 14)", () => {
  it("7 uses the measured layout and is manual without it", () => {
    expect(get(runChecklist(base()), 7).status).toBe("manual");
    expect(get(runChecklist(base({ hf: { layout: { findings: [] } } })), 7).status).toBe("pass");
    expect(
      get(
        runChecklist(
          base({
            hf: {
              layout: {
                findings: [{ code: "overlap", severity: "error", message: "A overlaps B" }],
              },
            },
          }),
        ),
        7,
      ).status,
    ).toBe("fail");
    expect(
      get(
        runChecklist(
          base({
            hf: { layout: { findings: [{ code: "x", severity: "warning", message: "close" }] } },
          }),
        ),
        7,
      ).status,
    ).toBe("warn");
  });
  it("8 comes from the safe-area lint rule", () => {
    expect(get(runChecklist(base()), 8).status).toBe("pass");
    expect(
      get(runChecklist(base({ lint: [issue("text-outside-safe-area", "t1")] })), 8),
    ).toMatchObject({ status: "fail", detail: "#t1 leave the safe area." });
  });
  it("9 combines static lint with measured contrast", () => {
    expect(get(runChecklist(base()), 9).status).toBe("pass");
    expect(get(runChecklist(base({ lint: [issue("text-contrast", "t1")] })), 9).status).toBe(
      "fail",
    );
    const warn = get(
      runChecklist(
        base({
          hf: {
            contrast: {
              findings: [
                { code: "c", severity: "warning", message: "m", ratio: 2.84, text: "Mon", time: 8 },
              ],
            },
          },
        }),
      ),
      9,
    );
    expect(warn.status).toBe("warn");
    const bad = get(
      runChecklist(
        base({
          hf: {
            contrast: {
              findings: [
                {
                  code: "c",
                  severity: "warning",
                  message: "m",
                  ratio: 1.4,
                  text: "Faint",
                  time: 2,
                },
              ],
            },
          },
        }),
      ),
      9,
    );
    expect(bad.status).toBe("fail");
  });
  it("13 flags many different transitions", () => {
    const scenes = (types: string[]) =>
      node(
        "Composition",
        { id: "c" },
        types.map((t, i) => node("Scene", { id: `s${i}`, transition: { type: t } })),
      );
    expect(get(runChecklist(base({ tree: scenes(["dissolve", "dissolve"]) })), 13).status).toBe(
      "manual",
    );
    expect(
      get(runChecklist(base({ tree: scenes(["dissolve", "wipe", "glitch"]) })), 13).status,
    ).toBe("warn");
  });
  it("14 needs a theme and no font sprawl", () => {
    expect(get(runChecklist(base({ tree: node("Composition", { id: "c" }) })), 14).status).toBe(
      "warn",
    );
    expect(
      get(runChecklist(base({ lint: [issue("too-many-font-families", "c")] })), 14).status,
    ).toBe("warn");
    expect(get(runChecklist(base()), 14).status).toBe("manual");
  });
  it("6 lists the numbers for a human to add up", () => {
    const tree = node("Composition", { id: "c" }, [node("Counter", { id: "n", from: 0, to: 240 })]);
    const r = get(runChecklist(base({ tree })), 6);
    expect(r.status).toBe("manual");
    expect(r.detail).toContain("0 → 240");
  });
});

describe("summary", () => {
  it("passes only when nothing failed and names what needs eyes", () => {
    const s = summarize(runChecklist(base()));
    expect(s.pass).toBe(true);
    expect(s.needsEyes).toEqual(expect.arrayContaining([7, 14]));
    const f = summarize(runChecklist(base({ lint: [issue("text-outside-safe-area")] })));
    expect(f).toMatchObject({ pass: false, failing: [8] });
  });
});
