#!/usr/bin/env python3
"""
SHOT #2 — feed the field into an actual BLUELINE graphic.

Take the D2 inked figure (the pen-flow crouching hero, canny0.30/depth0.60/pose0.70 redraw)
and composite the SAME character-aware flow around it, so the finished frame shows the wind
flowing around the character — comic speed-lines wrapping the body + the wake behind.

The D2 plate is stark noir: BLACK upper (night sky), WHITE lower (ground). A single-polarity
ink line can't read across both, so we composite with LOCAL POLARITY INVERSION — the flow is
"carved" through the ink: white lines where the ground is black, black lines where it's white.
    out = bg*(1-S) + (1-bg)*S
where S is the flow-line strength (0..1). This reads as one drawing: the wind cut into the ink.

Streamlines still stop at the body and never seed inside it (the field's solid mask), so the
lines flow AROUND the figure and shed into the wake. Deterministic; no diffusion model needed —
this is the composite pass. A render-unification (low-denoise img2img to fuse it into one
coherent ink) is the optional heavier follow-up.

Run:  <comfy venv python> composite_render.py
"""
import os, math, random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from flowlib import load_field, sample, in_body

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.abspath(os.path.join(HERE, "..", "renders", "03-composite-figure-in-wind.png"))
D2 = os.path.abspath(os.path.join(
    HERE, "..", "..", "blender-handdrawn", "followups", "redraw-posed-figure",
    "redraw_D2_canny030_depth060_pose070.png"))
W, H = 832, 1040
field = load_field()
asp = field["aspect"]; mag_max = field["mag_max"]
random.seed(7)
CLAMP = min(mag_max, 4.0)

# ---- 1. render the flow-line STRENGTH map (white strokes on black) ----------
strength = Image.new("L", (W, H), 0)
dr = ImageDraw.Draw(strength)


def to_px(x, y):
    return x / asp * W, y * H


SEED_NX, SEED_NY = 40, 52          # sparser -> cleaner comic strokes, keeps white space
STEP, NSTEP, WMAX = 0.006, 40, 5.0


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
        if not (0 <= nx <= asp and 0 <= ny <= 1) or in_body(field, nx, ny):
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


for iy in range(SEED_NY):
    for ix in range(SEED_NX):
        x = (ix + random.uniform(-0.4, 0.4)) / SEED_NX * asp
        y = (iy + random.uniform(-0.4, 0.4)) / SEED_NY
        pts = streamline(x, y)
        if len(pts) < 6:
            continue
        vx, vy = sample(field, *pts[len(pts) // 2])
        spd = min(1.0, math.hypot(vx, vy) / CLAMP)
        poly = taper_poly(pts, WMAX * (0.4 + 0.9 * spd))
        if poly:
            dr.polygon(poly, fill=int(120 + 135 * spd))

S = np.asarray(strength.filter(ImageFilter.GaussianBlur(0.4)), dtype=np.float32) / 255.0

# ---- 2. load the inked figure, keep it in front of the flow -----------------
bg = np.asarray(Image.open(D2).convert("L").resize((W, H)), dtype=np.float32) / 255.0

# protect the figure's dark ink body: don't carve flow-lines through the character.
# the figure occupies the strongly-inked central mass; build a soft figure matte from
# the field's solid mask projected to full res + the D2 dark core, so lines stay OUTSIDE.
GH, GW = field["S"].shape
solid_img = np.asarray(Image.fromarray((field["S"] * 255).astype(np.uint8)).resize((W, H)),
                       dtype=np.float32) / 255.0
figure_matte = np.clip(solid_img, 0, 1)
figure_matte = np.asarray(Image.fromarray((figure_matte * 255).astype(np.uint8))
                          .filter(ImageFilter.GaussianBlur(3)), dtype=np.float32) / 255.0
S = S * (1.0 - figure_matte)          # suppress flow-lines inside the body silhouette

# ---- 3. composite: STARK black/white — the wind reads in both zones ----------
# BLUELINE register is stark ink + white space, not grey hatching. So:
#   * on the LIGHT ground -> BLACK speed-lines (darken); classic comic streaks.
#   * in the DARK sky      -> SPARSE, THIN WHITE scratch-lines (lighten); keeps the
#                             wake visible against the noir without greying the black.
# The sky lines are thinned (eroded) + weakened so the night stays mostly black.
from scipy.ndimage import grey_erosion
light = (bg > 0.5).astype(np.float32)
light = np.asarray(Image.fromarray((light * 255).astype(np.uint8))
                   .filter(ImageFilter.GaussianBlur(2)), dtype=np.float32) / 255.0

S_ground = S * light                                  # black lines only where the ground is light
S_sky = grey_erosion(S, size=(2, 2)) * (1.0 - light)  # thin the sky scratches
S_sky = S_sky * 0.55                                  # and weaken them

out = bg.copy()
out = out * (1.0 - 0.95 * S_ground)                   # darken -> black ink on the ground
out = out + (1.0 - out) * S_sky                       # lighten -> white scratch in the sky
out = np.clip(out, 0, 1)

# gentle stark push: pull near-white to paper-white, near-black to ink-black
out = np.clip((out - 0.5) * 1.18 + 0.5, 0, 1)

Image.fromarray((out * 255).astype(np.uint8)).convert("RGB").save(OUT)
print("WROTE", OUT)
print("COMPOSITE_DONE")
