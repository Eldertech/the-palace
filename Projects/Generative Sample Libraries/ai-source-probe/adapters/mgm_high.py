"""Ceiling-test arm (cycle 25): MusicGen-melody + guide, prompt names the register: 'in its very highest register'."""
from adapters.musicgen import render_with


def render(**kw) -> dict:
    return render_with("melody", prompt_shape="high", **kw)
