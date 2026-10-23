import { existsSync } from "node:fs";
import { setupStatus, readConfig, libraryIndexPath } from "../config.js";
import { tool } from "./util.js";

export const setupStatusTool = tool({
  name: "setup_status",
  title: "What is set up",
  description:
    "Report what this machine and this person's setup can do, by job: sound effects, voice, word timings, stock photos, icons, screenshots; which API keys are configured (never the keys themselves); what is missing and the one step that fixes each. Call it at the start of a video, tell the person what is missing, and plan around what exists (their own recording and transcript, their own sounds) instead of failing later. Keys are set by the person with `flomotion setup`, never by you.",
  input: {},
  readOnly: true,
  async run(_a, ctx) {
    const cfg = readConfig(ctx.rawEnv);
    const s = setupStatus(ctx.rawEnv, cfg, {
      hasSoundLibrary: existsSync(libraryIndexPath(ctx.rawEnv)),
    });
    const keys = Object.fromEntries(
      Object.entries(s.keys).map(([k, v]) => [
        k,
        { configured: v.configured, via: v.via, unlocks: v.unlocks, without: v.without },
      ]),
    );
    const advice: string[] = [];
    if (!s.keys.elevenlabs.configured && !s.can.voice.length) advice.push("No voice source.");
    if (s.missing.length)
      advice.push("Tell the person what is missing (below) before you start building.");
    advice.push(
      "The person can always supply their own recording, transcript, sound files, logos and screenshots instead of a service key.",
    );
    return {
      data: {
        configFile: s.configFile,
        configExists: s.configExists,
        keys,
        preferences: s.preferences,
        tools: s.tools,
        can: s.can,
        assetSources: ctx.assets.sources(),
        missing: s.missing,
        advice,
        setup:
          "The person runs `flomotion setup` in a terminal to add keys or point at their own files. You cannot and must not ask them to paste a key into the chat.",
      },
    };
  },
});
