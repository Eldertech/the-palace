#!/usr/bin/env python3
"""
BLUELINE M3.5 — the WHITENESS-PRESERVING noise warp (the fix for M3's rainbow collapse).

M3 used a backward-warp + global renormalize. That fixes mean/std but NOT spatial whiteness: in
expansion/disocclusion regions a backward warp pulls many destination cells from the SAME few sources →
correlated blocks → the diffusion sampler renders them as rainbow striping (verified on SDXL and FLUX).

This is the HIWYN / Go-with-the-Flow core, done right:
  • FORWARD-SPLAT the white noise along the A->B flow (each source cell lands at source + flow), with
    bilinear weights into the 4 nearest destination cells.
  • Normalize each destination by the L2 norm of its weights — out[d] = (Σ w·z) / sqrt(Σ w²) — NOT the
    L1 sum. Σ w·z of independent unit Gaussians has variance Σ w², so /sqrt(Σ w²) gives EXACTLY unit
    variance per cell (this is the whiteness-preservation trick; an L1/bilinear average shrinks and
    correlates variance, which the global renorm can't undo).
  • Fill DISOCCLUSION HOLES (destination cells no source landed in — the expansion case) with FRESH
    i.i.d. N(0,1). Stretching one source over a hole is what creates correlation; fresh noise stays white.

Result: a noise field that has MOVED with the motion yet stays ~white, so the diffusion prior holds.

Run (comfy venv): <venv>/python warp_noise_gtf.py
Outputs: N_warped_gtf.npy (16x152x104 FLUX), N_warped_gtf_sdxl.npy (4x152x104), + whiteness diagnostics.
"""
import os
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))


def warp_noise_white(z, fu, fv, rng, mode="nearest", hole_floor=0.25):
    """Forward-splat (C,H,W) white noise along per-cell displacement (fu,fv) [destination = source+flow,
    in cell units], L2-normalize per destination, fill holes with fresh noise. Returns (C,H,W) ~N(0,1).

    mode="nearest": each source lands in ONE dest cell (weight 1). Adjacent dest cells share no source,
        so the field stays whitest (best against the rainbow). Contraction: k sources in a cell -> sum/√k.
    mode="bilinear": each source spreads to its 4 dest neighbours. Smoother coverage, but neighbours share
        sources -> some residual correlation."""
    C, H, W = z.shape
    acc = np.zeros((C, H * W), np.float64)
    wsq = np.zeros(H * W, np.float64)            # Σ w²  → variance of the accumulated sum
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float64)
    dx = xs + fu                                 # where each source cell lands in the destination
    dy = ys + fv
    zf = z.reshape(C, -1)
    if mode == "nearest":
        offsets = [(0, 0)]
        xr = np.round(dx).astype(np.int64); yr = np.round(dy).astype(np.int64)
        def wof(ox, oy): return np.ones_like(dx)
        x0, y0 = xr, yr; fx = fy = None
    else:
        offsets = [(0, 0), (1, 0), (0, 1), (1, 1)]
        x0 = np.floor(dx).astype(np.int64); y0 = np.floor(dy).astype(np.int64)
        fx = dx - x0; fy = dy - y0
        def wof(ox, oy): return (fx if ox else 1 - fx) * (fy if oy else 1 - fy)
    for ox, oy in offsets:
        xx = x0 + ox; yy = y0 + oy
        w = wof(ox, oy)
        m = (xx >= 0) & (xx < W) & (yy >= 0) & (yy < H) & (w > 0)
        didx = (yy * W + xx)[m]
        wv = w[m]
        np.add.at(wsq, didx, wv * wv)
        sel = m.reshape(-1)
        for c in range(C):
            np.add.at(acc[c], didx, wv * zf[c][sel])
    out = np.zeros((C, H * W), np.float64)
    filled = wsq >= hole_floor                    # enough weight to L2-normalize without amplifying noise
    inv = np.zeros(H * W); inv[filled] = 1.0 / np.sqrt(wsq[filled])
    fresh = rng.standard_normal((C, H * W))
    for c in range(C):
        out[c] = np.where(filled, acc[c] * inv, fresh[c])
    return out.reshape(C, H, W).astype(np.float32), float(filled.mean())


def lag1_autocorr(z):
    """Mean lag-1 spatial autocorrelation (H and W), averaged over channels. White ≈ 0; smooth → high."""
    z = (z - z.mean()) / (z.std() + 1e-9)
    h = np.mean(z[:, :, :-1] * z[:, :, 1:])
    v = np.mean(z[:, :-1, :] * z[:, 1:, :])
    return float((h + v) / 2)


def main():
    fl = np.load(os.path.join(HERE, "flow_latent.npy"))     # (H,W,2) A->B latent-cell displacement
    fu, fv = fl[..., 0], fl[..., 1]
    rng = np.random.default_rng(20260619)                   # fresh-fill seed (fixed → reproducible)

    for tag, src, dst in [("FLUX 16ch", "N_A.npy", "N_warped_gtf.npy"),
                          ("SDXL  4ch", "N_A_sdxl.npy", "N_warped_gtf_sdxl.npy")]:
        N_A = np.load(os.path.join(HERE, src)).astype(np.float32)
        N_near, frac = warp_noise_white(N_A, fu, fv, rng, mode="nearest")
        N_bilin, _ = warp_noise_white(N_A, fu, fv, rng, mode="bilinear")
        np.save(os.path.join(HERE, dst), N_near)            # ship the whitest (nearest)
        naive_name = "N_warped.npy" if "16" in tag else "N_warped_sdxl.npy"
        naive = np.load(os.path.join(HERE, naive_name)).astype(np.float32)
        print(f"== {tag} ==")
        print(f"  N_gtf(nearest)  mean {N_near.mean():+.3f} std {N_near.std():.3f}  | warp-filled {frac*100:.0f}% (rest fresh)")
        print(f"  whiteness (lag-1 autocorr, want ~0):  base {lag1_autocorr(N_A):+.3f} | "
              f"naive {lag1_autocorr(naive):+.3f} | GTF-bilinear {lag1_autocorr(N_bilin):+.3f} | "
              f"GTF-nearest {lag1_autocorr(N_near):+.3f}")
        print(f"  differs from N_A by {np.abs(N_A-N_near).mean():.3f} mean-abs (the warp moved the noise)")
        print(f"  wrote {dst}")
    print("WARP_GTF_DONE")


if __name__ == "__main__":
    main()
