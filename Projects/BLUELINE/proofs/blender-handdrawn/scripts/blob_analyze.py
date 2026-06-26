"""
BLUELINE — analyze ink blobs/splatter from a pen-flow frame and extract their
character + a reusable alpha-matte library for 3D billboard placement.

Measures, per connected ink mark:
  area, perimeter, circularity (4*pi*A/P^2), solidity (A/convexhull),
  extent (A/bbox), aspect — then SEPARATES compact 'blobs/splatter' from
  elongated 'linework', and cuts the top blob mattes as RGBA (ink + alpha).

Outputs:
  blob-library/blob_###.png    — alpha cutouts (black ink on transparent)
  blob-library/contact.png     — contact sheet of extracted blobs
  blob-library/blob-character.json — the measured signature (for the swarm)

Usage: python blob_analyze.py <source.png> [more.png ...]
Deps: numpy + PIL required; cv2 preferred (better perimeter/hull), scipy fallback.
"""
import json, os, sys
import numpy as np
from PIL import Image

try:
    import cv2
    HAVE_CV2 = True
except Exception:
    HAVE_CV2 = False
    from scipy import ndimage as ndi

ROOT = "/Users/loudonstearns/Documents/The Palace/Projects/BLUELINE/proofs/blender-handdrawn"
LIB = os.path.join(ROOT, "blob-library")
os.makedirs(LIB, exist_ok=True)

SRCS = sys.argv[1:] or [os.path.join(ROOT, "stylized", "city_push_inkinit_d88.png")]

def load_gray(p):
    im = Image.open(p).convert("L")
    return np.asarray(im), im.size

def ink_mask(gray):
    # ink is dark; Otsu-ish threshold, then ink=True
    t = max(60, int(np.percentile(gray, 25)) - 10)
    return gray < t

def comp_stats_cv2(mask):
    m = (mask.astype(np.uint8)) * 255
    n, labels, stats, cents = cv2.connectedComponentsWithStats(m, 8)
    out = []
    for i in range(1, n):
        x, y, w, h, area = stats[i]
        if area < 12:
            continue
        sub = (labels[y:y+h, x:x+w] == i).astype(np.uint8)
        cnts, _ = cv2.findContours(sub, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        if not cnts:
            continue
        c = max(cnts, key=cv2.contourArea)
        perim = cv2.arcLength(c, True) or 1.0
        hull = cv2.convexHull(c)
        harea = cv2.contourArea(hull) or area
        circ = float(4 * np.pi * area / (perim * perim))
        solidity = float(area / max(harea, 1))
        extent = float(area / (w * h))
        aspect = float(w / max(h, 1))
        out.append(dict(x=int(x), y=int(y), w=int(w), h=int(h), area=int(area),
                        circ=round(circ, 3), solidity=round(solidity, 3),
                        extent=round(extent, 3), aspect=round(aspect, 3), mask=sub))
    return out

def comp_stats_scipy(mask):
    lab, n = ndi.label(mask)
    out = []
    objs = ndi.find_objects(lab)
    for i, sl in enumerate(objs, start=1):
        if sl is None:
            continue
        ys, xs = sl
        sub = (lab[sl] == i).astype(np.uint8)
        area = int(sub.sum())
        if area < 12:
            continue
        h, w = sub.shape
        # perimeter ~ boundary pixel count
        er = ndi.binary_erosion(sub)
        perim = int((sub & ~er).sum()) or 1
        circ = float(4 * np.pi * area / (perim * perim))
        extent = float(area / (w * h))
        aspect = float(w / max(h, 1))
        out.append(dict(x=int(xs.start), y=int(ys.start), w=int(w), h=int(h), area=area,
                        circ=round(circ, 3), solidity=round(min(1.0, extent + 0.15), 3),
                        extent=round(extent, 3), aspect=round(aspect, 3), mask=sub))
    return out

def is_blob(c, img_area):
    # compact, roundish, not a thin line or a giant structure
    if c["area"] < 18 or c["area"] > img_area * 0.04:
        return False
    if not (0.45 <= c["aspect"] <= 2.2):
        return False
    if c["extent"] < 0.32:          # thin / sprawling linework
        return False
    if c["circ"] < 0.18:            # very ragged elongated edge
        return False
    return True

all_blobs = []
for src in SRCS:
    gray, size = load_gray(src)
    img_area = gray.shape[0] * gray.shape[1]
    mask = ink_mask(gray)
    comps = comp_stats_cv2(mask) if HAVE_CV2 else comp_stats_scipy(mask)
    blobs = [c for c in comps if is_blob(c, img_area)]
    print(f"{os.path.basename(src)}: {len(comps)} marks -> {len(blobs)} blobs (cv2={HAVE_CV2})")
    for c in blobs:
        c["src"] = os.path.basename(src)
    all_blobs.extend(blobs)

# rank by 'blobiness' (area * circularity) and keep a varied top set
all_blobs.sort(key=lambda c: c["area"] * (0.4 + c["circ"]), reverse=True)
keep = all_blobs[:48]

# write alpha cutouts
for i, c in enumerate(keep):
    m = c["mask"].astype(np.uint8)
    pad = 3
    H, W = m.shape
    canvas = np.zeros((H + 2 * pad, W + 2 * pad), np.uint8)
    canvas[pad:pad+H, pad:pad+W] = m * 255
    rgba = np.zeros((*canvas.shape, 4), np.uint8)   # black ink, alpha = mask
    rgba[..., 3] = canvas
    Image.fromarray(rgba, "RGBA").save(os.path.join(LIB, f"blob_{i:03d}.png"))

# contact sheet (top 24)
def contact(blobs, cols=6):
    cell = 96
    rows = (min(24, len(blobs)) + cols - 1) // cols
    sheet = Image.new("RGB", (cols*cell, rows*cell), (255, 255, 255))
    for i, c in enumerate(blobs[:24]):
        m = c["mask"].astype(np.uint8) * 255
        im = Image.fromarray(255 - m).convert("RGB")  # black ink on white
        im.thumbnail((cell-10, cell-10))
        r, q = divmod(i, cols)
        sheet.paste(im, (q*cell + 5, r*cell + 5))
    sheet.save(os.path.join(LIB, "contact.png"))
contact(keep)

# the measured character signature
def dist(vals):
    a = np.array(vals, float)
    return dict(n=len(a), mean=round(float(a.mean()), 3),
                p10=round(float(np.percentile(a, 10)), 3),
                p50=round(float(np.percentile(a, 50)), 3),
                p90=round(float(np.percentile(a, 90)), 3),
                min=round(float(a.min()), 3), max=round(float(a.max()), 3))

areas = [c["area"] for c in all_blobs]
sig = {
    "sources": [os.path.basename(s) for s in SRCS],
    "blob_count": len(all_blobs),
    "kept_mattes": len(keep),
    "area_px": dist(areas) if areas else {},
    "diameter_px": dist([ (c["area"]/np.pi)**0.5 * 2 for c in all_blobs]) if areas else {},
    "circularity": dist([c["circ"] for c in all_blobs]) if areas else {},
    "solidity": dist([c["solidity"] for c in all_blobs]) if areas else {},
    "note": "diameter ~ size to scatter; circularity high=round, low=ragged/spiky; solidity low=satellites/spikes.",
}
json.dump(sig, open(os.path.join(LIB, "blob-character.json"), "w"), indent=2)
print("CHARACTER:", json.dumps(sig, indent=2))
print("wrote", len(keep), "mattes ->", LIB)
