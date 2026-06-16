#!/usr/bin/env python3
"""
BLUELINE Track II — grade scorer v2 (the DreamBooth-standard metrics).

Fixes the v1 mistake (ResNet18/ImageNet whole-image similarity, which conflates scene
with identity). Reports, per set of 4 renders at 4 DIFFERENT seeds:

  DINO      mean pairwise cosine of DINOv2 (ViT-S/14) embeddings  -> SUBJECT FIDELITY
            (self-supervised, instance-sensitive; the DreamBooth paper's primary metric)
  CLIP-T    mean cosine(image, SCENE-text) over the set           -> CONTEXT ADHERENCE
            (did it follow the new prompt, or overfit to the training look?)
  ArcFace   mean pairwise cosine of face embeddings (+ detect %)   -> FACE IDENTITY
  color     mean pairwise HSV-hist corr                            -> palette (cheap)

LoRA should sit HIGH on DINO/ArcFace (identity holds across seeds) AND high on CLIP-T
(still follows the prompt). Overfit shows as high DINO but LOW CLIP-T (ignores the scene).
"""
import sys, os, itertools, numpy as np
HERE  = os.path.dirname(os.path.abspath(__file__))
GRADE = os.path.join(HERE, "grade")
sys.path.insert(0, os.path.join(HERE, "..", "..", "render-backend"))
from consistency_ruler import color_corr
import torch, cv2
from PIL import Image

SCENES = [
    "sitting on a mossy rock beside a river",
    "running through tall grass",
    "kneeling to examine tracks on the forest floor",
    "standing on a cliff edge at sunset",
]
SETS  = ["flux_lora", "flux_base", "sdxl_lora", "sdxl_base"]
LABEL = {"flux_lora":"FLUX + LoRA", "flux_base":"FLUX baseline",
         "sdxl_lora":"SDXL + LoRA", "sdxl_base":"SDXL baseline"}

def paths(k):
    return sorted(os.path.join(GRADE,f) for f in os.listdir(GRADE)
                  if f.startswith(k+"_") and f.endswith(".png"))
def scene_idx(p):  # {set}_{i}_seed{n}.png
    return int(os.path.basename(p).split("_")[-2])

def cos(a,b): return float(np.dot(a,b)/((np.linalg.norm(a)*np.linalg.norm(b))+1e-8))
def mean_pw(vecs):
    vs=[v for v in vecs if v is not None]
    if len(vs)<2: return None
    return float(np.mean([cos(a,b) for a,b in itertools.combinations(vs,2)]))

# ---- DINO (subject fidelity) ----
print("loading DINOv2 ...", flush=True)
dino = torch.hub.load('facebookresearch/dinov2','dinov2_vits14', verbose=False).eval()
from torchvision import transforms
_dtf = transforms.Compose([transforms.Resize(224), transforms.CenterCrop(224),
        transforms.ToTensor(), transforms.Normalize([0.485,0.456,0.406],[0.229,0.224,0.225])])
@torch.no_grad()
def dino_embed(p):
    x=_dtf(Image.open(p).convert("RGB")).unsqueeze(0)
    return dino(x).squeeze(0).numpy()

# ---- CLIP-T (context adherence) ----
print("loading CLIP ...", flush=True)
import open_clip
clipm,_,clippre = open_clip.create_model_and_transforms('ViT-B-32', pretrained='laion2b_s34b_b79k')
clipm.eval(); clptok = open_clip.get_tokenizer('ViT-B-32')
@torch.no_grad()
def clip_img(p):
    v=clipm.encode_image(clippre(Image.open(p).convert("RGB")).unsqueeze(0)).squeeze(0).numpy(); return v
@torch.no_grad()
def clip_txt(t):
    v=clipm.encode_text(clptok([t])).squeeze(0).numpy(); return v

# ---- ArcFace (face identity) ----
face_embed=None
try:
    from insightface.app import FaceAnalysis
    fa=FaceAnalysis(name='buffalo_l', providers=['CPUExecutionProvider'])
    fa.prepare(ctx_id=-1, det_size=(640,640))
    def face_embed(p):
        faces=fa.get(cv2.imread(p))
        if not faces: return None
        faces.sort(key=lambda f:(f.bbox[2]-f.bbox[0])*(f.bbox[3]-f.bbox[1]), reverse=True)
        return faces[0].normed_embedding
    print("ArcFace ready", flush=True)
except Exception as e:
    print("ArcFace unavailable:", str(e)[:80], flush=True)

print("\n=== Track II grade v2 — across 4 different seeds ===")
print(f"{'set':<16}{'DINO':>8}{'CLIP-T':>9}{'ArcFace':>9}{'face%':>7}{'color':>8}")
res={}
for k in SETS:
    ps=paths(k)
    if len(ps)<2: print(f"{LABEL[k]:<16}  (insufficient)"); continue
    dino_c = mean_pw([dino_embed(p) for p in ps])
    clipt  = float(np.mean([cos(clip_img(p), clip_txt(SCENES[scene_idx(p)])) for p in ps]))
    fe = [face_embed(p) for p in ps] if face_embed else []
    ndet = sum(1 for f in fe if f is not None)
    arc = mean_pw(fe) if face_embed else None
    col = float(np.mean([color_corr(a,b) for a,b in itertools.combinations(ps,2)]))
    res[k]=dict(dino=dino_c, clipt=clipt, arc=arc, rate=ndet/len(ps) if ps else 0, color=col, n=len(ps))
    a_s = f"{arc:>9.3f}" if arc is not None else f"{'n/a':>9}"
    print(f"{LABEL[k]:<16}{dino_c:>8.3f}{clipt:>9.3f}{a_s}{res[k]['rate']*100:>6.0f}%{col:>8.3f}")

print("\nReading: LoRA wins if its DINO/ArcFace are HIGH *and* CLIP-T stays near baseline.")
print("Overfit signature: high DINO but CLIP-T << baseline (ignores the new scene).")
for k in ("flux_lora","sdxl_lora"):
    b=k.replace("lora","base")
    if k in res and b in res:
        dd=res[k]['dino']-res[b]['dino']; dc=res[k]['clipt']-res[b]['clipt']
        print(f"  {LABEL[k]:<12} vs baseline:  DINO {res[k]['dino']:.3f} ({dd:+.3f})   CLIP-T {res[k]['clipt']:.3f} ({dc:+.3f})")
print("GRADE_V2_DONE")
