# Look: dark-product

Mood: focused, premium. starter - replace after direction notes. Use these tokens and nothing else (see `references/looks.md`).

## palette

| Field | Value |
| --- | --- |
| bg | #0B0D14 |
| surface | #151826 |
| text | #F4F5F9 |
| textMuted | #9AA0B8 |
| accent | #7C5CFF |
| signal | #3DDC97 |
| positive | #3DDC97 |
| negative | #FF6B6B |
| blocks | #0B0D14, #7C5CFF, #151826, #3DDC97 |

## type

| Field | Value |
| --- | --- |
| case | sentence |

### display

| Field | Value |
| --- | --- |
| family | Sora |
| weights | 600, 700 |
| tracking | -0.02 |
| lineHeight | 1.05 |

### body

| Field | Value |
| --- | --- |
| family | Inter |
| weights | 400, 500 |
| tracking | 0 |
| lineHeight | 1.35 |

### mono

| Field | Value |
| --- | --- |
| family | JetBrains Mono |
| weights | 500 |

### scale

| Field | Value |
| --- | --- |
| hero | 1.0 |
| title | 0.6 |
| body | 0.34 |
| caption | 0.28 |

## motion

| Field | Value |
| --- | --- |
| speed | medium |
| staggerMs | 80 |
| blurOnMotion | yes |
| signatureTransition | glow-wipe |

### easing

| Field | Value |
| --- | --- |
| enter | expo.out |
| exit | power2.in |
| move | power3.inOut |

#### spring

| Field | Value |
| --- | --- |
| stiffness | 200 |
| damping | 22 |

## surface

| Field | Value |
| --- | --- |
| radius | 24 |
| shadow | glow |

### glass

| Field | Value |
| --- | --- |
| blur | 28 |
| opacity | 0.35 |

## texture

| Field | Value |
| --- | --- |
| grain | 0.06 |
| gradient | #0B0D14, #1B1340 |

## sound

| Field | Value |
| --- | --- |
| palette | low-drone, tick, sub-hit, bright-pluck |
| musicMood | pulse-ambient |
| impactStyle | deep |

## Do

- Accent only on the element that matters
- Use glow edges to separate cards

## Don't

- No pure white text on pure black for body (use text token)
- No more than 2 type families
