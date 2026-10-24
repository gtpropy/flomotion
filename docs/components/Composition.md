# Composition

*component, category: structure*

Root of a project: size, frame rate, duration and theme.

Children: any layers and effects.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  | Stable unique id. Written back as fm_… when missing. |
| `size` | `number | Vec2` | `[1920,1080]` | [width, height]; unit px |
| `fps` | `number` | `30` | range 1..240 |
| `duration` | `Time` |  | unit s |
| `background` | `Color` | `"#000000"` |  |
| `theme` | `string` |  | Look/Theme reference, e.g. "$look.kinetic" |
| `colorSpace` | `srgb` | `"srgb"` | SDR sRGB only for now. |
| `bpm` | `number` |  | Tempo for ctx.beat(n).; range 20..400 |

```ts
export interface CompositionProps {
  /** Stable unique id. Written back as fm_… when missing. */
  id?: string;
  /** [width, height]; unit px; default [1920,1080] */
  size?: number | Vec2;
  /** range 1..240; default 30 */
  fps?: number;
  /** unit s */
  duration?: Time;
  /** default "#000000" */
  background?: Color;
  /** Look/Theme reference, e.g. "$look.kinetic" */
  theme?: string;
  /** SDR sRGB only for now.; default "srgb" */
  colorSpace?: "srgb";
  /** Tempo for ctx.beat(n).; range 20..400 */
  bpm?: number;
  children?: unknown;
}
```
