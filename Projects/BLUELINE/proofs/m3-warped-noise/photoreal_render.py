#!/usr/bin/env python3
"""
PHOTOREAL-FIRST decomposition test — convert the line drawing to photoreal (FLUX + canny ControlNet,
same composition) so segmentation/depth/infill can work in the domain they're trained on, then we
re-apply line art per cel. Tests whether the car (invisible as line-art) becomes a solid, segmentable
object in photoreal.

Driven by m3_pod_orchestrator (owns the FLUX pod lifecycle):
  python3 m3_pod_orchestrator.py --render-script photoreal_render.py
"""
import argparse, os, sys, time
from pathlib import Path
import cv2
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from m3_pod_render import Pod                                   # hardened curl transport (UA + retry)

SHOT = "/Users/loudonstearns/Documents/palace-feature-blueline-m3/Projects/BLUELINE/proofs/new-story/out/02_hero-on-sedan-pointing.png"
PROMPT = ("photorealistic cinematic film still, a man in a dark suit standing in the middle of a burning "
          "city street at night, two parked sedans, raging fire and billowing smoke, orange firelight, "
          "dramatic, highly detailed, sharp focus, 35mm photograph")
NEG = "illustration, drawing, line art, sketch, ink, cartoon, anime, comic"

def canny(src, dst):
    g = cv2.cvtColor(cv2.imread(src), cv2.COLOR_BGR2GRAY)
    cv2.imwrite(dst, cv2.cvtColor(cv2.Canny(g, 60, 160), cv2.COLOR_GRAY2BGR))

def graph(cn_name, w=832, h=1216, steps=24, guidance=3.5, strength=0.7, end=0.8, seed=7):
    return {
      "ckpt": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": "flux1-dev-fp8.safetensors"}},
      "pos":  {"class_type": "CLIPTextEncode", "inputs": {"text": PROMPT, "clip": ["ckpt", 1]}},
      "flux": {"class_type": "FluxGuidance", "inputs": {"conditioning": ["pos", 0], "guidance": guidance}},
      "neg":  {"class_type": "CLIPTextEncode", "inputs": {"text": NEG, "clip": ["ckpt", 1]}},
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
      "save": {"class_type": "SaveImage", "inputs": {"filename_prefix": "photoreal", "images": ["dec", 0]}},
    }

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--pod", default=None); ap.add_argument("--out", default="renders")
    a = ap.parse_args()
    pid = a.pod or Path("/tmp/pod_id").read_text().strip()
    out = HERE / a.out; out.mkdir(parents=True, exist_ok=True)
    cpath = str(out / "shot02_canny.png"); canny(SHOT, cpath)
    pod = Pod(pid)
    if not pod.alive(): sys.exit(f"pod {pid} not reachable")
    time.sleep(10)
    cn = pod.upload(cpath); print("  uploaded canny ->", cn)
    jid = pod.submit(graph(cn)); print("  submitted", jid, "— waiting…")
    hist = pod.wait(jid)
    if hist.get("status", {}).get("status_str") != "success":
        raise RuntimeError("render failed: " + str(hist.get("status", {}))[:300])
    dest = pod.fetch(hist, str(out / "photoreal_shot02.png"))
    print("PHOTOREAL_DONE", dest)

if __name__ == "__main__":
    main()
