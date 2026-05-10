"""
Shimmer Cloud — 30 variations on the dispersion cloud model.

Same dry input ("the prism, and the cloud."), 100% wet stereo output for
every variation. Grouped by axis so listening top-to-bottom is a tour.

Each variation is a population of N droplets, each a copy of the dry
signal passed through its own dispersion all-pass with a power-law phase
response. No pitch shifting (option a — pure dispersion) except where
explicitly noted in Section H.

Sections:
    A. Dispersion strength    (01–05)  group delay at Nyquist, ms
    B. Dispersion exponent    (06–09)  shape of group-delay-vs-freq curve
    C. Direction              (10–12)  highs-late vs highs-early vs mixed
    D. Droplet count          (13–16)  how many lenses
    E. Time spread            (17–21)  start-time scatter
    F. Pan spread             (22–24)  spatial width
    G. Composite identities   (25–30)  including Loudon-canonical pure dispersion
"""
from pathlib import Path

import numpy as np
import soundfile as sf

from lens import dispersion_cloud


# fmt: off
VARIATIONS = [
    # ── A. Dispersion strength (n=400, exp 2, balanced direction) ─────
    ("01_disp_2ms",         dict(dispersion_max_ms=2.0,   dispersion_min_ms=0.5)),
    ("02_disp_8ms",         dict(dispersion_max_ms=8.0,   dispersion_min_ms=2.0)),
    ("03_disp_25ms",        dict(dispersion_max_ms=25.0,  dispersion_min_ms=5.0)),
    ("04_disp_75ms",        dict(dispersion_max_ms=75.0,  dispersion_min_ms=15.0)),
    ("05_disp_200ms",       dict(dispersion_max_ms=200.0, dispersion_min_ms=40.0)),

    # ── B. Dispersion exponent ────────────────────────────────────────
    ("06_exp_1_pure_delay",   dict(exponent_mean=1.0, exponent_spread=0.0)),
    ("07_exp_2_linear_prism", dict(exponent_mean=2.0, exponent_spread=0.0)),
    ("08_exp_3_stiff_string", dict(exponent_mean=3.0, exponent_spread=0.0)),
    ("09_exp_5_extreme",      dict(exponent_mean=5.0, exponent_spread=0.0)),

    # ── C. Direction balance ──────────────────────────────────────────
    ("10_highs_late_all",     dict(direction_balance=+1.0)),
    ("11_highs_early_all",    dict(direction_balance=-1.0)),
    ("12_mixed_directions",   dict(direction_balance=0.0)),

    # ── D. Droplet count ──────────────────────────────────────────────
    ("13_50_droplets",        dict(n_droplets=50)),
    ("14_200_droplets",       dict(n_droplets=200)),
    ("15_600_droplets",       dict(n_droplets=600)),
    ("16_1500_droplets",      dict(n_droplets=1500)),

    # ── E. Time spread ────────────────────────────────────────────────
    ("17_synced_5ms",         dict(time_spread_ms=5)),
    ("18_close_75ms",         dict(time_spread_ms=75)),
    ("19_natural_350ms",      dict(time_spread_ms=350)),
    ("20_dispersed_1000ms",   dict(time_spread_ms=1000)),
    ("21_long_cascade_3s",    dict(time_spread_ms=3000)),

    # ── F. Pan spread ─────────────────────────────────────────────────
    ("22_mono_pan",           dict(pan_spread=0.0)),
    ("23_half_pan",           dict(pan_spread=0.5)),
    ("24_full_pan",           dict(pan_spread=1.0)),

    # ── G. Composite identities ───────────────────────────────────────
    ("25_loudon_canonical_pure", dict(
        # Option (a): pure dispersion. Many lenses, subtle dispersion
        # spread, panned wide, slowly falling out of time.
        n_droplets=600,
        dispersion_max_ms=20.0,
        dispersion_min_ms=4.0,
        exponent_mean=2.0,
        exponent_spread=0.3,
        direction_balance=0.0,
        time_spread_ms=350.0,
        pan_spread=1.0,
    )),
    ("26_layered_disp_+pitch", dict(
        # Option (b) for comparison: dispersion + cents-jitter pitch.
        # Shows what happens if you keep both.
        n_droplets=600,
        dispersion_max_ms=20.0,
        dispersion_min_ms=4.0,
        exponent_mean=2.0,
        exponent_spread=0.3,
        direction_balance=0.0,
        time_spread_ms=350.0,
        pan_spread=1.0,
        pitch_spread_cents=3.0,
    )),
    ("27_glassy_prism", dict(
        # Steep exponent + strong dispersion: only highs really delay,
        # voice keeps its core, sibilants smear into glittering tail.
        n_droplets=800,
        dispersion_max_ms=80.0,
        dispersion_min_ms=20.0,
        exponent_mean=4.0,
        exponent_spread=0.5,
        direction_balance=+1.0,  # all highs-late
        time_spread_ms=200.0,
        pan_spread=1.0,
    )),
    ("28_underwater_smear", dict(
        # Mild exponent + huge dispersion: everything smears.
        n_droplets=400,
        dispersion_max_ms=180.0,
        dispersion_min_ms=60.0,
        exponent_mean=1.7,
        exponent_spread=0.2,
        direction_balance=-1.0,  # highs arrive first, lows trail
        time_spread_ms=600.0,
        pan_spread=1.0,
    )),
    ("29_chromatic_aberration", dict(
        # Mixed direction, strong dispersion: highs and lows separate
        # in opposite directions per droplet. Shimmery, unstable.
        n_droplets=600,
        dispersion_max_ms=60.0,
        dispersion_min_ms=15.0,
        exponent_mean=2.5,
        exponent_spread=0.6,
        direction_balance=0.0,
        time_spread_ms=400.0,
        pan_spread=1.0,
    )),
    ("30_long_dispersing_cascade", dict(
        # Long time spread + moderate dispersion — droplets keep arriving
        # for seconds after the dry, each one frequency-smeared.
        n_droplets=500,
        dispersion_max_ms=35.0,
        dispersion_min_ms=8.0,
        exponent_mean=2.2,
        exponent_spread=0.4,
        direction_balance=0.0,
        time_spread_ms=2500.0,
        pan_spread=1.0,
        tail_seconds=3.0,
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
        cloud = dispersion_cloud(dry, sr, **params)

        peak = np.max(np.abs(cloud))
        if peak > 0:
            cloud = cloud * (target_peak / peak)

        path = out_dir / f"{name}.wav"
        sf.write(str(path), cloud.astype(np.float32), sr)
        n = params.get("n_droplets", 400)
        print(f"  {name:32s}  N={n:<5d}  {len(cloud)/sr:5.2f}s  peak {peak:.3f} → {target_peak}")


if __name__ == "__main__":
    here = Path(__file__).parent
    render_all(here / "dry.wav", here / "variations")
