import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import { FlomotionError, upsertEntry, type LedgerEntry } from "@flomotion/core";
import { ledgerPath, measurePeakTime, probeMedia, readLedger } from "@flomotion/render";
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

export type LicenseClass = "CC0" | "CC-BY" | "CC-BY-NC" | "own" | "other";

/** Freesound reports a licence name or a Creative Commons URL; map both to a class. */
export function classifyLicense(raw: string): LicenseClass {
  const s = raw.toLowerCase();
  // the person's own files: rights are what they told us, so these are always allowed
  if (/^(user-supplied|owned|own\b|licensed|used with permission|permission)/.test(s)) return "own";
  if (/publicdomain\/zero|creative commons 0|\bcc0\b/.test(s)) return "CC0";
  if (/by-nc|noncommercial|non-commercial/.test(s)) return "CC-BY-NC";
  if (/sampling/.test(s)) return "other";
  if (/licenses\/by\/|^attribution$|\bcc-by\b/.test(s)) return "CC-BY";
  return "other";
}

export const licenseLabel = (c: LicenseClass, raw: string) =>
  c === "own"
    ? raw
    : c === "CC0"
      ? "CC0-1.0"
      : c === "CC-BY"
        ? /\/3\.0/.test(raw)
          ? "CC-BY-3.0"
          : "CC-BY-4.0"
        : raw;

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
  /** The person's own file: what they stated about their rights (own, licensed, permission). */
  rights?: string;
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
      throw new FlomotionError(
        "license_blocked",
        `Freesound rejected the API key (${res.status})`,
        {
          fix: "Check FREESOUND_API_KEY (create one at https://freesound.org/apiv2/apply).",
        },
      );
    if (res.status === 429)
      throw new FlomotionError("render_failed", "Freesound rate limit reached", {
        fix: "Wait a minute and retry; results are cached once downloaded.",
      });
    if (!res.ok)
      throw new FlomotionError(
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
      throw new FlomotionError(
        "asset_missing",
        `Freesound sound ${hit.id} has no downloadable preview`,
      );
    const res = await this.f(hit.audioUrl);
    if (!res.ok)
      throw new FlomotionError("asset_missing", `Preview download failed (${res.status})`);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  }
}

/** One catalogue row: the project's `sounds/catalog.json` or the library index made by `flomotion setup`. */
interface CatalogRow {
  id: string;
  name?: string;
  tags?: string[];
  description?: string;
  author?: string;
  license?: string;
  url?: string;
  duration?: number;
  rights?: string;
  file: string;
}

/**
 * The person's own sound effects. Two catalogues are read, project first: `<project>/sounds/catalog.json`
 * (`[{ id, name, tags, license, author, url, file }]`, files next to it) and the library index that `flomotion setup`
 * (or `flomotion sounds index`) builds from a folder of their own files.
 */
export class LocalCatalogProvider implements SoundProvider {
  readonly name = "local";
  constructor(
    private readonly root: string,
    private readonly libraryIndex?: string,
  ) {}
  private catalog(): SoundHit[] {
    const rows: SoundHit[] = [];
    const project = join(this.root, "sounds", "catalog.json");
    if (existsSync(project)) {
      for (const r of JSON.parse(readFileSync(project, "utf8")) as CatalogRow[])
        rows.push(this.row(r, join(this.root, "sounds", r.file)));
    }
    if (this.libraryIndex && existsSync(this.libraryIndex)) {
      const lib = JSON.parse(readFileSync(this.libraryIndex, "utf8")) as {
        root: string;
        license?: string;
        entries: CatalogRow[];
      };
      for (const r of lib.entries)
        rows.push(
          this.row(
            { license: lib.license, ...r, id: r.id.startsWith("lib-") ? r.id : `lib-${r.id}` },
            join(lib.root, r.file),
          ),
        );
    }
    if (
      !rows.length &&
      !existsSync(project) &&
      !(this.libraryIndex && existsSync(this.libraryIndex))
    )
      throw new FlomotionError(
        "missing_dependency",
        "No sound source: no Freesound key, no sounds/catalog.json and no sound library",
        {
          fix: "Run `flomotion setup` to add a Freesound key or point it at a folder of your own sound effects, or give me sound files to import (sound_import).",
        },
      );
    return rows;
  }
  private row(r: CatalogRow, file: string): SoundHit {
    return {
      id: String(r.id),
      name: String(r.name ?? r.id),
      tags: r.tags ?? [],
      description: r.description ?? "",
      author: r.author ?? "the person",
      license: r.license ?? "user-supplied",
      url: r.url ?? "",
      duration: Number(r.duration ?? 0),
      localFile: file,
      rights: r.rights,
    };
  }
  private durationOf(h: SoundHit): number {
    if (h.duration) return h.duration;
    try {
      h.duration = probeMedia(h.localFile!)?.duration ?? 0;
    } catch {
      h.duration = 0;
    }
    return h.duration;
  }
  async search(q: SoundQuery): Promise<SoundHit[]> {
    const words = q.query.toLowerCase().split(/\s+/).filter(Boolean);
    const scored = this.catalog()
      .filter((h) => (q.tags ?? []).every((t) => h.tags.includes(t)))
      .map((h) => ({
        h,
        score: words.filter((w) =>
          `${h.name} ${h.tags.join(" ")} ${h.description}`.toLowerCase().includes(w),
        ).length,
      }))
      .filter((x) => !words.length || x.score > 0)
      .sort((a, b) => b.score - a.score || a.h.id.localeCompare(b.h.id))
      .slice(0, 60)
      .map((x) => x.h);
    // lengths are measured only for the best matches: a library can hold thousands of files
    return scored.filter(
      (h) =>
        !q.duration || (this.durationOf(h) >= q.duration[0] && this.durationOf(h) <= q.duration[1]),
    );
  }
  async get(id: string): Promise<SoundHit> {
    const h = this.catalog().find((x) => x.id === id);
    if (!h)
      throw new FlomotionError("asset_missing", `No sound "${id}" in your sound catalogue`, {
        fix: "Use sound_search to list what is there, or import it with sound_import.",
      });
    this.durationOf(h);
    return h;
  }
  async download(hit: SoundHit, dest: string): Promise<void> {
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(hit.localFile!, dest);
  }
}

