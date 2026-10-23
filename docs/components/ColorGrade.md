# ColorGrade

*effect, category: color*

Primary colour correction through SVG filters: basic controls plus lift/gamma/gain/offset wheels. Order: tone, white balance and saturation, then wheels. Apply to a layer or, as a child of Composition, to everything.

Children: none.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` |  |  |
| `start` | `Time` |  | Start relative to the parent layer.; unit s |
| `duration` | `Time` |  | unit s |
| `enabled` | `boolean` | `true` |  |
| `scope` | `layer` \| `composition` | `"layer"` | Informational: a ColorGrade child of Composition grades the whole frame. |
| `exposure` | `number` | `0` | animatable; range -5..5; step 0.01; unit EV |
| `contrast` | `number` | `0` | animatable; range -1..1; step 0.01 |
| `saturation` | `number` | `0` | animatable; range -1..1; step 0.01 |
| `vibrance` | `number` | `0` | animatable; range -1..1; step 0.01 |
| `temperature` | `number` | `0` | animatable; range -100..100; step 1 |
| `tint` | `number` | `0` | animatable; range -100..100; step 1 |
| `highlights` | `number` | `0` | animatable; range -100..100; step 1 |
| `shadows` | `number` | `0` | animatable; range -100..100; step 1 |
| `whites` | `number` | `0` | animatable; range -100..100; step 1 |
| `blacks` | `number` | `0` | animatable; range -100..100; step 1 |
| `lift` | `Vec3` | `[0,0,0]` | animatable; ui wheel |
| `gamma` | `Vec3` | `[1,1,1]` | animatable; ui wheel |
| `gain` | `Vec3` | `[1,1,1]` | animatable; ui wheel |
| `offset` | `Vec3` | `[0,0,0]` | animatable; ui wheel |
| `lut` | `string` |  | Later: .cube LUTs need a WebGL pass. Typed stub; ignored with a warning. |

```ts
export interface ColorGradeProps {
  id?: string;
  /** Start relative to the parent layer.; unit s */
  start?: Time;
  /** unit s */
  duration?: Time;
  /** default true */
  enabled?: boolean;
  /** Informational: a ColorGrade child of Composition grades the whole frame.; default "layer" */
  scope?: "layer" | "composition";
  /** range -5..5; unit EV; default 0 */
  exposure?: Animatable<number>;
  /** range -1..1; default 0 */
  contrast?: Animatable<number>;
  /** range -1..1; default 0 */
  saturation?: Animatable<number>;
  /** range -1..1; default 0 */
  vibrance?: Animatable<number>;
  /** range -100..100; default 0 */
  temperature?: Animatable<number>;
  /** range -100..100; default 0 */
  tint?: Animatable<number>;
  /** range -100..100; default 0 */
  highlights?: Animatable<number>;
  /** range -100..100; default 0 */
  shadows?: Animatable<number>;
  /** range -100..100; default 0 */
  whites?: Animatable<number>;
  /** range -100..100; default 0 */
  blacks?: Animatable<number>;
  /** default [0,0,0] */
  lift?: Animatable<Vec3>;
  /** default [1,1,1] */
  gamma?: Animatable<Vec3>;
  /** default [1,1,1] */
  gain?: Animatable<Vec3>;
  /** default [0,0,0] */
  offset?: Animatable<Vec3>;
  /** Later: .cube LUTs need a WebGL pass. Typed stub; ignored with a warning. */
  lut?: string;
  children?: unknown;
}
```
