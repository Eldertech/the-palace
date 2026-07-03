#!/usr/bin/env python3
"""Render a 3-panel preview of seance-cat.js JSUI character.
Mirrors the same vector primitives the JSUI draws, at three gain positions."""
import math
from PIL import Image, ImageDraw, ImageFont

W = H = 320
PAD = 16
PANELS = 3
OUT_W = W * PANELS + PAD * (PANELS + 1)
OUT_H = H + PAD * 2 + 40

def bg(gain):
    v = 0.18 - 0.10 * gain
    return (int(v * 255), int(v * 0.6 * 255), int(v * 1.4 * 255))

def ss(e0, e1, x):
    u = max(0.0, min(1.0, (x - e0) / (e1 - e0)))
    return u * u * (3 - 2 * u)

INK = (12, 10, 20)

def ink(a):
    return (*INK, int(255 * a))

def draw_dormant(d, w, h, a):
    cx, cy = w * 0.5, h * 0.72
    d.ellipse([cx - w*0.20, cy - h*0.07, cx + w*0.20, cy + h*0.07], outline=ink(a), width=2)
    d.ellipse([cx - w*0.10, cy - h*0.10, cx + w*0.02, cy], outline=ink(a), width=2)
    # closed eye arc
    d.arc([cx - w*0.07, cy - h*0.08, cx + w*0.01, cy - h*0.04], 200, 340, fill=ink(a), width=2)
    # tail
    d.arc([cx + w*0.08, cy - h*0.06, cx + w*0.28, cy + h*0.08], 280, 120, fill=ink(a), width=2)
    d.text((cx + w*0.10, cy - h*0.22), "z z z", fill=ink(a*0.7))

def draw_awakening(d, w, h, a):
    cx, cy = w * 0.5, h * 0.62
    d.ellipse([cx - w*0.13, cy - h*0.05, cx + w*0.13, cy + h*0.17], outline=ink(a), width=2)
    d.ellipse([cx - w*0.10, cy - h*0.22, cx + w*0.10, cy - h*0.04], outline=ink(a), width=2)
    # ears
    d.polygon([(cx - w*0.08, cy - h*0.22), (cx - w*0.05, cy - h*0.30), (cx - w*0.02, cy - h*0.22)], outline=ink(a))
    d.polygon([(cx + w*0.02, cy - h*0.22), (cx + w*0.05, cy - h*0.30), (cx + w*0.08, cy - h*0.22)], outline=ink(a))
    # half-open eyes
    d.ellipse([cx - w*0.075, cy - h*0.172, cx - w*0.025, cy - h*0.148], fill=ink(a))
    d.ellipse([cx - w*0.005, cy - h*0.172, cx + w*0.045, cy - h*0.148], fill=ink(a))
    # reaching paw arc
    pts = []
    for i in range(20):
        t = i / 19
        # quadratic-ish curve from (.08,-.02) up to (.20,-.28)
        px = cx + w * (0.08 + 0.12 * t)
        py = cy + h * (-0.02 - 0.26 * t - 0.06 * math.sin(t * math.pi))
        pts.append((px, py))
    for i in range(len(pts)-1):
        d.line([pts[i], pts[i+1]], fill=ink(a), width=2)
    d.ellipse([cx + w*0.155, cy - h*0.32, cx + w*0.205, cy - h*0.28], outline=ink(a), width=2)

def draw_triumphant(d, w, h, a):
    cx, cy = w * 0.5, h * 0.55
    d.ellipse([cx - w*0.11, cy - h*0.02, cx + w*0.11, cy + h*0.26], outline=ink(a), width=2)
    d.ellipse([cx - w*0.10, cy - h*0.26, cx + w*0.10, cy - h*0.06], outline=ink(a), width=2)
    d.polygon([(cx - w*0.08, cy - h*0.26), (cx - w*0.04, cy - h*0.36), (cx, cy - h*0.26)], outline=ink(a))
    d.polygon([(cx, cy - h*0.26), (cx + w*0.04, cy - h*0.36), (cx + w*0.08, cy - h*0.26)], outline=ink(a))
    # arms
    for sgn in (-1, 1):
        pts = []
        for i in range(20):
            t = i / 19
            px = cx + sgn * w * (0.11 + 0.21 * t)
            py = cy - h * (0.30 * t + 0.04 * math.sin(t * math.pi))
            pts.append((px, py))
        for i in range(len(pts)-1):
            d.line([pts[i], pts[i+1]], fill=ink(a), width=2)
    # stars in eyes
    for ex in (-w*0.04, w*0.03):
        x, y, r = cx + ex, cy - h*0.20, w*0.022
        star = []
        for k in range(8):
            ang = k * math.pi / 4
            rr = r if k % 2 == 0 else r * 0.4
            star.append((x + math.cos(ang) * rr, y + math.sin(ang) * rr))
        d.polygon(star, fill=(242, 224, 140, int(255*a)))
    # grin
    d.arc([cx - w*0.04, cy - h*0.15, cx + w*0.04, cy - h*0.08], 20, 160, fill=ink(a), width=2)

def draw_ecto(d, w, h, a, phase=0):
    cx, cy = w * 0.5, h * 0.55
    for i in range(3):
        ph = phase + i * 2.094
        r = w * (0.18 + 0.05 * i)
        x0 = cx + math.cos(ph) * r
        y0 = cy + math.sin(ph) * r * 0.6
        x1 = cx + math.cos(ph + 1.2) * r * 1.3
        y1 = cy + math.sin(ph + 1.2) * r * 0.6
        # crude curve via samples
        pts = []
        for k in range(24):
            t = k / 23
            # quadratic Bezier through control (cx, cy - h*0.15)
            bx = (1-t)**2 * x0 + 2*(1-t)*t * cx + t*t * x1
            by = (1-t)**2 * y0 + 2*(1-t)*t * (cy - h*0.15) + t*t * y1
            pts.append((bx, by))
        for k in range(len(pts)-1):
            d.line([pts[k], pts[k+1]], fill=(140, 200, 230, int(64*a)), width=3)

def render_panel(gain, phase=0):
    img = Image.new("RGBA", (W, H), bg(gain) + (255,))
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer, "RGBA")
    wDor = 1 - ss(0.15, 0.40, gain)
    wAwa = ss(0.15, 0.40, gain) * (1 - ss(0.60, 0.85, gain))
    wTri = ss(0.60, 0.85, gain)
    ecto = max(wAwa, wTri)
    if ecto > 0.01: draw_ecto(d, W, H, ecto, phase)
    if wDor > 0.01: draw_dormant(d, W, H, wDor)
    if wAwa > 0.01: draw_awakening(d, W, H, wAwa)
    if wTri > 0.01: draw_triumphant(d, W, H, wTri)
    img = Image.alpha_composite(img, layer)
    return img

def main():
    sheet = Image.new("RGBA", (OUT_W, OUT_H), (24, 18, 36, 255))
    d = ImageDraw.Draw(sheet)
    gains = [0.10, 0.50, 0.92]
    labels = ["dormant — gain 0.10", "awakening — gain 0.50", "triumphant — gain 0.92"]
    for i, (g, lbl) in enumerate(zip(gains, labels)):
        panel = render_panel(g, phase=i*1.7)
        x = PAD + i * (W + PAD)
        sheet.paste(panel, (x, PAD), panel)
        d.text((x + 10, PAD + H + 6), lbl, fill=(220, 210, 240))
    out = "preview-3panel.png"
    sheet.convert("RGB").save(out)
    print(f"wrote {out}")

if __name__ == "__main__":
    main()
