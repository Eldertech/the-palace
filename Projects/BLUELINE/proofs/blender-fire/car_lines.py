#!/usr/bin/env python3
"""
Crack the line-art CAR via its line structure (the only thing that can see it). Four methods on the
left sedan, montaged for review + an extent note each:

  A close+fill   — dilate the outline strokes to close gaps, fill the enclosed region → silhouette
  B GrabCut      — classical colour foreground extraction (expected to FAIL: car interior = paper = bg)
  C convex hull  — hull of all ink in the box (coarse upper bound)
  D close+fill+CC — A, then keep only the largest connected blob (drop stray background strokes)

  <comfy venv>/python car_lines.py   -> /tmp/_car_lines.png
"""
import os
import numpy as np, cv2
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
SHOT = os.path.join(HERE, "..", "new-story", "out", "02_hero-on-sedan-pointing.png")
shot = cv2.imread(SHOT); H, W = shot.shape[:2]
gray = cv2.cvtColor(shot, cv2.COLOR_BGR2GRAY)

x0, y0, x1, y1 = int(0.03 * W), int(0.31 * H), int(0.40 * W), int(0.45 * H)   # left-car box
roi = gray[y0:y1, x0:x1]; rh, rw = roi.shape
ink = (roi < 110).astype(np.uint8) * 255
K = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))

def fill_holes(m):
    ff = m.copy(); mm = np.zeros((m.shape[0] + 2, m.shape[1] + 2), np.uint8)
    cv2.floodFill(ff, mm, (0, 0), 255)
    return m | cv2.bitwise_not(ff)

# A close + fill
closed = cv2.morphologyEx(ink, cv2.MORPH_CLOSE, K, iterations=2)
A = cv2.erode(fill_holes(closed), K, iterations=1)
# D + largest connected component
n, lbl, st, _ = cv2.connectedComponentsWithStats(A, 8)
D = ((lbl == (1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA])))).astype(np.uint8) * 255) if n > 1 else A
# C convex hull
cnts, _ = cv2.findContours(ink, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
C = np.zeros_like(ink)
if cnts:
    cv2.fillPoly(C, [cv2.convexHull(np.vstack([c.reshape(-1, 2) for c in cnts]))], 255)
# B GrabCut on the full image, box init
mask = np.zeros((H, W), np.uint8)
cv2.grabCut(shot, mask, (x0, y0, x1 - x0, y1 - y0), np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64), 5, cv2.GC_INIT_WITH_RECT)
B = np.where((mask == 2) | (mask == 0), 0, 255).astype(np.uint8)[y0:y1, x0:x1]

def tile(m, name, cov):
    base = shot[y0:y1, x0:x1].astype(np.float32)
    a = (m > 128).astype(np.float32)[..., None] * 0.5
    o = (base * (1 - a) + np.array((90, 220, 90), np.float32) * a).astype(np.uint8)
    im = Image.fromarray(cv2.cvtColor(o, cv2.COLOR_BGR2RGB)).resize((230, int(230 * rh / rw)))
    d = ImageDraw.Draw(im); d.rectangle((0, 0, 230, 16), fill=(0, 0, 0)); d.text((3, 3), f"{name}  {cov}%", fill=(255, 210, 90))
    return im

tiles = [tile(m, n, int(100 * (m > 128).sum() / (rh * rw))) for m, n in [(A, "A close+fill"), (B, "B GrabCut"), (C, "C hull"), (D, "D +largestCC")]]
sheet = Image.new("RGB", (tiles[0].width * 4 + 30, tiles[0].height), (20, 20, 22))
for i, t in enumerate(tiles): sheet.paste(t, (i * (t.width + 10), 0))
sheet.save("/tmp/_car_lines.png"); print("WROTE /tmp/_car_lines.png")
