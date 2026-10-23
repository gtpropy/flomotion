import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  checkWords,
  parseClock,
  parseTranscript,
  spreadWords,
} from "../src/providers/transcript.js";
import { indexSoundLibrary, tagsFromPath } from "../src/providers/library.js";
import { writeConfig, libraryIndexPath } from "../src/config.js";
import {
  cleanup,
  connect,
  doubles,
  makeSound,
  makeTone,
  ToolError,
  tmpProject,
  type Harness,
} from "./harness.js";

const fails = async (p: Promise<unknown>, code: string) => {
  try {
    await p;
  } catch (e) {
    expect(e).toBeInstanceOf(ToolError);
    expect((e as ToolError).code).toBe(code);
    return e as ToolError;
  }
  throw new Error(`expected ${code}`);
};

describe("transcripts the person already has", () => {
  const SRT = `1
00:00:00,400 --> 00:00:02,400
Your projects are everywhere.

2
00:00:02,800 --> 00:00:05,000
<i>Chat</i>, email, spreadsheets.
`;
  it("parses clock times in every common form", () => {
    expect(parseClock("00:00:01,500")).toBe(1.5);
    expect(parseClock("01:02.5")).toBe(62.5);
    expect(parseClock("1:02")).toBe(62);
    expect(parseClock("62.5")).toBe(62.5);
    expect(parseClock("62.5s")).toBe(62.5);
    expect(parseClock("nope")).toBeUndefined();
  });
  it("spreads the words of a line by length over its time", () => {
    const w = spreadWords("a longer word", 10, 12);
    expect(w.map((x) => x.w)).toEqual(["a", "longer", "word"]);
    expect(w[0]!.start).toBe(10);
    expect(w[0]!.end - w[0]!.start).toBeLessThan(w[1]!.end - w[1]!.start); // a long word takes longer than a short one
    expect(w[2]!.end).toBeLessThanOrEqual(12);
  });
  it("SRT: cue precision, markup stripped", () => {
    const p = parseTranscript(SRT);
    expect(p).toMatchObject({ precision: "cue", format: "srt" });
    expect(p.words.map((w) => w.w).join(" ")).toBe(
      "Your projects are everywhere. Chat, email, spreadsheets.",
    );
    expect(p.words[0]!.start).toBe(0.4);
    expect(p.words[4]!.start).toBe(2.8);
    expect(p.warnings[0]).toContain("time per line");
  });
  it("VTT works the same", () => {
    const p = parseTranscript(
      "WEBVTT\n\n00:01.000 --> 00:03.000 align:start\nHello there friend\n",
    );
    expect(p).toMatchObject({ precision: "cue", format: "vtt" });
    expect(p.words).toHaveLength(3);
    expect(p.words[0]!.start).toBe(1);
  });
  it("word-level JSON (Whisper-style, hyperframes-style, w/start/end) is exact", () => {
    for (const j of [
      [
        { text: "Hello", start: 0, end: 0.4 },
        { text: "world", start: 0.5, end: 1 },
      ],
      {
        words: [
          { word: "Hello", start: 0, end: 0.4 },
          { word: "world", start: 0.5, end: 1 },
        ],
      },
      [
        { w: "Hello", start: 0, end: 0.4 },
        { w: "world", start: 0.5, end: 1 },
      ],
    ]) {
      const p = parseTranscript(JSON.stringify(j));
      expect(p).toMatchObject({ precision: "word", format: "json-words" });
      expect(p.words.map((w) => w.w)).toEqual(["Hello", "world"]);
    }
  });
  it("segment JSON is spread and marked cue precision", () => {
    const p = parseTranscript(
      JSON.stringify({ segments: [{ text: "Meet Pulse today", start: 1, end: 2.5 }] }),
    );
    expect(p.precision).toBe("cue");
    expect(p.words).toHaveLength(3);
    const q = parseTranscript(JSON.stringify([{ text: "Meet Pulse today", start: 1, end: 2.5 }]));
    expect(q.precision).toBe("cue");
  });
  it("an ElevenLabs alignment becomes exact word times", () => {
    const chars = [..."Hi you"];
    const p = parseTranscript(
      JSON.stringify({
        alignment: {
          characters: chars,
          character_start_times_seconds: chars.map((_, i) => i * 0.1),
          character_end_times_seconds: chars.map((_, i) => (i + 1) * 0.1),
        },
      }),
    );
    expect(p).toMatchObject({ precision: "word", format: "elevenlabs" });
    expect(p.words).toEqual([
      { w: "Hi", start: 0, end: 0.2 },
      { w: "you", start: 0.3, end: 0.6 },
    ]);
  });
  it("text with a time at the start of each line", () => {
    const p = parseTranscript(
      "[00:01.0] Meet Pulse.\n[00:03.5] One live board.\n[00:06] Try it free.",
      { duration: 8 },
    );
    expect(p).toMatchObject({ precision: "cue", format: "timestamped-text" });
    expect(p.words.find((w) => w.w === "One")!.start).toBe(3.5);
    expect(p.words.find((w) => w.w === "Try")!.start).toBe(6);
  });
  it("plain text is an estimate and needs the audio length", () => {
    const p = parseTranscript("Meet Pulse. One live board for every project.", { duration: 6 });
    expect(p).toMatchObject({ precision: "estimated", format: "text" });
    expect(p.warnings[0]).toContain("approximate");
    expect(p.words[0]!.start).toBeGreaterThan(0);
    expect(p.words[p.words.length - 1]!.end).toBeLessThan(6);
    expect(() => parseTranscript("Meet Pulse.")).toThrowError(/audio length is needed/);
  });
  it("rejects what it cannot read, with a fix", () => {
    expect(() => parseTranscript("{ nope")).toThrowError(/does not parse/);
    expect(() => parseTranscript('{"a":1}')).toThrowError(/No words with times/);
    expect(() => parseTranscript("WEBVTT\n\nnothing here")).toThrowError(/No cues/);
    expect(() => parseTranscript("   ")).toThrowError();
  });
  it("flags words that do not fit the audio", () => {
    const words = [
      { w: "a", start: 0, end: 1 },
      { w: "b", start: 0.5, end: 1.5 },
      { w: "c", start: 0.2, end: 2 },
    ];
    expect(checkWords(words)[0]).toContain("not in order");
    expect(checkWords([{ w: "a", start: 0, end: 30 }], 10)[0]).toContain("wrong file");
    expect(checkWords([{ w: "a", start: 0, end: 3 }], 10)[0]).toContain("no words");
    expect(checkWords([{ w: "a", start: 0, end: 9.5 }], 10)).toEqual([]);
  });
});

