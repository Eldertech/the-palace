#!/usr/bin/env python3
"""Crack the hardest layer — the line-art CARS. Box prompts grab the see-through background; try POINT
prompts (click the body) which lock an object better. Render each attempt on the drawing to review."""
import os
import numpy as np, cv2
from ultralytics import SAM

HERE = os.path.dirname(os.path.abspath(__file__)); REND = os.path.join(HERE, "renders")
SHOT = os.path.join(HERE, "..", "new-story", "out", "02_hero-on-sedan-pointing.png")
shot = cv2.imread(SHOT); H, W = shot.shape[:2]
m = SAM("mobile_sam.pt")

def seg(points):
    pts = [[int(x * W), int(y * H)] for x, y in points]
    r = m(SHOT, points=pts, labels=[1] * len(pts), verbose=False)
    if r[0].masks is None: return np.zeros((H, W), np.uint8)
    mk = r[0].masks.data[0].cpu().numpy()
    return cv2.resize((mk * 255).astype(np.uint8), (W, H))

# multi-point prompts along each car body
carL = seg([(0.16, 0.37), (0.24, 0.36), (0.31, 0.36)])
carR = seg([(0.66, 0.37), (0.75, 0.37), (0.85, 0.37)])

ov = shot.copy().astype(np.float32)
for mk, col, pts in [(carL, (90, 230, 90), [(0.16, 0.37), (0.24, 0.36), (0.31, 0.36)]),
                     (carR, (90, 180, 255), [(0.66, 0.37), (0.75, 0.37), (0.85, 0.37)])]:
    a = (mk > 128).astype(np.float32)[..., None] * 0.5
    ov = ov * (1 - a) + np.array(col, np.float32)[None, None, :] * a
    for x, y in pts:
        cv2.circle(ov, (int(x * W), int(y * H)), 5, (0, 0, 255), -1)
cv2.imwrite("/tmp/_car_points.png", ov.astype(np.uint8))
print("carL px:", int((carL > 128).sum()), "carR px:", int((carR > 128).sum()))
print("WROTE /tmp/_car_points.png")
