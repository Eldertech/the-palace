"""Ceiling-test arm (cycle 25): MusicGen-melody + guide, guidance_scale 6 instead of 3 — lean harder on the conditioning."""
from adapters.musicgen import render_with


def render(**kw) -> dict:
    return render_with("melody", guidance_scale=6.0, **kw)
