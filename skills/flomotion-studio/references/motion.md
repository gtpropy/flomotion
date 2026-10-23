# Motion rules

All motion is deterministic: a pure function of time (no `Math.random`, no `Date.now`). Seeded noise only (`ctx.noise(seed, freq)`).

## Principles
1. **Anticipate, move, settle.** Enter fast, decelerate (ease-out), land with a tiny settle. Exit shorter and softer than enter.
2. **Weight.** Large objects move slower with longer settles; small objects snap. Impacts add shake or thud scaled to size.
3. **Overlap.** Stagger children by `staggerMs` (40-120 ms); never animate all at once.
4. **Hierarchy.** The hero moves most; supporting items move less and later.
5. **Restraint.** One primary motion per scene; secondary motion is subtle.
6. **Rhythm.** Tie major moves to beats or voice stresses; vary scene lengths.

## Easing
- Enter: `expo.out` / `power3.out` (default). Exit: `power3.in`. Move A->B: `power3.inOut`. Playful: `back.out(1.2-1.6)` (overshoot <= 8%).
- Never `linear` for position or scale (OK for rotation loops, progress bars, color fades).
- Use the look's easing tokens; do not mix more than 3 easings per video.

## Durations (starting values)
| Motion | Seconds |
|---|---|
| Text word enter | 0.35-0.55 |
| Card enter | 0.45-0.7 |
| Transition | 0.25-0.7 |
| Exit | 0.2-0.4 |
| Camera push (slow) | 2-4 |
| Counter | 1-1.8 |
| Settle hold before next beat | 0.3-0.5 |

## Motion blur
- Apply by velocity with a 180° shutter, sub-frame samples 4-8. Blur while moving, crisp at rest. Skip blur on text at rest and on tiny UI.

## 8-direction entrance
Directions: `n, ne, e, se, s, sw, w, nw`. Distance 8-14% of the frame (text) or full off-screen (cards). Alternate directions across items (e.g. from left, then right) for rhythm; keep one dominant direction per scene.

## Impacts (use sparingly, on beats)
- Shake: `shake = amp * exp(-decay*t) * noise1D(t*freq, seed)`. Typical `amp` 6-18 px, `decay` 8-14, `freq` 14-24.
- Thud (scale kick): `thud = amp * exp(-damping*t) * cos(2*pi*freq*t)`. `amp` 3-8%, `damping` 9-14, `freq` 5-8.
- Place at the sound's `peak` frame. Max one impact per 1.5 s.

## Transitions (when to use)
| Transition | Use for | Notes |
|---|---|---|
| Hard cut on beat | Same-color scene lists | Pair with a click |
| Color-block wipe | S2, S7 | Next scene's bg color wipes in |
| Match-cut wipe (split) | S1 turn | Align shared geometry centers |
| Wedge/spike wipe | S3 turn | Follows the motif head |
| Shape morph | S4, S5 | Blob/circle becomes next element or logo |
| Card slide | Clean looks | Cards slide + settle |
| Glow wipe | Dark looks | Soft light sweep |
| Zoom through | Device to UI | Scale 1 -> 3 with blur then crossfade |

Rules: <= 1 transition type per 3 scenes except hard cuts; duration 0.25-0.7 s; never default crossfade for everything.

## Camera
Slow push-in (3-8% over the scene) on pain/static shots; perspective tilt for devices (8-18°); parallax between 2-3 depth layers (offsets 4-12%). No handheld shake unless the look defines it.

## Hero continuity
Declare `hero` in the storyboard (line, circle, object, logo-color). It appears in every scene or every second scene, keeps its shape logic, and transitions (Bridge) carry it. A hero that changes style mid-video is a defect.

## Text animation menu (rotate, do not repeat in a row)
Per-word slide-up with mask; per-letter stagger (for 1-2 words); scale-in with overshoot; typewriter with caret (for queries); karaoke highlight; strike with scanline; swap (old word slides out, new in); cropped giant type that slides across.

## Do not
- Animate everything at once.
- Use the same entrance for more than 3 consecutive elements.
- Use ease-in for entrances.
- Let motion cover text that must be read (hold at least 0.4 s).
- Add motion that is not motivated (explainable in one line).
