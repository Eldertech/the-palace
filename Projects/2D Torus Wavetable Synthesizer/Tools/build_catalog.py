#!/usr/bin/env python3
"""
build_catalog.py — generate the Stage-3 surfaces-led 2D-wavetable catalog.

Run from anywhere; paths are absolute. Produces 10 (.wav, .png, .md) bundles
plus the master Wavetable Catalog.md index. Idempotent — safe to re-run.

All entries are 1024 × 1024 (square): Y axis is sampled as cleanly as X, so
audio-rate Y phasors do not introduce row-stepping aliasing. Tier 1 utility
wavetables are continuous interpolations (crossfaded between adjacent
integer-cycle waveforms); Tier 2 named surfaces are 2D continuous functions
of phi and psi sampled on a 1024×1024 grid.

Buffer size per file: 1024×1024×4 bytes ≈ 4 MB.
Patch usage: send `rows 1024` to 2d.wave~ before playback.

Surfaces:
  01 sine_cycle_sweep        Y = continuous cycle count 1 → 16
  02 partial_stack_sweep     Y = continuous partial count 1 → 16
  03 duty_cycle_morph        Y = duty cycle 50% → 3%
  04 sine_plus_3rd_sweep     Y = 3rd-harmonic depth 0 → 1
  10 membrane                rectangular drumhead modes
  11 chladni_ghost           plate nodal pattern, sharpened
  12 theta_surface           Jacobi theta on T^2
  13 stiff_string            piano-B stretched partials
  14 knot_shadow             (3,2) cable-aligned ridges
  15 penrose_lattice         5-fold quasicrystal approx
"""
from __future__ import annotations
import os
import struct
import subprocess
import textwrap

import numpy as np


PROJ = "/sessions/optimistic-eager-bell/mnt/The Palace/Projects/2D Torus Wavetable Synthesizer"
WT_DIR = f"{PROJ}/Wavetables"
TOOLS_DIR = f"{PROJ}/Tools"
SR = 48000


# ---------------------------------------------------------------------------
# WAV writer (32-bit float, mono)
# ---------------------------------------------------------------------------

def write_float_wav(path: str, data: np.ndarray, sr: int) -> None:
    n = len(data)
    fmt_chunk = struct.pack("<HHIIHH", 3, 1, sr, sr * 4, 4, 32)
    fact_chunk = struct.pack("<I", n)
    body = data.astype("<f4").tobytes()
    riff_size = 4 + (8 + len(fmt_chunk)) + (8 + len(fact_chunk)) + (8 + len(body))
    with open(path, "wb") as f:
        f.write(b"RIFF")
        f.write(struct.pack("<I", riff_size))
        f.write(b"WAVE")
        f.write(b"fmt ")
        f.write(struct.pack("<I", len(fmt_chunk)))
        f.write(fmt_chunk)
        f.write(b"fact")
        f.write(struct.pack("<I", len(fact_chunk)))
        f.write(fact_chunk)
        f.write(b"data")
        f.write(struct.pack("<I", len(body)))
        f.write(body)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def grid(rows: int, row_len: int):
    """Return (PHI, PSI) meshgrids of shape (rows, row_len)."""
    phi = np.linspace(0.0, 2 * np.pi, row_len, endpoint=False)
    psi = np.linspace(0.0, 2 * np.pi, rows, endpoint=False)
    PHI, PSI = np.meshgrid(phi, psi)
    return PHI, PSI


def normalize_global(table: np.ndarray, headroom: float = 0.02) -> np.ndarray:
    peak = float(np.max(np.abs(table)))
    if peak <= 0.0:
        return table
    return table * ((1.0 - headroom) / peak)


def normalize_per_row(table: np.ndarray, headroom: float = 0.02) -> np.ndarray:
    out = np.empty_like(table)
    for i in range(table.shape[0]):
        peak = float(np.max(np.abs(table[i])))
        if peak <= 0.0:
            out[i] = table[i]
        else:
            out[i] = table[i] * ((1.0 - headroom) / peak)
    return out


# ---------------------------------------------------------------------------
# Tier 1 — utility wavetables (16 x 1024)
# ---------------------------------------------------------------------------

