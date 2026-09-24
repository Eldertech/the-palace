"""Prompt-shape A/B arm: MusicGen-melody + sine guide, pitch worded as plain words (middle C)."""
from adapters.musicgen import render_with


def render(**kw) -> dict:
    return render_with("melody", prompt_shape="word", **kw)
