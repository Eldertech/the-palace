"""SIMULATED flawed source — NOT model output.

Stands in for a stochastic audio model so the grader and the comparison
report can be tested against every way a pitched render goes wrong. Each
cell draws one behaviour, deterministically from (instrument, pitch, seed):

  clean      — on pitch, within a few cents              -> on target
  detuned    — holds still, but 30-60 cents off           -> retunable
  octave     — right note, wrong octave                   -> retunable
  vibrato    — wide slow wobble around the target         -> texture
  melody     — plays three different notes                -> texture
  noise      — mostly breath/noise, weak pitch            -> texture

Per-instrument weights make the verdict grid show some variety. None of
these numbers say anything about Stable Audio or MusicGen. They exist only
to prove the report tells the three grades apart.
"""
from __future__ import annotations
import zlib

import numpy as np

from adapters._common import write_wav

BEHAVIOURS = ["clean", "detuned", "octave", "vibrato", "melody", "noise"]
WEIGHTS = {  # instrument -> weights over BEHAVIOURS
    "piano":   [6, 1, 1, 0, 0, 0],
    "violin":  [2, 1, 0, 4, 1, 0],
    "marimba": [3, 1, 3, 0, 0, 1],
    "flute":   [2, 5, 0, 1, 0, 0],
    "bass":    [2, 1, 4, 0, 0, 1],
    "choir":   [1, 0, 1, 2, 2, 2],
}


def _pick(instrument: str, target_hz: float, seed: int) -> tuple[str, np.random.Generator]:
    key = zlib.crc32(f"{instrument}|{target_hz:.2f}|{seed}".encode())
    rng = np.random.default_rng(key)
    w = np.array(WEIGHTS.get(instrument, [1] * 6), dtype=float)
    return BEHAVIOURS[int(rng.choice(len(w), p=w / w.sum()))], rng


def render(instrument: str, target_hz: float, seed: int, out_path: str,
           duration_sec: float = 3.0, sr: int = 44100, **_) -> dict:
    behaviour, rng = _pick(instrument, target_hz, seed)
    n = int(duration_sec * sr)
    t = np.arange(n) / sr
    cents = np.zeros(n)
    noise_amt = 0.01
    if behaviour == "clean":
        cents += rng.uniform(-6, 6)
    elif behaviour == "detuned":
        cents += rng.choice([-1, 1]) * rng.uniform(30, 60)
    elif behaviour == "octave":
        cents += rng.choice([-1200, 1200]) + rng.uniform(-8, 8)
    elif behaviour == "vibrato":
        cents += 70 * np.sin(2 * np.pi * rng.uniform(4.5, 6.5) * t)
    elif behaviour == "melody":
        steps = rng.choice([-500, -300, 200, 400, 700], size=2, replace=False)
        cents[n // 3: 2 * n // 3] += steps[0]
        cents[2 * n // 3:] += steps[1]
    elif behaviour == "noise":
        noise_amt = 1.2
    f = target_hz * 2.0 ** (cents / 1200.0)
    phase = 2 * np.pi * np.cumsum(f) / sr
    y = np.zeros(n)
    for h in range(1, 7):
        y += np.sin(h * phase) / h * (f * h < sr / 2)
    if behaviour == "noise":
        y *= 0.15
    y += noise_amt * rng.standard_normal(n)
    atk, rel = int(0.02 * sr), int(0.30 * sr)
    env = np.ones(n)
    env[:atk] = np.linspace(0, 1, atk)
    env[-rel:] = np.linspace(1, 0, rel)
    info = write_wav(out_path, y * env, sr)
    return {"prompt": f"[SIMULATED:{behaviour}] {instrument} @ {target_hz:.2f} Hz",
            "model": "mock-flawed-v1", "seed": seed, "simulated": True,
            "simulated_behaviour": behaviour, **info}
