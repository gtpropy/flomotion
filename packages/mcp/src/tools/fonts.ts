import { createHash } from "node:crypto";
import { mkdirSync } from "node:fs";
import { join, relative } from "node:path";
import { z } from "zod";
import {
  FLOMOTION_DIR,
  FlomotionError,
  findById,
  getLook,
  isNode,
  walk,
  type CCNode,
  type FontDecl,
  type Patch,
  edit as coreEdit,
} from "@flomotion/core";

const { makeResult } = coreEdit;
import {
  collectFontDecls,
  googleFamilyLicense,
  googleFontsApi,
  missingGlyphs,
  openFontPage,
  readLedger,
  readLock,
  resolveFromLock,
  syncFonts,
} from "@flomotion/render";
import type { Context } from "../context.js";
import { tool, writeResult } from "./util.js";

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Faces for scripts the default Latin fonts do not cover. */
const SCRIPT_SUGGESTIONS: Array<{ script: string; test: RegExp; families: string[] }> = [
  {
    script: "devanagari",
    test: /[ऀ-ॿ]/,
    families: ["Noto Sans Devanagari", "Hind", "Mukta", "Poppins"],
  },
  { script: "arabic", test: /[؀-ۿ]/, families: ["Noto Sans Arabic", "Cairo", "Tajawal"] },
  { script: "hebrew", test: /[֐-׿]/, families: ["Heebo", "Assistant", "Noto Sans Hebrew"] },
  { script: "thai", test: /[฀-๿]/, families: ["Noto Sans Thai", "Prompt", "Sarabun"] },
  {
    script: "japanese",
    test: /[぀-ヿ一-鿿]/,
    families: ["Noto Sans JP", "M PLUS 1p", "Zen Kaku Gothic New"],
  },
  { script: "korean", test: /[가-힯]/, families: ["Noto Sans KR", "Gothic A1"] },
  { script: "cyrillic", test: /[Ѐ-ӿ]/, families: ["Inter", "Roboto", "Montserrat", "Manrope"] },
  { script: "greek", test: /[Ͱ-Ͽ]/, families: ["Inter", "Roboto", "Noto Sans"] },
  {
    script: "symbols/emoji",
    test: /[←-⯿\u{1F300}-\u{1FAFF}]/u,
    families: ["Noto Sans Symbols 2", "Noto Emoji"],
  },
];

const usedBy = (
  root: CCNode,
  id: string,
  lookTypes: Record<string, { font?: string }>,
): string[] => {
  const out: string[] = [];
  walk(root, (n) => {
    const f = n.props.font;
    if (typeof f !== "string") return;
    const token = f.match(/^\$type\.([\w-]+)$/)?.[1];
    if (f === id || (token && lookTypes[token]?.font === id))
      out.push(String(n.props.id ?? n.name));
  });
  return out;
};

const lookOf = (root: CCNode) => {
  const id = String(root.props.theme ?? "").match(/^\$(?:look|theme)\.([\w-]+)$/)?.[1];
  return id ? getLook(id) : undefined;
};

function resolvedFont(ctx: Context, decls: FontDecl[], id: string) {
  const decl = decls.find((d) => d.id === id);
  if (!decl)
    throw new FlomotionError("font_error", `No font with id "${id}" in this project`, {
      fix: `Declared: ${decls.map((d) => d.id).join(", ") || "none"}. Add one with font_get.`,
    });
  return resolveFromLock(ctx.root, decl, readLock(ctx.root));
}

export const fontList = tool({
  name: "font_list",
  title: "List project fonts",
  description:
    "Fonts declared in the project (and its Look): where they come from, whether they are downloaded and locked, their licence, and which elements use them.",
  input: {},
  readOnly: true,
  async run(_a, ctx) {
    ctx.requireProject();
    const { node } = await ctx.store.load();
    const { decls } = collectFontDecls(node);
    const look = lookOf(node);
    const ledger = readLedger(ctx.root);
    const lock = readLock(ctx.root);
    return {
      data: {
        theme: node.props.theme,
        fonts: decls.map((d) => {
          let status = "ready";
          try {
            resolveFromLock(ctx.root, d, lock);
          } catch (e) {
            status = e instanceof FlomotionError ? `${e.message} (${e.fix ?? ""})` : String(e);
          }
          const entry = ledger.entries.find((e) => e.kind === "font" && e.family === d.family);
          return {
            id: d.id,
            family: d.family,
            source: d.source,
            weights: d.weights,
            variable: !!d.variable,
            axes: d.axes,
            status,
            license: entry?.license,
            usedBy: usedBy(node, d.id, (look?.type ?? {}) as Record<string, { font?: string }>),
          };
        }),
      },
    };
  },
});

