import { describe, expect, it } from "vitest";
import gsap from "gsap";
import { parseTimeLiteral, parseTimeSpec, snapToFrame, toTimecode } from "../src/values/time.js";
import { parseLength, resolveLength } from "../src/values/length.js";
import { parseAngle } from "../src/values/angle.js";
import { parseColor, toHex, contrastRatio } from "../src/values/color.js";
import {
  evalEase as ease,
  parseEase,
  springSettleTime,
  springValue,
  toGsapEase,
} from "../src/values/ease.js";
import { mulberry32, noise1D, noise2D } from "../src/values/noise.js";
import { FlomotionError } from "../src/errors.js";

describe("time", () => {
  it("parses every literal form", () => {
    expect(parseTimeLiteral(1.5, 30)).toBe(1.5);
    expect(parseTimeLiteral("1.5s", 30)).toBe(1.5);
    expect(parseTimeLiteral("1500ms", 30)).toBe(1.5);
    expect(parseTimeLiteral("36f", 30)).toBe(1.2);
    expect(parseTimeLiteral("00:00:01:12", 30)).toBe(1.4);
    expect(parseTimeLiteral("00:01:00:00", 24)).toBe(60);
  });
  it("rejects garbage with a typed error", () => {
    expect(() => parseTimeLiteral("soon", 30)).toThrow(FlomotionError);
  });
  it("parses references", () => {
    expect(parseTimeSpec("@12s", 30)).toEqual({ kind: "abs", seconds: 12 });
    expect(parseTimeSpec("@marker:drop+0.2", 30)).toEqual({
      kind: "marker",
      name: "drop",
      offset: 0.2,
    });
    expect(parseTimeSpec("#t1.end+0.2", 30)).toEqual({
      kind: "ref",
      id: "t1",
      edge: "end",
      offset: 0.2,
    });
    expect(parseTimeSpec("#hero-2.start-6f", 30)).toEqual({
      kind: "ref",
      id: "hero-2",
      edge: "start",
      offset: -0.2,
    });
  });
  it("snaps to frames and formats timecode", () => {
    expect(snapToFrame(1.0123, 30)).toBeCloseTo(1.0, 6);
    expect(snapToFrame(1.02, 30)).toBeCloseTo(1.033333, 5);
    expect(toTimecode(1.4, 30)).toBe("00:00:01:12");
  });
});

describe("length / angle / color", () => {
  it("resolves lengths", () => {
    const basis = { parent: 200, vw: 1080, vh: 1920 };
    expect(resolveLength(120, basis)).toBe(120);
    expect(resolveLength("50%", basis)).toBe(100);
    expect(resolveLength("10vw", basis)).toBeCloseTo(108);
    expect(resolveLength("10vh", basis)).toBeCloseTo(192);
    expect(parseLength("12px")).toEqual({ unit: "px", value: 12 });
  });
  it("parses angles", () => {
    expect(parseAngle(45)).toBe(45);
    expect(parseAngle("0.25turn")).toBe(90);
    expect(parseAngle("180deg")).toBe(180);
  });
  it("parses colors", () => {
    expect(toHex(parseColor("#f36"))).toBe("#ff3366");
    expect(parseColor("rgba(255,0,0,.5)").a).toBe(0.5);
    const red = parseColor("oklch(0.628 0.2577 29.23)");
    expect(red.r).toBeGreaterThan(240);
    expect(red.g).toBeLessThan(20);
    expect(() => parseColor("$brand.primary")).toThrow(FlomotionError);
    expect(contrastRatio(parseColor("#000"), parseColor("#fff"))).toBeCloseTo(21, 0);
  });
});

describe("ease", () => {
  it("hits endpoints", () => {
    for (const e of [
      "linear",
      "expo.out",
      "back.out(1.7)",
      "bezier(.2,.8,.2,1)",
      "spring(180,18)",
      "elastic.out",
      "bounce.out",
      "sine.inOut",
      "steps(4)",
    ]) {
      expect(ease(e, 0)).toBeCloseTo(0, 5);
      expect(ease(e, 1)).toBeCloseTo(1, 5);
    }
  });
  it("matches GSAP for every native family", () => {
    const specs = [
      "sine.in",
      "sine.out",
      "sine.inOut",
      "quad.in",
      "quad.out",
      "quad.inOut",
      "cubic.out",
      "quart.inOut",
      "quint.in",
      "power2.out",
      "power4.inOut",
      "expo.in",
      "expo.out",
      "expo.inOut",
      "circ.in",
      "circ.out",
      "circ.inOut",
      "back.in",
      "back.out",
      "back.out(1.7)",
      "back.inOut(2)",
      "elastic.out",
      "elastic.in",
      "elastic.out(1,0.3)",
      "elastic.inOut",
      "bounce.out",
      "bounce.in",
      "bounce.inOut",
    ];
    for (const spec of specs) {
      const native = toGsapEase(spec)!;
      expect(native, spec).toBeTruthy();
      const g = gsap.parseEase(native);
      for (let i = 1; i < 20; i++) {
        const p = i / 20;
        expect(ease(spec, p), `${spec} @ ${p}`).toBeCloseTo(g(p), 4);
      }
    }
  });
  it("only maps exact families to GSAP", () => {
    expect(toGsapEase("spring(180,18)")).toBeNull();
    expect(toGsapEase("bezier(.2,.8,.2,1)")).toBeNull();
    expect(toGsapEase("linear")).toBe("none");
    expect(toGsapEase("quad.out")).toBe("power1.out");
  });
  it("spring is analytic and settles", () => {
    const ts = springSettleTime(180, 18);
    expect(ts).toBeGreaterThan(0.1);
    expect(ts).toBeLessThan(3);
    expect(Math.abs(springValue(ts + 0.5, 180, 18) - 1)).toBeLessThan(0.001);
    // underdamped spring overshoots
    expect(
      Math.max(...Array.from({ length: 200 }, (_, i) => springValue(i / 100, 180, 8))),
    ).toBeGreaterThan(1.05);
    // overdamped does not
    expect(
      Math.max(...Array.from({ length: 200 }, (_, i) => springValue(i / 100, 100, 40))),
    ).toBeLessThanOrEqual(1);
  });
  it("rejects unknown eases", () => {
    expect(() => parseEase("wiggle.out")).toThrow(FlomotionError);
    expect(() => parseEase("bezier(1,2)")).toThrow(FlomotionError);
  });
  it("bezier(.25,.1,.25,1) approximates CSS ease", () => {
    expect(ease("bezier(.25,.1,.25,1)", 0.5)).toBeCloseTo(0.8024, 3);
  });
});

describe("noise", () => {
  it("is deterministic and bounded", () => {
    for (let i = 0; i < 500; i++) {
      const v = noise1D(i * 0.37, 3);
      expect(v).toBe(noise1D(i * 0.37, 3));
      expect(Math.abs(v)).toBeLessThanOrEqual(1);
    }
    expect(noise1D(1.5, 1)).not.toBe(noise1D(1.5, 2));
    expect(noise2D(0.3, 7.7, 1)).toBe(noise2D(0.3, 7.7, 1));
  });
  it("is continuous", () => {
    expect(Math.abs(noise1D(2.0001, 1) - noise1D(2, 1))).toBeLessThan(0.01);
  });
  it("prng repeats per seed", () => {
    const a = mulberry32(5);
    const b = mulberry32(5);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
});
