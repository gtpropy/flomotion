# flomotion

A code-first video editor. A video is one TSX file; every control a normal editor has is a typed prop or
function. Claude edits it through an MCP server; rendering is done by
[HyperFrames](https://github.com/heygen-com/hyperframes) (HTML + GSAP → headless Chrome + FFmpeg → MP4).

> **Status: early (0.4).** The engine, the MCP server, the `flomotion-studio` skill and the live view are built and tested against
> test doubles for Freesound, ElevenLabs and Whisper. Nothing has been run in a real Claude Code session yet:
> see `docs/gate2-manual-checklist.md` in the repository. Editor type hints for project files are not shipped
> yet (projects run; editors will not resolve `@flomotion/*` types).

## Requirements

Node 22+, **FFmpeg and ffprobe on PATH** (`brew install ffmpeg`), Google Chrome (or set `CHROME_PATH`).
Optional: `whisper-cpp` for transcription (`brew install whisper-cpp`). Optional environment keys:
`FREESOUND_API_KEY` (sound search and download), `GOOGLE_FONTS_API_KEY` (font search only),
`ELEVENLABS_API_KEY` (generated voice; always quoted first, runs only with `confirm: true`).

## Use it from Claude Code

```bash
npx -y flomotion install skill      # installs the flomotion-studio skill for all your projects (~/.claude/skills)
mkdir my-video && cd my-video
claude mcp add flomotion -e FREESOUND_API_KEY=… -- npx -y flomotion mcp --dir . --ui
claude                              # describe the video you want
```

`flomotion install skill --project` installs into the current folder only. The skill runs a gated workflow:
interview (extensive, with a read-back), direction, script, style frames, storyboard, draft, final. It stops for
your OK at each gate. Sounds and fonts are fetched into a licence ledger; CC-BY credits are written next to the
render. The agent cannot hear audio or judge taste, so it lists what you need to review.

## Live view

`--ui` on the MCP server (or `flomotion ui` in the project folder) serves a small page on `127.0.0.1:4317`. It shows,
in real time: each tool call Claude makes with its result, progress through the gates, the scene outline and
timeline, a preview you can scrub (rendered on demand from the file on disk), the code with the latest change
highlighted, review results, the sounds and fonts used with their licences, renders you can play, and the
history with a Restore button. It is a viewer with undo, not an editor yet. It listens on localhost only and loads
nothing from the network.

## CLI

```bash
flomotion mcp --dir . [--ui]      # MCP server over stdio (39 tools, 4 resources); --ui also serves the live view
flomotion ui [--open]             # the live view for this folder
flomotion install skill [--project]
flomotion init my-video           # scaffold a project
flomotion fonts sync my-video     # download and lock fonts (the only network use besides sound/voice tools)
flomotion lint my-video
flomotion render my-video         # -> my-video/renders/<id>.mp4 (+ .credits.txt, .licenses.json)
flomotion frame my-video 2.5      # one PNG
flomotion sheet my-video          # contact sheet
flomotion docs                    # reference docs for every component, from the schemas
```

A project is `project.tsx` exporting a `<Composition>`; components are imported from `@flomotion/components`
(or `flomotion/components`). Renders never use the network: fonts are locked by hash and checked before the first
frame; a missing or changed font file fails the render with the font id and path.

## Limits

Some Later-tier options are typed stubs (`Precomp`, `Adjustment`, shader transitions, `.cube` LUTs, 3D text).
Byte-identical renders are verified on one machine only. See `docs/later.md` in the repository.

MIT licensed.
