"""Composite preview of the wired seance-cat.js.

Mirrors the JSUI paint() exactly — same smoothstep edges, same painter's
order, same opaque-plate handling, same lights-down vignette — so the strip
shows what Max will display across the gain range without opening Max.

Run: <ComfyUI venv python> render_wired_preview.py
"""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

HERE = Path(__file__).parent
W = H = 300
PLATES = {k: Image.open(HERE / f"pose-{k}.png").convert("RGB").resize((W, H), Image.LANCZOS)
          for k in ("dormant", "awakening", "triumphant")}


def ss(e0, e1, x):
    u = max(0.0, min(1.0, (x - e0) / (e1 - e0)))
    return u * u * (3 - 2 * u)


def weights(g):
    wDor = 1 - ss(0.15, 0.40, g)
    wAwa = ss(0.15, 0.40, g) * (1 - ss(0.60, 0.85, g))
    wTri = ss(0.60, 0.85, g)
    return wDor, wAwa, wTri


def panel(g):
    """One frame, in the same order paint() draws it."""
    wDor, wAwa, wTri = weights(g)
    out = PLATES["dormant"].copy()                       # opaque base coat
    a = min(1.0, wAwa + wTri)
    if a > 0.005:
        out = Image.blend(out, PLATES["awakening"], a)
    if wTri > 0.005:
        out = Image.blend(out, PLATES["triumphant"], wTri)
    # lights-down vignette, over the plates
    veil = 0.55 * (1 - g)
    if veil > 0.01:
        out = Image.blend(out, Image.new("RGB", (W, H), (15, 13, 20)), veil)
    return out, (wDor, wAwa, wTri)


if __name__ == "__main__":
    samples = [0.00, 0.20, 0.33, 0.50, 0.70, 0.88, 1.00]
    strip = Image.new("RGB", (W * len(samples), H + 30), (18, 15, 12))
    draw = ImageDraw.Draw(strip)
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Times New Roman.ttf", 15)
    except OSError:
        font = ImageFont.load_default()
    for i, g in enumerate(samples):
        p, (d, aw, tr) = panel(g)
        strip.paste(p, (i * W, 0))
        draw.text((i * W + 8, H + 7),
                  f"gain {g:.2f}   D {d:.2f}  A {aw:.2f}  T {tr:.2f}",
                  fill=(224, 216, 198), font=font)
    out = HERE / "wired-preview.png"
    strip.save(out)
    print(f"wrote {out}  ({strip.size[0]}x{strip.size[1]})")
