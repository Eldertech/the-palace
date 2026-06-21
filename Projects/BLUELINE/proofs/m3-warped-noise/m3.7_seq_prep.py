#!/usr/bin/env python3
"""
BLUELINE M3.7 — build the CUMULATIVE SEQUENCE assets. M3.6 (single A->B jump, swept) showed the warp ties
seed-lock. The bet's last viable regime is a multi-frame SEQUENCE where seed-lock's drift compounds and a
PER-STEP flow-warp re-aligns each increment (Go-with-the-Flow's actual video setting). This builds a 6-frame
motion (coil->leap) two ways:

  SEED-LOCK : every frame uses the SAME noise N_A, only the pose moves.
  WARPED-CHAIN : N_0 = N_A; N_i = GtF-warp(N_{i-1}, per-step flow).  The noise is transported STEP BY STEP
                 along the motion, so each frame's noise is the previous frame's noise moved one increment —
                 the temporal-coherence mechanism. (Distinct from M3.6, which warped N_A by the full flow.)

per-step flow = (1/(N-1)) * flow_latent  (the A->B motion is linear, so each increment is an equal share).

Run (comfy venv): <venv>/python m3.7_seq_prep.py
Outputs: seq/pose_s{i}.png, seq/N_chain_s{i}.npy (i=1..5; s0 == N_A), seq/seq-manifest.json + whiteness diag.
"""
import os, json
import numpy as np
from PIL import Image, ImageDraw
import sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE); sys.path.insert(0, os.path.join(HERE, "..", "..", "staging-skeleton"))
from warp_noise_gtf import warp_noise_white, lag1_autocorr
import staging_skeleton as SK
COLORS = [tuple(c) for c in SK.OPENPOSE_COLORS]

NFRAMES = 6
TS = [i / (NFRAMES - 1) for i in range(NFRAMES)]     # 0, .2, .4, .6, .8, 1.0

M = json.load(open(os.path.join(HERE, "pair-manifest.json")))
W, H = M["width"], M["height"]
A = {int(k): v for k, v in M["phases"]["A_coil"].items()}
B = {int(k): v for k, v in M["phases"]["B_leap"].items()}
LIMBS = json.load(open(os.path.join(HERE, "passes", "A_coil_keypoints.json")))["limbs"]
flow = np.load(os.path.join(HERE, "flow_latent.npy"))
N_A = np.load(os.path.join(HERE, "N_A.npy")).astype(np.float32)
rng = np.random.default_rng(20260619)
step_flow = (flow / (NFRAMES - 1)).astype(np.float32)   # per-increment latent flow

def draw_pose(kp, path):
    img = Image.new("RGB", (W, H), (0, 0, 0)); dr = ImageDraw.Draw(img)
    for idx, (a, b) in enumerate(LIMBS):
        if kp[a][2] > 0.4 and kp[b][2] > 0.4:
            dr.line([kp[a][0], kp[a][1], kp[b][0], kp[b][1]], fill=COLORS[idx % 18], width=8)
    for i, (x, y, c) in kp.items():
        if c > 0.4: dr.ellipse([x-6, y-6, x+6, y+6], fill=COLORS[i % 18])
    img.save(path)

OUT = os.path.join(HERE, "seq"); os.makedirs(OUT, exist_ok=True)
N_prev = N_A; frames = []
for i, t in enumerate(TS):
    kp = {j: [A[j][0] + t*(B[j][0]-A[j][0]), A[j][1] + t*(B[j][1]-A[j][1]), 1.0] for j in A}
    pose_png = f"seq/pose_s{i}.png"; draw_pose(kp, os.path.join(HERE, pose_png))
    if i == 0:
        warp_rel = "N_A.npy"; ac = lag1_autocorr(N_A); frac = 1.0
    else:
        N_cur, frac = warp_noise_white(N_prev, step_flow[..., 0], step_flow[..., 1], rng, mode="nearest")
        warp_rel = f"seq/N_chain_s{i}.npy"; np.save(os.path.join(HERE, warp_rel), N_cur)
        ac = lag1_autocorr(N_cur); N_prev = N_cur
    print(f"  s{i} t={t:.1f} | warp-filled {frac*100:3.0f}% | whiteness(lag1) {ac:+.3f} | "
          f"chain-diff-from-N_A {np.abs(N_A - (N_A if i==0 else N_cur)).mean():.3f}")
    frames.append({"i": i, "t": round(t, 2), "pose_png": pose_png,
                   "seedlock_noise": "N_A.npy", "warped_noise": warp_rel})

json.dump({"nframes": NFRAMES, "frames": frames}, open(os.path.join(OUT, "seq-manifest.json"), "w"), indent=2)
print(f"wrote seq/seq-manifest.json ({NFRAMES} frames)")
print("SEQ_PREP_DONE")
