#!/usr/bin/env python3
"""
Crystal Bravais wavetable — Phase 1 listenable proof.

Sweeps the seven Bravais crystal lattice systems (cubic -> triclinic) as one
wavetable position. Pure-numpy synthesis + interpolation. Writes the
Ableton-Wavetable fallback format (mono 16-bit, 1024 samples/frame, no
metadata chunk) using only the stdlib `wave` module.

This is a FIRST PROOF, not a physically rigorous lattice model. The partial
recipes are a deliberately simplified mapping from lattice symmetry to timbre:
the more symmetric the system, the fewer/cleaner the partials; the less
symmetric, the denser and more detuned. The goal is an audibly intentional
sweep, honestly labelled as a sketch.

Phase policy: ZERO_PHASE_RESET. Every single-cycle frame is synthesized
starting from phase 0 (sines start at 0, all partials phase-locked to the
fundamental). This is Loudon's chosen policy (gwl-steward-004): clean,
predictable sweeps with no phase drift between frames. Carry-through phase can
be exposed later if the motion feels tame.

NO CLM/Serum binary writer here — that is held until a known-good reference
Serum WAV is confirmed on the Mac.
"""

import wave
import struct
import numpy as np

# ----------------------------------------------------------------------------
# Format constants — Ableton Wavetable fallback
# ----------------------------------------------------------------------------
SAMPLES_PER_FRAME = 1024
N_FRAMES = 64
SAMPLE_RATE = 44100            # nominal; Ableton reads the table by frame, not Hz
OUT_NAME = "crystal_bravais_ableton.wav"

# ----------------------------------------------------------------------------
# The seven Bravais crystal systems, ordered most -> least symmetric.
# ----------------------------------------------------------------------------
# Simplified, honest model:
#   - `n_partials`  : how many harmonics participate. High symmetry = sparse,
#                     pure spectrum. Low symmetry = dense, busy spectrum.
#   - `rolloff`     : amplitude decay exponent over partial index. Higher = the
#                     spectrum thins toward a near-sine. Lower = brighter/buzzier.
#   - `detune_cents`: max inharmonic detune applied to upper partials, scaled by
#                     partial index. Symmetry breaking -> the crystal "rings"
#                     inharmonically. Cubic = 0 (perfectly harmonic).
#   - `odd_bias`    : >1 favours odd harmonics (hollow/square-ish), modelling
#                     the loss of axes/planes as symmetry drops.
#
# The ordering (cubic, hexagonal, tetragonal, rhombohedral/trigonal,
# orthorhombic, monoclinic, triclinic) follows decreasing point-group symmetry,
# which is the spine of the sweep.
BRAVAIS_SYSTEMS = [
    # name,           n_partials, rolloff, detune_cents, odd_bias
    ("cubic",                  3,    1.30,          0.0,     1.0),
    ("hexagonal",              6,    1.10,          4.0,     1.0),
    ("tetragonal",             9,    0.95,          9.0,     1.15),
    ("rhombohedral",          13,    0.85,         16.0,     1.25),
    ("orthorhombic",          18,    0.78,         24.0,     1.4),
    ("monoclinic",            26,    0.70,         34.0,     1.6),
    ("triclinic",             36,    0.62,         48.0,     1.85),
]


def cents_to_ratio(cents):
    """Convert a detune in cents to a frequency-ratio multiplier."""
    return 2.0 ** (cents / 1200.0)


