# Looks

A **look** is a data file that fixes every visual decision so scenes cannot drift. Files live in `looks/<name>.json`. Never use colors, fonts or easings that are not in the active look.

## Token spec

```jsonc
{
  "name": "clean-light",
  "mood": ["calm", "credible"],
  "palette": {
    "bg": "#F6F7FB", "surface": "#FFFFFF", "text": "#0F1222",
    "textMuted": "#5B6075", "accent": "#4B5CFF", "signal": "#FF7A45",
    "positive": "#2FBF71", "negative": "#E5484D",
    "blocks": ["#4B5CFF", "#FF7A45", "#2FBF71", "#FFC933"]   // flat scene colors
  },
  "type": {
    "display": { "family": "Inter Tight", "weights": [700, 800], "tracking": -0.02, "lineHeight": 1.02 },
    "body":    { "family": "Inter", "weights": [400, 500, 600], "tracking": 0, "lineHeight": 1.3 },
    "mono":    { "family": "JetBrains Mono", "weights": [500] },
    "scale":   { "hero": 1.0, "title": 0.62, "body": 0.36, "caption": 0.3 },
    "case": "sentence"
  },
  "motion": {
    "easing": { "enter": "expo.out", "exit": "power3.in", "move": "power3.inOut", "spring": { "stiffness": 220, "damping": 24 } },
    "speed": "medium",              // slow | medium | fast
    "staggerMs": 70,
    "blurOnMotion": true,
    "signatureTransition": "card-slide"
  },
  "surface": { "radius": 28, "shadow": "soft", "glass": { "blur": 24, "opacity": 0.6 } },
  "texture": { "grain": 0.04, "gradient": ["#E9ECFF", "#FFFFFF"] },
  "sound": { "palette": ["soft-click", "air-whoosh", "gentle-pad"], "musicMood": "warm-minimal", "impactStyle": "light" },
  "do": ["Use one accent per scene", "Keep margins >= 6% of width"],
  "dont": ["No drop shadows on text", "No more than 2 type families"]
}
```

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

Then: propose palette (with contrast checks), font pairing (from ledger), easing set, signature transition, sound palette. Render 3 style frames (G3). Save as `looks/<name>.json`. Log in `CHANGELOG.md`.

## Brand override

If the person has brand colors/fonts: map them to `accent`, `bg`, `text`, `display` and rebuild the rest of the tokens around them so contrast and scale rules still pass. Note any brand color that fails contrast and propose the nearest passing shade.
