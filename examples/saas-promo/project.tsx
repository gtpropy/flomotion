import {
  Composition,
  Track,
  Scene,
  Marker,
  SafeArea,
  Stagger,
  Rect,
  Circle,
  Title,
  Text,
  SplitText,
  Counter,
  Chip,
  Card,
  GlassCard,
  UIMock,
  Cursor,
  ProgressRing,
  Chart,
  CodeBlock,
  Captions,
  Shake,
  PunchZoom,
  Glitch,
  Slam,
  Pulse,
  Vignette,
  Grain,
  ColorGrade,
  RGBSplit,
  Sound,
  Voiceover,
  Audio,
} from "@flomotion/components";

const SFX = (n: string) => `./assets/sfx/${n}.wav`;

/** 30 s, 9:16 SaaS promo in six beats: hook, problem, reveal, features, proof, CTA. */
export default (
  <Composition
    id="promo"
    size={[1080, 1920]}
    fps={30}
    duration="30s"
    theme="$look.kinetic"
    background="$brand.bg"
  >
    <Track id="v1" kind="video">
      {/* 1. HOOK */}
      <Scene
        id="hook"
        start="0s"
        duration="3s"
        scale={[
          [0, 1],
          [3, 1.08],
        ]}
      >
        <Rect
          id="hook-bg"
          width={1080}
          height={1920}
          fill={{
            type: "linear",
            angle: 160,
            stops: [
              [0, "#1a0b2e"],
              [1, "#0b0b12"],
            ],
          }}
        />
        <Circle
          id="hook-glow"
          width={900}
          fill={{
            type: "radial",
            stops: [
              [0, "rgba(255,51,102,0.55)"],
              [1, "rgba(255,51,102,0)"],
            ],
          }}
          position={[0, -120]}
          scale={[
            [0, 0.6],
            [1.2, 1.1, "expo.out"],
          ]}
        >
          <Pulse id="hook-pulse" start="1s" count={3} amp={0.05} freq={2} sound="" />
        </Circle>
        <SafeArea id="hook-safe" preset="reels">
          <Title
            id="t1"
            text="Ship videos as code"
            at="center"
            size={118}
            maxWidth="92%"
            enter={{ from: "sw", distance: 120, ease: "expo.out", duration: 0.6 }}
          >
            <Shake id="t1-shake" amp={10} freq={14} decay={5} start="0.6s" sound="" />
          </Title>
        </SafeArea>
        <Sound id="s-land" src={SFX("land")} at="0.6s" peak="land" gain={-4} tag="hit/land" />
        <Sound id="s-whip" src={SFX("whoosh")} at="0.5s" peak="whip" gain={-12} tag="move/whip" />
      </Scene>

      {/* 2. PROBLEM */}
      <Scene
        id="problem"
        start="3s"
        duration="5s"
        transition={{ type: "dipToColor", duration: 0.35, color: "$brand.bg" }}
      >
        <Rect id="problem-bg" width={1080} height={1920} fill="#0b0b12" />
        <SafeArea id="problem-safe" preset="reels">
          <SplitText
            id="p-title"
            text="Editing takes forever."
            at={[0, 360]}
            size={104}
            preset="rise"
            stagger={0.09}
            start="0.1s"
            maxWidth="100%"
            align="left"
            font="$type.display"
          />
          <Counter
            id="p-count"
            at={[0, 760]}
            from={0}
            to={14}
            suffix=" h"
            over={1.6}
            delay="0.7s"
            size={260}
            align="left"
            fill="$brand.primary"
            font="$type.numerals"
            weight={700}
          >
            <Glitch id="p-glitch" start="2.4s" duration="0.45s" amount={1.2} sound="" />
            <RGBSplit id="p-rgb" start="2.4s" duration="0.5s" amount={16} decay={5} sound="" />
          </Counter>
          <Text
            id="p-sub"
            at={[0, 1050]}
            text="per video, every single time"
            size={52}
            fill="$brand.muted"
            align="left"
            maxWidth="100%"
            font="$type.body"
            enter={{ from: "s", distance: 40, duration: 0.5, delay: 1.2 }}
          />
        </SafeArea>
        <Sound
          id="s-glitch"
          src={SFX("glitch")}
          at="2.4s"
          peak="glitch"
          gain={-8}
          tag="tech/glitch"
        />
        <Sound id="s-tick" src={SFX("pop")} at="0.8s" peak="pop" gain={-10} tag="ui/pop" />
      </Scene>

      {/* 3. REVEAL */}
      <Scene
        id="reveal"
        start="8s"
        duration="5s"
        transition={{ type: "flash", duration: 0.3 }}
        scale={[
          [0, 1],
          [5, 1.05],
        ]}
      >
        <Rect
          id="reveal-bg"
          width={1080}
          height={1920}
          fill={{
            type: "linear",
            angle: 180,
            stops: [
              [0, "#14142a"],
              [1, "#0b0b12"],
            ],
          }}
        />
        <SafeArea id="reveal-safe" preset="reels">
          <Title
            id="r-title"
            text="Meet flomotion"
            at="top"
            size={92}
            start="0.2s"
            enter={{ from: "n", distance: 80, duration: 0.6 }}
          />
        </SafeArea>
        <UIMock
          id="r-phone"
          at={[180, 380]}
          device="phone"
          width={720}
          height={1040}
          enter={{ from: "s", distance: 500, ease: "expo.out", duration: 0.9, delay: 0.15 }}
        >
          <Rect id="r-screen" width={676} height={996} fill="#f4f5fb" at="top-left" />
          <Text
            id="r-app"
            text="Pulse"
            at={[40, 90]}
            size={56}
            weight={700}
            fill="#14142a"
            font="$type.display"
            maxWidth={500}
            align="left"
          />
          <Chip
            id="r-chip"
            at={[430, 96]}
            label="Live"
            dot="#35d0a5"
            fill="#e6f8f1"
            textColor="#14142a"
            size={30}
          />
          <Card
            id="r-card"
            at={[40, 220]}
            width={596}
            height={380}
            fill="#ffffff"
            padding={28}
            stroke={{ width: 2, color: "#e3e5f2" }}
          >
            <Chart
              id="r-chart"
              type="bar"
              width={540}
              height={320}
              progress={[
                [0.9, 0],
                [2.4, 1, "expo.out"],
              ]}
              data={[
                { label: "Mon", value: 12 },
                { label: "Tue", value: 20 },
                { label: "Wed", value: 15 },
                { label: "Thu", value: 31 },
                { label: "Fri", value: 26 },
              ]}
              labelColor="#667"
            />
          </Card>
          <ProgressRing
            id="r-ring"
            at={[173, 640]}
            size={330}
            thickness={36}
            value={[
              [1.2, 0],
              [3, 0.82, "expo.out"],
            ]}
            color="#5b6bff"
            track="#e8eafc"
            labelColor="#14142a"
            labelSize={78}
          />
          <Cursor
            id="r-cursor"
            at={[40, 120]}
            position={[
              [1.0, [500, 900]],
              [2.4, [330, 790], "expo.inOut"],
            ]}
            clicks={["2.5s"]}
            size={64}
          />
        </UIMock>
        <PunchZoom id="r-punch" start="0.15s" amount={0.06} sound="" />
        <Sound id="s-flash" src={SFX("whoosh")} at="0s" peak="whip" gain={-10} tag="move/whip" />
        <Sound id="s-land2" src={SFX("land")} at="1s" peak="land" gain={-8} tag="hit/land" />
        <Sound id="s-click" src={SFX("click")} at="2.5s" peak="tap" gain={-6} tag="ui/tap" />
      </Scene>

      {/* 4. FEATURES */}
      <Scene
        id="features"
        start="13s"
        duration="8s"
        transition={{ type: "wipe", direction: "e", duration: 0.45 }}
      >
        <Rect id="feat-bg" width={1080} height={1920} fill="#0b0b12" />
        <SafeArea id="feat-safe" preset="reels">
          <Text
            id="f-head"
            text="Every control is a prop"
            at={[0, 120]}
            size={84}
            weight={700}
            align="left"
            maxWidth="100%"
            font="$type.display"
            enter={{ from: "w", distance: 80, duration: 0.55 }}
          />
          <Stagger id="f-stack" each={0.35} from="start">
            <GlassCard
              id="f1"
              at={[0, 330]}
              width={900}
              height={190}
              padding={32}
              layout="absolute"
              enter={{ from: "e", distance: 160, duration: 0.55 }}
            >
              <Text
                id="f1t"
                text="Typed, schema-first components"
                at={[8, 56]}
                size={50}
                weight={600}
                maxWidth="88%"
                align="left"
                font="$type.body"
              />
            </GlassCard>
            <GlassCard
              id="f2"
              at={[0, 550]}
              width={900}
              height={190}
              padding={32}
              layout="absolute"
              enter={{ from: "e", distance: 160, duration: 0.55 }}
            >
              <Text
                id="f2t"
                text="Impacts with sound on the frame"
                at={[8, 56]}
                size={50}
                weight={600}
                maxWidth="88%"
                align="left"
                font="$type.body"
              />
            </GlassCard>
            <GlassCard
              id="f3"
              at={[0, 770]}
              width={900}
              height={190}
              padding={32}
              layout="absolute"
              enter={{ from: "e", distance: 160, duration: 0.55 }}
            >
              <Text
                id="f3t"
                text="Voice-timed captions"
                at={[8, 56]}
                size={50}
                weight={600}
                maxWidth="88%"
                align="left"
                font="$type.body"
              />
            </GlassCard>
          </Stagger>
          <CodeBlock
            id="f-code"
            at={[0, 1010]}
            width={900}
            size={32}
            padding={30}
            code={'<Title text="Ship it" />\n<Shake amp={8} start="0.6s" />\nrender(video);'}
            reveal={[
              [2.2, 0],
              [4.4, 1, "linear"],
            ]}
            start="2s"
          />
        </SafeArea>
        <Sound id="s-f1" src={SFX("pop")} at="0.35s" peak="pop" gain={-10} tag="ui/pop" />
        <Sound id="s-f2" src={SFX("pop")} at="0.7s" peak="pop" gain={-10} tag="ui/pop" />
        <Sound id="s-f3" src={SFX("pop")} at="1.05s" peak="pop" gain={-10} tag="ui/pop" />
      </Scene>

      {/* 5. PROOF */}
      <Scene id="proof" start="21s" duration="5s" transition={{ type: "dissolve", duration: 0.5 }}>
        <Rect
          id="proof-bg"
          width={1080}
          height={1920}
          fill={{
            type: "linear",
            angle: 200,
            stops: [
              [0, "#0b0b12"],
              [1, "#1a0b2e"],
            ],
          }}
        />
        <SafeArea id="proof-safe" preset="reels">
          <Counter
            id="pr-count"
            at="center"
            position={[0, -320]}
            from={0}
            to={12840}
            over={2.2}
            delay="0.3s"
            size={200}
            font="$type.numerals"
            weight={700}
            fill="$brand.accent"
          />
          <Text
            id="pr-sub"
            text="videos shipped"
            at="center"
            position={[0, -140]}
            size={60}
            fill="$brand.muted"
            font="$type.body"
          />
          <ProgressRing
            id="pr-ring"
            at="center"
            position={[0, 200]}
            size={440}
            thickness={44}
            value={[
              [0.8, 0],
              [3, 0.98, "expo.out"],
            ]}
            color={{
              type: "linear",
              stops: [
                [0, "#ff3366"],
                [1, "#ffe14d"],
              ],
            }}
            labelSize={110}
          />
          <Text
            id="pr-ring-l"
            text="rendered first try"
            at="center"
            position={[0, 470]}
            size={48}
            fill="$brand.muted"
            font="$type.body"
          />
        </SafeArea>
        <Sound id="s-chime" src={SFX("chime")} at="2.5s" peak="ding" gain={-8} tag="tech/success" />
      </Scene>

      {/* 6. CTA */}
      <Scene
        id="cta"
        start="26s"
        duration="4s"
        transition={{ type: "dipToColor", duration: 0.4, color: "#000000" }}
      >
        <Rect
          id="cta-bg"
          width={1080}
          height={1920}
          fill={{
            type: "radial",
            center: [50, 45],
            stops: [
              [0, "#3a1250"],
              [1, "#0b0b12"],
            ],
          }}
        />
        <SafeArea id="cta-safe" preset="reels">
          <Title
            id="cta-t"
            text="Start free today"
            at="center"
            position={[0, -60]}
            size={120}
            maxWidth="92%"
          >
            <Slam id="cta-slam" start="0.35s" distance={900} fall={0.22} sound="" />
          </Title>
          <Chip
            id="cta-chip"
            at="center"
            position={[0, 250]}
            label="flomotion.dev"
            fill="$brand.primary"
            textColor="#ffffff"
            size={52}
            paddingX={44}
            paddingY={22}
            enter={{ from: "s", distance: 60, duration: 0.5, delay: 0.9 }}
          />
        </SafeArea>
        <Sound id="s-slam" src={SFX("land")} at="0.57s" peak="land" gain={-2} tag="hit/boom" />
      </Scene>
    </Track>

    <Track id="v2" kind="captions">
      <Scene id="caps" start="0s" duration="30s">
        <SafeArea id="caps-safe" preset="reels">
          <Captions
            id="captions"
            voice="#vo"
            captionStyle="karaoke"
            at="bottom"
            size={58}
            maxChars={20}
            maxWords={4}
            activeColor="$brand.accent"
            font="$type.display"
            stroke={{ width: 3, color: "#000000", align: "outside" }}
          />
        </SafeArea>
      </Scene>
    </Track>

    <Voiceover id="vo" src="./assets/voice.wav" at="0.3s" gain={0} script="Ship videos as code…" />
    <Audio
      id="music"
      src="./assets/music.wav"
      gain={-16}
      bus="music"
      start="0s"
      duration="30s"
      fadeIn={1.5}
      fadeOut={2.5}
    />
    <ColorGrade id="grade" scope="composition" contrast={0.1} temperature={-6} saturation={0.1} />
    <Vignette id="vig" amount={0.35} />
    <Grain id="grain" amount={0.08} seed={7} />
    <Marker id="m-reveal" at="8s" label="Product reveal" />
    <Marker id="m-cta" at="26s" label="CTA" />
  </Composition>
);