def sine_cycle_sweep(rows, row_len):
    """Continuous cycle-count sweep from 1 to 16 across rows.
    Each row crossfades between adjacent integer-cycle sines so every row
    starts and ends at zero (no wrap discontinuity)."""
    phi = np.linspace(0.0, 2 * np.pi, row_len, endpoint=False)
    table = np.empty((rows, row_len))
    cmin, cmax = 1.0, 16.0
    for k in range(rows):
        c = cmin + (cmax - cmin) * (k / max(rows - 1, 1))
        c_int = int(np.floor(c))
        c_frac = c - c_int
        if c_frac == 0.0:
            table[k] = np.sin(c_int * phi)
        else:
            table[k] = ((1.0 - c_frac) * np.sin(c_int * phi)
                        + c_frac * np.sin((c_int + 1) * phi))
    return table


def partial_stack_sweep(rows, row_len):
    """Continuous partial-count sweep from 1 to 16. Adjacent partial counts
    are crossfaded by the fractional part."""
    phi = np.linspace(0.0, 2 * np.pi, row_len, endpoint=False)
    table = np.zeros((rows, row_len))
    pmin, pmax = 1.0, 16.0
    for k in range(rows):
        p = pmin + (pmax - pmin) * (k / max(rows - 1, 1))
        p_int = int(np.floor(p))
        p_frac = p - p_int
        for n in range(1, p_int + 1):
            table[k] += np.sin(n * phi) / n
        if p_frac > 0.0:
            n_next = p_int + 1
            table[k] += p_frac * np.sin(n_next * phi) / n_next
    return normalize_per_row(table)


def duty_cycle_morph(rows, row_len):
    """Smooth duty-cycle morph 50% → 3%. The hard square-wave edge stays
    a hard edge; the morph is in the duty-cycle position only."""
    x = np.linspace(0.0, 1.0, row_len, endpoint=False)
    table = np.empty((rows, row_len))
    duty_max, duty_min = 0.5, 0.03
    for k in range(rows):
        duty = duty_max - (duty_max - duty_min) * (k / max(rows - 1, 1))
        table[k] = np.where(x < duty, 1.0, -1.0)
    return table


def sine_plus_3rd_sweep(rows, row_len):
    """Smooth depth sweep of the 3rd-harmonic modulator from 0 to 1."""
    phi = np.linspace(0.0, 2 * np.pi, row_len, endpoint=False)
    table = np.zeros((rows, row_len))
    for k in range(rows):
        a = k / max(rows - 1, 1)        # 0 -> 1
        table[k] = np.sin(phi) + a * np.sin(3 * phi)
    return normalize_per_row(table)


# ---------------------------------------------------------------------------
# Tier 2 — named surfaces (64 x 1024)
# ---------------------------------------------------------------------------

def membrane(rows, row_len):
    """4-fold symmetric drumhead-style sum of low-order sin*sin modes."""
    PHI, PSI = grid(rows, row_len)
    W = np.zeros_like(PHI)
    modes = [
        (1, 1, 1.00),
        (2, 1, 0.55),  (1, 2, 0.55),
        (2, 2, 0.40),
        (3, 1, 0.30),  (1, 3, 0.30),
        (3, 2, 0.22),  (2, 3, 0.22),
        (3, 3, 0.15),
        (4, 1, 0.12),  (1, 4, 0.12),
        (4, 2, 0.09),  (2, 4, 0.09),
    ]
    for m, n, amp in modes:
        W += amp * np.sin(m * PHI) * np.sin(n * PSI)
    return normalize_global(W)


def chladni_ghost(rows, row_len):
    """Vibrating-plate nodal surface, sharpened by signed sqrt."""
    PHI, PSI = grid(rows, row_len)
    m, n = 3, 5
    C = np.sin(m * PHI) * np.sin(n * PSI) + np.sin(n * PHI) * np.sin(m * PSI)
    sharp = np.sign(C) * np.sqrt(np.abs(C))
    return normalize_global(sharp)


def theta_surface(rows, row_len):
    """Sum_{m,n} q^(m^2+n^2) cos(m*phi + n*psi). Theta-3-like on T^2."""
    PHI, PSI = grid(rows, row_len)
    q = 0.55
    W = np.zeros_like(PHI)
    N = 6
    for m in range(-N, N + 1):
        for n in range(-N, N + 1):
            if m == 0 and n == 0:
                continue
            amp = q ** (m * m + n * n)
            W += amp * np.cos(m * PHI + n * PSI)
    return normalize_global(W)


