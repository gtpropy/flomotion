# CodeCut spec (condensed, as implemented)

Sections 5–9 of the project brief, with the decisions made while building. Reference pages for every
component are generated from the schemas into `docs/components/` (`pnpm run gen:docs`).

## 1. Pipeline

```
TSX project → element tree (JSX runtime) → resolve (themes, tokens, refs, expressions, timing)
            → timeline IR (per layer: markup, transform channels, filters, audio, sound cues)
            → HyperFrames HTML (data-start / data-duration + one paused GSAP timeline)
            → HyperFrames render (headless Chrome + FFmpeg) → MP4
```

Every animated value is a pure function of time. The compiler **bakes** each varying channel into a sample
array (60 Hz, or the smallest multiple of fps ≥ 60) and applies it from one master GSAP tween's `onUpdate`
(`window.__timelines[<composition id>]`), so output is exact at any seek order and independent of GSAP easing
internals. Constants become static styles.

## 2. Value types (§5.1)

| Type            | Forms                                                                                                                          | Notes                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| `Time`          | `1.5`, `"1.5s"`, `"1500ms"`, `"36f"`, `"00:00:01:12"`, `"@12s"`, `"@marker:name+0.2"`, `"#id.end+0.2"`                         | Frames resolve against the composition fps. `@` = absolute composition time.          |
| `Length`        | `120`, `"50%"`, `"10vw"`, `"10vh"`                                                                                             | `%` is relative to the parent box (SafeArea, Group with a size, UIMock screen, Card). |
| `Angle`         | `45`, `"0.25turn"`, `"1rad"`                                                                                                   | Degrees internally.                                                                   |
| `Color`         | `"#ff3366"`, `"rgb()"`, `"oklch(0.7 0.2 20)"`, `"$brand.primary"`                                                              | `$` tokens come from the Look/Theme: `$brand.*`, `$color.*`, `$type.*`, `$ease.*`.    |
| `Vec2` / `Vec3` | `[x, y]`, `[x, y, z]`, or one number                                                                                           | Missing components fall back to the control default.                                  |
| `Ease`          | `linear`, `expo.out`, `power2.inOut`, `back.out(1.7)`, `elastic.out(1,.3)`, `bezier(.2,.8,.2,1)`, `spring(180,18)`, `steps(n)` | Named families follow GSAP's equations (tested against GSAP). Springs are analytic.   |
| `Asset`         | `"./clip.mp4"`, `"freesound:12345"`                                                                                            | Remote assets are cached and ledgered; renders never fetch.                           |
| `Ref`           | `"#hero"`, `"#hero.opacity"`                                                                                                   |                                                                                       |

`Animatable<T> = T | Keyframe<T>[] | KeyframeTrack<T> | Expr<T>` where `Expr<T> = (t, ctx) => T`.

## 3. Syntax and timing rules (§5.3)

