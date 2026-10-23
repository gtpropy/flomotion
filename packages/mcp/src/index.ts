import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";
import { startUi } from "./ui/server.js";
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
export * from "./activity.js";
export { startUi, type UiOptions, type UiServer } from "./ui/server.js";

/** Serve the MCP server for `root` over stdio (what `codecut mcp` and `npx codecut mcp` run). */
export async function serveStdio(
  root: string,
  deps: Deps = {},
  opts: { ui?: boolean | { port?: number } } = {},
): Promise<void> {
  const { server, ctx } = createServer(root, deps);
  if (opts.ui) {
    // stdout belongs to the protocol: the address goes to stderr
    const ui = await startUi(root, {
      port: typeof opts.ui === "object" ? opts.ui.port : undefined,
      deps,
      log: (l) => process.stderr.write(`[flomotion] ${l}\n`),
    });
    ctx.uiUrl = ui.url;
    process.once("exit", () => void ui.close());
  }
  await server.connect(new StdioServerTransport());
}
