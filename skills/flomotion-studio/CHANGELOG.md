# Changelog

Format: date, what changed, why (evidence), effect on the 10-brief eval.

## 2026-10-24: v0.3.0 (shipped in the flomotion package)
- Reconciled with the real MCP: `references/mcp-tools.md` rewritten with the 30 real tools, call order, error codes; `references/checks.md` says which checks `review` computes (17) and which the agent computes or cannot run; `sound.md` uses the real sound tags and `sound_auto`.
- Added `references/block-recipes.md` (13 core blocks as TSX, linted by the package tests) and `references/components.md` (generated).
- The three looks now exist in the engine (`theme="$look.clean-light" | "dark-product" | "bold-kinetic"`), derived from `looks/*.json`; a test keeps palette, fonts and easing in sync.
- Live view: SKILL.md tells the person about `flomotion ui` and what it shows; the agent keeps the gate files current.
- Evidence: package tests (skill files, recipes lint, looks sync, installer). Eval on the 10 briefs: not run.

## 2026-10-23: v0.2.2
- Product name CodeCut renamed to flowmotion in all files.

## 2026-10-23: v0.2.1
- Renamed skill to flomotion-studio.

## 2026-10-23: v0.2.0
- Added `references/interview.md` (9 adaptive rounds, 28 must-have fields, clarity score >= 90%, mandatory read-back) and `dataset/brief.schema.json`.
- SKILL.md rule 0 and G0 now require the interview. Reason: user asked for an extensive, adaptive interview before any design work.
- Eval: not run yet.

## 2026-10-23: v0.1.0
- Initial package: SKILL.md, 16 references, 3 starter looks, 9 reference annotations, thresholds, eval briefs.
- Evidence: 8 reference ads annotated from still frames (user-collected from one compilation). No ratings or durations yet.
- Eval: not run yet.
