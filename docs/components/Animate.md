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
