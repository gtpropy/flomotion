# Block recipes (TSX you can write with `scene_write`)

`blocks.md` says what each block is for. This file is **how to build the 13 core blocks with the real components**. Each recipe is one `<Scene>` in the `clean-light` look at 1080 x 1920 inside `<SafeArea preset="reels">`. To use one:

1. Copy the recipe, change the `id`s to names that describe the beat (`hook-claim`, not `t1`), and replace the sample words and numbers with the person's own. Sample text is invented; never ship it.
2. Set `start` and `duration` from the storyboard.
3. `scene_write` it over the placeholder scene, then `lint`, then `frame_render` at the first and last moment and read the frames.

Switching look: the tokens (`$brand.*`, `$type.*`) come from the active look, so the same recipe re-skins when `theme` changes. Dark looks use `$brand.text` on `$brand.bg`; the flat-block looks (`bold-kinetic`) should set `fill` of the background `Rect` to one of `$brand.block1..5` per scene.

A recipe is a starting structure, not a finished scene. Tune timing to the voice, rotate entrance directions, and keep **one hero** (see `motion.md`). The 13 pattern blocks (`TypedQuery`, `WipeMatchCut`, ...) have no recipes yet: build them from the same components as a **custom scene** and record why in `LOG.md` (block rule 5).

Sounds are not placed here. After the scenes exist run `sound_auto` (dry run first) and place the rest with `sound_search` and `sound_get`.

## 1 Hook

```tsx
<Scene id="hook" start="0s" duration="2.6s" scale={[[0, 1], [2.6, 1.05]]}>
  <Rect id="hook-bg" width={1080} height={1920} fill="$brand.bg" />
  <SafeArea id="hook-safe" preset="reels">
    <SplitText id="hook-claim" text="Stop editing. Start shipping." at={[0, 520]} align="left" size={132}
      fill="$brand.text" font="$type.display" preset="rise" stagger={0.08} start="0.05s" maxWidth="100%">
      <Shake id="hook-shake" amp={8} freq={16} decay={9} start="0.55s" />
    </SplitText>
    <Rect id="hook-rule" at={[0, 1010]} width={220} height={12} radius={6} fill="$brand.accent" anchor={[0, 50]}
      scale={[[0.5, [0, 1]], [1.1, [1, 1], "expo.out"]]} />
  </SafeArea>
</Scene>
```

## 2 Problem (list)

```tsx
<Scene id="problem" start="2.6s" duration="4.5s" scale={[[0, 1], [4.5, 1.04]]}>
  <Rect id="problem-bg" width={1080} height={1920} fill="$brand.bg" />
  <SafeArea id="problem-safe" preset="reels">
    <Stagger id="problem-lines" each={0.9}>
      <Text id="problem-1" at={[0, 420]} text="Updates in five places." size={72} weight={700} fill="$brand.text" align="left" maxWidth="100%" font="$type.display" enter={{ from: "w", distance: 90, ease: "expo.out", duration: 0.5 }} />
      <Text id="problem-2" at={[0, 640]} text="Nobody reads them." size={72} weight={700} fill="$brand.text" align="left" maxWidth="100%" font="$type.display" enter={{ from: "e", distance: 90, ease: "expo.out", duration: 0.5 }} />
      <Text id="problem-3" at={[0, 860]} text="Deadlines slip." size={72} weight={700} fill="$brand.negative" align="left" maxWidth="100%" font="$type.display" enter={{ from: "w", distance: 90, ease: "expo.out", duration: 0.5 }} />
    </Stagger>
  </SafeArea>
</Scene>
```

Vary the entry direction line to line (block fail: every line the same animation). Dim earlier lines with an `opacity` keyframe to 0.4 when the next one lands.

## 3 ProductReveal

