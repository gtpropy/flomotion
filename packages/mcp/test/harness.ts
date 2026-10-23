import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { FontDecl } from "@codecut/core";
import { formatOf, inspectFont, sha256, type FontContext, type FontSource, type FontSyncResult } from "@codecut/render";
import { createServer } from "../src/server.js";
import type { Deps } from "../src/context.js";
import { ElevenLabsProvider, RecordingProvider, LocalTtsProvider, type Word } from "../src/providers/voice.js";
import { FreesoundClient } from "../src/providers/sounds.js";
import type { Transcriber } from "../src/providers/transcribe.js";

export const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
export const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

/** A scratch project folder inside the repo so `@codecut/*` imports resolve. */
export function tmpProject(name: string): string {
  const base = join(REPO, "tests", ".tmp");
  mkdirSync(base, { recursive: true });
  return mkdtempSync(join(base, `${name}-`));
}
export const cleanup = (dir: string) => rmSync(dir, { recursive: true, force: true });

// ---------- audio fixtures ----------

/** A decaying sine whose loudest moment is at `peak` seconds. */
export function makeSound(file: string, opts: { peak: number; seconds: number; freq?: number }): void {
  mkdirSync(dirname(file), { recursive: true });
  const expr = `sin(2*PI*${opts.freq ?? 220}*t)*exp(-9*abs(t-${opts.peak}))`;
  execFileSync("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", `aevalsrc='${expr}':d=${opts.seconds}:s=44100`, "-ac", "1", file]);
}

/** A steady tone standing in for speech or music. */
export function makeTone(file: string, seconds: number, freq = 180): void {
  mkdirSync(dirname(file), { recursive: true });
  execFileSync("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", `sine=f=${freq}:d=${seconds}:r=44100`, "-ac", "1", file]);
}

// ---------- Freesound test double ----------

export interface FakeSound {
  id: number;
  name: string;
  license: string;
  username: string;
  tags: string[];
  duration: number;
  peak: number;
  description?: string;
}

export const FAKE_SOUNDS: FakeSound[] = [
  { id: 9001, name: "Heavy thud land", license: "http://creativecommons.org/publicdomain/zero/1.0/", username: "foleyfan", tags: ["thud", "impact"], duration: 0.9, peak: 0.3, description: "A heavy thud, good for landing." },
  { id: 9002, name: "Whip swish", license: "http://creativecommons.org/licenses/by/4.0/", username: "swishy", tags: ["whip", "swish"], duration: 0.7, peak: 0.25, description: "Fast whip." },
  { id: 9003, name: "Punch hit", license: "http://creativecommons.org/licenses/by-nc/4.0/", username: "boxer", tags: ["punch", "hit"], duration: 0.6, peak: 0.2, description: "Non-commercial only." },
  { id: 9004, name: "Soft pop", license: "http://creativecommons.org/publicdomain/zero/1.0/", username: "popper", tags: ["pop", "ui"], duration: 0.4, peak: 0.1, description: "A small pop." },
  { id: 9005, name: "Cinematic boom", license: "http://creativecommons.org/licenses/by/4.0/", username: "boomer", tags: ["boom", "cinematic", "impact"], duration: 1.8, peak: 0.5, description: "Big boom." },
];

