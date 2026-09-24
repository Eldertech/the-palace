"""Prompt-shape A/B arm: MusicGen-melody + sine guide, pitch worded as no pitch words — the guide alone."""
from adapters.musicgen import render_with


def render(**kw) -> dict:
    return render_with("melody", prompt_shape="bare", **kw)
