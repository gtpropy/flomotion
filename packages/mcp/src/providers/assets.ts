import { FlomotionError } from "@flomotion/core";

export type AssetKind = "icon" | "logo" | "emoji" | "photo" | "illustration";
export type AssetLicenseClass = "CC0" | "permissive" | "CC-BY" | "other";

/** Map an SPDX id or an Openverse licence code to a class. Share-alike, non-commercial and copyleft are `other`. */
export function classifyAssetLicense(raw: string, version?: string): AssetLicenseClass {
  const s = raw.trim().toLowerCase();
  if (/^(cc0|cc0-1\.0|pdm|pdm-1\.0|unlicense|0bsd|public domain)$/.test(s)) return "CC0";
  if (/^(mit|apache-2\.0|isc|bsd-2-clause|bsd-3-clause|ofl-1\.1|pexels)$/.test(s))
    return "permissive";
  if (s === "by" || /^cc-by(-\d(\.\d)?)?$/.test(s)) return "CC-BY";
  void version;
  return "other";
}

export const licenseLabelOf = (code: string, version?: string): string => {
  const c = code.toLowerCase();
  if (c === "cc0") return "CC0-1.0";
  if (c === "pdm") return "PDM-1.0";
  if (c === "by") return `CC-BY-${version ?? "4.0"}`;
  if (c === "by-sa") return `CC-BY-SA-${version ?? "4.0"}`;
  if (c === "by-nc") return `CC-BY-NC-${version ?? "4.0"}`;
  if (c === "by-nd") return `CC-BY-ND-${version ?? "4.0"}`;
  return code;
};

export interface AssetHit {
  /** What to pass to asset_get: `iconify:lucide/calendar`, `openverse:<id>`, `pexels:<id>`. */
  ref: string;
  source: string;
  kind: AssetKind;
  title: string;
  creator?: string;
  creatorUrl?: string;
  /** SPDX-like label shown to the person and written to the ledger. */
  license: string;
  licenseClass: AssetLicenseClass;
  licenseUrl?: string;
  /** The licence asks for a credit. */
  attributionRequired: boolean;
  /** The source asks for a credit although the licence does not. */
  creditRecommended?: boolean;
  /** Ready-made credit line from the source (Openverse supplies one). */
  attributionText?: string;
  landingUrl?: string;
  previewUrl?: string;
  width?: number;
  height?: number;
  format: "svg" | "jpg" | "png";
  /** Brand logos are trademarks: the licence of the artwork does not give permission to use the brand. */
  trademark?: boolean;
  collection?: string;
}

export interface AssetQuery {
  query: string;
  kind: AssetKind;
  limit: number;
  orientation?: "landscape" | "portrait" | "square";
}

export interface AssetProvider {
  readonly name: string;
  readonly kinds: readonly AssetKind[];
  search(q: AssetQuery): Promise<AssetHit[]>;
  resolve(ref: string): Promise<AssetHit>;
  download(
    hit: AssetHit,
    opts: { color?: string; height?: number },
  ): Promise<{ bytes: Buffer; ext: string }>;
}

const UA = "flomotion (video authoring tool; https://www.npmjs.com/package/flomotion)";
const MAX_BYTES = 60 * 1024 * 1024;

async function getJson<T>(
  f: typeof fetch,
  url: string,
  headers: Record<string, string> = {},
): Promise<T> {
  let res: Response;
  try {
    res = await f(url, {
      headers: { "User-Agent": UA, Accept: "application/json", ...headers },
      signal: AbortSignal.timeout(20_000),
    });
  } catch (e) {
    throw new FlomotionError(
      "missing_dependency",
      `Could not reach ${new URL(url).host}: ${e instanceof Error ? e.message : e}`,
      {
        fix: "Check the network connection. Assets are only fetched when you ask for them; renders never use the network.",
      },
    );
  }
  if (res.status === 429)
    throw new FlomotionError("render_failed", `${new URL(url).host} rate limit reached`, {
      fix: "Wait a minute and try again, or use another source.",
    });
  if (res.status === 401 || res.status === 403)
    throw new FlomotionError(
      "missing_dependency",
      `${new URL(url).host} rejected the API key (HTTP ${res.status})`,
      { fix: "Run `flomotion setup` and check the key." },
    );
  if (!res.ok)
    throw new FlomotionError("asset_missing", `${new URL(url).host} answered HTTP ${res.status}`);
  return (await res.json()) as T;
}

