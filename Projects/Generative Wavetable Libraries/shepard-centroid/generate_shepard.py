#!/usr/bin/env python3
"""
Shepard-stack wavetable — Phase 2 listenable proof (CENTROID-FREQ).

Decision lineage: gwl-steward-015 / gwl-steward-018 -> GRANTED CENTROID-FREQ.
The wavetable POSITION drives the spectral-centroid FREQUENCY of a Shepard
octave stack: low position emphasises the low octaves (dark), high position
emphasises the high octaves (airy). Sweeping the table is a brightness/timbre
knob that travels up the Shepard cloud.

The Shepard stack:
  - One pitch class stacked across octaves -> partials at octave-spaced
    harmonics k = 1, 2, 4, 8, ... 256 (nine octaves). Octave-spaced harmonics
    are integer harmonics, so each one is perfectly periodic inside a single
    wavetable cycle: no edge discontinuity, no aliasing below Nyquist.
  - A Gaussian amplitude envelope over OCTAVE INDEX o = log2(k). The centre of
    that bell, mu, is what the table position sweeps. sigma is wide enough that
    several octaves always sound at once -> the table never collapses to a bare
    sine at the extremes, and the "all-octaves, edges-faded" Shepard character
    is preserved at every frame.

This is the cross-steward multi-source test: the static centroid building-block
is the Shepard Tone Synthesizer steward's Stage-1 drone recipe (same octave
stack, fixed Gaussian). Here that fixed bell is set in MOTION by the table.

Phase policy: ZERO_PHASE_RESET (gwl-steward-004). Every partial is a sine
starting at phase 0, fundamental-locked. Clean, predictable sweeps.

Outputs:
  - shepard_centroid.wav            Serum/CLM, 32-bit float, 2048 samples/frame
  - shepard_centroid_ableton.wav    Ableton fallback, mono 16-bit, 1024/frame
  - shepard_centroid_audition_sweep.wav
        the SMALLEST UNIT THAT EXERCISES EVERY PARAMETER: one held note
        (A2, 110 Hz) while the table position sweeps 0 -> 1 over 12 s, rendered
        through real wavetable playback (per-sample frame + within-frame
        interpolation). This is the audition seed for the ear gate.
"""

import sys
import wave
from pathlib import Path

import numpy as np

# Reuse the cycle-6 reference-verified CLM writer from the crystal-bravais bundle.
_here = Path(__file__).resolve().parent
sys.path.insert(0, str(_here.parent / "crystal-bravais"))
from clm_writer import write_clm_wav, SERUM_FRAME_SIZE  # noqa: E402

# ----------------------------------------------------------------------------
# Format constants
# ----------------------------------------------------------------------------
ABLETON_SAMPLES_PER_FRAME = 1024
SERUM_SAMPLES_PER_FRAME = SERUM_FRAME_SIZE  # 2048
N_FRAMES = 64
SAMPLE_RATE = 44100

ABLETON_OUT = "shepard_centroid_ableton.wav"
SERUM_OUT = "shepard_centroid.wav"
AUDITION_OUT = "shepard_centroid_audition_sweep.wav"

# ----------------------------------------------------------------------------
# Shepard stack parameters
# ----------------------------------------------------------------------------
N_OCTAVES = 9          # k = 2**0 .. 2**8  -> harmonics 1..256 (safe < Nyquist
                       # for both 1024- and 2048-sample frames)
MU_LOW = 1.0           # centroid at octave 1 (2nd partial) -> dark frame 0
MU_HIGH = 7.0          # centroid at octave 7 (128th partial) -> bright last frame
SIGMA = 1.6            # bell width in octaves; keeps several octaves audible at
                       # every position so the Shepard cloud never thins to a sine


def shepard_frame(mu, sigma=SIGMA, n_octaves=N_OCTAVES,
                  samples_per_frame=ABLETON_SAMPLES_PER_FRAME):
    """One single-cycle frame: octave stack under a Gaussian centred at `mu`."""
    t = np.linspace(0.0, 2.0 * np.pi, samples_per_frame, endpoint=False)
    frame = np.zeros(samples_per_frame, dtype=np.float64)
    for o in range(n_octaves):
        k = 2 ** o                                   # octave-spaced harmonic
        amp = np.exp(-((o - mu) ** 2) / (2.0 * sigma ** 2))
        frame += amp * np.sin(k * t)                 # zero-phase
    return frame


def normalize(frame):
    peak = np.max(np.abs(frame))
    return frame if peak < 1e-12 else frame / peak


def build_table(n_frames=N_FRAMES, samples_per_frame=ABLETON_SAMPLES_PER_FRAME):
    """Position p in [0,1] -> centroid mu(p); one normalized frame per position."""
    table = np.zeros((n_frames, samples_per_frame), dtype=np.float64)
    for i in range(n_frames):
        p = i / (n_frames - 1)
        mu = MU_LOW + p * (MU_HIGH - MU_LOW)
        table[i] = normalize(shepard_frame(mu, samples_per_frame=samples_per_frame))
    return table


