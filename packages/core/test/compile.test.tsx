import { describe, expect, it } from "vitest";
import {
  Composition,
  Track,
  Scene,
  Marker,
  defineComponent,
  defineEffect,
  color,
  num,
  resolveProject,
  compileProject,
  exprSignal,
  evalSignal,
} from "../src/index.js";

const Block = defineComponent("CTBlock", {
  category: "test",
  controls: {
    w: num({ default: 100 }),
    h: num({ default: 100 }),
    fillColor: color({ default: "#f36" }),
  },
  render: (p, rc) => ({
    html: `<div id="${rc.sub("b")}" style="width:${p.w}px;height:${p.h}px;background:${p.fillColor}"></div>`,
    box: { left: "0px", top: "0px", width: `${p.w}px`, height: `${p.h}px` },
  }),
});

const Nudge = defineEffect("CTNudge", {
  category: "test",
  controls: { amp: num({ default: 10 }) },
  apply: (p, rc) => ({
    offsets: [
      {
        prop: "x",
        mode: "add",
        signal: exprSignal(
          (t) =>
            t >= rc.node.start && t < rc.node.start + 0.5
              ? p.amp * (1 - (t - rc.node.start) / 0.5)
              : 0,
          "number",
          [rc.node.start, rc.node.start + 0.5],
        ),
      },
    ],
  }),
});

const project = (
  <Composition id="p" size={[400, 300]} fps={30} duration="3s">
    <Track id="v1" kind="video">
      <Scene id="s1" start="0s" duration="2s">
        <Block
          id="b1"
          position={
            [
              [0, [0, 0]],
              [1, [100, 50], "expo.out"],
            ] as any
          }
          opacity={[
            [0, 0],
            [0.5, 1],
          ]}
          enter={{ from: "w", distance: 80, duration: 0.5 }}
        >
          <Nudge id="n1" amp={20} start="0.5s" />
        </Block>
      </Scene>
      <Scene id="s2" start="2s" duration="1s" transition={{ type: "dissolve", duration: 0.3 }}>
        <Block id="b2" fillColor="#3cf" />
      </Scene>
    </Track>
    <Marker id="m1" at="1s" label="beat" />
  </Composition>
);

describe("resolve + compile", () => {
  it("resolves timing and props", () => {
    const r = resolveProject(project);
    expect(r.issues.filter((i) => i.severity === "error")).toEqual([]);
    const b1 = r.byId.get("b1")!;
    expect(b1.start).toBe(0);
    expect(b1.end).toBe(2);
    expect(r.byId.get("s2")!.start).toBe(2);
    expect(r.byId.get("n1")!.start).toBe(0.5);
    expect(r.markers).toEqual([{ at: 1, label: "beat", color: undefined, id: "m1" }]);
    const pos = b1.props.position;
    expect(pos.kind).toBe("track");
    expect(evalSignal(pos, 1)).toEqual([100, 50, 0]);
    expect(evalSignal(b1.props.opacity, 0.25)).toBeCloseTo(0.5);
  });

  it("compiles to HyperFrames HTML", () => {
    const out = compileProject(resolveProject(project));
    const h = out.html;
    expect(h).toContain('data-composition-id="p"');
    expect(h).toContain('data-width="400"');
    expect(h).toMatch(/id="b1" class="clip fm-l fm-ctblock" data-start="0" data-duration="2"/);
    expect(h).toContain('id="s2" class="clip fm-l fm-scene" data-start="2"');
    expect(h).toContain("window.__timelines[window.__fmId]=tl");
    expect(h).toContain('<script src="vendor/gsap.min.js">');
    // s1 extended while s2 dissolves in (2s..2.3s): host duration 2.3
    expect(h).toMatch(/id="s1"[^>]*data-duration="2.3"/);
    // baked x channel exists for b1 (keys + effect + enter)
    const baked = JSON.parse(h.match(/window\.__fmBaked=(.*);\n/)![1]!);
    const x = baked.find((b: any[]) => b[0] === "#b1-xf" && b[1] === "x");
    expect(x).toBeTruthy();
    expect(x[3]).toBe(60);
    expect(out.issues.filter((i) => i.severity === "error")).toEqual([]);
  });

  it("is deterministic", () => {
    const a = compileProject(resolveProject(project)).html;
    const b = compileProject(resolveProject(project)).html;
    expect(a).toBe(b);
  });
});
