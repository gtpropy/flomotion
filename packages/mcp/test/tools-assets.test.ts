import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  cleanup,
  connect,
  doubles,
  makeSound,
  makeTone,
  ScriptTranscriber,
  ToolError,
  tmpProject,
  type Harness,
} from "./harness.js";

let root: string;
let h: Harness;
let d: ReturnType<typeof doubles>;
const src = () => readFileSync(`${root}/project.tsx`, "utf8");
const ledger = () =>
  JSON.parse(readFileSync(`${root}/.flomotion/ledger.json`, "utf8")) as { entries: any[] };
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

beforeAll(async () => {
  root = tmpProject("assets");
  d = doubles(root, {
    googleFonts: async () => [
      {
        family: "Inter",
        category: "sans-serif",
        variants: ["400", "600"],
        subsets: ["latin"],
        axes: [{ tag: "wght", start: 100, end: 900 }],
      },
      { family: "Pacifico", category: "handwriting", variants: ["regular"], subsets: ["latin"] },
      {
        family: "Noto Sans Devanagari",
        category: "sans-serif",
        variants: ["400", "700"],
        subsets: ["devanagari", "latin"],
      },
    ],
    transcriber: new ScriptTranscriber("Videos take days to make and weeks to fix", 4),
  });
  h = await connect(root, d.deps);
  await h.call("project_create", { name: "Assets Test", size: "540x960", template: "saas-promo" });
});
afterAll(async () => {
  await h.close();
  cleanup(root);
});

describe("fonts", () => {
  it("lists the Look's fonts as not yet downloaded", async () => {
    const r = await h.call("font_list");
    expect(r.fonts.map((f: any) => f.id).sort()).toEqual(["body", "display", "mono"]);
    expect(r.fonts[0].status).toMatch(/not in .*fonts.lock.json/);
  });
  it("font_get downloads, locks and records the licence", async () => {
    for (const id of ["display", "body", "mono"]) {
      const r = await h.call("font_get", { id });
      expect(r.files.length).toBeGreaterThan(0);
      expect(r.ledger[0].license).toBe("OFL-1.1");
      expect(r.lock.declHash).toBeTruthy();
    }
    expect(d.fonts.requests).toEqual(["Space Grotesk", "Inter", "JetBrains Mono"]);
    const r = await h.call("font_list");
    expect(r.fonts.every((f: any) => f.status === "ready")).toBe(true);
    expect(ledger().entries.filter((e) => e.kind === "font").length).toBeGreaterThanOrEqual(3);
  });
  it("font_get with a new family name declares it in <Fonts> (a patch, with an undo token)", async () => {
    const r = await h.call("font_get", {
      id: "Noto Sans Devanagari",
      subsets: ["devanagari", "latin"],
      weights: [400],
    });
    expect(r.undoToken).toBeTruthy();
    expect(src()).toMatch(
      /<Fonts id="fonts">\s*<Font\s+id="noto-sans-devanagari"\s+family="Noto Sans Devanagari"\s+source="google"/,
    );
    const list = await h.call("font_list");
    expect(list.fonts.find((f: any) => f.id === "noto-sans-devanagari").status).toBe("ready");
  });
  it("font_check finds missing glyphs and suggests faces by script", async () => {
    const ok = await h.call("font_check", { fontId: "body", text: "Ship videos as code" });
    expect(ok.ok).toBe(true);
    const bad = await h.call("font_check", { fontId: "body", text: "नमस्ते" });
    expect(bad.ok).toBe(false);
    expect(bad.missing).toContain("न");
    expect(bad.suggestions[0].script).toBe("devanagari");
    expect(bad.suggestions[0].families).toContain("Noto Sans Devanagari");
    expect(bad.alreadyInProject).toContain("noto-sans-devanagari");
    await fails(h.call("font_check", { fontId: "ghost", text: "x" }), "font_error");
  });
  it("font_preview renders a PNG and attaches it", async () => {
    const r = await h.raw("font_preview", {
      fontId: "display",
      text: "Ship videos as code",
      size: 72,
    });
    expect(r.isError).toBeFalsy();
    expect(r.content.some((c) => c.type === "image")).toBe(true);
    const j = JSON.parse((r.content[0] as any).text);
    const png = readFileSync(join(root, j.path));
    expect(png.subarray(1, 4).toString()).toBe("PNG");
    expect(png.length).toBeGreaterThan(3000);
  });
  it("font_search needs a key, filters by script and variable axes, and reads licences", async () => {
    await fails(h.call("font_search", { query: "inter" }), "missing_dependency");
    const keyed = await connect(root, {
      ...d.deps,
      env: { ...d.deps.env, GOOGLE_FONTS_API_KEY: "k" } as NodeJS.ProcessEnv,
      fetch: async () => new Response("", { status: 404 }),
    });
    const r = await keyed.call("font_search", { script: "devanagari" });
    expect(r.results.map((x: any) => x.family)).toEqual(["Noto Sans Devanagari"]);
    const v = await keyed.call("font_search", { variable: true });
    expect(v.results.map((x: any) => x.family)).toEqual(["Inter"]);
    expect(v.results[0].variable).toBe(true);
    expect(v.results[0].license).toMatch(/unverified/); // the offline double cannot read google/fonts
    await keyed.close();
  });
});

