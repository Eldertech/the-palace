"""
BLUELINE — stylize Blender renders into the locked 'pen-flow' style via local ComfyUI.
SDXL img2img + Canny ControlNet:
  * init image  = a Blender render (carries composition / value)
  * control     = the Blender Freestyle line render -> Canny (locks structure)
  * prompt      = the locked pen-flow style string (from locked-style.json)

Usage: python3 02_stylize.py
Requires ComfyUI running on 127.0.0.1:8188 with sd_xl_base_1.0 + controlnet-canny-sdxl.
"""
import json, os, shutil, time, urllib.request, uuid

SERVER = "127.0.0.1:8188"
ROOT = "/Users/loudonstearns/Documents/The Palace/Projects/BLUELINE/proofs/blender-handdrawn"
COMFY = "/Users/loudonstearns/Documents/The Palace/_tools/ComfyUI"
INDIR = os.path.join(COMFY, "input")
OUTDIR = os.path.join(COMFY, "output")
DSTDIR = os.path.join(ROOT, "stylized")
os.makedirs(DSTDIR, exist_ok=True)

LOCK = json.load(open(os.path.join(ROOT, "..", "style-lock", "locked-style.json")))
STYLE = LOCK["style"]
NEG = LOCK["neg_extra"]
print("pen-flow style:", STYLE[:80], "...")

def stage(src_rel, name):
    src = os.path.join(ROOT, "blender", src_rel)
    dst = os.path.join(INDIR, name)
    shutil.copyfile(src, dst)
    return name

def graph(init_img, ctrl_img, pos, neg, denoise, cn_strength, seed, steps=24, cfg=6.5):
    return {
        "ckpt": {"class_type": "CheckpointLoaderSimple",
                 "inputs": {"ckpt_name": "sd_xl_base_1.0.safetensors"}},
        "pos": {"class_type": "CLIPTextEncode",
                "inputs": {"text": pos, "clip": ["ckpt", 1]}},
        "neg": {"class_type": "CLIPTextEncode",
                "inputs": {"text": neg, "clip": ["ckpt", 1]}},
        "init": {"class_type": "LoadImage", "inputs": {"image": init_img}},
        "ctrl": {"class_type": "LoadImage", "inputs": {"image": ctrl_img}},
        "canny": {"class_type": "Canny",
                  "inputs": {"image": ["ctrl", 0], "low_threshold": 0.18,
                             "high_threshold": 0.42}},
        "cnet": {"class_type": "ControlNetLoader",
                 "inputs": {"control_net_name": "controlnet-canny-sdxl.safetensors"}},
        "cnapply": {"class_type": "ControlNetApplyAdvanced",
                    "inputs": {"positive": ["pos", 0], "negative": ["neg", 0],
                               "control_net": ["cnet", 0], "image": ["canny", 0],
                               "strength": cn_strength, "start_percent": 0.0,
                               "end_percent": 0.85, "vae": ["ckpt", 2]}},
        "vencode": {"class_type": "VAEEncode",
                    "inputs": {"pixels": ["init", 0], "vae": ["ckpt", 2]}},
        "ksamp": {"class_type": "KSampler",
                  "inputs": {"model": ["ckpt", 0], "positive": ["cnapply", 0],
                             "negative": ["cnapply", 1], "latent_image": ["vencode", 0],
                             "seed": seed, "steps": steps, "cfg": cfg,
                             "sampler_name": "dpmpp_2m", "scheduler": "karras",
                             "denoise": denoise}},
        "vdec": {"class_type": "VAEDecode",
                 "inputs": {"samples": ["ksamp", 0], "vae": ["ckpt", 2]}},
        "save": {"class_type": "SaveImage",
                 "inputs": {"images": ["vdec", 0], "filename_prefix": "blueline_styl"}},
    }

def queue(g):
    cid = str(uuid.uuid4())
    data = json.dumps({"prompt": g, "client_id": cid}).encode()
    req = urllib.request.Request(f"http://{SERVER}/prompt", data=data,
                                 headers={"Content-Type": "application/json"})
    pid = json.loads(urllib.request.urlopen(req).read())["prompt_id"]
    t0 = time.time()
    while True:
        time.sleep(2)
        hist = json.loads(urllib.request.urlopen(f"http://{SERVER}/history/{pid}").read())
        if pid in hist:
            outs = hist[pid]["outputs"]
            for node in outs.values():
                for im in node.get("images", []):
                    return os.path.join(OUTDIR, im.get("subfolder", ""), im["filename"]), time.time() - t0
        if time.time() - t0 > 1200:
            raise TimeoutError("comfy timeout")

JOBS = [
    # name, init render, control(line) render, prompt-scene, denoise, cn, seed
    ("city_from_toon", "city_toon.png", "city_ink.png",
     "a burning city street at night, tall buildings looming, a lone figure standing, smoke rising", 0.72, 0.85, 2211),
    ("city_from_line", "city_ink.png", "city_ink.png",
     "a burning city street at night, tall buildings looming, a lone figure standing, smoke rising", 0.80, 0.80, 2211),
    ("figure_from_toon", "figure_toon.png", "figure_ink.png",
     "a dramatic snarling creature bust, deep shadow, intense", 0.70, 0.85, 1234),
]

for i, (name, init_r, ctrl_r, scene, dn, cn, seed) in enumerate(JOBS):
    init_n = stage(init_r, f"bl_init_{i}.png")
    ctrl_n = stage(ctrl_r, f"bl_ctrl_{i}.png")
    pos = f"{scene}, {STYLE}"
    neg = NEG
    g = graph(init_n, ctrl_n, pos, neg, dn, cn, seed)
    print(f"[{name}] queuing (denoise {dn}, cn {cn}) ...", flush=True)
    out, dt = queue(g)
    dst = os.path.join(DSTDIR, f"{name}.png")
    shutil.copyfile(out, dst)
    print(f"[{name}] done in {dt:.0f}s -> {dst}", flush=True)
print("STYLIZE DONE")
