import { createReadStream, existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { extname, join, relative, resolve, sep } from "node:path";
import {
  CODECUT_DIR,
  CodeCutError,
  isCodeCutError,
  isNode,
  parseTimeLiteral,
  type CCNode,
} from "@codecut/core";
import { collectFontDecls, readLedger } from "@codecut/render";
import { activityFile, logActivity, readActivity } from "../activity.js";
import { Context, type Deps } from "../context.js";
import { outlineOf } from "../tools/util.js";
import { PAGE_HTML } from "./page.js";

export interface UiOptions {
  /** Port to listen on (default 4317; the next free one is used unless `strictPort`). */
  port?: number;
  strictPort?: boolean;
  /** Replace the external services (tests). */
  deps?: Deps;
  /** Receives one line per notable event (the MCP server writes it to stderr). */
  log?: (line: string) => void;
}

export interface UiServer {
  url: string;
  port: number;
  /** The context the live view renders previews with (its own build folder). */
  ctx: Context;
  close(): Promise<void>;
}

const GATE_FILES = [
  "interview.md",
  "brief.json",
  "script.json",
  "storyboard.json",
  "LOG.md",
] as const;
const MEDIA: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
  ".txt": "text/plain; charset=utf-8",
  ".json": "application/json",
};
/** Folders the page may read files from (never the TSX, ledger internals or anything outside the project). */
const SERVED = [
  `${CODECUT_DIR}/frames/`,
  `${CODECUT_DIR}/sheet/`,
  `${CODECUT_DIR}/previews/`,
  `${CODECUT_DIR}/ui-frames/`,
  "renders/",
  "assets/",
];

const mtimeOf = (p: string): number => {
  try {
    return statSync(p).mtimeMs;
  } catch {
    return 0;
  }
};
const readJson = <T>(p: string): T | undefined => {
  try {
    return JSON.parse(readFileSync(p, "utf8")) as T;
  } catch {
    return undefined;
  }
};
const list = (dir: string, re: RegExp): string[] => {
  try {
    return readdirSync(dir).filter((f) => re.test(f));
  } catch {
    return [];
  }
};

