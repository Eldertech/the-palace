#!/usr/bin/env python3
"""
Depth-band decomposition — the working coarse splitter. Depth Anything gives continuous depth; band it
into FRONT / MID / BACK and each band is a usable cel with NO segmentation. Documents how far 'free'
auto-decomposition reaches before per-element refinement is needed.

  <comfy venv>/python depth_bands.py   -> /tmp/_depth_bands.png
"""
import os
import numpy as np, cv2, torch
from PIL import Image, ImageDraw
from transformers import pipeline

HERE = os.path.dirname(os.path.abspath(__file__)); REND = os.path.join(HERE, "renders")
SHOT = os.path.join(HERE, "..", "new-story", "out", "02_hero-on-sedan-pointing.png")
shot = cv2.imread(SHOT); H, W = shot.shape[:2]

dev = "mps" if torch.backends.mps.is_available() else "cpu"
pipe = pipeline("depth-estimation", model="depth-anything/Depth-Anything-V2-Small-hf", device=dev)
depth = pipe(Image.open(SHOT).convert("RGB"))["predicted_depth"].squeeze().detach().cpu().numpy().astype(np.float32)
depth = cv2.resize(depth, (W, H))
np.save(os.path.join(REND, "depth.npy"), depth)

p40, p72 = np.percentile(depth, [40, 72])
bands = [("FRONT  person+street", depth >= p72), ("MID  cars+buildings", (depth >= p40) & (depth < p72)), ("BACK  fire+sky", depth < p40)]

tiles = []
for name, b in bands:
    b8 = (b.astype(np.uint8) * 255)
    b8 = cv2.GaussianBlur(b8, (0, 0), 2)
    a = (b8.astype(np.float32) / 255)[..., None]
    cel = (shot.astype(np.float32) * a + np.full_like(shot, 26) * (1 - a)).astype(np.uint8)
    im = Image.fromarray(cv2.cvtColor(cel, cv2.COLOR_BGR2RGB)).resize((230, int(230 * H / W)))
    d = ImageDraw.Draw(im); d.rectangle((0, 0, 230, 16), fill=(0, 0, 0)); d.text((3, 3), name, fill=(255, 210, 90))
    tiles.append(im)
sheet = Image.new("RGB", (tiles[0].width * 3 + 24, tiles[0].height), (20, 20, 22))
for i, t in enumerate(tiles): sheet.paste(t, (i * (t.width + 10), 0))
sheet.save("/tmp/_depth_bands.png"); print("WROTE /tmp/_depth_bands.png")
