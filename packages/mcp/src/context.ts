import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { CODECUT_DIR, CodeCutError, type CCNode } from "@codecut/core";
import {
  buildLoaded,
  renderProjectDir,
  runHyperframes,
  snapshotFrames,
  stripAnsi,
  ledgerPath,
  type BuildResult,
} from "@codecut/render";
import type { FontSource } from "@codecut/render";
import type { HfCheck } from "./review.js";
import { ProjectStore } from "./store.js";
import { SoundService, soundProviders, type SoundProvider } from "./providers/sounds.js";
import { AssetService } from "./assets.js";
import {
  IconifyProvider,
  OpenverseProvider,
  PexelsProvider,
  type AssetProvider,
} from "./providers/assets.js";
import { libraryIndexPath, resolveEnv } from "./config.js";
import {
  ElevenLabsProvider,
  LocalTtsProvider,
  RecordingProvider,
  VoiceService,
  type VoiceProvider,
} from "./providers/voice.js";
import { HyperframesTranscriber, type Transcriber } from "./providers/transcribe.js";

/** Everything outside the process that the tools use. Tests replace these with doubles. */
export interface Deps {
  env?: NodeJS.ProcessEnv;
  fetch?: typeof fetch;
  /** Replaces the Freesound client (tests). Your own sounds are always searched first. */
  sound?: SoundProvider;
  /** Replaces the asset sources (tests). */
  assetProviders?: AssetProvider[];
  voice?: VoiceProvider[];
  transcriber?: Transcriber;
  fontSources?: FontSource[];
  /** Run the rendered-page layout and contrast check. Return undefined to skip. */
  hfCheck?: (dir: string) => Promise<HfCheck | undefined>;
  render?: typeof renderProjectDir;
  snapshot?: typeof snapshotFrames;
  /** Google Fonts Developer API (font_search). */
  googleFonts?: (q: {
    key: string;
    family?: string;
    category?: string;
    subset?: string;
  }) => Promise<
    Array<{
      family: string;
      category: string;
      variants: string[];
      subsets: string[];
      axes?: Array<{ tag: string; start: number; end: number }>;
    }>
  >;
}

const sha = (s: string) => createHash("sha256").update(s).digest("hex").slice(0, 16);
const readIf = (f: string) => (existsSync(f) ? readFileSync(f, "utf8") : "");

export class Context {
  readonly store: ProjectStore;
  readonly deps: Deps;
  readonly sound: SoundService;
  readonly voice: VoiceService;
  readonly transcriber: Transcriber;
  private buildCache?: { key: string; mix: boolean; result: BuildResult };
  /** Address of the live view, when it is running in this process. */
  uiUrl?: string;
  /** Where builds go (the live view uses its own so it never fights the agent's frame renders). */
  readonly buildDir?: string;
  /** The environment as the process has it (no saved keys mixed in). */
  readonly rawEnv: NodeJS.ProcessEnv;
  /** Where the person's own assets and licensed sources come from. */
  readonly assets: AssetService;
  /** The environment the tools use: real variables first, then the keys saved by `flomotion setup`. */
  readonly env: NodeJS.ProcessEnv;

  constructor(root: string, deps: Deps = {}, opts: { buildDir?: string } = {}) {
    this.buildDir = opts.buildDir;
    this.store = new ProjectStore(root);
    this.deps = deps;
    this.rawEnv = deps.env ?? process.env;
    this.env = resolveEnv(this.rawEnv);
    const libraryIndex = libraryIndexPath(this.rawEnv);
    this.sound = new SoundService(
      this.store,
      soundProviders(this.store.root, this.env, {
        fetch: deps.fetch,
        freesound: deps.sound,
        libraryIndex: existsSync(libraryIndex) ? libraryIndex : undefined,
      }),
    );
    this.voice = new VoiceService(
      this.store,
      deps.voice ?? [
        new RecordingProvider(),
        new LocalTtsProvider(),
        new ElevenLabsProvider({ env: this.env, fetch: deps.fetch }),
      ],
    );
    this.assets = new AssetService(
      this.store,
      deps.assetProviders ?? [
        new IconifyProvider({ fetch: deps.fetch }),
        new OpenverseProvider({ fetch: deps.fetch }),
        ...(this.env.PEXELS_API_KEY
          ? [new PexelsProvider({ key: this.env.PEXELS_API_KEY, fetch: deps.fetch })]
          : []),
      ],
    );
    this.transcriber = deps.transcriber ?? new HyperframesTranscriber();
  }

  get root() {
    return this.store.root;
  }

  requireProject(): void {
    if (!this.store.exists())
      throw new CodeCutError("asset_missing", `No project in ${this.root}`, {
        fix: "Call project_create first (or start the server in a project folder).",
      });
  }

  private stateKey(): string {
    return sha(
      [
        this.store.source(),
        readIf(ledgerPath(this.root)),
        readIf(join(this.root, CODECUT_DIR, "fonts.lock.json")),
        readIf(join(this.root, "codecut.json")),
      ].join("\u0000"),
    );
  }

  /** Build the project into .codecut/build. Reused while the source, ledger and font lock are unchanged. */
  async build(opts: { mix?: boolean; targetLufs?: number } = {}): Promise<BuildResult> {
    this.requireProject();
    const key = this.stateKey() + `|${opts.targetLufs ?? ""}`;
    const c = this.buildCache;
    if (c && c.key === key && (!opts.mix || c.mix)) return c.result;
    const loaded = await this.store.load();
    const result = await buildLoaded(loaded, {
      mix: opts.mix === true,
      targetLufs: opts.targetLufs,
      outDir: this.buildDir,
    });
    this.buildCache = { key, mix: opts.mix === true, result };
    return result;
  }

  async render(dir: string, o: Parameters<typeof renderProjectDir>[1]) {
    return (this.deps.render ?? renderProjectDir)(dir, o);
  }
  async snapshot(dir: string, o: Parameters<typeof snapshotFrames>[1]) {
    return (this.deps.snapshot ?? snapshotFrames)(dir, o);
  }

  async hfCheck(dir: string): Promise<HfCheck | undefined> {
    if (this.deps.hfCheck) return this.deps.hfCheck(dir);
    const r = await runHyperframes(["check", dir, "--json"], { cwd: dir, timeoutMs: 8 * 60_000 });
    const text = stripAnsi(r.stdout);
    const start = text.indexOf("\n{");
    const body = start >= 0 ? text.slice(start + 1) : text.slice(text.indexOf("{"));
    try {
      return JSON.parse(body) as HfCheck;
    } catch {
      return undefined;
    }
  }
}

export type TreeNode = CCNode;
