import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import { CodeCutError, upsertEntry, type LedgerEntry } from "@codecut/core";
import { ledgerPath, measurePeakTime, probeMedia, readLedger } from "@codecut/render";
import type { ProjectStore } from "../store.js";

// ---------- tags ----------

export interface SoundTagInfo {
  /** What the tag is for. */
  job: string;
  /** Freesound query terms. */
  query: string;
  /** Sensible length in seconds [min, max]. */
  duration: [number, number];
}

/** Sound tags by job. Effects with a `sound` tag use these through `autoSound`. */
export const SOUND_TAGS: Record<string, SoundTagInfo> = {
  "ui/pop": { job: "A small element appears", query: "pop bubble ui", duration: [0.03, 0.8] },
  "ui/tap": { job: "A tap or press", query: "tap click soft ui", duration: [0.02, 0.6] },
  "ui/tick": {
    job: "A counter step or tiny tick",
    query: "tick clock tiny",
    duration: [0.01, 0.4],
  },
  "move/whip": { job: "A fast move or whip pan", query: "whip swish fast", duration: [0.1, 1.2] },
  "move/whoosh-deep": {
    job: "A big slow move",
    query: "whoosh deep cinematic",
    duration: [0.4, 2.5],
  },
  "hit/land": { job: "A heavy element lands", query: "thud land impact", duration: [0.1, 1.5] },
  "hit/punch": { job: "A sharp hit", query: "punch hit impact", duration: [0.05, 1.0] },
  "hit/boom": {
    job: "A big boom for a reveal",
    query: "boom impact cinematic",
    duration: [0.5, 4],
  },
  "tech/click": { job: "A UI click", query: "click mouse button", duration: [0.01, 0.5] },
  "tech/data": { job: "Data or numbers appear", query: "data beep computer", duration: [0.1, 2] },
  "tech/glass": { job: "A bright glassy accent", query: "glass ping", duration: [0.2, 2.5] },
  "tech/success": { job: "A success moment", query: "success chime ui", duration: [0.3, 2.5] },
  "tech/glitch": { job: "A glitch or error", query: "glitch digital", duration: [0.1, 1.5] },
};

export const isSoundTag = (t: string | undefined): t is keyof typeof SOUND_TAGS =>
  !!t && t in SOUND_TAGS;

// ---------- licences ----------

export type LicenseClass = "CC0" | "CC-BY" | "CC-BY-NC" | "other";

/** Freesound reports a licence name or a Creative Commons URL; map both to a class. */
export function classifyLicense(raw: string): LicenseClass {
  const s = raw.toLowerCase();
  if (/publicdomain\/zero|creative commons 0|\bcc0\b/.test(s)) return "CC0";
  if (/by-nc|noncommercial|non-commercial/.test(s)) return "CC-BY-NC";
  if (/sampling/.test(s)) return "other";
  if (/licenses\/by\/|^attribution$|\bcc-by\b/.test(s)) return "CC-BY";
  return "other";
}

export const licenseLabel = (c: LicenseClass, raw: string) =>
  c === "CC0" ? "CC0-1.0" : c === "CC-BY" ? (/\/3\.0/.test(raw) ? "CC-BY-3.0" : "CC-BY-4.0") : raw;

// ---------- provider interface ----------

export interface SoundHit {
  id: string;
  name: string;
  tags: string[];
  description: string;
  author: string;
  /** Raw licence string from the source. */
  license: string;
  url: string;
  duration: number;
  /** URL of the audio file we may download (a preview when only an API key is available). */
  audioUrl?: string;
  /** Local file, for catalogues on disk. */
  localFile?: string;
  rating?: number;
  downloads?: number;
}

export interface SoundQuery {
  query: string;
  tags?: string[];
  duration?: [number, number];
  limit?: number;
}

export interface SoundProvider {
  readonly name: string;
  search(q: SoundQuery): Promise<SoundHit[]>;
  get(id: string): Promise<SoundHit>;
  /** Write the audio file to `dest`. */
  download(hit: SoundHit, dest: string): Promise<void>;
}

