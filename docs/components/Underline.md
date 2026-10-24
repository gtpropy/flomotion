# Underline

*component, category: text*

Underline for an inline run. `progress` animates a draw-on from left to right.

Children: any layers and effects.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  | Stable unique id. |
| `color` | `Color` | `"#ffffff"` |  |
| `thickness` | `number` | `4` | range 0..∞; unit px |
| `offset` | `number` | `4` | unit px |
| `progress` | `number` | `1` | animatable; range 0..1; step 0.01 |

```ts
export interface UnderlineProps {
  /** Stable unique id. */
  id?: string;
  /** default "#ffffff" */
  color?: Color;
  /** range 0..∞; unit px; default 4 */
  thickness?: number;
  /** unit px; default 4 */
  offset?: number;
  /** range 0..1; default 1 */
  progress?: Animatable<number>;
  children?: unknown;
}
```
