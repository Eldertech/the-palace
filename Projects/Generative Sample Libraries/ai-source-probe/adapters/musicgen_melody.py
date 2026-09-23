"""Arm: MusicGen-melody, text prompt + sine melody guide at the target pitch."""
from adapters.musicgen import render_with


def render(**kw) -> dict:
    return render_with("melody", **kw)
