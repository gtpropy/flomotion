# flomotion-ad

A 30 s, 9:16 ad for flomotion, made with the flomotion-studio skill: one TSX file (`project.tsx`), real screenshots of the live view, an ElevenLabs voice, Freesound loops arranged into a 128 bpm bed, and a different transition at every cut. The whole ad is the file you are looking at.

```bash
python3 scripts/build-voice.py     # places the ElevenLabs phrase clips on the beat grid (audio-src/)
python3 scripts/build-music.py     # arranges the CC0 loops (audio-src/)
flomotion render . --draft         # or the MCP `render` tool
```

`script.md`, `storyboard.md` and `ideas.md` are the plan (the live view's Storyboard tab reads them). `LOG.md` says what was run and what was not. The voice, music and effects were chosen from measurements: listen before you ship.
