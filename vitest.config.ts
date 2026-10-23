import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["packages/*/test/**/*.test.{ts,tsx}", "tests/**/*.test.{ts,tsx}"],
    // Chrome, FFmpeg and HyperFrames renders run in many test files; on a small machine they starve each other
    // when run in parallel (renders get killed, MCP calls time out). One file at a time is slower but reliable.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
