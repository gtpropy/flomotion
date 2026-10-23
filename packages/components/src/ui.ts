import {
  bool,
  color,
  defineComponent,
  enumOf,
  evalProp,
  exprSignal,
  fill,
  group,
  int,
  length,
  list,
  num,
  parseEase,
  parseTimeLiteral,
  text,
  time,
  type Channel,
  type ComponentDef,
  type RenderCtx,
  type Signal,
  type SoundCue,
} from "@codecut/core";
import { strokeControl } from "./shapes.js";
import { atControl, boxStroke, css, esc, fillCss, placement, round, type StrokeSpec } from "./util.js";
import { renderText } from "./text/text.js";
import { textStyleControls, typographyControls } from "./text/controls.js";

const lenPx = (rc: RenderCtx, v: number | string | undefined, d: number, axis: "x" | "y") => (v === undefined ? d : rc.px(v, axis));

// ---------- UIMock ----------

const DEVICES = {
  phone: { w: 720, h: 1480, bezel: 22, radius: 96, bar: 0 },
  tablet: { w: 1100, h: 820, bezel: 26, radius: 56, bar: 0 },
  laptop: { w: 1320, h: 840, bezel: 28, radius: 28, bar: 0 },
  browser: { w: 1200, h: 780, bezel: 0, radius: 22, bar: 64 },
} as const;
type Device = keyof typeof DEVICES;

function deviceBox(raw: Record<string, unknown>) {
  const d = DEVICES[(raw.device as Device) ?? "phone"] ?? DEVICES.phone;
  const num = (v: unknown, f: number) => (typeof v === "number" ? v : f);
  const w = num(raw.width, d.w);
  const h = num(raw.height, d.h);
  const bezel = num(raw.bezel, d.bezel);
  return { w, h, bezel, radius: num(raw.radius, d.radius), bar: d.bar, screenW: w - bezel * 2, screenH: h - bezel * 2 - d.bar };
}

export const UIMock = defineComponent("UIMock", {
  category: "ui",
  description:
    "A device frame (phone, tablet, laptop, browser) whose screen holds child layers. Children place themselves with `at` inside the screen.",
  traits: ["visual", "container"],
  children: "any",
  controls: {
    at: atControl(),
    device: enumOf(["phone", "tablet", "laptop", "browser"], { default: "phone" }),
    width: num({ min: 100, max: 4000, unit: "px" }),
    height: num({ min: 100, max: 4000, unit: "px" }),
    bezel: num({ min: 0, max: 80, unit: "px" }),
    radius: num({ min: 0, max: 200, unit: "px" }),
    bezelColor: color({ default: "#0b0b0f" }),
    screenColor: color({ default: "#ffffff" }),
    shadow: bool({ default: true }),
    notch: bool({ default: true, description: "Phone camera island." }),
    url: text({ default: "app.example.com", description: "Browser address bar text." }),
  },
  childBox: (raw) => {
    const b = deviceBox(raw);
    return [b.screenW, b.screenH];
  },
  render: (p, rc) => {
    const b = deviceBox({ ...p });
    const pl = placement(p.at, rc);
    const barH = DEVICES[p.device as Device].bar;
    const chrome =
      p.device === "browser"
        ? `<div style="position:absolute;left:0;top:0;right:0;height:${barH}px;background:#eceff3;display:flex;align-items:center;gap:10px;padding:0 22px"><i style="width:14px;height:14px;border-radius:50%;background:#ff5f57"></i><i style="width:14px;height:14px;border-radius:50%;background:#febc2e"></i><i style="width:14px;height:14px;border-radius:50%;background:#28c840"></i><span style="margin-left:18px;flex:1;max-width:60%;height:34px;border-radius:17px;background:#fff;color:#667;font:500 20px sans-serif;display:flex;align-items:center;padding:0 18px">${esc(String(p.url))}</span></div>`
        : "";
    const island = p.device === "phone" && p.notch ? `<div style="position:absolute;left:50%;top:18px;width:${Math.round(b.w * 0.24)}px;height:34px;margin-left:-${Math.round(b.w * 0.12)}px;border-radius:17px;background:#000;z-index:5"></div>` : "";
    const base = p.device === "laptop" ? `<div style="position:absolute;left:-4%;right:-4%;bottom:-22px;height:22px;border-radius:0 0 24px 24px;background:linear-gradient(#cfd3d9,#9aa0a8)"></div>` : "";
    return {
      html: `<div id="${rc.sub("frame")}" style="${css({ position: "relative", width: "100%", height: "100%", background: p.bezelColor, "border-radius": `${b.radius}px`, padding: `${b.bezel}px`, "box-sizing": "border-box", "box-shadow": p.shadow ? "0 40px 90px rgba(0,0,0,.45), 0 0 0 2px rgba(255,255,255,.06) inset" : undefined })}"><div id="${rc.sub("screen")}" style="${css({ position: "relative", width: "100%", height: "100%", "border-radius": `${Math.max(0, b.radius - b.bezel)}px`, overflow: "hidden", background: p.screenColor })}">${chrome}<div id="${rc.sub("content")}" style="position:absolute;left:0;right:0;bottom:0;top:${barH}px">{{children}}</div></div>${island}${base}</div>`,
      box: { ...pl.box, width: `${b.w}px`, height: `${b.h}px` },
      statics: pl.statics,
    };
  },
});

