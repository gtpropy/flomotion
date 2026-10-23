# Counter

*component, category: ui*

An animated number that counts from `from` to `to`. Uses tabular figures so the width does not jitter.

Children: effects only.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  | Stable unique id. Written back as cc_… when missing. |
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
  /** Stable unique id. Written back as cc_… when missing. */
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
