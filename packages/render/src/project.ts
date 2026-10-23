import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  CODECUT_DIR,
  CodeCutError,
  isNode,
  walk,
  type AudioEvent,
  type CCNode,
  type CompileResult,
  type FontDecl,
  type Ledger,
  type ResolveIssue,
  type ResolvedFont,
  type SoundCue,
  getLook,
} from "@codecut/core";
import { fontGate } from "./fonts/gate.js";
import { compileWithLayout } from "./fonts/measure.js";
import { ledgerPath, readJson, readLedger, resolveFromLock } from "./fonts/lock.js";
import { missingGlyphs } from "./fonts/glyphs.js";
import { ensureDir, materialize } from "./project-dir.js";
import { probeMedia } from "./media-probe.js";
import { childEnv } from "./env.js";
import { mixAudio, type MixResult } from "./audio.js";

export interface LoadedProject {
  root: string;
  entry: string;
  node: CCNode;
}

export function findEntry(dir: string): string {
  const root = resolve(dir);
  const cfg = join(root, "codecut.json");
  if (existsSync(cfg)) {
    const e = (JSON.parse(readFileSync(cfg, "utf8")) as { entry?: string }).entry;
    if (e) return join(root, e);
  }
  for (const n of ["project.tsx", "promo.tsx", "index.tsx"]) if (existsSync(join(root, n))) return join(root, n);
  const tsx = readdirSync(root).filter((f) => f.endsWith(".tsx"));
  if (tsx.length === 1) return join(root, tsx[0]!);
  throw new CodeCutError("asset_missing", `No project file found in ${dir}`, { fix: "Create project.tsx (export default <Composition …/>) or set \"entry\" in codecut.json." });
}

let importCounter = 0;
/** Evaluate the project's TSX (inside a tsx-enabled process) and return its element tree. */
export async function loadProject(dir: string): Promise<LoadedProject> {
  const root = resolve(dir);
  const entry = findEntry(root);
  const mod = (await import(`${pathToFileURL(entry).href}?v=${Date.now()}-${importCounter++}`)) as { default?: unknown };
  let node = mod.default as unknown;
  if (typeof node === "function") node = (node as () => unknown)();
  if (!isNode(node)) {
    throw new CodeCutError("schema_violation", `${basename(entry)} must export default a <Composition …/> element`, { fix: "export default (<Composition …>…</Composition>);" });
  }
  return { root, entry, node };
}

/** Font declarations of a project: <Fonts> children plus the Look's fonts. */
export function collectFontDecls(node: CCNode): { decls: FontDecl[]; allowSystem: boolean } {
  const decls: FontDecl[] = [];
  const seen = new Set<string>();
  const add = (d: FontDecl) => {
    if (!seen.has(d.id)) {
      seen.add(d.id);
      decls.push(d);
    }
  };
  let allowSystem = false;
  for (const c of node.children) {
    if (isNode(c) && c.name === "Fonts") {
      allowSystem = !!c.props.allowSystem;
      for (const f of c.children) {
        if (isNode(f) && f.name === "Font") {
          const p = f.props as Record<string, any>;
          add({ id: p.id, family: p.family, source: p.source ?? "google", weights: p.weights, styles: p.styles, variable: p.variable, axes: p.axes, subsets: p.subsets, unicodeRange: p.unicodeRange, license: p.license, fallback: p.fallback });
        }
      }
    }
  }
  const lookId = String(node.props.theme ?? "").match(/^\$(?:look|theme)\.([\w-]+)$/)?.[1];
  const look = lookId ? getLook(lookId) : undefined;
  for (const f of look?.fonts ?? []) add(f);
  return { decls, allowSystem };
}

/** Voiceover word timings by id, converted to absolute composition seconds. */
export function loadVoiceWords(root: string, node: CCNode): Map<string, Array<{ w: string; start: number; end: number }>> {
  const out = new Map<string, Array<{ w: string; start: number; end: number }>>();
  walk(node, (n) => {
    if (n.name !== "Voiceover") return;
    const p = n.props as Record<string, any>;
    const file = p.words ? resolve(root, p.words) : resolve(root, String(p.src).replace(/\.[a-z0-9]+$/i, "") + ".words.json");
    if (!existsSync(file)) return;
    const at = typeof p.at === "number" ? p.at : p.at ? parseFloat(String(p.at)) : 0;
    const words = JSON.parse(readFileSync(file, "utf8")) as Array<{ w: string; start: number; end: number }>;
    out.set(String(p.id), words.map((w) => ({ ...w, start: w.start + at, end: w.end + at })));
  });
  return out;
}

export interface AssetRef {
  src: string;
  abs: string;
  /** Path inside the build dir. */
  build: string;
}