```tsx
<Scene id="reveal" start="7.1s" duration="3.2s" transition={{ type: "slide", direction: "s", duration: 0.45 }} scale={[[0, 1], [3.2, 1.04]]}>
  <Rect id="reveal-bg" width={1080} height={1920} fill={{ type: "linear", angle: 180, stops: [[0, "$brand.bg"], [1, "$brand.surface"]] }} />
  <SafeArea id="reveal-safe" preset="reels">
    <Title id="reveal-title" text="Meet Pulse." at="top" size={110} fill="$brand.text" font="$type.display" enter={{ from: "n", distance: 80, ease: "expo.out", duration: 0.55 }} />
  </SafeArea>
  <UIMock id="reveal-phone" at={[190, 400]} device="phone" width={700} height={1080}
    enter={{ from: "s", distance: 520, ease: "expo.out", duration: 0.9, delay: 0.2 }}>
    <Rect id="reveal-screen" width={656} height={1036} fill="$brand.surface" at="top-left" />
    <Text id="reveal-app" text="Pulse" at={[40, 90]} size={56} weight={700} fill="$brand.text" font="$type.display" maxWidth={500} align="left" />
    <Chip id="reveal-live" at={[420, 96]} label="Live" dot="$brand.positive" fill="$brand.bg" textColor="$brand.text" size={30} />
  </UIMock>
  <PunchZoom id="reveal-punch" start="0.2s" amount={0.05} />
</Scene>
```

Use a real screenshot or skeleton UI inside the screen (`Image` or a few `RoundRect` bars), never invented product claims.

## 4 UIZoom

```tsx
<Scene id="uizoom" start="10.3s" duration="3s">
  <Rect id="uizoom-bg" width={1080} height={1920} fill="$brand.bg" />
  <Card id="uizoom-ui" at={[60, 420]} layout="absolute" width={960} height={680} fill="$brand.surface" radius={28}
    anchor={[8, 28]} scale={[[0.2, 1], [1.4, 1.7, "power3.inOut"]]}>
    <Text id="uizoom-label" text="Weekly digest" at={[56, 56]} size={48} weight={700} fill="$brand.text" font="$type.display" maxWidth={600} align="left" />
    <RoundRect id="uizoom-target" at={[56, 180]} width={460} height={120} fill="$brand.bg" radius={20}
      stroke={{ width: 6, color: "$brand.accent" }} />
  </Card>
  <SafeArea id="uizoom-safe" preset="reels">
    <Text id="uizoom-caption" at="bottom" text="One click, every Monday." size={56} weight={600} fill="$brand.text" font="$type.body" maxWidth="90%"
      enter={{ from: "s", distance: 40, ease: "expo.out", duration: 0.5, delay: 1.1 }} />
  </SafeArea>
</Scene>
```

The card zooms around `anchor` (a point in the card, in %), so put the target region there. After the zoom, check the target text is still above the minimum size (`config/thresholds.json`).

## 5 FeatureCallout

```tsx
<Scene id="feature-1" start="13.3s" duration="3s" transition={{ type: "slide", direction: "e", duration: 0.4 }}>
  <Rect id="feature-1-bg" width={1080} height={1920} fill="$brand.bg" />
  <SafeArea id="feature-1-safe" preset="reels">
    <Card id="feature-1-card" at={[0, 520]} width={920} height={420} fill="$brand.surface" padding={48}
      enter={{ from: "s", distance: 100, ease: "expo.out", duration: 0.55 }}>
      <Text id="feature-1-title" text="Deadline alerts" size={68} weight={700} fill="$brand.text" align="left" maxWidth="100%" font="$type.display" />
      <Text id="feature-1-detail" text="Warned early, not late." size={44} fill="$brand.textMuted" align="left" maxWidth="100%" font="$type.body" />
    </Card>
    <Cursor id="feature-1-cursor" at={[0, 0]} size={64} position={[[0.2, [820, 1300]], [1.2, [700, 760], "power3.inOut"]]} clicks={["1.3s"]} />
  </SafeArea>
</Scene>
```

One feature per callout. The `click` sound belongs on the ripple frame (1.3 s here).

## 6 StatCounter

```tsx
<Scene id="stat" start="16.3s" duration="2.4s" scale={[[0, 1.04], [2.4, 1]]}>
  <Rect id="stat-bg" width={1080} height={1920} fill="$brand.bg" />
  <SafeArea id="stat-safe" preset="reels">
    <Counter id="stat-number" at={[0, 560]} from={0} to={5} suffix=" h" over={1.2} delay="0.2s" size={300} weight={800}
      align="left" maxWidth="100%" fill="$brand.accent" font="$type.numerals">
      <Thud id="stat-thud" amp={20} start="1.4s" />
    </Counter>
    <Text id="stat-label" at={[0, 980]} text="saved per team, every week" size={52} fill="$brand.text" align="left" maxWidth="100%" font="$type.body"
      enter={{ from: "s", distance: 40, ease: "expo.out", duration: 0.5, delay: 1.3 }} />
  </SafeArea>
</Scene>
```