- Every element has an `id`. A missing id is a lint warning and gets a stable `cc_` id (hash of its path).
- Effects are children of the layer they affect and apply in source order.
- **Child timing is relative to the parent Scene/Group/Sequence start.** `start="@12s"` is absolute.
  Keyframe times are relative to the parent (the spec's "parent's local time"); expression `t` is relative to
  the element's own start. `ctx.value` is the keyframed value when keys and an expression share a prop.
- For visual layers `at` is **spatial placement** (`center`, `top`, `bottom-left`, … or `[x, y]`); timing uses
  `start`/`duration`/`end`. For time-based elements (`Sound`, `Marker`, `Voiceover`) `at` is a time.
- A Scene's `transition` animates the **incoming** scene over its first `duration` seconds while the previous
  scene's slot is extended to hold underneath.
- `duration` defaults to the rest of the parent; `Clip`/`Video`/`Audio` default to the media length (ffprobe).
- Properties may carry keyframes as `[[t, v, ease?], …]`, `{ keys, mode, spatial, orient, separate, loop }`, or
  a `<Keyframes prop=… values=…/>` child. Sidecar `keys="./x.keys.json#id.prop"` is reserved (typed field,
  not yet read).
- Expressions must be pure. The linter rejects `Math.random`, `Date`, `performance.now`, timers, network,
  `window`/`document`/`process`, and assignment to outer variables.

## 4. Schema system (§6)

`defineComponent` and `defineEffect` are the only way to add a definition; one without `controls` is rejected.
Builders: `num int bool enum text richText color color3 vec2 vec3 angle curve curves ease file asset ref list group`
plus `time length fill json`. Options: `animatable min max step default unit ui when sound required`.

From one declaration the code generates: TypeScript prop types (`propsTypeSource`), Zod validators (`def.zod`,
and `def.wire` for the JSON-only MCP form), MCP argument JSON Schema (`propsJsonSchema`, `mcpToolSchemas`),
markdown docs (`docsMarkdown`), and lint rules (`deriveLintRules`: range, animatable, enum, required).
`ui`, `step`, `unit` are stored for the future inspector.

Mixins added automatically: `visual` → timing (`start duration end hidden link`) and the transform stack
(`position rotation scale skew anchor opacity crop flip blend perspective z`, plus `enter`/`exit`), all
animatable; effects get `start duration enabled`.

## 5. Components (§7, §7A)

See `docs/components/README.md` for the full list (76 definitions). Typed stubs (schema present, not
rendered, lint/compile report `stub-not-rendered`): `Precomp`, `Adjustment`. Later-tier options accepted and
ignored with a warning: `Scene.transition.type="shader"`, text `extrude`, dashed text `stroke`, `ColorGrade.lut`,
`Video.reverse`, video text fill. See `docs/later.md`.

## 6. Keyframes (§8)

Modes: `linear hold bezier auto continuous ease`. Ease on a key describes how the value **arrives** at that key
(`[t, v, "expo.out"]` = animate to `v` with `expo.out`). `in`/`out` handles accept `{ease}` or
`{speed, influence}`. Duplicate times are a typed `duplicate_keyframe` error. Before the first key / after the
last key the value holds. Vec spatial paths use a Catmull-Rom path through the keys (ends extrapolated linearly),
eased in time. `loop: "cycle" | "pingpong" | n`. Per-axis tracks via `{ x: [...], y: [...] }` (`keySeparate`).
Operations (pure, `{ project, undo }`): `keyAdd keySet keyMove keyDelete keyCopy keyPaste keyScale keyEase
keyMode keyReverse keyRove keyLoop keyBake keySimplify keySeparate keyCombine`.

## 7. Timeline edit operations (§9)

`insert overwrite replace lift extract split trim roll slip slide move link unlink group ungroup nest setSpeed
rippleDelete snap lockTrack muteTrack soloTrack addMarker removeMarker`, as `edit.<op>(project, args)` returning
`{ project, patches, undo, description }`. Times snap to the frame grid; overlaps are `overlap_rejected` unless
`overlap: true`; locked tracks throw `track_locked`; every op returns an undo patch list (`undoEdit`). Patches
(`setProp`, `insert`, `remove`, addressed by id) are the unit the MCP server and codemods apply. `nest` wraps in
`Precomp` (a stub: edits the tree, does not render yet).

## 8. MCP server (§10.1)

`codecut mcp --dir <project>` (or `npx -y flomotion mcp`) serves 30 tools over stdio for one project folder. All
paths are checked to stay inside it (`path_outside_project`). Every write returns `{ description, patches,
undoToken }`; the undo token is the id of the history snapshot taken before the write (`history_restore`).
Errors are `{ error: { code, message, fix, details } }` with `isError: true`. Codes: `schema_violation`,
`track_locked`, `overlap_rejected`, `asset_missing`, `quote_required`, `license_blocked`, plus `opaque_expression`,
`unknown_element`, `duplicate_keyframe`, `invalid_time`, `impure_expression`, `missing_dependency`,
`path_outside_project`, `font_error`, `render_failed`, `invalid_edit`.

| Tool                                                                     | Does                                                                                                             |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `project_create` `project_read`                                          | scaffold (blank, saas-promo) and outline (`path` = element id, `depth`); first read writes stable `cc_` ids      |
| `element_add` `element_set` `element_remove` `element_move` `effect_add` | structured edits, props validated by the component schema                                                        |
| `keyframe_set`                                                           | replaces all keys of an animatable prop; times snap to the frame grid                                            |
| `edit`                                                                   | any timeline op (§7) or keyframe op (§6)                                                                         |
| `scene_write`                                                            | replace an element with TSX you write: parsed, impurity-scanned, imports added, linted; restored if it fails     |
| `lint`                                                                   | schema, determinism, fonts, ledger, text rules; `scope` limits to a subtree                                      |
| `frame_render` `contact_sheet`                                           | exact-time PNG, tiled JPG (images are returned to the model)                                                     |
| `sound_search` `sound_get` `sound_auto`                                  | Freesound (key) or `sounds/catalog.json`; CC0/CC-BY by default; peak measured; ledger                            |
| `font_search` `font_get` `font_list` `font_preview` `font_check`         | Google Fonts metadata (key), download + lock + ledger, usage, PNG sample, glyph coverage                         |
| `transcribe` `voice_quote` `voice_generate` `align_to_voice`             | whisper.cpp via hyperframes, quote then `confirm:true`, retime to spoken words                                   |
| `mix_preview` `render` `review`                                          | offline mix with measured loudness; presets draft/social/final with credits + licence report; 17-point checklist |
| `history_list` `history_restore`                                         | snapshots of the TSX file                                                                                        |

Resources: `codecut://schema/{component}` (JSON schema + docs), `codecut://project/outline`, `codecut://ledger`,
`codecut://looks`.

### Editing TSX (codemods)

`ts-morph` finds an element by its literal `id`. A prop is _structured_ when its source is a string, number,
boolean, null, or an array/object literal of those. Structured props are rewritten in place (only that
initializer changes; comments and layout elsewhere stay byte for byte). Anything else (a call, an identifier, a
template with substitutions, a spread) is _opaque_: structured edits on it fail with `opaque_expression` and the
file is untouched. Inserts anchor to a neighbouring id, add missing component imports, and keep indentation.
**Every write is verified:** the file is re-evaluated and its tree compared with the tree the edit produced; a
mismatch restores the previous file. Unwritable cases (generated elements, `.map()` output) fail this way rather
than writing something different.

### Sound, voice, mix

Sound tags: `ui/pop ui/tap ui/tick move/whip move/whoosh-deep hit/land hit/punch hit/boom tech/click tech/data
tech/glass tech/success tech/glitch`. `sound_get` records `{source,id,author,license,url,attributionRequired,
commercialOk,peak}` in `.codecut/ledger.json` (peak names merge when one sound serves several tags).
`<Sound at peak>` starts early by the peak so it lands on `at`. Ledger licence strings are SPDX-like (`CC0-1.0`,
`CC-BY-4.0`); `codecut.json` `soundLicenses` lists the allowed families (`["CC0"]` restricts). Voice providers:
`recording` (default), `local-tts` (macOS `say`), `elevenlabs` (quote, then `confirm:true`). Mix presets set the
master LUFS (-14).

### Review (§10.5)

17 checks decided from the compiled project (baked channels give motion and static gaps), the lint, the ledger,
the measured mix, and `hyperframes check` for layout and contrast. Statuses: pass, fail, warn, manual, skipped.
Manual items are for the agent's second pass over the contact sheet; the tool never marks them as passed.
