#!/usr/bin/env python3
"""
Does PHOTOREAL crack the car? Run SAM (point prompt) + Depth Anything on the FLUX photoreal of shot 02
and montage: photoreal | SAM car masks | depth. Compare directly to the line-art car that defeated
every method. If the car segments cleanly here, photoreal-first is the reliable decomposition path.

  <comfy venv>/python photoreal_segment.py
"""
import os
import numpy as np, cv2, torch
from PIL import Image, ImageDraw
from ultralytics import SAM
from transformers import pipeline

HERE = os.path.dirname(os.path.abspath(__file__)); REND = os.path.join(HERE, "renders")
PHOTO = os.path.join(HERE, "..", "m3-warped-noise", "renders", "photoreal_shot02.png")
shot = cv2.imread(PHOTO); H, W = shot.shape[:2]

m = SAM("sam_b.pt")
def seg_pts(pts):
    r = m(PHOTO, points=[[int(x * W), int(y * H)] for x, y in pts], labels=[1] * len(pts), verbose=False)
    if r[0].masks is None: return np.zeros((H, W), np.uint8)
    return cv2.resize((r[0].masks.data[0].cpu().numpy() * 255).astype(np.uint8), (W, H))
carL = seg_pts([(0.20, 0.40)]); carR = seg_pts([(0.78, 0.40)]); person = seg_pts([(0.50, 0.70)])

pipe = pipeline("depth-estimation", model="depth-anything/Depth-Anything-V2-Small-hf", device="mps" if torch.backends.mps.is_available() else "cpu")
depth = pipe(Image.open(PHOTO).convert("RGB"))["predicted_depth"].squeeze().detach().cpu().numpy().astype(np.float32)
depth = cv2.resize(depth, (W, H))
dcol = cv2.applyColorMap(cv2.normalize(depth, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8), cv2.COLORMAP_TURBO)

segov = shot.astype(np.float32)
for mk, col in [(carL, (90, 230, 90)), (carR, (90, 180, 255)), (person, (220, 90, 220))]:
    a = (mk > 128).astype(np.float32)[..., None] * 0.5
    segov = segov * (1 - a) + np.array(col, np.float32)[None, None, :] * a

def tile(img, name):
    im = Image.fromarray(cv2.cvtColor(img.astype(np.uint8), cv2.COLOR_BGR2RGB)).resize((250, int(250 * H / W)))
    d = ImageDraw.Draw(im); d.rectangle((0, 0, 250, 16), fill=(0, 0, 0)); d.text((3, 3), name, fill=(255, 210, 90)); return im
tiles = [tile(shot, "photoreal (FLUX)"),
         tile(segov, f"SAM  carL {int(100*(carL>128).sum()/(H*W))}% carR {int(100*(carR>128).sum()/(H*W))}%"),
         tile(dcol, "depth")]
sheet = Image.new("RGB", (tiles[0].width * 3 + 24, tiles[0].height), (20, 20, 22))
for i, t in enumerate(tiles): sheet.paste(t, (i * (t.width + 10), 0))
sheet.save(os.path.join(REND, "_photoreal_segment.png"))
print("carL px:", int((carL > 128).sum()), "carR px:", int((carR > 128).sum()), "person px:", int((person > 128).sum()))
print("WROTE renders/_photoreal_segment.png")
