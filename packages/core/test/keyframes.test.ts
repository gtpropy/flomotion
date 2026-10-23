import { describe, expect, it } from "vitest";
import {
  buildSignal,
  checkPurity,
  evalColor,
  evalNumber,
  evalSignal,
  evalVec,
  isKeyframes,
  normalizeTrack,
  pathAngle,
  CodeCutError,
  makeCtx,
  noise1D,
} from "../src/index.js";

const norm = <T>(keys: any, o: any = {}) => normalizeTrack<T>(keys, { fps: 30, ...o });

describe("keyframe detection and normalisation", () => {
  it("tells keyframes from plain values", () => {
    expect(
      isKeyframes([
        [0, 1],
        [1, 2],
      ]),
    ).toBe(true);
    expect(isKeyframes([{ t: 0, v: 1 }])).toBe(true);
    expect(isKeyframes({ keys: [[0, 1]] })).toBe(true);
    expect(isKeyframes([1, 2])).toBe(false);
    expect(isKeyframes(5)).toBe(false);
    expect(
      isKeyframes([
        [0, [0, 0]],
        [1, [10, 10]],
      ]),
    ).toBe(true);
  });
  it("snaps to the frame grid and sorts", () => {
    const t = norm<number>([
      [1.02, 5],
      [0, 0],
    ]);
    expect(t.keys.map((k) => k.t)).toEqual([0, 1.033333]);
  });
  it("rejects two keys on one time (after snapping)", () => {
    expect(() =>
      norm([
        [1, 0],
        [1.001, 5],
      ]),
    ).toThrow(/share time/);
    try {
      norm([
        [1, 0],
        [1, 5],
      ]);
    } catch (e) {
      expect((e as CodeCutError).code).toBe("duplicate_keyframe");
    }
  });
  it("resolves non-literal times through the callback", () => {
    const t = norm<number>(
      [
        ["#a.end", 0],
        ["@marker:x", 1],
      ],
      {
        resolveTime: (s: string) => (s === "#a.end" ? 1 : 2),
      },
    );
    expect(t.keys.map((k) => k.t)).toEqual([1, 2]);
  });
});

describe("number evaluation", () => {
  it("holds before first and after last key", () => {
    const t = norm<number>([
      [1, 10],
      [2, 20],
    ]);
    expect(evalNumber(t, 0)).toBe(10);
    expect(evalNumber(t, 5)).toBe(20);
  });
  it("linear by default, eased with arrival ease", () => {
    const lin = norm<number>([
      [0, 0],
      [1, 100],
    ]);
    expect(evalNumber(lin, 0.5)).toBeCloseTo(50);
    const e = norm<number>([
      [0, 0],
      [1, 100, "expo.out"],
    ]);
    expect(evalNumber(e, 0.5)).toBeGreaterThan(90);
  });
  it("hold keys and hold mode step", () => {
    const k = norm<number>({
      keys: [
        { t: 0, v: 1, hold: true },
        { t: 1, v: 2 },
      ],
    });
    expect(evalNumber(k, 0.9)).toBe(1);
    expect(
      evalNumber(
        norm<number>({
          keys: [
            [0, 1],
            [1, 2],
          ],
          mode: "hold",
        }),
        0.9,
      ),
    ).toBe(1);
  });
  it("auto mode is smooth and never overshoots; continuous may", () => {
    const keys = [
      [0, 0],
      [1, 100],
      [2, 100],
      [3, 0],
    ];
    const auto = norm<number>({ keys, mode: "auto" });
    let max = -Infinity;
    for (let i = 0; i <= 300; i++) max = Math.max(max, evalNumber(auto, i / 100));
    expect(max).toBeLessThanOrEqual(100.0001);
    const cont = norm<number>({
      keys: [
        [0, 0],
        [1, 100],
        [2, 0],
      ],
      mode: "continuous",
    });
    expect(evalNumber(cont, 1)).toBe(100);
  });
  it("speed/influence handles shape the curve", () => {
    const fast = norm<number>({
      keys: [
        { t: 0, v: 0, out: { speed: 400, influence: 80 } },
        { t: 1, v: 100, in: { speed: 0, influence: 80 } },
      ],
    });
    expect(evalNumber(fast, 0.2)).toBeGreaterThan(20);
    expect(evalNumber(fast, 1)).toBe(100);
  });
  it("loops: cycle and pingpong", () => {
    const cyc = norm<number>({
      keys: [
        [0, 0],
        [1, 10],
      ],
      loop: "cycle",
    });
    expect(evalNumber(cyc, 1.5)).toBeCloseTo(5);
    const pp = norm<number>({
      keys: [
        [0, 0],
        [1, 10],
      ],
      loop: "pingpong",
    });
    expect(evalNumber(pp, 1.25)).toBeCloseTo(7.5);
    const n2 = norm<number>({
      keys: [
        [0, 0],
        [1, 10],
      ],
      loop: 2,
    });
    expect(evalNumber(n2, 5)).toBe(10);
  });
});

