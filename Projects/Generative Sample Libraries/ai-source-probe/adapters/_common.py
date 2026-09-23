"""Shared by every adapter: the prompt every model hears, and a WAV writer
that needs nothing beyond numpy + the standard library (so it runs inside
any model's own venv without asking it to install soundfile).
"""
from __future__ import annotations
import os
import wave

import numpy as np

# One prompt shape for every text-conditioned arm, so the comparison is
# between models, not between prompts. Prompt shape is its own later
# experiment (note name vs Hz vs descriptor) — see DESIGN.md.
PROMPT_TMPL = ("{hint}, playing note {note_name} (pitch {hz:.2f} Hz), "
               "solo, dry, no reverb, single sustained tone")


def build_prompt(instrument: str, target_hz: float, note_name: str = "",
                 prompt_hint: str = "") -> str:
    return PROMPT_TMPL.format(hint=prompt_hint or instrument,
                              note_name=note_name or f"{target_hz:.2f} Hz",
                              hz=target_hz)


def to_mono(y) -> np.ndarray:
    """Accept (samples,), (channels, samples), (batch, channels, samples)."""
    y = np.asarray(y, dtype=np.float64)
    while y.ndim > 2:
        y = y[0]
    if y.ndim == 2:
        # channels are the short axis
        y = y.mean(axis=0) if y.shape[0] <= y.shape[1] else y.mean(axis=1)
    return y


def write_wav(path: str, y, sr: int, peak_dbfs: float = -1.0) -> dict:
    """Peak-normalise to peak_dbfs and write 16-bit PCM mono."""
    y = to_mono(y)
    peak = float(np.max(np.abs(y))) if y.size else 0.0
    if peak > 0:
        y = y / peak * (10.0 ** (peak_dbfs / 20.0))
    pcm = np.clip(np.round(y * 32767.0), -32768, 32767).astype("<i2")
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(int(sr))
        w.writeframes(pcm.tobytes())
    return {"sr": int(sr), "samples": int(y.size),
            "duration_sec": round(y.size / float(sr), 3),
            "raw_peak": round(peak, 4)}