// ---------- Card / GlassCard ----------

function cardControls() {
  return {
    at: atControl(),
    width: length({ default: 600 }),
    height: length(),
    padding: length({ default: 32 }),
    gap: length({ default: 16 }),
    radius: length({ default: 32 }),
    fill: fill({ default: "#16161d" }),
    stroke: strokeControl(),
    shadow: bool({ default: true }),
    layout: enumOf(["stack", "absolute"], { default: "stack", description: "stack: children flow top to bottom. absolute: children use `at`." }),
    align: enumOf(["start", "center", "end", "stretch"], { default: "stretch" }),
  };
}

const ALIGN: Record<string, string> = { start: "flex-start", center: "center", end: "flex-end", stretch: "stretch" };

function cardRender(glass: boolean) {
  return (p: any, rc: RenderCtx) => {
    const w = rc.px(p.width, "x");
    const pl = placement(p.at, rc);
    const stack = p.layout === "stack";
    const pad = typeof p.padding === "string" ? p.padding : `${p.padding}px`;
    const radius = typeof p.radius === "string" ? p.radius : `${p.radius}px`;
    const bg = glass ? "rgba(255,255,255,0.10)" : fillCss(p.fill, rc);
    const st = glass ? "inset 0 0 0 1px rgba(255,255,255,0.22)" : boxStroke(p.stroke as StrokeSpec);
    const shadow = p.shadow ? "0 24px 60px rgba(0,0,0,.35)" : undefined;
    return {
      html: `<div id="${rc.sub("card")}" style="${css({
        width: "100%",
        height: "100%",
        background: bg,
        "border-radius": radius,
        padding: pad,
        "box-sizing": "border-box",
        "box-shadow": [st, shadow].filter(Boolean).join(", ") || undefined,
        "backdrop-filter": glass ? "blur(28px) saturate(1.5)" : undefined,
        "-webkit-backdrop-filter": glass ? "blur(28px) saturate(1.5)" : undefined,
        display: stack ? "flex" : undefined,
        "flex-direction": stack ? "column" : undefined,
        gap: stack ? (typeof p.gap === "string" ? p.gap : `${p.gap}px`) : undefined,
        "align-items": stack ? ALIGN[p.align] : undefined,
        position: "relative",
      })}">{{children}}</div>`,
      box: { ...pl.box, width: `${round(w)}px`, ...(p.height !== undefined ? { height: `${round(rc.px(p.height, "y"))}px` } : {}) },
      statics: pl.statics,
      flow: stack,
    };
  };
}

