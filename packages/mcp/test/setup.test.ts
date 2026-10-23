import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { configPath, readConfig, writeConfig, libraryIndexPath } from "../src/config.js";
import {
  checkAll,
  importFromEnv,
  runWizard,
  type SetupContext,
  type SetupIO,
} from "../../cli/src/setup.js";
import { cleanup, makeSound, REPO, tmpProject } from "./harness.js";
// @ts-expect-error plain ESM script without types
import { bundle } from "../../../scripts/bundle.mjs";

/** A person at the terminal: answers to `ask` in order (Enter = the default), and secrets for `askHidden`. */
function scripted(answers: string[], secrets: string[] = []) {
  const out: string[] = [];
  const asked: string[] = [];
  const hidden: string[] = [];
  const io: SetupIO = {
    say: (l = "") => void out.push(l),
    ask: async (q, fallback) => {
      asked.push(q);
      const a = answers.shift();
      if (a === undefined) throw new Error(`ran out of answers at: ${q}`);
      return a === "" ? (fallback ?? "") : a;
    },
    askHidden: async (q) => {
      hidden.push(q);
      return secrets.shift() ?? "";
    },
  };
  return { io, out, asked, hidden, text: () => out.join("\n") };
}

/** The services as they answer a key check: a key is "good-…" or rejected; "down-…" is unreachable. */
const services: typeof fetch = async (input, init) => {
  const url = String(input);
  const h = new Headers(init?.headers);
  const key =
    h.get("authorization")?.replace("Token ", "") ??
    h.get("xi-api-key") ??
    new URL(url).searchParams.get("key") ??
    "";
  if (key.startsWith("down-")) throw new Error("getaddrinfo ENOTFOUND");
  if (!key.startsWith("good-"))
    return new Response("no", { status: url.includes("googleapis") ? 400 : 401 });
  if (url.includes("/v1/user/subscription"))
    return Response.json({ tier: "creator", character_count: 120, character_limit: 100000 });
  return Response.json({ results: [], photos: [], items: [] });
};

let root: string;
let env: NodeJS.ProcessEnv;
let calls: string[];
const ctx = (extra: Partial<SetupContext> = {}): SetupContext => ({
  env,
  fetch: services,
  installSkill: () => void calls.push("skill"),
  registerMcp: () => (
    calls.push("mcp"),
    { ok: true, message: "Added `flomotion` to Claude Code (all folders)." }
  ),
  ...extra,
});

beforeAll(() => {
  root = tmpProject("setup");
});
afterAll(() => cleanup(root));

const fresh = (name: string) => {
  const dir = join(root, name);
  mkdirSync(dir, { recursive: true });
  env = { FLOMOTION_CONFIG: join(dir, "config.json"), PATH: process.env.PATH } as NodeJS.ProcessEnv;
  calls = [];
  return dir;
};

