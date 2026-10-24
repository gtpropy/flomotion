# Components (generated from schemas: do not edit)

# Composition

*component, category: structure*

Root of a project: size, frame rate, duration and theme.

Children: any layers and effects.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  | Stable unique id. Written back as fm_… when missing. |
| `size` | `number | Vec2` | `[1920,1080]` | [width, height]; unit px |
| `fps` | `number` | `30` | range 1..240 |
| `duration` | `Time` |  | unit s |
| `background` | `Color` | `"#000000"` |  |
| `theme` | `string` |  | Look/Theme reference, e.g. "$look.kinetic" |
| `colorSpace` | `srgb` | `"srgb"` | SDR sRGB only for now. |
| `bpm` | `number` |  | Tempo for ctx.beat(n).; range 20..400 |

```ts
export interface CompositionProps {
  /** Stable unique id. Written back as fm_… when missing. */
  id?: string;
  /** [width, height]; unit px; default [1920,1080] */
  size?: number | Vec2;
  /** range 1..240; default 30 */
  fps?: number;
  /** unit s */
  duration?: Time;
  /** default "#000000" */
  background?: Color;
  /** Look/Theme reference, e.g. "$look.kinetic" */
  theme?: string;
  /** SDR sRGB only for now.; default "srgb" */
  colorSpace?: "srgb";
  /** Tempo for ctx.beat(n).; range 20..400 */
  bpm?: number;
  children?: unknown;
}
```

---

# Track

*component, category: structure*

A lane of clips. Track order sets stacking (later tracks paint above earlier ones).

Children: any layers and effects.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  | Stable unique id. Written back as fm_… when missing. |
| `label` | `string` |  |  |
| `kind` | `video` \| `audio` \| `overlay` \| `graphics` \| `captions` | `"video"` |  |
| `locked` | `boolean` | `false` |  |
| `muted` | `boolean` | `false` |  |
| `solo` | `boolean` | `false` |  |
| `blend` | `normal` \| `multiply` \| `screen` \| `overlay` \| `soft-light` \| `hard-light` \| `difference` \| `add` | `"normal"` |  |
| `opacity` | `number` | `1` | animatable; range 0..1 |

```ts
export interface TrackProps {
  /** Stable unique id. Written back as fm_… when missing. */
  id?: string;
  label?: string;
  /** default "video" */
  kind?: "video" | "audio" | "overlay" | "graphics" | "captions";
  /** default false */
  locked?: boolean;
  /** default false */
  muted?: boolean;
  /** default false */
  solo?: boolean;
  /** default "normal" */
  blend?: "normal" | "multiply" | "screen" | "overlay" | "soft-light" | "hard-light" | "difference" | "add";
  /** range 0..1; default 1 */
  opacity?: Animatable<number>;
  children?: unknown;
}
```

---

# Scene

*component, category: structure*

A timed section. Child timing is relative to the Scene start.

Children: any layers and effects.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  | Stable unique id. Written back as fm_… when missing. |
| `label` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s |
| `duration` | `Time` |  | Defaults to the rest of the parent.; unit s |
| `end` | `Time` |  | Alternative to duration.; unit s |
| `hidden` | `boolean` | `false` |  |
| `link` | `string` |  | Link group id: linked clips move, trim and split together. |
| `position` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit px; ui vec |
| `rotation` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit deg; ui vec |
| `scale` | `number | Vec2 | Vec3` | `[1,1,1]` | animatable; step 0.01; ui vec |
| `skew` | `number | Vec2` | `[0,0]` | animatable; unit deg; ui vec |
| `anchor` | `number | Vec2 | Vec3` | `[50,50,0]` | Transform origin as % of the layer box (z in px).; animatable; unit %; ui vec |
| `opacity` | `number` | `1` | animatable; range 0..1; step 0.01; ui slider |
| `crop` | `{ top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> }` |  |  |
| `flip` | `none` \| `x` \| `y` \| `xy` | `"none"` |  |
| `blend` | `normal` \| `multiply` \| `screen` \| `overlay` \| `darken` \| `lighten` \| `color-dodge` \| `color-burn` \| `soft-light` \| `hard-light` \| `difference` \| `exclusion` \| `hue` \| `saturation` \| `color` \| `luminosity` \| `add` | `"normal"` | ui dropdown |
| `perspective` | `number` | `0` | animatable; range 0..∞; unit px |
| `z` | `number` | `0` | Stacking override among siblings.; step 1 |
| `enter` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Entrance motion at the start of the layer. |
| `exit` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Exit motion ending at the end of the layer. |
| `transition` | `{ type?: "cut" | "dissolve" | "dipToColor" | "wipe" | "slide" | "push" | "flash" | "whipPan" | "zoomThrough" | "glitch" | "shader"; duration?: Time; direction?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw"; color?: Color; ease?: string; intensity?: number; name?: string }` |  | Overlaps the end of the previous scene by `duration`. |

```ts
export interface SceneProps {
  /** Stable unique id. Written back as fm_… when missing. */
  id?: string;
  label?: string;
  /** Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s */
  start?: Time;
  /** Defaults to the rest of the parent.; unit s */
  duration?: Time;
  /** Alternative to duration.; unit s */
  end?: Time;
  /** default false */
  hidden?: boolean;
  /** Link group id: linked clips move, trim and split together. */
  link?: string;
  /** unit px; default [0,0,0] */
  position?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0,0] */
  rotation?: Animatable<number | Vec2 | Vec3>;
  /** default [1,1,1] */
  scale?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0] */
  skew?: Animatable<number | Vec2>;
  /** Transform origin as % of the layer box (z in px).; unit %; default [50,50,0] */
  anchor?: Animatable<number | Vec2 | Vec3>;
  /** range 0..1; default 1 */
  opacity?: Animatable<number>;
  crop?: { top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> };
  /** default "none" */
  flip?: "none" | "x" | "y" | "xy";
  /** default "normal" */
  blend?: "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | "color-burn" | "soft-light" | "hard-light" | "difference" | "exclusion" | "hue" | "saturation" | "color" | "luminosity" | "add";
  /** range 0..∞; unit px; default 0 */
  perspective?: Animatable<number>;
  /** Stacking override among siblings.; default 0 */
  z?: number;
  /** Entrance motion at the start of the layer. */
  enter?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  /** Exit motion ending at the end of the layer. */
  exit?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  /** Overlaps the end of the previous scene by `duration`. */
  transition?: { type?: "cut" | "dissolve" | "dipToColor" | "wipe" | "slide" | "push" | "flash" | "whipPan" | "zoomThrough" | "glitch" | "shader"; duration?: Time; direction?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw"; color?: Color; ease?: string; intensity?: number; name?: string };
  children?: unknown;
}
```

---

# Sequence

*component, category: structure*

Plays its children one after another. Each child starts when the previous ends plus `gap`.

Children: any layers and effects.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  | Stable unique id. Written back as fm_… when missing. |
| `label` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s |
| `duration` | `Time` |  | Defaults to the rest of the parent.; unit s |
| `end` | `Time` |  | Alternative to duration.; unit s |
| `hidden` | `boolean` | `false` |  |
| `link` | `string` |  | Link group id: linked clips move, trim and split together. |
| `position` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit px; ui vec |
| `rotation` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit deg; ui vec |
| `scale` | `number | Vec2 | Vec3` | `[1,1,1]` | animatable; step 0.01; ui vec |
| `skew` | `number | Vec2` | `[0,0]` | animatable; unit deg; ui vec |
| `anchor` | `number | Vec2 | Vec3` | `[50,50,0]` | Transform origin as % of the layer box (z in px).; animatable; unit %; ui vec |
| `opacity` | `number` | `1` | animatable; range 0..1; step 0.01; ui slider |
| `crop` | `{ top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> }` |  |  |
| `flip` | `none` \| `x` \| `y` \| `xy` | `"none"` |  |
| `blend` | `normal` \| `multiply` \| `screen` \| `overlay` \| `darken` \| `lighten` \| `color-dodge` \| `color-burn` \| `soft-light` \| `hard-light` \| `difference` \| `exclusion` \| `hue` \| `saturation` \| `color` \| `luminosity` \| `add` | `"normal"` | ui dropdown |
| `perspective` | `number` | `0` | animatable; range 0..∞; unit px |
| `z` | `number` | `0` | Stacking override among siblings.; step 1 |
| `enter` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Entrance motion at the start of the layer. |
| `exit` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Exit motion ending at the end of the layer. |
| `gap` | `Time` | `0` | unit s |

```ts
export interface SequenceProps {
  /** Stable unique id. Written back as fm_… when missing. */
  id?: string;
  label?: string;
  /** Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s */
  start?: Time;
  /** Defaults to the rest of the parent.; unit s */
  duration?: Time;
  /** Alternative to duration.; unit s */
  end?: Time;
  /** default false */
  hidden?: boolean;
  /** Link group id: linked clips move, trim and split together. */
  link?: string;
  /** unit px; default [0,0,0] */
  position?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0,0] */
  rotation?: Animatable<number | Vec2 | Vec3>;
  /** default [1,1,1] */
  scale?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0] */
  skew?: Animatable<number | Vec2>;
  /** Transform origin as % of the layer box (z in px).; unit %; default [50,50,0] */
  anchor?: Animatable<number | Vec2 | Vec3>;
  /** range 0..1; default 1 */
  opacity?: Animatable<number>;
  crop?: { top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> };
  /** default "none" */
  flip?: "none" | "x" | "y" | "xy";
  /** default "normal" */
  blend?: "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | "color-burn" | "soft-light" | "hard-light" | "difference" | "exclusion" | "hue" | "saturation" | "color" | "luminosity" | "add";
  /** range 0..∞; unit px; default 0 */
  perspective?: Animatable<number>;
  /** Stacking override among siblings.; default 0 */
  z?: number;
  /** Entrance motion at the start of the layer. */
  enter?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  /** Exit motion ending at the end of the layer. */
  exit?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  /** unit s; default 0 */
  gap?: Time;
  children?: unknown;
}
```

---

# Group

*component, category: structure*

Groups layers so they transform, fade and take effects together.

Children: any layers and effects.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  | Stable unique id. Written back as fm_… when missing. |
| `label` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s |
| `duration` | `Time` |  | Defaults to the rest of the parent.; unit s |
| `end` | `Time` |  | Alternative to duration.; unit s |
| `hidden` | `boolean` | `false` |  |
| `link` | `string` |  | Link group id: linked clips move, trim and split together. |
| `position` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit px; ui vec |
| `rotation` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit deg; ui vec |
| `scale` | `number | Vec2 | Vec3` | `[1,1,1]` | animatable; step 0.01; ui vec |
| `skew` | `number | Vec2` | `[0,0]` | animatable; unit deg; ui vec |
| `anchor` | `number | Vec2 | Vec3` | `[50,50,0]` | Transform origin as % of the layer box (z in px).; animatable; unit %; ui vec |
| `opacity` | `number` | `1` | animatable; range 0..1; step 0.01; ui slider |
| `crop` | `{ top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> }` |  |  |
| `flip` | `none` \| `x` \| `y` \| `xy` | `"none"` |  |
| `blend` | `normal` \| `multiply` \| `screen` \| `overlay` \| `darken` \| `lighten` \| `color-dodge` \| `color-burn` \| `soft-light` \| `hard-light` \| `difference` \| `exclusion` \| `hue` \| `saturation` \| `color` \| `luminosity` \| `add` | `"normal"` | ui dropdown |
| `perspective` | `number` | `0` | animatable; range 0..∞; unit px |
| `z` | `number` | `0` | Stacking override among siblings.; step 1 |
| `enter` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Entrance motion at the start of the layer. |
| `exit` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Exit motion ending at the end of the layer. |
| `width` | `Length` |  | Optional explicit box; defaults to the parent box. |
| `height` | `Length` |  |  |

```ts
export interface GroupProps {
  /** Stable unique id. Written back as fm_… when missing. */
  id?: string;
  label?: string;
  /** Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s */
  start?: Time;
  /** Defaults to the rest of the parent.; unit s */
  duration?: Time;
  /** Alternative to duration.; unit s */
  end?: Time;
  /** default false */
  hidden?: boolean;
  /** Link group id: linked clips move, trim and split together. */
  link?: string;
  /** unit px; default [0,0,0] */
  position?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0,0] */
  rotation?: Animatable<number | Vec2 | Vec3>;
  /** default [1,1,1] */
  scale?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0] */
  skew?: Animatable<number | Vec2>;
  /** Transform origin as % of the layer box (z in px).; unit %; default [50,50,0] */
  anchor?: Animatable<number | Vec2 | Vec3>;
  /** range 0..1; default 1 */
  opacity?: Animatable<number>;
  crop?: { top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> };
  /** default "none" */
  flip?: "none" | "x" | "y" | "xy";
  /** default "normal" */
  blend?: "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | "color-burn" | "soft-light" | "hard-light" | "difference" | "exclusion" | "hue" | "saturation" | "color" | "luminosity" | "add";
  /** range 0..∞; unit px; default 0 */
  perspective?: Animatable<number>;
  /** Stacking override among siblings.; default 0 */
  z?: number;
  /** Entrance motion at the start of the layer. */
  enter?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  /** Exit motion ending at the end of the layer. */
  exit?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  /** Optional explicit box; defaults to the parent box. */
  width?: Length;
  height?: Length;
  children?: unknown;
}
```

---

# Marker

*component, category: structure*

A named point in time. Reference it with Time strings like "@marker:drop".

Children: none.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  | Stable unique id. Written back as fm_… when missing. |
| `at` | `Time` |  | unit s |
| `label` | `string` |  |  |
| `color` | `Color` |  |  |

```ts
export interface MarkerProps {
  /** Stable unique id. Written back as fm_… when missing. */
  id?: string;
  /** unit s */
  at?: Time;
  label?: string;
  color?: Color;
  children?: unknown;
}
```

---

# Precomp

*component, category: structure, **stub** (schema only, not rendered yet)*

Nested composition with its own timeline. Typed stub: not implemented yet.

Children: any layers and effects.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  | Stable unique id. Written back as fm_… when missing. |
| `label` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s |
| `duration` | `Time` |  | Defaults to the rest of the parent.; unit s |
| `end` | `Time` |  | Alternative to duration.; unit s |
| `hidden` | `boolean` | `false` |  |
| `link` | `string` |  | Link group id: linked clips move, trim and split together. |
| `position` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit px; ui vec |
| `rotation` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit deg; ui vec |
| `scale` | `number | Vec2 | Vec3` | `[1,1,1]` | animatable; step 0.01; ui vec |
| `skew` | `number | Vec2` | `[0,0]` | animatable; unit deg; ui vec |
| `anchor` | `number | Vec2 | Vec3` | `[50,50,0]` | Transform origin as % of the layer box (z in px).; animatable; unit %; ui vec |
| `opacity` | `number` | `1` | animatable; range 0..1; step 0.01; ui slider |
| `crop` | `{ top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> }` |  |  |
| `flip` | `none` \| `x` \| `y` \| `xy` | `"none"` |  |
| `blend` | `normal` \| `multiply` \| `screen` \| `overlay` \| `darken` \| `lighten` \| `color-dodge` \| `color-burn` \| `soft-light` \| `hard-light` \| `difference` \| `exclusion` \| `hue` \| `saturation` \| `color` \| `luminosity` \| `add` | `"normal"` | ui dropdown |
| `perspective` | `number` | `0` | animatable; range 0..∞; unit px |
| `z` | `number` | `0` | Stacking override among siblings.; step 1 |
| `enter` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Entrance motion at the start of the layer. |
| `exit` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Exit motion ending at the end of the layer. |
| `src` | `Asset` |  |  |
| `loop` | `boolean` | `false` |  |

```ts
export interface PrecompProps {
  /** Stable unique id. Written back as fm_… when missing. */
  id?: string;
  label?: string;
  /** Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s */
  start?: Time;
  /** Defaults to the rest of the parent.; unit s */
  duration?: Time;
  /** Alternative to duration.; unit s */
  end?: Time;
  /** default false */
  hidden?: boolean;
  /** Link group id: linked clips move, trim and split together. */
  link?: string;
  /** unit px; default [0,0,0] */
  position?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0,0] */
  rotation?: Animatable<number | Vec2 | Vec3>;
  /** default [1,1,1] */
  scale?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0] */
  skew?: Animatable<number | Vec2>;
  /** Transform origin as % of the layer box (z in px).; unit %; default [50,50,0] */
  anchor?: Animatable<number | Vec2 | Vec3>;
  /** range 0..1; default 1 */
  opacity?: Animatable<number>;
  crop?: { top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> };
  /** default "none" */
  flip?: "none" | "x" | "y" | "xy";
  /** default "normal" */
  blend?: "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | "color-burn" | "soft-light" | "hard-light" | "difference" | "exclusion" | "hue" | "saturation" | "color" | "luminosity" | "add";
  /** range 0..∞; unit px; default 0 */
  perspective?: Animatable<number>;
  /** Stacking override among siblings.; default 0 */
  z?: number;
  /** Entrance motion at the start of the layer. */
  enter?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  /** Exit motion ending at the end of the layer. */
  exit?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  src?: Asset;
  /** default false */
  loop?: boolean;
  children?: unknown;
}
```

---

# Adjustment

*component, category: structure, **stub** (schema only, not rendered yet)*

Adjustment layer: effects apply to everything below it. Typed stub: not implemented yet.

Children: effects only.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  | Stable unique id. Written back as fm_… when missing. |
| `label` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s |
| `duration` | `Time` |  | Defaults to the rest of the parent.; unit s |
| `end` | `Time` |  | Alternative to duration.; unit s |
| `hidden` | `boolean` | `false` |  |
| `link` | `string` |  | Link group id: linked clips move, trim and split together. |
| `position` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit px; ui vec |
| `rotation` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit deg; ui vec |
| `scale` | `number | Vec2 | Vec3` | `[1,1,1]` | animatable; step 0.01; ui vec |
| `skew` | `number | Vec2` | `[0,0]` | animatable; unit deg; ui vec |
| `anchor` | `number | Vec2 | Vec3` | `[50,50,0]` | Transform origin as % of the layer box (z in px).; animatable; unit %; ui vec |
| `opacity` | `number` | `1` | animatable; range 0..1; step 0.01; ui slider |
| `crop` | `{ top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> }` |  |  |
| `flip` | `none` \| `x` \| `y` \| `xy` | `"none"` |  |
| `blend` | `normal` \| `multiply` \| `screen` \| `overlay` \| `darken` \| `lighten` \| `color-dodge` \| `color-burn` \| `soft-light` \| `hard-light` \| `difference` \| `exclusion` \| `hue` \| `saturation` \| `color` \| `luminosity` \| `add` | `"normal"` | ui dropdown |
| `perspective` | `number` | `0` | animatable; range 0..∞; unit px |
| `z` | `number` | `0` | Stacking override among siblings.; step 1 |
| `enter` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Entrance motion at the start of the layer. |
| `exit` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Exit motion ending at the end of the layer. |

```ts
export interface AdjustmentProps {
  /** Stable unique id. Written back as fm_… when missing. */
  id?: string;
  label?: string;
  /** Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s */
  start?: Time;
  /** Defaults to the rest of the parent.; unit s */
  duration?: Time;
  /** Alternative to duration.; unit s */
  end?: Time;
  /** default false */
  hidden?: boolean;
  /** Link group id: linked clips move, trim and split together. */
  link?: string;
  /** unit px; default [0,0,0] */
  position?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0,0] */
  rotation?: Animatable<number | Vec2 | Vec3>;
  /** default [1,1,1] */
  scale?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0] */
  skew?: Animatable<number | Vec2>;
  /** Transform origin as % of the layer box (z in px).; unit %; default [50,50,0] */
  anchor?: Animatable<number | Vec2 | Vec3>;
  /** range 0..1; default 1 */
  opacity?: Animatable<number>;
  crop?: { top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> };
  /** default "none" */
  flip?: "none" | "x" | "y" | "xy";
  /** default "normal" */
  blend?: "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | "color-burn" | "soft-light" | "hard-light" | "difference" | "exclusion" | "hue" | "saturation" | "color" | "luminosity" | "add";
  /** range 0..∞; unit px; default 0 */
  perspective?: Animatable<number>;
  /** Stacking override among siblings.; default 0 */
  z?: number;
  /** Entrance motion at the start of the layer. */
  enter?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  /** Exit motion ending at the end of the layer. */
  exit?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  children?: unknown;
}
```

---

# Fonts

*component, category: typography*

Container declaring every font the project uses. Renders never touch the network.

Children: Font.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  | Stable unique id. Written back as fm_… when missing. |
| `allowSystem` | `boolean` | `false` | Permit system fonts (output differs per machine). |

```ts
export interface FontsProps {
  /** Stable unique id. Written back as fm_… when missing. */
  id?: string;
  /** Permit system fonts (output differs per machine).; default false */
  allowSystem?: boolean;
  children?: unknown;
}
```

---

# Font

*component, category: typography*

A font. `source` is "google", "system", a project path (./fonts/X.woff2) or a URL. Path and URL sources need a `license`.

Children: none.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  |  |
| `family` | `string` |  |  |
| `source` | `string` | `"google"` | "google" | "system" | "./fonts/File.woff2" | "https://…" |
| `weights` | `number[]` |  |  |
| `styles` | `"normal" | "italic" | "oblique"[]` |  |  |
| `variable` | `boolean` | `false` |  |
| `axes` | `unknown` |  |  |
| `subsets` | `string[]` |  |  |
| `unicodeRange` | `string` |  |  |
| `fallback` | `string[]` |  |  |
| `license` | `string` |  | SPDX-ish licence id; required for path and URL sources. |

```ts
export interface FontProps {
  id?: string;
  family?: string;
  /** "google" | "system" | "./fonts/File.woff2" | "https://…"; default "google" */
  source?: string;
  weights?: number[];
  styles?: "normal" | "italic" | "oblique"[];
  /** default false */
  variable?: boolean;
  axes?: unknown;
  subsets?: string[];
  unicodeRange?: string;
  fallback?: string[];
  /** SPDX-ish licence id; required for path and URL sources. */
  license?: string;
  children?: unknown;
}
```

---

# Keyframes

*component, category: motion*

Element form of keyframes: animates `prop` of its parent. Same as writing the prop as a keyframe array.

Children: none.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  |  |
| `prop` | `string` |  | Parent prop name, e.g. position. |
| `values` | `unknown` |  |  |
| `keys` | `string` |  | Sidecar reference, e.g. "./promo.keys.json#t1.position". |
| `mode` | `linear` \| `hold` \| `bezier` \| `auto` \| `continuous` \| `ease` |  |  |
| `spatial` | `linear` \| `bezier` \| `auto` |  |  |
| `orient` | `path` |  |  |
| `separate` | `boolean` | `false` |  |
| `loop` | `unknown` |  |  |

```ts
export interface KeyframesProps {
  id?: string;
  /** Parent prop name, e.g. position. */
  prop?: string;
  values?: unknown;
  /** Sidecar reference, e.g. "./promo.keys.json#t1.position". */
  keys?: string;
  mode?: "linear" | "hold" | "bezier" | "auto" | "continuous" | "ease";
  spatial?: "linear" | "bezier" | "auto";
  orient?: "path";
  /** default false */
  separate?: boolean;
  loop?: unknown;
  children?: unknown;
}
```

---

# Stagger

*component, category: motion*

Offsets each child's start by `each` seconds in order (or from the end / center / edges). Children keep their own durations.

Children: any layers and effects.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  | Stable unique id. Written back as fm_… when missing. |
| `label` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s |
| `duration` | `Time` |  | Defaults to the rest of the parent.; unit s |
| `end` | `Time` |  | Alternative to duration.; unit s |
| `hidden` | `boolean` | `false` |  |
| `link` | `string` |  | Link group id: linked clips move, trim and split together. |
| `position` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit px; ui vec |
| `rotation` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit deg; ui vec |
| `scale` | `number | Vec2 | Vec3` | `[1,1,1]` | animatable; step 0.01; ui vec |
| `skew` | `number | Vec2` | `[0,0]` | animatable; unit deg; ui vec |
| `anchor` | `number | Vec2 | Vec3` | `[50,50,0]` | Transform origin as % of the layer box (z in px).; animatable; unit %; ui vec |
| `opacity` | `number` | `1` | animatable; range 0..1; step 0.01; ui slider |
| `crop` | `{ top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> }` |  |  |
| `flip` | `none` \| `x` \| `y` \| `xy` | `"none"` |  |
| `blend` | `normal` \| `multiply` \| `screen` \| `overlay` \| `darken` \| `lighten` \| `color-dodge` \| `color-burn` \| `soft-light` \| `hard-light` \| `difference` \| `exclusion` \| `hue` \| `saturation` \| `color` \| `luminosity` \| `add` | `"normal"` | ui dropdown |
| `perspective` | `number` | `0` | animatable; range 0..∞; unit px |
| `z` | `number` | `0` | Stacking override among siblings.; step 1 |
| `enter` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Entrance motion at the start of the layer. |
| `exit` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Exit motion ending at the end of the layer. |
| `each` | `Time` | `0.08` | unit s |
| `from` | `start` \| `end` \| `center` \| `edges` | `"start"` |  |

```ts
export interface StaggerProps {
  /** Stable unique id. Written back as fm_… when missing. */
  id?: string;
  label?: string;
  /** Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s */
  start?: Time;
  /** Defaults to the rest of the parent.; unit s */
  duration?: Time;
  /** Alternative to duration.; unit s */
  end?: Time;
  /** default false */
  hidden?: boolean;
  /** Link group id: linked clips move, trim and split together. */
  link?: string;
  /** unit px; default [0,0,0] */
  position?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0,0] */
  rotation?: Animatable<number | Vec2 | Vec3>;
  /** default [1,1,1] */
  scale?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0] */
  skew?: Animatable<number | Vec2>;
  /** Transform origin as % of the layer box (z in px).; unit %; default [50,50,0] */
  anchor?: Animatable<number | Vec2 | Vec3>;
  /** range 0..1; default 1 */
  opacity?: Animatable<number>;
  crop?: { top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> };
  /** default "none" */
  flip?: "none" | "x" | "y" | "xy";
  /** default "normal" */
  blend?: "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | "color-burn" | "soft-light" | "hard-light" | "difference" | "exclusion" | "hue" | "saturation" | "color" | "luminosity" | "add";
  /** range 0..∞; unit px; default 0 */
  perspective?: Animatable<number>;
  /** Stacking override among siblings.; default 0 */
  z?: number;
  /** Entrance motion at the start of the layer. */
  enter?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  /** Exit motion ending at the end of the layer. */
  exit?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  /** unit s; default 0.08 */
  each?: Time;
  /** default "start" */
  from?: "start" | "end" | "center" | "edges";
  children?: unknown;
}
```

---

# Rect

*component, category: shapes*

A rectangle with solid, gradient or image fill and an optional stroke.

Children: effects only.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  | Stable unique id. Written back as fm_… when missing. |
| `label` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s |
| `duration` | `Time` |  | Defaults to the rest of the parent.; unit s |
| `end` | `Time` |  | Alternative to duration.; unit s |
| `hidden` | `boolean` | `false` |  |
| `link` | `string` |  | Link group id: linked clips move, trim and split together. |
| `position` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit px; ui vec |
| `rotation` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit deg; ui vec |
| `scale` | `number | Vec2 | Vec3` | `[1,1,1]` | animatable; step 0.01; ui vec |
| `skew` | `number | Vec2` | `[0,0]` | animatable; unit deg; ui vec |
| `anchor` | `number | Vec2 | Vec3` | `[50,50,0]` | Transform origin as % of the layer box (z in px).; animatable; unit %; ui vec |
| `opacity` | `number` | `1` | animatable; range 0..1; step 0.01; ui slider |
| `crop` | `{ top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> }` |  |  |
| `flip` | `none` \| `x` \| `y` \| `xy` | `"none"` |  |
| `blend` | `normal` \| `multiply` \| `screen` \| `overlay` \| `darken` \| `lighten` \| `color-dodge` \| `color-burn` \| `soft-light` \| `hard-light` \| `difference` \| `exclusion` \| `hue` \| `saturation` \| `color` \| `luminosity` \| `add` | `"normal"` | ui dropdown |
| `perspective` | `number` | `0` | animatable; range 0..∞; unit px |
| `z` | `number` | `0` | Stacking override among siblings.; step 1 |
| `enter` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Entrance motion at the start of the layer. |
| `exit` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Exit motion ending at the end of the layer. |
| `at` | `unknown` | `"center"` | Placement: center | top | bottom | left | right | top-left | top-right | bottom-left | bottom-right or [x, y] (px, %, vw, vh) from the top-left. |
| `width` | `Length` | `300` |  |
| `height` | `Length` | `200` |  |
| `fill` | `Fill` | `"#ffffff"` |  |
| `radius` | `Length` | `0` | Corner radius (px or %). |
| `stroke` | `{ width?: number; color?: Color; align?: "inside" | "center" | "outside"; cap?: "butt" | "round" | "square"; join?: "miter" | "round" | "bevel"; dash?: number[] }` |  |  |