export const Card = defineComponent("Card", {
  category: "ui",
  description: "A surface with radius, optional stroke and shadow. Children stack top to bottom (or use `layout=\"absolute\"`).",
  traits: ["visual", "container"],
  children: "any",
  controls: cardControls(),
  childBox: (raw, comp) => {
    const w = typeof raw.width === "number" ? raw.width : 600;
    const h = typeof raw.height === "number" ? raw.height : comp.height;
    return [w, h];
  },
  render: cardRender(false),
});

export const GlassCard = defineComponent("GlassCard", {
  category: "ui",
  description: "A frosted-glass card: backdrop blur, translucent fill and a hairline border.",
  traits: ["visual", "container"],
  children: "any",
  controls: { ...cardControls(), fill: fill({ default: "rgba(255,255,255,0.10)" }) },
  childBox: (raw, comp) => {
    const w = typeof raw.width === "number" ? raw.width : 600;
    const h = typeof raw.height === "number" ? raw.height : comp.height;
    return [w, h];
  },
  render: cardRender(true),
});

// ---------- Cursor ----------

export const Cursor = defineComponent("Cursor", {
  category: "ui",
  description:
    "A mouse pointer. Move it by keyframing `position`; `clicks` lists times (relative to the parent) where it presses and a ripple expands.",
  children: "effects",
  controls: {
    at: atControl(),
    size: num({ min: 8, max: 400, default: 56, unit: "px" }),
    color: color({ default: "#ffffff" }),
    outline: color({ default: "#111111" }),
    clicks: list(time({ unit: "s" })),
    ripple: num({ min: 0, max: 600, default: 90, unit: "px" }),
    rippleColor: color({ default: "#7c8cff" }),
  },
  render: (p, rc) => {
    const id = rc.sub("arrow");
    const size = p.size as number;
    const clicks = ((p.clicks as Array<number | string>) ?? []).map((c) => rc.node.parentStart + parseTimeLiteral(c, rc.fps));
    const channels: Channel[] = [];
    const sounds: SoundCue[] = [];
    let ripples = "";
    clicks.forEach((tc, i) => {
      const rid = rc.sub(`rip${i}`);
      ripples += `<span id="${rid}" style="position:absolute;left:0;top:0;width:${p.ripple}px;height:${p.ripple}px;margin:-${p.ripple / 2}px 0 0 -${p.ripple / 2}px;border-radius:50%;border:4px solid ${p.rippleColor};opacity:0;transform:scale(.2)"></span>`;
      const span: [number, number] = [tc, tc + 0.55];
      const q = (t: number) => Math.min(1, Math.max(0, (t - tc) / 0.55));
      const e = parseEase("expo.out");
      channels.push({ target: `#${rid}`, prop: "opacity", signal: exprSignal((t) => round(t < tc ? 0 : 0.7 * (1 - q(t)), 3), "number", span), span });
      channels.push({ target: `#${rid}`, prop: "scale", signal: exprSignal((t) => round(0.2 + 1.4 * e(q(t)), 3), "number", span), span });
      sounds.push({ tag: "ui/tap", at: tc, source: rc.id });
    });
    if (clicks.length) {
      const press = (t: number) => {
        let v = 1;
        for (const tc of clicks) {
          const d = t - tc;
          if (d >= 0 && d < 0.2) v = Math.min(v, 1 - 0.16 * Math.sin((Math.PI * d) / 0.2));
        }
        return round(v, 4);
      };
      const span: [number, number] = [Math.min(...clicks), Math.max(...clicks) + 0.25];
      channels.push({ target: `#${id}`, prop: "scale", signal: exprSignal(press, "number", span), span });
    }
    const pl = placement(Array.isArray(p.at) ? p.at : "top-left", rc);
    return {
      html: `${ripples}<svg id="${id}" viewBox="0 0 24 24" width="${size}" height="${size}" style="position:absolute;left:0;top:0;overflow:visible;transform-origin:2px 2px;filter:drop-shadow(0 6px 10px rgba(0,0,0,.35))"><path d="M2 2 L2 19.5 L7 15 L10.2 22.2 L13 21 L9.9 14 L16.5 14 Z" fill="${p.color}" stroke="${p.outline}" stroke-width="1.4" stroke-linejoin="round"/></svg>`,
      box: { ...pl.box, width: `${size}px`, height: `${size}px` },
      statics: { ...pl.statics, xPercent: 0, yPercent: 0 },
      channels,
      sounds,
    };
  },
});

