import { describe, expect, it } from "vitest";
import {
  EDIT_OPS,
  KEY_OPS,
  CodeCutError,
  applyPatches,
  cloneNode,
  edit,
  runEdit,
  runKeyOp,
  undoEdit,
  walk,
  type CCNode,
  type EditResult,
} from "../src/index.js";
import "../src/structure.js";

const el = (
  name: string,
  props: Record<string, unknown> = {},
  children: CCNode[] = [],
): CCNode => ({ $cc: 1, name, props, children });
const fresh = (): CCNode =>
  el("Composition", { id: "c", size: [1920, 1080], fps: 30, duration: "20s" }, [
    el("Track", { id: "v1" }, [
      el("Scene", { id: "a", start: "0s", duration: "4s" }),
      el("Scene", { id: "b", start: "4s", duration: "4s" }),
      el("Scene", { id: "c3", start: "8s", duration: "2s" }),
    ]),
    el("Track", { id: "v2" }, []),
    el("Track", { id: "locked", locked: true }, [
      el("Scene", { id: "lk", start: "0s", duration: "2s" }),
    ]),
    el("Marker", { id: "m1", at: "5s", label: "drop" }),
  ]);
const clipTrack = (): CCNode =>
  el("Composition", { id: "c", size: [1920, 1080], fps: 30, duration: "20s" }, [
    el("Track", { id: "v1" }, [
      el("Clip", { id: "x", src: "./a.mp4", start: "0s", duration: "4s", in: "10s" }),
      el("Clip", { id: "y", src: "./b.mp4", start: "4s", duration: "4s", in: "0s" }),
    ]),
  ]);

const find = (root: CCNode, id: string) => {
  let hit: CCNode | undefined;
  walk(root, (n) => {
    if (n.props.id === id) hit = n;
  });
  return hit;
};
const times = (root: CCNode, id: string) => {
  const n = find(root, id)!;
  return { start: n.props.start, duration: n.props.duration, in: n.props.in };
};
const strip = (n: CCNode): unknown => JSON.parse(JSON.stringify(n));
const roundTrip = (before: CCNode, r: EditResult) => {
  expect(r.description.length).toBeGreaterThan(5);
  expect(r.description).not.toContain("\n");
  expect(strip(undoEdit(r.project, r.undo))).toEqual(strip(before));
  // the input is never mutated
  expect(strip(before)).toEqual(strip(r.patches.length ? before : before));
};

