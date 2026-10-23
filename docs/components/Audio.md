# Audio

*component, category: media*

Background audio (music or ambience) on a bus. Mixed offline with FFmpeg; music ducks under voice.

Children: none.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  | Stable unique id. Written back as cc_… when missing. |
| `label` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s |
| `duration` | `Time` |  | Defaults to the rest of the parent.; unit s |
| `end` | `Time` |  | Alternative to duration.; unit s |
| `hidden` | `boolean` | `false` |  |
| `link` | `string` |  | Link group id: linked clips move, trim and split together. |
| `src` | `string` |  |  |
| `in` | `Time` | `0` | unit s |
| `gain` | `number` | `0` | range -60..12; unit dB |
| `bus` | `music` \| `sfx` \| `voice` | `"music"` |  |
| `fadeIn` | `number` | `0` | range 0..∞; unit s |
| `fadeOut` | `number` | `0` | range 0..∞; unit s |
| `speed` | `number` | `1` | range 0.1..10 |

```ts
export interface AudioProps {
  /** Stable unique id. Written back as cc_… when missing. */
  id?: string;
  label?: string;
  /** Start relative to the parent Scene/Precomp. Use "@12s" for absolute time.; unit s */
  start?: Time;
  /** Defaults to the rest of the parent.; unit s */
  duration?: Time;
  /** Alternative to duration.; unit s */
  end?: Time;
  /** default false */
  hidden?: boolean;
  /** Link group id: linked clips move, trim and split together. */
  link?: string;
  src?: string;
  /** unit s; default 0 */
  in?: Time;
  /** range -60..12; unit dB; default 0 */
  gain?: number;
  /** default "music" */
  bus?: "music" | "sfx" | "voice";
  /** range 0..∞; unit s; default 0 */
  fadeIn?: number;
  /** range 0..∞; unit s; default 0 */
  fadeOut?: number;
  /** range 0.1..10; default 1 */
  speed?: number;
  children?: unknown;
}
```
