import { CodeCutError } from "../errors.js";

/**
 * Ease specs: "linear", "expo.out", "power2.inOut", "back.out(1.7)", "elastic.out(1,0.3)",
 * "bounce.out", "steps(5)", "bezier(.2,.8,.2,1)", "spring(180,18)" / "spring(180,18,1)".
 * Named families follow GSAP's equations so a native GSAP tween and our own sampler agree.
 */
export type Ease = string;
export type EaseFn = (p: number) => number;

const PI2 = Math.PI * 2;

type Dir = "in" | "out" | "inOut";
interface Family {
  out: (p: number, args: number[]) => number;
  in?: (p: number, args: number[]) => number;
  gsap?: (dir: Dir, args: number[]) => string;
}

const power = (n: number): Family => ({
  out: (p) => 1 - (1 - p) ** n,
  in: (p) => p ** n,
});

const FAMILIES: Record<string, Family> = {
  sine: {
    out: (p) => Math.sin((p * Math.PI) / 2),
    in: (p) => 1 - Math.cos((p * Math.PI) / 2),
  },
  quad: power(2),
  cubic: power(3),
  quart: power(4),
  quint: power(5),
  power1: power(2),
  power2: power(3),
  power3: power(4),
  power4: power(5),
  // GSAP blends in a p^6 term so the curve lands exactly on 1 (see gsap-core `_insertEase("Expo")`).
  expo: {
    out: (p) => 1 - (2 ** (10 * (-p)) * (1 - p) + (1 - p) ** 6 * p),
    in: (p) => 2 ** (10 * (p - 1)) * p + p ** 6 * (1 - p),
  },
  circ: {
    out: (p) => Math.sqrt(1 - (p - 1) * (p - 1)),
    in: (p) => -(Math.sqrt(1 - p * p) - 1),
  },
  back: {
    out: (p, [s = 1.70158]) => {
      const q = p - 1;
      return q * q * ((s! + 1) * q + s!) + 1;
    },
    in: (p, [s = 1.70158]) => p * p * ((s! + 1) * p - s!),
  },
  elastic: {
    out: (p, [amp = 1, per = 0.3]) => {
      const p1 = amp! >= 1 ? amp! : 1;
      const p2 = per! / (amp! < 1 ? amp! : 1);
      const p3 = (p2 / PI2) * (Math.asin(1 / p1) || 0);
      return p === 1 ? 1 : p1 * 2 ** (-10 * p) * Math.sin(((p - p3) * PI2) / p2) + 1;
    },
  },
  bounce: {
    out: (p) => {
      if (p < 1 / 2.75) return 7.5625 * p * p;
      if (p < 2 / 2.75) {
        const q = p - 1.5 / 2.75;
        return 7.5625 * q * q + 0.75;
      }
      if (p < 2.5 / 2.75) {
        const q = p - 2.25 / 2.75;
        return 7.5625 * q * q + 0.9375;
      }
      const q = p - 2.625 / 2.75;
      return 7.5625 * q * q + 0.984375;
    },
  },
};

const GSAP_NAME: Record<string, string> = {
  sine: "sine",
  quad: "power1",
  cubic: "power2",
  quart: "power3",
  quint: "power4",
  power1: "power1",
  power2: "power2",
  power3: "power3",
  power4: "power4",
  expo: "expo",
  circ: "circ",
  back: "back",
  elastic: "elastic",
  bounce: "bounce",
};

const cache = new Map<string, EaseFn>();

export const clamp01 = (p: number) => (p < 0 ? 0 : p > 1 ? 1 : p);

export function parseEase(spec: Ease): EaseFn {
  const hit = cache.get(spec);
  if (hit) return hit;
  const fn = build(spec.trim());
  cache.set(spec, fn);
  return fn;
}

/** Evaluate an ease at progress p (clamped to 0..1). */
export const ease = (spec: Ease, p: number): number => parseEase(spec)(clamp01(p));

function badEase(spec: string): never {
  throw new CodeCutError("invalid_value", `Unknown ease: ${JSON.stringify(spec)}`, {
    fix: 'Use e.g. "expo.out", "back.out(1.7)", "bezier(.2,.8,.2,1)" or "spring(180,18)".',
  });
}

function nums(s: string | undefined): number[] {
  if (!s) return [];
  return s.split(",").map((x) => Number(x.trim()));
}