export const fontGet = tool({
  name: "font_get",
  title: "Get a font",
  description:
    "Download a font into .flomotion/fonts/, lock its hash, and record its licence in the ledger. `id` is a font id already declared in the project or Look, or a Google Fonts family name (which adds a <Font> declaration). Needs the network once; renders never do.",
  input: {
    id: z.string(),
    weights: z.array(z.number().int().min(1).max(1000)).optional(),
    axes: z
      .record(z.string(), z.tuple([z.number(), z.number()]))
      .optional()
      .describe("e.g. { wght: [300, 700] } for a variable font."),
    subsets: z.array(z.string()).optional(),
  },
  async run(a, ctx) {
    ctx.requireProject();
    const loaded = await ctx.store.load();
    const { decls, allowSystem } = collectFontDecls(loaded.node);
    let decl = decls.find((d) => d.id === a.id);
    let description = "";
    let undoToken: string | undefined;
    if (!decl) {
      decl = {
        id: slug(a.id),
        family: a.id,
        source: "google",
        weights: a.weights ?? [400, 700],
        ...(a.axes ? { variable: true, axes: a.axes } : {}),
        subsets: a.subsets ?? ["latin"],
      };
      const node: CCNode = {
        $cc: 1,
        name: "Font",
        props: Object.fromEntries(Object.entries(decl).filter(([, v]) => v !== undefined)),
        children: [],
      };
      const fonts = loaded.node.children.find((c): c is CCNode => isNode(c) && c.name === "Fonts");
      const patches: Patch[] = fonts
        ? [{ op: "insert", parent: String(fonts.props.id), index: fonts.children.length, node }]
        : [
            {
              op: "insert",
              parent: String(loaded.node.props.id),
              index: 0,
              node: { $cc: 1, name: "Fonts", props: { id: "fonts" }, children: [node] },
            },
          ];
      const w = await ctx.store.apply(
        makeResult(loaded.node, patches, `declare font ${decl.id} (${a.id})`),
        loaded,
      );
      description = w.description;
      undoToken = w.undoToken;
    } else if (a.weights || a.axes || a.subsets) {
      const el = findById(loaded.node, decl.id);
      const fonts = loaded.node.children.find((c): c is CCNode => isNode(c) && c.name === "Fonts");
      const fontEl = fonts?.children.find((c): c is CCNode => isNode(c) && c.props.id === decl!.id);
      if (!el && !fontEl)
        throw new FlomotionError(
          "opaque_expression",
          `Font "${decl.id}" comes from the Look, not the project file`,
          {
            fix: "Declare it in <Fonts> to change its weights or axes.",
          },
        );
      const patches: Patch[] = [];
      if (a.weights)
        patches.push({ op: "setProp", id: decl.id, prop: "weights", value: a.weights });
      if (a.axes)
        patches.push(
          { op: "setProp", id: decl.id, prop: "axes", value: a.axes },
          { op: "setProp", id: decl.id, prop: "variable", value: true },
        );
      if (a.subsets)
        patches.push({ op: "setProp", id: decl.id, prop: "subsets", value: a.subsets });
      const w = await ctx.store.apply(
        makeResult(loaded.node, patches, `change font ${decl.id}`),
        loaded,
      );
      description = w.description;
      undoToken = w.undoToken;
      decl = collectFontDecls((await ctx.store.load()).node).decls.find((d) => d.id === decl!.id)!;
    }
    const report = await syncFonts({
      projectRoot: ctx.root,
      decls: [decl],
      allowSystem,
      fetch: ctx.deps.fetch,
      sources: ctx.deps.fontSources,
    });
    const lock = readLock(ctx.root).fonts[decl.id];
    const ledger = readLedger(ctx.root).entries.filter(
      (e) => e.kind === "font" && e.family === decl!.family,
    );
    return {
      data: {
        ...(description ? writeResult({ patches: [], description, undoToken: undoToken! }) : {}),
        id: decl.id,
        family: decl.family,
        route: report.synced[0]?.route,
        files: lock?.files.map((f) => ({ path: f.path, hash: f.hash.slice(0, 12) })),
        lock: lock ? { ...lock, files: undefined } : undefined,
        ledger,
      },
    };
  },
});

export const fontSearch = tool({
  name: "font_search",
  title: "Search Google Fonts",
  description:
    "Search Google Fonts by name, category (sans-serif, serif, display, handwriting, monospace), subsets, variable axes, or script (e.g. devanagari). Needs GOOGLE_FONTS_API_KEY. Without a key call font_get with a family name directly. Surface font choices to the user: you cannot judge taste.",
  input: {
    query: z.string().optional(),
    category: z.string().optional(),
    subsets: z.array(z.string()).optional(),
    variable: z.boolean().optional(),
    script: z.string().optional(),
    limit: z.number().int().min(1).max(25).optional(),
  },
  readOnly: true,
  async run(a, ctx) {
    const key = ctx.env.GOOGLE_FONTS_API_KEY;
    if (!key)
      throw new FlomotionError("missing_dependency", "GOOGLE_FONTS_API_KEY is not set", {
        fix: "Create a key (Google Fonts Developer API), export GOOGLE_FONTS_API_KEY, or skip search and call font_get with a family name.",
      });
    const api = ctx.deps.googleFonts ?? ((q) => googleFontsApi({ ...q, fetch: ctx.deps.fetch }));
    const all = await api({ key, category: a.category, subset: a.script ?? a.subsets?.[0] });
    const q = a.query?.toLowerCase();
    const hits = all
      .filter((f) => !q || f.family.toLowerCase().includes(q))
      .filter((f) => !a.category || f.category === a.category)
      .filter((f) => (a.subsets ?? []).every((s) => f.subsets.includes(s)))
      .filter((f) => !a.script || f.subsets.includes(a.script))
      .filter((f) => a.variable === undefined || !!f.axes?.length === a.variable)
      .slice(0, a.limit ?? 10);
    const ctxFont = {
      projectRoot: ctx.root,
      cacheDir: "",
      log: () => {},
      fetch: ctx.deps.fetch ?? fetch,
    };
    const out = [];
    for (const f of hits) {
      const lic = await googleFamilyLicense(f.family, ctxFont).catch(() => undefined);
      out.push({
        family: f.family,
        category: f.category,
        variable: !!f.axes?.length,
        axes: f.axes?.map((x) => `${x.tag} ${x.start}..${x.end}`),
        subsets: f.subsets,
        weights: f.variants.filter((v) => /^\d+$/.test(v) || v === "regular").length,
        license: lic?.license ?? "unverified (font_get reads it from google/fonts)",
        designer: lic?.author,
      });
    }
    return {
      data: { results: out, note: "Pick candidates and use font_preview; ask the user to choose." },
    };
  },
});

