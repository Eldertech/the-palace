#!/usr/bin/env python3
"""
BLUELINE · Track VI — ELEMENTAL MOTION · displacement-field library.

A *field* is a callable  f(t01) -> (dx, dy)  where t01 in [0,1) is the loop phase
and dx/dy are float32 HxW pixel displacements. The warp engine samples the source
ink at (y - dy, x - dx), so positive dy moves ink DOWN, positive dx moves ink RIGHT.

DESIGN INVARIANTS
  * Seamless loop: every temporal term is a function of phase  phi = 2*pi*t01  with
    an INTEGER number of cycles over the loop, so frame(0) == frame(1) exactly. No
    net translation (that can't loop on a finite canvas) — motion is oscillatory.
  * Subtle + slow ("manipulate the existing ink, slowed down"): amplitudes are a few
    pixels; the caller picks a long period (48-96 frames) for the slowed cadence.
  * Phenomenon presets are just parameter choices over one layered-wave engine, plus
    `from_flow` which loads a Blender-baked velocity sequence (the Tier-B bridge).

This is the deep, BLUELINE-native motion path: the drawn lines themselves move. The AI
draws the ink ONCE; geometry animates it — so the loop is temporally rock-solid where a
per-frame AI restyle would flicker.
"""
import numpy as np


# ---------------------------------------------------------------------------
# core layered-wave engine
# ---------------------------------------------------------------------------

def _grid(H, W):
    yy, xx = np.mgrid[0:H, 0:W]
    return xx.astype(np.float32), yy.astype(np.float32)


def layered_waves(H, W, waves, depth_gain=None):
    """Build a field from a list of wave specs.

    Each wave spec is a dict:
      amp_x, amp_y : pixel amplitude on each axis
      wavelength   : spatial wavelength (px)
      angle        : wavefront orientation (rad); 0 = vertical fronts (horizontal travel)
      cycles       : INTEGER temporal cycles over the loop (sign = travel direction)
      phase        : spatial phase offset (rad)
    `depth_gain` (HxW in [0,1] or None) scales amplitude per-pixel (e.g. bigger ripples
    in the foreground). Returns f(t01) -> (dx, dy).
    """
    xx, yy = _grid(H, W)
    if depth_gain is None:
        depth_gain = np.ones((H, W), np.float32)
    baked = []
    for w in waves:
        ang = w.get("angle", 0.0)
        kx = np.cos(ang) / w["wavelength"]
        ky = np.sin(ang) / w["wavelength"]
        spatial = 2 * np.pi * (kx * xx + ky * yy) + w.get("phase", 0.0)
        baked.append((float(w.get("amp_x", 0.0)), float(w.get("amp_y", 0.0)),
                      spatial, int(w["cycles"])))

    def f(t01):
        dx = np.zeros((H, W), np.float32)
        dy = np.zeros((H, W), np.float32)
        for ax, ay, spatial, cyc in baked:
            ph = spatial - 2 * np.pi * cyc * t01
            s = np.sin(ph)
            if ax:
                dx += ax * np.cos(ph)   # quarter-turn so x/y trace an ellipse (orbital)
            if ay:
                dy += ay * s
        return dx * depth_gain, dy * depth_gain

    return f


# ---------------------------------------------------------------------------
# phenomenon presets
# ---------------------------------------------------------------------------

def water(H, W, amp=5.0, n=5, base_wavelength=150.0, chop=0.4, seed=1):
    """Reflection ripple / gentle chop. Mostly vertical bob, bigger toward the
    foreground (bottom). Near-horizontal wavefronts so the displacement reads as a
    water surface rocking, not a flag waving."""
    rng = np.random.default_rng(seed)
    _, yy = _grid(H, W)
    depth = (yy / max(H - 1, 1)) ** 1.3          # 0 top .. 1 bottom
    depth = (0.25 + 0.75 * depth).astype(np.float32)
    waves = []
    for k in range(n):
        wl = base_wavelength * (0.55 + 0.9 * rng.random())
        ang = np.pi / 2 + rng.uniform(-0.35, 0.35)  # ~horizontal fronts -> vertical bob
        waves.append(dict(amp_y=amp * (0.5 + rng.random()),
                          amp_x=amp * chop * (0.5 + rng.random()),
                          wavelength=wl, angle=ang,
                          cycles=rng.choice([-1, 1, 1, 2]),
                          phase=rng.uniform(0, 2 * np.pi)))
    return layered_waves(H, W, waves, depth_gain=depth)


