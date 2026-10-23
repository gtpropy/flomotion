# Sound

*component, category: media*

A sound effect placed on a moment. `at` is where the sound's peak should land; the clip starts early by its peak offset (`peak` is a number of seconds or a named peak from the ledger).

Children: none.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  |  |
| `src` | `string` |  | "freesound:12345" or a project file. |
| `at` | `Time` |  | unit s |
| `peak` | `string` |  | Seconds, or a named peak (e.g. land) stored with the asset. |
| `gain` | `number` | `0` | range -60..12; unit dB |
| `in` | `Time` | `0` | unit s |
| `speed` | `number` | `1` | range 0.1..10 |
| `bus` | `sfx` \| `music` \| `voice` | `"sfx"` |  |
| `tag` | `string` |  | Sound tag it was chosen for, e.g. hit/land. |

```ts
export interface SoundProps {
  id?: string;
  /** "freesound:12345" or a project file. */
  src?: string;
  /** unit s */
  at?: Time;
  /** Seconds, or a named peak (e.g. land) stored with the asset. */
  peak?: string;
  /** range -60..12; unit dB; default 0 */
  gain?: number;
  /** unit s; default 0 */
  in?: Time;
  /** range 0.1..10; default 1 */
  speed?: number;
  /** default "sfx" */
  bus?: "sfx" | "music" | "voice";
  /** Sound tag it was chosen for, e.g. hit/land. */
  tag?: string;
  children?: unknown;
}
```
