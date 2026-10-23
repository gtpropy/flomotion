import { afterAll, beforeAll, describe, expect, it } from "vitest";
import http from "node:http";
import { mkdtempSync, rmSync, statSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import {
  KEYS,
  KEY_NAMES,
  checkKey,
  configPath,
  maskKey,
  readConfig,
  resolveEnv,
  setupStatus,
  writeConfig,
} from "../src/config.js";
import { cleanup, connect, doubles, tmpProject } from "./harness.js";

let dir: string;
beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "flomotion-cfg-"));
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe("where the config lives and who can read it", () => {
  it("resolves FLOMOTION_CONFIG, then XDG_CONFIG_HOME, then ~/.config", () => {
    expect(configPath({ FLOMOTION_CONFIG: "/x/c.json" } as NodeJS.ProcessEnv)).toBe("/x/c.json");
    expect(configPath({ XDG_CONFIG_HOME: "/xdg", HOME: "/h" } as NodeJS.ProcessEnv)).toBe(
      "/xdg/flomotion/config.json",
    );
    expect(configPath({ HOME: "/h" } as NodeJS.ProcessEnv)).toBe(
      "/h/.config/flomotion/config.json",
    );
  });
  it("writes the file readable by the owner only, and reads it back", () => {
    const env = { FLOMOTION_CONFIG: join(dir, "a", "b", "config.json") } as NodeJS.ProcessEnv;
    expect(readConfig(env)).toEqual({ version: 1, keys: {}, preferences: {} });
    writeConfig(
      { version: 1, keys: { freesound: "abc123456789" }, preferences: { voice: "recording" } },
      env,
    );
    expect(statSync(configPath(env)).mode & 0o777).toBe(0o600);
    expect(statSync(join(dir, "a", "b")).mode & 0o777).toBe(0o700);
    expect(readConfig(env).keys.freesound).toBe("abc123456789");
    expect(readConfig(env).preferences.voice).toBe("recording");
  });
  it("survives a damaged file", () => {
    const f = join(dir, "bad.json");
    writeFileSync(f, "{ not json");
    expect(readConfig({ FLOMOTION_CONFIG: f } as NodeJS.ProcessEnv)).toEqual({
      version: 1,
      keys: {},
      preferences: {},
    });
  });
  it("masks keys so the screen never shows one", () => {
    expect(maskKey("sk_1234567890abcdef")).toBe("sk_…ef");
    expect(maskKey("short")).toBe("•••••");
  });
});

describe("the environment the tools use", () => {
  const cfg = {
    version: 1 as const,
    keys: { freesound: "from-file", pexels: "px-file" },
    preferences: {},
  };
  it("real environment variables win over saved keys, and saved keys fill the gaps", () => {
    const env = resolveEnv({ FREESOUND_API_KEY: "from-env" } as NodeJS.ProcessEnv, cfg);
    expect(env.FREESOUND_API_KEY).toBe("from-env");
    expect(env.PEXELS_API_KEY).toBe("px-file");
    expect(env.ELEVENLABS_API_KEY).toBeUndefined();
  });
  it("does not change process.env", () => {
    const before = process.env.PEXELS_API_KEY;
    resolveEnv({} as NodeJS.ProcessEnv, cfg);
    expect(process.env.PEXELS_API_KEY).toBe(before);
  });
  it("covers every key the setup knows", () => {
    expect(KEY_NAMES).toEqual(["freesound", "elevenlabs", "googleFonts", "pexels"]);
    for (const n of KEY_NAMES) {
      expect(KEYS[n].env).toMatch(/_KEY$/);
      expect(KEYS[n].without.length).toBeGreaterThan(10); // every key says how to work without it
    }
  });
});

describe("checking a key against the service (a local server stands in)", () => {
  let server: http.Server;
  let base: string;
  const seen: Array<{ url: string; auth?: string; xi?: string }> = [];
  beforeAll(async () => {
    server = http.createServer((req, res) => {
      seen.push({
        url: req.url!,
        auth: req.headers.authorization,
        xi: req.headers["xi-api-key"] as string | undefined,
      });
      const u = new URL(req.url!, "http://x");
      const json = (code: number, body: unknown) => (
        res.writeHead(code, { "content-type": "application/json" }),
        res.end(JSON.stringify(body))
      );
      if (u.pathname === "/apiv2/search/text/")
        return req.headers.authorization === "Token good"
          ? json(200, { results: [] })
          : req.headers.authorization === "Token slow"
            ? json(429, {})
            : json(401, {});
      if (u.pathname === "/v1/user/subscription")
        return req.headers["xi-api-key"] === "good"
          ? json(200, { tier: "creator", character_count: 120, character_limit: 100000 })
          : json(401, {});
      if (u.pathname === "/webfonts/v1/webfonts")
        return u.searchParams.get("key") === "good"
          ? json(200, { items: [] })
          : json(400, { error: { message: "API key not valid" } });
      if (u.pathname === "/v1/search")
        return req.headers.authorization === "good" ? json(200, { photos: [] }) : json(401, {});
      json(404, {});
    });
    await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });
  afterAll(() => server.close());
  const bases = () => ({ freesound: base, elevenlabs: base, googleFonts: base, pexels: base });

  it("accepts a good Freesound key and sends it as a Token header", async () => {
    const r = await checkKey("freesound", "good", { bases: bases() });
    expect(r).toMatchObject({ ok: true });
    expect(seen.find((s) => s.url.startsWith("/apiv2/search/text/"))!.auth).toBe("Token good");
  });
  it("rejects a bad key and says the service refused it", async () => {
    const r = await checkKey("freesound", "bad", { bases: bases() });
    expect(r).toMatchObject({ ok: false, rejected: true });
    expect(r.detail).toContain("rejected the key (HTTP 401)");
  });
  it("treats a rate limit as the key being fine", async () => {
    expect((await checkKey("freesound", "slow", { bases: bases() })).ok).toBe(true);
  });
  it("shows the ElevenLabs allowance and only reads (never generates)", async () => {
    const r = await checkKey("elevenlabs", "good", { bases: bases() });
    expect(r.detail).toBe("ElevenLabs creator: 120 of 100000 characters used this period");
    expect(seen.filter((s) => s.url.includes("text-to-speech"))).toHaveLength(0);
    expect(seen.find((s) => s.url === "/v1/user/subscription")!.xi).toBe("good");
    expect((await checkKey("elevenlabs", "bad", { bases: bases() })).rejected).toBe(true);
  });
  it("checks Google Fonts (HTTP 400 means a bad key) and Pexels (raw key in Authorization)", async () => {
    expect((await checkKey("googleFonts", "good", { bases: bases() })).ok).toBe(true);
    expect((await checkKey("googleFonts", "bad", { bases: bases() })).rejected).toBe(true);
    expect((await checkKey("pexels", "good", { bases: bases() })).ok).toBe(true);
    expect(seen.find((s) => s.url.startsWith("/v1/search"))!.auth).toBe("good");
    expect((await checkKey("pexels", "bad", { bases: bases() })).rejected).toBe(true);
  });
  it("says so when the service cannot be reached, so the key can still be saved", async () => {
    const r = await checkKey("freesound", "x", { bases: { freesound: "http://127.0.0.1:1" } });
    expect(r).toMatchObject({ ok: false, unreachable: true });
    expect(r.detail).toContain("saved but not checked");
  });
});

