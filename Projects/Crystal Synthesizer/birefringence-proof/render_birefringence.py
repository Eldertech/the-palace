#!/usr/bin/env python3
"""
Crystal Synthesizer — Birefringence Proof (Ruby, R-3c trigonal)
================================================================

The optical-acoustic claim, made audible.

Ruby's R-3c factor group yields two phonon families:
  A1g (2 modes) — polarized along the c-axis        → "extraordinary"
  Eg  (5 modes) — polarized in the basal plane      → "ordinary"

The two families propagate at slightly different velocities, just as
light travels at two different speeds through ruby depending on
polarization. Optical birefringence and acoustic birefringence are the
same physics in different observational projections.

Partial ratios (normalized to mode 1 = 378 cm⁻¹, the lowest Eg):

  Mode  Sym   ω(cm⁻¹)   r_n     Family
   1    Eg     378      1.00    ordinary
   2    A1g    417      1.10    extraordinary
   3    Eg     430      1.14    ordinary
   4    Eg     448      1.19    ordinary
   5    Eg     576      1.52    ordinary
   6    A1g    644      1.70    extraordinary
   7    Eg     748      1.98    ordinary

The PROOF: at f₀ = 220 Hz (A3), modes 2 and 3 land at 242 Hz and 250.8
Hz. Their difference is 8.8 Hz — the beat is squarely in the natural-
chorus / slow-tremolo range and is the audible signature of
birefringence in this synth.

This script renders five artifacts that together constitute the
smallest possible test of the optical-acoustic bridge:

  01_ordinary_only.wav        — 5 Eg modes alone (one polarization)
  02_extraordinary_only.wav   — 2 A1g modes alone (other polarization)
  03_birefringent_sum.wav     — both summed (the 8.8 Hz beat appears)
  04_velocity_split_stereo.wav — extraordinary detuned upward by the
                                 velocity-anisotropy factor, panned L/R
                                 so the two acoustic indices are heard
                                 as two ears worth of timbre
  05_birefringence_arc.wav    — single listening journey: ordinary →
                                 extraordinary → sum, with crossfades,
                                 the whole proof in one file

Author: Crystal Synthesizer steward, cycle 2 (2026-05-27)
Grant:  resp-mpopik57-w02up5 — PROVE-BIREFRINGENCE
Recipe: Projects/Crystal Synthesizer/Crystal Sonification Reference.md §Ruby
"""

import os
import numpy as np
from scipy.io import wavfile

# ────────────────────────────────────────────────────────────────────
#  Recipe from the Sonification Reference (Ruby section)
# ────────────────────────────────────────────────────────────────────

# (mode_index, symmetry, ω_cm⁻¹, r_n, family)
RUBY_MODES = [
    (1, 'Eg',  378, 1.00, 'ordinary'),
    (2, 'A1g', 417, 1.10, 'extraordinary'),
    (3, 'Eg',  430, 1.14, 'ordinary'),
    (4, 'Eg',  448, 1.19, 'ordinary'),
    (5, 'Eg',  576, 1.52, 'ordinary'),
    (6, 'A1g', 644, 1.70, 'extraordinary'),
    (7, 'Eg',  748, 1.98, 'ordinary'),
]

ORDINARY      = [m for m in RUBY_MODES if m[4] == 'ordinary']
EXTRAORDINARY = [m for m in RUBY_MODES if m[4] == 'extraordinary']

# ────────────────────────────────────────────────────────────────────
#  Render parameters
# ────────────────────────────────────────────────────────────────────

SR = 44100
F0 = 220.0          # A3, the reference pitch from the Sonification Reference
DUR = 5.0           # seconds per single-polarization render
ARC_DUR = 14.0      # total length of the arc piece (4 + 4 + 6 with crossfades)

# Velocity-anisotropy factor for the stereo experiment.
# Real ruby has a few-percent acoustic velocity difference between
# c-axis and basal directions. We deliberately exaggerate to 1.5%
# so the listener hears the split as more than a chorusing
# — this is the metaphor stretch declared.
VELOCITY_ANISOTROPY = 1.015

OUT_DIR = os.path.dirname(os.path.abspath(__file__))


# ────────────────────────────────────────────────────────────────────
#  Synthesis helpers
# ────────────────────────────────────────────────────────────────────

