import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";
import type { Deps } from "./context.js";

export * from "./server.js";
export * from "./context.js";
export * from "./store.js";
export * from "./scaffold.js";
export * from "./review.js";
export * from "./codemod/tsx.js";
export * from "./codemod/print.js";
export * from "./providers/sounds.js";
export * from "./providers/voice.js";
export * from "./providers/transcribe.js";
export { PRESETS } from "./tools/media.js";

/** Serve the MCP server for `root` over stdio (what `codecut mcp` and `npx codecut mcp` run). */
export async function serveStdio(root: string, deps: Deps = {}): Promise<void> {
  const { server } = createServer(root, deps);
  await server.connect(new StdioServerTransport());
}
