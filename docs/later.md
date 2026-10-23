# Later tiers: typed stubs and TODOs

Nothing here is implemented. Each item has a typed field or component so projects can already carry it.

| Item                                        | Where                            | Behaviour now                                    | Issue note                                    |
| ------------------------------------------- | -------------------------------- | ------------------------------------------------ | --------------------------------------------- |
| `Precomp`, `Adjustment`                     | structure                        | Schema only; compile reports `stub-not-rendered` | issue: nested timelines and adjustment layers |
| `shader(name)` transition                   | `Scene.transition.type="shader"` | Falls back to dissolve with a warning            | issue: WebGL shader transitions               |
| `.cube` LUTs                                | `ColorGrade.lut`                 | Ignored with a warning                           | issue: WebGL grading pass + LUT loader        |
| Text `extrude` (3D)                         | text style                       | Ignored with a warning                           | issue: 3D text (phase 4)                      |
| Dashed text stroke, `stroke.align="inside"` | text style                       | Dash ignored; inside = centre                    | issue: SVG text rendering                     |
| Video fill clipped to letters               | text `fill`                      | Falls back to white with a warning               | issue: SVG clipPath + video                   |
| `Video.reverse`                             | media                            | Plays forward with a warning                     | issue: pre-rendered reversed copies           |
| Sidecar `*.keys.json`                       | keyframes `keys=`                | Field accepted, file not read                    | issue: sidecar keyframe files                 |
| Phases 3–5                                  | UI, 3D, pro layer                | Not started                                      | see brief §12                                 |
