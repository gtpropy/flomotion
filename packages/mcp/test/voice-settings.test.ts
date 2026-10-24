import { describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ElevenLabsProvider, elevenVoiceSettings } from "../src/providers/voice.js";

describe("ElevenLabs voice settings", () => {
  it("maps our names to ElevenLabs' and leaves out what was not set", () => {
    expect(elevenVoiceSettings(undefined)).toBeUndefined();
    expect(elevenVoiceSettings({})).toBeUndefined();
    expect(
      elevenVoiceSettings({
        stability: 0.3,
        similarity: 0.8,
        style: 0.55,
        speed: 1.1,
        speakerBoost: true,
      }),
    ).toEqual({
      stability: 0.3,
      similarity_boost: 0.8,
      style: 0.55,
      speed: 1.1,
      use_speaker_boost: true,
    });
    expect(elevenVoiceSettings({ speed: 1.1 })).toEqual({ speed: 1.1 });
  });

  it("sends voice_settings with the request, and none when not asked", async () => {
    const bodies: Array<Record<string, unknown>> = [];
    const fetchFake = (async (_url: string, init: { body: string }) => {
      bodies.push(JSON.parse(init.body));
      return new Response(JSON.stringify({ audio_base64: Buffer.from("mp3").toString("base64") }), {
        status: 200,
      });
    }) as unknown as typeof fetch;
    const p = new ElevenLabsProvider({ apiKey: "k", fetch: fetchFake });
    const dir = mkdtempSync(join(tmpdir(), "fm-voice-"));
    await p.generate(
      {
        provider: "elevenlabs",
        text: "Hi.",
        voice: "v1",
        voiceSettings: { stability: 0.3, speed: 1.1 },
      },
      join(dir, "a.mp3"),
    );
    await p.generate({ provider: "elevenlabs", text: "Hi.", voice: "v1" }, join(dir, "b.mp3"));
    expect(bodies[0]!.voice_settings).toEqual({ stability: 0.3, speed: 1.1 });
    expect(bodies[0]!.model_id).toBe("eleven_multilingual_v2");
    expect("voice_settings" in bodies[1]!).toBe(false);
    expect(readFileSync(join(dir, "a.mp3"), "utf8")).toBe("mp3");
  });
});
