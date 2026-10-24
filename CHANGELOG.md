# Changelog

## 0.4.1

- **The npm page links to the repo** (https://github.com/gtpropy/flomotion): `repository`, `homepage` and `bugs` are set.
- Everything in "Fixes and examples" below, the Storyboard tab, and the Markdown-only skill ship in this release (0.4.0 was published first, with the same code).
- The ad's README credits its sources: the voice (ElevenLabs), the CC-BY sound effect (Vilkas_Sound) and the CC0 loops.

## Fixes and examples

- **Audio mix is deterministic again.** With voice and music together, two renders of the same project could differ
  in the last samples (`sidechaincompress` paired frames in thread order). The ducking chain now uses fixed frame
  sizes; a regression test mixes the same project 8 times and fails without the fix.
- **`examples/flomotion-ad`:** a 30 s vertical ad for flomotion, built with the studio skill (real live-view captures,
  its own licence ledger on screen). See its `LOG.md` for what was and was not verified.

## Rename: CodeCut is now flomotion everywhere

- The product, packages (`@flomotion/*`), command (`flomotion`), project folder (`.flomotion/`), config file
  (`flomotion.json`) and element ids (`fm_`) all use the name flomotion. The old `codecut` command and `@codecut/*`
  imports are gone. Projects made before the rename: move `.codecut/` to `.flomotion/`, change the imports, and replace `.codecut/` with
  `.flomotion/` inside `.flomotion/fonts.lock.json` and `.flomotion/ledger.json`
  (`sed -i '' 's#\.codecut/#.flomotion/#g' .flomotion/*.json`).

## 0.4.0: setup, your own material, and assets (unreleased)

- **`flomotion setup`:** a guided setup (also `setup show | check | set | unset | sounds`, and `--yes`). You choose
  how you supply the voiceover, the word timings, the sound effects and the graphics (your own recording,
  transcript, sound files, logos and screenshots, or Freesound, ElevenLabs, Whisper, Pexels), and enter the keys that
  go with it. Each key is checked with its real service (read-only) and saved only on your computer (`~/.config/
flomotion/config.json`, mode 0600). It can also install the skill and add flomotion to Claude Code.
- **Your own material:** `voice_import`, `transcript_import` (SRT, VTT, word-level JSON, lines with times, or plain
  text, with an honest precision: word, cue, estimated), `sound_import`, a searchable library of your own sound
  folder, and `asset_import`. Files may be anywhere on your computer; credentials and key folders are never read.
- **Assets:** `asset_search` and `asset_get` for icons, emoji, brand logos (trademark: needs permission), photos and
  illustrations (Iconify, Openverse, Pexels); `asset_capture` for sharp screenshots of your own product;
  `brand_extract` for your site's colours, fonts and logos. Licences are classified, share-alike and
  non-commercial refused, CC-BY credited, everything in the ledger; `lint` and the licence report cover images.
- `setup_status` tool: the agent checks what exists before it plans, and tells you what is missing.
- ElevenLabs quotes show your account's remaining characters. The server identifies itself as `flomotion` 0.4.0.
- Skill: `flomotion-studio` 0.4.0 (Round 0 of the interview, `assets.md`, asset plan at G4, own material).
- Tested: every tool, the wizard (scripted and piped), the key checks against local servers, Iconify and Openverse
  for real, screenshots and brand extraction against a local site.
- Not verified: Freesound, ElevenLabs and Pexels with real keys, Whisper, and the hidden key prompt on a real terminal.

## 0.3.0: the flomotion-studio skill, install command and live view (unreleased)

- **Skill:** `skills/flomotion-studio` (the main director skill: extensive interview, gates G0 to G6, looks, scene
  blocks, checks, copywriting, sound and motion rules) replaces the earlier motion-studio skill. Reconciled with the
  real tools: `references/mcp-tools.md` lists the 30 tools and error codes, `references/checks.md` says which checks
  `review` computes and which the agent computes or cannot run, `references/block-recipes.md` has the 13 core blocks
  as TSX (linted and rendered in all three looks by the tests), `references/components.md` is generated.
- **Looks:** `clean-light`, `dark-product`, `bold-kinetic` exist in the engine (`theme="$look.clean-light"`),
  matching the skill's JSON (a test keeps them in sync). The engine's `kinetic`, `minimal`, `sketch` stay for the
  examples.
- **Install:** `flomotion install skill` copies the skill to `~/.claude/skills` (or `--project`), replacing a previous
  copy and noting an old `motion-studio` skill. `flomotion skill install` from 0.2.0 still works.
- **Live view:** `flomotion ui` and `flomotion mcp --ui`: activity feed of every tool call, gate progress,
  outline and timeline, a scrubbable preview rendered on demand, code with the latest change highlighted, review
  results, assets with licences, renders, and history with Restore. Localhost only, no network.
- The MCP server logs every call to `.flomotion/activity.jsonl`; `review` writes `.flomotion/review/last.json`;
  the server identifies itself as `flomotion`.
- Fixed: bin paths written `./dist/bin.mjs` were stripped by npm 11 at publish.

## Phase 2: MCP server, sound, voice, review, skill (unreleased)

- `@flomotion/mcp`: 30 tools and 4 resources over stdio (`flomotion mcp`), same patches as the edit ops, applied to the
  TSX with ts-morph (formatting and comments kept, expressions refused, every write re-read and verified, history
  snapshots with undo tokens). Typed errors with fix hints.
- Freesound client (token auth, tag search, CC0/CC-BY filter, measured peak, ledger, credits file) with a local
  catalogue fallback; voice providers (recording, local TTS stub, ElevenLabs quote then `confirm:true`);
  transcription via whisper.cpp; `align_to_voice`; `sound_auto` for impact cues.
- Review: 17-point checklist from the compiled animation, lint, ledger, measured mix and the rendered page.
- `render` presets with credits and licence report; `mix_preview` with measured loudness.
- `skills/motion-studio`: gated workflow, references (motion, sound, typography, saas-promo, review, generated
  components), three Looks as data with a finished reference scene each, a finished example.
- CLI: `mcp`, `skill install`; `render` writes credits and a licence report. Bundle: multi-entry esbuild build with
  hooks so a published install (npm package `flomotion`) resolves `@flomotion/*` imports and compiles project TSX with no node_modules.
- Fixed: `RGBSplit` and `Glitch` showed their effect before their start time (baked span began at the jump).
  `lint` compared `CC0-1.0` with `CC0`. A sound reused for two tags lost its first peak name.
- Tests: codemods, every tool, review checks, resources, stdio, schema round trip through an MCP call, skill files,
  Look scenes, and the Gate 2 flow against test doubles.

## Phase 1: core engine (unreleased)

- Schema system (`defineComponent`/`defineEffect`, 20+ control builders) generating TS types, Zod validators,
  MCP JSON Schema, docs and lint rules from one declaration.
- JSX runtime, resolver (themes, tokens, refs, timing, expressions), timeline IR, HyperFrames HTML compiler with
  baked, seekable animation; 10 transitions (`shader` is a stub).
- Keyframes (modes, handles, spatial paths, loops) and pure expressions with a purity linter.
- 76 definitions: structure, transform stack, media, typography (variable axes, rich text, animators and presets),
  shapes, masks/mattes, layout, UI mocks, impact effects with sound tags, ColorGrade/Curves/Grain, layer styles.
- Fonts: local, Google (CSS API, licence from google/fonts METADATA.pb), Fontsource fallback, URL, system; hash lock,
  ledger, Chrome-measured layout cache, pre-render font gate, glyph-coverage lint.
- 24 timeline edit operations and 16 keyframe operations as pure patch producers with undo.
- Offline FFmpeg audio mixer (buses, sidechain ducking, loudnorm), deterministic.
- CLI: `init lint render frame sheet fonts sync docs`.
- Examples: `saas-promo`, `typography`. Tests: unit, compiler snapshots, goldens (perceptual hash), double render,
  schema round trip, fonts, glyph lint, e2e.
