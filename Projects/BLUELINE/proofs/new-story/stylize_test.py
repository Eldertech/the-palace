#!/usr/bin/env python3
"""
BLUELINE · FRAME DESIGNER — STYLIZE-LAST tuning (reach the locked pen-flow from the rich composite).

The rich+sharp+depth composite is validated; the only miss was the final pen-flow pass (img2img at 0.55-0.65
kept the init's COLOR). Hypothesis: the rich composite's job is done once it carries sharp edges + depth +
form, so DESATURATE it first (the greyscale value structure IS the depth) and run the locked pen-flow at
HIGHER denoise so the model re-draws in the sparse ink idiom (pose ControlNet holds the staging). Reuses the
existing layers/rich_composite.png + genpose/rich_combined_op.png — no figure re-render.

  <comfy venv>/python stylize_test.py --pod <id>
Sweep: desaturated init @ denoise 0.70/0.80/0.90  + a color-init @ 0.90 control (is desaturation the lever?).
Outputs -> layers/stylize_desat_d{70,80,90}.png + stylize_color_d90.png + rich_composite_desat.png
"""
import os, json, argparse
from PIL import Image, ImageEnhance
import render_shot as RS
from pod_backend import Backend

BK = Backend(None)
HERE = os.path.dirname(os.path.abspath(__file__))
GP = os.path.join(HERE, "genpose"); LAY = os.path.join(HERE, "layers")
STYLE = json.load(open(os.path.join(HERE, "..", "style-lock", "locked-style.json")))["style"]

def desaturate(img, contrast=1.25):
    g = img.convert("L")
    if contrast != 1.0: g = ImageEnhance.Contrast(g).enhance(contrast)
    return g.convert("RGB")

def g_stylize(prompt, init, pose, seed, prefix, denoise, pose_strength=0.6, end=0.75):
    return {
      "ckpt": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": RS.CKPT}},
      "pos": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt, "clip": ["ckpt", 1]}},
      "neg": {"class_type": "CLIPTextEncode", "inputs": {"text": RS.NEG, "clip": ["ckpt", 1]}},
      "init": {"class_type": "LoadImage", "inputs": {"image": init}},
      "pimg": {"class_type": "LoadImage", "inputs": {"image": pose}},
      "cn": {"class_type": "ControlNetLoader", "inputs": {"control_net_name": RS.CN_POSE}},
      "ap": {"class_type": "ControlNetApplyAdvanced", "inputs": {"positive": ["pos", 0], "negative": ["neg", 0],
             "control_net": ["cn", 0], "image": ["pimg", 0], "strength": pose_strength, "start_percent": 0.0, "end_percent": end}},
      "enc": {"class_type": "VAEEncode", "inputs": {"pixels": ["init", 0], "vae": ["ckpt", 2]}},
      "samp": {"class_type": "KSampler", "inputs": {"model": ["ckpt", 0], "positive": ["ap", 0], "negative": ["ap", 1],
               "latent_image": ["enc", 0], "seed": seed, "steps": 30, "cfg": 6.5, "sampler_name": "dpmpp_2m", "scheduler": "karras", "denoise": denoise}},
      "dec": {"class_type": "VAEDecode", "inputs": {"samples": ["samp", 0], "vae": ["ckpt", 2]}},
      "save": {"class_type": "SaveImage", "inputs": {"filename_prefix": prefix, "images": ["dec", 0]}},
    }

def main():
    comp = Image.open(os.path.join(LAY, "rich_composite.png")).convert("RGB")
    desat = desaturate(comp); desat_p = os.path.join(LAY, "rich_composite_desat.png"); desat.save(desat_p)
    color_p = os.path.join(LAY, "rich_composite.png")
    pose_p = os.path.join(GP, "rich_combined_op.png")
    prompt = f"a man kneeling over a dying woman on the cracked ground, a crowd recoiling behind, {STYLE}"
    desat_up = BK.upload(desat_p); color_up = BK.upload(color_p); pose_up = BK.upload(pose_p)
    print("  [desat] saved + uploaded", flush=True)
    runs = [("desat", desat_up, 0.70), ("desat", desat_up, 0.80), ("desat", desat_up, 0.90),
            ("color", color_up, 0.90)]   # last = control: does desaturation matter, or just denoise?
    for tag, init, den in runs:
        name = f"stylize_{tag}_d{int(den*100)}"
        dest = os.path.join(LAY, f"{name}.png")
        dt = BK.run(g_stylize(prompt, init, pose_up, 909, name, den), dest)
        print(f"  [stylize] {tag} den={den} ({dt:.0f}s) -> {os.path.basename(dest)}", flush=True)
    print("STYLIZE_TEST_DONE")

if __name__ == "__main__":
    ap = argparse.ArgumentParser(); ap.add_argument("--pod", default=None); a = ap.parse_args()
    BK = Backend(a.pod); print(f"backend: {'pod '+a.pod if a.pod else 'local'}", flush=True)
    main()
