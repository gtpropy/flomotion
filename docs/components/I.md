# I

*component, category: text*

Italic run inside Text.

Children: any layers and effects.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `skew` | `number` | `0` |  |
| `id` | `string` |  | Stable unique id. Written back as cc_… when missing. |

```ts
export interface IProps {
  /** default 0 */
  skew?: number;
  /** Stable unique id. Written back as cc_… when missing. */
  id?: string;
  children?: unknown;
}
```
