import { evalSignal, signalSpan, type Signal } from "../anim/signal.js";

/** Sample rate for baked channels: the smallest multiple of fps that is at least 60 Hz. */
export function bakeHz(fps: number): number {
  let hz = fps;
  while (hz < 60) hz += fps;
  return hz;
}

export type Sample = number | string;

export interface BakedChannel {
  target: string;
  prop: string;
  /** Absolute time of samples[0]. */
  t0: number;
  hz: number;
  samples: Sample[];
  unit?: string;
}

export interface StaticValue {
  target: string;
  prop: string;
  value: Sample;
  unit?: string;
}

export interface BakeOutcome {
  baked?: BakedChannel;
  static?: StaticValue;
}

const round = (v: number) => Math.round(v * 10000) / 10000;

/**
 * Decide how a signal reaches the page: a constant becomes a one-off style; anything that varies is
 * sampled at `hz` over the interval it can change and held outside it.
 */
export function bakeSignal(
  target: string,
  prop: string,
  sig: Signal,
  elementSpan: [number, number],
  hz: number,
  opts: { unit?: string; format?: (v: any) => string } = {},
): BakeOutcome {
  const fmt = (v: unknown): Sample => (opts.format ? opts.format(v) : typeof v === "number" ? round(v) : String(v));
  const span = signalSpan(sig, elementSpan);
  if (!span) {
    return { static: { target, prop, value: fmt(evalSignal(sig, elementSpan[0])), unit: opts.unit } };
  }
  const t0 = Math.floor(span[0] * hz + 1e-9) / hz;
  const n = Math.max(2, Math.ceil((span[1] - t0) * hz - 1e-9) + 1);
  const samples: Sample[] = new Array(n);
  for (let i = 0; i < n; i++) samples[i] = fmt(evalSignal(sig, t0 + i / hz));
  // trim a constant run at both ends so we keep only the part that changes
  let a = 0;
  let b = n - 1;
  while (a < b && samples[a + 1] === samples[a]) a++;
  while (b > a && samples[b - 1] === samples[b]) b--;
  if (a === b) {
    return { static: { target, prop, value: samples[a]!, unit: opts.unit } };
  }
  const kept = samples.slice(a, b + 1);
  return {
    baked: { target, prop, t0: round(t0 + a / hz), hz, samples: kept, unit: opts.unit },
    static: { target, prop, value: samples[0]!, unit: opts.unit },
  };
}