```ts
export interface RectProps {
  /** Stable unique id. Written back as fm_… when missing. */
  id?: string;
  label?: string;
  /** Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s */
  start?: Time;
  /** Defaults to the rest of the parent.; unit s */
  duration?: Time;
  /** Alternative to duration.; unit s */
  end?: Time;
  /** default false */
  hidden?: boolean;
  /** Link group id: linked clips move, trim and split together. */
  link?: string;
  /** unit px; default [0,0,0] */
  position?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0,0] */
  rotation?: Animatable<number | Vec2 | Vec3>;
  /** default [1,1,1] */
  scale?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0] */
  skew?: Animatable<number | Vec2>;
  /** Transform origin as % of the layer box (z in px).; unit %; default [50,50,0] */
  anchor?: Animatable<number | Vec2 | Vec3>;
  /** range 0..1; default 1 */
  opacity?: Animatable<number>;
  crop?: { top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> };
  /** default "none" */
  flip?: "none" | "x" | "y" | "xy";
  /** default "normal" */
  blend?: "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | "color-burn" | "soft-light" | "hard-light" | "difference" | "exclusion" | "hue" | "saturation" | "color" | "luminosity" | "add";
  /** range 0..∞; unit px; default 0 */
  perspective?: Animatable<number>;
  /** Stacking override among siblings.; default 0 */
  z?: number;
  /** Entrance motion at the start of the layer. */
  enter?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  /** Exit motion ending at the end of the layer. */
  exit?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  /** Placement: center | top | bottom | left | right | top-left | top-right | bottom-left | bottom-right or [x, y] (px, %, vw, vh) from the top-left.; default "center" */
  at?: unknown;
  /** default 300 */
  width?: Length;
  /** default 200 */
  height?: Length;
  /** default "#ffffff" */
  fill?: Fill;
  /** Corner radius (px or %).; default 0 */
  radius?: Length;
  stroke?: { width?: number; color?: Color; align?: "inside" | "center" | "outside"; cap?: "butt" | "round" | "square"; join?: "miter" | "round" | "bevel"; dash?: number[] };
  children?: unknown;
}
```

---

# RoundRect

*component, category: shapes*

A rounded rectangle (default radius 24 px).

Children: effects only.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  | Stable unique id. Written back as fm_… when missing. |
| `label` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s |
| `duration` | `Time` |  | Defaults to the rest of the parent.; unit s |
| `end` | `Time` |  | Alternative to duration.; unit s |
| `hidden` | `boolean` | `false` |  |
| `link` | `string` |  | Link group id: linked clips move, trim and split together. |
| `position` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit px; ui vec |
| `rotation` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit deg; ui vec |
| `scale` | `number | Vec2 | Vec3` | `[1,1,1]` | animatable; step 0.01; ui vec |
| `skew` | `number | Vec2` | `[0,0]` | animatable; unit deg; ui vec |
| `anchor` | `number | Vec2 | Vec3` | `[50,50,0]` | Transform origin as % of the layer box (z in px).; animatable; unit %; ui vec |
| `opacity` | `number` | `1` | animatable; range 0..1; step 0.01; ui slider |
| `crop` | `{ top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> }` |  |  |
| `flip` | `none` \| `x` \| `y` \| `xy` | `"none"` |  |
| `blend` | `normal` \| `multiply` \| `screen` \| `overlay` \| `darken` \| `lighten` \| `color-dodge` \| `color-burn` \| `soft-light` \| `hard-light` \| `difference` \| `exclusion` \| `hue` \| `saturation` \| `color` \| `luminosity` \| `add` | `"normal"` | ui dropdown |
| `perspective` | `number` | `0` | animatable; range 0..∞; unit px |
| `z` | `number` | `0` | Stacking override among siblings.; step 1 |
| `enter` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Entrance motion at the start of the layer. |
| `exit` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Exit motion ending at the end of the layer. |
| `at` | `unknown` | `"center"` | Placement: center | top | bottom | left | right | top-left | top-right | bottom-left | bottom-right or [x, y] (px, %, vw, vh) from the top-left. |
| `width` | `Length` | `300` |  |
| `height` | `Length` | `200` |  |
| `fill` | `Fill` | `"#ffffff"` |  |
| `radius` | `Length` | `24` | Corner radius (px or %). |
| `stroke` | `{ width?: number; color?: Color; align?: "inside" | "center" | "outside"; cap?: "butt" | "round" | "square"; join?: "miter" | "round" | "bevel"; dash?: number[] }` |  |  |

```ts
export interface RoundRectProps {
  /** Stable unique id. Written back as fm_… when missing. */
  id?: string;
  label?: string;
  /** Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s */
  start?: Time;
  /** Defaults to the rest of the parent.; unit s */
  duration?: Time;
  /** Alternative to duration.; unit s */
  end?: Time;
  /** default false */
  hidden?: boolean;
  /** Link group id: linked clips move, trim and split together. */
  link?: string;
  /** unit px; default [0,0,0] */
  position?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0,0] */
  rotation?: Animatable<number | Vec2 | Vec3>;
  /** default [1,1,1] */
  scale?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0] */
  skew?: Animatable<number | Vec2>;
  /** Transform origin as % of the layer box (z in px).; unit %; default [50,50,0] */
  anchor?: Animatable<number | Vec2 | Vec3>;
  /** range 0..1; default 1 */
  opacity?: Animatable<number>;
  crop?: { top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> };
  /** default "none" */
  flip?: "none" | "x" | "y" | "xy";
  /** default "normal" */
  blend?: "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | "color-burn" | "soft-light" | "hard-light" | "difference" | "exclusion" | "hue" | "saturation" | "color" | "luminosity" | "add";
  /** range 0..∞; unit px; default 0 */
  perspective?: Animatable<number>;
  /** Stacking override among siblings.; default 0 */
  z?: number;
  /** Entrance motion at the start of the layer. */
  enter?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  /** Exit motion ending at the end of the layer. */
  exit?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  /** Placement: center | top | bottom | left | right | top-left | top-right | bottom-left | bottom-right or [x, y] (px, %, vw, vh) from the top-left.; default "center" */
  at?: unknown;
  /** default 300 */
  width?: Length;
  /** default 200 */
  height?: Length;
  /** default "#ffffff" */
  fill?: Fill;
  /** Corner radius (px or %).; default 24 */
  radius?: Length;
  stroke?: { width?: number; color?: Color; align?: "inside" | "center" | "outside"; cap?: "butt" | "round" | "square"; join?: "miter" | "round" | "bevel"; dash?: number[] };
  children?: unknown;
}
```

---

# Circle

*component, category: shapes*

A circle (or ellipse when width and height differ).

Children: effects only.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  | Stable unique id. Written back as fm_… when missing. |
| `label` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s |
| `duration` | `Time` |  | Defaults to the rest of the parent.; unit s |
| `end` | `Time` |  | Alternative to duration.; unit s |
| `hidden` | `boolean` | `false` |  |
| `link` | `string` |  | Link group id: linked clips move, trim and split together. |
| `position` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit px; ui vec |
| `rotation` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit deg; ui vec |
| `scale` | `number | Vec2 | Vec3` | `[1,1,1]` | animatable; step 0.01; ui vec |
| `skew` | `number | Vec2` | `[0,0]` | animatable; unit deg; ui vec |
| `anchor` | `number | Vec2 | Vec3` | `[50,50,0]` | Transform origin as % of the layer box (z in px).; animatable; unit %; ui vec |
| `opacity` | `number` | `1` | animatable; range 0..1; step 0.01; ui slider |
| `crop` | `{ top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> }` |  |  |
| `flip` | `none` \| `x` \| `y` \| `xy` | `"none"` |  |
| `blend` | `normal` \| `multiply` \| `screen` \| `overlay` \| `darken` \| `lighten` \| `color-dodge` \| `color-burn` \| `soft-light` \| `hard-light` \| `difference` \| `exclusion` \| `hue` \| `saturation` \| `color` \| `luminosity` \| `add` | `"normal"` | ui dropdown |
| `perspective` | `number` | `0` | animatable; range 0..∞; unit px |
| `z` | `number` | `0` | Stacking override among siblings.; step 1 |
| `enter` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Entrance motion at the start of the layer. |
| `exit` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Exit motion ending at the end of the layer. |
| `at` | `unknown` | `"center"` | Placement: center | top | bottom | left | right | top-left | top-right | bottom-left | bottom-right or [x, y] (px, %, vw, vh) from the top-left. |
| `width` | `Length` | `200` | Diameter (width). |
| `height` | `Length` |  | Defaults to width. |
| `fill` | `Fill` | `"#ffffff"` |  |
| `stroke` | `{ width?: number; color?: Color; align?: "inside" | "center" | "outside"; cap?: "butt" | "round" | "square"; join?: "miter" | "round" | "bevel"; dash?: number[] }` |  |  |

```ts
export interface CircleProps {
  /** Stable unique id. Written back as fm_… when missing. */
  id?: string;
  label?: string;
  /** Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s */
  start?: Time;
  /** Defaults to the rest of the parent.; unit s */
  duration?: Time;
  /** Alternative to duration.; unit s */
  end?: Time;
  /** default false */
  hidden?: boolean;
  /** Link group id: linked clips move, trim and split together. */
  link?: string;
  /** unit px; default [0,0,0] */
  position?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0,0] */
  rotation?: Animatable<number | Vec2 | Vec3>;
  /** default [1,1,1] */
  scale?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0] */
  skew?: Animatable<number | Vec2>;
  /** Transform origin as % of the layer box (z in px).; unit %; default [50,50,0] */
  anchor?: Animatable<number | Vec2 | Vec3>;
  /** range 0..1; default 1 */
  opacity?: Animatable<number>;
  crop?: { top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> };
  /** default "none" */
  flip?: "none" | "x" | "y" | "xy";
  /** default "normal" */
  blend?: "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | "color-burn" | "soft-light" | "hard-light" | "difference" | "exclusion" | "hue" | "saturation" | "color" | "luminosity" | "add";
  /** range 0..∞; unit px; default 0 */
  perspective?: Animatable<number>;
  /** Stacking override among siblings.; default 0 */
  z?: number;
  /** Entrance motion at the start of the layer. */
  enter?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  /** Exit motion ending at the end of the layer. */
  exit?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  /** Placement: center | top | bottom | left | right | top-left | top-right | bottom-left | bottom-right or [x, y] (px, %, vw, vh) from the top-left.; default "center" */
  at?: unknown;
  /** Diameter (width).; default 200 */
  width?: Length;
  /** Defaults to width. */
  height?: Length;
  /** default "#ffffff" */
  fill?: Fill;
  stroke?: { width?: number; color?: Color; align?: "inside" | "center" | "outside"; cap?: "butt" | "round" | "square"; join?: "miter" | "round" | "bevel"; dash?: number[] };
  children?: unknown;
}
```

---

# Line

*component, category: shapes*

A line from one point to another. `trim` draws it on.

Children: effects only.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  | Stable unique id. Written back as fm_… when missing. |
| `label` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s |
| `duration` | `Time` |  | Defaults to the rest of the parent.; unit s |
| `end` | `Time` |  | Alternative to duration.; unit s |
| `hidden` | `boolean` | `false` |  |
| `link` | `string` |  | Link group id: linked clips move, trim and split together. |
| `position` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit px; ui vec |
| `rotation` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit deg; ui vec |
| `scale` | `number | Vec2 | Vec3` | `[1,1,1]` | animatable; step 0.01; ui vec |
| `skew` | `number | Vec2` | `[0,0]` | animatable; unit deg; ui vec |
| `anchor` | `number | Vec2 | Vec3` | `[50,50,0]` | Transform origin as % of the layer box (z in px).; animatable; unit %; ui vec |
| `opacity` | `number` | `1` | animatable; range 0..1; step 0.01; ui slider |
| `crop` | `{ top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> }` |  |  |
| `flip` | `none` \| `x` \| `y` \| `xy` | `"none"` |  |
| `blend` | `normal` \| `multiply` \| `screen` \| `overlay` \| `darken` \| `lighten` \| `color-dodge` \| `color-burn` \| `soft-light` \| `hard-light` \| `difference` \| `exclusion` \| `hue` \| `saturation` \| `color` \| `luminosity` \| `add` | `"normal"` | ui dropdown |
| `perspective` | `number` | `0` | animatable; range 0..∞; unit px |
| `z` | `number` | `0` | Stacking override among siblings.; step 1 |
| `enter` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Entrance motion at the start of the layer. |
| `exit` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Exit motion ending at the end of the layer. |
| `from` | `number | Vec2` | `[0,0]` | animatable; unit px |
| `to` | `number | Vec2` | `[300,0]` | animatable; unit px |
| `width` | `number` | `6` | range 0..200; unit px |
| `color` | `Color` | `"#ffffff"` |  |
| `cap` | `butt` \| `round` \| `square` | `"round"` |  |
| `trimStart` | `number` | `0` | animatable; range 0..1 |
| `trimEnd` | `number` | `1` | animatable; range 0..1 |

```ts
export interface LineProps {
  /** Stable unique id. Written back as fm_… when missing. */
  id?: string;
  label?: string;
  /** Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s */
  start?: Time;
  /** Defaults to the rest of the parent.; unit s */
  duration?: Time;
  /** Alternative to duration.; unit s */
  end?: Time;
  /** default false */
  hidden?: boolean;
  /** Link group id: linked clips move, trim and split together. */
  link?: string;
  /** unit px; default [0,0,0] */
  position?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0,0] */
  rotation?: Animatable<number | Vec2 | Vec3>;
  /** default [1,1,1] */
  scale?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0] */
  skew?: Animatable<number | Vec2>;
  /** Transform origin as % of the layer box (z in px).; unit %; default [50,50,0] */
  anchor?: Animatable<number | Vec2 | Vec3>;
  /** range 0..1; default 1 */
  opacity?: Animatable<number>;
  crop?: { top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> };
  /** default "none" */
  flip?: "none" | "x" | "y" | "xy";
  /** default "normal" */
  blend?: "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | "color-burn" | "soft-light" | "hard-light" | "difference" | "exclusion" | "hue" | "saturation" | "color" | "luminosity" | "add";
  /** range 0..∞; unit px; default 0 */
  perspective?: Animatable<number>;
  /** Stacking override among siblings.; default 0 */
  z?: number;
  /** Entrance motion at the start of the layer. */
  enter?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  /** Exit motion ending at the end of the layer. */
  exit?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  /** unit px; default [0,0] */
  from?: Animatable<number | Vec2>;
  /** unit px; default [300,0] */
  to?: Animatable<number | Vec2>;
  /** range 0..200; unit px; default 6 */
  width?: number;
  /** default "#ffffff" */
  color?: Color;
  /** default "round" */
  cap?: "butt" | "round" | "square";
  /** range 0..1; default 0 */
  trimStart?: Animatable<number>;
  /** range 0..1; default 1 */
  trimEnd?: Animatable<number>;
  children?: unknown;
}
```

---

# Polygon

*component, category: shapes*

A polygon from explicit `points`, or a regular polygon with `sides` and `radius`.

Children: effects only.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  | Stable unique id. Written back as fm_… when missing. |
| `label` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s |
| `duration` | `Time` |  | Defaults to the rest of the parent.; unit s |
| `end` | `Time` |  | Alternative to duration.; unit s |
| `hidden` | `boolean` | `false` |  |
| `link` | `string` |  | Link group id: linked clips move, trim and split together. |
| `position` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit px; ui vec |
| `rotation` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit deg; ui vec |
| `scale` | `number | Vec2 | Vec3` | `[1,1,1]` | animatable; step 0.01; ui vec |
| `skew` | `number | Vec2` | `[0,0]` | animatable; unit deg; ui vec |
| `anchor` | `number | Vec2 | Vec3` | `[50,50,0]` | Transform origin as % of the layer box (z in px).; animatable; unit %; ui vec |
| `opacity` | `number` | `1` | animatable; range 0..1; step 0.01; ui slider |
| `crop` | `{ top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> }` |  |  |
| `flip` | `none` \| `x` \| `y` \| `xy` | `"none"` |  |
| `blend` | `normal` \| `multiply` \| `screen` \| `overlay` \| `darken` \| `lighten` \| `color-dodge` \| `color-burn` \| `soft-light` \| `hard-light` \| `difference` \| `exclusion` \| `hue` \| `saturation` \| `color` \| `luminosity` \| `add` | `"normal"` | ui dropdown |
| `perspective` | `number` | `0` | animatable; range 0..∞; unit px |
| `z` | `number` | `0` | Stacking override among siblings.; step 1 |
| `enter` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Entrance motion at the start of the layer. |
| `exit` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Exit motion ending at the end of the layer. |
| `at` | `unknown` | `"center"` | Placement: center | top | bottom | left | right | top-left | top-right | bottom-left | bottom-right or [x, y] (px, %, vw, vh) from the top-left. |
| `points` | `number | Vec2[]` |  |  |
| `sides` | `number` | `6` | range 3..64; step 1 |
| `radius` | `number` | `100` | range 1..∞; unit px |
| `rotation0` | `number` | `-90` | Angle of the first vertex.; unit deg |
| `fill` | `Fill` | `"#ffffff"` |  |
| `stroke` | `{ width?: number; color?: Color; align?: "inside" | "center" | "outside"; cap?: "butt" | "round" | "square"; join?: "miter" | "round" | "bevel"; dash?: number[] }` |  |  |

```ts
export interface PolygonProps {
  /** Stable unique id. Written back as fm_… when missing. */
  id?: string;
  label?: string;
  /** Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s */
  start?: Time;
  /** Defaults to the rest of the parent.; unit s */
  duration?: Time;
  /** Alternative to duration.; unit s */
  end?: Time;
  /** default false */
  hidden?: boolean;
  /** Link group id: linked clips move, trim and split together. */
  link?: string;
  /** unit px; default [0,0,0] */
  position?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0,0] */
  rotation?: Animatable<number | Vec2 | Vec3>;
  /** default [1,1,1] */
  scale?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0] */
  skew?: Animatable<number | Vec2>;
  /** Transform origin as % of the layer box (z in px).; unit %; default [50,50,0] */
  anchor?: Animatable<number | Vec2 | Vec3>;
  /** range 0..1; default 1 */
  opacity?: Animatable<number>;
  crop?: { top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> };
  /** default "none" */
  flip?: "none" | "x" | "y" | "xy";
  /** default "normal" */
  blend?: "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | "color-burn" | "soft-light" | "hard-light" | "difference" | "exclusion" | "hue" | "saturation" | "color" | "luminosity" | "add";
  /** range 0..∞; unit px; default 0 */
  perspective?: Animatable<number>;
  /** Stacking override among siblings.; default 0 */
  z?: number;
  /** Entrance motion at the start of the layer. */
  enter?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  /** Exit motion ending at the end of the layer. */
  exit?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  /** Placement: center | top | bottom | left | right | top-left | top-right | bottom-left | bottom-right or [x, y] (px, %, vw, vh) from the top-left.; default "center" */
  at?: unknown;
  points?: number | Vec2[];
  /** range 3..64; default 6 */
  sides?: number;
  /** range 1..∞; unit px; default 100 */
  radius?: number;
  /** Angle of the first vertex.; unit deg; default -90 */
  rotation0?: number;
  /** default "#ffffff" */
  fill?: Fill;
  stroke?: { width?: number; color?: Color; align?: "inside" | "center" | "outside"; cap?: "butt" | "round" | "square"; join?: "miter" | "round" | "bevel"; dash?: number[] };
  children?: unknown;
}
```

---

# Path

*component, category: shapes*

An SVG path in its own viewBox. `trimStart`/`trimEnd` animate a draw-on.

Children: effects only.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  | Stable unique id. Written back as fm_… when missing. |
| `label` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s |
| `duration` | `Time` |  | Defaults to the rest of the parent.; unit s |
| `end` | `Time` |  | Alternative to duration.; unit s |
| `hidden` | `boolean` | `false` |  |
| `link` | `string` |  | Link group id: linked clips move, trim and split together. |
| `position` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit px; ui vec |
| `rotation` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit deg; ui vec |
| `scale` | `number | Vec2 | Vec3` | `[1,1,1]` | animatable; step 0.01; ui vec |
| `skew` | `number | Vec2` | `[0,0]` | animatable; unit deg; ui vec |
| `anchor` | `number | Vec2 | Vec3` | `[50,50,0]` | Transform origin as % of the layer box (z in px).; animatable; unit %; ui vec |
| `opacity` | `number` | `1` | animatable; range 0..1; step 0.01; ui slider |
| `crop` | `{ top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> }` |  |  |
| `flip` | `none` \| `x` \| `y` \| `xy` | `"none"` |  |
| `blend` | `normal` \| `multiply` \| `screen` \| `overlay` \| `darken` \| `lighten` \| `color-dodge` \| `color-burn` \| `soft-light` \| `hard-light` \| `difference` \| `exclusion` \| `hue` \| `saturation` \| `color` \| `luminosity` \| `add` | `"normal"` | ui dropdown |
| `perspective` | `number` | `0` | animatable; range 0..∞; unit px |
| `z` | `number` | `0` | Stacking override among siblings.; step 1 |
| `enter` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Entrance motion at the start of the layer. |
| `exit` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Exit motion ending at the end of the layer. |
| `at` | `unknown` | `"center"` | Placement: center | top | bottom | left | right | top-left | top-right | bottom-left | bottom-right or [x, y] (px, %, vw, vh) from the top-left. |
| `d` | `string` |  | SVG path data. |
| `viewBox` | `string` | `"0 0 100 100"` |  |
| `width` | `Length` | `300` |  |
| `height` | `Length` | `300` |  |
| `fill` | `Fill` | `"none"` |  |
| `stroke` | `{ width?: number; color?: Color; align?: "inside" | "center" | "outside"; cap?: "butt" | "round" | "square"; join?: "miter" | "round" | "bevel"; dash?: number[] }` |  |  |
| `trimStart` | `number` | `0` | animatable; range 0..1 |
| `trimEnd` | `number` | `1` | animatable; range 0..1 |

```ts
export interface PathProps {
  /** Stable unique id. Written back as fm_… when missing. */
  id?: string;
  label?: string;
  /** Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s */
  start?: Time;
  /** Defaults to the rest of the parent.; unit s */
  duration?: Time;
  /** Alternative to duration.; unit s */
  end?: Time;
  /** default false */
  hidden?: boolean;
  /** Link group id: linked clips move, trim and split together. */
  link?: string;
  /** unit px; default [0,0,0] */
  position?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0,0] */
  rotation?: Animatable<number | Vec2 | Vec3>;
  /** default [1,1,1] */
  scale?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0] */
  skew?: Animatable<number | Vec2>;
  /** Transform origin as % of the layer box (z in px).; unit %; default [50,50,0] */
  anchor?: Animatable<number | Vec2 | Vec3>;
  /** range 0..1; default 1 */
  opacity?: Animatable<number>;
  crop?: { top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> };
  /** default "none" */
  flip?: "none" | "x" | "y" | "xy";
  /** default "normal" */
  blend?: "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | "color-burn" | "soft-light" | "hard-light" | "difference" | "exclusion" | "hue" | "saturation" | "color" | "luminosity" | "add";
  /** range 0..∞; unit px; default 0 */
  perspective?: Animatable<number>;
  /** Stacking override among siblings.; default 0 */
  z?: number;
  /** Entrance motion at the start of the layer. */
  enter?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  /** Exit motion ending at the end of the layer. */
  exit?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  /** Placement: center | top | bottom | left | right | top-left | top-right | bottom-left | bottom-right or [x, y] (px, %, vw, vh) from the top-left.; default "center" */
  at?: unknown;
  /** SVG path data. */
  d?: string;
  /** default "0 0 100 100" */
  viewBox?: string;
  /** default 300 */
  width?: Length;
  /** default 300 */
  height?: Length;
  /** default "none" */
  fill?: Fill;
  stroke?: { width?: number; color?: Color; align?: "inside" | "center" | "outside"; cap?: "butt" | "round" | "square"; join?: "miter" | "round" | "bevel"; dash?: number[] };
  /** range 0..1; default 0 */
  trimStart?: Animatable<number>;
  /** range 0..1; default 1 */
  trimEnd?: Animatable<number>;
  children?: unknown;
}
```

---

# Svg

*component, category: shapes*

Inline SVG markup or an SVG file, sized to a box.

Children: effects only.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  | Stable unique id. Written back as fm_… when missing. |
| `label` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s |
| `duration` | `Time` |  | Defaults to the rest of the parent.; unit s |
| `end` | `Time` |  | Alternative to duration.; unit s |
| `hidden` | `boolean` | `false` |  |
| `link` | `string` |  | Link group id: linked clips move, trim and split together. |
| `position` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit px; ui vec |
| `rotation` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit deg; ui vec |
| `scale` | `number | Vec2 | Vec3` | `[1,1,1]` | animatable; step 0.01; ui vec |
| `skew` | `number | Vec2` | `[0,0]` | animatable; unit deg; ui vec |
| `anchor` | `number | Vec2 | Vec3` | `[50,50,0]` | Transform origin as % of the layer box (z in px).; animatable; unit %; ui vec |
| `opacity` | `number` | `1` | animatable; range 0..1; step 0.01; ui slider |
| `crop` | `{ top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> }` |  |  |
| `flip` | `none` \| `x` \| `y` \| `xy` | `"none"` |  |
| `blend` | `normal` \| `multiply` \| `screen` \| `overlay` \| `darken` \| `lighten` \| `color-dodge` \| `color-burn` \| `soft-light` \| `hard-light` \| `difference` \| `exclusion` \| `hue` \| `saturation` \| `color` \| `luminosity` \| `add` | `"normal"` | ui dropdown |
| `perspective` | `number` | `0` | animatable; range 0..∞; unit px |
| `z` | `number` | `0` | Stacking override among siblings.; step 1 |
| `enter` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Entrance motion at the start of the layer. |
| `exit` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Exit motion ending at the end of the layer. |
| `at` | `unknown` | `"center"` | Placement: center | top | bottom | left | right | top-left | top-right | bottom-left | bottom-right or [x, y] (px, %, vw, vh) from the top-left. |
| `markup` | `string` |  | Inline <svg> markup. |
| `src` | `string` |  | Path to an .svg file in the project. |
| `width` | `Length` | `300` |  |
| `height` | `Length` | `300` |  |

```ts
export interface SvgProps {
  /** Stable unique id. Written back as fm_… when missing. */
  id?: string;
  label?: string;
  /** Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s */
  start?: Time;
  /** Defaults to the rest of the parent.; unit s */
  duration?: Time;
  /** Alternative to duration.; unit s */
  end?: Time;
  /** default false */
  hidden?: boolean;
  /** Link group id: linked clips move, trim and split together. */
  link?: string;
  /** unit px; default [0,0,0] */
  position?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0,0] */
  rotation?: Animatable<number | Vec2 | Vec3>;
  /** default [1,1,1] */
  scale?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0] */
  skew?: Animatable<number | Vec2>;
  /** Transform origin as % of the layer box (z in px).; unit %; default [50,50,0] */
  anchor?: Animatable<number | Vec2 | Vec3>;
  /** range 0..1; default 1 */
  opacity?: Animatable<number>;
  crop?: { top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> };
  /** default "none" */
  flip?: "none" | "x" | "y" | "xy";
  /** default "normal" */
  blend?: "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | "color-burn" | "soft-light" | "hard-light" | "difference" | "exclusion" | "hue" | "saturation" | "color" | "luminosity" | "add";
  /** range 0..∞; unit px; default 0 */
  perspective?: Animatable<number>;
  /** Stacking override among siblings.; default 0 */
  z?: number;
  /** Entrance motion at the start of the layer. */
  enter?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  /** Exit motion ending at the end of the layer. */
  exit?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  /** Placement: center | top | bottom | left | right | top-left | top-right | bottom-left | bottom-right or [x, y] (px, %, vw, vh) from the top-left.; default "center" */
  at?: unknown;
  /** Inline <svg> markup. */
  markup?: string;
  /** Path to an .svg file in the project. */
  src?: string;
  /** default 300 */
  width?: Length;
  /** default 300 */
  height?: Length;
  children?: unknown;
}
```

---

# Mask

*effect, category: shapes*

Masks its parent layer with a shape. Geometry is a fraction of the layer box (0..1), so size 0 to 1 reveals the whole layer. Implemented as a CSS mask image.

Children: none.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent layer.; unit s |
| `duration` | `Time` |  | unit s |
| `enabled` | `boolean` | `true` |  |
| `shape` | `rect` \| `roundrect` \| `ellipse` | `"rect"` |  |
| `center` | `number | Vec2` | `[0.5,0.5]` | animatable; step 0.01; unit box |
| `size` | `number | Vec2` | `[1,1]` | animatable; step 0.01; unit box |
| `radius` | `number` | `0.1` | animatable; range 0..0.5; step 0.01; unit box |
| `feather` | `number` | `0` | Edge softness.; animatable; range 0..0.5; step 0.005; unit box |
| `invert` | `boolean` | `false` |  |
| `mode` | `alpha` \| `luma` | `"alpha"` | Read the mask's alpha or its luminance. |

```ts
export interface MaskProps {
  id?: string;
  /** Start relative to the parent layer.; unit s */
  start?: Time;
  /** unit s */
  duration?: Time;
  /** default true */
  enabled?: boolean;
  /** default "rect" */
  shape?: "rect" | "roundrect" | "ellipse";
  /** unit box; default [0.5,0.5] */
  center?: Animatable<number | Vec2>;
  /** unit box; default [1,1] */
  size?: Animatable<number | Vec2>;
  /** range 0..0.5; unit box; default 0.1 */
  radius?: Animatable<number>;
  /** Edge softness.; range 0..0.5; unit box; default 0 */
  feather?: Animatable<number>;
  /** default false */
  invert?: boolean;
  /** Read the mask's alpha or its luminance.; default "alpha" */
  mode?: "alpha" | "luma";
  children?: unknown;
}
```