/** Times of the composition as the page's timeline needs them. Non-literal times are skipped, not guessed. */
function timelineOf(root: CCNode) {
  const fps = typeof root.props.fps === "number" ? root.props.fps : 30;
  const t = (v: unknown): number | undefined => {
    if (v === undefined) return undefined;
    try {
      if (typeof v === "string" && /^[@#]/.test(v)) return undefined;
      return parseTimeLiteral(v as never, fps);
    } catch {
      return undefined;
    }
  };
  const tracks = root.children
    .filter((c): c is CCNode => isNode(c) && c.name === "Track")
    .map((track) => ({
      id: String(track.props.id),
      locked: track.props.locked === true,
      items: track.children
        .filter((c): c is CCNode => isNode(c))
        .map((c) => {
          const start = t(c.props.start) ?? 0;
          const duration =
            t(c.props.duration) ??
            (t(c.props.end) !== undefined ? t(c.props.end)! - start : undefined);
          return { id: String(c.props.id ?? c.name), type: c.name, start, duration };
        })
        .filter((i) => i.duration !== undefined),
    }));
  const markers = root.children
    .filter((c): c is CCNode => isNode(c) && c.name === "Marker")
    .map((m) => ({
      id: String(m.props.id),
      at: t(m.props.at),
      label: m.props.label as string | undefined,
    }))
    .filter((m) => m.at !== undefined);
  const size = Array.isArray(root.props.size)
    ? (root.props.size as [number, number])
    : [1080, 1920];
  return {
    fps,
    size,
    duration:
      t(root.props.duration) ??
      Math.max(1, ...tracks.flatMap((tr) => tr.items.map((i) => i.start + i.duration!))),
    tracks,
    markers,
  };
}

/** Start the live view for a project folder. Listens on 127.0.0.1 only. */
export async function startUi(root: string, opts: UiOptions = {}): Promise<UiServer> {
  const ctx = new Context(root, opts.deps ?? {}, {
    buildDir: join(resolve(root), CODECUT_DIR, "ui-build"),
  });
  const projectRoot = ctx.root;
  const say = opts.log ?? (() => {});

  // ---------- project state ----------
  let cached:
    | {
        key: string;
        outline?: unknown;
        timeline?: ReturnType<typeof timelineOf>;
        name?: string;
        fonts?: unknown;
        error?: string;
      }
    | undefined;
  async function project() {
    if (!ctx.store.exists()) return { exists: false as const };
    const file = ctx.store.entry;
    const st = statSync(file);
    const key = `${st.mtimeMs}:${st.size}`;
    if (cached?.key !== key) {
      try {
        const loaded = await ctx.store.load();
        cached = {
          key,
          outline: outlineOf(loaded.node, 8),
          timeline: timelineOf(loaded.node),
          name: String(loaded.node.props.id ?? "project"),
          fonts: collectFontDecls(loaded.node).decls.map((d) => ({
            id: d.id,
            family: d.family,
            source: d.source,
          })),
        };
      } catch (e) {
        // a half-written file or a TSX error: keep the last good picture and show what is wrong
        cached = {
          ...(cached ?? {}),
          key,
          error: isCodeCutError(e)
            ? `${e.code}: ${e.message}`
            : e instanceof Error
              ? e.message
              : String(e),
        };
      }
    }
    return {
      exists: true as const,
      file: relative(projectRoot, file),
      mtime: st.mtimeMs,
      ...cached,
    };
  }

  function files() {
    const out = (dir: string, re: RegExp) =>
      list(join(projectRoot, dir), re)
        .map((f) => ({
          file: `${dir}/${f}`,
          mtime: mtimeOf(join(projectRoot, dir, f)),
          bytes: statSync(join(projectRoot, dir, f)).size,
        }))
        .sort((a, b) => b.mtime - a.mtime);
    const renders = out("renders", /\.mp4$/).map((r) => {
      const stem = r.file.replace(/\.mp4$/, "");
      return {
        ...r,
        credits: existsSync(join(projectRoot, `${stem}.credits.txt`))
          ? `${stem}.credits.txt`
          : undefined,
        licenses: existsSync(join(projectRoot, `${stem}.licenses.json`))
          ? `${stem}.licenses.json`
          : undefined,
      };
    });
    const sheet = join(projectRoot, CODECUT_DIR, "sheet", "contact-sheet.jpg");
    return {
      renders,
      frames: out(`${CODECUT_DIR}/frames`, /\.png$/).slice(0, 8),
      sheet: existsSync(sheet)
        ? { file: `${CODECUT_DIR}/sheet/contact-sheet.jpg`, mtime: mtimeOf(sheet) }
        : undefined,
      previews: out(`${CODECUT_DIR}/previews`, /\.(png|jpg)$/).slice(0, 6),
    };
  }

  function gates() {
    return GATE_FILES.map((name) => {
      const p = join(projectRoot, name);
      if (!existsSync(p)) return { name, exists: false };
      const text = readFileSync(p, "utf8");
      const tail =
        name === "LOG.md" || name === "interview.md"
          ? text.split("\n").filter(Boolean).slice(-14).join("\n")
          : undefined;
      return { name, exists: true, mtime: mtimeOf(p), bytes: text.length, tail };
    });
  }

  async function state() {
    const ledger = readLedger(projectRoot);
    return {
      now: Date.now(),
      root: projectRoot,
      project: await project(),
      history: ctx.store.history().slice(-60).reverse(),
      activity: readActivity(projectRoot, 80).reverse(),
      ledger: ledger.entries.map((e) => ({
        kind: e.kind,
        source: e.source,
        id: e.id,
        title: e.title,
        author: e.author,
        license: e.license,
        attributionRequired: e.attributionRequired,
        commercialOk: e.commercialOk,
        peak: e.peak,
        duration: e.duration,
        url: e.url,
        family: e.family,
      })),
      review: readJson(join(projectRoot, CODECUT_DIR, "review", "last.json")) ?? null,
      gates: gates(),
      ...files(),
    };
  }

  /** What changed on disk, for the page's live updates. */
  function fingerprint(): Record<string, number> {
    const fp: Record<string, number> = {};
    try {
      if (ctx.store.exists()) fp.project = mtimeOf(ctx.store.entry);
    } catch {
      /* no project yet */
    }
    fp.history = mtimeOf(join(projectRoot, CODECUT_DIR, "history", "index.json"));
    fp.ledger = mtimeOf(join(projectRoot, CODECUT_DIR, "ledger.json"));
    fp.activity =
      mtimeOf(activityFile(projectRoot)) +
      (existsSync(activityFile(projectRoot)) ? statSync(activityFile(projectRoot)).size : 0);
    fp.review = mtimeOf(join(projectRoot, CODECUT_DIR, "review", "last.json"));
    for (const g of GATE_FILES) fp[g] = mtimeOf(join(projectRoot, g));
    for (const d of [
      "renders",
      `${CODECUT_DIR}/frames`,
      `${CODECUT_DIR}/sheet`,
      `${CODECUT_DIR}/previews`,
    ]) {
      fp[d] = mtimeOf(join(projectRoot, d));
      for (const f of list(join(projectRoot, d), /./))
        fp[`${d}/${f}`] = mtimeOf(join(projectRoot, d, f));
    }
    return fp;
  }

  // ---------- live frames: one build at a time, cached while nothing changed ----------
  const frames = new Map<string, Promise<string>>();
  let queue: Promise<unknown> = Promise.resolve();
  function frameAt(t: number): Promise<string> {
    const stamp = `${mtimeOf(ctx.store.entry)}:${mtimeOf(join(projectRoot, CODECUT_DIR, "ledger.json"))}:${mtimeOf(join(projectRoot, CODECUT_DIR, "fonts.lock.json"))}`;
    const key = `${stamp}@${t}`;
    const hit = frames.get(key);
    if (hit) return hit;
    const p = (queue = queue.then(async () => {
      const b = await ctx.build();
      const dir = join(
        projectRoot,
        CODECUT_DIR,
        "ui-frames",
        `${String(frames.size).padStart(4, "0")}`,
      );
      const r = await ctx.snapshot(b.dir, { times: [t], outDir: dir });
      const f = r.files[0];
      if (!f) throw new CodeCutError("render_failed", "No frame was written");
      return f;
    })) as Promise<string>;
    // a failed render must not be remembered, or the page would show the old error after the cause is fixed
    p.catch(() => frames.delete(key));
    frames.set(key, p);
    if (frames.size > 40) frames.delete(frames.keys().next().value!);
    queue = queue.catch(() => undefined);
    return p;
  }

  // ---------- http ----------
  const hostOk = (req: IncomingMessage) =>
    /^(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/.test(req.headers.host ?? "");
  const json = (res: ServerResponse, code: number, body: unknown) => {
    res.writeHead(code, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    });
    res.end(JSON.stringify(body));
  };
  const fail = (res: ServerResponse, e: unknown, code = 500) =>
    json(res, code, {
      error: isCodeCutError(e)
        ? e.toJSON()
        : { code: "internal_error", message: e instanceof Error ? e.message : String(e) },
    });

  function serveFile(req: IncomingMessage, res: ServerResponse, rel: string) {
    const abs = resolve(projectRoot, rel);
    const inside =
      abs.startsWith(projectRoot + sep) &&
      SERVED.some((p) => relative(projectRoot, abs).split(sep).join("/").startsWith(p));
    const type = MEDIA[extname(abs).toLowerCase()];
    if (!inside || !type || !existsSync(abs) || !statSync(abs).isFile())
      return json(res, 404, { error: { code: "asset_missing", message: "Not found" } });
    const size = statSync(abs).size;
    const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? "");
    if (range) {
      const start = range[1] ? Number(range[1]) : 0;
      const end = range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
      if (start > end || start >= size) {
        res.writeHead(416, { "Content-Range": `bytes */${size}` });
        return res.end();
      }
      res.writeHead(206, {
        "Content-Type": type,
        "Content-Range": `bytes ${start}-${end}/${size}`,
        "Accept-Ranges": "bytes",
        "Content-Length": end - start + 1,
      });
      return createReadStream(abs, { start, end }).pipe(res);
    }
    res.writeHead(200, {
      "Content-Type": type,
      "Content-Length": size,
      "Accept-Ranges": "bytes",
      "Cache-Control": "no-cache",
    });
    createReadStream(abs).pipe(res);
  }

  const sse = new Set<ServerResponse>();
  let last = fingerprint();
  const timer = setInterval(() => {
    const now = fingerprint();
    const what = [...new Set([...Object.keys(now), ...Object.keys(last)])].filter(
      (k) => now[k] !== last[k],
    );
    last = now;
    if (what.length)
      for (const c of sse) c.write(`event: change\ndata: ${JSON.stringify({ what })}\n\n`);
  }, 500);
  const beat = setInterval(() => {
    for (const c of sse) c.write(": keep-alive\n\n");
  }, 15_000);

  const server = createServer(async (req, res) => {
    try {
      if (!hostOk(req))
        return json(res, 403, {
          error: { code: "invalid_edit", message: "Only localhost may use the live view" },
        });
      const url = new URL(req.url ?? "/", "http://localhost");
      if (req.method === "GET" && url.pathname === "/") {
        res.writeHead(200, {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
        });
        return res.end(PAGE_HTML);
      }
      if (req.method === "GET" && url.pathname === "/api/state")
        return json(res, 200, await state());
      if (req.method === "GET" && url.pathname === "/api/source") {
        if (!ctx.store.exists()) return json(res, 200, { source: "", previous: "" });
        const h = ctx.store.history();
        const prevId = h[h.length - 1]?.id;
        return json(res, 200, {
          source: ctx.store.source(),
          previous: prevId ? ctx.store.snapshotSource(prevId) : "",
          previousId: prevId,
        });
      }
      if (req.method === "GET" && url.pathname === "/api/frame") {
        const t = Math.max(0, Number(url.searchParams.get("t") ?? 0));
        if (!Number.isFinite(t))
          return json(res, 400, { error: { code: "invalid_time", message: "t must be a number" } });
        const file = await frameAt(Math.round(t * 1000) / 1000);
        res.writeHead(200, { "Content-Type": "image/png", "Cache-Control": "no-store" });
        return createReadStream(file).pipe(res);
      }
      if (req.method === "GET" && url.pathname === "/events") {
        res.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-store",
          Connection: "keep-alive",
        });
        res.write(`event: hello\ndata: {}\n\n`);
        sse.add(res);
        req.on("close", () => sse.delete(res));
        return;
      }
      if (req.method === "GET" && url.pathname.startsWith("/files/"))
        return serveFile(req, res, decodeURIComponent(url.pathname.slice("/files/".length)));
      if (req.method === "POST" && url.pathname === "/api/restore") {
        // the custom header cannot be sent cross-origin without a preflight, which this server never allows
        if (req.headers["x-flomotion-ui"] !== "1")
          return json(res, 403, { error: { code: "invalid_edit", message: "Missing header" } });
        const chunks: Buffer[] = [];
        for await (const c of req) {
          chunks.push(c as Buffer);
          if (chunks.reduce((n, b) => n + b.length, 0) > 10_000)
            return json(res, 413, { error: { code: "invalid_edit", message: "Too large" } });
        }
        const { id } = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}") as {
          id?: string;
        };
        if (!id || !/^h\d+$/.test(id))
          return json(res, 400, {
            error: { code: "invalid_edit", message: "A snapshot id like h0007 is required" },
          });
        const began = Date.now();
        const r = await ctx.store.restore(id);
        logActivity(projectRoot, {
          t: began,
          tool: "history_restore (live view)",
          args: JSON.stringify({ id }),
          ok: true,
          ms: Date.now() - began,
          summary: `restored ${id}`,
          undo: r.undoToken,
        });
        return json(res, 200, { restored: id, undoToken: r.undoToken });
      }
      json(res, 404, { error: { code: "invalid_edit", message: "Not found" } });
    } catch (e) {
      fail(res, e);
    }
  });

  const want = opts.port ?? 4317;
  const port = await new Promise<number>((ok, no) => {
    let p = want;
    const tryListen = () => {
      server.once("error", (e: NodeJS.ErrnoException) => {
        if (e.code === "EADDRINUSE" && !opts.strictPort && p < want + 20) {
          p++;
          tryListen();
        } else no(e);
      });
      server.listen(p, "127.0.0.1", () => ok((server.address() as AddressInfo).port));
    };
    tryListen();
  });
  const url = `http://127.0.0.1:${port}`;
  ctx.uiUrl = url;
  say(`live view: ${url}`);

  return {
    url,
    port,
    ctx,
    close: () =>
      new Promise<void>((done) => {
        clearInterval(timer);
        clearInterval(beat);
        for (const c of sse) c.end();
        server.close(() => done());
        server.closeAllConnections?.();
      }),
  };
}
