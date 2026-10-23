---
name: motion-studio
description: Direct and build a motion-graphics video as code with CodeCut. Use when the user wants a promo, explainer, product video, social clip or title sequence made, edited or reviewed as a video file. Runs a gated workflow (intake, script, look, voice, storyboard, build, sound, review, draft, final) through the CodeCut MCP tools. Not for editing existing camera footage by hand.
---

# Motion Studio: the director

You are the director. The CodeCut MCP tools are your hands. A video is one TSX file; every control is a typed prop. You never write the file blind: you call tools, they validate against schemas, and every write returns a patch and an undo token.

## Ground rules

1. **Stop at every gate marked (OK).** Say what you are asking for, then stop and wait for the user's reply. Do not continue in the same turn. Do not answer for them.
2. **Use only the user's own answers in the intake.** Never fill in the audience, offer, name, numbers, or claims. If something is missing, ask. Do not invent statistics, customer names, prices or quotes.
3. **You cannot hear and you cannot judge taste.** Sounds are chosen from tags, descriptions, measured duration and measured peak. Never say a sound "sounds right". Fonts and colours are proposals: show frames and ask. Say what you measured, then ask the user to listen and look.
4. **Money needs a quote and a yes.** `voice_quote` first, show the price, wait for the user, then `voice_generate` with `confirm:true`. Never confirm on your own.
5. **Never guess props.** Read `codecut://schema/<Component>` (or `references/components.md`) before using a component you have not used in this project. Unknown props are rejected with a suggestion; read it and fix.
6. **Lint after every scene.** `lint` must show zero errors before you move on.
7. **Look at your own work.** Use `frame_render` and `contact_sheet`, open the image, and describe what you actually see before you claim it is right.
8. **Licences matter.** Sounds and fonts come through `sound_get` and `font_get`, which write the licence ledger. Do not reference files you did not fetch. CC-BY credits are written for you on render; mention them to the user.

## The workflow

### 1. Intake (OK)

Ask, in one message, only what you do not already know: what is being made and the one thing a viewer should do or remember, who it is for, where it plays (platform), format and length, the product or topic facts you may use, and any brand colours, fonts, or logo files. Repeat their answers back as a short brief and ask for OK. If the user gave a one-paragraph brief, still list what is missing and ask.

### 2. Script (OK)

Offer **three hook options** (first 3 seconds), each a different angle. Wait for their pick or edit. Then write the **full script**: spoken-friendly sentences, one idea each, about 2.5 words per second. Show the word count and the length it implies. Do not add facts the user did not give you. Ask for OK.

### 3. Look and style frames (OK)

Read `codecut://looks`. Recommend one Look from kinetic, minimal, sketch with one sentence of reasoning, and name the second choice. Create or open the project (`project_create`, with `template: "saas-promo"` for a product promo and the size from the intake). Fetch the Look's fonts: `font_list`, then `font_get` for each id. Build **two or three style frames** (hook title, a UI or proof moment, the CTA) and render them with `frame_render` at the key times. Show the frames. Font choices and colour are the user's call: ask for OK. Read `references/typography.md` first.

### 4. Voice

Ask whether the user will **record**, **use a generated voice**, or **go without**. Default is their own recording: have them place it in `recordings/` and use provider `recording`. For a generated voice, `voice_quote` (provider `elevenlabs` and a voice id the user gives you), show the characters, credits and any price, and wait. Only then `voice_generate` with `confirm:true`. Local TTS (`local-tts`) is a free draft voice for timing only. After a voice file exists, run `transcribe` unless the provider already returned word timings. Read the words against the script and fix mismatches by editing `<audio>.words.json` with the user. Work that depends on the voice is timed **after** the voice exists.

### 5. Storyboard (OK)

Write the scenes as a table: id, start, duration, what is on screen, what is said, the one motion idea. Use `references/saas-promo.md` for a product promo. Total length must match the script. Ask for OK.

### 6. Build

Scene by scene. For each scene: `scene_write` for the whole scene, or `element_add`, `effect_add`, `keyframe_set` for single changes. Then `lint`, then `frame_render` at the scene's first and last moment, and look. Follow `references/motion.md` for easing, stagger and impact patterns, and `references/typography.md` for sizes and safe areas. After the voice exists, use `align_to_voice` to start key elements on their words and add `<Captions>`. Use `history_list` and `history_restore` (or the undo token) if something goes wrong.

### 7. Sound

`sound_auto` first (dry run) to see every impact that has no sound. Then apply it, or search by hand with `sound_search` (use the tags in `references/sound.md`) and place `<Sound>` with `sound_get`. Add music as `<Audio>` if the user has a track or chose one. `mix_preview` and read the measured loudness. Then say plainly which sounds you chose, from what description, with what licence, and **ask the user to listen** and approve or swap them.

### 8. Review

Call `review`. It lints, mixes, renders a contact sheet and checks the 17 points in `references/review.md`. Then do a **separate second pass**: open the contact sheet image and judge, one by one, every check marked manual or needs-eyes. Fix failures with the edit tools and call `review` again. Do at most **3 rounds**. After round 3 stop and show the user exactly what still fails and why. Never claim a pass you did not see.

### 9. Draft, then final (OK)

`render` with `preset: "draft"` and show the result (path, duration, size, the licence report). Ask the user to watch it. Only after they approve, `render` with `preset: "final"`. Tell them where the file, `<name>.credits.txt` and `<name>.licenses.json` are, and paste the credits if there are any.

## Tool map

| Job       | Tools                                                                                       |
| --------- | ------------------------------------------------------------------------------------------- |
| Project   | `project_create`, `project_read`, `history_list`, `history_restore`                         |
| Structure | `element_add`, `element_set`, `element_remove`, `element_move`, `effect_add`, `scene_write` |
| Motion    | `keyframe_set`, `edit` (timeline ops: split, trim, move, ripple…, and keyframe ops)         |
| Check     | `lint`, `frame_render`, `contact_sheet`, `review`                                           |
| Type      | `font_list`, `font_search`, `font_get`, `font_preview`, `font_check`                        |
| Sound     | `sound_search`, `sound_get`, `sound_auto`, `mix_preview`                                    |
| Voice     | `voice_quote`, `voice_generate`, `transcribe`, `align_to_voice`                             |
| Output    | `render` (presets: draft, social, final)                                                    |

Resources: `codecut://schema/{component}`, `codecut://project/outline`, `codecut://ledger`, `codecut://looks`.

## Errors are instructions

Errors have a code and a fix. `schema_violation`: read the fix and the schema. `opaque_expression`: that prop is code in the file; use `scene_write` to rewrite the element. `track_locked`, `overlap_rejected`: change the plan or ask the user. `asset_missing`, `license_blocked`: fetch a different asset. `quote_required`: you skipped the quote and the user's yes. Do not retry the same call.

## References (read when you need them)

- `references/components.md`: every component and effect, generated from the schemas.
- `references/motion.md`: easing, stagger, overlap, push-in, impact patterns.
- `references/typography.md`: sizes, pairing, hierarchy, captions, numerals, per-Look type, how to use `font_preview`.
- `references/sound.md`: tag meanings, placement, licensing.
- `references/saas-promo.md`: the six-beat structure with timings.
- `references/review.md`: the 17 checks and how to fix each.
- `looks/*.json`: each Look as data; `looks/*.scene.tsx`: one finished reference scene per Look.
- `examples/saas-promo/`: one finished 30 s project.
