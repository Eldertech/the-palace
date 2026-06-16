#!/usr/bin/env python3
"""
BLUELINE Track II — score the grade renders (local, comfy venv).

For each set (flux_lora / flux_base / sdxl_lora / sdxl_base) of 4 renders at 4 DIFFERENT
seeds, compute mean pairwise embed_cos (identity consistency, pose-invariant) + color_corr.
LoRA sets should sit HIGH (identity holds across seeds); base sets LOW (the model drifts).
Bar to beat: Track V's independent-seed drift, embed 0.82. Also writes a contact sheet.
"""
import sys, os, itertools
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "..", "render-backend"))
from consistency_ruler import embed_cos, color_corr
from PIL import Image, ImageDraw

GRADE = os.path.join(HERE, "grade")
SETS  = ["flux_lora", "flux_base", "sdxl_lora", "sdxl_base"]
LABEL = {"flux_lora":"FLUX + LoRA", "flux_base":"FLUX no-LoRA (baseline)",
         "sdxl_lora":"SDXL + LoRA", "sdxl_base":"SDXL no-LoRA (baseline)"}

def paths(k):
    return sorted(os.path.join(GRADE,f) for f in os.listdir(GRADE)
                  if f.startswith(k+"_") and f.endswith(".png"))

def mean_pw(ps):
    e=[]; c=[]
    for a,b in itertools.combinations(ps,2):
        e.append(embed_cos(a,b)); c.append(color_corr(a,b))
    return (sum(e)/len(e), sum(c)/len(c)) if e else (0.0,0.0)

print("=== Track II verdict — mean pairwise consistency across 4 DIFFERENT seeds ===")
print(f"{'set':<28}{'imgs':>5}{'embed_cos':>11}{'color_corr':>12}")
res={}
for k in SETS:
    ps=paths(k)
    if len(ps)<2: print(f"{LABEL[k]:<28}{len(ps):>5}   (insufficient)"); continue
    me,mc=mean_pw(ps); res[k]=(me,mc,len(ps))
    print(f"{LABEL[k]:<28}{len(ps):>5}{me:>11.3f}{mc:>12.3f}")

print(f"\nBar (Track V independent-seed drift): embed_cos 0.82")
for k in ("flux_lora","sdxl_lora"):
    if k in res:
        v=res[k][0]; base=res[k.replace('lora','base')][0] if k.replace('lora','base') in res else None
        verdict = "BEATS 0.82 ✓" if v>0.82 else "below 0.82"
        lift = f" (vs no-LoRA {base:.3f})" if base is not None else ""
        print(f"  {LABEL[k]:<14}: {v:.3f}  {verdict}{lift}")

# ---- contact sheet: 4 rows (sets) x 4 scenes, label band per row ----
TH, BAND, PAD = 300, 26, 6
cols = 4
imgs = {k:paths(k) for k in SETS if paths(k)}
rows = [k for k in SETS if k in imgs]
W = cols*TH + (cols+1)*PAD
H = len(rows)*(TH+BAND) + PAD
sheet = Image.new("RGB", (W,H), (21,22,26)); d=ImageDraw.Draw(sheet)
y=PAD
for k in rows:
    me = res[k][0] if k in res else 0
    d.rectangle([0,y,W,y+BAND], fill=(29,31,37))
    d.text((PAD+2,y+7), f"{LABEL[k]}   mean embed_cos {me:.3f}", fill=(224,168,58))
    yy=y+BAND
    for i,p in enumerate(imgs[k][:cols]):
        im=Image.open(p).convert("RGB").resize((TH,TH))
        sheet.paste(im, (PAD+i*(TH+PAD), yy))
    y=yy+TH
out=os.path.join(GRADE,"CONTACT-grade.png")
sheet.save(out)
print(f"\ncontact sheet -> {out}")
print("GRADE_SCORE_DONE")
