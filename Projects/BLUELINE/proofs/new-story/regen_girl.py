#!/usr/bin/env python3
"""
BLUELINE · NEW STORY — SHOT 05 GIRL RE-STAGING (fixing the staging bug Loudon caught).

The proven girl.png does NOT lie the way its hand-placed openpose says: the skeleton is head-LEFT/feet-right
but SDXL rendered her head-RIGHT (blonde hair flowing right). Cause: pose conditioning was too weak
(strength 0.6, end 0.7) to hold orientation on a LYING figure (the documented hard case). So the composite
was built on a contradiction — no denoise tuning fixes that. Fix = re-generate the woman so her RENDER obeys
a clean intended direction: a cleaner horizontal lying skeleton + STRONG pose conditioning (0.95 / end 0.95)
+ explicit orientation language in the prompt. Render both directions so Loudon picks the staging by eye.

Outputs, per candidate: the openpose viz, the render, and an [openpose | render] side-by-side for the
direction-match eyeball (the cheap assess step before anything is composited or paid for).

  <comfy venv>/python regen_girl.py            # both directions x 2 seeds
  <comfy venv>/python regen_girl.py --dir left --seeds 4242
"""
import os, argparse
from PIL import Image, ImageDraw
import render_shot as RS      # run/upload/req, STYLE_TXT, NEG, CKPT, CN_POSE
import compose_pose as CP     # draw_skeleton (staging_skeleton LIMBS/COLORS)

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "genpose"); os.makedirs(OUT, exist_ok=True)
W, H = 1216, 832
SHARED = "burning noir city street at night, smoke and embers, cracked pavement"

# A CLEAN lying woman on her back, head-LEFT, low in the foreground: near (right) arm reaching weakly UP
# toward the hero, far (left) arm resting along the ground, legs splayed to the right. COCO-18 normalized.
GIRL_LEFT = {
    0:(.15,.70), 14:(.135,.685),15:(.165,.685),16:(.12,.70),17:(.18,.70),  # head/face at far left
    1:(.23,.71),                                                            # neck
    2:(.26,.69), 3:(.30,.59), 4:(.34,.50),                                  # R arm reaching UP
    5:(.26,.74), 6:(.33,.80), 7:(.40,.84),                                  # L arm along the ground
    8:(.48,.71), 9:(.60,.69), 10:(.73,.70),                                 # R leg splayed
    11:(.48,.76),12:(.60,.79),13:(.73,.81),                                 # L leg
}

def mirror(kp):
    return {i: (1.0 - x, y) for i, (x, y) in kp.items()}

def author_openpose(kp_norm, name):
    img = Image.new("RGB", (W, H), (0, 0, 0)); dr = ImageDraw.Draw(img)
    kp_px = {i: (int(x * W), int(y * H)) for i, (x, y) in kp_norm.items()}
    CP.draw_skeleton(dr, kp_px)
    p = os.path.join(OUT, f"{name}_openpose.png"); img.save(p)
    return p

def graph_strong(prompt, seed, prefix, pose_name, pose_strength, end_pct):
    return {
      "ckpt": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": RS.CKPT}},
      "pos": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt, "clip": ["ckpt", 1]}},
      "neg": {"class_type": "CLIPTextEncode", "inputs": {"text": RS.NEG, "clip": ["ckpt", 1]}},
      "latent": {"class_type": "EmptyLatentImage", "inputs": {"width": W, "height": H, "batch_size": 1}},
      "pose_img": {"class_type": "LoadImage", "inputs": {"image": pose_name}},
      "cn_pose": {"class_type": "ControlNetLoader", "inputs": {"control_net_name": RS.CN_POSE}},
      "ap": {"class_type": "ControlNetApplyAdvanced", "inputs": {"positive": ["pos", 0], "negative": ["neg", 0],
             "control_net": ["cn_pose", 0], "image": ["pose_img", 0], "strength": pose_strength, "start_percent": 0.0, "end_percent": end_pct}},
      "samp": {"class_type": "KSampler", "inputs": {"model": ["ckpt", 0], "positive": ["ap", 0], "negative": ["ap", 1],
               "latent_image": ["latent", 0], "seed": seed, "steps": 30, "cfg": 6.5, "sampler_name": "dpmpp_2m", "scheduler": "karras", "denoise": 1.0}},
      "dec": {"class_type": "VAEDecode", "inputs": {"samples": ["samp", 0], "vae": ["ckpt", 2]}},
      "save": {"class_type": "SaveImage", "inputs": {"filename_prefix": prefix, "images": ["dec", 0]}},
    }

PROMPT = {
  "left":  "a young woman lying on her back collapsed on the cracked ground, her head at the LEFT side of the frame and feet to the right, one arm reaching weakly upward, dark hair spilling on the pavement, foreground",
  "right": "a young woman lying on her back collapsed on the cracked ground, her head at the RIGHT side of the frame and feet to the left, one arm reaching weakly upward, dark hair spilling on the pavement, foreground",
}

def side_by_side(op_path, render_path, out_path):
    a = Image.open(op_path).convert("RGB"); b = Image.open(render_path).convert("RGB").resize((W, H))
    g = Image.new("RGB", (W, H * 2 + 8), (12, 12, 12))
    g.paste(a, (0, 0)); g.paste(b, (0, H + 8)); g.save(out_path)

def run_dir(direction, seeds, pose_strength, end_pct):
    kp = GIRL_LEFT if direction == "left" else mirror(GIRL_LEFT)
    op = author_openpose(kp, f"girl_{direction}")
    op_up = RS.upload(op)
    prompt = f"{PROMPT[direction]}, {SHARED}, {RS.STYLE_TXT}"
    for sd in seeds:
        name = f"girl_{direction}_s{sd}"
        dest = os.path.join(OUT, f"{name}.png")
        dt = RS.run(graph_strong(prompt, sd, name, op_up, pose_strength, end_pct), dest)
        sbs = os.path.join(OUT, f"{name}_check.png"); side_by_side(op, dest, sbs)
        print(f"  [girl] {direction} seed={sd} ps={pose_strength} ({dt:.0f}s) -> {os.path.basename(dest)} | check {os.path.basename(sbs)}", flush=True)

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", choices=["left", "right", "both"], default="both")
    ap.add_argument("--seeds", type=int, nargs="+", default=[4242, 7777])
    ap.add_argument("--pose-strength", type=float, default=0.95)
    ap.add_argument("--end-pct", type=float, default=0.95)
    a = ap.parse_args()
    dirs = ["left", "right"] if a.dir == "both" else [a.dir]
    for d in dirs:
        run_dir(d, a.seeds, a.pose_strength, a.end_pct)
    print("REGEN_GIRL_DONE")
