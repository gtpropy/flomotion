# Wobble

*effect, category: impact*

Damped rotational wobble: rot = amp·e^(-damping·t)·sin(2π·freq·t).

Children: none. Default sound tag: `ui/tick`.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent layer.; unit s |
| `duration` | `Time` |  | unit s |
| `enabled` | `boolean` | `true` |  |
| `amp` | `number` | `8` | range 0..90; unit deg |
| `freq` | `number` | `3` | range 0.1..30 |
| `damping` | `number` | `4` | range 0..60 |
| `sound` | `string` | `"ui/tick"` | Sound tag for autoSound (default ui/tick); "" disables.; sound ui/tick |

```ts
export interface WobbleProps {
  id?: string;
  /** Start relative to the parent layer.; unit s */
  start?: Time;
  /** unit s */
  duration?: Time;
  /** default true */
  enabled?: boolean;
  /** range 0..90; unit deg; default 8 */
  amp?: number;
  /** range 0.1..30; default 3 */
  freq?: number;
  /** range 0..60; default 4 */
  damping?: number;
  /** Sound tag for autoSound (default ui/tick); "" disables.; default "ui/tick" */
  sound?: string;
  children?: unknown;
}
```
