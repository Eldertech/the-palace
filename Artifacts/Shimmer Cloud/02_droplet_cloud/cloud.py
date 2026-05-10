"""
Shimmer Cloud — Stage 2: the droplet cloud
==========================================

Where Stage 1 was a single moving lens with feedback, this is a
*population* model: hundreds of droplets, each a slightly-rate-shifted
copy of the dry input, panned randomly across the stereo field,
started at slightly random times.

The fractal recursion holds: each droplet is a tiny moving lens (its
rate IS its motion through pitch/time), and the cloud is the population
of those lenses. Many droplets, very subtle differences between them.

DESIGN CHOICE — pitch and time are coupled.
Each droplet is produced by *resampling* the dry signal at a slightly
different rate, not by time-preserving pitch shift. A droplet at +5 cents
is shorter than one at unison. This is the physics: a moving lens
necessarily compresses or stretches what it re-projects. Over a longer
input the differing rates make droplets slowly diverge in time — they
"fall out of time" with each other naturally, no extra machinery needed.

PARAMETERS

    n_droplets               How many lenses in the cloud (50–2500+)
    pitch_target_semitones   Center of the pitch distribution
    pitch_spread_cents       Std-dev of pitch jitter around target (Gaussian)
    time_spread_ms           Range of start-time offsets (uniform)
    pan_spread               0 = mono, 1 = full stereo
    amp_jitter               How much droplet-to-droplet amplitude varies
    fade_in_ms / fade_out_ms Per-droplet envelope (so they don't click)
"""
from __future__ import annotations

from pathlib import Path

import numpy as np
import soundfile as sf


def _resample_linear(x: np.ndarray, rate: float) -> np.ndarray:
    """Linear-interp resample. rate > 1 → output shorter (faster, higher pitch)."""
    n_in = len(x)
    n_out = max(1, int(round(n_in / rate)))
    read_pos = np.arange(n_out) * rate
    i_int = np.clip(read_pos.astype(np.int64), 0, n_in - 2)
    i_frac = read_pos - i_int
    return (1 - i_frac) * x[i_int] + i_frac * x[i_int + 1]


def droplet_cloud(
    dry: np.ndarray,
    sr: int,
    n_droplets: int = 300,
    pitch_target_semitones: float = 0.0,
    pitch_spread_cents: float = 5.0,
    time_spread_ms: float = 300.0,
    pan_spread: float = 1.0,
    amp_jitter: float = 0.3,
    fade_in_ms: float = 4.0,
    fade_out_ms: float = 60.0,
    tail_seconds: float = 3.0,
    seed: int = 42,
) -> np.ndarray:
    """Render a stereo droplet cloud over the dry input. Returns shape (N, 2)."""
    rng = np.random.default_rng(seed)
    if dry.ndim > 1:
        dry = dry.mean(axis=1)
    dry = dry.astype(np.float64)

    out_len = len(dry) + int((time_spread_ms / 1000.0 + tail_seconds) * sr)
    output = np.zeros((out_len, 2), dtype=np.float64)

    fade_in = max(1, int(fade_in_ms * 1e-3 * sr))
    fade_out = max(1, int(fade_out_ms * 1e-3 * sr))
    fade_in_curve = np.linspace(0.0, 1.0, fade_in)
    fade_out_curve = np.linspace(1.0, 0.0, fade_out)

    for _ in range(n_droplets):
        # Pitch via Gaussian cents around target
        cents = pitch_target_semitones * 100.0 + rng.normal(0.0, pitch_spread_cents)
        rate = 2.0 ** (cents / 1200.0)

        droplet = _resample_linear(dry, rate)

        # Per-droplet envelope so droplets don't click on overlap
        if len(droplet) > fade_in:
            droplet[:fade_in] *= fade_in_curve
        if len(droplet) > fade_out:
            droplet[-fade_out:] *= fade_out_curve

        # Amplitude jitter (so dense clouds breathe)
        amp = 1.0 - rng.uniform(0.0, amp_jitter)
        droplet *= amp

        # Equal-power pan
        pan = rng.uniform(-pan_spread, pan_spread)
        theta = (pan + 1.0) * np.pi / 4.0
        gain_l = np.cos(theta)
        gain_r = np.sin(theta)

        # Start time
        start = int(rng.uniform(0.0, time_spread_ms) * 1e-3 * sr)
        end = min(start + len(droplet), out_len)
        actual = end - start
        if actual > 0:
            output[start:end, 0] += gain_l * droplet[:actual]
            output[start:end, 1] += gain_r * droplet[:actual]

    return output


def main():
    here = Path(__file__).parent
    dry, sr = sf.read(str(here / "dry.wav"))
    if dry.ndim > 1:
        dry = dry.mean(axis=1)
    print(f"Loaded dry: {len(dry)/sr:.2f}s @ {sr}Hz")

    # Loudon's canonical: many droplets, very close to in tune, panned wide
    cloud = droplet_cloud(
        dry, sr,
        n_droplets=600,
        pitch_target_semitones=0.0,
        pitch_spread_cents=3.0,
        time_spread_ms=250.0,
        pan_spread=1.0,
    )

    # Peak normalize
    peak = np.max(np.abs(cloud))
    if peak > 0:
        cloud *= 0.85 / peak

    out_path = here / "cloud_demo.wav"
    sf.write(str(out_path), cloud.astype(np.float32), sr)
    print(f"Wrote {out_path}  ({len(cloud)/sr:.2f}s, stereo)")


if __name__ == "__main__":
    main()
