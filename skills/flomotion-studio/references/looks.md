# Looks

A **look** is a data file that fixes every visual decision so scenes cannot drift. Files live in `looks/<name>.md`. Never use colors, fonts or easings that are not in the active look.

## Token spec

Each look file (`looks/<name>.md`) is a set of tables with these sections. Example values are from `clean-light`:

| Section | What it fixes | Example |
|---|---|---|
| Palette | `bg`, `surface`, `text`, `textMuted`, `accent`, `signal`, `positive`, `negative`, `blocks` (flat scene colours) | bg #F6F7FB, accent #4B5CFF |
| Type | `display`, `body`, `mono` (family, weights, tracking, line height), scale (hero, title, body, caption), case | Inter Tight 700-800, tracking -0.02 |
| Motion | easing (enter, exit, move, spring), speed, stagger, blur on motion, signature transition | enter expo.out, card-slide |
| Surface | radius, shadow, glass | radius 28, soft shadow |
| Texture | grain, gradient | grain 0.04 |
| Sound | palette, music mood, impact style | soft-click, air-whoosh |
| Do / Don't | the look's rules in plain words | one accent per scene |

Rules:
- Font families must be from the font ledger (Google Fonts/Fontsource or user-supplied). Check glyph coverage for every character used.
- `blocks` colors are used for flat scene backgrounds in S2/S7; each scene uses exactly one.
- Dark looks must pass contrast on `text` vs `bg` at 4.5:1 minimum.

## Starter looks (original palettes; replace after direction notes)

| Look | Mood | Use with styles | Signature |
|---|---|---|---|
| `clean-light` | calm, credible | S1 (after turn), S4, S5 | pale bg, white cards, one blue accent, soft shadows, card-slide |
| `dark-product` | focused, premium | S1 (before turn), S3 (AI half), S7 (black beats) | near-black bg, violet accent, mint signal, glow edges |
| `bold-kinetic` | energetic, confident | S2, S6, S7 | flat saturated blocks, heavy display type, hard cuts, burst |

## Creating a new look

Do **not** do this unless the person provides direction notes. Ask for:
1. Three adjectives for the feel.
2. Colors or fonts they like and dislike (links or screenshots).
3. Brand colors and fonts if any (they override).
4. Light or dark, calm or loud.
5. One reference video they like (for pattern analysis, not copying).

Then: propose palette (with contrast checks), font pairing (from ledger), easing set, signature transition, sound palette. Render 3 style frames (G3). Save as `looks/<name>.md`. Log in `CHANGELOG.md`.

## Brand override

If the person has brand colors/fonts: map them to `accent`, `bg`, `text`, `display` and rebuild the rest of the tokens around them so contrast and scale rules still pass. Note any brand color that fails contrast and propose the nearest passing shade.
