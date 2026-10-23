# Style families (7)

Pick one per video. Each recipe is a constraint: structure, design, motion, sound, blocks, risks.

## S1 Metaphor Contrast
**Use when**: the product reduces risk, chaos or anxiety (security, compliance, finance, reliability) and the audience is serious.
**Structure**: pain image (2-3 s) -> match-cut turn (1 s) -> plain promise (2 s) -> reveal (2-3 s) -> product skeleton UI (4-6 s, desktop then phone) -> proof (2 s) -> logo (2 s).
**Design**: two worlds (dark gritty -> white clean); one accent (lime-like signal color) used only after the turn; big left-aligned grotesque; 3D render for the metaphor object.
**Motion**: slow push-in on pain, hard split-wipe on a shared geometry, soft settle on the reveal; perspective tilt for devices.
**Sound**: low drone and tick (pain), single impact on the turn, clean airy bed after.
**Blocks**: `MetaphorImage`, `WipeMatchCut`, `Promise`, `Reveal3D`, `DeviceMock`, `ProofCredential`, `LogoCard`.
**Risks**: needs a metaphor object that has matching geometry on both sides; if none, pick S3.

## S2 Typographic Color Blocks
**Use when**: you have customer quotes or short claims; the tone is confident and human; little product footage.
**Structure**: curiosity hook (typed query) -> 3 to 5 quote or claim cards (2 s each) -> customer roll call -> UI collage (2 s) -> logo built from shapes.
**Design**: one flat color per scene from the look palette; giant geometric sans, letters cropped at edges for scale; key word in the contrast color; attribution lockup.
**Motion**: type-as-UI gestures (cursor selection box, magnifier sweep), fast cuts on beat, hard stops.
**Sound**: pop/click on word reveals, soft whoosh on cuts, light upbeat bed.
**Blocks**: `TypedQuery`, `QuoteCard`, `LogoSwap`, `SpotlightWord`, `CardCollage`, `ShapeLogo`.
**Risks**: quotes must be real and approved; never invent customer names.

## S3 Pain-to-Calm Line Story
**Use when**: the product consolidates tools or simplifies a mess (workspaces, integrations, ops, analytics).
**Structure**: overwhelm diagram (2 s) -> motif intro (1 s) -> three pain flavors (3 s each) -> calm thesis (3 s) -> resolution line (2 s) -> palette flip + product card wall (6-8 s) -> brand (2 s).
**Design**: monochrome thin pain half; saturated grained gradient solution half; one motif (line or thread) present in every scene; grey->black text for emphasis.
**Motion**: motif sweeps with speed streaks; wedge wipe at the turn; cards fly with motion blur; template reuse "A New Era of ___".
**Sound**: rising friction texture during pain; silence before the turn; bright resolve and short impacts for cards.
**Blocks**: `OverwhelmDiagram`, `MotifLine`, `PainFlavor`, `QuestionBubbles`, `TextSwap`, `StrikeText`, `CardGrid`, `OrbitCards`, `VersionBadge`.
**Risks**: long. Only use at 45 s or when pain is truly central. Motif must be deterministic (spline with fixed seed).

## S4 Trend-to-Product Explainer
**Use when**: a market shift explains why the product exists; calm, credible B2B; an audience that already knows the trend.
**Structure**: agreeable fact (word-highlighted sentence, 3 s) -> implication around a framed image (3 s) -> "we built" pivot with shapes (2 s) -> name via morph (2 s) -> plain category line (2 s) -> glass UI over context footage (5 s) -> scale proof mosaic (3 s).
**Design**: one saturated brand color + pale tint; light-weight type, generous space; footage in clean framed rectangles.
**Motion**: karaoke word highlight, shapes close in and out as punctuation, blob pinch to wordmark.
**Sound**: warm pad, soft taps on word highlights, one low swell at "we built".
**Blocks**: `KaraokeLine`, `FramedFootage`, `ShapePivot`, `ShapeMorph`, `CategoryLine`, `GlassUI`, `ProofMosaic`.
**Risks**: needs real or licensed footage; a believable trend line you can source.

## S5 Real-UI Demo
**Use when**: the UI itself is the product's strength and you have good screenshots or a screen recording.
**Structure**: human voice or bold claim (3 s) -> brand pill (1.5 s) -> UI crop 1 (4 s) -> UI crop 2 or dashboard (4 s) -> AI/automation chat request and result (5 s) -> outcome number (2 s) -> CTA (2 s).
**Design**: close crops with soft shadows, pastel gradient background, glass pill for brand, saturated status cells as the visual signature.
**Motion**: empty cells fill via circle-to-cell morph; staggered row reveal with blur-in; zoom to the element that matters; cursor with click ripple.
**Sound**: soft clicks, UI ticks, a gentle resolve chord on completion.
**Blocks**: `Spokesperson` (optional), `BrandPill`, `UIZoom`, `CellFill`, `ChatDemo`, `StatCounter`, `CtaCard`.
**Risks**: UI must be legible at target size; blur out private data.

## S6 Human Story to Prompt
**Use when**: the product is a creation tool for non-experts; tone playful; relatable moment exists.
**Structure**: funny human moment (3 s) -> wide context (2 s) -> collaboration cue with cursor tag (2 s) -> product as a simple prompt using the same footage (5 s) -> result (3 s) -> logo + product pill (2 s).
**Design**: warm real colors in footage; product UI in clean white with one purple-like accent; script or friendly logotype overlay.
**Motion**: match the footage rhythm; typing animation in the prompt box; footage thumbnails fly into the UI.
**Sound**: kitchen/room ambience, playful marimba, soft UI pops.
**Blocks**: `HumanMoment`, `CursorTag`, `PromptUI`, `FootageToUI`, `ResultReveal`, `LogoPill`.
**Risks**: needs footage with people (license or the person's own). If none, use S2 or S7.

## S7 3D Object Explainer
**Use when**: the product is abstract or technical and can be made into a friendly object (wallet, vault, hub, pipe).
**Structure**: old way, small and grey windows (3 s) -> color flip, one big friendly claim with 3D prop (2 s) -> gesture demo (3 s) -> object metaphor with items sliding in (3 s) -> short word beats ("one X", "drag", "a X you'll love") (6 s) -> URL on black (2 s).
**Design**: saturated brand color alternating with black; big lowercase geometric sans; glossy 3D props; burst graphic.
**Motion**: object tumbles in with settle; props orbit; burst of dashes on impact; touch ripple on gestures.
**Sound**: pops and coin-like clinks, bass thud on the burst, bright pluck bed.
**Blocks**: `OldWay`, `ClaimWith3D`, `GestureCallout`, `Object3D`, `WordBeat`, `Burst`, `UrlCard`.
**Risks**: 3D must stay deterministic; keep object count low.

## Combination rules
- Never mix more than two families. If mixing, name a primary (structure) and a secondary (visual flavor).
- Allowed pairs: S4+S5, S2+S5, S1+S5, S3+S7.
