# Exit

*effect, category: motion*

Exit motion for the parent layer. Same fields as the layer's `exit` prop.

Children: none.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent layer.; unit s |
| `duration` | `Time` | `0.6` | unit s |
| `enabled` | `boolean` | `true` |  |
| `from` | `n` \| `ne` \| `e` \| `se` \| `s` \| `sw` \| `w` \| `nw` \| `center` \| `z+` \| `z-` | `"s"` | Direction the layer comes from (enter). |
| `to` | `n` \| `ne` \| `e` \| `se` \| `s` \| `sw` \| `w` \| `nw` \| `center` \| `z+` \| `z-` | `"s"` | Direction the layer leaves toward (exit). |
| `distance` | `Length` | `120` | Travel distance in px (or vw/vh/%). |
| `ease` | `Ease` | `"expo.out"` |  |
| `delay` | `Time` | `0` | unit s |
| `fade` | `boolean` | `true` |  |
| `blur` | `number` | `0` | range 0..200; unit px |
| `scale` | `number` | `1` | Scale at the start of an enter / end of an exit.; range 0..10 |
| `rotate` | `Angle` | `0` |  |

```ts
export interface ExitProps {
  id?: string;
  /** Start relative to the parent layer.; unit s */
  start?: Time;
  /** unit s; default 0.6 */
  duration?: Time;
  /** default true */
  enabled?: boolean;
  /** Direction the layer comes from (enter).; default "s" */
  from?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-";
  /** Direction the layer leaves toward (exit).; default "s" */
  to?: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center" | "z+" | "z-";
  /** Travel distance in px (or vw/vh/%).; default 120 */
  distance?: Length;
  /** default "expo.out" */
  ease?: Ease;
  /** unit s; default 0 */
  delay?: Time;
  /** default true */
  fade?: boolean;
  /** range 0..200; unit px; default 0 */
  blur?: number;
  /** Scale at the start of an enter / end of an exit.; range 0..10; default 1 */
  scale?: number;
  /** default 0 */
  rotate?: Angle;
  children?: unknown;
}
```
