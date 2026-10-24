# Look: clean-light

Mood: calm, credible. starter - replace after direction notes. Use these tokens and nothing else (see `references/looks.md`).

## palette

| Field | Value |
| --- | --- |
| bg | #F6F7FB |
| surface | #FFFFFF |
| text | #0F1222 |
| textMuted | #5B6075 |
| accent | #4B5CFF |
| signal | #FF7A45 |
| positive | #2FBF71 |
| negative | #E5484D |
| blocks | #4B5CFF, #FF7A45, #2FBF71, #FFC933 |

## type

| Field | Value |
| --- | --- |
| case | sentence |

### display

| Field | Value |
| --- | --- |
| family | Inter Tight |
| weights | 700, 800 |
| tracking | -0.02 |
| lineHeight | 1.02 |

### body

| Field | Value |
| --- | --- |
| family | Inter |
| weights | 400, 500, 600 |
| tracking | 0 |
| lineHeight | 1.3 |

### mono

| Field | Value |
| --- | --- |
| family | JetBrains Mono |
| weights | 500 |

### scale

| Field | Value |
| --- | --- |
| hero | 1.0 |
| title | 0.62 |
| body | 0.36 |
| caption | 0.3 |

## motion

| Field | Value |
| --- | --- |
| speed | medium |
| staggerMs | 70 |
| blurOnMotion | yes |
| signatureTransition | card-slide |

### easing

| Field | Value |
| --- | --- |
| enter | expo.out |
| exit | power3.in |
| move | power3.inOut |

#### spring

| Field | Value |
| --- | --- |
| stiffness | 220 |
| damping | 24 |

## surface

| Field | Value |
| --- | --- |
| radius | 28 |
| shadow | soft |

### glass

| Field | Value |
| --- | --- |
| blur | 24 |
| opacity | 0.6 |

## texture

| Field | Value |
| --- | --- |
| grain | 0.03 |
| gradient | #E9ECFF, #FFFFFF |

## sound

| Field | Value |
| --- | --- |
| palette | soft-click, air-whoosh, gentle-pad |
| musicMood | warm-minimal |
| impactStyle | light |

## Do

- One accent per scene
- Margins >= 6% of width
- Skeleton UI for complex screens

## Don't

- No drop shadows on text
- No more than 2 type families
- No gradients behind body text