// ---------- Chip ----------

export const Chip = defineComponent("Chip", {
  category: "ui",
  description: "A pill label with an optional leading dot.",
  children: "effects",
  controls: {
    at: atControl(),
    label: text({ default: "Label" }),
    fill: fill({ default: "#262634" }),
    textColor: color({ default: "#ffffff" }),
    dot: color({ description: "Leading dot colour." }),
    font: text({ default: "$type.body" }),
    size: num({ min: 8, max: 200, default: 36, unit: "px" }),
    weight: num({ min: 1, max: 1000, default: 600 }),
    paddingX: num({ min: 0, default: 28, unit: "px" }),
    paddingY: num({ min: 0, default: 14, unit: "px" }),
    stroke: strokeControl(),
  },
  render: (p, rc) => {
    const pl = placement(p.at, rc);
    const dot = p.dot ? `<i style="display:inline-block;width:${round(p.size * 0.3)}px;height:${round(p.size * 0.3)}px;border-radius:50%;background:${p.dot};margin-right:${round(p.size * 0.35)}px"></i>` : "";
    return {
      html: `<div id="${rc.sub("chip")}" style="${css({ display: "inline-flex", "align-items": "center", "white-space": "nowrap", background: fillCss(p.fill, rc), color: p.textColor, "font-family": rc.fontFamily(p.font), "font-size": `${p.size}px`, "font-weight": p.weight, padding: `${p.paddingY}px ${p.paddingX}px`, "border-radius": "999px", "box-shadow": boxStroke(p.stroke as StrokeSpec), "line-height": 1 })}">${dot}${esc(String(p.label))}</div>`,
      box: { ...pl.box, width: "max-content" },
      statics: pl.statics,
    };
  },
});

// ---------- Counter ----------

export function formatNumber(v: number, o: { decimals: number; group: boolean; prefix: string; suffix: string }): string {
  const s = Math.abs(v).toFixed(o.decimals);
  const [int_, dec] = s.split(".");
  const g = o.group ? int_!.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : int_!;
  return `${v < 0 ? "-" : ""}${o.prefix}${g}${dec ? "." + dec : ""}${o.suffix}`;
}

export const Counter = defineComponent("Counter", {
  category: "ui",
  description: "An animated number that counts from `from` to `to`. Uses tabular figures so the width does not jitter.",
  children: "effects",
  textChildren: "text",
  controls: {
    at: atControl(),
    from: num({ default: 0 }),
    to: num({ default: 100 }),
    delay: time({ default: 0, unit: "s" }),
    over: time({ default: 1.2, unit: "s", description: "How long the count takes (not the layer duration)." }),
    ease: text({ default: "expo.out" }),
    decimals: int({ min: 0, max: 8, default: 0 }),
    group: bool({ default: true, description: "Thousands separators." }),
    prefix: text({ default: "" }),
    suffix: text({ default: "" }),
    ...typographyControls(),
    ...textStyleControls(),
    numeric: enumOf(["default", "tabular", "proportional", "lining", "oldstyle"], { default: "tabular" }),
    align: enumOf(["left", "center", "right", "justify"], { default: "center" }),
    weight: num({ animatable: true, min: 1, max: 1000, default: 700, step: 1, unit: "wght" }),
    size: num({ animatable: true, min: 1, max: 2000, default: 120, step: 1, unit: "px" }),
  },
  render: (p, rc) => {
    const fmt = (v: number) => formatNumber(v, { decimals: p.decimals, group: p.group, prefix: p.prefix, suffix: p.suffix });
    const delay = typeof p.delay === "number" ? p.delay : parseFloat(String(p.delay));
    const dur = typeof p.over === "number" ? p.over : parseFloat(String(p.over));
    const a = rc.node.start + delay;
    const e = parseEase(p.ease);
    const val = (t: number) => p.from + (p.to - p.from) * e(Math.min(1, Math.max(0, (t - a) / Math.max(1e-6, dur))));
    const out = renderText({ ...p, text: fmt(p.from) }, rc);
    const span: [number, number] = [a, a + dur];
    out.channels = [...(out.channels ?? []), { target: `#${rc.id}-text`, prop: "text", signal: exprSignal((t) => fmt(val(t)), "discrete", span), span, format: (v) => String(v) }];
    return out;
  },
});

