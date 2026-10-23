import {
  isNode,
  walk,
  type AudioEvent,
  type CCNode,
  type IRLayer,
  type LintIssue,
  type Ledger,
  type SoundCue,
} from "@codecut/core";
import { paginateWords } from "@codecut/components";
import type { LicenseReport } from "@codecut/render";

export type CheckStatus = "pass" | "fail" | "warn" | "manual" | "skipped";

export interface CheckResult {
  n: number;
  id: string;
  title: string;
  status: CheckStatus;
  detail: string;
  /** What to change when it fails. */
  fix?: string;
  /** True when code decided it; false when the contact sheet still needs a human or a second look. */
  auto: boolean;
}

/** Output of `hyperframes check --json` that the review reads (layout and contrast are measured in a real page). */
export interface HfCheck {
  layout?: {
    findings: Array<{
      code: string;
      severity: string;
      message: string;
      time?: number;
      text?: string;
    }>;
  };
  contrast?: {
    findings: Array<{
      code: string;
      severity: string;
      message: string;
      ratio?: number;
      text?: string;
      time?: number;
      large?: boolean;
    }>;
  };
}

export interface MixFacts {
  lufs?: number;
  truePeak?: number;
  targetLufs: number;
  duckAmount: number;
  events: Array<{ bus: AudioEvent["bus"]; gainDb: number }>;
}

export interface ReviewInput {
  tree: CCNode;
  fps: number;
  duration: number;
  ir: IRLayer;
  sounds: SoundCue[];
  audio: AudioEvent[];
  lint: LintIssue[];
  ledger: Ledger;
  license: LicenseReport;
  mix?: MixFacts;
  hf?: HfCheck;
  words?: Map<string, Array<{ w: string; start: number; end: number }>>;
}

export const CHECKLIST: Array<{ n: number; id: string; title: string }> = [
  { n: 1, id: "frame0-motion", title: "Frame 0 has motion" },
  { n: 2, id: "hero-carries", title: "A hero element carries across 4+ beats" },
  { n: 3, id: "new-every-2s", title: "Something new at least every 2 s" },
  { n: 4, id: "no-static-frame", title: "No static frame longer than 0.5 s" },
  { n: 5, id: "voice-sync", title: "Every spoken word on screen is in sync with the voice" },
  { n: 6, id: "numbers-add-up", title: "Numbers shown add up" },
  { n: 7, id: "no-overlap-clip", title: "No overlapping or clipped text" },
  { n: 8, id: "safe-area", title: "All text inside the SafeArea for the format" },
  { n: 9, id: "contrast", title: "Contrast of text against its background passes" },
  { n: 10, id: "impact-sound", title: "Every impact effect has a sound on its frame" },
  { n: 11, id: "voice-on-top", title: "Voice is always on top in the mix" },
  { n: 12, id: "loudness", title: "Loudness within target" },
  { n: 13, id: "transitions-intent", title: "Transitions are used with intent" },
  { n: 14, id: "look-consistent", title: "Looks and type are consistent with the chosen Look" },
  { n: 15, id: "captions-readable", title: "Captions readable (line length, reading speed)" },
  { n: 16, id: "assets-ledger", title: "All assets have ledger entries" },
  { n: 17, id: "credits", title: "CC-BY credits are present in the license report" },
];

// ---------- motion analysis of the compiled IR ----------

export interface Activity {
  /** Intervals where something changes on screen. */
  moving: Array<[number, number]>;
  /** Moments a visible layer appears or disappears. */
  events: number[];
}

const flatten = (l: IRLayer, out: IRLayer[] = []): IRLayer[] => {
  out.push(l);
  l.children.forEach((c) => flatten(c, out));
  return out;
};

