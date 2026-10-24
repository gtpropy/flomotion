# flomotion-studio skill package

A constraint layer for Claude driving the flomotion MCP (a video is one TSX file, rendered by HyperFrames). It makes output consistently professional by forcing a gated workflow, data-driven looks, reusable scene blocks, and automatic checks.

## Structure

```
flomotion-studio/
  SKILL.md                      entry point (short, procedural)
  README.md                     this file
  CHANGELOG.md                  record every change with its evidence
  config/
    thresholds.md             all numeric defaults (tunable, proposals)
  references/
    interview.md                extensive adaptive interview (G0), clarity score
    workflow.md                 gates, unattended rules
    catalogue.md                analysis of the 8 reference ads
    patterns.md                 21 distilled rules
    styles.md                   7 style-family recipes
    looks.md                    look token spec + 3 starter looks
    blocks.md                   scene block library and parameters
    story-templates.md          15 s / 30 s / 45 s beat sheets
    decision-tables.md          brief -> style, look, template
    copywriting.md              hooks, word limits, proof, CTA
    motion.md                   easing, timing, impacts, transitions
    typography.md               type scale and emphasis
    sound.md                    sound palettes and mix
    checks.md                   23 automatic checks
    review.md                   review protocol and rubric
    anti-patterns.md            mistakes with before/after
    mcp-tools.md                the real tool list and call order
    assets.md                   where graphics come from, the asset plan, permission rules
    block-recipes.md            TSX recipes for the 13 core blocks (linted by tests)
    transitions.md              signature transitions with TSX: slab, iris, stripes, the two-dots turn, the vault door, the mascot
    script-craft.md             the engineered script: hook, pain, turn, promise, proof, reveal, CTA
    clean-styles.md             what clean, catchy motion looks like, from three reference pieces
    storyboard.md               the Storyboard tab: ideas.md, storyboard.md, what the board shows
    components.md               generated from the schemas
  looks/
    clean-light.md  dark-product.md  bold-kinetic.md
  dataset/
    schema.md                   reference-ad annotation schema
    brief-template.md           interview output (brief) template
    rating-sheet.md             human rating template
    annotations/*.md          one file per reference ad
  evals/
    briefs/briefs.md            10 invented test briefs
    README.md                   how to run and compare
  examples/
    saas-promo/                 a finished 30 s project (engine look)
    flomotion-ad/               the 30 s ad for flomotion itself: project, script, storyboard, log
    engine-looks/               reference scenes for the engine's kinetic, minimal, sketch looks
```

## Install

```bash
npx -y flomotion install skill              # for all your projects: ~/.claude/skills/flomotion-studio
npx -y flomotion install skill --project    # only this folder: ./.claude/skills/flomotion-studio
```

(`flomotion install skill` is the same command if the package is installed.) Then add the MCP server in your video folder:
`claude mcp add flomotion -- npx -y flomotion mcp --dir . --ui`, and open the printed address to watch progress.

Claude loads `SKILL.md` on a video request and reads references only when a step needs them.

## What is verified and what is not

- Verified: the file structure is complete and every file named in SKILL.md exists.
- Reconciled with the real tool list (v0.3.0): `references/mcp-tools.md` named the 30 tools the server had then (39 from v0.4.0), and `references/checks.md` says which checks `review` computes and which you compute. The three looks exist in the engine as `theme="$look.clean-light"` etc. The recipes in `references/block-recipes.md` are linted by the package's tests.
- Not verified: nothing here has been run in a real Claude Code session yet (see `docs/gate2-manual-checklist.md` in the package).
- The reference annotations come from **still frames only**. Timings, sound and exact motion are inferred or marked `null`. Fill them from your own viewing.
- All thresholds are starting guesses. Tune them from your ratings (see `evals/README.md`).
- The 3 looks are starters with original palettes. Replace after giving direction notes.

## Extending the dataset

1. Copy an annotation file, change `id`, fill the fields.
2. Add duration, platform and your 1 to 5 rating (`dataset/rating-sheet.md`).
3. Re-derive patterns: if 3 or more rated-4+ ads share a trait, add or tighten a rule in `references/patterns.md` and a check in `references/checks.md`.
4. Log the change in `CHANGELOG.md` with the evidence.
