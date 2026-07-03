"""
Figure Rig — HANDS + OBJECTS RunPod batch (the §5 proxy proof). Each proxy grip -> shaded->canny
+ depth + hand-openpose, prompt names the object. The A/B is against the prompt-only hands matrix
(renders/hands-gen/<obj>_closeup): does a greybox proxy in the grip fix the hand/object relation?

  POD_CANNY=1 python3 pose_pod_orchestrator.py --render-script <abs batch_hands_objects_pod.py>
Invoked as: batch_hands_objects_pod.py --pod <id>
"""
import argparse, json, os, ssl, sys, time, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.normpath(os.path.join(HERE, "..", "..", "..", "new-story")))
sys.path.insert(0, HERE)
from pod_backend import Backend
import render_shot as RS

PLATES = os.path.join(HERE, "renders", "hands-objects")
OUT = os.path.join(HERE, "renders", "hands-objects-gen")
W, H = 832, 1040
CN_CANNY = "controlnet-canny-sdxl.safetensors"
CN_DEPTH = "controlnet-depth-sdxl.safetensors"
CN_POSE = "controlnet-openpose-sdxl.safetensors"
NEG = RS.NEG + ", nude, naked, nudity"
_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
try:
    import certifi; _CTX = ssl.create_default_context(cafile=certifi.where())
except Exception:
    _CTX = ssl._create_unverified_context()

STYLES = [("ink", "__LOCKED__"),
          ("comic", "bold graphic novel cel-shaded illustration, thick black ink outlines, flat vivid colors, high contrast")]

OBJECTS = {
    "glass_proxy_closeup":  "an extreme close-up of a human hand holding a clear drinking glass of water, detailed fingers wrapping the glass",
    "snake_proxy_closeup":  "an extreme close-up of a human hand with a small snake coiling around the fingers, detailed fingers",
    "flower_proxy_closeup": "an extreme close-up of a human hand holding a single delicate flower by its stem, detailed fingers",
}


def graph(prompt, seed, prefix, shaded, depth, pose):
    return {
        "ckpt": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": "sd_xl_base_1.0.safetensors"}},
        "pos": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt, "clip": ["ckpt", 1]}},
        "neg": {"class_type": "CLIPTextEncode", "inputs": {"text": NEG, "clip": ["ckpt", 1]}},
        "latent": {"class_type": "EmptyLatentImage", "inputs": {"width": W, "height": H, "batch_size": 1}},
        "shimg": {"class_type": "LoadImage", "inputs": {"image": shaded}},
        "canny": {"class_type": "Canny", "inputs": {"image": ["shimg", 0], "low_threshold": 0.12, "high_threshold": 0.35}},
        "depimg": {"class_type": "LoadImage", "inputs": {"image": depth}},
        "posimg": {"class_type": "LoadImage", "inputs": {"image": pose}},
        "cn_c": {"class_type": "ControlNetLoader", "inputs": {"control_net_name": CN_CANNY}},
        "cn_d": {"class_type": "ControlNetLoader", "inputs": {"control_net_name": CN_DEPTH}},
        "cn_p": {"class_type": "ControlNetLoader", "inputs": {"control_net_name": CN_POSE}},
        "a1": {"class_type": "ControlNetApplyAdvanced", "inputs": {"positive": ["pos", 0], "negative": ["neg", 0],
               "control_net": ["cn_c", 0], "image": ["canny", 0], "strength": 0.60, "start_percent": 0.0, "end_percent": 0.8, "vae": ["ckpt", 2]}},
        "a2": {"class_type": "ControlNetApplyAdvanced", "inputs": {"positive": ["a1", 0], "negative": ["a1", 1],
               "control_net": ["cn_d", 0], "image": ["depimg", 0], "strength": 0.50, "start_percent": 0.0, "end_percent": 0.75, "vae": ["ckpt", 2]}},
        "a3": {"class_type": "ControlNetApplyAdvanced", "inputs": {"positive": ["a2", 0], "negative": ["a2", 1],
               "control_net": ["cn_p", 0], "image": ["posimg", 0], "strength": 0.55, "start_percent": 0.0, "end_percent": 0.8, "vae": ["ckpt", 2]}},
        "ks": {"class_type": "KSampler", "inputs": {"model": ["ckpt", 0], "positive": ["a3", 0], "negative": ["a3", 1],
               "latent_image": ["latent", 0], "seed": seed, "steps": 28, "cfg": 6.5, "sampler_name": "dpmpp_2m", "scheduler": "karras", "denoise": 1.0}},
        "vd": {"class_type": "VAEDecode", "inputs": {"samples": ["ks", 0], "vae": ["ckpt", 2]}},
        "sv": {"class_type": "SaveImage", "inputs": {"filename_prefix": prefix, "images": ["vd", 0]}},
    }


def wait_all_cn(pid, timeout=900):
    need = [CN_POSE, CN_CANNY, CN_DEPTH]
    url = f"https://{pid}-8188.proxy.runpod.net/object_info/ControlNetLoader"
    t0 = time.time()
    while time.time() - t0 < timeout:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": _UA})
            info = json.loads(urllib.request.urlopen(req, timeout=10, context=_CTX).read())
            v = info.get("ControlNetLoader", {}).get("input", {}).get("required", {}).get("control_net_name", [[]])
            have = set(v[0] if v and isinstance(v[0], list) else [])
        except Exception as e:
            print(f"[cn-gate] retry {repr(e)[:80]}", flush=True); time.sleep(8); continue
        missing = [c for c in need if c not in have]
        print(f"[cn-gate] {int(time.time()-t0)}s missing={missing}", flush=True)
        if not missing:
            return True
        time.sleep(10)
    return False


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pod", required=True)
    a = ap.parse_args()
    if not wait_all_cn(a.pod):
        sys.exit("[cn-gate] canny/depth never arrived")
    bk = Backend(a.pod)
    print(f"[objects] {len(OBJECTS)} objects x {len(STYLES)} styles", flush=True)
    for label, base in OBJECTS.items():
        pd = os.path.join(PLATES, label)
        sh = bk.upload(os.path.join(pd, "shaded_plate.png"))
        dep = bk.upload(os.path.join(pd, "depth_plate.png"))
        pose = bk.upload(os.path.join(pd, "openpose.png"))
        outdir = os.path.join(OUT, label); os.makedirs(outdir, exist_ok=True)
        for skey, stext in STYLES:
            style = RS.STYLE_TXT if stext == "__LOCKED__" else stext
            prompt = f"{base}, {style}"
            g = graph(prompt, 8300 + abs(hash(label)) % 700, f"{label}_{skey}", sh, dep, pose)
            dest = os.path.join(outdir, f"gen_{skey}.png")
            try:
                dt = bk.run(g, dest); print(f"  [{label}/{skey}] {dt:.0f}s", flush=True)
            except Exception as e:
                print(f"  [{label}/{skey}] FAILED {repr(e)[:140]}", flush=True)
    print("OBJECTS_BATCH_DONE", flush=True)


if __name__ == "__main__":
    main()