/** What moves and when, read from the baked channels (no rendering). */
export function activityOf(ir: IRLayer, fps: number): Activity {
  const moving: Array<[number, number]> = [];
  const events: number[] = [];
  for (const l of flatten(ir)) {
    if (l.kind === "hidden") continue;
    if (l.kind === "layer") events.push(l.start);
    if (l.kind === "layer" && /^(Video|Clip)$/.test(l.name)) moving.push([l.start, l.end]);
    for (const b of l.baked ?? []) {
      const s = b.samples;
      let from = -1;
      for (let i = 1; i < s.length; i++) {
        const changed = s[i] !== s[i - 1];
        if (changed && from < 0) from = i - 1;
        if (!changed && from >= 0) {
          moving.push([b.t0 + from / b.hz, b.t0 + i / b.hz]);
          from = -1;
        }
      }
      if (from >= 0) moving.push([b.t0 + from / b.hz, b.t0 + (s.length - 1) / b.hz]);
    }
  }
  void fps;
  return { moving, events: events.sort((a, b) => a - b) };
}

/** Stretches with nothing changing on screen, longer than `min` seconds. */
export function staticGaps(
  a: Activity,
  duration: number,
  fps: number,
  min = 0.5,
): Array<[number, number]> {
  const step = 1 / fps;
  const n = Math.ceil(duration * fps);
  const live = new Uint8Array(n);
  const mark = (t0: number, t1: number) => {
    const i0 = Math.max(0, Math.floor(t0 * fps - 1e-6));
    const i1 = Math.min(n - 1, Math.ceil(t1 * fps + 1e-6));
    for (let i = i0; i <= i1; i++) live[i] = 1;
  };
  a.moving.forEach(([x, y]) => mark(x, y));
  a.events.forEach((t) => mark(t - step, t + step));
  const gaps: Array<[number, number]> = [];
  let from = -1;
  for (let i = 0; i <= n; i++) {
    const idle = i < n && !live[i];
    if (idle && from < 0) from = i;
    if (!idle && from >= 0) {
      const len = (i - from) / fps;
      if (len > min + 1e-9) gaps.push([round(from / fps), round(i / fps)]);
      from = -1;
    }
  }
  return gaps;
}

const round = (n: number) => Math.round(n * 100) / 100;
const list = (xs: string[], max = 6) =>
  xs.length > max ? `${xs.slice(0, max).join(", ")} (+${xs.length - max} more)` : xs.join(", ");

const findAll = (tree: CCNode, names: string[]): CCNode[] => {
  const out: CCNode[] = [];
  walk(tree, (n) => {
    if (names.includes(n.name)) out.push(n);
  });
  return out;
};

const lintHits = (issues: LintIssue[], rules: string[]) =>
  issues.filter((i) => rules.includes(i.rule));

// ---------- the checklist ----------

