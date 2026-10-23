# RGBSplit

*effect, category: impact*

Chromatic aberration: red and blue channels offset in opposite directions. `decay` fades it out.

Children: none. Default sound tag: `tech/glitch`.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent layer.; unit s |
| `duration` | `Time` |  | unit s |
| `enabled` | `boolean` | `true` |  |
| `amount` | `number` | `10` | animatable; range 0..100; unit px |
| `angle` | `number` | `0` | range -180..180; unit deg |
| `decay` | `number` | `0` | range 0..60 |
| `sound` | `string` | `"tech/glitch"` | Sound tag for autoSound (default tech/glitch); "" disables.; sound tech/glitch |

```ts
export interface RGBSplitProps {
  id?: string;
  /** Start relative to the parent layer.; unit s */
  start?: Time;
  /** unit s */
  duration?: Time;
  /** default true */
  enabled?: boolean;
  /** range 0..100; unit px; default 10 */
  amount?: Animatable<number>;
  /** range -180..180; unit deg; default 0 */
  angle?: number;
  /** range 0..60; default 0 */
  decay?: number;
  /** Sound tag for autoSound (default tech/glitch); "" disables.; default "tech/glitch" */
  sound?: string;
  children?: unknown;
}
```
