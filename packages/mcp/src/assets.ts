import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, extname, join, relative, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import puppeteer from "puppeteer-core";
import {
  CodeCutError,
  contrastRatio,
  parseColor,
  upsertEntry,
  type LedgerEntry,
} from "@codecut/core";
import { findChrome, ledgerPath, probeMedia, readLedger, requireFfmpeg } from "@codecut/render";
import {
  assertSafeSvg,
  classifyAssetLicense,
  type AssetHit,
  type AssetKind,
  type AssetLicenseClass,
  type AssetProvider,
} from "./providers/assets.js";
import type { ProjectStore } from "./store.js";

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "asset";

export const DEFAULT_ASSET_LICENSES: AssetLicenseClass[] = ["CC0", "permissive", "CC-BY"];

// ---------- reading files the person points at ----------

const DENY =
  /(^|\/)(\.ssh|\.aws|\.gnupg|\.config\/gcloud|Library\/Keychains|\.docker|\.kube)(\/|$)|(^|\/)(id_rsa|id_ed25519|\.env[^/]*|credentials|\.npmrc|\.netrc)$/i;
export const IMAGE_EXT = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"];
export const VIDEO_EXT = [".mp4", ".mov", ".webm", ".m4v"];
export const AUDIO_EXT = [".wav", ".mp3", ".flac", ".ogg", ".aiff", ".aif", ".m4a", ".aac"];
export const TEXT_EXT = [".srt", ".vtt", ".json", ".txt", ".md"];

/**
 * A file the person gave us may live anywhere (their Downloads folder), but only the kinds of file a video uses are
 * read, and never credentials or key folders. The copy goes into the project; nothing outside it is written.
 */
export function assertReadable(p: string, allowed: string[], maxBytes = 800 * 1024 * 1024): string {
  const abs = resolve(p);
  if (!existsSync(abs))
    throw new CodeCutError("asset_missing", `No file at ${p}`, {
      fix: "Give the full path of a file that exists.",
    });
  const real = realpathSync(abs);
  if (DENY.test(real) || DENY.test(abs))
    throw new CodeCutError(
      "path_outside_project",
      `${p} looks like a credentials or key file and will not be read`,
      { fix: "Copy the media you want into a normal folder and give that path." },
    );
  const st = statSync(real);
  if (st.isFile()) {
    if (!allowed.includes(extname(real).toLowerCase()))
      throw new CodeCutError(
        "invalid_edit",
        `${basename(real)} is not a file type this tool takes (${allowed.join(" ")})`,
        { fix: "Convert it, or pick another file." },
      );
    if (st.size > maxBytes)
      throw new CodeCutError(
        "asset_missing",
        `${basename(real)} is larger than ${Math.round(maxBytes / 1e6)} MB`,
      );
  }
  return real;
}

export function listFiles(dir: string, allowed: string[], recurse: boolean, max = 5000): string[] {
  const out: string[] = [];
  const walk = (d: string) => {
    for (const name of readdirSync(d)) {
      if (name.startsWith(".")) continue;
      const p = join(d, name);
      const st = statSync(p);
      if (st.isDirectory()) {
        if (recurse) walk(p);
      } else if (allowed.includes(extname(name).toLowerCase())) out.push(p);
      if (out.length >= max) return;
    }
  };
  walk(dir);
  return out.sort();
}

// ---------- the service ----------

export interface AssetResult extends Omit<AssetHit, "previewUrl"> {
  previewUrl?: string;
  allowed: boolean;
  /** Why it is not allowed, or what must be confirmed first. */
  caution?: string;
  inProject: boolean;
}

export class AssetService {
  constructor(
    private readonly store: ProjectStore,
    private readonly providers: AssetProvider[],
  ) {}

  private allowedClasses(): AssetLicenseClass[] {
    return (
      (this.store.config().assetLicenses as AssetLicenseClass[] | undefined) ??
      DEFAULT_ASSET_LICENSES
    );
  }