describe("sounds (Freesound client against a test double)", () => {
  it("sends the API key as a Token header and builds a tag search with a duration filter", async () => {
    const r = await h.call("sound_search", { tag: "hit/land" });
    const req = d.fsLog.find((x) => x.url.includes("/search/text/"))!;
    expect(req.auth).toBe("Token test-key");
    expect(new URL(req.url).searchParams.get("filter")).toBe("duration:[0.1 TO 1.5]");
    expect(r.tag.job).toMatch(/lands/);
    expect(r.results.map((x: any) => x.id)).toContain("9001");
    expect(r.note).toMatch(/cannot hear/);
  });
  it("marks licences: CC0 and CC-BY allowed, NonCommercial not", async () => {
    const r = await h.call("sound_search", { query: "punch whip pop" });
    const by = Object.fromEntries(r.results.map((x: any) => [x.id, x]));
    expect(by["9001"] ?? by["9004"]).toMatchObject({ licenseClass: "CC0", allowed: true });
    expect(by["9002"]).toMatchObject({ licenseClass: "CC-BY", allowed: true });
    expect(by["9003"]).toMatchObject({ licenseClass: "CC-BY-NC", allowed: false });
    expect(r.results[r.results.length - 1].allowed).toBe(false); // blocked ones sort last
  });
  it("sound_get downloads, measures the peak and writes the ledger", async () => {
    const r = await h.call("sound_get", { id: "9001", tag: "hit/land" });
    expect(r.ref).toBe("freesound:9001");
    expect(existsSync(join(root, r.path))).toBe(true);
    expect(r.peakName).toBe("land");
    expect(r.entry).toMatchObject({
      source: "freesound",
      id: "9001",
      author: "foleyfan",
      license: "CC0-1.0",
      attributionRequired: false,
      commercialOk: true,
    });
    expect(r.entry.peak.land).toBeGreaterThan(0.27);
    expect(r.entry.peak.land).toBeLessThan(0.33); // the double's loudest moment is at 0.30 s
    expect(ledger().entries.find((e) => e.id === "9001").hash).toHaveLength(64);
  });
  it("records CC-BY as needing attribution and blocks NonCommercial with a typed error", async () => {
    const by = await h.call("sound_get", { id: "9002", tag: "move/whip" });
    expect(by.entry).toMatchObject({
      license: "CC-BY-4.0",
      attributionRequired: true,
      author: "swishy",
    });
    const e = await fails(h.call("sound_get", { id: "9003" }), "license_blocked");
    expect(e.fix).toContain("Allowed: CC0, CC-BY");
    expect(ledger().entries.some((x) => x.id === "9003")).toBe(false);
  });
  it("can be restricted to CC0 only in flomotion.json", async () => {
    const cfg = JSON.parse(readFileSync(`${root}/flomotion.json`, "utf8"));
    writeFileSync(`${root}/flomotion.json`, JSON.stringify({ ...cfg, soundLicenses: ["CC0"] }));
    await fails(h.call("sound_get", { id: "9005" }), "license_blocked");
    const r = await h.call("sound_search", { query: "boom" });
    expect(r.results[0]).toMatchObject({ id: "9005", allowed: false });
    writeFileSync(`${root}/flomotion.json`, JSON.stringify(cfg));
  });
  it("rejects unknown tags and empty searches", async () => {
    await fails(h.call("sound_search", { tag: "hit/nothing" }), "invalid_edit");
    await fails(h.call("sound_search", {}), "invalid_edit");
  });
  it("sound_auto plans, then places sounds on impact cues that have none", async () => {
    await h.call("element_add", {
      parent: "hook",
      type: "Title",
      props: { id: "t1", text: "Ship it", at: "center" },
    });
    await h.call("effect_add", { id: "t1", effect: "Shake", props: { amp: 8, start: "0.6s" } });
    const plan = await h.call("sound_auto", {});
    expect(plan.dryRun).toBe(true);
    expect(plan.plan[0]).toMatchObject({ tag: "hit/punch", scene: "hook" });
    expect(plan.plan[0].at).toBeCloseTo(0.6, 1);
    expect(src()).not.toContain("<Sound");
    const done = await h.call("sound_auto", { apply: true });
    expect(done.description).toMatch(/place 1 sound/);
    expect(src()).toMatch(
      /<Sound\s+id="s-t1-shake"\s+src="freesound:9001"\s+at="0\.6s"\s+peak="punch"\s+gain=\{-6\}\s+tag="hit\/punch"\s+\/>/,
    );
    expect(done.note).toMatch(/Not auditioned/);
    const again = await h.call("sound_auto", {});
    expect(again.cues).toEqual([]);
  });
  it("falls back to sounds/catalog.json when there is no key, and errors clearly with neither", async () => {
    const dir = tmpProject("nokey");
    const bare = await connect(dir, {
      env: { FLOMOTION_CONFIG: join(dir, ".no-config.json") } as NodeJS.ProcessEnv,
      fontSources: d.deps.fontSources,
      hfCheck: async () => undefined,
    });
    await bare.call("project_create", { name: "Local", size: "540x960" });
    const e = await fails(bare.call("sound_search", { query: "thud" }), "missing_dependency");
    expect(e.fix).toContain("flomotion setup");
    expect(e.fix).toContain("sound_import");
    makeSound(join(dir, "sounds", "thud.wav"), { peak: 0.2, seconds: 0.6 });
    writeFileSync(
      join(dir, "sounds", "catalog.json"),
      JSON.stringify([
        {
          id: "thud1",
          name: "my thud",
          tags: ["thud"],
          license: "http://creativecommons.org/publicdomain/zero/1.0/",
          author: "me",
          url: "https://example.com/thud",
          file: "thud.wav",
        },
      ]),
    );
    const s = await bare.call("sound_search", { query: "thud" });
    expect(s.results[0]).toMatchObject({ ref: "local:thud1", allowed: true });
    const g = await bare.call("sound_get", { id: "thud1", tag: "hit/land" });
    expect(g.ref).toBe("local:thud1");
    expect(g.entry.peak.land).toBeGreaterThan(0.17);
    await bare.close();
    cleanup(dir);
  });
});