describe("the person's own recording and transcript (through the tools)", () => {
  let root: string;
  let outside: string;
  let h: Harness;
  beforeAll(async () => {
    root = tmpProject("import");
    outside = tmpProject("import-outside");
    h = await connect(root, doubles(root).deps);
    await h.call("project_create", { name: "Import Test", size: "540x960", duration: 6 });
    makeTone(join(outside, "my voice.wav"), 5, 200);
  });
  afterAll(async () => {
    await h.close();
    cleanup(root);
    cleanup(outside);
  });

  it("voice_import copies a recording from anywhere, ledgers it as the person's, and reads captions with it", async () => {
    const r = await h.call("voice_import", {
      source: join(outside, "my voice.wav"),
      id: "voice",
      transcript: {
        text: "1\n00:00:00,300 --> 00:00:02,500\nYour projects are everywhere.\n\n2\n00:00:02,800 --> 00:00:04,800\nMeet Pulse.\n",
        format: "srt",
      },
    });
    expect(r.file).toBe("assets/voice/voice.wav");
    expect(r.duration).toBeCloseTo(5, 1);
    expect(existsSync(join(root, r.file))).toBe(true);
    expect(r.transcript).toMatchObject({
      precision: "cue",
      words: 6,
      file: "assets/voice/voice.words.json",
    });
    expect(r.transcript.advice).toContain("Line-level");
    expect(r.voiceover).toBe('<Voiceover id="vo" src="assets/voice/voice.wav" />');
    const words = JSON.parse(readFileSync(join(root, "assets/voice/voice.words.json"), "utf8"));
    expect(words[0]).toMatchObject({ w: "Your", start: 0.3 });
    const entry = JSON.parse(readFileSync(join(root, ".codecut/ledger.json"), "utf8")).entries.find(
      (e: any) => e.kind === "voice",
    );
    expect(entry).toMatchObject({
      source: "own",
      id: "voice",
      license: "owned by the person",
      commercialOk: true,
      attributionRequired: false,
    });
    // and the Voiceover element works with the imported timings
    await h.call("element_add", {
      parent: "import-test",
      type: "Voiceover",
      props: { id: "vo", src: r.file },
    });
    await h.call("element_add", { parent: "main", type: "Title", props: { id: "t", text: "Hi" } });
    const a = await h.call("align_to_voice", {
      voiceId: "vo",
      mapping: [{ id: "t", word: "Pulse." }],
    });
    expect(a.aligned[0].absolute).toBeGreaterThan(2.5);
  });

  it("transcript_import later: line-level captions, then a word-level file replaces it", async () => {
    const srt = join(outside, "captions.srt");
    writeFileSync(srt, "1\n00:00:00,000 --> 00:00:03,000\nOne two three four\n");
    const a = await h.call("transcript_import", { audio: "assets/voice/voice.wav", source: srt });
    expect(a).toMatchObject({ precision: "cue", format: "srt", words: 4 });
    const json = join(outside, "words.json");
    writeFileSync(
      json,
      JSON.stringify([
        { text: "Meet", start: 0.5, end: 0.9 },
        { text: "Pulse", start: 1, end: 1.5 },
      ]),
    );
    const b = await h.call("transcript_import", { audio: "assets/voice/voice.wav", source: json });
    expect(b).toMatchObject({ precision: "word", words: 2 });
    expect(b.advice).toContain("Word-level");
    expect(b.warnings.join()).toContain("part of the audio has no words"); // 1.5 s of words for a 5 s recording
  });

  it("plain text only is labelled an estimate, and the tool says so", async () => {
    const a = await h.call("transcript_import", {
      audio: "assets/voice/voice.wav",
      text: "Meet Pulse. One live board for every project.",
    });
    expect(a).toMatchObject({ precision: "estimated" });
    expect(a.advice).toContain("Estimated");
    expect(a.advice).toContain("captions");
  });

  it("refuses wrong inputs with typed errors", async () => {
    await fails(
      h.call("transcript_import", { audio: "assets/voice/missing.wav", text: "x y z" }),
      "asset_missing",
    );
    await fails(h.call("transcript_import", { audio: "assets/voice/voice.wav" }), "invalid_edit");
    await fails(
      h.call("transcript_import", {
        audio: "assets/voice/voice.wav",
        text: "{ nope",
        format: "json",
      }),
      "invalid_value",
    );
    await fails(h.call("voice_import", { source: join(outside, "nothing.wav") }), "asset_missing");
  });

  it("never reads credential files or the wrong kind of file", async () => {
    writeFileSync(join(outside, ".env"), "SECRET=1");
    mkdirSync(join(outside, ".ssh"), { recursive: true });
    writeFileSync(join(outside, ".ssh", "id_rsa.wav"), "x");
    writeFileSync(join(outside, "notes.pdf"), "x");
    await fails(h.call("voice_import", { source: join(outside, ".env") }), "path_outside_project");
    await fails(
      h.call("voice_import", { source: join(outside, ".ssh", "id_rsa.wav") }),
      "path_outside_project",
    );
    await fails(h.call("voice_import", { source: join(outside, "notes.pdf") }), "invalid_edit");
    await fails(
      h.call("transcript_import", {
        audio: "assets/voice/voice.wav",
        source: join(outside, ".env"),
      }),
      "path_outside_project",
    );
  });
});

