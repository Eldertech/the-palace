"""
Figure Rig — MULTI-FIGURE OpenPose draw. draw_bodypose is additive, so N skeletons on one plate
is just one call per figure on the same canvas (plus per-figure hands/face). Consumes the
{res, figures:[{body:18, hands:{side:21}}, ...]} format from multi_figure_rig.py; falls back to
the single-figure {keypoints, hands} format for backward compatibility.

Run with the ComfyUI venv python (cv2/numpy + controlnet_aux):
  _tools/ComfyUI/venv/bin/python3 draw_openpose_multi.py <scene_dir>
Writes <scene_dir>/openpose.png
"""
import sys, os, json
import numpy as np
from PIL import Image

COMFY = "/Users/loudonstearns/Documents/The Palace/_tools/ComfyUI"
sys.path.insert(0, os.path.join(COMFY, "custom_nodes", "comfyui_controlnet_aux", "src"))
from custom_controlnet_aux.open_pose.util import draw_bodypose, draw_handpose, draw_facepose
from custom_controlnet_aux.open_pose.body import Keypoint

pose_dir = sys.argv[1]
data = json.load(open(os.path.join(pose_dir, "keypoints.json")))
W, H = data["res"]
canvas = np.zeros((H, W, 3), dtype=np.uint8)

figs = data.get("figures")
if figs is None:  # single-figure backward-compat
    figs = [{"body": data["keypoints"], "hands": data.get("hands", {}), "face": data.get("face")}]

nb = nh = nf = 0
for fig in figs:
    body = [Keypoint(x, y) if vis else None for (x, y, vis) in fig["body"]]
    canvas = draw_bodypose(canvas, body); nb += 1
    for side, hk in (fig.get("hands") or {}).items():
        hand = [Keypoint(x, y) if vis else None for (x, y, vis) in hk]
        if any(k is not None for k in hand):
            canvas = draw_handpose(canvas, hand); nh += 1
    face = fig.get("face")
    if face:
        fk = [Keypoint(x, y) if vis else None for (x, y, vis) in face]
        if any(k is not None for k in fk):
            canvas = draw_facepose(canvas, fk); nf += 1

Image.fromarray(canvas).save(os.path.join(pose_dir, "openpose.png"))
print("wrote", os.path.join(pose_dir, "openpose.png"), f"| figures: {nb} | hands: {nh} | faces: {nf}")
