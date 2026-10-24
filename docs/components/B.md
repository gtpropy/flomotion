# B

*component, category: text*

Bold run inside Text.

Children: any layers and effects.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `weight` | `number` | `700` | range 1..1000 |
| `id` | `string` |  | Stable unique id. Written back as fm_… when missing. |

```ts
export interface BProps {
  /** range 1..1000; default 700 */
  weight?: number;
  /** Stable unique id. Written back as fm_… when missing. */
  id?: string;
  children?: unknown;
}
```
