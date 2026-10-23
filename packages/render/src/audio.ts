import { execFile } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname } from "node:path";
import { promisify } from "node:util";
import { CodeCutError, type AudioEvent, type Ledger } from "@codecut/core";
import { requireFfmpeg } from "./env.js";
import { probeMedia } from "./media-probe.js";

const run = promisify(execFile);

export interface MixOptions {
  root: string;
  events: AudioEvent[];
  resolveSrc: (src: string) => string;
  ledger: Ledger;
  /** Length of the output in seconds. */
  duration: number;
  outFile: string;
  /** How far music drops under voice, in dB (approximate: sets the compressor ratio). Default 12. */
  duckAmount?: number;
  /** Integrated loudness target of the master (export preset). Default -14 LUFS. */
  targetLufs?: number;
  truePeak?: number;
}

export interface ResolvedEvent {
  id: string;
  bus: AudioEvent["bus"];
  src: string;
  file: string;
  /** Where the clip starts in the mix, after peak alignment. */
  startAt: number;
  mediaStart: number;
  duration: number;
  gainDb: number;
  peakOffset: number;
  landsAt: number;
}

export interface MixResult {
  file: string;
  events: ResolvedEvent[];
  duckAmount: number;
  targetLufs: number;
  /** Measured integrated loudness of the result. */
  lufs?: number;
  truePeak?: number;
  filtergraph: string;
}

/** Seconds from a sound's start to its loudest moment: a number, or a named peak from the ledger / sidecar. */
export function peakOffsetOf(ev: AudioEvent, ledger: Ledger, file: string): number {
  if (ev.peak === undefined) return 0;
  if (typeof ev.peak === "number") return ev.peak;
  const entry = ledger.entries.find((e) => e.file && file.endsWith(e.file));
  if (entry && typeof entry.peak === "object" && entry.peak && ev.peak in entry.peak) return entry.peak[ev.peak]!;
  if (entry && typeof entry.peak === "number") return entry.peak;
  const side = `${file}.peak.json`;
  if (existsSync(side)) {
    const j = JSON.parse(readFileSync(side, "utf8")) as Record<string, number>;
    if (ev.peak in j) return j[ev.peak]!;
  }
  throw new CodeCutError("asset_missing", `Sound ${ev.id}: no peak named "${ev.peak}" for ${ev.src}`, {
    fix: "Measure the peak with sound_get (stored in the ledger) or pass peak as a number of seconds.",
  });
}

const atempoChain = (r: number): string[] => {
  const out: string[] = [];
  let rate = r;
  while (rate > 2) {
    out.push("atempo=2.0");
    rate /= 2;
  }
  while (rate < 0.5) {
    out.push("atempo=0.5");
    rate /= 0.5;
  }
  if (Math.abs(rate - 1) > 1e-6) out.push(`atempo=${rate.toFixed(6)}`);
  return out;
};

const f = (n: number) => (Math.round(n * 1000) / 1000).toString();

