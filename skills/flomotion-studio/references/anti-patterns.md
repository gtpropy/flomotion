# Anti-patterns (scan before every draft)

Each entry: **Bad** -> **Fix** -> check that catches it.

1. **Static centered title on a flat background for 3+ s.** Fix: staggered word entrance, one secondary element, or camera push. `no-dead-frames`.
2. **Default easing / linear moves.** Fix: look easing tokens (`expo.out` enter). `look-consistency`.
3. **Everything enters at once.** Fix: stagger 40-120 ms, hero first. Manual.
4. **More than 2 type families.** Fix: display + body only. `type-families`.
5. **Walls of text (> 12 words in a scene).** Fix: split into beats or keep keywords. `text-words`.
6. **Text over busy footage with no scrim.** Fix: glass panel, dark gradient scrim, or text on a flat block. `contrast`.
7. **Text in the bottom 380 px of 9:16.** Fix: move above the safe line. `safe-area`.
8. **Hero element changes style between beats.** Fix: lock hero shape/color, use `Bridge`. `hero-continuity`.
9. **Pain without a turn.** Fix: add a visible look change + calm line. `turn-present`.
10. **Product shown only as a flat screenshot.** Fix: tilt, zoom to one region, skeleton UI, card wall. Manual.
11. **Tiny UI text in screenshots.** Fix: zoom to the region or redraw skeleton UI. `min-size`.
12. **Same transition between every scene.** Fix: rotate 2-3 per look; cuts on beat. `transition-count`.
13. **Invented stats, quotes, customers.** Fix: remove or mark placeholder. `proof-sourced`.
14. **Third-party logos or music you do not own.** Fix: ledger-listed assets only. `assets-licensed`.
15. **Sounds not on frames** (impact with no sound, or sound before motion). Fix: align to `peak`. `sound-on-impact`.
16. **Music masks voice.** Fix: duck >= 12 dB. `mix-voice-on-top`.
17. **CTA with tiny URL or < 1 s hold.** Fix: URL >= caption min, hold >= 1 s. `cta-present`.
18. **More than 3 features in 30 s.** Fix: pick the top 2-3; cut the rest.
19. **Gradients behind body text.** Fix: solid surface or scrim. `contrast`.
20. **Over-shaking and over-blurring.** Fix: max 1 impact per 1.5 s; blur only during motion.
21. **Same hook type for every video.** Fix: choose from the 6 hook types by audience state.
22. **Mixing more than 2 style families.** Fix: primary + secondary only.
23. **Reusing a pattern without a reason.** Every effect must be explainable in one line ("shake marks the price drop").
24. **Dead start** (first frame is empty or logo splash). Fix: motion in the first 0.3 s, brand later. `motion-frame0`.
25. **Centered everything on 16:9.** Fix: left-align for serious looks; use grid.

## Self-test questions
- If I paused any frame, is there one clear focal point?
- Could a viewer with the sound off follow the story?
- Is anything on screen that does not support the beat's single idea?
- Did I show the pain instead of describing it?
- Is the first product frame after the turn?
