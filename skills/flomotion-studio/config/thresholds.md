# Thresholds

All values are initial proposals. Tune from rendered results and human ratings. Never hard-code these elsewhere. Every numeric default the checks use lives here.

| Field | Value |
| --- | --- |
| fps | 30 |

## durations_s

| Field | Value |
| --- | --- |
| short | 15 |
| standard | 30 |
| long | 45 |
| tolerance | 2 |

## scene

| Field | Value |
| --- | --- |
| min_s | 1.0 |
| typical_min_s | 1.5 |
| typical_max_s | 4.0 |
| max_s | 6.0 |
| hook_max_s | 3.0 |
| cta_min_s | 2.0 |

## motion

| Field | Value |
| --- | --- |
| first_motion_max_s | 0.3 |
| max_static_s | 0.5 |
| novelty_window_s | 2.0 |
| min_new_elements_per_window | 1 |
| motion_blur_shutter_deg | 180 |
| overshoot_max_pct | 8 |

### transition_s

| Field | Value |
| --- | --- |
| min | 0.25 |
| max | 0.7 |

### stagger_ms

| Field | Value |
| --- | --- |
| min | 40 |
| max | 120 |

## text

| Field | Value |
| --- | --- |
| headline_words_max | 6 |
| headline_words_hard_max | 8 |
| words_per_scene_max | 12 |
| reading_wps_max | 3.0 |
| caption_wps_max | 3.5 |
| families_max | 2 |
| contrast_ratio_min | 4.5 |
| contrast_ratio_large_min | 3.0 |
| large_text_px | 48 |

### min_px

#### 9:16

| Field | Value |
| --- | --- |
| headline | 72 |
| body | 44 |
| caption | 40 |

#### 16:9

| Field | Value |
| --- | --- |
| headline | 64 |
| body | 36 |
| caption | 34 |

#### 1:1

| Field | Value |
| --- | --- |
| headline | 64 |
| body | 38 |
| caption | 36 |

#### 4:5

| Field | Value |
| --- | --- |
| headline | 68 |
| body | 40 |
| caption | 38 |

## safe_area_px

### 9:16

| Field | Value |
| --- | --- |
| top | 250 |
| bottom | 380 |
| left | 64 |
| right | 64 |

### 16:9

| Field | Value |
| --- | --- |
| top | 54 |
| bottom | 54 |
| left | 96 |
| right | 96 |

### 1:1

| Field | Value |
| --- | --- |
| top | 54 |
| bottom | 54 |
| left | 54 |
| right | 54 |

### 4:5

| Field | Value |
| --- | --- |
| top | 150 |
| bottom | 250 |
| left | 54 |
| right | 54 |

## sync

| Field | Value |
| --- | --- |
| voice_tolerance_frames | 3 |
| impact_sound_tolerance_frames | 2 |

## audio

| Field | Value |
| --- | --- |
| target_lufs | -14 |
| lufs_tolerance | 1.0 |
| true_peak_dbtp_max | -1.0 |
| voice_over_music_db_min | 12 |
| duck_attack_ms | 80 |
| duck_release_ms | 400 |

### bus_levels_db

| Field | Value |
| --- | --- |
| voice | -3 |
| music | -18 |
| sfx | -10 |

## color

| Field | Value |
| --- | --- |
| palette_tolerance_deltaE | 12 |

### grain_opacity_pct

| Field | Value |
| --- | --- |
| min | 3 |
| max | 8 |

## layout

| Field | Value |
| --- | --- |
| text_overlap_iou_max | 0.0 |
| clip_tolerance_px | 0 |

## determinism

| Field | Value |
| --- | --- |
| sample_frames | 12 |
| max_pixel_diff | 0 |
