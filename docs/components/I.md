# I

*component, category: text*

Italic run inside Text.

Children: any layers and effects.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  | Stable unique id. |
| `skew` | `number` | `0` |  |

```ts
export interface IProps {
  /** Stable unique id. */
  id?: string;
  /** default 0 */
  skew?: number;
  children?: unknown;
}
```
