
You are a senior TypeScript engineer. Build the project described below in an empty repository. Read the whole prompt before writing code. Start by replying with a short plan (see "How to work"), then build phase by phase and stop at each gate.

"CodeCut" is a working name. Keep it in one config constant so it is easy to rename.

---

## 1. What we are building

A code-first video editor. A video is one TSX project file. Every control that a normal editor (DaVinci Resolve, Premiere Pro, After Effects) offers exists as a typed prop or function. Later, an editor UI and Claude (through MCP) will both edit the same project file, so nothing may exist only in a UI.

Pipeline:

```
TSX project -> AST -> resolve (themes, tokens, refs, expressions) -> timeline IR
            -> HyperFrames HTML (data-start / data-duration / data-track-index + one paused GSAP timeline)
            -> HyperFrames render (headless Chrome + FFmpeg) -> MP4
```

The rendering engine is HyperFrames (open source, Apache 2.0, by HeyGen): https://github.com/heygen-com/hyperframes . It turns HTML, CSS, media and seekable animation into deterministic MP4. We build the authoring layer, the MCP server and a director skill on top of it. We do NOT rewrite the renderer.

Scope of this prompt:
- Phase 1: core engine (schema system, JSX runtime, compiler, base components, linter, CLI render).
- Phase 2: MCP server, sound and voice pipeline, audio mix, review loop, director skill.
- Phases 3 to 5 (editor UI, graphics and 3D, pro layer) are described in section 12 for design context only. Do not build them.

Primary use case to prove the system: a 30-second SaaS product promo, 9:16, with real UI mock components, kinetic text, impact effects, sound effects on the motion, and a voiceover with captions.

---

## 2. How to work

