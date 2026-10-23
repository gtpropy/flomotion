# Glitch

*effect, category: impact*

Seeded digital glitch: jittering offset and skew, flicker and hue flips. Changes every other frame.

Children: none. Default sound tag: `tech/glitch`.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent layer.; unit s |
| `duration` | `Time` |  | unit s |
| `enabled` | `boolean` | `true` |  |
| `amount` | `number` | `1` | range 0..3; step 0.05 |
| `seed` | `number` | `3` |  |
| `hold` | `number` | `2` | Frames each glitch state is held.; range 1..8 |
| `sound` | `string` | `"tech/glitch"` | Sound tag for autoSound (default tech/glitch); "" disables.; sound tech/glitch |

```ts
export interface GlitchProps {
  id?: string;
  /** Start relative to the parent layer.; unit s */
  start?: Time;
  /** unit s */
  duration?: Time;
  /** default true */
  enabled?: boolean;
  /** range 0..3; default 1 */
  amount?: number;
  /** default 3 */
  seed?: number;
  /** Frames each glitch state is held.; range 1..8; default 2 */
  hold?: number;
  /** Sound tag for autoSound (default tech/glitch); "" disables.; default "tech/glitch" */
  sound?: string;
  children?: unknown;
}
```
