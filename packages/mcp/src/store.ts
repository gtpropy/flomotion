import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  CODECUT_DIR,
  CodeCutError,
  serializeNode,
  type CCNode,
  type EditResult,
  type LintConfig,
  type Patch,
} from "@codecut/core";
import { findEntry, insideRoot, loadProject, type LoadedProject } from "@codecut/render";
import { TsxDoc, applyPatchesToSource } from "./codemod/tsx.js";

export interface HistoryEntry {
  id: string;
  /** Seconds since epoch (informational; never read by the compiler). */
  time: number;
  description: string;
  /** Source hash after this write. */
  hash: string;
}

export interface ProjectConfig {
  entry?: string;
  /** Sound licences allowed (default CC0 and CC-BY). */
  soundLicenses?: Array<"CC0" | "CC-BY">;
  /** Image and icon licence classes allowed (default CC0, permissive, CC-BY). */
  assetLicenses?: Array<"CC0" | "permissive" | "CC-BY">;
  lint?: Partial<LintConfig>;
}

export interface WriteReport {
  patches: Patch[];
  description: string;
  /** Pass to history_restore to go back to the state before this write. */
  undoToken: string;
  data?: Record<string, unknown>;
}

const sha = (s: string) => createHash("sha256").update(s).digest("hex").slice(0, 16);
const stable = (n: CCNode) => JSON.stringify(serializeNode(n));

/** One project folder: its TSX source, evaluated tree, history and config. All writes go through here. */
export class ProjectStore {
  readonly root: string;
  constructor(root: string) {
    this.root = resolve(root);
  }

  path(p: string): string {
    return insideRoot(this.root, p);
  }
  get dir(): string {
    return join(this.root, CODECUT_DIR);
  }
  get entry(): string {
    return findEntry(this.root);
  }
  exists(): boolean {
    try {
      findEntry(this.root);
      return true;
    } catch {
      return false;
    }
  }
  source(): string {
    return readFileSync(this.entry, "utf8");
  }
  config(): ProjectConfig {
    const f = join(this.root, "codecut.json");
    return existsSync(f) ? (JSON.parse(readFileSync(f, "utf8")) as ProjectConfig) : {};
  }
  load(): Promise<LoadedProject> {
    return loadProject(this.root);
  }

  // ---------- history ----------

  private get histDir() {
    return join(this.dir, "history");
  }
  history(): HistoryEntry[] {
    const f = join(this.histDir, "index.json");
    return existsSync(f) ? (JSON.parse(readFileSync(f, "utf8")) as HistoryEntry[]) : [];
  }
  /** Snapshot the current source under a new id. */
  snapshot(description: string): HistoryEntry {
    mkdirSync(this.histDir, { recursive: true });
    const list = this.history();
    const n = list.length ? Number(list[list.length - 1]!.id.slice(1)) + 1 : 1;
    const src = this.source();
    const e: HistoryEntry = {
      id: `h${String(n).padStart(4, "0")}`,
      time: Math.floor(Date.now() / 1000),
      description,
      hash: sha(src),
    };
    writeFileSync(join(this.histDir, `${e.id}.tsx`), src);
    writeFileSync(join(this.histDir, "index.json"), JSON.stringify([...list, e], null, 2) + "\n");
    return e;
  }
  snapshotSource(id: string): string {
    const f = join(this.histDir, `${id}.tsx`);
    if (!existsSync(f))
      throw new CodeCutError("invalid_edit", `No history snapshot "${id}"`, {
        fix: "Use history_list to see snapshot ids.",
      });
    return readFileSync(f, "utf8");
  }

  // ---------- writes ----------

  /**
   * Write new source text transactionally: snapshot the old source, write, re-evaluate the project,
   * check it, and restore the old source if anything throws.
   */
  async write(
    newText: string,
    description: string,
    check?: (loaded: LoadedProject) => void | Promise<void>,
  ): Promise<{ undoToken: string; loaded: LoadedProject }> {
    const before = this.source();
    const snap = this.snapshot(`before: ${description}`);
    writeFileSync(this.entry, newText);
    try {
      const loaded = await this.load();
      await check?.(loaded);
      return { undoToken: snap.id, loaded };
    } catch (e) {
      writeFileSync(this.entry, before);
      throw e;
    }
  }

  /**
   * Apply a core edit result to the TSX file with the codemod, then confirm that re-evaluating the file
   * gives exactly the tree the edit produced. A mismatch restores the file and fails.
   */
  async apply(result: EditResult, loaded?: LoadedProject): Promise<WriteReport> {
    const cur = loaded ?? (await this.load());
    const text = applyPatchesToSource(this.source(), result.patches, cur.node);
    new TsxDoc(text).assertParses();
    const expected = stable(result.project);
    const { undoToken } = await this.write(text, result.description, (l) => {
      if (stable(l.node) !== expected) {
        throw new CodeCutError(
          "invalid_edit",
          "The edit could not be written to the TSX file faithfully (the re-read project differs from the edit).",
          {
            fix: "The target is probably inside generated code. Edit the file by hand or use scene_write.",
          },
        );
      }
    });
    return {
      patches: result.patches,
      description: result.description,
      undoToken,
      data: result.data,
    };
  }

  /** Give every element without an id a stable `cc_` id and save (first-save behaviour). */
  async ensureIds(): Promise<string[]> {
    const loaded = await this.load();
    const { doc, written } = new TsxDoc(this.source()).writeIds(loaded.node);
    if (!written.length) return [];
    await this.write(doc.text, `write ${written.length} missing id(s)`);
    return written.map((w) => w.id);
  }

  restore(id: string): Promise<{ undoToken: string }> {
    const text = this.snapshotSource(id);
    return this.write(text, `restore ${id}`).then((r) => ({ undoToken: r.undoToken }));
  }
}
