# Shake

*effect, category: impact*

Decaying noise shake of the parent: x, y and optional rotation. Deterministic (seeded noise of time).

Children: none. Default sound tag: `hit/punch`.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent layer.; unit s |
| `duration` | `Time` |  | unit s |
| `enabled` | `boolean` | `true` |  |
| `amp` | `number` | `12` | range 0..400; unit px |
| `freq` | `number` | `14` | range 0.1..120; unit Hz |
| `decay` | `number` | `5` | Envelope e^(-decay·t).; range 0..60 |
| `axes` | `x` \| `y` \| `xy` | `"xy"` |  |
| `seed` | `number` | `1` |  |
| `rotation` | `number` | `0` | Rotational shake amplitude.; range 0..45; unit deg |
| `sound` | `string` | `"hit/punch"` | Sound tag for autoSound (default hit/punch); "" disables.; sound hit/punch |

```ts
export interface ShakeProps {
  id?: string;
  /** Start relative to the parent layer.; unit s */
  start?: Time;
  /** unit s */
  duration?: Time;
  /** default true */
  enabled?: boolean;
  /** range 0..400; unit px; default 12 */
  amp?: number;
  /** range 0.1..120; unit Hz; default 14 */
  freq?: number;
  /** Envelope e^(-decay·t).; range 0..60; default 5 */
  decay?: number;
  /** default "xy" */
  axes?: "x" | "y" | "xy";
  /** default 1 */
  seed?: number;
  /** Rotational shake amplitude.; range 0..45; unit deg; default 0 */
  rotation?: number;
  /** Sound tag for autoSound (default hit/punch); "" disables.; default "hit/punch" */
  sound?: string;
  children?: unknown;
}
```
