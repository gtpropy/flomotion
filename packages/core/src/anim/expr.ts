import { CodeCutError } from "../errors.js";
import { clamp, lerp, remap, smoothstep, springSettleTime, springValue } from "../values/ease.js";
import { noise1D } from "../values/noise.js";
import type { Ctx, Expr } from "./types.js";

export interface CtxBase {
  fps: number;
  /** Resolve "#id.prop" at time t. */
  prop?: (ref: string, t: number) => unknown;
  beat?: (n: number) => number;
  word?: (voiceId: string, i: number) => { w: string; start: number; end: number };
}

/** Build the expression context for a given local time. Pure: no hidden state. */
export function makeCtx(base: CtxBase, t: number, value?: unknown): Ctx {
  return {
    t,
    fps: base.fps,
    value,
    prop: (ref) => {
      if (!base.prop) {
        throw new CodeCutError("unresolved_ref", `ctx.prop(${JSON.stringify(ref)}) is not available here`);
      }
      return base.prop(ref, t);
    },
    noise: (seed = 1, freq = 1) => noise1D(t * freq, seed),
    beat: (n) => {
      if (!base.beat) throw new CodeCutError("unresolved_ref", "ctx.beat needs a tempo or beat map");
      return base.beat(n);
    },
    word: (voiceId, i) => {
      if (!base.word) throw new CodeCutError("unresolved_ref", "ctx.word needs a Voiceover with timings");
      return base.word(voiceId, i);
    },
    lerp,
    clamp,
    smoothstep,
    remap,
    spring: (tt, o = {}) => {
      const k = o.stiffness ?? 180;
      const c = o.damping ?? 18;
      const m = o.mass ?? 1;
      return tt >= springSettleTime(k, c, m) ? 1 : springValue(tt, k, c, m);
    },
  };
}

export const isExpr = (x: unknown): x is Expr<unknown> => typeof x === "function";

export interface PurityIssue {
  rule: string;
  message: string;
}

const FORBIDDEN: Array<[RegExp, string, string]> = [
  [/\bMath\.random\b/, "Math.random", "Use ctx.noise(seed, freq) or a seeded PRNG (mulberry32)."],
  [/\bDate\.now\b|\bnew\s+Date\b|\bDate\s*\(/, "Date", "Time comes from the `t` argument."],
  [/\bperformance\.now\b/, "performance.now", "Time comes from the `t` argument."],
  [/\brequestAnimationFrame\b|\bcancelAnimationFrame\b/, "requestAnimationFrame", "Animation is seeked, never frame-driven."],
  [/\bsetTimeout\b|\bsetInterval\b|\bsetImmediate\b|\bqueueMicrotask\b/, "timers", "No timers: values are pure functions of t."],
  [/\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b|\bEventSource\b/, "network", "No network access at render time."],
  [/\bcrypto\.getRandomValues\b|\bcrypto\.randomUUID\b/, "crypto.random", "Use a seeded PRNG."],
  [/\bprocess\.\w+/, "process", "No ambient process state."],
  [/\b(?:window|document|globalThis|self|localStorage|sessionStorage)\b/, "global state", "No access to globals."],
  [/\bimport\s*\(/, "dynamic import", "Expressions cannot import."],
];

/**
 * Static purity check of an expression's source text. Catches the nondeterministic APIs listed in
 * the spec plus assignments to identifiers declared outside the function (mutable globals).
 */
export function checkPurity(fn: (...a: any[]) => unknown): PurityIssue[] {
  const src = Function.prototype.toString.call(fn);
  const issues: PurityIssue[] = [];
  const stripped = stripStringsAndComments(src);
  for (const [re, rule, hint] of FORBIDDEN) {
    if (re.test(stripped)) issues.push({ rule, message: `Impure expression uses ${rule}. ${hint}` });
  }
  const outer = findOuterAssignments(stripped);
  for (const name of outer) {
    issues.push({
      rule: "mutable-closure",
      message: `Impure expression assigns to "${name}", which is declared outside the function. Keep state out of expressions.`,
    });
  }
  return issues;
}

function stripStringsAndComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\/\/[^\n]*/g, " ")
    .replace(/`(?:\\.|[^`\\])*`/g, "``")
    .replace(/"(?:\\.|[^"\\])*"/g, '""')
    .replace(/'(?:\\.|[^'\\])*'/g, "''");
}

/** Identifiers assigned (`x = `, `x += `, `x++`) that are not declared inside the function text. */
function findOuterAssignments(src: string): string[] {
  const declared = new Set<string>();
  // params: (a, b) => or function(a,b)
  const paramMatch = src.match(/^[^(]*\(([^)]*)\)/) ?? src.match(/^\s*(\w+)\s*=>/);
  if (paramMatch?.[1]) {
    for (const p of paramMatch[1].split(/[,\s{}[\]=:.]+/)) if (/^[A-Za-z_$][\w$]*$/.test(p)) declared.add(p);
  }
  for (const m of src.matchAll(/\b(?:const|let|var)\s+([^;=]+?)(?==|;|\bof\b|\bin\b|$)/g)) {
    for (const p of m[1]!.split(/[,\s{}[\]:]+/)) if (/^[A-Za-z_$][\w$]*$/.test(p)) declared.add(p);
  }
  for (const m of src.matchAll(/\bfor\s*\(\s*(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g)) declared.add(m[1]!);
  for (const m of src.matchAll(/\(([^()]*)\)\s*=>|\b([A-Za-z_$][\w$]*)\s*=>/g)) {
    for (const p of (m[1] ?? m[2] ?? "").split(/[,\s{}[\]=:.]+/)) if (/^[A-Za-z_$][\w$]*$/.test(p)) declared.add(p);
  }
  const bad = new Set<string>();
  for (const m of src.matchAll(/(?<![\w$.])([A-Za-z_$][\w$]*)\s*(?:[-+*/%&|^]|\*\*|<<|>>>?|&&|\|\||\?\?)?=(?![=>])/g)) {
    if (!declared.has(m[1]!)) bad.add(m[1]!);
  }
  for (const m of src.matchAll(/(?<![\w$.])([A-Za-z_$][\w$]*)\s*(?:\+\+|--)|(?:\+\+|--)\s*([A-Za-z_$][\w$]*)/g)) {
    const n = m[1] ?? m[2]!;
    if (!declared.has(n)) bad.add(n);
  }
  // member assignment on an outer object: `state.n = 1`, `cache[k] = v`
  for (const m of src.matchAll(/(?<![\w$.])([A-Za-z_$][\w$]*)(?:\.[\w$]+|\[[^\]]*\])+\s*(?:[-+*/%&|^]|\*\*|<<|>>>?|&&|\|\||\?\?)?=(?![=>])/g)) {
    if (!declared.has(m[1]!)) bad.add(m[1]!);
  }
  return [...bad];
}
