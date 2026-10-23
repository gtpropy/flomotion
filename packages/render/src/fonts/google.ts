import { mkdirSync, existsSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { CodeCutError, type FontDecl } from "@codecut/core";
import { inspectFont, sha256 } from "./inspect.js";
import type { FontContext, FontFile, FontSource, FontSyncResult } from "./types.js";

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Build the css2 `family=` value per https://developers.google.com/fonts/docs/css2 (axes alphabetical, tuples sorted). */
export function css2FamilySpec(decl: FontDecl): string {
  const name = decl.family.trim().replace(/ /g, "+");
  const styles = decl.styles?.length ? decl.styles : ["normal"];
  const italics = styles.includes("italic");
  const wantNormal = styles.includes("normal") || !italics;
  const axes: Record<string, [number, number]> = { ...(decl.axes ?? {}) };
  const weights = [...(decl.weights ?? [])].sort((a, b) => a - b);
  const wght: string[] = [];
  if (decl.variable && axes.wght) wght.push(`${axes.wght[0]}..${axes.wght[1]}`);
  else if (weights.length) wght.push(...weights.map(String));
  else wght.push("400");
  const others = Object.keys(axes).filter((k) => k !== "wght" && k !== "ital");
  const tags = [...(italics ? ["ital"] : []), ...others, "wght"].sort((a, b) => {
    const lowA = a === a.toLowerCase();
    const lowB = b === b.toLowerCase();
    return lowA === lowB ? a.localeCompare(b, "en-US") : lowA ? -1 : 1;
  });
  const tuples: string[] = [];
  const italicVals = [...(wantNormal ? [0] : []), ...(italics ? [1] : [])];
  const otherRanges = others.map((o) => `${axes[o]![0]}..${axes[o]![1]}`);
  for (const it of italics ? italicVals : [undefined]) {
    for (const w of wght) {
      const vals: string[] = [];
      for (const t of tags) {
        if (t === "ital") vals.push(String(it));
        else if (t === "wght") vals.push(w);
        else vals.push(otherRanges[others.indexOf(t)]!);
      }
      tuples.push(vals.join(","));
    }
  }
  tuples.sort((a, b) => a.localeCompare(b, "en-US", { numeric: true }));
  return `${name}:${tags.join(",")}@${tuples.join(";")}`;
}

export interface ParsedFace {
  subset: string;
  family: string;
  style: string;
  weight: number | [number, number];
  url: string;
  unicodeRange?: string;
}

/** Parse the @font-face blocks the CSS API returns (each is preceded by `/* subset *\/`). */
export function parseGoogleCss(css: string): ParsedFace[] {
  const faces: ParsedFace[] = [];
  const re = /\/\*\s*([\w-]+)\s*\*\/\s*@font-face\s*\{([^}]*)\}/g;
  for (const m of css.matchAll(re)) {
    const body = m[2]!;
    const get = (k: string) => body.match(new RegExp(`${k}:\\s*([^;]+);`))?.[1]?.trim();
    const url = body.match(/url\((https?:[^)]+)\)/)?.[1];
    if (!url) continue;
    const w = (get("font-weight") ?? "400").split(/\s+/).map(Number);
    faces.push({
      subset: m[1]!,
      family: (get("font-family") ?? "").replace(/['"]/g, ""),
      style: get("font-style") ?? "normal",
      weight: w.length === 2 ? [w[0]!, w[1]!] : w[0]!,
      url,
      unicodeRange: get("unicode-range"),
    });
  }
  return faces;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function download(ctx: FontContext, url: string, attempts = 3): Promise<Buffer> {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await ctx.fetch(url, { headers: { "User-Agent": UA } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (e) {
      last = e;
      await sleep(400 * (i + 1));
    }
  }
  throw new CodeCutError("font_error", `Could not download ${url}: ${(last as Error).message}`, { fix: "Check your network, or use the Fontsource fallback by installing @fontsource/<id>." });
}

const LICENSE_MAP: Record<string, string> = { OFL: "OFL-1.1", APACHE2: "Apache-2.0", UFL: "Ubuntu-font-1.0" };

/**
 * Google serves woff2 files with the licence text stripped, so read the family's real licence from
 * its METADATA.pb in github.com/google/fonts (directories ofl, apache, ufl). Returns undefined offline.
 */
export async function googleFamilyLicense(family: string, ctx: FontContext): Promise<{ license: string; url: string; author?: string } | undefined> {
  const dirName = family.toLowerCase().replace(/[^a-z0-9]/g, "");
  for (const dir of ["ofl", "apache", "ufl"]) {
    const url = `https://raw.githubusercontent.com/google/fonts/main/${dir}/${dirName}/METADATA.pb`;
    try {
      const res = await ctx.fetch(url);
      if (!res.ok) continue;
      const body = await res.text();
      const raw = body.match(/license:\s*"([^"]+)"/)?.[1];
      const author = body.match(/designer:\s*"([^"]+)"/)?.[1];
      return { license: LICENSE_MAP[raw ?? ""] ?? raw ?? dir.toUpperCase(), url: url.replace("METADATA.pb", ""), author };
    } catch {
      /* try next */
    }
  }
  return undefined;
}

export class GoogleCssSource implements FontSource {
  readonly name = "google-css";
  matches(decl: FontDecl) {
    return decl.source === "google";
  }
  async sync(decl: FontDecl, ctx: FontContext): Promise<FontSyncResult> {
    const spec = css2FamilySpec(decl);
    const url = `https://fonts.googleapis.com/css2?family=${spec}&display=block`;
    ctx.log(`google css: ${url}`);
    const res = await ctx.fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) throw new CodeCutError("font_error", `Google Fonts CSS API returned ${res.status} for ${decl.family}`, { fix: "Check the family name, weights and axes against the family's page on fonts.google.com." });
    const css = await res.text();
    const wanted = new Set(decl.subsets?.length ? decl.subsets : ["latin"]);
    const faces = parseGoogleCss(css).filter((f) => wanted.has(f.subset));
    if (!faces.length) throw new CodeCutError("font_error", `No faces for ${decl.family} subsets ${[...wanted].join(", ")}`, { fix: "Pick a subset the family supports (see `font_get`)." });
    const dir = join(ctx.cacheDir, slug(decl.family));
    mkdirSync(dir, { recursive: true });
    const files: FontFile[] = [];
    for (const f of faces) {
      const buf = await download(ctx, f.url);
      const hash = sha256(buf);
      const abs = join(dir, `${f.subset}-${f.style}-${Array.isArray(f.weight) ? f.weight.join("-") : f.weight}-${hash.slice(0, 10)}.woff2`);
      if (!existsSync(abs)) writeFileSync(abs, buf);
      files.push({ abs, rel: relative(ctx.projectRoot, abs), hash, weight: f.weight, style: f.style, unicodeRange: f.unicodeRange, format: "woff2", subset: f.subset });
    }
    const info = inspectFont(files[0]!.abs);
    const variable = files.some((f) => Array.isArray(f.weight));
    const lic = await googleFamilyLicense(decl.family, ctx);
    const license = lic
      ? { ...info.license, license: lic.license, url: lic.url, commercialOk: /OFL|Apache|Ubuntu/i.test(lic.license) }
      : { ...info.license, license: "unknown", commercialOk: false };
    return { files, license, url: lic?.url ?? url, variable, axes: info.axes, route: "css-api" };
  }
}

