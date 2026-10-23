# Automatic checks (23 + 5 pattern checks)

## Who computes each check (read this first)

The `review` tool computes 17 checks of its own (numbered 1 to 17 in its output). The skill's check ids below map to them or to a procedure you run. **Say which ones you ran.** A check nobody ran is "not run", not "pass".

| Skill check | Computed by | Notes |
|---|---|---|
| `motion-frame0` | `review` #1 | Something changing within 0.1 s (stricter than `first_motion_max_s`) |
| `no-dead-frames` | `review` #4 | From the compiled animation; it does not know your `hold` ranges, so report deliberate holds in `LOG.md` |
| `novelty-rate` | `review` #3 | |
| `text-overlap`, `text-clipped` | `review` #7 | Measured in a rendered page at about nine times; skipped with `deep:false` (then read the frames) |
| `safe-area` | `review` #8 | Uses the `SafeArea` presets (reels, shorts, tiktok, feed). For other formats check `safe_area_px` yourself |
| `contrast` | `review` #9 | Floor 3:1 measured; verify 4.5:1 for body text from the look's palette yourself |
| `min-size` | **you** | Read sizes with `project_read` or the schema and compare with `text.min_px`; the engine only rejects text under about 28 px |
| `reading-speed`, `text-words` | **you** | Count words per beat from the props and the visible duration |
| `font-glyphs` | `lint` (rule `missing-glyph`), `font_check` | |
| `type-families` | **you** (`font_list`) | The engine warns above 3 families; the skill limit is 2 |
| `voice-sync` | `review` #5 (captions) + **you** | Report the `align_to_voice` output for word-tied elements |
| `sound-on-impact` | `review` #10 | |
| `mix-voice-on-top` | `review` #11 (heuristic) | Compares gains and the duck amount; it does not measure 12 dB. Say so |
| `loudness`, `clipping-audio` | `review` #12 | Integrated LUFS within 1.5 LU of -14 and true peak under -1 dBTP |
| `palette-adherence` | **not run** | No tool measures frame colours. Use only `$brand.*` tokens and say it was not measured |
| `look-consistency` | `review` #14 (partial) + **you** | Theme set and font count; you check easing and transition tokens |
| `hero-continuity` | `review` #2 | A layer spanning four scenes passes; otherwise it is "needs eyes" |
| `cta-present` | **you** | Last scene has a readable URL or button and holds at least 1 s |
| `assets-licensed`, `credits-present` | `review` #16, #17 | |
| `determinism` | **not run** by `review` | The server rejects impure TSX and lint rejects impure expressions. Byte-identical renders were verified on one machine only. Say so |
| `turn-present`, `product-after-turn`, `proof-sourced`, `logo-late` | **you** | Use the `turn` marker and the storyboard's `source` fields |
| `transition-count` | `review` #13 (partial) | |

Engine checks the skill did not list but you should report: `review` #6 (numbers to add up: you do the arithmetic) and #15 (caption line length and reading speed).

## The checks

Every check returns `{ id, severity: "hard"|"warn"|"info", pass, evidence, time?, bbox?, fix_hint }`. HARD failures block a draft from being shown as passing. All thresholds come from `config/thresholds.json`.

| Id | Check | How computed | Sev |
|---|---|---|---|
| `motion-frame0` | Something moves within `first_motion_max_s` | Frame difference between frame 0 and frame at the limit above threshold | HARD |
| `no-dead-frames` | No static stretch > `max_static_s` | Sliding-window frame diff; ignore ranges tagged `hold` in the project | HARD |
| `novelty-rate` | >= 1 new element/scene change per `novelty_window_s` | Timeline IR: element starts, scene changes, color/camera events | WARN |
| `text-overlap` | No overlapping text or key components | Bounding boxes of text and key layers per frame (headless Chrome) | HARD |
| `text-clipped` | No clipped text (unless `cropEdge`) | Text bounds vs container and frame | HARD |
| `safe-area` | Text inside format safe area | Text bounds vs `safe_area_px` | HARD |
| `contrast` | Text readable on its background | Sample pixels behind text, ratio >= 4.5 (3.0 large) | HARD |
| `min-size` | Text not below minimum | Computed font px vs `text.min_px` | WARN (headline: HARD) |
| `reading-speed` | Words/s within limits | On-screen text words / visible duration | WARN |
| `text-words` | Headline <= 6 words (8 hard) | Count words per beat | WARN/HARD at 9+ |
| `font-glyphs` | All characters exist in the font | Font parser coverage | HARD |
| `type-families` | <= 2 families | Distinct families used | WARN |
| `voice-sync` | Word-tied animations land on words | Compare key times to word timings, tolerance frames | HARD |
| `sound-on-impact` | Impact effects have a sound peak on their frame | Match effect times with placed sound peaks | WARN |
| `mix-voice-on-top` | Voice >= 12 dB over music during speech | Offline mix levels per window | HARD |
| `loudness` | Master near target LUFS | FFmpeg loudness measure | HARD |
| `clipping-audio` | No digital clipping; true peak <= -1 dBTP | Peak analysis | HARD |
| `palette-adherence` | Colors stay within the look palette | Dominant colors per frame vs palette (deltaE tolerance) | WARN |
| `look-consistency` | Fonts, easing, transitions match the look | Compare tokens used vs look | WARN |
| `hero-continuity` | A hero element carries across beats | Track designated hero element ids | WARN |
| `cta-present` | Last block is a CTA with readable URL/button, hold >= 1 s | Timeline IR | WARN |
| `assets-licensed` | All assets, sounds, fonts in the ledger | Ledger lookup | HARD |
| `credits-present` | Required attributions in license report | Ledger flags vs report | HARD |
| `determinism` | Same project renders the same frames | Render `sample_frames` twice, compare | HARD |

## Pattern checks (from `patterns.md`)
| Id | Check | Sev |
|---|---|---|
| `turn-present` | A declared `Turn` marker exists and the look/space changes there | WARN |
| `product-after-turn` | First product block comes after the turn (or story has no pain) | WARN |
| `proof-sourced` | Every number/credential/quote has a `source` and `permission` | HARD |
| `logo-late` | Brand logo appears after 30% of runtime (unless brand-first is intended) | INFO |
| `transition-count` | No more than 1 non-cut transition type per 3 scenes | INFO |

## Review output

`review` returns all results plus a contact sheet with failing frames outlined and a summary:

```
Checks: 27 run, 24 pass, 2 warn, 1 HARD fail
HARD: contrast @ 0:07.4 — text "Sources" on #8FA4FF = 2.9:1 (need 4.5). Fix: use `text` token on `bg`, or add scrim.
WARN: novelty-rate @ 0:12-0:15 — no new element for 3.1 s. Fix: add a card or camera move at 0:13.2.
```

## Reading the checks
- Fix HARD first, WARN second. If a WARN is intentional (a deliberate hold), mark it in the project with the reason; do not silence silently.
- If a check seems wrong, say so with the evidence; do not edit thresholds mid-run. Propose a change in `CHANGELOG.md`.
- A check passing never proves the video is good; it proves the floor is met.
