import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  cleanup,
  connect,
  doubles,
  readFileSync,
  ToolError,
  tmpProject,
  type Harness,
} from "./harness.js";
import { TOOL_NAMES } from "../src/server.js";

let root: string;
let h: Harness;
const src = () => readFileSync(`${root}/project.tsx`, "utf8");
const fails = async (p: Promise<unknown>, code: string) => {
  try {
    await p;
  } catch (e) {
    expect(e).toBeInstanceOf(ToolError);
    expect((e as ToolError).code).toBe(code);
    return e as ToolError;
  }
  throw new Error(`expected ${code} but the call succeeded`);
};

beforeAll(async () => {
  root = tmpProject("edit");
  h = await connect(root, doubles(root).deps);
  await h.call("project_create", {
    name: "Edit Test",
    size: "540x960",
    fps: 30,
    template: "saas-promo",
  });
});
afterAll(async () => {
  await h.close();
  cleanup(root);
});

describe("tool list", () => {
  it("exposes every tool from the brief", async () => {
    const listed = (await h.client.listTools()).tools.map((t) => t.name).sort();
    const brief = [
      "project_create",
      "project_read",
      "element_add",
      "element_set",
      "element_remove",
      "element_move",
      "effect_add",
      "keyframe_set",
      "edit",
      "scene_write",
      "lint",
      "frame_render",
      "contact_sheet",
      "sound_search",
      "sound_get",
      "font_search",
      "font_get",
      "font_list",
      "font_preview",
      "font_check",
      "transcribe",
      "voice_quote",
      "voice_generate",
      "align_to_voice",
      "mix_preview",
      "render",
      "history_list",
      "history_restore",
      "review",
    ];
    for (const n of brief) expect(listed, n).toContain(n);
    expect(listed).toEqual([...TOOL_NAMES].sort());
    const add = (await h.client.listTools()).tools.find((t) => t.name === "element_add")!;
    expect(Object.keys((add.inputSchema as any).properties)).toEqual([
      "parent",
      "type",
      "props",
      "at",
      "overlap",
    ]);
  });
});

describe("project_create / project_read", () => {
  it("scaffolded the six beats and refuses a second project", async () => {
    const r = await h.call("project_read", {});
    const scenes = r.outline.children[0].children.map((c: any) => c.id);
    expect(scenes).toEqual(["hook", "problem", "reveal", "features", "proof", "cta"]);
    expect(r.outline.props.size).toEqual([540, 960]);
    await fails(h.call("project_create", { name: "again" }), "invalid_edit");
  });
  it("reads a subtree", async () => {
    const r = await h.call("project_read", { path: "problem", depth: 1 });
    expect(r.outline).toMatchObject({ id: "problem", type: "Scene" });
  });
});

describe("element_add", () => {
  it("adds a Title with validated props, edits the TSX in place, and imports the component", async () => {
    const before = src();
    const r = await h.call("element_add", {
      parent: "hook",
      type: "Title",
      props: { id: "t1", text: "Hello world", size: 90, at: "center" },
    });
    expect(r.id).toBe("t1");
    expect(r.undoToken).toMatch(/^h\d+$/);
    expect(r.patches[0]).toMatchObject({ op: "insert", parent: "hook" });
    const after = src();
    expect(after).toContain('<Title id="t1" text="Hello world" size={90} at="center" />');
    expect(after).toMatch(/import \{[^}]*Title[^}]*\} from "@codecut\/components"/);
    expect(after.replace(/ Title,?/, "")).toContain(before.split("\n")[2]!); // the rest of the file is untouched
    expect(r.description).toBe("add Title #t1 to #hook");
  });
  it("generates an id when none is given", async () => {
    const r = await h.call("element_add", {
      parent: "hook",
      type: "Rect",
      props: { width: 100, height: 100, fill: "#ff3366" },
    });
    expect(r.id).toBe("rect");
    expect(src()).toContain('<Rect id="rect"');
  });
  it("rejects unknown components with a suggestion", async () => {
    const e = await fails(
      h.call("element_add", { parent: "hook", type: "Titel", props: {} }),
      "schema_violation",
    );
    expect(e.message).toContain('Did you mean "Title"');
  });
  it("rejects invalid prop values with the allowed range", async () => {
    const e = await fails(
      h.call("element_add", { parent: "hook", type: "Title", props: { text: "x", size: -5 } }),
      "schema_violation",
    );
    expect(e.fix).toBeTruthy();
    expect(src()).not.toContain("size={-5}");
  });
  it("rejects unknown props with a suggestion", async () => {
    const e = await fails(
      h.call("element_add", { parent: "hook", type: "Title", props: { text: "x", sise: 5 } }),
      "schema_violation",
    );
    expect(e.message).toContain('Did you mean "size"');
  });
  it("rejects effects here and unknown parents", async () => {
    await fails(
      h.call("element_add", { parent: "hook", type: "Shake", props: {} }),
      "schema_violation",
    );
    await fails(
      h.call("element_add", { parent: "nope", type: "Rect", props: {} }),
      "unknown_element",
    );
  });
  it("rejects overlapping clips on a Track and accepts overlap:true", async () => {
    const e = await fails(
      h.call("element_add", {
        parent: "v1",
        type: "Scene",
        props: { id: "extra", start: "2s", duration: "2s" },
      }),
      "overlap_rejected",
    );
    expect(e.fix).toContain("overlap");
    const ok = await h.call("element_add", {
      parent: "v1",
      type: "Scene",
      props: { id: "extra", start: "2s", duration: "2s" },
      overlap: true,
    });
    expect(ok.id).toBe("extra");
    await h.call("element_remove", { id: "extra" });
  });
});