  sources(): Array<{ name: string; kinds: readonly AssetKind[] }> {
    return this.providers.map((p) => ({ name: p.name, kinds: p.kinds }));
  }

  async search(a: {
    query: string;
    kind: AssetKind;
    limit?: number;
    orientation?: "landscape" | "portrait" | "square";
    source?: string;
  }) {
    const limit = a.limit ?? 8;
    const chosen = this.providers.filter(
      (p) => p.kinds.includes(a.kind) && (!a.source || p.name === a.source),
    );
    if (!chosen.length)
      throw new CodeCutError(
        "missing_dependency",
        `No source for ${a.kind}${a.source ? ` named ${a.source}` : ""}`,
        {
          fix: `Sources: ${this.providers.map((p) => `${p.name} (${p.kinds.join(", ")})`).join("; ")}`,
        },
      );
    const settled = await Promise.allSettled(
      chosen.map((p) =>
        p.search({ query: a.query, kind: a.kind, limit, orientation: a.orientation }),
      ),
    );
    const hits: AssetHit[] = [];
    const notes: string[] = [];
    settled.forEach((r, i) => {
      if (r.status === "fulfilled") hits.push(...r.value);
      else
        notes.push(
          `${chosen[i]!.name}: ${r.reason instanceof Error ? r.reason.message : String(r.reason)}`,
        );
    });
    if (!hits.length && notes.length === chosen.length)
      throw new CodeCutError("missing_dependency", notes.join("; "), {
        fix: "Check the network, or try another kind or source.",
      });
    const allowed = this.allowedClasses();
    const ledger = readLedger(this.store.root);
    const results: AssetResult[] = hits.map((h) => {
      const ok = allowed.includes(h.licenseClass);
      return {
        ...h,
        allowed: ok,
        caution: !ok
          ? `${h.license} is not allowed in this project (allowed: ${allowed.join(", ")})`
          : h.trademark
            ? "A brand logo is a trademark. Use it only for your own brand, or with the brand's permission, and pass permission:true to asset_get."
            : undefined,
        inProject: ledger.entries.some(
          (e) => e.source === h.source && e.id.startsWith(h.ref.slice(h.source.length + 1)),
        ),
      };
    });
    results.sort((x, y) => Number(y.allowed) - Number(x.allowed));
    return {
      results: results.slice(0, limit * chosen.length),
      sources: chosen.map((p) => p.name),
      notes,
      note: "These are text matches. Open the preview or landing page to see the picture, and check it fits the look. Pull one with asset_get.",
    };
  }

