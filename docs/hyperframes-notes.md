# HyperFrames notes (verified facts)

Verified against `hyperframes@0.8.186` on 2026-10-23 (macOS arm64, Node v25.9, system Chrome 152,
FFmpeg 7.1.1). Sources: `npx hyperframes --help`, `docs <topic>`, scaffold from `init`, the shipped
skills in `node_modules/hyperframes/dist/skills/` (`hyperframes`, `hyperframes-cli`, `media-use`),
and real test renders. **Installed version wins over the prompt.** Differences are listed at the end.

## CLI used by flomotion

| Need                     | Command                                                                                  |
| ------------------------ | ---------------------------------------------------------------------------------------- |
| Render                   | `hyperframes render <dir> -o out.mp4 [-f 30] [-q draft\|looks\|delivery] [-w 1] --quiet` |
| Lint+runtime check       | `hyperframes check <dir> --json` (also `lint --json`, `validate`)                        |
| Still frames             | `hyperframes snapshot <dir> --at 1.5,3 -o <outdir> --no-end` (exact instants)            |
| Timeline listing         | `hyperframes timeline <dir> --json`                                                      |
| Beats / transcribe / tts | `beats`, `transcribe` (whisper-cpp), `tts` (Kokoro, local) exist; optional               |
| Env health               | `hyperframes doctor` (reports FFmpeg, Chrome, whisper-cpp, memory)                       |

Render writes `renders/<name>.mp4` by default; `-o` overrides. Telemetry: set
`HYPERFRAMES_NO_TELEMETRY=1` and `DO_NOT_TRACK=1` for child processes (flomotion does).

## Project / composition contract

- A project is a directory with `index.html` (+ optional `hyperframes.json`, `meta.json`,
  `assets/`, `compositions/`). `hyperframes.json` is written by `init`; render works without
  sub-compositions.
- Root: `<div id="root" data-composition-id="main" data-start="0" data-duration="<s>" data-width="W" data-height="H">`.
  Root `data-duration` is the film length; overrun is cut, early end holds last frame.
- Timed element: `class="clip"` + `data-start` + `data-duration` (seconds). Visible over
  `[start, start+duration)`; an end-state landing exactly on the end is never rendered.
- **`data-track-index` is a Studio lane only.** Render never reads it. Paint order = CSS `z-index`.
- Timeline: one paused GSAP timeline per composition, registered _after_ its tweens:
  `window.__timelines = window.__timelines || {}; window.__timelines["<composition-id>"] = tl;`
- Supported GSAP methods: `set`, `to`, `from`, `fromTo`. Prefer `fromTo` (seek-back safe).
  Absolute positions as 3rd arg.
- Forbidden: `Date.now()`, unseeded `Math.random()`, network fetches, timers, `repeat:-1`,
  tweening `display`/`visibility`/`autoAlpha` on a `.clip`, CSS `transform` on a GSAP-transformed
  element (`gsap_css_transform_conflict`), tween of the `.clip` element itself
  (`gsap_animates_clip_element`: animate a child or its `opacity`).
- Nested timed clips: a clip inside another timed element takes `data-start` from the
  _composition_, not the parent, and shows only while the parent shows. flomotion avoids this:
  timed wrappers (scenes) have _untimed_ children, or all layers are flat siblings.
- Seek protocol for non-GSAP drawing: `window.addEventListener("hf-seek", e => draw(e.detail.time))`
  (`e.detail.waitUntil(promise)` for async). No rAF clock. Heavy setup:
  `window.__hf.buildReady["key"] = promise`.
- Media: `<audio id=... data-start data-duration data-volume data-media-start>`; every `<audio>`
  needs an `id`; no `crossorigin`; `<video>` needs `muted` or `data-has-audio="true"`.
  `data-volume` 1 = 0 dB, up to 3.98. Edge fades `data-fade-in/out`.
- Asset paths root-relative (`assets/...`). Images without `data-duration` last 3 s.
- Variables: `data-composition-variables` on `<html>`, `--variables '{}'` on render.
  (flomotion does not use these in phase 1/2.)
