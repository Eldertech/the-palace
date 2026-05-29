# Shimmer Cloud — Model Lineage

This folder traces three successive models for what a "shimmer cloud" is. Each model is a different answer to the question "what is the lens?" — the unit object that the cloud is made of.

The dry input (`dry.wav`, also copied into each model's folder) is a Kokoro TTS rendering of the phrase *"the prism, and the cloud."* All wet outputs in all models are processed from this same input.

## The three models

### `01_feedback_lens/` — single moving lens with octave feedback (Stage 1, initial)

The first attempt. A single lens that hears the dry signal, pitch-shifts it up by an octave, delays it, mixes it back into a feedback loop. Each trip through the loop = one "generation" of the shimmer. Six generations stack into the classic H3000-style shimmer reverb tail. A slow chorus drift inside the loop gives it the moving-lens quality.

This model's strength: instantly recognizable shimmer, clearly audible feedback structure.
This model's weakness: structurally a chorus/H3000 effect, not a prism. Octave-stacking is the dominant aesthetic. Doesn't actually disperse.

Has `dry.wav`, `wet.wav`, `lens.py`. No 30-variation set saved (it was overwritten by Model 02 before being archived; the lens.py is here as the reference implementation).

### `02_droplet_cloud/` — population of rate-resampled droplets (Stage 2, current)

The second attempt. Drops the feedback loop. Each lens is now a "droplet" — a rate-resampled copy of the dry signal at a slightly different rate (cents-level around a target). Pitch and time are coupled by the physics of resampling: a droplet at +5 cents is also slightly shorter. A cloud is hundreds of these droplets, panned across stereo, started at slightly random times, summed.

This model's strength: many droplets close to in-tune sounds genuinely cloud-like, with natural micro-detuning and natural temporal drift.
This model's weakness: still pitch-shift dispersion, not frequency dispersion. Each droplet is internally rate-shifted but not internally dispersed. The prism metaphor is only approximated.

Has `dry.wav`, `cloud.py`, `cloud_demo.wav`, `variations.py`, and a full `variations/` folder with 30 WAVs and a listening guide.

### `03_dispersion_cloud/` — population of all-pass-dispersing lenses (Stage 3, current)

The third attempt. Brings dispersion back to its physical meaning. Each lens applies an all-pass filter (frequency-domain phase manipulation) with a power-law group-delay curve — different frequency components delayed by different amounts within a single droplet. Unity magnitude everywhere; the lens preserves the spectrum but smears it across time-by-frequency. The cloud is hundreds of dispersing lenses with subtly different dispersion characteristics, panned, time-offset, summed. No pitch shifting (in the canonical case).

This model's strength: this is what a prism actually does. Sibilants smear differently from vowels because they live in different frequency bands. The "fanning out" feels optical-prism-like.
This model's character: less obviously musical than the rate-resampled cloud — subtler, more spectral, more like the inside of an echo chamber.

Has `dry.wav`, `lens.py`, `lens_demo.wav`, `variations.py`, and a full `variations/` folder with 30 WAVs and a listening guide.

## Why three models exist

Each was the right answer to a slightly different question:

| Model | Answers... |
|---|---|
| 01 feedback lens | What does a moving pitch-shifter in feedback sound like? |
| 02 droplet cloud | What does a population of nearly-identical pitch-shifted droplets sound like? |
| 03 dispersion cloud | What does a population of frequency-dispersing lenses sound like? |

The third is the most physics-honest interpretation of "Shimmer Cloud as prism." The first two are stops along the way that produce useful and distinct sounds in their own right, so they're saved here rather than thrown away.

## Connection to the palace

- Project entry: [[Shimmer Cloud]] (`Projects/Shimmer Cloud.md`)
- Sister project: [[Crystal Synthesizer]] Stage 4 also uses an all-pass dispersion filter (different deployment of the same primitive)
- Underlying concept: [[Frequency-Time Duality]]
- Audio architecture inheritance: [[Granular Synthesis]] for the population idea; [[Particle Synthesis]] for the per-droplet-as-particle framing

## Next-stage candidates (not yet built)

- Time-modulated dispersion: each lens's dispersion curve drifts over its lifetime
- Spatial prism: different frequencies pan to different positions
- Dispersion + particle physics: each droplet's position in a force field determines its dispersion params