// ---------- ProgressRing ----------

export const ProgressRing = defineComponent("ProgressRing", {
  category: "ui",
  description: "A circular progress indicator. Animate `value` (0 to 1); optionally show the percentage.",
  children: "effects",
  controls: {
    at: atControl(),
    size: num({ min: 20, max: 2000, default: 360, unit: "px" }),
    thickness: num({ min: 1, max: 200, default: 32, unit: "px" }),
    value: num({ animatable: true, min: 0, max: 1, default: 0.75, step: 0.01 }),
    color: fill({ default: "#7c8cff" }),
    track: color({ default: "rgba(255,255,255,0.12)" }),
    cap: enumOf(["round", "butt"], { default: "round" }),
    startAngle: num({ default: -90, unit: "deg" }),
    showValue: bool({ default: true }),
    font: text({ default: "$type.display" }),
    labelColor: color({ default: "#ffffff" }),
    labelSize: num({ min: 8, max: 800, default: 96, unit: "px" }),
  },
  render: (p, rc) => {
    const id = rc.sub("ring");
    const size = p.size as number;
    const r = (size - p.thickness) / 2;
    const defs: string[] = [];
    let stroke = typeof p.color === "string" ? p.color : "#7c8cff";
    if (p.color && typeof p.color === "object" && (p.color as any).type === "linear") {
      defs.push(`<linearGradient id="${id}-g" x1="0" y1="0" x2="1" y2="1">${(p.color as any).stops.map(([o, c]: [number, string]) => `<stop offset="${o}" stop-color="${c}"/>`).join("")}</linearGradient>`);
      stroke = `url(#${id}-g)`;
    }
    const v0 = rc.at<number>("value", rc.node.start);
    const sg = rc.node.props.value as Signal<number>;
    const channels: Channel[] = [];
    const span: [number, number] = [rc.node.start, rc.node.end];
    if (sg.kind !== "const") {
      channels.push({ target: `#${id}`, prop: "attr:stroke-dashoffset", signal: exprSignal((t) => round(1 - Math.min(1, Math.max(0, evalProp(sg, t) as number)), 4), "number", span), span });
      if (p.showValue) channels.push({ target: `#${id}-label`, prop: "text", signal: exprSignal((t) => `${Math.round(Math.min(1, Math.max(0, evalProp(sg, t) as number)) * 100)}%`, "discrete", span), span, format: (v) => String(v) });
    }
    const pl = placement(p.at, rc);
    return {
      html: `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="display:block;overflow:visible"><defs>${defs.join("")}</defs><circle cx="${size / 2}" cy="${size / 2}" r="${round(r)}" fill="none" stroke="${p.track}" stroke-width="${p.thickness}"/><circle id="${id}" cx="${size / 2}" cy="${size / 2}" r="${round(r)}" fill="none" stroke="${stroke}" stroke-width="${p.thickness}" stroke-linecap="${p.cap}" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="${round(1 - v0, 4)}" transform="rotate(${p.startAngle} ${size / 2} ${size / 2})"/></svg>${p.showValue ? `<div id="${id}-label" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:${p.labelColor};font:700 ${p.labelSize}px ${rc.fontFamily(p.font)};font-variant-numeric:tabular-nums">${Math.round(v0 * 100)}%</div>` : ""}`,
      box: { ...pl.box, width: `${size}px`, height: `${size}px` },
      statics: pl.statics,
      channels,
    };
  },
});

// ---------- Chart ----------

const PALETTE = ["#7c8cff", "#ff6b9a", "#35d0a5", "#ffb84d", "#4dc3ff", "#c084fc"];

