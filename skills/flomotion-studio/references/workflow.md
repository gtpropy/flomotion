# Workflow and gates

Never skip a gate. At each gate, present the artifact, list what you verified, list "Needs your review" items, and ask one decision question.

## G0 Interview (ask, do not guess)

**Run the full protocol in `references/interview.md`**: about 6 to 9 rounds of 3-5 questions each, adaptive follow-ups, clarity score >= 90%, read-back approved. The list below is only the field checklist the interview must cover; do not dump it as one message.

1. **Product**: name, one sentence of what it does, who uses it.
2. **Audience and goal**: who watches; what should they do after (sign up, book demo, share).
3. **Platform and format**: 9:16, 16:9, 1:1 or 4:5; where it will run; target length (15, 30 or 45 s).
4. **Tone**: calm, energetic, serious, playful (pick one primary).
5. **Facts you may use**: features (max 3 to feature), proof (numbers, certifications, customer quotes with permission), URL or CTA.
6. **Assets**: logo, brand colors, fonts, screenshots or screen recordings, footage, music. Say which exist.
7. **Voice**: voiceover (own recording, generated voice, none) and language. Generated voice is a paid step and needs confirmation.
8. **Constraints**: words to avoid, legal lines, things to show or never show.

Output: `brief.md` saved to the project. If a field is missing and the person cannot answer, write `"TBD"` and show a visible placeholder in drafts.

## Materials check (part of G0, before G1)

Call `setup_status` and tell the person what is missing and how they can proceed without a service: their own recording (`voice_import`) with a transcript or captions (`transcript_import`), their own sound files (`sound_import`), their logo and screenshots (`asset_import`), or a URL we may capture (`asset_capture`, `brand_extract`). Services (Freesound, ElevenLabs, Pexels) are set up by the person with `flomotion setup`, never by pasting keys into the chat.

## G1 Direction

Use `decision-tables.md`. Present:
- Style family (name and one-line why).
- Look (from `looks/`), with the 3 or 4 tokens that define it.
- Story template (length, beat count).
- Concept in one sentence ("A tangled line of apps untangles into one calm line").
- 3 hook options (different hook types from `copywriting.md`).
- Risks (missing assets, claims needing proof).

Decision needed: approve or change direction.

## G2 Script

Beat table: `#`, role (hook, pain, turn, promise, proof, product, cta), on-screen text (word counts shown), voiceover line, target seconds. Text must obey `copywriting.md`. Run the word-count and reading-speed checks on the script text before showing it.

Decision needed: approve script.

## G3 Style frames

Render 3 to 5 key frames (hook, pain or turn, product, proof, CTA) in the look using `frame_render`, then `contact_sheet`. Run `lint`, contrast, safe-area, and font-glyph checks on them.

Needs-your-review: look feel, font pairing.

Decision needed: approve look or give notes (max 2 revision rounds before proposing a different look).

## G4 Storyboard

Per beat: block id, parameters, duration, in/out motion, transition, sound tags, which element is the **hero** that carries across beats. Check total length, scene durations, and novelty rate on the plan itself.

Add the **asset plan** (see `assets.md`): for each beat, every graphic it needs and where it comes from (icon from Iconify, their logo, a screenshot of their app, a stock photo, or drawn with components), what is still missing from the person, and any logo that needs permission. Missing items are listed, never faked.

Decision needed: approve storyboard.

## G5 Draft

1. Pull the assets in the plan (`assets.md`), look at each one in a frame, then build all scenes with blocks. `lint` after each scene.
2. Align animation key times to voice words if voice exists (`align_to_voice`).
3. Place sounds (`sound_search` -> `sound_get` -> place on peak frames). Preview mix (`mix_preview`).
4. Render draft at reduced size.
5. Run `review` (all checks). Fix every HARD failure. Repeat up to 3 rounds.
6. Show: draft, contact sheet, check table (pass/fail with evidence), anti-pattern scan result, Needs-your-review list (sounds to audition, subjective calls).

Decision needed: approve draft or give notes.

## G6 Final

Full-quality render; license report with required attributions; summary of changes since draft. Save the project and render paths. Update the rating sheet template for the person.

## Revision handling

When the person gives notes, classify each:
- **Content** (words, order) -> script and storyboard change.
- **Look** (color, font, feel) -> token change in the look, not per-scene hacks.
- **Motion** (speed, weight) -> motion tokens or block parameters.
- **Sound** -> sound tags and levels.
- **Bug** -> fix and add the failure to the check list if it is detectable.

If the same note appears 3 times across videos, propose a new rule in `anti-patterns.md` or a new check.

## Unattended runs

If nobody is present: state the reading of the brief you took at the top of the output, continue through gates using defaults, produce the artifacts for each gate, and stop before: generated voice (paid), final render to a shared place, any claim that has no source. List open decisions at the end.

## Hand-off message at the end of each gate

```
Gate: G4 Storyboard
Done: 9 beats, 29.4 s total, hero = the line character.
Verified: durations, novelty rate, word counts (all pass).
Needs your review: hook option choice; music mood.
Decision: approve storyboard, or tell me what to change.
```
