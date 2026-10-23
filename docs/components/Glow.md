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
