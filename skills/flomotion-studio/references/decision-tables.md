# Decision tables

Go top to bottom. First match wins; then check the "avoid" column.

## 1. Style family

| Brief signals | Pick | Avoid |
|---|---|---|
| Security, compliance, risk, trust; serious audience | S1 Metaphor Contrast | Playful looks |
| Many customer quotes or strong claims; little UI footage | S2 Typographic Color Blocks | If no quote permissions |
| Product consolidates tools; pain is the story; >= 45 s | S3 Pain-to-Calm Line | Under 30 s |
| Product exists because of a market shift; calm B2B | S4 Trend-to-Product | No believable trend fact |
| Strong UI; screenshots or recordings available | S5 Real-UI Demo | UI unreadable at size |
| Creation tool for non-experts; playful; people footage | S6 Human Story to Prompt | No footage rights |
| Abstract/technical product that can become an object | S7 3D Object Explainer | No 3D capacity (use S2) |
| Not sure | S5 if UI exists, otherwise S2 | |

## 2. Look

| Mood/tone | Look |
|---|---|
| Calm, credible, light | `clean-light` |
| Premium, focused, dark/AI | `dark-product` |
| Energetic, loud, young, creation | `bold-kinetic` |
| Brand colors given | Build from brand (see `looks.md`) |

## 3. Length / template

| Platform / goal | Length |
|---|---|
| Social ad, cold audience | 15 s (hook-led) or 30 s |
| Landing page, product intro | 30 s |
| Launch / explainer / pain-heavy | 45 s |
| Under 15 s | Cut the pain; hook + product + CTA |

## 4. Format

| Platform | Format |
|---|---|
| Reels, TikTok, Shorts | 9:16 |
| YouTube, website hero | 16:9 |
| Feed (square) | 1:1 |
| Feed (portrait) | 4:5 |

## 5. Pain strategy

| Situation | Strategy |
|---|---|
| Product replaces many tools | S3 (tangle -> calm) |
| Fear/risk | S1 (image of risk) |
| Everyday annoyance | S6 (relatable moment) |
| Outdated way | S7 (old way small and grey) |
| No clear pain | Trend fact (S4) or UI demo (S5) |

## 6. Proof strategy

| Available | Use |
|---|---|
| Certification/credential | `ProofCredential` text card |
| A metric with a source | `StatCounter` |
| Named customer quote with permission | `Quote`/`QuoteCard` |
| Many logos with permission | `LogoStrip`/`ProofMosaic` |
| Nothing | Skip proof; do not invent. Strengthen demo instead; flag the gap |

## 7. Hook type

| Audience state | Hook |
|---|---|
| Problem-aware | Pain image or pain claim |
| Curious / skeptical | Typed question |
| Solution-aware | Bold promise or number |
| Cold | Relatable human moment |

## 8. Voice

| Situation | Voice |
|---|---|
| Person supplies recording | Use it; transcribe; align animation |
| Generated voice wanted | Quote cost first (confirm-gated) |
| No voice | Captions are the voice; text must pass reading speed check |
