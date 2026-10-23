# Components and effects

Generated from schemas. Do not edit by hand.

## brand

- [Look](./Look.md) (component): Tokens for palette, type scale, easing set, default transition, grain and sound palette. Reference with theme="$look.<id>" on the Composition.
- [Theme](./Theme.md) (component): Tokens for palette, type scale, easing set, default transition, grain and sound palette. Reference with theme="$look.<id>" on the Composition.

## color

- [ColorGrade](./ColorGrade.md) (effect): Primary colour correction through SVG filters: basic controls plus lift/gamma/gain/offset wheels. Order: tone, white balance and saturation, then wheels. Apply to a layer or, as a child of Composition, to everything.
- [Curves](./Curves.md) (effect): Tone curves per channel (rgb, r, g, b, luma). Points are 0..1 with a monotone cubic through them. `luma` is applied to all three channels equally.
- [Grain](./Grain.md) (effect): Film grain: seeded fractal noise overlay. The noise re-seeds every `hold` frames from a seeded PRNG, so renders repeat exactly.

## impact

- [Glitch](./Glitch.md) (effect): Seeded digital glitch: jittering offset and skew, flicker and hue flips. Changes every other frame.
- [Hitstop](./Hitstop.md) (effect): Freezes the parent's own animation for a few frames at the hit moment, then resumes (time remap).
- [Impact](./Impact.md) (effect): Alias of Thud with a heavier default feel.
- [Pulse](./Pulse.md) (effect): Repeating scale pulses: scale = 1 + amp·sin²(π·freq·t) for `count` beats (or until the parent ends when count is 0).
- [PunchZoom](./PunchZoom.md) (effect): A quick scale punch that settles: scale = 1 + amount·e^(-decay·t).
- [RGBSplit](./RGBSplit.md) (effect): Chromatic aberration: red and blue channels offset in opposite directions. `decay` fades it out.
- [Shake](./Shake.md) (effect): Decaying noise shake of the parent: x, y and optional rotation. Deterministic (seeded noise of time).
- [Slam](./Slam.md) (effect): Drops in fast from above (ease-in), lands with a thud, squash and settle.
- [SquashStretch](./SquashStretch.md) (effect): Volume-preserving squash and stretch oscillation (sy = 1 + a·env·cos, sx = 1/√sy).
- [Thud](./Thud.md) (effect): A landing: damped oscillation along an axis with squash. y = amp·e^(-damping·t)·cos(2π·freq·t).
- [WhipPan](./WhipPan.md) (effect): A fast whip move with motion blur: the layer swings in from (or out toward) a side.
- [Wobble](./Wobble.md) (effect): Damped rotational wobble: rot = amp·e^(-damping·t)·sin(2π·freq·t).

## layer-styles

- [Blur](./Blur.md) (effect): Gaussian blur of the layer.
- [DropShadow](./DropShadow.md) (effect): A soft shadow behind the layer's visible pixels.
- [Glow](./Glow.md) (effect): A coloured halo around the layer's visible pixels.
- [Stroke](./Stroke.md) (effect): An outline around the layer's visible pixels (outside edge).
- [Vignette](./Vignette.md) (effect): Darkens the edges of the layer.

## layout

- [Center](./Center.md) (component): Centres its children in the parent box.
- [Grid](./Grid.md) (component): A CSS grid. `columns` is a count or a list of track sizes ("1fr", "200px").
- [SafeArea](./SafeArea.md) (component): Constrains children to the platform-safe rectangle (reels, shorts, tiktok, feed). Children placed with `at` position inside it.
- [Stack](./Stack.md) (component): Lays children out in a row or column with gap, alignment and padding (CSS flex).

## media

- [Audio](./Audio.md) (component): Background audio (music or ambience) on a bus. Mixed offline with FFmpeg; music ducks under voice.
- [Captions](./Captions.md) (component): Captions from a Voiceover's word timings. Styles: karaoke (active word recoloured), pop (active word scales), line (whole line), word (one word at a time). Export .srt/.vtt with the CLI or MCP.
- [Clip](./Clip.md) (component): A trimmed piece of video on a track: `in`/`out` select the source range, `speed` retimes it, `volume` is its mix gain.
- [Image](./Image.md) (component): A still image. Defaults to filling its parent box; use the transform stack for Ken Burns moves.
- [Sound](./Sound.md) (component): A sound effect placed on a moment. `at` is where the sound's peak should land; the clip starts early by its peak offset (`peak` is a number of seconds or a named peak from the ledger).
- [Video](./Video.md) (component): A video file. Its picture is rendered by HyperFrames; its sound (if `volume` > 0) goes into the offline mix, so the <video> stays muted.
- [Voiceover](./Voiceover.md) (component): The narration. Loads the audio and its word timings (`voice.words.json`) so captions and `ctx.word(id, i)` can use them.

## motion

