import { afterAll, beforeAll, describe, expect, it } from "vitest";
import http from "node:http";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { startUi, type UiServer } from "../src/ui/server.js";
import { cleanup, connect, doubles, REPO, tmpProject, ToolError, type Harness } from "./harness.js";
// @ts-expect-error plain ESM script without types
import { bundle } from "../../../scripts/bundle.mjs";

let root: string;
let h: Harness;
let ui: UiServer;
let base: string;
const get = async (path: string, init?: RequestInit) => fetch(base + path, init);
const j = async (path: string) => (await get(path)).json() as Promise<any>;
const until = async <T>(f: () => Promise<T | undefined | false>, ms = 8000): Promise<T> => {
  const end = Date.now() + ms;
  for (;;) {
    const v = await f();
    if (v) return v as T;
    if (Date.now() > end) throw new Error("timed out waiting");
    await new Promise((r) => setTimeout(r, 100));
  }
};

beforeAll(async () => {
  root = tmpProject("ui");
  const d = doubles(root);
  h = await connect(root, d.deps);
  ui = await startUi(root, { port: 0, deps: d.deps });
  base = ui.url;
}, 60_000);
afterAll(async () => {
  await ui.close();
  await h.close();
  cleanup(root);
});

describe("live view server", () => {
  it("serves one self-contained page that reaches nothing outside localhost", async () => {
    const r = await get("/");
    expect(r.status).toBe(200);
    expect(r.headers.get("content-type")).toContain("text/html");
    const html = await r.text();
    expect(html).toContain("flomotion");
    expect(html).toContain("EventSource");
    expect(html.match(/https?:\/\/[^\s"'<>)]+/g) ?? []).toEqual([]); // no CDN, no font service, no analytics
    expect(ui.url).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/);
  });

  it("only answers requests addressed to localhost (DNS rebinding)", async () => {
    const status = (host: string) =>
      new Promise<number>((resolve, reject) => {
        const req = http.get(
          { host: "127.0.0.1", port: ui.port, path: "/api/state", headers: { Host: host } },
          (res) => {
            res.resume();
            resolve(res.statusCode!);
          },
        );
        req.on("error", reject);
      });
    expect(await status(`127.0.0.1:${ui.port}`)).toBe(200);
    expect(await status(`localhost:${ui.port}`)).toBe(200);
    expect(await status("evil.example.com")).toBe(403);
    expect(await status(`evil.example.com:${ui.port}`)).toBe(403);
  });

  it("shows an empty state before there is a project", async () => {
    const s = await j("/api/state");
    expect(s.project.exists).toBe(false);
    expect(s.activity).toEqual([]);
    expect(s.gates.every((g: any) => !g.exists)).toBe(true);
    expect(s.review).toBeNull();
  });

  it("shows the outline, timeline, history and Claude's calls as they happen", async () => {
    await h.call("project_create", { name: "Live Test", size: "540x960", template: "saas-promo" });
    await h.call("element_add", {
      parent: "hook",
      type: "Title",
      props: { id: "t1", text: "Hello", at: "center" },
    });
    const s = await until(async () => {
      const x = await j("/api/state");
      return x.activity.length >= 2 ? x : false;
    });
    expect(s.project).toMatchObject({ exists: true, name: "live-test", file: "project.tsx" });
    expect(s.project.outline.type).toBe("Composition");
    const scenes = s.project.timeline.tracks[0].items;
    expect(scenes.map((i: any) => i.id)).toEqual([
      "hook",
      "problem",
      "reveal",
      "features",
      "proof",
      "cta",
    ]);
    expect(scenes[1]).toMatchObject({ start: 3, duration: 5 });
    expect(s.project.timeline).toMatchObject({ fps: 30, duration: 30, size: [540, 960] });
    // newest first, with what the call did
    expect(s.activity[0]).toMatchObject({
      tool: "element_add",
      ok: true,
      summary: "add Title #t1 to #hook",
    });
    expect(s.activity[0].undo).toMatch(/^h\d+$/);
    expect(s.activity[1].tool).toBe("project_create");
    expect(s.history[0].description).toContain("add Title");
  });

  it("logs failed calls with their error code", async () => {
    await expect(
      h.call("element_add", { parent: "ghost", type: "Title", props: {} }),
    ).rejects.toBeInstanceOf(ToolError);
    const s = await j("/api/state");
    expect(s.activity[0]).toMatchObject({ tool: "element_add", ok: false });
    expect(s.activity[0].summary).toContain("unknown_element");
  });

  it("pushes a change event over SSE when the project changes", async () => {
    const events: string[] = [];
    const req = http.get({ host: "127.0.0.1", port: ui.port, path: "/events" }, (res) => {
      res.setEncoding("utf8");
      res.on("data", (c: string) => events.push(c));
    });
    try {
      await until(async () => events.join("").includes("event: hello"));
      await h.call("element_set", { id: "t1", props: { size: 99 } });
      const got = await until(
        async () => events.join("").match(/event: change\ndata: (\{.*\})/)?.[1],
      );
      const what = JSON.parse(got).what as string[];
      expect(what).toEqual(expect.arrayContaining(["project"]));
      expect(what).toContain("activity");
    } finally {
      req.destroy();
    }
  });

  it("serves the source and the snapshot before the last write, for the diff", async () => {
    const src = await j("/api/source");
    expect(src.source).toContain("size={99}");
    expect(src.previous).not.toContain("size={99}");
    expect(src.previousId).toMatch(/^h\d+$/);
  });

  it("renders a preview frame on demand with its own build folder, and caches it", async () => {
    for (const id of ["display", "body", "mono"]) await h.call("font_get", { id });
    const r = await get("/api/frame?t=1.2");
    expect(r.status).toBe(200);
    expect(r.headers.get("content-type")).toBe("image/png");
    const png = Buffer.from(await r.arrayBuffer());
    expect(png.subarray(1, 4).toString()).toBe("PNG");
    expect(png.length).toBeGreaterThan(3000);
    // the agent's own build folder was not touched
    expect(existsSync(join(root, ".flomotion", "ui-build", "index.html"))).toBe(true);
    expect(existsSync(join(root, ".flomotion", "build"))).toBe(false);
    const t0 = Date.now();
    const again = await get("/api/frame?t=1.2");
    expect(Buffer.from(await again.arrayBuffer()).equals(png)).toBe(true);
    expect(Date.now() - t0).toBeLessThan(2000); // no second render
    const bad = await get("/api/frame?t=abc");
    expect(bad.status).toBe(400);
  }, 180_000);

  it("shows frames the agent renders, and serves media with range requests", async () => {
    const f = await h.call("frame_render", { time: 1 });
    const s = await j("/api/state");
    expect(s.frames.map((x: any) => x.file)).toContain(f.path);
    const r = await get(`/files/${f.path}`);
    expect(r.status).toBe(200);
    expect(r.headers.get("accept-ranges")).toBe("bytes");
    const part = await get(`/files/${f.path}`, { headers: { Range: "bytes=0-7" } });
    expect(part.status).toBe(206);
    expect(
      Buffer.from(await part.arrayBuffer())
        .subarray(1, 4)
        .toString(),
    ).toBe("PNG");
    expect(part.headers.get("content-range")).toMatch(/^bytes 0-7\//);
  }, 180_000);

  it("never serves the project source, the ledger internals, or anything outside the folder", async () => {
    for (const p of [
      "/files/project.tsx",
      "/files/.flomotion/ledger.json",
      "/files/.flomotion/history/index.json",
      "/files/..%2F..%2Fetc%2Fpasswd",
      "/files/%2e%2e/%2e%2e/etc/hosts",
      "/files/assets/../project.tsx",
      "/files/renders/../../project.tsx",
      "/files/.flomotion/activity.jsonl",
    ]) {
      const r = await get(p);
      expect(r.status, p).toBe(404);
    }
  });

  it("the storyboard board: shows beats and ideas, takes ideas only with the page's header", async () => {
    writeFileSync(
      join(root, "storyboard.md"),
      "# Storyboard: test\n\n## 1. Hook · 0-2 s\n- Scene: s0\n- Voice: hi\n\n## 2. Next · 2-4 s\n- Scene: nope\n",
    );
    const noHeader = await get("/api/board/idea", {
      method: "POST",
      body: JSON.stringify({ text: "x" }),
    });
    expect(noHeader.status).toBe(403);
    const post = (path: string, body: unknown) =>
      get(path, {
        method: "POST",
        headers: { "content-type": "application/json", "x-flomotion-ui": "1" },
        body: JSON.stringify(body),
      });
    expect((await post("/api/board/idea", { text: "" })).status).toBe(400);
    const added = (await (await post("/api/board/idea", { text: "a vault door" })).json()) as any;
    expect(added.ideas).toEqual([{ index: 0, text: "a vault door", from: "you", done: false }]);
    expect(readFileSync(join(root, "ideas.md"), "utf8")).toContain("- [ ] a vault door (you)");
    const ticked = (await (await post("/api/board/idea/toggle", { index: 0 })).json()) as any;
    expect(ticked.ideas[0].done).toBe(true);
    expect((await post("/api/board/idea/toggle", { index: -1 })).status).toBe(400);
    const s = await j("/api/state");
    expect(s.board.title).toBe("Storyboard: test");
    expect(s.board.beats.map((b: any) => [b.title, b.start, b.end, b.scenes])).toEqual([
      ["Hook", 0, 2, ["s0"]],
      ["Next", 2, 4, ["nope"]],
    ]);
    expect(s.board.ideas).toHaveLength(1);
    expect(s.gates.find((g: any) => g.name === "storyboard.md").exists).toBe(true);
  });

  it("shows gate files, the last review, assets and renders", async () => {
    writeFileSync(join(root, "brief.md"), "# Brief\n- product: Pulse\n");
    writeFileSync(join(root, "LOG.md"), "# Log\n- G0 approved at h0003\n");
    mkdirSync(join(root, ".flomotion", "review"), { recursive: true });
    writeFileSync(
      join(root, ".flomotion", "review", "last.json"),
      JSON.stringify({
        at: Date.now(),
        pass: false,
        failing: [3],
        warnings: [],
        needsEyes: [7],
        checks: [
          {
            n: 3,
            title: "Something new at least every 2 s",
            status: "fail",
            detail: "6 s gap",
            fix: "add a card",
          },
        ],
      }),
    );
    mkdirSync(join(root, "renders"), { recursive: true });
    writeFileSync(join(root, "renders", "live-test-draft.mp4"), "not a real video");
    writeFileSync(join(root, "renders", "live-test-draft.credits.txt"), "Credits");
    await h.call("sound_get", { id: "9001", tag: "hit/land" });
    const s = await until(async () => {
      const x = await j("/api/state");
      return x.gates.find((g: any) => g.name === "LOG.md")?.exists && x.review ? x : false;
    });
    expect(s.gates.find((g: any) => g.name === "brief.md").exists).toBe(true);
    expect(s.gates.find((g: any) => g.name === "LOG.md").tail).toContain("G0 approved");
    expect(s.gates.find((g: any) => g.name === "script.md").exists).toBe(false);
    expect(s.review).toMatchObject({ pass: false, failing: [3] });
    expect(s.renders[0]).toMatchObject({
      file: "renders/live-test-draft.mp4",
      credits: "renders/live-test-draft.credits.txt",
    });
    const sound = s.ledger.find((e: any) => e.id === "9001");
    expect(sound).toMatchObject({ kind: "sound", license: "CC0-1.0", author: "foleyfan" });
    expect(sound.peak.land).toBeGreaterThan(0.2);
    const video = await get("/files/renders/live-test-draft.mp4");
    expect(video.headers.get("content-type")).toBe("video/mp4");
  });

  it("restores a snapshot from the page, with the right header only", async () => {
    const hist = (await j("/api/state")).history;
    const first = hist[hist.length - 1];
    const noHeader = await get("/api/restore", {
      method: "POST",
      body: JSON.stringify({ id: first.id }),
    });
    expect(noHeader.status).toBe(403);
    const bad = await get("/api/restore", {
      method: "POST",
      headers: { "x-flomotion-ui": "1" },
      body: JSON.stringify({ id: "../x" }),
    });
    expect(bad.status).toBe(400);
    const ok = await get("/api/restore", {
      method: "POST",
      headers: { "x-flomotion-ui": "1", "content-type": "application/json" },
      body: JSON.stringify({ id: first.id }),
    });
    expect(ok.status).toBe(200);
    expect((await ok.json()).restored).toBe(first.id);
    expect(readFileSync(join(root, "project.tsx"), "utf8")).not.toContain('id="t1"');
    const s = await j("/api/state");
    expect(s.activity[0].tool).toContain("history_restore");
    expect(s.history[0].description).toContain(`restore ${first.id}`); // restoring is itself undoable
  });

  it("keeps the last good picture when the file is broken mid-edit", async () => {
    const before = readFileSync(join(root, "project.tsx"), "utf8");
    try {
      writeFileSync(join(root, "project.tsx"), before + "\nconst broken = ;\n");
      const s = await until(async () => {
        const x = await j("/api/state");
        return x.project.error ? x : false;
      });
      expect(s.project.error).toBeTruthy();
      expect(s.project.outline).toBeTruthy(); // still the previous outline
    } finally {
      writeFileSync(join(root, "project.tsx"), before);
    }
    const ok = await until(async () => {
      const x = await j("/api/state");
      return !x.project.error ? x : false;
    });
    expect(ok.project.exists).toBe(true);
  });
});

describe("flomotion mcp --ui (the bundled CLI over stdio)", () => {
  it("prints the live view address to stderr, hands it to the agent, and serves the project", async () => {
    await bundle();
    const dir = tmpProject("ui-stdio");
    const transport = new StdioClientTransport({
      command: "node",
      args: [
        join(REPO, "packages/cli/dist/bin.mjs"),
        "mcp",
        "--dir",
        dir,
        "--ui",
        "--port",
        "4390",
      ],
      cwd: dir,
      env: { ...(process.env as Record<string, string>), HYPERFRAMES_NO_TELEMETRY: "1" },
      stderr: "pipe",
    });
    let err = "";
    const client = new Client({ name: "ui-stdio", version: "1" });
    await client.connect(transport);
    transport.stderr?.on("data", (c: Buffer) => (err += c.toString()));
    try {
      await until(async () => /live view: http:\/\/127\.0\.0\.1:\d+/.test(err));
      const url = /live view: (http:\/\/127\.0\.0\.1:\d+)/.exec(err)![1]!;
      expect(url).toMatch(/:439\d$/);
      const created = JSON.parse(
        (
          (await client.callTool({
            name: "project_create",
            arguments: { name: "Ui Stdio", size: "540x960" },
          })) as any
        ).content[0].text,
      );
      expect(created.ui).toBe(url);
      const read = JSON.parse(
        ((await client.callTool({ name: "project_read", arguments: {} })) as any).content[0].text,
      );
      expect(read.ui).toBe(url);
      const state = await (await fetch(`${url}/api/state`)).json();
      expect(state.project.name).toBe("ui-stdio");
      expect(state.activity[0].tool).toBe("project_read");
    } finally {
      await client.close();
      cleanup(dir);
    }
  }, 120_000);
});