describe("flomotion setup (guided)", () => {
  it("walks a person through every choice, checks each key with its service, and saves", async () => {
    const dir = fresh("happy");
    const sounds = join(dir, "my-sounds");
    mkdirSync(join(sounds, "Impacts"), { recursive: true });
    makeSound(join(sounds, "Impacts", "Heavy Thud.wav"), { peak: 0.2, seconds: 0.5 });
    makeSound(join(sounds, "Pop.wav"), { peak: 0.1, seconds: 0.3 });
    const t = scripted(
      [
        "2", // voice: ElevenLabs
        "3", // word timings: from ElevenLabs
        "3", // sound effects: both
        sounds, // folder
        "y", // I have the rights
        "n", // google fonts key
        "n", // pexels key
        "y", // install skill
        "y", // add to Claude Code
      ],
      ["good-eleven-key-123", "good-freesound-key-456"],
    );
    const cfg = await runWizard(t.io, ctx());
    expect(cfg.preferences).toMatchObject({
      voice: "elevenlabs",
      transcript: "elevenlabs",
      sounds: "both",
      soundLibrary: sounds,
      soundLibraryRights: true,
    });
    expect(cfg.keys).toEqual({
      elevenlabs: "good-eleven-key-123",
      freesound: "good-freesound-key-456",
    });
    // saved, and only readable by the owner
    expect(readConfig(env).keys.freesound).toBe("good-freesound-key-456");
    expect(statSync(configPath(env)).mode & 0o777).toBe(0o600);
    // the library was indexed
    const idx = JSON.parse(readFileSync(libraryIndexPath(env), "utf8"));
    expect(idx.entries.map((e: any) => e.id).sort()).toEqual(["impacts-heavy-thud", "pop"]);
    // it said what it was doing, checked the keys live, and never printed one
    const text = t.text();
    expect(text).toContain("Checking it with ElevenLabs");
    expect(text).toContain("ElevenLabs creator: 120 of 100000 characters used this period");
    expect(text).toContain("Freesound accepted the key");
    expect(text).toContain("Indexed 2 sound files");
    expect(text).not.toContain("good-eleven-key-123");
    expect(text).not.toContain("good-freesound-key-456");
    expect(text).toContain("goo…23"); // masked
    expect(t.hidden).toHaveLength(2); // keys were asked for without echo
    expect(calls).toEqual(["skill", "mcp"]);
  });

  it("an offered key that is refused can be retried, and only the good one is saved", async () => {
    fresh("retry");
    // voice=ElevenLabs, [bad key] "Try another key?" y, [good key], word timings=ElevenLabs, sounds=Freesound, [no key], no fonts/pexels key, no installs
    const s = scripted(
      ["2", "y", "3", "1", "n", "n", "n", "n"],
      ["bad-eleven", "good-eleven-key", ""],
    );
    const cfg = await runWizard(s.io, ctx());
    expect(s.text()).toContain("ElevenLabs rejected the key (HTTP 401)");
    expect(cfg.keys.elevenlabs).toBe("good-eleven-key");
    expect(s.hidden.length).toBeGreaterThanOrEqual(2);
  });

  it("when the service cannot be reached the person decides whether to keep the key", async () => {
    fresh("down-yes");
    let s = scripted(["2", "y", "3", "1", "n", "n", "n", "n"], ["down-key", ""]);
    let cfg = await runWizard(s.io, ctx());
    expect(s.text()).toContain("saved but not checked");
    expect(cfg.keys.elevenlabs).toBe("down-key");
    fresh("down-no");
    s = scripted(["2", "n", "3", "1", "n", "n", "n", "n"], ["down-key", ""]);
    cfg = await runWizard(s.io, ctx());
    expect(cfg.keys.elevenlabs).toBeUndefined();
  });

  it("works with no keys at all: your own recording, transcript and sounds are the defaults", async () => {
    fresh("no-keys");
    const s = scripted(["", "", "2", "", "n", "n", "n", "n"]); // voice default, transcript default, sounds=own, no folder, ...
    const cfg = await runWizard(s.io, ctx());
    expect(cfg.keys).toEqual({});
    expect(cfg.preferences).toMatchObject({ voice: "recording", transcript: "own", sounds: "own" });
    expect(s.hidden).toEqual([]); // no key was asked for
    expect(s.text()).toContain("Nothing here is required");
    expect(s.text()).toContain("never sent to Claude");
    expect(calls).toEqual([]); // declined both installs
    expect(existsSync(libraryIndexPath(env))).toBe(false);
  });

  it("will not index a sound folder unless the person says they may use it", async () => {
    const dir = fresh("rights");
    const sounds = join(dir, "pack");
    mkdirSync(sounds, { recursive: true });
    makeSound(join(sounds, "boom.wav"), { peak: 0.1, seconds: 0.3 });
    const s = scripted(["", "", "2", sounds, "n", "n", "n", "n", "n"]);
    const cfg = await runWizard(s.io, ctx());
    expect(s.text()).toContain("say yes only if it is true");
    expect(cfg.preferences.soundLibrary).toBeUndefined();
    expect(existsSync(libraryIndexPath(env))).toBe(false);
  });

  it("does not ask again for a key that is already saved", async () => {
    fresh("again");
    writeConfig(
      {
        version: 1,
        keys: { elevenlabs: "good-saved-key", freesound: "good-saved-fs" },
        preferences: { voice: "elevenlabs" },
      },
      env,
    );
    const s = scripted(["2", "", "1", "n", "n", "n", "n"]);
    const cfg = await runWizard(s.io, ctx());
    expect(s.hidden).toEqual([]);
    expect(s.text()).toContain("An ElevenLabs key is already saved");
    expect(cfg.keys).toEqual({ elevenlabs: "good-saved-key", freesound: "good-saved-fs" });
  });

  it("explains what a missing tool means and how to get it", async () => {
    fresh("tools");
    const s = scripted(["", "2", "", "", "n", "n", "n", "n"]);
    await runWizard(s.io, { ...ctx(), env: { ...env, PATH: "" } as NodeJS.ProcessEnv });
    expect(s.text()).toMatch(/Found: FFmpeg (yes|NO), Chrome/);
    expect(s.text()).toContain("brew install whisper-cpp");
  });
});