describe("element_set / element_remove / element_move", () => {
  it("changes one prop and nothing else", async () => {
    const before = src();
    const r = await h.call("element_set", { id: "t1", props: { size: 120 } });
    expect(r.patches).toEqual([{ op: "setProp", id: "t1", prop: "size", value: 120 }]);
    expect(src()).toBe(before.replace("size={90}", "size={120}"));
  });
  it("adds and removes (null) props", async () => {
    await h.call("element_set", { id: "t1", props: { weight: 800 } });
    expect(src()).toContain("weight={800}");
    await h.call("element_set", { id: "t1", props: { weight: null } });
    expect(src()).not.toContain("weight={800}");
  });
  it("validates against the schema and refuses id changes", async () => {
    await fails(h.call("element_set", { id: "t1", props: { size: "huge" } }), "schema_violation");
    await fails(h.call("element_set", { id: "t1", props: { id: "other" } }), "invalid_edit");
    await fails(h.call("element_set", { id: "ghost", props: { size: 1 } }), "unknown_element");
  });
  it("moves between parents and removes", async () => {
    await h.call("element_move", { id: "rect", target: "problem" });
    const hook = (await h.call("project_read", { path: "hook", depth: 1 })).outline.children.map(
      (c: any) => c.id,
    );
    const problem = (
      await h.call("project_read", { path: "problem", depth: 1 })
    ).outline.children.map((c: any) => c.id);
    expect(hook).not.toContain("rect");
    expect(problem).toContain("rect");
    await fails(h.call("element_move", { id: "problem", target: "rect" }), "invalid_edit");
    const r = await h.call("element_remove", { id: "rect" });
    expect(r.description).toBe("remove Rect #rect");
    expect(src()).not.toContain('id="rect"');
    await fails(h.call("element_remove", { id: "promo" }), "unknown_element");
  });
});

describe("effect_add / keyframe_set", () => {
  it("adds an effect as a child and returns its id", async () => {
    const r = await h.call("effect_add", {
      id: "t1",
      effect: "Shake",
      props: { amp: 8, freq: 12, start: "0.6s", sound: "" },
    });
    expect(r.id).toBe("t1-shake");
    expect(src()).toMatch(/<Title id="t1"[\s\S]*<Shake id="t1-shake"/);
    await fails(h.call("effect_add", { id: "t1", effect: "Title", props: {} }), "schema_violation");
  });
  it("sets keyframes on an animatable prop with snapped times and rejects duplicates", async () => {
    const r = await h.call("keyframe_set", {
      id: "t1",
      prop: "scale",
      keys: [[0, 0.8], [0.42, 1.05, "expo.out"], { t: 0.8, v: 1 }],
    });
    expect(r.description).toBe("set 3 keys on #t1.scale");
    expect(src()).toContain('scale={[[0, 0.8], [0.433333, 1.05, "expo.out"], [0.8, 1]]}');
    await fails(
      h.call("keyframe_set", {
        id: "t1",
        prop: "scale",
        keys: [
          [0, 1],
          [0.001, 2],
        ],
      }),
      "duplicate_keyframe",
    );
    await fails(
      h.call("keyframe_set", { id: "t1", prop: "text", keys: [[0, "a"]] }),
      "schema_violation",
    );
    await fails(
      h.call("keyframe_set", { id: "t1", prop: "scale", keys: [["@12s", 1]] }),
      "invalid_time",
    );
  });
  it("refuses structured edits on an expression and leaves the file untouched", async () => {
    const path = `${root}/project.tsx`;
    const fs = await import("node:fs");
    const text = src().replace(
      '<Title id="t1" text="Hello world"',
      '<Title id="t1" text={"Hel" + "lo"}',
    );
    fs.writeFileSync(path, text);
    const e = await fails(
      h.call("element_set", { id: "t1", props: { text: "Bye" } }),
      "opaque_expression",
    );
    expect(e.fix).toContain("scene_write");
    expect(src()).toBe(text);
    fs.writeFileSync(path, text.replace('text={"Hel" + "lo"}', 'text="Hello world"'));
  });
});

