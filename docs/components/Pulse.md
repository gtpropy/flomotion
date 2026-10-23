# Pulse

*effect, category: impact*

Repeating scale pulses: scale = 1 + amp·sin²(π·freq·t) for `count` beats (or until the parent ends when count is 0).

Children: none. Default sound tag: `ui/tick`.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent layer.; unit s |
| `duration` | `Time` |  | unit s |
| `enabled` | `boolean` | `true` |  |
| `amp` | `number` | `0.06` | range 0..1; step 0.005 |
| `freq` | `number` | `2` | range 0.1..30; unit Hz |
| `count` | `number` | `4` | range 0..64 |
| `sound` | `string` | `"ui/tick"` | Sound tag for autoSound (default ui/tick); "" disables.; sound ui/tick |

```ts
export interface PulseProps {
  id?: string;
  /** Start relative to the parent layer.; unit s */
  start?: Time;
  /** unit s */
  duration?: Time;
  /** default true */
  enabled?: boolean;
  /** range 0..1; default 0.06 */
  amp?: number;
  /** range 0.1..30; unit Hz; default 2 */
  freq?: number;
  /** range 0..64; default 4 */
  count?: number;
  /** Sound tag for autoSound (default ui/tick); "" disables.; default "ui/tick" */
  sound?: string;
  children?: unknown;
}
```
