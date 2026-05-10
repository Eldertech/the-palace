# Model 03 — Dispersion Cloud (All-Pass Population)

The third model. The prism-honest one. Each lens applies frequency-dependent group delay — different frequency components of the input arrive at slightly different times, all within a single droplet.

## What it is

A single dispersing lens is a frequency-domain all-pass: unity magnitude response everywhere, phase response shaped by a power-law over frequency. Implementation:

```
phi(f_n) = -direction · (π · D / exponent) · f_n^exponent
```

where `f_n` is normalized frequency in [0, 1] (DC to Nyquist). This produces a group delay of:

```
tau(f_n) = direction · D · f_n^(exponent - 1)    samples
```

So at f=0 the delay is 0; at f=Nyquist the delay is `direction · D` samples.

| `exponent` | Group-delay-vs-frequency curve | Character |
|---|---|---|
| 1.0 | Constant delay (D samples at every frequency) | No dispersion — just a delay |
| 2.0 | Linear group-delay-vs-frequency | The textbook prism |
| 3.0 | Quadratic | Stiff-string-like (highs delayed *much* more) |
| 5.0+ | Very steep | Only the very highest frequencies delay |

| `direction` | What happens |
|---|---|
| +1 | High frequencies arrive LATER than lows |
| -1 | High frequencies arrive EARLIER than lows |

The cloud is hundreds of dispersing lenses with subtly different `D`, `exponent`, and `direction` values, panned, time-offset, and summed. Pitch is **not** shifted (option a — pure dispersion). One variation (`26_layered_disp_+pitch.wav`) adds optional cents-jitter so you can hear what the layered model sounds like for comparison.

## Files

| File | What |
|---|---|
| `dry.wav` | Kokoro TTS of *"the prism, and the cloud."* |
| `lens.py` | `disperse()` (single lens) and `dispersion_cloud()` (population) |
| `lens_demo.wav` | Result of running `lens.py` on `dry.wav` |
| `variations.py` | 30 curated parameter sets organized by axis |
| `variations/` | The 30 rendered WAVs, plus a listening guide README |

## How to run

```bash
cd 03_dispersion_cloud
python3 lens.py             # produces lens_demo.wav
python3 variations.py       # renders 30 WAVs into variations/
```

## Performance note

`dispersion_cloud()` precomputes one FFT of the dry signal and reuses it for every droplet (since they all disperse the same input). Each droplet's per-call cost is therefore just (phase-multiply + iFFT). 600 droplets renders in ~0.8 s; 1500 in ~2 s.

## Listening highlights

- `25_loudon_canonical_pure.wav` — the working canonical: 600 droplets, 4–20 ms dispersion, exponent 2 (linear prism), balanced direction, panned wide. **Start here.**
- `06_exp_1_pure_delay.wav` vs `07_exp_2_linear_prism.wav` — same lens infrastructure with vs without dispersion. Hear what dispersion adds.
- `10_highs_late_all.wav` vs `11_highs_early_all.wav` — same dispersion, opposite direction. Hear the spectral motion reverse.
- `27_glassy_prism.wav` — exponent 4 + `direction=+1`: voice keeps its body, only the sibilants smear into a glittering tail. The most prism-like aesthetic in the set.
- `26_layered_disp_+pitch.wav` — option (b): adds cents-level pitch jitter on top of dispersion. Compare to 25 to hear the difference.

## How this is different from Models 01 and 02

This model treats *each* droplet as a tiny prism. Models 01 and 02 treated the population as a way to disperse pitches (pitch dispersion across droplets, no dispersion within any one droplet). This model has dispersion *inside* every droplet, which is what the metaphor was always reaching for.

The two are structurally distinct primitives — pitch shift and dispersion are not the same DSP operation, and the previous models were leaning on "spread of pitches" as a stand-in for "frequency-dependent group delay." Now they're separated cleanly. Either can be used alone (Model 02 = pitch only, Model 03 = dispersion only) or layered (variation 26).

## Connection to the palace

- Project entry: [[Shimmer Cloud]]
- Sister project: [[Crystal Synthesizer]] Stage 4 uses the same all-pass dispersion primitive at instrument-tail scale; this project deploys it at population scale
- Underlying concept: [[Frequency-Time Duality]] — dispersion *is* the duality made audible
