#!/usr/bin/env python3
"""
LEG 1 — DRAWN (comic register): speed-lines that FLOW AROUND THE CHARACTER.

Same idea as Session 3's drawn leg, but now the field knows the body is there, so the
comic speed-lines part around the silhouette, compress past the shoulders/hips, and
trail off into the wake — for free, because it's the same field. Streamlines that would
enter the body are stopped at the surface; seeds never start inside the body.

Renders over a faint ink silhouette (from the ink plate) so you can SEE the lines
flowing around the figure.

PER-LEG MASSAGING (measured cost, same character as S3): seed grid + jitter, streak
length, taper curve, magnitude->width/brightness. The field is NOT edited.
"""
import os, math, random
import numpy as np
from PIL import Image
from flowlib import load_field, sample, in_body

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.abspath(os.path.join(HERE, "..", "renders", "01-drawn-speedlines-around-body.png"))
INK = os.path.abspath(os.path.join(HERE, "..", "inputs", "ink_plate.png"))
W, H = 832, 1040
field = load_field()
asp = field["aspect"]; mag_max = field["mag_max"]
random.seed(7)

# background: faint ink silhouette on near-black, so the flow-around reads
img = Image.new("RGB", (W, H), (16, 17, 21))
ink = Image.open(INK).convert("L").resize((W, H))
ink_arr = np.asarray(ink, dtype=np.float32) / 255.0          # white bg, dark lines
fig = (1.0 - ink_arr)                                        # figure lines bright
tint = np.zeros((H, W, 3), dtype=np.uint8)
tint[..., 0] = (fig * 60).astype(np.uint8)
tint[..., 1] = (fig * 90).astype(np.uint8)
tint[..., 2] = (fig * 150).astype(np.uint8)                 # cool blue ghost of the body
img = Image.fromarray(np.maximum(np.asarray(img), tint))
from PIL import ImageDraw
dr = ImageDraw.Draw(img, "RGBA")


def to_px(x, y):                       # domain -> pixel (NO flip; y grows downward)
    return x / asp * W, y * H


# --- per-leg params (the massaging) ---
SEED_NX, SEED_NY = 60, 76
STEP = 0.006
NSTEP = 30
WMAX = 6.0
CLAMP = min(mag_max, 4.0)              # tame the corner hot-spots for width/brightness


def streamline(x, y):
    if in_body(field, x, y):
        return []
    pts = [(x, y)]
    for _ in range(NSTEP):
        vx, vy = sample(field, x, y)
        m = math.hypot(vx, vy) + 1e-6
        xm, ym = x + vx / m * STEP * 0.5, y + vy / m * STEP * 0.5
        vx2, vy2 = sample(field, xm, ym)
        m2 = math.hypot(vx2, vy2) + 1e-6
        nx, ny = x + vx2 / m2 * STEP, y + vy2 / m2 * STEP
        if not (0 <= nx <= asp and 0 <= ny <= 1):
            break
        if in_body(field, nx, ny):     # stop at the body surface — don't draw through it
            break
        x, y = nx, ny
        pts.append((x, y))
    return pts


def taper_poly(pts, wmax):
    n = len(pts)
    if n < 3:
        return None
    left, right = [], []
    for i, (x, y) in enumerate(pts):
        px, py = to_px(x, y)
        a = pts[max(0, i - 1)]; b = pts[min(n - 1, i + 1)]
        dx, dy = to_px(*b)[0] - to_px(*a)[0], to_px(*b)[1] - to_px(*a)[1]
        L = math.hypot(dx, dy) + 1e-6
        nx, ny = -dy / L, dx / L
        w = wmax * (i / (n - 1)) ** 0.7 / 2.0
        left.append((px + nx * w, py + ny * w))
        right.append((px - nx * w, py - ny * w))
    return left + right[::-1]


drawn = 0
for iy in range(SEED_NY):
    for ix in range(SEED_NX):
        x = (ix + random.uniform(-0.4, 0.4)) / SEED_NX * asp
        y = (iy + random.uniform(-0.4, 0.4)) / SEED_NY
        pts = streamline(x, y)
        if len(pts) < 6:
            continue
        vx, vy = sample(field, *pts[len(pts) // 2])
        spd = min(1.0, math.hypot(vx, vy) / CLAMP)
        poly = taper_poly(pts, WMAX * (0.45 + 0.9 * spd))
        if not poly:
            continue
        val = int(150 + 105 * spd)
        col = (val, val, min(255, int(val * 0.96 + 12)), int(110 + 130 * spd))
        dr.polygon(poly, fill=col)
        drawn += 1

img.save(OUT)
print("WROTE", OUT, f"({drawn} speed-lines)")
print("DRAWN_DONE")
