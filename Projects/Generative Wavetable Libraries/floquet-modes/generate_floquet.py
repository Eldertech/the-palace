#!/usr/bin/env python3
"""
Floquet Modes wavetable — Phase 2 multi-source proof (NEW-SOURCE, gwl-steward-024).

The source archetype here is *algorithmic*, like crystal-bravais, but the
generating idea is [[Floquet Theory]]: the spectrum of a system whose
coefficients vary periodically in time. A linear oscillator driven by a
time-periodic parameter (a parametric / Mathieu oscillator) does not stay a
single sine — it grows a comb of *sidebands* spaced by the pump frequency
around a carrier, and the sideband structure broadens as the modulation depth
rises. That broadening is the audible signature of time-periodic modulation,
and it is what this wavetable sweeps.

SWEEP PARAMETER: modulation depth (the Floquet/Mathieu pump strength, written
here as the FM-style index `beta`). Position 0 -> beta=0 -> a pure carrier sine.
Position 1 -> beta high -> a dense, bright sideband cluster. One held note
blooms monotonically from sine to buzz as the wavetable position rises.

HONEST CAVEAT (parallel to crystal-bravais' note): this is not a stiff
numerical integration of the Mathieu equation. Near an instability tongue the
ODE solution blows up and will not normalize into a clean single cycle. Instead
we synthesize the *Floquet sideband spectrum* directly. A Floquet solution in a
stable band has the form

    x(t) = e^{i nu t} * SUM_k c_k e^{i k omega_pump t}

— a carrier at the Floquet exponent plus sidebands spaced by the pump. For a
parametric drive the sideband amplitudes follow the Bessel envelope J_k(beta),
exactly the classical FM/parametric sideband law. Using J_k(beta) gives a
clean, normalizable, monotonically-enriching single cycle that reduces to a
pure sine at beta=0 (J_0=1, all higher J_k=0). It is faithful to the Floquet
picture — sidebands from time-periodic modulation — without the ODE's
numerical fragility. Treat it as a first proof, honestly labelled.

Phase policy: ZERO_PHASE_RESET (matches crystal-bravais, gwl-steward-004) —
every frame's partials are zero-phase sines, so position sweeps stay coherent.

Writes BOTH formats from one run:
  - floquet_modes_ableton.wav  (mono 16-bit, 1024 samples/frame, no metadata)
  - floquet_modes.wav          (Serum/CLM, 32-bit float, 2048 samples/frame)
"""

import os
import sys
import wave
import numpy as np
from scipy.special import jv  # Bessel function of the first kind, J_k

# Reuse the byte-verified CLM/Serum writer from the crystal-bravais bundle.
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "crystal-bravais"))
from clm_writer import write_clm_wav, SERUM_FRAME_SIZE  # noqa: E402

# ----------------------------------------------------------------------------
# Format constants
# ----------------------------------------------------------------------------
SAMPLES_PER_FRAME = 1024          # Ableton's frame size
N_FRAMES = 64
SAMPLE_RATE = 44100               # nominal; synths read by frame, not by Hz
OUT_NAME = "floquet_modes_ableton.wav"

SERUM_OUT_NAME = "floquet_modes.wav"
SERUM_SAMPLES_PER_FRAME = SERUM_FRAME_SIZE   # 2048, required by Serum

# ----------------------------------------------------------------------------
# Floquet sideband model
# ----------------------------------------------------------------------------
# CARRIER_HARMONIC: the harmonic that carries the Floquet exponent. Anchored at
#   the fundamental (h=1) so the perceived PITCH is stable across the whole
#   sweep — the fundamental is present in every frame and the sidebands ride
#   upward from it. (A carrier placed mid-spectrum with two-sided sidebands is
#   the more exotic Mathieu-tongue variant, but its lower sidebands fill in
#   toward DC as beta grows, gliding the perceived pitch down ~3 octaves across
#   the sweep — wrong for a wavetable, where position should change TIMBRE at
#   constant pitch. That two-sided / period-doubling-tongue variant is logged as
#   future work in BUILD.md.)
# PUMP_HARMONIC: harmonic spacing of the sidebands (pump frequency in units of
#   the fundamental). 1 => sidebands on every consecutive harmonic.
# BETA_MAX: the largest modulation index reached at the bright end of the sweep.
CARRIER_HARMONIC = 1
PUMP_HARMONIC = 1
BETA_MAX = 9.0
N_SIDEBANDS = 60                  # k range considered (well past audible roll-off)


