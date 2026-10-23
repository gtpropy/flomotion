import { z } from "zod";
import {
  CodeCutError,
  getLook,
  isNode,
  edit as coreEdit,
  findById,
  type CCNode,
  type IRLayer,
  type Patch,
} from "@codecut/core";
const { makeResult, uniqueId } = coreEdit;
import { readLedger } from "@codecut/render";
import { SOUND_TAGS, isSoundTag } from "../providers/sounds.js";
import { tool, writeResult } from "./util.js";

export const soundSearch = tool({
  name: "sound_search",
  title: "Search sounds",
  description: `Search for a sound effect. Give a \`query\` and/or a job \`tag\` (${Object.keys(SOUND_TAGS).join(", ")}); a tag adds good search words and a sensible length. Results carry their licence and whether this project allows it. Provider: Freesound (FREESOUND_API_KEY) or sounds/catalog.json. You cannot hear results.`,
  input: {
    query: z.string().optional(),
    tag: z.string().optional(),
    tags: z.array(z.string()).optional().describe("Freesound tags that must all match."),
    duration: z
      .tuple([z.number().min(0), z.number().min(0)])
      .optional()
      .describe("[min, max] seconds."),
    limit: z.number().int().min(1).max(30).optional(),
  },
  readOnly: true,
  async run(a, ctx) {
    ctx.requireProject();
    const r = await ctx.sound.search(a);
    return { data: r };
  },
});

export const soundGet = tool({
  name: "sound_get",
  title: "Get a sound",
  description:
    'Download a sound into .codecut/assets/, measure its peak, and record it in the licence ledger. CC0 and CC-BY only by default (codecut.json soundLicenses). Returns the `ref` to use as <Sound src=… peak=… />. Pass `tag` to name the peak after the job (e.g. hit/land gives peak="land").',
  input: { id: z.string(), tag: z.string().optional() },
  async run(a, ctx) {
    ctx.requireProject();
    const r = await ctx.sound.get(a);
    return { data: r };
  },
});

interface Cue {
  effectId: string;
  tag: string;
  at: number;
}

const flat = (l: IRLayer, out: IRLayer[] = []) => {
  out.push(l);
  l.children.forEach((c) => flat(c, out));
  return out;
};

export const soundAuto = tool({
  name: "sound_auto",
  title: "Place sounds on impacts",
  description:
    "Find impact effects (Shake, Slam, Pulse, …) that ask for a sound but have none on their frame, and plan a <Sound> for each from the Look's sound palette or a search by tag. With apply:true it downloads the sounds (ledger + credits) and writes the <Sound> elements. Default is a dry run.",
  input: { apply: z.boolean().optional() },
  async run(a, ctx) {
    ctx.requireProject();
    const b = await ctx.build();
    const loaded = b.loaded;
    const root = loaded.node;
    const sfx = b.audio.filter((e) => e.bus === "sfx");
    const cues: Cue[] = b.sounds
      .filter((c) => c.tag && !sfx.some((e) => Math.abs(e.start - c.at) <= 0.1))
      .map((c) => ({ effectId: c.source, tag: c.tag, at: c.at }));
    if (!cues.length) return { data: { cues: [], note: "Every impact cue already has a sound." } };

    const ledger = readLedger(ctx.root);
    const lookId = String(root.props.theme ?? "").match(/^\$(?:look|theme)\.([\w-]+)$/)?.[1];
    const palette = (lookId && getLook(lookId)?.sound) || {};
    const irs = flat(b.compile.ir);
    const sceneOf = (id: string): { scene: CCNode; start: number } | undefined => {
      let found: { scene: CCNode; start: number } | undefined;
      const dfs = (n: CCNode, scene?: CCNode): boolean => {
        const s = n.name === "Scene" ? n : scene;
        if (n.props.id === id) {
          if (s) found = { scene: s, start: irs.find((l) => l.id === s.props.id)?.start ?? 0 };
          return true;
        }
        return n.children.some((c) => isNode(c) && dfs(c, s));
      };
      dfs(root);
      return found;
    };

    const byTag = new Map<
      string,
      { ref: string; peak: string; from: string } | { error: string }
    >();
    const plan: Array<{
      tag: string;
      at: number;
      effect: string;
      scene: string;
      sound?: string;
      error?: string;
    }> = [];
    for (const c of cues) {
      if (!isSoundTag(c.tag)) {
        plan.push({
          ...{ tag: c.tag, at: c.at, effect: c.effectId, scene: "" },
          error: `Unknown sound tag ${c.tag}`,
        });
        continue;
      }
      let pick = byTag.get(c.tag);
      if (!pick) {
        const palRef = palette[c.tag];
        const inLedger = palRef && ledger.entries.some((e) => `${e.source}:${e.id}` === palRef);
        if (inLedger) pick = { ref: palRef!, peak: c.tag.split("/").pop()!, from: "look palette" };
        else if (a.apply) {
          try {
            const found = await ctx.sound.search({ tag: c.tag, limit: 8 });
            const best = found.results.find((r) => r.allowed);
            if (!best)
              throw new CodeCutError("asset_missing", `No allowed sound found for ${c.tag}`, {
                fix: "Search by hand with sound_search.",
              });
            const got = await ctx.sound.get({ id: best.id, tag: c.tag });
            pick = {
              ref: got.ref,
              peak: got.peakName,
              from: `${best.source} #${best.id} "${best.name}" (${best.license})`,
            };
          } catch (e) {
            pick = { error: e instanceof Error ? e.message : String(e) };
          }
        } else
          pick = { ref: `(search: ${c.tag})`, peak: c.tag.split("/").pop()!, from: "will search" };
        byTag.set(c.tag, pick);
      }
      const where = sceneOf(c.effectId);
      plan.push({
        tag: c.tag,
        at: c.at,
        effect: c.effectId,
        scene: where ? String(where.scene.props.id) : String(root.props.id),
        ...("error" in pick ? { error: pick.error } : { sound: `${pick.ref} — ${pick.from}` }),
      });
    }
    if (!a.apply)
      return {
        data: {
          dryRun: true,
          plan,
          note: "Call again with apply:true to download and place these.",
        },
      };

    const patches: Patch[] = [];
    let work = root;
    for (const c of cues) {
      const pick = byTag.get(c.tag);
      if (!pick || "error" in pick) continue;
      const where = sceneOf(c.effectId);
      const parentId = String((where ? where.scene : root).props.id);
      const parent = findById(work, parentId)!.node;
      const start = where ? where.start : 0;
      const id = uniqueId(work, `s-${c.effectId}`);
      const node: CCNode = {
        $cc: 1,
        name: "Sound",
        props: {
          id,
          src: pick.ref,
          at: `${Math.round((c.at - start) * 1000) / 1000}s`,
          peak: pick.peak,
          gain: -6,
          tag: c.tag,
        },
        children: [],
      };
      const p: Patch = {
        op: "insert",
        parent: String(parent.props.id),
        index: parent.children.length,
        node,
      };
      patches.push(p);
      work = makeResult(work, [p], "").project;
    }
    if (!patches.length)
      throw new CodeCutError("asset_missing", "No sound could be placed", { details: plan });
    const result = makeResult(root, patches, `place ${patches.length} sound(s) on impact cues`);
    const w = await ctx.store.apply(result, loaded);
    return {
      data: {
        ...writeResult(w),
        plan,
        note: "Not auditioned. Ask the user to listen to the chosen sounds.",
      },
    };
  },
});