---

# Matte

*effect, category: shapes*

Uses another shape layer as a track matte (alpha or luma) for its parent. The source must be a Rect, RoundRect, Circle or Polygon; its shape is stretched over the parent's box. Set the source layer `hidden` to avoid drawing it.

Children: none.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent layer.; unit s |
| `duration` | `Time` |  | unit s |
| `enabled` | `boolean` | `true` |  |
| `source` | `Ref` |  |  |
| `mode` | `alpha` \| `luma` | `"alpha"` |  |
| `invert` | `boolean` | `false` |  |

```ts
export interface MatteProps {
  id?: string;
  /** Start relative to the parent layer.; unit s */
  start?: Time;
  /** unit s */
  duration?: Time;
  /** default true */
  enabled?: boolean;
  source?: Ref;
  /** default "alpha" */
  mode?: "alpha" | "luma";
  /** default false */
  invert?: boolean;
  children?: unknown;
}
```

---

# Stack

*component, category: layout*

Lays children out in a row or column with gap, alignment and padding (CSS flex).

Children: any layers and effects.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  | Stable unique id. Written back as fm_… when missing. |
| `label` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s |
| `duration` | `Time` |  | Defaults to the rest of the parent.; unit s |
| `end` | `Time` |  | Alternative to duration.; unit s |
| `hidden` | `boolean` | `false` |  |
| `link` | `string` |  | Link group id: linked clips move, trim and split together. |
| `position` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit px; ui vec |
| `rotation` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit deg; ui vec |
| `scale` | `number | Vec2 | Vec3` | `[1,1,1]` | animatable; step 0.01; ui vec |
| `skew` | `number | Vec2` | `[0,0]` | animatable; unit deg; ui vec |
| `anchor` | `number | Vec2 | Vec3` | `[50,50,0]` | Transform origin as % of the layer box (z in px).; animatable; unit %; ui vec |
| `opacity` | `number` | `1` | animatable; range 0..1; step 0.01; ui slider |
| `crop` | `{ top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> }` |  |  |
| `flip` | `none` \| `x` \| `y` \| `xy` | `"none"` |  |
| `blend` | `normal` \| `multiply` \| `screen` \| `overlay` \| `darken` \| `lighten` \| `color-dodge` \| `color-burn` \| `soft-light` \| `hard-light` \| `difference` \| `exclusion` \| `hue` \| `saturation` \| `color` \| `luminosity` \| `add` | `"normal"` | ui dropdown |
| `perspective` | `number` | `0` | animatable; range 0..∞; unit px |
| `z` | `number` | `0` | Stacking override among siblings.; step 1 |
| `enter` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Entrance motion at the start of the layer. |
| `exit` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Exit motion ending at the end of the layer. |
| `width` | `Length` |  | Defaults to the full parent box. |
| `height` | `Length` |  |  |
| `gap` | `Length` | `0` |  |
| `padding` | `Length` | `0` |  |
| `align` | `start` \| `center` \| `end` \| `stretch` | `"center"` |  |
| `justify` | `start` \| `center` \| `end` \| `space-between` \| `space-around` | `"center"` |  |
| `direction` | `row` \| `column` | `"column"` |  |
| `wrap` | `nowrap` \| `wrap` | `"nowrap"` |  |

```ts
export interface StackProps {
  /** Stable unique id. Written back as fm_… when missing. */
  id?: string;
  label?: string;
  /** Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s */
  start?: Time;
  /** Defaults to the rest of the parent.; unit s */
  duration?: Time;
  /** Alternative to duration.; unit s */
  end?: Time;
  /** default false */
  hidden?: boolean;
  /** Link group id: linked clips move, trim and split together. */
  link?: string;
  /** unit px; default [0,0,0] */
  position?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0,0] */
  rotation?: Animatable<number | Vec2 | Vec3>;
  /** default [1,1,1] */
  scale?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0] */
  skew?: Animatable<number | Vec2>;
  /** Transform origin as % of the layer box (z in px).; unit %; default [50,50,0] */
  anchor?: Animatable<number | Vec2 | Vec3>;
  /** range 0..1; default 1 */
  opacity?: Animatable<number>;
  crop?: { top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> };
  /** default "none" */
  flip?: "none" | "x" | "y" | "xy";
  /** default "normal" */
  blend?: "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | "color-burn" | "soft-light" | "hard-light" | "difference" | "exclusion" | "hue" | "saturation" | "color" | "luminosity" | "add";
  /** range 0..∞; unit px; default 0 */
  perspective?: Animatable<number>;
  /** Stacking override among siblings.; default 0 */
  z?: number;
  /** Entrance motion at the start of the layer. */
  enter?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  /** Exit motion ending at the end of the layer. */
  exit?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  /** Defaults to the full parent box. */
  width?: Length;
  height?: Length;
  /** default 0 */
  gap?: Length;
  /** default 0 */
  padding?: Length;
  /** default "center" */
  align?: "start" | "center" | "end" | "stretch";
  /** default "center" */
  justify?: "start" | "center" | "end" | "space-between" | "space-around";
  /** default "column" */
  direction?: "row" | "column";
  /** default "nowrap" */
  wrap?: "nowrap" | "wrap";
  children?: unknown;
}
```

---

# Grid

*component, category: layout*

A CSS grid. `columns` is a count or a list of track sizes ("1fr", "200px").

Children: any layers and effects.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  | Stable unique id. Written back as fm_… when missing. |
| `label` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s |
| `duration` | `Time` |  | Defaults to the rest of the parent.; unit s |
| `end` | `Time` |  | Alternative to duration.; unit s |
| `hidden` | `boolean` | `false` |  |
| `link` | `string` |  | Link group id: linked clips move, trim and split together. |
| `position` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit px; ui vec |
| `rotation` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit deg; ui vec |
| `scale` | `number | Vec2 | Vec3` | `[1,1,1]` | animatable; step 0.01; ui vec |
| `skew` | `number | Vec2` | `[0,0]` | animatable; unit deg; ui vec |
| `anchor` | `number | Vec2 | Vec3` | `[50,50,0]` | Transform origin as % of the layer box (z in px).; animatable; unit %; ui vec |
| `opacity` | `number` | `1` | animatable; range 0..1; step 0.01; ui slider |
| `crop` | `{ top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> }` |  |  |
| `flip` | `none` \| `x` \| `y` \| `xy` | `"none"` |  |
| `blend` | `normal` \| `multiply` \| `screen` \| `overlay` \| `darken` \| `lighten` \| `color-dodge` \| `color-burn` \| `soft-light` \| `hard-light` \| `difference` \| `exclusion` \| `hue` \| `saturation` \| `color` \| `luminosity` \| `add` | `"normal"` | ui dropdown |
| `perspective` | `number` | `0` | animatable; range 0..∞; unit px |
| `z` | `number` | `0` | Stacking override among siblings.; step 1 |
| `enter` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Entrance motion at the start of the layer. |
| `exit` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Exit motion ending at the end of the layer. |
| `width` | `Length` |  | Defaults to the full parent box. |
| `height` | `Length` |  |  |
| `gap` | `Length` | `0` |  |
| `padding` | `Length` | `0` |  |
| `align` | `start` \| `center` \| `end` \| `stretch` | `"center"` |  |
| `justify` | `start` \| `center` \| `end` \| `space-between` \| `space-around` | `"center"` |  |
| `columns` | `number` | `2` | range 1..24 |
| `rows` | `number` |  | range 1..24 |
| `columnSizes` | `string[]` |  |  |
| `rowSizes` | `string[]` |  |  |

```ts
export interface GridProps {
  /** Stable unique id. Written back as fm_… when missing. */
  id?: string;
  label?: string;
  /** Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s */
  start?: Time;
  /** Defaults to the rest of the parent.; unit s */
  duration?: Time;
  /** Alternative to duration.; unit s */
  end?: Time;
  /** default false */
  hidden?: boolean;
  /** Link group id: linked clips move, trim and split together. */
  link?: string;
  /** unit px; default [0,0,0] */
  position?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0,0] */
  rotation?: Animatable<number | Vec2 | Vec3>;
  /** default [1,1,1] */
  scale?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0] */
  skew?: Animatable<number | Vec2>;
  /** Transform origin as % of the layer box (z in px).; unit %; default [50,50,0] */
  anchor?: Animatable<number | Vec2 | Vec3>;
  /** range 0..1; default 1 */
  opacity?: Animatable<number>;
  crop?: { top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> };
  /** default "none" */
  flip?: "none" | "x" | "y" | "xy";
  /** default "normal" */
  blend?: "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | "color-burn" | "soft-light" | "hard-light" | "difference" | "exclusion" | "hue" | "saturation" | "color" | "luminosity" | "add";
  /** range 0..∞; unit px; default 0 */
  perspective?: Animatable<number>;
  /** Stacking override among siblings.; default 0 */
  z?: number;
  /** Entrance motion at the start of the layer. */
  enter?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  /** Exit motion ending at the end of the layer. */
  exit?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  /** Defaults to the full parent box. */
  width?: Length;
  height?: Length;
  /** default 0 */
  gap?: Length;
  /** default 0 */
  padding?: Length;
  /** default "center" */
  align?: "start" | "center" | "end" | "stretch";
  /** default "center" */
  justify?: "start" | "center" | "end" | "space-between" | "space-around";
  /** range 1..24; default 2 */
  columns?: number;
  /** range 1..24 */
  rows?: number;
  columnSizes?: string[];
  rowSizes?: string[];
  children?: unknown;
}
```

---

# Center

*component, category: layout*

Centres its children in the parent box.

Children: any layers and effects.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  | Stable unique id. Written back as fm_… when missing. |
| `label` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s |
| `duration` | `Time` |  | Defaults to the rest of the parent.; unit s |
| `end` | `Time` |  | Alternative to duration.; unit s |
| `hidden` | `boolean` | `false` |  |
| `link` | `string` |  | Link group id: linked clips move, trim and split together. |
| `position` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit px; ui vec |
| `rotation` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit deg; ui vec |
| `scale` | `number | Vec2 | Vec3` | `[1,1,1]` | animatable; step 0.01; ui vec |
| `skew` | `number | Vec2` | `[0,0]` | animatable; unit deg; ui vec |
| `anchor` | `number | Vec2 | Vec3` | `[50,50,0]` | Transform origin as % of the layer box (z in px).; animatable; unit %; ui vec |
| `opacity` | `number` | `1` | animatable; range 0..1; step 0.01; ui slider |
| `crop` | `{ top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> }` |  |  |
| `flip` | `none` \| `x` \| `y` \| `xy` | `"none"` |  |
| `blend` | `normal` \| `multiply` \| `screen` \| `overlay` \| `darken` \| `lighten` \| `color-dodge` \| `color-burn` \| `soft-light` \| `hard-light` \| `difference` \| `exclusion` \| `hue` \| `saturation` \| `color` \| `luminosity` \| `add` | `"normal"` | ui dropdown |
| `perspective` | `number` | `0` | animatable; range 0..∞; unit px |
| `z` | `number` | `0` | Stacking override among siblings.; step 1 |
| `enter` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Entrance motion at the start of the layer. |
| `exit` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Exit motion ending at the end of the layer. |
| `direction` | `row` \| `column` | `"column"` |  |
| `gap` | `Length` | `0` |  |

```ts
export interface CenterProps {
  /** Stable unique id. Written back as fm_… when missing. */
  id?: string;
  label?: string;
  /** Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s */
  start?: Time;
  /** Defaults to the rest of the parent.; unit s */
  duration?: Time;
  /** Alternative to duration.; unit s */
  end?: Time;
  /** default false */
  hidden?: boolean;
  /** Link group id: linked clips move, trim and split together. */
  link?: string;
  /** unit px; default [0,0,0] */
  position?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0,0] */
  rotation?: Animatable<number | Vec2 | Vec3>;
  /** default [1,1,1] */
  scale?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0] */
  skew?: Animatable<number | Vec2>;
  /** Transform origin as % of the layer box (z in px).; unit %; default [50,50,0] */
  anchor?: Animatable<number | Vec2 | Vec3>;
  /** range 0..1; default 1 */
  opacity?: Animatable<number>;
  crop?: { top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> };
  /** default "none" */
  flip?: "none" | "x" | "y" | "xy";
  /** default "normal" */
  blend?: "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | "color-burn" | "soft-light" | "hard-light" | "difference" | "exclusion" | "hue" | "saturation" | "color" | "luminosity" | "add";
  /** range 0..∞; unit px; default 0 */
  perspective?: Animatable<number>;
  /** Stacking override among siblings.; default 0 */
  z?: number;
  /** Entrance motion at the start of the layer. */
  enter?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  /** Exit motion ending at the end of the layer. */
  exit?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  /** default "column" */
  direction?: "row" | "column";
  /** default 0 */
  gap?: Length;
  children?: unknown;
}
```

---

# SafeArea

*component, category: layout*

Constrains children to the platform-safe rectangle (reels, shorts, tiktok, feed). Children placed with `at` position inside it.

Children: any layers and effects.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  | Stable unique id. Written back as fm_… when missing. |
| `label` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s |
| `duration` | `Time` |  | Defaults to the rest of the parent.; unit s |
| `end` | `Time` |  | Alternative to duration.; unit s |
| `hidden` | `boolean` | `false` |  |
| `link` | `string` |  | Link group id: linked clips move, trim and split together. |
| `position` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit px; ui vec |
| `rotation` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit deg; ui vec |
| `scale` | `number | Vec2 | Vec3` | `[1,1,1]` | animatable; step 0.01; ui vec |
| `skew` | `number | Vec2` | `[0,0]` | animatable; unit deg; ui vec |
| `anchor` | `number | Vec2 | Vec3` | `[50,50,0]` | Transform origin as % of the layer box (z in px).; animatable; unit %; ui vec |
| `opacity` | `number` | `1` | animatable; range 0..1; step 0.01; ui slider |
| `crop` | `{ top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> }` |  |  |
| `flip` | `none` \| `x` \| `y` \| `xy` | `"none"` |  |
| `blend` | `normal` \| `multiply` \| `screen` \| `overlay` \| `darken` \| `lighten` \| `color-dodge` \| `color-burn` \| `soft-light` \| `hard-light` \| `difference` \| `exclusion` \| `hue` \| `saturation` \| `color` \| `luminosity` \| `add` | `"normal"` | ui dropdown |
| `perspective` | `number` | `0` | animatable; range 0..∞; unit px |
| `z` | `number` | `0` | Stacking override among siblings.; step 1 |
| `enter` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Entrance motion at the start of the layer. |
| `exit` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Exit motion ending at the end of the layer. |
| `preset` | `reels` \| `shorts` \| `tiktok` \| `feed` | `"reels"` |  |
| `inset` | `{ top?: number; right?: number; bottom?: number; left?: number }` |  | Override insets as fractions of the frame. |

```ts
export interface SafeAreaProps {
  /** Stable unique id. Written back as fm_… when missing. */
  id?: string;
  label?: string;
  /** Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s */
  start?: Time;
  /** Defaults to the rest of the parent.; unit s */
  duration?: Time;
  /** Alternative to duration.; unit s */
  end?: Time;
  /** default false */
  hidden?: boolean;
  /** Link group id: linked clips move, trim and split together. */
  link?: string;
  /** unit px; default [0,0,0] */
  position?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0,0] */
  rotation?: Animatable<number | Vec2 | Vec3>;
  /** default [1,1,1] */
  scale?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0] */
  skew?: Animatable<number | Vec2>;
  /** Transform origin as % of the layer box (z in px).; unit %; default [50,50,0] */
  anchor?: Animatable<number | Vec2 | Vec3>;
  /** range 0..1; default 1 */
  opacity?: Animatable<number>;
  crop?: { top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> };
  /** default "none" */
  flip?: "none" | "x" | "y" | "xy";
  /** default "normal" */
  blend?: "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | "color-burn" | "soft-light" | "hard-light" | "difference" | "exclusion" | "hue" | "saturation" | "color" | "luminosity" | "add";
  /** range 0..∞; unit px; default 0 */
  perspective?: Animatable<number>;
  /** Stacking override among siblings.; default 0 */
  z?: number;
  /** Entrance motion at the start of the layer. */
  enter?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  /** Exit motion ending at the end of the layer. */
  exit?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  /** default "reels" */
  preset?: "reels" | "shorts" | "tiktok" | "feed";
  /** Override insets as fractions of the frame. */
  inset?: { top?: number; right?: number; bottom?: number; left?: number };
  children?: unknown;
}
```

---

# DropShadow

*effect, category: layer-styles*

A soft shadow behind the layer's visible pixels.

Children: none.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent layer.; unit s |
| `duration` | `Time` |  | unit s |
| `enabled` | `boolean` | `true` |  |
| `x` | `number` | `0` | animatable; unit px |
| `y` | `number` | `12` | animatable; unit px |
| `blur` | `number` | `24` | animatable; range 0..200; unit px |
| `color` | `Color` | `"#000000"` |  |
| `opacity` | `number` | `0.4` | animatable; range 0..1 |

```ts
export interface DropShadowProps {
  id?: string;
  /** Start relative to the parent layer.; unit s */
  start?: Time;
  /** unit s */
  duration?: Time;
  /** default true */
  enabled?: boolean;
  /** unit px; default 0 */
  x?: Animatable<number>;
  /** unit px; default 12 */
  y?: Animatable<number>;
  /** range 0..200; unit px; default 24 */
  blur?: Animatable<number>;
  /** default "#000000" */
  color?: Color;
  /** range 0..1; default 0.4 */
  opacity?: Animatable<number>;
  children?: unknown;
}
```

---

# Glow

*effect, category: layer-styles*

A coloured halo around the layer's visible pixels.

Children: none.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent layer.; unit s |
| `duration` | `Time` |  | unit s |
| `enabled` | `boolean` | `true` |  |
| `color` | `Color` | `"#ffffff"` |  |
| `radius` | `number` | `24` | animatable; range 0..300; unit px |
| `intensity` | `number` | `1` | animatable; range 0..3; step 0.05 |

```ts
export interface GlowProps {
  id?: string;
  /** Start relative to the parent layer.; unit s */
  start?: Time;
  /** unit s */
  duration?: Time;
  /** default true */
  enabled?: boolean;
  /** default "#ffffff" */
  color?: Color;
  /** range 0..300; unit px; default 24 */
  radius?: Animatable<number>;
  /** range 0..3; default 1 */
  intensity?: Animatable<number>;
  children?: unknown;
}
```

---

# Blur

*effect, category: layer-styles*

Gaussian blur of the layer.

Children: none.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent layer.; unit s |
| `duration` | `Time` |  | unit s |
| `enabled` | `boolean` | `true` |  |
| `radius` | `number` | `8` | animatable; range 0..200; unit px |

```ts
export interface BlurProps {
  id?: string;
  /** Start relative to the parent layer.; unit s */
  start?: Time;
  /** unit s */
  duration?: Time;
  /** default true */
  enabled?: boolean;
  /** range 0..200; unit px; default 8 */
  radius?: Animatable<number>;
  children?: unknown;
}
```

---

# Stroke

*effect, category: layer-styles*

An outline around the layer's visible pixels (outside edge).

Children: none.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent layer.; unit s |
| `duration` | `Time` |  | unit s |
| `enabled` | `boolean` | `true` |  |
| `width` | `number` | `4` | animatable; range 0..100; unit px |
| `color` | `Color` | `"#000000"` |  |

```ts
export interface StrokeProps {
  id?: string;
  /** Start relative to the parent layer.; unit s */
  start?: Time;
  /** unit s */
  duration?: Time;
  /** default true */
  enabled?: boolean;
  /** range 0..100; unit px; default 4 */
  width?: Animatable<number>;
  /** default "#000000" */
  color?: Color;
  children?: unknown;
}
```

---

# Vignette

*effect, category: layer-styles*

Darkens the edges of the layer.

Children: none.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent layer.; unit s |
| `duration` | `Time` |  | unit s |
| `enabled` | `boolean` | `true` |  |
| `amount` | `number` | `0.5` | animatable; range 0..1; step 0.01 |
| `size` | `number` | `0.55` | Radius of the clear centre.; range 0..1; step 0.01 |
| `softness` | `number` | `0.5` | range 0..1; step 0.01 |
| `color` | `Color` | `"#000000"` |  |
| `roundness` | `number` | `0.5` | 0 = frame-shaped, 1 = circular.; range 0..1; step 0.01 |
| `feather` | `boolean` | `true` |  |

```ts
export interface VignetteProps {
  id?: string;
  /** Start relative to the parent layer.; unit s */
  start?: Time;
  /** unit s */
  duration?: Time;
  /** default true */
  enabled?: boolean;
  /** range 0..1; default 0.5 */
  amount?: Animatable<number>;
  /** Radius of the clear centre.; range 0..1; default 0.55 */
  size?: number;
  /** range 0..1; default 0.5 */
  softness?: number;
  /** default "#000000" */
  color?: Color;
  /** 0 = frame-shaped, 1 = circular.; range 0..1; default 0.5 */
  roundness?: number;
  /** default true */
  feather?: boolean;
  children?: unknown;
}
```

---

# ColorGrade

*effect, category: color*

Primary colour correction through SVG filters: basic controls plus lift/gamma/gain/offset wheels. Order: tone, white balance and saturation, then wheels. Apply to a layer or, as a child of Composition, to everything.

Children: none.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent layer.; unit s |
| `duration` | `Time` |  | unit s |
| `enabled` | `boolean` | `true` |  |
| `scope` | `layer` \| `composition` | `"layer"` | Informational: a ColorGrade child of Composition grades the whole frame. |
| `exposure` | `number` | `0` | animatable; range -5..5; step 0.01; unit EV |
| `contrast` | `number` | `0` | animatable; range -1..1; step 0.01 |
| `saturation` | `number` | `0` | animatable; range -1..1; step 0.01 |
| `vibrance` | `number` | `0` | animatable; range -1..1; step 0.01 |
| `temperature` | `number` | `0` | animatable; range -100..100; step 1 |
| `tint` | `number` | `0` | animatable; range -100..100; step 1 |
| `highlights` | `number` | `0` | animatable; range -100..100; step 1 |
| `shadows` | `number` | `0` | animatable; range -100..100; step 1 |
| `whites` | `number` | `0` | animatable; range -100..100; step 1 |
| `blacks` | `number` | `0` | animatable; range -100..100; step 1 |
| `lift` | `Vec3` | `[0,0,0]` | animatable; ui wheel |
| `gamma` | `Vec3` | `[1,1,1]` | animatable; ui wheel |
| `gain` | `Vec3` | `[1,1,1]` | animatable; ui wheel |
| `offset` | `Vec3` | `[0,0,0]` | animatable; ui wheel |
| `lut` | `string` |  | Later: .cube LUTs need a WebGL pass. Typed stub; ignored with a warning. |

```ts
export interface ColorGradeProps {
  id?: string;
  /** Start relative to the parent layer.; unit s */
  start?: Time;
  /** unit s */
  duration?: Time;
  /** default true */
  enabled?: boolean;
  /** Informational: a ColorGrade child of Composition grades the whole frame.; default "layer" */
  scope?: "layer" | "composition";
  /** range -5..5; unit EV; default 0 */
  exposure?: Animatable<number>;
  /** range -1..1; default 0 */
  contrast?: Animatable<number>;
  /** range -1..1; default 0 */
  saturation?: Animatable<number>;
  /** range -1..1; default 0 */
  vibrance?: Animatable<number>;
  /** range -100..100; default 0 */
  temperature?: Animatable<number>;
  /** range -100..100; default 0 */
  tint?: Animatable<number>;
  /** range -100..100; default 0 */
  highlights?: Animatable<number>;
  /** range -100..100; default 0 */
  shadows?: Animatable<number>;
  /** range -100..100; default 0 */
  whites?: Animatable<number>;
  /** range -100..100; default 0 */
  blacks?: Animatable<number>;
  /** default [0,0,0] */
  lift?: Animatable<Vec3>;
  /** default [1,1,1] */
  gamma?: Animatable<Vec3>;
  /** default [1,1,1] */
  gain?: Animatable<Vec3>;
  /** default [0,0,0] */
  offset?: Animatable<Vec3>;
  /** Later: .cube LUTs need a WebGL pass. Typed stub; ignored with a warning. */
  lut?: string;
  children?: unknown;
}
```

---

# Curves

*effect, category: color*

Tone curves per channel (rgb, r, g, b, luma). Points are 0..1 with a monotone cubic through them. `luma` is applied to all three channels equally.

Children: none.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent layer.; unit s |
| `duration` | `Time` |  | unit s |
| `enabled` | `boolean` | `true` |  |
| `curves` | `Partial<Record<CurveChannel, CurvePoint[]>>` |  |  |

```ts
export interface CurvesProps {
  id?: string;
  /** Start relative to the parent layer.; unit s */
  start?: Time;
  /** unit s */
  duration?: Time;
  /** default true */
  enabled?: boolean;
  curves?: Partial<Record<CurveChannel, CurvePoint[]>>;
  children?: unknown;
}
```

---

# Grain

*effect, category: color*

Film grain: seeded fractal noise overlay. The noise re-seeds every `hold` frames from a seeded PRNG, so renders repeat exactly.

Children: none.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent layer.; unit s |
| `duration` | `Time` |  | unit s |
| `enabled` | `boolean` | `true` |  |
| `amount` | `number` | `0.12` | animatable; range 0..1; step 0.01 |
| `size` | `number` | `1` | Grain size (higher = coarser).; range 0.2..4; step 0.05 |
| `hold` | `number` | `2` | Frames each noise pattern is held.; range 1..12; step 1 |
| `seed` | `number` | `1` | range 0..100000; step 1 |
| `mono` | `boolean` | `true` |  |
| `blend` | `overlay` \| `soft-light` \| `multiply` \| `screen` | `"overlay"` |  |

```ts
export interface GrainProps {
  id?: string;
  /** Start relative to the parent layer.; unit s */
  start?: Time;
  /** unit s */
  duration?: Time;
  /** default true */
  enabled?: boolean;
  /** range 0..1; default 0.12 */
  amount?: Animatable<number>;
  /** Grain size (higher = coarser).; range 0.2..4; default 1 */
  size?: number;
  /** Frames each noise pattern is held.; range 1..12; default 2 */
  hold?: number;
  /** range 0..100000; default 1 */
  seed?: number;
  /** default true */
  mono?: boolean;
  /** default "overlay" */
  blend?: "overlay" | "soft-light" | "multiply" | "screen";
  children?: unknown;
}
```

---

# Shake

*effect, category: impact*

Decaying noise shake of the parent: x, y and optional rotation. Deterministic (seeded noise of time).

Children: none. Default sound tag: `hit/punch`.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent layer.; unit s |
| `duration` | `Time` |  | unit s |
| `enabled` | `boolean` | `true` |  |
| `amp` | `number` | `12` | range 0..400; unit px |
| `freq` | `number` | `14` | range 0.1..120; unit Hz |
| `decay` | `number` | `5` | Envelope e^(-decay·t).; range 0..60 |
| `axes` | `x` \| `y` \| `xy` | `"xy"` |  |
| `seed` | `number` | `1` |  |
| `rotation` | `number` | `0` | Rotational shake amplitude.; range 0..45; unit deg |
| `sound` | `string` | `"hit/punch"` | Sound tag for autoSound (default hit/punch); "" disables.; sound hit/punch |

```ts
export interface ShakeProps {
  id?: string;
  /** Start relative to the parent layer.; unit s */
  start?: Time;
  /** unit s */
  duration?: Time;
  /** default true */
  enabled?: boolean;
  /** range 0..400; unit px; default 12 */
  amp?: number;
  /** range 0.1..120; unit Hz; default 14 */
  freq?: number;
  /** Envelope e^(-decay·t).; range 0..60; default 5 */
  decay?: number;
  /** default "xy" */
  axes?: "x" | "y" | "xy";
  /** default 1 */
  seed?: number;
  /** Rotational shake amplitude.; range 0..45; unit deg; default 0 */
  rotation?: number;
  /** Sound tag for autoSound (default hit/punch); "" disables.; default "hit/punch" */
  sound?: string;
  children?: unknown;
}
```

---

# Thud

*effect, category: impact*

A landing: damped oscillation along an axis with squash. y = amp·e^(-damping·t)·cos(2π·freq·t).

Children: none. Default sound tag: `hit/land`.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent layer.; unit s |
| `duration` | `Time` |  | unit s |
| `enabled` | `boolean` | `true` |  |
| `amp` | `number` | `28` | range 0..600; unit px |
| `freq` | `number` | `3` | range 0.1..30; unit Hz |
| `damping` | `number` | `6` | range 0..60 |
| `axis` | `x` \| `y` | `"y"` |  |
| `squash` | `number` | `0.06` | Scale squash along the impact axis.; range 0..0.5; step 0.005 |
| `sound` | `string` | `"hit/land"` | Sound tag for autoSound (default hit/land); "" disables.; sound hit/land |

```ts
export interface ThudProps {
  id?: string;
  /** Start relative to the parent layer.; unit s */
  start?: Time;
  /** unit s */
  duration?: Time;
  /** default true */
  enabled?: boolean;
  /** range 0..600; unit px; default 28 */
  amp?: number;
  /** range 0.1..30; unit Hz; default 3 */
  freq?: number;
  /** range 0..60; default 6 */
  damping?: number;
  /** default "y" */
  axis?: "x" | "y";
  /** Scale squash along the impact axis.; range 0..0.5; default 0.06 */
  squash?: number;
  /** Sound tag for autoSound (default hit/land); "" disables.; default "hit/land" */
  sound?: string;
  children?: unknown;
}
```

