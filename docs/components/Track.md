# Track

*component, category: structure*

A lane of clips. Track order sets stacking (later tracks paint above earlier ones).

Children: any layers and effects.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  | Stable unique id. Written back as fm_… when missing. |
| `label` | `string` |  |  |
| `kind` | `video` \| `audio` \| `overlay` \| `graphics` \| `captions` | `"video"` |  |
| `locked` | `boolean` | `false` |  |
| `muted` | `boolean` | `false` |  |
| `solo` | `boolean` | `false` |  |
| `blend` | `normal` \| `multiply` \| `screen` \| `overlay` \| `soft-light` \| `hard-light` \| `difference` \| `add` | `"normal"` |  |
| `opacity` | `number` | `1` | animatable; range 0..1 |

```ts
export interface TrackProps {
  /** Stable unique id. Written back as fm_… when missing. */
  id?: string;
  label?: string;
  /** default "video" */
  kind?: "video" | "audio" | "overlay" | "graphics" | "captions";
  /** default false */
  locked?: boolean;
  /** default false */
  muted?: boolean;
  /** default false */
  solo?: boolean;
  /** default "normal" */
  blend?: "normal" | "multiply" | "screen" | "overlay" | "soft-light" | "hard-light" | "difference" | "add";
  /** range 0..1; default 1 */
  opacity?: Animatable<number>;
  children?: unknown;
}
```
