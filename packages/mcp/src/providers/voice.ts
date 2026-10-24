import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join, relative } from "node:path";
import { FlomotionError, upsertEntry, type LedgerEntry } from "@flomotion/core";
import { ledgerPath, probeMedia, readLedger, requireFfmpeg } from "@flomotion/render";
import type { ProjectStore } from "../store.js";

export interface Word {
  w: string;
  start: number;
  end: number;
}

export type VoiceProviderId = "recording" | "local-tts" | "elevenlabs";

export interface VoiceRequest {
  provider: VoiceProviderId;
  /** The words to speak (ignored by `recording`, which imports a file). */
  text: string;
  /** recording: path of the file in the project. local-tts: system voice name. elevenlabs: voice id. */
  voice?: string;
  /** elevenlabs model id (default eleven_multilingual_v2). */
  model?: string;
  /** elevenlabs delivery: lower stability and higher style are more expressive. Omitted fields use the voice's own defaults. */
  voiceSettings?: VoiceSettings;
}

export interface VoiceSettings {
  /** 0..1. Lower = more varied and energetic, higher = steadier. */
  stability?: number;
  /** 0..1. How closely it keeps to the original voice. */
  similarity?: number;
  /** 0..1. Style exaggeration (eleven_multilingual_v2 and later; costs a little latency). */
  style?: number;
  /** 0.7..1.2. */
  speed?: number;
  speakerBoost?: boolean;
}

/** The ElevenLabs request field names for `VoiceSettings`; undefined fields are left out. */
export function elevenVoiceSettings(
  v?: VoiceSettings,
): Record<string, number | boolean> | undefined {
  if (!v) return undefined;
  const out: Record<string, number | boolean> = {};
  if (v.stability !== undefined) out.stability = v.stability;
  if (v.similarity !== undefined) out.similarity_boost = v.similarity;
  if (v.style !== undefined) out.style = v.style;
  if (v.speed !== undefined) out.speed = v.speed;
  if (v.speakerBoost !== undefined) out.use_speaker_boost = v.speakerBoost;
  return Object.keys(out).length ? out : undefined;
}

export interface VoiceQuote {
  quoteId: string;
  provider: VoiceProviderId;
  request: VoiceRequest;
  characters: number;
  /** Provider credits this would use (0 = free). */
  credits: number;
  /** Money estimate when a rate is configured; otherwise undefined. */
  usd?: number;
  /** True when running it spends money or credits, so `confirm: true` is required. */
  spends: boolean;
  assumptions: string[];
}

export interface GeneratedVoice {
  /** Project-relative audio file. */
  file: string;
  words?: Word[];
  duration: number;
}

/** What a provider must do. Providers never touch the project directly; the service writes files and the ledger. */
export interface VoiceProvider {
  readonly id: VoiceProviderId;
  quote(req: VoiceRequest): Omit<VoiceQuote, "quoteId" | "provider" | "request" | "characters">;
  /** Produce audio at `dest` (absolute) and optionally word timings. */
  generate(req: VoiceRequest, dest: string, ctx: { root: string }): Promise<{ words?: Word[] }>;
  /** File extension of the output. */
  ext(req: VoiceRequest): string;
}

// ---------- providers ----------

/** A recording the user supplies. Free; the file is imported into the project. */
export class RecordingProvider implements VoiceProvider {
  readonly id = "recording" as const;
  quote(req: VoiceRequest) {
    const ok = !!req.voice;
    return {
      credits: 0,
      spends: false,
      assumptions: [
        ok
          ? `Imports ${req.voice}. No cost.`
          : "Set `voice` to the path of your recording (inside the project folder).",
      ],
    };
  }
  ext(req: VoiceRequest) {
    return extname(req.voice ?? ".wav") || ".wav";
  }
  async generate(req: VoiceRequest, dest: string, ctx: { root: string }) {
    if (!req.voice)
      throw new FlomotionError("asset_missing", "No recording path given", {
        fix: "Pass voice: 'recordings/voice.wav'.",
      });
    const src = join(ctx.root, req.voice);
    if (!existsSync(src))
      throw new FlomotionError("asset_missing", `Recording not found: ${req.voice}`);
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(src, dest);
    return {};
  }
}

/**
 * Local text to speech. Documented stub: uses macOS `say` when present (free, robotic, for timing drafts only).
 * On Linux/Windows install a TTS engine (piper or espeak-ng) and use the `recording` provider with its output.
 */
export class LocalTtsProvider implements VoiceProvider {
  readonly id = "local-tts" as const;
  quote() {
    return {
      credits: 0,
      spends: false,
      assumptions: [
        "Free, runs on this machine with macOS `say`. Quality is for timing drafts, not delivery.",
      ],
    };
  }
  ext() {
    return ".wav";
  }
  async generate(req: VoiceRequest, dest: string) {
    if (process.platform !== "darwin")
      throw new FlomotionError(
        "missing_dependency",
        "The local TTS stub only supports macOS `say`",
        {
          fix: "Install piper or espeak-ng, render the script to a file, and use provider 'recording'.",
        },
      );
    requireFfmpeg();
    mkdirSync(dirname(dest), { recursive: true });
    const tmp = dest.replace(/\.wav$/, ".aiff");
    execFileSync("say", [...(req.voice ? ["-v", req.voice] : []), "-o", tmp, req.text]);
    execFileSync("ffmpeg", ["-y", "-v", "error", "-i", tmp, "-ar", "44100", "-ac", "1", dest]);
    return {};
  }
}

