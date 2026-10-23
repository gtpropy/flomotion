import { describe, expect, it } from "vitest";
import { CodeCutError, type CCNode } from "@codecut/core";
import { TsxDoc, isStructuredExpr } from "../src/codemod/tsx.js";
import { printExpr, printNode } from "../src/codemod/print.js";

const SRC = `import { Composition, Track, Scene, Title, Sound } from "@codecut/components";

const SFX = (n: string) => \`./assets/\${n}.wav\`;

// the whole film
export default (
  <Composition id="main" size={[1080, 1920]} fps={30} duration="6s">
    <Track id="v1" kind="video">
      {/* 1. HOOK */}
      <Scene id="hook" start="0s" duration="3s">
        <Title
          id="t1"
          text="Hello"
          size={118} // big on purpose
          enter={{ from: "sw", distance: 120 }}
        />
        <Sound id="s1" src={SFX("land")} at="0.6s" />
      </Scene>
      <Scene id="empty" start="3s" duration="3s" />
    </Track>
  </Composition>
);
`;

const node = (
  name: string,
  props: Record<string, unknown>,
  children: CCNode["children"] = [],
): CCNode => ({
  $cc: 1,
  name,
  props,
  children,
});

describe("codemod: values", () => {
  it("prints literals the way a person would", () => {
    expect(
      printExpr([
        [0, 1],
        [3, 1.08, "expo.out"],
      ]),
    ).toBe('[[0, 1], [3, 1.08, "expo.out"]]');
    expect(printExpr({ from: "sw", "dash-x": 1 })).toBe('{ from: "sw", "dash-x": 1 }');
    expect(() => printExpr(() => 1)).toThrow(CodeCutError);
  });
  it("prints an element tree", () => {
    const s = printNode(node("Title", { id: "t2", text: "Hi", size: 90 }));
    expect(s).toBe('<Title id="t2" text="Hi" size={90} />');
  });
  it("classifies expressions", async () => {
    const { Project } = await import("ts-morph");
    const p = new Project({ useInMemoryFileSystem: true });
    const f = p.createSourceFile(
      "x.ts",
      "const a = [[0, -1], {x: 1}]; const b = f(1); const c = {...z};",
    );
    const decls = f.getVariableDeclarations().map((d) => d.getInitializer());
    expect(decls.map((d) => isStructuredExpr(d))).toEqual([true, false, false]);
  });
});

describe("codemod: structured edits", () => {
  it("changes one literal and leaves everything else byte for byte", () => {
    const out = new TsxDoc(SRC).setProp("t1", "size", 140).text;
    expect(out).toBe(SRC.replace("size={118}", "size={140}"));
    expect(out).toContain("// big on purpose");
    expect(out).toContain("{/* 1. HOOK */}");
  });
  it("rewrites an object literal prop", () => {
    const out = new TsxDoc(SRC).setProp("t1", "enter", { from: "n", distance: 60 }).text;
    expect(out).toContain('enter={{ from: "n", distance: 60 }}');
    expect(out).toContain("// big on purpose");
  });
  it("refuses structured edits on an opaque expression and leaves the file alone", () => {
    const doc = new TsxDoc(SRC);
    expect(() => doc.setProp("s1", "src", "x.wav")).toThrowError(/expression/);
    try {
      doc.setProp("s1", "src", "x.wav");
    } catch (e) {
      expect((e as CodeCutError).code).toBe("opaque_expression");
    }
    expect(doc.text).toBe(SRC);
    // the other literal props on the same element are still editable and the call stays intact
    expect(doc.setProp("s1", "at", "0.9s").text).toContain('src={SFX("land")} at="0.9s"');
  });
  it("adds a prop to a multi-line tag on its own line", () => {
    const out = new TsxDoc(SRC).setProp("t1", "weight", 900).text;
    expect(out).toContain(
      '          enter={{ from: "sw", distance: 120 }}\n          weight={900}\n',
    );
  });
  it("adds a prop to a single-line tag", () => {
    expect(new TsxDoc(SRC).setProp("hook", "name", "Hook").text).toContain(
      '<Scene id="hook" start="0s" duration="3s" name="Hook">',
    );
  });
  it("removes a prop", () => {
    const out = new TsxDoc(SRC).setProp("t1", "text", undefined).text;
    expect(out).not.toContain('text="Hello"');
    expect(out).toContain('id="t1"');
  });
  it("sets a bare boolean", () => {
    expect(new TsxDoc(SRC).setProp("v1", "locked", true).text).toContain(
      '<Track id="v1" kind="video" locked>',
    );
  });
  it("inserts into a self-closing parent, before and after anchors, and last", () => {
    const n = node("Title", { id: "new", text: "x" });
    const into = new TsxDoc(SRC).insert("empty", n, {}).text;
    expect(into).toContain(
      '<Scene id="empty" start="3s" duration="3s">\n        <Title id="new" text="x" />\n      </Scene>',
    );
    const before = new TsxDoc(SRC).insert("hook", n, { before: "s1" }).text;
    expect(before.indexOf('id="new"')).toBeGreaterThan(before.indexOf('id="t1"'));
    expect(before.indexOf('id="new"')).toBeLessThan(before.indexOf('id="s1"'));
    const after = new TsxDoc(SRC).insert("hook", n, { after: "s1" }).text;
    expect(after.indexOf('id="new"')).toBeGreaterThan(after.indexOf('id="s1"'));
    const last = new TsxDoc(SRC).insert("hook", n, {}).text;
    expect(last.indexOf('id="new"')).toBeGreaterThan(last.indexOf('id="s1"'));
    for (const t of [into, before, after, last]) new TsxDoc(t).assertParses();
  });
  it("removes an element with its line", () => {
    const out = new TsxDoc(SRC).remove("s1").text;
    expect(out).not.toContain("s1");
    expect(out).toContain("</Scene>");
    new TsxDoc(out).assertParses();
  });
  it("writes missing ids", () => {
    const src = SRC.replace(' id="t1"', "").replace('\n          id="t1"', "");
    const tree = node("Composition", { id: "main" }, [
      node("Track", { id: "v1" }, [
        node("Scene", { id: "hook" }, [
          node("Title", { text: "Hello" }),
          node("Sound", { id: "s1" }),
        ]),
        node("Scene", { id: "empty" }),
      ]),
    ]);
    const { doc, written } = new TsxDoc(src).writeIds(tree);
    expect(written).toHaveLength(1);
    expect(doc.text).toMatch(/<Title id="cc_\w+"/);
  });
  it("reports a syntax error with a typed code", () => {
    expect(() => new TsxDoc("export default (<A>").assertParses()).toThrowError(/does not parse/);
  });
});
