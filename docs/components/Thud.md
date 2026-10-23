# Thud

*effect, category: impact*

A landing: damped oscillation along an axis with squash. y = amp·e^(-damping·t)·cos(2π·freq·t).

Children: none. Default sound tag: `hit/land`.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent layer.; unit s |
| `duration` | `Time` |  | unit s |
| `enabled` | `boolean` | `true` |  |
| `amp` | `number` | `28` | range 0..600; unit px |
| `freq` | `number` | `3` | range 0.1..30; unit Hz |
| `damping` | `number` | `6` | range 0..60 |
| `axis` | `x` \| `y` | `"y"` |  |
| `squash` | `number` | `0.06` | Scale squash along the impact axis.; range 0..0.5; step 0.005 |
| `sound` | `string` | `"hit/land"` | Sound tag for autoSound (default hit/land); "" disables.; sound hit/land |

```ts
export interface ThudProps {
  id?: string;
  /** Start relative to the parent layer.; unit s */
  start?: Time;
  /** unit s */
  duration?: Time;
  /** default true */
  enabled?: boolean;
  /** range 0..600; unit px; default 28 */
  amp?: number;
  /** range 0.1..30; unit Hz; default 3 */
  freq?: number;
  /** range 0..60; default 6 */
  damping?: number;
  /** default "y" */
  axis?: "x" | "y";
  /** Scale squash along the impact axis.; range 0..0.5; default 0.06 */
  squash?: number;
  /** Sound tag for autoSound (default hit/land); "" disables.; default "hit/land" */
  sound?: string;
  children?: unknown;
}
```
