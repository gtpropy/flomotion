import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { FlomotionError } from "@flomotion/core";

const require = createRequire(import.meta.url);

export interface ToolInfo {
  path: string;
  version: string;
}

/** Locate FFmpeg/ffprobe on PATH or fail with an install hint. */
export function requireFfmpeg(bin: "ffmpeg" | "ffprobe" = "ffmpeg"): ToolInfo {
  try {
    const out = execFileSync(bin, ["-version"], { encoding: "utf8" });
    const version = out
      .split("\n")[0]!
      .replace(/^.*version\s+/, "")
      .split(" ")[0]!;
    const path = execFileSync("which", [bin], { encoding: "utf8" }).trim();
    return { path, version };
  } catch {
    throw new FlomotionError("missing_dependency", `${bin} was not found on PATH`, {
      fix: "Install FFmpeg: `brew install ffmpeg` (macOS), `sudo apt install ffmpeg` (Ubuntu), or https://ffmpeg.org/download.html",
    });
  }
}

export function findChrome(): string {
  const env = process.env.CHROME_PATH ?? process.env.PUPPETEER_EXECUTABLE_PATH;
  if (env && existsSync(env)) return env;
  const candidates = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ];
  for (const c of candidates) if (existsSync(c)) return c;
  throw new FlomotionError(
    "missing_dependency",
    "No Chrome/Chromium found for text measurement and font checks",
    {
      fix: "Install Google Chrome, or set CHROME_PATH to a Chrome/Chromium binary. `npx hyperframes browser` can download one.",
    },
  );
}

/** Absolute path of the installed hyperframes CLI entry. */
export function hyperframesBin(): string {
  const pkg = require.resolve("hyperframes/package.json");
  return join(dirname(pkg), "bin", "hyperframes.mjs");
}

export function gsapFile(): string {
  const pkg = require.resolve("gsap/package.json");
  return join(dirname(pkg), "dist", "gsap.min.js");
}

export function hyperframesVersion(): string {
  return (require("hyperframes/package.json") as { version: string }).version;
}

/** Environment for child processes: no telemetry, stable locale. */
export const childEnv = (extra: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv => ({
  ...process.env,
  HYPERFRAMES_NO_TELEMETRY: "1",
  DO_NOT_TRACK: "1",
  HYPERFRAMES_SKIP_SKILLS: "1",
  ...extra,
});
