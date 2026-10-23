import { checkPurity } from "../anim/expr.js";
import { isSignal, evalSignal } from "../anim/signal.js";
import { isNode, walk, type CCNode } from "../ast/node.js";
import { estimateText, graphemes } from "../fonts/estimate.js";
import type { TextMeasurer } from "../fonts/measure.js";
import type { Ledger } from "../ledger.js";
import type { RNode, ResolveIssue, ResolvedProject } from "../resolve/types.js";
import { contrastRatio, parseColor } from "../values/color.js";
import { resolveProject, type ResolveOptions } from "../resolve/resolve.js";

export type Severity = "error" | "warning" | "info";

export interface LintIssue {
  severity: Severity;
  rule: string;
  message: string;
  id?: string;
  prop?: string;
  fix?: string;
}

export interface LintConfig {
  /** Max font families in one composition before warning. */
  maxFontFamilies: number;
  /** Minimum text size as a fraction of the shorter frame side (default 0.026 → 28 px on 1080). */
  minTextSize: number;
  /** Safe-area preset checked for text (9:16 defaults to reels). */
  safe?: "reels" | "shorts" | "tiktok" | "feed" | "none";
  /** Minimum WCAG contrast ratio for text (default 3). */
  minContrast: number;
  /** Licences accepted for sounds. */
  soundLicenses: Array<"CC0" | "CC-BY">;
}

export const DEFAULT_LINT_CONFIG: LintConfig = {
  maxFontFamilies: 3,
  minTextSize: 0.026,
  safe: undefined,
  minContrast: 3,
  soundLicenses: ["CC0", "CC-BY"],
};

/** Optional services; rules that need one are skipped when it is absent. */
export interface LintContext {
  config?: Partial<LintConfig>;
  ledger?: Ledger;
  /** Characters of `text` that the font `fontId` cannot draw. */
  missingGlyphs?: (fontId: string, text: string) => string[];
  /** Does a project-relative file exist? */
  fileExists?: (path: string) => boolean;
  /** Safe rectangles per preset (from the components package). */
  safeRect?: (
    preset: string,
    comp: { width: number; height: number },
  ) => { x: number; y: number; width: number; height: number };
  measure?: TextMeasurer;
  /** True when fonts.lock.json covers every declared font. */
  fontLockProblems?: (decls: string[]) => string[];
  /** Allow system fonts without a warning. */
  allowSystemFonts?: boolean;
  /** Ids of asset sources that have ledger rows. */
  assetHasLedger?: (src: string) => boolean;
}

const sev = (i: ResolveIssue): Severity => i.severity;

/** Lint a project tree. Runs the resolver (so schema and purity errors surface) then project-level rules. */
export function lintTree(
  root: CCNode,
  ctx: LintContext = {},
  resolveOpts: ResolveOptions = {},
): { issues: LintIssue[]; project?: ResolvedProject } {
  const issues: LintIssue[] = [];
  let project: ResolvedProject;
  try {
    project = resolveProject(root, { ...resolveOpts, assignIds: true });
  } catch (e) {
    issues.push({
      severity: "error",
      rule: "resolve-failed",
      message: (e as Error).message,
      fix: (e as { fix?: string }).fix,
    });
    return { issues };
  }
  for (const i of project.issues)
    issues.push({
      severity: sev(i),
      rule: i.rule,
      message: i.message,
      id: i.id,
      prop: i.prop,
      fix: i.fix,
    });
  issues.push(...lintProject(project, ctx));
  return { issues, project };
}