describe("setup status: what can be done, and what is missing", () => {
  it("lists a way to do every job even with no keys, and names what is missing", () => {
    const s = setupStatus({ PATH: "" } as NodeJS.ProcessEnv, {
      version: 1,
      keys: {},
      preferences: { voice: "elevenlabs", transcript: "whisper" },
    });
    expect(s.can.soundEffects.join()).toContain("your own sound files");
    expect(s.can.voice.join()).toContain("your own recording");
    expect(s.can.wordTimings.join()).toContain("transcript or captions file you give");
    expect(s.can.stockPhotos.join()).toContain("Openverse");
    expect(s.can.icons.join()).toContain("Iconify");
    const jobs = s.missing.map((m) => m.job);
    expect(jobs).toEqual(
      expect.arrayContaining(["sound effects", "generated voice", "transcription"]),
    );
    expect(s.keys.elevenlabs).toMatchObject({ configured: false, via: null });
  });
  it("reports where each key comes from and never includes the key", () => {
    const cfg = { version: 1 as const, keys: { freesound: "SECRET-FILE-KEY" }, preferences: {} };
    const s = setupStatus(
      { ELEVENLABS_API_KEY: "SECRET-ENV-KEY", PATH: "" } as NodeJS.ProcessEnv,
      cfg,
    );
    expect(s.keys.freesound).toMatchObject({ configured: true, via: "config" });
    expect(s.keys.elevenlabs).toMatchObject({ configured: true, via: "env" });
    expect(JSON.stringify(s)).not.toContain("SECRET");
  });
});

describe("the setup_status tool", () => {
  it("tells the agent what exists and what to ask the person, without any key", async () => {
    const root = tmpProject("setup-status");
    const d = doubles(root);
    const cfgFile = join(root, "cfg.json");
    writeConfig(
      {
        version: 1,
        keys: { pexels: "PX-SECRET-IN-FILE" },
        preferences: { transcript: "own", sounds: "own" },
      },
      { FLOMOTION_CONFIG: cfgFile } as NodeJS.ProcessEnv,
    );
    const h = await connect(root, {
      ...d.deps,
      env: {
        ...d.deps.env,
        FLOMOTION_CONFIG: cfgFile,
        FREESOUND_API_KEY: "FS-SECRET-ENV",
      } as NodeJS.ProcessEnv,
    });
    try {
      const r = await h.call("setup_status");
      expect(r.keys.freesound).toMatchObject({ configured: true, via: "env" });
      expect(r.keys.pexels).toMatchObject({ configured: true, via: "config" });
      expect(r.keys.elevenlabs.configured).toBe(true); // the double's env has one
      expect(JSON.stringify(r)).not.toMatch(/SECRET/);
      expect(r.preferences).toMatchObject({ transcript: "own" });
      expect(r.assetSources.map((s: any) => s.name)).toEqual(["iconify", "openverse", "pexels"]);
      expect(r.can.wordTimings.join()).toContain("transcript_import");
      expect(r.setup).toContain("flomotion setup");
      expect(r.setup).toContain("must not ask them to paste a key");
      expect(r.tools.ffmpeg).toBe(true);
    } finally {
      await h.close();
      cleanup(root);
    }
  });
  it("sees saved keys in the tools: a Pexels key in the config adds the Pexels source", async () => {
    const root = tmpProject("saved-keys");
    const cfgFile = join(root, "cfg.json");
    writeConfig({ version: 1, keys: { pexels: "saved-px" }, preferences: {} }, {
      FLOMOTION_CONFIG: cfgFile,
    } as NodeJS.ProcessEnv);
    const h = await connect(root, { env: { FLOMOTION_CONFIG: cfgFile } as NodeJS.ProcessEnv });
    try {
      const r = await h.call("setup_status");
      expect(r.assetSources.map((s: any) => s.name)).toEqual(["iconify", "openverse", "pexels"]);
      expect(r.keys.pexels.via).toBe("config");
      expect(existsSync(cfgFile)).toBe(true);
    } finally {
      await h.close();
      cleanup(root);
    }
  });
});
