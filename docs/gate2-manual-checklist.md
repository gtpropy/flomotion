# Gate 2: manual checklist (a real Claude Code session)

**Status: unverified.** Nothing in this repository has been run in a real Claude Code session with the `motion-studio` skill. The automated flow test (`tests/e2e/gate2-flow.test.ts`) plays the skill's steps through the MCP SDK client against test doubles. It proves the tools compose in the skill's order and enforce its gates. It does not prove that Claude follows the skill, writes good scenes, or that the live services behave like the doubles. Run this checklist to find out, and tell me what breaks.

Allow about an hour and a cheap amount of money: the only paid step is the optional ElevenLabs voice.

## 0. What to set up first

| Need                           | Required?                              | How                                                                                                                           | Check                                      |
| ------------------------------ | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| Node 22+                       | yes                                    | `node --version`                                                                                                              | prints v22 or higher                       |
| FFmpeg and ffprobe             | yes                                    | macOS `brew install ffmpeg`                                                                                                   | `ffmpeg -version`                          |
| Chrome or Chromium             | yes (frames, font preview, render)     | install Google Chrome                                                                                                         | `npx hyperframes doctor` shows Chrome      |
| Freesound API key              | for real sounds                        | Create a free account, then apply for an API key at https://freesound.org/apiv2/apply . Copy the **Client secret / API key**. | `export FREESOUND_API_KEY=…`               |
| Google Fonts Developer API key | optional (only `font_search`)          | Google Cloud console, enable the Web Fonts Developer API, create a key                                                        | `export GOOGLE_FONTS_API_KEY=…`            |
| Whisper (whisper.cpp)          | only if you want `transcribe`          | macOS `brew install whisper-cpp`                                                                                              | `npx hyperframes doctor` shows whisper-cpp |
| ElevenLabs key                 | **only if you want a generated voice** | https://elevenlabs.io , API keys. Note a voice id from your voice library.                                                    | `export ELEVENLABS_API_KEY=…`              |

Without a Freesound key the server falls back to `sounds/catalog.json` (your own licensed files); without Whisper `transcribe` fails with install steps (you can supply `<audio>.words.json` yourself); without an ElevenLabs key use your own recording (`recording` provider) or the free macOS `say` draft voice (`local-tts`).

