# Dispersion Filter — Diamond (cubic Fd-3m)

The second half of the Crystal Synthesizer's optical-acoustic bridge,
made audible. Birefringence (cycle 2) lived in the **frequency** domain —
paired partials beating. Dispersion lives in the **time** domain.

Built 2026-06-04 under TRICKSTER grant `resp-mpv8921g-1igsuc`
(option `DISPERSION-FILTER`, cycle-1 request `crystal-synth-steward-006`).
This is the **smallest-unit render** the still-open audition plan
(`crystal-synth-steward-009`) describes — built ahead of approval so the
artifact is ready to hear the moment the plan is greenlit.

## The claim, in one sentence

An optical prism separates white light in **space** by frequency; an
acoustic dispersion crystal separates a broadband click in **time** by
frequency. Same physics, different observational projection.

## The physics

For the simplest crystal model — a 1-D monatomic chain, the textbook case
in the home entry — the dispersion relation is:

    ω(k) = ω_max · | sin(k·a / 2) |

The group velocity (the speed a wave packet, and thus the click's energy
at that frequency, actually travels) is the slope of that curve:

    v_g(k) = dω/dk = ω_max · (a/2) · cos(k·a / 2)

Near the zone **center** (low frequency) the curve is steep — v_g is
large, low frequencies arrive first. Near the zone **boundary** (high
frequency) it flattens — v_g → 0, high frequencies crawl and arrive late.

The filter imposes a frequency-dependent group delay built from how far
the dispersion curve **departs from a straight (non-dispersive) line**:

    τ(f) ∝ (1 − v_g)        zero at zone center, maximal at zone boundary

— a bounded, faithful measure of the dispersion itself. (The raw 1/v_g
group-delay form was tried first and rejected: its singularity at the
zone boundary brick-walls all high frequencies into one huge delay rather
than dispersing them smoothly. `1 − v_g` keeps the curve's shape —
flattening curve → growing delay — while staying finite across the whole
audible band.) The delay is then integrated into an all-pass phase
response and applied in the frequency domain. **Magnitude is left flat:**
dispersion changes *when* each frequency arrives, not *how loud* it is.
That flat-magnitude / bent-phase signature is exactly what separates
dispersion from ordinary filtering.

## The three files

| # | File | What to listen for |
|---|------|---|
| 01 | `01_dry_click.wav` | The broadband strike, undispersed. A single dry tick at t=0. The **control** — this is the click before the prism. |
| 02 | `02_dispersed_click.wav` | The same click through the diamond dispersion filter. The tick melts into a **downward-falling ring** — low frequencies arrive first, highs crawl in behind, the whole click smeared across ~600 ms. |
| 03 | `03_dispersion_sweep.wav` | Eight strikes with dispersion strength ramped 0 → max, struck at successive moments — you hear the **prism open**: from a dry tick into a long frequency-swept ring. |

## Why this is the proof

The home entry's `forward_vector` says the Crystal Synthesizer will make
audible the *optical* properties of crystals. The body names three —
birefringence, dispersion, pleochroism — and lists Option 3 ("Dispersion
Filter") explicitly. Birefringence shipped as five files in cycle 2.
This is dispersion: the prism analogy, where arrival times separate the
way wavelengths do.

Measured, not asserted — the temporal arrival of each band's energy,
from `render_dispersion.py`'s built-in measurement:

| signal | low band (~1 kHz) | high band (~12 kHz) | spread |
|---|---|---|---|
| dry click | 0.6 ms | 0.1 ms | ~0 ms (an impulse — no spread) |
| dispersed click | 1.6 ms | 600.1 ms | **598.5 ms** |

The dispersed high band arrives ~600 ms after its low band. 60% of the
dispersed click's energy lands after the 100 ms mark — the click is no
longer a click. The smear is the dispersion curve speaking through the
synth.

## What the next cycle could ask

- **Anisotropic dispersion.** Diamond is cubic (isotropic) — one curve in
  every direction. A hexagonal or tetragonal crystal would disperse
  *differently along different axes*, so the smear would depend on the
  chosen propagation direction. That is acoustic pleochroism, and it
  would couple the dispersion filter to the "crystal resonance direction"
  control the body imagines.
- **Dispersion as an effect on a played signal**, not just a click —
  feed a chord or a melody through the filter and hear the prism smear
  musical material, the way the body's closing paragraph describes.
- **Birefringence + dispersion together** — ruby's beating doublet fed
  through its own dispersion curve: the two optical analogies stacked.

## How to render again

```sh
cd "Projects/Crystal Synthesizer/dispersion-filter"
python3 render_dispersion.py
```

Dependencies: numpy, scipy. Sample rate 44.1 kHz, 16-bit PCM.
