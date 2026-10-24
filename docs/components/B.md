# B

*component, category: text*

Bold run inside Text.

Children: any layers and effects.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  | Stable unique id. |
| `weight` | `number` | `700` | range 1..1000 |

```ts
export interface BProps {
  /** Stable unique id. */
  id?: string;
  /** range 1..1000; default 700 */
  weight?: number;
  children?: unknown;
}
```
