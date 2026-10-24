import { spawn } from "node:child_process";
import { FlomotionError } from "@flomotion/core";
import { childEnv, hyperframesBin } from "./env.js";

export interface RunResult {
  code: number;
  stdout: string;
  stderr: string;
}

/** Run the installed HyperFrames CLI. Resolves with output; rejects only on spawn failure. */
export function runHyperframes(
  args: string[],
  opts: {
    cwd?: string;
    env?: NodeJS.ProcessEnv;
    timeoutMs?: number;
    onLine?: (l: string) => void;
  } = {},
): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [hyperframesBin(), ...args], {
      cwd: opts.cwd,
      env: childEnv(opts.env),
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    const feed = (buf: Buffer, which: "o" | "e") => {
      const s = buf.toString();
      if (which === "o") stdout += s;
      else stderr += s;
      if (opts.onLine) for (const l of s.split("\n")) if (l.trim()) opts.onLine(l);
    };
    child.stdout.on("data", (b) => feed(b, "o"));
    child.stderr.on("data", (b) => feed(b, "e"));
    child.on("error", reject);
    const timer = opts.timeoutMs
      ? setTimeout(() => {
          child.kill("SIGKILL");
          reject(
            new FlomotionError(
              "render_failed",
              `hyperframes ${args[0]} timed out after ${opts.timeoutMs} ms`,
            ),
          );
        }, opts.timeoutMs)
      : undefined;
    child.on("close", (code) => {
      if (timer) clearTimeout(timer);
      resolve({ code: code ?? 1, stdout, stderr });
    });
  });
}

// eslint-disable-next-line no-control-regex
export const stripAnsi = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, "");