- Sub-compositions: files in `compositions/` wrapped in `<template>`, mounted with
  `data-composition-src`. Host id == scene root id == timeline key, else 45 s wait per scene.
  flomotion phase 1 emits one flat `index.html` and does not use sub-compositions.

## GSAP loading

The scaffold loads GSAP from jsDelivr CDN. **flomotion instead vendors the file**:
`<script src="vendor/gsap.min.js">` with a copy of `gsap@3.14.2/dist/gsap.min.js` written into the
project at compile time (render verified with a local script, no CDN). The `gsap` npm package is
a `@flomotion/render` dependency.

## Fonts (important for determinism)

- Bundled by name (no @font-face needed): Inter, Montserrat, Outfit, Nunito, Oswald, League Gothic,
  Archivo Black, Space Mono, IBM Plex Mono, JetBrains Mono, EB Garamond, Playfair Display,
  Source Code Pro, Noto Sans JP, Roboto, Open Sans, Lato, Poppins.
- **For bundled names HyperFrames fetches from Google Fonts at render and caches in
  `~/.cache/hyperframes/fonts/<family>/`** (observed log: `Fetched 11 font face(s) for "Inter"
from Google Fonts`). This is network use at render, so flomotion always emits its own
  `@font-face` for every used family and refuses bare-name use of bundled families.
- A local `@font-face` with `src:url('assets/fonts/x.woff2')` is embedded as a data URI
  (`Embedded local font file ... → data URI`) and makes no network request. Verified.
- **A missing font file does NOT fail HyperFrames**: the render succeeds (exit 0) with a
  fallback face and only logs `[FileServer] 404 Not Found: /assets/fonts/x.woff2`. Therefore
  flomotion must do its own pre-render font gate (file exists, hash matches lock, `document.fonts.load`
  succeeds in headless Chrome). Implemented in `@flomotion/render` (`fontGate`).
- `hyperframes lint` rule `font_family_without_font_face` fires for unbundled families without
  `@font-face`.
- `window.__hyperframes.fitTextFontSize(...)` and `.pretext` exist; flomotion uses its own
  Chrome measurement instead so results are cached/hashed.

## Rendering behaviours observed

- Same project rendered twice on one machine gives **byte-identical MP4** (md5 equal). MP4 tags:
  `hyperframes_version`, `hyperframes_renderer`, `encoder=Lavf61.7.100` — no timestamps.
  Docker mode (`--docker`) is the documented route for cross-machine determinism.
- Output: H.264, `yuv420p`, 30 fps default, size from root `data-width/height`.
- 8 GB machine triggers _low-memory profile_: 1 capture worker, screenshot capture.
  First render downloads/caches fonts and takes ~1.5 min; warm render of 2 s took ~5 s.
- Static-frame dedup reuses identical frames (speeds up holds).
- `check` runs lint + runtime + layout + contrast; warns `first_frame_empty`, `line_unread`,
  `sweep_static` etc. (useful input for flomotion `review`.)
- Chrome: uses system Chrome if found, GPU probe `hardware` (Metal) on this machine.
  `--no-browser-gpu` forces SwiftShader (more deterministic across machines).

## Differences from the prompt

| Prompt                                     | Installed reality                              | flomotion decision                                                             |
| ------------------------------------------ | ---------------------------------------------- | ------------------------------------------------------------------------------ |
| `data-track-index` positions layers        | Studio lane only; z-index paints               | Compiler emits both; z-index from track order                                  |
| Fonts from `document.fonts.load` fail-hard | HF itself silently falls back                  | Own `fontGate` pre-render step                                                 |
| GSAP "loaded the way HF expects" (CDN)     | CDN in scaffold; local script works            | Vendor GSAP locally                                                            |
| No network at render                       | HF auto-fetches Google fonts for bundled names | Always emit own `@font-face`, lint bare bundled names                          |
| Byte-identical double render               | True on same machine (no timestamps)           | Compare bytes; fall back to frame hashes if a future version embeds timestamps |
| Audio mix by HF                            | HF mixes `<audio>` tags itself                 | flomotion mixes offline with FFmpeg and emits one `<audio id="mix">`           |
| Transcribe                                 | `hyperframes transcribe` (whisper-cpp) exists  | Prefer `whisper-cpp` via HF; error if missing                                  |