describe("voice: quote then confirm (ElevenLabs test double)", () => {
  const script = "Videos take days to make and weeks to fix";
  let quoteId: string;
  it("quotes without spending or calling the provider", async () => {
    const q = await h.call("voice_quote", {
      provider: "elevenlabs",
      text: script,
      voice: "voice-123",
    });
    quoteId = q.quoteId;
    expect(q).toMatchObject({
      provider: "elevenlabs",
      spends: true,
      characters: script.length,
      credits: script.length,
    });
    expect(q.usd).toBeCloseTo((script.length / 1000) * 0.3, 2);
    expect(q.assumptions.join(" ")).toMatch(/verify on your plan/);
    expect(q.next).toMatch(/Do NOT call voice_generate/);
    expect(d.eleven).toHaveLength(0);
    // the real allowance is read (free) so the quote can say whether the account can afford it
    expect(d.elevenAccount.length).toBeGreaterThan(0);
    expect(q.account).toMatchObject({
      tier: "creator",
      used: 1000,
      limit: 100000,
      remaining: 99000,
      enough: true,
    });
    expect(q.account.note).toContain("99000 characters left");
  });
  it("refuses to run without confirm:true (typed quote_required) and spends nothing", async () => {
    const e = await fails(h.call("voice_generate", { quoteId }), "quote_required");
    expect(e.message).toMatch(/Nothing was run/);
    expect(e.fix).toMatch(/confirm:true/);
    await fails(h.call("voice_generate", { quoteId, confirm: false }), "quote_required");
    await fails(
      h.call("voice_generate", { quoteId: "nonexistent", confirm: true }),
      "quote_required",
    );
    expect(d.eleven).toHaveLength(0);
    expect(existsSync(join(root, "assets", "voice"))).toBe(false);
  });
  it("runs exactly once after confirm:true, saves audio, word timings and a ledger entry", async () => {
    const r = await h.call("voice_generate", { quoteId, confirm: true, id: "voice" });
    expect(d.eleven).toHaveLength(1);
    expect(d.eleven[0]).toMatchObject({ key: "el-key", body: { text: script } });
    expect(d.eleven[0]!.url).toContain("/v1/text-to-speech/voice-123/with-timestamps");
    expect(r.file).toBe("assets/voice/voice.mp3");
    expect(r.spent).toMatchObject({ credits: script.length });
    const words = JSON.parse(readFileSync(join(root, r.wordsFile), "utf8"));
    expect(words.map((w: any) => w.w).join(" ")).toBe(script);
    expect(words[0].start).toBe(0);
    expect(words.every((w: any) => w.end > w.start)).toBe(true);
    const entry = ledger().entries.find((e) => e.kind === "voice");
    expect(entry).toMatchObject({ source: "elevenlabs", id: "voice", commercialOk: false });
  });
  it("the recording provider is free and needs no confirm", async () => {
    makeTone(join(root, "recordings", "mine.wav"), 3);
    const q = await h.call("voice_quote", {
      provider: "recording",
      text: "",
      voice: "recordings/mine.wav",
    });
    expect(q).toMatchObject({ spends: false, credits: 0 });
    const r = await h.call("voice_generate", { quoteId: q.quoteId, id: "mine" });
    expect(existsSync(join(root, r.file))).toBe(true);
    expect(r.next).toMatch(/transcribe/);
    await fails(
      h
        .call("voice_quote", { provider: "elevenlabs", text: "x", voice: "../../etc/passwd" })
        .then(() => h.call("voice_generate", { quoteId: "bad", confirm: true })),
      "quote_required",
    );
  });
  it("local-tts is a documented stub that is free", async () => {
    const q = await h.call("voice_quote", { provider: "local-tts", text: "hello" });
    expect(q.spends).toBe(false);
    expect(q.assumptions[0]).toMatch(/macOS/);
  });
});