  /** Download one asset into assets/third-party/ and record it in the ledger. */
  async get(a: {
    ref: string;
    permission?: boolean;
    color?: string;
    height?: number;
    name?: string;
  }) {
    const prefix = a.ref.split(":")[0];
    const provider = this.providers.find((p) => p.name === prefix);
    if (!provider)
      throw new CodeCutError("invalid_edit", `Unknown asset source in "${a.ref}"`, {
        fix: `Refs start with one of: ${this.providers.map((p) => p.name).join(", ")}. Use asset_search to get one.`,
      });
    const hit = await provider.resolve(a.ref);
    const allowed = this.allowedClasses();
    if (!allowed.includes(hit.licenseClass))
      throw new CodeCutError(
        "license_blocked",
        `${hit.title} is ${hit.license}, which this project does not allow`,
        {
          fix: `Allowed: ${allowed.join(", ")} (set assetLicenses in codecut.json). Pick another asset.`,
        },
      );
    if (hit.trademark && a.permission !== true)
      throw new CodeCutError(
        "license_blocked",
        `${hit.title} is a brand logo. The artwork is openly licensed but the brand is a trademark`,
        {
          fix: "Only for your own brand, or one that has given permission (many allow it in their brand guidelines). If that is true, call again with permission:true.",
        },
      );
    if (a.color && !/^#[0-9a-f]{3,8}$/i.test(a.color))
      throw new CodeCutError("invalid_value", `color must be a hex colour like #4b5cff`, {
        fix: "Use the look's colour as hex.",
      });
    const dl = await provider.download(hit, { color: a.color, height: a.height });
    const baseId = hit.ref.slice(hit.source.length + 1);
    const variant = `${a.color ? `@${a.color.toLowerCase()}` : ""}${a.height ? `#${a.height}` : ""}`;
    const stem = a.name
      ? slug(a.name)
      : hit.source === "iconify"
        ? slug(baseId.replace("/", "-")) +
          (a.color ? `-${a.color.replace("#", "").toLowerCase()}` : "")
        : `${slug(hit.title)}-${baseId.replace(/[^a-z0-9]/gi, "").slice(0, 8)}`;
    const rel = join("assets", "third-party", hit.source, `${stem}${dl.ext}`);
    const abs = this.store.path(rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, dl.bytes);
    if (dl.ext !== ".svg") limitSide(abs, 2400);
    const info = dl.ext === ".svg" ? undefined : probeMedia(abs);
    const entry: LedgerEntry = {
      source: hit.source,
      kind: "image",
      id: `${baseId}${variant}`,
      author: hit.creator,
      file: rel,
      hash: createHash("sha256").update(readFileSync(abs)).digest("hex"),
      license: hit.license,
      url: hit.landingUrl,
      attributionRequired: hit.attributionRequired,
      commercialOk: hit.licenseClass !== "other",
      title: hit.title,
      assetKind: hit.kind,
      creditRecommended: hit.creditRecommended,
      note:
        [
          hit.licenseUrl && `licence: ${hit.licenseUrl}`,
          hit.trademark && "brand logo: permission asserted by the person",
          hit.attributionText,
        ]
          .filter(Boolean)
          .join("; ") || undefined,
    };
    this.writeLedger(entry);
    const src = `./${rel}`;
    return {
      ref: hit.ref,
      path: rel,
      src,
      width: info?.width,
      height: info?.height,
      entry,
      use:
        dl.ext === ".svg"
          ? `<Image id="icon-…" src="${src}" width={96} height={96} fit="contain" />`
          : `<Image id="photo-…" src="${src}" width="100%" height="100%" fit="cover" />`,
      note:
        (hit.attributionRequired
          ? `Credit required: it is added to the credits file on render. `
          : hit.creditRecommended
            ? `The source asks for a credit (listed as recommended on render). `
            : "") +
        "Look at it before you use it (frame_render): a text match can still be the wrong picture.",
    };
  }

  /** The person's own image, logo or video: copied in, with the rights they state. */
  async importFile(a: {
    source: string;
    rights: "own" | "licensed" | "permission";
    license?: string;
    author?: string;
    url?: string;
    name?: string;
    kind?: "logo" | "photo" | "illustration" | "screenshot" | "icon" | "own";
  }) {
    const real = assertReadable(a.source, [...IMAGE_EXT, ...VIDEO_EXT]);
    const files = statSync(real).isDirectory()
      ? listFiles(real, [...IMAGE_EXT, ...VIDEO_EXT], false, 200)
      : [real];
    if (!files.length)
      throw new CodeCutError("asset_missing", `No images or videos in ${a.source}`);
    const out: Array<{ path: string; src: string; entry: LedgerEntry }> = [];
    for (const f of files) {
      if (extname(f).toLowerCase() === ".svg") assertSafeSvg(readFileSync(f, "utf8"));
      const stem = a.name && files.length === 1 ? slug(a.name) : slug(basename(f, extname(f)));
      const rel = join("assets", "imported", `${stem}${extname(f).toLowerCase()}`);
      const abs = this.store.path(rel);
      mkdirSync(dirname(abs), { recursive: true });
      copyFileSync(f, abs);
      const entry: LedgerEntry = {
        source: "own",
        kind: VIDEO_EXT.includes(extname(f).toLowerCase()) ? "video" : "image",
        id: stem,
        author: a.author,
        file: rel,
        hash: createHash("sha256").update(readFileSync(abs)).digest("hex"),
        license:
          a.license ??
          (a.rights === "own"
            ? "owned by the person"
            : a.rights === "licensed"
              ? "licensed to the person"
              : "used with permission"),
        url: a.url,
        attributionRequired: false,
        commercialOk: true,
        title: basename(f),
        assetKind: a.kind ?? "own",
        note: `rights asserted by the person: ${a.rights}`,
      };
      this.writeLedger(entry);
      out.push({ path: rel, src: `./${rel}`, entry });
    }
    return {
      imported: out,
      note: "Rights are what the person told us; nothing checks them. Confirm anything you are unsure of before publishing.",
    };
  }

  /** A screenshot of a page the person owns or may show, at the size and sharpness a video needs. */
  async capture(a: {
    url: string;
    permission?: boolean;
    name?: string;
    width?: number;
    height?: number;
    scale?: number;
    selector?: string;
    fullPage?: boolean;
    waitMs?: number;
    hide?: string[];
  }) {
    if (a.permission !== true)
      throw new CodeCutError(
        "license_blocked",
        "Screenshots are only for a product or page the person owns or may show",
        {
          fix: "Ask the person whether the product is theirs (or whether they may show it). If yes, call again with permission:true.",
        },
      );
    let u: URL;
    try {
      u = new URL(a.url);
    } catch {
      throw new CodeCutError("invalid_value", `Not a URL: ${a.url}`);
    }
    if (!/^https?:$/.test(u.protocol))
      throw new CodeCutError("invalid_value", "Only http and https pages can be captured", {
        fix: "For a local file, import it with asset_import.",
      });
    const width = a.width ?? 1440;
    const height = a.height ?? 900;
    const scale = a.scale ?? 2;
    const browser = await puppeteer.launch({
      executablePath: findChrome(),
      headless: true,
      args: [
        "--no-sandbox",
        "--hide-scrollbars",
        "--font-render-hinting=none",
        "--disable-lcd-text",
      ],
    });
    let bytes: Buffer;
    let title: string;
    try {
      const page = await browser.newPage();
      await page.setViewport({ width, height, deviceScaleFactor: scale });
      page.setDefaultNavigationTimeout(45_000);
      page.on("dialog", (dlg) => void dlg.dismiss()); // an alert() would otherwise freeze the page
      try {
        await page.goto(a.url, { waitUntil: "networkidle2" });
      } catch (e) {
        throw new CodeCutError(
          "asset_missing",
          `Could not load ${a.url}: ${e instanceof Error ? e.message : e}`,
          {
            fix: "Check the address. A page behind a login cannot be captured from here: take the screenshot yourself and use asset_import.",
          },
        );
      }
      if (a.hide?.length)
        await page.addStyleTag({ content: `${a.hide.join(",")}{display:none !important}` });
      if (a.waitMs) await new Promise((r) => setTimeout(r, Math.min(a.waitMs!, 15_000)));
      title = await page.title();
      if (a.selector) {
        const el = await page.$(a.selector);
        if (!el)
          throw new CodeCutError(
            "asset_missing",
            `No element matches "${a.selector}" on ${a.url}`,
            { fix: "Check the selector, or capture the whole viewport." },
          );
        bytes = Buffer.from(await el.screenshot({ type: "png" }));
      } else bytes = Buffer.from(await page.screenshot({ type: "png", fullPage: !!a.fullPage }));
    } finally {
      await browser.close();
    }
    const stem = a.name
      ? slug(a.name)
      : `${slug(u.hostname)}-${slug(u.pathname) === "asset" ? "home" : slug(u.pathname)}`;
    const rel = join("assets", "captures", `${stem}.png`);
    const abs = this.store.path(rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, bytes);
    const info = probeMedia(abs);
    const entry: LedgerEntry = {
      source: "capture",
      kind: "image",
      id: stem,
      file: rel,
      hash: createHash("sha256").update(bytes).digest("hex"),
      license: "owned or permitted by the person",
      url: a.url,
      attributionRequired: false,
      commercialOk: true,
      title: title || a.url,
      assetKind: "screenshot",
      note: "captured from the live page; permission asserted by the person",
    };
    this.writeLedger(entry);
    return {
      path: rel,
      src: `./${rel}`,
      width: info?.width,
      height: info?.height,
      title,
      entry,
      use: `<Image id="screen-…" src="./${rel}" width={…} fit="cover" />`,
    };
  }

  writeLedger(entry: LedgerEntry) {
    const ledger = upsertEntry(readLedger(this.store.root), entry);
    mkdirSync(dirname(ledgerPath(this.store.root)), { recursive: true });
    writeFileSync(ledgerPath(this.store.root), JSON.stringify(ledger, null, 2) + "\n");
  }

  /** Read a site's brand: name, colours, fonts and logo files. For the person's own site. */
  async brandExtract(a: { url: string; permission?: boolean; saveLogos?: boolean }) {
    if (a.permission !== true)
      throw new CodeCutError(
        "license_blocked",
        "Brand extraction is for the person's own site (or one they may use)",
        {
          fix: "Ask whose site it is. If it is theirs, call again with permission:true.",
        },
      );
    const u = new URL(a.url);
    if (!/^https?:$/.test(u.protocol))
      throw new CodeCutError("invalid_value", "Only http and https pages");
    const browser = await puppeteer.launch({
      executablePath: findChrome(),
      headless: true,
      args: ["--no-sandbox", "--hide-scrollbars"],
    });
    let raw: RawBrand;
    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1440, height: 900 });
      page.setDefaultNavigationTimeout(45_000);
      page.on("dialog", (dlg) => void dlg.dismiss()); // an alert() would otherwise freeze the page
      try {
        await page.goto(a.url, { waitUntil: "networkidle2" });
      } catch (e) {
        throw new CodeCutError(
          "asset_missing",
          `Could not load ${a.url}: ${e instanceof Error ? e.message : e}`,
        );
      }
      raw = (await page.evaluate(BRAND_SCRIPT)) as RawBrand;
    } finally {
      await browser.close();
    }
    const { accents, neutrals } = classifyColors(raw.colors);
    const fonts = Object.entries(raw.fonts)
      .map(([where, family]) => ({ where, family }))
      .filter((f) => f.family);
    const saved: Array<{ path: string; from: string }> = [];
    const skipped: string[] = [];
    if (a.saveLogos !== false) {
      const tryFile = async (from: string, bytes: Buffer, ext: string) => {
        if (ext === ".svg") assertSafeSvg(bytes.toString("utf8"));
        const rel = join("assets", "brand", `${slug(u.hostname)}-${saved.length + 1}${ext}`);
        const abs = this.store.path(rel);
        mkdirSync(dirname(abs), { recursive: true });
        writeFileSync(abs, bytes);
        this.writeLedger({
          source: "site",
          kind: "image",
          id: `${slug(u.hostname)}-${saved.length + 1}`,
          file: rel,
          hash: createHash("sha256").update(bytes).digest("hex"),
          license: "owned or permitted by the person",
          url: from.startsWith("http") ? from : a.url,
          attributionRequired: false,
          commercialOk: true,
          title: `${raw.title || u.hostname} brand asset`,
          assetKind: "brand",
          note: "taken from the person's site; permission asserted by the person",
        });
        saved.push({ path: rel, from });
      };
      for (const svg of raw.inlineLogos.slice(0, 2)) {
        try {
          await tryFile("inline svg in the page header", Buffer.from(svg), ".svg");
        } catch (e) {
          skipped.push(`inline svg: ${e instanceof Error ? e.message : e}`);
        }
      }
      for (const src of [
        ...raw.logoImages.slice(0, 2),
        ...raw.icons
          .filter((i) => /apple-touch/.test(i.rel))
          .slice(0, 1)
          .map((i) => i.href),
      ]) {
        try {
          const res = await fetch(src, { signal: AbortSignal.timeout(20_000) });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const bytes = Buffer.from(await res.arrayBuffer());
          if (bytes.length > 8 * 1024 * 1024) throw new Error("larger than 8 MB");
          const type = res.headers.get("content-type") ?? "";
          const ext =
            /svg/.test(type) || /\.svg(\?|$)/.test(src)
              ? ".svg"
              : /png/.test(type) || /\.png(\?|$)/.test(src)
                ? ".png"
                : /webp/.test(type)
                  ? ".webp"
                  : /jpe?g/.test(type)
                    ? ".jpg"
                    : ".png";
          await tryFile(src, bytes, ext);
        } catch (e) {
          skipped.push(`${src}: ${e instanceof Error ? e.message : e}`);
        }
      }
    }
    const brand = {
      site: a.url,
      title: raw.title,
      description: raw.description,
      themeColor: raw.themeColor,
      accents,
      neutrals,
      fonts,
      logos: saved,
      ogImage: raw.ogImage,
      note: "Colours and fonts are what the page uses today. Ask the person to confirm the brand's real accent and neutral before you build a look from these; the contrast numbers say whether text on white or black is readable.",
    };
    writeFileSync(this.store.path("brand.json"), JSON.stringify(brand, null, 2) + "\n");
    return { ...brand, skipped, file: "brand.json" };
  }
}

