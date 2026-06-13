#!/usr/bin/env python3
"""
LEG 2 — STEERS (render conditioning): dense motion from THE field, the
Go-with-the-Flow way.

Two artifacts from the untouched field:
  (a) dense motion-vector map  — the optical-flow HSV image you feed as motion
      conditioning (hue=direction, value=speed). The standard render-conditioning form.
  (b) noise-warp frames        — Go-with-the-Flow's core mechanism: warp the
      diffusion noise ALONG the flow so the noise is temporally consistent with the
      desired motion. We backward-warp a Gaussian noise field by t*flow and re-normalise
      (GtF's contribution is keeping the warped noise ~N(0,1); this demo shows the
      warping carries the field's motion coherently across frames).

PER-LEG MASSAGING (measured): a single magnitude->pixels/frame SCALE (dt_px) to put the
field in the displacement units the warp/diffusion expects. Field itself untouched.
The full GtF video-diffusion run (a video model + their warped-noise sampler) is the
heavier next step, deferred — see the report.
"""
import os, math, colorsys
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import map_coordinates, zoom, gaussian_filter
from flowlib import load_field

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.abspath(os.path.join(HERE, "..", "renders", "02-steers-motion.png"))
PW, PH = 380, 300                 # per-panel size
field = load_field()
V, GW, GH, mag_max = field["V"], field["w"], field["h"], field["mag_max"]

# upsample the field to panel resolution (smooth) — reading the SAME source
zy, zx = PH / GH, PW / GW
U = zoom(V[:, :, 0], (zy, zx), order=1)
Wv = zoom(V[:, :, 1], (zy, zx), order=1)
mag = np.sqrt(U**2 + Wv**2)

# (a) dense motion-vector HSV map (image y-down, so flip vy for screen)
hsv = np.zeros((PH, PW, 3), np.float32)
ang = (np.arctan2(-Wv, U) + math.pi) / (2 * math.pi)
hsv[..., 0] = ang
hsv[..., 1] = 0.9
hsv[..., 2] = np.clip(mag / mag_max, 0, 1) ** 0.7
flat = hsv.reshape(-1, 3)
rgb = np.array([colorsys.hsv_to_rgb(*p) for p in flat]).reshape(PH, PW, 3)
motion_img = Image.fromarray((rgb * 255).astype(np.uint8))

# (b) noise-warp: backward-warp noise by t*flow, per-leg dt_px scale.
# low-frequency noise (blurred) so the advection is visible to the eye across frames;
# GtF warps the actual sampling noise — the mechanism (warp-along-flow + renormalise) is identical.
rng = np.random.default_rng(7)
noise = gaussian_filter(rng.standard_normal((PH, PW)).astype(np.float32), sigma=3.0)
noise = (noise - noise.mean()) / (noise.std() + 1e-6)
DT_PX = 18.0 / mag_max            # <- THE per-leg scale: max ~18 px/frame
yy, xx = np.mgrid[0:PH, 0:PW].astype(np.float32)

def warp(t):
    # backward sample: out[y,x] = noise[y + t*vy_screen, x - t*vx]; vy_screen = -Wv (y down)
    sy = yy + t * DT_PX * (-(-Wv))     # screen-down displacement
    sx = xx + t * DT_PX * (-U)
    w = map_coordinates(noise, [sy, sx], order=1, mode="reflect")
    w = (w - w.mean()) / (w.std() + 1e-6)   # GtF: keep ~N(0,1)
    g = ((w * 0.5 + 0.5).clip(0, 1) * 255).astype(np.uint8)
    return Image.fromarray(g).convert("RGB")

frames = [warp(t) for t in (0, 2.0, 4.0)]

# montage: [motion map][noise t0][t1][t2] with labels
labels = ["dense motion (HSV)  → conditioning", "warped noise t0", "warped noise t1", "warped noise t2"]
panels = [motion_img] + frames
GAP, TOP = 10, 26
sheet = Image.new("RGB", (PW*4 + GAP*3, PH + TOP), (12, 13, 16))
dr = ImageDraw.Draw(sheet)
for i, (p, lab) in enumerate(zip(panels, labels)):
    x = i * (PW + GAP)
    sheet.paste(p, (x, TOP))
    dr.text((x + 4, 6), lab, fill=(210, 210, 216))
sheet.save(OUT)
print("WROTE", OUT, f"(dt_px={DT_PX:.2f})")
print("STEERS_DONE")
