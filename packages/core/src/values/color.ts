import { FlomotionError } from "../errors.js";

/** "#ff3366", "rgb(...)", "oklch(0.7 0.2 20)", or a "$token" resolved by the theme. */
export type Color = string;

/** sRGB, channels 0..255, alpha 0..1. */
export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export function parseColor(input: string): RGBA {
  const s = input.trim().toLowerCase();
  if (s.startsWith("$")) {
    throw new FlomotionError("invalid_value", `Unresolved color token ${input}`, {
      fix: "Define the token in the Theme/Look or resolve the project first.",
    });
  }
  let m: RegExpMatchArray | null;
  if ((m = s.match(/^#([0-9a-f]{3,8})$/))) {
    let h = m[1]!;
    if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join("");
    if (h.length !== 6 && h.length !== 8) throw badColor(input);
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1,
    };
  }
  if ((m = s.match(/^rgba?\(([^)]+)\)$/))) {
    const p = m[1]!.split(/[\s,/]+/).filter(Boolean);
    const ch = (v: string) => (v.endsWith("%") ? (parseFloat(v) / 100) * 255 : parseFloat(v));
    if (p.length < 3) throw badColor(input);
    const a =
      p[3] === undefined ? 1 : p[3].endsWith("%") ? parseFloat(p[3]) / 100 : parseFloat(p[3]);
    return { r: ch(p[0]!), g: ch(p[1]!), b: ch(p[2]!), a };
  }
  if ((m = s.match(/^oklch\(([^)]+)\)$/))) {
    const [body, alpha] = m[1]!.split("/").map((x) => x.trim()) as [string, string?];
    const p = body.split(/\s+/);
    if (p.length < 3) throw badColor(input);
    const L = p[0]!.endsWith("%") ? parseFloat(p[0]!) / 100 : parseFloat(p[0]!);
    const C = parseFloat(p[1]!);
    const H = parseFloat(p[2]!.replace("deg", ""));
    const c = oklchToRgb(L, C, H);
    return {
      ...c,
      a:
        alpha === undefined ? 1 : alpha.endsWith("%") ? parseFloat(alpha) / 100 : parseFloat(alpha),
    };
  }
  if (s === "transparent") return { r: 0, g: 0, b: 0, a: 0 };
  const named = NAMED[s];
  if (named) return parseColor(named);
  throw badColor(input);
}

const NAMED: Record<string, string> = {
  black: "#000000",
  white: "#ffffff",
  red: "#ff0000",
  green: "#008000",
  blue: "#0000ff",
  yellow: "#ffff00",
  gray: "#808080",
  grey: "#808080",
};

function badColor(input: string) {
  return new FlomotionError("invalid_value", `Invalid color: ${JSON.stringify(input)}`, {
    fix: 'Use "#rrggbb", "rgb(...)", "oklch(L C H)" or a "$token".',
  });
}

function oklchToRgb(L: number, C: number, hDeg: number): { r: number; g: number; b: number } {
  const h = (hDeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  const enc = (v: number) => {
    const c = clamp(v, 0, 1);
    return 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
  };
  return { r: enc(lin[0]!), g: enc(lin[1]!), b: enc(lin[2]!) };
}

const hex2 = (n: number) =>
  Math.round(clamp(n, 0, 255))
    .toString(16)
    .padStart(2, "0");

export function toHex(c: RGBA): string {
  return `#${hex2(c.r)}${hex2(c.g)}${hex2(c.b)}${c.a < 1 ? hex2(c.a * 255) : ""}`;
}

export function toCss(c: RGBA): string {
  if (c.a >= 1) return `rgb(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)})`;
  return `rgba(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)}, ${+c.a.toFixed(4)})`;
}

export function lerpColor(a: RGBA, b: RGBA, t: number): RGBA {
  return {
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
    a: a.a + (b.a - a.a) * t,
  };
}

/** WCAG relative luminance of an opaque sRGB color. */
export function luminance(c: RGBA): number {
  const f = (v: number) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
}

export function contrastRatio(a: RGBA, b: RGBA): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}