def write_ableton_wav(table, path, sample_rate=SAMPLE_RATE):
    flat = np.clip(table.reshape(-1), -1.0, 1.0)
    int16 = np.round(flat * 32767.0).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sample_rate)
        w.writeframes(int16.tobytes())
    return int16.size


def render_sweep(table, f0=110.0, dur=12.0, sample_rate=SAMPLE_RATE):
    """
    Faithful wavetable playback: a held note at f0 while the table position
    sweeps 0 -> 1 over `dur` seconds. Linear interpolation both within a frame
    (phase) and across frames (position) -- exactly what the synth osc does.
    """
    n = int(dur * sample_rate)
    n_frames, fsize = table.shape
    idx = np.arange(n)

    # phase accumulator: one wavetable cycle == one period of f0
    phase = (f0 / sample_rate * idx) % 1.0
    sample_pos = phase * fsize
    s0 = np.floor(sample_pos).astype(int) % fsize
    s1 = (s0 + 1) % fsize
    fr = sample_pos - np.floor(sample_pos)

    # position sweep 0 -> 1
    p = idx / (n - 1)
    fpos = p * (n_frames - 1)
    f0i = np.floor(fpos).astype(int)
    f1i = np.minimum(f0i + 1, n_frames - 1)
    frac_f = fpos - f0i

    a = table[f0i, s0] * (1.0 - fr) + table[f0i, s1] * fr
    b = table[f1i, s0] * (1.0 - fr) + table[f1i, s1] * fr
    out = a * (1.0 - frac_f) + b * frac_f

    # gentle attack/release so the seed has no clicks
    env = np.ones(n)
    ramp = int(0.05 * sample_rate)
    env[:ramp] = np.linspace(0.0, 1.0, ramp)
    env[-ramp:] = np.linspace(1.0, 0.0, ramp)
    out *= env

    peak = np.max(np.abs(out))
    if peak > 1e-12:
        out = out / peak * 0.95

    int16 = np.round(np.clip(out, -1.0, 1.0) * 32767.0).astype(np.int16)
    with wave.open(AUDITION_OUT, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sample_rate)
        w.writeframes(int16.tobytes())
    return n


def spectral_centroid_octaves(frame):
    """Measured spectral centroid of a frame, in octave units (for the report)."""
    spec = np.abs(np.fft.rfft(frame))
    spec[0] = 0.0
    ks = np.arange(len(spec))
    mass = spec.sum()
    if mass < 1e-12:
        return 0.0
    mean_k = (ks * spec).sum() / mass
    return np.log2(max(mean_k, 1.0))


def main():
    # ---- Ableton fallback (1024/frame, 16-bit) ----
    table_ab = build_table(samples_per_frame=ABLETON_SAMPLES_PER_FRAME)
    n_ab = write_ableton_wav(table_ab, ABLETON_OUT)

    # ---- Serum / CLM (2048/frame, 32-bit float) ----
    table_se = build_table(samples_per_frame=SERUM_SAMPLES_PER_FRAME)
    serum_bytes = write_clm_wav(table_se, SERUM_OUT, sample_rate=SAMPLE_RATE)

    # ---- Audition seed: one held note, position swept 0 -> 1 ----
    n_aud = render_sweep(table_ab)

    print("Shepard-stack wavetable (CENTROID-FREQ) — Phase 2 proof rendered")
    print(f"  octaves in stack:    {N_OCTAVES} (harmonics 1..{2**(N_OCTAVES-1)})")
    print(f"  centroid sweep:      octave {MU_LOW} -> {MU_HIGH}  (sigma={SIGMA})")
    print(f"  frames:              {N_FRAMES}")
    print()
    print("  ABLETON FALLBACK")
    print(f"    samples/frame:     {ABLETON_SAMPLES_PER_FRAME}")
    print(f"    total samples:     {n_ab} (= {N_FRAMES} x {ABLETON_SAMPLES_PER_FRAME})")
    print(f"    output:            {ABLETON_OUT}")
    print()
    print("  SERUM / CLM")
    print(f"    samples/frame:     {SERUM_SAMPLES_PER_FRAME}")
    print(f"    file size:         {serum_bytes} bytes")
    print(f"    output:            {SERUM_OUT}")
    print()
    print("  AUDITION SEED")
    print(f"    {n_aud} samples (~{n_aud/SAMPLE_RATE:.1f}s) held A2, position 0->1")
    print(f"    output:            {AUDITION_OUT}")
    print()
    # Distinctness check: measured centroid must climb monotonically.
    c_first = spectral_centroid_octaves(table_ab[0])
    c_mid = spectral_centroid_octaves(table_ab[N_FRAMES // 2])
    c_last = spectral_centroid_octaves(table_ab[-1])
    print("  distinctness (measured spectral centroid, octave units):")
    print(f"    frame 0:   {c_first:.2f}")
    print(f"    frame 32:  {c_mid:.2f}")
    print(f"    frame 63:  {c_last:.2f}")
    print(f"    monotonic climb: {c_first < c_mid < c_last}")


if __name__ == "__main__":
    main()
