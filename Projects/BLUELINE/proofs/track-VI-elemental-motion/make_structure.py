#!/usr/bin/env python3
"""Author the SHARED structure for Route B v2: a ridge composition as a DEPTH map (near=white
hill, far=dark sky — MiDaS convention) and a CANNY edge map (white crest line on black). Both
layer passes condition on these + one seed, so the generated sheets register as one scene."""
import os, numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import gaussian_filter

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "plates"); os.makedirs(OUT, exist_ok=True)
W, H = 832, 1216
x = np.arange(W)

# crest line (y per column): a main peak + a shoulder, with a little jaggedness
crest = (H * 0.52
         - H * 0.20 * np.exp(-((x - W * 0.46) / (W * 0.15)) ** 2)
         - H * 0.07 * np.exp(-((x - W * 0.72) / (W * 0.11)) ** 2)
         + H * 0.018 * np.sin(x / 33.0) + H * 0.01 * np.sin(x / 11.0))
yy = np.arange(H)[:, None]
hill = (yy > crest[None, :]).astype(np.float32)                  # 1 below the crest

# DEPTH: hill near (bright), sky far (dark), soft horizon
depth = np.where(hill > 0.5, 0.96, 0.18 + 0.14 * (yy / H)).astype(np.float32)
depth = gaussian_filter(depth, 3)
Image.fromarray((np.clip(depth, 0, 1) * 255).astype(np.uint8)).save(os.path.join(OUT, "structure_depth.png"))

# CANNY: white crest polyline (+ faint frame edges) on black
cv = Image.new("L", (W, H), 0); d = ImageDraw.Draw(cv)
pts = [(int(xi), int(crest[xi])) for xi in range(0, W, 2)]
d.line(pts, fill=255, width=3)
Image.fromarray(np.asarray(cv)).save(os.path.join(OUT, "structure_canny.png"))

# preview: filled hill (so we can eyeball the composition)
prev = Image.new("RGB", (W, H), (245, 245, 242)); pd = ImageDraw.Draw(prev)
poly = [(0, H)] + [(int(xi), int(crest[xi])) for xi in range(0, W, 2)] + [(W, H)]
pd.polygon(poly, fill=(30, 30, 30)); pd.line(pts, fill=(0, 0, 0), width=3)
prev.save(os.path.join(OUT, "structure_preview.png"))
print("STRUCTURE_DONE hill_cover=%.1f%% -> plates/structure_{depth,canny,preview}.png" % (100 * hill.mean()))
