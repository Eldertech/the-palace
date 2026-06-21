#!/usr/bin/env python3
"""
BLUELINE M4 — score the comic <-> hyperreal pair. The M4 milestone risk is "identity across the style jump":
does the same board, rendered in the comic register and the hyperreal register (same pose + same noise N_A,
two style prompts), read as the SAME character/scene? Here with NO identity model — so this is the BASELINE
that Track II's PuLID/FaceID must beat, not the finished answer.

Run (comfy venv): python3 m4_score.py
Outputs: renders-m4/m4-pairs.png (2x2 montage), m4-verdict.json.
"""
import os, sys, json
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "render-backend"))
import consistency_ruler as R
HERE = os.path.dirname(os.path.abspath(__file__)); RD = os.path.join(HERE, "renders-m4")

rows = []
print("=== M4 — identity across the comic<->hyperreal style jump (no identity model = baseline) ===")
for board in ["A", "B"]:
    hy = os.path.join(RD, f"{board}_hyper.png"); co = os.path.join(RD, f"{board}_comic.png")
    if not (os.path.isfile(hy) and os.path.isfile(co)): sys.exit(f"missing {board} pair")
    e, c = R.score(hy, co)
    rows.append({"board": board, "embed_cos": e, "color_corr": c})
    print(f"  board {board}: comic vs hyper  embed_cos {e:.3f} | color_corr {c:+.3f}")
mean_e = sum(r["embed_cos"] for r in rows) / len(rows)
verdict = (f"identity largely survives the style jump (mean embed {mean_e:.3f})" if mean_e >= 0.6
           else f"identity does NOT survive the style jump without an identity model (mean embed {mean_e:.3f}) "
                f"-> Track II PuLID/FaceID needed")
print(f"\nVERDICT: {verdict}  (Track II target: identity-drift cosine >= 0.6)")

# 2x2 montage: rows = boards, cols = hyper | comic
tw = 300; th = int(tw*1216/832); pad = 24
m = Image.new("RGB", (tw*2, (th+pad)*2), (12, 13, 16)); dr = ImageDraw.Draw(m)
for r, board in enumerate(["A", "B"]):
    for cc, reg in enumerate(["hyper", "comic"]):
        im = Image.open(os.path.join(RD, f"{board}_{reg}.png")).convert("RGB").resize((tw, th))
        y = r*(th+pad)+pad; m.paste(im, (cc*tw, y))
        dr.text((cc*tw+4, y-15), f"board {board} — {reg}", fill=(224,168,58) if reg=="comic" else (91,200,214))
    dr.text((4, r*(th+pad)+pad+th-16), f"comic<->hyper embed {rows[r]['embed_cos']:.3f}", fill=(230,230,230))
m.save(os.path.join(RD, "m4-pairs.png"))
json.dump({"pairs": rows, "mean_embed_cos": mean_e, "verdict": verdict}, open(os.path.join(RD, "m4-verdict.json"), "w"), indent=2)
print("WROTE m4-pairs.png + m4-verdict.json")
print("M4_SCORE_DONE")
