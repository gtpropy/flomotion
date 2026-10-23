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