---

# Impact

*effect, category: impact*

Alias of Thud with a heavier default feel.

Children: none. Default sound tag: `hit/land`.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent layer.; unit s |
| `duration` | `Time` |  | unit s |
| `enabled` | `boolean` | `true` |  |
| `amp` | `number` | `40` | range 0..600; unit px |
| `freq` | `number` | `3` | range 0.1..30; unit Hz |
| `damping` | `number` | `5` | range 0..60 |
| `axis` | `x` \| `y` | `"y"` |  |
| `squash` | `number` | `0.06` | Scale squash along the impact axis.; range 0..0.5; step 0.005 |
| `sound` | `string` | `"hit/land"` | Sound tag for autoSound (default hit/land); "" disables.; sound hit/land |

```ts
export interface ImpactProps {
  id?: string;
  /** Start relative to the parent layer.; unit s */
  start?: Time;
  /** unit s */
  duration?: Time;
  /** default true */
  enabled?: boolean;
  /** range 0..600; unit px; default 40 */
  amp?: number;
  /** range 0.1..30; unit Hz; default 3 */
  freq?: number;
  /** range 0..60; default 5 */
  damping?: number;
  /** default "y" */
  axis?: "x" | "y";
  /** Scale squash along the impact axis.; range 0..0.5; default 0.06 */
  squash?: number;
  /** Sound tag for autoSound (default hit/land); "" disables.; default "hit/land" */
  sound?: string;
  children?: unknown;
}
```

---

# PunchZoom

*effect, category: impact*

A quick scale punch that settles: scale = 1 + amount·e^(-decay·t).

Children: none. Default sound tag: `hit/punch`.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent layer.; unit s |
| `duration` | `Time` |  | unit s |
| `enabled` | `boolean` | `true` |  |
| `amount` | `number` | `0.12` | range -1..2; step 0.01 |
| `decay` | `number` | `9` | range 0.5..60 |
| `sound` | `string` | `"hit/punch"` | Sound tag for autoSound (default hit/punch); "" disables.; sound hit/punch |

```ts
export interface PunchZoomProps {
  id?: string;
  /** Start relative to the parent layer.; unit s */
  start?: Time;
  /** unit s */
  duration?: Time;
  /** default true */
  enabled?: boolean;
  /** range -1..2; default 0.12 */
  amount?: number;
  /** range 0.5..60; default 9 */
  decay?: number;
  /** Sound tag for autoSound (default hit/punch); "" disables.; default "hit/punch" */
  sound?: string;
  children?: unknown;
}
```

---

# Slam

*effect, category: impact*

Drops in fast from above (ease-in), lands with a thud, squash and settle.

Children: none. Default sound tag: `hit/boom`.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent layer.; unit s |
| `duration` | `Time` |  | unit s |
| `enabled` | `boolean` | `true` |  |
| `distance` | `Length` | `700` | Fall distance. |
| `fall` | `Time` | `0.22` | range 0.05..2; unit s |
| `ease` | `string` | `"expo.in"` |  |
| `amp` | `number` | `30` | Landing bounce amplitude.; range 0..400; unit px |
| `freq` | `number` | `3.5` | range 0.1..30 |
| `damping` | `number` | `7` | range 0..60 |
| `squash` | `number` | `0.1` | range 0..0.5; step 0.005 |
| `sound` | `string` | `"hit/boom"` | Sound tag for autoSound (default hit/boom); "" disables.; sound hit/boom |

```ts
export interface SlamProps {
  id?: string;
  /** Start relative to the parent layer.; unit s */
  start?: Time;
  /** unit s */
  duration?: Time;
  /** default true */
  enabled?: boolean;
  /** Fall distance.; default 700 */
  distance?: Length;
  /** range 0.05..2; unit s; default 0.22 */
  fall?: Time;
  /** default "expo.in" */
  ease?: string;
  /** Landing bounce amplitude.; range 0..400; unit px; default 30 */
  amp?: number;
  /** range 0.1..30; default 3.5 */
  freq?: number;
  /** range 0..60; default 7 */
  damping?: number;
  /** range 0..0.5; default 0.1 */
  squash?: number;
  /** Sound tag for autoSound (default hit/boom); "" disables.; default "hit/boom" */
  sound?: string;
  children?: unknown;
}
```

---

# SquashStretch

*effect, category: impact*

Volume-preserving squash and stretch oscillation (sy = 1 + a·env·cos, sx = 1/√sy).

Children: none. Default sound tag: `ui/pop`.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent layer.; unit s |
| `duration` | `Time` |  | unit s |
| `enabled` | `boolean` | `true` |  |
| `amount` | `number` | `0.22` | range 0..0.9; step 0.01 |
| `freq` | `number` | `3.5` | range 0.1..30 |
| `damping` | `number` | `6` | range 0..60 |
| `sound` | `string` | `"ui/pop"` | Sound tag for autoSound (default ui/pop); "" disables.; sound ui/pop |

```ts
export interface SquashStretchProps {
  id?: string;
  /** Start relative to the parent layer.; unit s */
  start?: Time;
  /** unit s */
  duration?: Time;
  /** default true */
  enabled?: boolean;
  /** range 0..0.9; default 0.22 */
  amount?: number;
  /** range 0.1..30; default 3.5 */
  freq?: number;
  /** range 0..60; default 6 */
  damping?: number;
  /** Sound tag for autoSound (default ui/pop); "" disables.; default "ui/pop" */
  sound?: string;
  children?: unknown;
}
```

---

# Wobble

*effect, category: impact*

Damped rotational wobble: rot = amp·e^(-damping·t)·sin(2π·freq·t).

Children: none. Default sound tag: `ui/tick`.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent layer.; unit s |
| `duration` | `Time` |  | unit s |
| `enabled` | `boolean` | `true` |  |
| `amp` | `number` | `8` | range 0..90; unit deg |
| `freq` | `number` | `3` | range 0.1..30 |
| `damping` | `number` | `4` | range 0..60 |
| `sound` | `string` | `"ui/tick"` | Sound tag for autoSound (default ui/tick); "" disables.; sound ui/tick |

```ts
export interface WobbleProps {
  id?: string;
  /** Start relative to the parent layer.; unit s */
  start?: Time;
  /** unit s */
  duration?: Time;
  /** default true */
  enabled?: boolean;
  /** range 0..90; unit deg; default 8 */
  amp?: number;
  /** range 0.1..30; default 3 */
  freq?: number;
  /** range 0..60; default 4 */
  damping?: number;
  /** Sound tag for autoSound (default ui/tick); "" disables.; default "ui/tick" */
  sound?: string;
  children?: unknown;
}
```

---

# WhipPan

*effect, category: impact*

A fast whip move with motion blur: the layer swings in from (or out toward) a side.

Children: none. Default sound tag: `move/whip`.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent layer.; unit s |
| `duration` | `Time` |  | unit s |
| `enabled` | `boolean` | `true` |  |
| `direction` | `e` \| `w` \| `n` \| `s` | `"e"` |  |
| `mode` | `in` \| `out` | `"in"` |  |
| `distance` | `Length` | `"100vw"` |  |
| `whip` | `Time` | `0.35` | range 0.05..2; unit s |
| `ease` | `string` | `"expo.inOut"` |  |
| `blur` | `number` | `36` | range 0..120; unit px |
| `sound` | `string` | `"move/whip"` | Sound tag for autoSound (default move/whip); "" disables.; sound move/whip |

```ts
export interface WhipPanProps {
  id?: string;
  /** Start relative to the parent layer.; unit s */
  start?: Time;
  /** unit s */
  duration?: Time;
  /** default true */
  enabled?: boolean;
  /** default "e" */
  direction?: "e" | "w" | "n" | "s";
  /** default "in" */
  mode?: "in" | "out";
  /** default "100vw" */
  distance?: Length;
  /** range 0.05..2; unit s; default 0.35 */
  whip?: Time;
  /** default "expo.inOut" */
  ease?: string;
  /** range 0..120; unit px; default 36 */
  blur?: number;
  /** Sound tag for autoSound (default move/whip); "" disables.; default "move/whip" */
  sound?: string;
  children?: unknown;
}
```

---

# Glitch

*effect, category: impact*

Seeded digital glitch: jittering offset and skew, flicker and hue flips. Changes every other frame.

Children: none. Default sound tag: `tech/glitch`.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent layer.; unit s |
| `duration` | `Time` |  | unit s |
| `enabled` | `boolean` | `true` |  |
| `amount` | `number` | `1` | range 0..3; step 0.05 |
| `seed` | `number` | `3` |  |
| `hold` | `number` | `2` | Frames each glitch state is held.; range 1..8 |
| `sound` | `string` | `"tech/glitch"` | Sound tag for autoSound (default tech/glitch); "" disables.; sound tech/glitch |

```ts
export interface GlitchProps {
  id?: string;
  /** Start relative to the parent layer.; unit s */
  start?: Time;
  /** unit s */
  duration?: Time;
  /** default true */
  enabled?: boolean;
  /** range 0..3; default 1 */
  amount?: number;
  /** default 3 */
  seed?: number;
  /** Frames each glitch state is held.; range 1..8; default 2 */
  hold?: number;
  /** Sound tag for autoSound (default tech/glitch); "" disables.; default "tech/glitch" */
  sound?: string;
  children?: unknown;
}
```

---

# RGBSplit

*effect, category: impact*

Chromatic aberration: red and blue channels offset in opposite directions. `decay` fades it out.

Children: none. Default sound tag: `tech/glitch`.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent layer.; unit s |
| `duration` | `Time` |  | unit s |
| `enabled` | `boolean` | `true` |  |
| `amount` | `number` | `10` | animatable; range 0..100; unit px |
| `angle` | `number` | `0` | range -180..180; unit deg |
| `decay` | `number` | `0` | range 0..60 |
| `sound` | `string` | `"tech/glitch"` | Sound tag for autoSound (default tech/glitch); "" disables.; sound tech/glitch |

```ts
export interface RGBSplitProps {
  id?: string;
  /** Start relative to the parent layer.; unit s */
  start?: Time;
  /** unit s */
  duration?: Time;
  /** default true */
  enabled?: boolean;
  /** range 0..100; unit px; default 10 */
  amount?: Animatable<number>;
  /** range -180..180; unit deg; default 0 */
  angle?: number;
  /** range 0..60; default 0 */
  decay?: number;
  /** Sound tag for autoSound (default tech/glitch); "" disables.; default "tech/glitch" */
  sound?: string;
  children?: unknown;
}
```

---

# Pulse

*effect, category: impact*

Repeating scale pulses: scale = 1 + amp·sin²(π·freq·t) for `count` beats (or until the parent ends when count is 0).

Children: none. Default sound tag: `ui/tick`.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent layer.; unit s |
| `duration` | `Time` |  | unit s |
| `enabled` | `boolean` | `true` |  |
| `amp` | `number` | `0.06` | range 0..1; step 0.005 |
| `freq` | `number` | `2` | range 0.1..30; unit Hz |
| `count` | `number` | `4` | range 0..64 |
| `sound` | `string` | `"ui/tick"` | Sound tag for autoSound (default ui/tick); "" disables.; sound ui/tick |

```ts
export interface PulseProps {
  id?: string;
  /** Start relative to the parent layer.; unit s */
  start?: Time;
  /** unit s */
  duration?: Time;
  /** default true */
  enabled?: boolean;
  /** range 0..1; default 0.06 */
  amp?: number;
  /** range 0.1..30; unit Hz; default 2 */
  freq?: number;
  /** range 0..64; default 4 */
  count?: number;
  /** Sound tag for autoSound (default ui/tick); "" disables.; default "ui/tick" */
  sound?: string;
  children?: unknown;
}
```

---

# Hitstop

*effect, category: impact*

Freezes the parent's own animation for a few frames at the hit moment, then resumes (time remap).

Children: none. Default sound tag: `hit/punch`.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent layer.; unit s |
| `duration` | `Time` |  | unit s |
| `enabled` | `boolean` | `true` |  |
| `frames` | `number` | `4` | range 1..30 |
| `sound` | `string` | `"hit/punch"` | Sound tag for autoSound (default hit/punch); "" disables.; sound hit/punch |

```ts
export interface HitstopProps {
  id?: string;
  /** Start relative to the parent layer.; unit s */
  start?: Time;
  /** unit s */
  duration?: Time;
  /** default true */
  enabled?: boolean;
  /** range 1..30; default 4 */
  frames?: number;
  /** Sound tag for autoSound (default hit/punch); "" disables.; default "hit/punch" */
  sound?: string;
  children?: unknown;
}
```

---

# Enter

*effect, category: motion*

Entrance motion for the parent layer. Same fields as the layer's `enter` prop.

Children: none.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent layer.; unit s |
| `duration` | `Time` | `0.6` | unit s |
| `enabled` | `boolean` | `true` |  |
| `from` | `n` \| `ne` \| `e` \| `se` \| `s` \| `sw` \| `w` \| `nw` \| `center` \| `z+` \| `z-` | `"s"` | Direction the layer comes from (enter). |
| `to` | `n` \| `ne` \| `e` \| `se` \| `s` \| `sw` \| `w` \| `nw` \| `center` \| `z+` \| `z-` | `"s"` | Direction the layer leaves toward (exit). |
| `distance` | `Length` | `120` | Travel distance in px (or vw/vh/%). |
| `ease` | `Ease` | `"expo.out"` |  |
| `delay` | `Time` | `0` | unit s |
| `fade` | `boolean` | `true` |  |
| `blur` | `number` | `0` | range 0..200; unit px |
| `scale` | `number` | `1` | Scale at the start of an enter / end of an exit.; range 0..10 |
| `rotate` | `Angle` | `0` |  |

```ts
export interface EnterProps {
  id?: string;
  /** Start relative to the parent layer.; unit s */
  start?: Time;
  /** unit s; default 0.6 */
  duration?: Time;
  /** default true */
  enabled?: boolean;
  /** Direction the layer comes from (enter).; default "s" */
  from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-";
  /** Direction the layer leaves toward (exit).; default "s" */
  to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-";
  /** Travel distance in px (or vw/vh/%).; default 120 */
  distance?: Length;
  /** default "expo.out" */
  ease?: Ease;
  /** unit s; default 0 */
  delay?: Time;
  /** default true */
  fade?: boolean;
  /** range 0..200; unit px; default 0 */
  blur?: number;
  /** Scale at the start of an enter / end of an exit.; range 0..10; default 1 */
  scale?: number;
  /** default 0 */
  rotate?: Angle;
  children?: unknown;
}
```

---

# Exit

*effect, category: motion*

Exit motion for the parent layer. Same fields as the layer's `exit` prop.

Children: none.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent layer.; unit s |
| `duration` | `Time` | `0.6` | unit s |
| `enabled` | `boolean` | `true` |  |
| `from` | `n` \| `ne` \| `e` \| `se` \| `s` \| `sw` \| `w` \| `nw` \| `center` \| `z+` \| `z-` | `"s"` | Direction the layer comes from (enter). |
| `to` | `n` \| `ne` \| `e` \| `se` \| `s` \| `sw` \| `w` \| `nw` \| `center` \| `z+` \| `z-` | `"s"` | Direction the layer leaves toward (exit). |
| `distance` | `Length` | `120` | Travel distance in px (or vw/vh/%). |
| `ease` | `Ease` | `"expo.out"` |  |
| `delay` | `Time` | `0` | unit s |
| `fade` | `boolean` | `true` |  |
| `blur` | `number` | `0` | range 0..200; unit px |
| `scale` | `number` | `1` | Scale at the start of an enter / end of an exit.; range 0..10 |
| `rotate` | `Angle` | `0` |  |

```ts
export interface ExitProps {
  id?: string;
  /** Start relative to the parent layer.; unit s */
  start?: Time;
  /** unit s; default 0.6 */
  duration?: Time;
  /** default true */
  enabled?: boolean;
  /** Direction the layer comes from (enter).; default "s" */
  from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-";
  /** Direction the layer leaves toward (exit).; default "s" */
  to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-";
  /** Travel distance in px (or vw/vh/%).; default 120 */
  distance?: Length;
  /** default "expo.out" */
  ease?: Ease;
  /** unit s; default 0 */
  delay?: Time;
  /** default true */
  fade?: boolean;
  /** range 0..200; unit px; default 0 */
  blur?: number;
  /** Scale at the start of an enter / end of an exit.; range 0..10; default 1 */
  scale?: number;
  /** default 0 */
  rotate?: Angle;
  children?: unknown;
}
```

---

# Animate

*effect, category: motion*

Animates one transform property of the parent from `from` to `to`. Position, rotation and skew are added to the layer's own values; scale and opacity multiply them.

Children: none.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent layer.; unit s |
| `duration` | `Time` |  | unit s |
| `enabled` | `boolean` | `true` |  |
| `prop` | `x` \| `y` \| `z` \| `rotation` \| `rotationX` \| `rotationY` \| `scale` \| `scaleX` \| `scaleY` \| `skewX` \| `skewY` \| `opacity` \| `blur` | `"opacity"` |  |
| `from` | `number` | `0` |  |
| `to` | `number` | `1` |  |
| `ease` | `string` | `"expo.out"` |  |
| `delay` | `Time` | `0` | unit s |
| `hold` | `boolean` | `true` | Stay at `to` afterwards (otherwise return to `from`). |

```ts
export interface AnimateProps {
  id?: string;
  /** Start relative to the parent layer.; unit s */
  start?: Time;
  /** unit s */
  duration?: Time;
  /** default true */
  enabled?: boolean;
  /** default "opacity" */
  prop?: "x" | "y" | "z" | "rotation" | "rotationX" | "rotationY" | "scale" | "scaleX" | "scaleY" | "skewX" | "skewY" | "opacity" | "blur";
  /** default 0 */
  from?: number;
  /** default 1 */
  to?: number;
  /** default "expo.out" */
  ease?: string;
  /** unit s; default 0 */
  delay?: Time;
  /** Stay at `to` afterwards (otherwise return to `from`).; default true */
  hold?: boolean;
  children?: unknown;
}
```

---

# TextAnimator

*effect, category: text*

After Effects style text animator. A selector gives each character, word or line an influence from 0 to 1 over time; the `props` interpolate from the base value to the given value by that influence. Pure functions of time; randomness is seeded.

Children: none.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent layer.; unit s |
| `duration` | `Time` |  | unit s |
| `enabled` | `boolean` | `true` |  |
| `by` | `char` \| `word` \| `line` | `"char"` |  |
| `preset` | `none` \| `typewriter` \| `wave` \| `scramble` \| `rise` \| `slam` \| `blur-in` \| `mask-reveal` \| `weight-pulse` \| `tracking-in` \| `counter` | `"none"` |  |
| `selector` | `{ start?: number; end?: number; offset?: Animatable<number>; shape?: "square" | "ramp" | "triangle" | "smooth" | "wave"; randomize?: { seed?: number; amount?: number } }` |  | Range selector. Omit to use `stagger` timing instead. |
| `props` | `{ opacity?: number; x?: number; y?: number; yPercent?: number; scale?: number; rotation?: number; skew?: number; blur?: number; tracking?: number; weight?: number; fill?: Color; strokeWidth?: number; shadow?: { x?: number; y?: number; blur?: number; color?: Color } }` |  | Values at full influence (influence 1). Base values are the Text's own. |
| `stagger` | `Time` |  | Seconds between units (stagger timing mode).; range 0..∞; unit s |
| `unitDuration` | `Time` |  | Seconds each unit takes to settle.; range 0..∞; unit s |
| `ease` | `string` |  | Ease of each unit's settle (default per preset). |
| `order` | `forward` \| `backward` \| `center` \| `edges` \| `random` | `"forward"` |  |
| `seed` | `number` | `1` |  |
| `loop` | `boolean` | `false` | Wave presets keep running until the parent ends. |

```ts
export interface TextAnimatorProps {
  id?: string;
  /** Start relative to the parent layer.; unit s */
  start?: Time;
  /** unit s */
  duration?: Time;
  /** default true */
  enabled?: boolean;
  /** default "char" */
  by?: "char" | "word" | "line";
  /** default "none" */
  preset?: "none" | "typewriter" | "wave" | "scramble" | "rise" | "slam" | "blur-in" | "mask-reveal" | "weight-pulse" | "tracking-in" | "counter";
  /** Range selector. Omit to use `stagger` timing instead. */
  selector?: { start?: number; end?: number; offset?: Animatable<number>; shape?: "square" | "ramp" | "triangle" | "smooth" | "wave"; randomize?: { seed?: number; amount?: number } };
  /** Values at full influence (influence 1). Base values are the Text's own. */
  props?: { opacity?: number; x?: number; y?: number; yPercent?: number; scale?: number; rotation?: number; skew?: number; blur?: number; tracking?: number; weight?: number; fill?: Color; strokeWidth?: number; shadow?: { x?: number; y?: number; blur?: number; color?: Color } };
  /** Seconds between units (stagger timing mode).; range 0..∞; unit s */
  stagger?: Time;
  /** Seconds each unit takes to settle.; range 0..∞; unit s */
  unitDuration?: Time;
  /** Ease of each unit's settle (default per preset). */
  ease?: string;
  /** default "forward" */
  order?: "forward" | "backward" | "center" | "edges" | "random";
  /** default 1 */
  seed?: number;
  /** Wave presets keep running until the parent ends.; default false */
  loop?: boolean;
  children?: unknown;
}
```

---

# Text

*component, category: text*

Text with full typography: face, spacing, layout, case and OpenType features, fitting, decoration and styling. Add <TextAnimator> children for per-character, word or line animation.

Children: any layers and effects.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  | Stable unique id. Written back as fm_… when missing. |
| `label` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s |
| `duration` | `Time` |  | Defaults to the rest of the parent.; unit s |
| `end` | `Time` |  | Alternative to duration.; unit s |
| `hidden` | `boolean` | `false` |  |
| `link` | `string` |  | Link group id: linked clips move, trim and split together. |
| `position` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit px; ui vec |
| `rotation` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit deg; ui vec |
| `scale` | `number | Vec2 | Vec3` | `[1,1,1]` | animatable; step 0.01; ui vec |
| `skew` | `number | Vec2` | `[0,0]` | animatable; unit deg; ui vec |
| `anchor` | `number | Vec2 | Vec3` | `[50,50,0]` | Transform origin as % of the layer box (z in px).; animatable; unit %; ui vec |
| `opacity` | `number` | `1` | animatable; range 0..1; step 0.01; ui slider |
| `crop` | `{ top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> }` |  |  |
| `flip` | `none` \| `x` \| `y` \| `xy` | `"none"` |  |
| `blend` | `normal` \| `multiply` \| `screen` \| `overlay` \| `darken` \| `lighten` \| `color-dodge` \| `color-burn` \| `soft-light` \| `hard-light` \| `difference` \| `exclusion` \| `hue` \| `saturation` \| `color` \| `luminosity` \| `add` | `"normal"` | ui dropdown |
| `perspective` | `number` | `0` | animatable; range 0..∞; unit px |
| `z` | `number` | `0` | Stacking override among siblings.; step 1 |
| `enter` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Entrance motion at the start of the layer. |
| `exit` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Exit motion ending at the end of the layer. |
| `at` | `unknown` | `"center"` | Placement: center | top | bottom | left | right | top-left | top-right | bottom-left | bottom-right or [x, y] (px, %, vw, vh) from the top-left. |
| `text` | `string` |  | The text. Children (strings, <Span>, <B>, <I>, <Highlight>, <Underline>) work too. |
| `markup` | `string` |  | Inline markup: "**bold** _italic_ ==highlight== ~~strike~~". |
| `font` | `string` | `"$type.body"` | Font id or token, e.g. "display" or "$type.display". |
| `weight` | `number` | `400` | animatable; range 1..1000; step 1; unit wght |
| `width` | `number` | `100` | Font width (wdth axis).; animatable; range 25..200; step 1; unit % |
| `style` | `normal` \| `italic` \| `oblique` | `"normal"` |  |
| `size` | `number` | `64` | animatable; range 1..2000; step 1; unit px |
| `axes` | `{ wght?: Animatable<number>; wdth?: Animatable<number>; slnt?: Animatable<number>; ital?: Animatable<number>; opsz?: Animatable<number>; custom?: unknown }` |  | Animatable variable-font axes. `custom` takes static values for other axes. |
| `leading` | `number` | `1.15` | Line height multiplier.; animatable; range 0.5..4; step 0.01 |
| `tracking` | `number` | `0` | Letter spacing in thousandths of an em.; animatable; range -500..2000; step 1; unit ‰em |
| `wordSpacing` | `number` | `0` | animatable; range -500..2000; unit ‰em |
| `indent` | `number` | `0` | unit px |
| `paragraphSpacing` | `number` | `0` | unit px |
| `baselineShift` | `number` | `0` | animatable; unit px |
| `align` | `left` \| `center` \| `right` \| `justify` | `"left"` |  |
| `valign` | `top` \| `middle` \| `bottom` | `"top"` |  |
| `maxWidth` | `Length` | `"90%"` |  |
| `box` | `{ width?: Length; height?: Length }` |  | A fixed box; `valign` and `fit` use it. |
| `wrap` | `boolean` | `true` |  |
| `balance` | `boolean` | `false` | Balance line lengths. |
| `hyphenate` | `boolean` | `false` |  |
| `overflow` | `visible` \| `hidden` \| `ellipsis` | `"visible"` |  |
| `columns` | `number` | `1` | range 1..8 |
| `direction` | `ltr` \| `rtl` | `"ltr"` |  |
| `lang` | `string` |  | BCP-47 language, e.g. "en", "hi". |
| `case` | `none` \| `upper` \| `lower` \| `title` \| `small-caps` | `"none"` |  |
| `features` | `string[]` |  | OpenType features: "liga", "kern", "tnum", "lnum", "onum", "ss01"…"ss20", "salt". |
| `numeric` | `default` \| `tabular` \| `proportional` \| `lining` \| `oldstyle` | `"default"` |  |
| `fit` | `{ minSize?: number; maxSize?: number; maxLines?: number }` |  | Shrinks the size until the text fits the box / line count. |
| `underline` | `{ style?: "solid" | "dashed" | "dotted" | "wavy" | "double"; thickness?: number; offset?: number; color?: Color; progress?: Animatable<number> }` |  |  |
| `strike` | `{ style?: "solid" | "dashed" | "dotted" | "wavy" | "double"; thickness?: number; offset?: number; color?: Color; progress?: Animatable<number> }` |  |  |
| `highlight` | `{ color?: Color; padding?: number; radius?: number; progress?: Animatable<number>; opacity?: number }` |  |  |
| `fill` | `Fill` | `"#ffffff"` | Solid, gradient, image or video clipped to the letter shapes. |
| `stroke` | `{ width?: Animatable<number>; color?: Color; align?: "inside" | "center" | "outside"; join?: "miter" | "round" | "bevel"; dash?: number[] }` |  |  |
| `shadow` | `{ x?: number; y?: number; blur?: number; color?: Color; opacity?: number }[]` |  | Multiple shadows, drawn in order. |
| `glow` | `{ color?: Color; radius?: number; intensity?: number }` |  |  |
| `outline` | `{ width?: number; color?: Color; gap?: number }` |  | A box outline around the text block. |
| `blur` | `number` | `0` | animatable; range 0..200; unit px |
| `extrude` | `{ depth?: number; color?: Color }` |  | 3D extrusion is a later tier: typed stub, ignored with a warning. |
| `glitch` | `number` | `0` | Glitch amount (jitter, skew, hue flips).; animatable; range 0..3; step 0.05 |
| `rgbSplit` | `number` | `0` | animatable; range 0..60; unit px |

