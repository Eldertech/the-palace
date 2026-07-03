#!/usr/bin/env python3
"""
BLUELINE blender-fire — read the PHYSICS out of the drawn fire/smoke and hand it to the model.

Structure-tensor analysis of the drawn smoke in shot 02: for each height band, the coherence- and
darkness-weighted dominant orientation of the ink streaks → the smoke's flow direction there, made to
point up. The horizontal component is the LEAN (drift / rise). The lean-by-height profile is written to
smoke_physics.json so the Blender flame field leans and curls the way the drawing does.

  <comfy venv>/python analyze_smoke.py   -> smoke_physics.json (+ a flow-overlay to verify)
"""
import os, json, math
import numpy as np, cv2

HERE = os.path.dirname(os.path.abspath(__file__)); os.makedirs(os.path.join(HERE, "renders"), exist_ok=True)
SHOT = os.path.join(HERE, "..", "new-story", "out", "02_hero-on-sedan-pointing.png")

shot = cv2.imread(SHOT); H, W = shot.shape[:2]
gray = cv2.cvtColor(shot, cv2.COLOR_BGR2GRAY).astype(np.float32)
gx = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=5); gy = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=5)
Jxx = cv2.GaussianBlur(gx * gx, (0, 0), 7); Jyy = cv2.GaussianBlur(gy * gy, (0, 0), 7); Jxy = cv2.GaussianBlur(gx * gy, (0, 0), 7)
coh = np.sqrt((Jxx - Jyy) ** 2 + 4 * Jxy ** 2) / (Jxx + Jyy + 1e-6)
streak = 0.5 * np.arctan2(2 * Jxy, Jxx - Jyy) + math.pi / 2     # flow LINE direction (perp to gradient), image y-down
dark = np.clip((150 - gray) / 150, 0, 1)                        # smoke is dark ink
wmap = coh * dark

# central upper plume — avoid the far-left/right buildings
x0, x1 = int(W * 0.24), int(W * 0.80); y0, y1 = int(H * 0.02), int(H * 0.46)
NB = 6; bands = []; arrows = []
for b in range(NB):
    ya, yb = y0 + (y1 - y0) * b // NB, y0 + (y1 - y0) * (b + 1) // NB
    ww, ss = wmap[ya:yb, x0:x1], streak[ya:yb, x0:x1]
    a2 = 2 * ss; mx = float((ww * np.cos(a2)).sum()); my = float((ww * np.sin(a2)).sum())
    ori = 0.5 * math.atan2(my, mx)
    vx, vy = math.cos(ori), math.sin(ori)
    if vy > 0: vx, vy = -vx, -vy                                # make the flow point UP (image up = vy<0)
    lean = vx / (abs(vy) + 1e-3)                                # horizontal drift / vertical rise; + = screen-right
    z_norm = 1.0 - (b + 0.5) / NB                              # image-top band = high Blender Z
    bands.append({"z_norm": round(z_norm, 3), "lean": round(float(lean), 3)})
    cx, cy, L = (x0 + x1) // 2, (ya + yb) // 2, 46
    arrows.append((cx, cy, int(cx + vx * L), int(cy + vy * L)))

bands.sort(key=lambda d: d["z_norm"])
out = {"bands": bands, "mean_lean": round(float(np.mean([d["lean"] for d in bands])), 3),
       "note": "lean = horizontal drift / vertical rise of the drawn smoke, by Blender height; + = screen-right"}
json.dump(out, open(os.path.join(HERE, "smoke_physics.json"), "w"), indent=2)
print(json.dumps(out, indent=2))

ov = shot.copy(); cv2.rectangle(ov, (x0, y0), (x1, y1), (90, 90, 90), 1)
for ax, ay, bx, by in arrows:
    cv2.arrowedLine(ov, (ax, ay), (bx, by), (0, 130, 255), 3, tipLength=0.3)
cv2.imwrite(os.path.join(HERE, "renders", "_smoke_flow.png"), ov)
print("wrote renders/_smoke_flow.png")
