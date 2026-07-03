#!/usr/bin/env python3
"""
BLUELINE blender-fire — extract the ACTUAL hero outline from the shot-02 drawing.

The greybox mannequin is the wrong shape; the fire must be occluded by the real man. So pull his
true silhouette from his inked (dark) pixels, bounded by his pose skeleton so it doesn't swallow the
car or the street shadow, keep the connected blob that holds his torso, fill, and slightly feather.

  <comfy venv>/python hero_mask.py    -> renders/hero_mask.png (+ a preview overlay)
"""
import os
import numpy as np, cv2

HERE = os.path.dirname(os.path.abspath(__file__)); REND = os.path.join(HERE, "renders"); os.makedirs(REND, exist_ok=True)
SHOT = os.path.join(HERE, "..", "new-story", "out", "02_hero-on-sedan-pointing.png")

KP = {0:[413.0,552.1],1:[416.0,608.0],2:[345.9,623.9],3:[295.4,627.2],4:[251.2,623.1],
      5:[489.2,620.3],6:[520.4,717.2],7:[535.2,802.9],8:[365.3,788.8],9:[355.1,933.1],
      10:[356.5,1088.5],11:[471.3,788.1],12:[477.8,934.3],13:[480.4,1091.7]}

shot = cv2.imread(SHOT); H, W = shot.shape[:2]
gray = cv2.cvtColor(shot, cv2.COLOR_BGR2GRAY)

# 1) generous skeleton region (so we only look for the man where the man is)
region = np.zeros((H, W), np.uint8)
bones = [(1,2,30),(2,3,20),(3,4,16),(1,5,30),(5,6,20),(6,7,16),
         (1,8,34),(8,9,30),(9,10,24),(1,11,34),(11,12,30),(12,13,24),(1,0,26)]
for a, b, r in bones:
    cv2.line(region, tuple(map(int, KP[a])), tuple(map(int, KP[b])), 255, r * 2)
cv2.circle(region, tuple(map(int, KP[0])), 42, 255, -1)                         # head
cv2.fillPoly(region, [np.array([KP[2], KP[5], KP[11], KP[8]], np.int32)], 255)  # torso slab
region = cv2.dilate(region, np.ones((17, 17), np.uint8))

# 2) his inked pixels inside that region
dark = ((gray < 110).astype(np.uint8)) * 255
hero = cv2.bitwise_and(region, dark)

# 3) keep the connected blob that holds his torso centre
n, lbl, stats, _ = cv2.connectedComponentsWithStats(hero, 8)
tx, ty = int((KP[1][0] + KP[8][0] + KP[11][0]) / 3), int((KP[1][1] + KP[8][1]) / 2)
lab = lbl[ty, tx] if lbl[ty, tx] != 0 else (1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA])))
mask = ((lbl == lab).astype(np.uint8)) * 255

# 4) fill interior holes, close, feather
ff = mask.copy(); m2 = np.zeros((H + 2, W + 2), np.uint8)
cv2.floodFill(ff, m2, (0, 0), 255)
mask = cv2.bitwise_or(mask, cv2.bitwise_not(ff))
mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((11, 11), np.uint8))
cv2.imwrite(os.path.join(REND, "hero_mask.png"), mask)
cv2.imwrite(os.path.join(REND, "hero_mask_feather.png"), cv2.GaussianBlur(mask, (0, 0), 1.6))

# preview overlay (mask edge on the drawing)
ov = shot.copy()
cnts, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
cv2.drawContours(ov, cnts, -1, (0, 90, 255), 3)
cv2.imwrite(os.path.join(REND, "_hero_mask_overlay.png"), ov)
print("WROTE hero_mask.png — coverage %.1f%%" % (100.0 * (mask > 127).sum() / (H * W)))