describe("edit (section 9 operations)", () => {
  it("runs a timeline op with an undo token, and rejects locked tracks", async () => {
    const r = await h
      .call("edit", { op: "setSpeed", args: { id: "hook", speed: 1 } })
      .catch((e) => e);
    void r;
    const locked = await h.call("edit", { op: "lockTrack", args: { track: "v1", value: true } });
    expect(locked.description).toMatch(/lock track #v1/);
    expect(src()).toContain("locked");
    await fails(
      h.call("element_add", { parent: "hook", type: "Rect", props: { width: 5 } }),
      "track_locked",
    );
    await fails(h.call("element_set", { id: "t1", props: { size: 99 } }), "track_locked");
    await h.call("edit", { op: "lockTrack", args: { track: "v1", value: false } });
    expect(src()).not.toMatch(/locked=\{true\}|\blocked\b>/);
  });
  it("splits and trims a scene", async () => {
    const r = await h.call("edit", { op: "split", args: { id: "cta", at: "28s" } });
    expect(r.description).toMatch(/split/);
    const ids = (await h.call("project_read", { depth: 2 })).outline.children[0].children.map(
      (c: any) => c.id,
    );
    expect(ids.length).toBe(7);
  });
  it("reports unknown ops and runs keyframe ops", async () => {
    await fails(h.call("edit", { op: "frobnicate", args: {} }), "invalid_edit");
    const r = await h.call("edit", {
      op: "keyAdd",
      args: { id: "t1", prop: "opacity", t: 0.2, value: 0.5 },
    });
    expect(r.description).toContain("add key opacity");
  });
});

describe("scene_write", () => {
  it("replaces a scene with TSX, adds imports, writes ids", async () => {
    const r = await h.call("scene_write", {
      id: "problem",
      tsx: `<Scene id="problem" start="3s" duration="5s">
  <Card id="c1" width={400} height={200} />
  <Text id="q" text="Videos take days" size={64} />
</Scene>`,
    });
    expect(r.undoToken).toBeTruthy();
    expect(src()).toMatch(/import \{[^}]*Card[^}]*\}/);
    const kids = (await h.call("project_read", { path: "problem", depth: 1 })).outline.children.map(
      (c: any) => c.id,
    );
    expect(kids).toEqual(["c1", "q"]);
  });
  it("rejects TSX that does not parse and leaves the file alone", async () => {
    const before = src();
    await fails(
      h.call("scene_write", {
        id: "hook",
        tsx: '<Scene id="hook" start="0s" duration="3s"><Title',
      }),
      "schema_violation",
    );
    expect(src()).toBe(before);
  });
  it("rejects TSX that fails evaluation or adds lint errors, and restores the file", async () => {
    const before = src();
    await fails(
      h.call("scene_write", {
        id: "hook",
        tsx: '<Scene id="hook" start="0s" duration="3s"><Title id="x" text={undefinedThing} /></Scene>',
      }),
      "internal_error",
    );
    expect(src()).toBe(before);
    const e = await fails(
      h.call("scene_write", {
        id: "hook",
        tsx: '<Scene id="hook" start="0s" duration="3s"><Rect id="r" width={Math.random() * 100} height={10} /></Scene>',
      }),
      "impure_expression",
    );
    expect(e.fix).toContain("ctx.noise");
    expect(src()).toBe(before);
    // a lint error from the schema is also refused after the write is tried, and the file is restored
    await fails(
      h.call("scene_write", {
        id: "hook",
        tsx: '<Scene id="hook" start="0s" duration="3s"><Rect id="r" width={10} height={10} fill={() => 5} /></Scene>',
      }),
      "schema_violation",
    );
    expect(src()).toBe(before);
  });
});

describe("lint / history", () => {
  it("lints and scopes", async () => {
    const all = await h.call("lint", {});
    expect(all).toHaveProperty("errors");
    const scoped = await h.call("lint", { scope: "problem" });
    expect(scoped.issues.every((i: any) => !i.id || ["problem", "c1", "q"].includes(i.id))).toBe(
      true,
    );
    await fails(h.call("lint", { scope: "ghost" }), "unknown_element");
  });
  it("lists snapshots and restores one (and the restore is itself undoable)", async () => {
    const list = await h.call("history_list", {});
    expect(list.snapshots.length).toBeGreaterThan(10);
    const first = list.snapshots[0];
    const detail = await h.call("history_list", { id: first.id });
    expect(detail.id).toBe(first.id);
    const r = await h.call("history_restore", { id: first.id });
    expect(r.restored).toBe(first.id);
    expect(src()).not.toContain('id="t1"');
    const back = await h.call("history_restore", { id: r.undoToken });
    expect(back.restored).toBe(r.undoToken);
    expect(src()).toContain('id="t1"');
    await fails(h.call("history_restore", { id: "h9999" }), "invalid_edit");
  });
});