/** Map asset references to files on disk. Never fetches: remote assets must be downloaded first. */
export function makeAssetResolver(root: string, ledger: Ledger) {
  const refs = new Map<string, AssetRef>();
  const missing: string[] = [];
  const resolveSrc = (src: string): AssetRef | undefined => {
    const hit = refs.get(src);
    if (hit) return hit;
    let abs: string | undefined;
    const m = src.match(/^freesound:(\d+)$/);
    if (m) {
      const e = ledger.entries.find((x) => x.source === "freesound" && x.id === m[1]);
      abs = e ? join(root, e.file) : undefined;
    } else if (/^[a-z]+:/i.test(src)) {
      missing.push(`${src} (remote or unsupported asset; download it first)`);
      return undefined;
    } else abs = resolve(root, src);
    if (!abs || !existsSync(abs)) {
      missing.push(src);
      return undefined;
    }
    const rel = relative(root, abs);
    const ref: AssetRef = { src, abs, build: `assets/${rel.startsWith("..") ? basename(abs) : rel.replace(/^\.codecut\/assets\//, "")}` };
    refs.set(src, ref);
    return ref;
  };
  return {
    refs,
    missing,
    assetPath: (src: string) => resolveSrc(src)?.build ?? src.replace(/^\.\//, ""),
    abs: (src: string) => resolveSrc(src)?.abs,
    mediaDuration: (src: string) => {
      const r = resolveSrc(src);
      return r ? probeMedia(r.abs)?.duration : undefined;
    },
  };
}

export interface BuildOptions {
  outDir?: string;
  /** Skip the font gate (never in a real render). */
  skipGate?: boolean;
  /** Mix audio (default true when the project has audio events). */
  mix?: boolean;
  log?: (m: string) => void;
}

export interface BuildResult {
  dir: string;
  html: string;
  compile: CompileResult & { measured: number; cacheHits: number };
  issues: ResolveIssue[];
  audio: AudioEvent[];
  sounds: SoundCue[];
  fonts: ResolvedFont[];
  fontsUsed: string[];
  mix?: MixResult;
  loaded: LoadedProject;
}

/** Load, resolve, lay out, compile and write a HyperFrames project directory. */
export async function buildProject(dir: string, opts: BuildOptions = {}): Promise<BuildResult> {
  return buildLoaded(await loadProject(dir), opts);
}

/** Build from an already evaluated element tree (used by tests and the MCP server). */
export async function buildLoaded(loaded: LoadedProject, opts: BuildOptions = {}): Promise<BuildResult> {
  const log = opts.log ?? (() => {});
  const { root, node } = loaded;
  const ledger = readLedger(root);
  const { decls } = collectFontDecls(node);
  const lock = JSON.parse(existsSync(join(root, CODECUT_DIR, "fonts.lock.json")) ? readFileSync(join(root, CODECUT_DIR, "fonts.lock.json"), "utf8") : '{"version":1,"fonts":{}}');
  const fontsRoot: ResolvedFont[] = decls.map((d) => resolveFromLock(root, d, lock));
  const fontsBuild: ResolvedFont[] = fontsRoot.map((f) => ({ ...f, files: f.files.map((x) => ({ ...x, path: `fonts/${basename(x.path)}` })) }));
  const byId = new Map(fontsBuild.map((f) => [f.id, f]));
  const assets = makeAssetResolver(root, ledger);
  const words = loadVoiceWords(root, node);

  const outDir = resolve(opts.outDir ?? join(root, CODECUT_DIR, "build"));
  rmSync(outDir, { recursive: true, force: true });
  ensureDir(outDir);

  const compiled = await compileWithLayout(node, {
    projectRoot: root,
    fonts: fontsRoot,
    resolve: {
      fontResolver: (d) => byId.get(d.id) ?? { id: d.id, family: d.family, files: [], fallback: d.fallback ?? [], source: "system", variable: false },
      mediaDuration: assets.mediaDuration,
      words: (id) => words.get(id),
    },
    compile: { assetPath: assets.assetPath, words: (id) => words.get(id) },
  });
  if (assets.missing.length) {
    throw new CodeCutError("asset_missing", `Missing assets: ${[...new Set(assets.missing)].join(", ")}`, { fix: "Add the files to the project, or fetch sounds with `sound_get`." });
  }
  const errors = compiled.issues.filter((i) => i.severity === "error");
  if (errors.length) {
    throw new CodeCutError("schema_violation", `${errors.length} error(s): ${errors.slice(0, 3).map((e) => `${e.id ?? ""} ${e.message}`).join("; ")}`, { details: errors, fix: errors[0]?.fix });
  }

  // font gate before the first frame
  if (!opts.skipGate && compiled.fontsUsed.length) {
    log("font gate");
    const samples: Record<string, string> = {};
    for (const id of compiled.fontsUsed) samples[id] = "Aa";
    await fontGate(root, fontsRoot, compiled.fontsUsed, samples);
  }

  // copy fonts and assets
  const extra: Array<{ from: string; to: string }> = [];
  for (const f of fontsRoot) for (const x of f.files) extra.push({ from: join(root, x.path), to: `fonts/${basename(x.path)}` });
  for (const a of assets.refs.values()) extra.push({ from: a.abs, to: a.build });

  let mix: MixResult | undefined;
  let html = compiled.html;
  const audioEvents = compiled.audio.filter((e) => !!assets.abs(e.src));
  if (opts.mix !== false && audioEvents.length) {
    log("mixing audio");
    mix = await mixAudio({ root, events: audioEvents, resolveSrc: (s) => assets.abs(s)!, ledger, duration: compiled.ir.end, outFile: join(outDir, "assets", "mix.wav") });
    // re-embed with the mix as one <audio>
    html = html.replace("</div>\n<script>\nwindow.__ccId", `<audio id="cc-mix" src="assets/mix.wav" data-start="0" data-duration="${compiled.ir.end}" data-volume="1"></audio>\n</div>\n<script>\nwindow.__ccId`);
  }
  materialize(outDir, { html }, { id: node.props.id as string, extraFiles: extra });
  writeFileSync(join(outDir, "index.html"), html);
  return { dir: outDir, html, compile: compiled, issues: compiled.issues, audio: compiled.audio, sounds: compiled.sounds, fonts: fontsRoot, fontsUsed: compiled.fontsUsed, mix, loaded };
}

export { collectFontDecls as fontDecls, missingGlyphs, readJson, ledgerPath, childEnv, copyFileSync, mkdirSync, dirname, extname };