def stiff_string(rows, row_len):
    """Saw-flavoured surface with quadratically-stretched partials.
    Stiffness B sweeps along psi. To keep every row single-cycle while
    still giving smooth Y motion, each partial is realised as a crossfade
    between its floor and ceiling integer harmonics."""
    phi = np.linspace(0.0, 2 * np.pi, row_len, endpoint=False)
    table = np.zeros((rows, row_len))
    Bmax = 0.06
    n_partials = 12
    for k in range(rows):
        B = Bmax * (k / max(rows - 1, 1))
        for n in range(1, n_partials + 1):
            f_real = n * np.sqrt(1.0 + B * n * n)
            f_lo = max(1, int(np.floor(f_real)))
            f_hi = max(1, int(np.ceil(f_real)))
            f_frac = f_real - f_lo
            if f_lo == f_hi:
                table[k] += (1.0 / n) * np.sin(f_lo * phi)
            else:
                table[k] += (1.0 / n) * (
                    (1.0 - f_frac) * np.sin(f_lo * phi)
                    + f_frac * np.sin(f_hi * phi)
                )
    return normalize_per_row(table)


def knot_shadow(rows, row_len):
    """(p,q)=(3,2) cable-aligned ridges. Function is constant along
    (p,q) torus knots, so detuning the scan ratio off 3:2 sweeps the
    scan path off the ridge into surrounding territory."""
    PHI, PSI = grid(rows, row_len)
    p, q = 3, 2
    base = np.cos(q * PHI - p * PSI)
    base += 0.45 * np.cos(2 * (q * PHI - p * PSI))
    base += 0.25 * np.cos(3 * (q * PHI - p * PSI))
    # Add a weak orthogonal modulation so the surface isn't a single mode
    base += 0.15 * np.cos(p * PHI + q * PSI)
    return normalize_global(base)


def penrose_lattice(rows, row_len):
    """Approximate 5-fold quasicrystal via sum of cosines along 5 directions,
    rounded onto the integer torus lattice."""
    PHI, PSI = grid(rows, row_len)
    K = 11
    W = np.zeros_like(PHI)
    for k in range(5):
        theta = 2 * np.pi * k / 5
        kx = int(round(K * np.cos(theta)))
        ky = int(round(K * np.sin(theta)))
        W += np.cos(kx * PHI + ky * PSI)
    return normalize_global(W)


# ---------------------------------------------------------------------------
# Catalog table
# ---------------------------------------------------------------------------

SQ = 1024  # square wavetable size — both axes sampled at this resolution

ENTRIES = [
    # (slug,             tier, rows, row_len, fn,                     short_summary)
    ("01_sine_cycle_sweep",     1, SQ, SQ, sine_cycle_sweep,
     "Continuous cycle-count sweep, 1 → 16. Y is the harmonic-number axis."),
    ("02_partial_stack_sweep",  1, SQ, SQ, partial_stack_sweep,
     "Saw partials built up smoothly, 1 → 16. Y is harmonic richness."),
    ("03_duty_cycle_morph",     1, SQ, SQ, duty_cycle_morph,
     "Square (50%) tapering smoothly to a 3% pulse. Y is duty cycle."),
    ("04_sine_plus_3rd_sweep",  1, SQ, SQ, sine_plus_3rd_sweep,
     "Fundamental plus continuously-varying 3rd harmonic. Y is depth."),
    ("10_membrane",             2, SQ, SQ, membrane,
     "Rectangular drum-head modes summed at low order. 4-fold symmetric."),
    ("11_chladni_ghost",        2, SQ, SQ, chladni_ghost,
     "Vibrating-plate nodal pattern, sharpened to ridges. 4-fold."),
    ("12_theta_surface",        2, SQ, SQ, theta_surface,
     "Jacobi-theta-style surface on T^2. Modular character."),
    ("13_stiff_string",         2, SQ, SQ, stiff_string,
     "Saw whose high partials are quadratically stretched as Y rises."),
    ("14_knot_shadow",          2, SQ, SQ, knot_shadow,
     "(3,2) torus-knot-aligned ridges. The ratio gate made visible."),
    ("15_penrose_lattice",      2, SQ, SQ, penrose_lattice,
     "5-fold quasicrystal approximation via cut-and-project sum."),
]


# ---------------------------------------------------------------------------
# Per-entry markdown bodies (bespoke prose)
# ---------------------------------------------------------------------------

