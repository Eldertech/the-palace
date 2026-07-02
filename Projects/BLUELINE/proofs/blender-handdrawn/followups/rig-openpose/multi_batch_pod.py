"""
Figure Rig — MULTI-FIGURE RunPod batch (Route A: the 3-guide stack, provable now).
Each staged scene -> shaded->canny + depth + multi-skeleton openpose, prompt drives style + roles.
The color-ID plate is rendered too (Route B / regional conditioning) but NOT used here — Route A
tests whether multi-skeleton pose + depth alone keep the figures separate.

  POD_CANNY=1 python3 pose_pod_orchestrator.py --render-script <abs multi_batch_pod.py>
Invoked as:  multi_batch_pod.py --pod <id> [--only B1_alone,...] [--styles ink,comic]
"""
import argparse, json, os, ssl, sys, time, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.normpath(os.path.join(HERE, "..", "..", "..", "new-story")))
sys.path.insert(0, HERE)
from pod_backend import Backend
import render_shot as RS   # locked STYLE_TXT + NEG

PLATES = os.path.join(HERE, "renders", "multi")
OUT = os.path.join(HERE, "renders", "multi-gen")
W, H = 1216, 832
CN_CANNY = "controlnet-canny-sdxl.safetensors"
CN_DEPTH = "controlnet-depth-sdxl.safetensors"
CN_POSE = "controlnet-openpose-sdxl.safetensors"
_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
try:
    import certifi; _CTX = ssl.create_default_context(cafile=certifi.where())
except Exception:
    _CTX = ssl._create_unverified_context()

STYLES = [("ink", "__LOCKED__"),
          ("comic", "bold graphic novel cel-shaded illustration, thick confident black ink outlines, "
                    "flat vivid saturated colors, dramatic cel shading, high contrast")]

NEG = RS.NEG + ", nude, naked, nudity, bare skin, underwear"

# scene -> the roles/setting prompt (style appended). Written to read with NO text — drama is staged.
# THE LIFT (invented, wordless): indifference -> noticing -> reaching -> holding -> collective lift -> release.
SCENES = {
    "B1_alone":     "a person collapsed lying face-up on the pavement of a busy city street, a crowd of "
                    "people in coats and street clothes walking past around them without stopping, "
                    "everyone fully dressed, bleak, indifferent, full-length figures, urban",
    "B2_one_turns": "a busy city street, a crowd of people in coats walking away with their backs turned, "
                    "one young woman in a coat stopped and turned to look back at the viewer, "
                    "everyone fully dressed, quiet, urban, full-length figures",
    "B3_reach":     "a person lying fallen on the pavement, one passerby in street clothes leaning over "
                    "and reaching a hand down to them, a crowd passing behind, everyone fully dressed, "
                    "tender, urban, full-length figures",
    "B4_cradle":    "a person in street clothes lifting and cradling a collapsed stranger up into their "
                    "arms, holding them close, others passing behind, everyone fully dressed, "
                    "compassionate, tender, full-length figures",
    "B5_many_hands": "a ring of people in street clothes crouching and reaching in with many hands to "
                     "lift a fallen person up from the ground together, everyone fully dressed, "
                     "solidarity, urban, full-length figures",
    "B6_held_up":   "a crowd of people in street clothes with raised arms holding one person aloft "
                    "overhead, the lifted person's arms open wide, light breaking through, "
                    "everyone fully dressed, triumphant, tender, full-length figures",
    # BLUELINE beat kept available
    "A2_hero_points": "a powerful commanding figure in a long coat standing raised above a small "
                      "frightened crowd, one arm thrust out pointing down at them, fully dressed, "
                      "dramatic low angle, embers and smoke",
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
               "control_net": ["cn_c", 0], "image": ["canny", 0], "strength": 0.55, "start_percent": 0.0, "end_percent": 0.8, "vae": ["ckpt", 2]}},
        "a2": {"class_type": "ControlNetApplyAdvanced", "inputs": {"positive": ["a1", 0], "negative": ["a1", 1],
               "control_net": ["cn_d", 0], "image": ["depimg", 0], "strength": 0.50, "start_percent": 0.0, "end_percent": 0.75, "vae": ["ckpt", 2]}},
        "a3": {"class_type": "ControlNetApplyAdvanced", "inputs": {"positive": ["a2", 0], "negative": ["a2", 1],
               "control_net": ["cn_p", 0], "image": ["posimg", 0], "strength": 0.60, "start_percent": 0.0, "end_percent": 0.8, "vae": ["ckpt", 2]}},
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


def styletext(s):
    return RS.STYLE_TXT if s == "__LOCKED__" else s


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pod", required=True)
    ap.add_argument("--only", default=None)
    ap.add_argument("--styles", default=None)
    a = ap.parse_args()
    scenes = a.only.split(",") if a.only else list(SCENES.keys())
    styles = [s for s in STYLES if (not a.styles or s[0] in a.styles.split(","))]

    if not wait_all_cn(a.pod):
        sys.exit("[cn-gate] canny/depth never arrived")

    bk = Backend(a.pod)
    print(f"[multi] {len(scenes)} scenes x {len(styles)} styles = {len(scenes)*len(styles)} renders", flush=True)
    for scene in scenes:
        pd = os.path.join(PLATES, scene)
        sh = bk.upload(os.path.join(pd, "shaded_plate.png"))
        dep = bk.upload(os.path.join(pd, "depth_plate.png"))
        pose = bk.upload(os.path.join(pd, "openpose.png"))
        outdir = os.path.join(OUT, scene); os.makedirs(outdir, exist_ok=True)
        for skey, stext in styles:
            prompt = f"{SCENES[scene]}, {styletext(stext)}"
            g = graph(prompt, 9100 + abs(hash(scene)) % 900, f"{scene}_{skey}", sh, dep, pose)
            dest = os.path.join(outdir, f"gen_{skey}.png")
            try:
                dt = bk.run(g, dest)
                print(f"  [{scene}/{skey}] {dt:.0f}s", flush=True)
            except Exception as e:
                print(f"  [{scene}/{skey}] FAILED {repr(e)[:140]}", flush=True)
        json.dump({"scene": scene, "prompt_base": SCENES[scene]},
                  open(os.path.join(outdir, "meta.json"), "w"), indent=1)
    print("MULTI_BATCH_DONE", flush=True)


if __name__ == "__main__":
    main()
