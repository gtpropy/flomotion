# Scene blocks

A block is a parameterized scene with look-driven defaults. Fill parameters; do not hand-write scene code unless no block fits. Durations are ranges (tune in `config/thresholds.json` and from ratings). Every block lists: purpose, params, default timing, motion, sound tags, failure modes (feed `checks.md`).

**Recipes:** `block-recipes.md` has real TSX for the 13 core blocks (A), built from the engine's components and tested. The pattern blocks (B) are descriptions: build them as custom scenes from the same components and record why (block rule 5).

Param notation: `text:string(<=6 words)`, `hero?` optional, `*` required.

## A. Core blocks (13)

### 1 Hook
- **Purpose**: stop the scroll. Kinetic headline or bold claim; motion from frame 0.
- **Params**: `text*:string(<=6w)`, `emphasis?:word`, `direction?:8-way`, `bg?:token`, `hit?:sound-tag`.
- **Timing**: 1.5-3.0 s. **Motion**: words enter staggered, one emphasis word in contrast color.
- **Sound**: `whoosh-short` + `thud-light` on the emphasis word peak.
- **Fails**: static first frame; text > 6 words; emphasis not readable.

### 2 Problem
- **Purpose**: 2-4 pain statements in rhythm, or a pain image.
- **Params**: `lines*:string[2..4](<=5w each)`, `style:'list'|'image'|'tangle'`, `image?:asset`.
- **Timing**: 2.5-6 s. **Motion**: lines appear on beat, previous lines dim to 40%.
- **Sound**: tension texture `low-drone`; tick per line.
- **Fails**: every line same animation (vary entry), more than 4 lines.

### 3 ProductReveal
- **Purpose**: device or object appears and UI settles.
- **Params**: `device:'laptop'|'phone'|'none'`, `ui*:asset|skeleton`, `tilt?:deg`, `caption?:string(<=6w)`.
- **Timing**: 2.5-4 s. **Motion**: slide + settle with overshoot <= 8%; perspective tilt.
- **Sound**: `air-whoosh` + soft `click` on settle.
- **Fails**: tiny UI text; UI cropped by safe area.

### 4 UIZoom
- **Purpose**: camera moves to a specific UI region while a caption names it.
- **Params**: `ui*:asset`, `region*:{x,y,w,h}`, `caption*:string(<=6w)`, `blurOthers?:boolean`.
- **Timing**: 2-4 s. **Motion**: ease-in-out zoom, highlight ring on target.
- **Fails**: region text below min size after zoom; zoom overshoot.

### 5 FeatureCallout
- **Purpose**: one feature with card/label, animated cursor, highlight.
- **Params**: `title*:string(<=4w)`, `detail?:string(<=8w)`, `target?:region`, `cursor?:boolean`, `ripple?:boolean`.
- **Timing**: 2-3.5 s. **Motion**: cursor travels with ease, click ripple, card slides in.
- **Sound**: `click` on the ripple peak.
- **Fails**: more than one feature per callout.

### 6 StatCounter
- **Purpose**: one big number counting up with a short label.
- **Params**: `value*:number`, `format?:'int'|'pct'|'currency'`, `label*:string(<=5w)`, `source*:string` (required when value is a claim).
- **Timing**: 1.5-3 s. **Motion**: count with ease-out, settle with a soft thud.
- **Fails**: value without source; label wraps to 3 lines.

### 7 ChartReveal
- **Purpose**: bar/line/donut building in with emphasis on one value.
- **Params**: `type*`, `data*`, `highlight*:index`, `title*:string(<=5w)`.
- **Timing**: 2.5-4 s. **Motion**: bars grow staggered, highlight pulses once.
- **Fails**: more than 6 bars; unlabeled axes; fake data (must come from the person).

### 8 Quote
- **Purpose**: customer or team quote.
- **Params**: `quote*:string(<=14w)`, `name*`, `role*`, `company*`, `avatar?:generated-shape`, `permission*:boolean`.
- **Timing**: 3-4.5 s. **Motion**: key words in contrast color; attribution lockup slides in small.
- **Fails**: no permission flag; avatar of a real person without license.

