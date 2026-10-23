import { z } from "zod";
import { CodeCutError, listLooks } from "@codecut/core";
import { TEMPLATES, scaffoldProject } from "../scaffold.js";
import { tool } from "./util.js";

const sizeArg = z.union([
  z.string().regex(/^\d{3,5}x\d{3,5}$/),
  z.tuple([z.number().int().min(64), z.number().int().min(64)]),
]);

export const projectCreate = tool({
  name: "project_create",
  title: "Create a project",
  description: `Create a new project in the server's folder: project.tsx, codecut.json, folders. size is "1080x1920" (9:16) or [w,h]. template: ${TEMPLATES.join(" | ")} (saas-promo makes six empty beat scenes: hook, problem, reveal, features, proof, cta over 30 s). look: a Look id (see codecut://looks). Fails if the folder already has a project.`,
  input: {
    name: z.string().min(1),
    size: sizeArg.default("1080x1920"),
    fps: z.number().int().min(12).max(120).default(30),
    template: z.enum(TEMPLATES).optional(),
    look: z.string().optional(),
    duration: z.number().min(1).max(600).optional().describe("Seconds, for the blank template."),
  },
  async run(a, ctx) {
    const looks = listLooks().map((l) => l.id);
    if (a.look && !looks.includes(a.look))
      throw new CodeCutError("schema_violation", `Unknown look "${a.look}"`, {
        fix: `Looks: ${looks.join(", ")}`,
      });
    const size = (typeof a.size === "string" ? a.size.split("x").map(Number) : a.size) as [
      number,
      number,
    ];
    const r = scaffoldProject(ctx.root, {
      name: a.name,
      size,
      fps: a.fps,
      template: a.template,
      look: a.look,
      duration: a.duration,
    });
    return {
      data: {
        path: ctx.root,
        file: "project.tsx",
        id: r.id,
        ...(ctx.uiUrl ? { ui: ctx.uiUrl } : {}),
        next: [
          "Fetch the Look's fonts: font_list, then font_get for each font id.",
          "Use project_read to see the scene ids, then element_add / scene_write to build.",
        ],
      },
    };
  },
});

export const historyList = tool({
  name: "history_list",
  title: "List snapshots",
  description:
    "Every write snapshots the file first. Lists snapshots (newest last); with `id` shows one. The undo token a write returns is the id of the snapshot taken before it.",
  input: { id: z.string().optional() },
  readOnly: true,
  async run(a, ctx) {
    ctx.requireProject();
    const all = ctx.store.history();
    if (a.id) {
      const e = all.find((x) => x.id === a.id);
      if (!e)
        throw new CodeCutError("invalid_edit", `No snapshot "${a.id}"`, {
          fix: "Call history_list without id.",
        });
      const old = ctx.store.snapshotSource(a.id).split("\n");
      const cur = new Set(ctx.store.source().split("\n"));
      const set = new Set(old);
      return {
        data: {
          ...e,
          lines: old.length,
          linesNotInCurrent: old.filter((l) => !cur.has(l)).length,
          linesOnlyInCurrent: [...cur].filter((l) => !set.has(l)).length,
        },
      };
    }
    return { data: { snapshots: all } };
  },
});

export const historyRestore = tool({
  name: "history_restore",
  title: "Restore a snapshot",
  description:
    "Put the project file back to a snapshot. The current file is snapshotted first, so this can be undone too.",
  input: { id: z.string() },
  async run(a, ctx) {
    ctx.requireProject();
    const r = await ctx.store.restore(a.id);
    return { data: { restored: a.id, undoToken: r.undoToken } };
  },
});
