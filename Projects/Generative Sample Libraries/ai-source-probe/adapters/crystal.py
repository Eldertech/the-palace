"""Reference arm: the shipped Crystal (Hexagonal) instrument, source one.

Not an AI model. It is a real pitched sound you already approved by ear
(gsl-steward-012), with an inharmonic bell partial set that makes pitch
tracking harder than any mock. Before the model arms run, it answers:
does the grader call a known-good palace instrument "on target"?

Renders through the same code path as crystal-instrument/generate_full.py
(imported, not copied): crystal_synth.synthesize_strike + the 0.30 strike
tone. seed 1 -> velocity layer 1 (soft), seed 2 -> layer 2 (hard). The
instrument name is ignored — every cell is the crystal.
"""
from __future__ import annotations
import importlib.util
import os
from pathlib import Path

from adapters._common import write_wav

BUNDLE = Path(__file__).resolve().parents[2]
_MODS: dict = {}


def _load(name: str, path: Path):
    if name not in _MODS:
        spec = importlib.util.spec_from_file_location(name, path)
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        _MODS[name] = mod
    return _MODS[name]


def render(instrument: str, target_hz: float, seed: int, out_path: str, **_) -> dict:
    os.environ.setdefault("PALACE_ROOT", str(BUNDLE.parents[1]))
    gf = _load("gsl_crystal_generate_full", BUNDLE / "crystal-instrument" / "generate_full.py")
    cs = _load("crystal_synth", BUNDLE / "crystal-audio" / "crystal_synth.py")
    hexa = next(c for c in cs.CRYSTALS if c["name"] == "4_hexagonal")
    layer = gf.VELOCITY_LAYERS[(seed - 1) % len(gf.VELOCITY_LAYERS)]
    decay_base = hexa["p"]["decay_base"]
    audio = cs.synthesize_strike(
        hexa["dos"](), base_freq=target_hz, freq_anchor="lowest_mode",
        max_freq=18000.0, duration=gf.NOTE_DURATION, sample_rate=gf.SAMPLE_RATE,
        n_bins=100, decay_base=decay_base, decay_exp=layer["decay_exp"],
        fidelity="shaped", transient_decay=layer["transient_decay"])
    audio = gf.add_strike_tone(audio, target_hz, gf.SAMPLE_RATE, decay_base,
                               gf.FUNDAMENTAL_GAIN)
    info = write_wav(out_path, audio, gf.SAMPLE_RATE)
    return {"prompt": f"crystal hexagonal L{layer['layer']} @ {target_hz:.2f} Hz",
            "model": "palace crystal_synth (hexagonal, strike tone 0.30)",
            "conditioning": "exact", "seed": seed, "reference": True, **info}
