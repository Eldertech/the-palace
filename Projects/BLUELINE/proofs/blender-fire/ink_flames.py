#!/usr/bin/env python3
"""
BLUELINE — make the DRAWING'S OWN PEN LINES move like flame (the Animate-the-Background technique).

  EXTRACT  the man (his silhouette) and INFILL it with the surrounding fire, so the moving layer has
           no head to smear.
  WARP     that clean plate's smoke ink along a flame flow — rise + lick + the up-right lean measured
           from the drawing itself (analyze_smoke.py) — masked to the plume.
  LOCK     the buildings: the mask tapers to zero before them, so the plume reads as moving IN FRONT
           of the static building.
  COMPOSE  the real man crisp and static on top.

Slow, deep, seamlessly looped.  <comfy venv>/python ink_flames.py
"""
import os, math, json
import numpy as np, cv2
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__)); REND = os.path.join(HERE, "renders")
SHOT = os.path.join(HERE, "..", "new-story", "out", "02_hero-on-sedan-pointing.png")
N, AMP, KY = 64, 15.0, 1.7

shot = cv2.imread(SHOT); H, W = shot.shape[:2]
hero = cv2.imread(os.path.join(REND, "hero_mask_feather.png"), 0).astype(np.float32) / 255.0

# 1) CLEAN PLATE — prefer LaMa's context-aware reconstruction (lama_infill.py); fall back to cv2.inpaint
_lama = os.path.join(REND, "clean_plate.png")
if os.path.exists(_lama):
    clean = cv2.imread(_lama)
else:
    heroSharp = cv2.dilate((hero > 0.4).astype(np.uint8) * 255, np.ones((9, 9), np.uint8))
    clean = cv2.inpaint(shot, heroSharp, 12, cv2.INPAINT_TELEA)

# 2) smoke-plume mask — central plume, tapered to zero BEFORE the buildings so they stay locked
sm = np.zeros((H, W), np.float32)
for cx, cy, rx, ry in [(0.45, 0.13, 0.26, 0.14), (0.49, 0.28, 0.24, 0.16), (0.40, 0.33, 0.18, 0.14), (0.55, 0.20, 0.16, 0.13)]:
    cv2.ellipse(sm, (int(cx * W), int(cy * H)), (int(rx * W), int(ry * H)), 0, 0, 360, 1.0, -1)
sm = cv2.GaussianBlur(sm, (0, 0), 20)
xx = (np.tile(np.arange(W), (H, 1)).astype(np.float32)) / W
sm *= np.clip((0.74 - xx) / 0.06, 0, 1)          # lock the RIGHT building (taper out by x=0.74)
sm *= np.clip((xx - 0.20) / 0.06, 0, 1)          # lock the left building
sm = np.clip(sm, 0, 1)

LEAN = json.load(open(os.path.join(HERE, "smoke_physics.json")))["mean_lean"]
gx, gy = np.meshgrid(np.arange(W), np.arange(H)); gx = gx.astype(np.float32); gy = gy.astype(np.float32)
yn = gy / H; xn_ = gx / W

frames = []
for f in range(N):
    t = 2 * math.pi * f / N
    ph = (yn - xn_ * LEAN * 0.35) * KY * 2 * math.pi - t
    dx = AMP * (np.sin(ph + xn_ * 5.0) + 0.45 * np.sin(2.3 * ph))
    dy = AMP * 0.7 * np.cos(0.9 * ph + xn_ * 3.0)
    dx, dy = dx * sm, dy * sm
    warped = cv2.remap(clean, (gx - dx).astype(np.float32), (gy - dy).astype(np.float32),
                       cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    m3, h3 = sm[..., None], hero[..., None]
    comp = warped.astype(np.float32) * m3 + clean.astype(np.float32) * (1 - m3)   # moving smoke over the static clean plate
    comp = comp * (1 - h3) + shot.astype(np.float32) * h3                         # real man crisp on top (never warped)
    frames.append(comp.astype(np.uint8))

pil = [Image.fromarray(cv2.cvtColor(f, cv2.COLOR_BGR2RGB)).resize((560, int(H * 560 / W)), Image.LANCZOS) for f in frames]
pil[0].save(os.path.join(REND, "ink_flames.gif"), save_all=True, append_images=pil[1:], duration=70, loop=0)
cv2.imwrite(os.path.join(REND, "_smoke_mask.png"), (sm * 255).astype(np.uint8))
cv2.imwrite(os.path.join(REND, "_clean_plate.png"), clean)
print("WROTE ink_flames.gif", len(pil), "frames")
