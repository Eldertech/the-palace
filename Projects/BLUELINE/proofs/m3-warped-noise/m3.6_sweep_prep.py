#!/usr/bin/env python3
"""
BLUELINE M3.6 — build the DELTA SWEEP assets. M3.5 showed the (now-correct) flow-warped noise ties
seed-lock at the extreme 482 px jump; the bet ([[The Flow Field is the Spine]]) should pay off at SMALL,
incremental deltas (Go-with-the-Flow's regime). This interpolates the A->B pose at several fractions t,
so we can render seed-lock vs warped at each delta and find the crossover.

For each t:
  pose_t  = A + t*(B-A)            (linear keypoint interpolation; the openpose conditioning)
  flow_t  = t * flow_latent        (the A->B latent flow, scaled to this delta)
  N_warp_t = GtF-warp(N_A, flow_t) (whiteness-preserving forward-splat; warp_noise_gtf.warp_noise_white)
delta_px(t) = t * max_i |B_i - A_i|   (the headline pose displacement at this fraction)

Run (comfy venv): <venv>/python m3.6_sweep_prep.py
Outputs: sweep/pose_t{tag}.png, sweep/N_warp_t{tag}.npy, sweep/sweep-manifest.json + whiteness diag.
"""
import os, sys, json
import numpy as np
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, "..", "..", "staging-skeleton"))
from warp_noise_gtf import warp_noise_white, lag1_autocorr
import staging_skeleton as SK
COLORS = [tuple(c) for c in SK.OPENPOSE_COLORS]

TS = [0.1, 0.2, 0.35, 0.6, 1.0]                 # sweep fractions (weighted toward small)

M = json.load(open(os.path.join(HERE, "pair-manifest.json")))
W, H = M["width"], M["height"]
A = {int(k): v for k, v in M["phases"]["A_coil"].items()}
B = {int(k): v for k, v in M["phases"]["B_leap"].items()}
LIMBS = json.load(open(os.path.join(HERE, "passes", "A_coil_keypoints.json")))["limbs"]
flow = np.load(os.path.join(HERE, "flow_latent.npy"))           # (LH,LW,2) A->B latent disp
N_A = np.load(os.path.join(HERE, "N_A.npy")).astype(np.float32) # (16,LH,LW)
rng = np.random.default_rng(20260619)

# delta axis = the DENSE-FLOW max displacement the noise-warp actually applies (482 px at t=1, the figure
# warp_demo printed and M3/M3.5 cite). flow_latent is in latent cells (÷8); ×8 back to pixels.
FLOW_MAX_PX = float(np.hypot(flow[..., 0], flow[..., 1]).max() * 8.0)
kp_max = max(np.hypot(B[i][0]-A[i][0], B[i][1]-A[i][1]) for i in A)     # raw keypoint max (context only)
max_disp = FLOW_MAX_PX
print(f"flow-field max |disp| = {FLOW_MAX_PX:.0f}px (delta axis); raw keypoint max = {kp_max:.0f}px")

def draw_pose(kp, path):
    img = Image.new("RGB", (W, H), (0, 0, 0)); dr = ImageDraw.Draw(img)
    for idx, (a, b) in enumerate(LIMBS):
        if kp[a][2] > 0.4 and kp[b][2] > 0.4:
            dr.line([kp[a][0], kp[a][1], kp[b][0], kp[b][1]], fill=COLORS[idx % 18], width=8)
    for i, (x, y, c) in kp.items():
        if c > 0.4:
            dr.ellipse([x-6, y-6, x+6, y+6], fill=COLORS[i % 18])
    img.save(path)

OUT = os.path.join(HERE, "sweep"); os.makedirs(OUT, exist_ok=True)
entries = []
for t in TS:
    tag = f"{int(round(t*100)):03d}"                              # 010,020,035,060,100
    kp = {i: [A[i][0] + t*(B[i][0]-A[i][0]), A[i][1] + t*(B[i][1]-A[i][1]), 1.0] for i in A}
    pose_png = os.path.join(OUT, f"pose_t{tag}.png"); draw_pose(kp, pose_png)
    flow_t = (t * flow).astype(np.float32)
    N_warp, frac = warp_noise_white(N_A, flow_t[..., 0], flow_t[..., 1], rng, mode="nearest")
    npy = os.path.join(OUT, f"N_warp_t{tag}.npy"); np.save(npy, N_warp)
    delta = t * max_disp
    ac = lag1_autocorr(N_warp)
    print(f"  t={t:>4}  delta={delta:6.0f}px  warp-filled {frac*100:3.0f}%  whiteness(lag1)={ac:+.3f}  "
          f"diff-from-N_A {np.abs(N_A-N_warp).mean():.3f}")
    entries.append({"t": t, "tag": tag, "delta_px": round(delta, 1), "pose_png": f"sweep/pose_t{tag}.png",
                    "warp_npy": f"sweep/N_warp_t{tag}.npy", "warp_filled": round(frac, 3),
                    "whiteness_lag1": round(ac, 4)})

json.dump({"max_disp_px": round(max_disp, 1), "prompt_ref": "m3_pod_render.PROMPT",
           "anchor_noise": "N_A.npy", "deltas": entries},
          open(os.path.join(OUT, "sweep-manifest.json"), "w"), indent=2)
print(f"wrote sweep/sweep-manifest.json ({len(entries)} deltas)")
print("SWEEP_PREP_DONE")