def synth_frame(n_partials, rolloff, detune_cents, odd_bias):
    """
    Synthesize one single-cycle frame for a Bravais system.

    ZERO_PHASE_RESET: t spans exactly one period [0, 2*pi); every partial is a
    pure sine starting at phase 0. Detune is applied to the *frequency* of
    upper partials, so the cycle is no longer strictly periodic at the buffer
    edge — but because every frame resets to the same reference, sweeps stay
    coherent frame-to-frame. (This is the predictable-sweep tradeoff Loudon
    asked for; the small edge discontinuity from detuned partials is the price
    of audibly "inharmonic" low-symmetry systems.)
    """
    t = np.linspace(0.0, 2.0 * np.pi, SAMPLES_PER_FRAME, endpoint=False)
    frame = np.zeros(SAMPLES_PER_FRAME, dtype=np.float64)

    for k in range(1, n_partials + 1):
        # Amplitude: power-law rolloff over partial index.
        amp = 1.0 / (k ** rolloff)

        # Odd-harmonic bias: gently suppress even harmonics as symmetry drops.
        if k % 2 == 0:
            amp /= odd_bias

        # Detune upper partials inharmonically; scaled so partial 1 (the
        # fundamental) is never detuned -> the pitch stays anchored.
        partial_detune = detune_cents * ((k - 1) / max(1, n_partials - 1))
        freq_mult = k * cents_to_ratio(partial_detune)

        # Zero-phase sine.
        frame += amp * np.sin(freq_mult * t)

    return frame


def normalize(frame):
    """Peak-normalize to +/-1.0, guarding against silence."""
    peak = np.max(np.abs(frame))
    if peak < 1e-12:
        return frame
    return frame / peak


def build_keyframes():
    """Synthesize the 7 normalized single-cycle keyframes (one per system)."""
    keyframes = []
    for name, n_partials, rolloff, detune, odd_bias in BRAVAIS_SYSTEMS:
        f = synth_frame(n_partials, rolloff, detune, odd_bias)
        keyframes.append(normalize(f))
    return np.array(keyframes)  # shape (7, 1024)


def interpolate_table(keyframes, n_frames):
    """
    Linearly interpolate the 7 keyframes into `n_frames` frames.

    The 7 keyframes are pinned to evenly spaced positions across [0, 1]; the
    output frames sample that line uniformly. Each interpolated frame is
    re-normalized so the morph between systems never dips in level (crossfading
    two normalized cycles can otherwise lose amplitude mid-blend).
    """
    n_key = keyframes.shape[0]
    key_positions = np.linspace(0.0, 1.0, n_key)
    out_positions = np.linspace(0.0, 1.0, n_frames)

    table = np.zeros((n_frames, keyframes.shape[1]), dtype=np.float64)
    for i, pos in enumerate(out_positions):
        # Find the bracketing keyframes and the blend factor.
        idx = np.searchsorted(key_positions, pos, side="right") - 1
        idx = np.clip(idx, 0, n_key - 2)
        span = key_positions[idx + 1] - key_positions[idx]
        frac = 0.0 if span == 0 else (pos - key_positions[idx]) / span
        blend = (1.0 - frac) * keyframes[idx] + frac * keyframes[idx + 1]
        table[i] = normalize(blend)
    return table


def write_ableton_wav(table, path):
    """
    Write frames concatenated as a mono 16-bit PCM WAV at SAMPLE_RATE.

    Ableton's Wavetable reads a plain WAV in fixed-frame chunks of 1024
    samples. No vendor metadata chunk is written — this is the fallback format
    that works without Serum's `clm ` chunk.
    """
    flat = table.reshape(-1)  # (N_FRAMES * 1024,)
    # Clip then convert to signed 16-bit.
    clipped = np.clip(flat, -1.0, 1.0)
    int16 = np.round(clipped * 32767.0).astype(np.int16)

    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SAMPLE_RATE)
        w.writeframes(int16.tobytes())

    return int16.size


def main():
    keyframes = build_keyframes()
    table = interpolate_table(keyframes, N_FRAMES)
    n_samples = write_ableton_wav(table, OUT_NAME)

    print("Crystal Bravais wavetable — proof rendered")
    print(f"  systems (keyframes): {len(BRAVAIS_SYSTEMS)} "
          f"({', '.join(s[0] for s in BRAVAIS_SYSTEMS)})")
    print(f"  frames:              {N_FRAMES}")
    print(f"  samples/frame:       {SAMPLES_PER_FRAME}")
    print(f"  total samples:       {n_samples} "
          f"(= {N_FRAMES} x {SAMPLES_PER_FRAME})")
    print(f"  format:              mono 16-bit PCM @ {SAMPLE_RATE} Hz, no metadata chunk")
    print(f"  phase policy:        ZERO_PHASE_RESET")
    print(f"  output:              {OUT_NAME}")


if __name__ == "__main__":
    main()
