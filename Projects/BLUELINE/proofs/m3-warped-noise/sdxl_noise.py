#!/usr/bin/env python3
"""
BLUELINE M3 — local SDXL mechanism check: make a 4-channel SDXL latent noise (seed 777) and its
A->B flow-warp, reusing the SAME flow_latent.npy + warp+renorm as warp_demo.py (the FLUX path).
SDXL latent is (4, H/8, W/8) == (4, 152, 104), the same spatial grid as the 16-ch FLUX latent.
Emits N_A_sdxl.npy / N_warped_sdxl.npy for the NoiseFromNPY inject check. No pod, free.
"""
import os, numpy as np
from scipy.ndimage import map_coordinates
HERE = os.path.dirname(os.path.abspath(__file__))
fl = np.load(os.path.join(HERE, "flow_latent.npy"))          # (152,104,2) latent-cell disp A->B
LH, LW = fl.shape[0], fl.shape[1]; u, v = fl[..., 0], fl[..., 1]

def warp_renorm(arr, u, v, t=1.0):
    yy, xx = np.mgrid[0:arr.shape[-2], 0:arr.shape[-1]].astype(np.float32)
    sy, sx = yy + t * v, xx + t * u
    out = np.stack([map_coordinates(arr[c], [sy, sx], order=1, mode="reflect") for c in range(arr.shape[0])])
    return (out - out.mean()) / (out.std() + 1e-6)

rng = np.random.default_rng(777)                              # same anchor seed as warp_demo
N_A = rng.standard_normal((4, LH, LW)).astype(np.float32)     # SDXL 4-ch
N_warped = warp_renorm(N_A, u, v, 1.0).astype(np.float32)
np.save(os.path.join(HERE, "N_A_sdxl.npy"), N_A)
np.save(os.path.join(HERE, "N_warped_sdxl.npy"), N_warped)
print(f"N_A_sdxl   shape {N_A.shape} mean {N_A.mean():+.3f} std {N_A.std():.3f}")
print(f"N_warped_sdxl mean {N_warped.mean():+.3f} std {N_warped.std():.3f}")
print(f"differ: {np.abs(N_A-N_warped).mean():.3f} mean-abs (the warp moved the noise)")
print("SDXL_NOISE_DONE")
