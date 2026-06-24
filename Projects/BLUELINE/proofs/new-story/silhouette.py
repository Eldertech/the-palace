#!/usr/bin/env python3
"""
BLUELINE · NEW STORY — SILHOUETTE MASK (Loudon: "make the mask emanate from the SHAPE of the character,
not a circle"). Because we now author the pose openpose-first, the exact skeleton is known, so the mask can
be GROWN from it into a real body silhouette: a head ellipse (biased up for skull/hair) + a filled torso
polygon (shoulders->hips) + tapered limb capsules (upper limbs fatter than forearms/shins), unioned and
softly feathered. The figure's own scale sets the widths, so it hugs a small or large figure equally.

  <comfy venv>/python silhouette.py            # writes a check overlay of the woman's silhouette on her render
"""
import math
from PIL import Image, ImageDraw, ImageFilter

# COCO-18: 0 nose 1 neck 2 Rsho 3 Relb 4 Rwri 5 Lsho 6 Lelb 7 Lwri 8 Rhip 9 Rkne 10 Rank
#          11 Lhip 12 Lkne 13 Lank 14 Reye 15 Leye 16 Rear 17 Lear
LIMB_W = [((2,3),0.55),((3,4),0.42),((5,6),0.55),((6,7),0.42),
          ((8,9),0.72),((9,10),0.52),((11,12),0.72),((12,13),0.52),
          ((1,2),0.62),((1,5),0.62),((1,8),0.95),((1,11),0.95),((1,0),0.5)]

def _d(a, b): return math.hypot(a[0]-b[0], a[1]-b[1])

def silhouette_mask(kp, W, H, feather=18, scale=1.0):
    """kp: {coco_idx:(x_px,y_px)}. Returns an 'L' mask shaped like the body."""
    m = Image.new("L", (W, H), 0); dr = ImageDraw.Draw(m)
    has = lambda *ids: all(i in kp for i in ids)
    # base limb width from torso length (scale-invariant)
    torso = _d(kp[1], kp[8]) if has(1, 8) else 0.15 * H
    base = max(10.0, torso * 0.46 * scale)
    # filled torso
    if has(2, 5, 11, 8): dr.polygon([kp[2], kp[5], kp[11], kp[8]], fill=255)
    if has(1, 8, 11):    dr.polygon([kp[1], kp[8], kp[11]], fill=255)
    if has(1, 2, 5):     dr.polygon([kp[1], kp[2], kp[5]], fill=255)
    # limb capsules (rounded)
    def capsule(a, b, w):
        w = int(max(4, w)); dr.line([kp[a], kp[b]], fill=255, width=w)
        for i in (a, b):
            x, y = kp[i]; r = w / 2
            dr.ellipse([x-r, y-r, x+r, y+r], fill=255)
    for (a, b), wf in LIMB_W:
        if has(a, b): capsule(a, b, base * wf)
    # head ellipse (biased upward for skull/hair)
    face = [kp[i] for i in (0, 14, 15, 16, 17) if i in kp]
    if face:
        xs = [p[0] for p in face]; ys = [p[1] for p in face]
        cx, cy = sum(xs)/len(xs), sum(ys)/len(ys)
        hr = max(base * 0.95, (max(xs)-min(xs)) * 0.9)
        dr.ellipse([cx-hr, cy-hr*1.25, cx+hr, cy+hr*1.05], fill=255)
    return m.filter(ImageFilter.GaussianBlur(feather))

if __name__ == "__main__":
    import os
    import regen_girl as RG   # GIRL_LEFT + mirror
    HERE = os.path.dirname(os.path.abspath(__file__)); GP = os.path.join(HERE, "genpose")
    W, H = 1216, 832
    kp_norm = RG.mirror(RG.GIRL_LEFT)                       # the head-right staging we rendered
    kp_px = {i: (int(x*W), int(y*H)) for i, (x, y) in kp_norm.items()}
    mask = silhouette_mask(kp_px, W, H)
    render = Image.open(os.path.join(GP, "girl_right_s4242.png")).convert("RGB").resize((W, H))
    # overlay: tint the masked area so we can see the silhouette hug the figure
    red = Image.new("RGB", (W, H), (220, 40, 40))
    over = Image.composite(Image.blend(render, red, 0.45), render, mask)
    out = os.path.join(GP, "silhouette_check.png"); over.save(out)
    mask.save(os.path.join(GP, "silhouette_mask.png"))
    print("SIL_CHECK", out)