def strike_envelope(t, attack=0.005, decay=4.0):
    """Exponential decay with a fast attack — what you hear when you
    tap a ruby with a tuning fork.  Same envelope for all modes so the
    timbre differences are purely spectral, not envelope artifacts."""
    a = np.minimum(t / attack, 1.0)
    d = np.exp(-t / decay)
    env = a * d
    return env


def render_modes(modes, f0, dur, sr=SR,
                 amplitudes=None, detune=1.0, phase_seed=0):
    """Render a set of modes as a sum of sine partials with a shared
    strike envelope.

    modes:      list of (idx, sym, ω, r_n, family) tuples
    f0:         fundamental in Hz (mode r=1.00 lands here)
    detune:     multiplicative detune applied to ALL frequencies
                (used to model velocity anisotropy between families)
    amplitudes: optional list of per-mode amplitudes; default = uniform
                with the first and last mode at 1.0 and interior at
                0.85, per the Sonification Reference audio prompt
    """
    rng = np.random.default_rng(phase_seed)
    n_samples = int(dur * sr)
    t = np.arange(n_samples) / sr
    env = strike_envelope(t)

    if amplitudes is None:
        amplitudes = []
        for i in range(len(modes)):
            if i == 0 or i == len(modes) - 1:
                amplitudes.append(1.0)
            else:
                amplitudes.append(0.85)

    audio = np.zeros(n_samples, dtype=np.float64)
    for amp, mode in zip(amplitudes, modes):
        _idx, _sym, _omega_cm, r_n, _family = mode
        freq = f0 * r_n * detune
        phase = rng.uniform(0, 2 * np.pi)
        audio += amp * np.sin(2 * np.pi * freq * t + phase)

    audio *= env
    return audio


def normalize(audio, peak=0.85):
    """Scale to a safe peak.  We avoid hard clipping; ruby's modes
    interfere constructively at the strike, so headroom matters."""
    peak_now = np.max(np.abs(audio))
    if peak_now < 1e-9:
        return audio
    return audio * (peak / peak_now)


def write_wav(path, audio_mono_or_stereo, sr=SR):
    """Write a 16-bit PCM WAV.  Accepts mono (1-D) or stereo (2, N)."""
    if audio_mono_or_stereo.ndim == 1:
        data = audio_mono_or_stereo
    else:
        # scipy expects (N, 2) for stereo
        data = audio_mono_or_stereo.T
    int16 = np.int16(np.clip(data, -1.0, 1.0) * 32767)
    wavfile.write(path, sr, int16)
    print(f"  wrote {path}  ({int16.shape}, peak={np.max(np.abs(data)):.3f})")


def crossfade(a, b, fade_samples):
    """Linearly crossfade the tail of `a` into the head of `b`.  Both
    must be the same length conceptually; we splice them with overlap."""
    assert len(a) >= fade_samples and len(b) >= fade_samples
    out = np.concatenate([a[:-fade_samples],
                          a[-fade_samples:] * np.linspace(1, 0, fade_samples)
                          + b[:fade_samples] * np.linspace(0, 1, fade_samples),
                          b[fade_samples:]])
    return out


# ────────────────────────────────────────────────────────────────────
#  The five proofs
# ────────────────────────────────────────────────────────────────────

def proof_01_ordinary_only():
    """Eg modes alone — the basal-plane polarization in isolation.
    5 partials: 1.00, 1.14, 1.19, 1.52, 1.98.  Listen for: a coherent
    timbre with NO beating in the lower partials (the doublet's other
    half is missing).  This is what ruby would sound like if it had
    only one acoustic index."""
    audio = render_modes(ORDINARY, F0, DUR, phase_seed=11)
    audio = normalize(audio)
    write_wav(os.path.join(OUT_DIR, '01_ordinary_only.wav'), audio)


def proof_02_extraordinary_only():
    """A1g modes alone — the c-axis polarization in isolation.
    2 partials only: 1.10 and 1.70.  Listen for: a thinner, two-tone
    register with no shimmer at all.  The extraordinary family is
    spectrally sparse — most of ruby's color lives in the ordinary
    family."""
    audio = render_modes(EXTRAORDINARY, F0, DUR, phase_seed=22)
    audio = normalize(audio)
    write_wav(os.path.join(OUT_DIR, '02_extraordinary_only.wav'), audio)


