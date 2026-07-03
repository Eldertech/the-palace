"""
Figure Rig — ROUTE B: regional conditioning for tight-contact multi-figure beats (B4/B6).
Route A (canny+depth+pose, one prompt) blends interlocked figures. Route B binds EACH figure's
own prompt to its color-ID region (a mask cut by make_masks.py) via ConditioningSetMask, so the
model paints "a limp body" where the red figure is and "someone lifting" where the blue one is —
then the same three ControlNets carry the structure. Native nodes only (no custom node).

Pre-req: run make_masks.py for the scene first (writes renders/multi/<scene>/masks/mask_<i>.png).

  POD_CANNY=1 python3 pose_pod_orchestrator.py --render-script <abs multi_regionB_pod.py> \
      --render-args "--scene B4_cradle"
Invoked as: multi_regionB_pod.py --pod <id> --scene B4_cradle
Outputs -> renders/multi-gen/<scene>/genB_<style>.png   (genB = Route B, next to Route A gen_)
"""
import argparse, json, os, ssl, sys, time, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.normpath(os.path.join(HERE, "..", "..", "..", "new-story")))
sys.path.insert(0, HERE)
from pod_backend import Backend
import render_shot as RS

PLATES = os.path.join(HERE, "renders", "multi")
OUT = os.path.join(HERE, "renders", "multi-gen")
W, H = 1216, 832
CN_CANNY = "controlnet-canny-sdxl.safetensors"
CN_DEPTH = "controlnet-depth-sdxl.safetensors"
CN_POSE = "controlnet-openpose-sdxl.safetensors"
NEG = RS.NEG + ", nude, naked, nudity, bare skin"
_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
try:
    import certifi; _CTX = ssl.create_default_context(cafile=certifi.where())
except Exception:
    _CTX = ssl._create_unverified_context()

STYLES = [("ink", "__LOCKED__"),
          ("comic", "bold graphic novel cel-shaded illustration, thick black ink outlines, flat vivid colors, high contrast")]

# per-scene: background prompt + per-figure role prompts in figure order (= IDPAL order = mask index)
SCENES = {
    "B4_cradle": {
        "bg": "a bleak empty city street at night, wet pavement, dim lamplight, cinematic, tender",
        "roles": [
            "a limp unconscious young woman in a coat being carried, head tipped back, arms hanging down",
            "a man in a long coat bending down and lifting her, cradling her body in both arms",
            "a person in a coat standing still and watching, seen from behind",
            "a person in a coat standing still and watching, seen from behind",
        ],
    },
    "B6_held_up": {
        "bg": "a crowd at dusk, shafts of light breaking through, hopeful, triumphant",
        "roles": [
            "a person in a coat lifted up overhead, arms open wide, held aloft",
            "a person in a coat reaching both arms up, helping hold someone aloft",
            "a person in a coat reaching both arms up, helping hold someone aloft",
            "a person in a coat reaching both arms up, helping hold someone aloft",
            "a person in a coat reaching both arms up, helping hold someone aloft",
        ],
    },
}


def regional_positive(g, roles, bg, n):
    """Build combined regional conditioning: background base + each role masked to its color-ID region."""
    g["bg"] = {"class_type": "CLIPTextEncode", "inputs": {"text": bg, "clip": ["ckpt", 1]}}
    combined = ["bg", 0]
    for i in range(n):
        g[f"m_img{i}"] = {"class_type": "LoadImage", "inputs": {"image": f"mask_{i}.png"}}
        g[f"m_msk{i}"] = {"class_type": "ImageToMask", "inputs": {"image": [f"m_img{i}", 0], "channel": "red"}}
        g[f"r_txt{i}"] = {"class_type": "CLIPTextEncode", "inputs": {"text": roles[i], "clip": ["ckpt", 1]}}
        g[f"r_set{i}"] = {"class_type": "ConditioningSetMask", "inputs": {
            "conditioning": [f"r_txt{i}", 0], "mask": [f"m_msk{i}", 0], "strength": 1.15, "set_cond_area": "default"}}
        g[f"comb{i}"] = {"class_type": "ConditioningCombine", "inputs": {
            "conditioning_1": combined, "conditioning_2": [f"r_set{i}", 0]}}
        combined = [f"comb{i}", 0]
    return combined


