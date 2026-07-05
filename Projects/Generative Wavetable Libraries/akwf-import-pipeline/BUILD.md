---
title: "AKWF Import Pipeline — build notes"
born: 2026-04-24
links:
  - target: "[[Generative Wavetable Libraries]]"
    type: connects-to
    label: proof-of
forward_vector: "I am the build notes for the AKWF import pipeline — how the single-cycle packs were brought into Generative Wavetable Libraries."
---

# AKWF Import Pipeline — the captured-audio source path

The third source archetype for [[Generative Wavetable Libraries]], built and
proven before the other two but living outside the palace until recovered on
2026-05-30. Where Phase 1 ([[crystal-bravais]]) *synthesizes* frames from an
algorithm, this path *imports* existing single-cycle waveforms — a user's own
library — analyzes them, orders them perceptually, and packs them into a
deployable Ableton wavetable. It is the literal realization of the "captured
audio" intake the project's forward vector names.

The source library here is **AKWF** (Adventure Kid Waveforms) — a large free
collection of single-cycle waveforms, each 600 samples, mono 16-bit @ 44.1 kHz.
This is the "huge collection of single cycle waveforms" the project kept
referring to.

## What the pipeline does

`pack_wavetable.py` takes a folder of single-cycle WAVs and produces one
Ableton-ready wavetable, frames ordered dull-to-bright. Three ideas carry it:

- **Tile-three-keep-the-middle resampling.** Each 600-sample cycle is resampled
  to 1024 (Ableton's native frame size) with `scipy.signal.resample_poly`. To
  avoid FIR edge artifacts corrupting the loop seam, the cycle is tiled three
  times, resampled, and only the clean middle copy is kept. The result is
  perfectly periodic — no click at the loop join.
- **Spectral centroid as the brightness axis.** The energy-weighted mean
  frequency of each cycle (computed on the DC-removed signal via `rfft`) is the
  one-number brightness feature. Frames are sorted ascending, so the Position
  knob *means* "turn up the brightness."
- **Joint normalization.** The whole table is scaled once (to 0.99 of peak), not
  frame-by-frame — so a Position sweep reads as a timbral morph, not a level
  ride.

Output filename is the concatenation of the input stems, truncated past 200
chars with a frame-count suffix.

## The ordering finding

Before settling on centroid, three orderings were spiked on the six test
cycles — **spectral centroid**, **spectral flatness** (Wiener entropy), and a
**TSP nearest-neighbor walk** over the 2-D (centroid, flatness) feature space.
All three produced the *identical* order:

```
cheeze → aguitar → birds → vgsqu → saw → bitreduced
```

| name            | centroid (Hz) | flatness |
|-----------------|--------------:|---------:|
| cheeze_0003     |          93.4 |  0.00078 |
| aguitar_0001    |         212.4 |  0.00187 |
| birds_0001      |         314.6 |  0.00213 |
| vgsqu_0008      |        1409.8 |  0.02658 |
| saw             |        2319.6 |  0.05822 |
| bitreduced_0040 |        2814.9 |  0.05914 |

They agreed because, for single-cycle waveforms, the only way to raise the
centroid is to pack in more high-frequency harmonic content — which also raises
flatness. The two metrics measure overlapping things, and the feature vectors
lie nearly on a straight line, so the TSP walk just follows it. **Takeaway:** for
an AKWF-style library where the interesting variation is "how much harmonic
content," one feature (centroid) suffices. The orderings only diverge for
samples that hit a corner of the space — a clean high sine (high centroid, near-
zero flatness) or a dense low inharmonic cluster (low centroid, high flatness).
That divergence is the entry point for the inharmonic work in
[[Inharmonic Wavetable Synthesis]].

## Files in this bundle

- `pack_wavetable.py` — the recovered, thoroughly-commented packer. Verified
  end-to-end on 2026-05-30 against the source cycles; reproduces the order above.
- `source-cycles/` — the six AKWF test cycles (600-sample originals).
- `test-wavetables/` — the proof outputs: 2-frame and 4-frame morph tests, the
  three ordering variants (centroid / flatness / TSP, content-identical here),
  and the final 6-frame centroid-packed table.

## What's verified, what isn't

- The script runs and produces correct frame counts and orderings. ✓
- Ableton import was confirmed by Loudon in the original session (2-frame and
  4-frame both read cleanly and morphed via Position). ✓
- **Not yet built:** the scale-up to the *full* AKWF library — grouping policy
  (by folder, by naming pattern, by feature clustering), and whether 600→1024
  resampling across thousands of files wants any batching or caching. The
  original session ended at "confirm it works, then we scale."

## Where this sits among the three source paths

- *Algorithmic* — [[crystal-bravais]] (synthesize frames from lattice symmetry)
- *Import + analyze + order* — **this** (the AKWF path)
- *Generative-AI / VAE* — still concept; the AKWF library is exactly the
  single-cycle training corpus a VAE latent-space wavetable would need.
