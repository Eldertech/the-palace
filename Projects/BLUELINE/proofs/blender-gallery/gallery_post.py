#!/usr/bin/env python3
"""Gallery post-step (ComfyUI venv): draw the geometric OpenPose skeleton from each shot's keypoints,
and the canny EDGE from the RGB. Same as track-IV-bench/post.py, pointed at this folder's passes.
Run:  _tools/ComfyUI/venv/bin/python gallery_post.py"""
import os, json, glob
import numpy as np
from PIL import Image, ImageDraw
import cv2

HERE = os.path.dirname(os.path.abspath(__file__)); P = os.path.join(HERE, "passes")
import sys; sys.path.insert(0, os.path.join(HERE, "..", "..", "staging-skeleton"))
import staging_skeleton as SK            # ONE skeleton — the canonical OpenPose colours from the shared module
COLORS = [tuple(c) for c in SK.OPENPOSE_COLORS]

def draw_openpose(kpf):
    d = json.load(open(kpf)); W,H = d["width"],d["height"]; kp = {int(k):v for k,v in d["keypoints"].items()}
    img = Image.new("RGB",(W,H),(0,0,0)); dr = ImageDraw.Draw(img)
    for idx,(a,b) in enumerate(d["limbs"]):
        if kp[a][2]>0.4 and kp[b][2]>0.4:
            dr.line([kp[a][0],kp[a][1],kp[b][0],kp[b][1]], fill=COLORS[idx%18], width=8)
    for i,(x,y,c) in kp.items():
        if c>0.4:
            r=6; dr.ellipse([x-r,y-r,x+r,y+r], fill=COLORS[i%18])
    out = kpf.replace("_keypoints.json","_openpose.png"); img.save(out); return out

def make_canny(rgbf):
    im = cv2.imread(rgbf, cv2.IMREAD_GRAYSCALE)
    edges = cv2.Canny(im, 60, 160)
    out = rgbf.replace("_rgb.png","_canny.png"); cv2.imwrite(out, edges); return out

n=0
for kpf in sorted(glob.glob(os.path.join(P,"*_keypoints.json"))):
    draw_openpose(kpf); make_canny(kpf.replace("_keypoints.json","_rgb.png")); n+=1
print(f"POST_DONE — {n} shots: openpose + canny written")