def flame(H, W, amp=7.0, n=4, base_wavelength=90.0, lateral=0.55, seed=2):
    """Flicker / lick. Oscillatory up-down with lateral curl; faster + higher-frequency
    than water. Pair with a base-anchored vertical weight in the warp (tips dance, base
    stays put) via the mask's distance-from-base ramp."""
    rng = np.random.default_rng(seed)
    waves = []
    for k in range(n):
        wl = base_wavelength * (0.5 + 0.8 * rng.random())
        ang = rng.uniform(-0.5, 0.5)             # ~vertical fronts -> mostly vertical lick
        waves.append(dict(amp_y=amp * (0.6 + rng.random()),
                          amp_x=amp * lateral * (0.4 + rng.random()),
                          wavelength=wl, angle=ang,
                          cycles=rng.choice([1, 2, 2, 3]),   # flames flicker quick
                          phase=rng.uniform(0, 2 * np.pi)))
    return layered_waves(H, W, waves)


def smoke(H, W, amp=6.0, n=5, base_wavelength=160.0, lateral=0.8, seed=3):
    """Mild rising smoke as ink-warp (only for thin wisps — billowing smoke that changes
    topology needs the Blender sim path, not warp). Slow, turbulent, lateral-biased."""
    rng = np.random.default_rng(seed)
    _, yy = _grid(H, W)
    rise = (1.0 - yy / max(H - 1, 1))            # more sway higher up
    rise = (0.4 + 0.8 * rise).astype(np.float32)
    waves = []
    for k in range(n):
        wl = base_wavelength * (0.5 + 1.0 * rng.random())
        ang = rng.uniform(-0.6, 0.6)
        waves.append(dict(amp_y=amp * 0.5 * (0.5 + rng.random()),
                          amp_x=amp * lateral * (0.5 + rng.random()),
                          wavelength=wl, angle=ang,
                          cycles=rng.choice([-1, 1, 1]),
                          phase=rng.uniform(0, 2 * np.pi)))
    return layered_waves(H, W, waves, depth_gain=rise)


def sky(H, W, amp=4.0, n=3, base_wavelength=520.0, seed=4):
    """Time-lapse sky as a very-low-frequency, large-wavelength billow + drift. Reads
    as clouds breathing/sliding. (A one-way sun sweep is a luminance ramp, handled
    separately in the warp CLI, not here.)"""
    rng = np.random.default_rng(seed)
    waves = []
    for k in range(n):
        wl = base_wavelength * (0.7 + 0.7 * rng.random())
        ang = rng.uniform(-0.25, 0.25)           # near-horizontal drift
        waves.append(dict(amp_x=amp * (0.7 + rng.random()),
                          amp_y=amp * 0.35 * (0.5 + rng.random()),
                          wavelength=wl, angle=ang,
                          cycles=1,               # one slow sway per loop
                          phase=rng.uniform(0, 2 * np.pi)))
    return layered_waves(H, W, waves)


def dust(H, W, amp=3.5, n=6, base_wavelength=110.0, drift=0.9, seed=5):
    """Wind-blown dust as a light lateral-biased shimmer. Best as a faint overlay on a
    sparse stipple/fleck layer rather than warping solid ink — but useful for haze."""
    rng = np.random.default_rng(seed)
    waves = []
    for k in range(n):
        wl = base_wavelength * (0.5 + 1.0 * rng.random())
        ang = rng.uniform(-0.3, 0.3)
        waves.append(dict(amp_x=amp * drift * (0.5 + rng.random()),
                          amp_y=amp * 0.3 * (0.5 + rng.random()),
                          wavelength=wl, angle=ang,
                          cycles=rng.choice([1, 2, 2, 3]),
                          phase=rng.uniform(0, 2 * np.pi)))
    return layered_waves(H, W, waves)


# ---------------------------------------------------------------------------
# Tier-B bridge: physically-grounded motion from a Blender velocity bake
# ---------------------------------------------------------------------------

def from_flow(flow_seq, gain=1.0, loop_blend=True):
    """Drive the warp from a baked velocity sequence.

    `flow_seq`: float32 array (T, H, W, 2) of per-frame (vx, vy) screen-space velocity
    (e.g. Blender Mantaflow velocity rendered to OpenEXR, or optical flow of a sim).
    We integrate nothing — we treat per-frame velocity * gain as the instantaneous
    displacement of the ink (a small offset that returns), which keeps it loopable.

    If `loop_blend`, cross-fade the last frames into the first so a non-periodic sim
    still loops (linear ramp blend over 25% of the clip)."""
    T = flow_seq.shape[0]
    seq = flow_seq.astype(np.float32) * gain
    if loop_blend and T > 4:
        b = max(2, T // 4)
        for i in range(b):
            w = i / b
            seq[i] = (1 - w) * seq[i] + w * seq[(T - b + i) % T]

    def f(t01):
        idx = int(round(t01 * T)) % T
        fr = seq[idx]
        return fr[..., 0].copy(), fr[..., 1].copy()

    return f


PRESETS = {
    "water": water, "flame": flame, "smoke": smoke, "sky": sky, "dust": dust,
}
