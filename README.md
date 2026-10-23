# CodeCut

A code-first video editor. A video is one TSX file; every control a normal editor has is a typed prop or
function. An editor UI and Claude (through MCP) edit the same project file. Rendering is done by
[HyperFrames](https://github.com/heygen-com/hyperframes) (HTML + GSAP → headless Chrome + FFmpeg → MP4); CodeCut is
the authoring layer on top. The product name lives in one constant: `packages/core/src/config.ts`.

```tsx
export default (
  <Composition id="promo" size={[1080, 1920]} fps={30} duration="30s" theme="$look.kinetic">
    <Track id="v1" kind="video">
      <Scene id="hook" start="0s" duration="3s">
        <Title
          id="t1"
          text="Ship videos as code"
          enter={{ from: "sw", distance: 120, ease: "expo.out", duration: 0.6 }}
        >
          <Shake amp={6} freq={14} decay={5} start="0.6s" />
        </Title>
        <Sound id="s1" src="./assets/sfx/land.wav" at="0.6s" peak="land" gain={-6} />
      </Scene>
    </Track>
  </Composition>
);
```

## Requirements

Node 22+, [pnpm](https://pnpm.io) (`npm i -g pnpm`; Node 25 no longer ships corepack), **FFmpeg + ffprobe on PATH**
(`brew install ffmpeg`), and Google Chrome (or set `CHROME_PATH`). Optional: `whisper-cpp` for transcription
(`brew install whisper-cpp`). Environment keys, all optional: `FREESOUND_API_KEY`, `GOOGLE_FONTS_API_KEY`
(font search metadata only), `ELEVENLABS_API_KEY`.

## Commands

```bash
pnpm i
pnpm test                       # unit, compiler, goldens, e2e (golden/e2e use the network once to sync fonts)
pnpm build                      # typecheck every package and bundle the CLI to packages/cli/dist
pnpm run gen:docs               # docs/components/*.md and the skill's components.md from the schemas
pnpm lint                       # eslint + prettier

pnpm codecut fonts sync examples/saas-promo   # download fonts, write .codecut/fonts.lock.json and the ledger
pnpm codecut lint examples/saas-promo
pnpm codecut render examples/saas-promo       # → examples/saas-promo/renders/promo.mp4
pnpm codecut frame examples/saas-promo 9.5    # one PNG
pnpm codecut sheet examples/saas-promo        # contact sheet
```

## Use it from Claude Code (MCP)

```bash
mkdir my-video && cd my-video
claude mcp add codecut -e FREESOUND_API_KEY=… -- npx -y codecut mcp --dir .
npx -y codecut skill install            # copies the motion-studio skill to .claude/skills
claude                                  # then describe the video you want
```

The skill runs a gated workflow (intake, script, look, voice, storyboard, build, sound, review, draft, final).
`docs/gate2-manual-checklist.md` lists what to set up and what to verify by hand (nothing here has been run in a
real Claude Code session). From a checkout use `node packages/cli/dist/bin.mjs mcp --dir .` after `pnpm build`.

Fonts are the only thing fetched, and only by `fonts sync`. **Renders never use the network**: fonts are locked
by hash, checked in headless Chrome before the first frame, and a missing or changed file fails the render with
the font id and path.

## Layout

```
packages/core        schema system, JSX runtime, resolver, compiler, keyframes, linter, edit ops
packages/components  76 components and effects built with defineComponent/defineEffect
packages/render      HyperFrames wrapper, fonts, Chrome measurement, audio mix, project build
packages/mcp         MCP server (30 tools), codemods, Freesound, voice, review
packages/cli         the codecut CLI
skills/motion-studio the director skill: workflow, references, Looks
examples/            saas-promo (30 s, 9:16) and typography (fonts test project)
tests/               golden frames, e2e, schema round trip
docs/                spec.md, hyperframes-notes.md, later.md, components/
```

See `docs/spec.md` for the language, `docs/hyperframes-notes.md` for what was verified about HyperFrames, and
`CHANGELOG.md`.
