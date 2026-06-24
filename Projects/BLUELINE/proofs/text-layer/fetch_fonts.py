#!/usr/bin/env python3
"""
BLUELINE text — font librarian. Pulls a wide, curated set of FREE / redistributable display·hand·
grunge·blackletter fonts from Google Fonts (OFL/Apache — safe to commit + use) into fonts/lib/.
The harness can then skeleton from any of them (per-voice). For dafont picks (mostly free-for-
personal-use, no clean API): drop the .ttf into fonts/dropin/ and the sampler + harness find it.

  <comfy venv>/python fetch_fonts.py            # download the curated set (skips ones already present)
Outputs -> fonts/lib/<Name>.ttf
"""
import os, urllib.request
from PIL import ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.path.join(HERE, "fonts", "lib"); os.makedirs(LIB, exist_ok=True)
os.makedirs(os.path.join(HERE, "fonts", "dropin"), exist_ok=True)

# (display name, repo slug, CamelName) — curated for BLUELINE's noir / ink / hand register
FONTS = [
    # — horror · grunge · decayed —
    ("Nosifer","nosifer","Nosifer"), ("Creepster","creepster","Creepster"), ("Eater","eater","Eater"),
    ("Metal Mania","metalmania","MetalMania"), ("Butcher Man","butchermanr","Butchermanr"),
    ("Smokum","smokum","Smokum"), ("Ewert","ewert","Ewert"), ("Frijole","frijole","Frijole"),
    ("Pirata One","pirataone","PirataOne"), ("Sancreek","sancreek","Sancreek"), ("Rye","rye","Rye"),
    ("Vast Shadow","vastshadow","VastShadow"), ("Ruslan Display","ruslandisplay","RuslanDisplay"),
    # — hand · marker · brush · scrawl —
    ("Permanent Marker","permanentmarker","PermanentMarker"), ("Rock Salt","rocksalt","RockSalt"),
    ("Shadows Into Light","shadowsintolight","ShadowsIntoLight"), ("Just Another Hand","justanotherhand","JustAnotherHand"),
    ("Homemade Apple","homemadeapple","HomemadeApple"), ("Nanum Pen","nanumpenscript","NanumPenScript"),
    ("Reenie Beanie","reeniebeanie","ReenieBeanie"), ("Gloria Hallelujah","gloriahallelujah","GloriaHallelujah"),
    ("Architects Daughter","architectsdaughter","ArchitectsDaughter"), ("Caveat","caveat","Caveat"),
    ("Sriracha","sriracha","Sriracha"), ("Covered By Your Grace","coveredbyyourgrace","CoveredByYourGrace"),
    # — bold display · comic · slab —
    ("Bangers","bangers","Bangers"), ("Special Elite","specialelite","SpecialElite"),
    ("Black Ops One","blackopsone","BlackOpsOne"), ("Passion One","passionone","PassionOne"),
    ("Titan One","titanone","TitanOne"), ("Bowlby One SC","bowlbyonesc","BowlbyOneSC"),
    ("Monoton","monoton","Monoton"), ("Faster One","fasterone","FasterOne"),
    # — blackletter · ornate —
    ("UnifrakturCook","unifrakturcook","UnifrakturCook"), ("New Rocker","newrocker","NewRocker"),
    ("Henny Penny","hennypenny","HennyPenny"), ("Pirata","pirataone","PirataOne"),
]

def candidates(slug, name):
    base = "https://raw.githubusercontent.com/google/fonts/main"
    return [f"{base}/ofl/{slug}/{name}-Regular.ttf", f"{base}/ofl/{slug}/{name}[wght].ttf",
            f"{base}/ofl/{slug}/static/{name}-Regular.ttf", f"{base}/ofl/{slug}/{name}.ttf",
            f"{base}/apache/{slug}/{name}-Regular.ttf"]

def fetch(name, slug, camel):
    dest = os.path.join(LIB, name.replace(" ", "") + ".ttf")
    if os.path.exists(dest): return "have"
    for url in candidates(slug, camel):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "curl/8"})
            data = urllib.request.urlopen(req, timeout=25).read()
            if len(data) < 2000: continue
            open(dest, "wb").write(data); ImageFont.truetype(dest, 40)   # validate it loads
            return "ok"
        except Exception:
            if os.path.exists(dest): os.remove(dest)
    return "MISS"

if __name__ == "__main__":
    ok = 0
    for n, s, c in FONTS:
        r = fetch(n, s, c); ok += r in ("ok", "have")
        print(f"  {r:4} {n}", flush=True)
    print(f"FONTS_DONE — {ok}/{len(FONTS)} available in fonts/lib/  (+ drop dafont .ttf into fonts/dropin/)", flush=True)