describe("timeline edit operations (each returns { project, undo } and a one-line description)", () => {
  it("insert (ripple): splits the clip under the playhead and shifts the rest", () => {
    const root = fresh();
    const r = edit.insert(root, {
      track: "v1",
      node: el("Scene", { id: "n", duration: "1s" }),
      at: "2s",
    });
    expect(times(r.project, "n")).toMatchObject({ start: "2s", duration: "1s" });
    expect(times(r.project, "a").duration).toBe("2s");
    const half = find(r.project, "a_b")!;
    expect(half.props.start).toBe("3s");
    expect(half.props.duration).toBe("2s");
    expect(times(r.project, "b").start).toBe("5s");
    expect(times(r.project, "c3").start).toBe("9s");
    roundTrip(root, r);
  });
  it("insert without ripple rejects overlaps unless overlap is set", () => {
    const root = fresh();
    expect(() =>
      edit.insert(root, {
        track: "v1",
        node: el("Scene", { id: "n", duration: "1s" }),
        at: "1s",
        ripple: false,
      }),
    ).toThrow(/overlaps/);
    const ok = edit.insert(root, {
      track: "v1",
      node: el("Scene", { id: "n", duration: "1s" }),
      at: "1s",
      ripple: false,
      overlap: true,
    });
    roundTrip(root, ok);
    try {
      edit.insert(root, {
        track: "v1",
        node: el("Scene", { id: "n", duration: "1s" }),
        at: "1s",
        ripple: false,
      });
    } catch (e) {
      expect((e as CodeCutError).code).toBe("overlap_rejected");
    }
  });
  it("overwrite trims, splits and removes what it covers", () => {
    const root = fresh();
    const r = edit.overwrite(root, {
      track: "v1",
      node: el("Scene", { id: "n", duration: "3s" }),
      at: "3s",
    });
    expect(times(r.project, "a").duration).toBe("3s");
    expect(find(r.project, "b")).toBeTruthy();
    expect(times(r.project, "b")).toMatchObject({ start: "6s", duration: "2s" });
    roundTrip(root, r);
  });
  it("replace keeps timing", () => {
    const root = fresh();
    const r = edit.replace(root, { id: "b", node: el("Group", { id: "g" }) });
    expect(find(r.project, "b")).toBeUndefined();
    expect(times(r.project, "g")).toMatchObject({ start: "4s", duration: "4s" });
    roundTrip(root, r);
  });
  it("lift leaves a gap; rippleDelete and extract close it", () => {
    const root = fresh();
    const l = edit.lift(root, { id: "b" });
    expect(times(l.project, "c3").start).toBe("8s");
    roundTrip(root, l);
    const rd = edit.rippleDelete(root, { id: "b" });
    expect(times(rd.project, "c3").start).toBe("4s");
    roundTrip(root, rd);
    const ex = edit.extract(root, { track: "v1", from: "2s", to: "6s" });
    expect(times(ex.project, "a").duration).toBe("2s");
    expect(times(ex.project, "b")).toMatchObject({ start: "2s", duration: "2s" });
    expect(times(ex.project, "c3").start).toBe("4s");
    roundTrip(root, ex);
  });
  it("split advances the media in point", () => {
    const root = clipTrack();
    const r = edit.split(root, { id: "x", at: "1s" });
    const second = find(r.project, r.data!.id as string)!;
    expect(second.props).toMatchObject({ start: "1s", duration: "3s", in: "11s" });
    expect(times(r.project, "x").duration).toBe("1s");
    expect(() => edit.split(root, { id: "x", at: "9s" })).toThrow(/outside/);
    roundTrip(root, r);
  });
  it("trim moves head (advancing in) and tail; rejects overlap", () => {
    const root = clipTrack();
    const r = edit.trim(root, { id: "y", start: "5s" });
    expect(times(r.project, "y")).toMatchObject({ start: "5s", duration: "3s", in: "1s" });
    roundTrip(root, r);
    expect(() => edit.trim(root, { id: "y", start: "3s" })).toThrow(/overlaps/);
    roundTrip(root, edit.trim(root, { id: "x", end: "3s" }));
  });
  it("roll moves a cut between adjacent clips", () => {
    const root = clipTrack();
    const r = edit.roll(root, { a: "x", b: "y", delta: "1s" });
    expect(times(r.project, "x").duration).toBe("5s");
    expect(times(r.project, "y")).toMatchObject({ start: "5s", duration: "3s", in: "1s" });
    roundTrip(root, r);
  });
  it("slip changes in without moving", () => {
    const root = clipTrack();
    const r = edit.slip(root, { id: "x", delta: "2s" });
    expect(times(r.project, "x")).toMatchObject({ start: "0s", duration: "4s", in: "12s" });
    roundTrip(root, r);
  });
  it("slide moves a clip and neighbours absorb", () => {
    const root = fresh();
    const r = edit.slide(root, { id: "b", delta: "1s" });
    expect(times(r.project, "a").duration).toBe("5s");
    expect(times(r.project, "b").start).toBe("5s");
    expect(times(r.project, "c3")).toMatchObject({ start: "9s", duration: "1s" });
    roundTrip(root, r);
  });
  it("move changes time and track", () => {
    const root = fresh();
    const r = edit.move(root, { id: "c3", to: "1s", track: "v2" });
    expect(find(r.project, "c3")!.props.start).toBe("1s");
    expect(r.project.children.find((c) => (c as CCNode).props.id === "v2")).toBeTruthy();
    roundTrip(root, r);
    expect(() => edit.move(root, { id: "c3", to: "1s" })).toThrow(/overlaps/);
  });
  it("link/unlink, group/ungroup/nest", () => {
    const root = fresh();
    const l = edit.link(root, { ids: ["a", "b"], group: "L1" });
    expect(find(l.project, "a")!.props.link).toBe("L1");
    roundTrip(root, l);
    roundTrip(l.project, edit.unlink(l.project, { ids: ["a", "b"] }));
    const g = edit.EDIT_OPS.group(root, { ids: ["a", "b"], id: "grp" });
    const grp = find(g.project, "grp")!;
    expect(grp.props).toMatchObject({ start: "0s", duration: "8s" });
    expect(find(g.project, "b")!.props.start).toBe("4s");
    roundTrip(root, g);
    const u = edit.ungroup(g.project, { id: "grp" });
    expect(find(u.project, "b")!.props.start).toBe("4s");
    roundTrip(g.project, u);
    const n = edit.nest(root, { ids: ["b", "c3"], id: "pc" });
    expect(find(n.project, "pc")!.name).toBe("Precomp");
    roundTrip(root, n);
  });
  it("setSpeed keeps the source range", () => {
    const root = clipTrack();
    const r = edit.setSpeed(root, { id: "x", speed: 2 });
    expect(times(r.project, "x").duration).toBe("2s");
    expect(find(r.project, "x")!.props.speed).toBe(2);
    roundTrip(root, r);
  });
  it("snap to markers, clips and grid", () => {
    const root = fresh();
    const m = edit.snapOp(root, { id: "b", to: "markers", threshold: 2 });
    expect(find(m.project, "b")!.props.start).toBe("5s");
    roundTrip(root, m);
    const off = cloneNode(root);
    find(off, "b")!.props.start = "4.51s";
    const g = edit.snapOp(off, { id: "b", to: "grid" });
    expect(parseFloat(String(find(g.project, "b")!.props.start))).toBeCloseTo(4.5, 2);
  });
  it("track flags and markers", () => {
    const root = fresh();
    roundTrip(root, edit.lockTrack(root, { track: "v2" }));
    expect(find(edit.lockTrack(root, { track: "v2" }).project, "v2")!.props.locked).toBe(true);
    roundTrip(root, edit.muteTrack(root, { track: "v1", value: true }));
    roundTrip(root, edit.soloTrack(root, { track: "v1" }));
    const am = edit.addMarker(root, { at: "7s", label: "beat" });
    expect(find(am.project, am.data!.id as string)!.props.label).toBe("beat");
    roundTrip(root, am);
    const rm = edit.removeMarker(root, { id: "m1" });
    expect(find(rm.project, "m1")).toBeUndefined();
    roundTrip(root, rm);
  });
  it("locked tracks reject writes with a typed error and a fix", () => {
    const root = fresh();
    for (const fn of [
      () => edit.lift(root, { id: "lk" }),
      () => edit.trim(root, { id: "lk", end: "1s" }),
      () =>
        edit.insert(root, {
          track: "locked",
          node: el("Scene", { id: "n", duration: "1s" }),
          at: "5s",
        }),
      () => edit.split(root, { id: "lk", at: "1s" }),
    ]) {
      try {
        fn();
        throw new Error("should have thrown");
      } catch (e) {
        expect((e as CodeCutError).code).toBe("track_locked");
        expect((e as CodeCutError).fix).toMatch(/lockTrack/);
      }
    }
    // unlock works, then writes pass
    const unlocked = edit.lockTrack(root, { track: "locked", value: false }).project;
    expect(() => edit.lift(unlocked, { id: "lk" })).not.toThrow();
  });
  it("snaps all times to the frame grid", () => {
    const root = fresh();
    const r = edit.split(root, { id: "a", at: 1.02 });
    expect(find(r.project, "a")!.props.duration).toBe("1.033333s");
  });
  it("every op is reachable by name and unknown ops are rejected", () => {
    expect(Object.keys(EDIT_OPS).sort()).toEqual(
      [
        "insert",
        "overwrite",
        "replace",
        "lift",
        "extract",
        "split",
        "trim",
        "roll",
        "slip",
        "slide",
        "move",
        "link",
        "unlink",
        "group",
        "ungroup",
        "nest",
        "setSpeed",
        "rippleDelete",
        "snap",
        "lockTrack",
        "muteTrack",
        "soloTrack",
        "addMarker",
        "removeMarker",
      ].sort(),
    );
    expect(() => runEdit(fresh(), "nope", {})).toThrow(/Unknown edit op/);
    expect(runEdit(fresh(), "lockTrack", { track: "v1" }).project).toBeTruthy();
  });
});

