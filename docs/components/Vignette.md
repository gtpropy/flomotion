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
