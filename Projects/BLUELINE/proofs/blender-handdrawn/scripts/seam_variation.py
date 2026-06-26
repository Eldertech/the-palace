"""
BLUELINE seam · VARIATION study — how much does the gen-AI redraw vary across seeds
from one fixed Blender init? Uses the winning d0.95 / canny~0.42 recipe, 8 seeds.
Output: stylized/variation/var_seed_####.png
"""
import json, os, shutil, time, urllib.request, uuid
SERVER = "127.0.0.1:8188"
ROOT = "/Users/loudonstearns/Documents/The Palace/Projects/BLUELINE/proofs/blender-handdrawn"
COMFY = "/Users/loudonstearns/Documents/The Palace/_tools/ComfyUI"
INDIR, OUTDIR = os.path.join(COMFY, "input"), os.path.join(COMFY, "output")
DST = os.path.join(ROOT, "stylized", "variation"); os.makedirs(DST, exist_ok=True)
LOCK = json.load(open(os.path.join(ROOT, "..", "style-lock", "locked-style.json")))
INK = ("stark black and white pen and ink illustration, sumi-e brush, manga inking, "
       "heavy spotted blacks, bold dramatic sweeping flow lines and speed streaks, "
       "scattered energetic ink splatter, rough white paper, lots of white space, "
       "film-noir deep shadow, loose gestural linework, low canted angle")
SCENE = "a burning city street at night, tall buildings, a lone figure, smoke rising"
NEG = LOCK["neg_extra"]

def stage(rel, name):
    shutil.copyfile(os.path.join(ROOT, "blender", rel), os.path.join(INDIR, name)); return name

def graph(init_img, ctrl_img, seed):
    return {
      "ckpt": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": "sd_xl_base_1.0.safetensors"}},
      "pos": {"class_type": "CLIPTextEncode", "inputs": {"text": f"{INK}, {SCENE}", "clip": ["ckpt", 1]}},
      "neg": {"class_type": "CLIPTextEncode", "inputs": {"text": NEG, "clip": ["ckpt", 1]}},
      "init": {"class_type": "LoadImage", "inputs": {"image": init_img}},
      "ctrl": {"class_type": "LoadImage", "inputs": {"image": ctrl_img}},
      "canny": {"class_type": "Canny", "inputs": {"image": ["ctrl", 0], "low_threshold": 0.15, "high_threshold": 0.4}},
      "cnet": {"class_type": "ControlNetLoader", "inputs": {"control_net_name": "controlnet-canny-sdxl.safetensors"}},
      "cna": {"class_type": "ControlNetApplyAdvanced", "inputs": {"positive": ["pos", 0], "negative": ["neg", 0],
              "control_net": ["cnet", 0], "image": ["canny", 0], "strength": 0.42, "start_percent": 0.0, "end_percent": 0.5, "vae": ["ckpt", 2]}},
      "venc": {"class_type": "VAEEncode", "inputs": {"pixels": ["init", 0], "vae": ["ckpt", 2]}},
      "ks": {"class_type": "KSampler", "inputs": {"model": ["ckpt", 0], "positive": ["cna", 0], "negative": ["cna", 1],
             "latent_image": ["venc", 0], "seed": seed, "steps": 26, "cfg": 7.5, "sampler_name": "dpmpp_2m", "scheduler": "karras", "denoise": 0.95}},
      "vd": {"class_type": "VAEDecode", "inputs": {"samples": ["ks", 0], "vae": ["ckpt", 2]}},
      "sv": {"class_type": "SaveImage", "inputs": {"images": ["vd", 0], "filename_prefix": "seam_var"}},
    }

def queue(g):
    cid = str(uuid.uuid4())
    req = urllib.request.Request(f"http://{SERVER}/prompt", data=json.dumps({"prompt": g, "client_id": cid}).encode(),
                                headers={"Content-Type": "application/json"})
    pid = json.loads(urllib.request.urlopen(req).read())["prompt_id"]; t0 = time.time()
    while True:
        time.sleep(2)
        h = json.loads(urllib.request.urlopen(f"http://{SERVER}/history/{pid}").read())
        if pid in h:
            for node in h[pid]["outputs"].values():
                for im in node.get("images", []):
                    return os.path.join(OUTDIR, im.get("subfolder", ""), im["filename"]), time.time() - t0
        if time.time() - t0 > 1800: raise TimeoutError()

init_n = stage("city_toon.png", "var_init.png"); ctrl_n = stage("city_ink.png", "var_ctrl.png")
for i, seed in enumerate([11, 222, 1337, 4242, 55555, 70707, 88, 9001]):
    print(f"[var {i}] seed {seed} ...", flush=True)
    out, dt = queue(graph(init_n, ctrl_n, seed))
    shutil.copyfile(out, os.path.join(DST, f"var_seed_{seed:05d}.png"))
    print(f"[var {i}] {dt:.0f}s", flush=True)
print("VARIATION DONE")
