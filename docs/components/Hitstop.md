# Hitstop

*effect, category: impact*

Freezes the parent's own animation for a few frames at the hit moment, then resumes (time remap).

Children: none. Default sound tag: `hit/punch`.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent layer.; unit s |
| `duration` | `Time` |  | unit s |
| `enabled` | `boolean` | `true` |  |
| `frames` | `number` | `4` | range 1..30 |
| `sound` | `string` | `"hit/punch"` | Sound tag for autoSound (default hit/punch); "" disables.; sound hit/punch |

```ts
export interface HitstopProps {
  id?: string;
  /** Start relative to the parent layer.; unit s */
  start?: Time;
  /** unit s */
  duration?: Time;
  /** default true */
  enabled?: boolean;
  /** range 1..30; default 4 */
  frames?: number;
  /** Sound tag for autoSound (default hit/punch); "" disables.; default "hit/punch" */
  sound?: string;
  children?: unknown;
}
```
