#!/usr/bin/env python3
"""Draw the geometric OpenPose skeleton for each phase from its keypoints (the FLUX-ControlNet pose input).
Colours come from the shared staging_skeleton module (one skeleton). Run: <comfy venv>/python pair_post.py"""
import os, sys, json, glob
import numpy as np
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__)); P = os.path.join(HERE, "passes")
sys.path.insert(0, os.path.join(HERE, "..", "..", "staging-skeleton"))
import staging_skeleton as SK
COLORS = [tuple(c) for c in SK.OPENPOSE_COLORS]

def draw(kpf):
    d = json.load(open(kpf)); W, H = d["width"], d["height"]; kp = {int(k): v for k, v in d["keypoints"].items()}
    img = Image.new("RGB", (W, H), (0, 0, 0)); dr = ImageDraw.Draw(img)
    for idx, (a, b) in enumerate(d["limbs"]):
        if kp[a][2] > 0.4 and kp[b][2] > 0.4:
            dr.line([kp[a][0], kp[a][1], kp[b][0], kp[b][1]], fill=COLORS[idx % 18], width=8)
    for i, (x, y, c) in kp.items():
        if c > 0.4:
            dr.ellipse([x-6, y-6, x+6, y+6], fill=COLORS[i % 18])
    out = kpf.replace("_keypoints.json", "_openpose.png"); img.save(out); return out

n = 0
for kpf in sorted(glob.glob(os.path.join(P, "*_keypoints.json"))):
    draw(kpf); n += 1
print(f"PAIR_POST_DONE — {n} openpose skeletons")
