# Reference ad annotation

One record per reference ad. Store annotations, never the video or its assets. Unknown values are null.

Required: id, brand, style_family, beats, confidence.

| Field | Type | Notes |
| --- | --- | --- |
| id | string |  |
| brand | string |  |
| source | string |  |
| url | string (may be none) |  |
| format | string (may be none) · one of 9:16, 16:9, 1:1, 4:5 |  |
| duration_s | number (may be none) |  |
| platform | string (may be none) |  |
| style_family | string · one of S1, S2, S3, S4, S5, S6, S7, unknown |  |
| confidence | string · one of H, M, L | confidence of annotation from stills only |
| rating | integer (may be none) |  |
| rating_notes | string (may be none) |  |
| beats | array |  |
| beats[].n | integer | |
| beats[].role | string · one of hook, pain, turn, promise, product, proof, brand, cta, bridge, other | |
| beats[].block | string (may be none) | |
| beats[].text | string (may be none) | |
| beats[].t_start_s | number (may be none) | |
| beats[].t_end_s | number (may be none) | |
| beats[].notes | string (may be none) | |
| pain_share | number (may be none) |  |
| turn | string (may be none) | technique of the problem-to-solution switch |
| motif | string (may be none) |  |
| palette_source | string (may be none) · one of brand, single-accent, per-scene-blocks, gradient, mixed |  |
| palette_notes | string (may be none) |  |
| type_notes | string (may be none) |  |
| text_emphasis | array (may be none) |  |
| grain | string (may be none) · one of none, light, heavy |  |
| blur_on_motion | boolean (may be none) |  |
| sentence_split | integer (may be none) | number of scenes one sentence spans |
| human_presence | string (may be none) · one of none, b-roll, talking-head, story |  |
| ui_fidelity | string (may be none) · one of skeleton, stylized, real, none |  |
| transitions | array (may be none) |  |
| proof_type | string (may be none) |  |
| sound_notes | string (may be none) |  |
| patterns | array (may be none) | pattern ids from references/patterns.md |
| lessons | array (may be none) |  |
