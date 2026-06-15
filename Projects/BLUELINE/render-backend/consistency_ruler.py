#!/usr/bin/env python3
"""
BLUELINE — the CONSISTENCY RULER (the "assess ruler" of Track II).

Measures how consistent two (or more) frames are — identity, palette, costume,
environment — robustly to pose change. Two complementary metrics:

  1. embed_cos  — cosine similarity of a pretrained CNN embedding (torchvision
                  ResNet18, ImageNet). Semantic: "same character / style / scene",
                  largely pose-invariant. The primary number.
  2. color_corr — HSV color-histogram correlation (cv2). Cheap palette/costume check.

Higher = more consistent. Use it to score frame-to-frame coherence (Track V), identity
across a base-model swap (Track II), and identity across the comic->hyperreal jump (M4).

Run (comfy venv):
  python3 consistency_ruler.py imgA.png imgB.png [imgC.png ...]
  python3 consistency_ruler.py --pairs a1.png a2.png b1.png b2.png   # score (a1,a2) and (b1,b2)
"""
import sys, itertools
import numpy as np
from PIL import Image
import cv2
import torch, torchvision
from torchvision.models import resnet18, ResNet18_Weights

_W = ResNet18_Weights.DEFAULT
_M = resnet18(weights=_W); _M.fc = torch.nn.Identity(); _M.eval()
_T = _W.transforms()

@torch.no_grad()
def embed(path):
    im = Image.open(path).convert("RGB")
    x = _T(im).unsqueeze(0)
    v = _M(x).squeeze(0).numpy()
    return v / (np.linalg.norm(v) + 1e-8)

def color_hist(path):
    im = cv2.cvtColor(cv2.imread(path), cv2.COLOR_BGR2HSV)
    h = cv2.calcHist([im],[0,1],None,[50,60],[0,180,0,256])
    cv2.normalize(h, h); return h

def embed_cos(a, b): return float(np.dot(embed(a), embed(b)))
def color_corr(a, b): return float(cv2.compareHist(color_hist(a), color_hist(b), cv2.HISTCMP_CORREL))

def score(a, b):
    return embed_cos(a, b), color_corr(a, b)

if __name__ == "__main__":
    args = sys.argv[1:]
    if args and args[0] == "--pairs":
        ps = args[1:]
        print(f"{'pair':<48}{'embed_cos':>10}{'color_corr':>12}")
        for i in range(0, len(ps)-1, 2):
            e, c = score(ps[i], ps[i+1])
            import os
            print(f"{os.path.basename(ps[i])+' / '+os.path.basename(ps[i+1]):<48}{e:>10.3f}{c:>12.3f}")
    else:
        import os
        names = [os.path.basename(p) for p in args]
        print("=== embed_cos (CNN semantic; pose-invariant) / color_corr (HSV palette) ===")
        print(f"{'':<22}" + "".join(f"{n[:18]:>20}" for n in names))
        for i, a in enumerate(args):
            row = f"{names[i][:20]:<22}"
            for j, b in enumerate(args):
                if j < i: row += f"{'':>20}"
                else:
                    e, c = score(a, b); row += f"{e:.2f}/{c:+.2f}".rjust(20)
            print(row)
    print("RULER_DONE")
