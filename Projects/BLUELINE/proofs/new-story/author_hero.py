#!/usr/bin/env python3
"""
BLUELINE · NEW STORY — SHOT 05 HERO, authored OPENPOSE-FIRST (the method correction).

The gen-first hero had an opaque facing that read wrong ("back and to the right", mis-read as down-left).
Fix per Loudon: AUTHOR the hero so his facing is known by construction. Key lever he flagged — the OpenPose
LIMB COLORS encode left/right, so the model reads front/back from them: a CAMERA-FACING figure puts his
anatomical RIGHT limbs (warm: red/orange/yellow arm, green leg) on the IMAGE LEFT (mirror), with frontal
face keypoints (both eyes + ears). So the hero kneels BEHIND/above the woman's head, FACING the camera and
bowed DOWN toward her — encoded by warm-limbs-on-left + frontal face + a 'seen from the front, looking down'
prompt + strong pose conditioning (the 0.95 that made the woman obey).

  <comfy venv>/python author_hero.py --seeds 311 909
Outputs -> genpose/hero_<seed>.png + hero_<seed>_check.png ([openpose | render] facing eyeball)
"""
import os, argparse
from PIL import Image, ImageDraw
import render_shot as RS
import compose_pose as CP

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "genpose"); os.makedirs(OUT, exist_ok=True)
W, H = 1216, 832
SHARED = "burning noir city street at night, smoke and embers, cracked pavement"

# Hero KNEELING, leaning forward, FACING THE CAMERA, head bowed DOWN toward the woman (whose head sits at
# ~x0.56,y0.66 in the head-right staging). Anatomical RIGHT on the IMAGE LEFT => warm limbs on our left =>
# reads camera-facing. One hand reaches down-forward toward her head. COCO-18 normalized.
HERO = {
    0:(.575,.30),                                   # nose (head, bowed)
    14:(.560,.285),15:(.590,.285),16:(.545,.30),17:(.605,.30),  # eyes/ears — frontal (camera-facing)
    1:(.58,.37),                                     # neck
    2:(.52,.38), 3:(.49,.47), 4:(.50,.57),          # R arm (warm) on the LEFT, reaching DOWN toward her
    5:(.64,.38), 6:(.68,.47), 7:(.66,.57),          # L arm (cool) on the RIGHT
    8:(.54,.55), 9:(.50,.66), 10:(.52,.74),         # R leg kneeling
    11:(.63,.55),12:(.67,.66),13:(.65,.74),         # L leg kneeling
}

def author_openpose(kp_norm, name):
    img = Image.new("RGB", (W, H), (0, 0, 0)); dr = ImageDraw.Draw(img)
    kp_px = {i: (int(x * W), int(y * H)) for i, (x, y) in kp_norm.items()}
    CP.draw_skeleton(dr, kp_px)
    p = os.path.join(OUT, f"{name}_openpose.png"); img.save(p)
    return p

def graph_strong(prompt, seed, prefix, pose_name, pose_strength=0.9, end_pct=0.9):
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

def side_by_side(op, render, out):
    a = Image.open(op).convert("RGB"); b = Image.open(render).convert("RGB").resize((W, H))
    g = Image.new("RGB", (W, H * 2 + 8), (12, 12, 12)); g.paste(a, (0, 0)); g.paste(b, (0, H + 8)); g.save(out)

PROMPT = ("a powerful man in a long coat kneeling low on the cracked ground, seen from the front, his head "
          "bowed looking down, reaching one hand forward and down, grief and shock, dynamic")

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--seeds", type=int, nargs="+", default=[311, 909])
    ap.add_argument("--pose-strength", type=float, default=0.9)
    a = ap.parse_args()
    op = author_openpose(HERO, "hero"); op_up = RS.upload(op)
    prompt = f"{PROMPT}, {SHARED}, {RS.STYLE_TXT}"
    for sd in a.seeds:
        dest = os.path.join(OUT, f"hero_{sd}.png")
        dt = RS.run(graph_strong(prompt, sd, f"hero_{sd}", op_up, a.pose_strength), dest)
        chk = os.path.join(OUT, f"hero_{sd}_check.png"); side_by_side(op, dest, chk)
        print(f"  [hero] seed={sd} ps={a.pose_strength} ({dt:.0f}s) -> {os.path.basename(dest)} | check {os.path.basename(chk)}", flush=True)
    print("AUTHOR_HERO_DONE")