def graph(bg, roles, n, seed, prefix, shaded, depth, pose):
    g = {
        "ckpt": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": "sd_xl_base_1.0.safetensors"}},
        "neg": {"class_type": "CLIPTextEncode", "inputs": {"text": NEG, "clip": ["ckpt", 1]}},
        "latent": {"class_type": "EmptyLatentImage", "inputs": {"width": W, "height": H, "batch_size": 1}},
        "shimg": {"class_type": "LoadImage", "inputs": {"image": shaded}},
        "canny": {"class_type": "Canny", "inputs": {"image": ["shimg", 0], "low_threshold": 0.12, "high_threshold": 0.35}},
        "depimg": {"class_type": "LoadImage", "inputs": {"image": depth}},
        "posimg": {"class_type": "LoadImage", "inputs": {"image": pose}},
        "cn_c": {"class_type": "ControlNetLoader", "inputs": {"control_net_name": CN_CANNY}},
        "cn_d": {"class_type": "ControlNetLoader", "inputs": {"control_net_name": CN_DEPTH}},
        "cn_p": {"class_type": "ControlNetLoader", "inputs": {"control_net_name": CN_POSE}},
    }
    pos = regional_positive(g, roles, bg, n)
    g["a1"] = {"class_type": "ControlNetApplyAdvanced", "inputs": {"positive": pos, "negative": ["neg", 0],
               "control_net": ["cn_c", 0], "image": ["canny", 0], "strength": 0.55, "start_percent": 0.0, "end_percent": 0.8, "vae": ["ckpt", 2]}}
    g["a2"] = {"class_type": "ControlNetApplyAdvanced", "inputs": {"positive": ["a1", 0], "negative": ["a1", 1],
               "control_net": ["cn_d", 0], "image": ["depimg", 0], "strength": 0.50, "start_percent": 0.0, "end_percent": 0.75, "vae": ["ckpt", 2]}}
    g["a3"] = {"class_type": "ControlNetApplyAdvanced", "inputs": {"positive": ["a2", 0], "negative": ["a2", 1],
               "control_net": ["cn_p", 0], "image": ["posimg", 0], "strength": 0.60, "start_percent": 0.0, "end_percent": 0.8, "vae": ["ckpt", 2]}}
    g["ks"] = {"class_type": "KSampler", "inputs": {"model": ["ckpt", 0], "positive": ["a3", 0], "negative": ["a3", 1],
               "latent_image": ["latent", 0], "seed": seed, "steps": 28, "cfg": 6.5, "sampler_name": "dpmpp_2m", "scheduler": "karras", "denoise": 1.0}}
    g["vd"] = {"class_type": "VAEDecode", "inputs": {"samples": ["ks", 0], "vae": ["ckpt", 2]}}
    g["sv"] = {"class_type": "SaveImage", "inputs": {"filename_prefix": prefix, "images": ["vd", 0]}}
    return g


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
        if all(c in have for c in need):
            return True
        time.sleep(10)
    return False


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pod", required=True)
    ap.add_argument("--scene", required=True)
    a = ap.parse_args()
    spec = SCENES[a.scene]
    roles = spec["roles"]; n = len(roles)
    pd = os.path.join(PLATES, a.scene)
    mdir = os.path.join(pd, "masks")
    if not all(os.path.exists(os.path.join(mdir, f"mask_{i}.png")) for i in range(n)):
        sys.exit(f"[regionB] masks missing — run make_masks.py {pd} {n} first")

    if not wait_all_cn(a.pod):
        sys.exit("[cn-gate] canny/depth never arrived")
    bk = Backend(a.pod)

    sh = bk.upload(os.path.join(pd, "shaded_plate.png"))
    dep = bk.upload(os.path.join(pd, "depth_plate.png"))
    pose = bk.upload(os.path.join(pd, "openpose.png"))
    for i in range(n):
        bk.upload(os.path.join(mdir, f"mask_{i}.png"))   # uploaded by basename -> LoadImage("mask_i.png")
    outdir = os.path.join(OUT, a.scene); os.makedirs(outdir, exist_ok=True)
    print(f"[regionB] {a.scene}: {n} figures x {len(STYLES)} styles", flush=True)
    for skey, stext in STYLES:
        style = RS.STYLE_TXT if stext == "__LOCKED__" else stext
        bg = f"{spec['bg']}, {style}"
        styled_roles = [f"{r}, {style}" for r in roles]
        g = graph(bg, styled_roles, n, 9500 + abs(hash(a.scene)) % 400, f"{a.scene}_B_{skey}", sh, dep, pose)
        dest = os.path.join(outdir, f"genB_{skey}.png")
        try:
            dt = bk.run(g, dest); print(f"  [{a.scene}/B/{skey}] {dt:.0f}s", flush=True)
        except Exception as e:
            print(f"  [{a.scene}/B/{skey}] FAILED {repr(e)[:160]}", flush=True)
    print("REGIONB_DONE", flush=True)


if __name__ == "__main__":
    main()
