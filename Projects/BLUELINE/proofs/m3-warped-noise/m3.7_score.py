#!/usr/bin/env python3
"""
BLUELINE M3.7 — score the cumulative sequence. Temporal coherence = consistency between ADJACENT frames
(the thing a fixed-noise seed-lock can't give and a per-step warp might). For each condition build the
6-frame sequence [A, s1..s5], measure mean adjacent embed_cos/color_corr, and the drift-from-frame0 curve.
Also emit a 2-row filmstrip and a GIF per condition for the eyeball test (smoothness is judged by eye).

Run (comfy venv): python3 m3.7_score.py
Outputs: renders-seq/m3.7-filmstrip.png, seedlock.gif, warped.gif, m3.7-verdict.json.
"""
import os, sys, json
import numpy as np
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "render-backend"))
import consistency_ruler as R
HERE = os.path.dirname(os.path.abspath(__file__)); RD = os.path.join(HERE, "renders-seq")

seq = json.load(open(os.path.join(HERE, "seq", "seq-manifest.json")))["frames"]
N = len(seq)
paths = {"seedlock": [os.path.join(RD, "A.png")] + [os.path.join(RD, f"B_s{f['i']}_seedlock.png") for f in seq[1:]],
         "warped":   [os.path.join(RD, "A.png")] + [os.path.join(RD, f"B_s{f['i']}_warped.png")   for f in seq[1:]]}
for cond, ps in paths.items():
    for p in ps:
        if not os.path.isfile(p): sys.exit(f"missing {p}")

out = {"adjacent": {}, "drift_from_s0": {}}
print("=== M3.7 — cumulative sequence (coil->leap), seed-lock vs per-step warped chain ===")
for cond, ps in paths.items():
    adj = [R.score(ps[i], ps[i+1]) for i in range(N-1)]      # consecutive-frame consistency
    drift = [R.score(ps[0], ps[i]) for i in range(N)]        # vs the start
    ae = float(np.mean([e for e, c in adj])); ac = float(np.mean([c for e, c in adj]))
    out["adjacent"][cond] = {"embed_cos_mean": ae, "color_corr_mean": ac,
                             "per_pair_embed": [round(e, 3) for e, c in adj]}
    out["drift_from_s0"][cond] = {"embed_cos": [round(e, 3) for e, c in drift]}
    print(f"  {cond:9s} adjacent embed {ae:.3f} | adjacent color {ac:+.3f} | "
          f"per-pair embed {[round(e,3) for e,c in adj]}")
de = out["adjacent"]["warped"]["embed_cos_mean"] - out["adjacent"]["seedlock"]["embed_cos_mean"]
dc = out["adjacent"]["warped"]["color_corr_mean"] - out["adjacent"]["seedlock"]["color_corr_mean"]
verdict = (f"warped chain SMOOTHER than seed-lock (adjacent embed {de:+.3f}, color {dc:+.3f})" if de > 0.01
           else f"warped chain NOT smoother than seed-lock (adjacent embed {de:+.3f}, color {dc:+.3f})")
print(f"\nVERDICT: {verdict}")

# filmstrip (2 rows: seedlock / warped) + per-condition GIF
tw = 200; th = int(tw * 1216 / 832); pad = 26
strip = Image.new("RGB", (tw*N, (th+pad)*2 + 10), (12, 13, 16)); dr = ImageDraw.Draw(strip)
for r, cond in enumerate(["seedlock", "warped"]):
    thumbs = []
    for i, p in enumerate(paths[cond]):
        im = Image.open(p).convert("RGB").resize((tw, th))
        thumbs.append(im.resize((320, int(320*1216/832))))
        y = r*(th+pad) + pad
        strip.paste(im, (i*tw, y))
        dr.text((i*tw+4, y-15), f"{cond[:4]} s{i}", fill=(224, 168, 58) if cond=="warped" else (91, 200, 214))
    thumbs[0].save(os.path.join(RD, f"{cond}.gif"), save_all=True, append_images=thumbs[1:],
                   duration=350, loop=0)
strip.save(os.path.join(RD, "m3.7-filmstrip.png"))
out["verdict"] = verdict
json.dump(out, open(os.path.join(RD, "m3.7-verdict.json"), "w"), indent=2)
print("WROTE m3.7-filmstrip.png + seedlock.gif + warped.gif + m3.7-verdict.json")
print("M37_SCORE_DONE")
