import {
  Composition,
  Track,
  Scene,
  SafeArea,
  Rect,
  Title,
  Text,
  SplitText,
  Chip,
  Counter,
  Card,
  Shake,
  RGBSplit,
  PunchZoom,
  Vignette,
  Grain,
} from "@codecut/components";

/**
 * Reference scene for the Kinetic Look: loud, fast, hard contrast.
 * Two beats. A slammed headline with a hit, then a number that lands.
 * Shows: expo eases, one main impact per beat, flash transition, accent colour used once,
 * display weight for the claim and tabular numerals for the stat, grain on top.
 * Sounds are left off here (sound="") so the file renders without any sound assets.
 */
export default (
  <Composition
    id="kinetic-reference"
    size={[1080, 1920]}
    fps={30}
    duration="6s"
    theme="$look.kinetic"
    background="$brand.bg"
  >
    <Track id="v1" kind="video">
      <Scene id="claim" start="0s" duration="3s" scale={[[0, 1], [3, 1.06]]}>
        <Rect
          id="claim-bg"
          width={1080}
          height={1920}
          fill={{ type: "linear", angle: 165, stops: [[0, "#1a0b2e"], [1, "#0b0b12"]] }}
        />
        <Rect
          id="claim-glow"
          width={1080}
          height={1920}
          fill={{
            type: "radial",
            stops: [
              [0, "rgba(255,51,102,0.55)"],
              [0.55, "rgba(255,51,102,0.08)"],
              [1, "rgba(255,51,102,0)"],
            ],
          }}
          scale={[[0, 0.7], [1.4, 1.15, "expo.out"]]}
          position={[0, -120]}
        />
        <SafeArea id="claim-safe" preset="reels">
          <Chip
            id="claim-chip"
            at={[0, 300]}
            label="NEW"
            dot="$brand.accent"
            fill="$brand.surface"
            textColor="$brand.fg"
            size={34}
            enter={{ from: "w", distance: 60, ease: "expo.out", duration: 0.45 }}
          />
          <Title
            id="claim-title"
            text="Make it move."
            at={[0, 520]}
            align="left"
            size={170}
            maxWidth="100%"
            font="$type.display"
            enter={{ from: "sw", distance: 160, ease: "expo.out", duration: 0.55, delay: 0.1 }}
          >
            <Shake id="claim-shake" amp={12} freq={14} decay={5} start="0.62s" sound="" />
          </Title>
          <Text
            id="claim-sub"
            at={[0, 1010]}
            text="Video, written like code."
            size={56}
            fill="$brand.muted"
            align="left"
            maxWidth="86%"
            font="$type.body"
            enter={{ from: "s", distance: 40, ease: "expo.out", duration: 0.5, delay: 0.7 }}
          />
          <Rect
            id="claim-bar"
            at={[0, 1200]}
            width={260}
            height={14}
            radius={7}
            fill="$brand.primary"
            scale={[[0.8, [0, 1]], [1.4, [1, 1], "expo.out"]]}
            anchor={[0, 50]}
          />
        </SafeArea>
        <PunchZoom id="claim-punch" start="0.6s" amount={0.05} sound="" />
      </Scene>

      <Scene
        id="stat"
        start="3s"
        duration="3s"
        transition={{ type: "flash", duration: 0.3 }}
        scale={[[0, 1.04], [3, 1]]}
      >
        <Rect id="stat-bg" width={1080} height={1920} fill="$brand.bg" />
        <SafeArea id="stat-safe" preset="reels">
          <Text
            id="stat-label"
            at={[0, 380]}
            text="TIME TO FIRST CUT"
            size={40}
            weight={600}
            tracking={90}
            fill="$brand.muted"
            align="left"
            maxWidth="100%"
            font="$type.body"
            enter={{ from: "w", distance: 50, ease: "expo.out", duration: 0.45 }}
          />
          <Counter
            id="stat-count"
            at={[0, 560]}
            from={0}
            to={12}
            suffix=" min"
            over={1.1}
            delay="0.3s"
            size={230}
            weight={700}
            align="left"
            maxWidth="100%"
            fill="$brand.fg"
            font="$type.numerals"
          >
            <RGBSplit id="stat-rgb" start="1.4s" duration="0.5s" amount={14} decay={5} sound="" />
          </Counter>
          <Card
            id="stat-card"
            at={[0, 1010]}
            width={920}
            height={170}
            fill="$brand.surface"
            radius={36}
            stroke={{ width: 2, color: "rgba(255,255,255,0.08)" }}
            enter={{ from: "s", distance: 90, ease: "expo.out", duration: 0.55, delay: 1.5 }}
          >
            <Text
              id="stat-card-text"
              text="Down from 14 hours."
              size={52}
              weight={600}
              fill="$brand.fg"
              align="left"
              maxWidth="100%"
              font="$type.body"
            />
          </Card>
        </SafeArea>
      </Scene>
    </Track>
    <Vignette id="kinetic-vignette" amount={0.4} />
    <Grain id="kinetic-grain" amount={0.1} />
  </Composition>
);
