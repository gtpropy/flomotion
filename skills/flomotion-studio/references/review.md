# Review protocol

Two properties are tracked separately.
- **Floor**: never broken or amateurish. Mostly automatic (`checks.md`).
- **Ceiling**: feels designed. Needs the person's taste; you prepare, they judge.

## Your review loop (before showing any draft)
1. `lint` the project. Fix errors.
2. `contact_sheet` at: frame 0, hook peak, last pain frame, turn, product, proof, CTA, final frame, plus every 2 s.
3. **Read the frames as images.** For each: is the text readable, inside the safe area, not overlapping? Is anything cut off? Is the hero visible? Write what you see in one line per frame.
4. `review` (all checks). Fix every HARD; fix WARN where cheap; explain WARN left.
5. Scan `anti-patterns.md`.
6. Repeat up to 3 rounds. If still failing, show the draft with the failure list and your plan. Never hide a failure.

## What to present with a draft
1. Draft video (reduced size) + contact sheet.
2. Check table: counts, HARD list (should be empty), WARN list with reasons.
3. Anti-pattern scan: items found and fixed.
4. Hero and turn: where they are in time.
5. **Needs your review** (things only a human can judge): look feel, font pairing, sound choices, music mood, voice tone, any brand-sensitive claim.
6. The one decision you need.

## Human rating rubric (1-5, the person fills in)
| Dimension | 1 | 3 | 5 |
|---|---|---|---|
| Hook | Ignorable | Fine | Stops me instantly |
| Story clarity | Confusing | Understandable | Obvious in one watch |
| Visual polish | Looks templated/broken | Clean | Looks designed by a pro |
| Motion quality | Jerky or flat | Smooth | Has weight and rhythm |
| Typography | Hard to read | OK | Confident, readable |
| Sound | Distracting | Neutral | Adds punch and feel |
| Look consistency | Drifts | Mostly consistent | One coherent world |
| Would I post this | No | With edits | Yes as is |

Targets (initial): average >= 4.0 per dimension on >= 8 of 10 test briefs; all HARD checks pass within 3 rounds.

## Using the ratings
- Any dimension averaging < 3.5: find the cause (see table), change the system at the right level, rerun evals.

| Weak dimension | Likely cause | Fix at |
|---|---|---|
| Hook | Static open, weak line | Hook block defaults, `copywriting.md` hook types |
| Story | Missing turn/promise | Story template, `turn-present` |
| Polish | Cluttered or default easing | Look tokens, anti-patterns |
| Motion | Same easing everywhere, no overlap | `motion.md`, stagger, blur |
| Typography | Small, low contrast | `min-size`, `contrast` thresholds |
| Sound | Misplaced peaks, mood | Sound palette, placement |
| Consistency | Mixed tokens | `look-consistency`, tighten looks |
| Would post | Combined | Look at free-text notes |

- Keep a change only if ratings or pass rates do not get worse across the 10 briefs. Record in `CHANGELOG.md`.

## Honesty rules
- Say "I measured" or "I saw in frame X"; never "it looks great".
- If a render, tool or check did not run, say so.
- If you changed a threshold or skipped a check, say so and why.
