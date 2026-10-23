import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { cleanup, connect, doubles, REPO, tmpProject, type Harness } from "./harness.js";
import { TOOL_NAMES } from "../src/server.js";
// @ts-expect-error plain ESM script without types
import { bundle } from "../../../scripts/bundle.mjs";

let root: string;
let h: Harness;
beforeAll(async () => {
  root = tmpProject("res");
  h = await connect(root, doubles(root).deps);
  await h.call("project_create", { name: "Res", size: "540x960", template: "saas-promo" });
});
afterAll(async () => {
  await h.close();
  cleanup(root);
});

const text = (r: { contents: Array<Record<string, unknown>> }) =>
  JSON.parse(String(r.contents[0]!.text));

describe("resources", () => {
  it("lists the schema template and the fixed resources", async () => {
    const fixed = (await h.client.listResources()).resources.map((r) => r.uri);
    expect(fixed).toEqual(
      expect.arrayContaining(["codecut://project/outline", "codecut://ledger", "codecut://looks"]),
    );
    expect(fixed).toContain("codecut://schema/Title");
    expect(fixed.filter((u) => u.startsWith("codecut://schema/")).length).toBeGreaterThan(70);
  });
  it("codecut://schema/{component} has the JSON schema and the generated docs", async () => {
    const r = text(await h.client.readResource({ uri: "codecut://schema/Title" }));
    expect(r).toMatchObject({ name: "Title", kind: "component", stub: false });
    expect(Object.keys(r.schema.properties)).toEqual(
      expect.arrayContaining(["text", "size", "weight", "tracking", "enter"]),
    );
    expect(r.docs).toContain("# Title");
    const fx = text(await h.client.readResource({ uri: "codecut://schema/Shake" }));
    expect(fx.kind).toBe("effect");
    await expect(h.client.readResource({ uri: "codecut://schema/Nope" })).rejects.toThrow(
      /Unknown component/,
    );
  });
  it("codecut://project/outline", async () => {
    const r = text(await h.client.readResource({ uri: "codecut://project/outline" }));
    expect(r.type).toBe("Composition");
    expect(r.children[0].children).toHaveLength(6);
  });
  it("codecut://looks has every Look as data", async () => {
    const r = text(await h.client.readResource({ uri: "codecut://looks" }));
    expect(r.map((l: any) => l.id)).toEqual([
      "clean-light",
      "dark-product",
      "bold-kinetic",
      "kinetic",
      "minimal",
      "sketch",
    ]);
    for (const l of r) {
      expect(l.palette).toBeTruthy();
      expect(l.fonts.length).toBeGreaterThanOrEqual(3);
      expect(l.easing).toBeTruthy();
      expect(l.transition.type).toBeTruthy();
      expect(l.sound).toBeTruthy();
    }
  });
  it("codecut://ledger starts empty and shows entries after sound_get", async () => {
    expect(text(await h.client.readResource({ uri: "codecut://ledger" })).entries).toEqual([]);
    await h.call("sound_get", { id: "9004", tag: "ui/pop" });
    const l = text(await h.client.readResource({ uri: "codecut://ledger" }));
    expect(l.entries[0]).toMatchObject({ source: "freesound", id: "9004", license: "CC0-1.0" });
  });
});

describe("server behaviour", () => {
  it("returns typed errors with isError, never throws across the protocol", async () => {
    const r = await h.raw("element_set", { id: "ghost", props: { x: 1 } });
    expect(r.isError).toBe(true);
    const j = JSON.parse((r.content[0] as any).text);
    expect(j.error).toMatchObject({ code: "unknown_element" });
    expect(j.error.fix).toBeTruthy();
  });
  it("validates tool arguments against the input schema", async () => {
    await expect(
      h.client.callTool({ name: "element_add", arguments: { parent: "hook" } }),
    ).resolves.toMatchObject({ isError: true });
  });
  it("rejects paths outside the project folder", async () => {
    const r = await h.raw("transcribe", { audio: "../../../etc/hosts" });
    expect(JSON.parse((r.content[0] as any).text).error.code).toBe("path_outside_project");
    const s = await h.raw("voice_quote", { provider: "recording", text: "", voice: "../x.wav" });
    expect(s.isError).toBeFalsy(); // quoting never touches the file
    const g = await h.raw("voice_generate", {
      quoteId: JSON.parse((s.content[0] as any).text).quoteId,
    });
    expect(JSON.parse((g.content[0] as any).text).error.code).toMatch(
      /asset_missing|path_outside_project/,
    );
    expect(existsSync(join(root, "..", "x.wav"))).toBe(false);
  });
  it("marks read-only tools", async () => {
    const tools = (await h.client.listTools()).tools;
    const ro = tools.filter((t) => t.annotations?.readOnlyHint).map((t) => t.name);
    expect(ro).toEqual(
      expect.arrayContaining([
        "project_read",
        "lint",
        "sound_search",
        "font_list",
        "voice_quote",
        "review",
      ]),
    );
    expect(ro).not.toContain("element_add");
    expect(tools).toHaveLength(TOOL_NAMES.length);
  });
});

describe("stdio transport (the bundled CLI as a real child process, as Claude Code starts it)", () => {
  it("serves tools over stdio from the CLI entry point", async () => {
    await bundle();
    const dir = tmpProject("stdio");
    const transport = new StdioClientTransport({
      command: "node",
      args: [join(REPO, "packages/cli/dist/bin.mjs"), "mcp", "--dir", dir],
      cwd: dir,
      env: { ...(process.env as Record<string, string>), HYPERFRAMES_NO_TELEMETRY: "1" },
      stderr: "pipe",
    });
    const client = new Client({ name: "stdio-test", version: "1" });
    await client.connect(transport);
    try {
      const tools = (await client.listTools()).tools.map((t) => t.name);
      expect(tools).toEqual(expect.arrayContaining(TOOL_NAMES));
      const r = (await client.callTool({
        name: "project_create",
        arguments: { name: "Over Stdio", size: "540x960" },
      })) as any;
      expect(JSON.parse(r.content[0].text).id).toBe("over-stdio");
      expect(readFileSync(join(dir, "project.tsx"), "utf8")).toContain(
        '<Composition id="over-stdio"',
      );
      const read = (await client.callTool({ name: "project_read", arguments: {} })) as any;
      const body = JSON.parse(read.content[0].text);
      expect(body.error?.message ?? body.outline.type).toBe("Composition");
    } finally {
      await client.close();
      cleanup(dir);
    }
  }, 60_000);
});
