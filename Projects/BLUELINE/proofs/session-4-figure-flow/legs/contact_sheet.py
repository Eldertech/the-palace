#!/usr/bin/env python3
"""Contact sheet: ONE character-aware field -> two registers, both know the body.
Left: streamline source (field around the body). Middle: drawn comic speed-lines.
Right: cinema dust sim. The figure sits in the same place in all three."""
import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
R = os.path.join(HERE, "..", "renders")
tiles = [("00-field-around-body.png", "SOURCE  ·  field bends around the body"),
         ("01-drawn-speedlines-around-body.png", "DRAWN  ·  comic speed-lines"),
         ("02-dust-around-body.png", "SIM  ·  cinema dust + wake")]

TH = 900
imgs = []
for fn, _ in tiles:
    im = Image.open(os.path.join(R, fn)).convert("RGB")
    w = int(im.width * TH / im.height)
    imgs.append(im.resize((w, TH)))

pad, label_h = 16, 46
W = sum(i.width for i in imgs) + pad * (len(imgs) + 1)
H = TH + label_h + pad * 2
sheet = Image.new("RGB", (W, H), (12, 13, 16))
dr = ImageDraw.Draw(sheet)
try:
    font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 26)
except Exception:
    font = ImageFont.load_default()

x = pad
for im, (_, label) in zip(imgs, tiles):
    sheet.paste(im, (x, pad))
    dr.text((x + 6, pad + TH + 8), label, fill=(210, 216, 230), font=font)
    x += im.width + pad

title = "BLUELINE Session 4 — one character-aware flow field, two resolutions of reality"
dr.text((pad + 2, H - 30), title, fill=(150, 160, 180), font=font)
out = os.path.join(R, "CONTACT-SHEET-one-field-around-a-character.png")
sheet.save(out)
print("WROTE", out)