const ELEVEN_BASE = "https://api.elevenlabs.io/v1";

/** ElevenLabs text to speech with character timestamps (converted to word timings). Quote first, then confirm. */
export class ElevenLabsProvider implements VoiceProvider {
  readonly id = "elevenlabs" as const;
  constructor(
    private readonly opts: { apiKey?: string; fetch?: typeof fetch; env?: NodeJS.ProcessEnv } = {},
  ) {}
  private get env() {
    return this.opts.env ?? process.env;
  }
  quote(req: VoiceRequest) {
    const model = req.model ?? "eleven_multilingual_v2";
    const perChar = Number(
      this.env.ELEVENLABS_CREDITS_PER_CHAR ?? (/flash|turbo/.test(model) ? 0.5 : 1),
    );
    const credits = Math.ceil(req.text.length * perChar);
    const usdRate = this.env.ELEVENLABS_USD_PER_1K_CREDITS;
    return {
      credits,
      usd: usdRate ? Math.round((credits / 1000) * Number(usdRate) * 100) / 100 : undefined,
      spends: true,
      assumptions: [
        `Estimate: ${perChar} credit per character for ${model} (flash/turbo models are about half; ElevenLabs does not publish this in the API docs we checked, so verify on your plan).`,
        usdRate
          ? `USD uses your ELEVENLABS_USD_PER_1K_CREDITS=${usdRate}.`
          : "No USD estimate: set ELEVENLABS_USD_PER_1K_CREDITS to your plan's price per 1000 credits.",
        "Regenerating the same text spends credits again.",
      ],
    };
  }
  ext() {
    return ".mp3";
  }
  /** The account's character allowance, from `GET /v1/user/subscription`. Read-only; never spends anything. */
  async account(): Promise<
    { tier?: string; used: number; limit: number; remaining: number } | undefined
  > {
    const key = this.opts.apiKey ?? this.env.ELEVENLABS_API_KEY;
    if (!key) return undefined;
    try {
      const res = await (this.opts.fetch ?? fetch)(`${ELEVEN_BASE}/user/subscription`, {
        headers: { "xi-api-key": key },
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) return undefined;
      const j = (await res.json()) as {
        tier?: string;
        character_count?: number;
        character_limit?: number;
      };
      if (typeof j.character_limit !== "number") return undefined;
      const used = j.character_count ?? 0;
      return {
        tier: j.tier,
        used,
        limit: j.character_limit,
        remaining: Math.max(0, j.character_limit - used),
      };
    } catch {
      return undefined;
    }
  }
  async generate(req: VoiceRequest, dest: string) {
    const key = this.opts.apiKey ?? this.env.ELEVENLABS_API_KEY;
    if (!key)
      throw new FlomotionError("missing_dependency", "ELEVENLABS_API_KEY is not set", {
        fix: "Export ELEVENLABS_API_KEY, or use provider 'recording' with your own file.",
      });
    if (!req.voice)
      throw new FlomotionError("invalid_edit", "ElevenLabs needs a voice id", {
        fix: "Pass voice: '<voice_id>'.",
      });
    const res = await (this.opts.fetch ?? fetch)(
      `${ELEVEN_BASE}/text-to-speech/${encodeURIComponent(req.voice)}/with-timestamps?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: { "xi-api-key": key, "Content-Type": "application/json" },
        body: JSON.stringify({
          text: req.text,
          model_id: req.model ?? "eleven_multilingual_v2",
          ...(elevenVoiceSettings(req.voiceSettings)
            ? { voice_settings: elevenVoiceSettings(req.voiceSettings) }
            : {}),
        }),
      },
    );
    if (!res.ok)
      throw new FlomotionError("render_failed", `ElevenLabs returned ${res.status}`, {
        fix:
          res.status === 401 ? "Check ELEVENLABS_API_KEY." : "Check the voice id and your credits.",
      });
    const j = (await res.json()) as {
      audio_base64: string;
      alignment?: {
        characters: string[];
        character_start_times_seconds: number[];
        character_end_times_seconds: number[];
      };
    };
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, Buffer.from(j.audio_base64, "base64"));
    return { words: j.alignment ? wordsFromCharacters(j.alignment) : undefined };
  }
}

/** Group character timings into word timings. */
export function wordsFromCharacters(a: {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}): Word[] {
  const out: Word[] = [];
  let cur = "";
  let start = 0;
  let end = 0;
  const flush = () => {
    if (cur) out.push({ w: cur, start: round(start), end: round(end) });
    cur = "";
  };
  a.characters.forEach((ch, i) => {
    if (/\s/.test(ch)) return flush();
    if (!cur) start = a.character_start_times_seconds[i]!;
    cur += ch;
    end = a.character_end_times_seconds[i]!;
  });
  flush();
  return out;
}
const round = (n: number) => Math.round(n * 1000) / 1000;

// ---------- service ----------

export class VoiceService {
  private readonly providers: Map<VoiceProviderId, VoiceProvider>;
  constructor(
    private readonly store: ProjectStore,
    providers: VoiceProvider[] = [
      new RecordingProvider(),
      new LocalTtsProvider(),
      new ElevenLabsProvider(),
    ],
  ) {
    this.providers = new Map(providers.map((p) => [p.id, p]));
  }

  private get quotesFile() {
    return join(this.store.dir, "quotes.json");
  }
  private quotes(): Record<string, VoiceQuote & { used?: boolean }> {
    return existsSync(this.quotesFile) ? JSON.parse(readFileSync(this.quotesFile, "utf8")) : {};
  }

  /** What the account can afford, for providers that can say (ElevenLabs). */
  async account(id: string) {
    const p = this.providers.get(id as VoiceProviderId) as
      { account?: () => Promise<unknown> } | undefined;
    return p?.account
      ? ((await p.account()) as
          { tier?: string; used: number; limit: number; remaining: number } | undefined)
      : undefined;
  }

  private provider(id: string): VoiceProvider {
    const p = this.providers.get(id as VoiceProviderId);
    if (!p)
      throw new FlomotionError("invalid_edit", `Unknown voice provider "${id}"`, {
        fix: `Providers: ${[...this.providers.keys()].join(", ")}`,
      });
    return p;
  }

  /** Price a generation. Never spends anything. */
  quote(req: VoiceRequest): VoiceQuote {
    const p = this.provider(req.provider);
    const body = p.quote(req);
    const quoteId = createHash("sha256").update(JSON.stringify(req)).digest("hex").slice(0, 12);
    const q: VoiceQuote = {
      quoteId,
      provider: req.provider,
      request: req,
      characters: req.text.length,
      ...body,
    };
    const all = this.quotes();
    all[quoteId] = { ...q, used: all[quoteId]?.used };
    mkdirSync(dirname(this.quotesFile), { recursive: true });
    writeFileSync(this.quotesFile, JSON.stringify(all, null, 2) + "\n");
    return q;
  }

  /** Run a quote. Paid providers refuse unless `confirm` is exactly true. */
  async generate(a: { quoteId: string; confirm?: boolean; id?: string }): Promise<{
    file: string;
    wordsFile?: string;
    duration: number;
    words?: number;
    quote: VoiceQuote;
  }> {
    const q = this.quotes()[a.quoteId];
    if (!q)
      throw new FlomotionError("quote_required", `No quote "${a.quoteId}"`, {
        fix: "Call voice_quote first, show the price to the user, then call voice_generate with confirm:true.",
      });
    if (q.spends && a.confirm !== true)
      throw new FlomotionError(
        "quote_required",
        `This spends about ${q.credits} ${q.provider} credits${q.usd !== undefined ? ` (~$${q.usd})` : ""}. Nothing was run.`,
        {
          fix: "Show the quote to the user. Only after they agree, call voice_generate again with confirm:true.",
        },
      );
    const p = this.provider(q.provider);
    const id = (a.id ?? "voice").replace(/[^\w-]/g, "_");
    const rel = join("assets", "voice", `${id}${p.ext(q.request)}`);
    const dest = this.store.path(rel);
    const out = await p.generate(q.request, dest, { root: this.store.root });
    const info = probeMedia(dest);
    if (!info?.hasAudio) throw new FlomotionError("asset_missing", "The voice file is not audio");
    let wordsFile: string | undefined;
    if (out.words?.length) {
      wordsFile = join("assets", "voice", `${id}.words.json`);
      writeFileSync(this.store.path(wordsFile), JSON.stringify(out.words, null, 2) + "\n");
    }
    const entry: LedgerEntry = {
      source: q.provider,
      kind: "voice",
      id,
      file: rel,
      hash: createHash("sha256").update(readFileSync(dest)).digest("hex"),
      license:
        q.provider === "recording"
          ? "user-supplied"
          : q.provider === "elevenlabs"
            ? "ElevenLabs generated (terms of your plan)"
            : "local TTS",
      attributionRequired: false,
      commercialOk:
        q.provider === "recording" ||
        q.provider === "local-tts" ||
        process.env.ELEVENLABS_COMMERCIAL_OK === "1",
      duration: info.duration,
      title: q.request.text.slice(0, 60),
    };
    writeFileSync(
      ledgerPath(this.store.root),
      JSON.stringify(upsertEntry(readLedger(this.store.root), entry), null, 2) + "\n",
    );
    const all = this.quotes();
    all[a.quoteId] = { ...q, used: true };
    writeFileSync(this.quotesFile, JSON.stringify(all, null, 2) + "\n");
    return { file: rel, wordsFile, duration: info.duration, words: out.words?.length, quote: q };
  }
}

export { basename, relative };
