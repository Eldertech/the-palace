#!/usr/bin/env python3
"""ROUTE B — GENERATE AS LAYERS. Render the ridge and the clouds as SEPARATE SDXL passes,
so each sheet's alpha is clean by construction (no extraction, no infill — nothing was ever
occluded). Key each to RGBA and stack identically to Route A. The cost moves from extraction
to (a) two generations and (b) style/registration drift between independent passes."""
import os, sys, numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "lib"))
import comfy, layers as LZ, stack as ST
from PIL import Image

PL = os.path.join(HERE, "plates")
RIDGE = os.path.join(PL, "gen_ridge.png")
CLOUDS = os.path.join(PL, "gen_clouds.png")

ridge_prompt = ("a stark solid filled black silhouette of a bare windswept hill ridge, a tiny "
                "lone figure standing on the crest, one bold continuous ink shape, completely "
                "solid black, clean pure white background, no sky detail, hand-drawn brush edge")
clouds_prompt = ("dramatic billowing storm clouds filling the whole sky, loose gestural ink "
                 "linework, stark high contrast black and white, rough white paper, lots of "
                 "white space, no ground, no horizon, no hills, only sky and clouds, "
                 + comfy.SUBSTRATE)

if not os.path.exists(RIDGE):
    comfy.txt2img(ridge_prompt, RIDGE, seed=8310, w=832, h=1216, steps=26)
    print("gen ridge done", flush=True)
if not os.path.exists(CLOUDS):
    comfy.txt2img(clouds_prompt, CLOUDS, seed=8311, w=832, h=1216, steps=26)
    print("gen clouds done", flush=True)

ridge_rgb = LZ.load_rgb(RIDGE)
clouds_rgb = LZ.load_rgb(CLOUDS)
H, W = ridge_rgb.shape[:2]

# ridge sheet: the solid black shape is the matte (alpha), edge rides its own brush line
ridge_mask = LZ.solid_silhouette(ridge_rgb, dark=0.5, touch="bottom", close=9, open_=3, dilate=2)
front = LZ.rgba(ridge_rgb, LZ.sharpen_alpha(ridge_mask, 0.8))
# clouds sheet: opaque backdrop (it's the back layer)
back = LZ.rgba(clouds_rgb, np.ones((H, W), np.float32))

specs = [
    {"rgba": back,  "field": "sky", "amp": 1.6, "label": "back · clouds (generated, drift)"},
    {"rgba": front, "field": None,             "label": "front · ridge (generated, static)"},
]
out = os.path.join(HERE, "renders", "sky_generate"); os.makedirs(out, exist_ok=True)
frames = ST.render_stack(specs, frames=60)
ST.write_loop(frames, out, "sky_generate")
ST.matte_board(specs, os.path.join(HERE, "report-assets", "sky_generate_mattes.png"),
               labels=[s["label"] for s in specs])
Image.fromarray((np.clip(frames[0], 0, 1) * 255).astype(np.uint8)).save(os.path.join(out, "still.png"))
print("ROUTE_B_GENERATE_DONE ridge_cover=%.1f%% -> %s" % (100 * ridge_mask.mean(), out))
