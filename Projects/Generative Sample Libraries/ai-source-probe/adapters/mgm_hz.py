"""Prompt-shape A/B arm: MusicGen-melody + sine guide, pitch worded as frequency only (261.63 Hz)."""
from adapters.musicgen import render_with


def render(**kw) -> dict:
    return render_with("melody", prompt_shape="hz", **kw)
