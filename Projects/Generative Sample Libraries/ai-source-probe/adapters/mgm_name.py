"""Prompt-shape A/B arm: MusicGen-melody + sine guide, pitch worded as note name only (C4)."""
from adapters.musicgen import render_with


def render(**kw) -> dict:
    return render_with("melody", prompt_shape="name", **kw)
