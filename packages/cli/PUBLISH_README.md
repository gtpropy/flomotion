# flomotion (CodeCut)

The npm package is **`flomotion`**. The tool is called CodeCut and its command is `codecut` (`flomotion` works as an alias).

A code-first video editor. A video is one TSX file; every control a normal editor has is a typed prop or
function. Claude edits it through an MCP server; rendering is done by
[HyperFrames](https://github.com/heygen-com/hyperframes) (HTML + GSAP → headless Chrome + FFmpeg → MP4).

> **Status: early (0.2).** The engine, the MCP server and the `motion-studio` skill are built and tested against
> test doubles for Freesound, ElevenLabs and Whisper. Nothing has been run in a real Claude Code session yet:
> see `docs/gate2-manual-checklist.md` in the repository. Editor type hints for project files are not shipped
> yet (projects run; editors will not resolve `@codecut/*` types).

## Requirements

Node 22+, **FFmpeg and ffprobe on PATH** (`brew install ffmpeg`), Google Chrome (or set `CHROME_PATH`).
Optional: `whisper-cpp` for transcription (`brew install whisper-cpp`). Optional environment keys:
`FREESOUND_API_KEY` (sound search and download), `GOOGLE_FONTS_API_KEY` (font search only),
`ELEVENLABS_API_KEY` (generated voice; always quoted first, runs only with `confirm: true`).

## Use it from Claude Code

```bash
mkdir my-video && cd my-video
claude mcp add codecut -e FREESOUND_API_KEY=… -- npx -y flomotion mcp --dir .
npx -y flomotion skill install        # copies the motion-studio skill to .claude/skills
claude                              # describe the video you want
```

The skill runs a gated workflow: intake, script, look, voice, storyboard, build, sound, review, draft, final. It
stops for your OK at each gate. Sounds and fonts are fetched into a licence ledger; CC-BY credits are written next
to the render. The agent cannot hear audio or judge taste, so it asks you to listen and approve.

## CLI

```bash
codecut mcp --dir .             # MCP server over stdio (30 tools, 4 resources)
codecut skill install [--global]
codecut init my-video           # scaffold a project
codecut fonts sync my-video     # download and lock fonts (the only network use besides sound/voice tools)
codecut lint my-video
codecut render my-video         # -> my-video/renders/<id>.mp4 (+ .credits.txt, .licenses.json)
codecut frame my-video 2.5      # one PNG
codecut sheet my-video          # contact sheet
codecut docs                    # reference docs for every component, from the schemas
```

A project is `project.tsx` exporting a `<Composition>`; components are imported from `@codecut/components`
(or `flomotion/components`). Renders never use the network: fonts are locked by hash and checked before the first
frame; a missing or changed font file fails the render with the font id and path.

## Limits

Some Later-tier options are typed stubs (`Precomp`, `Adjustment`, shader transitions, `.cube` LUTs, 3D text).
Byte-identical renders are verified on one machine only. See `docs/later.md` in the repository.

MIT licensed.
