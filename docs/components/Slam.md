# Slam

*effect, category: impact*

Drops in fast from above (ease-in), lands with a thud, squash and settle.

Children: none. Default sound tag: `hit/boom`.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent layer.; unit s |
| `duration` | `Time` |  | unit s |
| `enabled` | `boolean` | `true` |  |
| `distance` | `Length` | `700` | Fall distance. |
| `fall` | `Time` | `0.22` | range 0.05..2; unit s |
| `ease` | `string` | `"expo.in"` |  |
| `amp` | `number` | `30` | Landing bounce amplitude.; range 0..400; unit px |
| `freq` | `number` | `3.5` | range 0.1..30 |
| `damping` | `number` | `7` | range 0..60 |
| `squash` | `number` | `0.1` | range 0..0.5; step 0.005 |
| `sound` | `string` | `"hit/boom"` | Sound tag for autoSound (default hit/boom); "" disables.; sound hit/boom |

```ts
export interface SlamProps {
  id?: string;
  /** Start relative to the parent layer.; unit s */
  start?: Time;
  /** unit s */
  duration?: Time;
  /** default true */
  enabled?: boolean;
  /** Fall distance.; default 700 */
  distance?: Length;
  /** range 0.05..2; unit s; default 0.22 */
  fall?: Time;
  /** default "expo.in" */
  ease?: string;
  /** Landing bounce amplitude.; range 0..400; unit px; default 30 */
  amp?: number;
  /** range 0.1..30; default 3.5 */
  freq?: number;
  /** range 0..60; default 7 */
  damping?: number;
  /** range 0..0.5; default 0.1 */
  squash?: number;
  /** Sound tag for autoSound (default hit/boom); "" disables.; default "hit/boom" */
  sound?: string;
  children?: unknown;
}
```