BODIES: dict[str, dict[str, str]] = {
    "01_sine_cycle_sweep": {
        "title": "01 — Sine Cycle Sweep",
        "demonstrates": (
            "Pure sine on every row, with cycle count varying continuously from 1 (row 0) to 16 "
            "(row 1023). Each row is a crossfade between adjacent integer-cycle sines — every row "
            "still starts and ends at zero, so there is no wrap discontinuity. The Y axis reads as "
            "a continuous frequency multiplier: at fixed X-phasor frequency f, Y=0 outputs f, "
            "Y=0.5 outputs roughly 8f, Y=1 outputs 16f, with smooth interpolation in between."
        ),
        "musical_use": (
            "Hold X = 110 Hz and slowly automate Y from 0 to 1. You hear a clean ramp of pitch "
            "spanning four octaves. Run Y as another phasor at audio rate near 110 Hz: the dual "
            "pitch creates a structured sideband spectrum — every integer combination m*X + n*Y "
            "where the surface has nonzero coefficient. Because the only nonzero coefficients are "
            "at (m, 0) for m = 1..16, the spectrum is sparse and harmonic-only."
        ),
        "notes": (
            "The Y crossfade between integer cycles is the cleanest possible alias-free Y axis: "
            "every value of Y produces a row with integer-multiple harmonics only. Aliasing risk "
            "comes from the high-cycle rows themselves (row 1023 has 16 cycles in 1024 samples — "
            "harmonic 16 — readout aliasing depends on phasor frequency vs sample rate)."
        ),
    },
    "02_partial_stack_sweep": {
        "title": "02 — Partial Stack Sweep",
        "demonstrates": (
            "Sawtooth built up partial-by-partial. Row 0 is a pure sine (1 partial); row 1023 is "
            "a 16-partial bandlimited saw. The partial count interpolates continuously across "
            "the rows, with adjacent integer-partial counts crossfaded by the fractional part. "
            "Y is the harmonic-richness axis."
        ),
        "musical_use": (
            "Sweep Y as a brightness envelope. Hold X at any musical pitch; modulate Y from 0 to 1 "
            "with an ADSR for an instant spectral 'opening' gesture (a violin getting bowed "
            "harder). Detune two voices by a semitone with different Y trajectories for a chorused "
            "saw-pad whose spectral movement is independent of pitch."
        ),
        "notes": (
            "Logic 1 (direct Fourier coefficient design) at its most literal: we wrote down the "
            "partial amplitudes and the wavetable is exactly that. The 1024-row Y resolution lets "
            "the brightness envelope feel continuous even at audio-rate Y modulation."
        ),
    },
    "03_duty_cycle_morph": {
        "title": "03 — Duty Cycle Morph",
        "demonstrates": (
            "Square wave with duty cycle smoothly tapering from 50% (row 0) to 3% (row 1023). "
            "The Y axis is pulse width."
        ),
        "musical_use": (
            "PWM via Y modulation. A slow Y phasor (~0.2–2 Hz) gives classic PWM motion. An "
            "audio-rate Y phasor modulates the duty cycle thousands of times per second, growing "
            "whole new sideband families on the spectrum. This is the cleanest Tier-1 demo of "
            "audio-rate Y as a useful musical move rather than just a noise source — the square "
            "wave's only nonzero Fourier coefficients are at odd m, so the (m, n) spectrum is "
            "particularly clean and readable."
        ),
        "notes": (
            "Every row has a hard square-wave edge — these will alias if pushed high. For musical "
            "use the upper rows (narrow pulses) want a low-pass filter behind them."
        ),
    },
    "04_sine_plus_3rd_sweep": {
        "title": "04 — Sine + Variable 3rd Harmonic",
        "demonstrates": (
            "Row k = sin(phi) + (k/1023)*sin(3*phi), normalised per row. Pure sine at the top of "
            "the surface, sine + equal-amplitude 3rd harmonic at the bottom. Y is the modulator "
            "depth axis — the simplest possible 'FM-like' move without using FM."
        ),
        "musical_use": (
            "A small but legible test of the project's central idea: by *changing the surface "
            "shape* via Y rather than modulating frequency, we get a spectral move that FM "
            "cannot produce as a first-class control. With Y as another phasor, every X cycle "
            "sees the surface's full Y range — the perceived timbre depends on the X:Y ratio."
        ),
        "notes": (
            "Useful baseline against which to compare the Tier-2 surfaces: any Tier-2 surface "
            "should feel *richer* than this one. If it doesn't, the surface design isn't using "
            "the additional dimensions it has access to."
        ),
    },
    "10_membrane": {
        "title": "10 — Membrane",
        "demonstrates": (
            "Sum of low-order rectangular-drumhead modes sin(m*phi)*sin(n*psi), with amplitudes "
            "weighted toward small (m,n) and 4-fold symmetric under phi <-> psi swap. The "
            "spectrum is a 2D lattice peaked near the origin — the surface is smooth, with one "
            "central mound and gentle outer ripples."
        ),
        "musical_use": (
            "The 'reference timbre' surface — what a drumhead would sound like if you scanned it "
            "at audio rate. Try X:Y ratio 3:2 — the closed orbit traces a (3,2) curve through the "
            "central mound, producing a stable harmonic tone with strong 2nd, 3rd, 5th partials. "
            "Detune to 3:2.01 for the project's headline effect: a quasi-periodic shimmer that no "
            "single-oscillator instrument can produce."
        ),
        "notes": (
            "Logic: direct Fourier (Logic 1). Surface symmetry: 4-fold (D_4 subgroup of T^2 lattice "
            "symmetries). This surface is a deliberately conservative starting point — the partials "
            "are orderly because the modes are orderly. The other tier-2 surfaces deliberately "
            "depart from this in different directions."
        ),
    },
    "11_chladni_ghost": {
        "title": "11 — Chladni Ghost",
        "demonstrates": (
            "C(phi,psi) = sin(3*phi)*sin(5*psi) + sin(5*phi)*sin(3*psi), then sharpened by "
            "signed-sqrt: W = sign(C) * sqrt(|C|). The result has narrow valleys along the (3,5) "
            "Chladni nodal pattern and sharp ridges in between. 4-fold symmetric; the spectrum is "
            "a sparse lattice with dominant peaks at (3,5), (5,3), and the difference modes "
            "produced by the sharpening nonlinearity."
        ),
        "musical_use": (
            "The ratio knob earns its keep here. At X:Y = 3:5 the scan path closes onto the "
            "Chladni nodal lattice itself — the output is a sustained, hollow, bell-like tone. "
            "At 5:3 you get the dual orbit, with subtly different spectral weight. Off-rational "
            "ratios produce ergodic shimmer with strong harmonic 'attractors' near the integer "
            "lattice points — the inharmonicity is *structured*, not noise-like."
        ),
        "notes": (
            "Logic blend: Logic 1 (Fourier specification of C) plus Logic 2 (the signed-sqrt is a "
            "nonlinear operator, equivalent to a p-Laplacian-style shaping). The seventh-surface "
            "slot is open in the project — a Chladni Ghost variant with different (m,n) is a "
            "candidate."
        ),
    },
    "12_theta_surface": {
        "title": "12 — Theta Surface",
        "demonstrates": (
            "W = Sum_{m,n=-6..6} q^(m^2+n^2) * cos(m*phi + n*psi) with q = 0.55. This is closely "
            "related to the heat kernel on T^2, which is the Jacobi theta function evaluated at a "
            "specific imaginary time. The spectrum has every 2D Fourier mode populated with a "
            "Gaussian-tapered amplitude — radial 1/f-style decay, isotropic on the lattice."
        ),
        "musical_use": (
            "Because every (m,n) mode contributes, every integer frequency combination "
            "f_{m,n} = m*omega_1 + n*omega_2 produces audible output — densely populated spectrum. "
            "This is the surface to use when you want a complex, 'every harmonic and inharmonic "
            "is present' wash. Set X and Y to nearby frequencies (e.g. X=110, Y=109.7) and the "
            "near-rational beating pattern is rich and slow."
        ),
        "notes": (
            "Logic: direct Fourier (Logic 1) with theta-function-inspired coefficient pattern. "
            "Modular symmetry of theta is approximate here — true PSL(2,Z) action requires the "
            "complex modular parameter tau, not a single real q. A future variant that genuinely "
            "exploits the modular symmetry is a candidate for a logic-tier wavetable."
        ),
    },
    "13_stiff_string": {
        "title": "13 — Stiff String",
        "demonstrates": (
            "Sawtooth-style row with partials at f_n = round(n * sqrt(1 + B*n^2)) instead of "
            "integer multiples. B sweeps from 0 (row 0, clean saw) to 0.06 (row 63, piano-like "
            "stiffness). Higher-numbered partials get progressively shifted upward."
        ),
        "musical_use": (
            "The clearest demonstration of the 'inharmonicity is a continuous parameter' thesis. "
            "Hold X at a piano-pitch frequency, sweep Y from 0 to 1: the timbre transitions from "
            "an idealised sawtooth (zero stiffness) into a piano-string-like spectrum (stretched "
            "octaves). Pair with a slowly moving Y phasor and a percussive amplitude envelope and "
            "you have the kernel of a piano-substitute synth voice."
        ),
        "notes": (
            "Caveat: this is the *static-wavetable approximation* of the project's stiffness "
            "concept. The richer version is the project description's 'position-dependent "
            "velocity warping on the scan path' — that needs runtime phasor-warping logic and "
            "produces the partials at exact non-integer frequencies, not rounded. Treat this "
            "wavetable as the bandlimited hint of what the dynamic version will sound like."
        ),
    },
    "14_knot_shadow": {
        "title": "14 — Knot Shadow",
        "demonstrates": (
            "W = cos(2*phi - 3*psi) + 0.45 cos(2*(2*phi-3*psi)) + 0.25 cos(3*(2*phi-3*psi)) + "
            "0.15 cos(3*phi + 2*psi). The first three terms are constant along (3,2) torus "
            "knots — so a scan path with X:Y = 3:2 traces a level set of the surface. The fourth "
            "term breaks pure constancy and gives the surface a small orthogonal modulation."
        ),
        "musical_use": (
            "This is the surface that proves the project's central design fact: the ratio "
            "of scan rates is the inharmonicity gate. Set X:Y = 3:2 exactly: you should hear a "
            "sustained, near-pure tone whose pitch is X/3 = Y/2. Detune to 3.0:2.01 — the closed "
            "orbit opens into a Kronecker flow that drifts across the surface, sweeping the "
            "small orthogonal modulation in and out. The detune amount controls the rate of "
            "drift; the surface controls the texture of what you hear during the drift."
        ),
        "notes": (
            "Logic 1 again, but designed *for* a particular trajectory rather than a particular "
            "spectrum — a small but important shift in design intent. Other (p,q) variants are "
            "natural follow-ups — a (5,2) knot shadow would unlock different tonal territory."
        ),
    },
    "15_penrose_lattice": {
        "title": "15 — Penrose Lattice",
        "demonstrates": (
            "Approximate 5-fold-symmetric surface via the cut-and-project recipe: sum of five "
            "cosines along directions 0, 72, 144, 216, 288 degrees, with each direction's spatial "
            "frequency rounded to the nearest integer torus mode (K=11). True 5-fold symmetry is "
            "impossible on T^2, so the rounding produces a structured but quasi-aperiodic "
            "appearance — local 5-fold star clusters that don't tile periodically."
        ),
        "musical_use": (
            "The most exotic of the catalog. The spectrum has its strongest peaks at five "
            "distinct (m,n) lattice points arranged near a circle of radius K — meaning at any "
            "scan ratio, five intense partial families compete. There is no 'home' rational ratio "
            "where the orbit closes onto a clean attractor; every ratio you choose places the "
            "orbit in some relation to all five star directions simultaneously. Sweep the ratio "
            "slowly and listen for the timbre cycling through five 'preferred' colours."
        ),
        "notes": (
            "This surface is the catalog's clearest argument for why the project framing is "
            "needed: a 1D wavetable cannot represent a 5-fold structured spectrum at all. The "
            "5-fold symmetry is intrinsically 2D. A future variant could increase K (sharper "
            "5-fold appearance, but more aliased) or use proper higher-dimensional cut-and-project "
            "rather than the angular approximation."
        ),
    },
}


