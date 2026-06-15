#!/usr/bin/env python3
"""Track V coherence contact sheet: independent-seed pair vs shared-seed pair (comfy venv, PIL)."""
import os
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__)); R = os.path.join(HERE, "renders"); P = os.path.join(HERE, "passes")
OUT = os.path.join(R, "CONTACT-coherence.png")
def font(s):
    for p in ["/System/Library/Fonts/Supplemental/Arial.ttf","/System/Library/Fonts/Helvetica.ttc"]:
        if os.path.exists(p): return ImageFont.truetype(p, s)
    return ImageFont.load_default()
def tile(path, label, h=360):
    im = Image.open(path).convert("RGB"); w = int(im.width*h/im.height); im = im.resize((w,h))
    pad, lab = 8, 26; c = Image.new("RGB",(w+2*pad,h+2*pad+lab),(18,18,20)); c.paste(im,(pad,pad))
    ImageDraw.Draw(c).text((pad,h+pad+5),label,fill=(225,225,230),font=font(15)); return c
rows = [
  ("INDEPENDENT seeds (1001 / 2002) — baseline; character should DRIFT frame-to-frame",
   [("renders/indep_A.png","phase A (seed 1001)"), ("renders/indep_B.png","phase B (seed 2002)")]),
  ("SHARED seed 777 — naive coherence; character should hold across the stride",
   [("renders/linked_A.png","phase A (seed 777)"), ("renders/linked_B.png","phase B (seed 777)")]),
  ("the pose conditioning (geometric OpenPose, two run phases)",
   [("passes/runA_openpose.png","runA skeleton"), ("passes/runB_openpose.png","runB skeleton")]),
]
tiles_rows = []
for title, items in rows:
    ts = [tile(os.path.join(HERE,f), l, 300 if "skeleton" in l else 360) for f,l in items]
    tiles_rows.append((title, ts))
W = max(sum(t.width for t in ts)+12 for _,ts in tiles_rows) + 28
rowH = [max(t.height for t in ts)+30 for _,ts in tiles_rows]
H = sum(rowH) + 40
sheet = Image.new("RGB",(W,H),(12,12,14)); d = ImageDraw.Draw(sheet)
d.text((14,12),"TRACK V — frame-to-frame coherence: does shared-seed hold the character across a stride?",fill=(240,240,245),font=font(18))
y = 40
for (title, ts), rh in zip(tiles_rows, rowH):
    d.text((14,y),title,fill=(224,168,58),font=font(13)); y += 22
    x = 14
    for t in ts: sheet.paste(t,(x,y)); x += t.width+12
    y += rh - 22
sheet.save(OUT); print("WROTE", OUT, sheet.size)