`value` must come with a **source** (and permission for a customer figure). Put the source in the storyboard and the license/credits notes; if the person has none, do not use this block.

## 7 ChartReveal

```tsx
<Scene id="chart" start="18.7s" duration="3.2s">
  <Rect id="chart-bg" width={1080} height={1920} fill="$brand.bg" />
  <SafeArea id="chart-safe" preset="reels">
    <Text id="chart-title" at={[0, 300]} text="Projects on time" size={64} weight={700} fill="$brand.text" align="left" maxWidth="100%" font="$type.display" />
    <Card id="chart-card" at={[0, 520]} width={920} height={760} fill="$brand.surface" padding={48}>
      <Chart id="chart-bars" type="bar" width={824} height={620} progress={[[0.4, 0], [1.8, 1, "expo.out"]]}
        data={[{ label: "Q1", value: 42, color: "$brand.textMuted" }, { label: "Q2", value: 55, color: "$brand.textMuted" }, { label: "Q3", value: 71, color: "$brand.accent" }, { label: "Q4", value: 64, color: "$brand.textMuted" }]}
        labelColor="$brand.textMuted" />
    </Card>
  </SafeArea>
</Scene>
```

Data must come from the person. At most 6 bars. Give every bar a `color` from the look (muted for the rest, the accent for the one you highlight), or the chart falls back to its own default colours. Pulse it once with a `Pulse` effect on a ring or label if needed.

## 8 Quote

```tsx
<Scene id="quote" start="21.9s" duration="3.6s">
  <Rect id="quote-bg" width={1080} height={1920} fill="$brand.surface" />
  <SafeArea id="quote-safe" preset="reels">
    <Text id="quote-text" at={[0, 480]} text="It finally feels calm." size={96} weight={700} fill="$brand.text" align="left" maxWidth="100%" font="$type.display"
      enter={{ from: "s", distance: 60, ease: "expo.out", duration: 0.6 }} />
    <Stack id="quote-who" position={[0, 1080]} direction="column" gap={6}>
      <Text id="quote-name" text="Name Surname" size={44} weight={600} fill="$brand.text" align="left" maxWidth="100%" font="$type.body" enter={{ from: "s", distance: 24, duration: 0.45, delay: 0.9 }} />
      <Text id="quote-role" text="Role, Company" size={40} fill="$brand.textMuted" align="left" maxWidth="100%" font="$type.body" enter={{ from: "s", distance: 24, duration: 0.45, delay: 1.0 }} />
    </Stack>
  </SafeArea>
</Scene>
```

Only with a real quote, name, role, company and permission from the person. The sample above is a placeholder: replace it or leave a visible `TBD`.

## 9 LogoStrip

```tsx
<Scene id="logos" start="25.5s" duration="2.4s">
  <Rect id="logos-bg" width={1080} height={1920} fill="$brand.bg" />
  <SafeArea id="logos-safe" preset="reels">
    <Text id="logos-caption" at={[0, 520]} text="Trusted by teams at" size={48} fill="$brand.textMuted" align="left" maxWidth="100%" font="$type.body" />
    <Stack id="logos-row" position={[0, 700]} direction="column" gap={48}>
      <Image id="logo-1" src="./assets/logo-1.png" height={110} fit="contain" enter={{ from: "s", distance: 30, duration: 0.4 }} />
      <Image id="logo-2" src="./assets/logo-2.png" height={110} fit="contain" enter={{ from: "s", distance: 30, duration: 0.4, delay: 0.12 }} />
      <Image id="logo-3" src="./assets/logo-3.png" height={110} fit="contain" enter={{ from: "s", distance: 30, duration: 0.4, delay: 0.24 }} />
    </Stack>
  </SafeArea>
</Scene>
```

Logos are the person's own or licensed files in `assets/`. Never draw another company's logo.

## 10 BeforeAfter

