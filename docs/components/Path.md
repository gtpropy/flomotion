# Path

*component, category: shapes*

An SVG path in its own viewBox. `trimStart`/`trimEnd` animate a draw-on.

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
