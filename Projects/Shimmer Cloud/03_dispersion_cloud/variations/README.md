# Dispersion Cloud — 30 Variations

All 30 variations process the same dry input (`../dry.wav`) through the dispersion cloud model in `../lens.py`. **Output is 100% wet, stereo,** peak-normalized to 0.85.

Each variation is a population of N droplets, each a copy of the dry signal passed through its own all-pass dispersion filter. Pitch is preserved per droplet (option a — pure dispersion) except where explicitly noted in section H.

## Sections

### A — Dispersion strength (01–05) *(400 droplets, exp 2, balanced direction)*
The maximum group delay (at Nyquist) per droplet. Range across the cloud is `[dispersion_min_ms, dispersion_max_ms]`.

| # | Name | Notes |
|---|---|---|
| 01 | `disp_2ms` | Subtle — the lens is barely there |
| 02 | `disp_8ms` | Audibly smearing |
| 03 | `disp_25ms` | Clearly dispersed |
| 04 | `disp_75ms` | Strong smear |
| 05 | `disp_200ms` | Extreme — temporal fanning becomes the texture |

### B — Dispersion exponent (06–09) *(shape of the group-delay curve)*

| # | Name | Notes |
|---|---|---|
| 06 | `exp_1_pure_delay` | All frequencies delayed by the same amount — no dispersion |
| 07 | `exp_2_linear_prism` | Linear group-delay-vs-freq — the textbook prism |
| 08 | `exp_3_stiff_string` | Quadratic — highs delayed much more |
| 09 | `exp_5_extreme` | Only the very highest frequencies delay |

### C — Direction (10–12)

| # | Name | Notes |
|---|---|---|
| 10 | `highs_late_all` | All droplets delay highs after lows |
| 11 | `highs_early_all` | All droplets delay lows after highs |
| 12 | `mixed_directions` | Half each — most natural cloud |

### D — Droplet count (13–16)

| # | Name | Notes |
|---|---|---|
| 13 | `50_droplets` | Sparse — individual lenses still audible |
| 14 | `200_droplets` | Cloud emerging |
| 15 | `600_droplets` | Smooth population |
| 16 | `1500_droplets` | Very dense |

### E — Time spread (17–21)

| # | Name | Notes |
|---|---|---|
| 17 | `synced_5ms` | Almost simultaneous — phase interactions dominate |
| 18 | `close_75ms` | Slight smear |
| 19 | `natural_350ms` | Natural cloud |
| 20 | `dispersed_1000ms` | Clear cascade |
| 21 | `long_cascade_3s` | Slow falling-out-of-time across 3 seconds |

### F — Pan spread (22–24)

| # | Name | Notes |
|---|---|---|
| 22 | `mono_pan` | All centered |
| 23 | `half_pan` | Half-width |
| 24 | `full_pan` | Full stereo field |

### G — Composite identities (25–30)

| # | Name | What it is |
|---|---|---|
| 25 | `loudon_canonical_pure` | **600 droplets, 4–20ms disp, exp 2, balanced direction, 350ms spread, full pan.** Pure dispersion. The reference. |
| 26 | `layered_disp_+pitch` | Same as 25 plus ±3c pitch jitter — the layered model (option b) |
| 27 | `glassy_prism` | Exp 4, all highs-late, 20–80ms — voice body intact, sibilants smear into glittering tail |
| 28 | `underwater_smear` | Exp 1.7, all highs-early, 60–180ms — long lows trailing high transients |
| 29 | `chromatic_aberration` | Mixed direction at strong dispersion — opposite-direction droplets coexisting |
| 30 | `long_dispersing_cascade` | 8–35ms dispersion, 2.5s time spread — droplets keep arriving long after dry ends |

## Pairs to A/B first

- **25 vs 26** — pure dispersion vs dispersion + pitch jitter (option a vs option b)
- **06 vs 07** — pure delay (no dispersion) vs linear-prism dispersion. The clearest demonstration of what dispersion adds.
- **10 vs 11** — same dispersion, opposite direction. Listen for the way "the prism" reverses.
- **27 vs 28** — opposite-character composites. Glassy prism vs underwater smear.
- **25 (this set) vs 24 (model 02 set)** — Loudon canonical, dispersion vs rate-resampled. Same intent, different physics underneath.

## What to listen for

The voice keeps its identifiable pitch — there's no shimmer up an octave. What changes is *when* each frequency component arrives. Sibilants ("s" in *prism*, *cloud*) and consonants live in higher frequency bands than vowels and so they're delayed differently. Listen for the way "prism" splits — the "s" smearing forward or backward relative to the "i" — that's the lens fanning the spectrum across time.
