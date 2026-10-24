# Changelog

Format: date, what changed, why (evidence), effect on the 10-brief eval.

## 2026-10-25: v0.4.0 (flomotion 0.4.0)
- Setup and the person's own material: `setup_status` first; Round 0 of the interview asks how voice, word timings, sound effects and graphics will be supplied (own files first, services optional). New tools in `mcp-tools.md`: `voice_import`, `transcript_import` (with precision: word, cue, estimated), `sound_import`, `asset_import`.
- `references/assets.md`: where each SaaS graphic comes from (icons, logos with permission, screenshots, brand from the person's site, photos), the asset plan in the storyboard, permission rules. New tools: `asset_search`, `asset_get`, `asset_capture`, `brand_extract`.
- `workflow.md`: materials check at G0, asset plan at G4, asset pulling before the draft build. `sound.md`: own sound files and own transcripts.
- Evidence: package tests (every tool, live Iconify and Openverse, the setup wizard, skill structure). Eval on the 10 briefs: not run.

## 2026-10-24: v0.3.0 (shipped in the flomotion package)
- Reconciled with the real MCP: `references/mcp-tools.md` rewritten with the 30 real tools, call order, error codes; `references/checks.md` says which checks `review` computes (17) and which the agent computes or cannot run; `sound.md` uses the real sound tags and `sound_auto`.
- Added `references/block-recipes.md` (13 core blocks as TSX, linted by the package tests) and `references/components.md` (generated).
- The three looks now exist in the engine (`theme="$look.clean-light" | "dark-product" | "bold-kinetic"`), derived from `looks/*.md`; a test keeps palette, fonts and easing in sync.
- Live view: SKILL.md tells the person about `flomotion ui` and what it shows; the agent keeps the gate files current.
- Evidence: package tests (skill files, recipes lint, looks sync, installer). Eval on the 10 briefs: not run.

## 2026-10-23: v0.2.2
- Product name flomotion renamed to flowmotion in all files.

## 2026-10-23: v0.2.1
- Renamed skill to flomotion-studio.

## 2026-10-23: v0.2.0
- Added `references/interview.md` (9 adaptive rounds, 28 must-have fields, clarity score >= 90%, mandatory read-back) and `dataset/brief-template.md`.
- SKILL.md rule 0 and G0 now require the interview. Reason: user asked for an extensive, adaptive interview before any design work.
- Eval: not run yet.

## 2026-10-23: v0.1.0
- Initial package: SKILL.md, 16 references, 3 starter looks, 9 reference annotations, thresholds, eval briefs.
- Evidence: 8 reference ads annotated from still frames (user-collected from one compilation). No ratings or durations yet.
- Eval: not run yet.

## 0.4.0: Markdown only, the storyboard board, clean styles

- **No JSON in the skill.** Looks, thresholds, the reference annotations and the schemas are Markdown tables a model reads directly; the gate files are `brief.md`, `script.md`, `storyboard.md` (a project that still has the `.json` versions is read too).
- **The Storyboard tab:** `ideas.md` (brainstorm) and `storyboard.md` (the plan) show in the live view as a board and a timeline that turns green as scenes are built. New `references/storyboard.md`.
- **New references:** `clean-styles.md` (from three reference pieces: character story, glowing thread, build-as-story), `script-craft.md` (the engineered script), `transitions.md` (signature transitions with TSX: the two-dots turn, the vault door, the mascot).
- **Example:** `examples/flomotion-ad/`: the 30 s ad for flomotion itself, with its script, storyboard and an honest log.
