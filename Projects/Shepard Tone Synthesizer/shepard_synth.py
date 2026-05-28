"""Shepard Tone Synthesizer — Stage 1 (MINIMUM-ILLUSION).

The simplest possible Shepard tone: a static drone built from a single
pitch class stacked across seven octaves, weighted by a Gaussian envelope
in log-frequency space. There is no motion, no portamento, no per-voice
filter, no key tracking. This is the illusion-as-a-thing-in-itself —
before any musical control is layered on top.

The pedagogical claim this implementation makes:
    A Shepard tone is NOT a special oscillator. It is an envelope-shaped
    octave stack of plain sine waves. Once you can see and hear the
    envelope, the rest of the illusion (ascent, descent, glide) is just
    motion of input on top of the same recipe.

Stage 1 deliberately omits:
    - any pitch motion (Stage 2 will add discrete pitch-class motion — ASCENT-FIRST grant)
    - any portamento (Stage 3 will introduce the glide and the
      monophonic-stack-portamento problem from the home entry)
    - per-voice filtering (later stages)
    - microtuning / inharmonicity (later stages)

The interface accepts:
    - pitch_class:  int in {0..11} (0=C, 1=C#, ..., 11=B), OR
                    a MIDI note number — the pitch CLASS is extracted as note % 12,
                    so MIDI 60 (C4) and MIDI 72 (C5) both render the same static drone.
                    This is the octave-equivalence axiom enforced at the API.

The interface returns:
    - audio:  numpy.ndarray, shape (n_samples,), dtype float32, range ~[-1, 1]

Pairs with [[Octave Equivalence]] §"Stage 1 — A Static Drone Is Already An Illusion"
(draft pending Loudon's approval — see this cycle's TRICKSTER ask).

Author: Shepard Tone Synthesizer (palace steward, cycle 3, 2026-05-27)
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Sequence

import numpy as np


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

# A4 = 440 Hz is the tuning reference. MIDI 69 = A4.
A4_HZ = 440.0
A4_MIDI = 69

# The seven-octave stack. We pick C1..C7 (or equivalent for any pitch class)
# so that the Gaussian envelope's centroid lands near C4 and the audible
# band is well-populated. This is the default stack; pass `octaves` to override.
DEFAULT_OCTAVES = (1, 2, 3, 4, 5, 6, 7)

# Envelope centroid in log2(Hz). log2(261.63) ≈ 8.03 ≈ C4. Stage 1 uses
# a fixed centroid — this is the *global Shepard filter* described in the
# home entry, implemented as an amplitude envelope rather than a literal
# bandpass (mathematically equivalent for pure sines).
DEFAULT_CENTROID_LOG2HZ = math.log2(261.6255653005986)  # C4

# Sigma is in *octaves*, not Hz. A sigma of 1.0 means the envelope is
# ~half-amplitude one octave away from the centroid. This is the
# "two-octave bright zone" the home entry calls for.
DEFAULT_SIGMA_OCTAVES = 1.0


# ---------------------------------------------------------------------------
# Data
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class ShepardStage1Params:
    """All parameters of the Stage 1 static-drone Shepard tone.

    Every field has a sensible default; the only required input is
    pitch_class (or a MIDI note from which a pitch class is extracted).
    """

    pitch_class: int                          # 0..11 (or any int — taken mod 12)
    duration_s: float = 4.0
    sample_rate: int = 48_000
    octaves: Sequence[int] = DEFAULT_OCTAVES
    centroid_log2hz: float = DEFAULT_CENTROID_LOG2HZ
    sigma_octaves: float = DEFAULT_SIGMA_OCTAVES
    peak_amplitude: float = 0.5               # headroom; safe against clipping after sum
    fade_ms: float = 25.0                     # linear fade in/out, kills DC click


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def pitch_class_to_octave_frequencies(pitch_class: int,
                                      octaves: Sequence[int] = DEFAULT_OCTAVES) -> np.ndarray:
    """Return the absolute Hz for each octave of a given pitch class.

    `pitch_class` may be a literal pitch class (0..11) or a MIDI note —
    we take it mod 12. Octave numbers follow scientific pitch notation
    (C4 = MIDI 60). This means pitch class 0 in octave 4 is C4 (~261.63 Hz).

    Octave equivalence is the axiom enforced here: MIDI 60 and MIDI 72
    produce identical frequency arrays.
    """
    pc = pitch_class % 12
    # MIDI note number for pitch class `pc` at octave `oct`:
    #   midi = 12 * (oct + 1) + pc
    # (C-1 = MIDI 0, so C0 = MIDI 12, C4 = MIDI 60.)
    midi_numbers = np.array([12 * (oct + 1) + pc for oct in octaves], dtype=np.float64)
    return A4_HZ * np.power(2.0, (midi_numbers - A4_MIDI) / 12.0)


def gaussian_envelope_log2(frequencies_hz: np.ndarray,
                           centroid_log2hz: float = DEFAULT_CENTROID_LOG2HZ,
                           sigma_octaves: float = DEFAULT_SIGMA_OCTAVES) -> np.ndarray:
    """Compute the Gaussian amplitude envelope for each octave voice.

    The envelope is Gaussian in log2-frequency space — this is what makes
    octaves equally weighted at equal *perceptual* distance. A literal
    bandpass in Hz would over-weight the lower octaves (they're closer
    together in absolute frequency).

    Returns weights in [0, 1], one per input frequency.
    """
    log2_freqs = np.log2(frequencies_hz)
    distance_octaves = log2_freqs - centroid_log2hz
    weights = np.exp(-(distance_octaves ** 2) / (2.0 * sigma_octaves ** 2))
    return weights


def render_stage1(params: ShepardStage1Params) -> np.ndarray:
    """Render the Stage 1 (MINIMUM-ILLUSION) Shepard drone.

    Returns mono float32 audio at `params.sample_rate`.

    The algorithm is intentionally transparent:
        1. Build the seven octave frequencies for the input pitch class.
        2. Compute a Gaussian-in-log2 envelope, one weight per octave.
        3. Sum sine waves at those frequencies, weighted by that envelope.
        4. Normalize to `peak_amplitude` and apply a short linear fade
           in/out to suppress the start/stop click.

    No motion, no glide, no per-voice filter. The illusion is the
    envelope, and Stage 1 makes that envelope visible to the ear by
    refusing to add anything else.
    """
    n_samples = int(round(params.duration_s * params.sample_rate))
    if n_samples <= 0:
        return np.zeros(0, dtype=np.float32)

    frequencies = pitch_class_to_octave_frequencies(
        params.pitch_class, params.octaves
    )
    weights = gaussian_envelope_log2(
        frequencies,
        centroid_log2hz=params.centroid_log2hz,
        sigma_octaves=params.sigma_octaves,
    )

    # Sanity: drop any voice whose frequency exceeds Nyquist. This
    # silently prevents aliasing if a caller passes a very high octave.
    nyquist = params.sample_rate / 2.0
    audible = frequencies < nyquist
    frequencies = frequencies[audible]
    weights = weights[audible]

    # Time axis, shape (n_samples,)
    t = np.arange(n_samples, dtype=np.float64) / params.sample_rate

    # Sum the weighted sines. Vectorized as an outer product to keep
    # the code one expression — this is the entire Stage 1 illusion in
    # three lines.
    phases = 2.0 * math.pi * np.outer(frequencies, t)  # (n_voices, n_samples)
    voices = weights[:, None] * np.sin(phases)        # (n_voices, n_samples)
    audio = voices.sum(axis=0)                        # (n_samples,)

    # Normalize to the requested peak. We deliberately do not RMS-
    # normalize — Stage 1's amplitude statement IS the envelope's
    # contribution to perceived loudness across pitch classes.
    peak = np.max(np.abs(audio))
    if peak > 0:
        audio = audio * (params.peak_amplitude / peak)

    # Linear fade in/out to kill the on/off click.
    fade_n = max(1, int(round(params.fade_ms * 1e-3 * params.sample_rate)))
    fade_n = min(fade_n, n_samples // 2)
    if fade_n > 0:
        ramp = np.linspace(0.0, 1.0, fade_n, dtype=np.float64)
        audio[:fade_n] *= ramp
        audio[-fade_n:] *= ramp[::-1]

    return audio.astype(np.float32)


def render_pitch_class_drone(pitch_class: int,
                             duration_s: float = 4.0,
                             sample_rate: int = 48_000) -> np.ndarray:
    """Convenience wrapper: one pitch class in, mono float32 audio out.

    This is the smallest interface the GSL steward can call to adapt
    Shepard into a sample library (per the SHEPARD-DRIVES grant —
    twelve drones, one per chromatic pitch class).
    """
    return render_stage1(ShepardStage1Params(
        pitch_class=pitch_class,
        duration_s=duration_s,
        sample_rate=sample_rate,
    ))


# ---------------------------------------------------------------------------
# CLI / smoke test
# ---------------------------------------------------------------------------

def _write_wav(path: str, audio: np.ndarray, sample_rate: int) -> None:
    """Minimal 16-bit PCM WAV writer (no scipy dependency for callers
    who don't want it)."""
    import wave

    pcm = np.clip(audio, -1.0, 1.0)
    pcm = (pcm * 32767.0).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sample_rate)
        w.writeframes(pcm.tobytes())


def _smoke_test(out_dir: str = ".") -> None:
    """Render a C drone and an F# drone so a listener can confirm the
    pitch-class axis is heard but no octave motion appears."""
    import os
    os.makedirs(out_dir, exist_ok=True)
    for pc, name in [(0, "C"), (6, "F-sharp")]:
        audio = render_pitch_class_drone(pc, duration_s=4.0)
        path = os.path.join(out_dir, f"stage1_drone_{name}.wav")
        _write_wav(path, audio, 48_000)
        print(f"wrote {path}  (n={len(audio)} samples, peak={np.max(np.abs(audio)):.3f})")


if __name__ == "__main__":
    _smoke_test()
