import { describe, expect, it } from "vitest";
import { lintTree, edit, type CCNode, type Ledger } from "../src/index.js";
import { safeRect } from "../src/layout.js";

const el = (
  name: string,
  props: Record<string, unknown> = {},
  children: CCNode[] = [],
): CCNode => ({ $cc: 1, name, props, children });
const comp = (children: CCNode[], extra: Record<string, unknown> = {}, pre: CCNode[] = []) =>
  el(
    "Composition",
    { id: "c", size: [1080, 1920], fps: 30, duration: "3s", background: "#000000", ...extra },
    [
      ...pre,
      el("Track", { id: "v1" }, [el("Scene", { id: "s1", start: "0s", duration: "3s" }, children)]),
    ],
  );
const rules = (root: CCNode, ctx = {}) =>
  lintTree(root, { safeRect: (p: string, c: any) => safeRect(p as "reels", c), ...ctx }).issues.map(
    (i) => `${i.severity}:${i.rule}`,
  );

describe("linter: one failing fixture per rule", () => {
  it("passes a clean project", () => {
    const issues = lintTree(comp([el("Rect", { id: "r", width: 100, height: 100 })])).issues.filter(
      (i) => i.severity !== "info",
    );
    expect(issues).toEqual([]);
  });
  it("impure expression", () => {
    const r = rules(comp([el("Rect", { id: "r", opacity: () => Math.random() })]));
    expect(r).toContain("error:impure-expression");
    expect(rules(comp([el("Rect", { id: "r", x: 1 })]))).toContain("error:unknown-prop");
  });
  it("out-of-range prop and non-animatable expression", () => {
    expect(rules(comp([el("Rect", { id: "r", opacity: 3 })]))).toContain("error:invalid-value");
    expect(
      rules(
        comp([
          el("Rect", {
            id: "r",
            opacity: [
              [0, 0],
              [1, 5],
            ],
          }),
        ]),
      ),
    ).toContain("error:invalid-value");
    expect(rules(comp([el("Rect", { id: "r", blend: () => "multiply" })]))).toContain(
      "error:not-animatable",
    );
  });
  it("missing id", () => {
    const issues = lintTree(comp([el("Rect", { width: 10 })])).issues;
    const m = issues.find((i) => i.rule === "missing-id")!;
    expect(m.message).toMatch(/cc_/);
    expect(m.fix).toMatch(/id="cc_/);
  });
  it("duplicate id and unknown component", () => {
    expect(rules(comp([el("Rect", { id: "d" }), el("Rect", { id: "d" })]))).toContain(
      "error:duplicate-id",
    );
    expect(rules(comp([el("Nope", { id: "n" })]))).toContain("error:resolve-failed");
  });
  it("missing ledger entry for a sound; licence gate", () => {
    const ledger: Ledger = { version: 1, entries: [] };
    const root = comp([el("Sound", { id: "snd", src: "freesound:999", at: "1s" })]);
    expect(rules(root, { ledger })).toContain("error:asset-no-ledger");
    const withEntry: Ledger = {
      version: 1,
      entries: [
        {
          source: "freesound",
          kind: "sound",
          id: "999",
          file: "x.mp3",
          hash: "h",
          license: "CC-BY-NC",
          attributionRequired: true,
          commercialOk: false,
        },
      ],
    };
    expect(rules(root, { ledger: withEntry })).toContain("error:license-blocked");
    const ok: Ledger = {
      version: 1,
      entries: [
        {
          source: "freesound",
          kind: "sound",
          id: "999",
          file: "x.mp3",
          hash: "h",
          license: "CC0",
          attributionRequired: false,
          commercialOk: true,
        },
      ],
    };
    expect(rules(root, { ledger: ok })).not.toContain("error:asset-no-ledger");
  });
  it("locked track write is rejected by the edit API (typed error)", () => {
    const root = comp([], {}, []);
    root.children.push(
      el("Track", { id: "L", locked: true }, [
        el("Scene", { id: "ls", start: "0s", duration: "1s" }),
      ]),
    );
    expect(rules(root)).toContain("info:track-locked");
    expect(() => edit.lift(root, { id: "ls" })).toThrow(/locked/);
  });
  it("missing glyphs are listed", () => {
    const fonts = el("Fonts", { id: "fonts" }, [
      el("Font", { id: "display", family: "Space Grotesk", source: "google" }),
    ]);
    const r = lintTree(
      comp(
        [el("Text", { id: "t", text: "Hello नमस्ते", font: "display", size: 64, at: [100, 600] })],
        {},
        [fonts],
      ),
      { missingGlyphs: (_id, text) => [...text].filter((c) => /[ऀ-ॿ]/.test(c)) },
    ).issues;
    const g = r.find((i) => i.rule === "missing-glyph")!;
    expect(g.severity).toBe("error");
    expect(g.message).toContain("U+0928");
  });
  it("font rules: ledger, licence, system, family count", () => {
    const decls = ["A", "B", "C", "D"].map((f, i) =>
      el("Font", { id: `f${i}`, family: `Family ${f}`, source: i === 3 ? "system" : "google" }),
    );
    const root = comp([], {}, [el("Fonts", { id: "fonts" }, decls)]);
    const r = rules(root, { ledger: { version: 1, entries: [] } });
    expect(r).toContain("warning:too-many-font-families");
    expect(r).toContain("warning:system-font");
    expect(r).toContain("error:font-no-ledger");
    const unk: Ledger = {
      version: 1,
      entries: [
        {
          source: "google-fonts",
          kind: "font",
          id: "f0:latin:x",
          family: "Family A",
          file: "f",
          hash: "h",
          license: "unknown",
          attributionRequired: false,
          commercialOk: false,
        },
      ],
    };
    expect(
      rules(
        comp([], {}, [
          el("Fonts", { id: "fonts" }, [
            el("Font", { id: "f0", family: "Family A", source: "google" }),
          ]),
        ]),
        { ledger: unk },
      ),
    ).toContain("error:font-unknown-license");
  });
  it("text size, safe area and contrast", () => {
    const small = rules(comp([el("Text", { id: "t", text: "tiny", size: 12, at: "center" })]));
    expect(small).toContain("warning:text-too-small");
    const outside = rules(
      comp([el("Text", { id: "t", text: "At the very top", size: 64, at: "top" })]),
    );
    expect(outside).toContain("warning:text-outside-safe-area");
    const inside = rules(
      comp([
        el("SafeArea", { id: "sa", preset: "reels" }, [
          el("Text", { id: "t", text: "Fine", size: 64, at: "center" }),
        ]),
      ]),
    );
    expect(inside).not.toContain("warning:text-outside-safe-area");
    const low = rules(
      comp([
        el("Text", { id: "t", text: "Hard to read", size: 64, fill: "#111111", at: "center" }),
      ]),
    );
    expect(low).toContain("warning:text-contrast");
  });
});
