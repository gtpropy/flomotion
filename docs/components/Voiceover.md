# Voiceover

*component, category: media*

The narration. Loads the audio and its word timings (`voice.words.json`) so captions and `ctx.word(id, i)` can use them.

Children: none.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  |  |
| `src` | `string` |  |  |
| `words` | `string` |  | Word timings file (default: <src>.words.json). |
| `at` | `Time` | `0` | unit s |
| `gain` | `number` | `0` | range -60..12; unit dB |
| `script` | `string` |  | The spoken script (for review and caption fallback). |

```ts
export interface VoiceoverProps {
  id?: string;
  src?: string;
  /** Word timings file (default: <src>.words.json). */
  words?: string;
  /** unit s; default 0 */
  at?: Time;
  /** range -60..12; unit dB; default 0 */
  gain?: number;
  /** The spoken script (for review and caption fallback). */
  script?: string;
  children?: unknown;
}
```
