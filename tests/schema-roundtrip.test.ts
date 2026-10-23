import { describe, expect, it } from "vitest";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import {
  docsIndexMarkdown,
  docsMarkdown,
  propsJsonSchema,
  registry,
  validateProps,
  type AnyControl,
} from "@codecut/components";
import { join } from "node:path";

/** A valid sample value for any control, derived from its declaration. */
function sample(c: AnyControl): unknown {
  const o = c.opts as { default?: unknown; min?: number; max?: number };
  if (o.default !== undefined) return o.default;
  switch (c.kind) {
    case "num":
    case "int":
    case "angle":
      return o.min !== undefined && o.max !== undefined
        ? Math.round((o.min + o.max) / 2)
        : (o.min ?? 1);
    case "bool":
      return true;
    case "enum":
      return c.values![0];
    case "text":
    case "richText":
      return "sample";
    case "color":
    case "fill":
      return "#ff3366";
    case "color3":
      return [0.1, 0.2, 0.3];
    case "vec2":
      return [1, 2];
    case "vec3":
      return [1, 2, 3];
    case "curve":
      return [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ];
    case "curves":
      return {
        rgb: [
          { x: 0, y: 0 },
          { x: 1, y: 1 },
        ],
      };
    case "ease":
      return "expo.out";
    case "file":
      return "a.cube";
    case "asset":
      return "./a.png";
    case "ref":
      return "#a";
    case "time":
      return "1s";
    case "length":
      return "10%";
    case "list":
      return [sample(c.item!)];
    case "group":
      return Object.fromEntries(Object.entries(c.fields!).map(([k, f]) => [k, sample(f)]));
    default:
      return undefined;
  }
}

const defs = registry.list().filter((d) => !/^(Test|CT|PBlock)/.test(d.name));

describe("schema round trip: every control keeps its value through JSX props, validation, JSON and the wire schema", () => {
  it("covers every definition", () => {
    expect(defs.length).toBeGreaterThan(70);
  });
  for (const def of defs) {
    it(def.name, () => {
      const props: Record<string, unknown> = {};
      let covered = 0;
      for (const [k, c] of Object.entries(def.controls)) {
        const v = sample(c);
        if (v === undefined) continue;
        props[k] = v;
        covered++;
      }
      expect(covered).toBeGreaterThan(0);
      // 1. static values validate against the schema the compiler and linter use
      expect(validateProps(def, props)).toEqual([]);
      // 2. they survive JSON (the MCP wire form) and validate against the wire schema
      const wire = JSON.parse(JSON.stringify(props));
      const parsed = def.wire.parse(wire);
      expect(parsed).toEqual(wire);
      // 3. animatable controls also accept keyframes of the same value, and out-of-range keyframes are rejected
      for (const [k, c] of Object.entries(def.controls)) {
        if (!c.animatable || props[k] === undefined) continue;
        const kf = [
          [0, props[k]],
          [1, props[k]],
        ];
        expect(validateProps(def, { ...props, [k]: kf }), `${def.name}.${k} keyframes`).toEqual([]);
        expect(def.wire.safeParse({ [k]: kf }).success).toBe(true);
        const o = c.opts as { max?: number };
        if (c.kind === "num" && o.max !== undefined)
          expect(validateProps(def, { ...props, [k]: [[0, o.max + 1]] }).length).toBeGreaterThan(0);
      }
      // 4. the generated JSON schema (MCP tool arguments) describes the same props
      const js = propsJsonSchema(def) as { properties: Record<string, unknown> };
      for (const k of Object.keys(props))
        expect(js.properties[k], `${def.name}.${k} missing from JSON schema`).toBeTruthy();
    });
  }
});

describe("generated docs match the code", () => {
  it("docs/components/*.md equals the generator output", () => {
    const dir = join(__dirname, "..", "docs", "components");
    for (const d of defs) {
      let on: string;
      try {
        on = readFileSync(join(dir, `${d.name}.md`), "utf8");
      } catch {
        throw new Error(`docs/components/${d.name}.md is missing: run pnpm run gen:docs`);
      }
      expect(on, `${d.name}.md is stale: run pnpm run gen:docs`).toBe(docsMarkdown(d));
    }
    expect(readFileSync(join(dir, "README.md"), "utf8")).toBe(docsIndexMarkdown(registry));
  });
});
export { mkdirSync, writeFileSync };
