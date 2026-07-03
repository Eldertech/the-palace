#!/usr/bin/env python3
"""
BLUELINE cloud-I2V — the morph, upgraded from Farnebäck to RAFT.

RAFT (torchvision, pretrained, MPS) gives a far sharper dense flow than Farnebäck → cleaner
warp-blend in-betweens, much less ghosting/smearing on complex smoke. Re-renders the shot-01 sky
loop so the quality jump is visible side-by-side with the Farnebäck version.

  <comfy venv>/python morph_raft.py            # -> renders/svd_m160_morph_sky_raft.gif
"""
import os, glob
import numpy as np, cv2, torch
from PIL import Image
from torchvision.models.optical_flow import raft_large, Raft_Large_Weights

HERE = os.path.dirname(os.path.abspath(__file__)); REND = os.path.join(HERE, "renders")
LAB, STEPS, XF, GIF_W = "svd_m160", 6, 12, 720
DEV = "mps" if torch.backends.mps.is_available() else "cpu"
WT = Raft_Large_Weights.DEFAULT; TF = WT.transforms()
MODEL = raft_large(weights=WT).eval().to(DEV)
print("RAFT on", DEV)

frames = [cv2.imread(f) for f in sorted(glob.glob(f"{REND}/{LAB}_*.png"))]
H, W = frames[0].shape[:2]
gx, gy = np.meshgrid(np.arange(W), np.arange(H)); gx = gx.astype(np.float32); gy = gy.astype(np.float32)

def raft_flow(a, b):
    """Dense flow a->b in pixels, via RAFT (dims padded to /8, flow rescaled back)."""
    H8, W8 = (H // 8) * 8, (W // 8) * 8
    def prep(x):
        rgb = cv2.cvtColor(cv2.resize(x, (W8, H8)), cv2.COLOR_BGR2RGB)
        return torch.from_numpy(rgb).permute(2, 0, 1).float()[None] / 255.0
    A, B = TF(prep(a), prep(b))
    with torch.no_grad():
        fl = MODEL(A.to(DEV), B.to(DEV))[-1][0].cpu().numpy().transpose(1, 2, 0)
    fl = cv2.resize(fl, (W, H)) * np.array([W / W8, H / H8], np.float32)
    return fl

def warp(img, flow, t):
    mx = (gx + t * flow[..., 0]).astype(np.float32); my = (gy + t * flow[..., 1]).astype(np.float32)
    return cv2.remap(img, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)

def interp(a, b, steps):
    f_ab, f_ba = raft_flow(a, b), raft_flow(b, a)
    return [cv2.addWeighted(warp(a, f_ab, i / steps), 1 - i / steps,
                            warp(b, f_ba, 1 - i / steps), i / steps, 0) for i in range(steps)]

seq = []
for i, (a, b) in enumerate(zip(frames[:-1], frames[1:])):
    seq += interp(a, b, STEPS); print(f"  pair {i+1}/{len(frames)-1}", end="\r")
seq.append(frames[-1])
N = len(seq); body = [f.copy() for f in seq[:N - XF]]
for i in range(XF):
    w = 1.0 - (i + 1) / (XF + 1)
    body[i] = cv2.addWeighted(seq[N - XF + i], w, body[i], 1 - w, 0)
print(f"\nRAFT-morphed {len(frames)} -> {len(body)} frames")

pil = []
for f in body:
    im = Image.fromarray(cv2.cvtColor(f, cv2.COLOR_BGR2RGB))
    pil.append(im.resize((GIF_W, int(im.height * GIF_W / im.width)), Image.LANCZOS))
out = f"{REND}/{LAB}_morph_sky_raft.gif"
pil[0].save(out, save_all=True, append_images=pil[1:], duration=66, loop=0)
print("WROTE", out, len(pil), "frames")
