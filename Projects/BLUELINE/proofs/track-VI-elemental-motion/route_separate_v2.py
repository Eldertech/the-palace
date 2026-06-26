"""ROUTE A v2 — SEPARATE with proper INPAINT behind the foreground (LOCAL SDXL, in ink).
On a structured plate (water: trees occlude the lake), extract the foreground sheet, then
fill the hole with coherent in-style water/shore via SDXL inpaint — instead of the white-paper
infill that only works on white grounds. Then stack: rippling water BEHIND the static trees.
Local ComfyUI :8188 — no pod, free, keeps the pen-flow ink."""
import os, sys, numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, os.path.join(HERE, "lib"))
import comfy, layers as LZ, stack as ST, board
from PIL import Image
from scipy.ndimage import gaussian_filter

PL = os.path.join(HERE, "plates"); RA = os.path.join(HERE, "report-assets")
plate = LZ.load_rgb(os.path.join(PL, "water.png")); H, W = plate.shape[:2]

# 1. SEPARATE: the dark foreground mass (trees + near shore) touching the bottom
fg = LZ.solid_silhouette(plate, dark=0.4, density_sigma=14, density_thresh=0.42,
                         touch="bottom", dilate=3)
front = LZ.rgba(plate, LZ.sharpen_alpha(fg, 0.8))

# 2a. OLD infill (white paper) — the before
white = plate.copy(); white[fg > 0.5] = 0.99
Image.fromarray((white * 255).astype(np.uint8)).save(os.path.join(PL, "_white_infill.png"))

# 2b. NEW infill: SDXL inpaint fills the hole with coherent water/shore, in ink
mask_img = (np.clip(gaussian_filter(fg, 3), 0, 1) * 255).astype(np.uint8)
Image.fromarray(mask_img, "L").save(os.path.join(PL, "_fg_mask.png"))
inpaint_prompt = ("a calm wide lake with gentle rippling water reflections and a low distant far "
                  "shore under a pale empty sky, sparse loose ink, " + comfy.SUBSTRATE)
print("[A2] local SDXL inpaint behind foreground...", flush=True)
comfy.inpaint(os.path.join(PL, "water.png"), os.path.join(PL, "_fg_mask.png"),
              inpaint_prompt, os.path.join(PL, "water_inpaint.png"), seed=8420, denoise=1.0, grow=14)
cn = LZ.load_rgb(os.path.join(PL, "water_inpaint.png"))

board.grid([[("plate", os.path.join(PL, "water.png"), ""),
             ("OLD: white-paper infill", os.path.join(PL, "_white_infill.png"), "punches a hole on a dark/structured ground"),
             ("NEW: SDXL inpaint", os.path.join(PL, "water_inpaint.png"), "water + far shore continue, in ink")]],
           title="ROUTE A v2 · infill behind the extracted foreground",
           out=os.path.join(RA, "infill_compare.png"), cell_w=300)

# 3. STACK: rippling water (back, inpainted) behind static trees (front)
back = LZ.rgba(cn, np.ones((H, W), np.float32))
specs = [
    {"rgba": back,  "field": "water", "amp": 1.2, "label": "back · lake (inpainted, ripple)"},
    {"rgba": front, "field": None,               "label": "front · trees (static, sharp cut)"},
]
out = os.path.join(HERE, "renders", "water_separate_v2"); os.makedirs(out, exist_ok=True)
frames = ST.render_stack(specs, frames=60)
ST.write_loop(frames, out, "water_separate_v2")
ST.matte_board(specs, os.path.join(RA, "water_separate_v2_mattes.png"), labels=[s["label"] for s in specs])
Image.fromarray((np.clip(frames[0], 0, 1) * 255).astype(np.uint8)).save(os.path.join(out, "still.png"))
print("ROUTE_A2_DONE fg_cover=%.1f%% -> %s" % (100 * fg.mean(), out))