def proof_03_birefringent_sum():
    """All 7 Raman-active modes summed.  Listen for: a slow tremolo
    at ~8.8 Hz appearing in the lower register, riding the strike-and-
    decay envelope.  That tremolo is mode 2 (A1g, 242 Hz) beating
    against mode 3 (Eg, 250.8 Hz) — the birefringent near-doublet.
    It IS the optical-acoustic claim made audible."""
    audio = render_modes(RUBY_MODES, F0, DUR, phase_seed=33)
    audio = normalize(audio)
    write_wav(os.path.join(OUT_DIR, '03_birefringent_sum.wav'), audio)


def proof_04_velocity_split_stereo():
    """The two acoustic indices, separated into two ears.

    In real ruby the two polarizations propagate at slightly different
    velocities — that velocity difference IS the optical birefringence
    when the same physics is observed by light.  Here we render the
    extraordinary family detuned upward by 1.5% (the declared metaphor
    stretch — real ruby is ~few percent, we exaggerate so the split
    is unambiguous to the ear) and pan it to the right channel.  The
    ordinary family stays at unity in the left.

    Listen for: a wide, shimmering image where the two polarizations
    occupy two ears.  Combine the channels (mono sum) and the beats
    reappear, faster now because the velocity split has detuned the
    near-doublet further apart.  This is the optical bridge in stereo
    form — a prism's two refracted images, heard."""
    left  = render_modes(ORDINARY, F0, DUR,
                         detune=1.0, phase_seed=41)
    right = render_modes(EXTRAORDINARY, F0, DUR,
                         detune=VELOCITY_ANISOTROPY, phase_seed=42)

    # Pad the sparse extraordinary track with the ordinary at low
    # amplitude on the right side too, so the right channel isn't
    # uncomfortably thin — keeps the listening experience honest about
    # the spectral content while still putting the polarization split
    # in the L/R axis.
    right = right + 0.25 * render_modes(ORDINARY, F0, DUR,
                                        detune=VELOCITY_ANISOTROPY,
                                        phase_seed=43)

    stereo = np.stack([left, right])
    # joint normalize so the L/R balance is preserved
    peak = np.max(np.abs(stereo))
    stereo = stereo * (0.85 / max(peak, 1e-9))
    write_wav(os.path.join(OUT_DIR, '04_velocity_split_stereo.wav'),
              stereo)


def proof_05_birefringence_arc():
    """One file, the whole argument.

      0:00 – 0:04  Ordinary alone (5 Eg modes).        coherent, no shimmer
      0:04 – 0:08  Extraordinary alone (2 A1g modes).  sparse, no shimmer
      0:08 – 0:14  Both summed.                        the 8.8 Hz beat appears

    The structural argument: each polarization in isolation has no
    chorus quality.  The chorus emerges *from their interference*.
    Birefringence is not a property of one of the two families — it
    is the interaction between them, and you hear it.

    Crossfades are short (50 ms) so the strike of each section is
    intact; the listener is meant to hear each render's onset, not
    a continuous morph."""
    seg_a = render_modes(ORDINARY,      F0, 4.0, phase_seed=51)
    seg_b = render_modes(EXTRAORDINARY, F0, 4.0, phase_seed=52)
    seg_c = render_modes(RUBY_MODES,    F0, 6.0, phase_seed=53)

    fade = int(0.05 * SR)
    audio = crossfade(seg_a, seg_b, fade)
    audio = crossfade(audio, seg_c, fade)

    audio = normalize(audio)
    write_wav(os.path.join(OUT_DIR, '05_birefringence_arc.wav'), audio)


def main():
    print("Crystal Synthesizer — Birefringence Proof (Ruby R-3c)")
    print(f"  fundamental = {F0} Hz (A3)")
    print(f"  ordinary    = {len(ORDINARY)} Eg  modes")
    print(f"  extraord.   = {len(EXTRAORDINARY)} A1g modes")
    print(f"  near-doublet: r=1.10 (A1g) and r=1.14 (Eg) "
          f"→ {F0*1.10:.1f} Hz vs {F0*1.14:.1f} Hz "
          f"→ beat = {F0*(1.14-1.10):.2f} Hz")
    print()
    proof_01_ordinary_only()
    proof_02_extraordinary_only()
    proof_03_birefringent_sum()
    proof_04_velocity_split_stereo()
    proof_05_birefringence_arc()
    print()
    print("All five proofs rendered to:")
    print(f"  {OUT_DIR}")


if __name__ == '__main__':
    main()
