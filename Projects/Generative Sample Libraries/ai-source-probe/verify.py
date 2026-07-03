"""Pitch verification.

Preferred: librosa.pyin. Fallback: numpy-only autocorrelation on the mid
window. The fallback is enough to smoke-test the pipeline; the real sweep
against a stochastic audio LLM wants pyin's voiced/unvoiced decision.

Both return: {measured_hz, cents_err, voiced_pct, usable, ...}.
"""
from __future__ import annotations
import numpy as np


def _load(wav_path: str):
    try:
        import soundfile as sf
        y, sr = sf.read(wav_path, always_2d=False)
        if y.ndim == 2:
            y = y.mean(axis=1)
        return y.astype(np.float64), sr
    except Exception:
        import wave
        with wave.open(wav_path) as w:
            sr = w.getframerate(); n = w.getnframes(); ch = w.getnchannels()
            raw = np.frombuffer(w.readframes(n), dtype=np.int16)
        if ch == 2:
            raw = raw.reshape(-1, 2).mean(axis=1)
        return raw.astype(np.float64) / 32768.0, sr


def _autocorr_pitch(y: np.ndarray, sr: int, target_hz: float) -> tuple[float, float]:
    n = len(y)
    head, tail = int(0.15 * sr), int(0.15 * sr)
    body = y[head : max(head + sr // 4, n - tail)]
    body = body - body.mean()
    if body.std() < 1e-5:
        return float("nan"), 0.0
    ac = np.correlate(body, body, mode="full")[len(body) - 1 :]
    lag_min = int(sr / (target_hz * 2.0))
    lag_max = int(sr / max(20.0, target_hz / 2.0))
    lag_max = min(lag_max, len(ac) - 1)
    if lag_max <= lag_min + 2:
        return float("nan"), 0.0
    seg = ac[lag_min:lag_max]
    lag = lag_min + int(np.argmax(seg))
    if lag == 0:
        return float("nan"), 0.0
    hz = sr / lag
    strength = float(ac[lag] / (ac[0] + 1e-12))
    return float(hz), max(0.0, min(1.0, strength))


def verify(wav_path: str, target_hz: float) -> dict:
    y, sr = _load(wav_path)
    try:
        import librosa
        n = len(y)
        trim = int(sr * 0.10)
        body = y[trim : max(trim + sr // 4, n - trim)]
        fmin = max(50.0, target_hz / 2.0)
        fmax = min(sr / 2.0 - 100.0, target_hz * 2.0)
        f0, voiced_flag, voiced_prob = librosa.pyin(
            body, fmin=fmin, fmax=fmax, sr=sr,
            frame_length=2048, hop_length=256, fill_na=np.nan,
        )
        voiced = f0[~np.isnan(f0)]
        voiced_pct = float(len(voiced)) / max(1, len(f0))
        if len(voiced) == 0:
            return {"target_hz": target_hz, "measured_hz": None,
                    "cents_err": None, "voiced_pct": 0.0,
                    "usable": False, "method": "pyin",
                    "reason": "no voiced frames"}
        cents = 1200.0 * np.log2(voiced / target_hz)
        cents_err = float(np.median(cents))
        measured = float(target_hz * (2.0 ** (cents_err / 1200.0)))
        return {"target_hz": float(target_hz), "measured_hz": measured,
                "cents_err": round(cents_err, 2),
                "voiced_pct": round(voiced_pct, 3),
                "usable": abs(cents_err) <= 20.0 and voiced_pct >= 0.60,
                "method": "pyin"}
    except ImportError:
        hz, strength = _autocorr_pitch(y, sr, target_hz)
        if np.isnan(hz):
            return {"target_hz": target_hz, "measured_hz": None,
                    "cents_err": None, "voiced_pct": 0.0,
                    "usable": False, "method": "autocorr-fallback",
                    "reason": "no pitch found"}
        cents_err = 1200.0 * np.log2(hz / target_hz)
        return {"target_hz": float(target_hz), "measured_hz": float(hz),
                "cents_err": round(float(cents_err), 2),
                "voiced_pct": round(strength, 3),
                "usable": abs(cents_err) <= 20.0 and strength >= 0.60,
                "method": "autocorr-fallback"}
