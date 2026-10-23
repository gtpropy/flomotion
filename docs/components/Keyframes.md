# Keyframes

*component, category: motion*

Element form of keyframes: animates `prop` of its parent. Same as writing the prop as a keyframe array.

Children: none.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  |  |
| `prop` | `string` |  | Parent prop name, e.g. position. |
| `values` | `unknown` |  |  |
| `keys` | `string` |  | Sidecar reference, e.g. "./promo.keys.json#t1.position". |
| `mode` | `linear` \| `hold` \| `bezier` \| `auto` \| `continuous` \| `ease` |  |  |
| `spatial` | `linear` \| `bezier` \| `auto` |  |  |
| `orient` | `path` |  |  |
| `separate` | `boolean` | `false` |  |
| `loop` | `unknown` |  |  |

```ts
export interface KeyframesProps {
  id?: string;
  /** Parent prop name, e.g. position. */
  prop?: string;
  values?: unknown;
  /** Sidecar reference, e.g. "./promo.keys.json#t1.position". */
  keys?: string;
  mode?: "linear" | "hold" | "bezier" | "auto" | "continuous" | "ease";
  spatial?: "linear" | "bezier" | "auto";
  orient?: "path";
  /** default false */
  separate?: boolean;
  loop?: unknown;
  children?: unknown;
}
```