# ---------------------------------------------------------------------------
# Markdown rendering
# ---------------------------------------------------------------------------

def md_for_entry(slug: str, tier: int, rows: int, row_len: int, summary: str) -> str:
    body = BODIES[slug]
    title = body["title"]
    total = rows * row_len
    duration_ms = total / SR * 1000
    front = textwrap.dedent(f"""\
        ---
        title: {title}
        type: meta
        pillars:
          - tools
          - creation
        born: 2026-04-26
        stage: sprout
        status: active
        links:
          - target: "[[2D Torus Wavetable Synthesizer]]"
            type: connects-to
            label: instruments
        ---
        # {title}

        {summary}

        ![Heightmap]({slug}.png)

        ## File

        `{slug}.wav` — mono, 32-bit float, 48 kHz, {rows} × {row_len} = {total} samples ({duration_ms/1000:.3f} s).
        Square wavetable: send `rows {rows}` to the `2d.wave~` object before playback so the Y axis is sampled as densely as X.

        ## What it demonstrates

        {body['demonstrates']}

        ## Musical use

        {body['musical_use']}

        ## Notes

        {body['notes']}
        """)
    return front


# ---------------------------------------------------------------------------
# Master index
# ---------------------------------------------------------------------------

def write_master_index() -> str:
    tier_lines = {1: [], 2: []}
    for slug, tier, rows, row_len, _fn, summary in ENTRIES:
        title = BODIES[slug]["title"]
        tier_lines[tier].append(f"- [[{title}]] — {summary}")
    body = textwrap.dedent("""\
        ---
        title: 2D Wavetable Catalog
        type: hub
        pillars:
          - tools
          - creation
        born: 2026-04-26
        stage: growing
        status: active
        links:
          - target: "[[2D Torus Wavetable Synthesizer]]"
            type: connects-to
            label: catalogues
          - target: "[[2D Torus Wavetable Synthesizer — Build Log]]"
            type: connects-to
            label: chronicled-by
        ---
        # 2D Wavetable Catalog

        Catalog of 2D wavetable surfaces for [[2D Torus Wavetable Synthesizer]]. Each entry has a
        `.wav` file (mono, 32-bit float, 48 kHz), a heightmap PNG preview, and a markdown index
        entry describing what the surface demonstrates and how to use it musically.

        Catalog convention: filenames begin with a numeric prefix that doubles as catalog order.
        00 is the diagnostic; 01–09 are reserved for utility (Tier 1) wavetables; 10–19 are named
        surfaces (Tier 2). All catalog entries past 00 are square (1024 × 1024) so audio-rate
        Y phasors don't introduce row-stepping aliasing.

        ## Tier 0 — Diagnostic

        - [[00 — Test Diagnostic Wavetable]] — 1024 × 1024 (rebuilt to match the catalog
          convention). Same 16 anchor waveforms as the original Stage-1 design, sitting at
          Y = k/16, with smooth crossfade between them across the 63 sub-rows in each segment.
          Static (Y held) tests behave exactly as designed; audio-rate Y reads as a smooth
          morph through all 16 anchors.

        ## Tier 1 — Utility (1024 × 1024)

        Send `rows 1024` to `2d.wave~`. Each Tier-1 wavetable is a smooth Y-axis morph between
        adjacent integer-cycle (or integer-partial) waveforms — Y now reads as a continuous
        timbral parameter rather than 16 discrete steps.

    """)
    body += "\n".join(tier_lines[1]) + "\n\n"
    body += textwrap.dedent("""\

        ## Tier 2 — Named Surfaces (1024 × 1024)

        Send `rows 1024` to `2d.wave~`. Buffer length is 1024 × 1024 = 1 048 576 samples
        (≈ 21.85 s at 48 kHz, ≈ 4 MB per file as 32-bit float). These six surfaces are the
        project's [[2D Torus Wavetable Synthesizer]] §"Seven Surfaces" minus the unspecified
        seventh slot.

    """)
    body += "\n".join(tier_lines[2]) + "\n\n"
    body += textwrap.dedent("""\

        ## Tools

        - [`Tools/visualize_wavetable.py`](Tools/visualize_wavetable.py) — render any wavetable WAV
          to a PNG heightmap (or stacked-row, or both).
        - [`Tools/build_catalog.py`](Tools/build_catalog.py) — regenerate every Tier-1 and Tier-2
          entry from scratch (idempotent).
        - [`Tools/rebuild_diagnostic.py`](Tools/rebuild_diagnostic.py) — regenerate
          [[00 — Test Diagnostic Wavetable]] independently of the catalog.

        ## Status

        Verified working as of 2026-04-26. Loudon's evaluation of the 1024×1024 build:
        "these wavetables work well." All 11 entries play as designed; Tier 2 surfaces respond
        to X:Y ratio detuning the way the project's central design fact predicts.

        ## Open question — Y-axis interpolation strategy

        Linear sample-domain interpolation between dissimilar anchor waveforms drops RMS at the
        midpoint. RMS-vs-Y plots in `Wavetables/_rms_diagnostic.png` and `_rms_tier1.png` show
        the issue clearly — the diagnostic's sine → sawtooth transition is the worst case
        (~10 dB midpoint drop, due to the negative ⟨sin, saw⟩ inner product); the
        sine-cycle-sweep has 15 ~3 dB dips per traversal at every integer-cycle boundary. The
        duty-cycle morph and 3rd-harmonic sweep are flat (correlated anchors); Tier 2 surfaces
        are not affected (smooth 2D continuous functions, not anchor crossfades).

        Three candidate fixes are live: equal-power crossfade, constant-RMS post-normalization,
        spectral-domain interpolation. Constant-RMS is the cheapest robust answer for the
        diagnostic and 01_sine_cycle_sweep when the dip becomes annoying; spectral-domain is
        the right tool when we get to surfaces that interpolate between symmetry classes
        (Membrane ↔ Chladni). Decision deferred — the current build is musical enough to keep
        moving. See [[2D Torus Wavetable Synthesizer — Build Log]] §"The level-dip discovery"
        for the math and the trade-off table.

        ## Forward vectors

        Concrete next-step candidates this catalog suggests:

        - **The Seventh Surface.** [[2D Torus Wavetable Synthesizer]] §"Seven Surfaces" leaves
          the seventh slot open; the catalog gap is itself a forcing function. Candidates: a real
          Kuramoto-bake (Logic 3); a Matérn random-field (Logic 4); a log-likelihood-of-
          statistical-model surface (Logic 5).
        - **(p,q) family.** [[14 — Knot Shadow]] is the (3,2) instance. (5,2), (5,3), (7,3)
          variants are minutes each in `build_catalog.py` and would give a comparable family demo.
        - **Symmetric morph stack.** Both 4-fold surfaces ([[10 — Membrane]] and
          [[11 — Chladni Ghost]]) can be crossfaded coefficient-by-coefficient — a single
          1024×1024 file whose Y axis interpolates between them. This is the natural place to
          first deploy spectral-domain interpolation.
        - **RNBO prototype.** Smallest playable instance: one surface (recommended start:
          [[14 — Knot Shadow]]), two phasors, ratio knob, audible output. ~30 lines of
          `codebox~`. The catalog is the raw material; this is the conversion to a real-time
          instrument.
        - **Constant-RMS rebuild of [[00 — Test Diagnostic Wavetable]] and
          [[01 — Sine Cycle Sweep]]** when the level dip becomes annoying. Cheap.
        """)
    out = f"{PROJ}/2D Wavetable Catalog.md"
    with open(out, "w") as f:
        f.write(body)
    return out


