# Span

*component, category: text*

Inline run inside Text that overrides font, weight, colour, size and features.

Children: any layers and effects.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `font` | `string` |  |  |
| `weight` | `number` |  | range 1..1000 |
| `color` | `Color` |  |  |
| `size` | `number` |  | Multiplier of the parent size (em).; range 0.1..10 |
| `tracking` | `number` |  | unit ‰em |
| `features` | `string[]` |  |  |
| `style` | `normal` \| `italic` \| `oblique` |  |  |
| `id` | `string` |  | Stable unique id. Written back as fm_… when missing. |

```ts
export interface SpanProps {
  font?: string;
  /** range 1..1000 */
  weight?: number;
  color?: Color;
  /** Multiplier of the parent size (em).; range 0.1..10 */
  size?: number;
  /** unit ‰em */
  tracking?: number;
  features?: string[];
  style?: "normal" | "italic" | "oblique";
  /** Stable unique id. Written back as fm_… when missing. */
  id?: string;
  children?: unknown;
}
```
