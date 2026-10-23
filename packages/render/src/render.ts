import { existsSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { CodeCutError } from "@codecut/core";
import { requireFfmpeg } from "./env.js";
import { runHyperframes, stripAnsi } from "./hf.js";

export interface RenderOptions {
  /** Output file (default: <dir>/renders/<name>.mp4). */
  output?: string;
  fps?: number;
  quality?: "draft" | "looks" | "delivery";
  workers?: number | "auto";
  /** Use SwiftShader rather than the host GPU for cross-machine determinism. */
  software?: boolean;
  quiet?: boolean;
  onLine?: (line: string) => void;
}

export interface RenderResult {
  output: string;
  bytes: number;
  log: string;
}

/** Render a materialized project directory with HyperFrames. Fails loudly on any error. */
export async function renderProjectDir(
  dir: string,
  opts: RenderOptions = {},
): Promise<RenderResult> {
  requireFfmpeg();
  const output = resolve(opts.output ?? join(dir, "renders", "out.mp4"));
  const args = ["render", dir, "-o", output];
  if (opts.fps) args.push("-f", String(opts.fps));
  if (opts.quality) args.push("-q", opts.quality);
  if (opts.workers !== undefined) args.push("-w", String(opts.workers));
  if (opts.software) args.push("--no-browser-gpu");
  if (opts.quiet !== false) args.push("--quiet");
  const r = await runHyperframes(args, { cwd: dir, onLine: opts.onLine, timeoutMs: 30 * 60_000 });
  const log = stripAnsi(r.stdout + "\n" + r.stderr);
  if (r.code !== 0 || !existsSync(output)) {
    throw new CodeCutError("render_failed", `hyperframes render failed (exit ${r.code})`, {
      fix: "See the details for the HyperFrames log; run `codecut lint` first.",
      details: log
        .split("\n")
        .filter((l) => /error|fail|404|timeout/i.test(l))
        .slice(0, 20),
    });
  }
  return { output, bytes: statSync(output).size, log };
}

export interface SnapshotOptions {
  /** Times in seconds. */
  times: number[];
  outDir: string;
  software?: boolean;
}

/** Capture exact-time PNG stills of a materialized project. Returns file paths in time order given. */
export async function snapshotFrames(
  dir: string,
  opts: SnapshotOptions,
): Promise<{ files: string[]; contactSheet?: string }> {
  const args = ["snapshot", dir, "--at", opts.times.join(","), "-o", opts.outDir, "--no-end"];
  if (opts.software) args.push("--no-browser-gpu");
  const r = await runHyperframes(args, { cwd: dir, timeoutMs: 10 * 60_000 });
  if (r.code !== 0) {
    throw new CodeCutError("render_failed", `hyperframes snapshot failed (exit ${r.code})`, {
      details: stripAnsi(r.stdout + r.stderr)
        .split("\n")
        .slice(-15),
    });
  }
  const files = opts.times.map((t, i) =>
    join(opts.outDir, `frame-${String(i).padStart(2, "0")}-at-${t}s.png`),
  );
  const sheet = join(opts.outDir, "contact-sheet.jpg");
  return { files: files.filter(existsSync), contactSheet: existsSync(sheet) ? sheet : undefined };
}
