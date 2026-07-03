#!/usr/bin/env python3
"""
BLUELINE · Track VI — LAYERS: content-aware extraction + keying for the 2.5D paper stack.

The unlock (Loudon): in high-contrast ink, an object's edge *rides a black line*. So the
matte is latent in the drawing — the right cut is a HARD cut snapped to the silhouette, not
a soft feather. A sharp cut hidden inside a black stroke is invisible (black meets black).
These helpers turn a region into a sheet with sharp alpha; the compositor (stack.py) stacks
and animates the sheets, and occlusion — not feathering — hides every seam.
"""
import numpy as np
from PIL import Image
from scipy.ndimage import (label, binary_closing, binary_opening, binary_fill_holes,
                           binary_dilation, gaussian_filter)


def load_rgb(p):
    return np.asarray(Image.open(p).convert("RGB"), np.float32) / 255.0


def lum(rgb):
    return rgb.mean(2)


def solid_silhouette(rgb, dark=0.45, density_sigma=16, density_thresh=0.5,
                     min_frac=0.02, touch="bottom", dilate=2, **_legacy):
    """Extract a solid *filled* occluding shape (a hill, a foreground mass) as a sharp matte.

    Key idea for ink: a luminance threshold can't tell a filled hill from cloud LINEWORK —
    both are 'dark'. But a filled mass is *densely* dark; linework is sparse. So threshold the
    LOCAL DARK DENSITY (blurred dark fraction), not raw darkness. The hill survives; the clouds'
    thin outlines drop out. The 0.5 density contour lands on the silhouette — itself a black
    line — so the cut stays hidden. Dilate so the front fully covers the back under the edge."""
    L = lum(rgb)
    darkpx = (L < dark).astype(np.float32)
    density = gaussian_filter(darkpx, density_sigma)        # local fraction-dark
    m = binary_fill_holes(density > density_thresh)
    lab, n = label(m)
    H, W = L.shape
    best, bestA = None, 0
    for i in range(1, n + 1):
        comp = lab == i
        A = int(comp.sum())
        if A < min_frac * H * W:
            continue
        if touch == "bottom" and not comp[H - 1, :].any():
            continue
        if touch == "top" and not comp[0, :].any():
            continue
        if A > bestA:
            bestA, best = A, comp
    m = best if best is not None else m
    if dilate:
        m = binary_dilation(m, iterations=dilate)
    return m.astype(np.float32)


def key_white(rgb, white=0.88, gamma=1.0):
    """Alpha from inked-on-white: white paper -> transparent, ink -> opaque. For mid sheets
    (clouds, a figure) that must let the sheet behind show through their white gaps."""
    a = np.clip((1.0 - lum(rgb)) / (1.0 - white + 1e-6), 0, 1) ** gamma
    return a.astype(np.float32)


def sharpen_alpha(a, px=0.8):
    """Anti-alias only — a single-pixel soften so the hard cut isn't jagged. NOT the band
    blur that smeared motion across boundaries; this keeps the edge a knife."""
    return np.clip(gaussian_filter(a, px), 0, 1).astype(np.float32) if px else a


def rgba(rgb, alpha):
    return np.dstack([np.clip(rgb, 0, 1), np.clip(alpha, 0, 1)]).astype(np.float32)


def save_rgba(arr, path):
    Image.fromarray((np.clip(arr, 0, 1) * 255).astype(np.uint8), "RGBA").save(path)


def alpha_preview(arr, bg=(0.80, 0.55, 0.95)):
    """Composite an RGBA sheet over a colored field so the matte/cut is legible in a still."""
    rgb, a = arr[..., :3], arr[..., 3:4]
    base = np.ones_like(rgb) * np.array(bg, np.float32)
    return rgb * a + base * (1 - a)