```ts
export interface TextProps {
  /** Stable unique id. Written back as fm_… when missing. */
  id?: string;
  label?: string;
  /** Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s */
  start?: Time;
  /** Defaults to the rest of the parent.; unit s */
  duration?: Time;
  /** Alternative to duration.; unit s */
  end?: Time;
  /** default false */
  hidden?: boolean;
  /** Link group id: linked clips move, trim and split together. */
  link?: string;
  /** unit px; default [0,0,0] */
  position?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0,0] */
  rotation?: Animatable<number | Vec2 | Vec3>;
  /** default [1,1,1] */
  scale?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0] */
  skew?: Animatable<number | Vec2>;
  /** Transform origin as % of the layer box (z in px).; unit %; default [50,50,0] */
  anchor?: Animatable<number | Vec2 | Vec3>;
  /** range 0..1; default 1 */
  opacity?: Animatable<number>;
  crop?: { top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> };
  /** default "none" */
  flip?: "none" | "x" | "y" | "xy";
  /** default "normal" */
  blend?: "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | "color-burn" | "soft-light" | "hard-light" | "difference" | "exclusion" | "hue" | "saturation" | "color" | "luminosity" | "add";
  /** range 0..∞; unit px; default 0 */
  perspective?: Animatable<number>;
  /** Stacking override among siblings.; default 0 */
  z?: number;
  /** Entrance motion at the start of the layer. */
  enter?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  /** Exit motion ending at the end of the layer. */
  exit?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  /** Placement: center | top | bottom | left | right | top-left | top-right | bottom-left | bottom-right or [x, y] (px, %, vw, vh) from the top-left.; default "center" */
  at?: unknown;
  /** The text. Children (strings, <Span>, <B>, <I>, <Highlight>, <Underline>) work too. */
  text?: string;
  /** Inline markup: "**bold** _italic_ ==highlight== ~~strike~~". */
  markup?: string;
  /** Font id or token, e.g. "display" or "$type.display".; default "$type.body" */
  font?: string;
  /** range 1..1000; unit wght; default 400 */
  weight?: Animatable<number>;
  /** Font width (wdth axis).; range 25..200; unit %; default 100 */
  width?: Animatable<number>;
  /** default "normal" */
  style?: "normal" | "italic" | "oblique";
  /** range 1..2000; unit px; default 64 */
  size?: Animatable<number>;
  /** Animatable variable-font axes. `custom` takes static values for other axes. */
  axes?: { wght?: Animatable<number>; wdth?: Animatable<number>; slnt?: Animatable<number>; ital?: Animatable<number>; opsz?: Animatable<number>; custom?: unknown };
  /** Line height multiplier.; range 0.5..4; default 1.15 */
  leading?: Animatable<number>;
  /** Letter spacing in thousandths of an em.; range -500..2000; unit ‰em; default 0 */
  tracking?: Animatable<number>;
  /** range -500..2000; unit ‰em; default 0 */
  wordSpacing?: Animatable<number>;
  /** unit px; default 0 */
  indent?: number;
  /** unit px; default 0 */
  paragraphSpacing?: number;
  /** unit px; default 0 */
  baselineShift?: Animatable<number>;
  /** default "left" */
  align?: "left" | "center" | "right" | "justify";
  /** default "top" */
  valign?: "top" | "middle" | "bottom";
  /** default "90%" */
  maxWidth?: Length;
  /** A fixed box; `valign` and `fit` use it. */
  box?: { width?: Length; height?: Length };
  /** default true */
  wrap?: boolean;
  /** Balance line lengths.; default false */
  balance?: boolean;
  /** default false */
  hyphenate?: boolean;
  /** default "visible" */
  overflow?: "visible" | "hidden" | "ellipsis";
  /** range 1..8; default 1 */
  columns?: number;
  /** default "ltr" */
  direction?: "ltr" | "rtl";
  /** BCP-47 language, e.g. "en", "hi". */
  lang?: string;
  /** default "none" */
  case?: "none" | "upper" | "lower" | "title" | "small-caps";
  /** OpenType features: "liga", "kern", "tnum", "lnum", "onum", "ss01"…"ss20", "salt". */
  features?: string[];
  /** default "default" */
  numeric?: "default" | "tabular" | "proportional" | "lining" | "oldstyle";
  /** Shrinks the size until the text fits the box / line count. */
  fit?: { minSize?: number; maxSize?: number; maxLines?: number };
  underline?: { style?: "solid" | "dashed" | "dotted" | "wavy" | "double"; thickness?: number; offset?: number; color?: Color; progress?: Animatable<number> };
  strike?: { style?: "solid" | "dashed" | "dotted" | "wavy" | "double"; thickness?: number; offset?: number; color?: Color; progress?: Animatable<number> };
  highlight?: { color?: Color; padding?: number; radius?: number; progress?: Animatable<number>; opacity?: number };
  /** Solid, gradient, image or video clipped to the letter shapes.; default "#ffffff" */
  fill?: Fill;
  stroke?: { width?: Animatable<number>; color?: Color; align?: "inside" | "center" | "outside"; join?: "miter" | "round" | "bevel"; dash?: number[] };
  /** Multiple shadows, drawn in order. */
  shadow?: { x?: number; y?: number; blur?: number; color?: Color; opacity?: number }[];
  glow?: { color?: Color; radius?: number; intensity?: number };
  /** A box outline around the text block. */
  outline?: { width?: number; color?: Color; gap?: number };
  /** range 0..200; unit px; default 0 */
  blur?: Animatable<number>;
  /** 3D extrusion is a later tier: typed stub, ignored with a warning. */
  extrude?: { depth?: number; color?: Color };
  /** Glitch amount (jitter, skew, hue flips).; range 0..3; default 0 */
  glitch?: Animatable<number>;
  /** range 0..60; unit px; default 0 */
  rgbSplit?: Animatable<number>;
  children?: unknown;
}
```

---

# Title

*component, category: text*

A headline: Text with display-face defaults (700 weight, centred, tight leading).

Children: any layers and effects.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  | Stable unique id. Written back as fm_… when missing. |
| `label` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s |
| `duration` | `Time` |  | Defaults to the rest of the parent.; unit s |
| `end` | `Time` |  | Alternative to duration.; unit s |
| `hidden` | `boolean` | `false` |  |
| `link` | `string` |  | Link group id: linked clips move, trim and split together. |
| `position` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit px; ui vec |
| `rotation` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit deg; ui vec |
| `scale` | `number | Vec2 | Vec3` | `[1,1,1]` | animatable; step 0.01; ui vec |
| `skew` | `number | Vec2` | `[0,0]` | animatable; unit deg; ui vec |
| `anchor` | `number | Vec2 | Vec3` | `[50,50,0]` | Transform origin as % of the layer box (z in px).; animatable; unit %; ui vec |
| `opacity` | `number` | `1` | animatable; range 0..1; step 0.01; ui slider |
| `crop` | `{ top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> }` |  |  |
| `flip` | `none` \| `x` \| `y` \| `xy` | `"none"` |  |
| `blend` | `normal` \| `multiply` \| `screen` \| `overlay` \| `darken` \| `lighten` \| `color-dodge` \| `color-burn` \| `soft-light` \| `hard-light` \| `difference` \| `exclusion` \| `hue` \| `saturation` \| `color` \| `luminosity` \| `add` | `"normal"` | ui dropdown |
| `perspective` | `number` | `0` | animatable; range 0..∞; unit px |
| `z` | `number` | `0` | Stacking override among siblings.; step 1 |
| `enter` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Entrance motion at the start of the layer. |
| `exit` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Exit motion ending at the end of the layer. |
| `at` | `unknown` | `"center"` | Placement: center | top | bottom | left | right | top-left | top-right | bottom-left | bottom-right or [x, y] (px, %, vw, vh) from the top-left. |
| `text` | `string` |  | The text. Children (strings, <Span>, <B>, <I>, <Highlight>, <Underline>) work too. |
| `markup` | `string` |  | Inline markup: "**bold** _italic_ ==highlight== ~~strike~~". |
| `font` | `string` | `"$type.display"` |  |
| `weight` | `number` | `700` | animatable; range 1..1000; step 1; unit wght |
| `width` | `number` | `100` | Font width (wdth axis).; animatable; range 25..200; step 1; unit % |
| `style` | `normal` \| `italic` \| `oblique` | `"normal"` |  |
| `size` | `number` | `96` | animatable; range 1..2000; step 1; unit px |
| `axes` | `{ wght?: Animatable<number>; wdth?: Animatable<number>; slnt?: Animatable<number>; ital?: Animatable<number>; opsz?: Animatable<number>; custom?: unknown }` |  | Animatable variable-font axes. `custom` takes static values for other axes. |
| `leading` | `number` | `1.05` | animatable; range 0.5..4; step 0.01 |
| `tracking` | `number` | `-15` | animatable; range -500..2000; step 1; unit ‰em |
| `wordSpacing` | `number` | `0` | animatable; range -500..2000; unit ‰em |
| `indent` | `number` | `0` | unit px |
| `paragraphSpacing` | `number` | `0` | unit px |
| `baselineShift` | `number` | `0` | animatable; unit px |
| `align` | `left` \| `center` \| `right` \| `justify` | `"center"` |  |
| `valign` | `top` \| `middle` \| `bottom` | `"top"` |  |
| `maxWidth` | `Length` | `"90%"` |  |
| `box` | `{ width?: Length; height?: Length }` |  | A fixed box; `valign` and `fit` use it. |
| `wrap` | `boolean` | `true` |  |
| `balance` | `boolean` | `false` | Balance line lengths. |
| `hyphenate` | `boolean` | `false` |  |
| `overflow` | `visible` \| `hidden` \| `ellipsis` | `"visible"` |  |
| `columns` | `number` | `1` | range 1..8 |
| `direction` | `ltr` \| `rtl` | `"ltr"` |  |
| `lang` | `string` |  | BCP-47 language, e.g. "en", "hi". |
| `case` | `none` \| `upper` \| `lower` \| `title` \| `small-caps` | `"none"` |  |
| `features` | `string[]` |  | OpenType features: "liga", "kern", "tnum", "lnum", "onum", "ss01"…"ss20", "salt". |
| `numeric` | `default` \| `tabular` \| `proportional` \| `lining` \| `oldstyle` | `"default"` |  |
| `fit` | `{ minSize?: number; maxSize?: number; maxLines?: number }` |  | Shrinks the size until the text fits the box / line count. |
| `underline` | `{ style?: "solid" | "dashed" | "dotted" | "wavy" | "double"; thickness?: number; offset?: number; color?: Color; progress?: Animatable<number> }` |  |  |
| `strike` | `{ style?: "solid" | "dashed" | "dotted" | "wavy" | "double"; thickness?: number; offset?: number; color?: Color; progress?: Animatable<number> }` |  |  |
| `highlight` | `{ color?: Color; padding?: number; radius?: number; progress?: Animatable<number>; opacity?: number }` |  |  |
| `fill` | `Fill` | `"#ffffff"` | Solid, gradient, image or video clipped to the letter shapes. |
| `stroke` | `{ width?: Animatable<number>; color?: Color; align?: "inside" | "center" | "outside"; join?: "miter" | "round" | "bevel"; dash?: number[] }` |  |  |
| `shadow` | `{ x?: number; y?: number; blur?: number; color?: Color; opacity?: number }[]` |  | Multiple shadows, drawn in order. |
| `glow` | `{ color?: Color; radius?: number; intensity?: number }` |  |  |
| `outline` | `{ width?: number; color?: Color; gap?: number }` |  | A box outline around the text block. |
| `blur` | `number` | `0` | animatable; range 0..200; unit px |
| `extrude` | `{ depth?: number; color?: Color }` |  | 3D extrusion is a later tier: typed stub, ignored with a warning. |
| `glitch` | `number` | `0` | Glitch amount (jitter, skew, hue flips).; animatable; range 0..3; step 0.05 |
| `rgbSplit` | `number` | `0` | animatable; range 0..60; unit px |

```ts
export interface TitleProps {
  /** Stable unique id. Written back as fm_… when missing. */
  id?: string;
  label?: string;
  /** Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s */
  start?: Time;
  /** Defaults to the rest of the parent.; unit s */
  duration?: Time;
  /** Alternative to duration.; unit s */
  end?: Time;
  /** default false */
  hidden?: boolean;
  /** Link group id: linked clips move, trim and split together. */
  link?: string;
  /** unit px; default [0,0,0] */
  position?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0,0] */
  rotation?: Animatable<number | Vec2 | Vec3>;
  /** default [1,1,1] */
  scale?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0] */
  skew?: Animatable<number | Vec2>;
  /** Transform origin as % of the layer box (z in px).; unit %; default [50,50,0] */
  anchor?: Animatable<number | Vec2 | Vec3>;
  /** range 0..1; default 1 */
  opacity?: Animatable<number>;
  crop?: { top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> };
  /** default "none" */
  flip?: "none" | "x" | "y" | "xy";
  /** default "normal" */
  blend?: "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | "color-burn" | "soft-light" | "hard-light" | "difference" | "exclusion" | "hue" | "saturation" | "color" | "luminosity" | "add";
  /** range 0..∞; unit px; default 0 */
  perspective?: Animatable<number>;
  /** Stacking override among siblings.; default 0 */
  z?: number;
  /** Entrance motion at the start of the layer. */
  enter?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  /** Exit motion ending at the end of the layer. */
  exit?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  /** Placement: center | top | bottom | left | right | top-left | top-right | bottom-left | bottom-right or [x, y] (px, %, vw, vh) from the top-left.; default "center" */
  at?: unknown;
  /** The text. Children (strings, <Span>, <B>, <I>, <Highlight>, <Underline>) work too. */
  text?: string;
  /** Inline markup: "**bold** _italic_ ==highlight== ~~strike~~". */
  markup?: string;
  /** default "$type.display" */
  font?: string;
  /** range 1..1000; unit wght; default 700 */
  weight?: Animatable<number>;
  /** Font width (wdth axis).; range 25..200; unit %; default 100 */
  width?: Animatable<number>;
  /** default "normal" */
  style?: "normal" | "italic" | "oblique";
  /** range 1..2000; unit px; default 96 */
  size?: Animatable<number>;
  /** Animatable variable-font axes. `custom` takes static values for other axes. */
  axes?: { wght?: Animatable<number>; wdth?: Animatable<number>; slnt?: Animatable<number>; ital?: Animatable<number>; opsz?: Animatable<number>; custom?: unknown };
  /** range 0.5..4; default 1.05 */
  leading?: Animatable<number>;
  /** range -500..2000; unit ‰em; default -15 */
  tracking?: Animatable<number>;
  /** range -500..2000; unit ‰em; default 0 */
  wordSpacing?: Animatable<number>;
  /** unit px; default 0 */
  indent?: number;
  /** unit px; default 0 */
  paragraphSpacing?: number;
  /** unit px; default 0 */
  baselineShift?: Animatable<number>;
  /** default "center" */
  align?: "left" | "center" | "right" | "justify";
  /** default "top" */
  valign?: "top" | "middle" | "bottom";
  /** default "90%" */
  maxWidth?: Length;
  /** A fixed box; `valign` and `fit` use it. */
  box?: { width?: Length; height?: Length };
  /** default true */
  wrap?: boolean;
  /** Balance line lengths.; default false */
  balance?: boolean;
  /** default false */
  hyphenate?: boolean;
  /** default "visible" */
  overflow?: "visible" | "hidden" | "ellipsis";
  /** range 1..8; default 1 */
  columns?: number;
  /** default "ltr" */
  direction?: "ltr" | "rtl";
  /** BCP-47 language, e.g. "en", "hi". */
  lang?: string;
  /** default "none" */
  case?: "none" | "upper" | "lower" | "title" | "small-caps";
  /** OpenType features: "liga", "kern", "tnum", "lnum", "onum", "ss01"…"ss20", "salt". */
  features?: string[];
  /** default "default" */
  numeric?: "default" | "tabular" | "proportional" | "lining" | "oldstyle";
  /** Shrinks the size until the text fits the box / line count. */
  fit?: { minSize?: number; maxSize?: number; maxLines?: number };
  underline?: { style?: "solid" | "dashed" | "dotted" | "wavy" | "double"; thickness?: number; offset?: number; color?: Color; progress?: Animatable<number> };
  strike?: { style?: "solid" | "dashed" | "dotted" | "wavy" | "double"; thickness?: number; offset?: number; color?: Color; progress?: Animatable<number> };
  highlight?: { color?: Color; padding?: number; radius?: number; progress?: Animatable<number>; opacity?: number };
  /** Solid, gradient, image or video clipped to the letter shapes.; default "#ffffff" */
  fill?: Fill;
  stroke?: { width?: Animatable<number>; color?: Color; align?: "inside" | "center" | "outside"; join?: "miter" | "round" | "bevel"; dash?: number[] };
  /** Multiple shadows, drawn in order. */
  shadow?: { x?: number; y?: number; blur?: number; color?: Color; opacity?: number }[];
  glow?: { color?: Color; radius?: number; intensity?: number };
  /** A box outline around the text block. */
  outline?: { width?: number; color?: Color; gap?: number };
  /** range 0..200; unit px; default 0 */
  blur?: Animatable<number>;
  /** 3D extrusion is a later tier: typed stub, ignored with a warning. */
  extrude?: { depth?: number; color?: Color };
  /** Glitch amount (jitter, skew, hue flips).; range 0..3; default 0 */
  glitch?: Animatable<number>;
  /** range 0..60; unit px; default 0 */
  rgbSplit?: Animatable<number>;
  children?: unknown;
}
```

---

# SplitText

*component, category: text*

The simple form of TextAnimator: splits text into characters, words or lines and staggers a preset or custom props across them.

