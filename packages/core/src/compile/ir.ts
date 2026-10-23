import { evalProp, evalSignal, exprSignal, isSignal, type Signal } from "../anim/signal.js";
import { isNode } from "../ast/node.js";
import { CodeCutError } from "../errors.js";
import type { Registry } from "../schema/define.js";
import { registry as defaultRegistry } from "../schema/define.js";
import type { Channel, Offset } from "../schema/render-types.js";
import type { RNode, RenderCtx, ResolveIssue, ResolvedFont, ResolvedProject } from "../resolve/types.js";
import { parseColor, toCss } from "../values/color.js";
import { resolveLength, type Length } from "../values/length.js";
import { bakeHz, bakeSignal } from "./bake.js";
import { motionContribution, type MotionSpec } from "./motion.js";
import { transitionPlan } from "./transitions.js";
import type { CompileOptions, IRLayer } from "./types.js";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export interface IRBuild {
  root: IRLayer;
  issues: ResolveIssue[];
  fontsUsed: Set<string>;
}

export function buildIR(project: ResolvedProject, opts: CompileOptions = {}): IRBuild {
  const reg: Registry = opts.registry ?? defaultRegistry;
  void reg;
  const issues: ResolveIssue[] = [];
  const fontsUsed = new Set<string>();
  const comp = project.comp;
  const assetPath = opts.assetPath ?? ((s: string) => s.replace(/^\.\//, ""));

  const fontById = new Map<string, ResolvedFont>(comp.fonts.map((f) => [f.id, f]));
  const fontFamily = (ref: string | undefined): string => {
    if (!ref) return "sans-serif";
    let id = ref;
    if (ref.startsWith("$")) {
      const tok = comp.theme.tokens[ref.slice(1)] as { font?: string } | undefined;
      id = tok?.font ?? ref;
    }
    const f = fontById.get(id);
    if (f) {
      fontsUsed.add(f.id);
      // single quotes: this string lands inside style="…" attributes
      return [`'${f.family}'`, ...f.fallback.map((x) => (/\s/.test(x) ? `'${x}'` : x)), "sans-serif"].join(", ");
    }
    return /\s/.test(id) ? `'${id}', sans-serif` : `${id}, sans-serif`;
  };

  const makeCtx = (node: RNode): RenderCtx => {
    const basis = { parent: Math.max(node.box[0], node.box[1]), vw: comp.width, vh: comp.height };
    return {
      node,
      comp,
      project,
      id: node.id,
      fps: comp.fps,
      sub: (suffix) => `${node.id}-${suffix}`,
      px: (len: Length, axis) =>
        resolveLength(len, { ...basis, parent: axis === "y" ? node.box[1] : axis === "x" ? node.box[0] : basis.parent }),
      at: (prop, t) => evalProp(node.props[prop], t),
      evalSignal,
      fontFamily,
      assetPath,
      measure: opts.measure,
      esc,
      words: (id) => opts.words?.(id),
      ctxFor: (n) => makeCtx(n),
    };
  };

  const layers = new Map<string, IRLayer>();

  const layerFor = (node: RNode, trackIndex?: number): IRLayer => {
    const def = node.def;
    const rc = makeCtx(node);
    const layer: IRLayer = {
      id: node.id,
      name: node.name,
      kind: node.name === "Track" ? "track" : "layer",
      start: node.start,
      end: node.end,
      z: node.z * 10 + (typeof node.props.z === "number" ? node.props.z * 1000 : 0),
      trackIndex,
      children: [],
      html: "",
      css: "",
      hostStyle: {},
      xfStyle: {},
      offsets: [],
      filters: [],
      channels: [],
      statics: {},
      defs: [],
      overlays: [],
      visual: def.traits.includes("visual"),
      flow: false,
      inFlow: false,
      sounds: [],
      audio: [],
      source: { id: node.id },
      baked: [],
      statics2: [],
    };
    layers.set(node.id, layer);
    if (node.raw.hidden === true) {
      layer.kind = "hidden";
      return layer;
    }

    if (node.name === "Track" || node.name === "Composition") layer.visual = true;
    // children first (their html is substituted into this layer)
    const childLayers: IRLayer[] = [];
    node.children.forEach((c) => {
      if (c.def.stub) {
        issues.push({ severity: "warning", rule: "stub-not-rendered", message: `<${c.name}> is a typed stub and is not rendered yet`, id: c.id });
      }
      const cl = layerFor(c);
      if (cl.kind !== "hidden") childLayers.push(cl);
    });
    layer.children = childLayers;

    // own render
    if (def.render && !def.stub) {
      const out = def.render(node.props as any, rc);
      if (out.visual === false) layer.visual = false;
      layer.html = out.html;
      layer.flow = !!out.flow;
      for (const cl of childLayers) cl.inFlow = layer.flow;
      layer.css = out.css ?? "";
      layer.xfStyle = { ...(out.box ?? {}) };
      layer.statics = { ...(out.statics ?? {}) };
      layer.channels.push(...(out.channels ?? []));
      layer.sounds.push(...(out.sounds ?? []));
      layer.audio.push(...(out.extra?.audio ?? []));
      for (const m of out.issues ?? []) issues.push({ severity: "warning", rule: "option-ignored", message: `${node.name}#${node.id}: ${m}`, id: node.id });
    } else {
      layer.html = ["Track", "Scene", "Sequence", "Composition"].includes(node.name) ? "{{children}}" : "";
    }

    // effects in source order, then built-in enter/exit
    for (const eff of node.effects) {
      const edef = eff.def;
      if (edef.stub) {
        issues.push({ severity: "warning", rule: "stub-not-rendered", message: `<${eff.name}> is a typed stub and is not applied yet`, id: eff.id });
        continue;
      }
      if (eff.raw.enabled === false) continue;
      const out = edef.apply?.(eff.props as any, makeCtx(eff));
      if (!out) continue;
      layer.offsets.push(...(out.offsets ?? []));
      layer.filters.push(...(out.filters ?? []));
      layer.channels.push(...(out.channels ?? []));
      if (out.style) mergeStyle(layer.xfStyle, out.style);
      for (const m of out.issues ?? []) issues.push({ severity: "warning", rule: "effect-option-ignored", message: `${eff.name}#${eff.id}: ${m}`, id: eff.id });
      if (out.defs) layer.defs.push(out.defs);
      if (out.css) layer.css += out.css;
      if (out.overlay) {
        layer.overlays.push(out.overlay.html);
        if (out.overlay.css) layer.css += out.overlay.css;
        layer.channels.push(...(out.overlay.channels ?? []));
      }
      layer.sounds.push(...(out.sounds ?? []));
      if (out.timeRemap) {
        const prev = layer.remap;
        layer.remap = prev
          ? { map: (t) => out.timeRemap!.map(prev.map(t)), unmap: (t) => prev.unmap(out.timeRemap!.unmap(t)) }
          : out.timeRemap;
      }
    }
    if (layer.visual) {
      const basis = { parent: Math.max(node.box[0], node.box[1]), vw: comp.width, vh: comp.height };
      for (const kind of ["enter", "exit"] as const) {
        const spec = evalGroup(node.props[kind]);
        if (spec && Object.keys(spec).length) {
          const c = motionContribution(kind, spec as MotionSpec, [node.start, node.end], basis);
          layer.offsets.push(...c.offsets);
          layer.filters.push(...c.filters);
        }
      }
    }

    if (def.render && !def.stub && layer.html === "" && !layer.visual && node.children.length === 0 && node.name !== "Track") {
      layer.kind = "hidden"; // non-visual leaf (Marker, Sound, ...): keeps audio/sounds, emits no DOM
    }
    return layer;
  };

  const rootNode = project.root;
  const root = layerFor(rootNode);
  root.kind = "composition";
  // tracks: tracks stack in declaration order
  root.children.forEach((c, i) => {
    c.trackIndex = i;
  });

  // transitions between consecutive scenes within the same parent
  const applyTransitions = (parent: RNode) => {
    const scenes = parent.children.filter((c) => c.name === "Scene").sort((a, b) => a.start - b.start);
    scenes.forEach((scene, i) => {
      const tr = evalGroup(scene.props.transition) as { type?: string; duration?: number | string } | undefined;
      if (!tr || !tr.type || tr.type === "cut" || i === 0) return;
      const prev = scenes[i - 1]!;
      const plan = transitionPlan(scene, prev, tr as any, comp);
      const inc = layers.get(scene.id)!;
      const out = layers.get(prev.id)!;
      inc.offsets.push(...plan.incoming.offsets);
      inc.filters.push(...plan.incoming.filters);
      inc.channels.push(...plan.incoming.channels);
      out.offsets.push(...plan.outgoing.offsets);
      out.filters.push(...plan.outgoing.filters);
      out.channels.push(...plan.outgoing.channels);
      out.end = Math.max(out.end, plan.holdUntil);
      const hostLayer = layers.get(parent.id)!;
      for (const o of plan.overlays) {
        hostLayer.overlays.push(o.html);
        hostLayer.css += o.css ?? "";
        hostLayer.channels.push(...o.channels);
      }
      plan.issues.forEach((m) => issues.push({ severity: "warning", rule: "transition", message: m, id: scene.id }));
    });
    parent.children.forEach(applyTransitions);
  };
  applyTransitions(rootNode);

  // finalize: assemble transform channels and bake
  const hz = bakeHz(comp.fps);
  const finalize = (n: RNode) => {
    const layer = layers.get(n.id)!;
    if (layer.kind === "hidden") return;
    finalizeLayer(n, layer, hz, comp.fps);
    n.children.forEach(finalize);
  };
  finalize(rootNode);

  // resolve html with children
  const render = (n: RNode): string => {
    const layer = layers.get(n.id)!;
    const kids = n.children.map(render).join("");
    let html = layer.html;
    if (html.includes("{{children}}")) html = html.replace("{{children}}", kids);
    else html += kids;
    layer.html = html;
    if (n === rootNode) {
      return `<div id="${n.id}-xf" class="cc-xf" style="position:absolute;inset:0">${layer.html}${layer.overlays.join("")}</div>`;
    }
    return hostHtml(layer, n);
  };
  const body = render(rootNode);
  root.html = body;
  return { root, issues, fontsUsed };
}

export function evalGroup(v: unknown): Record<string, unknown> | undefined {
  if (!v || typeof v !== "object") return undefined;
  const out: Record<string, unknown> = {};
  for (const [k, x] of Object.entries(v as object)) {
    out[k] = isSignal(x) ? evalSignal(x, 0) : x;
  }
  return out;
}

const num3 = (v: unknown, d: number[]): number[] => (Array.isArray(v) ? [v[0] ?? d[0]!, v[1] ?? d[1]!, v[2] ?? d[2]!] : d);

function finalizeLayer(node: RNode, layer: IRLayer, hz: number, fps: number): void {
  const span: [number, number] = [node.start, node.end];
  const rm = layer.remap;
  const ev = <T,>(sig: Signal<T>, t: number): T => evalSignal(sig, rm ? rm.map(t) : t);
  const xf = `#${node.id}-xf`;
  if (layer.visual) {
    const P = node.props;
    const adds = (prop: Offset["prop"]) => layer.offsets.filter((o) => o.prop === prop && o.mode === "add").map((o) => o.signal);
    const muls = (prop: Offset["prop"]) => layer.offsets.filter((o) => o.prop === prop && o.mode === "mul").map((o) => o.signal);
    const sigOf = (p: unknown): Signal | undefined => (isSignal(p) ? p : undefined);
    const pos = sigOf(P.position);
    const rot = sigOf(P.rotation);
    const scl = sigOf(P.scale);
    const skw = sigOf(P.skew);
    const flip = (P.flip as string | undefined) ?? "none";
    const flipX = flip === "x" || flip === "xy" ? -1 : 1;
    const flipY = flip === "y" || flip === "xy" ? -1 : 1;

    const compose = (
      prop: string,
      base: (t: number) => number,
      baseSigs: Array<Signal | undefined>,
      addSigs: Signal[],
      mulSigs: Signal[],
      def: number,
    ) => {
      const constBase = baseSigs.every((s) => !s || s.kind === "const");
      if (addSigs.length === 0 && mulSigs.length === 0 && constBase) {
        const v = base(span[0]);
        if (v !== def) layer.statics[prop] = Math.round(v * 10000) / 10000;
        return;
      }
      const sig = exprSignal(
        (t) => {
          let v = base(t);
          for (const a of addSigs) v += ev(a, t) as number;
          for (const m of mulSigs) v *= ev(m, t) as number;
          return v;
        },
        "number",
        unionSpan(rm, [...baseSigs, ...addSigs, ...mulSigs], span),
      );
      pushChannel(layer, xf, prop, sig, span, hz);
    };

    const P3 = (s: Signal | undefined, d: number[]) => (t: number) => (s ? num3(ev(s, t), d) : d);
    const posAt = P3(pos, [0, 0, 0]);
    const rotAt = P3(rot, [0, 0, 0]);
    const sclAt = P3(scl, [1, 1, 1]);
    const skwAt = (t: number) => {
      const v = skw ? (ev(skw, t) as number[]) : [0, 0];
      return [v[0] ?? 0, v[1] ?? 0];
    };
    compose("x", (t) => posAt(t)[0]!, [pos], adds("x"), [], 0);
    compose("y", (t) => posAt(t)[1]!, [pos], adds("y"), [], 0);
    compose("z", (t) => posAt(t)[2]!, [pos], adds("z"), [], 0);
    compose("rotationX", (t) => rotAt(t)[0]!, [rot], adds("rotationX"), [], 0);
    compose("rotationY", (t) => rotAt(t)[1]!, [rot], adds("rotationY"), [], 0);
    compose("rotation", (t) => rotAt(t)[2]!, [rot], adds("rotation"), [], 0);
    compose("scaleX", (t) => sclAt(t)[0]! * flipX, [scl], adds("scaleX"), [...muls("scale"), ...muls("scaleX")], 1);
    compose("scaleY", (t) => sclAt(t)[1]! * flipY, [scl], adds("scaleY"), [...muls("scale"), ...muls("scaleY")], 1);
    compose("skewX", (t) => skwAt(t)[0]!, [skw], adds("skewX"), [], 0);
    compose("skewY", (t) => skwAt(t)[1]!, [skw], adds("skewY"), [], 0);
    const op = sigOf(P.opacity);
    compose("opacity", (t) => (op ? (ev(op, t) as number) : 1), [op], adds("opacity"), muls("opacity"), 1);

    // anchor → transform-origin
    const anc = sigOf(P.anchor);
    if (anc) {
      const fmt = (t: number) => {
        const a = num3(ev(anc, t), [50, 50, 0]);
        return `${a[0]}% ${a[1]}% ${a[2]}px`;
      };
      if (anc.kind === "const") layer.statics["transformOrigin"] = fmt(span[0]);
      else pushChannel(layer, xf, "transformOrigin", exprSignal(fmt, "discrete", unionSpan(rm, [anc], span)), span, hz, (v) => String(v));
    }
    const per = sigOf(P.perspective);
    if (per) {
      const v = ev(per, span[0]) as number;
      if (per.kind !== "const") pushChannel(layer, xf, "transformPerspective", per, span, hz);
      else if (v > 0) layer.statics["transformPerspective"] = v;
    }
    // crop → clip-path inset
    const crop = P.crop as Record<string, unknown> | undefined;
    if (crop && Object.keys(crop).length) {
      const side = (k: string, t: number): string => {
        const v = crop[k];
        const x = isSignal(v) ? ev(v, t) : v ?? 0;
        return typeof x === "number" ? `${Math.round(x * 100) / 100}px` : String(x);
      };
      const sigs = Object.values(crop).filter(isSignal);
      const fmt = (t: number) => `inset(${side("top", t)} ${side("right", t)} ${side("bottom", t)} ${side("left", t)})`;
      const animated = sigs.some((s) => s.kind !== "const");
      if (animated) pushChannel(layer, xf, "clipPath", exprSignal(fmt, "discrete", unionSpan(rm, sigs, span)), span, hz, (v) => String(v));
      else {
        const v = fmt(span[0]);
        if (v !== "inset(0px 0px 0px 0px)") layer.statics["clipPath"] = v;
      }
    }
    // blend (static) on host
    const blend = P.blend as string | undefined;
    if (blend && blend !== "normal") layer.hostStyle["mix-blend-mode"] = blend === "add" ? "plus-lighter" : blend;
  }

  // filters (effects + enter/exit + renderer-provided)
  if (layer.filters.length) {
    const fmt = (t: number) => layer.filters.map((f) => ev(f, t)).filter(Boolean).join(" ");
    const animated = layer.filters.some((f) => f.kind !== "const");
    if (animated) pushChannel(layer, xf, "filter", exprSignal(fmt, "discrete", unionSpan(rm, layer.filters, span)), span, hz, (v) => String(v));
    else layer.statics["filter"] = fmt(span[0]);
  }

  // channels contributed by the renderer / effects
  const hzNow = hz;
  for (const ch of layer.channels) {
    const chSpan = ch.span ?? span;
    const sig = rm ? exprSignal((t) => evalSignal(ch.signal, rm.map(t)), ch.signal.kind === "const" ? "discrete" : (ch.signal as { vk?: "number" | "vec" | "color" | "discrete" }).vk ?? "discrete", [rm.unmap(chSpan[0]), rm.unmap(chSpan[1])]) : ch.signal;
    pushChannel(layer, ch.target, ch.prop, sig, rm ? [rm.unmap(chSpan[0]), rm.unmap(chSpan[1])] : chSpan, hzNow, ch.format, ch.unit);
  }
  layer.channels = [];
  void fps;
}

function unionSpan(
  rm: IRLayer["remap"],
  sigs: Array<Signal | undefined>,
  elementSpan: [number, number],
): [number, number] {
  let lo = Infinity;
  let hi = -Infinity;
  for (const s of sigs) {
    if (!s) continue;
    const sp = signalSpanOf(s, elementSpan);
    if (sp) {
      lo = Math.min(lo, sp[0]);
      hi = Math.max(hi, sp[1]);
    }
  }
  if (lo === Infinity) return elementSpan;
  return rm ? [rm.unmap(lo), rm.unmap(hi)] : [lo, hi];
}
import { signalSpan as signalSpanOf } from "../anim/signal.js";

function pushChannel(
  layer: IRLayer,
  target: string,
  prop: string,
  sig: Signal,
  span: [number, number],
  hz: number,
  format?: (v: any) => string,
  unit?: string,
): void {
  const out = bakeSignal(target, prop, sig, span, hz, { format, unit });
  if (out.baked) layer.baked.push(out.baked);
  if (out.static) layer.statics2.push(out.static);
}

/** Merge effect styles; masks stack with intersect, filters never come through here. */
function mergeStyle(into: Record<string, string>, add: Record<string, string>): void {
  for (const [k, v] of Object.entries(add)) {
    if ((k === "mask" || k === "-webkit-mask") && into[k]) {
      into[k] = `${into[k]}, ${v}`;
      into["mask-composite"] = "intersect";
      into["-webkit-mask-composite"] = "source-in";
    } else into[k] = v;
  }
}

function styleAttr(style: Record<string, string>): string {
  return Object.entries(style)
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
}

function hostHtml(layer: IRLayer, node: RNode): string {
  const dur = Math.max(0, layer.end - layer.start);
  const z = layer.z;
  const host = styleAttr(
    layer.inFlow
      ? { position: "relative", "z-index": String(z), ...layer.hostStyle }
      : { position: "absolute", inset: "0", "z-index": String(z), ...layer.hostStyle },
  );
  const attrs = `id="${node.id}" class="clip cc-l cc-${node.name.toLowerCase()}" data-start="${layer.start}" data-duration="${Math.round(dur * 1e6) / 1e6}"${
    layer.trackIndex !== undefined ? ` data-track-index="${layer.trackIndex}"` : ""
  } data-cc="${node.name}"`;
  if (!layer.visual) {
    return `<div ${attrs} style="${host}">${layer.html}${layer.overlays.join("")}</div>`;
  }
  const xfBase: Record<string, string> = layer.inFlow
    ? { position: "relative" }
    : layer.xfStyle["left"] || layer.xfStyle["top"] || layer.xfStyle["width"]
      ? { position: "absolute" }
      : { position: "absolute", inset: "0" };
  const xf = styleAttr({ ...xfBase, ...layer.xfStyle });
  return `<div ${attrs} style="${host}"><div id="${node.id}-xf" class="cc-xf" style="${xf}">${layer.html}${layer.overlays.join("")}</div></div>`;
}

export { parseColor, toCss, CodeCutError, isNode };
