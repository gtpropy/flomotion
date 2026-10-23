# Evaluation procedure

Purpose: make quality measurable and make every change to the skill prove itself.

## Run
1. For each brief in `briefs/briefs.md`, start a fresh Claude session with the skill and the brief as the intake answers (G0 prefilled).
2. Let it run through gates with approvals auto-given at G1-G4 (to measure the machine), or manually (to measure the whole loop).
3. Save to `evals/runs/<YYYY-MM-DD>/<brief-id>/`: `brief.json`, `storyboard.json`, draft video, contact sheet, `review` output, timing, token/cost notes.
4. Paid or network services (voice generation, sound search) run with test doubles in automated runs; list which steps were doubled.

## Metrics
| Metric | How |
|---|---|
| HARD-check pass after round 1 / round 3 | `review` output |
| Rounds to clean | count |
| Anti-pattern hits | scan list |
| Invented-fact violations | manual check against brief (must be 0) |
| Human ratings (8 dimensions) | `dataset/rating-sheet.md` |
| Time to draft | timing |

## Aggregation
Write `evals/runs/<date>/summary.md`: table per brief (checks, rounds, ratings), per-dimension averages, per-style and per-look averages, and a diff against the previous run (flag changes of >= 0.3 or any new HARD failure).

## Regression rule
After any change to a look, block, check, threshold or reference, rerun the 10 briefs. Keep the change only if no dimension average drops by >= 0.3 and no new HARD failure appears. Record result in `CHANGELOG.md`.

## Targets (initial)
- Every draft passes all HARD checks within 3 rounds.
- Average rating >= 4.0 per dimension on >= 8 of 10 briefs.
- Zero invented facts.

## What cannot be automated
Taste (look, font pairing), sound (needs listening), voice tone, and whether it "feels" professional. The person rates; the system learns from the ratings.
