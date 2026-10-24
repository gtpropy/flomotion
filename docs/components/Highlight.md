# Highlight

*component, category: text*

Marker-pen highlight behind an inline run. `progress` animates a left-to-right wipe.

Children: any layers and effects.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  | Stable unique id. |
| `color` | `Color` | `"#ffe14d"` |  |
| `padding` | `number` | `6` | range 0..∞; unit px |
| `radius` | `number` | `6` | range 0..∞; unit px |
| `progress` | `number` | `1` | animatable; range 0..1; step 0.01 |

```ts
export interface HighlightProps {
  /** Stable unique id. */
  id?: string;
  /** default "#ffe14d" */
  color?: Color;
  /** range 0..∞; unit px; default 6 */
  padding?: number;
  /** range 0..∞; unit px; default 6 */
  radius?: number;
  /** range 0..1; default 1 */
  progress?: Animatable<number>;
  children?: unknown;
}
```
