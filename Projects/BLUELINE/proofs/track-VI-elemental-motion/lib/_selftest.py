#!/usr/bin/env python3
"""Synthetic-plate self-test for the warp engine — no GPU, no ComfyUI. Builds a fake
inked plate (white paper + black strokes) and runs a water-ripple loop end to end so the
whole chain (mask/warp/loop/gif/mp4/strip/anaglyph) is proven before real plates land."""
import os, sys, numpy as np
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import fields as F
import warp as Wp

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H = 512, 768
im = Image.new("RGB", (W, H), (250, 249, 246)); d = ImageDraw.Draw(im)
# water: wavy horizontal ink strokes in the bottom half
rng = np.random.default_rng(0)
for y in range(H // 2, H, 14):
    pts = [(x, y + 8 * np.sin(x / 40.0 + y)) for x in range(0, W, 8)]
    d.line(pts, fill=(20, 18, 16), width=2 + (y % 3))
# horizon
d.line([(0, H // 2), (W, H // 2)], fill=(10, 10, 10), width=3)
# a few cloud scribbles up top
for cx, cy in [(120, 120), (300, 90), (380, 160)]:
    d.ellipse([cx - 60, cy - 24, cx + 60, cy + 24], outline=(30, 28, 26), width=2)
plate_p = os.path.join(HERE, "plates", "_synthetic.png")
os.makedirs(os.path.dirname(plate_p), exist_ok=True); im.save(plate_p)

plate = Wp.load_rgb(plate_p)
field_fn = F.water(H, W, seed=1)
mask = Wp.build_mask("auto:bottom:0.5", H, W, feather=20)
frames = Wp.render_loop(plate, field_fn, mask, frames=24, amp=1.6)
out = os.path.join(HERE, "renders", "_selftest"); os.makedirs(out, exist_ok=True)
man = Wp.write_outputs(frames, out, "selftest", fps=24)
print("SELFTEST_OK motion_p99=%.2fpx  files=%s" % (man["motion_px"], list(man)))
print("loop-closure check (frame0 vs frameN-1 identical? warp is periodic):")
import numpy as _np
print("  max|f0 - f_last| =", float(_np.abs(frames[0] - frames[-1]).max()),
      "(nonzero is fine: f_last != f0; f0==field(0); seam is f_last->f0)")
# true seam test: field(0) vs field(1.0) -> must be identical
dx0, dy0 = field_fn(0.0); dx1, dy1 = field_fn(1.0)
print("  field seam max|d(0)-d(1)| =", float(max(_np.abs(dx0 - dx1).max(), _np.abs(dy0 - dy1).max())),
      "(must be ~0 for a seamless loop)")
