# Motion

Rules first, then patterns with the exact CodeCut props. Everything is a pure function of time, so a render repeats exactly.

## Rules

1. **Never linear motion.** Every move has an ease. `keyframe_set` takes it as the third value: `[0.4, 1, "expo.out"]`. A key's ease is the curve used to arrive at that key.
2. **Fast in, slow settle.** Entrances use `expo.out` or `power3.out` (most of the distance in the first third). Exits are shorter than entrances and use `expo.in` or `power2.in`.
3. **A slight overshoot for pops.** `back.out(1.8)` for things that land, `back.out(1.2)` for calm Looks. Do not overshoot text you need to read at the end.
4. **Stagger 0.05 to 0.1 s.** Lists, letters and cards enter one after another. Under 0.04 s reads as one blob; over 0.15 s feels slow. Use `<Stagger each={0.08}>` around the children, or `SplitText` for text.
5. **Overlap actions.** The next move starts before the last one has settled (about 60 to 70 % through). Nothing waits for everything else to stop.
6. **A slow constant push on the camera.** Put a scale key on the Scene: `scale={[[0, 1], [3, 1.06]]}` over the scene's length. This also keeps the frame from ever being still (review check 4).
7. **Parallax between depth layers.** Background moves 0.3 to 0.5 times as far as the foreground over the same time. Give them different `position` keys.
8. **Sound on every landing.** Each impact effect has a `sound` tag; `sound_auto` places it. Check 10 in the review fails without it.
9. **One idea per beat.** One hero move per scene; the rest supports it.
10. **Hold the end state briefly** (0.3 to 0.5 s) before the next thing so the eye can read.

## Durations

| What | Seconds |
| --- | --- |
| Pop / small UI | 0.25 to 0.4 |
| Title enter | 0.5 to 0.7 |
| Scene transition | 0.3 (flash, cut) to 0.6 (dissolve) |
| Counter | 0.8 to 1.4 |
| Hold for reading | about 0.25 s per word on screen, minimum 1.2 s for a headline |

## Patterns

Entrance of a headline (props, no effect element needed):

```tsx
<Title id="t1" text="Ship videos as code" size={118}
  enter={{ from: "sw", distance: 120, ease: "expo.out", duration: 0.6 }} />
```

A landing with weight (impact effect as a child of the layer):

```tsx
<Title id="t1" text="Boom" enter={{ from: "n", distance: 300, ease: "expo.in", duration: 0.25 }}>
  <Shake id="t1-shake" amp={10} freq={14} decay={5} start="0.25s" />
</Title>
```

`Shake`, `Thud`, `Slam`, `PunchZoom`, `Hitstop`, `Glitch`, `RGBSplit`, `Pulse`, `Wobble`, `SquashStretch` are impact effects. `start` is relative to the parent layer. Each has a default `sound` tag; set `sound=""` only when you want it silent on purpose.

Staggered cards:

```tsx
<Stagger id="cards" each={0.08}>
  <Card id="c1" enter={{ from: "s", distance: 80, ease: "expo.out" }} />
  <Card id="c2" enter={{ from: "s", distance: 80, ease: "expo.out" }} />
  <Card id="c3" enter={{ from: "s", distance: 80, ease: "expo.out" }} />
</Stagger>
```

Text by word: `<SplitText id="h" text="Make it move" preset="rise" />`. Presets: rise, typewriter, wave, scramble, slam, blur-in, mask-reveal, weight-pulse, tracking-in, counter. Use `rise` or `mask-reveal` for headlines, `typewriter` for code and quotes, `slam` only once per film.

Camera push on a scene: `scale={[[0, 1], [3, 1.06]]}` (the key times are relative to the Scene).

Cut on a beat: end a scene on a hit and start the next on the following frame; use the Look's transition for a change of idea and a hard cut for the same idea.

## What to avoid

- Linear ease on anything that moves.
- Everything entering at once.
- Shake on every element (it stops meaning "hit"). Use it for the main impact of a scene.
- Long fades on text the viewer must read quickly.
- Randomness from code. Use `ctx.noise(seed, freq)` in expressions; the linter rejects `Math.random`, `Date.now` and timers.