# ---------------------------------------------------------------------------
# Build pipeline
# ---------------------------------------------------------------------------

def build():
    os.makedirs(WT_DIR, exist_ok=True)
    visualizer = f"{TOOLS_DIR}/visualize_wavetable.py"

    for slug, tier, rows, row_len, fn, summary in ENTRIES:
        table = fn(rows, row_len)
        audio = table.flatten().astype(np.float32)
        wav_path = f"{WT_DIR}/{slug}.wav"
        write_float_wav(wav_path, audio, SR)

        png_path = f"{WT_DIR}/{slug}.png"
        # Render the heightmap at native resolution (square 1024×1024 by default).
        png_w = min(row_len, 1024)
        png_h = min(rows, 1024)
        subprocess.run(
            ["python3", visualizer, wav_path, "-o", png_path,
             "--row-len", str(row_len),
             "--width", str(png_w), "--height", str(png_h)],
            check=True,
            capture_output=True,
        )

        # The .md filename matches the entry's frontmatter title (palace
        # convention; see SCHEMA §3 "title must match filename"). The .wav
        # and .png keep their slug filenames — the .md body references them
        # by slug, so they don't need to change.
        title = BODIES[slug]["title"]
        md_path = f"{WT_DIR}/{title}.md"
        with open(md_path, "w") as f:
            f.write(md_for_entry(slug, tier, rows, row_len, summary))

        print(f"  built {slug}: {len(audio)} samples, png {os.path.getsize(png_path)} bytes")

    idx_path = write_master_index()
    # Note: master index lives at "2D Wavetable Catalog.md" (title-form,
    # palace convention). See SCHEMA §3 "title must match filename".
    print(f"  wrote master index: {idx_path}")


if __name__ == "__main__":
    build()
