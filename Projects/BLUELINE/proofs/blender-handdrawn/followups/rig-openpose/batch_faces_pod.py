"""
Figure Rig — FACES RunPod batch. Uses ALL THREE Blender guides Loudon asked for:
the ink render (via Canny) + depth + the face OpenPose, conditioning a full SDXL
generation. The expressive ink carries the emotion; depth gives face shape; the face
landmarks add explicit feature points. Style is free in the prompt.

Needs the pod booted with POD_CANNY=1 (canny controlnet present).
  POD_CANNY=1 python3 pose_pod_orchestrator.py --render-script <abs batch_faces_pod.py> --keep-alive
  python3 batch_faces_pod.py --pod <id> [--only yw_smile,...]
"""
import argparse, json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.normpath(os.path.join(HERE, "..", "..", "..", "new-story")))
sys.path.insert(0, HERE)
import faces_manifest as FM
from pod_backend import Backend
import render_shot as RS   # for STYLE_TXT + NEG

PL = os.path.join(HERE, "renders", "faces-rig")
OUT = os.path.join(HERE, "renders", "faces-gen")
W, H = 832, 1040
CN_CANNY = "controlnet-canny-sdxl.safetensors"
CN_DEPTH = "controlnet-depth-sdxl.safetensors"
CN_POSE = "controlnet-openpose-sdxl.safetensors"


def style_text(s):
    return RS.STYLE_TXT if s["style"] == "__LOCKED__" else s["style"]


def graph(prompt, seed, prefix, ink_name, depth_name, pose_name):
    g = {
        "ckpt": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": "sd_xl_base_1.0.safetensors"}},
        "pos": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt, "clip": ["ckpt", 1]}},
        "neg": {"class_type": "CLIPTextEncode", "inputs": {"text": RS.NEG, "clip": ["ckpt", 1]}},
        "latent": {"class_type": "EmptyLatentImage", "inputs": {"width": W, "height": H, "batch_size": 1}},
        "inkimg": {"class_type": "LoadImage", "inputs": {"image": ink_name}},
        "canny": {"class_type": "Canny", "inputs": {"image": ["inkimg", 0], "low_threshold": 0.12, "high_threshold": 0.35}},
        "depimg": {"class_type": "LoadImage", "inputs": {"image": depth_name}},
        "posimg": {"class_type": "LoadImage", "inputs": {"image": pose_name}},
        "cn_c": {"class_type": "ControlNetLoader", "inputs": {"control_net_name": CN_CANNY}},
        "cn_d": {"class_type": "ControlNetLoader", "inputs": {"control_net_name": CN_DEPTH}},
        "cn_p": {"class_type": "ControlNetLoader", "inputs": {"control_net_name": CN_POSE}},
        "a1": {"class_type": "ControlNetApplyAdvanced", "inputs": {"positive": ["pos", 0], "negative": ["neg", 0],
               "control_net": ["cn_c", 0], "image": ["canny", 0], "strength": 0.60, "start_percent": 0.0, "end_percent": 0.85, "vae": ["ckpt", 2]}},
        "a2": {"class_type": "ControlNetApplyAdvanced", "inputs": {"positive": ["a1", 0], "negative": ["a1", 1],
               "control_net": ["cn_d", 0], "image": ["depimg", 0], "strength": 0.45, "start_percent": 0.0, "end_percent": 0.7, "vae": ["ckpt", 2]}},
        "a3": {"class_type": "ControlNetApplyAdvanced", "inputs": {"positive": ["a2", 0], "negative": ["a2", 1],
               "control_net": ["cn_p", 0], "image": ["posimg", 0], "strength": 0.40, "start_percent": 0.0, "end_percent": 0.7, "vae": ["ckpt", 2]}},
        "ks": {"class_type": "KSampler", "inputs": {"model": ["ckpt", 0], "positive": ["a3", 0], "negative": ["a3", 1],
               "latent_image": ["latent", 0], "seed": seed, "steps": 28, "cfg": 6.5, "sampler_name": "dpmpp_2m", "scheduler": "karras", "denoise": 1.0}},
        "vd": {"class_type": "VAEDecode", "inputs": {"samples": ["ks", 0], "vae": ["ckpt", 2]}},
        "sv": {"class_type": "SaveImage", "inputs": {"filename_prefix": prefix, "images": ["vd", 0]}},
    }
    return g


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pod", required=True)
    ap.add_argument("--only", default=None)
    ap.add_argument("--styles", default=None)
    a = ap.parse_args()
    only = set(a.only.split(",")) if a.only else None
    stylekeys = set(a.styles.split(",")) if a.styles else None

    bk = Backend(a.pod)
    jobs = [j for j in FM.plate_jobs() if (not only or j[0] in only)]
    styles = [s for s in FM.STYLES if (not stylekeys or s["key"] in stylekeys)]
    print(f"[faces] {len(jobs)} plate-sets × {len(styles)} styles = {len(jobs)*len(styles)} renders", flush=True)

    for label, pk, ex, shot in jobs:
        pd = os.path.join(PL, label)
        # WINNER (guide experiment): feed canny the SHADED render, not the flat ink —
        # the shaded render's edges sit on real form → correct eyes + bold style.
        ink = bk.upload(os.path.join(pd, "shaded_plate.png"))
        dep = bk.upload(os.path.join(pd, "depth_plate.png"))
        pose = bk.upload(os.path.join(pd, "openpose.png"))
        outdir = os.path.join(OUT, label); os.makedirs(outdir, exist_ok=True)
        prompts = {}
        for s in styles:
            prompt = FM.prompt_for(FM.PEOPLE[pk]["subject"], ex, shot, style_text(s))
            g = graph(prompt, 5200 + abs(hash(label)) % 1000, f"{label}_{s['key']}", ink, dep, pose)
            dest = os.path.join(outdir, f"gen_{s['key']}.png")
            try:
                dt = bk.run(g, dest); prompts[s["key"]] = prompt
                print(f"  [{label}/{s['key']}] {dt:.0f}s", flush=True)
            except Exception as e:
                print(f"  [{label}/{s['key']}] FAILED {repr(e)[:150]}", flush=True)
        json.dump({"person": pk, "expression": ex, "shot": shot, "prompts": prompts},
                  open(os.path.join(outdir, "prompts.json"), "w"), indent=1)
    print("FACES_BATCH_DONE", flush=True)


if __name__ == "__main__":
    main()
