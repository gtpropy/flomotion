import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { extname } from "node:path";
import * as fontkit from "fontkit";
import { classifyFontLicense } from "@codecut/core";
import type { LicenseInfo } from "./types.js";

export const sha256 = (buf: Buffer | string) => createHash("sha256").update(buf).digest("hex");

export const formatOf = (path: string): "woff2" | "woff" | "truetype" | "opentype" => {
  switch (extname(path).toLowerCase()) {
    case ".woff2":
      return "woff2";
    case ".woff":
      return "woff";
    case ".otf":
      return "opentype";
    default:
      return "truetype";
  }
};

export interface FontInfo {
  family: string;
  fullName: string;
  license: LicenseInfo;
  variable: boolean;
  axes: Record<string, [number, number]>;
  weight?: number;
  italic: boolean;
  glyphs: (cp: number) => boolean;
}

const cache = new Map<string, FontInfo>();

/** Read a font file's own metadata: names, licence text, variation axes, glyph coverage. */
export function inspectFont(path: string): FontInfo {
  const buf = readFileSync(path);
  const key = sha256(buf);
  const hit = cache.get(key);
  if (hit) return hit;
  const raw = fontkit.create(buf) as any;
  const font = raw.fonts ? raw.fonts[0] : raw;
  const lic = [font.license, font.licenseURL, font.copyright].filter(Boolean).join(" \n ");
  const cls = classifyFontLicense(lic);
  const axes: Record<string, [number, number]> = {};
  for (const [tag, a] of Object.entries(
    (font.variationAxes ?? {}) as Record<string, { min: number; max: number }>,
  ))
    axes[tag] = [a.min, a.max];
  const info: FontInfo = {
    family: font.familyName ?? "",
    fullName: font.fullName ?? "",
    license: {
      license: cls.license,
      url: font.licenseURL || undefined,
      attributionRequired: false,
      commercialOk: cls.commercialOk,
      copyright: font.copyright || undefined,
    },
    variable: Object.keys(axes).length > 0,
    axes,
    weight: font["OS/2"]?.usWeightClass,
    italic: !!(font["OS/2"]?.fsSelection?.italic || /italic/i.test(font.subfamilyName ?? "")),
    glyphs: (cp) => !!font.hasGlyphForCodePoint?.(cp),
  };
  cache.set(key, info);
  return info;
}
