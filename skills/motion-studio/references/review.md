# Review checklist (17 points)

`review` decides what it can from the compiled project, the mix and (unless `deep:false`) a rendered-page measurement. Items marked "eyes" always need you to look at the contact sheet in a second, separate pass. Fix failures, call `review` again, at most three rounds, then show the user what still fails.

| #   | Check                                                                      | How it is decided                                                   | Typical fix                                                                     |
| --- | -------------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 1   | Frame 0 has motion                                                         | Something is already changing within 0.1 s                          | Start an enter or a slow push at 0 s                                            |
| 2   | A hero element carries across 4+ beats                                     | A layer spans 4 scenes; else eyes                                   | Move the hero onto its own track, or repeat it with the same look in every beat |
| 3   | Something new at least every 2 s                                           | A layer appears or a move starts at least every 2 s                 | Add an element, a cut or a new move in the gap named                            |
| 4   | No static frame longer than 0.5 s                                          | Nothing on screen changes for more than 0.5 s                       | Slow push, drift, pulse or stagger                                              |
| 5   | Every spoken word on screen is in sync with the voice                      | Captions follow the voice; other words: eyes                        | `align_to_voice`                                                                |
| 6   | Numbers shown add up                                                       | Lists the numbers; you add them up                                  | Fix the number or the script                                                    |
| 7   | No overlapping or clipped text                                             | Measured in the rendered page at several times; eyes if skipped     | Shorten, shrink, or move                                                        |
| 8   | All text inside the SafeArea for the format                                | Lint rule `text-outside-safe-area`                                  | Put it inside `<SafeArea preset=…>`                                             |
| 9   | Contrast of text against its background passes                             | Lint plus measured contrast                                         | Lighter or darker colour; a card or scrim behind text                           |
| 10  | Every impact effect has a sound on its frame                               | Impact cues against sfx events (0.1 s)                              | `sound_auto`                                                                    |
| 11  | Voice is always on top in the mix                                          | Music ducks 6 dB or more; gains compared                            | Lower music/sfx gain, raise `duckAmount`                                        |
| 12  | Loudness within target                                                     | Measured integrated LUFS within 1.5 of -14, peak under -1 dBTP      | Adjust gains                                                                    |
| 13  | Transitions are used with intent                                           | More than two types warns; always eyes                              | One signature transition, hard cuts elsewhere                                   |
| 14  | Looks and type are consistent with the chosen Look                         | Theme set, font count; eyes                                         | Use `$brand.*` and `$type.*`                                                    |
| 15  | Captions readable (line length, reading speed)                             | Line length at most 32 characters, at most 21 characters per second | Lower `maxChars`/`maxWords`, longer `hold`                                      |
| 16  | All assets have ledger entries (downloaded ones; your own files need none) | Ledger lookup                                                       | Fetch with `sound_get` / `font_get`                                             |
| 17  | CC-BY credits are present in the license report                            | Attribution entries have an author and become `credits.txt`         | Re-fetch with `sound_get`                                                       |

## The second pass

Open the contact sheet image. For each check marked manual or needs-eyes, write one sentence saying what you see and whether it passes. Be specific ("the logo on frames 1, 4, 7 and 10 is the same teal circle"). If you cannot tell from the image, say so and ask the user. Never write "looks good" without naming what you looked at.

## Honest limits

- Audio is measured, not heard. State levels and peak positions; ask the user to listen.
- Taste is not measurable. The checklist catches mechanical problems; the user decides if it is good.
