import { readFileSync, statSync } from "node:fs";
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import {
  CODECUT_NAME,
  CodeCutError,
  docsMarkdown,
  isCodeCutError,
  listLooks,
  propsJsonSchema,
} from "@codecut/core";
import { registry } from "@codecut/components";
import { readLedger } from "@codecut/render";
import { Context, type Deps } from "./context.js";
import { outlineOf, type ToolDef } from "./tools/util.js";
import {
  elementAdd,
  elementMove,
  elementRemove,
  elementSet,
  editTool,
  effectAdd,
  keyframeSet,
  lintTool,
  projectRead,
  sceneWrite,
} from "./tools/edit.js";
import { historyList, historyRestore, projectCreate } from "./tools/project.js";
import { contactSheet, frameRender, mixPreview, renderTool, reviewTool } from "./tools/media.js";
import { soundAuto, soundGet, soundSearch } from "./tools/sound.js";
import { fontCheck, fontGet, fontList, fontPreview, fontSearch } from "./tools/fonts.js";
import { alignToVoice, transcribe, voiceGenerate, voiceQuote } from "./tools/voice.js";

export const TOOLS: ToolDef<any>[] = [
  projectCreate,
  projectRead,
  elementAdd,
  elementSet,
  elementRemove,
  elementMove,
  effectAdd,
  keyframeSet,
  editTool,
  sceneWrite,
  lintTool,
  frameRender,
  contactSheet,
  soundSearch,
  soundGet,
  soundAuto,
  fontSearch,
  fontGet,
  fontList,
  fontPreview,
  fontCheck,
  transcribe,
  voiceQuote,
  voiceGenerate,
  alignToVoice,
  mixPreview,
  renderTool,
  historyList,
  historyRestore,
  reviewTool,
];

export const TOOL_NAMES = TOOLS.map((t) => t.name);

const MAX_IMAGE_BYTES = 3_500_000;

/** The result shape every tool error uses: typed code, message, fix hint. */
export function errorResult(e: unknown): CallToolResult {
  const err = isCodeCutError(e)
    ? e.toJSON()
    : {
        code: "internal_error",
        message: e instanceof Error ? e.message : String(e),
        fix: "This is a bug or an environment problem; the message says which.",
      };
  return {
    isError: true,
    content: [{ type: "text", text: JSON.stringify({ error: err }, null, 2) }],
  };
}

export interface CodeCutServer {
  server: McpServer;
  ctx: Context;
}

/** Build the MCP server for one project folder. */
export function createServer(root: string, deps: Deps = {}): CodeCutServer {
  const ctx = new Context(root, deps);
  const server = new McpServer(
    { name: CODECUT_NAME.toLowerCase(), version: "0.2.0" },
    {
      instructions: `${CODECUT_NAME} edits a video that is one TSX file. Every tool works on the project in ${ctx.root}. Writes return a patch, a description and an undo token. Errors are typed with a fix hint. You cannot hear audio or judge taste: describe what you measured and ask the user to listen and approve.`,
    },
  );

  for (const t of TOOLS) {
    server.registerTool(
      t.name,
      {
        title: t.title,
        description: t.description,
        inputSchema: t.input,
        annotations: { readOnlyHint: !!t.readOnly, destructiveHint: false },
      },
      async (args: unknown): Promise<CallToolResult> => {
        try {
          const out = await t.run(args as never, ctx);
          const content: CallToolResult["content"] = [
            { type: "text", text: JSON.stringify(out.data, null, 2) },
          ];
          for (const img of out.images ?? []) {
            try {
              if (statSync(img.path).size <= MAX_IMAGE_BYTES)
                content.push({
                  type: "image",
                  data: readFileSync(img.path).toString("base64"),
                  mimeType: img.mime,
                });
            } catch {
              /* the path is already in the text */
            }
          }
          return { content };
        } catch (e) {
          return errorResult(e);
        }
      },
    );
  }

  // ---------- resources ----------
  const json = (uri: string, v: unknown) => ({
    contents: [{ uri, mimeType: "application/json", text: JSON.stringify(v, null, 2) }],
  });

  server.registerResource(
    "component-schema",
    new ResourceTemplate("codecut://schema/{component}", {
      list: async () => ({
        resources: registry
          .list()
          .filter((d) => !/^(Test|CT|PBlock)/.test(d.name))
          .map((d) => ({
            uri: `codecut://schema/${d.name}`,
            name: d.name,
            description: d.description,
            mimeType: "application/json",
          })),
      }),
    }),
    {
      title: "Component schema",
      description: "JSON schema and reference docs for a component or effect.",
    },
    async (uri, { component }) => {
      const def = registry.get(String(component));
      if (!def)
        throw new CodeCutError("schema_violation", `Unknown component "${component}"`, {
          fix: `One of: ${registry.names().join(", ")}`,
        });
      return json(uri.href, {
        name: def.name,
        kind: def.kind,
        category: def.category,
        stub: !!def.stub,
        schema: propsJsonSchema(def),
        docs: docsMarkdown(def),
      });
    },
  );
  server.registerResource(
    "project-outline",
    "codecut://project/outline",
    {
      title: "Project outline",
      description: "Tracks, scenes and element ids.",
      mimeType: "application/json",
    },
    async (uri) => {
      ctx.requireProject();
      const loaded = await ctx.store.load();
      return json(uri.href, outlineOf(loaded.node, 6));
    },
  );
  server.registerResource(
    "ledger",
    "codecut://ledger",
    {
      title: "Licence ledger",
      description: "Every sound, font and voice file with its licence.",
      mimeType: "application/json",
    },
    async (uri) => json(uri.href, readLedger(ctx.root)),
  );
  server.registerResource(
    "looks",
    "codecut://looks",
    {
      title: "Looks",
      description:
        "Palette, fonts, type scale, easing, transition, texture and sound palette of each Look.",
      mimeType: "application/json",
    },
    async (uri) => json(uri.href, listLooks()),
  );

  return { server, ctx };
}