export const fontPreview = tool({
  name: "font_preview",
  title: "Preview a font",
  description:
    "Render a sample of text in a project font to a PNG so you can look at the face. You can check legibility and obvious problems, but not taste: show the user.",
  input: {
    fontId: z.string(),
    text: z.string().max(400),
    size: z.number().min(8).max(400).optional(),
    weight: z.number().int().min(1).max(1000).optional(),
  },
  readOnly: true,
  async run(a, ctx) {
    ctx.requireProject();
    const { node } = await ctx.store.load();
    const { decls } = collectFontDecls(node);
    const font = resolvedFont(ctx, decls, a.fontId);
    const size = a.size ?? 96;
    const dir = ctx.store.path(join(FLOMOTION_DIR, "previews"));
    mkdirSync(dir, { recursive: true });
    const hash = createHash("sha256")
      .update(JSON.stringify([a.fontId, a.text, size, a.weight]))
      .digest("hex")
      .slice(0, 8);
    const file = join(dir, `font-${a.fontId}-${hash}.png`);
    const session = await openFontPage(ctx.root, [font]);
    try {
      const js = `(async () => {
        const fam = ${JSON.stringify(font.family)}, text = ${JSON.stringify(a.text)}, size = ${size}, weight = ${a.weight ?? 400};
        document.body.innerHTML = '';
        const d = document.createElement('div');
        d.id = 's';
        d.style.cssText = 'display:inline-block;padding:28px 36px;background:#fff;color:#111;white-space:pre-wrap;max-width:1100px;line-height:1.25;font-size:'+size+'px;font-weight:'+weight+';font-family:"'+fam+'",serif';
        d.textContent = text;
        document.body.appendChild(d);
        await document.fonts.load(weight+' '+size+'px "'+fam+'"', text);
        await document.fonts.ready;
        return document.fonts.check(weight+' '+size+'px "'+fam+'"', text);
      })()`;
      const ok = (await session.page.evaluate(js)) as boolean;
      if (!ok)
        throw new FlomotionError("font_error", `Font "${a.fontId}" did not load in the browser`, {
          fix: "Run font_get to download it again.",
        });
      const el = await session.page.$("#s");
      await el!.screenshot({ path: file as `${string}.png` });
    } finally {
      await session.close();
    }
    return {
      data: {
        path: relative(ctx.root, file),
        font: font.family,
        note: "Check legibility only. Ask the user to approve the face.",
      },
      images: [{ path: file, mime: "image/png" }],
    };
  },
});

export const fontCheck = tool({
  name: "font_check",
  title: "Check glyph coverage",
  description:
    "List characters in `text` that the font cannot draw, and suggest fonts that cover them (by script).",
  input: { text: z.string(), fontId: z.string() },
  readOnly: true,
  async run(a, ctx) {
    ctx.requireProject();
    const { node } = await ctx.store.load();
    const { decls } = collectFontDecls(node);
    const font = resolvedFont(ctx, decls, a.fontId);
    const missing = missingGlyphs(ctx.root, font, a.text);
    const suggestions = SCRIPT_SUGGESTIONS.filter((s) => missing.some((m) => s.test.test(m))).map(
      (s) => ({ script: s.script, families: s.families }),
    );
    const covering = decls
      .filter((d) => d.id !== a.fontId)
      .filter((d) => {
        try {
          return (
            missingGlyphs(ctx.root, resolveFromLock(ctx.root, d, readLock(ctx.root)), a.text)
              .length === 0
          );
        } catch {
          return false;
        }
      })
      .map((d) => d.id);
    return {
      data: {
        ok: missing.length === 0,
        missing,
        suggestions,
        alreadyInProject: covering,
        fix: missing.length
          ? "Use a face that covers these characters for this text (a second family counts toward the 3-family limit), or change the text."
          : undefined,
      },
    };
  },
});