## Verified later while building

- **Google Fonts CSS API v2** (checked at developers.google.com/fonts/docs/css2): endpoint
  `https://fonts.googleapis.com/css2?family=<spec>&display=block`; axes alphabetical (`ital` before `wght`),
  tuples sorted numerically, ranges `300..700`. A modern Chrome User-Agent returns woff2 split into `/* subset */`
  `@font-face` blocks with `unicode-range`. Developer API: `https://www.googleapis.com/webfonts/v1/webfonts?key=…`
  (`capability=VF` adds `axes`). No quotas are documented.
- Google serves woff2 with the licence text **stripped** (only a copyright string remains), so flomotion reads the
  family's real licence from `github.com/google/fonts/<ofl|apache|ufl>/<family>/METADATA.pb`.
- **CSS `mask: url(#svgMask)` is not applied to HTML elements in headless Chrome 152** (the golden frames showed no
  masking). Masks are implemented as a data-URI SVG `mask-image` instead.
- GSAP seeks are exact for a master tween driving `onUpdate`, including out-of-order `snapshot --at` times;
  `snapshot` and `render` agree frame for frame.
- Running under `tsx` injects an esbuild `__name` helper into functions passed to `page.evaluate`; the measurement
  page defines a no-op `window.__name`.

## Verified in phase 2

- `hyperframes check <dir> --json` prints a banner line, then one JSON object with `lint`, `runtime`, `layout`,
  `motion` and `contrast`, each `{ ok, errorCount, warningCount, findings[] }`. `layout.samples` lists the times
  it measured (about nine for 30 s); contrast findings carry `text`, `fg`, `bg`, `ratio`, `time`. A 30 s check takes
  about a minute on this machine. The `lint` block warns `nested_structure_needs_subcomposition` for flomotion's
  track wrappers; flomotion ignores it (renders are correct).
- `hyperframes transcribe <audio|transcript> -d <dir> --json [--no-runtime-install] [-l lang] [-m model]` writes
  `transcript.md` in `<dir>`; with `--json` it prints `{ ok, engine, wordCount, transcriptPath, … }` or
  `{ ok:false, error }` (`--optional` returns `{ skipped, reason:"whisper_unavailable", install }`). Engines: Parakeet
  if installed, else whisper.cpp. Not run here (no whisper-cpp installed); the word shape is read tolerantly
  (`text|word|w`, `start`, `end`).
- Freesound APIv2 (docs.freesound.org, checked): token auth is `Authorization: Token <key>` or `?token=`; text
  search is `GET /apiv2/search/text/` (the resources page also lists `/search/`) with `query`, `filter`
  (`duration:[a TO b]`, `tag:x`), `fields`, `page_size` (max 150); sound fields include `previews` with
  `preview-hq-mp3`; downloading the original file needs OAuth2. Licence values are names ("Creative Commons 0",
  "Attribution", "Attribution NonCommercial") or Creative Commons URLs; both are mapped. Rate limits are not
  published numerically. **No live call has been made.**
- ElevenLabs (checked): `POST /v1/text-to-speech/{voice_id}/with-timestamps?output_format=mp3_44100_128`, body
  `{ text, model_id }`, response `{ audio_base64, alignment: { characters, character_start_times_seconds,
character_end_times_seconds } }`. The docs fetched did not state the auth header or per-character credit cost:
  `xi-api-key` is used and the credit estimate is an assumption. **No live call has been made.**
- `tsx` applies a tsconfig only to files under the tsconfig's directory and reads it at registration, so a
  published flomotion cannot rely on it. The bundled CLI compiles project TSX itself (esbuild, automatic JSX runtime
  from `@flomotion/core`) and maps `@flomotion/*` imports with a Node resolve hook.
