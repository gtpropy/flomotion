import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import puppeteer, { type Browser, type Page } from "puppeteer-core";
import { CODECUT_DIR, type ResolvedFont } from "@codecut/core";
import { findChrome } from "../env.js";

export function fontFaceCss(root: string, fonts: ResolvedFont[]): string {
  const rules: string[] = [];
  for (const f of fonts) {
    if (f.source === "system") continue;
    for (const file of f.files) {
      const w = Array.isArray(file.weight) ? `${file.weight[0]} ${file.weight[1]}` : String(file.weight ?? 400);
      rules.push(
        `@font-face{font-family:${JSON.stringify(f.family)};src:url(${JSON.stringify(pathToFileURL(resolve(root, file.path)).href)}) format(${JSON.stringify(file.format)});font-weight:${w};font-style:${file.style ?? "normal"};font-display:block${file.unicodeRange ? `;unicode-range:${file.unicodeRange}` : ""}}`,
      );
    }
  }
  return rules.join("\n");
}

export interface ChromeSession {
  browser: Browser;
  page: Page;
  close(): Promise<void>;
}

/** Headless Chrome on a local page that declares the project's fonts. Never loads anything remote. */
export async function openFontPage(root: string, fonts: ResolvedFont[]): Promise<ChromeSession> {
  const dir = join(root, CODECUT_DIR, "tmp");
  mkdirSync(dir, { recursive: true });
  const html = `<!doctype html><meta charset="utf-8"><style>${fontFaceCss(root, fonts)}\nbody{margin:0}</style><body></body>`;
  const file = join(dir, "font-page.html");
  writeFileSync(file, html);
  const browser = await puppeteer.launch({
    executablePath: findChrome(),
    headless: true,
    args: ["--allow-file-access-from-files", "--no-sandbox", "--font-render-hinting=none", "--disable-lcd-text"],
  });
  const page = await browser.newPage();
  const remote: string[] = [];
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    const u = req.url();
    if (/^https?:/.test(u)) {
      remote.push(u);
      void req.abort();
    } else void req.continue();
  });
  await page.goto(pathToFileURL(file).href);
  (page as unknown as { __remote: string[] }).__remote = remote;
  return { browser, page, close: () => browser.close() };
}

export const remoteRequests = (s: ChromeSession): string[] => (s.page as unknown as { __remote: string[] }).__remote ?? [];
