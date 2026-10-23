# 21 patterns (distilled rules)

Each pattern: **rule**, **seen in** (ads from `catalogue.md`), **how to apply in flomotion**, **check**. Strength: S strong (3+ ads), M medium (2), W weak (1). Strength is provisional until rated.

| # | Rule | Seen | Str | Apply | Check |
|---|---|---|---|---|---|
| 1 | One idea and one color world per scene | A B C D G | S | One block per scene; background token per scene | `look-consistency` |
| 2 | Text is the hero: large, short, six words or fewer | A B C D G | S | `Title` size >= headline min; words <= 6 | `text-words`, `min-size` |
| 3 | Include a visible **turn**: look changes when problem becomes solution (dark->light, tangled->calm, question->answer, grey->color) | A C F G | S | `Turn` marker at storyboard; change palette or space at that beat | `turn-present` (warn) |
| 4 | Product appears in the second half, simplified or stylized | A C D E G | S | Product blocks after the turn; skeleton or stylized UI by default | `product-after-turn` |
| 5 | Brand arrives late or is built from the motion | A B D G | S | Logo reveal via shape assembly or morph | `logo-late` |
| 6 | Proof is specific: a number, credential, or a named person | A B D | S | Proof block with real, supplied fact only | `proof-sourced` |
| 7 | One recurring motif ties the scenes (a line, circle, object, palette) | A C G B | S | Declare `hero` in storyboard; carry it across blocks | `hero-continuity` |
| 8 | Motion blur while moving, crisp when landed | C D G | S | Blur by velocity (180° shutter); settle sharp | `blur-on-motion` (info) |
| 9 | Grain on gradients so flat color feels textured | C D | M | `Grain` overlay 3-8% on gradient scenes | `grain-range` |
| 10 | One template repeated with a word swap | B C | M | Reuse a block, vary only text/color; keep timing identical | `template-reuse` (info) |
| 11 | Split one sentence across several scenes | C D G | S | `SentenceSplit` helper: one sentence, N scenes, one shared baseline | `sentence-split-ok` |
| 12 | Glass or frosted UI over real footage for context | D E | M | `GlassUI` over `Footage` with backdrop blur | `contrast` |
| 13 | Shapes act as transitions and logo births | B D G A | S | `ShapeMorph`, `WipeMatchCut`; logo from shapes | `transition-count` |
| 14 | Modular cards, not one big screenshot | A B C | S | `CardGrid`, `OrbitCards`; each card one idea | `text-overlap` |
| 15 | Footage becomes the UI (same clip reused in product) | F | W | `FootageToUI` block | none |
| 16 | Cursor name tags show collaboration | F | W | `CursorTag` | none |
| 17 | Gesture callouts with touch ripple and bubble | G | W | `GestureCallout` | `min-size` |
| 18 | Alternate black and a saturated color for rhythm | G C | M | Alternating bg tokens every 1-2 beats | `look-consistency` |
| 19 | Glossy 3D props around text (render, keep deterministic) | G C A | M | `Scene3D` props; limit to 3-5 objects | `determinism` |
| 20 | Burst backgrounds mark impacts | G | W | `Burst` radial dashes on impact frame | `sound-on-impact` |
| 21 | Show the old way **small and grey**, the new way **big and colored** | G C A | S | `OldWay` block (muted) then product block (saturated) | `turn-present` |

## Pain handling rules (from A, C, G, F)
- Pain is shown, not described: image (A), tangled motif (C), clutter windows (G), relatable human moment (F).
- Pain share by style family: metaphor contrast 10-20%, pain-to-calm 40-50%, trend explainer 0-10% (implied), real-UI demo 0%, 3D object 20-30%.
- When pain takes more than 25% of runtime, vary its flavor each scene (apps, tools, questions) so it never repeats.
- End pain with a short, calm line (C: "It's time to kill sprawl.").

## Persuasion arc (works with every style family)
1. **Hook** (0-3 s): curiosity question, bold claim, or pain image. Motion from frame 0.
2. **Pain / context** (variable): why now or why it hurts.
3. **Turn** (a moment): the look changes.
4. **Promise** (one sentence): plain words. ("Simple and secure data rooms.")
5. **Product** (2-3 features max): show, do not explain.
6. **Proof**: specific number, credential, or named customer.
7. **CTA**: brand lock, one line, URL or button.

## What not to copy
Logos, footage, music, UI screenshots, slogans, the exact color-per-customer palette of any ad, specific icons, names. Build equivalents from the look and the person's own assets.