async function getBytes(f: typeof fetch, url: string): Promise<{ bytes: Buffer; type: string }> {
  const res = await f(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(60_000) });
  if (!res.ok)
    throw new FlomotionError(
      "asset_missing",
      `Download failed (HTTP ${res.status}) for ${new URL(url).host}`,
    );
  const len = Number(res.headers.get("content-length") ?? 0);
  if (len > MAX_BYTES)
    throw new FlomotionError(
      "asset_missing",
      `The file is ${Math.round(len / 1e6)} MB, over the 60 MB limit`,
    );
  const bytes = Buffer.from(await res.arrayBuffer());
  if (bytes.length > MAX_BYTES)
    throw new FlomotionError("asset_missing", "The file is over the 60 MB limit");
  return { bytes, type: res.headers.get("content-type") ?? "" };
}

/**
 * Refuse SVG that could run code or load things: scripts, event handlers, foreignObject, external references.
 * An icon from a trusted set is plain shapes; anything else is rejected rather than cleaned.
 */
export function assertSafeSvg(svg: string): void {
  const bad =
    /<script|<foreignObject|\son[a-z]+\s*=|javascript:|<iframe|<object|<embed|(?:xlink:)?href\s*=\s*["'](?!#)(?!data:image\/)/i.exec(
      svg,
    );
  if (bad)
    throw new FlomotionError(
      "asset_missing",
      `The SVG contains something that is not plain artwork (${bad[0].trim().slice(0, 30)}…)`,
      {
        fix: "Pick another asset, or import a file you have checked.",
      },
    );
  if (!/<svg[\s>]/i.test(svg)) throw new FlomotionError("asset_missing", "The file is not an SVG");
}

// ---------- Iconify: icons, emoji and brand logos (no key) ----------

/** Icon sets with permissive licences, in the order we prefer them. */
export const ICON_PREFIXES = [
  "lucide",
  "tabler",
  "ph",
  "heroicons",
  "mdi",
  "ri",
  "bi",
  "carbon",
  "fluent",
  "iconoir",
  "material-symbols",
  "solar",
];
export const EMOJI_PREFIXES = ["fluent-emoji", "noto", "twemoji"];
export const LOGO_PREFIXES = ["logos", "simple-icons"];

interface IconifyCollection {
  name?: string;
  author?: { name?: string; url?: string };
  license?: { title?: string; spdx?: string; url?: string };
  palette?: boolean;
}

