"""
Shimmer Cloud — Dispersion Model
================================
A single dispersing lens (a tiny prism), implemented as a frequency-domain
all-pass with a power-law phase response.

WHY THIS MODEL
--------------
An optical prism doesn't pitch-shift light. It disperses light: different
wavelengths travel through the medium at different group velocities and
exit at different times AND different angles. The audio analog is
frequency-dependent group delay — different frequencies arrive at the
listener at different times. That's what an all-pass filter does (unity
magnitude, phase response that varies with frequency).

The dispersion model treats each droplet as the dry signal passed through
its OWN dispersion filter: every frequency component of the input is
preserved (unity magnitude), but high-frequency content is delayed
differently than low-frequency content. The cloud is a population of
such dispersing lenses with subtly different dispersion characteristics,
panned and time-offset, summed.

Pitch and amplitude content is preserved per droplet. The dispersion is
the prism action.

THE MATH
--------
For each lens, define a phase response phi(f_n) over the normalized
frequency axis f_n in [0, 1] (DC to Nyquist).

    phi(f_n) = -direction * (pi * D / exponent) * f_n^exponent

Group delay (in samples) at normalized frequency f_n is:
    tau(f_n) = direction * D * f_n^(exponent - 1)

So at f=0 the delay is 0; at f=Nyquist the delay is `direction * D`.

    exponent=1.0   constant delay (D samples) — no dispersion, just a delay
    exponent=2.0   linear group-delay-vs-frequency — the textbook prism
    exponent=3.0   quadratic group-delay-vs-freq — stiff-string-like
    exponent=5+    very steep — only the very highest frequencies delay

    direction=+1   high frequencies arrive LATER than lows
    direction=-1   high frequencies arrive EARLIER than lows
"""
from __future__ import annotations

from pathlib import Path

import numpy as np
import soundfile as sf


def disperse(
    x: np.ndarray,
    sr: int,
    dispersion_samples: float,
    exponent: float = 2.0,
    direction: int = +1,
) -> np.ndarray:
    """Apply a power-law group delay to x via FFT-domain phase modification.

    Parameters
    ----------
    x : 1-D mono signal
    sr : sample rate
    dispersion_samples : group delay (in samples) at Nyquist
    exponent : >= 1, shape of the group-delay-vs-frequency curve
    direction : +1 = high frequencies delayed, -1 = high frequencies advanced
    """
    if dispersion_samples <= 0 or exponent <= 0:
        return x.astype(np.float64).copy()

    pad = max(int(dispersion_samples) + 256, 512)
    xp = np.concatenate([x.astype(np.float64), np.zeros(pad)])
    Np = len(xp)

    X = np.fft.rfft(xp)
    n_bins = len(X)
    f_n = np.arange(n_bins) / max(n_bins - 1, 1)  # 0..1

    D = float(dispersion_samples)
    phi = -direction * np.pi * D / exponent * f_n ** exponent

    Y = X * np.exp(1j * phi)
    return np.fft.irfft(Y, n=Np)


