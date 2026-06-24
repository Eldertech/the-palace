#!/usr/bin/env python3
"""
BLUELINE text — font sampler. Rasterizes one sample word in every available font (curated system
faces + everything in fonts/lib/ + your fonts/dropin/) onto black tiles, and builds a contact sheet
so you can browse the whole range and pick which font drives which voice. No GPU.

  <comfy venv>/python font_sampler.py                 # sample "Blueline"
  <comfy venv>/python font_sampler.py --word "BURNING"
Outputs -> fonts/samples/*.png  +  fonts/font-sampler.html   (open it)
"""
import os, glob, argparse
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
FONTS = os.path.join(HERE, "fonts"); LIB = os.path.join(FONTS, "lib"); DROP = os.path.join(FONTS, "dropin")
SAMP = os.path.join(FONTS, "samples"); os.makedirs(SAMP, exist_ok=True)
SUP = "/System/Library/Fonts/Supplemental"
LABEL = next((p for p in [f"{SUP}/Arial.ttf", "/System/Library/Fonts/Helvetica.ttc"] if os.path.exists(p)), None)

# curated characterful SYSTEM faces (path, ttc-index, display name)
SYSTEM = [
    (f"{SUP}/Chalkduster.ttf", 0, "Chalkduster"), (f"{SUP}/Bradley Hand Bold.ttf", 0, "Bradley Hand"),
    (f"{SUP}/Brush Script.ttf", 0, "Brush Script"), (f"{SUP}/Trattatello.ttf", 0, "Trattatello"),
    (f"{SUP}/Herculanum.ttf", 0, "Herculanum"), (f"{SUP}/Papyrus.ttc", 0, "Papyrus"),
    (f"{SUP}/Zapfino.ttf", 0, "Zapfino"), (f"{SUP}/Savoye LET.ttc", 0, "Savoye LET"),
    (f"{SUP}/SnellRoundhand.ttc", 0, "Snell Roundhand"), (f"{SUP}/Copperplate.ttc", 0, "Copperplate"),
    (f"{SUP}/MarkerFelt.ttc", 0, "Marker Felt"), (f"{SUP}/Noteworthy.ttc", 0, "Noteworthy"),
    (f"{SUP}/ChalkboardSE.ttc", 0, "Chalkboard SE"), (f"{SUP}/Comic Sans MS Bold.ttf", 0, "Comic Sans Bold"),
    (f"{SUP}/Impact.ttf", 0, "Impact"), (f"{SUP}/Didot.ttc", 0, "Didot"), (f"{SUP}/Rockwell.ttc", 0, "Rockwell"),
]

def collect():
    fonts = [(n, p, i, "system") for (p, i, n) in SYSTEM if os.path.exists(p)]
    for f in sorted(glob.glob(f"{LIB}/*.ttf")):
        fonts.append((os.path.splitext(os.path.basename(f))[0], f, 0, "lib"))
    for f in sorted(glob.glob(f"{DROP}/*.ttf") + glob.glob(f"{DROP}/*.otf")):
        fonts.append((os.path.splitext(os.path.basename(f))[0], f, 0, "dropin"))
    return fonts

def tile(name, path, idx, word):
    W, H = 700, 200; img = Image.new("RGB", (W, H), "black"); d = ImageDraw.Draw(img)
    if LABEL:
        try: d.text((14, 12), name, font=ImageFont.truetype(LABEL, 15), fill="#8b8d96")
        except Exception: pass
    f = None
    for size in range(128, 18, -6):
        try: f = ImageFont.truetype(path, size, index=idx)
        except Exception: return None
        if d.textlength(word, font=f) <= W * 0.92: break
    if not f: return None
    asc, desc = f.getmetrics()
    x = (W - d.textlength(word, font=f)) / 2; y = (H - (asc + desc)) / 2 + 16
    d.text((x, y), word, font=f, fill="white")
    dest = os.path.join(SAMP, name.replace(" ", "_") + ".png"); img.save(dest); return dest

def main(word):
    groups = {"system": [], "lib": [], "dropin": []}
    n = 0
    for name, path, idx, src in collect():
        dest = tile(name, path, idx, word)
        if dest: groups[src].append((name, os.path.basename(dest))); n += 1
    sections = []
    titles = {"lib": "Downloaded (Google Fonts · free / OFL)", "dropin": "Your drop-ins (fonts/dropin/ — dafont etc.)", "system": "Already on this Mac"}
    for src in ["lib", "dropin", "system"]:
        if not groups[src]: continue
        cells = "".join(f'<figure><img src="samples/{fn}"><figcaption>{nm}</figcaption></figure>' for nm, fn in groups[src])
        sections.append(f'<h2>{titles[src]} <span>· {len(groups[src])}</span></h2><div class="row">{cells}</div>')
    html = ('<!doctype html><meta charset=utf-8><title>BLUELINE — font sampler</title>'
            '<style>body{background:#0b0b0d;color:#e9e7e2;font-family:JetBrains Mono,monospace;margin:0;padding:24px}'
            'h1{font-family:Anton,Impact,sans-serif;letter-spacing:.04em}h2{font-size:14px;color:#e0a83a;margin:26px 0 8px}h2 span{color:#8b8d96}'
            '.row{display:flex;flex-wrap:wrap;gap:10px}figure{margin:0}img{width:330px;height:auto;border:1px solid #2c2e36;border-radius:6px;display:block}'
            'figcaption{font-size:10px;color:#6a6c75;margin-top:3px}</style>'
            f'<h1>BLUELINE · font sampler — "{word}"</h1><p style="color:#8b8d96;font-size:12px">'
            f'{n} fonts. Pick favorites per voice; drop more .ttf into fonts/dropin/ and re-run.</p>' + "".join(sections))
    open(os.path.join(FONTS, "font-sampler.html"), "w").write(html)
    print(f"SAMPLER_DONE — {n} fonts sampled -> fonts/font-sampler.html", flush=True)

if __name__ == "__main__":
    ap = argparse.ArgumentParser(); ap.add_argument("--word", default="Blueline"); a = ap.parse_args()
    main(a.word)
