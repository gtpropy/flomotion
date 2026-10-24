# Marker

*component, category: structure*

A named point in time. Reference it with Time strings like "@marker:drop".

Children: none.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  | Stable unique id. Written back as fm_… when missing. |
| `at` | `Time` |  | unit s |
| `label` | `string` |  |  |
| `color` | `Color` |  |  |

```ts
export interface MarkerProps {
  /** Stable unique id. Written back as fm_… when missing. */
  id?: string;
  /** unit s */
  at?: Time;
  label?: string;
  color?: Color;
  children?: unknown;
}
```
