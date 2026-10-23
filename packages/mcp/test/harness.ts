import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { FontDecl } from "@codecut/core";
import {
  formatOf,
  sha256,
  type FontContext,
  type FontSource,
  type FontSyncResult,
} from "@codecut/render";
import { createServer } from "../src/server.js";
import type { Deps } from "../src/context.js";
import {
  ElevenLabsProvider,
  RecordingProvider,
  LocalTtsProvider,
  type Word,
} from "../src/providers/voice.js";
import { FreesoundClient } from "../src/providers/sounds.js";
import { IconifyProvider, OpenverseProvider, PexelsProvider } from "../src/providers/assets.js";
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
export function makeSound(
  file: string,
  opts: { peak: number; seconds: number; freq?: number },
): void {
  mkdirSync(dirname(file), { recursive: true });
  const expr = `sin(2*PI*${opts.freq ?? 220}*t)*exp(-9*abs(t-${opts.peak}))`;
  execFileSync("ffmpeg", [
    "-y",
    "-v",
    "error",
    "-f",
    "lavfi",
    "-i",
    `aevalsrc='${expr}':d=${opts.seconds}:s=44100`,
    "-ac",
    "1",
    file,
  ]);
}

/** A steady tone standing in for speech or music. */
export function makeTone(file: string, seconds: number, freq = 180): void {
  mkdirSync(dirname(file), { recursive: true });
  execFileSync("ffmpeg", [
    "-y",
    "-v",
    "error",
    "-f",
    "lavfi",
    "-i",
    `sine=f=${freq}:d=${seconds}:r=44100`,
    "-ac",
    "1",
    file,
  ]);
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
  {
    id: 9001,
    name: "Heavy thud land",
    license: "http://creativecommons.org/publicdomain/zero/1.0/",
    username: "foleyfan",
    tags: ["thud", "impact"],
    duration: 0.9,
    peak: 0.3,
    description: "A heavy thud, good for landing.",
  },
  {
    id: 9002,
    name: "Whip swish",
    license: "http://creativecommons.org/licenses/by/4.0/",
    username: "swishy",
    tags: ["whip", "swish"],
    duration: 0.7,
    peak: 0.25,
    description: "Fast whip.",
  },
  {
    id: 9003,
    name: "Punch hit",
    license: "http://creativecommons.org/licenses/by-nc/4.0/",
    username: "boxer",
    tags: ["punch", "hit"],
    duration: 0.6,
    peak: 0.2,
    description: "Non-commercial only.",
  },
  {
    id: 9004,
    name: "Soft pop",
    license: "http://creativecommons.org/publicdomain/zero/1.0/",
    username: "popper",
    tags: ["pop", "ui"],
    duration: 0.4,
    peak: 0.1,
    description: "A small pop.",
  },
  {
    id: 9005,
    name: "Cinematic boom",
    license: "http://creativecommons.org/licenses/by/4.0/",
    username: "boomer",
    tags: ["boom", "cinematic", "impact"],
    duration: 1.8,
    peak: 0.5,
    description: "Big boom.",
  },
];

