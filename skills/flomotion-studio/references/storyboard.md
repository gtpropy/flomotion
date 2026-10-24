# The storyboard board

The live view (`flomotion ui`) has a **Storyboard** tab: a board where the person and you brainstorm, and a timeline of the plan that shows what is built. It reads two plain Markdown files in the project folder. You write them with your normal file tools; there is no MCP tool for it.

| File | Who writes it | What it holds |
|---|---|---|
| `ideas.md` | the person (in the tab) and you | Brainstorm notes: one line per idea |
| `storyboard.md` | you | The plan: one `##` heading per beat |

## ideas.md

```
# Ideas

- [ ] open on the prompt being typed, then the video builds itself (you)
- [x] a mascot dot that reacts to each beat (claude)
```

- `- [ ] text (you)` is an open idea; `- [x]` means used or dropped. The tag is `(you)` or `(claude)`.
- The person adds ideas from the tab; the line lands in `ideas.md`. Read the file at G1, G2 and G4, answer by adding your own `(claude)` lines (alternatives, questions, risks), and tick the ones you used.
- Never delete the person's ideas. Tick them and say why in `LOG.md`.

## storyboard.md

```
# Storyboard: <video name>

Hero: flo (a dot with eyes) · Turn: the two-dots move at 7.0 s · Tempo: 128 bpm

## 1. Hook · 0-3.3 s
- Block: Hook
- Scene: hook
- Voice: "Stop editing videos. Start describing them!"
- On screen: Stop editing. (struck through) Start describing.
- Motion: the strike draws on after "videos"; the prompt types in
- Sound: ui/type x4, hit/boom on "Start"
- Why it works: contrast hook; the typed prompt is paid off at the end

## 2. Pain · 3.3-7.0 s
...
```

Rules:

- Heading: `## <n>. <Title> · <start>-<end> s`. Seconds, on the beat grid when the video has a tempo.
- Lines: `- Key: value`. Known keys the board shows: `Block`, `Scene` (the scene id or ids in `project.tsx`, comma separated), `Voice`, `On screen`, `Motion`, `Sound`, `Why it works`.
- Keep one beat per idea. Words on screen: 6 or fewer per headline.
- Write it at G4, update it when the story changes, and keep it true: the board compares it with `project.tsx`.

## What the tab shows

- A **strip** of the beats along the real timeline: grey = planned, green = built (every scene named in `Scene:` exists in the file), blue = Claude touched it in the last 90 seconds. Click a beat to jump the preview there.
- A **card** per beat with the fields above; the card under the playhead is outlined.
- The **ideas** column with an add box; ticking an idea writes `[x]` back to the file.
- "N of M beats built" so the person sees progress without reading code.

## How to use it in the workflow

1. G0 to G1: the person adds ideas while you interview; read `ideas.md` before proposing directions.
2. G2: put the script's beats into `storyboard.md` (Voice, On screen) so the person sees the story as cards.
3. G4: fill `Block`, `Scene`, `Motion`, `Sound`, `Why it works`; the strip turns green as you `scene_write` each scene.
4. G5: every beat should be green. A grey beat is a gap: say so in "Needs your review".
