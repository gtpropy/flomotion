import { FlomotionError } from "../errors.js";
import { generateId } from "../ast/ids.js";
import { cloneNode, isNode, walk, type CCNode } from "../ast/node.js";
import { parseTimeLiteral, snapToFrame, type Time } from "../values/time.js";
import { elementOrThrow, makeResult, uniqueId, type EditResult, type Patch } from "./patch.js";

export interface ItemTiming {
  node: CCNode;
  id: string;
  start: number;
  duration: number;
  end: number;
}

const fpsOf = (root: CCNode) => (typeof root.props.fps === "number" ? root.props.fps : 30);
const fmt = (t: number) => `${Math.round(t * 1e6) / 1e6}s`;
const snap = (root: CCNode, t: number) => snapToFrame(t, fpsOf(root));

function lit(root: CCNode, v: unknown, what: string, id: string): number {
  if (v === undefined)
    throw new FlomotionError("invalid_edit", `#${id} has no explicit ${what}`, {
      fix: `Give #${id} a literal ${what} (e.g. ${what}="2s") before editing its timing.`,
    });
  try {
    if (typeof v === "string" && /^[@#]/.test(v)) throw new Error("reference");
    return parseTimeLiteral(v as Time, fpsOf(root));
  } catch {
    throw new FlomotionError(
      "opaque_expression",
      `#${id}.${what} is ${JSON.stringify(v)}, which is not a literal time`,
      { fix: "Replace the reference/expression with a literal time first." },
    );
  }
}

/** Timing of a track item read from its literal props. */
export function timingOf(root: CCNode, node: CCNode): ItemTiming {
  const id = String(node.props.id);
  const start = node.props.start === undefined ? 0 : lit(root, node.props.start, "start", id);
  let duration: number;
  if (node.props.duration !== undefined) duration = lit(root, node.props.duration, "duration", id);
  else if (node.props.end !== undefined) duration = lit(root, node.props.end, "end", id) - start;
  else
    throw new FlomotionError("invalid_edit", `#${id} has no explicit duration`, {
      fix: `Give #${id} a duration (e.g. duration="2s") before editing its timing.`,
    });
  return { node, id, start, duration, end: start + duration };
}

const isTimed = (n: CCNode) =>
  n.props.start !== undefined || n.props.duration !== undefined || n.props.end !== undefined;

/** Items of a container in start order (non-effect, timed or untimed layers are all items). */
export function itemsOf(root: CCNode, container: CCNode): ItemTiming[] {
  return container.children
    .filter(
      (c): c is CCNode =>
        isNode(c) &&
        !["Marker", "Fonts", "Keyframes", "Theme", "Look"].includes(c.name) &&
        (isTimed(c) || true),
    )
    .filter((c) => isTimed(c))
    .map((c) => timingOf(root, c))
    .sort((a, b) => a.start - b.start);
}

export function trackOf(root: CCNode, id: string): CCNode {
  const { node } = elementOrThrow(root, id);
  if (
    node.name !== "Track" &&
    node.name !== "Scene" &&
    node.name !== "Composition" &&
    node.name !== "Group"
  ) {
    throw new FlomotionError("invalid_edit", `#${id} is a ${node.name}, not a Track`, {
      fix: "Pass the id of a Track.",
    });
  }
  return node;
}

function assertWritable(track: CCNode): void {
  if (track.name === "Track" && track.props.locked === true) {
    throw new FlomotionError("track_locked", `Track #${track.props.id} is locked`, {
      fix: `Unlock it first with edit lockTrack {track:"${track.props.id}", value:false}.`,
    });
  }
}

function parentTrackOf(root: CCNode, id: string): CCNode {
  const { parent } = elementOrThrow(root, id);
  if (!parent) throw new FlomotionError("invalid_edit", "The root has no track");
  return parent;
}

function overlapCheck(
  items: ItemTiming[],
  ignore: string[],
  start: number,
  end: number,
  allow?: boolean,
): void {
  if (allow) return;
  for (const o of items) {
    if (ignore.includes(o.id)) continue;
    if (start < o.end - 1e-9 && end > o.start + 1e-9) {
      throw new FlomotionError(
        "overlap_rejected",
        `[${fmt(start)}, ${fmt(end)}) overlaps #${o.id} [${fmt(o.start)}, ${fmt(o.end)})`,
        { fix: "Move it, trim the neighbour, or pass overlap:true." },
      );
    }
  }
}

const setTime = (id: string, prop: "start" | "duration", t: number): Patch => ({
  op: "setProp",
  id,
  prop,
  value: fmt(t),
});
const setProp = (id: string, prop: string, value: unknown): Patch => ({
  op: "setProp",
  id,
  prop,
  value,
});
const dropProp = (id: string, prop: string): Patch => ({
  op: "setProp",
  id,
  prop,
  value: undefined,
});

const mediaIn = (n: CCNode, fps: number) =>
  n.props.in === undefined ? 0 : parseTimeLiteral(n.props.in as Time, fps);
const speedOf = (n: CCNode) =>
  typeof n.props.speed === "number" && n.props.speed > 0 ? n.props.speed : 1;

// ---------- the operations ----------

/** Insert a clip at a time; with ripple (default) later clips shift right and a clip under `at` is split. */
export function insert(
  root: CCNode,
  a: {
    track: string;
    node: CCNode;
    at: number | string;
    ripple?: boolean;
    overlap?: boolean;
    index?: number;
  },
): EditResult {
  const track = trackOf(root, a.track);
  assertWritable(track);
  const at = snap(root, lit(root, a.at, "at", a.track));
  const dur = lit(root, a.node.props.duration, "duration", String(a.node.props.id));
  const patches: Patch[] = [];
  const items = itemsOf(root, track);
  let insertIndex = a.index;
  if (a.ripple !== false) {
    for (const it of items) {
      if (it.start < at && it.end > at) {
        const sp = splitPatches(root, it, at, at + dur);
        patches.push(...sp.patches);
        insertIndex ??= track.children.indexOf(it.node) + 2;
      }
    }
    for (const it of items)
      if (it.start >= at) patches.push(setTime(it.id, "start", it.start + dur));
    for (const it of items) if (it.start < at && it.end > at) void it;
  } else overlapCheck(items, [], at, at + dur, a.overlap);
  const node = cloneNode(a.node);
  node.props = { ...node.props, start: fmt(at), duration: fmt(dur) };
  if (typeof node.props.id !== "string")
    node.props.id = generateId(`${a.track}/${node.name}/${at}`);
  patches.push({
    op: "insert",
    parent: String(track.props.id),
    index: insertIndex ?? track.children.length,
    node,
  });
  return makeResult(
    root,
    patches,
    `insert ${node.name} #${node.props.id} at ${fmt(at)} on #${track.props.id}${a.ripple === false ? "" : " (ripple)"}`,
    { id: node.props.id },
  );
}

/** Place a clip over a range, trimming, splitting or removing what it covers. */
export function overwrite(
  root: CCNode,
  a: { track: string; node: CCNode; at: number | string },
): EditResult {
  const track = trackOf(root, a.track);
  assertWritable(track);
  const at = snap(root, lit(root, a.at, "at", a.track));
  const dur = lit(root, a.node.props.duration, "duration", String(a.node.props.id));
  const end = at + dur;
  const patches: Patch[] = [];
  const fps = fpsOf(root);
  for (const it of itemsOf(root, track)) {
    if (it.end <= at || it.start >= end) continue;
    if (it.start >= at && it.end <= end) patches.push({ op: "remove", id: it.id });
    else if (it.start < at && it.end > end) {
      const sp = splitPatches(root, it, end);
      patches.push(...sp.patches, setTime(it.id, "duration", at - it.start));
    } else if (it.start < at) patches.push(setTime(it.id, "duration", at - it.start));
    else {
      const cut = end - it.start;
      patches.push(setTime(it.id, "start", end), setTime(it.id, "duration", it.duration - cut));
      if (it.node.props.in !== undefined || it.node.props.src !== undefined)
        patches.push(setProp(it.id, "in", fmt(mediaIn(it.node, fps) + cut * speedOf(it.node))));
    }
  }
  const node = cloneNode(a.node);
  node.props = { ...node.props, start: fmt(at), duration: fmt(dur) };
  if (typeof node.props.id !== "string")
    node.props.id = generateId(`${a.track}/${node.name}/${at}`);
  patches.push({
    op: "insert",
    parent: String(track.props.id),
    index: track.children.length,
    node,
  });
  return makeResult(
    root,
    patches,
    `overwrite [${fmt(at)}, ${fmt(end)}) on #${track.props.id} with ${node.name} #${node.props.id}`,
    { id: node.props.id },
  );
}

/** Swap an element for another, keeping the original's start, duration and place in the track. */
export function replace(root: CCNode, a: { id: string; node: CCNode }): EditResult {
  const { node: old, parent, index } = elementOrThrow(root, a.id);
  if (!parent) throw new FlomotionError("invalid_edit", "Cannot replace the root");
  assertWritable(parent);
  const node = cloneNode(a.node);
  const keep: Record<string, unknown> = {};
  for (const k of ["start", "duration", "end"])
    if (old.props[k] !== undefined) keep[k] = old.props[k];
  node.props = { ...node.props, ...keep };
  if (typeof node.props.id !== "string") node.props.id = old.props.id;
  return makeResult(
    root,
    [
      { op: "remove", id: a.id },
      { op: "insert", parent: String(parent.props.id), index, node },
    ],
    `replace #${a.id} with ${node.name} #${node.props.id}`,
    { id: node.props.id },
  );
}

/** Remove a clip and leave a gap. */
export function lift(root: CCNode, a: { id: string }): EditResult {
  const parent = parentTrackOf(root, a.id);
  assertWritable(parent);
  return makeResult(root, [{ op: "remove", id: a.id }], `lift #${a.id} (gap left)`);
}

/** Remove a clip and close the gap: later clips on the track move left by its duration. */
export function rippleDelete(root: CCNode, a: { id: string }): EditResult {
  const parent = parentTrackOf(root, a.id);
  assertWritable(parent);
  const items = itemsOf(root, parent);
  const me = items.find((i) => i.id === a.id) ?? timingOf(root, elementOrThrow(root, a.id).node);
  const patches: Patch[] = [{ op: "remove", id: a.id }];
  for (const it of items)
    if (it.id !== a.id && it.start >= me.end - 1e-9)
      patches.push(setTime(it.id, "start", it.start - me.duration));
  return makeResult(root, patches, `ripple delete #${a.id} (${fmt(me.duration)} closed)`);
}

/** Remove a time range from a track and close the gap. */
export function extract(
  root: CCNode,
  a: { track: string; from: number | string; to: number | string },
): EditResult {
  const track = trackOf(root, a.track);
  assertWritable(track);
  const from = snap(root, lit(root, a.from, "from", a.track));
  const to = snap(root, lit(root, a.to, "to", a.track));
  if (to <= from) throw new FlomotionError("invalid_edit", "extract needs to > from");
  const span = to - from;
  const fps = fpsOf(root);
  const patches: Patch[] = [];
  for (const it of itemsOf(root, track)) {
    if (it.end <= from) continue;
    if (it.start >= to) patches.push(setTime(it.id, "start", it.start - span));
    else if (it.start >= from && it.end <= to) patches.push({ op: "remove", id: it.id });
    else if (it.start < from && it.end > to)
      patches.push(setTime(it.id, "duration", it.duration - span));
    else if (it.start < from) patches.push(setTime(it.id, "duration", from - it.start));
    else {
      const cut = to - it.start;
      patches.push(setTime(it.id, "start", from), setTime(it.id, "duration", it.duration - cut));
      if (it.node.props.src !== undefined)
        patches.push(setProp(it.id, "in", fmt(mediaIn(it.node, fps) + cut * speedOf(it.node))));
    }
  }
  return makeResult(root, patches, `extract [${fmt(from)}, ${fmt(to)}) from #${a.track}`);
}

function splitPatches(
  root: CCNode,
  it: ItemTiming,
  at: number,
  secondStart = at,
): { patches: Patch[]; newId: string } {
  const parent = parentTrackOf(root, it.id);
  const fps = fpsOf(root);
  const newId = uniqueId(root, `${it.id}_b`);
  const second = cloneNode(it.node);
  second.props = {
    ...second.props,
    id: newId,
    start: fmt(secondStart),
    duration: fmt(it.end - at),
  };
  delete second.props.end;
  if (it.node.props.src !== undefined || it.node.props.in !== undefined)
    second.props.in = fmt(mediaIn(it.node, fps) + (at - it.start) * speedOf(it.node));
  const idx = parent.children.indexOf(it.node);
  const patches: Patch[] = [setTime(it.id, "duration", at - it.start)];
  if (it.node.props.end !== undefined) patches.push(dropProp(it.id, "end"));
  patches.push({ op: "insert", parent: String(parent.props.id), index: idx + 1, node: second });
  return { patches, newId };
}

/** Cut a clip in two at a time. */
export function split(root: CCNode, a: { id: string; at: number | string }): EditResult {
  const parent = parentTrackOf(root, a.id);
  assertWritable(parent);
  const it = timingOf(root, elementOrThrow(root, a.id).node);
  const at = snap(root, lit(root, a.at, "at", a.id));
  if (at <= it.start + 1e-9 || at >= it.end - 1e-9)
    throw new FlomotionError(
      "invalid_edit",
      `split time ${fmt(at)} is outside #${a.id} (${fmt(it.start)} to ${fmt(it.end)})`,
    );
  const sp = splitPatches(root, it, at);
  return makeResult(root, sp.patches, `split #${a.id} at ${fmt(at)} → #${sp.newId}`, {
    id: sp.newId,
  });
}

/** Move the head and/or tail of a clip. Head trims advance the media `in` point. */
export function trim(
  root: CCNode,
  a: { id: string; start?: number | string; end?: number | string; overlap?: boolean },
): EditResult {
  const parent = parentTrackOf(root, a.id);
  assertWritable(parent);
  const it = timingOf(root, elementOrThrow(root, a.id).node);
  const fps = fpsOf(root);
  const start = a.start === undefined ? it.start : snap(root, lit(root, a.start, "start", a.id));
  const end = a.end === undefined ? it.end : snap(root, lit(root, a.end, "end", a.id));
  if (end <= start) throw new FlomotionError("invalid_edit", "trim would make the clip empty");
  overlapCheck(itemsOf(root, parent), [a.id], start, end, a.overlap);
  const patches: Patch[] = [setTime(a.id, "start", start), setTime(a.id, "duration", end - start)];
  if (it.node.props.end !== undefined) patches.push(dropProp(a.id, "end"));
  if (start !== it.start && (it.node.props.src !== undefined || it.node.props.in !== undefined))
    patches.push(
      setProp(
        a.id,
        "in",
        fmt(Math.max(0, mediaIn(it.node, fps) + (start - it.start) * speedOf(it.node))),
      ),
    );
  return makeResult(root, patches, `trim #${a.id} to [${fmt(start)}, ${fmt(end)})`);
}

/** Move the cut between two adjacent clips (a then b) by `delta` seconds. */
export function roll(
  root: CCNode,
  a: { a: string; b: string; delta: number | string },
): EditResult {
  const pa = parentTrackOf(root, a.a);
  assertWritable(pa);
  const A = timingOf(root, elementOrThrow(root, a.a).node);
  const B = timingOf(root, elementOrThrow(root, a.b).node);
  if (Math.abs(A.end - B.start) > 1e-6)
    throw new FlomotionError("invalid_edit", `#${a.a} and #${a.b} are not adjacent`, {
      fix: "Roll needs clips that touch.",
    });
  const d = snap(root, lit(root, a.delta, "delta", a.a));
  if (A.duration + d <= 0 || B.duration - d <= 0)
    throw new FlomotionError("invalid_edit", "roll would collapse a clip");
  const fps = fpsOf(root);
  const patches: Patch[] = [
    setTime(a.a, "duration", A.duration + d),
    setTime(a.b, "start", B.start + d),
    setTime(a.b, "duration", B.duration - d),
  ];
  if (B.node.props.src !== undefined)
    patches.push(setProp(a.b, "in", fmt(Math.max(0, mediaIn(B.node, fps) + d * speedOf(B.node)))));
  return makeResult(root, patches, `roll cut between #${a.a} and #${a.b} by ${fmt(d)}`);
}

/** Change which part of the source a clip shows without moving it. */
export function slip(root: CCNode, a: { id: string; delta: number | string }): EditResult {
  assertWritable(parentTrackOf(root, a.id));
  const n = elementOrThrow(root, a.id).node;
  const d = snap(root, lit(root, a.delta, "delta", a.id));
  const fps = fpsOf(root);
  const next = Math.max(0, mediaIn(n, fps) + d);
  const patches: Patch[] = [setProp(a.id, "in", fmt(next))];
  if (n.props.out !== undefined)
    patches.push(
      setProp(a.id, "out", fmt(Math.max(0, parseTimeLiteral(n.props.out as Time, fps) + d))),
    );
  return makeResult(root, patches, `slip #${a.id} by ${fmt(d)}`);
}

/** Move a clip while its neighbours absorb the change (previous grows/shrinks, next shrinks/grows). */
export function slide(root: CCNode, a: { id: string; delta: number | string }): EditResult {
  const parent = parentTrackOf(root, a.id);
  assertWritable(parent);
  const items = itemsOf(root, parent);
  const i = items.findIndex((x) => x.id === a.id);
  if (i < 0)
    throw new FlomotionError("unknown_element", `#${a.id} is not a timed item of its track`);
  const it = items[i]!;
  const d = snap(root, lit(root, a.delta, "delta", a.id));
  const prev = items[i - 1];
  const next = items[i + 1];
  const fps = fpsOf(root);
  const patches: Patch[] = [setTime(a.id, "start", it.start + d)];
  if (prev && Math.abs(prev.end - it.start) < 1e-6) {
    if (prev.duration + d <= 0)
      throw new FlomotionError("invalid_edit", "slide would collapse the previous clip");
    patches.push(setTime(prev.id, "duration", prev.duration + d));
  }
  if (next && Math.abs(it.end - next.start) < 1e-6) {
    if (next.duration - d <= 0)
      throw new FlomotionError("invalid_edit", "slide would collapse the next clip");
    patches.push(
      setTime(next.id, "start", next.start + d),
      setTime(next.id, "duration", next.duration - d),
    );
    if (next.node.props.src !== undefined)
      patches.push(
        setProp(next.id, "in", fmt(Math.max(0, mediaIn(next.node, fps) + d * speedOf(next.node)))),
      );
  }
  return makeResult(root, patches, `slide #${a.id} by ${fmt(d)}`);
}

/** Move a clip in time and optionally to another track. */
export function move(
  root: CCNode,
  a: { id: string; to: number | string; track?: string; overlap?: boolean },
): EditResult {
  const { node, parent, index } = elementOrThrow(root, a.id);
  if (!parent) throw new FlomotionError("invalid_edit", "Cannot move the root");
  assertWritable(parent);
  const it = timingOf(root, node);
  const to = snap(root, lit(root, a.to, "to", a.id));
  const dest = a.track ? trackOf(root, a.track) : parent;
  assertWritable(dest);
  overlapCheck(itemsOf(root, dest), [a.id], to, to + it.duration, a.overlap);
  if (dest === parent)
    return makeResult(root, [setTime(a.id, "start", to)], `move #${a.id} to ${fmt(to)}`);
  const moved = cloneNode(node);
  moved.props = { ...moved.props, start: fmt(to) };
  void index;
  return makeResult(
    root,
    [
      { op: "remove", id: a.id },
      { op: "insert", parent: String(dest.props.id), index: dest.children.length, node: moved },
    ],
    `move #${a.id} to ${fmt(to)} on #${dest.props.id}`,
  );
}

/** Link clips so they move, trim and split together (shared `link` id). */
export function link(root: CCNode, a: { ids: string[]; group?: string }): EditResult {
  const g = a.group ?? generateId(`link/${a.ids.join(",")}`);
  const patches: Patch[] = [];
  for (const id of a.ids) {
    assertWritable(parentTrackOf(root, id));
    patches.push(setProp(id, "link", g));
  }
  return makeResult(root, patches, `link ${a.ids.map((i) => "#" + i).join(", ")} as ${g}`, {
    group: g,
  });
}

export function unlink(root: CCNode, a: { ids: string[] }): EditResult {
  const patches: Patch[] = [];
  for (const id of a.ids) {
    assertWritable(parentTrackOf(root, id));
    patches.push(dropProp(id, "link"));
  }
  return makeResult(root, patches, `unlink ${a.ids.map((i) => "#" + i).join(", ")}`);
}

function wrap(
  root: CCNode,
  ids: string[],
  name: "Group" | "Precomp",
  id: string | undefined,
): EditResult {
  if (!ids.length)
    throw new FlomotionError("invalid_edit", `${name.toLowerCase()} needs at least one id`);
  const els = ids.map((i) => elementOrThrow(root, i));
  const parent = els[0]!.parent!;
  if (els.some((e) => e.parent !== parent))
    throw new FlomotionError("invalid_edit", "All elements must share one parent");
  assertWritable(parent);
  const times = els.map((e) => timingOf(root, e.node));
  const start = Math.min(...times.map((t) => t.start));
  const end = Math.max(...times.map((t) => t.end));
  const gid = id ?? uniqueId(root, name === "Group" ? "group" : "precomp");
  const idx = Math.min(...els.map((e) => e.index));
  const kids = els.map((e, k) => {
    const c = cloneNode(e.node);
    c.props.start = fmt(times[k]!.start - start);
    delete c.props.end;
    c.props.duration = fmt(times[k]!.duration);
    return c;
  });
  const g: CCNode = {
    $cc: 1,
    name,
    props: { id: gid, start: fmt(start), duration: fmt(end - start) },
    children: kids,
  };
  const patches: Patch[] = ids.map((i) => ({ op: "remove", id: i }) as Patch);
  patches.push({ op: "insert", parent: String(parent.props.id), index: idx, node: g });
  return makeResult(
    root,
    patches,
    `${name === "Group" ? "group" : "nest"} ${ids.map((i) => "#" + i).join(", ")} into #${gid}`,
    { id: gid },
  );
}

export const groupItems = (root: CCNode, a: { ids: string[]; id?: string }) =>
  wrap(root, a.ids, "Group", a.id);
/** Nest into a Precomp (a typed stub: it edits the tree but does not render yet). */
export const nest = (root: CCNode, a: { ids: string[]; id?: string }) =>
  wrap(root, a.ids, "Precomp", a.id);

/** Dissolve a Group: children return to the parent with their times shifted by the group's start. */
export function ungroup(root: CCNode, a: { id: string }): EditResult {
  const { node, parent, index } = elementOrThrow(root, a.id);
  if (!parent) throw new FlomotionError("invalid_edit", "Cannot ungroup the root");
  assertWritable(parent);
  if (node.name !== "Group" && node.name !== "Precomp")
    throw new FlomotionError("invalid_edit", `#${a.id} is a ${node.name}, not a Group`);
  const gs = timingOf(root, node).start;
  const patches: Patch[] = [{ op: "remove", id: a.id }];
  node.children.filter(isNode).forEach((c, k) => {
    const cc = cloneNode(c);
    if (cc.props.start !== undefined || cc.props.duration !== undefined)
      cc.props.start = fmt(
        gs +
          (cc.props.start === undefined
            ? 0
            : lit(root, cc.props.start, "start", String(cc.props.id))),
      );
    patches.push({ op: "insert", parent: String(parent.props.id), index: index + k, node: cc });
  });
  return makeResult(root, patches, `ungroup #${a.id}`);
}

/** Retime a clip. Keeps the source range, so the duration changes. */
export function setSpeed(root: CCNode, a: { id: string; speed: number }): EditResult {
  assertWritable(parentTrackOf(root, a.id));
  if (!(a.speed > 0)) throw new FlomotionError("invalid_edit", "speed must be > 0");
  const it = timingOf(root, elementOrThrow(root, a.id).node);
  const old = speedOf(it.node);
  const dur = snap(root, (it.duration * old) / a.speed);
  return makeResult(
    root,
    [setProp(a.id, "speed", a.speed), setTime(a.id, "duration", dur)],
    `set #${a.id} speed to ${a.speed}× (duration ${fmt(dur)})`,
  );
}

/** Snap a clip's start (or end) to a marker, another clip edge, or the frame grid. */
export function snapOp(
  root: CCNode,
  a: { id: string; to?: "markers" | "clips" | "grid"; threshold?: number; edge?: "start" | "end" },
): EditResult {
  const { node, parent } = elementOrThrow(root, a.id);
  if (!parent) throw new FlomotionError("invalid_edit", "Cannot snap the root");
  assertWritable(parent);
  const it = timingOf(root, node);
  const fps = fpsOf(root);
  const targets: number[] = [];
  const mode = a.to ?? "grid";
  if (mode === "markers")
    walk(root, (n) => {
      if (n.name === "Marker" && n.props.at !== undefined)
        targets.push(lit(root, n.props.at, "at", String(n.props.id)));
    });
  if (mode === "clips")
    for (const o of itemsOf(root, parent)) if (o.id !== a.id) targets.push(o.start, o.end);
  const edge = a.edge ?? "start";
  const cur = edge === "start" ? it.start : it.end;
  let best = snapToFrame(cur, fps);
  if (mode !== "grid" && targets.length) {
    const th = a.threshold ?? 0.25;
    const near = targets
      .map((t) => [t, Math.abs(t - cur)] as const)
      .sort((x, y) => x[1] - y[1])[0]!;
    if (near[1] <= th) best = snapToFrame(near[0], fps);
  }
  const start = edge === "start" ? best : best - it.duration;
  if (Math.abs(start - it.start) < 1e-9)
    return makeResult(root, [], `snap #${a.id}: already on target`);
  return makeResult(
    root,
    [setTime(a.id, "start", start)],
    `snap #${a.id} ${edge} to ${fmt(best)} (${mode})`,
  );
}

const trackFlag =
  (flag: "locked" | "muted" | "solo") =>
  (root: CCNode, a: { track: string; value?: boolean }): EditResult => {
    const t = trackOf(root, a.track);
    const v = a.value ?? true;
    return makeResult(
      root,
      [setProp(String(t.props.id), flag, v)],
      `${v ? "" : "un"}${flag === "locked" ? "lock" : flag === "muted" ? "mute" : "solo"} track #${t.props.id}`,
    );
  };
export const lockTrack = trackFlag("locked");
export const muteTrack = trackFlag("muted");
export const soloTrack = trackFlag("solo");

export function addMarker(
  root: CCNode,
  a: { at: number | string; label?: string; color?: string; id?: string; parent?: string },
): EditResult {
  const parent = a.parent ? elementOrThrow(root, a.parent).node : root;
  const at = snap(root, lit(root, a.at, "at", "marker"));
  const id = a.id ?? uniqueId(root, `marker_${Math.round(at * 100)}`);
  const m: CCNode = {
    $cc: 1,
    name: "Marker",
    props: {
      id,
      at: fmt(at),
      ...(a.label ? { label: a.label } : {}),
      ...(a.color ? { color: a.color } : {}),
    },
    children: [],
  };
  return makeResult(
    root,
    [{ op: "insert", parent: String(parent.props.id), index: parent.children.length, node: m }],
    `add marker "${a.label ?? id}" at ${fmt(at)}`,
    { id },
  );
}

export function removeMarker(root: CCNode, a: { id: string }): EditResult {
  const { node } = elementOrThrow(root, a.id);
  if (node.name !== "Marker") throw new FlomotionError("invalid_edit", `#${a.id} is not a Marker`);
  return makeResult(root, [{ op: "remove", id: a.id }], `remove marker #${a.id}`);
}

/** Registry used by the MCP `edit` tool: op name → function. */
export const EDIT_OPS = {
  insert,
  overwrite,
  replace,
  lift,
  extract,
  split,
  trim,
  roll,
  slip,
  slide,
  move,
  link,
  unlink,
  group: groupItems,
  ungroup,
  nest,
  setSpeed,
  rippleDelete,
  snap: snapOp,
  lockTrack,
  muteTrack,
  soloTrack,
  addMarker,
  removeMarker,
} as const;

export type EditOpName = keyof typeof EDIT_OPS;

export function runEdit(root: CCNode, op: string, args: Record<string, unknown>): EditResult {
  const fn = (EDIT_OPS as Record<string, (r: CCNode, a: any) => EditResult>)[op];
  if (!fn)
    throw new FlomotionError("invalid_edit", `Unknown edit op "${op}"`, {
      fix: `Ops: ${Object.keys(EDIT_OPS).join(", ")}`,
    });
  return fn(root, args);
}
