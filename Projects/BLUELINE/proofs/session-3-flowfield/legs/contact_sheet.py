#!/usr/bin/env python3
"""Stack: ONE field source -> its three resolutions of reality (drawn / steers / sim).
Run with the comfy venv (PIL)."""
import os
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__))
R = os.path.abspath(os.path.join(HERE, "..", "renders"))
OUT = os.path.join(R, "CONTACT-SHEET-one-field-three-resolutions.png")
def font(s):
    for p in ["/System/Library/Fonts/Supplemental/Arial.ttf","/System/Library/Fonts/Helvetica.ttc"]:
        if os.path.exists(p): return ImageFont.truetype(p, s)
    return ImageFont.load_default()
W = 920
rows = [
    ("00-field-source.png",        "THE ONE FIELD  ·  curl of a potential (laminar drift + vortices), divergence-free"),
    ("01-drawn-speedlines.png",    "→ DRAWN  ·  comic speed-lines (streamlines, taper = speed)"),
    ("02-steers-motion.png",       "→ STEERS  ·  dense motion (HSV) + Go-with-the-Flow noise-warp (t0/t2/t4)"),
    ("03b-sim-blender.png",        "→ SIM  ·  particles advected, Blender offline (real-time fork: legs/particles.html)"),
]
tiles = []
for fn, lab in rows:
    im = Image.open(os.path.join(R, fn)).convert("RGB")
    h = int(im.height * W / im.width); im = im.resize((W, h))
    pad, labh = 6, 26
    t = Image.new("RGB", (W + 2*pad, h + labh + pad), (12, 13, 16))
    d = ImageDraw.Draw(t); d.text((pad+2, 5), lab, fill=(224, 200, 140) if fn.startswith("00") else (210,210,216), font=font(15))
    t.paste(im, (pad, labh)); tiles.append(t)
TITLE = 40
H = TITLE + sum(t.height + 8 for t in tiles)
sheet = Image.new("RGB", (W + 12, H + 8), (9, 10, 12))
d = ImageDraw.Draw(sheet)
d.text((8, 10), "THE FLOW FIELD IS THE SPINE — one source, three resolutions of reality (Session 3)", fill=(240,240,245), font=font(19))
y = TITLE
for t in tiles:
    sheet.paste(t, (6, y)); y += t.height + 8
sheet.save(OUT)
print("WROTE", OUT, sheet.size)