describe("the person's own sound effects", () => {
  let root: string;
  let outside: string;
  let h: Harness;
  let cfgFile: string;
  beforeAll(async () => {
    root = tmpProject("own-sounds");
    outside = tmpProject("own-sounds-src");
    cfgFile = join(outside, "config.json");
    const d = doubles(root);
    h = await connect(root, {
      ...d.deps,
      env: { ...d.deps.env, FLOMOTION_CONFIG: cfgFile } as NodeJS.ProcessEnv,
    });
    await h.call("project_create", { name: "Own Sounds", size: "540x960", duration: 6 });
    makeSound(join(outside, "Heavy Thud 01.wav"), { peak: 0.25, seconds: 0.8 });
    makeSound(join(outside, "soft-pop.wav"), { peak: 0.1, seconds: 0.4, freq: 600 });
    makeSound(join(outside, "whoosh_fast.mp3"), { peak: 0.3, seconds: 0.9, freq: 300 });
  });
  afterAll(async () => {
    await h.close();
    cleanup(root);
    cleanup(outside);
  });

  it("sound_import needs the person's statement of rights", async () => {
    const r = await h.raw("sound_import", { source: join(outside, "soft-pop.wav") });
    expect(r.isError).toBe(true); // rights is required by the tool's input schema
  });

  it("imports one file: catalogue, measured peak, ledger, and it is found and allowed even when only CC0 is allowed", async () => {
    writeFileSync(
      join(root, "codecut.json"),
      JSON.stringify({ name: "x", soundLicenses: ["CC0"] }),
    );
    const r = await h.call("sound_import", {
      source: join(outside, "Heavy Thud 01.wav"),
      rights: "own",
      tag: "hit/land",
      name: "Heavy thud",
    });
    expect(r.imported[0]).toMatchObject({ ref: "local:heavy-thud", file: "sounds/heavy-thud.wav" });
    expect(r.imported[0].peak.land).toBeGreaterThan(0.22);
    expect(r.imported[0].peak.land).toBeLessThan(0.28);
    const catalog = JSON.parse(readFileSync(join(root, "sounds/catalog.json"), "utf8"));
    expect(catalog[0]).toMatchObject({
      id: "heavy-thud",
      license: "owned by the person",
      tags: expect.arrayContaining(["heavy", "thud", "hit", "land"]),
    });
    const entry = JSON.parse(readFileSync(join(root, ".codecut/ledger.json"), "utf8")).entries.find(
      (e: any) => e.id === "heavy-thud",
    );
    expect(entry).toMatchObject({
      source: "local",
      kind: "sound",
      commercialOk: true,
      attributionRequired: false,
      license: "owned by the person",
    });
    const s = await h.call("sound_search", { query: "thud" });
    expect(s.results[0]).toMatchObject({
      ref: "local:heavy-thud",
      allowed: true,
      licenseClass: "own",
    });
    // placed and linted: an own sound needs no CC0/CC-BY setting
    await h.call("element_add", {
      parent: "main",
      type: "Sound",
      props: { id: "s1", src: "local:heavy-thud", at: "1s", peak: "land" },
    });
    const lint = await h.call("lint");
    // (fonts of the default look are not downloaded in this project; only the asset rules matter here)
    expect(
      lint.issues.filter((i: any) =>
        ["asset-no-ledger", "license-blocked", "asset-missing"].includes(i.rule),
      ),
    ).toEqual([]);
  });

  it("imports a folder (several files) and keeps the licence text you give", async () => {
    const r = await h.call("sound_import", {
      source: outside,
      rights: "licensed",
      license: "Acme SFX pack, standard licence",
      author: "Acme",
    });
    const refs = r.imported.map((x: any) => x.ref).sort();
    expect(refs).toEqual(["local:heavy-thud-01", "local:soft-pop", "local:whoosh-fast"]);
    const entry = JSON.parse(readFileSync(join(root, ".codecut/ledger.json"), "utf8")).entries.find(
      (e: any) => e.id === "soft-pop",
    );
    expect(entry).toMatchObject({ license: "Acme SFX pack, standard licence", author: "Acme" });
    // a licence text of the person's own is fine for lint: the rights are theirs
    await h.call("element_add", {
      parent: "main",
      type: "Sound",
      props: { id: "s2", src: "local:soft-pop", at: "2s" },
    });
    const lint = await h.call("lint");
    expect(
      lint.issues.filter((i: any) => ["asset-no-ledger", "license-blocked"].includes(i.rule)),
    ).toEqual([]);
  });

  it("refuses more than 40 files in one go and points to the library", async () => {
    const big = tmpProject("many-sounds");
    try {
      makeSound(join(big, "s0.wav"), { peak: 0.1, seconds: 0.2 });
      for (let i = 1; i < 41; i++)
        writeFileSync(join(big, `s${i}.wav`), readFileSync(join(big, "s0.wav")));
      const e = await fails(h.call("sound_import", { source: big, rights: "own" }), "invalid_edit");
      expect(e.fix).toContain("flomotion setup");
    } finally {
      cleanup(big);
    }
  });

  it("Freesound and your own sounds are searched together, yours first", async () => {
    const s = await h.call("sound_search", { query: "thud pop whoosh impact" });
    const sources = s.results.map((r: any) => r.source);
    expect(sources).toContain("local");
    expect(sources).toContain("freesound");
    expect(sources.indexOf("local")).toBeLessThan(sources.indexOf("freesound"));
    const both = await h.call("sound_get", { id: "local:soft-pop", tag: "ui/pop" });
    expect(both.ref).toBe("local:soft-pop");
    const fs = await h.call("sound_get", { id: "9004", tag: "ui/pop" });
    expect(fs.ref).toBe("freesound:9004");
  });

  describe("a library folder (what `flomotion setup` indexes)", () => {
    let lib: string;
    beforeAll(() => {
      lib = join(outside, "library");
      mkdirSync(join(lib, "Impacts"), { recursive: true });
      mkdirSync(join(lib, "UI"), { recursive: true });
      makeSound(join(lib, "Impacts", "Deep Boom Cinematic 03.wav"), {
        peak: 0.4,
        seconds: 1.2,
        freq: 70,
      });
      makeSound(join(lib, "UI", "Click_Tiny.wav"), { peak: 0.05, seconds: 0.2, freq: 900 });
    });
    it("makes search words from folder and file names", () => {
      expect(tagsFromPath("Impacts/Deep Boom Cinematic 03.wav")).toEqual([
        "impacts",
        "deep",
        "boom",
        "cinematic",
      ]);
      expect(tagsFromPath("UI/Click_Tiny.wav")).toEqual(["click", "tiny"]);
    });
    it("will not index without the person's statement of rights", () => {
      expect(() => indexSoundLibrary(lib, join(outside, "x.json"), { rights: false })).toThrowError(
        /Say that you may use/,
      );
    });
    it("is searched and used like any other source, lengths measured on demand", async () => {
      const index = libraryIndexPath({ FLOMOTION_CONFIG: cfgFile } as NodeJS.ProcessEnv);
      const built = indexSoundLibrary(lib, index, { rights: true });
      expect(built.entries.map((e) => e.id).sort()).toEqual([
        "impacts-deep-boom-cinematic-03",
        "ui-click-tiny",
      ]);
      writeConfig(
        {
          version: 1,
          keys: {},
          preferences: { soundLibrary: lib, sounds: "own", soundLibraryRights: true },
        },
        { FLOMOTION_CONFIG: cfgFile } as NodeJS.ProcessEnv,
      );
      // a new connection reads the library index
      const d = doubles(root);
      const h2 = await connect(root, {
        ...d.deps,
        env: { ...d.deps.env, FLOMOTION_CONFIG: cfgFile } as NodeJS.ProcessEnv,
      });
      try {
        const s = await h2.call("sound_search", { tag: "hit/boom", source: "local" });
        expect(s.results[0]).toMatchObject({
          ref: "local:lib-impacts-deep-boom-cinematic-03",
          allowed: true,
        });
        expect(s.results[0].duration).toBeCloseTo(1.2, 1); // measured when found, not at indexing time
        const g = await h2.call("sound_get", {
          id: "local:lib-impacts-deep-boom-cinematic-03",
          tag: "hit/boom",
        });
        expect(g.entry.peak.boom).toBeGreaterThan(0.35);
        expect(existsSync(join(root, g.path))).toBe(true);
        const st = await h2.call("setup_status");
        expect(st.can.soundEffects.join()).toContain("your sound library");
      } finally {
        await h2.close();
      }
    });
  });
});
