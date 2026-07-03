#!/usr/bin/env python3
"""
Depth ordering — does a monocular depth model recover the cel stack of a line drawing?

Runs Depth Anything V2 on shot 02, saves a colored depth map beside the drawing, and measures the
mean predicted depth of each element (person / cars / buildings / fire / street / sky). Depth Anything
predicts inverse depth, so HIGHER = CLOSER. If it works, the sort gives the front-to-back layer order
for free — and depth EDGES become a segmentation cue for the hard line-art car.

  <comfy venv>/python depth_test.py
"""
import os
import numpy as np, cv2, torch
from PIL import Image
from transformers import pipeline

HERE = os.path.dirname(os.path.abspath(__file__)); REND = os.path.join(HERE, "renders")
SHOT = os.path.join(HERE, "..", "new-story", "out", "02_hero-on-sedan-pointing.png")
shot = Image.open(SHOT).convert("RGB"); W, H = shot.size

dev = "mps" if torch.backends.mps.is_available() else "cpu"
pipe = pipeline("depth-estimation", model="depth-anything/Depth-Anything-V2-Small-hf", device=dev)
out = pipe(shot)
depth = out["predicted_depth"].squeeze().detach().cpu().numpy().astype(np.float32)
depth = cv2.resize(depth, (W, H))

dn = cv2.normalize(depth, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
col = cv2.applyColorMap(dn, cv2.COLORMAP_TURBO)
cv2.imwrite(os.path.join(REND, "depth.png"), col)
shot_cv = cv2.cvtColor(np.array(shot), cv2.COLOR_RGB2BGR)
cv2.imwrite(os.path.join(REND, "_depth_sbs.png"), np.hstack([shot_cv, col]))

def rmean(x0, y0, x1, y1):
    return float(depth[int(y0 * H):int(y1 * H), int(x0 * W):int(x1 * W)].mean())
hero = cv2.imread(os.path.join(REND, "hero_mask_feather.png"), 0)
regions = {"person": float(depth[hero > 120].mean()),
           "car_L": rmean(0.05, 0.34, 0.35, 0.42), "car_R": rmean(0.60, 0.34, 0.92, 0.42),
           "building_L": rmean(0.02, 0.15, 0.20, 0.45), "building_R": rmean(0.78, 0.15, 0.98, 0.50),
           "fire/smoke": rmean(0.40, 0.05, 0.60, 0.30), "street": rmean(0.30, 0.86, 0.70, 0.98),
           "sky": rmean(0.45, 0.02, 0.55, 0.07)}
print("DEPTH ORDER (higher = closer):")
for k, v in sorted(regions.items(), key=lambda kv: -kv[1]):
    print(f"  {k:11s} {v:8.2f}")
print("WROTE depth.png + _depth_sbs.png")
