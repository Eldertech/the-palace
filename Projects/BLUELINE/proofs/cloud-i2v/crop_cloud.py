#!/usr/bin/env python3
"""
BLUELINE cloud-I2V — stage the conditioning frame.

Crop the sky/cloud band of shot 01 (the burning city) to SVD's 1024x576 and save it as the
image-to-video seed (frame 0). The drawn wind streaks — "the direction powerful in the frame
itself" — are preserved untouched; the whole test is whether plain SVD drifts the clouds ALONG
them on its own (motion-direction for free), before we reach for any noise-warp steering.

  python3 crop_cloud.py
"""
import os
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "..", "new-story", "out", "01_wide-burning-city.png")
OUT = os.path.join(HERE, "cloud_init.png")

im = Image.open(SRC).convert("RGB")
W, H = im.size
band = int(H * 0.42)                         # the sky/cloud band is the top ~42%
crop = im.crop((0, 0, W, band)).resize((1024, 576), Image.LANCZOS)   # SVD-XT native size
crop.save(OUT)
print("WROTE", OUT, crop.size, "from", os.path.basename(SRC), (W, H))
