#!/usr/bin/env python3
"""
BLUELINE M3 — warp the FLUX latent noise from phase A to phase B along the A->B flow, the
Go-with-the-Flow way (backward-warp + renormalise to ~N(0,1)). Proves the warp LOCALLY at FLUX-latent
scale before any pod spend, and emits the noise tensors the pod render will inject.

A->B flow is derived from the keypoint displacements (sparse -> dense via normalised convolution) — the
actual motion of THIS pair, not a generic vortex field. Reuses Session 3's warp+renorm mechanism.

Run (comfy venv, for numpy/scipy/PIL):  <comfy venv>/python warp_demo.py
Outputs: N_A.npy, N_warped.npy (16x152x104 FLUX latent noise), flow_latent.npy, warp-proof.png
"""
import os, json, math, colorsys
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import map_coordinates, gaussian_filter, zoom

HERE = os.path.dirname(os.path.abspath(__file__))
M = json.load(open(os.path.join(HERE, "pair-manifest.json")))
W, H = M["width"], M["height"]
A = {int(k): v for k, v in M["phases"]["A_coil"].items()}
B = {int(k): v for k, v in M["phases"]["B_leap"].items()}

# ── A->B dense flow from keypoint displacements (normalised convolution: scatter, then smooth) ──
acc = np.zeros((H, W, 2), np.float32); wt = np.zeros((H, W), np.float32)
for i in A:
    if A[i][2] < 0.4 or B[i][2] < 0.4: continue
    xa, ya = A[i][0], A[i][1]; xb, yb = B[i][0], B[i][1]
    xi, yi = int(np.clip(xa, 0, W-1)), int(np.clip(ya, 0, H-1))
    acc[yi, xi, 0] += (xb - xa); acc[yi, xi, 1] += (yb - ya); wt[yi, xi] += 1.0
SIG = 90.0
fu = gaussian_filter(acc[:, :, 0], SIG); fv = gaussian_filter(acc[:, :, 1], SIG)
fw = gaussian_filter(wt, SIG) + 1e-6
flow = np.stack([fu / fw, fv / fw], -1)            # dense (H,W,2) pixel displacement A->B
print(f"flow: max |disp| = {np.hypot(flow[...,0], flow[...,1]).max():.1f}px (the big delta)")

# ── FLUX latent shape: 16 channels at 1/8 res ──
LH, LW = H // 8, W // 8                              # 152 x 104
fl_u = zoom(flow[:, :, 0], (LH / H, LW / W), order=1) / 8.0   # px disp -> latent-cell disp
fl_v = zoom(flow[:, :, 1], (LH / H, LW / W), order=1) / 8.0
flow_latent = np.stack([fl_u, fl_v], -1).astype(np.float32)
np.save(os.path.join(HERE, "flow_latent.npy"), flow_latent)

def warp_renorm(arr, u, v, t=1.0):
    """backward-warp arr by t*(u,v) then renormalise to mean0/std1 (GtF: keep ~N(0,1))."""
    hh, ww = arr.shape[-2], arr.shape[-1]
    yy, xx = np.mgrid[0:hh, 0:ww].astype(np.float32)
    sy, sx = yy + t * v, xx + t * u
    if arr.ndim == 2:
        out = map_coordinates(arr, [sy, sx], order=1, mode="reflect")
    else:
        out = np.stack([map_coordinates(arr[c], [sy, sx], order=1, mode="reflect") for c in range(arr.shape[0])])
    return (out - out.mean()) / (out.std() + 1e-6)

# ── the FLUX latent noise: seed -> N_A; warp along the flow -> N_warped ──
rng = np.random.default_rng(777)                    # the shared seed (Track V's seed-lock anchor)
N_A = rng.standard_normal((16, LH, LW)).astype(np.float32)
N_warped = warp_renorm(N_A, fl_u, fl_v, 1.0).astype(np.float32)
np.save(os.path.join(HERE, "N_A.npy"), N_A)
np.save(os.path.join(HERE, "N_warped.npy"), N_warped)
print(f"N_A   mean {N_A.mean():+.3f} std {N_A.std():.3f}")
print(f"N_warp mean {N_warped.mean():+.3f} std {N_warped.std():.3f}  (renorm holds ~N(0,1))")
print(f"N_A vs N_warped differ: {(np.abs(N_A-N_warped).mean()):.3f} mean-abs (the warp moved the noise)")

# ── proof image: the warp carries the A->B motion (viewable low-freq noise) ──
low = gaussian_filter(rng.standard_normal((H, W)).astype(np.float32), 5.0)
low = (low - low.mean()) / (low.std() + 1e-6)
def gray(a): return Image.fromarray(((np.clip(a*0.5+0.5,0,1))*255).astype(np.uint8)).convert("RGB")
t0 = gray(low); t1 = gray(warp_renorm(low, flow[...,0], flow[...,1], 1.0))
# flow HSV
mag = np.hypot(flow[...,0], flow[...,1]); ang = (np.arctan2(-flow[...,1], flow[...,0]) + math.pi)/(2*math.pi)
hsv = np.stack([ang, np.full_like(ang,0.9), np.clip(mag/(mag.max()+1e-6),0,1)**0.7], -1).reshape(-1,3)
flow_img = Image.fromarray((np.array([colorsys.hsv_to_rgb(*p) for p in hsv]).reshape(H,W,3)*255).astype(np.uint8))
A_rgb = Image.open(os.path.join(HERE,"passes","A_coil_rgb.png")).convert("RGB")
B_rgb = Image.open(os.path.join(HERE,"passes","B_leap_rgb.png")).convert("RGB")
pw = 300; ph = int(pw*H/W); GAP, TOP = 10, 26
panels = [("A (coil)", A_rgb), ("B (leap)", B_rgb), ("A->B flow", flow_img), ("noise t0", t0), ("warped t1", t1)]
sheet = Image.new("RGB", (pw*len(panels)+GAP*(len(panels)-1), ph+TOP), (12,13,16)); dr=ImageDraw.Draw(sheet)
for i,(lab,im) in enumerate(panels):
    x=i*(pw+GAP); sheet.paste(im.resize((pw,ph)), (x,TOP)); dr.text((x+4,6), lab, fill=(224,168,58))
sheet.save(os.path.join(HERE,"warp-proof.png"))
print("WROTE warp-proof.png")
print("WARP_DEMO_DONE")
