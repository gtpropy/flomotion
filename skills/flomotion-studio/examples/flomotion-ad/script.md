# Script: flomotion ad (30 s, 9:16, 128 bpm)

Built with `references/script-craft.md`: contrast hook, rule-of-four pain, a silent visual turn, a one-fact promise, verified proof in threes, a reveal and a callback, one command.
One beat = 0.46875 s; 64 beats = 30 s. Beats per scene: hook 7, pain 8, turn 4, promise 6, product 7, props 7, checks 6, licences 7, proof 6, CTA 6.

| # | Time | Technique | Spoken text (ElevenLabs, Jessica) | On screen |
|---|---|---|---|---|
| 1 | 0-3.3 | Contrast hook, loop opened | "Stop editing videos. Start describing them!" | Stop editing. (struck) Start describing. + a typed prompt |
| 2 | 3.3-7.0 | Rule of four | "Timelines." "Dragging." "Exporting." "Again." | one word per colour block, the last one glitches |
| 3 | 7.0-8.9 | Visual metaphor, silent | (none) | two big dots converge, split, grow into the next slide |
| 4 | 8.9-11.7 | Promise = name + one fact | "Meet flow-motion. One T S X file." | vault door opens on the name |
| 5 | 11.7-15.0 | Show the work | "Claude builds it." "You watch it come alive." | the real live view, the activity feed floats out |
| 6a | 15.0-18.3 | Feature 1 | "Every control? A typed prop." | the real TSX, the preview grows when the value changes |
| 6b | 18.3-21.1 | Feature 2 (a number) | "Seventeen checks. Before you even look." | 17, the real review panel scrolls |
| 6c | 21.1-24.4 | Feature 3, rule of three | "Every sound and font: licensed, logged, locked." | the real ledger; a vault door closes over it |
| 7 | 24.4-27.2 | Proof | "Thirty-nine tools." "Diff it like code." | 39, a two-line diff |
| 8 | 27.2-30.0 | Reveal + callback + one action | "Start now. N P X flow-motion." | `$ npx flomotion`, "a 30 s ad for flomotion: rendered", "This whole ad is one TSX file." |

## Rules kept

- No word on screen that is not spoken or a number; headlines 6 words or fewer.
- Every number verified (39 tools, 17 checks); "same video every time" was cut because it is not true byte for byte here.
- Spoken spellings: "flow-motion", "T S X", "N P X"; the captions show the real spellings (flomotion, TSX, npx).
- The copy avoids heteronyms: the line is "come alive", not "live".

## Voice settings

Voice Jessica (`cgSgspJ2msm6clMCkdW9`), model `eleven_multilingual_v2`, stability 0.30, similarity 0.80, style 0.55, speed 1.10, speaker boost on. One clip per phrase (`scripts/build-voice.py` places each on its beat; a line that overran was sped up by at most 1.2x).
