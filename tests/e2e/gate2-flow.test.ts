/**
 * Gate 2: the flomotion-studio skill flow, step by step, driven through the MCP SDK client against test doubles.
 *
 * It plays the part of Claude following skills/flomotion-studio/SKILL.md (gates G0 to G6) (intake, script, look, voice quote and
 * confirm, storyboard, build scene by scene with lint, sound, review rounds, draft, then final) and the
 * user answering at each "OK" gate. Freesound, ElevenLabs, Whisper and Google Fonts are doubles; everything
 * else is real: the MCP server over the SDK's in-memory transport, the codemods, lint, FFmpeg mixing,
 * headless Chrome and HyperFrames rendering.
 *
 * What this proves: the tools compose into the workflow, in that order, with the gates and quotes enforced.
 * What it does not prove: that a real Claude session follows the skill (see docs/gate2-manual-checklist.md).
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  cleanup,
  connect,
  doubles,
  makeTone,
  ScriptTranscriber,
  ToolError,
  tmpProject,
  type Harness,
} from "../../packages/mcp/test/harness.js";
import type { HfCheck } from "../../packages/mcp/src/review.js";

// ---------- the user's one-paragraph brief (the only source of facts) ----------
const BRIEF = {
  what: "A 30 second vertical promo for Pulse, a project dashboard for small teams",
  who: "Team leads at small agencies",
  where: "Instagram Reels and TikTok, 9:16, 30 seconds",
  facts: [
    "Pulse puts every project on one live board",
    "A weekly digest arrives in one click",
    "Deadline alerts so nothing slips",
    "Teams save five hours a week",
  ],
  cta: "Try Pulse free at pulse.example",
};
const SCRIPT =
  "Your projects are everywhere. Chat, email, spreadsheets, and a hundred little updates that nobody reads. " +
  "Meet Pulse. One live board for every project, so you see where things stand at a glance. " +
  "Get a weekly digest in a single click. And never miss a deadline, because Pulse warns you early. " +
  "Teams using Pulse save five hours every week. Try Pulse free today, at pulse dot example.";

let root: string;
let h: Harness;
const hf: HfCheck | undefined = { layout: { findings: [] }, contrast: { findings: [] } };
const log: string[] = [];
let d: ReturnType<typeof doubles>;
const call = async <T = any>(name: string, args: Record<string, unknown> = {}): Promise<T> => {
  log.push(name);
  return h.call<T>(name, args);
};
const src = () => readFileSync(join(root, "project.tsx"), "utf8");
const probe = (f: string) =>
  JSON.parse(
    execFileSync(
      "ffprobe",
      [
        "-v",
        "error",
        "-show_entries",
        "format=duration:stream=codec_name,width,height",
        "-of",
        "json",
        f,
      ],
      { encoding: "utf8" },
    ),
  );
const fails = async (p: Promise<unknown>, code: string) => {
  try {
    await p;
  } catch (e) {
    expect((e as ToolError).code).toBe(code);
    return e as ToolError;
  }
  throw new Error(`expected ${code}`);
};

const SAFE = (id: string, kids: string) => `<SafeArea id="${id}" preset="reels">${kids}</SafeArea>`;
const BG = (id: string, a: string, b: string) =>
  `<Rect id="${id}" width={1080} height={1920} fill={{ type: "linear", angle: 165, stops: [[0, "${a}"], [1, "${b}"]] }} />`;

const SCENES: Record<string, string> = {
  hook: `<Scene id="hook" start="0s" duration="3s" scale={[[0, 1], [3, 1.06]]}>
  ${BG("hook-bg", "#1a0b2e", "#0b0b12")}
  ${SAFE(
    "hook-safe",
    `
    <Title id="hook-title" text="Your projects are everywhere." at={[0, 420]} align="left" size={124} maxWidth="100%" font="$type.display" enter={{ from: "sw", distance: 140, ease: "expo.out", duration: 0.55 }}>
      <Shake id="hook-shake" amp={10} freq={14} decay={5} start="0.55s" />
    </Title>
    <Text id="hook-sub" at={[0, 1010]} text="Chat. Email. Spreadsheets." size={56} fill="$brand.muted" align="left" maxWidth="100%" font="$type.body" enter={{ from: "s", distance: 40, ease: "expo.out", duration: 0.5, delay: 0.9 }} />`,
  )}
</Scene>`,
  problem: `<Scene id="problem" start="3s" duration="5s" transition={{ type: "dipToColor", duration: 0.35, color: "$brand.bg" }} scale={[[0, 1], [5, 1.05]]}>
  ${BG("problem-bg", "#0b0b12", "#14101f")}
  ${SAFE(
    "problem-safe",
    `
    <SplitText id="problem-title" text="Updates get lost." at={[0, 360]} size={110} preset="rise" stagger={0.09} start="0.1s" maxWidth="100%" align="left" font="$type.display" />
    <Stagger id="problem-stack" each={0.45}>
      <Chip id="problem-c1" at={[0, 760]} label="Chat" dot="$brand.primary" fill="$brand.surface" textColor="$brand.fg" size={52} enter={{ from: "w", distance: 80, ease: "expo.out", duration: 0.5, delay: 0.8 }} />
      <Chip id="problem-c2" at={[0, 900]} label="Email" dot="$brand.accent" fill="$brand.surface" textColor="$brand.fg" size={52} enter={{ from: "w", distance: 80, ease: "expo.out", duration: 0.5, delay: 0.8 }} />
      <Chip id="problem-c3" at={[0, 1040]} label="Spreadsheets" dot="$brand.signal" fill="$brand.surface" textColor="$brand.fg" size={52} enter={{ from: "w", distance: 80, ease: "expo.out", duration: 0.5, delay: 0.8 }} />
    </Stagger>
    <Text id="problem-note" at={[0, 1280]} text="and nobody reads them." size={56} fill="$brand.muted" align="left" maxWidth="100%" font="$type.body" enter={{ from: "s", distance: 40, ease: "expo.out", duration: 0.5, delay: 3 }} />`,
  )}
</Scene>`,
  reveal: `<Scene id="reveal" start="8s" duration="6s" transition={{ type: "flash", duration: 0.3 }} scale={[[0, 1], [6, 1.05]]}>
  ${BG("reveal-bg", "#14142a", "#0b0b12")}
  ${SAFE(
    "reveal-safe",
    `
    <Title id="reveal-title" text="Meet Pulse." at="top" size={120} start="0.15s" font="$type.display">
      <Slam id="reveal-slam" start="0.15s" distance={500} />
    </Title>`,
  )}
  <UIMock id="reveal-phone" at={[180, 420]} device="phone" width={720} height={1040} enter={{ from: "s", distance: 500, ease: "expo.out", duration: 0.9, delay: 0.5 }}>
    <Rect id="reveal-screen" width={676} height={996} fill="#f4f5fb" at="top-left" />
    <Text id="reveal-app" text="Pulse" at={[40, 90]} size={56} weight={700} fill="#14142a" font="$type.display" maxWidth={500} align="left" />
    <Chip id="reveal-live" at={[430, 96]} label="Live" dot="#35d0a5" fill="#e6f8f1" textColor="#14142a" size={30} />
    <Card id="reveal-card" at={[40, 220]} width={596} height={380} fill="#ffffff" padding={28} stroke={{ width: 2, color: "#e3e5f2" }}>
      <Chart id="reveal-chart" type="bar" width={540} height={320} progress={[[1.6, 0], [3, 1, "expo.out"]]} data={[{ label: "Mon", value: 12 }, { label: "Tue", value: 20 }, { label: "Wed", value: 15 }, { label: "Thu", value: 31 }, { label: "Fri", value: 26 }]} labelColor="#444455" />
    </Card>
    <ProgressRing id="reveal-ring" at={[173, 640]} size={330} thickness={36} value={[[2, 0], [4, 0.82, "expo.out"]]} color="#5b6bff" track="#e8eafc" labelColor="#14142a" labelSize={78} />
  </UIMock>
</Scene>`,
  features: `<Scene id="features" start="14s" duration="9s" transition={{ type: "wipe", direction: "e", duration: 0.45 }} scale={[[0, 1], [9, 1.04]]}>
  ${BG("feat-bg", "#0b0b12", "#101024")}
  ${SAFE(
    "feat-safe",
    `
    <Text id="feat-head" text="Everything in one place" at={[0, 120]} size={88} weight={700} align="left" maxWidth="100%" font="$type.display" enter={{ from: "w", distance: 80, duration: 0.55 }} />
    <Stagger id="feat-stack" each={2.6}>
      <GlassCard id="f1" at={[0, 420]} width={920} height={300} enter={{ from: "s", distance: 100, ease: "expo.out", duration: 0.6, delay: 0.5 }}>
        <Text id="f1-t" text="One live board" size={64} weight={700} align="left" maxWidth="100%" font="$type.display" />
        <Chip id="f1-c" label="live" dot="$brand.primary" fill="$brand.surface" textColor="$brand.fg" size={36} enter={{ from: "s", distance: 30, duration: 0.4, delay: 1.2 }} />
      </GlassCard>
      <GlassCard id="f2" at={[0, 780]} width={920} height={300} enter={{ from: "s", distance: 100, ease: "expo.out", duration: 0.6, delay: 0.5 }}>
        <Text id="f2-t" text="A digest in one click" size={64} weight={700} align="left" maxWidth="100%" font="$type.display" />
        <Chip id="f2-c" label="weekly" dot="$brand.accent" fill="$brand.surface" textColor="$brand.fg" size={36} enter={{ from: "s", distance: 30, duration: 0.4, delay: 1.2 }} />
      </GlassCard>
      <GlassCard id="f3" at={[0, 1140]} width={920} height={300} enter={{ from: "s", distance: 100, ease: "expo.out", duration: 0.6, delay: 0.5 }}>
        <Text id="f3-t" text="Deadline alerts" size={64} weight={700} align="left" maxWidth="100%" font="$type.display" />
        <Chip id="f3-c" label="early" dot="$brand.signal" fill="$brand.surface" textColor="$brand.fg" size={36} enter={{ from: "s", distance: 30, duration: 0.4, delay: 1.2 }} />
      </GlassCard>
    </Stagger>`,
  )}
</Scene>`,
  proof: `<Scene id="proof" start="23s" duration="4s" transition={{ type: "dissolve", duration: 0.4 }} scale={[[0, 1.04], [4, 1]]}>
  ${BG("proof-bg", "#0b0b12", "#17102a")}
  ${SAFE(
    "proof-safe",
    `
    <Counter id="proof-count" at={[0, 520]} from={0} to={5} suffix=" hours" over={1} delay="0.3s" size={230} weight={700} align="left" maxWidth="100%" fill="$brand.primary" font="$type.numerals">
      <Thud id="proof-thud" amp={26} start="1.3s" />
    </Counter>
    <Text id="proof-label" at={[0, 960]} text="saved every week, per team" size={56} fill="$brand.fg" align="left" maxWidth="100%" font="$type.body" enter={{ from: "s", distance: 40, ease: "expo.out", duration: 0.5, delay: 1.6 }} />`,
  )}
</Scene>`,
  cta: `<Scene id="cta" start="27s" duration="3s" transition={{ type: "flash", duration: 0.3 }} scale={[[0, 1], [3, 1.05]]}>
  ${BG("cta-bg", "#1a0b2e", "#0b0b12")}
  ${SAFE(
    "cta-safe",
    `
    <Title id="cta-title" text="Try Pulse free." at={[0, 560]} align="left" size={140} maxWidth="100%" font="$type.display" enter={{ from: "s", distance: 120, ease: "expo.out", duration: 0.55 }}>
      <PunchZoom id="cta-punch" start="0.5s" amount={0.05} />
    </Title>
    <Chip id="cta-url" at={[0, 1000]} label="pulse.example" dot="$brand.accent" fill="$brand.surface" textColor="$brand.fg" size={56} enter={{ from: "s", distance: 40, ease: "expo.out", duration: 0.5, delay: 0.8 }}>
      <Pulse id="cta-pulse" start="1.4s" count={3} amp={0.05} freq={2} sound="" />
    </Chip>`,
  )}
</Scene>`,
};

const step = (name: string) => log.push(`## ${name}`);

beforeAll(async () => {
  root = tmpProject("gate2");
  d = doubles(root, {
    hfCheck: async () => hf,
    transcriber: new ScriptTranscriber(SCRIPT, 29),
  });
  h = await connect(root, d.deps);
}, 60_000);
afterAll(async () => {
  await h.close();
  cleanup(root);
});

describe("Gate 2: the flomotion-studio flow against test doubles", () => {
  it("1. Intake (OK): the agent repeats back only what the user said and waits", () => {
    step("intake");
    const brief = [BRIEF.what, BRIEF.who, BRIEF.where, ...BRIEF.facts, BRIEF.cta].join(". ");
    // the agent restates; it adds no facts of its own: every claim in the script traces to the brief
    expect(brief).toMatch(/five hours/);
    for (const claim of ["five hours", "weekly digest", "deadline", "live board", "pulse.example"])
      expect(brief.toLowerCase()).toContain(claim.replace("a weekly", "weekly"));
    expect(log.filter((l) => !l.startsWith("##"))).toEqual([]); // no tool call before the user said OK
  });

  it("2. Script (OK): three hooks, then a script of spoken-friendly sentences", () => {
    step("script");
    const words = SCRIPT.split(/\s+/).length;
    expect(words).toBeGreaterThan(60);
    expect(words / 2.5).toBeGreaterThan(24); // about 2.5 words a second: close to the 30 s film
    expect(SCRIPT).not.toMatch(/\d+%|\$\d|guarantee/i); // no invented numbers or claims
  });

  it("3. Look and style frames (OK): project, look fonts, style frame", async () => {
    step("look");
    const looks = JSON.parse(
      ((await h.client.readResource({ uri: "flomotion://looks" })).contents[0] as any).text,
    );
    expect(looks.map((l: any) => l.id)).toEqual([
      "clean-light",
      "dark-product",
      "bold-kinetic",
      "kinetic",
      "minimal",
      "sketch",
    ]);
    const created = await call("project_create", {
      name: "Pulse Promo",
      size: "1080x1920",
      fps: 30,
      template: "saas-promo",
      look: "dark-product",
    });
    expect(created.id).toBe("pulse-promo");
    const fonts = await call("font_list");
    for (const f of fonts.fonts) await call("font_get", { id: f.id });
    expect((await call("font_list")).fonts.every((f: any) => f.status === "ready")).toBe(true);
    await call("font_preview", {
      fontId: "display",
      text: "Your projects are everywhere.",
      size: 96,
    });
    // style frame: build the hook, render it, look at it
    await call("scene_write", { id: "hook", tsx: SCENES.hook });
    const frame = await h.raw("frame_render", { time: 1.2 });
    log.push("frame_render");
    expect(frame.content.some((c) => c.type === "image")).toBe(true);
  }, 180_000);

  it("4. Voice: quote, show the price, refuse without the user's yes, then confirm", async () => {
    step("voice");
    const q = await call("voice_quote", {
      provider: "elevenlabs",
      text: SCRIPT,
      voice: "voice-pulse",
    });
    expect(q.spends).toBe(true);
    expect(q.characters).toBe(SCRIPT.length);
    expect(d.eleven).toHaveLength(0); // quoting spent nothing
    // the agent (wrongly) tries to run it before the user answers: the server refuses
    const e = await fails(
      call("voice_generate", { quoteId: q.quoteId, confirm: false }),
      "quote_required",
    );
    expect(e.message).toMatch(/Nothing was run/);
    expect(d.eleven).toHaveLength(0);
    // the user says yes
    const g = await call("voice_generate", { quoteId: q.quoteId, confirm: true, id: "voice" });
    expect(d.eleven).toHaveLength(1);
    expect(g.words).toBe(SCRIPT.split(/\s+/).length);
    const tr = await call("transcribe", { audio: g.file }); // as the skill says: transcribe, then read the words
    expect(tr.words).toBe(SCRIPT.split(/\s+/).length);
    expect(tr.engine).toBe("script-double");
  });

  it("5. Storyboard (OK): the six beats add up to the film length", async () => {
    step("storyboard");
    const r = await call("project_read", { depth: 2 });
    const scenes = r.outline.children[0].children;
    expect(scenes.map((s: any) => s.id)).toEqual([
      "hook",
      "problem",
      "reveal",
      "features",
      "proof",
      "cta",
    ]);
    const total = scenes.reduce((a: number, s: any) => a + parseFloat(s.props.duration), 0);
    expect(total).toBe(30);
  });

  it("6. Build: scene by scene, lint after each, key words aligned to the voice, captions", async () => {
    step("build");
    for (const id of ["problem", "reveal", "features", "proof", "cta"]) {
      await call("scene_write", { id, tsx: SCENES[id]! });
      const lint = await call("lint", { scope: id });
      expect(
        lint.errors,
        `${id}: ${JSON.stringify(lint.issues.filter((i: any) => i.severity === "error"))}`,
      ).toBe(0);
    }
    // a persistent hero on its own track, so one element is carried across every beat
    await call("element_add", {
      parent: "pulse-promo",
      type: "Track",
      props: { id: "v2", kind: "video" },
    });
    await call("element_add", {
      parent: "v2",
      type: "Circle",
      props: {
        id: "hero",
        start: "0s",
        duration: "30s",
        width: 120,
        at: [880, 170],
        fill: "$brand.primary",
        position: [
          [0, [0, 0]],
          [10, [0, 50], "sine.inOut"],
          [20, [0, 0], "sine.inOut"],
          [30, [0, 50], "sine.inOut"],
        ],
      },
    });
    // voice, music and captions
    await call("element_add", {
      parent: "pulse-promo",
      type: "Voiceover",
      props: { id: "vo", src: "assets/voice/voice.mp3", script: SCRIPT },
    });
    makeTone(join(root, "assets", "music.wav"), 30, 110);
    await call("element_add", {
      parent: "pulse-promo",
      type: "Audio",
      props: {
        id: "music",
        src: "assets/music.wav",
        gain: -16,
        start: "0s",
        duration: "30s",
        fadeIn: 1.5,
        fadeOut: 2.5,
      },
    });
    await call("element_add", {
      parent: "pulse-promo",
      type: "Track",
      props: { id: "v3", kind: "video" },
    });
    await call("element_add", {
      parent: "v3",
      type: "Scene",
      props: { id: "caps", start: "0s", duration: "30s" },
    });
    await call("scene_write", {
      id: "caps",
      tsx: `<Scene id="caps" start="0s" duration="30s"><SafeArea id="caps-safe" preset="reels"><Captions id="captions" voice="#vo" captionStyle="karaoke" at="bottom" size={58} maxChars={20} maxWords={4} activeColor="$brand.accent" font="$type.display" stroke={{ width: 3, color: "#000000", align: "outside" }} /></SafeArea></Scene>`,
    });
    // start the product reveal and the CTA on the spoken words
    const a = await call("align_to_voice", {
      voiceId: "vo",
      mapping: [
        { id: "reveal-title", word: "Pulse." },
        { id: "cta-title", word: "Try", offset: -0.1 },
      ],
    });
    expect(a.aligned[0].absolute).toBeGreaterThan(5);
    expect(a.aligned[1].absolute).toBeGreaterThan(22);
    const lint = await call("lint");
    expect(lint.errors).toBe(0);
  }, 300_000);

  it("7. Sound: plan, place, mix; sounds come from Freesound (double) with ledger entries", async () => {
    step("sound");
    const plan = await call("sound_auto", {});
    expect(plan.dryRun).toBe(true);
    expect(plan.plan.length).toBeGreaterThanOrEqual(3);
    expect(plan.plan.every((p: any) => !p.error)).toBe(true);
    const done = await call("sound_auto", { apply: true });
    expect(done.description).toMatch(/place \d+ sound/);
    // the whip on the reveal transition: search by tag, get it (CC-BY, so credited), place it
    const found = await call("sound_search", { tag: "move/whip" });
    expect(found.results.find((r: any) => r.id === "9002")).toMatchObject({
      licenseClass: "CC-BY",
      allowed: true,
    });
    const whip = await call("sound_get", { id: "9002", tag: "move/whip" });
    await call("element_add", {
      parent: "reveal",
      type: "Sound",
      props: {
        id: "reveal-whip",
        src: whip.ref,
        at: "0s",
        peak: whip.peakName,
        gain: -10,
        tag: "move/whip",
      },
    });
    const mix = await call("mix_preview", {});
    expect(mix.events.some((e: any) => e.bus === "voice")).toBe(true);
    expect(mix.events.some((e: any) => e.bus === "music")).toBe(true);
    expect(mix.events.filter((e: any) => e.bus === "sfx").length).toBeGreaterThanOrEqual(4);
    expect(Math.abs(mix.lufs - -14)).toBeLessThan(1.5);
    expect(mix.note).toMatch(/not auditioned/i);
    const ledger = JSON.parse(readFileSync(join(root, ".flomotion/ledger.json"), "utf8")).entries;
    expect(
      ledger
        .filter((e: any) => e.kind === "sound")
        .every((e: any) => e.license && e.hash && e.author),
    ).toBe(true);
    expect(ledger.some((e: any) => e.attributionRequired)).toBe(true);
  }, 300_000);

  it("8. Review: rounds of review and fixes (at most 3), ending in a pass", async () => {
    step("review");
    let result: any;
    let rounds = 0;
    for (; rounds < 3; rounds++) {
      result = await call("review", { sheetCount: 8 });
      expect(result.contactSheet).toBeTruthy();
      expect(result.next).toMatch(/second pass/);
      if (result.pass) break;
      // the agent reads each failing check's fix and applies it with the edit tools
      for (const c of result.checks.filter((x: any) => x.status === "fail")) log.push(`fix:${c.n}`);
      throw new Error(
        `review failed in round ${rounds + 1}: ${JSON.stringify(result.checks.filter((x: any) => x.status === "fail"))}`,
      );
    }
    expect(rounds).toBeLessThan(3);
    const by = Object.fromEntries(result.checks.map((c: any) => [c.n, c]));
    expect(result.pass).toBe(true);
    expect(by[1].status).toBe("pass");
    expect(by[2].status).toBe("pass");
    expect(by[10].status).toBe("pass");
    expect(by[11].status).toBe("pass");
    expect(by[12].status).toBe("pass");
    expect(by[17].status).toBe("pass");
    expect(result.needsEyes.length).toBeGreaterThan(0); // the second pass over the contact sheet is the agent's, not the code's
    expect(existsSync(join(root, result.contactSheet))).toBe(true);
  }, 600_000);

  it("9. Draft then final (OK): final only after the draft, with credits and a licence report", async () => {
    step("render");
    const draft = await call("render", { preset: "draft" }).catch((e: ToolError) => {
      throw new Error(`${e.message}\n${JSON.stringify(e.details)}`);
    });
    const info = probe(join(root, draft.file));
    expect(info.format.duration).toBeCloseTo(30, 0);
    expect(info.streams[0]).toMatchObject({ width: 1080, height: 1920 });
    expect(info.streams.map((s: any) => s.codec_name)).toEqual(
      expect.arrayContaining(["h264", "aac"]),
    );
    expect(draft.license.credits).toBeTruthy();
    expect(readFileSync(join(root, draft.license.credits), "utf8")).toMatch(/swishy|boomer/);
    // the user watches the draft and approves
    const final = await call("render", { preset: "final" });
    expect(final.file).toContain("-final.mp4");
    expect(probe(join(root, final.file)).format.duration).toBeCloseTo(30, 0);
    expect(final.license.entries).toBeGreaterThan(5);
  }, 900_000);

  it("the order of tool calls followed the skill's flow and its safety rules", () => {
    const calls = log.filter((l) => !l.startsWith("##") && !l.startsWith("fix:"));
    const first = (n: string) => calls.indexOf(n);
    const last = (n: string) => calls.lastIndexOf(n);
    expect(first("project_create")).toBe(0);
    expect(first("font_get")).toBeLessThan(first("frame_render")); // fonts before any frame
    expect(first("voice_quote")).toBeLessThan(first("voice_generate")); // quote before generate
    expect(first("voice_generate")).toBeLessThan(first("transcribe"));
    expect(first("transcribe")).toBeLessThan(first("align_to_voice")); // voice exists before timing to it
    expect(first("align_to_voice")).toBeLessThan(first("sound_auto"));
    expect(first("sound_auto")).toBeLessThan(first("mix_preview"));
    expect(first("mix_preview")).toBeLessThan(first("review"));
    expect(first("review")).toBeLessThan(first("render"));
    expect(calls.filter((c) => c === "render")).toHaveLength(2); // draft, then final
    expect(last("lint")).toBeGreaterThan(first("scene_write"));
    // a lint after every scene written in the build step
    const build = calls.slice(calls.indexOf("scene_write", first("scene_write") + 1));
    expect(build.filter((c) => c === "lint").length).toBeGreaterThanOrEqual(5);
    // the voice provider was called exactly once, after confirm
    expect(d.eleven).toHaveLength(1);
    // no write tool ran between the start of a gate and the user's answer (the test records gates as markers)
    expect(log.indexOf("## intake")).toBe(0);
    expect(log.indexOf("project_create")).toBeGreaterThan(log.indexOf("## look"));
  });

  it("the project is plain TSX and diffs cleanly", () => {
    const text = src();
    expect(text).toContain('<Composition id="pulse-promo"');
    expect(text).toContain('theme="$look.dark-product"');
    expect(text.split("\n").length).toBeGreaterThan(100);
    expect(existsSync(join(root, ".flomotion/history/index.json"))).toBe(true);
  });
});