// ---------- brand extraction helpers ----------

interface RawBrand {
  title: string;
  description: string | null;
  themeColor: string | null;
  ogImage: string | null;
  colors: Array<{ hex: string; uses: number; where: Record<string, number> }>;
  fonts: Record<string, string>;
  inlineLogos: string[];
  logoImages: string[];
  icons: Array<{ rel: string; href: string; sizes: string | null }>;
}

const BRAND_SCRIPT = `(() => {
  const abs = (u) => { try { return new URL(u, location.href).href } catch (e) { return null } };
  const meta = (n) => { const m = document.querySelector('meta[name="' + n + '"],meta[property="' + n + '"]'); return m ? m.content : null };
  const rgb = (c) => { const m = /rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*([\\d.]+))?\\)/.exec(c); if (!m) return null; if (m[4] !== undefined && Number(m[4]) < 0.5) return null; return '#' + [m[1], m[2], m[3]].map((x) => Number(x).toString(16).padStart(2, '0')).join('') };
  const counts = {};
  const add = (hex, where) => { if (!hex) return; const e = counts[hex] || (counts[hex] = { hex: hex, uses: 0, where: {} }); e.uses++; e.where[where] = (e.where[where] || 0) + 1 };
  const els = Array.prototype.slice.call(document.querySelectorAll('body *'), 0, 2500);
  for (const el of els) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    const tag = el.tagName.toLowerCase();
    const cls = (el.className && el.className.toString) ? el.className.toString() : '';
    const action = tag === 'a' || tag === 'button' || /btn|button|cta/i.test(cls);
    add(rgb(cs.backgroundColor), action ? 'action-bg' : 'bg');
    add(rgb(cs.color), /^h[1-3]$/.test(tag) ? 'heading-text' : action ? 'action-text' : 'text');
    if (parseFloat(cs.borderTopWidth) > 0) add(rgb(cs.borderTopColor), 'border');
    if (el instanceof SVGElement) add(rgb(cs.fill), 'svg');
  }
  const fam = (sel) => { const el = document.querySelector(sel); if (!el) return ''; return getComputedStyle(el).fontFamily.split(',')[0].replace(/["']/g, '').trim() };
  const fonts = { heading: fam('h1') || fam('h2'), body: fam('p') || fam('body'), button: fam('button') || fam('a[class*=btn],a[class*=button]'), code: fam('code') };
  const logoSel = 'header img,nav img,a[href="/"] img,img[class*="logo" i],img[alt*="logo" i],img[src*="logo" i]';
  const logoImages = [];
  document.querySelectorAll(logoSel).forEach((i) => { const u = abs(i.currentSrc || i.src); if (u && logoImages.indexOf(u) < 0 && i.getBoundingClientRect().width > 12) logoImages.push(u) });
  const inlineLogos = [];
  document.querySelectorAll('header svg,nav svg,a[href="/"] svg,[class*="logo" i] svg').forEach((s) => { const r = s.getBoundingClientRect(); if (r.width > 16 && r.height > 8 && s.outerHTML.length < 200000) { let h = s.outerHTML; if (h.indexOf('xmlns=') < 0) h = h.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"'); if (inlineLogos.indexOf(h) < 0) inlineLogos.push(h) } });
  const icons = [];
  document.querySelectorAll('link[rel~="icon"],link[rel="apple-touch-icon"],link[rel="mask-icon"]').forEach((l) => { const h = abs(l.href); if (h) icons.push({ rel: l.getAttribute('rel'), href: h, sizes: l.getAttribute('sizes') }) });
  return { title: document.title, description: meta('description'), themeColor: meta('theme-color'), ogImage: abs(meta('og:image') || ''), colors: Object.values(counts), fonts: fonts, inlineLogos: inlineLogos, logoImages: logoImages, icons: icons };
})()`;

