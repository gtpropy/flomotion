# WhipPan

*effect, category: impact*

A fast whip move with motion blur: the layer swings in from (or out toward) a side.

Children: none. Default sound tag: `move/whip`.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent layer.; unit s |
| `duration` | `Time` |  | unit s |
| `enabled` | `boolean` | `true` |  |
| `direction` | `e` \| `w` \| `n` \| `s` | `"e"` |  |
| `mode` | `in` \| `out` | `"in"` |  |
| `distance` | `Length` | `"100vw"` |  |
| `whip` | `Time` | `0.35` | range 0.05..2; unit s |
| `ease` | `string` | `"expo.inOut"` |  |
| `blur` | `number` | `36` | range 0..120; unit px |
| `sound` | `string` | `"move/whip"` | Sound tag for autoSound (default move/whip); "" disables.; sound move/whip |

```ts
export interface WhipPanProps {
  id?: string;
  /** Start relative to the parent layer.; unit s */
  start?: Time;
  /** unit s */
  duration?: Time;
  /** default true */
  enabled?: boolean;
  /** default "e" */
  direction?: "e" | "w" | "n" | "s";
  /** default "in" */
  mode?: "in" | "out";
  /** default "100vw" */
  distance?: Length;
  /** range 0.05..2; unit s; default 0.35 */
  whip?: Time;
  /** default "expo.inOut" */
  ease?: string;
  /** range 0..120; unit px; default 36 */
  blur?: number;
  /** Sound tag for autoSound (default move/whip); "" disables.; default "move/whip" */
  sound?: string;
  children?: unknown;
}
```
