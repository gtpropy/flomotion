# Typography

You cannot judge taste from an image, but you can check legibility and mechanical problems. Propose, show the frame, and let the user choose.

## The rules

1. **One display face and one body face.** Get contrast from weight and width, not from a third family. The linter warns above 3 families (display, body, mono at most).
2. **Hierarchy by size, weight and colour, in that order.** Three levels per screen: headline, support line, small print. If everything is bold, nothing is.
3. **Sizes for a 1080 px wide frame** (scale for other widths): headline 96 to 140 px, support 44 to 56 px, small print 34 px minimum (the linter rejects text under about 28 px), captions 60 to 72 px. Landscape 1920 px wide: scale by 1.3 to 1.5.
4. **Tabular figures for anything that counts.** `<Counter>` does this for you. For other numbers set `features={["tnum"]}` so the width does not jitter. Use lining figures (`"lnum"`) next to caps.
5. **Track all-caps.** Add 40 to 100 (thousandths of an em) to `tracking` for `case="upper"`. Tighten large display text by -15 to -30.
6. **Line length.** Headlines at most 3 lines, 4 to 7 words total. Body at most 40 characters per line on mobile. Break by meaning (`maxWidth` as a percentage, not hard breaks).
7. **Safe areas.** Keep text inside `<SafeArea preset="reels">` (also `shorts`, `tiktok`, `feed`). The platform UI covers the top, the bottom and the right edge. Review check 8 fails otherwise.
8. **Leading.** 1.0 to 1.1 for display, 1.25 to 1.4 for body. Do not use the default 1.15 for big headlines.
9. **Contrast.** At least 3:1 for large text, 4.5:1 for small. Put text on a card or scrim, not on a busy picture.
10. **Check the glyphs.** `font_check` before you write text in another script (Devanagari, Arabic, Thai, CJK). The lint rule `missing-glyph` rejects characters the face cannot draw and lists them. Add a face that covers that script instead of letting it fall back.

## Captions

- At most 22 to 28 characters per line on 9:16, 2 lines maximum, 1 to 4 words per page (`maxChars`, `maxWords`).
- Reading speed at most 21 characters per second (review check 15). Fast speech: fewer words per page, not smaller text.
- Weight 700 to 900, 64 px or more, a dark outline or card behind it, active word in the Look's accent colour (`captionStyle="karaoke"`), or scaled (`"pop"`). Use `"word"` for hype, `"line"` for calm explainers.
- Lower third, inside the safe area, never over the face or the product.
- Export with the project: `.srt`/`.vtt` come from the same word timings.

## The Looks

Use the Look's type tokens through `font="$type.display"` and `$brand.*` colours. Do not hard-code families.

| Look | Display | Body | Mono | Scale (display / body / numerals) | Feel |
| --- | --- | --- | --- | --- | --- |
| kinetic | Space Grotesk 700 (variable wght 300 to 700), tracking -25 | Inter 400/600 | JetBrains Mono 500 | 104 / 44 / 160 px | Loud, fast, hard contrast |
| minimal | DM Sans 600 (variable), tracking -20 | DM Sans 400/500 | IBM Plex Mono 400 | 88 / 40 / 150 px | Calm, precise, lots of air |
| sketch | Permanent Marker 400 | Patrick Hand 400 | Space Mono 400 | 96 / 48 / 150 px | Hand-drawn, playful |

Pairing logic: a characterful display face with a neutral body face. Do not pair two characterful faces. Variable fonts let you animate weight (`axes={{ wght: [[0, 300], [0.6, 700, "expo.out"]] }}`) for emphasis instead of switching families.

## Using `font_preview`

1. `font_get` the face so it is on disk and locked.
2. `font_preview` with `fontId`, a line of the **real** text from the script, and a size near the real one (for example 96).
3. Open the PNG. Check: are the letters distinct (I, l, 1; O, 0), do the numerals look right, does the weight read at phone size, do accents and special characters render?
4. Show the user the preview and the alternatives; say what you checked and what you cannot judge (personality, brand fit). Ask them to choose.

## Mechanics worth knowing

- Fonts are declared in `<Fonts>`; `font_get` adds the declaration and downloads the files once. Renders never use the network, and a changed or missing font file fails the render naming the font id.
- Google Fonts are licensed individually (mostly OFL). The ledger records each; `font_list` shows them.
- Variable axes (`wght`, `wdth`, `slnt`, `opsz`) are animatable props on text. Keep weight changes smooth and small (a 200 to 300 swing), they are for emphasis.
- Numerals in big counters: use the Look's `$type.numerals` token.
