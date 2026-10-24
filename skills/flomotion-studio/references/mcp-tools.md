# flomotion MCP tools

The server (`flomotion mcp --dir <project folder>`) exposes these 39 tools and 4 resources. They are the real list (checked by a test against the server). You call them by bare name; your client may prefix them with the server name you registered.

Every write returns `{ description, patches, undoToken }`. The undo token is a history snapshot id: `history_restore {id}` puts the file back. Every write snapshots first, so you can always go back. Errors come back as `{ error: { code, message, fix } }`: read the `fix` and act on it; do not retry the same call.

## Phase map

| Phase | Tools (in order) | Notes |
|---|---|---|
| Setup | `setup_status` | First call of every video. Says which keys are set (never the keys), what is installed, what each job can use, and what is missing. The person adds keys with `flomotion setup` in a terminal; you never ask for a key in the chat. |
| Project | `project_create {name, size:"1080x1920", fps, template:"blank"\|"saas-promo", look, duration}`, `project_read {path?, depth?}` | `look` is a look id: `clean-light`, `dark-product`, `bold-kinetic` (the skill's looks) or the engine's `kinetic`, `minimal`, `sketch`. `saas-promo` scaffolds six empty beat scenes (30 s); for other lengths use `blank` and write the scenes from the storyboard. `project_read` shows the outline and the `ui` address when the live view is on. |
| Look and fonts | `font_list`, `font_get {id}` for each look font, `font_check {text, fontId}`, `font_preview {fontId, text, size}`, `font_search` | `font_get` downloads, locks the hash and writes the ledger; a new family name is added as a `<Font>`. Renders never use the network. `font_search` needs `GOOGLE_FONTS_API_KEY`. |
| Script | (no tool) | Write `brief.json`, `script.json`, `storyboard.json`, `LOG.md` with your normal file tools in the project folder. The live view reads them. |
| Style frames | `scene_write` (key scenes), `lint`, `frame_render {time, scale?}`, `contact_sheet {times?\|count?}` | G3. Read the PNGs: describe what you see. |
| Build | `scene_write` per scene (or `element_add` / `element_set` / `element_remove` / `element_move` / `effect_add` / `keyframe_set` / `edit`) | `lint` after each scene. `references/block-recipes.md` has the 13 core blocks as TSX. |
| Own material | `voice_import {source, transcript?}`, `transcript_import {audio, source\|text}`, `sound_import {source, rights, tag?}`, `asset_import {source, rights}` | The person's own recording, transcript or captions, sound files, logos, images and video, from anywhere on their computer. They state their rights; the tools record them in the ledger. |
| Assets | `asset_search {query, kind}`, `asset_get {ref, color?, permission?}`, `asset_capture {url, permission}`, `brand_extract {url, permission}` | Icons, brand logos, emoji, photos, illustrations; screenshots of their product; their site's brand. See `assets.md`. |
| Voice | `voice_quote {provider, text, voice, model?, voiceSettings?}` (energetic read on eleven_multilingual_v2: stability 0.3, similarity 0.8, style 0.55, speed 1.1, speakerBoost true; free ElevenLabs plans cannot use Voice Library voices through the API, only premade ones) then, after the person's yes, `voice_generate {quoteId, confirm:true}`; `transcribe {audio}` for a recording | Providers: `recording` (their file, free), `local-tts` (macOS `say`, a timing draft), `elevenlabs` (paid). ElevenLabs returns word timings itself; for a recording run `transcribe` and read the words against the script. |
| Align | `align_to_voice {voiceId, mapping:[{id, word, edge?, prop?, offset?}]}` | Starts elements on spoken words. Do this after the voice exists. |
| Sound | `sound_auto` (dry run, then `apply:true`), `sound_search {tag?, query?}`, `sound_get {id, tag?}`, then `element_add Sound` | Ledger entry per sound; CC0 and CC-BY only unless `flomotion.json` restricts further. |
| Mix | `mix_preview {range?}` | Measures LUFS, true peak and where each sound's peak lands. It does not play anything. |
| Review | `lint`, `review {checklist?, deep?}`, `contact_sheet` | Up to 3 rounds. `review` returns pass / fail / warn / manual per check and a contact sheet. |
| Render | `render {preset:"draft"\|"social"\|"final"}` | Lint errors block it. Writes `<name>.credits.txt` and `<name>.licenses.json` next to the video. Final only after G5 approval. |
| History | `history_list`, `history_restore {id}` | Note the snapshot id at each gate approval in `LOG.md`. |

Resources: `flomotion://schema/{component}` (props, ranges, docs), `flomotion://project/outline`, `flomotion://ledger`, `flomotion://looks`.

## Calling rules

1. `lint` after every `scene_write`; fix errors before moving on.
2. Prefer `scene_write` with a block recipe over many small edits; use `element_set` and `keyframe_set` for single changes. A prop written as an expression in the file cannot be changed by `element_set` (`opaque_expression`): rewrite that element with `scene_write`.
3. Name every element (`hero-line`, `title-1`) so checks and notes can reference them. Ids are stable; `element_set` refuses to rename.
4. Declare the hero and the turn: put the hero's id in `storyboard.json`, and add `<Marker id="turn" at="..." label="Turn" />` where the story turns. `review` item 2 finds a hero that spans four scenes; the rest of the hero and turn checks are yours.
5. Render drafts with `preset:"draft"`; use `frame_render` for checking.
6. Never call `voice_generate` outside the quote and confirm gate, and never `render` with `preset:"final"` before G5 is approved.
7. When a tool fails: read the code and the fix; retry once with the fix; if it still fails, report the exact error and what you tried. Do not edit thresholds or skip a check to get around it.

## Error codes

| Code | Meaning | What to do |
|---|---|---|
| `schema_violation` | Unknown component or prop, value out of range, TSX does not parse, or a lint error was introduced | Read `fix`; check `flomotion://schema/<Component>` |
| `opaque_expression` | The target is code in the file, not a literal | `scene_write` the element |
| `track_locked`, `overlap_rejected` | Timeline rule | Change the plan or ask the person |
| `duplicate_keyframe`, `invalid_time` | Keyframe times collide or are not literal | Give each key its own time (a frame apart) |
| `impure_expression` | TSX uses `Math.random`, `Date.now`, timers or fetch | Use `ctx.noise(seed, freq)` and the time `t` |
| `asset_missing`, `license_blocked` | File missing, or a sound/font licence is not allowed | Fetch another with `sound_get` / `font_get` |
| `quote_required` | You tried a paid step without the quote and the person's yes | Show the quote, wait, then `confirm:true` |
| `missing_dependency` | No Freesound key, no Whisper, no ElevenLabs key | Tell the person exactly what to set up (see the manual checklist) |
| `unknown_element`, `invalid_edit`, `path_outside_project`, `font_error`, `render_failed` | Wrong id, bad operation, path outside the folder, font file problem, render failure | Read `message` and `fix` |

## Files you write (with your own file tools)

`brief.json` (interview), `script.json` (beats), `storyboard.json` (block, params, durations, hero, turn, sound tags), `LOG.md` (decisions, gate approvals with snapshot ids, anything not run), `review/` (reports).

Storyboard entry shape:

```json
{
  "beat": 3,
  "role": "turn",
  "block": "ProductReveal",
  "params": { "device": "phone", "caption": "Meet Pulse." },
  "start": 7.1, "duration": 3.2,
  "hero": "hero",
  "motion": { "in": "slide-s", "out": "cut" },
  "sound": [{ "tag": "move/whip", "peakAt": 7.1 }],
  "notes": "Look stays clean-light; the hero grows here"
}
```
