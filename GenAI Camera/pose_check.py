#!/usr/bin/env python3
"""Functional test: does the pose ControlNet actually take? Generate from POSE ALONE (txt2img,
strength 1.0) with the THIN plate (my old hand-rolled draw) vs the THICK plate (real controlnet_aux
draw). If only the thick one adopts the arms-spread stance, the thin plate was the bug."""
import os, json
import genai_camera as g
from PIL import Image, ImageDraw

DIR = g.DIR; FIG = "sorceress"
PROMPT = "a warrior standing, arms out to the sides, dramatic manga ink"
d = json.load(open(os.path.join(DIR, f"keypoints_{FIG}.json"))); W, H = d["res"]; kps = d["keypoints"]

# figure bbox -> portrait gen frame (pose fills the frame)
xs = [x for x, y, v in kps if v]; ys = [y for x, y, v in kps if v]
x0, y0, x1, y1 = int(min(xs)-70), int(min(ys)-70), int(max(xs)+70), int(max(ys)+70)
bw, bh = x1-x0, y1-y0; GH = 1024; GW = max(512, min(1024, (int(GH*bw/bh)//8)*8))

# THIN plate (old inline draw)
thin = Image.new("RGB", (W, H), (0, 0, 0)); dr = ImageDraw.Draw(thin)
for i, (a, b) in enumerate(g._LIMBS):
    if kps[a][2] and kps[b][2]: dr.line([tuple(kps[a][:2]), tuple(kps[b][:2])], fill=g._COLORS[i % 18], width=4)
for i, (x, y, v) in enumerate(kps):
    if v: dr.ellipse([x-4, y-4, x+4, y+4], fill=g._COLORS[i])
# THICK plate (real controlnet_aux via the fixed draw_openpose)
g.draw_openpose(os.path.join(DIR, f"keypoints_{FIG}.json"), os.path.join(DIR, "_pose_thick.png"))
thick = Image.open(os.path.join(DIR, "_pose_thick.png")).convert("RGB")

def prep(im, tag):
    c = im.crop((x0, y0, x1, y1)).resize((GW, GH)); p = os.path.join(DIR, f"_pc_{tag}.png"); c.save(p); return p, c
tp, tc = prep(thin, "thin"); kp_, kc = prep(thick, "thick")

def pose_txt2img(pose_up, seed=7):
    return {
      "ckpt": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": g.CKPT}},
      "lora": {"class_type": "LoraLoader", "inputs": {"model": ["ckpt", 0], "clip": ["ckpt", 1], "lora_name": g.LORA, "strength_model": 1.0, "strength_clip": 1.0}},
      "pos": {"class_type": "CLIPTextEncode", "inputs": {"text": f"{PROMPT}, {g.PENFLOW}", "clip": ["lora", 1]}},
      "neg": {"class_type": "CLIPTextEncode", "inputs": {"text": g.NEG, "clip": ["lora", 1]}},
      "lat": {"class_type": "EmptyLatentImage", "inputs": {"width": GW, "height": GH, "batch_size": 1}},
      "cnl": {"class_type": "ControlNetLoader", "inputs": {"control_net_name": g.CN["pose"]}},
      "pim": {"class_type": "LoadImage", "inputs": {"image": pose_up}},
      "ap": {"class_type": "ControlNetApplyAdvanced", "inputs": {"positive": ["pos", 0], "negative": ["neg", 0], "control_net": ["cnl", 0], "image": ["pim", 0], "strength": 1.0, "start_percent": 0.0, "end_percent": 0.9}},
      "samp": {"class_type": "KSampler", "inputs": {"model": ["lora", 0], "positive": ["ap", 0], "negative": ["ap", 1], "latent_image": ["lat", 0], "seed": seed, "steps": 8, "cfg": 1.8, "sampler_name": "euler", "scheduler": "sgm_uniform", "denoise": 1.0}},
      "dec": {"class_type": "VAEDecode", "inputs": {"samples": ["samp", 0], "vae": ["ckpt", 2]}},
      "save": {"class_type": "SaveImage", "inputs": {"filename_prefix": "posechk", "images": ["dec", 0]}},
    }

gen_thin = g._to_pil(g.run_graph(pose_txt2img(g.upload(tp)))[0]); print("  thin gen done", flush=True)
gen_thick = g._to_pil(g.run_graph(pose_txt2img(g.upload(kp_)))[0]); print("  thick gen done", flush=True)

# compose: row1 THIN [plate | result], row2 THICK [plate | result]
from PIL import ImageFont
def font(s):
    for p in ("/System/Library/Fonts/Helvetica.ttc",):
        if os.path.exists(p): return ImageFont.truetype(p, s)
    return ImageFont.load_default()
CH = 480; cw = int(GW*CH/GH); pad = 10; lab = 30
sheet = Image.new("RGB", (cw*2+pad*3, (CH+lab)*2+pad*3), (12, 12, 18)); dr = ImageDraw.Draw(sheet); f = font(22)
rows = [("THIN plate (mine)", tc, gen_thin), ("THICK plate (controlnet_aux)", kc, gen_thick)]
for r, (name, plate, res) in enumerate(rows):
    y = pad + lab + r*(CH+lab+pad)
    dr.text((pad, y-lab+5), name + "  →  pose-only txt2img @1.0", font=f, fill=(232, 184, 74))
    sheet.paste(plate.resize((cw, CH)), (pad, y)); sheet.paste(res.resize((cw, CH)), (pad*2+cw, y))
out = os.path.join(DIR, "renders", "pose_check.png"); sheet.save(out)
g.emit(sheet, "proof", {"prompt": "pose ControlNet check", "denoise": 1.0, "seed": 7, "dt": 0,
        "note": "does pose take? pose-only txt2img @1.0. THIN plate (my old draw) vs THICK plate (real controlnet_aux). If only thick adopts arms-out, the thin plate was the bug."},
       [("thin plate", tp), ("thick plate", kp_)])
print("POSE_CHECK_DONE ->", out)
