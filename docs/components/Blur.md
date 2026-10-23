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