/** A fetch that behaves like the parts of Freesound APIv2 we use. Records every request. */
export function fakeFreesoundFetch(
  root: string,
  log: Array<{ url: string; auth?: string | null }> = [],
): typeof fetch {
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
      if (headers.get("authorization") !== "Token test-key")
        return new Response("no", { status: 401 });
      const words = (u.searchParams.get("query") ?? "").toLowerCase().split(/\s+/).filter(Boolean);
      const m = /duration:\[([\d.]+) TO ([\d.]+)\]/.exec(u.searchParams.get("filter") ?? "");
      const hits = FAKE_SOUNDS.filter((s) =>
        m ? s.duration >= Number(m[1]) && s.duration <= Number(m[2]) : true,
      ).filter((s) =>
        words.some((w) =>
          `${s.name} ${s.tags.join(" ")} ${s.description}`.toLowerCase().includes(w),
        ),
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

// ---------- asset sources test double (Iconify, Openverse, Pexels) ----------

export interface AssetCall {
  url: string;
  auth?: string | null;
}

const SVG = (color = "currentColor") =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" stroke="${color}" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/></g></svg>`;

const ICON_COLLECTIONS: Record<string, Record<string, unknown>> = {
  lucide: {
    name: "Lucide",
    author: { name: "Lucide Contributors", url: "https://github.com/lucide-icons/lucide" },
    license: { title: "ISC", spdx: "ISC", url: "https://example.test/lucide/LICENSE" },
  },
  tabler: {
    name: "Tabler Icons",
    author: { name: "Paweł Kuna", url: "https://github.com/tabler/tabler-icons" },
    license: { title: "MIT", spdx: "MIT", url: "https://example.test/tabler/LICENSE" },
  },
  solar: {
    name: "Solar",
    author: { name: "480 Design", url: "https://example.test/solar" },
    license: {
      title: "CC BY 4.0",
      spdx: "CC-BY-4.0",
      url: "https://creativecommons.org/licenses/by/4.0/",
    },
  },
  bi: {
    name: "Bootstrap-like (test: share-alike)",
    author: { name: "Someone" },
    license: {
      title: "CC BY-SA 4.0",
      spdx: "CC-BY-SA-4.0",
      url: "https://creativecommons.org/licenses/by-sa/4.0/",
    },
  },
  logos: {
    name: "SVG Logos",
    author: { name: "Gil Barbara", url: "https://github.com/gilbarbara/logos" },
    license: { title: "CC0", spdx: "CC0-1.0", url: "https://example.test/logos/LICENSE" },
    palette: true,
  },
};

/** A fetch that behaves like the parts of Iconify, Openverse and Pexels that flomotion uses. Records every request. */
export function fakeAssetFetch(root: string, log: AssetCall[] = []): typeof fetch {
  const dir = join(root, ".asset-fake");
  const photo = (name: string, w: number, h: number) => {
    const f = join(dir, name);
    if (!existsSync(f)) {
      mkdirSync(dir, { recursive: true });
      execFileSync("ffmpeg", [
        "-y",
        "-v",
        "error",
        "-f",
        "lavfi",
        "-i",
        `testsrc2=s=${w}x${h}:d=1`,
        "-frames:v",
        "1",
        f,
      ]);
    }
    return readFileSync(f);
  };
  const OV = [
    {
      id: "11111111-1111-4111-8111-111111111111",
      title: "Laptop on a desk",
      creator: "Dana",
      creator_url: "https://example.test/dana",
      license: "cc0",
      license_version: "1.0",
      license_url: "https://creativecommons.org/publicdomain/zero/1.0/",
      url: "https://img.test/ov1.jpg",
      foreign_landing_url: "https://example.test/p/1",
      attribution: "",
      width: 3000,
      height: 2000,
      filetype: "jpg",
      category: "photograph",
      thumbnail: "https://img.test/t1.jpg",
    },
    {
      id: "22222222-2222-4222-8222-222222222222",
      title: "Team at a whiteboard",
      creator: "Lee",
      creator_url: "https://example.test/lee",
      license: "by",
      license_version: "2.0",
      license_url: "https://creativecommons.org/licenses/by/2.0/",
      url: "https://img.test/ov2.jpg",
      foreign_landing_url: "https://example.test/p/2",
      attribution: '"Team at a whiteboard" by Lee is licensed under CC BY 2.0.',
      width: 1600,
      height: 1000,
      filetype: "jpg",
      category: "photograph",
    },
    {
      id: "33333333-3333-4333-8333-333333333333",
      title: "Share alike photo",
      creator: "Sam",
      license: "by-sa",
      license_version: "2.0",
      license_url: "https://creativecommons.org/licenses/by-sa/2.0/",
      url: "https://img.test/ov3.jpg",
      foreign_landing_url: "https://example.test/p/3",
      attribution: "",
      width: 800,
      height: 600,
      filetype: "jpg",
      category: "photograph",
    },
  ];
  const PX = {
    id: 555,
    url: "https://www.pexels.com/photo/desk-555/",
    photographer: "Pat Pexel",
    photographer_url: "https://www.pexels.com/@pat",
    alt: "A tidy desk with a laptop",
    width: 4000,
    height: 6000,
    src: { original: "https://img.test/px555.jpg", large: "https://img.test/px555-l.jpg" },
  };
  return (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    const headers = new Headers(init?.headers);
    log.push({ url, auth: headers.get("authorization") });
    const u = new URL(url);
    const json = (b: unknown, status = 200) => Response.json(b, { status });
    if (u.host === "iconify.test") {
      if (u.pathname === "/search") {
        const q = (u.searchParams.get("query") ?? "").toLowerCase();
        const prefixes = (u.searchParams.get("prefixes") ?? "").split(",");
        const all = [
          ["lucide", "calendar"],
          ["lucide", "calendar-clock"],
          ["tabler", "calendar"],
          ["solar", "calendar-bold"],
          ["bi", "calendar3"],
          ["logos", "slack"],
          ["logos", "slack-icon"],
        ];
        const icons = all
          .filter(
            ([p, n]) => prefixes.includes(p!) && (n!.includes(q) || q.includes(n!.split("-")[0]!)),
          )
          .map(([p, n]) => `${p}:${n}`);
        const collections = Object.fromEntries(
          [...new Set(icons.map((i) => i.split(":")[0]!))].map((p) => [p, ICON_COLLECTIONS[p]]),
        );
        return json({ icons, total: icons.length, collections });
      }
      if (u.pathname === "/collections") {
        const wanted = (u.searchParams.get("prefixes") ?? "").split(",");
        return json(
          Object.fromEntries(
            wanted.filter((p) => ICON_COLLECTIONS[p]).map((p) => [p, ICON_COLLECTIONS[p]]),
          ),
        );
      }
      const svg = /^\/([a-z0-9-]+)\/([a-z0-9-]+)\.svg$/.exec(u.pathname);
      if (svg)
        return new Response(SVG(u.searchParams.get("color") ?? "currentColor"), {
          headers: { "content-type": "image/svg+xml" },
        });
    }
    if (u.host === "openverse.test") {
      if (u.pathname === "/v1/images/") {
        const lic = (u.searchParams.get("license") ?? "").split(",");
        return json({
          result_count: OV.length,
          results: OV.filter((r) => lic.includes(r.license) || !lic[0]),
        });
      }
      const one = /^\/v1\/images\/([0-9a-f-]{36})\/$/.exec(u.pathname);
      if (one)
        return json(
          OV.find((r) => r.id === one[1]) ?? {},
          OV.some((r) => r.id === one[1]) ? 200 : 404,
        );
    }
    if (u.host === "pexels.test") {
      if (headers.get("authorization") !== "px-key") return new Response("no", { status: 401 });
      if (u.pathname === "/v1/search") return json({ photos: [PX] });
      if (u.pathname === "/v1/photos/555") return json(PX);
    }
    if (u.host === "img.test") {
      const w = u.pathname.includes("px555")
        ? [4000, 6000]
        : u.pathname.includes("ov1")
          ? [3000, 2000]
          : [1600, 1000];
      return new Response(photo(u.pathname.slice(1).replace(/\W/g, "") + ".jpg", w[0]!, w[1]!), {
        headers: { "content-type": "image/jpeg" },
      });
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

export function fakeElevenFetch(
  root: string,
  calls: ElevenCall[] = [],
  accountCalls: Array<{ key: string | null }> = [],
): typeof fetch {
  return (async (input: string | URL | Request, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    if (String(input).endsWith("/v1/user/subscription")) {
      // reading the allowance is free and is not a generation
      accountCalls.push({ key: headers.get("xi-api-key") });
      return Response.json({ tier: "creator", character_count: 1000, character_limit: 100000 });
    }
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
    // Families without their own fixture are served as Inter, so Look fonts resolve offline. Test double only.
    const entries = FONT_FILES[decl.family] ?? [{ file: "inter-400.woff2", weight: 400 }];
    const wanted = entries.filter(
      (e) => typeof e.weight !== "number" || !decl.weights || decl.weights.includes(e.weight),
    );
    const files = (wanted.length ? wanted : entries.slice(0, 1)).map((e) => {
      const dest = join(ctx.cacheDir, decl.id, e.file);
      mkdirSync(dirname(dest), { recursive: true });
      copyFileSync(join(FIXTURES, "fonts", e.file), dest);
      return {
        abs: dest,
        rel: relative(ctx.projectRoot, dest),
        hash: sha256(readFileSync(dest)),
        weight: e.weight,
        style: "normal",
        format: formatOf(dest),
        subset: "latin",
      };
    });
    return {
      files,
      license: {
        license: "OFL-1.1",
        url: "https://openfontlicense.org",
        attributionRequired: false,
        commercialOk: true,
      },
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
    return ws.map((w, i) => ({
      w,
      start: Math.round(i * per * 1000) / 1000,
      end: Math.round((i + 0.9) * per * 1000) / 1000,
    }));
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

/** Renders take minutes; the SDK's 60 s default request timeout is for chatty tools. */
const CALL_OPTIONS = { timeout: 20 * 60_000 };

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
    raw: (name, args = {}) =>
      client.callTool(
        { name, arguments: args },
        undefined,
        CALL_OPTIONS,
      ) as Promise<CallToolResult>,
    call: async (name, args = {}) =>
      parse(
        (await client.callTool(
          { name, arguments: args },
          undefined,
          CALL_OPTIONS,
        )) as CallToolResult,
      ),
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
  const elevenAccount: Array<{ key: string | null }> = [];
  const fonts = new FixtureGoogleSource();
  const fsFetch = fakeFreesoundFetch(root, fsLog);
  const elFetch = fakeElevenFetch(root, eleven, elevenAccount);
  const assetLog: AssetCall[] = [];
  const af = fakeAssetFetch(root, assetLog);
  const deps: Deps = {
    env: {
      // never read the real config of the machine running the tests
      FLOMOTION_CONFIG: join(root, ".no-config.json"),
      FREESOUND_API_KEY: "test-key",
      ELEVENLABS_API_KEY: "el-key",
      ELEVENLABS_USD_PER_1K_CREDITS: "0.30",
    } as NodeJS.ProcessEnv,
    fetch: fsFetch,
    sound: new FreesoundClient({ apiKey: "test-key", fetch: fsFetch }),
    voice: [
      new RecordingProvider(),
      new LocalTtsProvider(),
      new ElevenLabsProvider({
        apiKey: "el-key",
        fetch: elFetch,
        env: { ELEVENLABS_USD_PER_1K_CREDITS: "0.30" } as NodeJS.ProcessEnv,
      }),
    ],
    assetProviders: [
      new IconifyProvider({ fetch: af, base: "https://iconify.test" }),
      new OpenverseProvider({ fetch: af, base: "https://openverse.test" }),
      new PexelsProvider({ key: "px-key", fetch: af, base: "https://pexels.test" }),
    ],
    fontSources: [fonts],
    hfCheck: async () => undefined,
    ...extra,
  };
  return { deps, fsLog, eleven, elevenAccount, fonts, assetLog };
}

export { existsSync, readFileSync, writeFileSync, join, mkdirSync };
