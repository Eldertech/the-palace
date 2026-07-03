"""Composite preview of the wired seance-cat.js — mirrors the JSUI crossfade
math (same edges, same smoothstep) using the three pose PNGs, so the panel
shows what Max will display at five gain values without opening Max."""
from PIL import Image
from pathlib import Path

HERE = Path(__file__).parent
poses = {
    "dormant": Image.open(HERE / "pose-dormant.png").convert("RGBA"),
    "awakening": Image.open(HERE / "pose-awakening.png").convert("RGBA"),
    "triumphant": Image.open(HERE / "pose-triumphant.png").convert("RGBA"),
}
W, H = 320, 320
for k, v in poses.items():
    poses[k] = v.resize((W, H), Image.LANCZOS)

def ss(e0, e1, x):
    u = max(0.0, min(1.0, (x - e0) / (e1 - e0)))
    return u * u * (3 - 2 * u)

def weights(g):
    wDor = 1 - ss(0.15, 0.40, g)
    wAwa = ss(0.15, 0.40, g) * (1 - ss(0.60, 0.85, g))
    wTri = ss(0.60, 0.85, g)
    return wDor, wAwa, wTri

def bg(g):
    v = 0.18 - 0.10 * g
    return (int(v * 255), int(v * 0.6 * 255), int(v * 1.4 * 255), 255)

def alpha(img, a):
    a = max(0.0, min(1.0, a))
    out = img.copy()
    alpha_ch = out.split()[3].point(lambda p: int(p * a))
    out.putalpha(alpha_ch)
    return out

samples = [0.05, 0.25, 0.50, 0.80, 0.97]
strip = Image.new("RGBA", (W * len(samples), H + 28), (10, 6, 14, 255))
from PIL import ImageDraw, ImageFont
draw = ImageDraw.Draw(strip)
try:
    font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Times New Roman.ttf", 14)
except OSError:
    font = ImageFont.load_default()

for i, g in enumerate(samples):
    panel = Image.new("RGBA", (W, H), bg(g))
    wDor, wAwa, wTri = weights(g)
    if wDor > 0.01: panel.alpha_composite(alpha(poses["dormant"], wDor))
    if wAwa > 0.01: panel.alpha_composite(alpha(poses["awakening"], wAwa))
    if wTri > 0.01: panel.alpha_composite(alpha(poses["triumphant"], wTri))
    strip.paste(panel, (i * W, 0))
    label = f"gain {g:.2f}  D{wDor:.2f} A{wAwa:.2f} T{wTri:.2f}"
    draw.text((i * W + 8, H + 6), label, fill=(220, 215, 200, 255), font=font)

out = HERE / "wired-preview.png"
strip.convert("RGB").save(out)
print(f"wrote {out}")