### 9 LogoStrip
- **Purpose**: social proof row.
- **Params**: `logos*:asset[3..6]` (licensed or the person's own), `caption?:string(<=5w)`.
- **Timing**: 2-3 s. **Fails**: unlicensed third-party logos; uneven optical sizes.

### 10 BeforeAfter
- **Purpose**: split or swap comparison.
- **Params**: `before*`, `after*`, `mode:'split'|'swap'|'wipe'`, `labels?`.
- **Timing**: 3-4 s. **Motion**: old way muted and small, new way saturated and large.

### 11 Offer
- **Purpose**: pricing/plan cards with one emphasized.
- **Params**: `plans*:{name,price,bullets<=3}[2..3]`, `highlight*:index`.
- **Timing**: 3-4 s. **Fails**: prices not supplied by the person.

### 12 CtaCard
- **Purpose**: close. Brand, one line, URL or button.
- **Params**: `logo*:asset`, `line*:string(<=6w)`, `url|button*`.
- **Timing**: 2-3.5 s. **Motion**: logo assembly or morph, then URL fade-up and hold 1 s.
- **Fails**: URL too small; hold shorter than 1 s.

### 13 Bridge
- **Purpose**: carries the hero element between blocks.
- **Params**: `hero*:elementId`, `from*`, `to*`, `kind:'morph'|'wipe'|'line'|'zoom'`.
- **Timing**: 0.3-0.7 s. **Fails**: hero changes shape arbitrarily; transition > 0.7 s.

## B. Pattern blocks (13, from the catalogue)

| Block | Pattern | Params (key) | Timing |
|---|---|---|---|
| `TypedQuery` | curiosity hook, typed search or prompt | `text*(<=10w)`, `caret:true`, `bg` | 2-3 s |
| `QuoteCard` | color-block quote with white key words | `quote`, `keyWords[]`, `attribution` | 3-4 s |
| `LogoSwap` | logo replaces a word inside a sentence | `before`, `logo`, `after`, `footage?` | 1.2-2 s each |
| `SpotlightWord` | magnifier/selection box reveals a word | `phrase`, `target`, `gesture:'magnifier'|'select'` | 2-3 s |
| `CardGrid` / `CardCollage` | modular product cards, tilt or flat | `cards[4..9]`, `tilt`, `blur` | 2-4 s |
| `OrbitCards` | cards orbit a central line of text | `cards[6..10]`, `text` | 2.5-3.5 s |
| `MotifLine` | continuous line character | `path seed`, `headStyle`, `streaks` | spans scenes |
| `StrikeText` | word destroyed by scanline glitch | `word`, `style:'scan'|'slash'` | 1-1.5 s |
| `TextSwap` | second line swapped for variants | `lead`, `variants[2..3]` | 2-3 s total |
| `KaraokeLine` | sentence with current word bright | `sentence`, `wordTimes?` | 3-4 s |
| `ShapePivot` / `ShapeMorph` | circles close in; blob morphs to logo | `shapes`, `to:'wordmark'` | 1.5-2.5 s |
| `GlassUI` | frosted UI over footage | `ui`, `footage`, `blur` | 3-5 s |
| `WipeMatchCut` | split-wipe on shared geometry | `left`, `right`, `anchor:'center'` | 0.6-1 s |

Also: `OldWay` (muted small windows), `ClaimWith3D`, `GestureCallout` (bubble + ripple), `Burst` (radial dashes), `WordBeat` (single big word), `UrlCard`, `OverwhelmDiagram`, `PainFlavor`, `QuestionBubbles`, `VersionBadge`, `CellFill`, `ChatDemo`, `FootageToUI`, `CursorTag`, `ProofMosaic`, `ProofCredential`.

## Block rules
1. One idea per block. If a block needs two ideas, split it.
2. Default durations are ranges; shorten to the voice, not the other way round.
3. Every block declares `hero?` so `hero-continuity` can track it.
4. Every block exposes `soundHints` (tags and peak frame) so impacts land on frames.
5. If a block is missing, create a **custom scene** and record: reason, parameters, and a proposal for a new block in `CHANGELOG.md`.