function build(spec: string): EaseFn {
  if (spec === "linear" || spec === "none") return (p) => p;
  if (spec === "hold") return (p) => (p >= 1 ? 1 : 0);
  let m: RegExpMatchArray | null;
  if ((m = spec.match(/^steps\(\s*(\d+)\s*\)$/))) {
    const n = Number(m[1]);
    return (p) => (p >= 1 ? 1 : Math.floor(p * n) / n);
  }
  if ((m = spec.match(/^bezier\(([^)]*)\)$/))) {
    const a = nums(m[1]);
    if (a.length !== 4 || a.some((x) => !Number.isFinite(x))) badEase(spec);
    return cubicBezier(a[0]!, a[1]!, a[2]!, a[3]!);
  }
  if ((m = spec.match(/^spring\(([^)]*)\)$/))) {
    const a = nums(m[1]);
    if (a.length < 2 || a.some((x) => !Number.isFinite(x))) badEase(spec);
    return springEase(a[0]!, a[1]!, a[2] ?? 1);
  }
  m = spec.match(/^([a-z]+\d?)(?:\.(in|out|inOut))?(?:\(([^)]*)\))?$/);
  if (!m) badEase(spec);
  const fam = FAMILIES[m![1]!];
  if (!fam) badEase(spec);
  const dir = (m![2] ?? "out") as Dir;
  const args = nums(m![3]);
  // GSAP's elastic.inOut defaults to a 0.45 period while in/out default to 0.3.
  if (m![1] === "elastic" && dir === "inOut" && args[1] === undefined) {
    args[0] ??= 1;
    args[1] = 0.45;
  }
  const out = (p: number) => fam!.out(p, args);
  const inn = fam!.in ? (p: number) => fam!.in!(p, args) : (p: number) => 1 - out(1 - p);
  if (dir === "out") return out;
  if (dir === "in") return inn;
  return (p) => (p < 0.5 ? (1 - out(1 - p * 2)) / 2 : 0.5 + out((p - 0.5) * 2) / 2);
}

/** CSS-style cubic bezier easing (x monotonic), Newton + bisection. */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): EaseFn {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sy = (t: number) => ((ay * t + by) * t + cy) * t;
  const dx = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const err = sx(t) - x;
      if (Math.abs(err) < 1e-7) return sy(t);
      const d = dx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= err / d;
    }
    let lo = 0;
    let hi = 1;
    t = x;
    for (let i = 0; i < 40; i++) {
      const v = sx(t);
      if (Math.abs(v - x) < 1e-7) break;
      if (v < x) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
    return sy(t);
  };
}

/** Damped spring step response from 0 to 1 at real time t (seconds). Analytic, no integration. */
export function springValue(t: number, stiffness: number, damping: number, mass = 1): number {
  if (t <= 0) return 0;
  const w0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  if (zeta < 1) {
    const wd = w0 * Math.sqrt(1 - zeta * zeta);
    return 1 - Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + ((zeta * w0) / wd) * Math.sin(wd * t));
  }
  if (zeta === 1) return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
  const s = Math.sqrt(zeta * zeta - 1);
  const r1 = -w0 * (zeta - s);
  const r2 = -w0 * (zeta + s);
  return 1 - (r2 * Math.exp(r1 * t) - r1 * Math.exp(r2 * t)) / (r2 - r1);
}

const settleCache = new Map<string, number>();

/** Time in seconds until the spring stays within 0.1% of its target. */
export function springSettleTime(stiffness: number, damping: number, mass = 1): number {
  const key = `${stiffness}/${damping}/${mass}`;
  const hit = settleCache.get(key);
  if (hit !== undefined) return hit;
  const step = 0.002;
  let last = 0;
  for (let t = 0; t < 30; t += step) {
    if (Math.abs(springValue(t, stiffness, damping, mass) - 1) > 0.001) last = t;
  }
  const out = last + step;
  settleCache.set(key, out);
  return out;
}

/** Normalised spring: progress 0..1 maps onto the spring's own settle time. */
export function springEase(stiffness: number, damping: number, mass = 1): EaseFn {
  const ts = springSettleTime(stiffness, damping, mass);
  return (p) => (p <= 0 ? 0 : p >= 1 ? 1 : springValue(p * ts, stiffness, damping, mass));
}

/** The equivalent native GSAP ease string, or null when we must sample instead. */
export function toGsapEase(spec: Ease): string | null {
  const s = spec.trim();
  if (s === "linear" || s === "none") return "none";
  const m = s.match(/^([a-z]+\d?)(?:\.(in|out|inOut))?(?:\(([^)]*)\))?$/);
  if (!m) return null;
  const g = GSAP_NAME[m[1]!];
  if (!g) return null;
  const dir = m[2] ?? "out";
  const args = m[3] !== undefined ? `(${m[3]})` : "";
  return `${g}.${dir}${args}`;
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
export const smoothstep = (e0: number, e1: number, x: number) => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};
export const remap = (v: number, inLo: number, inHi: number, outLo: number, outHi: number) =>
  outLo + ((v - inLo) / (inHi - inLo)) * (outHi - outLo);
