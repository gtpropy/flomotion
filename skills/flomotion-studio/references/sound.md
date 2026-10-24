# Sound rules

You cannot hear audio. You can search, transcribe, measure levels, and place sounds on frames. Every sound choice is a **needs-your-review** item. Never write "sounds good".

## Buses and targets (config/thresholds.md)
- Buses: `voice`, `music`, `sfx`, `master`.
- Loudness: master -14 LUFS (+/- 1), true peak <= -1 dBTP.
- Voice stays >= 12 dB above music during speech (duck music; attack 80 ms, release 400 ms).
- Starting bus levels: voice -3 dB, music -18 dB, sfx -10 dB.

## Sound palettes by style
| Style | Palette tags | Music mood |
|---|---|---|
| S1 | low-drone, tick, single-impact, air | tense to airy |
| S2 | pop, click, whoosh-short | upbeat, light |
| S3 | friction-texture, rise, silence, bright-resolve, short-hit | tension to bright |
| S4 | soft-tap, pad, swell | warm, calm |
| S5 | ui-click, ui-tick, resolve-chord | minimal |
| S6 | ambience, marimba, pop | playful |
| S7 | pop, clink, thud, pluck | punchy |

## Placement rules
1. Each impact effect (shake, thud, burst, hard cut on beat) gets a sound whose **peak** lands on that frame (tolerance 2 frames). Use the sound's `peak` time from the ledger.
2. Word reveals in kinetic text: soft click or pop on the first letter's landing, not every word if > 4 per second (use every other).
3. Transitions: whoosh starts 3-6 frames before the transition's midpoint.
4. Product settle: soft click at rest frame.
5. Silence is a tool: a 0.3-0.6 s drop before a turn increases impact.
6. Music: start under the hook, rise slightly at the turn, resolve under the CTA; fade out within the last 0.5 s after the final frame's key text.

## Their own sound effects
If the person has sound files: `sound_import` (a file, or a folder up to 40 files; they state `rights`). For a big library they run `flomotion setup` and point it at the folder; then `sound_search` finds them by file and folder names. Your own sounds are searched first, then Freesound if a key is set. They are used as `local:ID`, with the same measured peak and ledger entry. Their rights are what they told you: nothing checks them, so ask "are these yours or licensed to you?".

## Freesound flow (via the flomotion MCP)
1. `sound_auto` (dry run) lists impact effects (Shake, Slam, Thud, PunchZoom...) that have no sound on their frame. Apply it, or search by hand: `sound_search` with a job `tag` (`ui/pop ui/tap ui/tick move/whip move/whoosh-deep hit/land hit/punch hit/boom tech/click tech/data tech/glass tech/success tech/glitch`) and your own query words; the server already limits to `CC0` and `CC-BY` (set `soundLicenses` in `flomotion.json` to restrict) and marks allowed results.
2. Pick 2-3 candidates per slot; `sound_get` downloads the file (with only an API key this is the HQ MP3 preview), measures the **peak** and writes the ledger. Pass `tag` so the peak is named after the job (`hit/land` gives `peak="land"`).
3. Place `<Sound src="freesound:ID" at="..s" peak="land" />`: `at` is where the peak lands; the clip starts early by the measured offset. The ledger holds `source`, `author`, `license`, `attributionRequired`, `commercialOk`.
4. Never use `CC-BY-NC` for promos. Never use tracks from commercial ads.
5. Required attributions go into the license report at G6.

The palette words in the table above (low-drone, whoosh-short, ...) are style guidance for your query words. The tags the tools accept are the job tags in step 1.

## Review list format (show at G5)
```
Sounds to audition (I cannot hear them):
1. t=0:03.2  thud-light on "Notes" — candidate A (CC0), B (CC-BY)
2. t=0:11.0  whoosh before wipe — candidate A
Music: "warm-minimal" bed, 92 BPM, starts 0:00 ends 0:29.6
Mix measured: LUFS -14.2, true peak -1.8 dBTP, voice margin 13 dB (pass)
```

## Voice
- Own recording: `voice_import` copies it in from wherever it is. Word times: if they have a transcript or captions, `transcript_import` (SRT, VTT, word-level JSON, lines with times, or plain text). Say how exact it is: **word** (Whisper, ElevenLabs) is exact; **cue** (captions) is line-level, fine for captions, off by up to a line for a word-tied move; **estimated** (plain text) is a rough guide, so ask for captions or run Whisper before you promise sync. Otherwise `transcribe` (Whisper). `align_to_voice` snaps key times to words.
- Generated voice: `voice_quote` first (cost, duration), wait for the person's confirm, then `voice_generate`. Language and pronunciation of brand names to be confirmed by the person.
- No voice: captions carry the narration; ensure caption reading speed passes.

## Do not
- Stack more than 3 sfx within 1 s, place a loud sound under voice, loop obvious music seams, use clipping-level sounds, or use any audio not in the ledger.