const FIELDS =
  "id,name,tags,description,username,license,url,duration,previews,avg_rating,num_downloads";

interface FsSound {
  id: number;
  name: string;
  tags?: string[];
  description?: string;
  username?: string;
  license: string;
  url: string;
  duration: number;
  previews?: Record<string, string>;
  avg_rating?: number;
  num_downloads?: number;
}

const toHit = (s: FsSound): SoundHit => ({
  id: String(s.id),
  name: s.name,
  tags: s.tags ?? [],
  description: s.description ?? "",
  author: s.username ?? "unknown",
  license: s.license,
  url: s.url,
  duration: s.duration,
  audioUrl: s.previews?.["preview-hq-mp3"] ?? s.previews?.["preview-lq-mp3"],
  rating: s.avg_rating,
  downloads: s.num_downloads,
});

/**
 * Freesound APIv2 client. Auth: API key as `Authorization: Token <key>` (per the authentication page).
 * Search: GET /apiv2/search/text/. Original-quality downloads need OAuth2, so with a plain key we download the
 * HQ MP3 preview, which is public. That is recorded in the ledger.
 */
export class FreesoundClient implements SoundProvider {
  readonly name = "freesound";
  constructor(private readonly opts: { apiKey: string; fetch?: typeof fetch; base?: string }) {}
  private get f() {
    return this.opts.fetch ?? fetch;
  }
  private get base() {
    return this.opts.base ?? "https://freesound.org/apiv2";
  }
  private async json<T>(url: string): Promise<T> {
    const res = await this.f(url, { headers: { Authorization: `Token ${this.opts.apiKey}` } });
    if (res.status === 401 || res.status === 403)
      throw new CodeCutError("license_blocked", `Freesound rejected the API key (${res.status})`, {
        fix: "Check FREESOUND_API_KEY (create one at https://freesound.org/apiv2/apply).",
      });
    if (res.status === 429)
      throw new CodeCutError("render_failed", "Freesound rate limit reached", {
        fix: "Wait a minute and retry; results are cached once downloaded.",
      });
    if (!res.ok)
      throw new CodeCutError(
        "asset_missing",
        `Freesound returned ${res.status} for ${url.split("?")[0]}`,
      );
    return (await res.json()) as T;
  }
  async search(q: SoundQuery): Promise<SoundHit[]> {
    const filter: string[] = [];
    if (q.duration) filter.push(`duration:[${q.duration[0]} TO ${q.duration[1]}]`);
    for (const t of q.tags ?? []) filter.push(`tag:${t}`);
    const p = new URLSearchParams({
      query: q.query,
      fields: FIELDS,
      page_size: String(Math.min(150, (q.limit ?? 10) * 3)),
    });
    if (filter.length) p.set("filter", filter.join(" "));
    const r = await this.json<{ results: FsSound[] }>(`${this.base}/search/text/?${p}`);
    return r.results.map(toHit);
  }
  async get(id: string): Promise<SoundHit> {
    return toHit(await this.json<FsSound>(`${this.base}/sounds/${id}/?fields=${FIELDS}`));
  }
  async download(hit: SoundHit, dest: string): Promise<void> {
    if (!hit.audioUrl)
      throw new CodeCutError(
        "asset_missing",
        `Freesound sound ${hit.id} has no downloadable preview`,
      );
    const res = await this.f(hit.audioUrl);
    if (!res.ok) throw new CodeCutError("asset_missing", `Preview download failed (${res.status})`);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  }
}

/**
 * The documented stub for when there is no Freesound key: a catalogue on disk at `<project>/sounds/catalog.json`,
 * `[{ id, name, tags, license, author, url, file, description? }]`, files next to it.
 */
