"""Struck-instrument arm: MusicGen-melody + sine guide, prompt asks for one hit, no roll."""
from adapters.musicgen import render_with


def render(**kw) -> dict:
    return render_with("melody", prompt_shape="struck", **kw)
