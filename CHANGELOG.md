# Changelog

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