/** Run the 17-item checklist on facts. Pure: the same input gives the same result. */
export function runChecklist(input: ReviewInput, only?: number[]): CheckResult[] {
  const act = activityOf(input.ir, input.fps);
  const out: CheckResult[] = [];
  const add = (n: number, status: CheckStatus, detail: string, fix?: string, auto = true) => {
    const c = CHECKLIST[n - 1]!;
    out.push({ n, id: c.id, title: c.title, status, detail, fix, auto });
  };
  const scenes = findAll(input.tree, ["Scene"]);
  const voices = findAll(input.tree, ["Voiceover"]);
  const captions = findAll(input.tree, ["Captions"]);

  // 1
  {
    const early = act.moving.some(([a, b]) => a <= 0.1 && b > a);
    add(
      1,
      early ? "pass" : "fail",
      early ? "Something is already moving in the first 0.1 s." : "Nothing moves at the start.",
      "Start an enter animation or a slow push at 0 s so the first frame is not a still.",
    );
  }
  // 2
  {
    const layers = flatten(input.ir).filter((l) => l.kind === "layer" && l.end - l.start > 0);
    const sceneSpans = scenes.map((s) => ({
      id: String(s.props.id),
      layer: flatten(input.ir).find((l) => l.id === s.props.id),
    }));
    const beats = sceneSpans.filter((s) => s.layer).length;
    const carriers = layers.filter((l) => {
      if (/^(Scene|Track|Composition)$/.test(l.name)) return false;
      const crossed = sceneSpans.filter(
        (s) => s.layer && l.start < s.layer.end - 1e-6 && l.end > s.layer.start + 1e-6,
      );
      return crossed.length >= 4;
    });
    if (beats < 4)
      add(2, "skipped", `Only ${beats} scene(s): fewer than 4 beats.`, undefined, true);
    else if (carriers.length)
      add(2, "pass", `Carries across 4+ scenes: ${list(carriers.map((c) => "#" + c.id))}.`);
    else
      add(
        2,
        "manual",
        "No single layer spans 4 scenes. If a hero (logo, product shape, colour) is re-created per scene, confirm on the contact sheet that it is clearly the same one.",
        "Move the hero out of the scenes onto its own track, or repeat it with the same look in each beat.",
        false,
      );
  }
  // 3
  {
    const times = [...act.events, ...act.moving.map(([a]) => a)].sort((a, b) => a - b);
    let worst = 0;
    let at = 0;
    let prev = 0;
    for (const t of [...times, input.duration]) {
      if (t - prev > worst) {
        worst = t - prev;
        at = prev;
      }
      prev = Math.max(prev, t);
    }
    add(
      3,
      worst <= 2.0 + 1e-6 ? "pass" : "fail",
      `Longest wait for something new: ${round(worst)} s${worst > 2 ? ` from ${round(at)} s` : ""}.`,
      `Add a new element, a cut or a visible change around ${round(at + 1.5)} s.`,
    );
  }
  // 4
  {
    const gaps = staticGaps(act, input.duration, input.fps);
    add(
      4,
      gaps.length ? "fail" : "pass",
      gaps.length
        ? `Static for more than 0.5 s: ${list(gaps.map(([a, b]) => `${a}-${b}s`))}.`
        : "Something changes at least every 0.5 s.",
      "Add a slow push (scale 1 to 1.06), a drift, a pulse or a stagger inside the gap.",
    );
  }
  // 5
  {
    if (!voices.length) add(5, "skipped", "No Voiceover.");
    else if (captions.length)
      add(
        5,
        "pass",
        "Captions are driven by the voice word timings, so spoken words and caption words match by construction. Other on-screen words still need a look.",
        undefined,
        false,
      );
    else
      add(
        5,
        "manual",
        "There is a Voiceover but no Captions. Key words on screen must appear when they are spoken.",
        "Use align_to_voice to start those elements on their word.",
        false,
      );
  }
  // 6
  {
    const nums: string[] = [];
    for (const c of findAll(input.tree, ["Counter"]))
      nums.push(`#${c.props.id}: ${c.props.from ?? 0} → ${c.props.to}`);
    for (const c of findAll(input.tree, ["Chart"]))
      nums.push(
        `#${c.props.id}: ${JSON.stringify(c.props.data ?? c.props.values ?? "").slice(0, 60)}`,
      );
    add(
      6,
      nums.length ? "manual" : "skipped",
      nums.length
        ? `Check the arithmetic yourself: ${list(nums)}. Percentages, totals and chart values must agree with the script.`
        : "No Counter or Chart elements.",
      undefined,
      false,
    );
  }
  // 7
  {
    if (!input.hf)
      add(
        7,
        "manual",
        "Not measured (layout check skipped). Look for overlapping or cut-off text on the contact sheet.",
        undefined,
        false,
      );
    else {
      const f = input.hf.layout?.findings ?? [];
      const bad = f.filter((x) => x.severity === "error");
      add(
        7,
        bad.length ? "fail" : f.length ? "warn" : "pass",
        f.length
          ? list(
              f.map((x) => `${x.message}${x.time !== undefined ? ` @${x.time}s` : ""}`),
              4,
            )
          : "No overlap or clipping found at the sampled times.",
        "Shorten the text, lower the size, or move one of the elements.",
      );
    }
  }
  // 8
  {
    const hits = lintHits(input.lint, ["text-outside-safe-area"]);
    add(
      8,
      hits.length ? "fail" : "pass",
      hits.length
        ? list(hits.map((h) => `#${h.id}`)) + " leave the safe area."
        : "All text is inside the safe area.",
      hits[0]?.fix ?? "Move the text inside <SafeArea preset=…>.",
    );
  }
  // 9
  {
    const lintHit = lintHits(input.lint, ["text-contrast"]);
    const hf = input.hf?.contrast?.findings ?? [];
    const worse = hf.filter(
      (x) => x.severity === "error" || (x.ratio !== undefined && x.ratio < 2.5),
    );
    const bad = lintHit.length + worse.length;
    const warn = hf.length - worse.length;
    add(
      9,
      bad ? "fail" : warn ? "warn" : "pass",
      bad || warn
        ? list(
            [
              ...lintHit.map((h) => `#${h.id}: ${h.message}`),
              ...hf.map((x) => `"${x.text}" ${x.ratio}:1 @${x.time}s`),
            ],
            4,
          )
        : input.hf
          ? "Contrast passes at the sampled times."
          : "Contrast passes by the static lint (the rendered check was skipped).",
      "Use a lighter or darker colour, or put a card or scrim behind the text.",
    );
  }
  // 10
  {
    const cues = input.sounds.filter((c) => c.tag);
    const sfx = input.audio.filter((a) => a.bus === "sfx");
    const missing = cues.filter((c) => !sfx.some((a) => Math.abs(a.start - c.at) <= 0.1));
    add(
      10,
      !cues.length ? "skipped" : missing.length ? "fail" : "pass",
      !cues.length
        ? "No impact effect asks for a sound."
        : missing.length
          ? `No sound lands on: ${list(missing.map((m) => `${m.source} @${round(m.at)}s (${m.tag})`))}.`
          : `All ${cues.length} impact cue(s) have a sound within 0.1 s.`,
      "Run sound_auto, or add <Sound at=… peak=… /> on that frame.",
    );
  }
  // 11
  {
    const m = input.mix;
    const voice = m?.events.filter((e) => e.bus === "voice") ?? [];
    if (!m || !voice.length) add(11, "skipped", m ? "No voice in the mix." : "No mix was built.");
    else {
      const music = m.events.filter((e) => e.bus === "music");
      const voiceGain = Math.min(...voice.map((v) => v.gainDb));
      const problems: string[] = [];
      if (music.length && m.duckAmount < 6)
        problems.push(`music ducks only ${m.duckAmount} dB (need 6 or more)`);
      const hot = music.filter((e) => e.gainDb - m.duckAmount > voiceGain);
      if (hot.length)
        problems.push(`${hot.length} music event(s) stay louder than the voice even when ducked`);
      const loudSfx = m.events.filter((e) => e.bus === "sfx" && e.gainDb > voiceGain + 6);
      if (loudSfx.length)
        problems.push(`${loudSfx.length} sound effect(s) are set more than 6 dB above the voice`);
      add(
        11,
        problems.length ? "fail" : "pass",
        problems.length
          ? problems.join("; ") + "."
          : `Music ducks ${m.duckAmount} dB under the voice and no bus is set far above it. (Gains are compared, not heard.)`,
        "Lower music/sfx gain or raise duckAmount.",
      );
    }
  }
  // 12
  {
    const m = input.mix;
    if (!m || m.lufs === undefined)
      add(12, "skipped", m ? "Loudness could not be measured." : "No mix was built.");
    else {
      const off = m.lufs - m.targetLufs;
      const tp = m.truePeak !== undefined && m.truePeak > -1;
      add(
        12,
        Math.abs(off) <= 1.5 && !tp ? "pass" : "fail",
        `Integrated ${m.lufs} LUFS against ${m.targetLufs} (${off >= 0 ? "+" : ""}${round(off)} LU)${m.truePeak !== undefined ? `, peak ${m.truePeak} dBFS` : ""}.`,
        "Adjust gains or the export preset target; the master is normalised on render.",
      );
    }
  }
  // 13
  {
    const types = new Set<string>();
    for (const s of scenes) {
      const t = s.props.transition as unknown;
      if (t && typeof t === "object" && "type" in (t as object))
        types.add(String((t as { type: unknown }).type));
      else if (typeof t === "string") types.add(t);
    }
    types.delete("cut");
    add(
      13,
      types.size > 2 ? "warn" : "manual",
      types.size
        ? `Transitions used: ${[...types].join(", ")}. ${types.size > 2 ? "That is a lot of different ones; pick the Look's signature transition and keep to it." : "Each should say something (a jump in time, a contrast), not decorate."}`
        : "All scenes cut. That is fine if the cuts land on the beat.",
      "Use one signature transition and a hard cut elsewhere.",
      false,
    );
  }
  // 14
  {
    const theme = String(input.tree.props.theme ?? "");
    const fonts = lintHits(input.lint, ["too-many-font-families", "system-font"]);
    add(
      14,
      !theme ? "warn" : fonts.length ? "warn" : "manual",
      !theme
        ? "The Composition has no theme/Look, so colours and type are not tied to one."
        : fonts.length
          ? list(fonts.map((f) => f.message))
          : `Theme ${theme}. Confirm on the contact sheet that colours, type and motion belong to it.`,
      "Set theme on the Composition and use $brand.* colours and $type.* styles.",
      false,
    );
  }
  // 15
  {
    if (!captions.length)
      add(
        15,
        voices.length ? "warn" : "skipped",
        voices.length ? "There is a voice but no captions." : "No captions.",
      );
    else {
      const probs: string[] = [];
      for (const c of captions) {
        const w = input.words?.get(String(c.props.voice).replace(/^#/, ""));
        const maxChars = Number(c.props.maxChars ?? 22);
        if (maxChars > 32)
          probs.push(`#${c.props.id}: ${maxChars} chars per line is too long (max 32)`);
        if (!w) continue;
        const pages = paginateWords(w, {
          maxChars,
          maxWords: Number(c.props.maxWords ?? 4),
          mode: c.props.captionStyle === "word" ? "word" : "line",
        });
        for (const pg of pages) {
          const chars = pg.words.map((x) => x.w).join(" ").length;
          const secs = Math.max(0.05, pg.end - pg.start + Number(c.props.hold ?? 0.15));
          if (c.props.captionStyle !== "word" && chars / secs > 21)
            probs.push(
              `#${c.props.id}: "${pg.words.map((x) => x.w).join(" ")}" reads at ${round(chars / secs)} chars/s (max 21)`,
            );
        }
      }
      add(
        15,
        probs.length ? "fail" : "pass",
        probs.length ? list(probs, 4) : "Line lengths and reading speed are within limits.",
        "Lower maxChars/maxWords or lengthen the hold.",
      );
    }
  }
  // 16
  {
    const hits = lintHits(input.lint, [
      "asset-no-ledger",
      "license-blocked",
      "asset-missing",
      "font-no-ledger",
      "font-unknown-license",
    ]);
    const problems = [
      ...hits.map((h) => h.message),
      ...input.license.problems.filter((p) => /no ledger entry/.test(p)),
    ];
    const uniq = [...new Set(problems)];
    const rights = input.license.problems.filter((p) => !/no ledger entry/.test(p));
    const own = input.license.own.length
      ? ` ${input.license.own.length} file(s) you supplied yourself need no entry; the rights are yours to confirm.`
      : "";
    add(
      16,
      uniq.length ? "fail" : rights.length ? "warn" : "pass",
      uniq.length
        ? list(uniq, 4)
        : rights.length
          ? `${list(rights, 3)}. Confirm your plan or licence allows this use.`
          : `Every downloaded sound, voice and font in use has a ledger entry (${input.license.used.length}).${own}`,
      "Fetch sounds with sound_get and fonts with font_get so they are recorded.",
    );
  }
  // 17
  {
    const att = input.license.attribution;
    if (!att.length) add(17, "pass", "No asset needs attribution.");
    else {
      const bad = att.filter((e) => !e.author || e.author === "unknown");
      add(
        17,
        bad.length || !input.license.credits ? "fail" : "pass",
        bad.length
          ? `Missing author for ${list(bad.map((b) => `${b.source}:${b.id}`))}.`
          : `${att.length} credit(s) will be written to credits.txt on render.`,
        "Add the author to the ledger entry; re-run sound_get.",
      );
    }
  }
  void isNode;
  return only?.length ? out.filter((r) => only.includes(r.n)) : out;
}

export interface ReviewSummary {
  pass: boolean;
  failing: number[];
  warnings: number[];
  needsEyes: number[];
}

export function summarize(results: CheckResult[]): ReviewSummary {
  return {
    pass: !results.some((r) => r.status === "fail"),
    failing: results.filter((r) => r.status === "fail").map((r) => r.n),
    warnings: results.filter((r) => r.status === "warn").map((r) => r.n),
    needsEyes: results.filter((r) => r.status === "manual" || !r.auto).map((r) => r.n),
  };
}