/** A fetch that behaves like the parts of Freesound APIv2 we use. Records every request. */
export function fakeFreesoundFetch(root: string, log: Array<{ url: string; auth?: string | null }> = []): typeof fetch {
  const dir = join(root, ".freesound-fake");
  const audio = (s: FakeSound) => {
    const f = join(dir, `${s.id}.mp3`);
    if (!existsSync(f)) makeSound(f, { peak: s.peak, seconds: s.duration });
    return f;
  };
  const row = (s: FakeSound) => ({
    id: s.id,
    name: s.name,
    tags: s.tags,
    description: s.description ?? "",
    username: s.username,
    license: s.license,
    url: `https://freesound.org/people/${s.username}/sounds/${s.id}/`,
    duration: s.duration,
    previews: { "preview-hq-mp3": `https://cdn.freesound.test/previews/${s.id}-hq.mp3` },
    avg_rating: 4,
    num_downloads: 10,
  });
  return (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    const headers = new Headers(init?.headers);
    log.push({ url, auth: headers.get("authorization") });
    const u = new URL(url);
    if (u.pathname.endsWith("/search/text/")) {
      if (headers.get("authorization") !== "Token test-key") return new Response("no", { status: 401 });
      const words = (u.searchParams.get("query") ?? "").toLowerCase().split(/\s+/).filter(Boolean);
      const m = /duration:\[([\d.]+) TO ([\d.]+)\]/.exec(u.searchParams.get("filter") ?? "");
      const hits = FAKE_SOUNDS.filter((s) => (m ? s.duration >= Number(m[1]) && s.duration <= Number(m[2]) : true)).filter((s) =>
        words.some((w) => `${s.name} ${s.tags.join(" ")} ${s.description}`.toLowerCase().includes(w)),
      );
      return Response.json({ count: hits.length, results: hits.map(row) });
    }
    const one = /\/sounds\/(\d+)\/$/.exec(u.pathname);
    if (one) {
      const s = FAKE_SOUNDS.find((x) => x.id === Number(one[1]));
      return s ? Response.json(row(s)) : new Response("nf", { status: 404 });
    }
    const pv = /\/previews\/(\d+)-hq\.mp3$/.exec(u.pathname);
    if (pv) {
      const s = FAKE_SOUNDS.find((x) => x.id === Number(pv[1]))!;
      return new Response(readFileSync(audio(s)), { status: 200 });
    }
    return new Response("unhandled " + url, { status: 500 });
  }) as typeof fetch;
}

// ---------- ElevenLabs test double ----------

export interface ElevenCall {
  url: string;
  key: string | null;
  body: { text: string; model_id?: string };
}

export function fakeElevenFetch(root: string, calls: ElevenCall[] = []): typeof fetch {
  return (async (input: string | URL | Request, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    const body = JSON.parse(String(init?.body ?? "{}"));
    calls.push({ url: String(input), key: headers.get("xi-api-key"), body });
    const f = join(root, ".eleven-fake", `${calls.length}.mp3`);
    const secs = Math.max(1, Math.round(body.text.length / 15));
    makeTone(f, secs);
    const chars = [...body.text];
    const per = secs / chars.length;
    return Response.json({
      audio_base64: readFileSync(f).toString("base64"),
      alignment: {
        characters: chars,
        character_start_times_seconds: chars.map((_, i) => i * per),
        character_end_times_seconds: chars.map((_, i) => (i + 1) * per),
      },
    });
  }) as typeof fetch;
}

// ---------- font source test double ----------

const FONT_FILES: Record<string, Array<{ file: string; weight: number | [number, number] }>> = {
  "Space Grotesk": [{ file: "space-grotesk-300-700.woff2", weight: [300, 700] }],
  Inter: [
    { file: "inter-400.woff2", weight: 400 },
    { file: "inter-600.woff2", weight: 600 },
  ],
  "Noto Sans Devanagari": [{ file: "noto-deva-400.woff2", weight: 400 }],
};

/** Stands in for Google Fonts: serves real woff2 files from test/fixtures with OFL metadata. No network. */
export class FixtureGoogleSource implements FontSource {
  readonly name = "fixture-google";
  readonly requests: string[] = [];
  matches(decl: FontDecl) {
    return decl.source === "google";
  }
  async sync(decl: FontDecl, ctx: FontContext): Promise<FontSyncResult> {
    this.requests.push(decl.family);
    const entries = FONT_FILES[decl.family];
    if (!entries) throw new Error(`fixture has no font "${decl.family}"`);
    const files = entries
      .filter((e) => typeof e.weight !== "number" || !decl.weights || decl.weights.includes(e.weight))
      .map((e) => {
        const dest = join(ctx.cacheDir, decl.id, e.file);
        mkdirSync(dirname(dest), { recursive: true });
        copyFileSync(join(FIXTURES, "fonts", e.file), dest);
        const info = inspectFont(dest);
        return {
          abs: dest,
          rel: relative(ctx.projectRoot, dest),
          hash: sha256(readFileSync(dest)),
          weight: e.weight,
          style: "normal",
          format: formatOf(dest),
          subset: "latin",
        };
        void info;
      });
    return {
      files,
      license: { license: "OFL-1.1", url: "https://openfontlicense.org", attributionRequired: false, commercialOk: true },
      variable: files.some((f) => Array.isArray(f.weight)),
      axes: files.some((f) => Array.isArray(f.weight)) ? { wght: [300, 700] } : undefined,
      route: "fixture",
    };
  }
}

