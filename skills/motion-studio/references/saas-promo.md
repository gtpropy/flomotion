# The six-beat SaaS promo (30 s, 9:16)

`project_create` with `template: "saas-promo"` makes these six scenes, empty, at these times. Change the times only if the script needs it, and keep the total.

| Beat        | Scene id   | Start | Length | Job                                                                          |
| ----------- | ---------- | ----- | ------ | ---------------------------------------------------------------------------- |
| 1. Hook     | `hook`     | 0 s   | 3 s    | Stop the scroll. One bold claim or question, in motion on frame 0.           |
| 2. Problem  | `problem`  | 3 s   | 5 s    | Name the pain in the viewer's words. Show it, do not explain it.             |
| 3. Reveal   | `reveal`   | 8 s   | 6 s    | The product arrives. The biggest move and the biggest sound of the film.     |
| 4. Features | `features` | 14 s  | 9 s    | Three things, one at a time, each with proof on screen (UI, number, result). |
| 5. Proof    | `proof`    | 23 s  | 4 s    | One number, one quote, or one logo row. Only what the user gave you.         |
| 6. CTA      | `cta`      | 27 s  | 3 s    | One action, one URL or button. Hold it.                                      |

## Rules for each beat

- **Hook:** the first frame already moves (review check 1). Text is large (96 px or more on 1080 wide), at most 7 words, inside the safe area. The hero element introduced here should come back in later beats (check 2).
- **Problem:** two short lines at most. Contrast with the hook: slower, or a colour shift. Something new on screen at least every 2 s (check 3).
- **Reveal:** use the Look's signature transition into this scene. A `Slam` or `PunchZoom` on the product name, with a `hit/boom` or `hit/land` sound.
- **Features:** a stagger of 0.08 s. Counters use `<Counter over="1s" />` with tabular figures. Show the product through `UIMock` with `Cursor` clicks rather than describing it.
- **Proof:** do not invent numbers. If the user gave none, make this a "what you get" beat with a checklist, and tell them why.
- **CTA:** the action in the user's words, a `Pulse` on the button, quiet music tail. Hold the final state for 1 s or more.

## Timing against the script

About 2.5 spoken words per second: 30 s holds about 75 words. Write the script first (step 2), record or generate the voice (step 4), then adjust scene lengths to the real voice and use `align_to_voice` to start the on-screen words with the spoken ones.

## Captions

For vertical video use `<Captions voice="#vo" captionStyle="karaoke" maxChars={22} maxWords={4} />` near the lower third, inside the safe area, 64 px or more, heavy weight, a contrasting active colour. See `typography.md`.
