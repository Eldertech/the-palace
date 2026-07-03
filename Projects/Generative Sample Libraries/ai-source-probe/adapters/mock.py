"""Mock adapter — sine at target_hz with a soft AR envelope + noise floor.

Not a real audio LLM. Its only job is to prove the render→verify→report
pipeline end-to-end before any GPU time is spent on SA3 / MusicGen.
"""
from __future__ import annotations
import os
import numpy as np
import soundfile as sf  # type: ignore


def render(instrument: str, target_hz: float, seed: int, out_path: str,
           duration_sec: float = 4.0, sr: int = 44100) -> dict:
    rng = np.random.default_rng(seed)
    t = np.arange(int(duration_sec * sr)) / sr
    y = 0.6 * np.sin(2 * np.pi * target_hz * t)
    y += 0.02 * rng.standard_normal(y.shape)  # noise floor
    # AR envelope
    n = len(y)
    atk = int(0.02 * sr); rel = int(0.30 * sr)
    env = np.ones(n)
    env[:atk] = np.linspace(0, 1, atk)
    env[-rel:] = np.linspace(1, 0, rel)
    y = (y * env).astype(np.float32)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    sf.write(out_path, y, sr, subtype="PCM_16")
    return {"prompt": f"[MOCK] {instrument} @ {target_hz:.2f} Hz seed={seed}",
            "seed": seed, "duration_sec": duration_sec, "sr": sr,
            "model": "mock-sine-v0"}
