#!/usr/bin/env python3
"""
BLUELINE cloud-I2V — turn the SVD m160 clip into a lovely slow sky-in-motion and composite it
behind the static city (shot 01).

  1. MORPH  — optical-flow interpolate between the 25 SVD frames (smooth + slow, plays FORWARD).
  2. LOOP   — crossfade the tail into the head so it cycles forward (no ping-pong reverse).
  3. SKY    — a sky-only preview of the morphed slow loop.
  4. COMP   — composite the moving sky into shot 01, city held static, feathered at the horizon.

  <comfy venv>/python morph_composite.py
"""
import os, glob
import numpy as np, cv2
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
REND = os.path.join(HERE, "renders")
LAB = "svd_m160"
STEPS = 6          # interpolated frames between each SVD pair → smooth + slow
XF = 12            # crossfade frames to close the forward loop
GIF_W = 720        # downscale the previews so the GIFs stay light

frames = [cv2.imread(f) for f in sorted(glob.glob(f"{REND}/{LAB}_*.png"))]
H, W = frames[0].shape[:2]
gx, gy = np.meshgrid(np.arange(W), np.arange(H)); gx = gx.astype(np.float32); gy = gy.astype(np.float32)

def warp(img, flow, t):
    mx = (gx + t * flow[..., 0]).astype(np.float32); my = (gy + t * flow[..., 1]).astype(np.float32)
    return cv2.remap(img, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)

def interp(a, b, steps):
    ga = cv2.cvtColor(a, cv2.COLOR_BGR2GRAY); gb = cv2.cvtColor(b, cv2.COLOR_BGR2GRAY)
    f_ab = cv2.calcOpticalFlowFarneback(ga, gb, None, 0.5, 3, 25, 3, 5, 1.2, 0)   # forward flow
    f_ba = cv2.calcOpticalFlowFarneback(gb, ga, None, 0.5, 3, 25, 3, 5, 1.2, 0)   # backward flow
    out = []
    for i in range(steps):
        t = i / steps
        out.append(cv2.addWeighted(warp(a, f_ab, t), 1 - t, warp(b, f_ba, 1 - t), t, 0))
    return out

# 1+2. smooth forward sequence, then a crossfade-loop (tail blended into head)
seq = []
for a, b in zip(frames[:-1], frames[1:]):
    seq += interp(a, b, STEPS)
seq.append(frames[-1])
N = len(seq); body = [f.copy() for f in seq[:N - XF]]
for i in range(XF):
    a = 1.0 - (i + 1) / (XF + 1)
    body[i] = cv2.addWeighted(seq[N - XF + i], a, body[i], 1 - a, 0)
print(f"morphed {len(frames)} SVD frames -> {len(body)} smooth frames (forward loop)")

def save_gif(imgs_bgr, path, w):
    pil = []
    for f in imgs_bgr:
        im = Image.fromarray(cv2.cvtColor(f, cv2.COLOR_BGR2RGB))
        im = im.resize((w, int(im.height * w / im.width)), Image.LANCZOS)
        pil.append(im)
    pil[0].save(path, save_all=True, append_images=pil[1:], duration=66, loop=0)
    print("WROTE", path, len(pil), "frames", pil[0].size)

# 3. sky-only preview
save_gif(body, f"{REND}/{LAB}_morph_sky.gif", GIF_W)

# 4. composite into shot 01 — city static, sky moving, feathered horizon
SHOT = os.path.join(HERE, "..", "new-story", "out", "01_wide-burning-city.png")
base = cv2.imread(SHOT); BH, BW = base.shape[:2]
band = int(BH * 0.42)
mask = np.zeros((BH, BW), np.float32); top0 = int(BH * 0.34)
mask[:top0] = 1.0
for y in range(top0, band):
    mask[y] = 1.0 - (y - top0) / (band - top0)        # feather sky→city across the horizon
m3 = cv2.merge([mask] * 3)[:band]
comp = []
for f in body:
    canvas = base.copy().astype(np.float32)
    skyfull = cv2.resize(f, (BW, band)).astype(np.float32)
    canvas[:band] = skyfull * m3 + canvas[:band] * (1 - m3)
    comp.append(canvas.astype(np.uint8))
save_gif(comp, f"{REND}/{LAB}_composite.gif", GIF_W)
print("DONE")
