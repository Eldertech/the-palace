#!/usr/bin/env python3
"""
BLUELINE M3 — the verdict. Score (A, B-seedlock) vs (A, B-warped) with the consistency ruler and decide:
does flow-warped noise hold the look better than seed-lock at the 482 px delta where seed-lock should break?

Higher embed_cos (CNN-semantic, pose-invariant) / color_corr (HSV palette) = more consistent with A.
The bet wins if B-warped scores HIGHER than B-seedlock against A — i.e. the warp carried the look across.

Run (comfy venv): python3 m3_score.py [renders_dir]   (default: renders/)
Also builds m3-compare.png (A | B-seedlock | B-warped) and writes m3-verdict.json.
"""
import os, sys, json
import numpy as np
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "render-backend"))
import consistency_ruler as R

HERE = os.path.dirname(os.path.abspath(__file__))
RD = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "renders")
A   = os.path.join(RD, "A.png")
BS  = os.path.join(RD, "B_seedlock.png")
BW  = os.path.join(RD, "B_warped.png")
for p in (A, BS, BW):
    if not os.path.isfile(p): sys.exit(f"missing render: {p}")

e_s, c_s = R.score(A, BS)     # A vs B-seedlock
e_w, c_w = R.score(A, BW)     # A vs B-warped
d_embed = e_w - e_s
d_color = c_w - c_s
warped_wins = (e_w > e_s)     # primary metric = embed_cos (semantic, pose-invariant)

print("=== M3 — flow-warped noise vs seed-lock @ 482 px pose delta ===")
print(f"{'pair':<26}{'embed_cos':>11}{'color_corr':>12}")
print(f"{'A vs B-seedlock':<26}{e_s:>11.3f}{c_s:>12.3f}")
print(f"{'A vs B-warped':<26}{e_w:>11.3f}{c_w:>12.3f}")
print(f"{'delta (warped-seedlock)':<26}{d_embed:>+11.3f}{d_color:>+12.3f}")
print(f"\nVERDICT: {'WARPED HOLDS the look better than seed-lock' if warped_wins else 'seed-lock >= warped (warp did not beat it)'} "
      f"(embed_cos {e_w:.3f} vs {e_s:.3f})")

# comparison sheet
labels = [("A (coil) — anchor", A), ("B (leap) · seed-lock", BS), ("B (leap) · warped", BW)]
ims = [Image.open(p).convert("RGB") for _, p in labels]
pw = 360; ph = int(pw * ims[0].height / ims[0].width); GAP, TOP = 12, 30
sheet = Image.new("RGB", (pw*3 + GAP*2, ph + TOP), (12, 13, 16)); dr = ImageDraw.Draw(sheet)
caps = [f"embed {e_s:.2f}", f"embed {e_w:.2f}"]
for i, (lab, _) in enumerate(labels):
    x = i*(pw+GAP); sheet.paste(ims[i].resize((pw, ph)), (x, TOP))
    dr.text((x+4, 8), lab, fill=(224, 168, 58))
    if i >= 1: dr.text((x+4, TOP+6), caps[i-1], fill=(230, 230, 230))
sheet.save(os.path.join(RD, "m3-compare.png"))

json.dump({
    "delta_px": 482,
    "A_vs_B_seedlock": {"embed_cos": e_s, "color_corr": c_s},
    "A_vs_B_warped":   {"embed_cos": e_w, "color_corr": c_w},
    "delta_warped_minus_seedlock": {"embed_cos": d_embed, "color_corr": d_color},
    "warped_wins": bool(warped_wins),
}, open(os.path.join(RD, "m3-verdict.json"), "w"), indent=2)
print("WROTE m3-compare.png + m3-verdict.json")
print("M3_SCORE_DONE")
