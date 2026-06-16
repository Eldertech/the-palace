#!/usr/bin/env python3
"""
BLUELINE Track II — grading render (runs on a GPU pod).

Renders r4ng3r across 4 NEW scenes with a DIFFERENT seed each (where seed-locking can't
help) for both the FLUX and SDXL LoRA, plus a no-LoRA baseline on the same scenes. The
local consistency_ruler.py then scores pairwise embed_cos within each set: high embed_cos
across different seeds == the LoRA holds identity. Bar to beat: Track V's 0.82.
"""
import torch, os
os.makedirs("/workspace/grade", exist_ok=True)

SEEDS  = [101, 202, 303, 404]
SCENES = [
    "sitting on a mossy rock beside a river, full body, soft daylight",
    "running through tall grass, dynamic three-quarter view, full body",
    "kneeling to examine tracks on the forest floor, full body",
    "standing on a cliff edge at sunset, looking to the horizon, full body",
]
TRIG = "r4ng3r"
DESC = "a young woman ranger, freckled, auburn braid, weathered green hooded cloak over leather armor"

vram = torch.cuda.get_device_properties(0).total_memory / 1e9
print(f"GPU {torch.cuda.get_device_name(0)} {vram:.0f}GB", flush=True)
BIG = vram >= 40

def gen(pipe, prompts, tag, **kw):
    for i, (p, s) in enumerate(zip(prompts, SEEDS)):
        g = torch.Generator("cpu").manual_seed(s)
        img = pipe(p, generator=g, **kw).images[0]
        out = f"/workspace/grade/{tag}_{i}_seed{s}.png"
        img.save(out); print("saved", out, flush=True)

# ---------- FLUX ----------
from diffusers import FluxPipeline
print("loading FLUX.1-dev ...", flush=True)
flux = FluxPipeline.from_pretrained("black-forest-labs/FLUX.1-dev", torch_dtype=torch.bfloat16)
flux.load_lora_weights("/workspace/r4ng3r_flux_lora.safetensors")
if BIG: flux.to("cuda")
else:   flux.enable_model_cpu_offload()
gen(flux, [f"{TRIG}, {sc}, cinematic" for sc in SCENES], "flux_lora",
    num_inference_steps=24, guidance_scale=3.5, height=1024, width=1024)
flux.unload_lora_weights()
gen(flux, [f"{DESC}, {sc}, cinematic" for sc in SCENES], "flux_base",
    num_inference_steps=24, guidance_scale=3.5, height=1024, width=1024)
del flux; torch.cuda.empty_cache()

# ---------- SDXL ----------
from diffusers import StableDiffusionXLPipeline
print("loading SDXL base ...", flush=True)
sdxl = StableDiffusionXLPipeline.from_pretrained(
    "stabilityai/stable-diffusion-xl-base-1.0", torch_dtype=torch.float16, variant="fp16", use_safetensors=True)
sdxl.to("cuda")
sdxl.load_lora_weights("/workspace/r4ng3r_sdxl.safetensors")
NEG = "lowres, bad anatomy, worst quality, blurry"
gen(sdxl, [f"{TRIG}, {sc}, cinematic" for sc in SCENES], "sdxl_lora",
    negative_prompt=NEG, num_inference_steps=30, guidance_scale=6.5, height=1024, width=1024)
sdxl.unload_lora_weights()
gen(sdxl, [f"{DESC}, {sc}, cinematic" for sc in SCENES], "sdxl_base",
    negative_prompt=NEG, num_inference_steps=30, guidance_scale=6.5, height=1024, width=1024)
print("GRADE_RENDER_DONE", flush=True)
