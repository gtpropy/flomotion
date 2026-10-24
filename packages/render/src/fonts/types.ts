import type { FontDecl } from "@flomotion/core";

export interface FontFile {
  /** Absolute path on disk. */
  abs: string;
  /** Path relative to the project root (what the lock stores). */
  rel: string;
  hash: string;
  weight: number | [number, number];
  style: string;
  unicodeRange?: string;
  format: "woff2" | "woff" | "truetype" | "opentype";
  subset?: string;
}

export interface LicenseInfo {
  license: string;
  url?: string;
  attributionRequired: boolean;
  commercialOk: boolean;
  copyright?: string;
}

export interface FontSyncResult {
  files: FontFile[];
  license: LicenseInfo;
  url?: string;
  variable: boolean;
  axes?: Record<string, [number, number]>;
  /** Which route produced the files: css-api, fontsource, local, url. */
  route: string;
}

export interface FontContext {
  projectRoot: string;
  cacheDir: string;
  log: (msg: string) => void;
  fetch: typeof fetch;
}

/** One way of getting a font onto disk. Only `sync` may touch the network. */
export interface FontSource {
  readonly name: string;
  matches(decl: FontDecl): boolean;
  sync(decl: FontDecl, ctx: FontContext): Promise<FontSyncResult>;
}
