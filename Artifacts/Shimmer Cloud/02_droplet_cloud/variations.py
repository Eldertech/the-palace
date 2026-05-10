"""
Shimmer Cloud — 30 variations on the droplet cloud.

Same dry input ("the prism, and the cloud."), 100% wet stereo output for
every variation. Grouped by axis so listening top-to-bottom is a tour.

The model is the droplet cloud (cloud.py): each variation is a population
of N droplets, each a slightly-rate-shifted copy of the dry input,
panned across stereo, started at slightly random times, summed.

Sections:
    A. Droplet count           (01–05)  how many lenses in the cloud
    B. Pitch spread            (06–10)  cents-jitter around target
    C. Time spread             (11–15)  start-time scatter
    D. Pan spread              (16–19)  spatial width
    E. Pitch target            (20–23)  where the cloud sits
    F. Composite identities    (24–30)  Loudon's canonical first

Sections B–E hold the other axes at sensible defaults so the axis being
varied is the audible variable.
"""
from pathlib import Path

import numpy as np
import soundfile as sf

from cloud import droplet_cloud


# fmt: off
VARIATIONS = [
    # ── A. Droplet count (target=0, ±5c, 250ms spread, full pan) ──────
    ("01_30_droplets",      dict(n_droplets=30)),
    ("02_100_droplets",     dict(n_droplets=100)),
    ("03_300_droplets",     dict(n_droplets=300)),
    ("04_800_droplets",     dict(n_droplets=800)),
    ("05_2500_droplets",    dict(n_droplets=2500)),

    # ── B. Pitch spread (cents) — at 400 droplets, target 0 ───────────
    ("06_unison_1c",        dict(n_droplets=400, pitch_spread_cents=1.0)),
    ("07_tight_3c",         dict(n_droplets=400, pitch_spread_cents=3.0)),
    ("08_natural_8c",       dict(n_droplets=400, pitch_spread_cents=8.0)),
    ("09_chorus_25c",       dict(n_droplets=400, pitch_spread_cents=25.0)),
    ("10_wide_75c",         dict(n_droplets=400, pitch_spread_cents=75.0)),

    # ── C. Time spread (ms) — at 400 droplets, ±5c, target 0 ──────────
    ("11_synced_5ms",       dict(n_droplets=400, time_spread_ms=5)),
    ("12_close_75ms",       dict(n_droplets=400, time_spread_ms=75)),
    ("13_natural_300ms",    dict(n_droplets=400, time_spread_ms=300)),
    ("14_dispersed_1000ms", dict(n_droplets=400, time_spread_ms=1000)),
    ("15_long_cascade_3s",  dict(n_droplets=400, time_spread_ms=3000)),

    # ── D. Pan spread — at 400 droplets, ±5c, 300ms ───────────────────
    ("16_mono_pan",         dict(n_droplets=400, pan_spread=0.0)),
    ("17_quarter_pan",      dict(n_droplets=400, pan_spread=0.35)),
    ("18_half_pan",         dict(n_droplets=400, pan_spread=0.65)),
    ("19_full_pan",         dict(n_droplets=400, pan_spread=1.0)),

    # ── E. Pitch target — at 400 droplets, ±5c, 300ms, full pan ───────
    ("20_target_unison_0",  dict(n_droplets=400, pitch_target_semitones=0)),
    ("21_target_+3",        dict(n_droplets=400, pitch_target_semitones=3)),
    ("22_target_+7",        dict(n_droplets=400, pitch_target_semitones=7)),
    ("23_target_+12",       dict(n_droplets=400, pitch_target_semitones=12)),

    # ── F. Composite identities ───────────────────────────────────────
    ("24_loudon_canonical", dict(
        # Loudon's spec: many droplets very close to in tune,
        # delayed and slowly falling out of time, panned wide.
        n_droplets=600,
        pitch_target_semitones=0.0,
        pitch_spread_cents=3.0,
        time_spread_ms=350.0,
        pan_spread=1.0,
    )),
    ("25_breathing_unison", dict(
        # Dense unison, slow temporal cascade — the droplets disperse
        # across time, very tight pitch.
        n_droplets=1000,
        pitch_target_semitones=0.0,
        pitch_spread_cents=2.0,
        time_spread_ms=800.0,
        pan_spread=1.0,
    )),
    ("26_micro_cluster",    dict(
        # Extreme tight tuning + dense — almost a phase-shifted reverb.
        n_droplets=1500,
        pitch_target_semitones=0.0,
        pitch_spread_cents=1.0,
        time_spread_ms=150.0,
        pan_spread=1.0,
    )),
    ("27_dispersing_swarm", dict(
        # Fewer droplets, wide time spread — discrete cloud edges.
        n_droplets=250,
        pitch_target_semitones=0.0,
        pitch_spread_cents=8.0,
        time_spread_ms=2000.0,
        pan_spread=1.0,
    )),
    ("28_choral_lift_+3",   dict(
        # Moves the cloud up a minor third, dense, soft cascade.
        n_droplets=600,
        pitch_target_semitones=3.0,
        pitch_spread_cents=4.0,
        time_spread_ms=350.0,
        pan_spread=1.0,
    )),
    ("29_heavenly_+7",      dict(
        # Cloud sits a fifth up, very tight in-tune, breathy.
        n_droplets=800,
        pitch_target_semitones=7.0,
        pitch_spread_cents=2.5,
        time_spread_ms=600.0,
        pan_spread=1.0,
    )),
    ("30_long_cascade_+5",  dict(
        # Very long time-disperse, 4th up, moderate pitch jitter.
        n_droplets=400,
        pitch_target_semitones=5.0,
        pitch_spread_cents=4.0,
        time_spread_ms=2500.0,
        pan_spread=1.0,
    )),
]
# fmt: on


def render_all(dry_path: Path, out_dir: Path, target_peak: float = 0.85):
    out_dir.mkdir(parents=True, exist_ok=True)
    dry, sr = sf.read(str(dry_path))
    if dry.ndim > 1:
        dry = dry.mean(axis=1)
    print(f"Loaded dry: {len(dry)/sr:.2f}s @ {sr}Hz\n")

    for name, params in VARIATIONS:
        cloud = droplet_cloud(dry, sr, **params)

        peak = np.max(np.abs(cloud))
        if peak > 0:
            cloud = cloud * (target_peak / peak)

        path = out_dir / f"{name}.wav"
        sf.write(str(path), cloud.astype(np.float32), sr)
        n = params.get("n_droplets", 300)
        print(f"  {name:30s}  N={n:<5d}  {len(cloud)/sr:5.2f}s  peak {peak:.3f} → {target_peak}")


if __name__ == "__main__":
    here = Path(__file__).parent
    render_all(here / "dry.wav", here / "variations")
