import { describe, expect, it } from "vitest";
import {
  Composition,
  Scene,
  Track,
  Marker,
  defineComponent,
  defineEffect,
  num,
  vec2,
  text,
  enumOf,
  validateProps,
  registry,
  propsTypeSource,
  propsJsonSchema,
  docsMarkdown,
  deriveLintRules,
  isNode,
  FlomotionError,
} from "../src/index.js";

const Box = defineComponent("TestBox", {
  category: "test",
  description: "A test box",
  controls: {
    w: num({ min: 0, max: 100, default: 10, animatable: true, unit: "px" }),
    label: text(),
    mode: enumOf(["a", "b"], { default: "a" }),
    pos: vec2({ default: [0, 0] }),
  },
});

describe("defineComponent", () => {
  it("rejects missing schemas and bad names", () => {
    expect(() => defineComponent("lower", { category: "x", controls: {} })).toThrow(FlomotionError);
    expect(() => defineComponent("NoSchema", { category: "x" } as any)).toThrow(/without a schema/);
  });
  it("registers and merges mixins", () => {
    expect(registry.has("TestBox")).toBe(true);
    const def = Box.def;
    expect(Object.keys(def.controls)).toEqual(
      expect.arrayContaining([
        "w",
        "id",
        "start",
        "duration",
        "position",
        "rotation",
        "scale",
        "skew",
        "anchor",
        "opacity",
        "crop",
        "flip",
        "blend",
        "perspective",
      ]),
    );
    expect(def.controls.opacity!.animatable).toBe(true);
  });
  it("builds a node via JSX", () => {
    const n = (
      <Composition id="c" size={[100, 100]} duration="2s">
        <Scene id="s" start="0s" duration="2s">
          <Box id="b" w={5} />
        </Scene>
        <Marker id="m" at="1s" label="x" />
      </Composition>
    );
    expect(isNode(n)).toBe(true);
    expect(n.name).toBe("Composition");
    expect(n.children).toHaveLength(2);
    const scene = n.children[0] as any;
    expect(scene.children[0].props).toEqual({ id: "b", w: 5 });
  });
  it("flattens fragments and arrays", () => {
    const n = (
      <Track id="t">
        <>
          <Box id="a" />
          {[1, 2].map((i) => (
            <Box id={`x${i}`} />
          ))}
        </>
      </Track>
    );
    expect(n.children).toHaveLength(3);
  });
});

describe("validateProps", () => {
  it("accepts good props, keyframes and expressions", () => {
    expect(validateProps(Box.def, { w: 5, mode: "b", pos: [1, 2] })).toEqual([]);
    expect(
      validateProps(Box.def, {
        w: [
          [0, 0],
          [1, 50, "expo.out"],
        ],
      }),
    ).toEqual([]);
    expect(validateProps(Box.def, { w: (t: number) => t })).toEqual([]);
  });
  it("flags range, enum, unknown, non-animatable", () => {
    const issues = validateProps(Box.def, {
      w: 500,
      mode: "z",
      opacty: 3,
      label: (() => "x") as any,
    });
    const codes = issues.map((i) => `${i.prop}:${i.code}`).sort();
    expect(codes).toEqual([
      "label:not_animatable",
      "mode:invalid_value",
      "opacty:unknown_prop",
      "w:invalid_value",
    ]);
    expect(issues.find((i) => i.prop === "opacty")!.message).toMatch(/Did you mean "opacity"/);
    expect(issues.find((i) => i.prop === "w")!.fix).toMatch(/range 0 to 100/);
  });
  it("range-checks keyframe values", () => {
    const issues = validateProps(Box.def, {
      w: [
        [0, 0],
        [1, 999],
      ],
    });
    expect(issues).toHaveLength(1);
    expect(issues[0]!.code).toBe("invalid_value");
  });
  it("requires required props", () => {
    expect(validateProps(Composition.def, { id: "c" }).map((i) => i.code)).toContain("required");
  });
});

describe("generators", () => {
  it("emits TS, JSON schema, docs and lint rules from one declaration", () => {
    const src = propsTypeSource(Box.def);
    expect(src).toContain("export interface TestBoxProps");
    expect(src).toContain("w?: Animatable<number>;");
    expect(src).toContain('mode?: "a" | "b";');
    const js = propsJsonSchema(Box.def) as any;
    expect(js.properties.w).toBeTruthy();
    expect(js.additionalProperties).toBe(false);
    const md = docsMarkdown(Box.def);
    expect(md).toContain("# TestBox");
    expect(md).toContain("range 0..100");
    const rules = deriveLintRules(Box.def);
    expect(rules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ prop: "w", rule: "range" }),
        expect.objectContaining({ prop: "label", rule: "animatable" }),
      ]),
    );
  });
});

describe("defineEffect", () => {
  it("creates effects with common controls", () => {
    const E = defineEffect("TestFx", {
      category: "test",
      controls: { amp: num({ default: 1 }) },
      sound: "hit/land",
    });
    expect(E.def.kind).toBe("effect");
    expect(E.def.sound).toBe("hit/land");
    expect(Object.keys(E.def.controls)).toEqual(
      expect.arrayContaining(["amp", "start", "duration", "enabled"]),
    );
  });
});
