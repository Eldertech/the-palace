#!/usr/bin/env python3
"""
PHOTOREAL-FIRST decomposition test — convert several line drawings to photoreal (FLUX + canny
ControlNet, same composition) in ONE pod session, so segmentation/depth/infill can work in the domain
they're trained on. Tests whether line-art objects (buildings, cars, figures) become solid,
segmentable objects in photoreal across multiple scenes.

Driven by m3_pod_orchestrator (owns the FLUX pod lifecycle):
  python3 m3_pod_orchestrator.py --render-script photoreal_render.py
"""
import argparse, os, sys, time
from pathlib import Path
import cv2
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from m3_pod_render import Pod

OUTDIR = "/Users/loudonstearns/Documents/palace-feature-blueline-m3/Projects/BLUELINE/proofs/new-story/out"
# Two candidate intermediate domains to compare for SEGMENTABILITY: photoreal vs flat cel-shaded.
STYLES = [
  ("photoreal", "photorealistic cinematic film still, {d}, dramatic, highly detailed, sharp focus, 35mm photograph",
   "illustration, drawing, line art, sketch, cartoon, anime, flat color"),
  ("flatcel", "flat-color graphic-novel illustration, ligne claire, bold clean black outlines, solid flat "
   "colours, cel shaded, no gradients, no texture, crisp edges, {d}, dramatic",
   "photo, photograph, photorealistic, realistic, gradient, soft shading, texture, grain, blurry"),
]
SHOTS = [
  ("01_city",   f"{OUTDIR}/01_wide-burning-city.png",
   "a wide view of a burning city street at dusk, smoke and fire over rows of buildings, distant people"),
  ("03_leap",   f"{OUTDIR}/03_leap-legs-denting-roof.png",
   "a man crashing down feet-first onto a rooftop, dust and debris, firelit smoky sky"),
  ("05_impact", f"{OUTDIR}/05_impact-landing-shockwave.png",
   "a man landing hard in a crouch on a city street sending out a shockwave, flying debris"),
]

def prep_canny(src, dst):
    im = cv2.imread(src); h, w = im.shape[:2]
    w16, h16 = (w // 16) * 16, (h // 16) * 16
    im = cv2.resize(im, (w16, h16))
    g = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY)
    cv2.imwrite(dst, cv2.cvtColor(cv2.Canny(g, 60, 160), cv2.COLOR_GRAY2BGR))
    return w16, h16

def graph(cn_name, prompt, neg, w, h, steps=24, guidance=3.5, strength=0.7, end=0.8, seed=7, prefix="photoreal"):
    return {
      "ckpt": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": "flux1-dev-fp8.safetensors"}},
      "pos":  {"class_type": "CLIPTextEncode", "inputs": {"text": prompt, "clip": ["ckpt", 1]}},
      "flux": {"class_type": "FluxGuidance", "inputs": {"conditioning": ["pos", 0], "guidance": guidance}},
      "neg":  {"class_type": "CLIPTextEncode", "inputs": {"text": neg, "clip": ["ckpt", 1]}},
      "cnet": {"class_type": "ControlNetLoader", "inputs": {"control_net_name": "flux-union-pro.safetensors"}},
      "union":{"class_type": "SetUnionControlNetType", "inputs": {"control_net": ["cnet", 0], "type": "canny"}},
      "cn":   {"class_type": "LoadImage", "inputs": {"image": cn_name}},
      "apply":{"class_type": "ControlNetApplyAdvanced", "inputs": {"positive": ["flux", 0], "negative": ["neg", 0],
               "control_net": ["union", 0], "image": ["cn", 0], "strength": strength, "start_percent": 0.0, "end_percent": end, "vae": ["ckpt", 2]}},
      "latent":{"class_type": "EmptySD3LatentImage", "inputs": {"width": w, "height": h, "batch_size": 1}},
      "noise":{"class_type": "RandomNoise", "inputs": {"noise_seed": seed}},
      "guider":{"class_type": "BasicGuider", "inputs": {"model": ["ckpt", 0], "conditioning": ["apply", 0]}},
      "sampler":{"class_type": "KSamplerSelect", "inputs": {"sampler_name": "euler"}},
      "sigmas":{"class_type": "BasicScheduler", "inputs": {"model": ["ckpt", 0], "scheduler": "simple", "steps": steps, "denoise": 1.0}},
      "samp": {"class_type": "SamplerCustomAdvanced", "inputs": {"noise": ["noise", 0], "guider": ["guider", 0],
               "sampler": ["sampler", 0], "sigmas": ["sigmas", 0], "latent_image": ["latent", 0]}},
      "dec":  {"class_type": "VAEDecode", "inputs": {"samples": ["samp", 0], "vae": ["ckpt", 2]}},
      "save": {"class_type": "SaveImage", "inputs": {"filename_prefix": prefix, "images": ["dec", 0]}},
    }

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--pod", default=None); ap.add_argument("--out", default="renders")
    a = ap.parse_args()
    pid = a.pod or Path("/tmp/pod_id").read_text().strip()
    out = HERE / a.out; out.mkdir(parents=True, exist_ok=True)
    pod = Pod(pid)
    if not pod.alive(): sys.exit(f"pod {pid} not reachable")
    time.sleep(10)
    done = []
    for name, src, desc in SHOTS:
        cpath = str(out / f"{name}_canny.png"); w, h = prep_canny(src, cpath)
        cn = pod.upload(cpath); print(f"  [{name}] uploaded canny {w}x{h} -> {cn}")
        for style, ptmpl, neg in STYLES:                          # photoreal AND flat-cel, same composition
            jid = pod.submit(graph(cn, ptmpl.format(d=desc), neg, w, h, prefix=f"{style}_{name}"))
            print(f"  [{name}/{style}] submitted {jid} — waiting…")
            hist = pod.wait(jid)
            if hist.get("status", {}).get("status_str") != "success":
                print(f"  [{name}/{style}] FAILED: {str(hist.get('status', {}))[:160]}"); continue
            pod.fetch(hist, str(out / f"{style}_{name}.png"))
            done.append(f"{style}_{name}"); print(f"  [{name}/{style}] SAVED")
    print("PHOTOREAL_MULTI_DONE", done)

if __name__ == "__main__":
    main()
