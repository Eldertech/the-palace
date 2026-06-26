#!/usr/bin/env python3
"""ROUTE A — SEPARATE & INFILL. Take the finished sky plate, extract the ridge as a sharp
silhouette sheet (cut snapped to its black edge), whiten behind it, stack the drifting sky
BEHIND the static ridge. The seam is hidden by occlusion, not feather."""
import os, sys, numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, os.path.join(HERE, "lib"))
import layers as LZ, stack as ST

plate = LZ.load_rgb(os.path.join(HERE, "plates", "sky.png"))
H, W = plate.shape[:2]

# extract the foreground ridge: largest dark mass touching the bottom; edge rides its silhouette
ridge = LZ.solid_silhouette(plate, dark=0.45, touch="bottom", close=11, open_=4, dilate=2)
front = LZ.rgba(plate, LZ.sharpen_alpha(ridge, 0.8))            # ridge keeps its full black line

# back sky sheet: whiten where the ridge was (infill behind front), opaque backdrop
back_rgb = plate.copy(); back_rgb[ridge > 0.5] = 0.99
back = LZ.rgba(back_rgb, np.ones((H, W), np.float32))

specs = [
    {"rgba": back,  "field": "sky", "amp": 1.6, "label": "back · sky (drift)"},
    {"rgba": front, "field": None,             "label": "front · ridge (static, sharp cut)"},
]
out = os.path.join(HERE, "renders", "sky_separate"); os.makedirs(out, exist_ok=True)
frames = ST.render_stack(specs, frames=60)
ST.write_loop(frames, out, "sky_separate")
ST.matte_board(specs, os.path.join(HERE, "report-assets", "sky_separate_mattes.png"),
               labels=[s["label"] for s in specs])
from PIL import Image
Image.fromarray((np.clip(frames[0], 0, 1) * 255).astype(np.uint8)).save(os.path.join(out, "still.png"))
print("ROUTE_A_SEPARATE_DONE ridge_cover=%.1f%% -> %s" % (100 * ridge.mean(), out))
