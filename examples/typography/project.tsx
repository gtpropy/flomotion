import {
  Composition,
  Track,
  Scene,
  Fonts,
  Font,
  Text,
  Title,
  TextAnimator,
  Marker,
} from "@codecut/components";

/** Text-heavy test project: Google font, local custom font, variable font with an animated axis, Devanagari. */
export default (
  <Composition id="typography" size={[1080, 1920]} fps={30} duration="6s" background="#101018">
    <Fonts id="fonts">
      <Font
        id="display"
        family="Space Grotesk"
        source="google"
        variable
        axes={{ wght: [300, 700] }}
        subsets={["latin"]}
      />
      <Font id="body" family="Inter" source="google" weights={[400, 600]} subsets={["latin"]} />
      <Font
        id="brand"
        family="Pacifico"
        source="./fonts/Pacifico-Regular.woff2"
        license="OFL-1.1"
      />
      <Font
        id="deva"
        family="Noto Sans Devanagari"
        source="google"
        weights={[400, 700]}
        subsets={["devanagari", "latin"]}
      />
    </Fonts>
    <Track id="v1" kind="video">
      <Scene id="s1" start="0s" duration="6s">
        <Text
          id="t-google"
          text="Google font: Inter"
          font="body"
          weight={600}
          size={64}
          fill="#ffffff"
          at={[90, 220]}
          maxWidth={900}
          align="left"
        />
        <Text
          id="t-local"
          text="Local font: Pacifico"
          font="brand"
          size={92}
          fill="#ff6b9a"
          at={[90, 420]}
          maxWidth={900}
          align="left"
        />
        <Text
          id="t-var"
          text="Variable axis"
          font="display"
          size={140}
          axes={{
            wght: [
              [0, 300],
              [3, 700, "expo.out"],
            ],
          }}
          fill="#27e0ff"
          at={[90, 640]}
          maxWidth={900}
          align="left"
        />
        <Text
          id="t-deva"
          text="नमस्ते दुनिया — Devanagari"
          font="deva"
          size={80}
          weight={700}
          fill="#ffe14d"
          at={[90, 960]}
          maxWidth={900}
          align="left"
        />
        <Title
          id="t-anim"
          text="Ship videos as code"
          font="display"
          size={130}
          at={[90, 1240]}
          maxWidth={900}
          align="left"
          fill={{
            type: "linear",
            angle: 90,
            stops: [
              [0, "#ff3366"],
              [1, "#ffe14d"],
            ],
          }}
          stroke={{ width: 2, color: "#ffffff", align: "outside" }}
          shadow={[{ y: 10, blur: 24, opacity: 0.5 }]}
        >
          <TextAnimator
            by="char"
            selector={{
              start: 0,
              end: 1,
              offset: [
                [0, -1],
                [1.2, 1, "expo.out"],
              ],
              shape: "smooth",
              randomize: { seed: 3, amount: 0.3 },
            }}
            props={{ opacity: 0, y: 40, blur: 12, tracking: 200, weight: 300 }}
          />
        </Title>
        <Text
          id="t-hl"
          text="Highlight and underline"
          font="body"
          weight={600}
          size={60}
          fill="#ffffff"
          at={[90, 1560]}
          maxWidth={900}
          align="left"
          highlight={{
            color: "#7c8cff",
            padding: 10,
            progress: [
              [0.5, 0],
              [1.4, 1, "expo.out"],
            ],
          }}
        />
      </Scene>
    </Track>
    <Marker id="m" at="1s" label="hit" />
  </Composition>
);
