# Font

*component, category: typography*

A font. `source` is "google", "system", a project path (./fonts/X.woff2) or a URL. Path and URL sources need a `license`.

Children: none.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  |  |
| `family` | `string` |  |  |
| `source` | `string` | `"google"` | "google" | "system" | "./fonts/File.woff2" | "https://…" |
| `weights` | `number[]` |  |  |
| `styles` | `"normal" | "italic" | "oblique"[]` |  |  |
| `variable` | `boolean` | `false` |  |
| `axes` | `unknown` |  |  |
| `subsets` | `string[]` |  |  |
| `unicodeRange` | `string` |  |  |
| `fallback` | `string[]` |  |  |
| `license` | `string` |  | SPDX-ish licence id; required for path and URL sources. |

```ts
export interface FontProps {
  id?: string;
  family?: string;
  /** "google" | "system" | "./fonts/File.woff2" | "https://…"; default "google" */
  source?: string;
  weights?: number[];
  styles?: "normal" | "italic" | "oblique"[];
  /** default false */
  variable?: boolean;
  axes?: unknown;
  subsets?: string[];
  unicodeRange?: string;
  fallback?: string[];
  /** SPDX-ish licence id; required for path and URL sources. */
  license?: string;
  children?: unknown;
}
```
