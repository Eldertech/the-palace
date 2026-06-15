#!/usr/bin/env python3
"""Draw the two motion-pair openpose skeletons from the keypoint JSONs (comfy venv, PIL)."""
import os, json, glob
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__)); P = os.path.join(HERE, "passes")
COLORS = [(255,0,0),(255,85,0),(255,170,0),(255,255,0),(170,255,0),(85,255,0),(0,255,0),
          (0,255,85),(0,255,170),(0,255,255),(0,170,255),(0,85,255),(0,0,255),(85,0,255),
          (170,0,255),(255,0,255),(255,0,170),(255,0,85)]
for kpf in sorted(glob.glob(os.path.join(P, "*_keypoints.json"))):
    d = json.load(open(kpf)); W,H = d["width"],d["height"]; kp = {int(k):v for k,v in d["keypoints"].items()}
    img = Image.new("RGB",(W,H),(0,0,0)); dr = ImageDraw.Draw(img)
    for idx,(a,b) in enumerate(d["limbs"]):
        if kp[a][2]>0.4 and kp[b][2]>0.4:
            dr.line([kp[a][0],kp[a][1],kp[b][0],kp[b][1]], fill=COLORS[idx%18], width=8)
    for i,(x,y,c) in kp.items():
        if c>0.4: dr.ellipse([x-6,y-6,x+6,y+6], fill=COLORS[i%18])
    out = kpf.replace("_keypoints.json","_openpose.png"); img.save(out); print("WROTE", os.path.basename(out))
print("DRAW_PAIR_DONE")
