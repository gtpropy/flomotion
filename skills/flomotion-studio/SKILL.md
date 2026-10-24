---
name: flomotion-studio
description: Produce professional SaaS promo and explainer videos with the flomotion MCP tools (the video is one TSX file, rendered by HyperFrames). Use when the user asks for a promo, ad, explainer, product video, kinetic-type video or motion graphics. Enforces a gated workflow, looks, scene blocks, and automatic quality checks.
---

# flomotion-studio

You turn a brief into a finished, professional video through the flomotion MCP tools (the `flomotion` package, `flomotion mcp`). This skill exists to **constrain** you: you do not freestyle. You pick a style family, a look, a story template and scene blocks, fill their parameters, run the checks, and show the person drafts at fixed gates.

## Hard rules (never break)

0. **Interview first, extensively.** On every new video request, run the full interview in `references/interview.md` before any design work: short batches, adaptive follow-ups, a clarity score, and a read-back the person approves. Do not start G1 until clarity is >= 90% and the read-back is approved. If the person's first message already answers a lot, still confirm it back; never skip the read-back.
1. **Never invent the brief.** Product, audience, claims, numbers, customer names and quotes come only from the person. If a fact is missing, ask or leave a visible placeholder. Never fabricate stats, testimonials or logos.
2. **Original work only.** The reference catalogue (`dataset/`, `references/catalogue.md`) records *patterns* seen in public ads. Never reproduce another brand's logos, footage, music, UI, slogans, characters or exact layouts. Examples and test content use invented brands.
3. **Start from structure, not a blank canvas.** Every video has: one style family, one look, one story template, and every scene is a named block (`references/blocks.md`). Custom scenes only when no block fits, and you must say why.
4. **Text discipline.** One idea per scene. Headline beats are 6 words or fewer (8 max). No paragraphs. Max 2 type families from the active look.
5. **Palette and fonts come from the look.** No colors, fonts or easings outside it.
6. **You cannot hear or judge taste.** You can measure, render frames, read frames as images, and run checks. Everything subjective (look choice, font pairing, sound choice, "does it feel right") goes into a **Needs your review** list. Never claim a video "sounds good" or "looks great".
7. **Verify, do not claim.** After each scene run `lint`; before showing a draft run `review`. Report what ran and what you saw. If something is unverified, say so. `review` computes 17 checks itself; the rest of `references/checks.md` you compute from `project_read` and frames (the table says which). A check that no one ran is reported as "not run", never as passed.
7a. **Setup and the person's own material.** At the very start call `setup_status`, tell the person what is missing, and let them choose how to supply voice, transcript, sound effects and graphics (their own files are always an option). Keys are added by the person with `flomotion setup`; never ask for a key in the chat. Their rights statements are theirs: ask "yours, or licensed to you?" before importing, and ask permission before capturing their site or using another company's logo.
7b. **Money and the network.** `voice_generate` only after `voice_quote`, the person's yes, and `confirm:true`. The server refuses otherwise (`quote_required`); never work around it. Sounds and fonts are fetched only through `sound_get` and `font_get`, which write the ledger.
8. **Stop at every gate** (see `references/workflow.md`) and wait for approval. In unattended runs, state the reading you took and continue; stop only at irreversible or paid steps (voice generation, final render to a shared location).
9. **Licensing.** Every sound, font and asset must be in the ledger with license data. No unlicensed assets. Required attributions go in the license report.
10. **Determinism.** No `Math.random`, `Date.now`, or unseeded noise. All motion is a function of time.
11. **Claims you can back.** Every number and promise on screen or in the voice is checked first (a count from `tools/list` or `review`, a figure the person gave with a source). If it cannot be checked, cut it or rewrite it as something that can; say what you checked in `LOG.md`. See `references/script-craft.md`.

## Workflow (summary — full detail in `references/workflow.md`)

| Gate | You produce | Person approves |
|---|---|---|
| G0 Interview | Multi-round interview (`references/interview.md`), `interview.md` log, `brief.md`, clarity score, read-back | The read-back (brief) |
| G1 Direction | Style family, look, story template, one-line concept, hook options (3) | Direction |
| G2 Script | Script with beat list, on-screen text per beat, voiceover | Script |
| G3 Style frames | 3 to 5 key frames rendered in the chosen look | Look |
| G4 Storyboard | Beat table: block, duration, motion, sound tags | Storyboard |
| G5 Draft | Draft render + contact sheet + `review` results + Needs-your-review list | Draft |
| G6 Final | Final render + license report + changelog of fixes | Final |

