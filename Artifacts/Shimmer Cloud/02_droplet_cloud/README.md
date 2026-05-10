# Model 02 — Droplet Cloud (Rate-Resampled Population)

The second model. Drops the feedback loop. Replaces "one moving lens" with "hundreds of slightly-different lenses summed simultaneously."

## What it is

Each droplet is a **rate-resampled** copy of the dry signal, where the rate is drawn from a Gaussian centered on a target pitch (e.g. unison or +3 semitones). Pitch and time are coupled by the physics of resampling: a droplet at +5 cents is *also* slightly shorter than a unison droplet — they don't need extra machinery to "fall out of time," it falls out naturally.

For each droplet:

- **rate** ← Gaussian around the pitch target (controlled by `pitch_spread_cents`)
- **start time** ← uniform random in `[0, time_spread_ms]`
- **pan** ← uniform random in `[-pan_spread, +pan_spread]`, equal-power
- **amplitude** ← small uniform jitter so the cloud breathes
- short fade in / fade out so droplets don't click

The cloud is the stereo sum of all droplets, peak-normalized.

This is the model that came from the "many droplets very close to in tune, slowly falling out of time, panned wide" specification. Loudon's canonical case is variation 24 of the variation set.

## Files

| File | What |
|---|---|
| `dry.wav` | Kokoro TTS of *"the prism, and the cloud."* |
| `cloud.py` | The implementation. `droplet_cloud()` is the function. |
| `cloud_demo.wav` | Result of running `cloud.py` on `dry.wav` with default parameters |
| `variations.py` | 30 curated parameter sets organized by axis |
| `variations/` | The 30 rendered WAVs, plus a listening guide README |

## How to run

```bash
cd 02_droplet_cloud
python3 cloud.py            # produces cloud_demo.wav
python3 variations.py       # renders 30 WAVs into variations/
```

## What this model does well

- "Lots and lots of droplets, very subtle differences between them" — this is the cloud's natural register
- The pitch and time coupling is physically honest for a moving-lens-as-resampler interpretation
- Stereo panning makes the cloud feel spatial in a way that simple chorus doesn't
- Tight pitch spreads (±1–3 cents) sound genuinely choral

## Where this model breaks down as "prism"

The pitch shift inside any one droplet is **frequency-independent** — every spectral component of that droplet is shifted by the same ratio. The cloud disperses pitches *across droplets* but no individual droplet has internal frequency dispersion. So this model is still the chorus / unison-ensemble lineage, not the optical-prism lineage.

The pivot to Model 03 (`03_dispersion_cloud/`) restores frequency-dependent group delay inside each droplet, which is what an optical prism actually does. Both models are useful — they produce different aesthetic universes — but the prism metaphor is more honestly served by Model 03.
