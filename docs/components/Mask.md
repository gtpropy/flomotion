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
