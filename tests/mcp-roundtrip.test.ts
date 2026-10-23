import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { registry, validateProps } from "@codecut/components";
import { findById, walk, type CCNode } from "@codecut/core";
import { loadProject } from "@codecut/render";
import { cleanup, connect, doubles, tmpProject, type Harness } from "../packages/mcp/test/harness.js";
import { sample } from "./helpers/sample.js";

let root: string;
let h: Harness;
beforeAll(async () => {
  root = tmpProject("roundtrip");
  h = await connect(root, doubles(root).deps);
  await h.call("project_create", { name: "Round Trip", size: "540x960", duration: 4 });
  await h.call("scene_write", { id: "main", tsx: '<Scene id="s" start="0s" duration="4s"><Rect id="r0" width={10} height={10} /></Scene>' });
});
afterAll(async () => {
  await h.close();
  cleanup(root);
});

const json = (v: unknown) => JSON.parse(JSON.stringify(v));
const node = async (id: string): Promise<CCNode> => {
  const { node: tree } = await loadProject(root);
  const hit = findById(tree, id);
  if (!hit) throw new Error(`#${id} not found after the MCP call`);
  return hit.node;
};

// Containers and structural nodes are exercised by the other MCP tests; here we check every other control.
const SKIP = new Set(["Composition", "Track", "Scene", "Fonts", "Font", "Keyframes", "Theme", "Look", "Precomp", "Adjustment"]);
const defs = registry.list().filter((d) => !/^(Test|CT|PBlock)/.test(d.name) && !d.stub && !SKIP.has(d.name));

describe("schema round trip through an MCP call: every control keeps its value", () => {
  it("covers the registry", () => {
    expect(defs.length).toBeGreaterThan(55);
  });
  for (const def of defs) {
    it(def.name, async () => {
      const props: Record<string, unknown> = {};
      for (const [k, c] of Object.entries(def.controls)) {
        const v = sample(c);
        if (v !== undefined && k !== "id") props[k] = v;
      }
      expect(validateProps(def, { ...props, id: "x1" })).toEqual([]);
      const id = `x_${def.name.toLowerCase()}`;
      const r =
        def.kind === "effect"
          ? await h.call("effect_add", { id: "r0", effect: def.name, props: { id, ...props } })
          : await h.call("element_add", { parent: "s", type: def.name, props: { id, ...props } });
      expect(r.id).toBe(id);
      // JSX -> evaluated tree: each prop is exactly what was sent
      const n = await node(id);
      expect(n.name).toBe(def.name);
      for (const [k, v] of Object.entries(props)) expect(json(n.props[k]), `${def.name}.${k}`).toEqual(json(v));
      // a second MCP call on the same prop (element_set) also round-trips, with keyframes on animatable ones
      const anim = Object.entries(def.controls).find(([k, c]) => c.animatable && props[k] !== undefined && c.kind !== "color");
      if (anim) {
        const [k] = anim;
        const kf = [[0, props[k]], [1, props[k], "expo.out"]];
        await h.call("element_set", { id, props: { [k]: kf } });
        expect(json((await node(id)).props[k]), `${def.name}.${k} keyframes`).toEqual(kf);
      }
      await h.call("element_remove", { id });
      let found = false;
      walk((await loadProject(root)).node, (x) => {
        if (x.props.id === id) found = true;
      });
      expect(found).toBe(false);
    }, 30_000);
  }
});