export class IconifyProvider implements AssetProvider {
  readonly name = "iconify";
  readonly kinds = ["icon", "emoji", "logo"] as const;
  constructor(private readonly opts: { fetch?: typeof fetch; base?: string } = {}) {}
  private get f() {
    return this.opts.fetch ?? fetch;
  }
  private get base() {
    return this.opts.base ?? "https://api.iconify.design";
  }
  private hit(
    prefix: string,
    name: string,
    c: IconifyCollection | undefined,
    kind: AssetKind,
  ): AssetHit {
    const spdx = c?.license?.spdx ?? c?.license?.title ?? "unknown";
    const cls = classifyAssetLicense(spdx);
    return {
      ref: `iconify:${prefix}/${name}`,
      source: "iconify",
      kind,
      title: name.replace(/-/g, " "),
      creator: c?.author?.name,
      creatorUrl: c?.author?.url,
      license: spdx,
      licenseClass: cls,
      licenseUrl: c?.license?.url,
      attributionRequired: cls === "CC-BY",
      landingUrl: `https://icon-sets.iconify.design/${prefix}/${name}/`,
      previewUrl: `${this.base}/${prefix}/${name}.svg`,
      format: "svg",
      trademark: kind === "logo" ? true : undefined,
      collection: c?.name ?? prefix,
    };
  }
  async search(q: AssetQuery): Promise<AssetHit[]> {
    const prefixes =
      q.kind === "logo" ? LOGO_PREFIXES : q.kind === "emoji" ? EMOJI_PREFIXES : ICON_PREFIXES;
    const url = `${this.base}/search?query=${encodeURIComponent(q.query)}&limit=${Math.min(64, Math.max(q.limit * 3, 12))}&prefixes=${prefixes.join(",")}`;
    const j = await getJson<{ icons?: string[]; collections?: Record<string, IconifyCollection> }>(
      this.f,
      url,
    );
    const out: AssetHit[] = [];
    for (const id of j.icons ?? []) {
      const [prefix, name] = id.split(":");
      if (!prefix || !name) continue;
      out.push(this.hit(prefix, name, j.collections?.[prefix], q.kind));
    }
    // a spread across sets in our order of preference (one from each set, then the next round), not twenty from one
    const groups = new Map<string, AssetHit[]>();
    for (const h of out) {
      const p = h.ref.slice("iconify:".length).split("/")[0]!;
      groups.set(p, [...(groups.get(p) ?? []), h]);
    }
    const order = prefixes.filter((p) => groups.has(p));
    const spread: AssetHit[] = [];
    for (let round = 0; spread.length < q.limit && round < 8; round++)
      for (const p of order) {
        const h = groups.get(p)![round];
        if (h && spread.length < q.limit) spread.push(h);
      }
    return spread;
  }
  async resolve(ref: string): Promise<AssetHit> {
    const m = /^iconify:([a-z0-9-]+)\/([a-z0-9-]+)$/.exec(ref);
    if (!m)
      throw new FlomotionError("invalid_edit", `Not an Iconify ref: ${ref}`, {
        fix: "Use a ref from asset_search, like iconify:lucide/calendar.",
      });
    const [, prefix, name] = m as unknown as [string, string, string];
    const j = await getJson<Record<string, IconifyCollection>>(
      this.f,
      `${this.base}/collections?prefixes=${prefix}`,
    );
    const c = j[prefix];
    if (!c) throw new FlomotionError("asset_missing", `No icon set "${prefix}"`);
    const kind: AssetKind = LOGO_PREFIXES.includes(prefix)
      ? "logo"
      : EMOJI_PREFIXES.includes(prefix)
        ? "emoji"
        : "icon";
    return this.hit(prefix, name, c, kind);
  }
  async download(hit: AssetHit, opts: { color?: string; height?: number }) {
    const [prefix, name] = hit.ref.replace("iconify:", "").split("/");
    const q = new URLSearchParams();
    if (opts.color && hit.kind !== "emoji" && hit.kind !== "logo") q.set("color", opts.color);
    if (opts.height) q.set("height", String(opts.height));
    const r = await getBytes(this.f, `${this.base}/${prefix}/${name}.svg${q.size ? `?${q}` : ""}`);
    const svg = r.bytes.toString("utf8");
    assertSafeSvg(svg);
    return { bytes: r.bytes, ext: ".svg" };
  }
}

// ---------- Openverse: CC0 and CC-BY photos and illustrations (no key) ----------

interface OpenverseImage {
  id: string;
  title?: string;
  creator?: string;
  creator_url?: string;
  license: string;
  license_version?: string;
  license_url?: string;
  url: string;
  thumbnail?: string;
  foreign_landing_url?: string;
  attribution?: string;
  filetype?: string | null;
  width?: number | null;
  height?: number | null;
  category?: string | null;
}