def synth_frame(beta, samples_per_frame=SAMPLES_PER_FRAME):
    """
    Synthesize one single-cycle Floquet-sideband frame at modulation depth beta.

    Partial at harmonic h = CARRIER_HARMONIC + k*PUMP_HARMONIC (k >= 0) gets
    amplitude |J_k(beta)| (the parametric/Mathieu sideband law, identical to the
    classical FM sideband law in a stable Floquet band). One-sided upward from
    the fundamental, so the perceived pitch is anchored. At beta=0 only k=0
    survives (J_0=1) => a pure fundamental sine. Every partial is a zero-phase
    sine (ZERO_PHASE_RESET).
    """
    t = np.linspace(0.0, 2.0 * np.pi, samples_per_frame, endpoint=False)
    frame = np.zeros(samples_per_frame, dtype=np.float64)

    for k in range(0, N_SIDEBANDS + 1):
        h = CARRIER_HARMONIC + k * PUMP_HARMONIC
        if h > samples_per_frame // 2:
            continue                      # above Nyquist for this frame size
        amp = abs(jv(k, beta))
        if amp < 1e-6:
            continue
        frame += amp * np.sin(h * t)

    return frame


def normalize(frame):
    peak = np.max(np.abs(frame))
    if peak < 1e-12:
        return frame
    return frame / peak


def build_table(n_frames, samples_per_frame):
    """
    Build the full table directly (no keyframe interpolation needed): beta is a
    continuous parameter, so we synthesize each of the n_frames positions at its
    own beta, evenly spaced from 0 to BETA_MAX. Each frame is peak-normalized so
    the sweep reads as a timbral bloom, not a level ride.
    """
    betas = np.linspace(0.0, BETA_MAX, n_frames)
    table = np.zeros((n_frames, samples_per_frame), dtype=np.float64)
    for i, beta in enumerate(betas):
        table[i] = normalize(synth_frame(beta, samples_per_frame))
    return table, betas


def write_ableton_wav(table, path):
    flat = table.reshape(-1)
    int16 = np.round(np.clip(flat, -1.0, 1.0) * 32767.0).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SAMPLE_RATE)
        w.writeframes(int16.tobytes())
    return int16.size


def spectral_centroid(frame):
    """Energy-weighted mean harmonic index — the brightness number we report."""
    spec = np.abs(np.fft.rfft(frame))
    spec[0] = 0.0
    total = spec.sum()
    if total < 1e-12:
        return 0.0
    idx = np.arange(spec.size)
    return float((idx * spec).sum() / total)


def main():
    here = os.path.dirname(__file__) or "."
    os.chdir(here)

    # ---- Ableton fallback (1024 samples/frame, 16-bit) ----
    table_ab, betas = build_table(N_FRAMES, SAMPLES_PER_FRAME)
    n_samples_ab = write_ableton_wav(table_ab, OUT_NAME)

    # ---- Serum / CLM (2048 samples/frame, 32-bit float) ----
    table_se, _ = build_table(N_FRAMES, SERUM_SAMPLES_PER_FRAME)
    serum_bytes = write_clm_wav(table_se, SERUM_OUT_NAME, sample_rate=SAMPLE_RATE)

    # ---- Distinctness / monotonicity check ----
    centroids = [spectral_centroid(table_ab[i]) for i in range(N_FRAMES)]
    n_partials = [int(np.sum(np.abs(np.fft.rfft(table_ab[i])) > 0.02 *
                             np.max(np.abs(np.fft.rfft(table_ab[i])))))
                  for i in range(N_FRAMES)]
    monotonic = all(centroids[i] <= centroids[i + 1] + 1e-6
                    for i in range(N_FRAMES - 1))

    print("Floquet Modes wavetable — NEW-SOURCE proof rendered")
    print(f"  frames:              {N_FRAMES}")
    print(f"  carrier harmonic:    {CARRIER_HARMONIC}  pump spacing: {PUMP_HARMONIC}")
    print(f"  beta sweep:          0.0 -> {BETA_MAX}")
    print()
    print("  ABLETON WAVETABLE FALLBACK")
    print(f"    samples/frame:     {SAMPLES_PER_FRAME}")
    print(f"    total samples:     {n_samples_ab} (= {N_FRAMES} x {SAMPLES_PER_FRAME})")
    print(f"    output:            {OUT_NAME}")
    print()
    print("  SERUM / CLM (also Vital, Surge XT, Pigments, Phase Plant, Falcon)")
    print(f"    samples/frame:     {SERUM_SAMPLES_PER_FRAME}")
    print(f"    file size:         {serum_bytes} bytes")
    print(f"    output:            {SERUM_OUT_NAME}")
    print()
    print("  SPECTRUM PROGRESSION (Ableton table)")
    print(f"    centroid harmonic: {centroids[0]:.2f} (pos 0) -> "
          f"{centroids[-1]:.2f} (pos 63)")
    print(f"    significant partials: {n_partials[0]} -> {n_partials[-1]}")
    print(f"    monotonic brightening: {monotonic}")
    print(f"  phase policy:        ZERO_PHASE_RESET")


if __name__ == "__main__":
    main()
