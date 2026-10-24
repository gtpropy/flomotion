# Typography rules

Fonts come from the active look and the font ledger. Load and verify before frame 0; check glyph coverage for every character (including any non-Latin text).

## Scale and sizes
- Use look scale tokens (`hero`, `title`, `body`, `caption`) relative to frame width.
- Minimum sizes per format are in `config/thresholds.md` (`text.min_px`). Below minimum = HARD fail for headlines, WARN for captions.
- Hero text should fill 50-90% of the frame width in S2/S7 and may be cropped at an edge for scale; in S1/S4/S5 keep 35-60% width with generous space.

## Pairing and families
- Max 2 families (display + body); mono only for code/numbers if the look includes it.
- Use weight and size for hierarchy before adding a new family.
- Tracking: tighter for large display (-0.02 to -0.04 em), neutral for body.
- Line height: display 0.95-1.05; body 1.25-1.4.
- Line length: <= 22 characters per line for 9:16 headlines; <= 32 for 16:9.

## Case
- Sentence case for calm looks; lowercase for kinetic/object looks; avoid all-caps except small labels (add tracking +0.06 em).

## Emphasis methods (pick one per beat)
1. Color: contrast token on the key word.
2. Weight/size: key word one weight step heavier.
3. Gesture: selection box, magnifier, strike, underline sweep.
4. Opacity: lead-in at 40-60%, payoff at 100%.
5. Karaoke: current word full, others dim.

## Layout
- Align to a grid; left-align for serious looks, center for kinetic.
- Respect safe areas (`safe_area_px`). Never place essential text under platform UI zones (9:16 bottom).
- No text over busy imagery without a scrim or blur backdrop (contrast must pass 4.5:1; large text 3:1).
- Keep at least 2% of width between text and edges unless intentionally cropped (cropping is a declared effect `cropEdge: true`).

## Lower-thirds and attributions
- Name 0.5x body size, role 0.35x; logo circle 1.2x name height; slide in from the lower right or left and hold for the quote duration.

## Numbers
- Tabular figures for counters; unit in smaller size; thousands separators; currency symbols from the person's data.

## Captions
- Max 2 lines, <= 12 words per caption, >= caption min size, <= 3.5 words/s. Break at phrase boundaries.

## Non-Latin text
- Choose fonts with coverage (e.g. a Devanagari-capable family); lint `font-glyphs` must pass; tracking 0 for Indic scripts; increase line height by 10-20%.

## Do not
- Mix more than 2 families, use faux bold/italic, stretch type, letterspace lowercase body, or place light gray on white for body copy.
