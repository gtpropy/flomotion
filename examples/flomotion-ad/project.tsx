import {
  Composition,
  Track,
  Scene,
  Marker,
  SafeArea,
  Rect,
  RoundRect,
  Circle,
  Title,
  Text,
  Span,
  Highlight,
  Counter,
  Chip,
  Card,
  UIMock,
  Image,
  CodeBlock,
  Mask,
  Shake,
  Thud,
  PunchZoom,
  Glitch,
  RGBSplit,
  Pulse,
  Grain,
  Sound,
  Voiceover,
  Audio,
  Captions,
} from "@flomotion/components";

const POP = "back.out(1.6)";

/**
 * flomotion, 30 s, 9:16, 128 bpm: one beat = 0.46875 s, 64 beats = 30 s.
 * Beats per scene: hook 7, pain 8 (four words, 2 beats each), turn 4, promise 6, product 7, props 7, checks 6,
 * licences 7, proof 6, cta 6. Every cut is on a beat and has its own transition; words land on the voice's own
 * word times. The turn is two big dots that converge into one small dot, split in two, and grow into the next
 * slide; the vault door that opens there (and closes over the ledger later) is built from circles.
 */
export default (
  <Composition
    id="flomotion-ad"
    size={[1080, 1920]}
    fps={30}
    duration="30s"
    theme="$look.bold-kinetic"
    background="$brand.bg"
  >
    <Track id="v1" kind="video">
      {/* 1. HOOK 0 - 3.28 s */}
      <Scene
        id="hook"
        start="0s"
        duration="3.28125s"
        scale={[
          [0, 1.06],
          [0.35, 1, "expo.out"],
        ]}
      >
        <Rect id="hook-bg" width={1080} height={1920} fill="$brand.block4" />
        <Circle
          id="hook-blob"
          at={[400, 1000]}
          width={760}
          fill="$brand.accent"
          scale={[
            [0.2, 0],
            [0.9, 1, POP],
          ]}
        />
        <SafeArea id="hook-safe" preset="reels">
          <Title
            id="hook-1"
            at={[0, 40]}
            text="Stop editing."
            size={176}
            align="left"
            maxWidth="100%"
            fill="$brand.text"
            font="$type.display"
            strike={{
              thickness: 18,
              color: "$brand.accent",
              progress: [
                [0.8, 0],
                [1.1, 1, "expo.out"],
              ],
            }}
            enter={{ from: "s", distance: 260, ease: POP, duration: 0.5, delay: 0.05 }}
          />
          <Text
            id="hook-2"
            at={[0, 450]}
            align="left"
            maxWidth="100%"
            size={164}
            weight={800}
            font="$type.display"
            fill="$brand.text"
            enter={{ from: "e", distance: 500, ease: "back.out(1.4)", duration: 0.45, delay: 1.6 }}
          >
            <Span id="hook-2a">Start </Span>
            <Highlight
              id="hook-2b"
              color="$brand.accent"
              padding={10}
              radius={14}
              progress={[
                [2.0, 0],
                [2.3, 1, "expo.out"],
              ]}
            >
              describing.
            </Highlight>
          </Text>
          <CodeBlock
            id="hook-prompt"
            at={[0, 880]}
            width={952}
            size={44}
            padding={44}
            theme="light"
            code="> a 30 s ad for flomotion"
            reveal={[
              [2.3, 0],
              [3.05, 1, "none"],
            ]}
            enter={{ from: "s", distance: 220, ease: POP, duration: 0.45, delay: 2.15 }}
          />
        </SafeArea>
        <Sound
          id="s-hook-whip"
          src="freesound:460469"
          at="1.6s"
          peak="whip"
          gain={-14}
          tag="move/whip"
        />
        <Sound id="s-hook-hit" src="local:hit" at="1.7s" peak="boom" gain={-6} tag="hit/boom" />
        <Sound id="s-hook-t1" src="local:type" at="2.4s" peak="type" gain={-10} tag="ui/type" />
        <Sound id="s-hook-t2" src="local:type" at="2.55s" peak="type" gain={-11} tag="ui/type" />
        <Sound id="s-hook-t3" src="local:type" at="2.7s" peak="type" gain={-10} tag="ui/type" />
        <Sound id="s-hook-t4" src="local:type" at="2.85s" peak="type" gain={-11} tag="ui/type" />
      </Scene>

      {/* 2. PAIN 3.28 - 7.03 s: four hard-cut words, 2 beats each */}
      <Scene
        id="pain-1"
        start="3.28125s"
        duration="0.9375s"
        scale={[
          [0, 1.08],
          [0.3, 1, "expo.out"],
        ]}
      >
        <Rect id="p1-bg" width={1080} height={1920} fill="$brand.block3" />
        <SafeArea id="p1-safe" preset="reels">
          <Title
            id="p1-word"
            at={[0, 300]}
            text="Timelines."
            size={172}
            align="left"
            maxWidth="100%"
            fill="$brand.text"
            font="$type.display"
            enter={{ from: "w", distance: 700, ease: "expo.out", duration: 0.35 }}
          />
          <RoundRect
            id="p1-a"
            at={[0, 760]}
            width={640}
            height={96}
            radius={26}
            fill="$brand.text"
            anchor={[0, 50]}
            scale={[
              [0.1, [0, 1]],
              [0.5, [1, 1], "expo.out"],
            ]}
          />
          <RoundRect
            id="p1-b"
            at={[200, 890]}
            width={752}
            height={96}
            radius={26}
            fill="$brand.surface"
            anchor={[0, 50]}
            scale={[
              [0.2, [0, 1]],
              [0.6, [1, 1], "expo.out"],
            ]}
          />
          <RoundRect
            id="p1-c"
            at={[60, 1020]}
            width={420}
            height={96}
            radius={26}
            fill="$brand.accent"
            anchor={[0, 50]}
            scale={[
              [0.3, [0, 1]],
              [0.7, [1, 1], "expo.out"],
            ]}
          />
        </SafeArea>
      </Scene>
      <Scene
        id="pain-2"
        start="4.21875s"
        duration="0.9375s"
        scale={[
          [0, 1.08],
          [0.3, 1, "expo.out"],
        ]}
      >
        <Rect id="p2-bg" width={1080} height={1920} fill="$brand.block2" />
        <SafeArea id="p2-safe" preset="reels">
          <Title
            id="p2-word"
            at={[0, 300]}
            text="Dragging."
            size={172}
            align="left"
            maxWidth="100%"
            fill="$brand.text"
            font="$type.display"
            enter={{ from: "e", distance: 700, ease: "expo.out", duration: 0.35 }}
          />
          <RoundRect
            id="p2-a"
            at={[0, 780]}
            width={560}
            height={110}
            radius={28}
            fill="$brand.text"
            position={[
              [0.1, [0, 0]],
              [0.75, [380, 0], "power3.inOut"],
            ]}
          />
          <RoundRect
            id="p2-b"
            at={[0, 930]}
            width={420}
            height={110}
            radius={28}
            fill="$brand.surface"
          />
        </SafeArea>
      </Scene>
      <Scene
        id="pain-3"
        start="5.15625s"
        duration="0.9375s"
        scale={[
          [0, 1.08],
          [0.3, 1, "expo.out"],
        ]}
      >
        <Rect id="p3-bg" width={1080} height={1920} fill="$brand.block5" />
        <SafeArea id="p3-safe" preset="reels">
          <Title
            id="p3-word"
            at={[0, 300]}
            text="Exporting."
            size={172}
            align="left"
            maxWidth="100%"
            fill="$brand.text"
            font="$type.display"
            enter={{ from: "w", distance: 700, ease: "expo.out", duration: 0.35 }}
          />
          <RoundRect
            id="p3-track"
            at={[0, 800]}
            width={952}
            height={48}
            radius={24}
            fill="$brand.surface"
            opacity={0.4}
          />
          <RoundRect
            id="p3-bar"
            at={[0, 800]}
            anchor={[0, 50]}
            width={952}
            height={48}
            radius={24}
            fill="$brand.signal"
            scale={[
              [0.1, [0, 1]],
              [0.85, [0.94, 1], "power2.inOut"],
            ]}
          />
        </SafeArea>
        <Sound id="s-p3-tick" src="local:tick" at="0.7s" peak="tick" gain={-9} tag="ui/tick" />
      </Scene>
      <Scene
        id="pain-4"
        start="6.09375s"
        duration="0.9375s"
        scale={[
          [0, 1.1],
          [0.3, 1, "expo.out"],
        ]}
      >
        <Rect id="p4-bg" width={1080} height={1920} fill="$brand.negative" />
        <SafeArea id="p4-safe" preset="reels">
          <Title
            id="p4-word"
            at={[0, 260]}
            text="Again."
            size={270}
            align="left"
            maxWidth="100%"
            fill="$brand.text"
            font="$type.display"
            enter={{ from: "s", distance: 400, ease: "expo.out", duration: 0.3 }}
          >
            <Glitch id="p4-glitch" start="0.05s" duration="0.55s" />
            <RGBSplit id="p4-rgb" start="0.05s" duration="0.6s" />
            <Shake id="p4-shake" amp={14} freq={18} decay={7} start="0.05s" sound="" />
          </Title>
          <RoundRect
            id="p4-bar"
            at={[0, 800]}
            anchor={[0, 50]}
            width={952}
            height={48}
            radius={24}
            fill="$brand.surface"
            opacity={0.5}
            scale={[
              [0.05, [0.94, 1]],
              [0.4, [0, 1], "expo.in"],
            ]}
          />
        </SafeArea>
      </Scene>

      {/* 3. TURN 7.03 - 8.91 s: two big dots converge into one small dot, split in two, and grow into the next slide */}
      <Scene id="turn" start="7.03125s" duration="1.875s">
        <Rect id="turn-bg" width={1080} height={1920} fill="$brand.text" />
        <Circle
          id="turn-a"
          at={[-170, 650]}
          width={620}
          fill="$brand.accent"
          position={[
            [0, [0, 0]],
            [0.8, [400, 0], "power3.inOut"],
          ]}
          scale={[
            [0, 1],
            [0.8, 0.16, "power3.inOut"],
            [0.86, 0],
          ]}
        />
        <Circle
          id="turn-b"
          at={[630, 650]}
          width={620}
          fill="$brand.signal"
          position={[
            [0, [0, 0]],
            [0.8, [-400, 0], "power3.inOut"],
          ]}
          scale={[
            [0, 1],
            [0.8, 0.16, "power3.inOut"],
            [0.86, 0],
          ]}
        />
        <Circle
          id="turn-core"
          at={[490, 910]}
          width={100}
          fill="$brand.text"
          stroke={{ width: 8, color: "$brand.surface" }}
          scale={[
            [0.78, 0],
            [0.9, 1.2, POP],
            [0.98, 1],
            [1.0, 1],
            [1.05, 0],
          ]}
        />
        <Circle
          id="turn-c"
          at={[490, 910]}
          width={100}
          fill="$brand.accent"
          position={[
            [1.0, [0, 0]],
            [1.3, [-170, 0], "back.out(1.8)"],
          ]}
          scale={[
            [1.0, 0],
            [1.06, 1],
            [1.3, 1],
            [1.875, 28, "power3.in"],
          ]}
        />
        <Circle
          id="turn-d"
          at={[490, 910]}
          width={100}
          fill="$brand.accent"
          position={[
            [1.0, [0, 0]],
            [1.3, [170, 0], "back.out(1.8)"],
          ]}
          scale={[
            [1.0, 0],
            [1.06, 1],
            [1.3, 1],
            [1.875, 28, "power3.in"],
          ]}
        />
        <Sound id="s-turn-merge" src="local:hit" at="0.85s" peak="boom" gain={-8} tag="hit/boom" />
        <Sound id="s-turn-split" src="local:pop" at="1.02s" peak="pop" gain={-6} tag="ui/pop" />
      </Scene>

      {/* 4. PROMISE 8.91 - 11.72 s: a vault door (match cut on the circle) opens onto the name */}
      <Scene id="promise" start="8.90625s" duration="2.8125s">
        <Rect id="promise-bg" width={1080} height={1920} fill="$brand.accent" />
        <Rect
          id="promise-white"
          width={1080}
          height={1920}
          fill="$brand.surface"
          opacity={[
            [1.0, 0],
            [1.5, 1],
          ]}
        />
        <Circle
          id="promise-disc"
          at={[260, 680]}
          width={560}
          fill="$brand.signal"
          scale={[
            [0.9, 0.2],
            [1.5, 1, POP],
          ]}
        />
        <SafeArea id="promise-safe" preset="reels">
          <Text
            id="promise-meet"
            at={[0, 0]}
            text="Meet"
            size={120}
            weight={800}
            fill="$brand.text"
            align="left"
            maxWidth="100%"
            font="$type.display"
            enter={{ from: "w", distance: 400, ease: "back.out(1.4)", duration: 0.4 }}
          />
          <Title
            id="promise-name"
            at={[0, 150]}
            text="flomotion"
            size={176}
            align="left"
            maxWidth="100%"
            fill="$brand.text"
            font="$type.display"
            enter={{ from: "s", distance: 500, ease: POP, duration: 0.5, delay: 0.2 }}
          >
            <PunchZoom id="promise-punch" start="0.25s" amount={0.06} sound="" />
          </Title>
          <Card
            id="door-open"
            at={[136, 370]}
            layout="absolute"
            width={680}
            height={680}
            padding={0}
            radius={0}
            fill="rgba(0,0,0,0)"
            shadow={false}
            scale={[
              [0, 0.3],
              [0.45, 1, "back.out(1.4)"],
              [1.0, 1],
              [1.6, 0.001, "power3.in"],
            ]}
            rotation={[
              [1.0, 0],
              [1.6, -70, "power3.in"],
            ]}
          >
            <Circle
              id="door-open-body"
              at={[0, 0]}
              width={680}
              fill="$brand.accent"
              stroke={{ width: 12, color: "$brand.text" }}
            />
            <Circle
              id="door-open-ring"
              at={[75, 75]}
              width={530}
              fill="rgba(0,0,0,0)"
              stroke={{ width: 8, color: "$brand.text" }}
            />
            <Circle
              id="door-open-plate"
              at={[170, 170]}
              width={340}
              fill="$brand.signal"
              stroke={{ width: 8, color: "$brand.text" }}
            />
            <Circle id="door-open-bolt0" at={[622, 323]} width={34} fill="$brand.text" />
            <Circle id="door-open-bolt1" at={[535, 535]} width={34} fill="$brand.text" />
            <Circle id="door-open-bolt2" at={[323, 622]} width={34} fill="$brand.text" />
            <Circle id="door-open-bolt3" at={[111, 535]} width={34} fill="$brand.text" />
            <Circle id="door-open-bolt4" at={[24, 323]} width={34} fill="$brand.text" />
            <Circle id="door-open-bolt5" at={[111, 111]} width={34} fill="$brand.text" />
            <Circle id="door-open-bolt6" at={[323, 24]} width={34} fill="$brand.text" />
            <Circle id="door-open-bolt7" at={[535, 111]} width={34} fill="$brand.text" />
            <Card
              id="door-open-spokes"
              at={[170, 170]}
              layout="absolute"
              width={340}
              height={340}
              padding={0}
              radius={0}
              fill="rgba(0,0,0,0)"
              shadow={false}
              rotation={[
                [0.25, 0],
                [0.95, 120, "power3.inOut"],
              ]}
            >
              <RoundRect
                id="door-open-spoke-h"
                at={[14, 144]}
                width={313}
                height={51}
                radius={26}
                fill="$brand.text"
              />
              <RoundRect
                id="door-open-spoke-v"
                at={[144, 14]}
                width={51}
                height={313}
                radius={26}
                fill="$brand.text"
              />
              <Circle
                id="door-open-hub"
                at={[122, 122]}
                width={95}
                fill="$brand.surface"
                stroke={{ width: 8, color: "$brand.text" }}
              />
            </Card>
          </Card>
          <Chip
            id="promise-file"
            at={[160, 640]}
            label="One TSX file."
            fill="$brand.text"
            textColor="$brand.surface"
            font="$type.display"
            size={88}
            weight={800}
            paddingX={46}
            paddingY={28}
            rotation={-3}
            enter={{ from: "e", distance: 800, ease: POP, duration: 0.45, delay: 1.2 }}
          />
        </SafeArea>
        <Sound id="s-prom-land" src="local:hit" at="0.4s" peak="boom" gain={-7} tag="hit/boom" />
        <Sound id="s-prom-unlock" src="local:tick" at="0.95s" peak="tick" gain={-6} tag="ui/tick" />
        <Sound
          id="s-prom-open"
          src="freesound:460469"
          at="1.35s"
          peak="whip"
          gain={-11}
          tag="move/whip"
        />
        <Sound id="s-prom-pop" src="local:pop" at="1.45s" peak="pop" gain={-8} tag="ui/pop" />
      </Scene>

      {/* 5. PRODUCT 11.72 - 15.0 s: the real live view */}
      <Scene
        id="product"
        start="11.71875s"
        duration="3.28125s"
        scale={[
          [0, 1.06],
          [0.35, 1, "expo.out"],
        ]}
      >
        <Rect id="product-bg" width={1080} height={1920} fill="$brand.block5" />
        <SafeArea id="product-safe" preset="reels">
          <Title
            id="product-1"
            at={[0, 0]}
            text="Claude builds."
            size={128}
            align="left"
            maxWidth="100%"
            fill="$brand.text"
            font="$type.display"
            enter={{ from: "s", distance: 200, ease: POP, duration: 0.45, delay: 0.02 }}
          />
          <Title
            id="product-2"
            at={[0, 140]}
            text="You watch."
            size={128}
            align="left"
            maxWidth="100%"
            fill="$brand.text"
            font="$type.display"
            enter={{ from: "s", distance: 200, ease: POP, duration: 0.45, delay: 1.4 }}
          />
          <UIMock
            id="product-browser"
            at={[0, 340]}
            device="browser"
            url="localhost:4399"
            width={952}
            height={690}
            rotation={-2}
            screenColor="$brand.surface"
            enter={{ from: "s", distance: 900, ease: "back.out(1.3)", duration: 0.7, delay: 0.15 }}
          >
            <Image
              id="product-shot"
              src="./assets/captures/live-full.png"
              alt="flomotion live view: progress, Claude's activity, the preview and the outline"
              fit="cover"
            />
          </UIMock>
          <Card
            id="product-inset"
            at={[150, 560]}
            layout="absolute"
            width={780}
            height={520}
            padding={0}
            radius={28}
            rotation={2}
            fill="$brand.surface"
            stroke={{ width: 6, color: "$brand.text" }}
            enter={{ from: "s", distance: 600, ease: POP, duration: 0.6, delay: 1.5 }}
          >
            <Image
              id="product-feed"
              src="./assets/captures/live-activity-tall.png"
              alt="flomotion live view: Claude's activity feed, one tool call per row"
              at={[0, 0]}
              width={780}
              height={2340}
              fit="cover"
              position={[
                [2.0, [0, 0]],
                [3.2, [0, -420], "power1.inOut"],
              ]}
            />
            <Mask id="product-inset-mask" shape="roundrect" radius={0.05} />
          </Card>
          <Chip
            id="product-alive"
            at={[690, 262]}
            label="alive"
            dot="$brand.signal"
            fill="$brand.text"
            textColor="$brand.surface"
            size={44}
            enter={{ from: "s", distance: 60, ease: POP, duration: 0.4, delay: 2.05 }}
          >
            <Pulse
              id="product-alive-pulse"
              start="2.5s"
              amp={0.07}
              freq={2.133}
              count={0}
              sound=""
            />
          </Chip>
        </SafeArea>
        <Sound id="s-prod-hit" src="local:hit" at="1.41s" peak="boom" gain={-9} tag="hit/boom" />
        <Sound id="s-prod-pop1" src="local:pop" at="1.62s" peak="pop" gain={-9} tag="ui/pop" />
        <Sound
          id="s-prod-chime"
          src="local:chime"
          at="2.1s"
          peak="main"
          gain={-12}
          tag="tech/success"
        />
      </Scene>

      {/* 6a. FEATURE: every control is a typed prop 15.0 - 18.28 s */}
      <Scene
        id="feature-props"
        start="15s"
        duration="3.28125s"
        scale={[
          [0, 1.06],
          [0.35, 1, "expo.out"],
        ]}
      >
        <Rect id="fp-bg" width={1080} height={1920} fill="$brand.block2" />
        <SafeArea id="fp-safe" preset="reels">
          <Title
            id="fp-title"
            at={[0, 0]}
            text="Every control is a typed prop."
            size={108}
            align="left"
            maxWidth="100%"
            fill="$brand.text"
            font="$type.display"
            enter={{ from: "w", distance: 500, ease: POP, duration: 0.45, delay: 0.02 }}
          />
          <CodeBlock
            id="fp-code"
            at={[0, 290]}
            width={952}
            size={36}
            code={
              '<SplitText\n  id="hook-line1"\n  text="Describe the video."\n  size={140}\n  fill="$brand.text"\n/>'
            }
            reveal={[
              [0.25, 0],
              [1.0, 1, "power2.out"],
            ]}
            enter={{ from: "s", distance: 240, ease: POP, duration: 0.45, delay: 0.1 }}
          />
          <RoundRect
            id="fp-ring"
            at={[8, 486]}
            width={270}
            height={60}
            radius={14}
            fill="rgba(0,0,0,0)"
            stroke={{ width: 5, color: "$brand.signal" }}
            opacity={[
              [1.3, 0],
              [1.35, 1],
            ]}
            scale={[
              [1.3, 1.25],
              [1.6, 1, "expo.out"],
            ]}
          />
          <Card
            id="fp-preview"
            at={[0, 750]}
            layout="absolute"
            width={952}
            height={360}
            padding={0}
            radius={28}
            fill="$brand.surface"
            stroke={{ width: 6, color: "$brand.text" }}
            enter={{ from: "s", distance: 300, ease: POP, duration: 0.5, delay: 0.4 }}
          >
            <Text
              id="fp-preview-text"
              at={[40, 18]}
              text="Describe the video."
              size={[
                [0, 86],
                [1.4, 86],
                [1.75, 140, "back.out(1.8)"],
              ]}
              weight={800}
              fill="$brand.text"
              align="left"
              maxWidth={870}
              font="$type.display"
            />
          </Card>
          <Chip
            id="fp-chip"
            at={[470, 688]}
            label="element_set size 140"
            dot="$brand.signal"
            fill="$brand.text"
            textColor="$brand.surface"
            font="$type.mono"
            size={34}
            enter={{ from: "s", distance: 50, ease: POP, duration: 0.4, delay: 1.45 }}
          />
        </SafeArea>
        <Sound id="s-fp-t1" src="local:type" at="0.35s" peak="type" gain={-10} tag="ui/type" />
        <Sound id="s-fp-t2" src="local:type" at="0.55s" peak="type" gain={-11} tag="ui/type" />
        <Sound id="s-fp-t3" src="local:type" at="0.75s" peak="type" gain={-10} tag="ui/type" />
        <Sound id="s-fp-ring" src="local:tick" at="1.35s" peak="tick" gain={-8} tag="ui/tick" />
        <Sound id="s-fp-pop" src="local:pop" at="1.45s" peak="pop" gain={-7} tag="ui/pop" />
      </Scene>

      {/* 6b. FEATURE: 17 checks 18.28 - 21.09 s */}
      <Scene
        id="feature-checks"
        start="18.28125s"
        duration="2.8125s"
        scale={[
          [0, 1.06],
          [0.35, 1, "expo.out"],
        ]}
      >
        <Rect id="fc-bg" width={1080} height={1920} fill="$brand.block3" />
        <SafeArea id="fc-safe" preset="reels">
          <Counter
            id="fc-count"
            at={[0, 0]}
            from={0}
            to={17}
            over={0.9}
            delay="0.05s"
            size={330}
            align="left"
            maxWidth="100%"
            fill="$brand.text"
            font="$type.numerals"
          >
            <Thud id="fc-thud" amp={14} start="1.0s" sound="" />
          </Counter>
          <Text
            id="fc-label"
            at={[0, 350]}
            text="automatic checks"
            size={80}
            weight={800}
            fill="$brand.text"
            align="left"
            maxWidth="100%"
            font="$type.display"
            enter={{ from: "s", distance: 80, ease: POP, duration: 0.45, delay: 0.5 }}
          />
          <Card
            id="fc-clip"
            at={[76, 500]}
            layout="absolute"
            width={800}
            height={560}
            padding={0}
            radius={0}
            fill="rgba(0,0,0,0)"
            shadow={false}
            rotation={-1.5}
            enter={{ from: "s", distance: 500, ease: POP, duration: 0.55, delay: 0.3 }}
          >
            <Image
              id="fc-shot"
              src="./assets/captures/live-review-tall.png"
              alt="flomotion live view: the review panel listing 17 checks"
              at={[0, 0]}
              width={800}
              height={2994}
              fit="cover"
              position={[
                [0.6, [0, 0]],
                [2.5, [0, -2434], "power2.inOut"],
              ]}
            />
            <Mask id="fc-mask" shape="roundrect" radius={0.04} />
          </Card>
        </SafeArea>
        <Sound id="s-fc-t1" src="local:tick" at="0.25s" peak="tick" gain={-9} tag="ui/tick" />
        <Sound id="s-fc-t2" src="local:tick" at="0.5s" peak="tick" gain={-9} tag="ui/tick" />
        <Sound id="s-fc-t3" src="local:tick" at="0.75s" peak="tick" gain={-9} tag="ui/tick" />
        <Sound id="s-fc-t4" src="local:pop" at="1.0s" peak="pop" gain={-7} tag="ui/pop" />
      </Scene>

      {/* 6c. FEATURE: licensed, logged, locked 21.09 - 24.375 s: the vault door closes over the ledger */}
      <Scene
        id="feature-licences"
        start="21.09375s"
        duration="3.28125s"
        scale={[
          [0, 1.06],
          [0.35, 1, "expo.out"],
        ]}
      >
        <Rect id="fl-bg" width={1080} height={1920} fill="$brand.block4" />
        <SafeArea id="fl-safe" preset="reels">
          <Text
            id="fl-lead"
            at={[0, 0]}
            text="Every sound and font:"
            size={64}
            weight={800}
            fill="$brand.text"
            align="left"
            maxWidth="100%"
            font="$type.display"
            enter={{ from: "w", distance: 400, ease: POP, duration: 0.4, delay: 0.02 }}
          />
          <Title
            id="fl-1"
            at={[0, 70]}
            text="Licensed."
            size={124}
            align="left"
            maxWidth="100%"
            fill="$brand.text"
            font="$type.display"
            enter={{ from: "e", distance: 600, ease: POP, duration: 0.4, delay: 1.2 }}
          />
          <Title
            id="fl-2"
            at={[0, 210]}
            text="Logged."
            size={124}
            align="left"
            maxWidth="100%"
            fill="$brand.text"
            font="$type.display"
            enter={{ from: "w", distance: 600, ease: POP, duration: 0.4, delay: 1.9 }}
          />
          <Title
            id="fl-3"
            at={[0, 350]}
            text="Locked."
            size={124}
            align="left"
            maxWidth="100%"
            fill="$brand.accent"
            font="$type.display"
            enter={{ from: "e", distance: 600, ease: POP, duration: 0.4, delay: 2.5 }}
          />
          <Card
            id="fl-clip"
            at={[36, 520]}
            layout="absolute"
            width={880}
            height={560}
            padding={0}
            radius={0}
            fill="rgba(0,0,0,0)"
            shadow={false}
            rotation={1.5}
            enter={{ from: "s", distance: 600, ease: POP, duration: 0.55, delay: 0.25 }}
          >
            <Image
              id="fl-shot"
              src="./assets/captures/live-ledger.png"
              alt="flomotion live view: the licence ledger of this very video"
              at={[0, 0]}
              width={880}
              height={5102}
              fit="cover"
              position={[
                [0.5, [0, 0]],
                [2.3, [0, -2000], "power2.inOut"],
              ]}
            />
            <Mask id="fl-mask" shape="roundrect" radius={0.03} />
          </Card>
          <Card
            id="door-shut"
            opacity={[
              [2.44, 0],
              [2.45, 1],
            ]}
            at={[216, 540]}
            layout="absolute"
            width={520}
            height={520}
            padding={0}
            radius={0}
            fill="rgba(0,0,0,0)"
            shadow={false}
            scale={[
              [2.45, 0.2],
              [2.85, 1, "back.out(1.5)"],
            ]}
            rotation={[[2.85, 0]]}
          >
            <Circle
              id="door-shut-body"
              at={[0, 0]}
              width={520}
              fill="$brand.accent"
              stroke={{ width: 12, color: "$brand.text" }}
            />
            <Circle
              id="door-shut-ring"
              at={[57, 57]}
              width={406}
              fill="rgba(0,0,0,0)"
              stroke={{ width: 8, color: "$brand.text" }}
            />
            <Circle
              id="door-shut-plate"
              at={[130, 130]}
              width={260}
              fill="$brand.signal"
              stroke={{ width: 8, color: "$brand.text" }}
            />
            <Circle id="door-shut-bolt0" at={[476, 247]} width={26} fill="$brand.text" />
            <Circle id="door-shut-bolt1" at={[409, 409]} width={26} fill="$brand.text" />
            <Circle id="door-shut-bolt2" at={[247, 476]} width={26} fill="$brand.text" />
            <Circle id="door-shut-bolt3" at={[85, 409]} width={26} fill="$brand.text" />
            <Circle id="door-shut-bolt4" at={[18, 247]} width={26} fill="$brand.text" />
            <Circle id="door-shut-bolt5" at={[85, 85]} width={26} fill="$brand.text" />
            <Circle id="door-shut-bolt6" at={[247, 18]} width={26} fill="$brand.text" />
            <Circle id="door-shut-bolt7" at={[409, 85]} width={26} fill="$brand.text" />
            <Card
              id="door-shut-spokes"
              at={[130, 130]}
              layout="absolute"
              width={260}
              height={260}
              padding={0}
              radius={0}
              fill="rgba(0,0,0,0)"
              shadow={false}
              rotation={[
                [2.45, 0],
                [3.1, 100, "power3.out"],
              ]}
            >
              <RoundRect
                id="door-shut-spoke-h"
                at={[10, 110]}
                width={239}
                height={39}
                radius={20}
                fill="$brand.text"
              />
              <RoundRect
                id="door-shut-spoke-v"
                at={[110, 10]}
                width={39}
                height={239}
                radius={20}
                fill="$brand.text"
              />
              <Circle
                id="door-shut-hub"
                at={[94, 94]}
                width={73}
                fill="$brand.surface"
                stroke={{ width: 8, color: "$brand.text" }}
              />
            </Card>
          </Card>
        </SafeArea>
        <Sound id="s-fl-pop1" src="local:pop" at="1.25s" peak="pop" gain={-9} tag="ui/pop" />
        <Sound id="s-fl-pop2" src="local:pop" at="1.95s" peak="pop" gain={-9} tag="ui/pop" />
        <Sound id="s-fl-slam" src="local:hit" at="2.85s" peak="boom" gain={-6} tag="hit/boom" />
        <Sound
          id="s-fl-chime"
          src="local:chime"
          at="2.95s"
          peak="main"
          gain={-10}
          tag="tech/success"
        />
      </Scene>

      {/* 7. PROOF 24.375 - 27.19 s */}
      <Scene
        id="proof"
        start="24.375s"
        duration="2.8125s"
        scale={[
          [0, 1.1],
          [0.35, 1, "expo.out"],
        ]}
      >
        <Rect id="proof-bg" width={1080} height={1920} fill="$brand.accent" />
        <SafeArea id="proof-safe" preset="reels">
          <Counter
            id="proof-count"
            at={[0, 10]}
            from={0}
            to={39}
            over={0.8}
            delay="0.02s"
            size={460}
            align="left"
            maxWidth="100%"
            fill="$brand.text"
            font="$type.numerals"
          >
            <Thud id="proof-thud" amp={20} start="0.85s" sound="" />
          </Counter>
          <Text
            id="proof-label"
            at={[0, 500]}
            text="MCP tools"
            size={104}
            weight={800}
            fill="$brand.text"
            align="left"
            maxWidth="100%"
            font="$type.display"
            enter={{ from: "s", distance: 100, ease: POP, duration: 0.45, delay: 0.45 }}
          />
          <Title
            id="proof-same"
            at={[0, 690]}
            text="Diff it like code."
            size={112}
            align="left"
            maxWidth="100%"
            fill="$brand.text"
            font="$type.display"
            enter={{ from: "e", distance: 600, ease: POP, duration: 0.5, delay: 1.15 }}
          />
          <Chip
            id="proof-r1"
            at={[0, 900]}
            label="- size={120}"
            dot="$brand.negative"
            fill="$brand.text"
            textColor="$brand.surface"
            font="$type.mono"
            size={44}
            enter={{ from: "s", distance: 60, ease: POP, duration: 0.4, delay: 1.5 }}
          />

          <Chip
            id="proof-r2"
            at={[0, 995]}
            label="+ size={140}"
            dot="$brand.positive"
            fill="$brand.text"
            textColor="$brand.surface"
            font="$type.mono"
            size={44}
            enter={{ from: "s", distance: 60, ease: POP, duration: 0.4, delay: 1.75 }}
          />
        </SafeArea>
        <Sound id="s-pr-t1" src="local:tick" at="0.25s" peak="tick" gain={-9} tag="ui/tick" />
        <Sound id="s-pr-t2" src="local:tick" at="0.5s" peak="tick" gain={-9} tag="ui/tick" />
        <Sound id="s-pr-t3" src="local:pop" at="0.85s" peak="pop" gain={-7} tag="ui/pop" />
        <Sound id="s-pr-hit" src="local:hit" at="1.2s" peak="boom" gain={-10} tag="hit/boom" />
        <Sound id="s-pr-r1" src="local:pop" at="1.55s" peak="pop" gain={-11} tag="ui/pop" />
        <Sound id="s-pr-r2" src="local:pop" at="1.8s" peak="pop" gain={-11} tag="ui/pop" />
      </Scene>

      {/* 8. CTA 27.19 - 30 s: the hook's prompt comes back, rendered; and the reveal that the whole ad is one file */}
      <Scene
        id="cta"
        start="27.1875s"
        duration="2.8125s"
        scale={[
          [0, 1.1],
          [0.4, 1, "expo.out"],
        ]}
      >
        <Rect id="cta-bg" width={1080} height={1920} fill="$brand.surface" />
        <Circle
          id="cta-c1"
          at={[700, 150]}
          width={420}
          fill="$brand.block4"
          scale={[
            [0.1, 0],
            [0.7, 1, POP],
          ]}
        />
        <Circle
          id="cta-c2"
          at={[-200, 1420]}
          width={520}
          fill="$brand.accent"
          scale={[
            [0.2, 0],
            [0.9, 1, POP],
          ]}
        />
        <RoundRect
          id="cta-c3"
          at={[790, 1400]}
          width={230}
          height={230}
          radius={54}
          fill="$brand.block3"
          rotation={16}
          scale={[
            [0.35, 0],
            [1.0, 1, POP],
          ]}
        />
        <SafeArea id="cta-safe" preset="reels">
          <Title
            id="cta-start"
            at={[0, 300]}
            text="Start now."
            size={170}
            align="left"
            maxWidth="100%"
            fill="$brand.text"
            font="$type.display"
            enter={{ from: "s", distance: 400, ease: POP, duration: 0.5, delay: 0.05 }}
          >
            <PunchZoom id="cta-punch" start="0.1s" amount={0.05} sound="" />
          </Title>
          <CodeBlock
            id="cta-cmd"
            at={[0, 600]}
            width={952}
            size={76}
            padding={56}
            code="$ npx flomotion"
            reveal={[
              [0.95, 0],
              [1.75, 1, "none"],
            ]}
            enter={{ from: "s", distance: 400, ease: POP, duration: 0.5, delay: 0.25 }}
          />
          <Chip
            id="cta-done"
            at={[0, 880]}
            label="a 30 s ad for flomotion: rendered"
            dot="$brand.positive"
            fill="$brand.text"
            textColor="$brand.surface"
            font="$type.mono"
            size={36}
            enter={{ from: "s", distance: 60, ease: POP, duration: 0.45, delay: 1.85 }}
          />
          <Text
            id="cta-line"
            at={[0, 1010]}
            text="This whole ad is one TSX file."
            size={60}
            weight={800}
            fill="$brand.text"
            align="left"
            maxWidth="100%"
            font="$type.display"
            enter={{ from: "s", distance: 60, ease: POP, duration: 0.5, delay: 2.1 }}
          />
        </SafeArea>
        <Sound id="s-cta-t1" src="local:type" at="1.05s" peak="type" gain={-9} tag="ui/type" />
        <Sound id="s-cta-t2" src="local:type" at="1.2s" peak="type" gain={-10} tag="ui/type" />
        <Sound id="s-cta-t3" src="local:type" at="1.35s" peak="type" gain={-9} tag="ui/type" />
        <Sound id="s-cta-t4" src="local:type" at="1.5s" peak="type" gain={-10} tag="ui/type" />
        <Sound id="s-cta-t5" src="local:type" at="1.65s" peak="type" gain={-9} tag="ui/type" />
        <Sound
          id="s-cta-chime"
          src="local:chime"
          at="1.9s"
          peak="main"
          gain={-8}
          tag="tech/success"
        />
      </Scene>
    </Track>

    {/* transitions: every cut has its own, ending on the beat in the colour of the scene that follows */}
    <Track id="wipes" kind="video">
      <Rect
        id="w1"
        start="3.03s"
        duration="0.3s"
        width={1080}
        height={1920}
        fill="$brand.block3"
        position={[
          [3.03, [-1080, 0]],
          [3.28125, [0, 0], "power4.out"],
        ]}
      />
      <Rect
        id="w2"
        start="3.97s"
        duration="0.3s"
        width={1080}
        height={1920}
        fill="$brand.block2"
        position={[
          [3.97, [0, 1920]],
          [4.21875, [0, 0], "power4.out"],
        ]}
      />
      <Circle
        id="w3"
        start="4.92s"
        duration="0.3s"
        at={[340, 760]}
        width={400}
        fill="$brand.block5"
        scale={[
          [4.92, 0],
          [5.15625, 7, "power3.in"],
        ]}
      />
      <Rect
        id="w4"
        start="5.84s"
        duration="0.3s"
        width={1080}
        height={1920}
        fill="$brand.negative"
        position={[
          [5.84, [1080, 0]],
          [6.09375, [0, 0], "power4.out"],
        ]}
      />
      <Rect
        id="w5"
        start="6.97s"
        duration="0.3s"
        width={1080}
        height={1920}
        fill="$brand.surface"
        opacity={[
          [6.97, 0],
          [7.03125, 1],
          [7.18, 0, "power2.out"],
        ]}
      />
      <Rect
        id="w6"
        start="11.45s"
        duration="0.4s"
        width={1080}
        height={1920}
        fill="$brand.block5"
        position={[
          [11.45, [0, -1920]],
          [11.71875, [0, 0], "power4.out"],
        ]}
      />
      <Rect
        id="w7"
        start="14.7s"
        duration="0.4s"
        at={[-1060, -640]}
        width={3200}
        height={3200}
        rotation={18}
        fill="$brand.block2"
        position={[
          [14.7, [-3000, 0]],
          [15, [0, 0], "power3.out"],
        ]}
      />
      <Rect
        id="w8a"
        start="17.98s"
        duration="0.4s"
        at={[0, 0]}
        width={220}
        height={1920}
        anchor={[50, 0]}
        fill="$brand.block3"
        scale={[
          [18.0, [1, 0]],
          [18.14, [1, 1], "power3.out"],
        ]}
      />
      <Rect
        id="w8b"
        start="17.98s"
        duration="0.4s"
        at={[216, 0]}
        width={220}
        height={1920}
        anchor={[50, 0]}
        fill="$brand.block3"
        scale={[
          [18.04, [1, 0]],
          [18.18, [1, 1], "power3.out"],
        ]}
      />
      <Rect
        id="w8c"
        start="17.98s"
        duration="0.4s"
        at={[432, 0]}
        width={220}
        height={1920}
        anchor={[50, 0]}
        fill="$brand.block3"
        scale={[
          [18.08, [1, 0]],
          [18.22, [1, 1], "power3.out"],
        ]}
      />
      <Rect
        id="w8d"
        start="17.98s"
        duration="0.4s"
        at={[648, 0]}
        width={220}
        height={1920}
        anchor={[50, 0]}
        fill="$brand.block3"
        scale={[
          [18.12, [1, 0]],
          [18.26, [1, 1], "power3.out"],
        ]}
      />
      <Rect
        id="w8e"
        start="17.98s"
        duration="0.4s"
        at={[864, 0]}
        width={220}
        height={1920}
        anchor={[50, 0]}
        fill="$brand.block3"
        scale={[
          [18.16, [1, 0]],
          [18.28125, [1, 1], "power3.out"],
        ]}
      />
      <Circle
        id="w9"
        start="20.85s"
        duration="0.4s"
        at={[340, 760]}
        width={400}
        fill="$brand.block4"
        scale={[
          [20.85, 0],
          [21.09375, 7, "power3.in"],
        ]}
      />
      <Rect
        id="w10a"
        start="24.1s"
        duration="0.4s"
        at={[0, 0]}
        width={540}
        height={1920}
        fill="$brand.accent"
        position={[
          [24.1, [-540, 0]],
          [24.375, [0, 0], "power3.out"],
        ]}
      />
      <Rect
        id="w10b"
        start="24.1s"
        duration="0.4s"
        at={[540, 0]}
        width={540}
        height={1920}
        fill="$brand.accent"
        position={[
          [24.1, [540, 0]],
          [24.375, [0, 0], "power3.out"],
        ]}
      />
      <Rect
        id="w11"
        start="27.08s"
        duration="0.3s"
        width={1080}
        height={1920}
        fill="$brand.surface"
        opacity={[
          [27.08, 0],
          [27.1875, 1],
          [27.35, 0, "power2.out"],
        ]}
      />
    </Track>

    {/* captions: one word at a time, on the voice's own word times, from the product beat to the CTA */}
    <Track id="caps-track" kind="video">
      <SafeArea id="caps-safe" preset="reels">
        <Captions
          id="captions"
          start="11.71875s"
          duration="15.46875s"
          voice="#vo"
          at={[0, 1170]}
          captionStyle="word"
          size={96}
          weight={800}
          maxChars={12}
          maxWords={1}
          fill="$brand.text"
          font="$type.display"
        />
      </SafeArea>
    </Track>

    {/* the mascot: one dot with eyes that carries across the film, reacts to the story and pulses on the beat after the drop */}
    <Track id="hero-track" kind="video">
      <Card
        id="flo"
        start="0s"
        duration="30s"
        at={[880, 110]}
        layout="absolute"
        width={110}
        height={110}
        padding={0}
        radius={0}
        fill="rgba(0,0,0,0)"
        shadow={false}
        scale={[
          [0, 1],
          [6.9, 1],
          [7.03, 0],
          [8.95, 0],
          [9.25, 1, POP],
        ]}
        rotation={[
          [6.1, 0],
          [6.95, 720, "power3.out"],
        ]}
      >
        <Circle
          id="flo-body"
          at={[0, 0]}
          width={110}
          fill="$brand.text"
          stroke={{ width: 7, color: "$brand.surface" }}
        />
        <Circle
          id="flo-eye-l"
          at={[20, 34]}
          width={34}
          fill="$brand.surface"
          scale={[
            [1.6, [1, 1]],
            [1.66, [1, 0.1]],
            [1.74, [1, 1]],
            [4.9, [1, 1]],
            [4.96, [1, 0.1]],
            [5.04, [1, 1]],
            [10.4, [1, 1]],
            [10.46, [1, 0.1]],
            [10.54, [1, 1]],
            [15.6, [1, 1]],
            [15.66, [1, 0.1]],
            [15.74, [1, 1]],
            [22.2, [1, 1]],
            [22.26, [1, 0.1]],
            [22.34, [1, 1]],
          ]}
        />
        <Circle
          id="flo-eye-r"
          at={[56, 34]}
          width={34}
          fill="$brand.surface"
          scale={[
            [1.6, [1, 1]],
            [1.66, [1, 0.1]],
            [1.74, [1, 1]],
            [4.9, [1, 1]],
            [4.96, [1, 0.1]],
            [5.04, [1, 1]],
            [10.4, [1, 1]],
            [10.46, [1, 0.1]],
            [10.54, [1, 1]],
            [15.6, [1, 1]],
            [15.66, [1, 0.1]],
            [15.74, [1, 1]],
            [22.2, [1, 1]],
            [22.26, [1, 0.1]],
            [22.34, [1, 1]],
          ]}
        />
        <Circle
          id="flo-pupil-l"
          at={[30, 44]}
          width={15}
          fill="$brand.text"
          position={[
            [0, [0, 0]],
            [11.7, [0, 0]],
            [12.1, [-5, 7], "power2.out"],
            [15, [-5, 7]],
            [15.3, [0, 0], "power2.out"],
            [24.3, [0, 0]],
            [24.6, [4, -2], "power2.out"],
          ]}
        />
        <Circle
          id="flo-pupil-r"
          at={[66, 44]}
          width={15}
          fill="$brand.text"
          position={[
            [0, [0, 0]],
            [11.7, [0, 0]],
            [12.1, [-5, 7], "power2.out"],
            [15, [-5, 7]],
            [15.3, [0, 0], "power2.out"],
            [24.3, [0, 0]],
            [24.6, [4, -2], "power2.out"],
          ]}
        />
        <Pulse id="flo-pulse" start="9.4s" amp={0.12} freq={2.133} count={0} sound="" />
      </Card>
    </Track>

    {/* sounds on the cuts (absolute times; the peak of each lands on the cut) */}
    <Sound
      id="c-whip-1"
      src="freesound:460469"
      at="3.28125s"
      peak="whip"
      gain={-12}
      tag="move/whip"
    />
    <Sound
      id="c-whip-2"
      src="freesound:460469"
      at="4.21875s"
      peak="whip"
      gain={-13}
      tag="move/whip"
    />
    <Sound
      id="c-whip-3"
      src="freesound:460469"
      at="5.15625s"
      peak="whip"
      gain={-13}
      tag="move/whip"
    />
    <Sound
      id="c-glitch-4"
      src="freesound:856168"
      at="6.09375s"
      peak="glitch-whip"
      gain={-9}
      tag="move/glitch-whip"
    />
    <Sound
      id="c-riser-hit"
      src="freesound:757922"
      at="8.90625s"
      peak="riser-hit"
      gain={-4}
      tag="hit/riser-hit"
    />
    <Sound
      id="c-whip-6"
      src="freesound:460469"
      at="11.71875s"
      peak="whip"
      gain={-12}
      tag="move/whip"
    />
    <Sound id="c-whip-7" src="freesound:460469" at="15s" peak="whip" gain={-12} tag="move/whip" />
    <Sound
      id="c-whip-8"
      src="freesound:460469"
      at="18.28125s"
      peak="whip"
      gain={-12}
      tag="move/whip"
    />
    <Sound
      id="c-whip-9"
      src="freesound:460469"
      at="21.09375s"
      peak="whip"
      gain={-12}
      tag="move/whip"
    />
    <Sound
      id="c-whip-10"
      src="freesound:460469"
      at="24.375s"
      peak="whip"
      gain={-12}
      tag="move/whip"
    />
    <Sound id="c-boom-proof" src="local:hit" at="24.375s" peak="boom" gain={-8} tag="hit/boom" />
    <Sound id="c-boom-cta" src="local:hit" at="27.1875s" peak="boom" gain={-5} tag="hit/boom" />

    <Marker id="turn-marker" at="8.90625s" label="Turn" />
    <Marker id="m-product" at="11.71875s" label="Product" />
    <Marker id="m-cta" at="27.1875s" label="CTA" />
    <Voiceover id="vo" src="./assets/voice/voice.wav" at="0s" gain={0} />
    <Audio id="music" src="local:music" gain={-9} fadeOut={0.8} />
    <Grain id="grain" amount={0.04} />
  </Composition>
);
