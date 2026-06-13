#!/usr/bin/env python3
"""
LEG 1 — DRAWN (comic register): graphic speed-lines from THE field.

Integrates streamlines through the untouched field and renders them as tapered
comic strokes (thin tail -> bright head), width/length scaled by local speed.

PER-LEG MASSAGING (the cost of this leg, measured for the strong-vs-likely-true verdict):
  - seed strategy: jittered grid of start points
  - arc length / step count (how long a streak reads as a "speed line")
  - taper curve + a magnitude->width scale  (field NOT edited; render params only)
"""
import os, math, random
import numpy as np
from PIL import Image, ImageDraw
from flowlib import load_field, sample

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.abspath(os.path.join(HERE, "..", "renders", "01-drawn-speedlines.png"))
W, H = 960, 608
field = load_field()
asp = field["aspect"]; mag_max = field["mag_max"]
random.seed(7)

img = Image.new("RGB", (W, H), (18, 19, 23))
dr = ImageDraw.Draw(img, "RGBA")

def to_px(x, y):  # domain -> pixel
    return x / asp * W, (1 - y) * H

# --- per-leg params (the massaging) ---
SEED_NX, SEED_NY = 46, 30      # seed grid
STEP = 0.006                   # integration step (domain units)
NSTEP = 26                     # streak length
WMAX = 5.0                     # head width px

def streamline(x, y):
    pts = [(x, y)]
    for _ in range(NSTEP):
        vx, vy = sample(field, x, y)
        m = math.hypot(vx, vy) + 1e-6
        # RK2
        xm, ym = x + vx / m * STEP * 0.5, y + vy / m * STEP * 0.5
        vx2, vy2 = sample(field, xm, ym)
        m2 = math.hypot(vx2, vy2) + 1e-6
        x, y = x + vx2 / m2 * STEP, y + vy2 / m2 * STEP
        if not (0 <= x <= asp and 0 <= y <= 1):
            break
        pts.append((x, y))
    return pts

def taper_poly(pts, wmax):
    """build a tapered ribbon polygon (0 at tail -> wmax at head)."""
    n = len(pts)
    if n < 3:
        return None
    left, right = [], []
    for i, (x, y) in enumerate(pts):
        px, py = to_px(x, y)
        # direction
        a = pts[max(0, i - 1)]; b = pts[min(n - 1, i + 1)]
        dx, dy = to_px(*b)[0] - to_px(*a)[0], to_px(*b)[1] - to_px(*a)[1]
        L = math.hypot(dx, dy) + 1e-6
        nx, ny = -dy / L, dx / L
        w = wmax * (i / (n - 1)) ** 0.7 / 2.0     # taper tail->head
        left.append((px + nx * w, py + ny * w))
        right.append((px - nx * w, py - ny * w))
    return left + right[::-1]

for iy in range(SEED_NY):
    for ix in range(SEED_NX):
        x = (ix + random.uniform(-0.4, 0.4)) / SEED_NX * asp
        y = (iy + random.uniform(-0.4, 0.4)) / SEED_NY
        pts = streamline(x, y)
        if len(pts) < 6:
            continue
        # local speed -> brightness + width
        vx, vy = sample(field, *pts[len(pts)//2])
        spd = min(1.0, math.hypot(vx, vy) / mag_max)
        poly = taper_poly(pts, WMAX * (0.5 + 0.9 * spd))
        if not poly:
            continue
        val = int(150 + 105 * spd)
        col = (val, val, min(255, int(val * 0.96 + 12)), int(120 + 120 * spd))
        dr.polygon(poly, fill=col)

img.save(OUT)
print("WROTE", OUT)
print("DRAWN_DONE")
