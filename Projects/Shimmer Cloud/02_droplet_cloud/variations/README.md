# Shimmer Cloud — 30 Variations (Droplet Cloud Model)

All 30 variations process the same dry input (`../dry.wav`) through the **droplet cloud** model in `cloud.py`. **Output is 100% wet, stereo,** peak-normalized to 0.85.

## The model

A cloud is a population of N droplets. Each droplet is a **rate-resampled** copy of the dry signal — pitch and time coupled by the physics of resampling, not decoupled by phase vocoder. So a droplet at +5 cents is *also* slightly shorter than a droplet at unison. This is what makes them "fall out of time" — they each play at their own slightly different speed.

Each droplet has:

- **rate** — Gaussian around target (controlled by `pitch_target_semitones` and `pitch_spread_cents`)
- **start time** — uniform random in `[0, time_spread_ms]`
- **pan** — uniform random in `[-pan_spread, +pan_spread]`, equal-power
- **amplitude** — small uniform jitter so the cloud breathes
- **fade in/out** — short envelope so droplets don't click

The cloud is the sum, peak-normalized.

## Listening order

### Section A — Droplet count (01–05) *(target 0, ±5c, 250ms, full pan)*
How many lenses make a cloud?

| # | Name | Notes |
|---|---|---|
| 01 | `30_droplets` | Sparse — you hear individual lenses |
| 02 | `100_droplets` | Cloud emerging |
| 03 | `300_droplets` | Smooth population |
| 04 | `800_droplets` | Dense, almost continuous |
| 05 | `2500_droplets` | Saturated cloud — interference pattern dominates |

### Section B — Pitch spread (06–10) *(400 droplets, target 0)*
Cents-jitter around the target — how tight is "in tune"?

| # | Name | Notes |
|---|---|---|
| 06 | `unison_1c` | ±1 cent — almost-perfect unison, slow phase beating |
| 07 | `tight_3c` | ±3 cents — Loudon's "very close to in tune" range |
| 08 | `natural_8c` | ±8 cents — natural ensemble width |
| 09 | `chorus_25c` | ±25 cents — overt chorus |
| 10 | `wide_75c` | ±75 cents — pitch identity dissolves |

### Section C — Time spread (11–15) *(400 droplets, ±5c, target 0)*
How widely droplet start times scatter — drives the "delay and slowly fall out of time" behavior.

| # | Name | Notes |
|---|---|---|
| 11 | `synced_5ms` | Almost simultaneous — nearly a single thick voice |
| 12 | `close_75ms` | Slight smear |
| 13 | `natural_300ms` | Natural cloud |
| 14 | `dispersed_1000ms` | Clear cascade |
| 15 | `long_cascade_3s` | Slow rain — droplets keep arriving long after dry ends |

### Section D — Pan spread (16–19) *(400 droplets, ±5c, 300ms)*
Stereo width.

| # | Name | Notes |
|---|---|---|
| 16 | `mono_pan` | All centered |
| 17 | `quarter_pan` | Narrow stereo |
| 18 | `half_pan` | Half-width |
| 19 | `full_pan` | Full stereo field — droplets scattered everywhere |

### Section E — Pitch target (20–23) *(400 droplets, ±5c, 300ms, full pan)*
Where the cloud sits.

| # | Name | Notes |
|---|---|---|
| 20 | `target_unison_0` | Cloud around the original pitch — ghost-double of the voice |
| 21 | `target_+3` | Minor third up |
| 22 | `target_+7` | Fifth up |
| 23 | `target_+12` | Octave up — this is what the H3000-era shimmer aspires to, but rendered as cloud |

### Section F — Composite identities (24–30)
Each is a deliberate set of choices, not a single-axis sweep.

| # | Name | What it is |
|---|---|---|
| 24 | `loudon_canonical` | **600 droplets, ±3c, 350ms, full pan, target 0.** Many droplets, very close to in tune, slowly delayed, panned wide. The reference. |
| 25 | `breathing_unison` | 1000 droplets, ±2c, 800ms cascade — dense unison disperses across time |
| 26 | `micro_cluster` | 1500 droplets, ±1c, tight 150ms — almost a phase-shifted reverb |
| 27 | `dispersing_swarm` | 250 droplets, ±8c, 2000ms — discrete cloud edges |
| 28 | `choral_lift_+3` | 600 droplets, +3 target, ±4c — choral upward lift |
| 29 | `heavenly_+7` | 800 droplets, +7 target, ±2.5c, 600ms — fifth-stack, very tight |
| 30 | `long_cascade_+5` | 400 droplets, +5 target, 2500ms — long cascading fourth |

## Pairs to A/B first

- **24 vs 03** — Loudon canonical against the section-A 300 droplets default — hear what wider time spread + more droplets does
- **06 vs 10** — same droplet count, narrowest vs widest pitch spread — when does "in tune" become "untuned"?
- **11 vs 15** — same cloud, no time spread vs full 3-second cascade
- **20 vs 23** — same cloud, target shifted from unison to octave
- **26 vs 27** — opposite extremes: tight tons-of-droplets cluster vs sparse-and-wide swarm

## Notes on what's different from before

The old (Stage-1) model was *feedback generations*: octave-up shimmer that stacks repeatedly. The new model is *parallel population*: hundreds of droplets summed simultaneously, each at its own rate. There's no feedback loop here — the dispersion comes entirely from droplet-to-droplet variation. Pitch and time are coupled because each droplet is resampled (not phase-vocoded), which is the physically honest version of "moving lens" — a moving lens necessarily affects both pitch and time.
