import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createInterface } from "node:readline";
import { runHyperframes, stripAnsi } from "@codecut/render";
import {
  KEYS,
  KEY_NAMES,
  checkKey,
  onPath,
  configPath,
  indexSoundLibrary,
  libraryIndexPath,
  maskKey,
  readConfig,
  setupStatus,
  writeConfig,
  type CheckBases,
  type FlomotionConfig,
  type KeyName,
} from "@codecut/mcp";

/** Everything the wizard says or asks goes through this, so tests can script a whole session. */
export interface SetupIO {
  say(line?: string): void;
  ask(question: string, fallback?: string): Promise<string>;
  /** A secret: not echoed. */
  askHidden(question: string): Promise<string>;
}

export interface SetupContext {
  env: NodeJS.ProcessEnv;
  fetch?: typeof fetch;
  bases?: CheckBases;
  /** Install the flomotion-studio skill (the CLI passes its own installer). */
  installSkill?: () => void;
  /** Register the MCP server with Claude Code. Returns what happened. */
  registerMcp?: () => { ok: boolean; message: string };
  /** Whisper installation steps (the real ones by default; tests pass fakes). */
  whisper?: WhisperInstaller;
}

/** What it takes to get a working local Whisper. */
export interface WhisperInstaller {
  /** Path of whisper-cli when present. */
  find(): string | undefined;
  hasBrew(): boolean;
  /** `brew install whisper-cpp`, output shown to the person. */
  brewInstall(): { ok: boolean; detail: string };
  /** Make sure the speech model is on disk (a one-off download); true when a transcription can run. */
  ensureModel(): Promise<{ ok: boolean; detail: string }>;
}

const yes = (s: string, def: boolean) => (s.trim() === "" ? def : /^y(es)?$/i.test(s.trim()));

async function choose(
  io: SetupIO,
  question: string,
  options: Array<{ key: string; label: string }>,
  def: string,
): Promise<string> {
  io.say(question);
  options.forEach((o, i) => io.say(`  ${i + 1}. ${o.label}${o.key === def ? "  (default)" : ""}`));
  for (;;) {
    const a = (await io.ask("Choose", String(options.findIndex((o) => o.key === def) + 1))).trim();
    const n = Number(a);
    if (Number.isInteger(n) && n >= 1 && n <= options.length) return options[n - 1]!.key;
    io.say(`Type a number from 1 to ${options.length}.`);
  }
}

/** Ask for one key, check it against the real service, and save it only if the person agrees. */
export async function addKey(
  io: SetupIO,
  ctx: SetupContext,
  cfg: FlomotionConfig,
  name: KeyName,
): Promise<boolean> {
  const k = KEYS[name];
  io.say(`${k.label} key (${k.cost}): get one at ${k.url}`);
  for (;;) {
    const key = (await io.askHidden(`Paste the ${k.label} key (Enter to skip)`)).trim();
    if (!key) {
      io.say(`Skipped. Without it: ${k.without}.`);
      return false;
    }
    io.say("Checking it with " + k.label + "…");
    const r = await checkKey(name, key, { fetch: ctx.fetch, bases: ctx.bases });
    if (r.ok) {
      cfg.keys[name] = key;
      io.say(`✔ ${r.detail}`);
      return true;
    }
    io.say(`✖ ${r.detail}`);
    if (r.unreachable) {
      if (yes(await io.ask("Save it anyway?", "n"), false)) {
        cfg.keys[name] = key;
        return true;
      }
      return false;
    }
    if (!yes(await io.ask("Try another key?", "y"), true)) return false;
  }
}

