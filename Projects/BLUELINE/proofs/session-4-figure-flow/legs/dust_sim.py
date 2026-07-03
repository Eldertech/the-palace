#!/usr/bin/env python3
"""
LEG 2 — SIM (cinema register): DUST advected by the field, DISTURBED BY THE CHARACTER.

The same untouched flow-field.json now drives a particle medium: dust/spray blown left
-> right, flowing around the body, PILING on the windward surface, accelerating past the
shoulders/hips, and SHEDDING into the wake behind the figure. The cinema fidelity of the
same arrow the comic speed-lines drew.

Method (fully vectorised over N particles): seed at the inlet + ambient, advect by the
field with a little turbulent jitter, deposit each step into an additive density buffer
(the dust trails). Particles that hit the body stop at the surface (windward pile-up) and
respawn; particles that exit respawn at the inlet. Baked to a still by integrating many
frames of continuous emission. Deterministic (fixed seed).

Run:  <comfy venv python> dust_sim.py
"""
import os
import numpy as np
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
import json
FIELD = json.load(open(os.path.join(HERE, "..", "flow-field.json")))
OUT = os.path.abspath(os.path.join(HERE, "..", "renders", "02-dust-around-body.png"))
INK = os.path.abspath(os.path.join(HERE, "..", "inputs", "ink_plate.png"))

V = np.array(FIELD["vectors"], dtype=np.float32)     # (GH,GW,2) vx,vy
S = np.array(FIELD["solid"], dtype=bool)             # (GH,GW)
GH, GW = S.shape
asp = FIELD["grid"]["aspect"]
mag_max = FIELD["mag_max"]
W, H = 832, 1040
rng = np.random.default_rng(4242)

N = 60000
FRAMES = 1100
STEP = 0.0016
JITTER = 0.0008
CLAMP = min(mag_max, 4.0)

VX = V[..., 0]; VY = V[..., 1]


def sample_vec(x, y):
    """Vectorised bilinear sample of the field at domain coords (x,y)."""
    fx = np.clip(x / asp, 0, 1) * (GW - 1)
    fy = np.clip(y, 0, 1) * (GH - 1)
    x0 = np.floor(fx).astype(int); y0 = np.floor(fy).astype(int)
    x1 = np.minimum(x0 + 1, GW - 1); y1 = np.minimum(y0 + 1, GH - 1)
    tx = fx - x0; ty = fy - y0
    def bil(A):
        return (A[y0, x0] * (1 - tx) * (1 - ty) + A[y0, x1] * tx * (1 - ty)
                + A[y1, x0] * (1 - tx) * ty + A[y1, x1] * tx * ty)
    return bil(VX), bil(VY)


def is_solid(x, y):
    i = np.clip((x / asp * (GW - 1)).astype(int), 0, GW - 1)
    j = np.clip((y * (GH - 1)).astype(int), 0, GH - 1)
    return S[j, i]


# initial particles, none inside the body
px = rng.uniform(0, asp, N); py = rng.uniform(0, 1, N)
bad = is_solid(px, py)
while bad.any():
    px[bad] = rng.uniform(0, asp, bad.sum()); py[bad] = rng.uniform(0, 1, bad.sum())
    bad = is_solid(px, py)

dens = np.zeros((H, W), dtype=np.float32)
pile = np.zeros((H, W), dtype=np.float32)


def dep(buf, x, y, amt):
    ix = np.clip((x / asp * (W - 1)).astype(int), 0, W - 1)
    iy = np.clip((y * (H - 1)).astype(int), 0, H - 1)
    np.add.at(buf, (iy, ix), amt)


for f in range(FRAMES):
    vx, vy = sample_vec(px, py)
    m = np.hypot(vx, vy) + 1e-6
    spd = np.clip(m / CLAMP, 0, 1)
    stp = STEP * (0.35 + 0.9 * spd)
    nx = px + vx / m * stp + rng.normal(0, JITTER, N)
    ny = py + vy / m * stp + rng.normal(0, JITTER, N)

    exited = (nx < 0) | (nx > asp) | (ny < 0) | (ny > 1)
    hit = ~exited & is_solid(np.clip(nx, 0, asp), np.clip(ny, 0, 1))
    moved = ~exited & ~hit

    # dust trail for moved particles (faster = brighter)
    dep(dens, nx[moved], ny[moved], 0.35 * (0.4 + spd[moved]))
    # windward pile-up where particles strike the body surface
    dep(pile, px[hit], py[hit], 1.4)
    dep(dens, px[hit], py[hit], 0.8)
    dep(dens, px[exited], py[exited], 0.5 * (0.4 + spd[exited]))

    px[moved], py[moved] = nx[moved], ny[moved]
    # respawn exited + body-hit at the inlet band
    resp = exited | hit
    nr = int(resp.sum())
    if nr:
        px[resp] = rng.uniform(0.0, 0.05 * asp, nr)
        py[resp] = rng.uniform(0, 1, nr)

# ---- compose the dust image -------------------------------------------------
def norm(a, p=99.5):
    return np.clip(a / (np.percentile(a, p) + 1e-6), 0, 1)

d = norm(dens)
pl = norm(pile, 99.0)
d = np.asarray(Image.fromarray((d * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6)),
               dtype=np.float32) / 255.0
pl = np.asarray(Image.fromarray((pl * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2)),
                dtype=np.float32) / 255.0

ink = np.asarray(Image.open(INK).convert("L").resize((W, H)), dtype=np.float32) / 255.0
fig = 1.0 - ink

rgb = np.full((H, W, 3), 0.06, dtype=np.float32)
rgb[..., 0] += d * 0.95 + pl * 1.0
rgb[..., 1] += d * 0.92 + pl * 0.98
rgb[..., 2] += d * 0.82 + pl * 0.9
rgb[..., 0] = np.maximum(rgb[..., 0], fig * 0.10)
rgb[..., 1] = np.maximum(rgb[..., 1], fig * 0.16)
rgb[..., 2] = np.maximum(rgb[..., 2], fig * 0.30)

Image.fromarray((np.clip(rgb, 0, 1) * 255).astype(np.uint8)).save(OUT)
print("WROTE", OUT, f"({N} particles x {FRAMES} frames, vectorised)")
print("DUST_DONE")
