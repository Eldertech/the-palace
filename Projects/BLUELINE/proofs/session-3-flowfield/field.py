#!/usr/bin/env python3
"""
BLUELINE Session 3 — THE single flow-field source.

One deterministic, divergence-free field = curl of a scalar potential psi
(laminar drift + a few Gaussian vortices). Computed once, exported to
flow-field.json. Every leg (drawn / steers / sim) reads THIS file untouched —
that is the test of the strong single-source claim.

  (vx, vy) = ( d psi / dy , - d psi / dx )   # curl of a 2D scalar -> divergence-free

Run:  <comfy venv python> field.py
"""
import json, os, math
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
GW, GH = 120, 76                      # grid resolution of the exported source
ASPECT = GW / GH

# scalar potential psi on a normalized domain x in [0,ASPECT], y in [0,1]
xs = np.linspace(0, ASPECT, GW)
ys = np.linspace(0, 1, GH)
X, Y = np.meshgrid(xs, ys)            # shape (GH, GW)

# laminar "rushing by" drift along +x  (psi linear in y gives uniform vx)
psi = 0.9 * Y
# a few vortices (Gaussian bumps in psi); signed amp = spin direction
vortices = [
    (0.55, 0.62,  0.22, 0.13),       # cx, cy, amp, sigma
    (1.05, 0.38, -0.18, 0.11),
    (1.45, 0.66,  0.15, 0.10),
    (0.30, 0.30, -0.12, 0.09),
]
for cx, cy, amp, sig in vortices:
    psi += amp * np.exp(-(((X - cx) ** 2 + (Y - cy) ** 2) / (2 * sig ** 2)))

# curl -> divergence-free field
dpsi_dy, dpsi_dx = np.gradient(psi, ys, xs)
vx = dpsi_dy
vy = -dpsi_dx

mag = np.sqrt(vx ** 2 + vy ** 2)
mag_max = float(mag.max())
# store RAW vectors (untouched). Legs apply their own per-leg scale, not us.
field = {
    "grid": {"w": GW, "h": GH, "aspect": ASPECT},
    "domain": {"x": [0, ASPECT], "y": [0, 1]},
    "mag_max": mag_max,
    "mag_mean": float(mag.mean()),
    "note": "raw curl-of-potential field; divergence-free; row-major [h][w], each cell [vx,vy].",
    "vectors": [[[round(float(vx[j, i]), 5), round(float(vy[j, i]), 5)]
                 for i in range(GW)] for j in range(GH)],
}
out = os.path.join(HERE, "flow-field.json")
json.dump(field, open(out, "w"))
print("WROTE", out, f"({GW}x{GH}, mag_max={mag_max:.3f}, mag_mean={field['mag_mean']:.3f})")

# quiver/streamline preview so we can SEE the one source
try:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    fig, ax = plt.subplots(figsize=(GW/14, GH/14), dpi=120)
    ax.set_facecolor("#15161a")
    speed = mag / mag_max
    ax.streamplot(X, Y, vx, vy, color=speed, cmap="magma", density=1.4, linewidth=1.1, arrowsize=0.8)
    ax.set_xlim(0, ASPECT); ax.set_ylim(0, 1); ax.axis("off")
    fig.patch.set_facecolor("#15161a")
    p = os.path.join(HERE, "renders", "00-field-source.png")
    fig.savefig(p, bbox_inches="tight", pad_inches=0, facecolor="#15161a")
    print("WROTE", p)
except Exception as e:
    print("preview skipped:", e)
print("FIELD_DONE")
