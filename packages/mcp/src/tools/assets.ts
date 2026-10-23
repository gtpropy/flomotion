import { z } from "zod";
import { relative } from "node:path";
import { tool } from "./util.js";

const kind = z.enum(["icon", "logo", "emoji", "photo", "illustration"]);

export const assetSearch = tool({
  name: "asset_search",
  title: "Find icons, logos, emoji, photos, illustrations",
  description:
    "Search open sources for graphics: icons (Lucide, Tabler, Phosphor, Material… via Iconify), brand logos (Iconify; trademarks, see asset_get), emoji, photos and illustrations (Openverse, CC0 and CC-BY only; Pexels when a key is set). No key needed for icons and Openverse. Each result has its licence, whether this project allows it, and a preview link. You cannot see them from the text: pull one with asset_get, look at it in a frame, and show the person.",
  input: {
    query: z.string().min(1),
    kind,
    limit: z.number().int().min(1).max(20).optional(),
    orientation: z.enum(["landscape", "portrait", "square"]).optional().describe("Photos only."),
    source: z.enum(["iconify", "openverse", "pexels"]).optional(),
  },
  readOnly: true,
  async run(a, ctx) {
    ctx.requireProject();
    return { data: await ctx.assets.search(a) };
  },
});

export const assetGet = tool({
  name: "asset_get",
  title: "Download an asset into the project",
  description:
    "Download one asset from asset_search into assets/third-party/, record its licence in the ledger, and return the path to use in <Image src>. Icons can be recoloured with `color` (hex, use the look's colour) and sized with `height`. Large photos are scaled down to 2400 px. Brand logos need permission:true: the artwork is openly licensed but the brand is a trademark, so only for the person's own brand or with the brand's permission. CC-BY assets are credited in the render's credits file.",
  input: {
    ref: z
      .string()
      .describe(
        "A ref from asset_search, like iconify:lucide/calendar, openverse:<id>, pexels:<id>.",
      ),
    color: z.string().optional().describe("Hex colour for single-colour icons, e.g. #4b5cff."),
    height: z.number().int().min(8).max(2048).optional(),
    name: z.string().optional().describe("File name stem (default: from the ref)."),
    permission: z
      .boolean()
      .optional()
      .describe("The person confirmed they may show this brand logo."),
  },
  async run(a, ctx) {
    ctx.requireProject();
    return { data: await ctx.assets.get(a) };
  },
});

export const assetImport = tool({
  name: "asset_import",
  title: "Use the person's own images, logos or video",
  description:
    "Bring the person's own files (a logo, brand images, product shots, a screen recording; one file or a folder) into assets/imported/ with a ledger entry. They state their rights (own, licensed or permission). The files may be anywhere on their computer; only images and video are read, never credentials.",
  input: {
    source: z.string().describe("A file or folder on the person's computer."),
    rights: z.enum(["own", "licensed", "permission"]),
    kind: z.enum(["logo", "photo", "illustration", "screenshot", "icon", "own"]).optional(),
    name: z.string().optional(),
    license: z.string().optional(),
    author: z.string().optional(),
    url: z.string().optional(),
  },
  async run(a, ctx) {
    ctx.requireProject();
    return { data: await ctx.assets.importFile(a) };
  },
});

export const assetCapture = tool({
  name: "asset_capture",
  title: "Screenshot the person's product",
  description:
    "Take a sharp screenshot (2x by default) of a web page or one element, for the product shots a SaaS video needs. Only for a product or page the person owns or may show: ask, then pass permission:true. Uses headless Chrome and the network, once. Pages behind a login cannot be captured: have the person take the screenshot and use asset_import. Use `hide` to remove cookie banners and chat widgets.",
  input: {
    url: z.string().url(),
    permission: z.boolean().optional(),
    name: z.string().optional(),
    width: z.number().int().min(320).max(3840).optional(),
    height: z.number().int().min(240).max(2400).optional(),
    scale: z.number().min(1).max(3).optional(),
    selector: z.string().optional().describe("CSS selector of one element to capture."),
    fullPage: z.boolean().optional(),
    waitMs: z.number().int().min(0).max(15000).optional(),
    hide: z.array(z.string()).optional().describe("CSS selectors to hide before capturing."),
  },
  async run(a, ctx) {
    ctx.requireProject();
    const r = await ctx.assets.capture(a);
    return { data: r, images: [{ path: ctx.store.path(r.path), mime: "image/png" }] };
  },
});

export const brandExtract = tool({
  name: "brand_extract",
  title: "Read a brand from the person's site",
  description:
    "Open the person's own site and report its brand: title, theme colour, the accent and neutral colours the page really uses (with contrast on white and black), the fonts it uses, and logo files, which are saved to assets/brand/ with ledger entries. Writes brand.json. For the person's own site only (permission:true). Colours and fonts are what the page does today: confirm the real brand with the person before you build a look from it (see looks.md, brand override).",
  input: {
    url: z.string().url(),
    permission: z.boolean().optional(),
    saveLogos: z.boolean().optional(),
  },
  async run(a, ctx) {
    ctx.requireProject();
    const r = await ctx.assets.brandExtract(a);
    return {
      data: r,
      images: r.logos
        .filter((l) => /\.(png|jpe?g)$/i.test(l.path))
        .slice(0, 2)
        .map((l) => ({ path: ctx.store.path(l.path), mime: "image/png" as const })),
    };
  },
});

void relative;
