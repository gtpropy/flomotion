# Grain

*effect, category: color*

Film grain: seeded fractal noise overlay. The noise re-seeds every `hold` frames from a seeded PRNG, so renders repeat exactly.

Children: none.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent layer.; unit s |
| `duration` | `Time` |  | unit s |
| `enabled` | `boolean` | `true` |  |
| `amount` | `number` | `0.12` | animatable; range 0..1; step 0.01 |
| `size` | `number` | `1` | Grain size (higher = coarser).; range 0.2..4; step 0.05 |
| `hold` | `number` | `2` | Frames each noise pattern is held.; range 1..12; step 1 |
| `seed` | `number` | `1` | range 0..100000; step 1 |
| `mono` | `boolean` | `true` |  |
| `blend` | `overlay` \| `soft-light` \| `multiply` \| `screen` | `"overlay"` |  |

```ts
export interface GrainProps {
  id?: string;
  /** Start relative to the parent layer.; unit s */
  start?: Time;
  /** unit s */
  duration?: Time;
  /** default true */
  enabled?: boolean;
  /** range 0..1; default 0.12 */
  amount?: Animatable<number>;
  /** Grain size (higher = coarser).; range 0.2..4; default 1 */
  size?: number;
  /** Frames each noise pattern is held.; range 1..12; default 2 */
  hold?: number;
  /** range 0..100000; default 1 */
  seed?: number;
  /** default true */
  mono?: boolean;
  /** default "overlay" */
  blend?: "overlay" | "soft-light" | "multiply" | "screen";
  children?: unknown;
}
```
