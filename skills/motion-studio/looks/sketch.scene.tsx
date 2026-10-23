import {
  Composition,
  Track,
  Scene,
  SafeArea,
  Rect,
  Circle,
  Title,
  Text,
  SplitText,
  Chip,
  Counter,
  Card,
  Wobble,
  Grain,
} from "@codecut/components";

/**
 * Reference scene for the Sketch Look: hand-drawn, playful, bouncy.
 * Two beats joined by a wipe. Marker display type, paper colours, bouncy eases (back.out, elastic.out),
 * slight rotations, one wobble on the landing, paper grain. Sounds are left to `ui/pop` choices.
 */
export default (
  <Composition
    id="sketch-reference"
    size={[1080, 1920]}
    fps={30}
    duration="6s"
    theme="$look.sketch"
    background="$brand.bg"
  >
    <Track id="v1" kind="video">
      <Scene id="pitch" start="0s" duration="3.2s" scale={[[0, 1], [3.2, 1.04]]}>
        <Rect id="pitch-bg" width={1080} height={1920} fill="$brand.bg" />
        <Circle
          id="pitch-blob"
          width={620}
          position={[260, -520]}
          fill="$brand.accent"
          opacity={0.16}
          scale={[[0, 0.6], [1, 1, "elastic.out(1,0.5)"]]}
        />
        <SafeArea id="pitch-safe" preset="reels">
          <Chip
            id="pitch-chip"
            at={[0, 380]}
            label="new!"
            dot="$brand.primary"
            fill="$brand.surface"
            textColor="$brand.fg"
            size={40}
            rotation={-4}
            enter={{ from: "w", distance: 80, ease: "back.out(2)", duration: 0.55 }}
          />
          <Title
            id="pitch-title"
            text="Draw it. Move it. Ship it."
            at={[0, 520]}
            align="left"
            size={150}
            leading={1.02}
            maxWidth="100%"
            font="$type.display"
            fill="$brand.fg"
            rotation={-2}
            enter={{ from: "s", distance: 220, ease: "back.out(2)", duration: 0.7, delay: 0.1, rotate: 4 }}
          >
            <Wobble id="pitch-wobble" amp={3} start="0.7s" sound="" />
          </Title>
          <Rect
            id="pitch-underline"
            at={[0, 1190]}
            width={560}
            height={18}
            radius={9}
            fill="$brand.primary"
            rotation={-2}
            anchor={[0, 50]}
            scale={[[1.0, [0, 1]], [1.6, [1, 1], "back.out(1.4)"]]}
          />
          <Text
            id="pitch-sub"
            at={[0, 1260]}
            text="Little videos with big personality."
            size={56}
            fill="$brand.muted"
            align="left"
            maxWidth="90%"
            font="$type.body"
            enter={{ from: "s", distance: 40, ease: "back.out(1.6)", duration: 0.6, delay: 1.5 }}
          />
        </SafeArea>
      </Scene>

      <Scene
        id="count"
        start="3.2s"
        duration="2.8s"
        transition={{ type: "wipe", direction: "e", duration: 0.45 }}
      >
        <Rect id="count-bg" width={1080} height={1920} fill="$brand.bg" />
        <SafeArea id="count-safe" preset="reels">
          <Card
            id="count-card"
            at={[0, 520]}
            width={900}
            height={460}
            fill="$brand.surface"
            radius={48}
            stroke={{ width: 6, color: "$brand.fg" }}
            rotation={2}
            shadow={false}
            enter={{ from: "s", distance: 300, ease: "back.out(1.8)", duration: 0.7, rotate: -5 }}
          >
            <Text
              id="count-label"
              text="doodles drawn"
              size={56}
              fill="$brand.muted"
              align="center"
              maxWidth="100%"
              font="$type.body"
            />
            <Counter
              id="count-num"
              from={0}
              to={1280}
              over={1.3}
              delay="0.5s"
              size={190}
              align="center"
              maxWidth="100%"
              fill="$brand.primary"
              font="$type.numerals"
            />
          </Card>
          <Text
            id="count-note"
            at={[0, 1300]}
            text="and counting"
            size={64}
            fill="$brand.accent"
            align="center"
            maxWidth="100%"
            rotation={-3}
            font="$type.display"
            enter={{ from: "s", distance: 50, ease: "elastic.out(1,0.5)", duration: 0.8, delay: 1.7 }}
          />
        </SafeArea>
      </Scene>
    </Track>
    <Grain id="sketch-grain" amount={0.18} />
  </Composition>
);
