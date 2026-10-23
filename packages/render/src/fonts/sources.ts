import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, extname, join, relative, resolve } from "node:path";
import { CodeCutError, classifyFontLicense, type FontDecl } from "@codecut/core";
import { formatOf, inspectFont, sha256 } from "./inspect.js";
import type { FontContext, FontFile, FontSource, FontSyncResult } from "./types.js";

const weightOf = (decl: FontDecl, info: ReturnType<typeof inspectFont>): number | [number, number] =>
  info.variable && info.axes.wght ? [info.axes.wght[0], info.axes.wght[1]] : decl.weights?.[0] ?? info.weight ?? 400;

/** Local files in the project's fonts/ folder (static or variable). Needs a declared licence. */
export class LocalSource implements FontSource {
  readonly name = "local";
  matches(decl: FontDecl) {
    return !/^https?:/.test(decl.source) && decl.source !== "google" && decl.source !== "system" && decl.source !== "fontsource";
  }
  async sync(decl: FontDecl, ctx: FontContext): Promise<FontSyncResult> {
    const abs = resolve(ctx.projectRoot, decl.source);
    if (!existsSync(abs)) throw new CodeCutError("font_error", `Font "${decl.id}": file ${decl.source} does not exist`, { fix: "Put the font file in the project's fonts/ folder and fix the path." });
    const info = inspectFont(abs);
    const own = classifyFontLicense([info.license.copyright, info.license.url, info.license.license].join(" "));
    const declared = decl.license;
    if (!declared) {
      throw new CodeCutError("font_error", `Font "${decl.id}" (${decl.source}) needs a license prop`, { fix: 'Add license="OFL-1.1" (or the font\'s real licence) to <Font>. The font file says: ' + (info.license.license === "unknown" ? "no recognisable licence" : info.license.license) });
    }
    const buf = readFileSync(abs);
    const file: FontFile = { abs, rel: relative(ctx.projectRoot, abs), hash: sha256(buf), weight: weightOf(decl, info), style: decl.styles?.[0] ?? (info.italic ? "italic" : "normal"), format: formatOf(abs) };
    return {
      files: [file],
      license: { license: declared, attributionRequired: false, commercialOk: own.commercialOk || /ofl|apache|mit|ubuntu|cc0|commercial/i.test(declared), copyright: info.license.copyright },
      variable: info.variable,
      axes: info.axes,
      route: "local",
    };
  }
}

/** Any URL to a font file: downloaded once, hashed, cached, and recorded with the supplied licence. */
export class UrlSource implements FontSource {
  readonly name = "url";
  matches(decl: FontDecl) {
    return /^https?:/.test(decl.source);
  }
  async sync(decl: FontDecl, ctx: FontContext): Promise<FontSyncResult> {
    if (!decl.license) throw new CodeCutError("font_error", `Font "${decl.id}" from a URL needs a license prop`, { fix: 'Add license="…" with the licence the file is distributed under.' });
    const res = await ctx.fetch(decl.source);
    if (!res.ok) throw new CodeCutError("font_error", `Could not download ${decl.source} (${res.status})`);
    const buf = Buffer.from(await res.arrayBuffer());
    const hash = sha256(buf);
    const dir = join(ctx.cacheDir, "url");
    mkdirSync(dir, { recursive: true });
    const ext = extname(new URL(decl.source).pathname) || ".woff2";
    const abs = join(dir, `${basename(decl.id)}-${hash.slice(0, 10)}${ext}`);
    if (!existsSync(abs)) writeFileSync(abs, buf);
    const info = inspectFont(abs);
    return {
      files: [{ abs, rel: relative(ctx.projectRoot, abs), hash, weight: weightOf(decl, info), style: decl.styles?.[0] ?? "normal", format: formatOf(abs) }],
      license: { license: decl.license, url: decl.source, attributionRequired: false, commercialOk: /ofl|apache|mit|ubuntu|cc0/i.test(decl.license) },
      url: decl.source,
      variable: info.variable,
      axes: info.axes,
      route: "url",
    };
  }
}

/** System fonts: no files. Output differs per machine, so the linter warns and `allowSystem` is required. */
export class SystemSource implements FontSource {
  readonly name = "system";
  matches(decl: FontDecl) {
    return decl.source === "system";
  }
  async sync(decl: FontDecl): Promise<FontSyncResult> {
    return { files: [], license: { license: "system", attributionRequired: false, commercialOk: false }, variable: !!decl.variable, route: "system", url: undefined };
  }
}

export { copyFileSync };