export function lintProject(project: ResolvedProject, ctx: LintContext = {}): LintIssue[] {
  const cfg: LintConfig = { ...DEFAULT_LINT_CONFIG, ...ctx.config };
  const out: LintIssue[] = [];
  const comp = project.comp;
  const nodes = [...project.byId.values()];

  // determinism: expressions in keyframe-free props were checked by the resolver; also scan effects' raw props
  for (const n of nodes) {
    for (const [k, v] of Object.entries(n.raw)) {
      if (typeof v === "function") {
        const al = n.def.controls[k];
        if (!al?.animatable)
          out.push({
            severity: "error",
            rule: "not-animatable",
            message: `${n.name}#${n.id}.${k} is an expression but the prop is not animatable`,
            id: n.id,
            prop: k,
          });
        else
          for (const p of checkPurity(v as (...a: any[]) => unknown))
            out.push({
              severity: "error",
              rule: "impure-expression",
              message: `#${n.id}.${k}: ${p.message}`,
              id: n.id,
              prop: k,
            });
      }
    }
  }
  const dedupe = new Set<string>();
  const unique = (arr: LintIssue[]) =>
    arr.filter((i) =>
      dedupe.has(`${i.rule}|${i.id}|${i.prop}|${i.message}`)
        ? false
        : (dedupe.add(`${i.rule}|${i.id}|${i.prop}|${i.message}`), true),
    );

  // locked tracks
  for (const t of project.tracks)
    if (t.locked)
      out.push({
        severity: "info",
        rule: "track-locked",
        message: `Track #${t.id} is locked: edits through the API are rejected`,
        id: t.id,
      });

  // fonts
  const declIds = comp.fonts.map((f) => f.id);
  const families = new Set(comp.fonts.map((f) => f.family));
  if (families.size > cfg.maxFontFamilies) {
    out.push({
      severity: "warning",
      rule: "too-many-font-families",
      message: `${families.size} font families in one composition (max ${cfg.maxFontFamilies}): ${[...families].join(", ")}`,
      fix: "Use one display and one body face; get contrast from weight and width.",
    });
  }
  for (const f of comp.fonts) {
    if (f.source === "system" && !ctx.allowSystemFonts)
      out.push({
        severity: "warning",
        rule: "system-font",
        message: `Font "${f.id}" is a system font; output differs per machine`,
        id: f.id,
        fix: "Use a Google, local or URL font, or add allowSystem to <Fonts>.",
      });
    if (f.source !== "system" && ctx.ledger) {
      const has = ctx.ledger.entries.some(
        (e) =>
          e.kind === "font" &&
          (e.family === f.family || e.id.startsWith(`${f.id}:`) || e.id === f.id),
      );
      if (!has)
        out.push({
          severity: "error",
          rule: "font-no-ledger",
          message: `Font "${f.id}" (${f.family}) has no ledger entry`,
          id: f.id,
          fix: "Run `codecut fonts sync`.",
        });
      else {
        const lic = ctx.ledger.entries.find(
          (e) =>
            e.kind === "font" &&
            (e.family === f.family || e.id === f.id || e.id.startsWith(`${f.id}:`)),
        )?.license;
        if (!lic || lic === "unknown")
          out.push({
            severity: "error",
            rule: "font-unknown-license",
            message: `Font "${f.id}" (${f.family}) has an unknown license`,
            id: f.id,
            fix: "Set license=… on <Font> for local/URL fonts, or check the family's real licence.",
          });
      }
    }
    if (/^https?:/.test(String(f.files[0]?.path ?? "")))
      out.push({
        severity: "error",
        rule: "font-network-url",
        message: `Font "${f.id}" is loaded from a URL at render time`,
        id: f.id,
        fix: "Run `codecut fonts sync` so the file is local.",
      });
  }
  for (const m of ctx.fontLockProblems?.(declIds) ?? [])
    out.push({
      severity: "error",
      rule: "font-lock",
      message: m,
      fix: "Run `codecut fonts sync`.",
    });

  // text rules
  const minSize = Math.min(comp.width, comp.height) * cfg.minTextSize;
  const safePreset = cfg.safe ?? (comp.height > comp.width ? "reels" : "none");
  const textNodes = nodes.filter(
    (n) =>
      ["Text", "Title", "SplitText", "Counter", "Captions"].includes(n.name) &&
      n.raw.hidden !== true,
  );
  for (const n of textNodes) {
    const p = n.props;
    const t = n.start;
    const get = <T>(k: string): T | undefined =>
      isSignal(p[k]) ? (evalSignal(p[k], t) as T) : (p[k] as T | undefined);
    const text = plainText(n);
    const fontId = resolveFontId(get<string>("font") ?? "$type.body", comp);
    if (fontId && text && ctx.missingGlyphs) {
      const miss = ctx.missingGlyphs(fontId, text);
      if (miss.length)
        out.push({
          severity: "error",
          rule: "missing-glyph",
          message: `#${n.id}: font "${fontId}" has no glyph for ${miss.map((c) => `"${c}" (U+${c.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0")})`).join(", ")}`,
          id: n.id,
          fix: `Add a font for this script (e.g. Noto Sans Devanagari) and use it for this text, or remove the characters.`,
        });
    }
    const size = get<number>("size") ?? 0;
    if (size && size < minSize)
      out.push({
        severity: "warning",
        rule: "text-too-small",
        message: `#${n.id}: ${size}px text is below the minimum ${Math.round(minSize)}px for ${comp.width}×${comp.height}`,
        id: n.id,
        prop: "size",
        fix: `Use at least ${Math.round(minSize)}px.`,
      });
    if (text && safePreset !== "none" && ctx.safeRect && !insideSafeArea(n)) {
      const r = ctx.safeRect(safePreset, comp);
      const box = textBounds(n, text, size || 64, ctx.measure);
      if (
        box &&
        (box.x < r.x - 1 ||
          box.y < r.y - 1 ||
          box.x + box.w > r.x + r.width + 1 ||
          box.y + box.h > r.y + r.height + 1)
      ) {
        out.push({
          severity: "warning",
          rule: "text-outside-safe-area",
          message: `#${n.id}: text box (${Math.round(box.x)},${Math.round(box.y)} ${Math.round(box.w)}×${Math.round(box.h)}) leaves the ${safePreset} safe area`,
          id: n.id,
          fix: "Move it inside a <SafeArea> or reduce its size.",
        });
      }
    }
    const fillv = p.fill;
    const fg =
      typeof fillv === "string"
        ? fillv
        : typeof fillv === "object" && fillv && "stops" in fillv
          ? (fillv as { stops: Array<[number, string]> }).stops[0]![1]
          : undefined;
    const bg = backgroundFor(n, comp.background);
    if (fg && bg) {
      try {
        const ratio = contrastRatio(parseColor(fg), parseColor(bg));
        if (ratio < cfg.minContrast)
          out.push({
            severity: "warning",
            rule: "text-contrast",
            message: `#${n.id}: text contrast ${ratio.toFixed(2)}:1 against ${bg} is below ${cfg.minContrast}:1`,
            id: n.id,
            fix: "Change the fill or put the text on a darker/lighter surface.",
          });
      } catch {
        /* unparsable colours are reported by the resolver */
      }
    }
  }

  // assets and ledger
  const audioLike = nodes.filter((n) => ["Sound", "Audio", "Voiceover"].includes(n.name));
  for (const n of audioLike) {
    const src = String(n.raw.src ?? "");
    if (/^(freesound|local):/.test(src) || /^https?:/.test(src)) {
      const has = ctx.assetHasLedger
        ? ctx.assetHasLedger(src)
        : ctx.ledger?.entries.some((e) => `${e.source}:${e.id}` === src);
      if (ctx.ledger || ctx.assetHasLedger) {
        if (!has)
          out.push({
            severity: "error",
            rule: "asset-no-ledger",
            message: `#${n.id}: ${src} has no ledger entry`,
            id: n.id,
            prop: "src",
            fix: "Fetch it with sound_get so its licence is recorded.",
          });
        else if (ctx.ledger) {
          const e = ctx.ledger.entries.find((x) => `${x.source}:${x.id}` === src);
          // ledger licences are SPDX-like ("CC0-1.0", "CC-BY-4.0"); the config lists the families
          const family = /^CC0/i.test(e?.license ?? "")
            ? "CC0"
            : /^CC-BY(-\d|$)/i.test(e?.license ?? "")
              ? "CC-BY"
              : e?.license;
          if (e && !cfg.soundLicenses.includes(family as "CC0" | "CC-BY"))
            out.push({
              severity: "error",
              rule: "license-blocked",
              message: `#${n.id}: licence ${e.license} of ${src} is not allowed (allowed: ${cfg.soundLicenses.join(", ")})`,
              id: n.id,
              fix: "Pick a CC0 or CC-BY sound.",
            });
        }
      }
    } else if (src && ctx.fileExists && !ctx.fileExists(src)) {
      out.push({
        severity: "error",
        rule: "asset-missing",
        message: `#${n.id}: file ${src} does not exist`,
        id: n.id,
        prop: "src",
        fix: "Add the file to the project.",
      });
    }
  }
  for (const n of nodes.filter((x) => ["Image", "Video", "Clip"].includes(x.name))) {
    const src = String(n.raw.src ?? "");
    if (src && ctx.fileExists && !ctx.fileExists(src))
      out.push({
        severity: "error",
        rule: "asset-missing",
        message: `#${n.id}: file ${src} does not exist`,
        id: n.id,
        prop: "src",
        fix: "Add the file to the project.",
      });
  }
  return unique(out);
}

function plainText(n: RNode): string {
  if (typeof n.raw.text === "string") return n.raw.text;
  if (typeof n.raw.markup === "string") return n.raw.markup.replace(/\*\*|==|~~|_/g, "");
  return n.content
    .map((c) =>
      typeof c === "string" || typeof c === "number"
        ? String(c)
        : isNodeLike(c)
          ? plainText(c)
          : "",
    )
    .join("");
}
const isNodeLike = (c: unknown): c is RNode =>
  typeof c === "object" && c !== null && "content" in (c as object);

function resolveFontId(ref: string, comp: ResolvedProject["comp"]): string | undefined {
  if (ref.startsWith("$")) {
    const tok = comp.theme.tokens[ref.slice(1)] as { font?: string } | undefined;
    return tok?.font;
  }
  return ref;
}

/** Text inside these containers is placed in local coordinates, so frame-level checks do not apply. */
const insideSafeArea = (n: RNode) => {
  for (let c = n.parent; c; c = c.parent)
    if (["SafeArea", "UIMock", "Card", "GlassCard"].includes(c.name)) return true;
  return false;
};

function textBounds(
  n: RNode,
  text: string,
  size: number,
  measure?: TextMeasurer,
): { x: number; y: number; w: number; h: number } | undefined {
  const comp = n.box;
  const p = n.props;
  const t = n.start;
  const val = <T>(k: string): T | undefined =>
    isSignal(p[k]) ? (evalSignal(p[k], t) as T) : (p[k] as T | undefined);
  const maxWPx = (() => {
    const mw = val<number | string>("maxWidth") ?? "90%";
    return typeof mw === "number"
      ? mw
      : mw.endsWith("%")
        ? (parseFloat(mw) / 100) * comp[0]
        : mw.endsWith("vw")
          ? (parseFloat(mw) / 100) * comp[0]
          : parseFloat(mw);
  })();
  const style = {
    fontFamily: "sans-serif",
    fontSize: size,
    fontWeight: val<number>("weight") ?? 400,
    letterSpacing: ((val<number>("tracking") ?? 0) / 1000) * size,
    lineHeight: val<number>("leading") ?? 1.15,
  };
  const m = (measure ?? { measureText: estimateText }).measureText(text, style, {
    maxWidth: maxWPx,
  });
  const w = Math.min(maxWPx, m.width);
  const h = m.height;
  const pos = (val<number[]>("position") ?? [0, 0, 0]) as number[];
  let x: number;
  let y: number;
  const atRaw = n.raw.at ?? "center";
  if (Array.isArray(atRaw)) {
    x = Number(atRaw[0]);
    y = Number(atRaw[1]);
  } else {
    const at = String(n.raw.at ?? "center");
    const fx = at.includes("left") ? 0 : at.includes("right") ? 1 : 0.5;
    const fy = at.startsWith("top")
      ? 0
      : at.startsWith("bottom")
        ? 1
        : at === "left" || at === "right" || at === "center"
          ? 0.5
          : 0.5;
    x = comp[0] * fx - w * fx;
    y = comp[1] * fy - h * fy;
  }
  return { x: x + (pos[0] ?? 0), y: y + (pos[1] ?? 0), w, h };
}

function backgroundFor(n: RNode, compBg: string): string | undefined {
  for (let c = n.parent; c; c = c.parent) {
    if (c.name === "UIMock" && typeof c.props.screenColor === "string") return c.props.screenColor;
    if (["Card", "Rect", "RoundRect"].includes(c.name)) {
      const f = c.props.fill;
      if (typeof f === "string") return f;
    }
  }
  return compBg;
}

export { isNode, walk, graphemes };