Optional environment for ElevenLabs quotes: `ELEVENLABS_USD_PER_1K_CREDITS` (your plan's price per 1000 credits, so the quote can show money), `ELEVENLABS_CREDITS_PER_CHAR` (default 1; about 0.5 for flash models), `ELEVENLABS_COMMERCIAL_OK=1` (only if your plan allows commercial use, so the ledger records the voice as cleared).

## 1. Install CodeCut and the skill

From a checkout of this repo:

```bash
pnpm i && pnpm build
```

After it is published to npm you can use `npx -y codecut …` instead of the path below.

Make an empty folder for the video and register the server **in that folder's scope**:

```bash
mkdir ~/videos/pulse && cd ~/videos/pulse
claude mcp add codecut \
  -e FREESOUND_API_KEY=$FREESOUND_API_KEY \
  -e ELEVENLABS_API_KEY=$ELEVENLABS_API_KEY \
  -- node /ABSOLUTE/PATH/TO/codeCut/packages/cli/dist/bin.mjs mcp --dir .
node /ABSOLUTE/PATH/TO/codeCut/packages/cli/dist/bin.mjs skill install      # copies the skill to ./.claude/skills/motion-studio
```

Leave out the `-e` lines for keys you do not have. Then start `claude` in that folder and run `/mcp`: the `codecut` server must be connected and list 30 tools. Run `/skills` (or ask "what skills do you have?"): `motion-studio` must be there.

Pass: server connected, 30 tools, skill listed. If the server is not connected, run the command after `mcp` by hand in a terminal and read its stderr.

## 2. The session

Paste this brief as your first message, then answer the gates as a real user would:

> Make a 30 second vertical promo for Pulse, a project dashboard for small teams. Team leads at small agencies are the audience; it plays on Reels and TikTok. Pulse puts every project on one live board, sends a weekly digest in one click, and has deadline alerts. Teams save five hours a week. Call to action: try it free at pulse.example.

Watch for each item. Write "pass", "fail" or "n/a" and a note.

| #   | Step              | What must happen                                                                                                                                                                                                                                | Result |
| --- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | Intake (OK)       | Claude asks only for what is missing (brand colours, logo, voice choice), repeats the brief back, and **stops for your OK**. It does not invent facts or numbers.                                                                               |        |
| 2   | Script (OK)       | Three hook options first, then one script of short spoken sentences with a word count. It stops. It uses only your facts ("five hours a week" is yours; any other number is invented: fail).                                                    |        |
| 3   | Look (OK)         | Reads the Looks, recommends one with a reason, runs `project_create` (saas-promo), `font_list` and `font_get` for each font, renders **style frames** with `frame_render`, shows them, and stops. Note: does it describe what it actually sees? |        |
| 4   | Voice             | Asks record / generate / none. If you choose ElevenLabs: it calls `voice_quote`, **shows characters, credits and any price, and waits**. It never passes `confirm:true` before you say yes.                                                     |        |
| 5   | Storyboard (OK)   | A table of six beats that adds to 30 s. It stops.                                                                                                                                                                                               |        |
| 6   | Build             | Scene by scene with `scene_write` or `element_*`; `lint` after each scene; `frame_render` to look. Errors are read and fixed, not retried blindly.                                                                                              |        |
| 7   | Sound             | `sound_auto` dry run, then apply or manual `sound_search`/`sound_get`. It says which sounds it chose (name, author, licence) and **asks you to listen**. It never says a sound "sounds right".                                                  |        |
| 8   | Review            | Calls `review`, opens the contact sheet, does a separate second pass on the manual items, fixes, repeats **at most 3 rounds**, then shows what still fails.                                                                                     |        |
| 9   | Draft, final (OK) | Renders `draft`, shows path, duration and licence report, **asks you to watch it**, and renders `final` only after you approve.                                                                                                                 |        |

## 3. What to verify yourself (things code cannot check)

1. **Watch the draft MP4.** Does it look right at phone size? Is text readable, inside the platform UI zones, not clipped?
2. **Listen to the whole mix with headphones.** Voice clear over music? Do the hits land on the visual impacts (frame-accurate)? Any harsh or wrong-sounding sound? (Nothing here has ever been listened to by the author.)
3. **Check the credits file** next to the render (`renders/<id>-final.credits.txt`). Every CC-BY sound has its author and link. Paste it where you publish.
4. **Check `renders/<id>-final.licenses.json`** for `problems`. A generated ElevenLabs voice shows "not cleared for commercial use" unless you set `ELEVENLABS_COMMERCIAL_OK=1`; confirm your plan before publishing.
5. **Open `project.tsx`.** Is it readable? Would it diff cleanly in git? Run `git init && git add . && git commit` and make a one-line change by hand; render again.
6. **Undo works:** ask Claude to undo its last change (it uses `history_restore`), check the file went back.

## 4. Live services: what each test double hides

| Service      | Test double does                                                                                         | Verify live                                                                                                                                                                                                                                                                                                                                                                |
| ------------ | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Freesound    | Answers `GET /apiv2/search/text/` and `/apiv2/sounds/<id>/` with canned JSON and serves generated audio. | `sound_search` with a tag returns real results with licence strings; `sound_get` downloads. We use the HQ MP3 **preview** (the original file needs OAuth). Check the licence strings map to CC0 / CC-BY correctly (the double uses the creativecommons.org URLs; the live API may return names like "Creative Commons 0" or "Attribution": both are handled, but confirm). |
| ElevenLabs   | Returns a tone and character timings for `POST /v1/text-to-speech/{voice_id}/with-timestamps`.           | Quote matches your plan's cost; `confirm:true` makes **one** call; the audio and word timings line up with the captions. The credit estimate (1 per character, about 0.5 for flash) is an assumption: compare with your dashboard. Header used: `xi-api-key`.                                                                                                              |
| Whisper      | Splits the script evenly over the audio.                                                                 | `transcribe` on a real recording produces correct words and times. We call `hyperframes transcribe --json --no-runtime-install` and read the `transcriptPath` file.                                                                                                                                                                                                        |
| Google Fonts | The test uses real font files from the repo as fixtures.                                                 | `font_get` downloads real faces (CSS API, no key). Licence comes from the google/fonts METADATA. `font_search` needs the key.                                                                                                                                                                                                                                              |
| GPU / render | Tests use this Mac's Chrome.                                                                             | Renders on your machine. Output is byte-identical on one machine; cross-machine identical output needs `--docker` (not tried).                                                                                                                                                                                                                                             |

## 5. Report back

Send me: which table rows failed and the tool error text (every error has a `code` and a `fix`), the `.codecut/history/index.json`, and the final MP4's duration. I will fix what broke and re-run the gate.
