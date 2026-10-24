import { mkdirSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, relative } from "node:path";
import { FlomotionError } from "@flomotion/core";
import { AUDIO_EXT, assertReadable, listFiles } from "../assets.js";

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "sound";

/** Search words for a file from its name and folders: "Impacts/Heavy Thud 02.wav" gives impacts, heavy, thud. */
export function tagsFromPath(rel: string): string[] {
  const words = rel
    .replace(extname(rel), "")
    .split(/[^A-Za-z0-9]+|(?<=[a-z])(?=[A-Z])/)
    .map((w) => w.toLowerCase())
    .filter((w) => w.length >= 3 && !/^\d+$/.test(w));
  return [...new Set(words)].slice(0, 12);
}

export interface LibraryIndex {
  version: 1;
  root: string;
  license: string;
  entries: Array<{ id: string; name: string; tags: string[]; file: string }>;
}

/**
 * Index a folder of the person's own sound effects so `sound_search` can find them. Reads names only: files are
 * copied (and measured) when one is used. `rights` must be true: the person says they may use these in videos.
 */
export function indexSoundLibrary(
  folder: string,
  outFile: string,
  opts: { rights: boolean; license?: string; max?: number },
): LibraryIndex {
  if (!opts.rights)
    throw new FlomotionError(
      "license_blocked",
      "Say that you may use these sounds in videos before they are indexed",
      {
        fix: "Only index sounds you made, bought a licence for, or may use. Then confirm that.",
      },
    );
  const root = assertReadable(folder, AUDIO_EXT);
  const files = listFiles(root, AUDIO_EXT, true, opts.max ?? 20000);
  if (!files.length)
    throw new FlomotionError(
      "asset_missing",
      `No audio files (${AUDIO_EXT.join(" ")}) in ${folder}`,
    );
  const used = new Set<string>();
  const entries = files.map((f) => {
    const rel = relative(root, f);
    let id = slug(rel.replace(extname(rel), ""));
    for (let i = 2; used.has(id); i++) id = `${slug(rel.replace(extname(rel), ""))}-${i}`;
    used.add(id);
    return {
      id,
      name: basename(f, extname(f)).replace(/[_-]+/g, " "),
      tags: tagsFromPath(rel),
      file: rel,
    };
  });
  const index: LibraryIndex = {
    version: 1,
    root,
    license: opts.license ?? "user-supplied (rights asserted by the person)",
    entries,
  };
  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, JSON.stringify(index, null, 1) + "\n");
  return index;
}