export const realWhisper = (env: NodeJS.ProcessEnv): WhisperInstaller => ({
  find: () =>
    env.HYPERFRAMES_WHISPER_PATH || onPath("whisper-cli", env) || onPath("whisper-cpp", env),
  hasBrew: () => !!onPath("brew", env),
  brewInstall: () => {
    const r = spawnSync("brew", ["install", "whisper-cpp"], {
      stdio: "inherit",
      env: { ...env, HOMEBREW_NO_AUTO_UPDATE: "1" },
    });
    return r.status === 0
      ? { ok: true, detail: "installed" }
      : { ok: false, detail: `brew exited with ${r.status ?? r.error?.message}` };
  },
  ensureModel: async () => {
    // a short tone through the same path transcribe uses: downloads the model once if it is missing
    const dir = mkdtempSync(join(tmpdir(), "flomotion-whisper-"));
    try {
      const wav = join(dir, "tone.wav");
      const ff = spawnSync(
        "ffmpeg",
        ["-y", "-v", "error", "-f", "lavfi", "-i", "sine=f=220:d=1.5:r=16000", wav],
        { encoding: "utf8" },
      );
      if (ff.status !== 0)
        return { ok: false, detail: "FFmpeg is needed for the check: brew install ffmpeg" };
      const r = await runHyperframes(
        ["transcribe", wav, "-d", dir, "--json", "--no-runtime-install"],
        { cwd: dir, timeoutMs: 20 * 60_000 },
      );
      const line = stripAnsi(r.stdout)
        .split("\n")
        .reverse()
        .find((l) => l.trim().startsWith("{"));
      const j = line ? (JSON.parse(line) as { ok?: boolean; error?: string }) : undefined;
      // a tone has no speech: "ok with zero words" and "no speech found" both prove the model loaded
      if (j?.ok || /no speech|no words|empty/i.test(j?.error ?? ""))
        return { ok: true, detail: "the speech model is ready" };
      return {
        ok: false,
        detail:
          j?.error ??
          stripAnsi(r.stderr).split("\n").filter(Boolean).slice(-1)[0] ??
          "transcribe failed",
      };
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  },
});

/** Install whisper.cpp (with Homebrew) and fetch the speech model, each only after the person says yes. */
export async function installWhisper(io: SetupIO, ctx: SetupContext): Promise<boolean> {
  const w = ctx.whisper ?? realWhisper(ctx.env);
  const have = w.find();
  if (have) io.say(`✔ whisper.cpp is installed (${have}).`);
  else {
    if (!w.hasBrew()) {
      io.say("whisper.cpp is not installed, and Homebrew was not found to install it.");
      io.say(
        "  macOS: install Homebrew (https://brew.sh), then run `flomotion setup whisper` again.",
      );
      io.say(
        "  Linux or Windows: build whisper.cpp (https://github.com/ggml-org/whisper.cpp) and put `whisper-cli` on your PATH.",
      );
      io.say(
        "  Or skip Whisper: give me a transcript or captions file (SRT, VTT, JSON) and I will use that.",
      );
      return false;
    }
    if (
      !yes(
        await io.ask(
          "Install whisper.cpp now with Homebrew (`brew install whisper-cpp`, a small download)?",
          "y",
        ),
        true,
      )
    ) {
      io.say("Skipped. You can still give me a transcript or captions file instead.");
      return false;
    }
    const r = w.brewInstall();
    if (!r.ok) {
      io.say(
        `✖ ${r.detail}. Run \`brew install whisper-cpp\` yourself and then \`flomotion setup whisper\`.`,
      );
      return false;
    }
    io.say("✔ whisper.cpp installed.");
  }
  if (
    !yes(
      await io.ask("Download the English speech model now (about 470 MB, once) and test it?", "y"),
      true,
    )
  ) {
    io.say("Skipped. The model downloads the first time `transcribe` runs.");
    return true;
  }
  io.say("Downloading and testing the model (this can take a few minutes)…");
  const m = await w.ensureModel();
  io.say(m.ok ? `✔ ${m.detail}.` : `✖ ${m.detail}`);
  return m.ok;
}

/** The guided setup: how you want to supply voice, transcript, sounds and assets, and the keys that go with it. */
export async function runWizard(io: SetupIO, ctx: SetupContext): Promise<FlomotionConfig> {
  const cfg = readConfig(ctx.env);
  const status = setupStatus(ctx.env, cfg);
  io.say("flomotion setup");
  io.say(
    "Nothing here is required. Every service has a way to work without it: you can give flomotion your own",
  );
  io.say(
    "recording, transcript, sound effects, logos and screenshots instead. Keys are stored only on this",
  );
  io.say(
    `computer, in ${configPath(ctx.env)} (readable by you only), and are never sent to Claude.`,
  );
  io.say();
  io.say(
    `Found: FFmpeg ${status.tools.ffmpeg ? "yes" : "NO"}, Chrome ${status.tools.chrome ? "yes" : "NO"}, whisper.cpp ${status.tools.whisper ? "yes" : "no"}, Claude Code ${status.tools.claude ? "yes" : "no"}.`,
  );
  if (!status.tools.ffmpeg)
    io.say("  FFmpeg is required for rendering: macOS `brew install ffmpeg`.");
  if (!status.tools.chrome)
    io.say("  Chrome is required for rendering: install Google Chrome, or set CHROME_PATH.");
  io.say();

  // 1. voice
  cfg.preferences.voice = (await choose(
    io,
    "1/4  The voiceover: how will you provide it?",
    [
      { key: "recording", label: "I record it myself and give you the audio (free)" },
      {
        key: "elevenlabs",
        label: "Generate it with ElevenLabs (paid; I always show the cost and ask first)",
      },
      {
        key: "local-tts",
        label: "A computer voice on this Mac, only as a draft to time things (free)",
      },
    ],
    cfg.preferences.voice ?? "recording",
  )) as FlomotionConfig["preferences"]["voice"];
  if (cfg.preferences.voice === "elevenlabs" && !cfg.keys.elevenlabs)
    await addKey(io, ctx, cfg, "elevenlabs");
  else if (cfg.preferences.voice === "elevenlabs" && cfg.keys.elevenlabs)
    io.say("An ElevenLabs key is already saved (setup check tests it).");
  io.say();

  // 2. transcript
  cfg.preferences.transcript = (await choose(
    io,
    "2/4  Word timings (for captions and for moving things on the spoken word): where do they come from?",
    [
      {
        key: "own",
        label: "I give you the transcript or captions (SRT, VTT or JSON) for my recording",
      },
      {
        key: "whisper",
        label: `Whisper on this computer${status.tools.whisper ? "" : "  (not installed: brew install whisper-cpp)"}`,
      },
      { key: "elevenlabs", label: "ElevenLabs returns them with the voice it generates" },
    ],
    cfg.preferences.transcript ?? (cfg.preferences.voice === "elevenlabs" ? "elevenlabs" : "own"),
  )) as FlomotionConfig["preferences"]["transcript"];
  if (cfg.preferences.transcript === "whisper") await installWhisper(io, ctx);
  io.say();

  // 3. sound effects
  const sounds = (await choose(
    io,
    "3/4  Sound effects: where do they come from?",
    [
      {
        key: "freesound",
        label:
          "Freesound: a free library, searched for you (CC0 and CC-BY only; credits are written for you)",
      },
      { key: "own", label: "My own sound files (a folder I point you at)" },
      { key: "both", label: "Both" },
    ],
    cfg.preferences.sounds ?? "freesound",
  )) as NonNullable<FlomotionConfig["preferences"]["sounds"]>;
  cfg.preferences.sounds = sounds;
  if ((sounds === "freesound" || sounds === "both") && !cfg.keys.freesound)
    await addKey(io, ctx, cfg, "freesound");
  else if (sounds !== "own" && cfg.keys.freesound) io.say("A Freesound key is already saved.");
  if (sounds === "own" || sounds === "both") {
    for (;;) {
      const folder = (
        await io.ask(
          "Folder with your sound effects (Enter to skip)",
          cfg.preferences.soundLibrary ?? "",
        )
      ).trim();
      if (!folder) break;
      io.say("Only index sounds you made, bought a licence for, or may use in videos.");
      if (!yes(await io.ask("Do you have the right to use these in videos?", "n"), false)) {
        io.say("Skipped: say yes only if it is true.");
        break;
      }
      try {
        const idx = indexSoundLibrary(resolve(folder), libraryIndexPath(ctx.env), { rights: true });
        cfg.preferences.soundLibrary = idx.root;
        cfg.preferences.soundLibraryRights = true;
        io.say(
          `✔ Indexed ${idx.entries.length} sound files from ${idx.root}. They are searchable by file and folder names.`,
        );
        break;
      } catch (e) {
        io.say(`✖ ${e instanceof Error ? e.message : e}`);
      }
    }
  }
  io.say();

  // 4. fonts and assets
  io.say("4/4  Fonts and graphics");
  io.say("  Fonts: Google Fonts download without a key.");
  io.say(
    "  Icons, emoji and brand logos: Iconify, no key. Photos and illustrations: Openverse, no key (CC0 and CC-BY).",
  );
  io.say(
    "  Your product: screenshots of your own site and its brand colours are taken from the page, no key.",
  );
  if (
    !cfg.keys.googleFonts &&
    yes(
      await io.ask("Add a Google Fonts key (only for searching fonts by category or script)?", "n"),
      false,
    )
  )
    await addKey(io, ctx, cfg, "googleFonts");
  if (
    !cfg.keys.pexels &&
    yes(await io.ask("Add a Pexels key (more stock photos, free)?", "n"), false)
  )
    await addKey(io, ctx, cfg, "pexels");
  io.say();

  const file = writeConfig(cfg, ctx.env);
  io.say(`Saved to ${file}`);
  summary(io, cfg, ctx.env);
  io.say();

  if (
    ctx.installSkill &&
    yes(await io.ask("Install the flomotion-studio skill for Claude Code now?", "y"), true)
  ) {
    try {
      ctx.installSkill();
    } catch (e) {
      io.say(`✖ ${e instanceof Error ? e.message : e}`);
    }
  }
  if (ctx.registerMcp) {
    if (status.tools.claude) {
      if (yes(await io.ask("Add flomotion to Claude Code for all your folders now?", "y"), true)) {
        const r = ctx.registerMcp();
        io.say(r.ok ? `✔ ${r.message}` : `✖ ${r.message}`);
      }
    } else
      io.say(
        "Claude Code was not found on this computer. When you have it: claude mcp add --scope user flomotion -- npx -y flomotion mcp --dir . --ui",
      );
  }
  io.say();
  io.say("Next: make a folder for your video, open Claude Code in it, and ask for the video.");
  io.say(
    "To watch it being made: the server prints a live view address, or run `flomotion ui` in that folder.",
  );
  io.say(
    "Change anything later with `flomotion setup`, check the keys with `flomotion setup check`.",
  );
  return cfg;
}

export function summary(io: SetupIO, cfg: FlomotionConfig, env: NodeJS.ProcessEnv): void {
  const s = setupStatus(env, cfg, { hasSoundLibrary: existsSync(libraryIndexPath(env)) });
  io.say();
  io.say("What you have now:");
  for (const n of KEY_NAMES) {
    const k = s.keys[n];
    io.say(
      `  ${k.label.padEnd(13)} ${k.configured ? `key set (${k.via === "env" ? "from the environment" : maskKey(cfg.keys[n] ?? "")})` : "no key"}   ${k.configured ? "" : `→ ${k.without}`}`,
    );
  }
  io.say(`  Voice          ${cfg.preferences.voice ?? "not chosen (your own recording)"}`);
  io.say(`  Word timings   ${cfg.preferences.transcript ?? "not chosen (a transcript you give)"}`);
  io.say(`  Sound effects  ${s.can.soundEffects.join("; ")}`);
  io.say(`  Stock photos   ${s.can.stockPhotos.join("; ")}`);
  for (const m of s.missing) io.say(`  ! ${m.job}: ${m.fix}`);
}

/** Check every saved key against its service, without spending anything. */
export async function checkAll(io: SetupIO, ctx: SetupContext): Promise<boolean> {
  const cfg = readConfig(ctx.env);
  let allOk = true;
  let any = false;
  for (const n of KEY_NAMES) {
    const key = ctx.env[KEYS[n].env] || cfg.keys[n];
    if (!key) {
      io.say(`  ${KEYS[n].label.padEnd(13)} not set`);
      continue;
    }
    any = true;
    const r = await checkKey(n, key, { fetch: ctx.fetch, bases: ctx.bases });
    io.say(`  ${KEYS[n].label.padEnd(13)} ${r.ok ? "✔" : "✖"} ${r.detail}`);
    if (!r.ok) allOk = false;
  }
  if (!any)
    io.say("No keys set. Nothing needs one: run `flomotion setup` to choose how you want to work.");
  return allOk;
}

/** Non-interactive: take the keys that are already in the environment, check them, and save them. */
export async function importFromEnv(io: SetupIO, ctx: SetupContext): Promise<FlomotionConfig> {
  const cfg = readConfig(ctx.env);
  for (const n of KEY_NAMES) {
    const key = ctx.env[KEYS[n].env];
    if (!key) continue;
    const r = await checkKey(n, key, { fetch: ctx.fetch, bases: ctx.bases });
    io.say(`${KEYS[n].label}: ${r.ok ? "✔" : "✖"} ${r.detail}`);
    if (r.ok || r.unreachable) cfg.keys[n] = key;
  }
  io.say(`Saved to ${writeConfig(cfg, ctx.env)}`);
  return cfg;
}

// ---------- the real terminal ----------

export function terminalIO(): SetupIO & { close(): void } {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: !!process.stdin.isTTY,
  });
  let muted = false;
  const rlAny = rl as unknown as { _writeToOutput?: (s: string) => void };
  const write = rlAny._writeToOutput?.bind(rl);
  if (write)
    rlAny._writeToOutput = (s: string) =>
      muted ? (s.includes("\n") ? process.stdout.write("\n") : undefined) : write(s);
  // piped input: read all lines up front so every question gets its answer in order
  const queue: string[] = [];
  let waiting: ((l: string) => void) | undefined;
  if (!process.stdin.isTTY) {
    rl.on("line", (l) =>
      waiting ? ((w) => ((waiting = undefined), w(l)))(waiting) : queue.push(l),
    );
  }
  const readLine = (q: string): Promise<string> =>
    process.stdin.isTTY
      ? new Promise((r) => rl.question(q, r))
      : new Promise((r) => {
          process.stdout.write(q);
          const l = queue.shift();
          if (l !== undefined) r(l);
          else waiting = r;
        });
  return {
    say: (l = "") => console.log(l),
    ask: async (q, fallback) => {
      const a = await readLine(`${q}${fallback ? ` [${fallback}]` : ""}: `);
      return a.trim() === "" && fallback !== undefined ? fallback : a;
    },
    askHidden: async (q) => {
      muted = !!process.stdin.isTTY;
      const a = await readLine(`${q}: `);
      muted = false;
      return a;
    },
    close: () => rl.close(),
  };
}

