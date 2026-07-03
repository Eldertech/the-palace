#!/usr/bin/env python3
"""
Local SDXL + canny ControlNet — convert the line drawings to PHOTOREAL and FLAT-CEL (same composition)
for the intermediate-domain segmentation test. Reliable, no cloud cold-boot. Writes
photoreal_<name>.png and flatcel_<name>.png next to the RunPod outputs so photoreal_multi_segment.py
picks them up unchanged.

  <comfy venv>/python local_convert.py
"""
import os
import cv2, numpy as np, torch
from PIL import Image
from diffusers import StableDiffusionXLControlNetPipeline, ControlNetModel

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "m3-warped-noise", "renders"); os.makedirs(OUT, exist_ok=True)
SRC = os.path.join(HERE, "..", "new-story", "out")
MODELS = "/Users/loudonstearns/Documents/The Palace/_tools/ComfyUI/models"
dev = "mps" if torch.backends.mps.is_available() else "cpu"
dt = torch.float16 if dev == "mps" else torch.float32

STYLES = [
  ("photoreal", "photorealistic cinematic film still, {d}, dramatic, highly detailed, sharp focus, 35mm photograph",
   "illustration, drawing, line art, sketch, cartoon, anime, flat color"),
  ("flatcel", "flat-color graphic-novel illustration, ligne claire, bold clean black outlines, solid flat "
   "colours, cel shaded, no gradients, no texture, crisp edges, {d}, dramatic",
   "photo, photograph, photorealistic, realistic, gradient, soft shading, texture, grain, blurry"),
]
SHOTS = [
  ("01_city",   "01_wide-burning-city.png", "a wide view of a burning city street at dusk, smoke and fire over rows of buildings, distant people"),
  ("03_leap",   "03_leap-legs-denting-roof.png", "a man crashing down feet-first onto a rooftop, dust and debris, firelit smoky sky"),
  ("05_impact", "05_impact-landing-shockwave.png", "a man landing hard in a crouch on a city street sending out a shockwave, flying debris"),
]

print("loading SDXL + canny controlnet on", dev, dt)
cn = ControlNetModel.from_single_file(MODELS + "/controlnet/controlnet-canny-sdxl.safetensors", torch_dtype=dt)
# from_pretrained (not single_file): transformers 5.x renamed CLIPTextModel internals and breaks
# diffusers' single-file CLIP converter; from_pretrained loads CLIP via transformers' own loader.
pipe = StableDiffusionXLControlNetPipeline.from_pretrained(
    "stabilityai/stable-diffusion-xl-base-1.0", controlnet=cn, torch_dtype=dt,
    variant="fp16" if dt == torch.float16 else None, use_safetensors=True)
pipe.to(dev); pipe.set_progress_bar_config(disable=True)   # diffusers auto-upcasts the VAE itself (manual upcast caused a dtype mismatch)

def canny_of(path):
    im = cv2.imread(path); h, w = im.shape[:2]
    s = 1024.0 / max(h, w); W = int(round(w * s / 8)) * 8; H = int(round(h * s / 8)) * 8
    im = cv2.resize(im, (W, H)); e = cv2.Canny(cv2.cvtColor(im, cv2.COLOR_BGR2GRAY), 60, 160)
    return Image.fromarray(cv2.cvtColor(e, cv2.COLOR_GRAY2RGB)), W, H

for name, fn, desc in SHOTS:
    cimg, W, H = canny_of(os.path.join(SRC, fn))
    for style, pt, neg in STYLES:
        p = os.path.join(OUT, f"{style}_{name}.png")
        if os.path.exists(p): print("skip (done)", style, name, flush=True); continue
        g = torch.Generator(device=dev).manual_seed(7)
        out = pipe(prompt=pt.format(d=desc), negative_prompt=neg, image=cimg,
                   controlnet_conditioning_scale=0.7, num_inference_steps=20, guidance_scale=6.5,
                   width=W, height=H, generator=g).images[0]
        out.save(p)
        arr = np.asarray(out); print(f"SAVED {style}_{name} {W}x{H} mean={arr.mean():.0f}", flush=True)  # mean~0 => MPS NaN
print("LOCAL_CONVERT_DONE")
