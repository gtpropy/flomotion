# SquashStretch

*effect, category: impact*

Volume-preserving squash and stretch oscillation (sy = 1 + a·env·cos, sx = 1/√sy).

Children: none. Default sound tag: `ui/pop`.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent layer.; unit s |
| `duration` | `Time` |  | unit s |
| `enabled` | `boolean` | `true` |  |
| `amount` | `number` | `0.22` | range 0..0.9; step 0.01 |
| `freq` | `number` | `3.5` | range 0.1..30 |
| `damping` | `number` | `6` | range 0..60 |
| `sound` | `string` | `"ui/pop"` | Sound tag for autoSound (default ui/pop); "" disables.; sound ui/pop |

```ts
export interface SquashStretchProps {
  id?: string;
  /** Start relative to the parent layer.; unit s */
  start?: Time;
  /** unit s */
  duration?: Time;
  /** default true */
  enabled?: boolean;
  /** range 0..0.9; default 0.22 */
  amount?: number;
  /** range 0.1..30; default 3.5 */
  freq?: number;
  /** range 0..60; default 6 */
  damping?: number;
  /** Sound tag for autoSound (default ui/pop); "" disables.; default "ui/pop" */
  sound?: string;
  children?: unknown;
}
```
