# Changelog

## Phase 2: MCP server, sound, voice, review, skill (unreleased)

- `@codecut/mcp`: 30 tools and 4 resources over stdio (`codecut mcp`), same patches as the edit ops, applied to the
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
  hooks so a published install (npm package `flomotion`) resolves `@codecut/*` imports and compiles project TSX with no node_modules.
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
