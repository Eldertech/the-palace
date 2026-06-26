"""
BLUELINE — aggressive stylize test: can local SDXL-base reach the pen-flow ink look
from a Blender init if we push denoise high and let Canny only loosely guide?
Front-loads the ink medium in the prompt; lowers ControlNet strength/end so structure
guides but style is free.
"""
import json, os, shutil, time, urllib.request, uuid

SERVER = "127.0.0.1:8188"
ROOT = "/Users/loudonstearns/Documents/The Palace/Projects/BLUELINE/proofs/blender-handdrawn"
COMFY = "/Users/loudonstearns/Documents/The Palace/_tools/ComfyUI"
INDIR, OUTDIR = os.path.join(COMFY, "input"), os.path.join(COMFY, "output")
DST = os.path.join(ROOT, "stylized"); os.makedirs(DST, exist_ok=True)
LOCK = json.load(open(os.path.join(ROOT, "..", "style-lock", "locked-style.json")))

INK = ("stark black and white pen and ink illustration, sumi-e brush, manga inking, "
       "heavy spotted blacks, bold dramatic sweeping flow lines and speed streaks, "
       "scattered energetic ink splatter, rough white paper, lots of white space, "
       "film-noir deep shadow, loose gestural linework, low canted angle")
NEG = LOCK["neg_extra"]

def stage(rel, name):
    shutil.copyfile(os.path.join(ROOT, "blender", rel), os.path.join(INDIR, name)); return name

def graph(init_img, ctrl_img, pos, denoise, cn, cn_end, seed, cfg=7.5, steps=26):
    return {
        "ckpt": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": "sd_xl_base_1.0.safetensors"}},
        "pos": {"class_type": "CLIPTextEncode", "inputs": {"text": pos, "clip": ["ckpt", 1]}},
        "neg": {"class_type": "CLIPTextEncode", "inputs": {"text": NEG, "clip": ["ckpt", 1]}},
        "init": {"class_type": "LoadImage", "inputs": {"image": init_img}},
        "ctrl": {"class_type": "LoadImage", "inputs": {"image": ctrl_img}},
        "canny": {"class_type": "Canny", "inputs": {"image": ["ctrl", 0], "low_threshold": 0.15, "high_threshold": 0.4}},
        "cnet": {"class_type": "ControlNetLoader", "inputs": {"control_net_name": "controlnet-canny-sdxl.safetensors"}},
        "cna": {"class_type": "ControlNetApplyAdvanced",
                "inputs": {"positive": ["pos", 0], "negative": ["neg", 0], "control_net": ["cnet", 0],
                           "image": ["canny", 0], "strength": cn, "start_percent": 0.0, "end_percent": cn_end, "vae": ["ckpt", 2]}},
        "venc": {"class_type": "VAEEncode", "inputs": {"pixels": ["init", 0], "vae": ["ckpt", 2]}},
        "ks": {"class_type": "KSampler",
               "inputs": {"model": ["ckpt", 0], "positive": ["cna", 0], "negative": ["cna", 1],
                          "latent_image": ["venc", 0], "seed": seed, "steps": steps, "cfg": cfg,
                          "sampler_name": "dpmpp_2m", "scheduler": "karras", "denoise": denoise}},
        "vd": {"class_type": "VAEDecode", "inputs": {"samples": ["ks", 0], "vae": ["ckpt", 2]}},
        "sv": {"class_type": "SaveImage", "inputs": {"images": ["vd", 0], "filename_prefix": "blueline_push"}},
    }

def queue(g):
    cid = str(uuid.uuid4())
    req = urllib.request.Request(f"http://{SERVER}/prompt",
        data=json.dumps({"prompt": g, "client_id": cid}).encode(), headers={"Content-Type": "application/json"})
    pid = json.loads(urllib.request.urlopen(req).read())["prompt_id"]
    t0 = time.time()
    while True:
        time.sleep(2)
        h = json.loads(urllib.request.urlopen(f"http://{SERVER}/history/{pid}").read())
        if pid in h:
            for node in h[pid]["outputs"].values():
                for im in node.get("images", []):
                    return os.path.join(OUTDIR, im.get("subfolder", ""), im["filename"]), time.time() - t0
        if time.time() - t0 > 1200: raise TimeoutError()

scene = "a burning city street at night, tall buildings, a lone figure, smoke rising"
JOBS = [
    ("city_push_d90_cn50", "city_toon.png", "city_ink.png", 0.90, 0.55, 0.55, 2211),
    ("city_push_d95_cn40", "city_toon.png", "city_ink.png", 0.95, 0.42, 0.50, 7),
    ("city_push_inkinit_d88", "city_ink.png", "city_ink.png", 0.88, 0.50, 0.55, 99),
]
for i, (name, ir, cr, dn, cn, cne, seed) in enumerate(JOBS):
    init_n, ctrl_n = stage(ir, f"push_init_{i}.png"), stage(cr, f"push_ctrl_{i}.png")
    pos = f"{INK}, {scene}"
    print(f"[{name}] denoise {dn} cn {cn}/{cne} ...", flush=True)
    out, dt = queue(graph(init_n, ctrl_n, pos, dn, cn, cne, seed))
    shutil.copyfile(out, os.path.join(DST, f"{name}.png"))
    print(f"[{name}] {dt:.0f}s", flush=True)
print("PUSH DONE")