```tsx
<Scene id="before-after" start="27.9s" duration="3.4s">
  <Rect id="ba-bg" width={1080} height={1920} fill="$brand.bg" />
  <SafeArea id="ba-safe" preset="reels">
    <Card id="ba-before" at={[0, 380]} width={760} height={190} fill="$brand.surface" opacity={[[1.4, 1], [2, 0.4]]} scale={[[1.4, 1], [2, 0.88, "power3.inOut"]]}>
      <Text id="ba-before-t" text="Before: five tools" size={52} fill="$brand.textMuted" align="left" maxWidth="100%" font="$type.body" />
    </Card>
    <Card id="ba-after" at={[0, 700]} width={920} height={300} fill="$brand.surface" stroke={{ width: 6, color: "$brand.accent" }}
      enter={{ from: "s", distance: 120, ease: "expo.out", duration: 0.6, delay: 1.5 }}>
      <Text id="ba-after-t" text="After: one board" size={68} weight={700} fill="$brand.text" align="left" maxWidth="100%" font="$type.display" />
    </Card>
  </SafeArea>
</Scene>
```

## 11 Offer

```tsx
<Scene id="offer" start="31.3s" duration="3.4s">
  <Rect id="offer-bg" width={1080} height={1920} fill="$brand.bg" />
  <SafeArea id="offer-safe" preset="reels">
    <Stagger id="offer-plans" each={0.15}>
      <Card id="plan-1" at={[0, 380]} width={920} height={230} fill="$brand.surface" enter={{ from: "s", distance: 90, ease: "expo.out", duration: 0.5 }}>
        <Text id="plan-1-name" text="Starter" size={56} weight={700} fill="$brand.text" align="left" maxWidth="100%" font="$type.display" />
        <Text id="plan-1-price" text="PRICE" size={56} fill="$brand.textMuted" align="left" maxWidth="100%" font="$type.body" />
      </Card>
      <Card id="plan-2" at={[0, 700]} width={920} height={300} fill="$brand.surface" stroke={{ width: 6, color: "$brand.accent" }} enter={{ from: "s", distance: 90, ease: "expo.out", duration: 0.5 }}>
        <Text id="plan-2-name" text="Team" size={68} weight={700} fill="$brand.text" align="left" maxWidth="100%" font="$type.display" />
        <Text id="plan-2-price" text="PRICE" size={56} fill="$brand.accent" align="left" maxWidth="100%" font="$type.body" />
      </Card>
    </Stagger>
  </SafeArea>
</Scene>
```

Prices come only from the person. `PRICE` is a visible placeholder: replace it or leave it so the draft shows what is missing.

## 12 CtaCard

```tsx
<Scene id="cta" start="34.7s" duration="3s" transition={{ type: "dissolve", duration: 0.4 }} scale={[[0, 1], [3, 1.04]]}>
  <Rect id="cta-bg" width={1080} height={1920} fill="$brand.bg" />
  <SafeArea id="cta-safe" preset="reels">
    <Title id="cta-line" text="Try Pulse free." at={[0, 620]} align="left" size={128} maxWidth="100%" fill="$brand.text" font="$type.display"
      enter={{ from: "s", distance: 120, ease: "expo.out", duration: 0.55 }}>
      <PunchZoom id="cta-punch" start="0.5s" amount={0.04} />
    </Title>
    <Chip id="cta-url" at={[0, 1060]} label="pulse.example" dot="$brand.accent" fill="$brand.surface" textColor="$brand.text" size={56}
      enter={{ from: "s", distance: 40, ease: "expo.out", duration: 0.5, delay: 0.9 }}>
      <Pulse id="cta-pulse" start="1.5s" count={3} amp={0.05} freq={2} sound="" />
    </Chip>
  </SafeArea>
</Scene>
```

The URL must be readable (56 px or more) and the last state must hold at least one second.

## 13 Bridge (the hero carried between scenes)

The hero lives on its own track above the scenes so it is never cut by a scene change. Add the track once, then move the hero with keyframes across the beats:

```tsx
<Track id="hero-track" kind="video">
  <Circle id="hero" start="0s" duration="37.7s" width={84} fill="$brand.accent" at={[900, 300]}
    position={[[0, [0, 0]], [2.6, [0, 24], "power3.inOut"], [7.1, [0, 0], "power3.inOut"], [13.3, [0, 24], "power3.inOut"], [34.7, [0, 0], "power3.inOut"]]}
    scale={[[0, 1], [2.6, 0.8, "power3.inOut"], [7.1, 1.7, "back.out(1.2)"], [13.3, 1, "power3.inOut"], [34.7, 2.2, "expo.out"]]} />
</Track>
```

The hero sits in the top-right margin, above the content, so it never covers text; it grows at the turn and again on the CTA. Rules: the hero keeps its shape logic, transitions are 0.3 to 0.7 s, and the `Marker` named `turn` sits where the look changes. A hero that changes style mid-video is a defect.
