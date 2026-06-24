#!/usr/bin/env python3
"""
BLUELINE · STYLE-LOCK — the OUTLIER-TOSSER. A content-independent STYLE descriptor so "toss the outliers"
is measured, not vibes. Per image:
  • tone histogram (12 bins)         — value distribution (how much black / grey / white)
  • ink coverage (1)                 — fraction of dark pixels
  • gradient-magnitude histogram (8) — line density / weight character
  • high-frequency energy (1)        — paper grain / detail level (FFT high-band ratio)
The descriptor is ~content-blind (it does not encode WHO is drawn, only HOW). Each image's style-consistency
score = cosine to the batch's median descriptor; outliers = score below median - k*MAD. Builds a contact
sheet sorted by score, outliers dimmed + X'd, so the keepers are obvious.

Run (comfy venv): python3 style_score.py            # scores runs/, writes style-grid.png + style-verdict.json
"""
import os, json, glob
import numpy as np
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
RUNS = os.path.join(HERE, "runs")

def descriptor(path):
    g = np.asarray(Image.open(path).convert("L").resize((256, 256)), np.float32) / 255.0
    tone, _ = np.histogram(g, bins=12, range=(0, 1), density=True)
    ink = float((g < 0.35).mean())
    gx = np.abs(np.diff(g, axis=1)); gy = np.abs(np.diff(g, axis=0))
    gm = np.sqrt(gx[:-1, :] ** 2 + gy[:, :-1] ** 2)
    grad, _ = np.histogram(gm, bins=8, range=(0, 1), density=True)
    F = np.abs(np.fft.fftshift(np.fft.fft2(g - g.mean())))
    yy, xx = np.mgrid[0:256, 0:256]; r = np.hypot(yy - 128, xx - 128)
    hf = float(F[r > 64].sum() / (F.sum() + 1e-9))        # high-frequency energy ratio (grain/detail)
    # block-normalize so no single block dominates the cosine
    blocks = [tone / (np.linalg.norm(tone) + 1e-9), np.array([ink]),
              grad / (np.linalg.norm(grad) + 1e-9), np.array([hf])]
    return np.concatenate(blocks).astype(np.float32)

def main():
    files = sorted(f for f in glob.glob(os.path.join(RUNS, "*.png")) if "_marker" not in f)
    if not files:
        raise SystemExit("no runs/*.png yet — run style_explore.py --grid first")
    D = np.stack([descriptor(f) for f in files])
    med = np.median(D, axis=0)
    cos = (D @ med) / (np.linalg.norm(D, axis=1) * np.linalg.norm(med) + 1e-9)
    mad = np.median(np.abs(cos - np.median(cos))) + 1e-9
    thresh = float(np.median(cos) - 1.5 * mad)            # outlier = >1.5 MAD below median consistency
    rows = []
    order = np.argsort(-cos)
    print("=== STYLE-LOCK · consistency to the batch's style centroid (1.0 = dead-on) ===")
    for i in order:
        keep = cos[i] >= thresh
        rows.append({"file": os.path.relpath(files[i], HERE), "score": round(float(cos[i]), 4), "keep": bool(keep)})
        print(f"  {'keep ' if keep else 'TOSS '} {cos[i]:.3f}  {os.path.basename(files[i])}")
    kept = [r for r in rows if r["keep"]]
    print(f"\nkept {len(kept)}/{len(rows)} · tossed {len(rows)-len(kept)} · "
          f"spread (min..max) {cos.min():.3f}..{cos.max():.3f} · threshold {thresh:.3f}")

    # contact sheet, sorted best->worst, outliers dimmed + crossed
    cols = 5; tw = 220; th = int(tw * 1216 / 832); pad = 20
    rowsN = (len(files) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * tw, rowsN * (th + pad) + 8), (12, 13, 16)); dr = ImageDraw.Draw(sheet)
    for n, i in enumerate(order):
        im = Image.open(files[i]).convert("RGB").resize((tw, th))
        r, c = divmod(n, cols); x, y = c * tw, r * (th + pad) + pad
        if cos[i] < thresh:
            im = Image.eval(im, lambda v: int(v * 0.4))
        sheet.paste(im, (x, y))
        col = (224, 168, 58) if cos[i] >= thresh else (255, 80, 80)
        dr.text((x + 4, y - 15), f"{cos[i]:.3f} {'' if cos[i]>=thresh else 'TOSS'} {os.path.basename(files[i])[:22]}", fill=col)
        if cos[i] < thresh:
            dr.line([x, y, x + tw, y + th], fill=(255, 60, 60), width=3); dr.line([x + tw, y, x, y + th], fill=(255, 60, 60), width=3)
    sheet.save(os.path.join(HERE, "style-grid.png"))
    json.dump({"n": len(files), "kept": len(kept), "threshold": thresh,
               "centroid_spread": [float(cos.min()), float(cos.max())], "rows": rows},
              open(os.path.join(HERE, "style-verdict.json"), "w"), indent=2)
    print("WROTE style-grid.png + style-verdict.json")
    print("STYLE_SCORE_DONE")

if __name__ == "__main__":
    main()
