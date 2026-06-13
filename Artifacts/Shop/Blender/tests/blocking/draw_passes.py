#!/usr/bin/env python3
"""
Draw the geometric OpenPose skeleton + emit canny / lineart from the Blender RGB.
Run with the ComfyUI venv (has cv2, numpy, PIL):
  ../../../../_tools/ComfyUI/venv/bin/python draw_passes.py

- openpose.png : the EXACT skeleton from projected bones (controlnet_aux draw_bodypose,
                 faithfully reproduced) — no 2D estimator, so it is correct on any proxy.
- canny.png    : cv2 Canny on the clay render — the SDXL edge channel.
- lineart.png  : a coherent-line artifact (XDoG) for completeness. NOTE: SDXL has no strong
                 standalone lineart ControlNet at this date, so this pass is emitted but NOT
                 fed to the SDXL stack (canny carries the edge channel). Documented gap.
"""
import json, os, math, numpy as np, cv2
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
P = os.path.abspath(os.path.join(HERE, "..", "passes"))

# canonical OpenPose BODY_18 colors (RGB), one per keypoint AND per limb (same order)
COLORS = [[255,0,0],[255,85,0],[255,170,0],[255,255,0],[170,255,0],[85,255,0],
          [0,255,0],[0,255,85],[0,255,170],[0,255,255],[0,170,255],[0,85,255],
          [0,0,255],[85,0,255],[170,0,255],[255,0,255],[255,0,170],[255,0,85]]

def draw_openpose():
    d = json.load(open(os.path.join(P, "pose_keypoints.json")))
    W, H = d["width"], d["height"]
    kp = {int(k): v for k, v in d["keypoints"].items()}
    limbs = d["limbs"]
    canvas = np.zeros((H, W, 3), np.uint8)
    stick = 4
    for i, (a, b) in enumerate(limbs):
        if kp[a][2] < 0.4 or kp[b][2] < 0.4:
            continue
        xa, ya = kp[a][0], kp[a][1]; xb, yb = kp[b][0], kp[b][1]
        mx, my = (xa + xb) / 2, (ya + yb) / 2
        length = math.hypot(xa - xb, ya - yb)
        angle = math.degrees(math.atan2(ya - yb, xa - xb))
        poly = cv2.ellipse2Poly((int(mx), int(my)), (int(length / 2), stick),
                                int(angle), 0, 360, 1)
        cur = canvas.copy()
        cv2.fillConvexPoly(cur, poly, COLORS[i % len(COLORS)])
        canvas = cv2.addWeighted(canvas, 0.4, cur, 0.6, 0)
    for i in range(18):
        if i not in kp or kp[i][2] < 0.4:
            continue
        cv2.circle(canvas, (int(kp[i][0]), int(kp[i][1])), 4, COLORS[i % len(COLORS)], -1)
    Image.fromarray(canvas).save(os.path.join(P, "openpose.png"))
    print("WROTE openpose.png")

def draw_canny():
    rgb = cv2.imread(os.path.join(P, "rgb.png"), cv2.IMREAD_GRAYSCALE)
    edges = cv2.Canny(rgb, 60, 160)
    Image.fromarray(edges).convert("RGB").save(os.path.join(P, "canny.png"))
    print("WROTE canny.png")

def draw_lineart():
    g = cv2.imread(os.path.join(P, "rgb.png"), cv2.IMREAD_GRAYSCALE).astype(np.float32)
    g1 = cv2.GaussianBlur(g, (0, 0), 0.8)
    g2 = cv2.GaussianBlur(g, (0, 0), 2.4)
    dog = g1 - 1.0 * g2
    line = (dog < -1.2).astype(np.uint8) * 255      # dark coherent lines on white
    line = 255 - line
    Image.fromarray(line).convert("RGB").save(os.path.join(P, "lineart.png"))
    print("WROTE lineart.png (XDoG stand-in; not fed to SDXL stack)")

draw_openpose(); draw_canny(); draw_lineart()
print("DONE_DRAW_PASSES")
