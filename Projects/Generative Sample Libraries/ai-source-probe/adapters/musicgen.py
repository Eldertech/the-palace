"""MusicGen-melody adapter — shared body for two arms of the comparison.

  musicgen_melody  text prompt + a sine at the target pitch as the melody
                   guide. The model hears the pitch, not just reads it.
  musicgen_text    the same model, the same prompt, no guide. The control.

Same checkpoint on both arms, so any gap between them measures the guide
itself, not a difference between models.

One thing to expect before any render: MusicGen reads its melody guide as
a chromagram, which knows the note but not the octave. So the melody arm
should land on the right note more often than it lands in the right
octave. The verifier reports octave slips separately for exactly this.

Runs in its own venv on the Mac: `<palace>/.venvs/musicgen` (run-on-mac.sh
builds it). Weights: facebook/musicgen-melody, ~1.5B params, one-time
download of several GB. License: CC-BY-NC 4.0 — anything sampled from this
arm is non-commercial.

Assumed, not yet run anywhere: the transformers MusicgenMelody API as
documented (processor(audio=..., sampling_rate=..., text=[...]) and
model.generate(..., max_new_tokens=...)). The first Mac run is its test.
"""
from __future__ import annotations
import os

import numpy as np

from adapters._common import build_prompt, write_wav

MODEL_ID = os.environ.get("GSL_MUSICGEN_MODEL", "facebook/musicgen-melody")
_STATE: dict = {}


def _keep_conditioning(cls) -> None:
    """Stop generate() from throwing the conditioning away on its first step.

    MusicGen-melody feeds its text + chroma conditioning as a prefix on the
    first decoding step only, and prepare_inputs_for_generation drops it
    whenever past_key_values is not None. Recent transformers (seen on 4.57
    and 5.17) hands generate() an *empty* DynamicCache before step one, so
    the prefix is dropped every time: "solo violin" and "heavy metal drums"
    came back byte-identical at the same seed. Found on the first real run,
    2026-09-23. The fix treats an empty cache as no cache for that one call.
    """
    import functools
    orig = cls.prepare_inputs_for_generation
    if getattr(orig, "_gsl_patched", False):
        return

    @functools.wraps(orig)   # generate() validates kwargs against this signature
    def patched(self, decoder_input_ids, *a, **kw):
        pkv = kw.get("past_key_values")
        if pkv is not None and hasattr(pkv, "get_seq_length") and pkv.get_seq_length() == 0:
            kw["past_key_values"] = None
            out = orig(self, decoder_input_ids, *a, **kw)
            out["past_key_values"] = pkv
            return out
        return orig(self, decoder_input_ids, *a, **kw)

    patched._gsl_patched = True
    cls.prepare_inputs_for_generation = patched


def _load():
    if not _STATE:
        import torch
        from transformers import AutoProcessor, MusicgenMelodyForConditionalGeneration
        _keep_conditioning(MusicgenMelodyForConditionalGeneration)
        dev = os.environ.get("GSL_MUSICGEN_DEVICE") or (
            "mps" if torch.backends.mps.is_available() else "cpu")
        proc = AutoProcessor.from_pretrained(MODEL_ID)
        model = MusicgenMelodyForConditionalGeneration.from_pretrained(MODEL_ID)
        model = model.to(dev).eval()
        enc = model.config.audio_encoder
        _STATE.update(torch=torch, dev=dev, proc=proc, model=model,
                      sr=int(getattr(enc, "sampling_rate", 32000)),
                      frame_rate=float(getattr(enc, "frame_rate", 50) or 50))
    return _STATE


def render_with(conditioning: str, instrument: str, target_hz: float,
                seed: int, out_path: str, *, note_name: str = "",
                prompt_hint: str = "", duration_sec: float = 5.0,
                guidance_scale: float = 3.0,
                prompt_shape: str = "both", guide_kind: str = "sine", **_) -> dict:
    s = _load()
    torch, proc, model, dev = s["torch"], s["proc"], s["model"], s["dev"]
    prompt = build_prompt(instrument, target_hz, note_name, prompt_hint, prompt_shape)
    torch.manual_seed(seed)

    if conditioning == "melody":
        sr_in = int(proc.feature_extractor.sampling_rate)
        t = np.arange(int(duration_sec * sr_in)) / sr_in
        if guide_kind == "harmonic":
            # the target plus its octave and twelfth, falling off like a bowed
            # string (1, 1/2, 1/3). Chroma is octave-blind, so this is a long
            # shot at the octave; it's here because it was the named next test.
            guide = sum(np.sin(2 * np.pi * target_hz * k * t) / k for k in (1, 2, 3))
            guide = (0.5 * guide / np.max(np.abs(guide))).astype(np.float32)
        else:
            guide = (0.5 * np.sin(2 * np.pi * target_hz * t)).astype(np.float32)
        inputs = proc(audio=guide, sampling_rate=sr_in, text=[prompt],
                      padding=True, return_tensors="pt")
    elif conditioning == "text":
        inputs = proc(text=[prompt], padding=True, return_tensors="pt")
    else:
        raise ValueError(f"unknown conditioning {conditioning!r}")

    inputs = {k: (v.to(dev) if hasattr(v, "to") else v) for k, v in inputs.items()}
    with torch.no_grad():
        out = model.generate(**inputs, do_sample=True,
                             guidance_scale=guidance_scale,
                             max_new_tokens=int(duration_sec * s["frame_rate"]))
    y = out.detach().to("cpu").float().numpy()
    info = write_wav(out_path, y, s["sr"])
    return {"prompt": prompt, "seed": seed, "model": MODEL_ID,
            "conditioning": conditioning, "prompt_shape": prompt_shape, "device": dev,
            "guidance_scale": guidance_scale,
            "guide": (f"{guide_kind} {target_hz:.2f} Hz" if conditioning == "melody" else None),
            **info}
