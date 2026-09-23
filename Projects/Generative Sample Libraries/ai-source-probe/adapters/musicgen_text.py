"""Arm: MusicGen-melody with no guide — text prompt only. The control."""
from adapters.musicgen import render_with


def render(**kw) -> dict:
    return render_with("text", **kw)
