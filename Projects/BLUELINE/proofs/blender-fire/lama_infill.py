#!/usr/bin/env python3
"""
Context-aware clean plate via LaMa — remove the man and RECONSTRUCT the car/fire/street behind him
(not cv2.inpaint's blur). The result is the plate the ink-warp samples, so the moving fire behind the
hero is real reconstructed detail.

  <comfy venv>/python lama_infill.py   ->  renders/clean_plate.png
"""
import os
import numpy as np, cv2
from PIL import Image
from simple_lama_inpainting import SimpleLama

HERE = os.path.dirname(os.path.abspath(__file__)); REND = os.path.join(HERE, "renders")
SHOT = os.path.join(HERE, "..", "new-story", "out", "02_hero-on-sedan-pointing.png")

shot = Image.open(SHOT).convert("RGB")
hero = cv2.imread(os.path.join(REND, "hero_mask_feather.png"), 0)
mask = cv2.dilate((hero > 100).astype("uint8") * 255, np.ones((11, 11), np.uint8))   # the silhouette to rebuild
res = SimpleLama()(shot, Image.fromarray(mask))
res.save(os.path.join(REND, "clean_plate.png"))
print("WROTE clean_plate.png", res.size)