describe("transcribe and align_to_voice", () => {
  it("transcribe writes [{w,start,end}] next to the audio", async () => {
    const r = await h.call("transcribe", { audio: "assets/voice/voice.mp3" });
    expect(r.file).toBe("assets/voice/voice.words.json");
    expect(r.words).toBe(9);
    expect(r.engine).toBe("script-double");
    expect(r.first[0]).toMatchObject({ w: "Videos" });
    await fails(h.call("transcribe", { audio: "../outside.wav" }), "path_outside_project");
  });
  it("align_to_voice retimes elements to spoken words, relative to their scene", async () => {
    await h.call("element_add", {
      parent: "assets-test",
      type: "Voiceover",
      props: { id: "vo", src: "assets/voice/voice.mp3" },
    });
    await h.call("element_add", {
      parent: "problem",
      type: "Text",
      props: { id: "w1", text: "days", duration: "1s" },
    });
    await h.call("element_add", {
      parent: "hook",
      type: "Text",
      props: { id: "w0", text: "weeks", duration: "1s" },
    });
    const r = await h.call("align_to_voice", {
      voiceId: "vo",
      mapping: [
        { id: "w0", word: "days" },
        { id: "w1", word: "weeks", offset: -0.1 },
      ],
    });
    // 9 words over 4 s: "days" is word 2 (start 0.889 s), "weeks" is word 6 (start 2.667 s)
    expect(r.aligned[0]).toMatchObject({ id: "w0", word: "days", wordIndex: 2, prop: "start" });
    expect(r.aligned[0].absolute).toBeCloseTo(0.9, 1);
    expect(r.aligned[1].absolute).toBeCloseTo(2.57, 1);
    expect(src()).toMatch(/<Text id="w0"[^>]*start="0\.9s"/);
    // "problem" starts at 3 s, so a word at 2.57 s gives a negative local start
    expect(parseFloat(r.aligned[1].value)).toBeCloseTo(2.57 - 3, 1);
    await fails(
      h.call("align_to_voice", { voiceId: "vo", mapping: [{ id: "w0", word: "banana" }] }),
      "invalid_edit",
    );
    await fails(
      h.call("align_to_voice", { voiceId: "w0", mapping: [{ id: "w1", word: 0 }] }),
      "unknown_element",
    );
  });
});

void copyFileSync;
void mkdirSync;

describe("one sound serving two jobs keeps both peak names", () => {
  it("sound_get twice with different tags merges the named peaks", async () => {
    await h.call("sound_get", { id: "9001", tag: "hit/land" });
    const again = await h.call("sound_get", { id: "9001", tag: "hit/punch" });
    expect(Object.keys(again.entry.peak).sort()).toEqual(["land", "main", "punch"]);
    const e = ledger().entries.filter((x) => x.id === "9001");
    expect(e).toHaveLength(1);
    expect(Object.keys(e[0].peak).sort()).toEqual(["land", "main", "punch"]);
  });
});