describe("vec / color / spatial", () => {
  it("interpolates vectors, linear and spatial-auto", () => {
    const lin = norm<number[]>({
      keys: [
        [0, [0, 0]],
        [1, [10, 20]],
      ],
      spatial: "linear",
    });
    expect(evalVec(lin, 0.5)).toEqual([5, 10]);
    const curved = norm<number[]>({
      keys: [
        [0, [0, 0]],
        [1, [100, 0]],
        [2, [100, 100]],
      ],
      spatial: "auto",
    });
    const mid = evalVec(curved, 1);
    expect(mid[0]).toBeCloseTo(100);
    expect(mid[1]).toBeCloseTo(0);
  });
  it("a two-key spatial path is a straight line at constant velocity", () => {
    const t = norm<number[]>({
      keys: [
        [0, [0, 0]],
        [1, [300, 60]],
      ],
      spatial: "auto",
    });
    expect(evalVec(t, 0.25)).toEqual([75, 15]);
    expect(evalVec(t, 0.5)).toEqual([150, 30]);
  });
  it("orients along the path", () => {
    const line = norm<number[]>({
      keys: [
        [0, [0, 0]],
        [1, [10, 10]],
      ],
      spatial: "linear",
    });
    expect(pathAngle(line, 0.5)).toBeCloseTo(45, 0);
  });
  it("interpolates colors", () => {
    const c = norm<string>([
      [0, "#000000"],
      [1, "#ffffff"],
    ]);
    expect(evalColor(c, 0.5)).toBe("rgb(128, 128, 128)");
  });
});

describe("signals and expressions", () => {
  const ctx = { fps: 30 };
  it("keys read parent-local time, expressions read element-local time", () => {
    const sig = buildSignal<number>(
      [
        [0, 0],
        [2, 20],
      ],
      { vk: "number", fps: 30, keyBase: 3, exprBase: 4, ctx },
    );
    expect(evalSignal(sig, 4)).toBeCloseTo(10); // 4 - keyBase(3) = 1s into keys
    const ex = buildSignal<number>((t: number) => t * 10, {
      vk: "number",
      fps: 30,
      keyBase: 3,
      exprBase: 4,
      ctx,
    });
    expect(evalSignal(ex, 5)).toBeCloseTo(10); // 5 - exprBase(4) = 1s
  });
  it("exposes the keyed value as ctx.value", () => {
    const sig = buildSignal<number>((_t: number, c: any) => c.value * 2, {
      vk: "number",
      fps: 30,
      keyBase: 0,
      exprBase: 0,
      ctx,
    });
    (sig as any).keys = {
      track: norm<number>([
        [0, 5],
        [1, 5],
      ]),
      keyBase: 0,
    };
    expect(evalSignal(sig, 0.5)).toBe(10);
  });
  it("ctx.noise is a seeded pure function of t", () => {
    const c = makeCtx(ctx, 1.25);
    expect(c.noise(3, 10)).toBe(noise1D(12.5, 3));
    expect(makeCtx(ctx, 1.25).noise(3, 10)).toBe(c.noise(3, 10));
  });
});

describe("purity checker", () => {
  it("accepts pure expressions", () => {
    expect(checkPurity((t: number, ctx: any) => Math.sin(t * 3) * ctx.noise(1, 4))).toEqual([]);
    expect(
      checkPurity((t: number) => {
        const a = t * 2;
        let b = a;
        b += 1;
        return b;
      }),
    ).toEqual([]);
  });
  it("rejects nondeterminism and outer mutation", () => {
    expect(checkPurity(() => Math.random())[0]!.rule).toBe("Math.random");
    expect(checkPurity(() => Date.now())[0]!.rule).toBe("Date");
    expect(checkPurity(() => performance.now()).length).toBe(1);
    let n = 0;
    expect(checkPurity((t: number) => (n += t)).map((i) => i.rule)).toContain("mutable-closure");
    const st: any = {};
    expect(checkPurity((t: number) => (st.v = t)).map((i) => i.rule)).toContain("mutable-closure");
    expect(checkPurity(() => fetch("x")).map((i) => i.rule)).toContain("network");
  });
  it("ignores forbidden words in strings and comments", () => {
    expect(checkPurity(() => "Math.random /* Date.now */")).toEqual([]);
  });
});
