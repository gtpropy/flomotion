import {
  Composition,
  Track,
  Scene,
  SafeArea,
  Rect,
  Text,
  SplitText,
  Card,
  Chip,
  ProgressRing,
  DropShadow,
} from "@flomotion/components";

/**
 * Reference scene for the Minimal Look: calm, precise, lots of air.
 * Two beats joined by a slow dissolve. Quiet type, one accent colour, a soft shadow, slow eases,
 * no impact effects and no grain. Motion is small and settles gently (power3.out, sine.inOut).
 * No sounds are placed here: pick `ui/pop` and `ui/tick` sounds with sound_search.
 */
export default (
  <Composition
    id="minimal-reference"
    size={[1080, 1920]}
    fps={30}
    duration="6s"
    theme="$look.minimal"
    background="$brand.bg"
  >
    <Track id="v1" kind="video">
      <Scene
        id="intro"
        start="0s"
        duration="3.2s"
        scale={[
          [0, 1],
          [3.2, 1.03],
        ]}
      >
        <Rect id="intro-bg" width={1080} height={1920} fill="$brand.bg" />
        <SafeArea id="intro-safe" preset="reels">
          <Text
            id="intro-eyebrow"
            at={[0, 520]}
            text="INTRODUCING"
            size={34}
            weight={500}
            tracking={120}
            fill="$brand.primary"
            align="left"
            maxWidth="100%"
            font="$type.body"
            enter={{ from: "s", distance: 24, ease: "power3.out", duration: 0.7, delay: 0.1 }}
          />
          <SplitText
            id="intro-title"
            text="Video, with the clutter removed."
            at={[0, 620]}
            size={116}
            weight={600}
            leading={1.04}
            tracking={-25}
            preset="mask-reveal"
            stagger={0.12}
            start="0.25s"
            align="left"
            maxWidth="100%"
            fill="$brand.fg"
            font="$type.display"
          />
          <Rect
            id="intro-rule"
            at={[0, 1150]}
            width={120}
            height={4}
            radius={2}
            fill="$brand.primary"
            anchor={[0, 50]}
            scale={[
              [1.2, [0, 1]],
              [2, [1, 1], "power3.out"],
            ]}
          />
          <Text
            id="intro-sub"
            at={[0, 1210]}
            text="Compose scenes, not timelines."
            size={44}
            fill="$brand.muted"
            align="left"
            maxWidth="86%"
            font="$type.body"
            enter={{ from: "s", distance: 20, ease: "power3.out", duration: 0.8, delay: 1.3 }}
          />
        </SafeArea>
      </Scene>

      <Scene
        id="detail"
        start="3.2s"
        duration="2.8s"
        transition={{ type: "dissolve", duration: 0.6, ease: "sine.inOut" }}
      >
        <Rect id="detail-bg" width={1080} height={1920} fill="$brand.bg" />
        <SafeArea id="detail-safe" preset="reels">
          <Card
            id="detail-card"
            at={[0, 460]}
            width={920}
            height={420}
            fill="$brand.surface"
            radius={44}
            padding={56}
            enter={{ from: "s", distance: 40, ease: "power3.out", duration: 0.9, delay: 0.1 }}
          >
            <DropShadow id="detail-shadow" blur={60} y={24} color="rgba(20,20,26,0.10)" />
            <Chip
              id="detail-chip"
              label="On track"
              dot="$brand.primary"
              fill="$brand.bg"
              textColor="$brand.fg"
              size={32}
            />
            <Text
              id="detail-head"
              text="Quarterly goal"
              size={60}
              weight={600}
              fill="$brand.fg"
              align="left"
              maxWidth="100%"
              font="$type.display"
            />
            <Text
              id="detail-body"
              text="Eighty-two percent of the way there."
              size={40}
              fill="$brand.muted"
              align="left"
              maxWidth="100%"
              font="$type.body"
            />
          </Card>
          <ProgressRing
            id="detail-ring"
            at={[300, 980]}
            size={300}
            thickness={22}
            value={[
              [0.5, 0],
              [2.2, 0.82, "power3.out"],
            ]}
            color="$brand.primary"
            track="rgba(20,20,26,0.08)"
            labelColor="$brand.fg"
            labelSize={72}
          />
        </SafeArea>
      </Scene>
    </Track>
  </Composition>
);
