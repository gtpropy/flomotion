# Highlight

*component, category: text*

Marker-pen highlight behind an inline run. `progress` animates a left-to-right wipe.

Children: any layers and effects.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `color` | `Color` | `"#ffe14d"` |  |
| `padding` | `number` | `6` | range 0..∞; unit px |
| `radius` | `number` | `6` | range 0..∞; unit px |
| `progress` | `number` | `1` | animatable; range 0..1; step 0.01 |
| `id` | `string` |  | Stable unique id. Written back as cc_… when missing. |

```ts
export interface HighlightProps {
  /** default "#ffe14d" */
  color?: Color;
  /** range 0..∞; unit px; default 6 */
  padding?: number;
  /** range 0..∞; unit px; default 6 */
  radius?: number;
  /** range 0..1; default 1 */
  progress?: Animatable<number>;
  /** Stable unique id. Written back as cc_… when missing. */
  id?: string;
  children?: unknown;
}
```
