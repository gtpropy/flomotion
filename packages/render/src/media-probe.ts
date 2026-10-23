import { execFileSync } from "node:child_process";
import { requireFfmpeg } from "./env.js";

export interface MediaInfo {
  duration: number;
  hasAudio: boolean;
  hasVideo: boolean;
  width?: number;
  height?: number;
}

const cache = new Map<string, MediaInfo | undefined>();

/** ffprobe a file. Undefined when it is not media. */
export function probeMedia(path: string): MediaInfo | undefined {
  if (cache.has(path)) return cache.get(path);
  requireFfmpeg("ffprobe");
  let info: MediaInfo | undefined;
  try {
    const out = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration:stream=codec_type,width,height", "-of", "json", path], { encoding: "utf8" });
    const j = JSON.parse(out) as { format?: { duration?: string }; streams?: Array<{ codec_type?: string; width?: number; height?: number }> };
    const v = j.streams?.find((s) => s.codec_type === "video");
    info = {
      duration: Number(j.format?.duration ?? 0),
      hasAudio: !!j.streams?.some((s) => s.codec_type === "audio"),
      hasVideo: !!v,
      width: v?.width,
      height: v?.height,
    };
  } catch {
    info = undefined;
  }
  cache.set(path, info);
  return info;
}
