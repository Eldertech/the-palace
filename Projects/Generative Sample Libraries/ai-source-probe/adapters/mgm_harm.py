"""Ceiling-test arm (cycle 25): MusicGen-melody + guide, guide = sine + 2nd and 3rd harmonics (1, 1/2, 1/3) instead of a bare sine."""
from adapters.musicgen import render_with


def render(**kw) -> dict:
    return render_with("melody", guide_kind="harmonic", **kw)
