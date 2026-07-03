#!/usr/bin/env python3
"""
BLUELINE cloud-I2V — shot 02: RAFT-morph the SVD fire band and composite it back over the static
hero / cars / street. The method on a second frame: animate the background element (the upper
fire/smoke), keep the authored foreground crisp, composite.

  <comfy venv>/python fire_composite.py
"""
import os, glob
import numpy as np, cv2, torch
from PIL import Image
from torchvision.models.optical_flow import raft_large, Raft_Large_Weights

HERE = os.path.dirname(os.path.abspath(__file__)); REND = os.path.join(HERE, "renders")
LAB, STEPS, XF, GIF_W = "fire_m160", 6, 12, 720
DEV = "mps" if torch.backends.mps.is_available() else "cpu"
WT = Raft_Large_Weights.DEFAULT; TF = WT.transforms(); MODEL = raft_large(weights=WT).eval().to(DEV)
print("RAFT on", DEV)

frames = [cv2.imread(f) for f in sorted(glob.glob(f"{REND}/{LAB}_*.png"))]
H, W = frames[0].shape[:2]
gx, gy = np.meshgrid(np.arange(W), np.arange(H)); gx = gx.astype(np.float32); gy = gy.astype(np.float32)

def raft_flow(a, b):
    H8, W8 = (H // 8) * 8, (W // 8) * 8
    def prep(x):
        rgb = cv2.cvtColor(cv2.resize(x, (W8, H8)), cv2.COLOR_BGR2RGB)
        return torch.from_numpy(rgb).permute(2, 0, 1).float()[None] / 255.0
    A, B = TF(prep(a), prep(b))
    with torch.no_grad():
        fl = MODEL(A.to(DEV), B.to(DEV))[-1][0].cpu().numpy().transpose(1, 2, 0)
    return cv2.resize(fl, (W, H)) * np.array([W / W8, H / H8], np.float32)

def warp(img, flow, t):
    mx = (gx + t * flow[..., 0]).astype(np.float32); my = (gy + t * flow[..., 1]).astype(np.float32)
    return cv2.remap(img, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)

def interp(a, b, n):
    fab, fba = raft_flow(a, b), raft_flow(b, a)
    return [cv2.addWeighted(warp(a, fab, i / n), 1 - i / n, warp(b, fba, 1 - i / n), i / n, 0) for i in range(n)]

seq = []
for i, (a, b) in enumerate(zip(frames[:-1], frames[1:])):
    seq += interp(a, b, STEPS); print(f"  pair {i+1}/{len(frames)-1}", end="\r")
seq.append(frames[-1])
N = len(seq); body = [f.copy() for f in seq[:N - XF]]
for i in range(XF):
    w = 1.0 - (i + 1) / (XF + 1); body[i] = cv2.addWeighted(seq[N - XF + i], w, body[i], 1 - w, 0)
print(f"\nRAFT-morphed {len(frames)} -> {len(body)} fire frames")

def save_gif(imgs, path, w):
    pil = [Image.fromarray(cv2.cvtColor(f, cv2.COLOR_BGR2RGB)).resize((w, int(f.shape[0] * w / f.shape[1])), Image.LANCZOS) for f in imgs]
    pil[0].save(path, save_all=True, append_images=pil[1:], duration=66, loop=0); print("WROTE", path, len(pil))

save_gif(body, f"{REND}/{LAB}_morph.gif", GIF_W)

# composite into shot 02 — the fire band was cropped at (0,40)-(832,508); place it back, feather both edges
SHOT = os.path.join(HERE, "..", "new-story", "out", "02_hero-on-sedan-pointing.png")
base = cv2.imread(SHOT); BH, BW = base.shape[:2]; y0, y1 = 40, 508; bh = y1 - y0
mask = np.zeros((BH, BW), np.float32)
for y in range(y0, y1):
    m = (y - y0) / 35.0 if y < y0 + 35 else (1.0 if y < y1 - 38 else 1.0 - (y - (y1 - 38)) / 38.0)
    mask[y] = max(0.0, min(1.0, m))                    # feather top (into the static top strip) + bottom (the horizon above the hero)
m3 = cv2.merge([mask] * 3)
comp = []
for f in body:
    layer = base.copy().astype(np.float32)
    layer[y0:y1] = cv2.resize(f, (BW, bh)).astype(np.float32)
    comp.append((layer * m3 + base.astype(np.float32) * (1 - m3)).astype(np.uint8))
save_gif(comp, f"{REND}/{LAB}_composite.gif", GIF_W)
cv2.imwrite(f"{REND}/_fire_comp_frame66.png", comp[66])
print("DONE")
