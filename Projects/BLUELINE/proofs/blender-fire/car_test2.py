#!/usr/bin/env python3
"""Crack the line-art cars with FULL SAM (ViT-B, far stronger than MobileSAM). Try a tight box and
body-point prompts per car; montage every attempt on the drawing to review which (if any) isolates
the car body rather than grabbing the building/sky behind it."""
import os
import numpy as np, cv2
from ultralytics import SAM
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
SHOT = os.path.join(HERE, "..", "new-story", "out", "02_hero-on-sedan-pointing.png")
shot = cv2.imread(SHOT); H, W = shot.shape[:2]
m = SAM("sam_b.pt")                                   # full SAM ViT-B (~360MB)

def px(x0, y0, x1, y1): return [int(x0 * W), int(y0 * H), int(x1 * W), int(y1 * H)]
def mask_of(r):
    if r[0].masks is None: return np.zeros((H, W), np.uint8)
    return cv2.resize((r[0].masks.data[0].cpu().numpy() * 255).astype(np.uint8), (W, H))

attempts = {
    "L · box":   mask_of(m(SHOT, bboxes=[px(0.03, 0.31, 0.40, 0.45)], verbose=False)),
    "L · points": mask_of(m(SHOT, points=[[int(0.20 * W), int(0.40 * H)], [int(0.12 * W), int(0.41 * H)]], labels=[1, 1], verbose=False)),
    "R · box":   mask_of(m(SHOT, bboxes=[px(0.56, 0.32, 0.96, 0.45)], verbose=False)),
    "R · points": mask_of(m(SHOT, points=[[int(0.80 * W), int(0.40 * H)], [int(0.70 * W), int(0.41 * H)]], labels=[1, 1], verbose=False)),
}
tiles = []
for name, mk in attempts.items():
    ov = shot.astype(np.float32)
    a = (mk > 128).astype(np.float32)[..., None] * 0.5
    ov = (ov * (1 - a) + np.array((90, 220, 90), np.float32)[None, None, :] * a).astype(np.uint8)
    im = Image.fromarray(cv2.cvtColor(ov, cv2.COLOR_BGR2RGB)).resize((210, 307))
    d = ImageDraw.Draw(im); d.rectangle((0, 0, 210, 16), fill=(0, 0, 0)); d.text((3, 3), f"{name}  {(mk>128).sum()//1000}k", fill=(255, 210, 90))
    tiles.append(im)
sheet = Image.new("RGB", (210 * 4 + 30, 307), (20, 20, 22))
for i, t in enumerate(tiles): sheet.paste(t, (i * (210 + 10), 0))
sheet.save("/tmp/_car_fullsam.png"); print("WROTE /tmp/_car_fullsam.png")
