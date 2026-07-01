"""
Figure Rig — FACE GUIDE COMPARISON. Loudon's experiment: which Blender output guides the
gen-AI best? Flat line art loses front/back (canny picks up back edges); shaded renders carry
form. Compare three guides on the same face, same prompt/seed:
  - ink    : line art → Canny controlnet + depth + openpose, full generation
  - shaded : shaded greyscale → img2img init (form-preserving) + depth + openpose
  - color  : shaded color → img2img init + depth + openpose

Pod must be booted with POD_CANNY=1.
  python3 batch_faces_guides.py --pod <id> --plates yw_surprised,yw_smile --styles storyboard,comic
"""
import argparse, json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.normpath(os.path.join(HERE, "..", "..", "..", "new-story")))
sys.path.insert(0, HERE)
import faces_manifest as FM
from pod_backend import Backend
import render_shot as RS

PL = os.path.join(HERE, "renders", "faces-rig")
OUT = os.path.join(HERE, "renders", "faces-guides")
W, H = 832, 1040
CN_CANNY = "controlnet-canny-sdxl.safetensors"
CN_DEPTH = "controlnet-depth-sdxl.safetensors"
CN_POSE = "controlnet-openpose-sdxl.safetensors"


def style_text(s):
    return RS.STYLE_TXT if s["style"] == "__LOCKED__" else s["style"]


def _common(prompt, seed):
    return {
        "ckpt": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": "sd_xl_base_1.0.safetensors"}},
        "pos": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt, "clip": ["ckpt", 1]}},
        "neg": {"class_type": "CLIPTextEncode", "inputs": {"text": RS.NEG, "clip": ["ckpt", 1]}},
        "depimg": {"class_type": "LoadImage", "inputs": {"image": None}},
        "posimg": {"class_type": "LoadImage", "inputs": {"image": None}},
        "cn_d": {"class_type": "ControlNetLoader", "inputs": {"control_net_name": CN_DEPTH}},
        "cn_p": {"class_type": "ControlNetLoader", "inputs": {"control_net_name": CN_POSE}},
        "vd": {"class_type": "VAEDecode", "inputs": {"samples": ["ks", 0], "vae": ["ckpt", 2]}},
        "sv": {"class_type": "SaveImage", "inputs": {"filename_prefix": "g", "images": ["vd", 0]}},
    }


def graph_ink(prompt, seed, ink, dep, pose):
    g = _common(prompt, seed); g["depimg"]["inputs"]["image"] = dep; g["posimg"]["inputs"]["image"] = pose
    g["inkimg"] = {"class_type": "LoadImage", "inputs": {"image": ink}}
    g["canny"] = {"class_type": "Canny", "inputs": {"image": ["inkimg", 0], "low_threshold": 0.12, "high_threshold": 0.35}}
    g["cn_c"] = {"class_type": "ControlNetLoader", "inputs": {"control_net_name": CN_CANNY}}
    g["latent"] = {"class_type": "EmptyLatentImage", "inputs": {"width": W, "height": H, "batch_size": 1}}
    g["a1"] = {"class_type": "ControlNetApplyAdvanced", "inputs": {"positive": ["pos", 0], "negative": ["neg", 0],
               "control_net": ["cn_c", 0], "image": ["canny", 0], "strength": 0.6, "start_percent": 0.0, "end_percent": 0.85, "vae": ["ckpt", 2]}}
    g["a2"] = {"class_type": "ControlNetApplyAdvanced", "inputs": {"positive": ["a1", 0], "negative": ["a1", 1],
               "control_net": ["cn_d", 0], "image": ["depimg", 0], "strength": 0.45, "start_percent": 0.0, "end_percent": 0.7, "vae": ["ckpt", 2]}}
    g["a3"] = {"class_type": "ControlNetApplyAdvanced", "inputs": {"positive": ["a2", 0], "negative": ["a2", 1],
               "control_net": ["cn_p", 0], "image": ["posimg", 0], "strength": 0.4, "start_percent": 0.0, "end_percent": 0.7, "vae": ["ckpt", 2]}}
    g["ks"] = {"class_type": "KSampler", "inputs": {"model": ["ckpt", 0], "positive": ["a3", 0], "negative": ["a3", 1],
               "latent_image": ["latent", 0], "seed": seed, "steps": 28, "cfg": 6.5, "sampler_name": "dpmpp_2m", "scheduler": "karras", "denoise": 1.0}}
    return g


