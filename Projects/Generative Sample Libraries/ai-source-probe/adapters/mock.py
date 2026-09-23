"""Mock adapter — a clean harmonic tone at exactly target_hz.

Not a model. It is the ceiling: what a perfect pitched source looks like to
the verifier. Paired with mock_flawed, it proves the verify -> grade ->
compare pipeline end to end before any model time is spent on the Mac.
"""
from __future__ import annotations

import numpy as np

from adapters._common import write_wav


def render(instrument: str, target_hz: float, seed: int, out_path: str,
           duration_sec: float = 3.0, sr: int = 44100, **_) -> dict:
    rng = np.random.default_rng(seed)
    t = np.arange(int(duration_sec * sr)) / sr
    y = np.zeros_like(t)
    for n in range(1, 7):                       # six harmonics, 1/n rolloff
        if n * target_hz < sr / 2:
            y += np.sin(2 * np.pi * n * target_hz * t) / n
    y += 0.01 * rng.standard_normal(y.shape)    # noise floor
    atk, rel = int(0.02 * sr), int(0.30 * sr)
    env = np.ones_like(t)
    env[:atk] = np.linspace(0, 1, atk)
    env[-rel:] = np.linspace(1, 0, rel)
    info = write_wav(out_path, y * env, sr)
    return {"prompt": f"[MOCK] {instrument} @ {target_hz:.2f} Hz seed={seed}",
            "model": "mock-harmonic-v1", "seed": seed, "simulated": True,
            **info}
