"""
Shimmer Cloud — Stage 1 unit
=============================
ONE moving acoustic lens.

The lens hears the dry signal and re-projects it back, slightly higher in
pitch, slightly delayed, slightly drifting. Each re-projection is itself
re-projected by the same lens — that's the feedback loop. The "moving"
quality comes from a slow chorus drift inside the loop, which makes the
pitch-shifted re-projections wobble against themselves.

This is the atom of Shimmer Cloud. The cloud (Stage 2+) will be a
population of these.

Architecture (per generation k = 1..N):
    dry → pitch_shift(+12 + tiny detune) → lowpass → chorus_drift
        → place at delay k*Δt with gain feedback^k → sum into shimmer

Final = dry + shimmer

The lowpass prevents infinite octave-stacking from running away into
ultrasonic content. The detune-per-generation breaks coherence so the
shimmer doesn't sound like a clean octave.
"""
import numpy as np
import scipy.signal as sps
import librosa
import soundfile as sf
from pathlib import Path


def lowpass(x, sr, cutoff=7500, order=4):
    # Clamp cutoff to just below Nyquist
    cutoff = min(cutoff, sr * 0.49)
    sos = sps.butter(order, cutoff, btype="low", fs=sr, output="sos")
    return sps.sosfilt(sos, x)


def chorus_drift(x, sr, depth_ms=1.2, rate_hz=0.4, phase=0.0):
    """A slow time-varying fractional delay — the 'movement' of the lens.

    Without this, repeated pitch shifts produce a static stack. With it,
    each generation breathes independently.
    """
    n = len(x)
    t = np.arange(n) / sr
    delay_samples = depth_ms * 1e-3 * sr * (1 + np.sin(2 * np.pi * rate_hz * t + phase)) / 2
    indices = np.arange(n) - delay_samples
    indices = np.clip(indices, 0, n - 1.0001)
    i_int = indices.astype(int)
    i_frac = indices - i_int
    return (1 - i_frac) * x[i_int] + i_frac * x[i_int + 1]


def moving_lens(
    dry,
    sr,
    semitones=12.0,
    generations=6,
    delay_ms=45.0,
    feedback=0.62,
    lpf_cutoff=7200,
    drift_depth_ms=1.4,
    drift_rate_hz=0.4,
    detune_cents=2.5,
    tail_seconds=3.0,
    wet_mix=0.85,
    dry_mix=1.0,
    seed=7,
):
    rng = np.random.default_rng(seed)
    pad = int(tail_seconds * sr)
    out_len = len(dry) + pad
    dry_padded = np.concatenate([dry.astype(np.float64), np.zeros(pad)])

    current = dry.astype(np.float64)
    shimmer = np.zeros(out_len, dtype=np.float64)
    delay_samples = int(delay_ms * 1e-3 * sr)

    for k in range(generations):
        # Per-generation tiny detune so octaves don't lock together
        sk = semitones + rng.uniform(-detune_cents, detune_cents) / 100.0
        shifted = librosa.effects.pitch_shift(current, sr=sr, n_steps=sk, res_type="soxr_hq")

        # Roll off highs each pass — prevents runaway octave stack
        shifted = lowpass(shifted, sr, cutoff=lpf_cutoff)

        # The 'moving' part: slow chorus drift, different phase per gen
        shifted = chorus_drift(
            shifted,
            sr,
            depth_ms=drift_depth_ms,
            rate_hz=drift_rate_hz * (1 + 0.27 * k),
            phase=k * 1.7,
        )

        offset = (k + 1) * delay_samples
        end = min(offset + len(shifted), out_len)
        shimmer[offset:end] += (feedback ** (k + 1)) * shifted[: end - offset]

        current = shifted

    wet = dry_mix * dry_padded + wet_mix * shimmer

    peak = np.max(np.abs(wet))
    if peak > 0.95:
        wet *= 0.95 / peak
    return wet


def main():
    here = Path(__file__).parent
    dry_path = here / "dry.wav"
    wet_path = here / "wet.wav"

    dry, sr = sf.read(str(dry_path))
    if dry.ndim > 1:
        dry = dry.mean(axis=1)
    print(f"Loaded dry: {len(dry)/sr:.2f}s @ {sr}Hz")

    wet = moving_lens(dry, sr)
    sf.write(str(wet_path), wet.astype(np.float32), sr)
    print(f"Wrote wet: {len(wet)/sr:.2f}s → {wet_path}")


if __name__ == "__main__":
    main()