describe("setup without a terminal", () => {
  it("--yes takes the keys already in the environment, checks and saves them", async () => {
    fresh("env-import");
    const s = scripted([]);
    await importFromEnv(
      s.io,
      ctx({
        env: {
          ...env,
          FREESOUND_API_KEY: "good-from-env",
          PEXELS_API_KEY: "bad-px",
        } as NodeJS.ProcessEnv,
      }),
    );
    expect(s.text()).toContain("Freesound: ✔");
    expect(s.text()).toContain("Pexels: ✖");
    expect(readConfig(env).keys).toEqual({ freesound: "good-from-env" }); // the refused one is not kept
  });

  it("check tests every saved key and reports which are fine", async () => {
    fresh("check");
    writeConfig(
      {
        version: 1,
        keys: { freesound: "good-a", pexels: "bad-b", elevenlabs: "good-c" },
        preferences: {},
      },
      env,
    );
    const s = scripted([]);
    const ok = await checkAll(s.io, ctx());
    expect(ok).toBe(false);
    const text = s.text();
    expect(text).toMatch(/Freesound\s+✔/);
    expect(text).toMatch(/Pexels\s+✖ Pexels rejected the key/);
    expect(text).toMatch(/ElevenLabs\s+✔ ElevenLabs creator: 120 of 100000/);
    expect(text).toMatch(/Google Fonts\s+not set/);
  });

  it("check says plainly that nothing needs a key when none is set", async () => {
    fresh("check-none");
    const s = scripted([]);
    expect(await checkAll(s.io, ctx())).toBe(true);
    expect(s.text()).toContain("Nothing needs one");
  });
});

describe("the flomotion setup subcommands (the bundled CLI)", () => {
  let home: string;
  let cfgFile: string;
  let envs: NodeJS.ProcessEnv;
  const run = (args: string[], input?: string) => {
    try {
      return {
        code: 0,
        out: execFileSync("node", [join(REPO, "packages/cli/dist/bin.mjs"), ...args], {
          encoding: "utf8",
          env: envs,
          input,
          stdio: ["pipe", "pipe", "pipe"],
        }),
      };
    } catch (e) {
      const x = e as { status: number; stdout: string; stderr: string };
      return { code: x.status, out: x.stdout + x.stderr };
    }
  };
  beforeAll(async () => {
    await bundle();
    home = tmpProject("setup-cli");
    cfgFile = join(home, "cfg", "config.json");
    envs = {
      PATH: process.env.PATH,
      HOME: home,
      FLOMOTION_CONFIG: cfgFile,
      HYPERFRAMES_NO_TELEMETRY: "1",
    } as NodeJS.ProcessEnv;
  }, 120_000);
  afterAll(() => cleanup(home));

  it("show works with nothing set and points at the way to work without keys", () => {
    const r = run(["setup", "show"]);
    expect(r.code).toBe(0);
    expect(r.out).toContain("no key");
    expect(r.out).toContain("record the voiceover yourself");
    expect(r.out).toContain(cfgFile);
  });

  it("sounds indexes a folder only with --rights, and then the library is part of the setup", () => {
    const folder = join(home, "sfx");
    mkdirSync(folder, { recursive: true });
    makeSound(join(folder, "Thud Big.wav"), { peak: 0.2, seconds: 0.5 });
    const no = run(["setup", "sounds", folder]);
    expect(no.code).toBe(1);
    expect(no.out).toContain("Say that you may use");
    expect(existsSync(join(home, "cfg", "sound-library.json"))).toBe(false);
    const yes = run(["setup", "sounds", folder, "--rights"]);
    expect(yes.code).toBe(0);
    expect(yes.out).toContain("Indexed 1 sound files");
    expect(readConfig(envs).preferences).toMatchObject({
      soundLibrary: folder,
      sounds: "own",
      soundLibraryRights: true,
    });
    expect(run(["setup", "show"]).out).toContain("your sound library");
  });

  it("set and unset change the saved keys; a wrong name is refused", () => {
    writeConfig({ version: 1, keys: { pexels: "px-1234567890" }, preferences: {} }, envs);
    const un = run(["setup", "unset", "pexels"]);
    expect(un.code).toBe(0);
    expect(readConfig(envs).keys).toEqual({});
    const bad = run(["setup", "unset", "bogus"]);
    expect(bad.code).toBe(1);
    expect(bad.out).toContain("Unknown key");
    expect(run(["setup", "set", "bogus", "x"]).code).toBe(1);
  });

  it("--yes with no keys in the environment saves nothing it should not and does not ask anything", () => {
    const r = run(["setup", "--yes"]);
    expect(r.code).toBe(0);
    expect(r.out).toContain("Saved to");
    expect(readConfig(envs).keys).toEqual({});
  });

  it("the wizard also runs from piped answers (no terminal)", () => {
    const r = run(["setup"], ["", "", "1", "", "n", "n", "n", "n"].join("\n") + "\n");
    expect(r.out).toContain("flomotion setup");
    expect(r.out).toContain("Nothing here is required");
    expect(r.out).toContain("Saved to");
    expect(readConfig(envs).preferences).toMatchObject({
      voice: "recording",
      transcript: "own",
      sounds: "freesound",
    });
  });
});
