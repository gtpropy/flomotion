import { execFileSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { delimiter, dirname, join } from "node:path";
import { findChrome, requireFfmpeg } from "@codecut/render";

/** The services flomotion can use. Keys are optional: every one has a way to work without it. */
export const KEYS = {
  freesound: {
    env: "FREESOUND_API_KEY",
    label: "Freesound",
    unlocks: "search and download sound effects (CC0 and CC-BY)",
    without: "use your own sound effects (a folder or files), see `sound_import`",
    url: "https://freesound.org/apiv2/apply",
    cost: "free",
  },
  elevenlabs: {
    env: "ELEVENLABS_API_KEY",
    label: "ElevenLabs",
    unlocks: "a generated voiceover with word timings (quoted first, spends credits)",
    without:
      "record the voiceover yourself and give flomotion the audio (and its transcript if you have it)",
    url: "https://elevenlabs.io/app/settings/api-keys",
    cost: "paid (credits)",
  },
  googleFonts: {
    env: "GOOGLE_FONTS_API_KEY",
    label: "Google Fonts",
    unlocks: "searching fonts by category, script and axes (downloading a font needs no key)",
    without: "name the font family you want: `font_get` downloads it without a key",
    url: "https://developers.google.com/fonts/docs/developer_api",
    cost: "free",
  },
  pexels: {
    env: "PEXELS_API_KEY",
    label: "Pexels",
    unlocks: "stock photos (free to use commercially, credit appreciated)",
    without: "Openverse photos (no key) or your own screenshots and images",
    url: "https://www.pexels.com/api/",
    cost: "free",
  },
} as const;
export type KeyName = keyof typeof KEYS;
export const KEY_NAMES = Object.keys(KEYS) as KeyName[];

export interface Preferences {
  /** How the voiceover is made. */
  voice?: "recording" | "elevenlabs" | "local-tts";
  /** Where word timings come from. */
  transcript?: "own" | "whisper" | "elevenlabs";
  /** Where sound effects come from. */
  sounds?: "freesound" | "own" | "both";
  /** Folder of the person's own sound effects (indexed by `flomotion setup`). */
  soundLibrary?: string;
  /** The person confirmed they may use the files in `soundLibrary` in videos. */
  soundLibraryRights?: boolean;
}

export interface FlomotionConfig {
  version: 1;
  keys: Partial<Record<KeyName, string>>;
  preferences: Preferences;
}

const empty = (): FlomotionConfig => ({ version: 1, keys: {}, preferences: {} });

/** `$FLOMOTION_CONFIG`, else `$XDG_CONFIG_HOME/flomotion/config.json`, else `~/.config/flomotion/config.json`. */
export function configPath(env: NodeJS.ProcessEnv = process.env): string {
  if (env.FLOMOTION_CONFIG) return env.FLOMOTION_CONFIG;
  const base = env.XDG_CONFIG_HOME || join(env.HOME || homedir(), ".config");
  return join(base, "flomotion", "config.json");
}
export const libraryIndexPath = (env: NodeJS.ProcessEnv = process.env) =>
  join(dirname(configPath(env)), "sound-library.json");

export function readConfig(env: NodeJS.ProcessEnv = process.env): FlomotionConfig {
  const f = configPath(env);
  if (!existsSync(f)) return empty();
  try {
    const j = JSON.parse(readFileSync(f, "utf8")) as Partial<FlomotionConfig>;
    return { version: 1, keys: j.keys ?? {}, preferences: j.preferences ?? {} };
  } catch {
    return empty();
  }
}

/** Write the config readable by you only: it holds API keys. */
export function writeConfig(cfg: FlomotionConfig, env: NodeJS.ProcessEnv = process.env): string {
  const f = configPath(env);
  mkdirSync(dirname(f), { recursive: true, mode: 0o700 });
  writeFileSync(f, JSON.stringify(cfg, null, 2) + "\n", { mode: 0o600 });
  try {
    chmodSync(f, 0o600);
  } catch {
    /* a filesystem without modes */
  }
  return f;
}

/**
 * The environment the server uses: real environment variables win, then the keys saved by `flomotion setup`.
 * Nothing is written back to `process.env`.
 */
export function resolveEnv(
  base: NodeJS.ProcessEnv = process.env,
  cfg: FlomotionConfig = readConfig(base),
): NodeJS.ProcessEnv {
  const out: NodeJS.ProcessEnv = { ...base };
  for (const name of KEY_NAMES) {
    const k = cfg.keys[name];
    if (k && !out[KEYS[name].env]) out[KEYS[name].env] = k;
  }
  return out;
}

/** `abc…xyz`: enough to recognise a key, never enough to use it. */
export const maskKey = (k: string): string =>
  k.length < 10 ? "•".repeat(k.length) : `${k.slice(0, 3)}…${k.slice(-2)}`;

// ---------- checking a key against the real service ----------

export interface KeyCheck {
  ok: boolean;
  /** The service answered and refused the key (as opposed to not being reachable). */
  rejected?: boolean;
  unreachable?: boolean;
  detail: string;
}

export interface CheckBases {
  freesound?: string;
  elevenlabs?: string;
  googleFonts?: string;
  pexels?: string;
}

/** One cheap, read-only request per service. Never spends credits. */
export async function checkKey(
  name: KeyName,
  key: string,
  opts: { fetch?: typeof fetch; bases?: CheckBases } = {},
): Promise<KeyCheck> {
  const f = opts.fetch ?? fetch;
  const b = opts.bases ?? {};
  const get = async (url: string, headers: Record<string, string>) => {
    try {
      return await f(url, { headers, signal: AbortSignal.timeout(15_000) });
    } catch (e) {
      return e instanceof Error ? e : new Error(String(e));
    }
  };
  let res: Response | Error;
  switch (name) {
    case "freesound":
      res = await get(
        `${b.freesound ?? "https://freesound.org"}/apiv2/search/text/?query=test&page_size=1&fields=id`,
        { Authorization: `Token ${key}` },
      );
      break;
    case "elevenlabs":
      res = await get(`${b.elevenlabs ?? "https://api.elevenlabs.io"}/v1/user/subscription`, {
        "xi-api-key": key,
      });
      break;
    case "googleFonts":
      res = await get(
        `${b.googleFonts ?? "https://www.googleapis.com"}/webfonts/v1/webfonts?key=${encodeURIComponent(key)}&family=Inter`,
        {},
      );
      break;
    case "pexels":
      res = await get(`${b.pexels ?? "https://api.pexels.com"}/v1/search?query=desk&per_page=1`, {
        Authorization: key,
      });
      break;
  }
  if (res instanceof Error)
    return {
      ok: false,
      unreachable: true,
      detail: `could not reach ${KEYS[name].label} (${res.message}); the key was saved but not checked`,
    };
  if (res.status === 401 || res.status === 403 || (name === "googleFonts" && res.status === 400))
    return {
      ok: false,
      rejected: true,
      detail: `${KEYS[name].label} rejected the key (HTTP ${res.status})`,
    };
  if (res.status === 429)
    return {
      ok: true,
      detail: `${KEYS[name].label} accepted the key (rate limit reached right now)`,
    };
  if (!res.ok) return { ok: false, detail: `${KEYS[name].label} answered HTTP ${res.status}` };
  if (name === "elevenlabs") {
    try {
      const j = (await res.json()) as {
        tier?: string;
        character_count?: number;
        character_limit?: number;
      };
      if (typeof j.character_limit === "number")
        return {
          ok: true,
          detail: `ElevenLabs ${j.tier ?? "plan"}: ${j.character_count ?? 0} of ${j.character_limit} characters used this period`,
        };
    } catch {
      /* fall through */
    }
  }
  return { ok: true, detail: `${KEYS[name].label} accepted the key` };
}

// ---------- what is available on this machine ----------

const onPath = (bin: string, env: NodeJS.ProcessEnv = process.env): string | undefined => {
  for (const dir of (env.PATH ?? "").split(delimiter)) {
    const p = join(dir, bin);
    if (dir && existsSync(p)) return p;
  }
  return undefined;
};

export interface SetupStatus {
  configFile: string;
  configExists: boolean;
  keys: Record<
    KeyName,
    {
      configured: boolean;
      via: "env" | "config" | null;
      label: string;
      unlocks: string;
      without: string;
      url: string;
      cost: string;
    }
  >;
  preferences: Preferences;
  tools: { ffmpeg: boolean; chrome: boolean; whisper: boolean; claude: boolean };
  /** What the agent can use right now, by job. */
  can: {
    soundEffects: string[];
    voice: string[];
    wordTimings: string[];
    stockPhotos: string[];
    icons: string[];
    capture: boolean;
  };
  /** What is missing for each job and the one step that fixes it. */
  missing: Array<{ job: string; fix: string }>;
}

export function setupStatus(
  baseEnv: NodeJS.ProcessEnv = process.env,
  cfg: FlomotionConfig = readConfig(baseEnv),
  opts: { hasSoundLibrary?: boolean } = {},
): SetupStatus {
  const keys = {} as SetupStatus["keys"];
  for (const n of KEY_NAMES) {
    const k = KEYS[n];
    const viaEnv = !!baseEnv[k.env];
    const viaCfg = !!cfg.keys[n];
    keys[n] = {
      configured: viaEnv || viaCfg,
      via: viaEnv ? "env" : viaCfg ? "config" : null,
      label: k.label,
      unlocks: k.unlocks,
      without: k.without,
      url: k.url,
      cost: k.cost,
    };
  }
  const tools = {
    ffmpeg: (() => {
      try {
        requireFfmpeg();
        return true;
      } catch {
        return false;
      }
    })(),
    chrome: (() => {
      try {
        findChrome();
        return true;
      } catch {
        return false;
      }
    })(),
    whisper: !!(
      onPath("whisper-cli", baseEnv) ||
      onPath("whisper-cpp", baseEnv) ||
      onPath("whisper", baseEnv)
    ),
    claude: !!onPath("claude", baseEnv),
  };
  const lib = opts.hasSoundLibrary ?? !!cfg.preferences.soundLibrary;
  const can = {
    soundEffects: [
      keys.freesound.configured && "Freesound (search and download)",
      "your own sound files (sound_import)",
      lib && "your sound library (setup)",
    ].filter(Boolean) as string[],
    voice: [
      "your own recording (voice_import)",
      process.platform === "darwin" && "macOS say (draft voice)",
      keys.elevenlabs.configured && "ElevenLabs (quote first)",
    ].filter(Boolean) as string[],
    wordTimings: [
      "a transcript or captions file you give (transcript_import)",
      tools.whisper && "local Whisper (transcribe)",
      keys.elevenlabs.configured && "ElevenLabs returns them with the voice",
    ].filter(Boolean) as string[],
    stockPhotos: [
      "Openverse (no key, CC0 and CC-BY only)",
      keys.pexels.configured && "Pexels",
    ].filter(Boolean) as string[],
    icons: ["Iconify (no key): icons, emoji, brand logos with permission"],
    capture: tools.chrome,
  };
  const missing: SetupStatus["missing"] = [];
  if (!tools.ffmpeg)
    missing.push({
      job: "rendering and audio",
      fix: "install FFmpeg (macOS: brew install ffmpeg)",
    });
  if (!tools.chrome)
    missing.push({
      job: "rendering, previews, screenshots",
      fix: "install Google Chrome, or set CHROME_PATH",
    });
  if (!keys.freesound.configured && !lib)
    missing.push({
      job: "sound effects",
      fix: "run `flomotion setup` to add a Freesound key or point it at your own sound folder, or give me files to import",
    });
  if (!keys.elevenlabs.configured && cfg.preferences.voice === "elevenlabs")
    missing.push({
      job: "generated voice",
      fix: "run `flomotion setup` and add the ElevenLabs key, or record the voice yourself",
    });
  if (!tools.whisper && cfg.preferences.transcript === "whisper")
    missing.push({
      job: "transcription",
      fix: "install whisper.cpp (brew install whisper-cpp), or give me a transcript or captions file",
    });
  return {
    configFile: configPath(baseEnv),
    configExists: existsSync(configPath(baseEnv)),
    keys,
    preferences: cfg.preferences,
    tools,
    can,
    missing,
  };
}

export { execFileSync };
