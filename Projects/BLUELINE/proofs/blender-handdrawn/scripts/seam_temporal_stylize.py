"""
BLUELINE seam · TEMPORAL stylize — img2img every temporal/ink_####.png with a FIXED
seed (best coherence) + strong canny, to see the redraw's temporal behaviour (the boil).
Output: temporal/styl_####.png
"""
import glob, json, os, shutil, time, urllib.request, uuid
SERVER = "127.0.0.1:8188"
ROOT = "/Users/loudonstearns/Documents/The Palace/Projects/BLUELINE/proofs/blender-handdrawn"
COMFY = "/Users/loudonstearns/Documents/The Palace/_tools/ComfyUI"
INDIR, OUTDIR = os.path.join(COMFY, "input"), os.path.join(COMFY, "output")
TMP = os.path.join(ROOT, "temporal")
LOCK = json.load(open(os.path.join(ROOT, "..", "style-lock", "locked-style.json")))
INK = ("stark black and white pen and ink illustration, sumi-e brush, manga inking, heavy spotted blacks, "
       "bold sweeping flow lines, scattered ink splatter, rough white paper, lots of white space, film-noir, "
       "a burning city street, tall buildings, a lone figure")
NEG = LOCK["neg_extra"]
SEED = 4242  # fixed across frames

def graph(name):
    return {
      "ckpt": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": "sd_xl_base_1.0.safetensors"}},
      "pos": {"class_type": "CLIPTextEncode", "inputs": {"text": INK, "clip": ["ckpt", 1]}},
      "neg": {"class_type": "CLIPTextEncode", "inputs": {"text": NEG, "clip": ["ckpt", 1]}},
      "init": {"class_type": "LoadImage", "inputs": {"image": name}},
      "canny": {"class_type": "Canny", "inputs": {"image": ["init", 0], "low_threshold": 0.15, "high_threshold": 0.4}},
      "cnet": {"class_type": "ControlNetLoader", "inputs": {"control_net_name": "controlnet-canny-sdxl.safetensors"}},
      "cna": {"class_type": "ControlNetApplyAdvanced", "inputs": {"positive": ["pos", 0], "negative": ["neg", 0],
              "control_net": ["cnet", 0], "image": ["canny", 0], "strength": 0.6, "start_percent": 0.0, "end_percent": 0.7, "vae": ["ckpt", 2]}},
      "venc": {"class_type": "VAEEncode", "inputs": {"pixels": ["init", 0], "vae": ["ckpt", 2]}},
      "ks": {"class_type": "KSampler", "inputs": {"model": ["ckpt", 0], "positive": ["cna", 0], "negative": ["cna", 1],
             "latent_image": ["venc", 0], "seed": SEED, "steps": 24, "cfg": 7.0, "sampler_name": "dpmpp_2m", "scheduler": "karras", "denoise": 0.86}},
      "vd": {"class_type": "VAEDecode", "inputs": {"samples": ["ks", 0], "vae": ["ckpt", 2]}},
      "sv": {"class_type": "SaveImage", "inputs": {"images": ["vd", 0], "filename_prefix": "seam_temporal"}},
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

frames = sorted(glob.glob(os.path.join(TMP, "ink_*.png")))
print(f"stylizing {len(frames)} frames, fixed seed {SEED}")
for i, fp in enumerate(frames):
    nm = f"t_in_{i:04d}.png"; shutil.copyfile(fp, os.path.join(INDIR, nm))
    out, dt = queue(graph(nm))
    shutil.copyfile(out, os.path.join(TMP, f"styl_{i:04d}.png"))
    print(f"[{i:02d}] {dt:.0f}s", flush=True)
print("TEMPORAL STYLIZE DONE")