def dispersion_cloud(
    dry: np.ndarray,
    sr: int,
    n_droplets: int = 400,
    dispersion_max_ms: float = 25.0,
    dispersion_min_ms: float = 5.0,
    exponent_mean: float = 2.0,
    exponent_spread: float = 0.4,
    direction_balance: float = 0.0,
    time_spread_ms: float = 350.0,
    pan_spread: float = 1.0,
    amp_jitter: float = 0.3,
    fade_in_ms: float = 3.0,
    fade_out_ms: float = 50.0,
    tail_seconds: float = 2.5,
    pitch_target_semitones: float = 0.0,
    pitch_spread_cents: float = 0.0,
    seed: int = 42,
) -> np.ndarray:
    """A stereo cloud of dispersing lenses.

    Parameters
    ----------
    n_droplets               How many lenses in the cloud
    dispersion_min_ms        Minimum group delay at Nyquist (per droplet)
    dispersion_max_ms        Maximum group delay at Nyquist (per droplet)
    exponent_mean / spread   Per-droplet dispersion-curve shape (Gaussian)
    direction_balance        -1 = all highs-early, 0 = balanced mix, +1 = all highs-late
    time_spread_ms           Range of droplet start-time offsets
    pan_spread               0 = mono, 1 = full stereo
    amp_jitter               Amplitude variation per droplet
    pitch_spread_cents       If > 0, also rate-resample each droplet by a small amount
                             (the "layered" model — dispersion + cents-jitter)
    """
    rng = np.random.default_rng(seed)
    if dry.ndim > 1:
        dry = dry.mean(axis=1)
    dry = dry.astype(np.float64)

    out_len = len(dry) + int(
        (time_spread_ms / 1000.0 + dispersion_max_ms / 1000.0 + tail_seconds) * sr
    )
    output = np.zeros((out_len, 2), dtype=np.float64)

    fade_in = max(1, int(fade_in_ms * 1e-3 * sr))
    fade_out = max(1, int(fade_out_ms * 1e-3 * sr))
    fi_curve = np.linspace(0.0, 1.0, fade_in)
    fo_curve = np.linspace(1.0, 0.0, fade_out)

    p_pos = (direction_balance + 1.0) / 2.0  # probability of direction = +1

    # OPTIMIZATION: when there's no pitch jitter, the FFT input is the same
    # for every droplet — pre-compute it once so per-droplet cost is just
    # (phase mul + iFFT). Saves ~half the runtime for large clouds.
    use_pitch_jitter = pitch_spread_cents > 0 or pitch_target_semitones != 0
    if not use_pitch_jitter:
        pad = max(int(dispersion_max_ms * 1e-3 * sr) + 256, 512)
        dry_padded = np.concatenate([dry, np.zeros(pad)])
        Np = len(dry_padded)
        DRY_FFT = np.fft.rfft(dry_padded)
        n_bins = len(DRY_FFT)
        f_n = np.arange(n_bins) / max(n_bins - 1, 1)

    for _ in range(n_droplets):
        # Per-droplet dispersion params
        D_ms = rng.uniform(dispersion_min_ms, dispersion_max_ms)
        D_samples = D_ms * 1e-3 * sr
        exp = max(1.05, exponent_mean + rng.normal(0.0, exponent_spread))
        direction = +1 if rng.random() < p_pos else -1

        if use_pitch_jitter:
            cents = pitch_target_semitones * 100.0 + rng.normal(0.0, pitch_spread_cents)
            rate = 2.0 ** (cents / 1200.0)
            n_in = len(dry)
            n_out = max(1, int(round(n_in / rate)))
            read_pos = np.arange(n_out) * rate
            i_int = np.clip(read_pos.astype(np.int64), 0, n_in - 2)
            i_frac = read_pos - i_int
            droplet_src = (1 - i_frac) * dry[i_int] + i_frac * dry[i_int + 1]
            droplet = disperse(droplet_src, sr, D_samples, exp, direction)
        else:
            phi = -direction * np.pi * D_samples / exp * f_n ** exp
            droplet = np.fft.irfft(DRY_FFT * np.exp(1j * phi), n=Np)

        if len(droplet) > fade_in:
            droplet[:fade_in] *= fi_curve
        if len(droplet) > fade_out:
            droplet[-fade_out:] *= fo_curve

        amp = 1.0 - rng.uniform(0.0, amp_jitter)
        droplet *= amp

        pan = rng.uniform(-pan_spread, pan_spread)
        theta = (pan + 1.0) * np.pi / 4.0
        gain_l = np.cos(theta)
        gain_r = np.sin(theta)

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

    cloud = dispersion_cloud(
        dry, sr,
        n_droplets=600,
        dispersion_max_ms=25.0,
        dispersion_min_ms=5.0,
        exponent_mean=2.0,
        time_spread_ms=350.0,
        pan_spread=1.0,
    )

    peak = np.max(np.abs(cloud))
    if peak > 0:
        cloud *= 0.85 / peak

    out = here / "lens_demo.wav"
    sf.write(str(out), cloud.astype(np.float32), sr)
    print(f"Wrote {out}  ({len(cloud)/sr:.2f}s, stereo)")


if __name__ == "__main__":
    main()
