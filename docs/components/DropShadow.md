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
