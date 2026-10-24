# Story templates

Durations are proposals. Totals must land within tolerance of the target (`config/thresholds.md`).

## 15 s (4-5 beats): hook-led
| # | Role | Block | Seconds | Voice/text role |
|---|---|---|---|---|
| 1 | Hook | `Hook` or `TypedQuery` | 2-3 | Claim or question |
| 2 | Reveal | `ProductReveal` | 3-4 | Name + one line |
| 3 | Feature | `UIZoom`/`FeatureCallout` | 4-5 | One feature, shown |
| 4 | CTA | `CtaCard` | 3 | Brand + URL |

## 30 s (7-9 beats): standard
| # | Role | Block | Seconds |
|---|---|---|---|
| 1 | Hook | `Hook`/`TypedQuery` | 2-3 |
| 2 | Pain | `Problem` or `OldWay` | 4-6 |
| 3 | Turn | `Bridge`/`WipeMatchCut`/`ShapeMorph` | 0.5-1 |
| 4 | Promise | `Hook`-style statement | 2-3 |
| 5 | Product | `ProductReveal` | 3-4 |
| 6 | Features (2-3) | `UIZoom`/`FeatureCallout` | 8-10 |
| 7 | Proof | `StatCounter`/`Quote`/`LogoStrip` | 3-4 |
| 8 | CTA | `CtaCard` | 2.5-3.5 |

## 45 s (10-13 beats): long
30 s template plus: a comparison or demo beat (`BeforeAfter`/`ChatDemo`, 5-6 s) and a second proof beat (`Quote`/`ProofMosaic`, 3-4 s). Keep total pain share <= 25% unless style S3.

## Variants by style family
- **S1 Metaphor Contrast (30 s)**: Hook=`MetaphorImage` 3 -> Turn=`WipeMatchCut` 1 -> Promise 2.5 -> Reveal3D 3 -> DeviceMock 5 -> Feature 4 -> ProofCredential 3 -> `LogoCard` 3 = ~24.5 + slack for holds.
- **S2 Color Blocks (30 s)**: `TypedQuery` 3 -> `QuoteCard` x3 (3 each) -> `LogoSwap` roll call 4 -> `CardCollage` 3 -> `ShapeLogo` 3.
- **S3 Pain-to-Calm (45 s)**: `OverwhelmDiagram` 3 -> `MotifLine` 1.5 -> `PainFlavor` x3 (4 each = 12) -> thesis `TextSwap` 4 -> resolution 3 -> palette flip + `CardGrid` 6 -> `OrbitCards` 4 -> brand 3 = ~37; extend demo to 45.
- **S4 Trend-to-Product (30 s)**: `KaraokeLine` 3.5 -> `FramedFootage` 3 -> `ShapePivot` 2 -> `ShapeMorph` 2 -> `CategoryLine` 2.5 -> `GlassUI` 6 -> `ProofMosaic` 3.5 -> `CtaCard` 3.
- **S5 Real-UI Demo (30 s)**: opening claim 3 -> `BrandPill` 1.5 -> `UIZoom` x2 (4 each) -> `ChatDemo` 5 -> `StatCounter` 2.5 -> `CtaCard` 3.
- **S6 Human Story (30 s)**: `HumanMoment` 3 -> context 2 -> `CursorTag` 2 -> `PromptUI` 5 -> `ResultReveal` 4 -> `LogoPill` 3.
- **S7 3D Object (30 s)**: `OldWay` 3 -> `ClaimWith3D` 3 -> `GestureCallout` 3 -> `Object3D` 4 -> `WordBeat` x3 (2 each) -> `Burst` 1 -> `UrlCard` 3.

## Rhythm rules
- Something new every 2 s (element, color, camera, or text).
- Scene length varies: never three scenes in a row with the same duration (+/-10%).
- Put the longest scene on the product beat; shortest on the hook and the turn.
- Leave 0.3-0.5 s of settled hold on key text so it can be read.
- Cut on the voice's breath or on beats, not mid-word.

## Format adaptations
| Format | Layout notes |
|---|---|
| 9:16 | Safe areas large (top 250, bottom 380); stack text vertically; max 3 lines per headline; product devices portrait |
| 16:9 | Horizontal flow, left-aligned text works; two-column product layouts allowed |
| 1:1 | Center stack; fewer simultaneous elements |
| 4:5 | Like 9:16 with smaller bottom safe area |

Blocks reflow by reading the format preset; never hard-code pixel positions.