/** The providers in use: the person's own sounds first, then Freesound when a key is set. */
export function soundProviders(
  root: string,
  env: NodeJS.ProcessEnv,
  opts: { fetch?: typeof fetch; freesound?: SoundProvider; libraryIndex?: string } = {},
): SoundProvider[] {
  const out: SoundProvider[] = [new LocalCatalogProvider(root, opts.libraryIndex)];
  if (opts.freesound) out.push(opts.freesound);
  else if (env.FREESOUND_API_KEY)
    out.push(new FreesoundClient({ apiKey: env.FREESOUND_API_KEY, fetch: opts.fetch }));
  return out;
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
    private readonly providers: SoundProvider[],
  ) {}

  private allowedClasses(): LicenseClass[] {
    // "own" is the person's rights, stated by them: never blocked by the CC0/CC-BY setting
    return [...(this.store.config().soundLicenses ?? ["CC0", "CC-BY"]), "own"];
  }

  /** Which provider a ref or id belongs to: `local:x`, `freesound:123`, a bare number (Freesound), else your own sounds. */
  private pick(id: string, source?: string): { provider: SoundProvider; id: string } {
    const m = /^([a-z]+):(.+)$/.exec(id);
    const name = m?.[1] ?? source;
    const bare = m?.[2] ?? id;
    if (name) {
      const p = this.providers.find((x) => x.name === name);
      if (!p)
        throw new FlomotionError("missing_dependency", `No "${name}" sound source is set up`, {
          fix:
            name === "freesound"
              ? "Run `flomotion setup` and add a Freesound key."
              : `Sources in use: ${this.providers.map((x) => x.name).join(", ")}`,
        });
      return { provider: p, id: bare };
    }
    const byName = (n: string) => this.providers.find((x) => x.name === n);
    if (/^\d+$/.test(bare) && byName("freesound"))
      return { provider: byName("freesound")!, id: bare };
    return { provider: byName("local") ?? this.providers[0]!, id: bare };
  }

  async search(a: {
    query?: string;
    tag?: string;
    tags?: string[];
    duration?: [number, number];
    limit?: number;
    source?: string;
  }): Promise<{ results: SoundResult[]; tag?: SoundTagInfo; note: string; notes: string[] }> {
    const tag = isSoundTag(a.tag) ? SOUND_TAGS[a.tag] : undefined;
    if (a.tag && !tag)
      throw new FlomotionError("invalid_edit", `Unknown sound tag "${a.tag}"`, {
        fix: `Tags: ${Object.keys(SOUND_TAGS).join(", ")}`,
      });
    const query = [a.query, tag?.query].filter(Boolean).join(" ").trim();
    if (!query)
      throw new FlomotionError("invalid_edit", "Give a query or a tag", {
        fix: `Tags: ${Object.keys(SOUND_TAGS).join(", ")}`,
      });
    const limit = a.limit ?? 8;
    const chosen = this.providers.filter((p) => !a.source || p.name === a.source);
    if (!chosen.length)
      throw new FlomotionError("missing_dependency", `No "${a.source}" sound source is set up`);
    const settled = await Promise.allSettled(
      chosen.map((p) =>
        p.search({ query, tags: a.tags, duration: a.duration ?? tag?.duration, limit }),
      ),
    );
    const notes: string[] = [];
    const hits: Array<{ hit: SoundHit; provider: SoundProvider }> = [];
    settled.forEach((r, i) => {
      if (r.status === "fulfilled")
        hits.push(...r.value.map((hit) => ({ hit, provider: chosen[i]! })));
      else
        notes.push(
          `${chosen[i]!.name}: ${r.reason instanceof Error ? r.reason.message : String(r.reason)}`,
        );
    });
    // a missing own catalogue is only an error when there is nothing else to search
    if (!hits.length && notes.length === chosen.length) {
      const own = settled.findIndex((r) => r.status === "rejected" && chosen[0]!.name === "local");
      const first = settled.find((r) => r.status === "rejected") as
        PromiseRejectedResult | undefined;
      if (own === 0 && chosen.length === 1 && first) throw first.reason;
      if (first && chosen.length > 1 && chosen.every((_, i) => settled[i]!.status === "rejected"))
        throw first.reason;
    }
    const allowed = this.allowedClasses();
    const ledger = readLedger(this.store.root);
    const results = hits
      .map(({ hit: h, provider }): SoundResult => {
        const cls: LicenseClass = h.rights ? "own" : classifyLicense(h.license);
        return {
          id: h.id,
          ref: `${provider.name}:${h.id}`,
          name: h.name,
          tags: h.tags,
          description: h.description.slice(0, 240),
          author: h.author,
          license: h.license,
          licenseClass: cls,
          allowed: allowed.includes(cls),
          url: h.url,
          duration: h.duration,
          source: provider.name,
          inProject: ledger.entries.some((e) => e.source === provider.name && e.id === h.id),
        };
      })
      .sort((x, y) => Number(y.allowed) - Number(x.allowed))
      .slice(0, limit);
    return {
      results,
      tag,
      notes: notes.filter((n) => !/^local: /.test(n) || !hits.length),
      note: "Results are text matches. You cannot hear them: check duration and description, and ask the user to audition the ones you pick.",
    };
  }

  /** Download one sound into .flomotion/assets/, measure its peak, and record it in the ledger. */
  async get(a: { id: string; tag?: string; source?: string }): Promise<{
    ref: string;
    path: string;
    entry: LedgerEntry;
    peakName: string;
    note: string;
  }> {
    const { provider, id } = this.pick(a.id, a.source);
    const hit = await provider.get(id);
    const cls: LicenseClass = hit.rights ? "own" : classifyLicense(hit.license);
    if (!this.allowedClasses().includes(cls)) {
      throw new FlomotionError(
        "license_blocked",
        `Sound ${hit.id} is ${hit.license}, which this project does not allow`,
        {
          fix: `Allowed: ${this.allowedClasses()
            .filter((c) => c !== "own")
            .join(", ")}, or your own files. Pick another sound (sound_search marks allowed ones).`,
        },
      );
    }
    const ext = (
      basename(hit.audioUrl ?? hit.localFile ?? "x.mp3").match(/\.[a-z0-9]+$/i)?.[0] ?? ".mp3"
    ).toLowerCase();
    const rel = join(".flomotion", "assets", provider.name, `${hit.id}${ext}`);
    const dest = this.store.path(rel);
    await provider.download(hit, dest);
    const info = probeMedia(dest);
    if (!info?.hasAudio)
      throw new FlomotionError("asset_missing", `Downloaded file for ${hit.id} is not audio`);
    const m = await measurePeakTime(dest);
    const peakName = a.tag?.split("/").pop() ?? "main";
    // the same sound can serve several jobs: keep the peak names it already has (e.g. both "land" and "punch")
    const known = readLedger(this.store.root).entries.find(
      (e) => e.source === provider.name && e.kind === "sound" && e.id === hit.id,
    );
    const knownPeaks = known && typeof known.peak === "object" && known.peak ? known.peak : {};
    const entry: LedgerEntry = {
      source: provider.name,
      kind: "sound",
      id: hit.id,
      author: hit.author,
      file: rel,
      hash: createHash("sha256").update(readFileSync(dest)).digest("hex"),
      license: licenseLabel(cls, hit.license),
      url: hit.url,
      attributionRequired: cls === "CC-BY",
      commercialOk: cls === "CC0" || cls === "CC-BY" || cls === "own",
      peak: { ...knownPeaks, main: m.peak, [peakName]: m.peak },
      duration: info.duration,
      tags: hit.tags,
      title: hit.name,
      note: cls === "own" ? "rights asserted by the person" : undefined,
    };
    const ledger = upsertEntry(readLedger(this.store.root), entry);
    mkdirSync(dirname(ledgerPath(this.store.root)), { recursive: true });
    writeFileSync(ledgerPath(this.store.root), JSON.stringify(ledger, null, 2) + "\n");
    return {
      ref: `${provider.name}:${hit.id}`,
      path: relative(this.store.root, dest),
      entry,
      peakName,
      note: `Peak measured at ${m.peak}s (${m.level} dB). Use <Sound src="${provider.name}:${hit.id}" at=… peak="${peakName}" />. Not auditioned: ask the user to listen.`,
    };
  }
}