describe("keyframe operations", () => {
  const base = () =>
    el("Composition", { id: "c", size: [1080, 1920], fps: 30, duration: "10s" }, [
      el("Track", { id: "t" }, [
        el("Rect", {
          id: "r",
          opacity: [
            [0, 0],
            [1, 1],
            [2, 0.5],
          ],
          position: [
            [0, [0, 0]],
            [1, [100, 0]],
            [2, [100, 100]],
          ],
        }),
      ]),
    ]);
  const keysOf = (root: CCNode, prop: string) => find(root, "r")!.props[prop] as any;
  it("add / set / move / delete", () => {
    const root = base();
    const a = KEY_OPS.keyAdd(root, { id: "r", prop: "opacity", t: 3, value: 1, ease: "expo.out" });
    expect(keysOf(a.project, "opacity")).toEqual([
      [0, 0],
      [1, 1],
      [2, 0.5],
      [3, 1, "expo.out"],
    ]);
    roundTrip(root, a);
    expect(() => KEY_OPS.keyAdd(root, { id: "r", prop: "opacity", t: 1, value: 0.3 })).toThrow(
      /already has a key/,
    );
    const s = KEY_OPS.keySet(root, { id: "r", prop: "opacity", t: 1, value: 0.9 });
    expect(keysOf(s.project, "opacity")[1]).toEqual([1, 0.9]);
    roundTrip(root, s);
    const m = KEY_OPS.keyMove(root, { id: "r", prop: "opacity", from: 2, to: 4 });
    expect(keysOf(m.project, "opacity").map((k: any) => k[0])).toEqual([0, 1, 4]);
    expect(() => KEY_OPS.keyMove(root, { id: "r", prop: "opacity", from: 2, to: 1 })).toThrow(
      CodeCutError,
    );
    roundTrip(root, m);
    const d = KEY_OPS.keyDelete(root, { id: "r", prop: "opacity", t: 1 });
    expect(keysOf(d.project, "opacity")).toHaveLength(2);
    roundTrip(root, d);
  });
  it("static value becomes the first key when keying later", () => {
    const root = el("Composition", { id: "c", size: [10, 10], fps: 30, duration: "5s" }, [
      el("Rect", { id: "r", opacity: 0.4 }),
    ]);
    const a = KEY_OPS.keyAdd(root, { id: "r", prop: "opacity", t: 2, value: 1 });
    expect(keysOf(a.project, "opacity")).toEqual([
      [0, 0.4],
      [2, 1],
    ]);
    roundTrip(root, a);
  });
  it("copy / paste", () => {
    const root = base();
    const c = KEY_OPS.keyCopy(root, { id: "r", prop: "opacity", times: [1, 2] });
    const keys = c.data!.keys as any[];
    expect(keys).toHaveLength(2);
    const p = KEY_OPS.keyPaste(root, { id: "r", prop: "opacity", keys, at: 5 });
    expect(keysOf(p.project, "opacity").map((k: any) => k[0])).toEqual([0, 1, 2, 5, 6]);
    roundTrip(root, p);
  });
  it("scale / ease / mode / reverse / loop", () => {
    const root = base();
    const sc = KEY_OPS.keyScale(root, { id: "r", prop: "opacity", factor: 2 });
    expect(keysOf(sc.project, "opacity").map((k: any) => k[0])).toEqual([0, 2, 4]);
    roundTrip(root, sc);
    const e = KEY_OPS.keyEase(root, { id: "r", prop: "opacity", t: 1, ease: "back.out(1.7)" });
    expect(keysOf(e.project, "opacity")[1]).toEqual([1, 1, "back.out(1.7)"]);
    expect(() => KEY_OPS.keyEase(root, { id: "r", prop: "opacity", t: 1, ease: "wiggle" })).toThrow(
      CodeCutError,
    );
    roundTrip(root, e);
    const md = KEY_OPS.keyMode(root, { id: "r", prop: "opacity", mode: "auto" });
    expect(keysOf(md.project, "opacity").mode).toBe("auto");
    roundTrip(root, md);
    const rv = KEY_OPS.keyReverse(root, { id: "r", prop: "opacity" });
    expect(keysOf(rv.project, "opacity").map((k: any) => k[1])).toEqual([0.5, 1, 0]);
    roundTrip(root, rv);
    const lp = KEY_OPS.keyLoop(root, { id: "r", prop: "opacity", loop: "pingpong" });
    expect(keysOf(lp.project, "opacity").loop).toBe("pingpong");
    roundTrip(root, lp);
  });
  it("rove / bake / simplify / separate / combine", () => {
    const root = el("Composition", { id: "c", size: [10, 10], fps: 30, duration: "5s" }, [
      el("Rect", {
        id: "r",
        position: [
          [0, [0, 0]],
          [1, [10, 0]],
          [4, [100, 0]],
        ],
      }),
    ]);
    const rv = KEY_OPS.keyRove(root, { id: "r", prop: "position" });
    expect(keysOf(rv.project, "position")[1][0]).toBeCloseTo(0.4, 1);
    roundTrip(root, rv);
    const bake = KEY_OPS.keyBake(root, { id: "r", prop: "position", from: 0, to: 1 });
    const baked = keysOf(bake.project, "position").keys as any[];
    expect(baked.length).toBeGreaterThan(30);
    roundTrip(root, bake);
    const simp = KEY_OPS.keySimplify(bake.project, { id: "r", prop: "position", tolerance: 0.5 });
    expect(keysOf(simp.project, "position").keys.length).toBeLessThan(baked.length);
    roundTrip(bake.project, simp);
    const sep = KEY_OPS.keySeparate(root, { id: "r", prop: "position" });
    expect(Object.keys(keysOf(sep.project, "position"))).toEqual(["x", "y", "z"].slice(0, 2));
    roundTrip(root, sep);
    const comb = KEY_OPS.keyCombine(sep.project, { id: "r", prop: "position" });
    expect(keysOf(comb.project, "position").map((k: any) => k[0])).toEqual([0, 1, 4]);
    roundTrip(sep.project, comb);
  });
  it("refuses expressions and non-literal times with typed errors", () => {
    const root = el("Composition", { id: "c", size: [10, 10], fps: 30, duration: "5s" }, [
      el("Rect", {
        id: "r",
        opacity: (t: number) => t,
        x: [
          ["#a.end", 0],
          [2, 1],
        ],
      }),
    ]);
    expect(() => KEY_OPS.keyAdd(root, { id: "r", prop: "opacity", t: 1, value: 1 })).toThrow(
      /expression/,
    );
    expect(() => KEY_OPS.keyAdd(root, { id: "r", prop: "x", t: 3, value: 1 })).toThrow(
      /literal times/,
    );
    expect(() => runKeyOp(root, "keyNope", {})).toThrow(/Unknown keyframe op/);
    expect(applyPatches(root, []).project).toBeTruthy();
  });
});