/** Build the offline mix: per-event trim/gain/delay, buses, ducking, master loudness. Deterministic. */
export async function mixAudio(o: MixOptions): Promise<MixResult> {
  requireFfmpeg();
  mkdirSync(dirname(o.outFile), { recursive: true });
  const duck = o.duckAmount ?? 12;
  const lufs = o.targetLufs ?? -14;
  const tp = o.truePeak ?? -1.5;

  const events: ResolvedEvent[] = [];
  for (const ev of o.events) {
    const file = o.resolveSrc(ev.src);
    const info = probeMedia(file);
    if (!info?.hasAudio && !(info && info.duration > 0 && !info.hasVideo)) {
      if (!info?.hasAudio) continue; // video without sound
    }
    const peakOffset = peakOffsetOf(ev, o.ledger, file);
    let startAt = ev.start - peakOffset;
    let mediaStart = ev.mediaStart ?? 0;
    if (startAt < 0) {
      mediaStart += -startAt;
      startAt = 0;
    }
    const rate = ev.rate && ev.rate > 0 ? ev.rate : 1;
    const avail = Math.max(0.01, ((info?.duration ?? 0) - mediaStart) / rate);
    const duration = Math.min(ev.duration ?? avail, avail, Math.max(0.01, o.duration - startAt));
    events.push({ id: ev.id, bus: ev.bus, src: ev.src, file, startAt, mediaStart, duration, gainDb: ev.gainDb ?? 0, peakOffset, landsAt: ev.start });
  }

  const args: string[] = ["-y", "-hide_banner", "-loglevel", "error", "-bitexact"];
  const chains: string[] = [];
  const bus: Record<string, string[]> = { voice: [], music: [], sfx: [] };
  events.forEach((e, i) => {
    args.push("-i", e.file);
    const src = o.events.find((x) => x.id === e.id)!;
    const rate = src.rate && src.rate > 0 ? src.rate : 1;
    const parts = [`[${i}:a]atrim=start=${f(e.mediaStart)}:duration=${f(e.duration * rate)}`, "asetpts=PTS-STARTPTS", ...atempoChain(rate)];
    if (src.fadeIn) parts.push(`afade=t=in:st=0:d=${f(src.fadeIn)}`);
    if (src.fadeOut) parts.push(`afade=t=out:st=${f(Math.max(0, e.duration - src.fadeOut))}:d=${f(src.fadeOut)}`);
    parts.push(`volume=${f(e.gainDb)}dB`, "aformat=sample_rates=48000:channel_layouts=stereo", `adelay=${Math.round(e.startAt * 1000)}:all=1`);
    chains.push(`${parts.join(",")}[e${i}]`);
    bus[e.bus]!.push(`[e${i}]`);
  });
  const buses: string[] = [];
  for (const name of ["voice", "music", "sfx"] as const) {
    const ins = bus[name]!;
    if (!ins.length) continue;
    chains.push(ins.length === 1 ? `${ins[0]}anull[b_${name}]` : `${ins.join("")}amix=inputs=${ins.length}:normalize=0:duration=longest[b_${name}]`);
    buses.push(name);
  }
  if (!buses.length) {
    // silent track so the render always has a defined mix
    await run("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-bitexact", "-f", "lavfi", "-i", `anullsrc=r=48000:cl=stereo`, "-t", f(o.duration), "-c:a", "pcm_s16le", o.outFile]);
    return { file: o.outFile, events, duckAmount: duck, targetLufs: lufs, filtergraph: "(silent)" };
  }
  // ducking: music is compressed by the voice bus
  let musicLabel = "b_music";
  let voiceMix = "b_voice";
  if (buses.includes("music") && buses.includes("voice")) {
    chains.push(`[b_voice]asplit=2[v_key][v_mix]`);
    const ratio = Math.max(2, Math.min(20, 1 + duck));
    chains.push(`[b_music][v_key]sidechaincompress=threshold=0.02:ratio=${f(ratio)}:attack=15:release=450:makeup=1[music_ducked]`);
    musicLabel = "music_ducked";
    voiceMix = "v_mix";
  }
  const finals: string[] = [];
  for (const b of buses) finals.push(`[${b === "music" ? musicLabel : b === "voice" ? voiceMix : "b_sfx"}]`);
  chains.push(`${finals.join("")}amix=inputs=${finals.length}:normalize=0:duration=longest,apad=whole_dur=${f(o.duration)},atrim=duration=${f(o.duration)},loudnorm=I=${lufs}:TP=${tp}:LRA=11,aformat=sample_rates=48000:channel_layouts=stereo[master]`);
  const graph = chains.join(";");
  args.push("-filter_complex", graph, "-map", "[master]", "-c:a", "pcm_s16le", "-ar", "48000", "-fflags", "+bitexact", "-flags:a", "+bitexact", o.outFile);
  try {
    await run("ffmpeg", args, { maxBuffer: 64 * 1024 * 1024 });
  } catch (e) {
    throw new CodeCutError("render_failed", `FFmpeg audio mix failed: ${(e as { stderr?: string }).stderr?.split("\n").slice(-4).join(" ") ?? (e as Error).message}`, { details: { graph } });
  }
  const m = await measureLoudness(o.outFile);
  return { file: o.outFile, events, duckAmount: duck, targetLufs: lufs, lufs: m.lufs, truePeak: m.truePeak, filtergraph: graph };
}

/** Integrated loudness (EBU R128) and true peak via FFmpeg's ebur128. */
export async function measureLoudness(file: string): Promise<{ lufs?: number; truePeak?: number }> {
  requireFfmpeg();
  try {
    const r = await run("ffmpeg", ["-hide_banner", "-nostats", "-i", file, "-af", "ebur128=peak=true", "-f", "null", "-"], { maxBuffer: 64 * 1024 * 1024 });
    const text = r.stderr;
    const summary = text.slice(text.lastIndexOf("Summary:"));
    const i = summary.match(/I:\s+(-?[\d.]+)\s+LUFS/)?.[1];
    const p = summary.match(/Peak:\s+(-?[\d.]+)\s+dBFS/)?.[1];
    return { lufs: i ? Number(i) : undefined, truePeak: p ? Number(p) : undefined };
  } catch (e) {
    const text = (e as { stderr?: string }).stderr ?? "";
    const summary = text.slice(text.lastIndexOf("Summary:"));
    const i = summary.match(/I:\s+(-?[\d.]+)\s+LUFS/)?.[1];
    return { lufs: i ? Number(i) : undefined };
  }
}
