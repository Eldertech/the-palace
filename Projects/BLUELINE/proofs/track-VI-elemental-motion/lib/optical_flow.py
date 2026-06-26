#!/usr/bin/env python3
"""
Block-matching optical flow — pure numpy/scipy, no OpenCV.

Divides each frame into a grid of blocks and finds the best-matching block
in the next frame within a search window using normalized cross-correlation
(NCC). Then bilinearly interpolates a dense (H, W) flow field from the
sparse block-center estimates.

Why block-matching over Horn-Schunck here:
  - H-S is a global regularizer — it underestimates large displacements badly
    on smooth, low-texture regions (exactly what sim density frames look like).
  - Block NCC finds the actual dominant displacement per spatial region, giving
    physically meaningful flow even with coarse blocks at low resolution.
  - Runs fast at 56-res sim output; grid of 8x8 blocks ~ 49 samples total.

The output is intentionally dense but not sharp — after bilinear interpolation
it reads as a slowly-varying field, which is exactly what the warp engine wants.
"""
import numpy as np
from scipy.ndimage import gaussian_filter, zoom


# ─── normalised cross-correlation ────────────────────────────────────────────

def _ncc(patch, region):
    """Normalised cross-correlation of patch against every (block-shaped) position
    in region. Returns a correlation map of shape (search_h, search_w)."""
    ph, pw = patch.shape
    sh, sw = region.shape[0] - ph + 1, region.shape[1] - pw + 1
    if sh <= 0 or sw <= 0:
        return np.zeros((1, 1))
    pm = patch.mean(); ps = patch.std() + 1e-8
    p = (patch - pm) / ps
    out = np.zeros((sh, sw), np.float32)
    for r in range(sh):
        for c in range(sw):
            w = region[r:r+ph, c:c+pw]
            wm = w.mean(); ws = w.std() + 1e-8
            out[r, c] = np.sum(p * (w - wm) / ws) / (ph * pw)
    return out


# ─── block-matching flow ──────────────────────────────────────────────────────

def block_flow(im1, im2, block_size=8, search_radius=6, sigma_out=2.0):
    """
    Compute dense (H, W) flow from im1 → im2 via block matching.

    block_size    : side of each block in pixels. Smaller = more spatial detail
                    but slower and noisier. 8 works well for 56-res frames.
    search_radius : max displacement per axis in pixels to search.
    sigma_out     : smooth the final dense field with this Gaussian sigma.

    Returns (u, v) float32 arrays of shape (H, W).
    u = horizontal displacement (positive = right)
    v = vertical displacement   (positive = down)
    """
    H, W = im1.shape
    b = block_size; r = search_radius
    pad = r + b
    # pad images so border blocks have a full search region
    p1 = np.pad(im1, pad, mode="reflect")
    p2 = np.pad(im2, pad, mode="reflect")

    # grid of block centres in original coords
    step = b  # non-overlapping blocks
    ys = np.arange(b // 2, H, step)
    xs = np.arange(b // 2, W, step)

    pts_y, pts_x, pts_u, pts_v = [], [], [], []

    for cy in ys:
        for cx in xs:
            # extract patch from im1 (in padded coords)
            py0, px0 = cy + pad - b // 2, cx + pad - b // 2
            patch = p1[py0:py0+b, px0:px0+b]
            # search region in im2: centred at same location ± search_radius
            sy0 = py0 - r; sx0 = px0 - r
            region = p2[sy0:sy0+b+2*r, sx0:sx0+b+2*r]
            corr = _ncc(patch, region)
            best = np.unravel_index(corr.argmax(), corr.shape)
            # displacement: best offset from centre of search window
            dv = best[0] - r  # row offset = v (positive = down)
            du = best[1] - r  # col offset = u (positive = right)
            pts_y.append(cy); pts_x.append(cx)
            pts_u.append(du); pts_v.append(dv)

    # scatter sparse block estimates to dense grid by interpolation
    pts_y = np.array(pts_y, np.float32)
    pts_x = np.array(pts_x, np.float32)
    pts_u = np.array(pts_u, np.float32)
    pts_v = np.array(pts_v, np.float32)

    # build a coarse grid and bilinear-interpolate to full res
    gy = np.array(sorted(set(pts_y)))
    gx = np.array(sorted(set(pts_x)))
    nu = np.zeros((len(gy), len(gx)), np.float32)
    nv = np.zeros_like(nu)
    for k in range(len(pts_y)):
        ri = np.where(gy == pts_y[k])[0][0]
        ci = np.where(gx == pts_x[k])[0][0]
        nu[ri, ci] = pts_u[k]
        nv[ri, ci] = pts_v[k]

    zy = H / len(gy)
    zx = W / len(gx)
    u = zoom(nu, (zy, zx), order=1)[:H, :W]
    v = zoom(nv, (zy, zx), order=1)[:H, :W]

    if sigma_out > 0:
        u = gaussian_filter(u, sigma_out)
        v = gaussian_filter(v, sigma_out)

    return u.astype(np.float32), v.astype(np.float32)


# ─── batch flow over a frame sequence ────────────────────────────────────────

def frames_to_flow(frame_paths, block_size=8, search_radius=6, sigma=1.0,
                   sigma_out=2.0, target_hw=None):
    """
    Given a sorted list of grayscale frame paths, compute per-frame 2D flow.

    Returns float32 array of shape (T, H, W, 2) where [..., 0]=u (vx), [..., 1]=v (vy).
    The last frame wraps back to the first (for seamless use).

    target_hw : if given, resize flow to this (H, W) — to match the plate size.
    """
    from PIL import Image
    frames = []
    for p in frame_paths:
        im = np.asarray(Image.open(p).convert("L"), np.float32) / 255.0
        if sigma > 0:
            im = gaussian_filter(im, sigma)
        frames.append(im)

    T = len(frames)
    H, W = frames[0].shape
    flows = np.zeros((T, H, W, 2), np.float32)

    for i in range(T):
        im1 = frames[i]
        im2 = frames[(i + 1) % T]
        u, v = block_flow(im1, im2, block_size=block_size,
                          search_radius=search_radius, sigma_out=sigma_out)
        flows[i, :, :, 0] = u
        flows[i, :, :, 1] = v
        if (i + 1) % 10 == 0:
            print(f"  block_flow: {i+1}/{T} frames done", flush=True)

    if target_hw is not None and (H, W) != tuple(target_hw):
        th, tw = target_hw
        zy, zx = th / H, tw / W
        out = np.zeros((T, th, tw, 2), np.float32)
        for i in range(T):
            out[i, :, :, 0] = zoom(flows[i, :, :, 0], (zy, zx), order=1) * zx
            out[i, :, :, 1] = zoom(flows[i, :, :, 1], (zy, zx), order=1) * zy
        flows = out

    return flows


if __name__ == "__main__":
    import numpy as np
    H, W = 64, 64
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    # Blob shifted 4px right between frames
    im1 = np.clip(1.0 - ((xx-20)**2 + (yy-32)**2)/80, 0, 1)
    im2 = np.clip(1.0 - ((xx-24)**2 + (yy-32)**2)/80, 0, 1)
    u, v = block_flow(im1, im2, block_size=8, search_radius=8)
    region_u = u[28:36, 16:28].mean()
    region_v = v[28:36, 16:28].mean()
    print(f"Self-test: mean u in blob region = {region_u:.1f}  (expect ~4.0)")
    print(f"           mean v in blob region = {region_v:.1f}  (expect ~0.0)")