// ---------- transcriber test double ----------

/** Splits a script evenly over the audio length. Stands in for Whisper. */
export class ScriptTranscriber implements Transcriber {
  readonly name = "script-double";
  calls: string[] = [];
  constructor(
    private readonly script: string,
    private readonly seconds: number,
  ) {}
  async transcribe(file: string): Promise<Word[]> {
    this.calls.push(file);
    const ws = this.script.split(/\s+/).filter(Boolean);
    const per = this.seconds / ws.length;
    return ws.map((w, i) => ({ w, start: Math.round(i * per * 1000) / 1000, end: Math.round((i + 0.9) * per * 1000) / 1000 }));
  }
}

// ---------- client ----------

export interface Harness {
  root: string;
  client: Client;
  /** Call a tool; resolves to the parsed JSON text, or rejects with the typed error object. */
  call<T = any>(name: string, args?: Record<string, unknown>): Promise<T>;
  /** Call a tool and return the raw result (to inspect images, isError). */
  raw(name: string, args?: Record<string, unknown>): Promise<CallToolResult>;
  close(): Promise<void>;
}

export class ToolError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly fix?: string,
    readonly details?: unknown,
  ) {
    super(message);
  }
}

const parse = (r: CallToolResult) => {
  const first = r.content.find((c) => c.type === "text") as { text: string } | undefined;
  const j = first ? JSON.parse(first.text) : undefined;
  if (r.isError) throw new ToolError(j.error.code, j.error.message, j.error.fix, j.error.details);
  return j;
};

/** Connect an MCP client to a CodeCut server through the SDK's in-memory transport. */
export async function connect(root: string, deps: Deps = {}): Promise<Harness> {
  const { server } = createServer(root, deps);
  const [a, b] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test-client", version: "1.0.0" });
  await Promise.all([server.connect(b), client.connect(a)]);
  return {
    root,
    client,
    raw: (name, args = {}) => client.callTool({ name, arguments: args }) as Promise<CallToolResult>,
    call: async (name, args = {}) => parse((await client.callTool({ name, arguments: args })) as CallToolResult),
    close: async () => {
      await client.close();
      await server.close();
    },
  };
}

/** Deps with every external service replaced by a double. */
export function doubles(root: string, extra: Partial<Deps> = {}) {
  const fsLog: Array<{ url: string; auth?: string | null }> = [];
  const eleven: ElevenCall[] = [];
  const fonts = new FixtureGoogleSource();
  const fsFetch = fakeFreesoundFetch(root, fsLog);
  const elFetch = fakeElevenFetch(root, eleven);
  const deps: Deps = {
    env: { FREESOUND_API_KEY: "test-key", ELEVENLABS_API_KEY: "el-key", ELEVENLABS_USD_PER_1K_CREDITS: "0.30" } as NodeJS.ProcessEnv,
    fetch: fsFetch,
    sound: new FreesoundClient({ apiKey: "test-key", fetch: fsFetch }),
    voice: [new RecordingProvider(), new LocalTtsProvider(), new ElevenLabsProvider({ apiKey: "el-key", fetch: elFetch, env: { ELEVENLABS_USD_PER_1K_CREDITS: "0.30" } as NodeJS.ProcessEnv })],
    fontSources: [fonts],
    hfCheck: async () => undefined,
    ...extra,
  };
  return { deps, fsLog, eleven, fonts };
}

export { existsSync, readFileSync, writeFileSync, join, mkdirSync };
