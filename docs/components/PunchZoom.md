# PunchZoom

*effect, category: impact*

A quick scale punch that settles: scale = 1 + amount·e^(-decay·t).

Children: none. Default sound tag: `hit/punch`.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent layer.; unit s |
| `duration` | `Time` |  | unit s |
| `enabled` | `boolean` | `true` |  |
| `amount` | `number` | `0.12` | range -1..2; step 0.01 |
| `decay` | `number` | `9` | range 0.5..60 |
| `sound` | `string` | `"hit/punch"` | Sound tag for autoSound (default hit/punch); "" disables.; sound hit/punch |

```ts
export interface PunchZoomProps {
  id?: string;
  /** Start relative to the parent layer.; unit s */
  start?: Time;
  /** unit s */
  duration?: Time;
  /** default true */
  enabled?: boolean;
  /** range -1..2; default 0.12 */
  amount?: number;
  /** range 0.5..60; default 9 */
  decay?: number;
  /** Sound tag for autoSound (default hit/punch); "" disables.; default "hit/punch" */
  sound?: string;
  children?: unknown;
}
```
