#!/usr/bin/env python3
"""
BLUELINE · NEW STORY — SHOT 05 ASSEMBLY (the payoff: the authored frame comes together).

Brings together everything learned this session:
  - WOMAN (foreground): girl_right_s4242 — openpose-first, obeys her skeleton (strength 0.95).
  - HERO (behind): hero_311 — authored openpose-first, camera-facing via the color convention, kneeling/bowed.
  - CROWD (background): gen-first plate, no central figure (no spatial relating needed).
  - MASKS: body-silhouette grown from each authored skeleton (not circles).
  - COMPOSITE order: crowd <- hero (behind) <- woman (front).
  - INTEGRATE: low-denoise img2img over the composite, conditioned on the COMBINED (hero+woman) openpose,
    to fuse the layers into one pen-flow drawing while preserving the authored staging.

  <comfy venv>/python assemble_s05.py
Outputs -> layers/s05_assembled_composite.png + s05_assembled_final.png
"""
import os
from PIL import Image, ImageDraw, ImageFilter
import render_shot as RS
import compose_pose as CP
import regen_girl as RG          # GIRL_LEFT + mirror (the woman skeleton)
import author_hero as AH         # HERO skeleton
from silhouette import silhouette_mask

HERE = os.path.dirname(os.path.abspath(__file__))
GP = os.path.join(HERE, "genpose"); LAY = os.path.join(HERE, "layers"); os.makedirs(LAY, exist_ok=True)
W, H = 1216, 832
SHARED = "burning noir city street at night, smoke and embers, cracked pavement"

def kp_px(kp_norm):
    return {i: (int(x * W), int(y * H)) for i, (x, y) in kp_norm.items()}

def knock_plate(img, amount):
    import numpy as np
    g = np.asarray(img).astype(np.float32); lum = g.mean(axis=2, keepdims=True)
    t = np.clip((lum - 200.0) / 55.0, 0, 1)
    return Image.fromarray(np.clip(g - t * amount * g, 0, 255).astype(np.uint8))

def combined_openpose():
    img = Image.new("RGB", (W, H), (0, 0, 0)); dr = ImageDraw.Draw(img)
    CP.draw_skeleton(dr, kp_px(AH.HERO))
    CP.draw_skeleton(dr, kp_px(RG.mirror(RG.GIRL_LEFT)))
    p = os.path.join(GP, "S05_assembled_openpose.png"); img.save(p)
    return p

def g_integrate(prompt, init_name, pose_name, seed, prefix, denoise, pose_strength=0.6):
    return {
      "ckpt": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": RS.CKPT}},
      "pos": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt, "clip": ["ckpt", 1]}},
      "neg": {"class_type": "CLIPTextEncode", "inputs": {"text": RS.NEG, "clip": ["ckpt", 1]}},
      "init": {"class_type": "LoadImage", "inputs": {"image": init_name}},
      "pose_img": {"class_type": "LoadImage", "inputs": {"image": pose_name}},
      "cn_pose": {"class_type": "ControlNetLoader", "inputs": {"control_net_name": RS.CN_POSE}},
      "ap": {"class_type": "ControlNetApplyAdvanced", "inputs": {"positive": ["pos", 0], "negative": ["neg", 0],
             "control_net": ["cn_pose", 0], "image": ["pose_img", 0], "strength": pose_strength, "start_percent": 0.0, "end_percent": 0.8}},
      "enc": {"class_type": "VAEEncode", "inputs": {"pixels": ["init", 0], "vae": ["ckpt", 2]}},
      "samp": {"class_type": "KSampler", "inputs": {"model": ["ckpt", 0], "positive": ["ap", 0], "negative": ["ap", 1],
               "latent_image": ["enc", 0], "seed": seed, "steps": 30, "cfg": 6.0, "sampler_name": "dpmpp_2m", "scheduler": "karras", "denoise": denoise}},
      "dec": {"class_type": "VAEDecode", "inputs": {"samples": ["samp", 0], "vae": ["ckpt", 2]}},
      "save": {"class_type": "SaveImage", "inputs": {"filename_prefix": prefix, "images": ["dec", 0]}},
    }

def main():
    # 1) CROWD background plate (gen-first, no central figure)
    bg_p = os.path.join(LAY, "s05_crowd_bg.png")
    crowd = ("a crowd of shocked noir figures recoiling in fear in the background of a burning city street, "
             "wide empty cracked asphalt in the foreground, no central figure, deep shadow")
    RS.run(RS.graph(f"{crowd}, {RS.STYLE_TXT}", W, H, 2025, "s05_crowd_bg"), bg_p)
    print("  [bg] crowd plate ->", os.path.basename(bg_p), flush=True)

    bg = Image.open(bg_p).convert("RGB").resize((W, H))

    # 2) HERO behind — silhouette from his authored skeleton
    hero = knock_plate(Image.open(os.path.join(GP, "hero_311.png")).convert("RGB").resize((W, H)), 0.25)
    hmask = silhouette_mask(kp_px(AH.HERO), W, H, feather=20, scale=1.18)
    stage = Image.composite(hero, bg, hmask)

    # 3) WOMAN front — silhouette from her authored skeleton (head-right)
    woman = knock_plate(Image.open(os.path.join(GP, "girl_right_s4242.png")).convert("RGB").resize((W, H)), 0.20)
    wmask = silhouette_mask(kp_px(RG.mirror(RG.GIRL_LEFT)), W, H, feather=20, scale=1.12)
    stage = Image.composite(woman, stage, wmask)

    comp_p = os.path.join(LAY, "s05_assembled_composite.png"); stage.save(comp_p)
    print("  [composite] crowd <- hero <- woman ->", os.path.basename(comp_p), flush=True)

    # 4) INTEGRATE — fuse, conditioned on the combined skeleton, low denoise to keep the staging
    op = combined_openpose()
    comp_up = RS.upload(comp_p); op_up = RS.upload(op)
    prompt = (f"a man kneeling and bowing over a dying woman lying on the cracked ground, a crowd recoiling "
              f"behind them, {SHARED}, {RS.STYLE_TXT}")
    for den in (0.30, 0.40):
        dest = os.path.join(LAY, f"s05_assembled_final_d{int(den*100)}.png")
        dt = RS.run(g_integrate(prompt, comp_up, op_up, 808, f"s05_asm_d{int(den*100)}", den), dest)
        print(f"  [integrate] den={den} ({dt:.0f}s) ->", os.path.basename(dest), flush=True)
    print("ASSEMBLE_DONE")

if __name__ == "__main__":
    main()
