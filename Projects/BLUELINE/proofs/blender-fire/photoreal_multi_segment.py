#!/usr/bin/env python3
"""
Which intermediate domain segments best — PHOTOREAL or FLAT-CEL? For each scene, run SAM-auto on the
photoreal and on the flat-cel version, plus a dead-simple colour-quantize on the flat-cel (to show flat
solid regions segment with NO model at all). Montage per scene:
   line-art | photoreal + SAM | flat-cel + SAM | flat-cel colour-quantized
The line-art defeated segmentation; this shows which conversion fixes it best.

  <comfy venv>/python photoreal_multi_segment.py
"""
import os
import numpy as np, cv2
from PIL import Image, ImageDraw
from ultralytics import SAM

HERE = os.path.dirname(os.path.abspath(__file__)); REND = os.path.join(HERE, "renders", "proof"); os.makedirs(REND, exist_ok=True)
M3 = os.path.join(HERE, "..", "m3-warped-noise", "renders"); SRC = os.path.join(HERE, "..", "new-story", "out")
SCENES = {"01_city": "01_wide-burning-city.png", "03_leap": "03_leap-legs-denting-roof.png", "05_impact": "05_impact-landing-shockwave.png"}

m = SAM("sam_b.pt"); rng = np.random.default_rng(3)

def sam_overlay(path, W, H):
    r = m(path, verbose=False); ov = cv2.resize(cv2.imread(path), (W, H)).astype(np.float32); n = 0
    if r and r[0].masks is not None:
        for mk in r[0].masks.data.cpu().numpy():
            mk = cv2.resize((mk * 255).astype(np.uint8), (W, H))
            a = (mk > 128)[..., None].astype(np.float32) * 0.5
            ov = ov * (1 - a) + rng.integers(60, 255, 3).astype(np.float32) * a; n += 1
    return ov, n

def quantize(img, k=8):
    Z = img.reshape(-1, 3).astype(np.float32)
    _, lbl, ctr = cv2.kmeans(Z, k, None, (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 12, 1.0), 3, cv2.KMEANS_PP_CENTERS)
    return ctr[lbl.flatten()].reshape(img.shape).astype(np.uint8)

def lab(img, text, w=300):
    im = Image.fromarray(cv2.cvtColor(img.astype(np.uint8), cv2.COLOR_BGR2RGB)).resize((w, 999))
    im = im.resize((w, int(w * img.shape[0] / img.shape[1])))
    d = ImageDraw.Draw(im); d.rectangle((0, 0, w, 16), fill=(0, 0, 0)); d.text((3, 3), text, fill=(255, 210, 90)); return im

rows, report = [], []
for key, srcfn in SCENES.items():
    photo = os.path.join(M3, f"photoreal_{key}.png"); flat = os.path.join(M3, f"flatcel_{key}.png")
    if not (os.path.exists(photo) and os.path.exists(flat)):
        report.append(f"{key}: missing ({'photo ' if not os.path.exists(photo) else ''}{'flat' if not os.path.exists(flat) else ''})"); continue
    pim = cv2.imread(photo); H, W = pim.shape[:2]; fim = cv2.resize(cv2.imread(flat), (W, H))
    line = cv2.resize(cv2.imread(os.path.join(SRC, srcfn)), (W, H))
    pov, pn = sam_overlay(photo, W, H); fov, fn = sam_overlay(flat, W, H); fq = quantize(fim)
    report.append(f"{key}: photoreal SAM={pn} segs · flat-cel SAM={fn} segs")
    tiles = [lab(line, f"{key} · line-art"), lab(pov, f"photoreal + SAM ({pn})"), lab(fov, f"flat-cel + SAM ({fn})"), lab(fq, "flat-cel quantized (no model)")]
    rw = sum(t.width for t in tiles) + 8 * len(tiles); rh = max(t.height for t in tiles)
    row = Image.new("RGB", (rw, rh), (20, 20, 22)); x = 0
    for t in tiles: row.paste(t, (x, 0)); x += t.width + 8
    rows.append(row)

if rows:
    W = max(r.width for r in rows); Ht = sum(r.height for r in rows) + 10 * len(rows)
    sheet = Image.new("RGB", (W, Ht), (16, 17, 21)); y = 0
    for r in rows: sheet.paste(r, (0, y)); y += r.height + 10
    sheet.save(os.path.join(REND, "08_photoreal_first.png")); print("WROTE renders/proof/08_photoreal_first.png")
print("\n".join(report))
