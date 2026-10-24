# Fonts

*component, category: typography*

Container declaring every font the project uses. Renders never touch the network.

Children: Font.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  | Stable unique id. Written back as fm_… when missing. |
| `allowSystem` | `boolean` | `false` | Permit system fonts (output differs per machine). |

```ts
export interface FontsProps {
  /** Stable unique id. Written back as fm_… when missing. */
  id?: string;
  /** Permit system fonts (output differs per machine).; default false */
  allowSystem?: boolean;
  children?: unknown;
}
```