export const Chart = defineComponent("Chart", {
  category: "ui",
  description: "Bar, line or donut chart that draws in. `progress` (0 to 1) animates the reveal; bars stagger by `stagger`.",
  children: "effects",
  controls: {
    at: atControl(),
    type: enumOf(["bar", "line", "donut"], { default: "bar" }),
    data: list(group({ label: text(), value: num({ required: true }), color: color() })),
    width: num({ min: 50, max: 4000, default: 800, unit: "px" }),
    height: num({ min: 50, max: 4000, default: 480, unit: "px" }),
    max: num({ min: 0, description: "Axis max (default: largest value)." }),
    progress: num({ animatable: true, min: 0, max: 1, default: 1, step: 0.01 }),
    stagger: num({ min: 0, max: 1, default: 0.12, description: "Bar stagger as a fraction of the reveal." }),
    thickness: num({ min: 4, max: 400, default: 56, unit: "px", description: "Donut ring thickness." }),
    labels: bool({ default: true }),
    labelColor: color({ default: "#c7c9d6" }),
    font: text({ default: "$type.body" }),
    gap: num({ min: 0, max: 200, default: 24, unit: "px" }),
    radius: num({ min: 0, max: 100, default: 12, unit: "px" }),
  },
  render: (p, rc) => {
    const W = p.width as number;
    const H = p.height as number;
    const data = ((p.data as Array<{ label?: string; value: number; color?: string }>) ?? []).map((d, i) => ({ ...d, color: d.color ?? PALETTE[i % PALETTE.length]! }));
    const maxV = p.max ?? Math.max(1, ...data.map((d) => d.value));
    const id = rc.sub("chart");
    const sg = rc.node.props.progress as Signal<number>;
    const span: [number, number] = [rc.node.start, rc.node.end];
    const prog = (t: number) => Math.min(1, Math.max(0, evalProp(sg, t) as number));
    const e = parseEase("expo.out");
    const channels: Channel[] = [];
    const animated = sg.kind !== "const";
    const labelH = p.labels ? 56 : 0;
    const font = `500 24px ${rc.fontFamily(p.font)}`;
    let svg = "";
    const n = data.length;
    if (p.type === "bar") {
      const bw = (W - p.gap * (n + 1)) / Math.max(1, n);
      const area = H - labelH;
      data.forEach((d, i) => {
        const full = (d.value / maxV) * area;
        const x = p.gap + i * (bw + p.gap);
        const k = (t: number) => {
          const start = i * p.stagger * 0.6;
          const q = Math.min(1, Math.max(0, (prog(t) - start) / Math.max(0.0001, 1 - start)));
          return e(q);
        };
        const h0 = full * k(rc.node.start);
        svg += `<rect id="${id}-b${i}" x="${round(x)}" y="${round(area - h0)}" width="${round(bw)}" height="${round(h0)}" rx="${p.radius}" fill="${d.color}"/>`;
        if (p.labels && d.label) svg += `<text x="${round(x + bw / 2)}" y="${H - 14}" text-anchor="middle" fill="${p.labelColor}" style="font:${font}">${esc(d.label)}</text>`;
        if (animated) {
          channels.push({ target: `#${id}-b${i}`, prop: "attr:height", signal: exprSignal((t) => round(full * k(t)), "number", span), span });
          channels.push({ target: `#${id}-b${i}`, prop: "attr:y", signal: exprSignal((t) => round(area - full * k(t)), "number", span), span });
        }
      });
    } else if (p.type === "line") {
      const area = H - labelH - 16;
      const step = n > 1 ? (W - 48) / (n - 1) : 0;
      const pts = data.map((d, i) => [24 + i * step, 8 + area - (d.value / maxV) * area] as const);
      const dpath = pts.map((q, i) => `${i ? "L" : "M"}${round(q[0])} ${round(q[1])}`).join(" ");
      const color0 = data[0]?.color ?? PALETTE[0]!;
      const off0 = 1 - e(prog(rc.node.start));
      svg += `<path d="${dpath} L${round(pts[n - 1]?.[0] ?? 0)} ${H - labelH} L${round(pts[0]?.[0] ?? 0)} ${H - labelH} Z" fill="${color0}" opacity=".12" id="${id}-area"/>`;
      svg += `<path id="${id}-line" d="${dpath}" fill="none" stroke="${color0}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="${round(off0, 4)}"/>`;
      pts.forEach((q, i) => {
        svg += `<circle id="${id}-d${i}" cx="${round(q[0])}" cy="${round(q[1])}" r="9" fill="${color0}" opacity="${prog(rc.node.start) >= (i + 1) / n ? 1 : 0}"/>`;
        if (p.labels && data[i]?.label) svg += `<text x="${round(q[0])}" y="${H - 14}" text-anchor="middle" fill="${p.labelColor}" style="font:${font}">${esc(data[i]!.label!)}</text>`;
        if (animated) channels.push({ target: `#${id}-d${i}`, prop: "attr:opacity", signal: exprSignal((t) => (prog(t) >= (i + 1) / n - 0.001 ? 1 : 0), "number", span), span });
      });
      if (animated) {
        channels.push({ target: `#${id}-line`, prop: "attr:stroke-dashoffset", signal: exprSignal((t) => round(1 - e(prog(t)), 4), "number", span), span });
        channels.push({ target: `#${id}-area`, prop: "attr:opacity", signal: exprSignal((t) => round(0.12 * e(prog(t)), 4), "number", span), span });
      }
    } else {
      const R = Math.min(W, H) / 2 - p.thickness / 2;
      const total = data.reduce((s, d) => s + d.value, 0) || 1;
      let acc = 0;
      data.forEach((d, i) => {
        const frac = d.value / total;
        const startFrac = acc;
        acc += frac;
        const seg = (t: number) => frac * e(prog(t)) * 100;
        const off = (t: number) => -startFrac * e(prog(t)) * 100;
        svg += `<circle id="${id}-s${i}" cx="${W / 2}" cy="${H / 2}" r="${round(R)}" fill="none" stroke="${d.color}" stroke-width="${p.thickness}" pathLength="100" stroke-dasharray="${round(seg(rc.node.start), 3)} 100" stroke-dashoffset="${round(off(rc.node.start), 3)}" transform="rotate(-90 ${W / 2} ${H / 2})"/>`;
        if (animated) {
          channels.push({ target: `#${id}-s${i}`, prop: "attr:stroke-dasharray", signal: exprSignal((t) => `${round(seg(t), 3)} 100`, "discrete", span), span, format: (v) => String(v) });
          channels.push({ target: `#${id}-s${i}`, prop: "attr:stroke-dashoffset", signal: exprSignal((t) => round(off(t), 3), "number", span), span });
        }
      });
    }
    const pl = placement(p.at, rc);
    return {
      html: `<svg id="${id}" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="display:block;overflow:visible">${svg}</svg>`,
      box: { ...pl.box, width: `${W}px`, height: `${H}px` },
      statics: pl.statics,
      channels,
    };
  },
});

