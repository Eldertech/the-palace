"""
BLUELINE — Unified Rig + OpenPose, draw half.
Reads keypoints.json (18 canonical OpenPose keypoints, normalized, from pose_rig.py)
and draws the skeleton with the REAL controlnet_aux draw_bodypose — so the result is
pixel-identical to what the ComfyUI OpenPose preprocessor produces (optimal for the
controlnet-openpose model).

Run with the ComfyUI venv python (has cv2/numpy + the controlnet_aux lib):
  _tools/ComfyUI/venv/bin/python3 draw_openpose.py <pose_dir>
Writes <pose_dir>/openpose.png
"""
import sys, os, json
import numpy as np
from PIL import Image

COMFY = "/Users/loudonstearns/Documents/The Palace/_tools/ComfyUI"
sys.path.insert(0, os.path.join(COMFY, "custom_nodes", "comfyui_controlnet_aux", "src"))
from custom_controlnet_aux.open_pose.util import draw_bodypose
from custom_controlnet_aux.open_pose.body import Keypoint

pose_dir = sys.argv[1]
data = json.load(open(os.path.join(pose_dir, "keypoints.json")))
W, H = data["res"]
kps = data["keypoints"]

canvas = np.zeros((H, W, 3), dtype=np.uint8)
keypoints = [Keypoint(x, y) if vis else None for (x, y, vis) in kps]
canvas = draw_bodypose(canvas, keypoints)

Image.fromarray(canvas).save(os.path.join(pose_dir, "openpose.png"))
print("wrote", os.path.join(pose_dir, "openpose.png"), "| visible:", sum(1 for k in keypoints if k), "/18")