/** `claude mcp add --scope user flomotion -- npx -y flomotion mcp --dir . --ui`, replacing an older registration. */
export function registerWithClaude(): { ok: boolean; message: string } {
  const run = (args: string[]) => spawnSync("claude", args, { encoding: "utf8" });
  const have = run(["mcp", "get", "flomotion"]);
  if (have.status === 0) run(["mcp", "remove", "flomotion", "--scope", "user"]);
  const r = run([
    "mcp",
    "add",
    "--scope",
    "user",
    "flomotion",
    "--",
    "npx",
    "-y",
    "flomotion",
    "mcp",
    "--dir",
    ".",
    "--ui",
  ]);
  if (r.status === 0)
    return {
      ok: true,
      message: "Added `flomotion` to Claude Code (all folders). Restart Claude Code if it is open.",
    };
  return {
    ok: false,
    message: `Claude Code did not accept it (${(r.stderr || r.stdout || r.error?.message || "unknown error").toString().trim().split("\n")[0]}). Run by hand: claude mcp add --scope user flomotion -- npx -y flomotion mcp --dir . --ui`,
  };
}

/** `setup set <name>` without a value: ask for the key without showing it. */
export function addKeyInteractive(
  io: SetupIO,
  cfg: FlomotionConfig,
  name: KeyName,
): Promise<boolean> {
  return addKey(io, { env: process.env }, cfg, name);
}
