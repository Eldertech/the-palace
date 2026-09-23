"""
Semantic Delay — F0 extraction (Stage 4, sandbox-side)
======================================================

A dependency-free F0 tracker: normalized autocorrelation per frame, parabolic
peak refinement, voiced/unvoiced by clarity + energy, then a short median
filter to kill octave flickers. It is **not** RMVPE and does not pretend to be
— the daemon still runs RMVPE Mac-side for the model's own conditioning
(Stage 1.5 handoff). This one exists so the *coupling layer* can be developed,
heard, and tested here, with no torch in the room.

Contract (matches the SVC convention in the home entry): a 1-D float32 array of
Hz, `0.0` for unvoiced, one value per `hop` samples.
"""

from __future__ import annotations

import numpy as np

DEFAULT_HOP_SEC = 0.010
DEFAULT_WIN_SEC = 0.040
F0_MIN = 60.0
F0_MAX = 500.0


def extract_f0(
    audio: np.ndarray,
    sample_rate: int,
    *,
    hop_sec: float = DEFAULT_HOP_SEC,
    win_sec: float = DEFAULT_WIN_SEC,
    f0_min: float = F0_MIN,
    f0_max: float = F0_MAX,
    clarity_floor: float = 0.55,
    silence_dbfs: float = -50.0,
) -> tuple[np.ndarray, int]:
    """Return (f0_hz, hop_samples). Unvoiced frames are 0.0."""
    x = np.asarray(audio, dtype=np.float32)
    hop = max(1, int(round(hop_sec * sample_rate)))
    win = max(hop * 2, int(round(win_sec * sample_rate)))
    lag_min = max(2, int(sample_rate / f0_max))
    lag_max = min(win - 2, int(sample_rate / f0_min))

    n_frames = 1 + max(0, (len(x) - win) // hop)
    out = np.zeros(n_frames, dtype=np.float32)
    amp_floor = 10.0 ** (silence_dbfs / 20.0)

    for i in range(n_frames):
        frame = x[i * hop: i * hop + win].astype(np.float64)
        if frame.size < win:
            break
        frame = frame - frame.mean()
        energy = np.sqrt(np.mean(frame ** 2))
        if energy < amp_floor:
            continue
        # Normalized autocorrelation via FFT.
        nfft = 1 << int(np.ceil(np.log2(2 * win)))
        spec = np.fft.rfft(frame, nfft)
        ac = np.fft.irfft(spec * np.conj(spec), nfft)[:lag_max + 2]
        if ac[0] <= 0:
            continue
        norm = ac / ac[0]
        seg = norm[lag_min:lag_max]
        if seg.size == 0:
            continue
        k = int(np.argmax(seg)) + lag_min
        clarity = float(norm[k])
        if clarity < clarity_floor:
            continue
        # Parabolic refinement around the integer lag.
        if 1 <= k < len(norm) - 1:
            a, b, c = norm[k - 1], norm[k], norm[k + 1]
            denom = (a - 2 * b + c)
            k_ref = k + (0.5 * (a - c) / denom) if abs(denom) > 1e-12 else k
        else:
            k_ref = k
        out[i] = float(sample_rate / k_ref)

    return _median3_voiced(out), hop


def _median3_voiced(f0: np.ndarray) -> np.ndarray:
    """3-point median over voiced frames only; unvoiced frames stay 0."""
    y = f0.copy()
    for i in range(1, len(f0) - 1):
        tri = f0[i - 1:i + 2]
        if np.all(tri > 0):
            y[i] = float(np.median(tri))
    return y.astype(np.float32)


def f0_to_midi(f0: np.ndarray) -> np.ndarray:
    """Hz -> MIDI note number in float; unvoiced stays NaN (not 0)."""
    f = np.asarray(f0, dtype=np.float64)
    out = np.full(f.shape, np.nan)
    v = f > 0
    out[v] = 69.0 + 12.0 * np.log2(f[v] / 440.0)
    return out


def midi_to_f0(m: np.ndarray) -> np.ndarray:
    """MIDI float -> Hz; NaN becomes 0.0 (unvoiced), per the SVC convention."""
    m = np.asarray(m, dtype=np.float64)
    out = np.zeros(m.shape, dtype=np.float32)
    v = np.isfinite(m)
    out[v] = (440.0 * np.power(2.0, (m[v] - 69.0) / 12.0)).astype(np.float32)
    return out


def voiced_stats(f0: np.ndarray) -> dict:
    v = np.asarray(f0)[np.asarray(f0) > 0]
    if v.size == 0:
        return {"voiced_frames": 0, "median_hz": 0.0, "min_hz": 0.0, "max_hz": 0.0}
    return {
        "voiced_frames": int(v.size),
        "median_hz": float(np.median(v)),
        "min_hz": float(v.min()),
        "max_hz": float(v.max()),
    }