def graph_img2img(prompt, seed, init, dep, pose, denoise):
    g = _common(prompt, seed); g["depimg"]["inputs"]["image"] = dep; g["posimg"]["inputs"]["image"] = pose
    g["initimg"] = {"class_type": "LoadImage", "inputs": {"image": init}}
    g["enc"] = {"class_type": "VAEEncode", "inputs": {"pixels": ["initimg", 0], "vae": ["ckpt", 2]}}
    g["a2"] = {"class_type": "ControlNetApplyAdvanced", "inputs": {"positive": ["pos", 0], "negative": ["neg", 0],
               "control_net": ["cn_d", 0], "image": ["depimg", 0], "strength": 0.45, "start_percent": 0.0, "end_percent": 0.7, "vae": ["ckpt", 2]}}
    g["a3"] = {"class_type": "ControlNetApplyAdvanced", "inputs": {"positive": ["a2", 0], "negative": ["a2", 1],
               "control_net": ["cn_p", 0], "image": ["posimg", 0], "strength": 0.4, "start_percent": 0.0, "end_percent": 0.7, "vae": ["ckpt", 2]}}
    g["ks"] = {"class_type": "KSampler", "inputs": {"model": ["ckpt", 0], "positive": ["a3", 0], "negative": ["a3", 1],
               "latent_image": ["enc", 0], "seed": seed, "steps": 28, "cfg": 6.5, "sampler_name": "dpmpp_2m", "scheduler": "karras", "denoise": denoise}}
    return g


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pod", required=True)
    ap.add_argument("--plates", required=True)
    ap.add_argument("--styles", default="storyboard,comic")
    a = ap.parse_args()
    bk = Backend(a.pod)
    plates = a.plates.split(",")
    styles = [s for s in FM.STYLES if s["key"] in set(a.styles.split(","))]
    print(f"[guides] {len(plates)} plates × 3 guides × {len(styles)} styles", flush=True)

    for label in plates:
        pd = os.path.join(PL, label)
        ink = bk.upload(os.path.join(pd, "ink_plate.png"))
        shaded = bk.upload(os.path.join(pd, "shaded_plate.png"))
        color = bk.upload(os.path.join(pd, "color_plate.png"))
        dep = bk.upload(os.path.join(pd, "depth_plate.png"))
        pose = bk.upload(os.path.join(pd, "openpose.png"))
        # parse person/expr from the plate label via manifest
        pj = next((j for j in FM.plate_jobs() if j[0] == label), None)
        _, pk, ex, shot = pj
        outdir = os.path.join(OUT, label); os.makedirs(outdir, exist_ok=True)
        for s in styles:
            prompt = FM.prompt_for(FM.PEOPLE[pk]["subject"], ex, shot, style_text(s))
            seed = 5300 + abs(hash(label)) % 1000
            jobs = [("ink", graph_ink(prompt, seed, ink, dep, pose)),
                    ("shaded", graph_img2img(prompt, seed, shaded, dep, pose, 0.68)),
                    ("color", graph_img2img(prompt, seed, color, dep, pose, 0.72))]
            for guide, g in jobs:
                dest = os.path.join(outdir, f"{guide}_{s['key']}.png")
                try:
                    dt = bk.run(g, dest); print(f"  [{label}/{guide}/{s['key']}] {dt:.0f}s", flush=True)
                except Exception as e:
                    print(f"  [{label}/{guide}/{s['key']}] FAILED {repr(e)[:150]}", flush=True)
    print("GUIDES_BATCH_DONE", flush=True)


if __name__ == "__main__":
    main()