export class LocalCatalogProvider implements SoundProvider {
  readonly name = "local";
  constructor(private readonly root: string) {}
  private catalog(): SoundHit[] {
    const f = join(this.root, "sounds", "catalog.json");
    if (!existsSync(f))
      throw new CodeCutError(
        "missing_dependency",
        "No sound source: FREESOUND_API_KEY is not set and sounds/catalog.json does not exist",
        {
          fix: "Export FREESOUND_API_KEY (free key at freesound.org/apiv2/apply), or list your own licensed files in sounds/catalog.json: [{ id, name, tags, license, author, url, file }].",
        },
      );
    const rows = JSON.parse(readFileSync(f, "utf8")) as Array<Record<string, any>>;
    return rows.map((r) => ({
      id: String(r.id),
      name: String(r.name ?? r.id),
      tags: r.tags ?? [],
      description: r.description ?? "",
      author: r.author ?? "unknown",
      license: r.license ?? "unknown",
      url: r.url ?? "",
      duration: Number(r.duration ?? probeMedia(join(this.root, "sounds", r.file))?.duration ?? 0),
      localFile: join(this.root, "sounds", r.file),
    }));
  }
  async search(q: SoundQuery): Promise<SoundHit[]> {
    const words = q.query.toLowerCase().split(/\s+/).filter(Boolean);
    return this.catalog()
      .filter((h) => !q.duration || (h.duration >= q.duration[0] && h.duration <= q.duration[1]))
      .filter((h) => (q.tags ?? []).every((t) => h.tags.includes(t)))
      .map((h) => ({
        h,
        score: words.filter((w) =>
          `${h.name} ${h.tags.join(" ")} ${h.description}`.toLowerCase().includes(w),
        ).length,
      }))
      .filter((x) => !words.length || x.score > 0)
      .sort((a, b) => b.score - a.score || a.h.id.localeCompare(b.h.id))
      .map((x) => x.h);
  }
  async get(id: string): Promise<SoundHit> {
    const h = this.catalog().find((x) => x.id === id);
    if (!h) throw new CodeCutError("asset_missing", `No sound "${id}" in sounds/catalog.json`);
    return h;
  }
  async download(hit: SoundHit, dest: string): Promise<void> {
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(hit.localFile!, dest);
  }
}

/** Pick the provider: Freesound when FREESOUND_API_KEY is set, otherwise the local catalogue. */
export function defaultSoundProvider(
  root: string,
  env = process.env,
  f?: typeof fetch,
): SoundProvider {
  if (env.FREESOUND_API_KEY)
    return new FreesoundClient({ apiKey: env.FREESOUND_API_KEY, fetch: f });
  return new LocalCatalogProvider(root);
}

// ---------- service ----------

export interface SoundResult {
  id: string;
  ref: string;
  name: string;
  tags: string[];
  description: string;
  author: string;
  license: string;
  licenseClass: LicenseClass;
  allowed: boolean;
  url: string;
  duration: number;
  source: string;
  inProject: boolean;
}

export class SoundService {
  constructor(
    private readonly store: ProjectStore,
    private readonly provider: SoundProvider,
  ) {}

  private allowedClasses(): LicenseClass[] {
    return this.store.config().soundLicenses ?? ["CC0", "CC-BY"];
  }