// ---------- CodeBlock ----------

const KEYWORDS = new Set("const let var function return if else for while import from export default new class extends async await try catch throw type interface true false null undefined def in of as typeof".split(" "));

function highlight(src: string, theme: { kw: string; str: string; num: string; cm: string; fn: string }): string {
  const re = /(\/\/[^\n]*|#[^\n]*)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|\b(\d+(?:\.\d+)?)\b|([A-Za-z_$][\w$]*)(?=\()|([A-Za-z_$][\w$]*)/g;
  let out = "";
  let last = 0;
  for (const m of src.matchAll(re)) {
    out += esc(src.slice(last, m.index));
    last = m.index! + m[0].length;
    if (m[1]) out += `<span style="color:${theme.cm}">${esc(m[1])}</span>`;
    else if (m[2]) out += `<span style="color:${theme.str}">${esc(m[2])}</span>`;
    else if (m[3]) out += `<span style="color:${theme.num}">${m[3]}</span>`;
    else if (m[4]) out += KEYWORDS.has(m[4]) ? `<span style="color:${theme.kw}">${m[4]}</span>` : `<span style="color:${theme.fn}">${m[4]}</span>`;
    else if (m[5]) out += KEYWORDS.has(m[5]) ? `<span style="color:${theme.kw}">${m[5]}</span>` : esc(m[5]);
  }
  return out + esc(src.slice(last));
}

export const CodeBlock = defineComponent("CodeBlock", {
  category: "ui",
  description: "A syntax-tinted code panel. `reveal` (0 to 1) types the code in line by line.",
  children: "effects",
  textChildren: "code",
  controls: {
    at: atControl(),
    code: text({ multiline: true, required: true }),
    theme: enumOf(["dark", "light"], { default: "dark" }),
    font: text({ default: "$type.mono" }),
    size: num({ min: 8, max: 200, default: 34, unit: "px" }),
    lineNumbers: bool({ default: false }),
    width: num({ min: 100, max: 4000, default: 880, unit: "px" }),
    padding: num({ min: 0, default: 36, unit: "px" }),
    radius: num({ min: 0, default: 28, unit: "px" }),
    reveal: num({ animatable: true, min: 0, max: 1, default: 1, step: 0.01 }),
  },
  render: (p, rc) => {
    const dark = p.theme === "dark";
    const th = dark ? { kw: "#ff7ab2", str: "#8fe38f", num: "#ffcb6b", cm: "#6b7089", fn: "#82aaff" } : { kw: "#c2185b", str: "#2e7d32", num: "#e65100", cm: "#8a8fa3", fn: "#1565c0" };
    const lines = String(p.code).replace(/\n$/, "").split("\n");
    const lh = p.size * 1.55;
    const id = rc.sub("code");
    const body = lines.map((l, i) => `<div style="height:${lh}px;white-space:pre">${p.lineNumbers ? `<span style="display:inline-block;width:${p.size * 2}px;color:${th.cm}">${i + 1}</span>` : ""}${highlight(l, th)}</div>`).join("");
    const H = lines.length * lh + p.padding * 2;
    const W = p.width as number;
    const rv = rc.node.props.reveal as Signal<number>;
    const span: [number, number] = [rc.node.start, rc.node.end];
    const innerW = W - p.padding * 2;
    const clip = (v: number) => {
      const total = lines.length;
      const pos = Math.min(1, Math.max(0, v)) * total;
      const full = Math.floor(pos);
      const part = pos - full;
      if (v >= 1) return "inset(0 0 0 0)";
      const y1 = full * lh;
      const pts = [`0px 0px`, `${innerW}px 0px`, `${innerW}px ${y1}px`, `${round(part * innerW)}px ${y1}px`, `${round(part * innerW)}px ${y1 + lh}px`, `0px ${y1 + lh}px`];
      return `polygon(${pts.join(", ")})`;
    };
    const channels: Channel[] = [];
    if (rv.kind !== "const") channels.push({ target: `#${id}-body`, prop: "clipPath", signal: exprSignal((t) => clip(evalProp(rv, t) as number), "discrete", span), span, format: (v) => String(v) });
    const pl = placement(p.at, rc);
    return {
      html: `<div id="${id}" style="width:100%;height:100%;box-sizing:border-box;padding:${p.padding}px;border-radius:${p.radius}px;background:${dark ? "#10121a" : "#f6f7fb"};color:${dark ? "#e6e8f2" : "#20243a"};font:500 ${p.size}px/${lh}px ${rc.fontFamily(p.font)};box-shadow:0 30px 70px rgba(0,0,0,.35);overflow:hidden"><div id="${id}-body" style="clip-path:${clip(rc.at<number>("reveal", rc.node.start))}">${body}</div></div>`,
      box: { ...pl.box, width: `${W}px`, height: `${round(H)}px` },
      statics: pl.statics,
      channels,
    };
  },
});

export const uiComponents: ComponentDef[] = [UIMock.def, Card.def, GlassCard.def, Cursor.def, Chip.def, Counter.def, ProgressRing.def, Chart.def, CodeBlock.def];
export { lenPx };
