#!/usr/bin/env python3
"""Build the Session 1 headline contact sheet: conditioning passes (top) + the keystone
comparison blocked-vs-prompt-only (bottom). Run with the ComfyUI venv (PIL)."""
import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
P = os.path.abspath(os.path.join(HERE, "..", "passes"))
R = os.path.abspath(os.path.join(HERE, "..", "renders"))
OUT = os.path.join(R, "CONTACT-SHEET-keystone.png")

def font(sz):
    for p in ["/System/Library/Fonts/Supplemental/Arial.ttf",
              "/System/Library/Fonts/Helvetica.ttc"]:
        if os.path.exists(p):
            return ImageFont.truetype(p, sz)
    return ImageFont.load_default()

def tile(path, label, h=360):
    im = Image.open(path).convert("RGB")
    w = int(im.width * h / im.height)
    im = im.resize((w, h))
    pad, lab = 8, 30
    canvas = Image.new("RGB", (w + 2*pad, h + 2*pad + lab), (18, 18, 20))
    canvas.paste(im, (pad, pad))
    d = ImageDraw.Draw(canvas)
    d.text((pad, h + pad + 6), label, fill=(225, 225, 230), font=font(18))
    return canvas

top = [("rgb.png", "1. Blender clay"), ("openpose.png", "2. OpenPose (geometric)"),
       ("depth.png", "3. depth"), ("canny.png", "4. canny")]
bot = [("blocked_sdxl_refined.png", "BLOCKED  pose+depth+canny -> SDXL"),
       ("prompt_only_sdxl_seed7.png", "PROMPT-ONLY  same prompt, no conditioning"),
       ("prompt_only_sdxl_seed42.png", "PROMPT-ONLY  seed 42")]

def row(items, base, h):
    tiles = [tile(os.path.join(base, f), l, h) for f, l in items]
    W = sum(t.width for t in tiles) + 12*(len(tiles)-1)
    H = max(t.height for t in tiles)
    strip = Image.new("RGB", (W, H), (18, 18, 20))
    x = 0
    for t in tiles:
        strip.paste(t, (x, 0)); x += t.width + 12
    return strip

r1 = row(top, P, 300)
r2 = row(bot, R, 460)
W = max(r1.width, r2.width)
title_h, gap = 54, 28
H = title_h + r1.height + gap + r2.height + 16
sheet = Image.new("RGB", (W + 24, H + 24), (12, 12, 14))
d = ImageDraw.Draw(sheet)
d.text((14, 12), "BLOCKED, NOT PROMPTED — Session 1 keystone (SDXL, one CN per channel)",
       fill=(240, 240, 245), font=font(22))
sheet.paste(r1, (14, title_h))
sheet.paste(r2, (14, title_h + r1.height + gap))
sheet.save(OUT)
print("WROTE", OUT, sheet.size)
