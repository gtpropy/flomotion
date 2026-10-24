# LOG: flomotion-ad

## Decisions

- 30 s, 9:16, 128 bpm (one beat = 0.46875 s, 64 beats). Every cut is on a beat and has its own transition (the `wipes` track).
- Look `bold-kinetic` (energetic): flat colour blocks, heavy type, dark text on every block (it passes the contrast lint).
- Turn: two big dots converge, merge, split, grow into the next slide. A vault door (circles and rounded rectangles) then opens onto the name, and closes over the ledger later. Both ideas are the person's.
- Hero: a mascot dot with eyes on its own track; it blinks, looks at the product, spins on "Again.", hides in the turn, and pulses on the beat after the drop.
- Voice: ElevenLabs "Jessica" (a library voice such as "Zara" cannot be used through the API on a free plan: `paid_plan_required`), `eleven_multilingual_v2`, one clip per phrase placed on its beat (`scripts/build-voice.py`). 14 clips, about 350 characters of the free allowance.
- Music: three CC0 Freesound loops (Loop 128 Bpm, Electro House drums, Piano arp pitched down 4 semitones into the bed's key), arranged offline with a drop on the turn (`scripts/build-music.py`). Real whooshes, a glitch and a riser-hit from Freesound; small ticks, pops, types and hits are original synthesized sounds.
- The copy was rewritten with `references/script-craft.md`. "Live" was dropped because it is a heteronym; the line is "come alive". "Same video every time" was cut (see below) and replaced by "Diff it like code."
- Product shots are real captures of the live view (`asset_capture`) of a demo project a script worked on; the licence panel is this video's own ledger. It is not a recording of a live Claude session.

## What ran

- `lint`: 0 errors, 0 warnings.
- `review` (several rounds): 17 checks run, 0 failing. Warning 7 (text moving through the edge of the frame while it enters, and wipes covering text at the cuts, both by design). Warning 16: the voice is ElevenLabs output on a free plan and is not cleared for commercial use. Check 9 once failed (white captions on light blocks) and was fixed with dark one-word captions.
- `mix_preview` / render: -14.9 LUFS, true peak -1.5 dBTP (targets -14 +/-1, <= -1.0).
- Render `final`: 1080x1920, 30 fps, 30.0 s, H.264 + AAC, 9.6 MB, 17 ledger entries. Frames pulled from the MP4 were checked by eye.

## What I found while making it (engine)

- The audio mix was not repeatable: two renders of the same project differed in the last samples (`sidechaincompress` paired frames in thread order). Fixed in `packages/render/src/audio.ts`, with a regression test that fails without the fix. The mix is now byte-identical.
- `local:` sounds did not resolve on a fresh checkout (they resolved only through an ignored cache). Fixed; a clean-clone render matched the original at the time.
- **The video is not byte-identical between renders of this project.** About 1-pixel edge differences appear on elements with animated transforms (the counters, the mascot, rotated cards). Single frames are identical every time, and software GL and one worker do not change it. HyperFrames' own deterministic path is `--docker`. Simple scenes (the engine tests) are identical. I did not trace it to one element. This is why the ad does not claim "same video every time".

## Not run / unverified (read this)

- **Nobody has listened to anything.** The voice, the music and the effects are choices made from measurements. Audition them.
- The three reference pieces were studied from frames and loudness only; I could not hear their speech or music.
- The voice is on ElevenLabs' free plan. As I understand its terms, the output needs attribution and is not licensed for commercial use: check them before you publish.
- A lot of this was written with the file tools, not `scene_write`, so `history_*` holds only the font snapshots.
- No real Claude Code session, no Whisper (the word times come from ElevenLabs).
- Keys for Freesound and ElevenLabs were pasted into the chat: regenerate them.
- Pixabay music was preferred, but the file path was not supplied, so none is used.

## Gate state

G0-G4 done in the files; G5 draft and G6 final rendered; approval is the person's.
