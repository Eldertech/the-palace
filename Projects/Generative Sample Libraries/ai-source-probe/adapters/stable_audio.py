"""Stable Audio Open (SA3) adapter — Shop Specialist Shop/Stable Audio Open.md.

Wire-up TBD once Loudon greenlights the adapter in gsl-steward-038. The
Specialist doc names a Job Contract (prompt/duration_sec/tier/seed/cfg_scale
/steps/out_path) that this adapter conforms to; the missing piece is the
concrete Python entrypoint on this Mac (venv path / CLI / diffusers pipeline).
Left as NotImplementedError so the pipeline surfaces the gap rather than
silently mock-rendering.
"""
from __future__ import annotations


PROMPT_TMPL = "{hint}, playing note {note_name} (pitch {hz:.2f} Hz), solo, dry, no reverb, single sustained tone"


def render(instrument: str, target_hz: float, seed: int, out_path: str,
           *, note_name: str = "", prompt_hint: str = "",
           duration_sec: float = 6.0, tier: str = "sketch") -> dict:
    prompt = PROMPT_TMPL.format(hint=prompt_hint or instrument,
                                note_name=note_name, hz=target_hz)
    raise NotImplementedError(
        "Wire the SA3 entrypoint (venv/CLI/diffusers pipeline) before running. "
        f"Prompt would be: {prompt!r}, seed={seed}, tier={tier}, out={out_path}"
    )
