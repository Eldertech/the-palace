#!/usr/bin/env python3
"""IV-D contact sheet: the true-OTS alley shot's four conditioning passes (comfy venv, PIL)."""
import os
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__)); P = os.path.join(HERE, "passes")
OUT = os.path.join(HERE, "renders", "CONTACT-SHEET-bench-IV-D.png")
def font(s):
    for p in ["/System/Library/Fonts/Supplemental/Arial.ttf","/System/Library/Fonts/Helvetica.ttc"]:
        if os.path.exists(p): return ImageFont.truetype(p, s)
    return ImageFont.load_default()
tiles = [("IV-D_rgb.png","clay (figure + alley)"),("IV-D_openpose.png","OpenPose (geometric, figure)"),
         ("IV-D_depth.png","depth (carries the recession)"),("IV-D_canny.png","canny EDGE")]
h = 300; ims = []
for f,l in tiles:
    im = Image.open(os.path.join(P,f)).convert("RGB"); w = int(im.width*h/im.height); im = im.resize((w,h))
    pad,lab = 8,28; c = Image.new("RGB",(w+2*pad,h+2*pad+lab),(18,18,20)); c.paste(im,(pad,pad))
    ImageDraw.Draw(c).text((pad,h+pad+5),l,fill=(225,225,230),font=font(16)); ims.append(c)
W = sum(i.width for i in ims)+12*(len(ims)-1); H = max(i.height for i in ims)
sheet = Image.new("RGB",(W+24,H+54),(12,12,14))
ImageDraw.Draw(sheet).text((14,12),"TRACK IV +ENV — IV-D: run+sword-drawn x TRUE-OTS x alley_urban (camera aims past the figure)",
    fill=(240,240,245),font=font(19))
x=14
for i in ims: sheet.paste(i,(x,42)); x+=i.width+12
sheet.save(OUT); print("WROTE",OUT,sheet.size)
