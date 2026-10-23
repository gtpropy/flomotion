# Theme

*component, category: brand*

Tokens for palette, type scale, easing set, default transition, grain and sound palette. Reference with theme="$look.<id>" on the Composition.

Children: none.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  |  |
| `palette` | `unknown` |  |  |
| `brand` | `unknown` |  | Alias of palette entries, addressable as $brand.<key>. |
| `type` | `unknown` |  |  |
| `easing` | `unknown` |  |  |
| `transition` | `{ type?: string; duration?: Time }` |  |  |
| `grain` | `number` |  | range 0..1 |
| `sound` | `unknown` |  |  |

```ts
export interface ThemeProps {
  id?: string;
  palette?: unknown;
  /** Alias of palette entries, addressable as $brand.<key>. */
  brand?: unknown;
  type?: unknown;
  easing?: unknown;
  transition?: { type?: string; duration?: Time };
  /** range 0..1 */
  grain?: number;
  sound?: unknown;
  children?: unknown;
}
```