const hexToRgb = (h: string): [number, number, number] =>
  [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];

function hsl([r, g, b]: [number, number, number]): { s: number; l: number } {
  const [R, G, B] = [r / 255, g / 255, b / 255];
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return { s, l };
}

/** Split page colours into accents (saturated, used on actions and headings) and neutrals, with contrast against white and black. */
export function classifyColors(colors: RawBrand["colors"]) {
  const dist = (a: string, b: string) => {
    const x = hexToRgb(a);
    const y = hexToRgb(b);
    return Math.abs(x[0] - y[0]) + Math.abs(x[1] - y[1]) + Math.abs(x[2] - y[2]);
  };
  // merge near-identical colours into the most used one
  const merged: RawBrand["colors"] = [];
  for (const c of [...colors].sort((a, b) => b.uses - a.uses)) {
    const near = merged.find((m) => dist(m.hex, c.hex) < 24);
    if (near) {
      near.uses += c.uses;
      for (const [k, v] of Object.entries(c.where)) near.where[k] = (near.where[k] ?? 0) + v;
    } else merged.push({ ...c, where: { ...c.where } });
  }
  const white = parseColor("#ffffff");
  const black = parseColor("#000000");
  const describe = (c: RawBrand["colors"][number]) => {
    const rgb = hexToRgb(c.hex);
    const col = parseColor(c.hex);
    return {
      hex: c.hex,
      uses: c.uses,
      where: Object.entries(c.where)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([k]) => k),
      onWhite: Math.round(contrastRatio(col, white) * 100) / 100,
      onBlack: Math.round(contrastRatio(col, black) * 100) / 100,
      ...hsl(rgb),
    };
  };
  const all = merged.map(describe);
  const weight = (c: ReturnType<typeof describe>) =>
    c.uses + (c.where.includes("action-bg") ? 40 : 0) + (c.where.includes("heading-text") ? 15 : 0);
  const strip = ({ s, l, ...rest }: ReturnType<typeof describe>) => (void s, void l, rest);
  const accents = all
    .filter((c) => c.s > 0.35 && c.l > 0.15 && c.l < 0.88)
    .sort((a, b) => weight(b) - weight(a))
    .slice(0, 5);
  const neutrals = all.filter((c) => !accents.includes(c)).slice(0, 6);
  return { accents: accents.map(strip), neutrals: neutrals.map(strip) };
}

/** Shrink a photo whose longest side is over `max` px (a 6000 px stock photo makes a slow, heavy project). */
function limitSide(file: string, max: number): void {
  const info = probeMedia(file);
  if (!info?.width || !info.height || Math.max(info.width, info.height) <= max) return;
  requireFfmpeg();
  const out = `${file}.tmp${extname(file)}`;
  const scale = info.width >= info.height ? `scale=${max}:-2` : `scale=-2:${max}`;
  execFileSync("ffmpeg", ["-y", "-v", "error", "-i", file, "-vf", scale, "-q:v", "2", out]);
  copyFileSync(out, file);
  try {
    execFileSync("rm", ["-f", out]);
  } catch {
    /* leave the temp file */
  }
}

export { classifyAssetLicense, relative };