1. **Plan first.** Use plan mode or reply with a plan before coding: the repo layout, the order of work, and the questions you cannot answer from this prompt. Keep questions few; where this prompt gives a default, use it.
2. **Never guess HyperFrames APIs.** Before writing the compiler, install `hyperframes`, run `npx hyperframes --help`, read its README and docs (https://hyperframes.heygen.com/introduction , quickstart, guides on GSAP animation), read the example projects it scaffolds with `npx hyperframes init`, and read the `/hyperframes` skill it ships. Write down the exact attribute names and runtime contract you found in `docs/hyperframes-notes.md`. If something in this prompt disagrees with what the installed version actually does, the installed version wins; record the difference.
3. **Use a task list** and mark tasks done as you go. Commit at each milestone with a clear message.
4. **Verify, don't claim.** After each task run the tests and the example render. Report what you ran and what you saw. If a render fails or a test is flaky, say so and fix it.
5. **Stop at gates.** At the end of phase 1 and phase 2, run the gate checks (section 11), report results, and wait for my go-ahead.
6. **Keep scope tight.** Do not add features not listed here. Where a feature is listed under "Later", leave a typed stub or a TODO with an issue note, not an implementation.
7. **Be honest about limits.** If something cannot work in your sandbox (no GPU, no network, no FFmpeg, no Freesound key), build it behind an interface with a test double, and tell me exactly what I must run locally to verify it.

---

## 3. Stack and conventions

- Node 22+, TypeScript (strict, ESM), pnpm workspaces monorepo.
- Test runner: Vitest. Lint: ESLint + Prettier. Schema validation: Zod.
- Rendering: the `hyperframes` npm package (CLI and packages). FFmpeg must be on PATH; detect it and fail with a clear message.
- TSX parsing and codemods (needed in phase 2): `ts-morph`.
- MCP: official `@modelcontextprotocol/sdk`, stdio transport.
- Animation runtime inside rendered HTML: GSAP, loaded the way the installed HyperFrames expects. All animation must be seekable.
- No global state, no network calls at render time. Everything a render needs must be on disk (assets are fetched and cached beforehand).

Repo layout:

```
codecut/
  package.json, pnpm-workspace.yaml, tsconfig.base.json
  docs/
    hyperframes-notes.md        # facts verified from the installed version
    spec.md                     # condensed copy of sections 5-9 of this prompt
  packages/
    core/        # @codecut/core: types, schema system, JSX runtime, AST, compiler, keyframes, expressions, linter, edit ops
    components/  # @codecut/components: standard components and effects, built with core's defineComponent/defineEffect
    render/      # @codecut/render: HyperFrames wrapper, frame render, contact sheet, audio mix
    mcp/         # @codecut/mcp: MCP server, Freesound client, license ledger, voice and transcription providers
    cli/         # codecut CLI: init, lint, render, frame, sheet, mcp
  skills/
    motion-studio/              # director skill (SKILL.md + references + looks + examples)
  examples/
    saas-promo/                 # the 30 s test project
  tests/
    golden/                     # golden frames + perceptual hash baselines
```

---

## 4. Core principles (enforced by code, not only by convention)

1. **Parity.** If the future UI can do it, a prop can do it. Every control is declared once in a schema. The inspector, MCP arguments, keyframe lanes, lint rules and docs are generated from that declaration.
2. **Schema first.** `defineComponent` and `defineEffect` are the only way to add a component. Components without a schema are rejected.
3. **Determinism.** Every animated value is a pure function of time. No `Math.random`, `Date.now`, network calls, mutable globals, `requestAnimationFrame` state or unseeded physics. Randomness comes from `ctx.noise(seed, freq)` or a seeded PRNG evaluated at time `t`. The linter enforces this.
4. **Text is the source of truth.** The project is one TSX file that diffs and merges in git. Sidecar JSON files are allowed for large keyframe sets and tracker results.
5. **Gates for cost and licenses.** Anything that spends money returns a quote first and runs only after an explicit `confirm: true`. Every downloaded sound, model, font and image is recorded in a license ledger.

---

## 5. Value types and project syntax

### 5.1 Core value types

| Type | Accepted forms | Notes |
| --- | --- | --- |
| `Time` | `1.5` (seconds), `"1.5s"`, `"36f"`, `"00:00:01:12"` | Frames resolve against composition fps. |
| `Length` | `120` (px), `"50%"`, `"10vw"`, `"10vh"` | `%` relative to parent, `vw`/`vh` to the composition. |
| `Angle` | `45` (degrees), `"0.25turn"` | |
| `Color` | `"#ff3366"`, `"oklch(0.7 0.2 20)"`, `"$brand.primary"` | `$` = theme or brand token. |
| `Vec2` / `Vec3` | `[x, y]`, `[x, y, z]` | |
| `Ease` | `"linear"`, `"expo.out"`, `"back.out(1.7)"`, `"bezier(.2,.8,.2,1)"`, `"spring(180,18)"` | Spring is solved analytically from time. |
| `Asset` | `"./clip.mp4"`, `"freesound:12345"`, `"model:poly:abc"` | Remote assets are cached and ledgered. |
| `Ref` | `"#hero"`, `"#hero.opacity"` | Points to an element or prop by `id`. |

### 5.2 Animatable values

```ts
type Animatable<T> = T | Keyframe<T>[] | Expr<T>
type Keyframe<T> = [time: Time, value: T, ease?: Ease] | KeyframeObject<T>
type Expr<T> = (t: number, ctx: Ctx) => T      // t = seconds in the element's local time
```

### 5.3 Informal grammar

```
Project      := Import* Tokens? Export
Export       := "export default" Composition
Composition  := "<Composition" CompProps ">" (Track | Scene | Layer | Marker)* "</Composition>"
Track        := "<Track" id kind? locked? muted? ">" (Clip | Scene | Layer)* "</Track>"
Scene        := "<Scene" id start duration transition? ">" (Layer | Audio | Effect)* "</Scene>"
Layer        := Component ( "/>" | ">" (Effect | Mask | Layer | Keyframes)* "</" Component ">" )
Effect       := "<" EffectName props "/>"     // applies to its parent, in source order
Keyframes    := "<Keyframes prop=" Ident " values={" Keyframe[] "} />"
Marker       := "<Marker at label? color? />"
```

Rules:
1. Every element has an `id`. If missing, the tool writes back a stable `cc_` id on first save.
2. Effects apply to their parent layer in source order.
3. Child timing is relative to the parent `Scene` or `Precomp`; absolute timing needs `at="@12s"`.
4. Expressions must be pure (linter rejects impurity).
5. Properties with more than 8 keyframes may live in a sidecar `*.keys.json`, referenced as `keys="./promo.keys.json#t1.position"`.

### 5.4 Example project (must compile and render in phase 1)

```tsx
import { Composition, Track, Scene, Title, Sound, Shake, ColorGrade, Marker } from "@codecut/components";

export default (
  <Composition id="promo" size={[1080, 1920]} fps={30} duration="30s" theme="$look.kinetic">
    <Track id="v1" kind="video">
      <Scene id="hook" start="0s" duration="3s">
        <Title id="t1" text="Ship videos as code" at="center"
               enter={{ from: "sw", distance: 120, ease: "expo.out", duration: 0.6 }}>
          <Shake amp={6} freq={14} decay={5} start="0.6s" />
        </Title>
        <Sound id="s1" src="freesound:12345" at="0.6s" peak="land" gain={-6} />
      </Scene>
      <Scene id="reveal" start="3s" duration="6s" transition={{ type: "flash", duration: 0.3 }}>
        {/* ... */}
      </Scene>
    </Track>
    <ColorGrade scope="composition" contrast={0.12} temperature={-8} />
    <Marker at="3s" label="Product reveal" />
  </Composition>
);
```

---

## 6. Schema system (build this first)

Every component and effect is declared once:

```ts
defineEffect("ColorGrade", {
  category: "color",
  controls: {
    exposure:    num({ min: -5, max: 5, step: 0.01, default: 0, animatable: true, unit: "EV" }),
    contrast:    num({ min: -1, max: 1, default: 0, animatable: true }),
    temperature: num({ min: -100, max: 100, default: 0, animatable: true }),
    lift:        color3({ default: [0, 0, 0], ui: "wheel" }),
    curves:      curves({ channels: ["rgb", "r", "g", "b", "luma"] }),
    lut:         file({ accept: [".cube"], optional: true }),
  },
  render: (props, t, frame) => /* returns HyperFrames-compatible output: markup + seekable animation */,
})
```

Control builders: `num`, `int`, `bool`, `enum`, `text`, `richText`, `color`, `color3`, `vec2`, `vec3`, `angle`, `curve`, `curves`, `ease`, `file`, `asset`, `ref`, `list<T>`, `group`.

Options: `animatable`, `min`, `max`, `step`, `default`, `unit`, `ui`, `when`, `sound` (a sound tag such as `"hit/land"`).

From one declaration, generate (phase 1 and 2 scope):
1. TypeScript prop types.
2. Zod validators, used by the compiler, linter and MCP.
3. MCP tool argument schemas (`element_add`, `element_set`, `effect_add`).
4. Reference docs (markdown) written to `docs/components/`.
5. Lint rules (range checks, animatable checks).

UI generation (inspector, keyframe lanes) is phase 3. Keep the schema metadata rich enough to support it (store `ui`, `step`, `unit`).

---

## 7. Components and effects to implement (phases 1 and 2)

Implement each with a schema, a renderer, a unit test and a golden-frame test where visual.

**Structure:** `Composition` (`id`, `size`, `fps`, `duration`, `background`, `theme`, `colorSpace="srgb"`), `Track` (`id`, `kind`, `locked`, `muted`, `solo`, `blend`, `opacity`), `Scene` (`id`, `start`, `duration`, `transition?`, `label?`), `Sequence`, `Clip` (`src`, `in`, `out`, `speed`, `reverse`, `volume`), `Group`, `Marker`. (`Precomp` and `Adjustment`: typed stubs only.)

**Transform stack on every visual layer:** `position: Vec3`, `rotation: Vec3`, `scale: Vec3`, `skew: Vec2`, `anchor: Vec3`, `opacity`, `crop`, `flip`, `blend`, `perspective`. All animatable.

**Media:** `Video`, `Audio`, `Image`, `Sound`, `Voiceover`, `Captions`.

**Text:** see section 7A (typography and fonts). It is the full definition of `Text`, `Title`, `SplitText`, `TextAnimator`, `Captions` styling and font loading, and replaces any shorter description.

**Shapes and fills:** `Rect`, `RoundRect`, `Circle`, `Line`, `Polygon`, `Path`, `Svg`, `Group`; fills: solid, linear and radial gradient; `Mask` (shape, feather, invert, mode), `Matte` (alpha, luma).

**Layout and brand:** `Stack`, `Grid`, `Center`, `SafeArea` (presets: reels, shorts, tiktok, feed), `Theme`/`Look` (tokens for palette, type scale, easing set, default transition, grain, sound palette).

**UI mocks (needed for the SaaS promo):** `UIMock` (device frame + screen content), `Card`, `GlassCard`, `Cursor` (path + click ripple), `Chip`, `Counter`, `ProgressRing`, `Chart` (bar, line, donut), `CodeBlock`.

**Motion:**
- `Enter` / `Exit` with `from`/`to`: `n ne e se s sw w nw center z+ z-`, plus `distance`, `ease`, `duration`, `fade`, `blur`, `scale`, `rotate`.
- `Animate`, `Stagger`, `Keyframes`.
- Impact effects (all deterministic, each carries a default sound tag): `Shake` (`amp`, `freq`, `decay`, `axes`, `seed`, `start`, `duration`), `Thud`/`Impact` (`amp`, `freq`, `damping`, `axis`, `squash`), `PunchZoom`, `Slam`, `SquashStretch`, `Wobble`, `WhipPan`, `Glitch`, `RGBSplit`, `Pulse`, `Hitstop`.
- Reference math (use pure functions of time):

```ts
const shake = (t, { amp, freq, decay, seed = 1 }) => amp * Math.exp(-decay * t) * noise1D(t * freq, seed);
const thud  = (t, { amp, freq, damping }) => amp * Math.exp(-damping * t) * Math.cos(2 * Math.PI * freq * t);
```

**Transitions:** `cut`, `dissolve`, `dipToColor`, `wipe` (8 directions), `slide`, `push`, `flash`, `whipPan`, `zoomThrough`, `glitch`. (`shader(name)`: typed stub.)

**Color:** `ColorGrade` (basic controls: `exposure`, `contrast`, `saturation`, `vibrance`, `temperature`, `tint`, `highlights`, `shadows`, `whites`, `blacks`; wheels `lift`/`gamma`/`gain`/`offset`), `Curves` (rgb, r, g, b, luma), `Grain` (seeded), `Vignette`. Implement with SVG filters (`feColorMatrix`, `feComponentTransfer`) or CSS filters first; WebGL shader passes and `.cube` LUTs are "Later" (typed stubs). Evaluation order inside a stack: input transform, ColorGrade, Curves, look effects, output.

**Layer styles:** `DropShadow`, `Glow`, `Stroke`, `Blur`, `Vignette`.

**Blend modes:** normal, multiply, screen, overlay, soft-light, hard-light, difference, add, and the rest of the CSS `mix-blend-mode` set.

---

## 7A. Typography and fonts (core system; build in phase 1, font tools for MCP in phase 2)

Text is a first-class system, not a minor component. Fonts must be loaded, cached, checked and measured deterministically, because a wrong or late font changes layout and breaks repeatable renders.

### 7A.1 Font sources

Implement all four behind one `FontSource` interface:

1. **Local files:** `.woff2`, `.woff`, `.ttf`, `.otf` in the project's `fonts/` folder (static or variable).
2. **Google Fonts**, downloaded ahead of time and cached in `.codecut/fonts/`. Implement two routes and check the current official documentation for exact endpoints, parameters and quotas before coding:
   - **Developer API** (metadata: families, categories, variants, subsets, variable axes, file URLs). Needs an API key in env `GOOGLE_FONTS_API_KEY`. Use it for `font_search` and for license and axis metadata.
   - **CSS API** (`https://fonts.googleapis.com/css2?family=...`): returns `@font-face` rules with woff2 URLs per unicode-range subset. Request it with a modern User-Agent so it returns woff2, and put the wanted weights and variable axes in the query. Download every file it references and rewrite `src` to the local path.
   - **Offline fallback:** Fontsource npm packages (`@fontsource/<id>`, `@fontsource-variable/<id>`) ship the font files, for use when the APIs are unreachable.
3. **Any URL** to a font file: download once, hash, cache, and record in the ledger with the license the user supplies.
4. **System fonts:** only with an explicit `allowSystem`, because output differs per machine. The linter warns.

Rule: **renders never touch the network.** All font files must be on disk before a render starts. `codecut fonts sync` fetches whatever is missing and writes the hashes.

### 7A.2 Declaring fonts

```tsx
<Fonts>
  <Font id="display" family="Space Grotesk" source="google" weights={[500, 700]}
        variable axes={{ wght: [300, 700] }} subsets={["latin"]} />
  <Font id="body"    family="Inter" source="google" weights={[400, 600]} />
  <Font id="brand"   family="Acme Sans" source="./fonts/AcmeSans-Variable.woff2" />
  <Font id="deva"    family="Noto Sans Devanagari" source="google" subsets={["devanagari"]} />
</Fonts>
```

- `Font` props: `id`, `family`, `source` (`"google"`, a path, a URL, `"system"`), `weights`, `styles`, `variable`, `axes` (`wght`, `wdth`, `slnt`, `ital`, `opsz`, and custom axes with ranges), `subsets`, `unicodeRange`, `fallback`, `license` (required for path and URL sources).
- Themes and Looks map type tokens to fonts: `$type.display`, `$type.body`, `$type.mono`, `$type.numerals`, each with `font`, `size`, `weight`, `tracking`, `leading`.
- Multi-script text: declare a font per script and let `Text` use `fallback` stacks, so Latin and, for example, Devanagari mix correctly. Do not assume Latin only.

### 7A.3 Loading and determinism (critical)

1. The compiler emits `@font-face` rules that point at local files, with `font-display: block`.
2. Before the first frame, the renderer calls `document.fonts.load()` for every used family, weight, style and sample text, and awaits `document.fonts.ready`. If any font fails to load, **fail the render** with the font id and path. Never silently fall back.
3. Pin file hashes in `.codecut/fonts.lock.json`. A render with a changed font file fails unless the lock is updated.
4. Layout-dependent data (line breaks, glyph and line boxes used for per-line and per-character animation) is measured in headless Chrome after fonts load, cached by a hash of (text, style, font hashes, width), and stored in `.codecut/layout-cache.json`, so the same project lays out the same way every time.

### 7A.4 Typography props (on `Text`, `Title`, `Captions` and any text-bearing component)

| Group | Props |
| --- | --- |
| Face | `font` (id or token), `weight`, `width`, `style`, `size`, `axes` (animatable variable axes) |
| Spacing | `leading` (line height), `tracking` (letter spacing, in thousandths of an em), `wordSpacing`, `indent`, `paragraphSpacing`, `baselineShift` |
| Layout | `align`, `valign`, `maxWidth`, `box`, `wrap`, `balance`, `hyphenate`, `overflow`, `columns`, `direction` (ltr, rtl), `lang` |
| Case and features | `case` (none, upper, lower, title, small-caps), `features` (OpenType: `liga`, `kern`, `tnum`, `lnum`, `onum`, `ss01` to `ss20`, `salt` and so on), `numeric` (tabular figures for counters) |
| Fitting | `fit={{ minSize, maxSize, maxLines }}` shrinks to fit a box |
| Decoration | `underline` and `strike` (style, thickness, offset, animatable draw-on), `highlight` (marker box with padding, radius, color, animatable wipe) |

### 7A.5 Text styling

- **Fill:** solid, linear or radial gradient, image, or video clipped to the letter shapes.
- **Stroke:** `width`, `align` (inside, center, outside), `join`, `dash`, animatable.
- **Effects:** multiple `shadow`s, `glow`, `outline`, `blur`, `extrude` (3D, Later tier: typed stub), `glitch`, `rgbSplit`.
- **Rich text:** `<Text>` children `<Span>`, `<b>`, `<i>`, `<Highlight>`, `<Underline>`, or a `markup="**bold** and _italic_"` string. Spans can override font, weight, color and features.
- Every style prop above is declared in the schema (animatable where it makes sense).

### 7A.6 Text animators (After Effects-style)

```tsx
<Text text="Ship videos as code" font="$type.display" size={120}>
  <TextAnimator by="char"
    selector={{ start: 0, end: 1, offset: [[0, -1], [1.2, 1, "expo.out"]], shape: "smooth",
                randomize: { seed: 3, amount: 0.3 } }}
    props={{ opacity: 0, y: 40, blur: 12, tracking: 200, weight: 300 }} />
</Text>
```

- A selector gives each unit (`char`, `word`, `line`) an influence from 0 to 1 over time; the animator's props interpolate from the base value to the given value by that influence. All pure functions of time; randomness is seeded.
- Selector shapes: `square`, `ramp`, `triangle`, `smooth`, `wave`.
- Animatable per unit: `opacity`, `position`, `scale`, `rotation`, `skew`, `blur`, `tracking`, `weight` and other variable axes, `fill`, `stroke`, `shadow`.
- Presets: `typewriter`, `wave`, `scramble`, `rise`, `slam`, `blur-in`, `mask-reveal`, `weight-pulse`, `tracking-in`, `counter`.
- `SplitText` is the simple form of the same system.

### 7A.7 Measurement and layout API

- `measureText(text, style, { maxWidth })` returns lines, widths, heights, baselines and glyph boxes (measured in headless Chrome, cached as in 7A.3).
- Components use it for fitting, per-line reveals, caption wrapping, and placing things relative to text (`#title.bounds`).

### 7A.8 Lint rules for text and fonts

- **Missing glyph:** text contains characters not in the font. Error, list the characters. Use a font parser such as fontkit or opentype.js.
- Font without a ledger entry or with an unknown license: error.
- Network font URL used at render time: error.
- System font without `allowSystem`: warning.
- More than 3 font families in one composition: warning (configurable).
- Text below a configurable minimum size for the format, or outside the SafeArea: warning.
- Text contrast against its background below threshold: warning.

### 7A.9 License ledger for fonts

Fonts go in the same ledger as sounds, with `{ source, family, file, hash, license, url, attributionRequired, commercialOk }`. Record the license from the font's own metadata or license file. Google Fonts are generally under open licenses, but read each font's actual license and do not assume. `render` includes fonts in the license report.

### 7A.10 Font tools for MCP (phase 2)

See the MCP table: `font_search`, `font_get`, `font_list`, `font_preview`, `font_check`. `font_preview` renders a sample to a PNG so Claude can look at a face. Claude can check legibility and obvious problems from the image, but cannot reliably judge taste; the skill should tell it to surface font choices for my review.

---

## 8. Keyframes (core system, implement fully)

```ts
type Keyframe<T> = {
  t: Time            // local time (relative to the parent Scene)
  v: T
  in?: Handle        // how the curve arrives
  out?: Handle       // how it leaves
  hold?: boolean
  label?: string
}
type Handle = { ease: Ease } | { speed: number, influence: number }
// short form: [time, value, ease?]
```

Interpolation modes: `linear`, `hold`, `bezier` (free handles), `auto` (smooth, no overshoot), `continuous`, `ease` presets (`linear sine quad cubic quart expo circ back elastic bounce`, each `.in/.out/.inOut`), `bezier(x1,y1,x2,y2)`, `spring(stiffness, damping, mass?)`.

Rules:
1. Two keys on one property cannot share a time (typed error).
2. Before the first key hold the first value, after the last hold the last (unless looped).
3. Key times are in the parent's local time.
4. Keys and an expression can share a property: the expression gets the keyframed value as `ctx.value`.
5. Times snap to the frame grid when written.
6. Key times may be: a number, a `Time` string, a marker (`"@marker:name"`), a word time (`ctx.word(voiceId, i).start`), a beat (`ctx.beat(n)`), or another element's start/end (`"#t1.end+0.2"`). Resolve to seconds at compile time.
7. Spatial interpolation for `Vec2/Vec3`: `spatial: "linear" | "bezier" | "auto"`, `orient: "path"`, `separate: true` (independent x, y, z).

Keyframe operations API (pure functions returning `{ project, undo }`): `keyAdd`, `keySet`, `keyMove`, `keyDelete`, `keyCopy`, `keyPaste`, `keyScale`, `keyEase`, `keyMode`, `keyReverse`, `keyRove`, `keyLoop`, `keyBake`, `keySimplify`, `keySeparate`, `keyCombine`.

Expression context `ctx`: `ctx.prop("#id.prop")`, `ctx.noise(seed, freq)`, `ctx.beat(n)`, `ctx.word(voiceId, i)`, `ctx.value`, and helpers `lerp clamp smoothstep remap spring`.

---

## 9. Timeline edit operations API

Pure functions on the project AST, each returning `{ project, undo }` and a one-line description. The MCP server and (later) the UI call exactly these:

```
insert, overwrite, replace, lift, extract, split, trim, roll, slip, slide, move,
link, unlink, group, ungroup, nest, setSpeed, rippleDelete, snap,
lockTrack, muteTrack, soloTrack, addMarker, removeMarker
```

Rules: times snap to the frame grid; overlapping clips on a track are rejected unless `overlap` is set; locked tracks reject writes with a typed error; every operation yields an undo entry. Implement these in phase 1 on the AST; wire them to MCP in phase 2.

---

## 10. Phase 2 detail: MCP, sound, voice, audio, review, skill

### 10.1 MCP server (`@codecut/mcp`, stdio, runs with `npx`)

Working directory = project folder; reject paths outside it. Every write returns the AST patch, a one-line description and an undo token. Errors are typed with a `fix` hint: `schema_violation`, `track_locked`, `overlap_rejected`, `asset_missing`, `quote_required`, `license_blocked`.

Tools:

| Tool | Input | Output |
| --- | --- | --- |
| `project_create` | `name`, `size`, `fps`, `template?` | project path |
| `project_read` | `path?`, `depth?` | outline: tracks, scenes, ids |
| `element_add` | `parent`, `type`, `props`, `at?` | element id (props validated by schema) |
| `element_set` | `id`, `props` | patch |
| `element_remove`, `element_move` | `id`, `target?` | patch |
| `effect_add` | `id`, `effect`, `props` | effect id |
| `keyframe_set` | `id`, `prop`, `keys[]` | patch |
| `edit` | `op`, `args` | patch (any function from section 9) |
| `scene_write` | `id`, `tsx` | patch (parsed and linted first) |
| `lint` | `scope?` | issues[] |
| `frame_render` | `time`, `scale?` | PNG path |
| `contact_sheet` | `times[]` or `count` | PNG path |
| `sound_search` | `query`, `tags?`, `duration?` | results with license |
| `sound_get` | `id` | local path + ledger entry |
| `font_search` | `query`, `category?`, `subsets?`, `variable?`, `script?` | families with license, axes, subsets (Google Fonts API; needs key) |
| `font_get` | `id`, `weights?`, `axes?`, `subsets?` | local files, lock entry, ledger entry |
| `font_list` | none | fonts in the project and where they are used |
| `font_preview` | `fontId`, `text`, `size?` | PNG sample for Claude to look at |
| `font_check` | `text`, `fontId` | missing glyphs, fallback suggestions |
| `transcribe` | `audio` | word-timings file |
| `voice_quote` | `provider`, `text`, `voice` | price estimate (no spend) |
| `voice_generate` | `quoteId`, `confirm` | audio path (only after `confirm: true`) |
| `align_to_voice` | `voiceId`, mapping | patch |
| `mix_preview` | `range?` | audio path |
| `render` | `preset`, `range?`, `variants?` | file paths + license report |
| `history_list`, `history_restore` | `id?` | snapshots |
| `review` | `checklist?` | pass/fail per check + fixes |

Resources: `codecut://schema/{component}`, `codecut://project/outline`, `codecut://ledger`, `codecut://looks`.

Editing TSX from MCP: use `ts-morph`. Support a constrained subset of TSX for structured edits (literal props, arrays, object literals, known components). Anything else is an opaque expression: preserve it byte for byte and refuse structured edits on it with a clear error. Preserve formatting and comments.

### 10.2 Sound

- Freesound API client (API key from env `FREESOUND_API_KEY`; check the current official API docs for endpoints and auth). Cache downloads in `.codecut/assets/`.
- License ledger `.codecut/ledger.json`: `{ source, id, author, license, url, attributionRequired, commercialOk }`. `lint` fails when an asset has no ledger entry; `render` writes a credit text file for entries that need attribution.
- Default filter: allow CC0 and CC-BY (auto-credits). Config can restrict to CC0 only.
- Each sound has a marked `peak` time (store in ledger or sidecar). `Sound` starts early by that amount so the peak lands on `at`.
- Sound tags for Freesound search by job: `ui/pop`, `ui/tap`, `ui/tick`, `move/whip`, `move/whoosh-deep`, `hit/land`, `hit/punch`, `hit/boom`, `tech/click`, `tech/data`, `tech/glass`, `tech/success`, `tech/glitch`. Effects with a `sound` tag can call `autoSound`.
- You cannot listen to audio. Do not claim a sound "sounds right". Use Freesound tags and descriptions, measured duration and peak, and tell me which sounds I must audition.

### 10.3 Voice and transcription

- Provider interface with: a recording I supply (default), local TTS (stub, document what to install), ElevenLabs (env `ELEVENLABS_API_KEY`, quote first, `confirm: true` to run).
- `transcribe`: run local Whisper if installed (detect and document), otherwise return a clear error. Output `[{ w, start, end }]` in `voice.words.json`.
- `Voiceover` loads audio + words; `ctx.word(voiceId, i)` and `<Captions>` use the timings. Captions styles: `karaoke`, `pop`, `line`, `word`; export `.srt`/`.vtt`.
- Order of work in the skill: script, voice, then build; animations that depend on voice are timed after the voice exists.

### 10.4 Audio mix

Build an event list from the compiled project and mix offline with FFmpeg. Buses: `voice`, `music`, `sfx`, `master`. Music ducks under voice (`sidechaincompress` or an equivalent filter) by `duckAmount`. Master normalizes to a target LUFS from the export preset (`loudnorm`). The mix must be deterministic.

### 10.5 Review loop

`review` = lint + render a contact sheet + check against the checklist below. The skill tells Claude to run a second, separate pass over the contact sheet and fix failures, up to 3 rounds, then show what still fails.

Checklist (initial 17; refine later):
1. Frame 0 has motion.
2. A hero element carries across 4+ beats.
3. Something new at least every 2 s.
4. No static frame longer than 0.5 s.
5. Every spoken word on screen is in sync with the voice.
6. Numbers shown add up.
7. No overlapping or clipped text.
8. All text inside the SafeArea for the format.
9. Contrast of text against its background passes.
10. Every impact effect has a sound on its frame.
11. Voice is always on top in the mix.
12. Loudness within target.
13. Transitions are used with intent (not random).
14. Looks and type are consistent with the chosen Look.
15. Captions readable (line length, reading speed).
16. All assets have ledger entries.
17. CC-BY credits are present in the license report.

### 10.6 Director skill (`skills/motion-studio/`)

A Claude Code skill with `SKILL.md` and reference files. The skill is the director; MCP tools are the hands.

Workflow with approval gates (the skill must make Claude stop and wait at each "OK" gate):
1. **Intake (OK):** what is being made, who for, where it plays, format. Use only the user's own answers; never fill the brief in for them.
2. **Script (OK):** three hook options, then the full script. Spoken-friendly sentences.
3. **Look and style frames (OK):** pick a Look; render stills first.
4. **Voice:** record or generate (quote and confirm).
5. **Storyboard:** scenes with timings.
6. **Build:** scene by scene via MCP; lint after each scene.
7. **Sound:** place sounds on impacts; mix.
8. **Review:** the loop above.
9. **Draft, then final (OK):** render a draft preset; render the final only after approval.

Files:
```
skills/motion-studio/
  SKILL.md
  references/components.md     # generated from schemas
  references/motion.md         # easing, stagger, overlap, push-in rules, impact patterns
  references/sound.md          # tag meanings, placement, licensing
  references/typography.md     # pairing, sizes, hierarchy, captions, numerals, per-Look font pairs, how to use font_preview
  references/saas-promo.md     # the 6-beat structure (hook, problem, reveal, features, proof, CTA)
  references/review.md         # the checklist
  looks/                       # one JSON/TS file per look
  examples/                    # one finished project
```

Looks: ship three to start (Kinetic, Minimal, Sketch). A Look is data: palette, font pairing (display, body, mono) with type scale and tracking, easing set, signature transition, texture (grain, noise), default sound palette. Typography rules the skill must teach: one display face plus one body face, get contrast from weight and width instead of adding families; tabular figures for counters; tracking for all-caps; readable sizes and safe areas for each format; caption rules (line length, reading speed). Each Look needs one hand-polished reference scene.

Motion rules the skill must teach: never linear motion; fast-in slow-settle easing; slight overshoot for pops; stagger 0.05 to 0.1 s; overlap actions; slow constant push on the camera; parallax between depth layers; sound on every landing.

---

## 11. Testing and gates

Tests to write:
1. **Unit:** time parsing, easing, keyframe evaluation, noise, schema validation, every edit operation (with undo).
2. **Compiler:** snapshot the HyperFrames HTML for the example project.
3. **Golden frames:** render chosen frames of each visual component and compare by perceptual hash with a small tolerance.
4. **Double render:** render the example twice and compare output bytes (or frame hashes if the container embeds timestamps; say which).
5. **Linter:** one failing fixture per rule (impure expression, out-of-range prop, missing id, missing ledger entry, locked track write).
6. **Schema round trip:** every control keeps its value through JSX, validation and an MCP call.
7. **Codemod:** structured edits preserve formatting and comments; opaque expressions are untouched.
8. **MCP:** call every tool through the SDK client against the example project.
9. **Fonts:** a project using one Google font, one local font and one variable font renders correctly; a missing font fails the render naming the font id; hashes in `fonts.lock.json` are enforced; renders make no network requests.
10. **Glyph coverage lint:** text with characters missing from its font is rejected, with the characters listed (include a Devanagari fixture).
11. **Text layout:** `measureText` and the layout cache give identical line breaks on two runs; golden frames cover each text style (fill, gradient, stroke, shadow, highlight, animators, variable-axis animation).

### Gate 1 (end of phase 1)
- `codecut render examples/saas-promo` produces an MP4.
- The same project renders identical frames twice.
- Golden-frame tests pass. All unit tests pass.
- A text-heavy test project (one Google font, one local custom font, one variable font with an animated axis, one Devanagari line) renders correctly after `codecut fonts sync`; removing a font file makes the render fail with a clear error.
- Report: command outputs, the file size and duration of the MP4, and anything skipped.

### Gate 2 (end of phase 2)
- With the MCP server added to Claude Code, a fresh session using the `motion-studio` skill can produce a 30 s 9:16 SaaS promo from a one-paragraph brief, pass `review`, and render it.
- Sounds come from Freesound (or a documented stub if no key) with ledger entries and a license report.
- The voice quote/confirm gate is demonstrated with a test double.
- Report which parts I must verify locally (live Freesound calls, Whisper, ElevenLabs, GPU-dependent rendering).

---

## 12. Later (design context only; do not build now)

- **Phase 3, editor UI:** extend HyperFrames Studio. Panels: preview, timeline, canvas, graph editor, inspector (generated from schemas), code (Monaco), color, audio, assets, agent feed, render, history. One selection model. The TSX file stays the source of truth; UI edits become AST patches written back by codemod; Claude's MCP edits show live as pending patches.
- **Phase 4, graphics and 3D:** vector tools (pen tool writing `<Path>`), `Scene3D` on react-three-fiber with `Screen3D` (a live UI component mapped onto a device mesh), advanced effects, WebGL grading with `.cube` LUTs and scopes.
- **Phase 5, pro layer:** format variants (9:16, 16:9, 1:1, 4:5), data-driven batch renders from CSV, project history with named snapshots, plugin system, tracking and stabilization, multicam, text-based editing, AWS Lambda rendering.

Design constraints from these phases that apply now: keep the AST serializable, keep schemas rich (`ui`, `step`, `unit`), keep every edit a patch with an undo entry, and keep 3D motion expressible as pure functions of time.

---

## 13. Defaults for open questions (use these unless I say otherwise)

- Runtime: a light custom JSX factory (`jsxImportSource`) that builds an element tree for the compiler. React is only for the future editor UI and 3D.
- Preview: reuse the HyperFrames player (phase 3).
- Sound license filter: CC0 and CC-BY allowed, with automatic credits.
- Voice: user-supplied recording by default; ElevenLabs behind quote/confirm; local TTS as a documented stub.
- Color space: SDR sRGB only.
- Fonts: Google Fonts through the CSS API by default (no key needed), Developer API for search and metadata when `GOOGLE_FONTS_API_KEY` is set, Fontsource as the offline fallback; all fonts cached locally and locked by hash; renders never use the network.
- Name: "CodeCut" (one constant).

---

## 14. Definition of done for each phase

- All tests pass and CI-style commands are documented in `README.md` (`pnpm i`, `pnpm test`, `pnpm build`, `codecut render examples/saas-promo`).
- `docs/hyperframes-notes.md` lists verified HyperFrames facts and any differences from this prompt.
- `docs/spec.md` and generated `docs/components/*.md` match the code.
- A short `CHANGELOG.md` entry per phase.
- A final message that states: what was built, what you ran and its output, what is stubbed, what I must verify locally, and the next step.

Start now with the plan.