/** Offline fallback: `@fontsource/<id>` or `@fontsource-variable/<id>` already in node_modules, else jsDelivr. */
export class FontsourceSource implements FontSource {
  readonly name = "fontsource";
  matches(decl: FontDecl) {
    return decl.source === "google" || decl.source === "fontsource";
  }
  async sync(decl: FontDecl, ctx: FontContext): Promise<FontSyncResult> {
    const id = slug(decl.family);
    const pkg = decl.variable ? `@fontsource-variable/${id}` : `@fontsource/${id}`;
    const base = findPackage(ctx.projectRoot, pkg);
    const subsets = decl.subsets?.length ? decl.subsets : ["latin"];
    const dir = join(ctx.cacheDir, id);
    mkdirSync(dir, { recursive: true });
    const files: FontFile[] = [];
    const weights = decl.variable ? [decl.axes?.wght ?? [300, 700]] : (decl.weights?.length ? decl.weights : [400]);
    for (const subset of subsets) {
      for (const w of weights) {
        for (const style of decl.styles?.length ? decl.styles : ["normal"]) {
          const name = decl.variable ? `${id}-${subset}-wght-${style}.woff2` : `${id}-${subset}-${w}-${style}.woff2`;
          let buf: Buffer;
          if (base && existsSync(join(base, "files", name))) buf = readFileSync(join(base, "files", name));
          else buf = await download(ctx, `https://cdn.jsdelivr.net/npm/${pkg}/files/${name}`);
          const hash = sha256(buf);
          const abs = join(dir, `fs-${name.replace(".woff2", "")}-${hash.slice(0, 10)}.woff2`);
          if (!existsSync(abs)) writeFileSync(abs, buf);
          files.push({ abs, rel: relative(ctx.projectRoot, abs), hash, weight: w as number | [number, number], style, format: "woff2", subset });
        }
      }
    }
    const info = inspectFont(files[0]!.abs);
    const lic = await googleFamilyLicense(decl.family, ctx);
    const license = lic ? { ...info.license, license: lic.license, url: lic.url, commercialOk: /OFL|Apache|Ubuntu/i.test(lic.license) } : { ...info.license, license: "unknown", commercialOk: false };
    return { files, license, url: `https://fontsource.org/fonts/${id}`, variable: !!decl.variable, axes: info.axes, route: "fontsource" };
  }
}

function findPackage(root: string, pkg: string): string | undefined {
  let dir = root;
  for (let i = 0; i < 6; i++) {
    const p = join(dir, "node_modules", pkg);
    if (existsSync(p)) return p;
    const parent = join(dir, "..");
    if (parent === dir) break;
    dir = parent;
  }
  return undefined;
}

/** Developer API (needs GOOGLE_FONTS_API_KEY): metadata for search, categories, variants, axes, subsets. */
export interface GoogleFontMeta {
  family: string;
  category: string;
  variants: string[];
  subsets: string[];
  version: string;
  axes?: Array<{ tag: string; start: number; end: number }>;
  files?: Record<string, string>;
}

export async function googleFontsApi(opts: { key: string; family?: string; sort?: string; subset?: string; category?: string; fetch?: typeof fetch }): Promise<GoogleFontMeta[]> {
  const q = new URLSearchParams({ key: opts.key, capability: "VF" });
  q.append("capability", "WOFF2");
  if (opts.family) q.set("family", opts.family);
  if (opts.sort) q.set("sort", opts.sort);
  if (opts.subset) q.set("subset", opts.subset);
  if (opts.category) q.set("category", opts.category);
  const res = await (opts.fetch ?? fetch)(`https://www.googleapis.com/webfonts/v1/webfonts?${q}`);
  if (!res.ok) throw new CodeCutError("font_error", `Google Fonts Developer API returned ${res.status}`, { fix: "Check GOOGLE_FONTS_API_KEY." });
  const json = (await res.json()) as { items?: GoogleFontMeta[] };
  return json.items ?? [];
}

export { readdirSync };
