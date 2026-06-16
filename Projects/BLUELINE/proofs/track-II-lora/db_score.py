#!/usr/bin/env python3
"""
BLUELINE Track II — score the DreamBooth control with DINO (subject fidelity).

For each known-good subject: mean pairwise DINO across the LoRA renders (4 new contexts,
4 seeds) vs the no-LoRA baseline. If LoRA DINO is HIGH and clearly > baseline, our
train->render pipeline is sound, and r4ng3r's failure is purely the dataset. Also a sheet.
"""
import os, sys, re, itertools, numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
DBG  = os.path.join(HERE, "dbgrade")
import torch
from PIL import Image, ImageDraw
from torchvision import transforms

print("loading DINOv2 ...", flush=True)
dino = torch.hub.load('facebookresearch/dinov2','dinov2_vits14', verbose=False).eval()
_tf = transforms.Compose([transforms.Resize(224), transforms.CenterCrop(224),
        transforms.ToTensor(), transforms.Normalize([0.485,0.456,0.406],[0.229,0.224,0.225])])
@torch.no_grad()
def emb(p):
    v = dino(_tf(Image.open(p).convert("RGB")).unsqueeze(0)).squeeze(0).numpy()
    return v/(np.linalg.norm(v)+1e-8)
def meanpw(ps):
    vs=[emb(p) for p in ps]
    return float(np.mean([float(np.dot(a,b)) for a,b in itertools.combinations(vs,2)])) if len(vs)>1 else None

def setkey(f): return re.sub(r'_\d+_seed\d+\.png$','',f)
groups={}
for f in sorted(os.listdir(DBG)):
    if f.endswith(".png") and "CONTACT" not in f:
        groups.setdefault(setkey(f), []).append(os.path.join(DBG,f))

print("\n=== DreamBooth control — DINO subject fidelity (across 4 contexts/seeds) ===")
print(f"{'set':<22}{'imgs':>5}{'DINO':>9}")
res={}
for k in sorted(groups):
    ps=groups[k]; m=meanpw(ps); res[k]=m
    print(f"{k:<22}{len(ps):>5}{(m if m is not None else 0):>9.3f}")

print("\nPipeline verdict — LoRA should be HIGH and clearly above baseline:")
subjects=sorted({k.rsplit('_',1)[0] for k in res if k.endswith('_lora') or k.endswith('_base')})
for s in subjects:
    lo=res.get(s+"_lora"); ba=res.get(s+"_base")
    if lo is not None and ba is not None:
        verdict = "PIPELINE OK ✓" if (lo>0.55 and lo-ba>0.10) else ("weak" if lo>0.45 else "FAILS")
        print(f"  {s:<12}  LoRA {lo:.3f}  vs baseline {ba:.3f}  (lift {lo-ba:+.3f})  -> {verdict}")
print("  (compare to r4ng3r FLUX LoRA DINO 0.317, which was BELOW its baseline)")

# contact sheet
rows=[k for k in sorted(groups)]; TH,BAND,PAD=300,24,6; cols=4
W=cols*TH+(cols+1)*PAD; H=len(rows)*(TH+BAND)+PAD
sheet=Image.new("RGB",(W,H),(21,22,26)); d=ImageDraw.Draw(sheet); y=PAD
for k in rows:
    d.rectangle([0,y,W,y+BAND],fill=(29,31,37))
    d.text((PAD+2,y+6), f"{k}   DINO {res.get(k,0):.3f}", fill=(224,168,58))
    yy=y+BAND
    for i,p in enumerate(groups[k][:cols]):
        sheet.paste(Image.open(p).convert("RGB").resize((TH,TH)), (PAD+i*(TH+PAD), yy))
    y=yy+TH
out=os.path.join(DBG,"CONTACT-dbcontrol.png"); sheet.save(out)
print(f"\ncontact sheet -> {out}\nDB_SCORE_DONE")