export class OpenverseProvider implements AssetProvider {
  readonly name = "openverse";
  readonly kinds = ["photo", "illustration"] as const;
  constructor(private readonly opts: { fetch?: typeof fetch; base?: string } = {}) {}
  private get f() {
    return this.opts.fetch ?? fetch;
  }
  private get base() {
    return this.opts.base ?? "https://api.openverse.org";
  }
  private hit(r: OpenverseImage, kind: AssetKind): AssetHit {
    const label = licenseLabelOf(r.license, r.license_version);
    const cls = classifyAssetLicense(r.license === "by" ? "cc-by" : r.license);
    const ext = (r.filetype ?? r.url.split("?")[0]!.split(".").pop() ?? "jpg").toLowerCase();
    return {
      ref: `openverse:${r.id}`,
      source: "openverse",
      kind,
      title: r.title || `Openverse image ${r.id.slice(0, 8)}`,
      creator: r.creator,
      creatorUrl: r.creator_url,
      license: label,
      licenseClass: cls,
      licenseUrl: r.license_url,
      attributionRequired: cls === "CC-BY",
      attributionText: r.attribution,
      landingUrl: r.foreign_landing_url,
      previewUrl: r.thumbnail,
      width: r.width ?? undefined,
      height: r.height ?? undefined,
      format: ext === "png" ? "png" : ext === "svg" ? "svg" : "jpg",
    };
  }
  async search(q: AssetQuery): Promise<AssetHit[]> {
    const p = new URLSearchParams({
      q: q.query,
      page_size: String(Math.min(20, Math.max(q.limit * 2, 6))),
      license: "cc0,pdm,by",
      mature: "false",
    });
    p.set("category", q.kind === "illustration" ? "illustration" : "photograph");
    if (q.orientation)
      p.set(
        "aspect_ratio",
        q.orientation === "portrait" ? "tall" : q.orientation === "landscape" ? "wide" : "square",
      );
    const j = await getJson<{ results?: OpenverseImage[] }>(this.f, `${this.base}/v1/images/?${p}`);
    return (j.results ?? []).map((r) => this.hit(r, q.kind)).slice(0, q.limit);
  }
  async resolve(ref: string): Promise<AssetHit> {
    const id = ref.replace(/^openverse:/, "");
    if (!/^[0-9a-f-]{36}$/.test(id))
      throw new FlomotionError("invalid_edit", `Not an Openverse ref: ${ref}`, {
        fix: "Use a ref from asset_search.",
      });
    const r = await getJson<OpenverseImage>(this.f, `${this.base}/v1/images/${id}/`);
    return this.hit(r, r.category === "illustration" ? "illustration" : "photo");
  }
  async download(hit: AssetHit) {
    const r = await this.resolveUrl(hit);
    const got = await getBytes(this.f, r);
    const ext = /png/.test(got.type)
      ? ".png"
      : /svg/.test(got.type)
        ? ".svg"
        : /gif/.test(got.type)
          ? ".gif"
          : ".jpg";
    if (ext === ".svg") assertSafeSvg(got.bytes.toString("utf8"));
    return { bytes: got.bytes, ext };
  }
  private async resolveUrl(hit: AssetHit): Promise<string> {
    const j = await getJson<OpenverseImage>(
      this.f,
      `${this.base}/v1/images/${hit.ref.replace("openverse:", "")}/`,
    );
    return j.url;
  }
}

// ---------- Pexels: stock photos (key) ----------

interface PexelsPhoto {
  id: number;
  url: string;
  photographer: string;
  photographer_url: string;
  alt?: string;
  width: number;
  height: number;
  src: { original: string; large2x?: string; large?: string };
}

export class PexelsProvider implements AssetProvider {
  readonly name = "pexels";
  readonly kinds = ["photo"] as const;
  constructor(private readonly opts: { key: string; fetch?: typeof fetch; base?: string }) {}
  private get f() {
    return this.opts.fetch ?? fetch;
  }
  private get base() {
    return this.opts.base ?? "https://api.pexels.com";
  }
  private hit(p: PexelsPhoto): AssetHit {
    return {
      ref: `pexels:${p.id}`,
      source: "pexels",
      kind: "photo",
      title: p.alt || `Pexels photo ${p.id}`,
      creator: p.photographer,
      creatorUrl: p.photographer_url,
      license: "Pexels License",
      licenseClass: "permissive",
      licenseUrl: "https://www.pexels.com/license/",
      attributionRequired: false,
      creditRecommended: true,
      landingUrl: p.url,
      previewUrl: p.src.large ?? p.src.large2x,
      width: p.width,
      height: p.height,
      format: "jpg",
    };
  }
  private auth() {
    return { Authorization: this.opts.key };
  }
  async search(q: AssetQuery): Promise<AssetHit[]> {
    const p = new URLSearchParams({
      query: q.query,
      per_page: String(Math.min(40, Math.max(q.limit, 3))),
    });
    if (q.orientation) p.set("orientation", q.orientation);
    const j = await getJson<{ photos?: PexelsPhoto[] }>(
      this.f,
      `${this.base}/v1/search?${p}`,
      this.auth(),
    );
    return (j.photos ?? []).map((x) => this.hit(x)).slice(0, q.limit);
  }
  async resolve(ref: string): Promise<AssetHit> {
    const id = ref.replace(/^pexels:/, "");
    if (!/^\d+$/.test(id))
      throw new FlomotionError("invalid_edit", `Not a Pexels ref: ${ref}`, {
        fix: "Use a ref from asset_search.",
      });
    return this.hit(
      await getJson<PexelsPhoto>(this.f, `${this.base}/v1/photos/${id}`, this.auth()),
    );
  }
  async download(hit: AssetHit) {
    const p = await getJson<PexelsPhoto>(
      this.f,
      `${this.base}/v1/photos/${hit.ref.replace("pexels:", "")}`,
      this.auth(),
    );
    const got = await getBytes(this.f, p.src.original);
    return { bytes: got.bytes, ext: /png/.test(got.type) ? ".png" : ".jpg" };
  }
}