Children: any layers and effects.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  | Stable unique id. Written back as fm_… when missing. |
| `label` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s |
| `duration` | `Time` |  | Defaults to the rest of the parent.; unit s |
| `end` | `Time` |  | Alternative to duration.; unit s |
| `hidden` | `boolean` | `false` |  |
| `link` | `string` |  | Link group id: linked clips move, trim and split together. |
| `position` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit px; ui vec |
| `rotation` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit deg; ui vec |
| `scale` | `number | Vec2 | Vec3` | `[1,1,1]` | animatable; step 0.01; ui vec |
| `skew` | `number | Vec2` | `[0,0]` | animatable; unit deg; ui vec |
| `anchor` | `number | Vec2 | Vec3` | `[50,50,0]` | Transform origin as % of the layer box (z in px).; animatable; unit %; ui vec |
| `opacity` | `number` | `1` | animatable; range 0..1; step 0.01; ui slider |
| `crop` | `{ top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> }` |  |  |
| `flip` | `none` \| `x` \| `y` \| `xy` | `"none"` |  |
| `blend` | `normal` \| `multiply` \| `screen` \| `overlay` \| `darken` \| `lighten` \| `color-dodge` \| `color-burn` \| `soft-light` \| `hard-light` \| `difference` \| `exclusion` \| `hue` \| `saturation` \| `color` \| `luminosity` \| `add` | `"normal"` | ui dropdown |
| `perspective` | `number` | `0` | animatable; range 0..∞; unit px |
| `z` | `number` | `0` | Stacking override among siblings.; step 1 |
| `enter` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Entrance motion at the start of the layer. |
| `exit` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Exit motion ending at the end of the layer. |
| `at` | `unknown` | `"center"` | Placement: center | top | bottom | left | right | top-left | top-right | bottom-left | bottom-right or [x, y] (px, %, vw, vh) from the top-left. |
| `text` | `string` |  | The text. Children (strings, <Span>, <B>, <I>, <Highlight>, <Underline>) work too. |
| `markup` | `string` |  | Inline markup: "**bold** _italic_ ==highlight== ~~strike~~". |
| `font` | `string` | `"$type.display"` |  |
| `weight` | `number` | `700` | animatable; range 1..1000; step 1; unit wght |
| `width` | `number` | `100` | Font width (wdth axis).; animatable; range 25..200; step 1; unit % |
| `style` | `normal` \| `italic` \| `oblique` | `"normal"` |  |
| `size` | `number` | `96` | animatable; range 1..2000; step 1; unit px |
| `axes` | `{ wght?: Animatable<number>; wdth?: Animatable<number>; slnt?: Animatable<number>; ital?: Animatable<number>; opsz?: Animatable<number>; custom?: unknown }` |  | Animatable variable-font axes. `custom` takes static values for other axes. |
| `leading` | `number` | `1.15` | Line height multiplier.; animatable; range 0.5..4; step 0.01 |
| `tracking` | `number` | `0` | Letter spacing in thousandths of an em.; animatable; range -500..2000; step 1; unit ‰em |
| `wordSpacing` | `number` | `0` | animatable; range -500..2000; unit ‰em |
| `indent` | `number` | `0` | unit px |
| `paragraphSpacing` | `number` | `0` | unit px |
| `baselineShift` | `number` | `0` | animatable; unit px |
| `align` | `left` \| `center` \| `right` \| `justify` | `"center"` |  |
| `valign` | `top` \| `middle` \| `bottom` | `"top"` |  |
| `maxWidth` | `Length` | `"90%"` |  |
| `box` | `{ width?: Length; height?: Length }` |  | A fixed box; `valign` and `fit` use it. |
| `wrap` | `boolean` | `true` |  |
| `balance` | `boolean` | `false` | Balance line lengths. |
| `hyphenate` | `boolean` | `false` |  |
| `overflow` | `visible` \| `hidden` \| `ellipsis` | `"visible"` |  |
| `columns` | `number` | `1` | range 1..8 |
| `direction` | `ltr` \| `rtl` | `"ltr"` |  |
| `lang` | `string` |  | BCP-47 language, e.g. "en", "hi". |
| `case` | `none` \| `upper` \| `lower` \| `title` \| `small-caps` | `"none"` |  |
| `features` | `string[]` |  | OpenType features: "liga", "kern", "tnum", "lnum", "onum", "ss01"…"ss20", "salt". |
| `numeric` | `default` \| `tabular` \| `proportional` \| `lining` \| `oldstyle` | `"default"` |  |
| `fit` | `{ minSize?: number; maxSize?: number; maxLines?: number }` |  | Shrinks the size until the text fits the box / line count. |
| `underline` | `{ style?: "solid" | "dashed" | "dotted" | "wavy" | "double"; thickness?: number; offset?: number; color?: Color; progress?: Animatable<number> }` |  |  |
| `strike` | `{ style?: "solid" | "dashed" | "dotted" | "wavy" | "double"; thickness?: number; offset?: number; color?: Color; progress?: Animatable<number> }` |  |  |
| `highlight` | `{ color?: Color; padding?: number; radius?: number; progress?: Animatable<number>; opacity?: number }` |  |  |
| `fill` | `Fill` | `"#ffffff"` | Solid, gradient, image or video clipped to the letter shapes. |
| `stroke` | `{ width?: Animatable<number>; color?: Color; align?: "inside" | "center" | "outside"; join?: "miter" | "round" | "bevel"; dash?: number[] }` |  |  |
| `shadow` | `{ x?: number; y?: number; blur?: number; color?: Color; opacity?: number }[]` |  | Multiple shadows, drawn in order. |
| `glow` | `{ color?: Color; radius?: number; intensity?: number }` |  |  |
| `outline` | `{ width?: number; color?: Color; gap?: number }` |  | A box outline around the text block. |
| `blur` | `number` | `0` | animatable; range 0..200; unit px |
| `extrude` | `{ depth?: number; color?: Color }` |  | 3D extrusion is a later tier: typed stub, ignored with a warning. |
| `glitch` | `number` | `0` | Glitch amount (jitter, skew, hue flips).; animatable; range 0..3; step 0.05 |
| `rgbSplit` | `number` | `0` | animatable; range 0..60; unit px |
| `by` | `char` \| `word` \| `line` |  | Unit to split by (default: the preset's). |
| `preset` | `rise` \| `typewriter` \| `wave` \| `scramble` \| `slam` \| `blur-in` \| `mask-reveal` \| `weight-pulse` \| `tracking-in` \| `counter` \| `none` | `"rise"` |  |
| `stagger` | `Time` |  | Seconds between units (0.05–0.1 reads well).; range 0..∞; unit s |
| `unitDuration` | `Time` |  | range 0..∞; unit s |
| `ease` | `string` |  |  |
| `order` | `forward` \| `backward` \| `center` \| `edges` \| `random` | `"forward"` |  |
| `seed` | `number` | `1` |  |
| `from` | `Color` |  | Optional start fill colour to interpolate from (props.fill). |

```ts
export interface SplitTextProps {
  /** Stable unique id. Written back as fm_… when missing. */
  id?: string;
  label?: string;
  /** Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s */
  start?: Time;
  /** Defaults to the rest of the parent.; unit s */
  duration?: Time;
  /** Alternative to duration.; unit s */
  end?: Time;
  /** default false */
  hidden?: boolean;
  /** Link group id: linked clips move, trim and split together. */
  link?: string;
  /** unit px; default [0,0,0] */
  position?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0,0] */
  rotation?: Animatable<number | Vec2 | Vec3>;
  /** default [1,1,1] */
  scale?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0] */
  skew?: Animatable<number | Vec2>;
  /** Transform origin as % of the layer box (z in px).; unit %; default [50,50,0] */
  anchor?: Animatable<number | Vec2 | Vec3>;
  /** range 0..1; default 1 */
  opacity?: Animatable<number>;
  crop?: { top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> };
  /** default "none" */
  flip?: "none" | "x" | "y" | "xy";
  /** default "normal" */
  blend?: "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | "color-burn" | "soft-light" | "hard-light" | "difference" | "exclusion" | "hue" | "saturation" | "color" | "luminosity" | "add";
  /** range 0..∞; unit px; default 0 */
  perspective?: Animatable<number>;
  /** Stacking override among siblings.; default 0 */
  z?: number;
  /** Entrance motion at the start of the layer. */
  enter?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  /** Exit motion ending at the end of the layer. */
  exit?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  /** Placement: center | top | bottom | left | right | top-left | top-right | bottom-left | bottom-right or [x, y] (px, %, vw, vh) from the top-left.; default "center" */
  at?: unknown;
  /** The text. Children (strings, <Span>, <B>, <I>, <Highlight>, <Underline>) work too. */
  text?: string;
  /** Inline markup: "**bold** _italic_ ==highlight== ~~strike~~". */
  markup?: string;
  /** default "$type.display" */
  font?: string;
  /** range 1..1000; unit wght; default 700 */
  weight?: Animatable<number>;
  /** Font width (wdth axis).; range 25..200; unit %; default 100 */
  width?: Animatable<number>;
  /** default "normal" */
  style?: "normal" | "italic" | "oblique";
  /** range 1..2000; unit px; default 96 */
  size?: Animatable<number>;
  /** Animatable variable-font axes. `custom` takes static values for other axes. */
  axes?: { wght?: Animatable<number>; wdth?: Animatable<number>; slnt?: Animatable<number>; ital?: Animatable<number>; opsz?: Animatable<number>; custom?: unknown };
  /** Line height multiplier.; range 0.5..4; default 1.15 */
  leading?: Animatable<number>;
  /** Letter spacing in thousandths of an em.; range -500..2000; unit ‰em; default 0 */
  tracking?: Animatable<number>;
  /** range -500..2000; unit ‰em; default 0 */
  wordSpacing?: Animatable<number>;
  /** unit px; default 0 */
  indent?: number;
  /** unit px; default 0 */
  paragraphSpacing?: number;
  /** unit px; default 0 */
  baselineShift?: Animatable<number>;
  /** default "center" */
  align?: "left" | "center" | "right" | "justify";
  /** default "top" */
  valign?: "top" | "middle" | "bottom";
  /** default "90%" */
  maxWidth?: Length;
  /** A fixed box; `valign` and `fit` use it. */
  box?: { width?: Length; height?: Length };
  /** default true */
  wrap?: boolean;
  /** Balance line lengths.; default false */
  balance?: boolean;
  /** default false */
  hyphenate?: boolean;
  /** default "visible" */
  overflow?: "visible" | "hidden" | "ellipsis";
  /** range 1..8; default 1 */
  columns?: number;
  /** default "ltr" */
  direction?: "ltr" | "rtl";
  /** BCP-47 language, e.g. "en", "hi". */
  lang?: string;
  /** default "none" */
  case?: "none" | "upper" | "lower" | "title" | "small-caps";
  /** OpenType features: "liga", "kern", "tnum", "lnum", "onum", "ss01"…"ss20", "salt". */
  features?: string[];
  /** default "default" */
  numeric?: "default" | "tabular" | "proportional" | "lining" | "oldstyle";
  /** Shrinks the size until the text fits the box / line count. */
  fit?: { minSize?: number; maxSize?: number; maxLines?: number };
  underline?: { style?: "solid" | "dashed" | "dotted" | "wavy" | "double"; thickness?: number; offset?: number; color?: Color; progress?: Animatable<number> };
  strike?: { style?: "solid" | "dashed" | "dotted" | "wavy" | "double"; thickness?: number; offset?: number; color?: Color; progress?: Animatable<number> };
  highlight?: { color?: Color; padding?: number; radius?: number; progress?: Animatable<number>; opacity?: number };
  /** Solid, gradient, image or video clipped to the letter shapes.; default "#ffffff" */
  fill?: Fill;
  stroke?: { width?: Animatable<number>; color?: Color; align?: "inside" | "center" | "outside"; join?: "miter" | "round" | "bevel"; dash?: number[] };
  /** Multiple shadows, drawn in order. */
  shadow?: { x?: number; y?: number; blur?: number; color?: Color; opacity?: number }[];
  glow?: { color?: Color; radius?: number; intensity?: number };
  /** A box outline around the text block. */
  outline?: { width?: number; color?: Color; gap?: number };
  /** range 0..200; unit px; default 0 */
  blur?: Animatable<number>;
  /** 3D extrusion is a later tier: typed stub, ignored with a warning. */
  extrude?: { depth?: number; color?: Color };
  /** Glitch amount (jitter, skew, hue flips).; range 0..3; default 0 */
  glitch?: Animatable<number>;
  /** range 0..60; unit px; default 0 */
  rgbSplit?: Animatable<number>;
  /** Unit to split by (default: the preset's). */
  by?: "char" | "word" | "line";
  /** default "rise" */
  preset?: "rise" | "typewriter" | "wave" | "scramble" | "slam" | "blur-in" | "mask-reveal" | "weight-pulse" | "tracking-in" | "counter" | "none";
  /** Seconds between units (0.05–0.1 reads well).; range 0..∞; unit s */
  stagger?: Time;
  /** range 0..∞; unit s */
  unitDuration?: Time;
  ease?: string;
  /** default "forward" */
  order?: "forward" | "backward" | "center" | "edges" | "random";
  /** default 1 */
  seed?: number;
  /** Optional start fill colour to interpolate from (props.fill). */
  from?: Color;
  children?: unknown;
}
```

---

# Span

*component, category: text*

Inline run inside Text that overrides font, weight, colour, size and features.

Children: any layers and effects.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `font` | `string` |  |  |
| `weight` | `number` |  | range 1..1000 |
| `color` | `Color` |  |  |
| `size` | `number` |  | Multiplier of the parent size (em).; range 0.1..10 |
| `tracking` | `number` |  | unit ‰em |
| `features` | `string[]` |  |  |
| `style` | `normal` \| `italic` \| `oblique` |  |  |
| `id` | `string` |  | Stable unique id. Written back as fm_… when missing. |

```ts
export interface SpanProps {
  font?: string;
  /** range 1..1000 */
  weight?: number;
  color?: Color;
  /** Multiplier of the parent size (em).; range 0.1..10 */
  size?: number;
  /** unit ‰em */
  tracking?: number;
  features?: string[];
  style?: "normal" | "italic" | "oblique";
  /** Stable unique id. Written back as fm_… when missing. */
  id?: string;
  children?: unknown;
}
```

---

# B

*component, category: text*

Bold run inside Text.

Children: any layers and effects.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `weight` | `number` | `700` | range 1..1000 |
| `id` | `string` |  | Stable unique id. Written back as fm_… when missing. |

```ts
export interface BProps {
  /** range 1..1000; default 700 */
  weight?: number;
  /** Stable unique id. Written back as fm_… when missing. */
  id?: string;
  children?: unknown;
}
```

---

# I

*component, category: text*

Italic run inside Text.

Children: any layers and effects.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `skew` | `number` | `0` |  |
| `id` | `string` |  | Stable unique id. Written back as fm_… when missing. |

```ts
export interface IProps {
  /** default 0 */
  skew?: number;
  /** Stable unique id. Written back as fm_… when missing. */
  id?: string;
  children?: unknown;
}
```

---

# Highlight

*component, category: text*

Marker-pen highlight behind an inline run. `progress` animates a left-to-right wipe.

Children: any layers and effects.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `color` | `Color` | `"#ffe14d"` |  |
| `padding` | `number` | `6` | range 0..∞; unit px |
| `radius` | `number` | `6` | range 0..∞; unit px |
| `progress` | `number` | `1` | animatable; range 0..1; step 0.01 |
| `id` | `string` |  | Stable unique id. Written back as fm_… when missing. |

```ts
export interface HighlightProps {
  /** default "#ffe14d" */
  color?: Color;
  /** range 0..∞; unit px; default 6 */
  padding?: number;
  /** range 0..∞; unit px; default 6 */
  radius?: number;
  /** range 0..1; default 1 */
  progress?: Animatable<number>;
  /** Stable unique id. Written back as fm_… when missing. */
  id?: string;
  children?: unknown;
}
```

---

# Underline

*component, category: text*

Underline for an inline run. `progress` animates a draw-on from left to right.

Children: any layers and effects.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `color` | `Color` | `"#ffffff"` |  |
| `thickness` | `number` | `4` | range 0..∞; unit px |
| `offset` | `number` | `4` | unit px |
| `progress` | `number` | `1` | animatable; range 0..1; step 0.01 |
| `id` | `string` |  | Stable unique id. Written back as fm_… when missing. |

```ts
export interface UnderlineProps {
  /** default "#ffffff" */
  color?: Color;
  /** range 0..∞; unit px; default 4 */
  thickness?: number;
  /** unit px; default 4 */
  offset?: number;
  /** range 0..1; default 1 */
  progress?: Animatable<number>;
  /** Stable unique id. Written back as fm_… when missing. */
  id?: string;
  children?: unknown;
}
```

---

# Strike

*component, category: text*

Strike-through for an inline run. `progress` animates a draw-on from left to right.

Children: any layers and effects.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `color` | `Color` | `"#ffffff"` |  |
| `thickness` | `number` | `4` | range 0..∞; unit px |
| `offset` | `number` | `4` | unit px |
| `progress` | `number` | `1` | animatable; range 0..1; step 0.01 |
| `id` | `string` |  | Stable unique id. Written back as fm_… when missing. |

```ts
export interface StrikeProps {
  /** default "#ffffff" */
  color?: Color;
  /** range 0..∞; unit px; default 4 */
  thickness?: number;
  /** unit px; default 4 */
  offset?: number;
  /** range 0..1; default 1 */
  progress?: Animatable<number>;
  /** Stable unique id. Written back as fm_… when missing. */
  id?: string;
  children?: unknown;
}
```

---

# UIMock

*component, category: ui*

A device frame (phone, tablet, laptop, browser) whose screen holds child layers. Children place themselves with `at` inside the screen.

Children: any layers and effects.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  | Stable unique id. Written back as fm_… when missing. |
| `label` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s |
| `duration` | `Time` |  | Defaults to the rest of the parent.; unit s |
| `end` | `Time` |  | Alternative to duration.; unit s |
| `hidden` | `boolean` | `false` |  |
| `link` | `string` |  | Link group id: linked clips move, trim and split together. |
| `position` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit px; ui vec |
| `rotation` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit deg; ui vec |
| `scale` | `number | Vec2 | Vec3` | `[1,1,1]` | animatable; step 0.01; ui vec |
| `skew` | `number | Vec2` | `[0,0]` | animatable; unit deg; ui vec |
| `anchor` | `number | Vec2 | Vec3` | `[50,50,0]` | Transform origin as % of the layer box (z in px).; animatable; unit %; ui vec |
| `opacity` | `number` | `1` | animatable; range 0..1; step 0.01; ui slider |
| `crop` | `{ top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> }` |  |  |
| `flip` | `none` \| `x` \| `y` \| `xy` | `"none"` |  |
| `blend` | `normal` \| `multiply` \| `screen` \| `overlay` \| `darken` \| `lighten` \| `color-dodge` \| `color-burn` \| `soft-light` \| `hard-light` \| `difference` \| `exclusion` \| `hue` \| `saturation` \| `color` \| `luminosity` \| `add` | `"normal"` | ui dropdown |
| `perspective` | `number` | `0` | animatable; range 0..∞; unit px |
| `z` | `number` | `0` | Stacking override among siblings.; step 1 |
| `enter` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Entrance motion at the start of the layer. |
| `exit` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Exit motion ending at the end of the layer. |
| `at` | `unknown` | `"center"` | Placement: center | top | bottom | left | right | top-left | top-right | bottom-left | bottom-right or [x, y] (px, %, vw, vh) from the top-left. |
| `device` | `phone` \| `tablet` \| `laptop` \| `browser` | `"phone"` |  |
| `width` | `number` |  | range 100..4000; unit px |
| `height` | `number` |  | range 100..4000; unit px |
| `bezel` | `number` |  | range 0..80; unit px |
| `radius` | `number` |  | range 0..200; unit px |
| `bezelColor` | `Color` | `"#0b0b0f"` |  |
| `screenColor` | `Color` | `"#ffffff"` |  |
| `shadow` | `boolean` | `true` |  |
| `notch` | `boolean` | `true` | Phone camera island. |
| `url` | `string` | `"app.example.com"` | Browser address bar text. |

```ts
export interface UIMockProps {
  /** Stable unique id. Written back as fm_… when missing. */
  id?: string;
  label?: string;
  /** Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s */
  start?: Time;
  /** Defaults to the rest of the parent.; unit s */
  duration?: Time;
  /** Alternative to duration.; unit s */
  end?: Time;
  /** default false */
  hidden?: boolean;
  /** Link group id: linked clips move, trim and split together. */
  link?: string;
  /** unit px; default [0,0,0] */
  position?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0,0] */
  rotation?: Animatable<number | Vec2 | Vec3>;
  /** default [1,1,1] */
  scale?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0] */
  skew?: Animatable<number | Vec2>;
  /** Transform origin as % of the layer box (z in px).; unit %; default [50,50,0] */
  anchor?: Animatable<number | Vec2 | Vec3>;
  /** range 0..1; default 1 */
  opacity?: Animatable<number>;
  crop?: { top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> };
  /** default "none" */
  flip?: "none" | "x" | "y" | "xy";
  /** default "normal" */
  blend?: "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | "color-burn" | "soft-light" | "hard-light" | "difference" | "exclusion" | "hue" | "saturation" | "color" | "luminosity" | "add";
  /** range 0..∞; unit px; default 0 */
  perspective?: Animatable<number>;
  /** Stacking override among siblings.; default 0 */
  z?: number;
  /** Entrance motion at the start of the layer. */
  enter?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  /** Exit motion ending at the end of the layer. */
  exit?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  /** Placement: center | top | bottom | left | right | top-left | top-right | bottom-left | bottom-right or [x, y] (px, %, vw, vh) from the top-left.; default "center" */
  at?: unknown;
  /** default "phone" */
  device?: "phone" | "tablet" | "laptop" | "browser";
  /** range 100..4000; unit px */
  width?: number;
  /** range 100..4000; unit px */
  height?: number;
  /** range 0..80; unit px */
  bezel?: number;
  /** range 0..200; unit px */
  radius?: number;
  /** default "#0b0b0f" */
  bezelColor?: Color;
  /** default "#ffffff" */
  screenColor?: Color;
  /** default true */
  shadow?: boolean;
  /** Phone camera island.; default true */
  notch?: boolean;
  /** Browser address bar text.; default "app.example.com" */
  url?: string;
  children?: unknown;
}
```

---

# Card

*component, category: ui*

A surface with radius, optional stroke and shadow. Children stack top to bottom (or use `layout="absolute"`).

Children: any layers and effects.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  | Stable unique id. Written back as fm_… when missing. |
| `label` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s |
| `duration` | `Time` |  | Defaults to the rest of the parent.; unit s |
| `end` | `Time` |  | Alternative to duration.; unit s |
| `hidden` | `boolean` | `false` |  |
| `link` | `string` |  | Link group id: linked clips move, trim and split together. |
| `position` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit px; ui vec |
| `rotation` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit deg; ui vec |
| `scale` | `number | Vec2 | Vec3` | `[1,1,1]` | animatable; step 0.01; ui vec |
| `skew` | `number | Vec2` | `[0,0]` | animatable; unit deg; ui vec |
| `anchor` | `number | Vec2 | Vec3` | `[50,50,0]` | Transform origin as % of the layer box (z in px).; animatable; unit %; ui vec |
| `opacity` | `number` | `1` | animatable; range 0..1; step 0.01; ui slider |
| `crop` | `{ top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> }` |  |  |
| `flip` | `none` \| `x` \| `y` \| `xy` | `"none"` |  |
| `blend` | `normal` \| `multiply` \| `screen` \| `overlay` \| `darken` \| `lighten` \| `color-dodge` \| `color-burn` \| `soft-light` \| `hard-light` \| `difference` \| `exclusion` \| `hue` \| `saturation` \| `color` \| `luminosity` \| `add` | `"normal"` | ui dropdown |
| `perspective` | `number` | `0` | animatable; range 0..∞; unit px |
| `z` | `number` | `0` | Stacking override among siblings.; step 1 |
| `enter` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Entrance motion at the start of the layer. |
| `exit` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Exit motion ending at the end of the layer. |
| `at` | `unknown` | `"center"` | Placement: center | top | bottom | left | right | top-left | top-right | bottom-left | bottom-right or [x, y] (px, %, vw, vh) from the top-left. |
| `width` | `Length` | `600` |  |
| `height` | `Length` |  |  |
| `padding` | `Length` | `32` |  |
| `gap` | `Length` | `16` |  |
| `radius` | `Length` | `32` |  |
| `fill` | `Fill` | `"#16161d"` |  |
| `stroke` | `{ width?: number; color?: Color; align?: "inside" | "center" | "outside"; cap?: "butt" | "round" | "square"; join?: "miter" | "round" | "bevel"; dash?: number[] }` |  |  |
| `shadow` | `boolean` | `true` |  |
| `layout` | `stack` \| `absolute` | `"stack"` | stack: children flow top to bottom. absolute: children use `at`. |
| `align` | `start` \| `center` \| `end` \| `stretch` | `"stretch"` |  |

```ts
export interface CardProps {
  /** Stable unique id. Written back as fm_… when missing. */
  id?: string;
  label?: string;
  /** Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s */
  start?: Time;
  /** Defaults to the rest of the parent.; unit s */
  duration?: Time;
  /** Alternative to duration.; unit s */
  end?: Time;
  /** default false */
  hidden?: boolean;
  /** Link group id: linked clips move, trim and split together. */
  link?: string;
  /** unit px; default [0,0,0] */
  position?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0,0] */
  rotation?: Animatable<number | Vec2 | Vec3>;
  /** default [1,1,1] */
  scale?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0] */
  skew?: Animatable<number | Vec2>;
  /** Transform origin as % of the layer box (z in px).; unit %; default [50,50,0] */
  anchor?: Animatable<number | Vec2 | Vec3>;
  /** range 0..1; default 1 */
  opacity?: Animatable<number>;
  crop?: { top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> };
  /** default "none" */
  flip?: "none" | "x" | "y" | "xy";
  /** default "normal" */
  blend?: "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | "color-burn" | "soft-light" | "hard-light" | "difference" | "exclusion" | "hue" | "saturation" | "color" | "luminosity" | "add";
  /** range 0..∞; unit px; default 0 */
  perspective?: Animatable<number>;
  /** Stacking override among siblings.; default 0 */
  z?: number;
  /** Entrance motion at the start of the layer. */
  enter?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  /** Exit motion ending at the end of the layer. */
  exit?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  /** Placement: center | top | bottom | left | right | top-left | top-right | bottom-left | bottom-right or [x, y] (px, %, vw, vh) from the top-left.; default "center" */
  at?: unknown;
  /** default 600 */
  width?: Length;
  height?: Length;
  /** default 32 */
  padding?: Length;
  /** default 16 */
  gap?: Length;
  /** default 32 */
  radius?: Length;
  /** default "#16161d" */
  fill?: Fill;
  stroke?: { width?: number; color?: Color; align?: "inside" | "center" | "outside"; cap?: "butt" | "round" | "square"; join?: "miter" | "round" | "bevel"; dash?: number[] };
  /** default true */
  shadow?: boolean;
  /** stack: children flow top to bottom. absolute: children use `at`.; default "stack" */
  layout?: "stack" | "absolute";
  /** default "stretch" */
  align?: "start" | "center" | "end" | "stretch";
  children?: unknown;
}
```

---

# GlassCard

*component, category: ui*

A frosted-glass card: backdrop blur, translucent fill and a hairline border.

Children: any layers and effects.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  | Stable unique id. Written back as fm_… when missing. |
| `label` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s |
| `duration` | `Time` |  | Defaults to the rest of the parent.; unit s |
| `end` | `Time` |  | Alternative to duration.; unit s |
| `hidden` | `boolean` | `false` |  |
| `link` | `string` |  | Link group id: linked clips move, trim and split together. |
| `position` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit px; ui vec |
| `rotation` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit deg; ui vec |
| `scale` | `number | Vec2 | Vec3` | `[1,1,1]` | animatable; step 0.01; ui vec |
| `skew` | `number | Vec2` | `[0,0]` | animatable; unit deg; ui vec |
| `anchor` | `number | Vec2 | Vec3` | `[50,50,0]` | Transform origin as % of the layer box (z in px).; animatable; unit %; ui vec |
| `opacity` | `number` | `1` | animatable; range 0..1; step 0.01; ui slider |
| `crop` | `{ top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> }` |  |  |
| `flip` | `none` \| `x` \| `y` \| `xy` | `"none"` |  |
| `blend` | `normal` \| `multiply` \| `screen` \| `overlay` \| `darken` \| `lighten` \| `color-dodge` \| `color-burn` \| `soft-light` \| `hard-light` \| `difference` \| `exclusion` \| `hue` \| `saturation` \| `color` \| `luminosity` \| `add` | `"normal"` | ui dropdown |
| `perspective` | `number` | `0` | animatable; range 0..∞; unit px |
| `z` | `number` | `0` | Stacking override among siblings.; step 1 |
| `enter` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Entrance motion at the start of the layer. |
| `exit` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Exit motion ending at the end of the layer. |
| `at` | `unknown` | `"center"` | Placement: center | top | bottom | left | right | top-left | top-right | bottom-left | bottom-right or [x, y] (px, %, vw, vh) from the top-left. |
| `width` | `Length` | `600` |  |
| `height` | `Length` |  |  |
| `padding` | `Length` | `32` |  |
| `gap` | `Length` | `16` |  |
| `radius` | `Length` | `32` |  |
| `fill` | `Fill` | `"rgba(255,255,255,0.10)"` |  |
| `stroke` | `{ width?: number; color?: Color; align?: "inside" | "center" | "outside"; cap?: "butt" | "round" | "square"; join?: "miter" | "round" | "bevel"; dash?: number[] }` |  |  |
| `shadow` | `boolean` | `true` |  |
| `layout` | `stack` \| `absolute` | `"stack"` | stack: children flow top to bottom. absolute: children use `at`. |
| `align` | `start` \| `center` \| `end` \| `stretch` | `"stretch"` |  |

```ts
export interface GlassCardProps {
  /** Stable unique id. Written back as fm_… when missing. */
  id?: string;
  label?: string;
  /** Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s */
  start?: Time;
  /** Defaults to the rest of the parent.; unit s */
  duration?: Time;
  /** Alternative to duration.; unit s */
  end?: Time;
  /** default false */
  hidden?: boolean;
  /** Link group id: linked clips move, trim and split together. */
  link?: string;
  /** unit px; default [0,0,0] */
  position?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0,0] */
  rotation?: Animatable<number | Vec2 | Vec3>;
  /** default [1,1,1] */
  scale?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0] */
  skew?: Animatable<number | Vec2>;
  /** Transform origin as % of the layer box (z in px).; unit %; default [50,50,0] */
  anchor?: Animatable<number | Vec2 | Vec3>;
  /** range 0..1; default 1 */
  opacity?: Animatable<number>;
  crop?: { top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> };
  /** default "none" */
  flip?: "none" | "x" | "y" | "xy";
  /** default "normal" */
  blend?: "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | "color-burn" | "soft-light" | "hard-light" | "difference" | "exclusion" | "hue" | "saturation" | "color" | "luminosity" | "add";
  /** range 0..∞; unit px; default 0 */
  perspective?: Animatable<number>;
  /** Stacking override among siblings.; default 0 */
  z?: number;
  /** Entrance motion at the start of the layer. */
  enter?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  /** Exit motion ending at the end of the layer. */
  exit?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  /** Placement: center | top | bottom | left | right | top-left | top-right | bottom-left | bottom-right or [x, y] (px, %, vw, vh) from the top-left.; default "center" */
  at?: unknown;
  /** default 600 */
  width?: Length;
  height?: Length;
  /** default 32 */
  padding?: Length;
  /** default 16 */
  gap?: Length;
  /** default 32 */
  radius?: Length;
  /** default "rgba(255,255,255,0.10)" */
  fill?: Fill;
  stroke?: { width?: number; color?: Color; align?: "inside" | "center" | "outside"; cap?: "butt" | "round" | "square"; join?: "miter" | "round" | "bevel"; dash?: number[] };
  /** default true */
  shadow?: boolean;
  /** stack: children flow top to bottom. absolute: children use `at`.; default "stack" */
  layout?: "stack" | "absolute";
  /** default "stretch" */
  align?: "start" | "center" | "end" | "stretch";
  children?: unknown;
}
```

---

# Cursor

*component, category: ui*

A mouse pointer. Move it by keyframing `position`; `clicks` lists times (relative to the parent) where it presses and a ripple expands.

Children: effects only.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  | Stable unique id. Written back as fm_… when missing. |
| `label` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s |
| `duration` | `Time` |  | Defaults to the rest of the parent.; unit s |
| `end` | `Time` |  | Alternative to duration.; unit s |
| `hidden` | `boolean` | `false` |  |
| `link` | `string` |  | Link group id: linked clips move, trim and split together. |
| `position` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit px; ui vec |
| `rotation` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit deg; ui vec |
| `scale` | `number | Vec2 | Vec3` | `[1,1,1]` | animatable; step 0.01; ui vec |
| `skew` | `number | Vec2` | `[0,0]` | animatable; unit deg; ui vec |
| `anchor` | `number | Vec2 | Vec3` | `[50,50,0]` | Transform origin as % of the layer box (z in px).; animatable; unit %; ui vec |
| `opacity` | `number` | `1` | animatable; range 0..1; step 0.01; ui slider |
| `crop` | `{ top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> }` |  |  |
| `flip` | `none` \| `x` \| `y` \| `xy` | `"none"` |  |
| `blend` | `normal` \| `multiply` \| `screen` \| `overlay` \| `darken` \| `lighten` \| `color-dodge` \| `color-burn` \| `soft-light` \| `hard-light` \| `difference` \| `exclusion` \| `hue` \| `saturation` \| `color` \| `luminosity` \| `add` | `"normal"` | ui dropdown |
| `perspective` | `number` | `0` | animatable; range 0..∞; unit px |
| `z` | `number` | `0` | Stacking override among siblings.; step 1 |
| `enter` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Entrance motion at the start of the layer. |
| `exit` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Exit motion ending at the end of the layer. |
| `at` | `unknown` | `"center"` | Placement: center | top | bottom | left | right | top-left | top-right | bottom-left | bottom-right or [x, y] (px, %, vw, vh) from the top-left. |
| `size` | `number` | `56` | range 8..400; unit px |
| `color` | `Color` | `"#ffffff"` |  |
| `outline` | `Color` | `"#111111"` |  |
| `clicks` | `Time[]` |  |  |
| `ripple` | `number` | `90` | range 0..600; unit px |
| `rippleColor` | `Color` | `"#7c8cff"` |  |

```ts
export interface CursorProps {
  /** Stable unique id. Written back as fm_… when missing. */
  id?: string;
  label?: string;
  /** Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s */
  start?: Time;
  /** Defaults to the rest of the parent.; unit s */
  duration?: Time;
  /** Alternative to duration.; unit s */
  end?: Time;
  /** default false */
  hidden?: boolean;
  /** Link group id: linked clips move, trim and split together. */
  link?: string;
  /** unit px; default [0,0,0] */
  position?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0,0] */
  rotation?: Animatable<number | Vec2 | Vec3>;
  /** default [1,1,1] */
  scale?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0] */
  skew?: Animatable<number | Vec2>;
  /** Transform origin as % of the layer box (z in px).; unit %; default [50,50,0] */
  anchor?: Animatable<number | Vec2 | Vec3>;
  /** range 0..1; default 1 */
  opacity?: Animatable<number>;
  crop?: { top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> };
  /** default "none" */
  flip?: "none" | "x" | "y" | "xy";
  /** default "normal" */
  blend?: "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | "color-burn" | "soft-light" | "hard-light" | "difference" | "exclusion" | "hue" | "saturation" | "color" | "luminosity" | "add";
  /** range 0..∞; unit px; default 0 */
  perspective?: Animatable<number>;
  /** Stacking override among siblings.; default 0 */
  z?: number;
  /** Entrance motion at the start of the layer. */
  enter?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  /** Exit motion ending at the end of the layer. */
  exit?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  /** Placement: center | top | bottom | left | right | top-left | top-right | bottom-left | bottom-right or [x, y] (px, %, vw, vh) from the top-left.; default "center" */
  at?: unknown;
  /** range 8..400; unit px; default 56 */
  size?: number;
  /** default "#ffffff" */
  color?: Color;
  /** default "#111111" */
  outline?: Color;
  clicks?: Time[];
  /** range 0..600; unit px; default 90 */
  ripple?: number;
  /** default "#7c8cff" */
  rippleColor?: Color;
  children?: unknown;
}
```

---

# Chip

*component, category: ui*

A pill label with an optional leading dot.

Children: effects only.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  | Stable unique id. Written back as fm_… when missing. |
| `label` | `string` | `"Label"` |  |
| `start` | `Time` |  | Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s |
| `duration` | `Time` |  | Defaults to the rest of the parent.; unit s |
| `end` | `Time` |  | Alternative to duration.; unit s |
| `hidden` | `boolean` | `false` |  |
| `link` | `string` |  | Link group id: linked clips move, trim and split together. |
| `position` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit px; ui vec |
| `rotation` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit deg; ui vec |
| `scale` | `number | Vec2 | Vec3` | `[1,1,1]` | animatable; step 0.01; ui vec |
| `skew` | `number | Vec2` | `[0,0]` | animatable; unit deg; ui vec |
| `anchor` | `number | Vec2 | Vec3` | `[50,50,0]` | Transform origin as % of the layer box (z in px).; animatable; unit %; ui vec |
| `opacity` | `number` | `1` | animatable; range 0..1; step 0.01; ui slider |
| `crop` | `{ top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> }` |  |  |
| `flip` | `none` \| `x` \| `y` \| `xy` | `"none"` |  |
| `blend` | `normal` \| `multiply` \| `screen` \| `overlay` \| `darken` \| `lighten` \| `color-dodge` \| `color-burn` \| `soft-light` \| `hard-light` \| `difference` \| `exclusion` \| `hue` \| `saturation` \| `color` \| `luminosity` \| `add` | `"normal"` | ui dropdown |
| `perspective` | `number` | `0` | animatable; range 0..∞; unit px |
| `z` | `number` | `0` | Stacking override among siblings.; step 1 |
| `enter` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Entrance motion at the start of the layer. |
| `exit` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Exit motion ending at the end of the layer. |
| `at` | `unknown` | `"center"` | Placement: center | top | bottom | left | right | top-left | top-right | bottom-left | bottom-right or [x, y] (px, %, vw, vh) from the top-left. |
| `fill` | `Fill` | `"#262634"` |  |
| `textColor` | `Color` | `"#ffffff"` |  |
| `dot` | `Color` |  | Leading dot colour. |
| `font` | `string` | `"$type.body"` |  |
| `size` | `number` | `36` | range 8..200; unit px |
| `weight` | `number` | `600` | range 1..1000 |
| `paddingX` | `number` | `28` | range 0..∞; unit px |
| `paddingY` | `number` | `14` | range 0..∞; unit px |
| `stroke` | `{ width?: number; color?: Color; align?: "inside" | "center" | "outside"; cap?: "butt" | "round" | "square"; join?: "miter" | "round" | "bevel"; dash?: number[] }` |  |  |

```ts
export interface ChipProps {
  /** Stable unique id. Written back as fm_… when missing. */
  id?: string;
  /** default "Label" */
  label?: string;
  /** Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s */
  start?: Time;
  /** Defaults to the rest of the parent.; unit s */
  duration?: Time;
  /** Alternative to duration.; unit s */
  end?: Time;
  /** default false */
  hidden?: boolean;
  /** Link group id: linked clips move, trim and split together. */
  link?: string;
  /** unit px; default [0,0,0] */
  position?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0,0] */
  rotation?: Animatable<number | Vec2 | Vec3>;
  /** default [1,1,1] */
  scale?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0] */
  skew?: Animatable<number | Vec2>;
  /** Transform origin as % of the layer box (z in px).; unit %; default [50,50,0] */
  anchor?: Animatable<number | Vec2 | Vec3>;
  /** range 0..1; default 1 */
  opacity?: Animatable<number>;
  crop?: { top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> };
  /** default "none" */
  flip?: "none" | "x" | "y" | "xy";
  /** default "normal" */
  blend?: "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | "color-burn" | "soft-light" | "hard-light" | "difference" | "exclusion" | "hue" | "saturation" | "color" | "luminosity" | "add";
  /** range 0..∞; unit px; default 0 */
  perspective?: Animatable<number>;
  /** Stacking override among siblings.; default 0 */
  z?: number;
  /** Entrance motion at the start of the layer. */
  enter?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  /** Exit motion ending at the end of the layer. */
  exit?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  /** Placement: center | top | bottom | left | right | top-left | top-right | bottom-left | bottom-right or [x, y] (px, %, vw, vh) from the top-left.; default "center" */
  at?: unknown;
  /** default "#262634" */
  fill?: Fill;
  /** default "#ffffff" */
  textColor?: Color;
  /** Leading dot colour. */
  dot?: Color;
  /** default "$type.body" */
  font?: string;
  /** range 8..200; unit px; default 36 */
  size?: number;
  /** range 1..1000; default 600 */
  weight?: number;
  /** range 0..∞; unit px; default 28 */
  paddingX?: number;
  /** range 0..∞; unit px; default 14 */
  paddingY?: number;
  stroke?: { width?: number; color?: Color; align?: "inside" | "center" | "outside"; cap?: "butt" | "round" | "square"; join?: "miter" | "round" | "bevel"; dash?: number[] };
  children?: unknown;
}
```

---

# Counter

*component, category: ui*

An animated number that counts from `from` to `to`. Uses tabular figures so the width does not jitter.

Children: effects only.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  | Stable unique id. Written back as fm_… when missing. |
| `label` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s |
| `duration` | `Time` |  | Defaults to the rest of the parent.; unit s |
| `end` | `Time` |  | Alternative to duration.; unit s |
| `hidden` | `boolean` | `false` |  |
| `link` | `string` |  | Link group id: linked clips move, trim and split together. |
| `position` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit px; ui vec |
| `rotation` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit deg; ui vec |
| `scale` | `number | Vec2 | Vec3` | `[1,1,1]` | animatable; step 0.01; ui vec |
| `skew` | `number | Vec2` | `[0,0]` | animatable; unit deg; ui vec |
| `anchor` | `number | Vec2 | Vec3` | `[50,50,0]` | Transform origin as % of the layer box (z in px).; animatable; unit %; ui vec |
| `opacity` | `number` | `1` | animatable; range 0..1; step 0.01; ui slider |
| `crop` | `{ top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> }` |  |  |
| `flip` | `none` \| `x` \| `y` \| `xy` | `"none"` |  |
| `blend` | `normal` \| `multiply` \| `screen` \| `overlay` \| `darken` \| `lighten` \| `color-dodge` \| `color-burn` \| `soft-light` \| `hard-light` \| `difference` \| `exclusion` \| `hue` \| `saturation` \| `color` \| `luminosity` \| `add` | `"normal"` | ui dropdown |
| `perspective` | `number` | `0` | animatable; range 0..∞; unit px |
| `z` | `number` | `0` | Stacking override among siblings.; step 1 |
| `enter` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Entrance motion at the start of the layer. |
| `exit` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Exit motion ending at the end of the layer. |
| `at` | `unknown` | `"center"` | Placement: center | top | bottom | left | right | top-left | top-right | bottom-left | bottom-right or [x, y] (px, %, vw, vh) from the top-left. |
| `from` | `number` | `0` |  |
| `to` | `number` | `100` |  |
| `delay` | `Time` | `0` | unit s |
| `over` | `Time` | `1.2` | How long the count takes (not the layer duration).; unit s |
| `ease` | `string` | `"expo.out"` |  |
| `decimals` | `number` | `0` | range 0..8 |
| `group` | `boolean` | `true` | Thousands separators. |
| `prefix` | `string` | `""` |  |
| `suffix` | `string` | `""` |  |
| `font` | `string` | `"$type.body"` | Font id or token, e.g. "display" or "$type.display". |
| `weight` | `number` | `700` | animatable; range 1..1000; step 1; unit wght |
| `width` | `number` | `100` | Font width (wdth axis).; animatable; range 25..200; step 1; unit % |
| `style` | `normal` \| `italic` \| `oblique` | `"normal"` |  |
| `size` | `number` | `120` | animatable; range 1..2000; step 1; unit px |
| `axes` | `{ wght?: Animatable<number>; wdth?: Animatable<number>; slnt?: Animatable<number>; ital?: Animatable<number>; opsz?: Animatable<number>; custom?: unknown }` |  | Animatable variable-font axes. `custom` takes static values for other axes. |
| `leading` | `number` | `1.15` | Line height multiplier.; animatable; range 0.5..4; step 0.01 |
| `tracking` | `number` | `0` | Letter spacing in thousandths of an em.; animatable; range -500..2000; step 1; unit ‰em |
| `wordSpacing` | `number` | `0` | animatable; range -500..2000; unit ‰em |
| `indent` | `number` | `0` | unit px |
| `paragraphSpacing` | `number` | `0` | unit px |
| `baselineShift` | `number` | `0` | animatable; unit px |
| `align` | `left` \| `center` \| `right` \| `justify` | `"center"` |  |
| `valign` | `top` \| `middle` \| `bottom` | `"top"` |  |
| `maxWidth` | `Length` | `"90%"` |  |
| `box` | `{ width?: Length; height?: Length }` |  | A fixed box; `valign` and `fit` use it. |
| `wrap` | `boolean` | `true` |  |
| `balance` | `boolean` | `false` | Balance line lengths. |
| `hyphenate` | `boolean` | `false` |  |
| `overflow` | `visible` \| `hidden` \| `ellipsis` | `"visible"` |  |
| `columns` | `number` | `1` | range 1..8 |
| `direction` | `ltr` \| `rtl` | `"ltr"` |  |
| `lang` | `string` |  | BCP-47 language, e.g. "en", "hi". |
| `case` | `none` \| `upper` \| `lower` \| `title` \| `small-caps` | `"none"` |  |
| `features` | `string[]` |  | OpenType features: "liga", "kern", "tnum", "lnum", "onum", "ss01"…"ss20", "salt". |
| `numeric` | `default` \| `tabular` \| `proportional` \| `lining` \| `oldstyle` | `"tabular"` |  |
| `fit` | `{ minSize?: number; maxSize?: number; maxLines?: number }` |  | Shrinks the size until the text fits the box / line count. |
| `underline` | `{ style?: "solid" | "dashed" | "dotted" | "wavy" | "double"; thickness?: number; offset?: number; color?: Color; progress?: Animatable<number> }` |  |  |
| `strike` | `{ style?: "solid" | "dashed" | "dotted" | "wavy" | "double"; thickness?: number; offset?: number; color?: Color; progress?: Animatable<number> }` |  |  |
| `highlight` | `{ color?: Color; padding?: number; radius?: number; progress?: Animatable<number>; opacity?: number }` |  |  |
| `fill` | `Fill` | `"#ffffff"` | Solid, gradient, image or video clipped to the letter shapes. |
| `stroke` | `{ width?: Animatable<number>; color?: Color; align?: "inside" | "center" | "outside"; join?: "miter" | "round" | "bevel"; dash?: number[] }` |  |  |
| `shadow` | `{ x?: number; y?: number; blur?: number; color?: Color; opacity?: number }[]` |  | Multiple shadows, drawn in order. |
| `glow` | `{ color?: Color; radius?: number; intensity?: number }` |  |  |
| `outline` | `{ width?: number; color?: Color; gap?: number }` |  | A box outline around the text block. |
| `blur` | `number` | `0` | animatable; range 0..200; unit px |
| `extrude` | `{ depth?: number; color?: Color }` |  | 3D extrusion is a later tier: typed stub, ignored with a warning. |
| `glitch` | `number` | `0` | Glitch amount (jitter, skew, hue flips).; animatable; range 0..3; step 0.05 |
| `rgbSplit` | `number` | `0` | animatable; range 0..60; unit px |

```ts
export interface CounterProps {
  /** Stable unique id. Written back as fm_… when missing. */
  id?: string;
  label?: string;
  /** Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s */
  start?: Time;
  /** Defaults to the rest of the parent.; unit s */
  duration?: Time;
  /** Alternative to duration.; unit s */
  end?: Time;
  /** default false */
  hidden?: boolean;
  /** Link group id: linked clips move, trim and split together. */
  link?: string;
  /** unit px; default [0,0,0] */
  position?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0,0] */
  rotation?: Animatable<number | Vec2 | Vec3>;
  /** default [1,1,1] */
  scale?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0] */
  skew?: Animatable<number | Vec2>;
  /** Transform origin as % of the layer box (z in px).; unit %; default [50,50,0] */
  anchor?: Animatable<number | Vec2 | Vec3>;
  /** range 0..1; default 1 */
  opacity?: Animatable<number>;
  crop?: { top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> };
  /** default "none" */
  flip?: "none" | "x" | "y" | "xy";
  /** default "normal" */
  blend?: "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | "color-burn" | "soft-light" | "hard-light" | "difference" | "exclusion" | "hue" | "saturation" | "color" | "luminosity" | "add";
  /** range 0..∞; unit px; default 0 */
  perspective?: Animatable<number>;
  /** Stacking override among siblings.; default 0 */
  z?: number;
  /** Entrance motion at the start of the layer. */
  enter?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  /** Exit motion ending at the end of the layer. */
  exit?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  /** Placement: center | top | bottom | left | right | top-left | top-right | bottom-left | bottom-right or [x, y] (px, %, vw, vh) from the top-left.; default "center" */
  at?: unknown;
  /** default 0 */
  from?: number;
  /** default 100 */
  to?: number;
  /** unit s; default 0 */
  delay?: Time;
  /** How long the count takes (not the layer duration).; unit s; default 1.2 */
  over?: Time;
  /** default "expo.out" */
  ease?: string;
  /** range 0..8; default 0 */
  decimals?: number;
  /** Thousands separators.; default true */
  group?: boolean;
  /** default "" */
  prefix?: string;
  /** default "" */
  suffix?: string;
  /** Font id or token, e.g. "display" or "$type.display".; default "$type.body" */
  font?: string;
  /** range 1..1000; unit wght; default 700 */
  weight?: Animatable<number>;
  /** Font width (wdth axis).; range 25..200; unit %; default 100 */
  width?: Animatable<number>;
  /** default "normal" */
  style?: "normal" | "italic" | "oblique";
  /** range 1..2000; unit px; default 120 */
  size?: Animatable<number>;
  /** Animatable variable-font axes. `custom` takes static values for other axes. */
  axes?: { wght?: Animatable<number>; wdth?: Animatable<number>; slnt?: Animatable<number>; ital?: Animatable<number>; opsz?: Animatable<number>; custom?: unknown };
  /** Line height multiplier.; range 0.5..4; default 1.15 */
  leading?: Animatable<number>;
  /** Letter spacing in thousandths of an em.; range -500..2000; unit ‰em; default 0 */
  tracking?: Animatable<number>;
  /** range -500..2000; unit ‰em; default 0 */
  wordSpacing?: Animatable<number>;
  /** unit px; default 0 */
  indent?: number;
  /** unit px; default 0 */
  paragraphSpacing?: number;
  /** unit px; default 0 */
  baselineShift?: Animatable<number>;
  /** default "center" */
  align?: "left" | "center" | "right" | "justify";
  /** default "top" */
  valign?: "top" | "middle" | "bottom";
  /** default "90%" */
  maxWidth?: Length;
  /** A fixed box; `valign` and `fit` use it. */
  box?: { width?: Length; height?: Length };
  /** default true */
  wrap?: boolean;
  /** Balance line lengths.; default false */
  balance?: boolean;
  /** default false */
  hyphenate?: boolean;
  /** default "visible" */
  overflow?: "visible" | "hidden" | "ellipsis";
  /** range 1..8; default 1 */
  columns?: number;
  /** default "ltr" */
  direction?: "ltr" | "rtl";
  /** BCP-47 language, e.g. "en", "hi". */
  lang?: string;
  /** default "none" */
  case?: "none" | "upper" | "lower" | "title" | "small-caps";
  /** OpenType features: "liga", "kern", "tnum", "lnum", "onum", "ss01"…"ss20", "salt". */
  features?: string[];
  /** default "tabular" */
  numeric?: "default" | "tabular" | "proportional" | "lining" | "oldstyle";
  /** Shrinks the size until the text fits the box / line count. */
  fit?: { minSize?: number; maxSize?: number; maxLines?: number };
  underline?: { style?: "solid" | "dashed" | "dotted" | "wavy" | "double"; thickness?: number; offset?: number; color?: Color; progress?: Animatable<number> };
  strike?: { style?: "solid" | "dashed" | "dotted" | "wavy" | "double"; thickness?: number; offset?: number; color?: Color; progress?: Animatable<number> };
  highlight?: { color?: Color; padding?: number; radius?: number; progress?: Animatable<number>; opacity?: number };
  /** Solid, gradient, image or video clipped to the letter shapes.; default "#ffffff" */
  fill?: Fill;
  stroke?: { width?: Animatable<number>; color?: Color; align?: "inside" | "center" | "outside"; join?: "miter" | "round" | "bevel"; dash?: number[] };
  /** Multiple shadows, drawn in order. */
  shadow?: { x?: number; y?: number; blur?: number; color?: Color; opacity?: number }[];
  glow?: { color?: Color; radius?: number; intensity?: number };
  /** A box outline around the text block. */
  outline?: { width?: number; color?: Color; gap?: number };
  /** range 0..200; unit px; default 0 */
  blur?: Animatable<number>;
  /** 3D extrusion is a later tier: typed stub, ignored with a warning. */
  extrude?: { depth?: number; color?: Color };
  /** Glitch amount (jitter, skew, hue flips).; range 0..3; default 0 */
  glitch?: Animatable<number>;
  /** range 0..60; unit px; default 0 */
  rgbSplit?: Animatable<number>;
  children?: unknown;
}
```

---

# ProgressRing

*component, category: ui*

A circular progress indicator. Animate `value` (0 to 1); optionally show the percentage.

Children: effects only.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  | Stable unique id. Written back as fm_… when missing. |
| `label` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s |
| `duration` | `Time` |  | Defaults to the rest of the parent.; unit s |
| `end` | `Time` |  | Alternative to duration.; unit s |
| `hidden` | `boolean` | `false` |  |
| `link` | `string` |  | Link group id: linked clips move, trim and split together. |
| `position` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit px; ui vec |
| `rotation` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit deg; ui vec |
| `scale` | `number | Vec2 | Vec3` | `[1,1,1]` | animatable; step 0.01; ui vec |
| `skew` | `number | Vec2` | `[0,0]` | animatable; unit deg; ui vec |
| `anchor` | `number | Vec2 | Vec3` | `[50,50,0]` | Transform origin as % of the layer box (z in px).; animatable; unit %; ui vec |
| `opacity` | `number` | `1` | animatable; range 0..1; step 0.01; ui slider |
| `crop` | `{ top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> }` |  |  |
| `flip` | `none` \| `x` \| `y` \| `xy` | `"none"` |  |
| `blend` | `normal` \| `multiply` \| `screen` \| `overlay` \| `darken` \| `lighten` \| `color-dodge` \| `color-burn` \| `soft-light` \| `hard-light` \| `difference` \| `exclusion` \| `hue` \| `saturation` \| `color` \| `luminosity` \| `add` | `"normal"` | ui dropdown |
| `perspective` | `number` | `0` | animatable; range 0..∞; unit px |
| `z` | `number` | `0` | Stacking override among siblings.; step 1 |
| `enter` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Entrance motion at the start of the layer. |
| `exit` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Exit motion ending at the end of the layer. |
| `at` | `unknown` | `"center"` | Placement: center | top | bottom | left | right | top-left | top-right | bottom-left | bottom-right or [x, y] (px, %, vw, vh) from the top-left. |
| `size` | `number` | `360` | range 20..2000; unit px |
| `thickness` | `number` | `32` | range 1..200; unit px |
| `value` | `number` | `0.75` | animatable; range 0..1; step 0.01 |
| `color` | `Fill` | `"#7c8cff"` |  |
| `track` | `Color` | `"rgba(255,255,255,0.12)"` |  |
| `cap` | `round` \| `butt` | `"round"` |  |
| `startAngle` | `number` | `-90` | unit deg |
| `showValue` | `boolean` | `true` |  |
| `font` | `string` | `"$type.display"` |  |
| `labelColor` | `Color` | `"#ffffff"` |  |
| `labelSize` | `number` | `96` | range 8..800; unit px |

```ts
export interface ProgressRingProps {
  /** Stable unique id. Written back as fm_… when missing. */
  id?: string;
  label?: string;
  /** Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s */
  start?: Time;
  /** Defaults to the rest of the parent.; unit s */
  duration?: Time;
  /** Alternative to duration.; unit s */
  end?: Time;
  /** default false */
  hidden?: boolean;
  /** Link group id: linked clips move, trim and split together. */
  link?: string;
  /** unit px; default [0,0,0] */
  position?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0,0] */
  rotation?: Animatable<number | Vec2 | Vec3>;
  /** default [1,1,1] */
  scale?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0] */
  skew?: Animatable<number | Vec2>;
  /** Transform origin as % of the layer box (z in px).; unit %; default [50,50,0] */
  anchor?: Animatable<number | Vec2 | Vec3>;
  /** range 0..1; default 1 */
  opacity?: Animatable<number>;
  crop?: { top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> };
  /** default "none" */
  flip?: "none" | "x" | "y" | "xy";
  /** default "normal" */
  blend?: "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | "color-burn" | "soft-light" | "hard-light" | "difference" | "exclusion" | "hue" | "saturation" | "color" | "luminosity" | "add";
  /** range 0..∞; unit px; default 0 */
  perspective?: Animatable<number>;
  /** Stacking override among siblings.; default 0 */
  z?: number;
  /** Entrance motion at the start of the layer. */
  enter?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  /** Exit motion ending at the end of the layer. */
  exit?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  /** Placement: center | top | bottom | left | right | top-left | top-right | bottom-left | bottom-right or [x, y] (px, %, vw, vh) from the top-left.; default "center" */
  at?: unknown;
  /** range 20..2000; unit px; default 360 */
  size?: number;
  /** range 1..200; unit px; default 32 */
  thickness?: number;
  /** range 0..1; default 0.75 */
  value?: Animatable<number>;
  /** default "#7c8cff" */
  color?: Fill;
  /** default "rgba(255,255,255,0.12)" */
  track?: Color;
  /** default "round" */
  cap?: "round" | "butt";
  /** unit deg; default -90 */
  startAngle?: number;
  /** default true */
  showValue?: boolean;
  /** default "$type.display" */
  font?: string;
  /** default "#ffffff" */
  labelColor?: Color;
  /** range 8..800; unit px; default 96 */
  labelSize?: number;
  children?: unknown;
}
```

---

# Chart

*component, category: ui*

Bar, line or donut chart that draws in. `progress` (0 to 1) animates the reveal; bars stagger by `stagger`.

Children: effects only.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  | Stable unique id. Written back as fm_… when missing. |
| `label` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s |
| `duration` | `Time` |  | Defaults to the rest of the parent.; unit s |
| `end` | `Time` |  | Alternative to duration.; unit s |
| `hidden` | `boolean` | `false` |  |
| `link` | `string` |  | Link group id: linked clips move, trim and split together. |
| `position` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit px; ui vec |
| `rotation` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit deg; ui vec |
| `scale` | `number | Vec2 | Vec3` | `[1,1,1]` | animatable; step 0.01; ui vec |
| `skew` | `number | Vec2` | `[0,0]` | animatable; unit deg; ui vec |
| `anchor` | `number | Vec2 | Vec3` | `[50,50,0]` | Transform origin as % of the layer box (z in px).; animatable; unit %; ui vec |
| `opacity` | `number` | `1` | animatable; range 0..1; step 0.01; ui slider |
| `crop` | `{ top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> }` |  |  |
| `flip` | `none` \| `x` \| `y` \| `xy` | `"none"` |  |
| `blend` | `normal` \| `multiply` \| `screen` \| `overlay` \| `darken` \| `lighten` \| `color-dodge` \| `color-burn` \| `soft-light` \| `hard-light` \| `difference` \| `exclusion` \| `hue` \| `saturation` \| `color` \| `luminosity` \| `add` | `"normal"` | ui dropdown |
| `perspective` | `number` | `0` | animatable; range 0..∞; unit px |
| `z` | `number` | `0` | Stacking override among siblings.; step 1 |
| `enter` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Entrance motion at the start of the layer. |
| `exit` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Exit motion ending at the end of the layer. |
| `at` | `unknown` | `"center"` | Placement: center | top | bottom | left | right | top-left | top-right | bottom-left | bottom-right or [x, y] (px, %, vw, vh) from the top-left. |
| `type` | `bar` \| `line` \| `donut` | `"bar"` |  |
| `data` | `{ label?: string; value?: number; color?: Color }[]` |  |  |
| `width` | `number` | `800` | range 50..4000; unit px |
| `height` | `number` | `480` | range 50..4000; unit px |
| `max` | `number` |  | Axis max (default: largest value).; range 0..∞ |
| `progress` | `number` | `1` | animatable; range 0..1; step 0.01 |
| `stagger` | `number` | `0.12` | Bar stagger as a fraction of the reveal.; range 0..1 |
| `thickness` | `number` | `56` | Donut ring thickness.; range 4..400; unit px |
| `labels` | `boolean` | `true` |  |
| `labelColor` | `Color` | `"#c7c9d6"` |  |
| `font` | `string` | `"$type.body"` |  |
| `gap` | `number` | `24` | range 0..200; unit px |
| `radius` | `number` | `12` | range 0..100; unit px |

```ts
export interface ChartProps {
  /** Stable unique id. Written back as fm_… when missing. */
  id?: string;
  label?: string;
  /** Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s */
  start?: Time;
  /** Defaults to the rest of the parent.; unit s */
  duration?: Time;
  /** Alternative to duration.; unit s */
  end?: Time;
  /** default false */
  hidden?: boolean;
  /** Link group id: linked clips move, trim and split together. */
  link?: string;
  /** unit px; default [0,0,0] */
  position?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0,0] */
  rotation?: Animatable<number | Vec2 | Vec3>;
  /** default [1,1,1] */
  scale?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0] */
  skew?: Animatable<number | Vec2>;
  /** Transform origin as % of the layer box (z in px).; unit %; default [50,50,0] */
  anchor?: Animatable<number | Vec2 | Vec3>;
  /** range 0..1; default 1 */
  opacity?: Animatable<number>;
  crop?: { top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> };
  /** default "none" */
  flip?: "none" | "x" | "y" | "xy";
  /** default "normal" */
  blend?: "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | "color-burn" | "soft-light" | "hard-light" | "difference" | "exclusion" | "hue" | "saturation" | "color" | "luminosity" | "add";
  /** range 0..∞; unit px; default 0 */
  perspective?: Animatable<number>;
  /** Stacking override among siblings.; default 0 */
  z?: number;
  /** Entrance motion at the start of the layer. */
  enter?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  /** Exit motion ending at the end of the layer. */
  exit?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  /** Placement: center | top | bottom | left | right | top-left | top-right | bottom-left | bottom-right or [x, y] (px, %, vw, vh) from the top-left.; default "center" */
  at?: unknown;
  /** default "bar" */
  type?: "bar" | "line" | "donut";
  data?: { label?: string; value?: number; color?: Color }[];
  /** range 50..4000; unit px; default 800 */
  width?: number;
  /** range 50..4000; unit px; default 480 */
  height?: number;
  /** Axis max (default: largest value).; range 0..∞ */
  max?: number;
  /** range 0..1; default 1 */
  progress?: Animatable<number>;
  /** Bar stagger as a fraction of the reveal.; range 0..1; default 0.12 */
  stagger?: number;
  /** Donut ring thickness.; range 4..400; unit px; default 56 */
  thickness?: number;
  /** default true */
  labels?: boolean;
  /** default "#c7c9d6" */
  labelColor?: Color;
  /** default "$type.body" */
  font?: string;
  /** range 0..200; unit px; default 24 */
  gap?: number;
  /** range 0..100; unit px; default 12 */
  radius?: number;
  children?: unknown;
}
```

---

# CodeBlock

*component, category: ui*

A syntax-tinted code panel. `reveal` (0 to 1) types the code in line by line.

Children: effects only.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  | Stable unique id. Written back as fm_… when missing. |
| `label` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s |
| `duration` | `Time` |  | Defaults to the rest of the parent.; unit s |
| `end` | `Time` |  | Alternative to duration.; unit s |
| `hidden` | `boolean` | `false` |  |
| `link` | `string` |  | Link group id: linked clips move, trim and split together. |
| `position` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit px; ui vec |
| `rotation` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit deg; ui vec |
| `scale` | `number | Vec2 | Vec3` | `[1,1,1]` | animatable; step 0.01; ui vec |
| `skew` | `number | Vec2` | `[0,0]` | animatable; unit deg; ui vec |
| `anchor` | `number | Vec2 | Vec3` | `[50,50,0]` | Transform origin as % of the layer box (z in px).; animatable; unit %; ui vec |
| `opacity` | `number` | `1` | animatable; range 0..1; step 0.01; ui slider |
| `crop` | `{ top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> }` |  |  |
| `flip` | `none` \| `x` \| `y` \| `xy` | `"none"` |  |
| `blend` | `normal` \| `multiply` \| `screen` \| `overlay` \| `darken` \| `lighten` \| `color-dodge` \| `color-burn` \| `soft-light` \| `hard-light` \| `difference` \| `exclusion` \| `hue` \| `saturation` \| `color` \| `luminosity` \| `add` | `"normal"` | ui dropdown |
| `perspective` | `number` | `0` | animatable; range 0..∞; unit px |
| `z` | `number` | `0` | Stacking override among siblings.; step 1 |
| `enter` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Entrance motion at the start of the layer. |
| `exit` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Exit motion ending at the end of the layer. |
| `at` | `unknown` | `"center"` | Placement: center | top | bottom | left | right | top-left | top-right | bottom-left | bottom-right or [x, y] (px, %, vw, vh) from the top-left. |
| `code` | `string` |  |  |
| `theme` | `dark` \| `light` | `"dark"` |  |
| `font` | `string` | `"$type.mono"` |  |
| `size` | `number` | `34` | range 8..200; unit px |
| `lineNumbers` | `boolean` | `false` |  |
| `width` | `number` | `880` | range 100..4000; unit px |
| `padding` | `number` | `36` | range 0..∞; unit px |
| `radius` | `number` | `28` | range 0..∞; unit px |
| `reveal` | `number` | `1` | animatable; range 0..1; step 0.01 |

```ts
export interface CodeBlockProps {
  /** Stable unique id. Written back as fm_… when missing. */
  id?: string;
  label?: string;
  /** Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s */
  start?: Time;
  /** Defaults to the rest of the parent.; unit s */
  duration?: Time;
  /** Alternative to duration.; unit s */
  end?: Time;
  /** default false */
  hidden?: boolean;
  /** Link group id: linked clips move, trim and split together. */
  link?: string;
  /** unit px; default [0,0,0] */
  position?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0,0] */
  rotation?: Animatable<number | Vec2 | Vec3>;
  /** default [1,1,1] */
  scale?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0] */
  skew?: Animatable<number | Vec2>;
  /** Transform origin as % of the layer box (z in px).; unit %; default [50,50,0] */
  anchor?: Animatable<number | Vec2 | Vec3>;
  /** range 0..1; default 1 */
  opacity?: Animatable<number>;
  crop?: { top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> };
  /** default "none" */
  flip?: "none" | "x" | "y" | "xy";
  /** default "normal" */
  blend?: "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | "color-burn" | "soft-light" | "hard-light" | "difference" | "exclusion" | "hue" | "saturation" | "color" | "luminosity" | "add";
  /** range 0..∞; unit px; default 0 */
  perspective?: Animatable<number>;
  /** Stacking override among siblings.; default 0 */
  z?: number;
  /** Entrance motion at the start of the layer. */
  enter?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  /** Exit motion ending at the end of the layer. */
  exit?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  /** Placement: center | top | bottom | left | right | top-left | top-right | bottom-left | bottom-right or [x, y] (px, %, vw, vh) from the top-left.; default "center" */
  at?: unknown;
  code?: string;
  /** default "dark" */
  theme?: "dark" | "light";
  /** default "$type.mono" */
  font?: string;
  /** range 8..200; unit px; default 34 */
  size?: number;
  /** default false */
  lineNumbers?: boolean;
  /** range 100..4000; unit px; default 880 */
  width?: number;
  /** range 0..∞; unit px; default 36 */
  padding?: number;
  /** range 0..∞; unit px; default 28 */
  radius?: number;
  /** range 0..1; default 1 */
  reveal?: Animatable<number>;
  children?: unknown;
}
```

---

# Image

*component, category: media*

A still image. Defaults to filling its parent box; use the transform stack for Ken Burns moves.

Children: effects only.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  | Stable unique id. Written back as fm_… when missing. |
| `label` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s |
| `duration` | `Time` |  | Defaults to the rest of the parent.; unit s |
| `end` | `Time` |  | Alternative to duration.; unit s |
| `hidden` | `boolean` | `false` |  |
| `link` | `string` |  | Link group id: linked clips move, trim and split together. |
| `position` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit px; ui vec |
| `rotation` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit deg; ui vec |
| `scale` | `number | Vec2 | Vec3` | `[1,1,1]` | animatable; step 0.01; ui vec |
| `skew` | `number | Vec2` | `[0,0]` | animatable; unit deg; ui vec |
| `anchor` | `number | Vec2 | Vec3` | `[50,50,0]` | Transform origin as % of the layer box (z in px).; animatable; unit %; ui vec |
| `opacity` | `number` | `1` | animatable; range 0..1; step 0.01; ui slider |
| `crop` | `{ top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> }` |  |  |
| `flip` | `none` \| `x` \| `y` \| `xy` | `"none"` |  |
| `blend` | `normal` \| `multiply` \| `screen` \| `overlay` \| `darken` \| `lighten` \| `color-dodge` \| `color-burn` \| `soft-light` \| `hard-light` \| `difference` \| `exclusion` \| `hue` \| `saturation` \| `color` \| `luminosity` \| `add` | `"normal"` | ui dropdown |
| `perspective` | `number` | `0` | animatable; range 0..∞; unit px |
| `z` | `number` | `0` | Stacking override among siblings.; step 1 |
| `enter` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Entrance motion at the start of the layer. |
| `exit` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Exit motion ending at the end of the layer. |
| `at` | `unknown` | `"center"` | Placement: center | top | bottom | left | right | top-left | top-right | bottom-left | bottom-right or [x, y] (px, %, vw, vh) from the top-left. |
| `src` | `string` |  | Image file in the project, e.g. ./assets/logo.png. |
| `width` | `Length` |  |  |
| `height` | `Length` |  |  |
| `fit` | `cover` \| `contain` \| `fill` | `"cover"` |  |
| `alt` | `string` |  |  |

```ts
export interface ImageProps {
  /** Stable unique id. Written back as fm_… when missing. */
  id?: string;
  label?: string;
  /** Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s */
  start?: Time;
  /** Defaults to the rest of the parent.; unit s */
  duration?: Time;
  /** Alternative to duration.; unit s */
  end?: Time;
  /** default false */
  hidden?: boolean;
  /** Link group id: linked clips move, trim and split together. */
  link?: string;
  /** unit px; default [0,0,0] */
  position?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0,0] */
  rotation?: Animatable<number | Vec2 | Vec3>;
  /** default [1,1,1] */
  scale?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0] */
  skew?: Animatable<number | Vec2>;
  /** Transform origin as % of the layer box (z in px).; unit %; default [50,50,0] */
  anchor?: Animatable<number | Vec2 | Vec3>;
  /** range 0..1; default 1 */
  opacity?: Animatable<number>;
  crop?: { top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> };
  /** default "none" */
  flip?: "none" | "x" | "y" | "xy";
  /** default "normal" */
  blend?: "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | "color-burn" | "soft-light" | "hard-light" | "difference" | "exclusion" | "hue" | "saturation" | "color" | "luminosity" | "add";
  /** range 0..∞; unit px; default 0 */
  perspective?: Animatable<number>;
  /** Stacking override among siblings.; default 0 */
  z?: number;
  /** Entrance motion at the start of the layer. */
  enter?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  /** Exit motion ending at the end of the layer. */
  exit?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  /** Placement: center | top | bottom | left | right | top-left | top-right | bottom-left | bottom-right or [x, y] (px, %, vw, vh) from the top-left.; default "center" */
  at?: unknown;
  /** Image file in the project, e.g. ./assets/logo.png. */
  src?: string;
  width?: Length;
  height?: Length;
  /** default "cover" */
  fit?: "cover" | "contain" | "fill";
  alt?: string;
  children?: unknown;
}
```

---

# Video

*component, category: media*

A video file. Its picture is rendered by HyperFrames; its sound (if `volume` > 0) goes into the offline mix, so the <video> stays muted.

Children: effects only.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  | Stable unique id. Written back as fm_… when missing. |
| `label` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s |
| `duration` | `Time` |  | Defaults to the rest of the parent.; unit s |
| `end` | `Time` |  | Alternative to duration.; unit s |
| `hidden` | `boolean` | `false` |  |
| `link` | `string` |  | Link group id: linked clips move, trim and split together. |
| `position` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit px; ui vec |
| `rotation` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit deg; ui vec |
| `scale` | `number | Vec2 | Vec3` | `[1,1,1]` | animatable; step 0.01; ui vec |
| `skew` | `number | Vec2` | `[0,0]` | animatable; unit deg; ui vec |
| `anchor` | `number | Vec2 | Vec3` | `[50,50,0]` | Transform origin as % of the layer box (z in px).; animatable; unit %; ui vec |
| `opacity` | `number` | `1` | animatable; range 0..1; step 0.01; ui slider |
| `crop` | `{ top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> }` |  |  |
| `flip` | `none` \| `x` \| `y` \| `xy` | `"none"` |  |
| `blend` | `normal` \| `multiply` \| `screen` \| `overlay` \| `darken` \| `lighten` \| `color-dodge` \| `color-burn` \| `soft-light` \| `hard-light` \| `difference` \| `exclusion` \| `hue` \| `saturation` \| `color` \| `luminosity` \| `add` | `"normal"` | ui dropdown |
| `perspective` | `number` | `0` | animatable; range 0..∞; unit px |
| `z` | `number` | `0` | Stacking override among siblings.; step 1 |
| `enter` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Entrance motion at the start of the layer. |
| `exit` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Exit motion ending at the end of the layer. |
| `at` | `unknown` | `"center"` | Placement: center | top | bottom | left | right | top-left | top-right | bottom-left | bottom-right or [x, y] (px, %, vw, vh) from the top-left. |
| `src` | `string` |  |  |
| `width` | `Length` |  |  |
| `height` | `Length` |  |  |
| `fit` | `cover` \| `contain` \| `fill` | `"cover"` |  |
| `in` | `Time` | `0` | Source in point (trim).; unit s |
| `out` | `Time` |  | Source out point.; unit s |
| `speed` | `number` | `1` | range 0.1..10; step 0.05 |
| `reverse` | `boolean` | `false` | Reverse playback (needs a pre-rendered reversed copy: later). |
| `volume` | `number` | `-60` | Gain of the clip's own audio in the mix; -60 mutes.; range -60..12; unit dB |
| `bus` | `sfx` \| `music` \| `voice` | `"sfx"` |  |

```ts
export interface VideoProps {
  /** Stable unique id. Written back as fm_… when missing. */
  id?: string;
  label?: string;
  /** Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s */
  start?: Time;
  /** Defaults to the rest of the parent.; unit s */
  duration?: Time;
  /** Alternative to duration.; unit s */
  end?: Time;
  /** default false */
  hidden?: boolean;
  /** Link group id: linked clips move, trim and split together. */
  link?: string;
  /** unit px; default [0,0,0] */
  position?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0,0] */
  rotation?: Animatable<number | Vec2 | Vec3>;
  /** default [1,1,1] */
  scale?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0] */
  skew?: Animatable<number | Vec2>;
  /** Transform origin as % of the layer box (z in px).; unit %; default [50,50,0] */
  anchor?: Animatable<number | Vec2 | Vec3>;
  /** range 0..1; default 1 */
  opacity?: Animatable<number>;
  crop?: { top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> };
  /** default "none" */
  flip?: "none" | "x" | "y" | "xy";
  /** default "normal" */
  blend?: "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | "color-burn" | "soft-light" | "hard-light" | "difference" | "exclusion" | "hue" | "saturation" | "color" | "luminosity" | "add";
  /** range 0..∞; unit px; default 0 */
  perspective?: Animatable<number>;
  /** Stacking override among siblings.; default 0 */
  z?: number;
  /** Entrance motion at the start of the layer. */
  enter?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  /** Exit motion ending at the end of the layer. */
  exit?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  /** Placement: center | top | bottom | left | right | top-left | top-right | bottom-left | bottom-right or [x, y] (px, %, vw, vh) from the top-left.; default "center" */
  at?: unknown;
  src?: string;
  width?: Length;
  height?: Length;
  /** default "cover" */
  fit?: "cover" | "contain" | "fill";
  /** Source in point (trim).; unit s; default 0 */
  in?: Time;
  /** Source out point.; unit s */
  out?: Time;
  /** range 0.1..10; default 1 */
  speed?: number;
  /** Reverse playback (needs a pre-rendered reversed copy: later).; default false */
  reverse?: boolean;
  /** Gain of the clip's own audio in the mix; -60 mutes.; range -60..12; unit dB; default -60 */
  volume?: number;
  /** default "sfx" */
  bus?: "sfx" | "music" | "voice";
  children?: unknown;
}
```

---

# Clip

*component, category: media*

A trimmed piece of video on a track: `in`/`out` select the source range, `speed` retimes it, `volume` is its mix gain.

Children: effects only.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  | Stable unique id. Written back as fm_… when missing. |
| `label` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s |
| `duration` | `Time` |  | Defaults to the rest of the parent.; unit s |
| `end` | `Time` |  | Alternative to duration.; unit s |
| `hidden` | `boolean` | `false` |  |
| `link` | `string` |  | Link group id: linked clips move, trim and split together. |
| `position` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit px; ui vec |
| `rotation` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit deg; ui vec |
| `scale` | `number | Vec2 | Vec3` | `[1,1,1]` | animatable; step 0.01; ui vec |
| `skew` | `number | Vec2` | `[0,0]` | animatable; unit deg; ui vec |
| `anchor` | `number | Vec2 | Vec3` | `[50,50,0]` | Transform origin as % of the layer box (z in px).; animatable; unit %; ui vec |
| `opacity` | `number` | `1` | animatable; range 0..1; step 0.01; ui slider |
| `crop` | `{ top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> }` |  |  |
| `flip` | `none` \| `x` \| `y` \| `xy` | `"none"` |  |
| `blend` | `normal` \| `multiply` \| `screen` \| `overlay` \| `darken` \| `lighten` \| `color-dodge` \| `color-burn` \| `soft-light` \| `hard-light` \| `difference` \| `exclusion` \| `hue` \| `saturation` \| `color` \| `luminosity` \| `add` | `"normal"` | ui dropdown |
| `perspective` | `number` | `0` | animatable; range 0..∞; unit px |
| `z` | `number` | `0` | Stacking override among siblings.; step 1 |
| `enter` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Entrance motion at the start of the layer. |
| `exit` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Exit motion ending at the end of the layer. |
| `at` | `unknown` | `"center"` | Placement: center | top | bottom | left | right | top-left | top-right | bottom-left | bottom-right or [x, y] (px, %, vw, vh) from the top-left. |
| `src` | `string` |  |  |
| `width` | `Length` |  |  |
| `height` | `Length` |  |  |
| `fit` | `cover` \| `contain` \| `fill` | `"cover"` |  |
| `in` | `Time` | `0` | Source in point (trim).; unit s |
| `out` | `Time` |  | Source out point.; unit s |
| `speed` | `number` | `1` | range 0.1..10; step 0.05 |
| `reverse` | `boolean` | `false` | Reverse playback (needs a pre-rendered reversed copy: later). |
| `volume` | `number` | `-60` | range -60..12; unit dB |
| `bus` | `sfx` \| `music` \| `voice` | `"sfx"` |  |

```ts
export interface ClipProps {
  /** Stable unique id. Written back as fm_… when missing. */
  id?: string;
  label?: string;
  /** Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s */
  start?: Time;
  /** Defaults to the rest of the parent.; unit s */
  duration?: Time;
  /** Alternative to duration.; unit s */
  end?: Time;
  /** default false */
  hidden?: boolean;
  /** Link group id: linked clips move, trim and split together. */
  link?: string;
  /** unit px; default [0,0,0] */
  position?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0,0] */
  rotation?: Animatable<number | Vec2 | Vec3>;
  /** default [1,1,1] */
  scale?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0] */
  skew?: Animatable<number | Vec2>;
  /** Transform origin as % of the layer box (z in px).; unit %; default [50,50,0] */
  anchor?: Animatable<number | Vec2 | Vec3>;
  /** range 0..1; default 1 */
  opacity?: Animatable<number>;
  crop?: { top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> };
  /** default "none" */
  flip?: "none" | "x" | "y" | "xy";
  /** default "normal" */
  blend?: "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | "color-burn" | "soft-light" | "hard-light" | "difference" | "exclusion" | "hue" | "saturation" | "color" | "luminosity" | "add";
  /** range 0..∞; unit px; default 0 */
  perspective?: Animatable<number>;
  /** Stacking override among siblings.; default 0 */
  z?: number;
  /** Entrance motion at the start of the layer. */
  enter?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  /** Exit motion ending at the end of the layer. */
  exit?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  /** Placement: center | top | bottom | left | right | top-left | top-right | bottom-left | bottom-right or [x, y] (px, %, vw, vh) from the top-left.; default "center" */
  at?: unknown;
  src?: string;
  width?: Length;
  height?: Length;
  /** default "cover" */
  fit?: "cover" | "contain" | "fill";
  /** Source in point (trim).; unit s; default 0 */
  in?: Time;
  /** Source out point.; unit s */
  out?: Time;
  /** range 0.1..10; default 1 */
  speed?: number;
  /** Reverse playback (needs a pre-rendered reversed copy: later).; default false */
  reverse?: boolean;
  /** range -60..12; unit dB; default -60 */
  volume?: number;
  /** default "sfx" */
  bus?: "sfx" | "music" | "voice";
  children?: unknown;
}
```

---

# Audio

*component, category: media*

Background audio (music or ambience) on a bus. Mixed offline with FFmpeg; music ducks under voice.

Children: none.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  | Stable unique id. Written back as fm_… when missing. |
| `label` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s |
| `duration` | `Time` |  | Defaults to the rest of the parent.; unit s |
| `end` | `Time` |  | Alternative to duration.; unit s |
| `hidden` | `boolean` | `false` |  |
| `link` | `string` |  | Link group id: linked clips move, trim and split together. |
| `src` | `string` |  |  |
| `in` | `Time` | `0` | unit s |
| `gain` | `number` | `0` | range -60..12; unit dB |
| `bus` | `music` \| `sfx` \| `voice` | `"music"` |  |
| `fadeIn` | `number` | `0` | range 0..∞; unit s |
| `fadeOut` | `number` | `0` | range 0..∞; unit s |
| `speed` | `number` | `1` | range 0.1..10 |

```ts
export interface AudioProps {
  /** Stable unique id. Written back as fm_… when missing. */
  id?: string;
  label?: string;
  /** Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s */
  start?: Time;
  /** Defaults to the rest of the parent.; unit s */
  duration?: Time;
  /** Alternative to duration.; unit s */
  end?: Time;
  /** default false */
  hidden?: boolean;
  /** Link group id: linked clips move, trim and split together. */
  link?: string;
  src?: string;
  /** unit s; default 0 */
  in?: Time;
  /** range -60..12; unit dB; default 0 */
  gain?: number;
  /** default "music" */
  bus?: "music" | "sfx" | "voice";
  /** range 0..∞; unit s; default 0 */
  fadeIn?: number;
  /** range 0..∞; unit s; default 0 */
  fadeOut?: number;
  /** range 0.1..10; default 1 */
  speed?: number;
  children?: unknown;
}
```

---

# Sound

*component, category: media*

A sound effect placed on a moment. `at` is where the sound's peak should land; the clip starts early by its peak offset (`peak` is a number of seconds or a named peak from the ledger).

Children: none.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  |  |
| `src` | `string` |  | "freesound:12345" or a project file. |
| `at` | `Time` |  | unit s |
| `peak` | `string` |  | Seconds, or a named peak (e.g. land) stored with the asset. |
| `gain` | `number` | `0` | range -60..12; unit dB |
| `in` | `Time` | `0` | unit s |
| `speed` | `number` | `1` | range 0.1..10 |
| `bus` | `sfx` \| `music` \| `voice` | `"sfx"` |  |
| `tag` | `string` |  | Sound tag it was chosen for, e.g. hit/land. |

```ts
export interface SoundProps {
  id?: string;
  /** "freesound:12345" or a project file. */
  src?: string;
  /** unit s */
  at?: Time;
  /** Seconds, or a named peak (e.g. land) stored with the asset. */
  peak?: string;
  /** range -60..12; unit dB; default 0 */
  gain?: number;
  /** unit s; default 0 */
  in?: Time;
  /** range 0.1..10; default 1 */
  speed?: number;
  /** default "sfx" */
  bus?: "sfx" | "music" | "voice";
  /** Sound tag it was chosen for, e.g. hit/land. */
  tag?: string;
  children?: unknown;
}
```

---

# Voiceover

*component, category: media*

The narration. Loads the audio and its word timings (`voice.words.json`) so captions and `ctx.word(id, i)` can use them.

Children: none.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  |  |
| `src` | `string` |  |  |
| `words` | `string` |  | Word timings file (default: <src>.words.json). |
| `at` | `Time` | `0` | unit s |
| `gain` | `number` | `0` | range -60..12; unit dB |
| `script` | `string` |  | The spoken script (for review and caption fallback). |

```ts
export interface VoiceoverProps {
  id?: string;
  src?: string;
  /** Word timings file (default: <src>.words.json). */
  words?: string;
  /** unit s; default 0 */
  at?: Time;
  /** range -60..12; unit dB; default 0 */
  gain?: number;
  /** The spoken script (for review and caption fallback). */
  script?: string;
  children?: unknown;
}
```

---

# Captions

*component, category: media*

Captions from a Voiceover's word timings. Styles: karaoke (active word recoloured), pop (active word scales), line (whole line), word (one word at a time). Export .srt/.vtt with the CLI or MCP.

Children: effects only.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  | Stable unique id. Written back as fm_… when missing. |
| `label` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s |
| `duration` | `Time` |  | Defaults to the rest of the parent.; unit s |
| `end` | `Time` |  | Alternative to duration.; unit s |
| `hidden` | `boolean` | `false` |  |
| `link` | `string` |  | Link group id: linked clips move, trim and split together. |
| `position` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit px; ui vec |
| `rotation` | `number | Vec2 | Vec3` | `[0,0,0]` | animatable; unit deg; ui vec |
| `scale` | `number | Vec2 | Vec3` | `[1,1,1]` | animatable; step 0.01; ui vec |
| `skew` | `number | Vec2` | `[0,0]` | animatable; unit deg; ui vec |
| `anchor` | `number | Vec2 | Vec3` | `[50,50,0]` | Transform origin as % of the layer box (z in px).; animatable; unit %; ui vec |
| `opacity` | `number` | `1` | animatable; range 0..1; step 0.01; ui slider |
| `crop` | `{ top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> }` |  |  |
| `flip` | `none` \| `x` \| `y` \| `xy` | `"none"` |  |
| `blend` | `normal` \| `multiply` \| `screen` \| `overlay` \| `darken` \| `lighten` \| `color-dodge` \| `color-burn` \| `soft-light` \| `hard-light` \| `difference` \| `exclusion` \| `hue` \| `saturation` \| `color` \| `luminosity` \| `add` | `"normal"` | ui dropdown |
| `perspective` | `number` | `0` | animatable; range 0..∞; unit px |
| `z` | `number` | `0` | Stacking override among siblings.; step 1 |
| `enter` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Entrance motion at the start of the layer. |
| `exit` | `{ from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle }` |  | Exit motion ending at the end of the layer. |
| `voice` | `Ref` |  | The Voiceover, e.g. "#vo". |
| `captionStyle` | `karaoke` \| `pop` \| `line` \| `word` | `"karaoke"` |  |
| `maxChars` | `number` | `22` | Max characters per line.; range 6..80; step 1 |
| `maxWords` | `number` | `4` | range 1..12; step 1 |
| `activeColor` | `Color` | `"#ffe14d"` |  |
| `at` | `unknown` | `"center"` | Placement: center | top | bottom | left | right | top-left | top-right | bottom-left | bottom-right or [x, y] (px, %, vw, vh) from the top-left. |
| `hold` | `number` | `0.15` | How long a page lingers after its last word.; range 0..2; unit s |
| `font` | `string` | `"$type.display"` |  |
| `weight` | `number` | `800` | animatable; range 1..1000; step 1; unit wght |
| `width` | `number` | `100` | Font width (wdth axis).; animatable; range 25..200; step 1; unit % |
| `style` | `normal` \| `italic` \| `oblique` | `"normal"` |  |
| `size` | `number` | `64` | animatable; range 1..2000; step 1; unit px |
| `axes` | `{ wght?: Animatable<number>; wdth?: Animatable<number>; slnt?: Animatable<number>; ital?: Animatable<number>; opsz?: Animatable<number>; custom?: unknown }` |  | Animatable variable-font axes. `custom` takes static values for other axes. |
| `leading` | `number` | `1.15` | Line height multiplier.; animatable; range 0.5..4; step 0.01 |
| `tracking` | `number` | `0` | Letter spacing in thousandths of an em.; animatable; range -500..2000; step 1; unit ‰em |
| `wordSpacing` | `number` | `0` | animatable; range -500..2000; unit ‰em |
| `indent` | `number` | `0` | unit px |
| `paragraphSpacing` | `number` | `0` | unit px |
| `baselineShift` | `number` | `0` | animatable; unit px |
| `align` | `left` \| `center` \| `right` \| `justify` | `"center"` |  |
| `valign` | `top` \| `middle` \| `bottom` | `"top"` |  |
| `maxWidth` | `Length` | `"90%"` |  |
| `box` | `{ width?: Length; height?: Length }` |  | A fixed box; `valign` and `fit` use it. |
| `wrap` | `boolean` | `true` |  |
| `balance` | `boolean` | `false` | Balance line lengths. |
| `hyphenate` | `boolean` | `false` |  |
| `overflow` | `visible` \| `hidden` \| `ellipsis` | `"visible"` |  |
| `columns` | `number` | `1` | range 1..8 |
| `direction` | `ltr` \| `rtl` | `"ltr"` |  |
| `lang` | `string` |  | BCP-47 language, e.g. "en", "hi". |
| `case` | `none` \| `upper` \| `lower` \| `title` \| `small-caps` | `"none"` |  |
| `features` | `string[]` |  | OpenType features: "liga", "kern", "tnum", "lnum", "onum", "ss01"…"ss20", "salt". |
| `numeric` | `default` \| `tabular` \| `proportional` \| `lining` \| `oldstyle` | `"default"` |  |
| `fit` | `{ minSize?: number; maxSize?: number; maxLines?: number }` |  | Shrinks the size until the text fits the box / line count. |
| `underline` | `{ style?: "solid" | "dashed" | "dotted" | "wavy" | "double"; thickness?: number; offset?: number; color?: Color; progress?: Animatable<number> }` |  |  |
| `strike` | `{ style?: "solid" | "dashed" | "dotted" | "wavy" | "double"; thickness?: number; offset?: number; color?: Color; progress?: Animatable<number> }` |  |  |
| `highlight` | `{ color?: Color; padding?: number; radius?: number; progress?: Animatable<number>; opacity?: number }` |  |  |
| `fill` | `Fill` | `"#ffffff"` | Solid, gradient, image or video clipped to the letter shapes. |
| `stroke` | `{ width?: Animatable<number>; color?: Color; align?: "inside" | "center" | "outside"; join?: "miter" | "round" | "bevel"; dash?: number[] }` |  |  |
| `shadow` | `{ x?: number; y?: number; blur?: number; color?: Color; opacity?: number }[]` |  | Multiple shadows, drawn in order. |
| `glow` | `{ color?: Color; radius?: number; intensity?: number }` |  |  |
| `outline` | `{ width?: number; color?: Color; gap?: number }` |  | A box outline around the text block. |
| `blur` | `number` | `0` | animatable; range 0..200; unit px |
| `extrude` | `{ depth?: number; color?: Color }` |  | 3D extrusion is a later tier: typed stub, ignored with a warning. |
| `glitch` | `number` | `0` | Glitch amount (jitter, skew, hue flips).; animatable; range 0..3; step 0.05 |
| `rgbSplit` | `number` | `0` | animatable; range 0..60; unit px |

```ts
export interface CaptionsProps {
  /** Stable unique id. Written back as fm_… when missing. */
  id?: string;
  label?: string;
  /** Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s */
  start?: Time;
  /** Defaults to the rest of the parent.; unit s */
  duration?: Time;
  /** Alternative to duration.; unit s */
  end?: Time;
  /** default false */
  hidden?: boolean;
  /** Link group id: linked clips move, trim and split together. */
  link?: string;
  /** unit px; default [0,0,0] */
  position?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0,0] */
  rotation?: Animatable<number | Vec2 | Vec3>;
  /** default [1,1,1] */
  scale?: Animatable<number | Vec2 | Vec3>;
  /** unit deg; default [0,0] */
  skew?: Animatable<number | Vec2>;
  /** Transform origin as % of the layer box (z in px).; unit %; default [50,50,0] */
  anchor?: Animatable<number | Vec2 | Vec3>;
  /** range 0..1; default 1 */
  opacity?: Animatable<number>;
  crop?: { top?: Animatable<Length>; right?: Animatable<Length>; bottom?: Animatable<Length>; left?: Animatable<Length> };
  /** default "none" */
  flip?: "none" | "x" | "y" | "xy";
  /** default "normal" */
  blend?: "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | "color-burn" | "soft-light" | "hard-light" | "difference" | "exclusion" | "hue" | "saturation" | "color" | "luminosity" | "add";
  /** range 0..∞; unit px; default 0 */
  perspective?: Animatable<number>;
  /** Stacking override among siblings.; default 0 */
  z?: number;
  /** Entrance motion at the start of the layer. */
  enter?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  /** Exit motion ending at the end of the layer. */
  exit?: { from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-"; distance?: Length; ease?: Ease; duration?: Time; delay?: Time; fade?: boolean; blur?: number; scale?: number; rotate?: Angle };
  /** The Voiceover, e.g. "#vo". */
  voice?: Ref;
  /** default "karaoke" */
  captionStyle?: "karaoke" | "pop" | "line" | "word";
  /** Max characters per line.; range 6..80; default 22 */
  maxChars?: number;
  /** range 1..12; default 4 */
  maxWords?: number;
  /** default "#ffe14d" */
  activeColor?: Color;
  /** Placement: center | top | bottom | left | right | top-left | top-right | bottom-left | bottom-right or [x, y] (px, %, vw, vh) from the top-left.; default "center" */
  at?: unknown;
  /** How long a page lingers after its last word.; range 0..2; unit s; default 0.15 */
  hold?: number;
  /** default "$type.display" */
  font?: string;
  /** range 1..1000; unit wght; default 800 */
  weight?: Animatable<number>;
  /** Font width (wdth axis).; range 25..200; unit %; default 100 */
  width?: Animatable<number>;
  /** default "normal" */
  style?: "normal" | "italic" | "oblique";
  /** range 1..2000; unit px; default 64 */
  size?: Animatable<number>;
  /** Animatable variable-font axes. `custom` takes static values for other axes. */
  axes?: { wght?: Animatable<number>; wdth?: Animatable<number>; slnt?: Animatable<number>; ital?: Animatable<number>; opsz?: Animatable<number>; custom?: unknown };
  /** Line height multiplier.; range 0.5..4; default 1.15 */
  leading?: Animatable<number>;
  /** Letter spacing in thousandths of an em.; range -500..2000; unit ‰em; default 0 */
  tracking?: Animatable<number>;
  /** range -500..2000; unit ‰em; default 0 */
  wordSpacing?: Animatable<number>;
  /** unit px; default 0 */
  indent?: number;
  /** unit px; default 0 */
  paragraphSpacing?: number;
  /** unit px; default 0 */
  baselineShift?: Animatable<number>;
  /** default "center" */
  align?: "left" | "center" | "right" | "justify";
  /** default "top" */
  valign?: "top" | "middle" | "bottom";
  /** default "90%" */
  maxWidth?: Length;
  /** A fixed box; `valign` and `fit` use it. */
  box?: { width?: Length; height?: Length };
  /** default true */
  wrap?: boolean;
  /** Balance line lengths.; default false */
  balance?: boolean;
  /** default false */
  hyphenate?: boolean;
  /** default "visible" */
  overflow?: "visible" | "hidden" | "ellipsis";
  /** range 1..8; default 1 */
  columns?: number;
  /** default "ltr" */
  direction?: "ltr" | "rtl";
  /** BCP-47 language, e.g. "en", "hi". */
  lang?: string;
  /** default "none" */
  case?: "none" | "upper" | "lower" | "title" | "small-caps";
  /** OpenType features: "liga", "kern", "tnum", "lnum", "onum", "ss01"…"ss20", "salt". */
  features?: string[];
  /** default "default" */
  numeric?: "default" | "tabular" | "proportional" | "lining" | "oldstyle";
  /** Shrinks the size until the text fits the box / line count. */
  fit?: { minSize?: number; maxSize?: number; maxLines?: number };
  underline?: { style?: "solid" | "dashed" | "dotted" | "wavy" | "double"; thickness?: number; offset?: number; color?: Color; progress?: Animatable<number> };
  strike?: { style?: "solid" | "dashed" | "dotted" | "wavy" | "double"; thickness?: number; offset?: number; color?: Color; progress?: Animatable<number> };
  highlight?: { color?: Color; padding?: number; radius?: number; progress?: Animatable<number>; opacity?: number };
  /** Solid, gradient, image or video clipped to the letter shapes.; default "#ffffff" */
  fill?: Fill;
  stroke?: { width?: Animatable<number>; color?: Color; align?: "inside" | "center" | "outside"; join?: "miter" | "round" | "bevel"; dash?: number[] };
  /** Multiple shadows, drawn in order. */
  shadow?: { x?: number; y?: number; blur?: number; color?: Color; opacity?: number }[];
  glow?: { color?: Color; radius?: number; intensity?: number };
  /** A box outline around the text block. */
  outline?: { width?: number; color?: Color; gap?: number };
  /** range 0..200; unit px; default 0 */
  blur?: Animatable<number>;
  /** 3D extrusion is a later tier: typed stub, ignored with a warning. */
  extrude?: { depth?: number; color?: Color };
  /** Glitch amount (jitter, skew, hue flips).; range 0..3; default 0 */
  glitch?: Animatable<number>;
  /** range 0..60; unit px; default 0 */
  rgbSplit?: Animatable<number>;
  children?: unknown;
}
```

---

# Theme

*component, category: brand*

Tokens for palette, type scale, easing set, default transition, grain and sound palette. Reference with theme="$look.<id>" on the Composition.

Children: none.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  |  |
| `palette` | `unknown` |  |  |
| `brand` | `unknown` |  | Alias of palette entries, addressable as $brand.<key>. |
| `type` | `unknown` |  |  |
| `easing` | `unknown` |  |  |
| `transition` | `{ type?: string; duration?: Time }` |  |  |
| `grain` | `number` |  | range 0..1 |
| `sound` | `unknown` |  |  |

```ts
export interface ThemeProps {
  id?: string;
  palette?: unknown;
  /** Alias of palette entries, addressable as $brand.<key>. */
  brand?: unknown;
  type?: unknown;
  easing?: unknown;
  transition?: { type?: string; duration?: Time };
  /** range 0..1 */
  grain?: number;
  sound?: unknown;
  children?: unknown;
}
```

---

# Look

*component, category: brand*

Tokens for palette, type scale, easing set, default transition, grain and sound palette. Reference with theme="$look.<id>" on the Composition.

Children: none.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  |  |
| `palette` | `unknown` |  |  |
| `brand` | `unknown` |  | Alias of palette entries, addressable as $brand.<key>. |
| `type` | `unknown` |  |  |
| `easing` | `unknown` |  |  |
| `transition` | `{ type?: string; duration?: Time }` |  |  |
| `grain` | `number` |  | range 0..1 |
| `sound` | `unknown` |  |  |

```ts
export interface LookProps {
  id?: string;
  palette?: unknown;
  /** Alias of palette entries, addressable as $brand.<key>. */
  brand?: unknown;
  type?: unknown;
  easing?: unknown;
  transition?: { type?: string; duration?: Time };
  /** range 0..1 */
  grain?: number;
  sound?: unknown;
  children?: unknown;
}
```
