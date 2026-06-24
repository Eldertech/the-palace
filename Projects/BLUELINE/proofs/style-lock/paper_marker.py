#!/usr/bin/env python3
"""
BLUELINE · STYLE-LOCK — the DETERMINISTIC SUBSTRATE LOCK. The model draws the line/value; THIS owns the
paper + marker tone, applied identically to every image — so the substrate reads the same across all
characters by construction (the surest consistency lever short of a LoRA).

Pipeline (pure numpy/PIL, deterministic given paper_seed):
  1. luminance -> auto-levels (percentile stretch)
  2. quantize ink density to a limited marker palette {white paper, light dry-grey, mid-grey, ink-black}
  3. procedural cold-press paper tooth (fractal value noise) BREAKS ink on the peaks (dry-brush skip)
     and lays a faint warm grain into the white — the same paper on every frame.

  from paper_marker import stylize ; stylize("in.png","out.png")
  or: python paper_marker.py in1.png in2.png ...   (writes *_marker.png alongside)
"""
import sys, os
import numpy as np
from PIL import Image

PALETTE = np.array([248, 196, 120, 28], np.float32)      # white paper · light dry-grey · mid-grey · ink
PAPER_SEED = 7                                            # fixed -> identical paper substrate everywhere

def paper_field(h, w, seed=PAPER_SEED):
    rng = np.random.default_rng(seed)
    acc = np.zeros((h, w), np.float32); amp, tot = 1.0, 0.0
    for cell in (96, 48, 24, 12, 6):                      # octaves: big cells = low freq, small = grain
        gh, gw = h // cell + 2, w // cell + 2
        small = (rng.random((gh, gw)) * 255).astype(np.uint8)
        up = np.asarray(Image.fromarray(small).resize((w, h), Image.BICUBIC), np.float32) / 255.0
        acc += up * amp; tot += amp; amp *= 0.55
    f = acc / tot
    return (f - f.min()) / (f.max() - f.min() + 1e-9)

def stylize(src, dst=None, break_strength=0.55, grain=10.0):
    im = Image.open(src).convert("L")
    g = np.asarray(im, np.float32) / 255.0
    lo, hi = np.percentile(g, 4), np.percentile(g, 96)    # auto-levels
    g = np.clip((g - lo) / (hi - lo + 1e-6), 0, 1)
    ink = 1.0 - g                                         # ink density (1 = darkest)
    pf = paper_field(*g.shape)
    # dry-brush: where paper tooth is high, ink skips (mid densities lighten; solid blacks mostly survive)
    skip = break_strength * np.clip(pf - 0.45, 0, 1) * (1.0 - np.clip(ink - 0.75, 0, 1) / 0.25)
    ink = np.clip(ink - skip, 0, 1)
    # quantize ink density -> palette index (0 white .. 3 ink) with soft thresholds
    idx = np.zeros_like(ink, np.int32)
    idx[ink > 0.18] = 1; idx[ink > 0.42] = 2; idx[ink > 0.70] = 3
    out = PALETTE[idx]
    # faint warm paper grain in the lightest areas (so white isn't dead-flat)
    white_mask = (idx == 0).astype(np.float32)
    out = out - white_mask * (pf - 0.5) * grain
    out = np.clip(out, 0, 255).astype(np.uint8)
    dst = dst or os.path.splitext(src)[0] + "_marker.png"
    Image.fromarray(out, "L").save(dst)
    return dst

if __name__ == "__main__":
    for p in sys.argv[1:]:
        print("marker ->", stylize(p))