- [Animate](./Animate.md) (effect): Animates one transform property of the parent from `from` to `to`. Position, rotation and skew are added to the layer's own values; scale and opacity multiply them.
- [Enter](./Enter.md) (effect): Entrance motion for the parent layer. Same fields as the layer's `enter` prop.
- [Exit](./Exit.md) (effect): Exit motion for the parent layer. Same fields as the layer's `exit` prop.
- [Keyframes](./Keyframes.md) (component): Element form of keyframes: animates `prop` of its parent. Same as writing the prop as a keyframe array.
- [Stagger](./Stagger.md) (component): Offsets each child's start by `each` seconds in order (or from the end / center / edges). Children keep their own durations.

## shapes

- [Circle](./Circle.md) (component): A circle (or ellipse when width and height differ).
- [Line](./Line.md) (component): A line from one point to another. `trim` draws it on.
- [Mask](./Mask.md) (effect): Masks its parent layer with a shape. Geometry is a fraction of the layer box (0..1), so size 0 to 1 reveals the whole layer. Implemented as a CSS mask image.
- [Matte](./Matte.md) (effect): Uses another shape layer as a track matte (alpha or luma) for its parent. The source must be a Rect, RoundRect, Circle or Polygon; its shape is stretched over the parent's box. Set the source layer `hidden` to avoid drawing it.
- [Path](./Path.md) (component): An SVG path in its own viewBox. `trimStart`/`trimEnd` animate a draw-on.
- [Polygon](./Polygon.md) (component): A polygon from explicit `points`, or a regular polygon with `sides` and `radius`.
- [Rect](./Rect.md) (component): A rectangle with solid, gradient or image fill and an optional stroke.
- [RoundRect](./RoundRect.md) (component): A rounded rectangle (default radius 24 px).
- [Svg](./Svg.md) (component): Inline SVG markup or an SVG file, sized to a box.

## structure

- [Adjustment](./Adjustment.md) (component, stub): Adjustment layer: effects apply to everything below it. Typed stub: not implemented yet.
- [Composition](./Composition.md) (component): Root of a project: size, frame rate, duration and theme.
- [Group](./Group.md) (component): Groups layers so they transform, fade and take effects together.
- [Marker](./Marker.md) (component): A named point in time. Reference it with Time strings like "@marker:drop".
- [Precomp](./Precomp.md) (component, stub): Nested composition with its own timeline. Typed stub: not implemented yet.
- [Scene](./Scene.md) (component): A timed section. Child timing is relative to the Scene start.
- [Sequence](./Sequence.md) (component): Plays its children one after another. Each child starts when the previous ends plus `gap`.
- [Track](./Track.md) (component): A lane of clips. Track order sets stacking (later tracks paint above earlier ones).

## text

- [B](./B.md) (component): Bold run inside Text.
- [Highlight](./Highlight.md) (component): Marker-pen highlight behind an inline run. `progress` animates a left-to-right wipe.
- [I](./I.md) (component): Italic run inside Text.
- [Span](./Span.md) (component): Inline run inside Text that overrides font, weight, colour, size and features.
- [SplitText](./SplitText.md) (component): The simple form of TextAnimator: splits text into characters, words or lines and staggers a preset or custom props across them.
- [Strike](./Strike.md) (component): Strike-through for an inline run. `progress` animates a draw-on from left to right.
- [Text](./Text.md) (component): Text with full typography: face, spacing, layout, case and OpenType features, fitting, decoration and styling. Add <TextAnimator> children for per-character, word or line animation.
- [TextAnimator](./TextAnimator.md) (effect): After Effects style text animator. A selector gives each character, word or line an influence from 0 to 1 over time; the `props` interpolate from the base value to the given value by that influence. Pure functions of time; randomness is seeded.
- [Title](./Title.md) (component): A headline: Text with display-face defaults (700 weight, centred, tight leading).
- [Underline](./Underline.md) (component): Underline for an inline run. `progress` animates a draw-on from left to right.

## typography

- [Font](./Font.md) (component): A font. `source` is "google", "system", a project path (./fonts/X.woff2) or a URL. Path and URL sources need a `license`.
- [Fonts](./Fonts.md) (component): Container declaring every font the project uses. Renders never touch the network.

## ui

- [Card](./Card.md) (component): A surface with radius, optional stroke and shadow. Children stack top to bottom (or use `layout="absolute"`).
- [Chart](./Chart.md) (component): Bar, line or donut chart that draws in. `progress` (0 to 1) animates the reveal; bars stagger by `stagger`.
- [Chip](./Chip.md) (component): A pill label with an optional leading dot.
- [CodeBlock](./CodeBlock.md) (component): A syntax-tinted code panel. `reveal` (0 to 1) types the code in line by line.
- [Counter](./Counter.md) (component): An animated number that counts from `from` to `to`. Uses tabular figures so the width does not jitter.
- [Cursor](./Cursor.md) (component): A mouse pointer. Move it by keyframing `position`; `clicks` lists times (relative to the parent) where it presses and a ripple expands.
- [GlassCard](./GlassCard.md) (component): A frosted-glass card: backdrop blur, translucent fill and a hairline border.
- [ProgressRing](./ProgressRing.md) (component): A circular progress indicator. Animate `value` (0 to 1); optionally show the percentage.
- [UIMock](./UIMock.md) (component): A device frame (phone, tablet, laptop, browser) whose screen holds child layers. Children place themselves with `at` inside the screen.
