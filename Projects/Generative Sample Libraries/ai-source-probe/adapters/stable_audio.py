"""Stable Audio Open (SA3) adapter — Shop Specialist Shop/Stable Audio Open.md.

Wired 2026-09-15 (cycle 20) against the local install at
`_tools/stable-audio-3` (`small-music`, weights cached in
~/.cache/huggingface/hub). Runs on MPS/CPU; the model is loaded once per
process and reused across the sweep.

Job Contract fields honored: prompt / duration_sec / seed / steps /
cfg_scale / out_path. `tier` maps onto `steps`.
"""
from __future__ import annotations
import os
import numpy as np
import soundfile as sf  # type: ignore

PROMPT_TMPL = ("{hint}, playing note {note_name} (pitch {hz:.2f} Hz), "
               "solo, dry, no reverb, single sustained tone")

TIERS = {"sketch": 8, "work": 16, "final": 32}

_MODEL = None
_MODEL_NAME = "small-music"


def _model():
    global _MODEL
    if _MODEL is None:
        from stable_audio_3 import StableAudioModel
        _MODEL = StableAudioModel.from_pretrained(_MODEL_NAME)
    return _MODEL


def render(instrument: str, target_hz: float, seed: int, out_path: str,
           *, note_name: str = "", prompt_hint: str = "",
           duration_sec: float = 6.0, tier: str = "sketch",
           cfg_scale: float = 6.0) -> dict:
    prompt = PROMPT_TMPL.format(hint=prompt_hint or instrument,
                                note_name=note_name, hz=target_hz)
    steps = TIERS.get(tier, 8)
    audio = _model().generate(prompt=prompt, duration=duration_sec,
                              steps=steps, cfg_scale=cfg_scale, seed=seed)
    y = audio.detach().to("cpu").float().numpy()
    y = np.squeeze(y)
    if y.ndim == 2:                       # (channels, samples) -> mono
        y = y.mean(axis=0 if y.shape[0] <= 2 else 1)
    peak = float(np.max(np.abs(y))) or 1.0
    y = (y / peak * 0.89).astype(np.float32)
    sr = 44100
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    sf.write(out_path, y, sr, subtype="PCM_16")
    return {"prompt": prompt, "seed": seed, "duration_sec": duration_sec,
            "sr": sr, "steps": steps, "cfg_scale": cfg_scale,
            "model": f"stable-audio-3-{_MODEL_NAME}"}
