# CodeBlock

*component, category: ui*

A syntax-tinted code panel. `reveal` (0 to 1) types the code in line by line.

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
