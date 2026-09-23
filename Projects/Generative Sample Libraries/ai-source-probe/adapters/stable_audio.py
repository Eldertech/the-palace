"""Stable Audio 3 adapter — Shop Specialist `Shop/Stable Audio Open.md`.

Runs inside the SA3 venv on the Mac: `<palace>/_tools/stable-audio-3/.venv`
(install recipe in the Specialist's 2026-05-26 gotcha). Text-conditioned
only — the pitch reaches the model as words in the prompt.

What is proven vs assumed:
  proven   `StableAudioModel.from_pretrained("small-music")` and
           `model.generate(prompt=..., duration=...)` returning a tensor
           shaped [C, S] or [B, C, S] at 44.1 kHz — Kuramoto Coupling/
           atmospheric-beds-sa3.py rendered three beds with exactly that.
  assumed  that generate() also takes steps / cfg_scale / seed. So this
           adapter reads generate()'s signature and passes only the
           keywords it names; the seed is always set globally in torch as
           well, so seeds hold even if generate() has no seed argument.
           Which keywords went through is recorded in each row's meta.
"""
from __future__ import annotations
import inspect
import os

from adapters._common import build_prompt, write_wav

MODEL_NAME = os.environ.get("GSL_SA3_MODEL", "small-music")
TIERS = {"sketch": 8, "work": 16, "final": 32}
FALLBACK_SR = 44_100          # SA3 SAME autoencoder native rate (Kuramoto recipe)

_MODEL = None


def _model():
    global _MODEL
    if _MODEL is None:
        from stable_audio_3 import StableAudioModel
        _MODEL = StableAudioModel.from_pretrained(MODEL_NAME)
    return _MODEL


def _seed_everything(seed: int) -> None:
    import torch
    torch.manual_seed(seed)
    mps = getattr(torch, "mps", None)
    if mps is not None and hasattr(mps, "manual_seed"):
        try:
            mps.manual_seed(seed)
        except Exception:
            pass


def _sample_rate(model) -> tuple[int, str]:
    for attr in ("sample_rate", "sr", "sampling_rate"):
        v = getattr(model, attr, None)
        if isinstance(v, (int, float)) and v > 0:
            return int(v), f"model.{attr}"
    return FALLBACK_SR, "assumed-44100"


def render(instrument: str, target_hz: float, seed: int, out_path: str,
           *, note_name: str = "", prompt_hint: str = "",
           duration_sec: float = 6.0, tier: str = "sketch",
           cfg_scale: float = 6.0, **_) -> dict:
    prompt = build_prompt(instrument, target_hz, note_name, prompt_hint)
    model = _model()
    _seed_everything(seed)

    params = inspect.signature(model.generate).parameters
    kw = {"prompt": prompt, "duration": duration_sec}
    wanted = {"steps": TIERS.get(tier, 8), "cfg_scale": cfg_scale, "seed": seed}
    passed = [k for k in wanted if k in params]
    kw.update({k: wanted[k] for k in passed})

    audio = model.generate(**kw)
    if isinstance(audio, (tuple, list)):
        audio = audio[0]
    y = audio.detach().to("cpu").float().numpy()
    sr, sr_source = _sample_rate(model)
    info = write_wav(out_path, y, sr)
    return {"prompt": prompt, "seed": seed, "tier": tier,
            "model": f"stable-audio-3/{MODEL_NAME}",
            "conditioning": "text",
            "kwargs_passed": passed, "sr_source": sr_source, **info}
