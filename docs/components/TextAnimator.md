# TextAnimator

*effect, category: text*

After Effects style text animator. A selector gives each character, word or line an influence from 0 to 1 over time; the `props` interpolate from the base value to the given value by that influence. Pure functions of time; randomness is seeded.

Children: none.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent layer.; unit s |
| `duration` | `Time` |  | unit s |
| `enabled` | `boolean` | `true` |  |
| `by` | `char` \| `word` \| `line` | `"char"` |  |
| `preset` | `none` \| `typewriter` \| `wave` \| `scramble` \| `rise` \| `slam` \| `blur-in` \| `mask-reveal` \| `weight-pulse` \| `tracking-in` \| `counter` | `"none"` |  |
| `selector` | `{ start?: number; end?: number; offset?: Animatable<number>; shape?: "square" | "ramp" | "triangle" | "smooth" | "wave"; randomize?: { seed?: number; amount?: number } }` |  | Range selector. Omit to use `stagger` timing instead. |
| `props` | `{ opacity?: number; x?: number; y?: number; yPercent?: number; scale?: number; rotation?: number; skew?: number; blur?: number; tracking?: number; weight?: number; fill?: Color; strokeWidth?: number; shadow?: { x?: number; y?: number; blur?: number; color?: Color } }` |  | Values at full influence (influence 1). Base values are the Text's own. |
| `stagger` | `Time` |  | Seconds between units (stagger timing mode).; range 0..∞; unit s |
| `unitDuration` | `Time` |  | Seconds each unit takes to settle.; range 0..∞; unit s |
| `ease` | `string` |  | Ease of each unit's settle (default per preset). |
| `order` | `forward` \| `backward` \| `center` \| `edges` \| `random` | `"forward"` |  |
| `seed` | `number` | `1` |  |
| `loop` | `boolean` | `false` | Wave presets keep running until the parent ends. |

```ts
export interface TextAnimatorProps {
  id?: string;
  /** Start relative to the parent layer.; unit s */
  start?: Time;
  /** unit s */
  duration?: Time;
  /** default true */
  enabled?: boolean;
  /** default "char" */
  by?: "char" | "word" | "line";
  /** default "none" */
  preset?: "none" | "typewriter" | "wave" | "scramble" | "rise" | "slam" | "blur-in" | "mask-reveal" | "weight-pulse" | "tracking-in" | "counter";
  /** Range selector. Omit to use `stagger` timing instead. */
  selector?: { start?: number; end?: number; offset?: Animatable<number>; shape?: "square" | "ramp" | "triangle" | "smooth" | "wave"; randomize?: { seed?: number; amount?: number } };
  /** Values at full influence (influence 1). Base values are the Text's own. */
  props?: { opacity?: number; x?: number; y?: number; yPercent?: number; scale?: number; rotation?: number; skew?: number; blur?: number; tracking?: number; weight?: number; fill?: Color; strokeWidth?: number; shadow?: { x?: number; y?: number; blur?: number; color?: Color } };
  /** Seconds between units (stagger timing mode).; range 0..∞; unit s */
  stagger?: Time;
  /** Seconds each unit takes to settle.; range 0..∞; unit s */
  unitDuration?: Time;
  /** Ease of each unit's settle (default per preset). */
  ease?: string;
  /** default "forward" */
  order?: "forward" | "backward" | "center" | "edges" | "random";
  /** default 1 */
  seed?: number;
  /** Wave presets keep running until the parent ends.; default false */
  loop?: boolean;
  children?: unknown;
}
```