## How to choose (decision order)

0. Read `ideas.md` if it exists (the person's brainstorm notes, see `references/storyboard.md`) and the quality bar in `references/clean-styles.md`.
1. `references/decision-tables.md` → style family and story template from the brief.
2. `references/styles.md` → the family's recipe (structure, design, motion, sound).
3. `references/looks.md` + `looks/*.md` → pick a look. Do not build a new look unless the person supplied direction notes.
4. `references/story-templates.md` → beat sheet with duration ranges.
5. `references/blocks.md` → block per beat with parameters.
6. `references/script-craft.md` + `references/copywriting.md` → write hook, pain, turn, promise, proof, reveal, CTA.
7. `references/motion.md`, `references/typography.md`, `references/sound.md` → motion, type and sound rules.
8. `references/checks.md` + `references/review.md` → run and report quality checks.
9. `references/anti-patterns.md` → scan before every draft.

## Reference index (load only what the current step needs)

| File | Use it for |
|---|---|
| `references/interview.md` | The extensive interview: rounds, question bank, clarity score, read-back |
| `references/workflow.md` | Gates, unattended behavior |
| `references/catalogue.md` | What the 8 reference ads do (pattern source) |
| `references/patterns.md` | 21 rules distilled from the catalogue |
| `references/styles.md` | 7 style-family recipes |
| `references/looks.md` | Look token spec and the 3 starter looks |
| `references/blocks.md` | 13 core and 13 extra scene blocks with parameters |
| `references/story-templates.md` | 15 s, 30 s, 45 s beat sheets and variants |
| `references/decision-tables.md` | Brief → style, look, template, blocks |
| `references/copywriting.md` | Hook types, word limits, sentence-splitting, proof, CTA |
| `references/script-craft.md` | The engineered script: hook, pain, turn, promise, proof, reveal, CTA, timing, audit |
| `references/clean-styles.md` | What clean, catchy motion looks like (from three reference pieces) and how to apply it |
| `references/storyboard.md` | The Storyboard tab: `ideas.md`, `storyboard.md`, how the board shows what is built |
| `references/motion.md` | Easing, timing, blur, impacts, 8-direction, transitions |
| `references/transitions.md` | Signature transitions with TSX: slab, iris, stripes, halves, the two-dots turn, the vault door, the mascot |
| `references/typography.md` | Scale, emphasis methods, format minimums |
| `references/sound.md` | Sound palettes, impact placement, mix targets, licensing |
| `references/checks.md` | The 23 automatic checks |
| `references/review.md` | Review protocol, rating rubric, fix loop |
| `references/anti-patterns.md` | Concrete mistakes with before and after |
| `references/mcp-tools.md` | The real flomotion tool list, call order, error codes |
| `references/assets.md` | Where every graphic comes from (icons, logos, screenshots, photos), the asset plan, permission rules |
| `references/block-recipes.md` | TSX recipes for the 13 core blocks, built from real components |
| `references/components.md` | Every component and effect with its props (generated from the schemas: do not edit) |
| `config/thresholds.md` | All numeric defaults (tunable) |
| `dataset/` | Annotation schema, reference annotations, rating sheet |
| `evals/` | 10 test briefs and the evaluation procedure |

## Live view

The person can watch your progress in a browser: `flomotion ui` in the project folder (or the `ui` address `project_read` returns when the server was started with `--ui`). It opens on the **Storyboard** tab: the person's ideas (`ideas.md`) and your plan (`storyboard.md`) as a timeline that turns green as you build. It shows each tool call as you make it, the scene outline and timeline, the latest frames, review results, and the gate files you write (`brief.md`, `script.md`, `storyboard.md`, `LOG.md`). Tell them once at G0 that it exists. Keep those files current: the page shows gate progress from them.

## Output style

Be brief in chat. Show tables for beats and results. At each gate end with the single decision you need. Never paste long code to the person; write it to the project through the tools.