  async search(a: {
    query?: string;
    tag?: string;
    tags?: string[];
    duration?: [number, number];
    limit?: number;
  }): Promise<{ results: SoundResult[]; tag?: SoundTagInfo; note: string }> {
    const tag = isSoundTag(a.tag) ? SOUND_TAGS[a.tag] : undefined;
    if (a.tag && !tag)
      throw new CodeCutError("invalid_edit", `Unknown sound tag "${a.tag}"`, {
        fix: `Tags: ${Object.keys(SOUND_TAGS).join(", ")}`,
      });
    const query = [a.query, tag?.query].filter(Boolean).join(" ").trim();
    if (!query)
      throw new CodeCutError("invalid_edit", "Give a query or a tag", {
        fix: `Tags: ${Object.keys(SOUND_TAGS).join(", ")}`,
      });
    const limit = a.limit ?? 8;
    const hits = await this.provider.search({
      query,
      tags: a.tags,
      duration: a.duration ?? tag?.duration,
      limit,
    });
    const allowed = this.allowedClasses();
    const ledger = readLedger(this.store.root);
    const results = hits
      .map((h): SoundResult => {
        const cls = classifyLicense(h.license);
        return {
          id: h.id,
          ref: `${this.provider.name}:${h.id}`,
          name: h.name,
          tags: h.tags,
          description: h.description.slice(0, 240),
          author: h.author,
          license: h.license,
          licenseClass: cls,
          allowed: allowed.includes(cls),
          url: h.url,
          duration: h.duration,
          source: this.provider.name,
          inProject: ledger.entries.some((e) => e.source === this.provider.name && e.id === h.id),
        };
      })
      .sort((x, y) => Number(y.allowed) - Number(x.allowed))
      .slice(0, limit);
    return {
      results,
      tag,
      note: "Results are text matches. You cannot hear them: check duration and description, and ask the user to audition the ones you pick.",
    };
  }

  /** Download one sound into .codecut/assets/, measure its peak, and record it in the ledger. */
  async get(a: { id: string; tag?: string }): Promise<{
    ref: string;
    path: string;
    entry: LedgerEntry;
    peakName: string;
    note: string;
  }> {
    const hit = await this.provider.get(a.id);
    const cls = classifyLicense(hit.license);
    if (!this.allowedClasses().includes(cls)) {
      throw new CodeCutError(
        "license_blocked",
        `Sound ${hit.id} is ${hit.license}, which this project does not allow`,
        {
          fix: `Allowed: ${this.allowedClasses().join(", ")}. Pick another sound (sound_search marks allowed ones).`,
        },
      );
    }
    const ext = (
      basename(hit.audioUrl ?? hit.localFile ?? "x.mp3").match(/\.[a-z0-9]+$/i)?.[0] ?? ".mp3"
    ).toLowerCase();
    const rel = join(".codecut", "assets", this.provider.name, `${hit.id}${ext}`);
    const dest = this.store.path(rel);
    await this.provider.download(hit, dest);
    const info = probeMedia(dest);
    if (!info?.hasAudio)
      throw new CodeCutError("asset_missing", `Downloaded file for ${hit.id} is not audio`);
    const m = await measurePeakTime(dest);
    const peakName = a.tag?.split("/").pop() ?? "main";
    // the same sound can serve several jobs: keep the peak names it already has (e.g. both "land" and "punch")
    const known = readLedger(this.store.root).entries.find(
      (e) => e.source === this.provider.name && e.kind === "sound" && e.id === hit.id,
    );
    const knownPeaks = known && typeof known.peak === "object" && known.peak ? known.peak : {};
    const entry: LedgerEntry = {
      source: this.provider.name,
      kind: "sound",
      id: hit.id,
      author: hit.author,
      file: rel,
      hash: createHash("sha256").update(readFileSync(dest)).digest("hex"),
      license: licenseLabel(cls, hit.license),
      url: hit.url,
      attributionRequired: cls === "CC-BY",
      commercialOk: cls === "CC0" || cls === "CC-BY",
      peak: { ...knownPeaks, main: m.peak, [peakName]: m.peak },
      duration: info.duration,
      tags: hit.tags,
      title: hit.name,
    };
    const ledger = upsertEntry(readLedger(this.store.root), entry);
    mkdirSync(dirname(ledgerPath(this.store.root)), { recursive: true });
    writeFileSync(ledgerPath(this.store.root), JSON.stringify(ledger, null, 2) + "\n");
    return {
      ref: `${this.provider.name}:${hit.id}`,
      path: relative(this.store.root, dest),
      entry,
      peakName,
      note: `Peak measured at ${m.peak}s (${m.level} dB). Use <Sound src="${this.provider.name}:${hit.id}" at=… peak="${peakName}" />. Not auditioned: ask the user to listen.`,
    };
  }
}
