# Matte

*effect, category: shapes*

Uses another shape layer as a track matte (alpha or luma) for its parent. The source must be a Rect, RoundRect, Circle or Polygon; its shape is stretched over the parent's box. Set the source layer `hidden` to avoid drawing it.

Children: none.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent layer.; unit s |
| `duration` | `Time` |  | unit s |
| `enabled` | `boolean` | `true` |  |
| `source` | `Ref` |  |  |
| `mode` | `alpha` \| `luma` | `"alpha"` |  |
| `invert` | `boolean` | `false` |  |

```ts
export interface MatteProps {
  id?: string;
  /** Start relative to the parent layer.; unit s */
  start?: Time;
  /** unit s */
  duration?: Time;
  /** default true */
  enabled?: boolean;
  source?: Ref;
  /** default "alpha" */
  mode?: "alpha" | "luma";
  /** default false */
  invert?: boolean;
  children?: unknown;
}
```
