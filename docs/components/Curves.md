# Curves

*effect, category: color*

Tone curves per channel (rgb, r, g, b, luma). Points are 0..1 with a monotone cubic through them. `luma` is applied to all three channels equally.

Children: none.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent layer.; unit s |
| `duration` | `Time` |  | unit s |
| `enabled` | `boolean` | `true` |  |
| `curves` | `Partial<Record<CurveChannel, CurvePoint[]>>` |  |  |

```ts
export interface CurvesProps {
  id?: string;
  /** Start relative to the parent layer.; unit s */
  start?: Time;
  /** unit s */
  duration?: Time;
  /** default true */
  enabled?: boolean;
  curves?: Partial<Record<CurveChannel, CurvePoint[]>>;
  children?: unknown;
}
```
