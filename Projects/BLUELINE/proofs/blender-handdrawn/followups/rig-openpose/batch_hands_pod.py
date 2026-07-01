"""
Figure Rig — HANDS RunPod batch. Each hand plate-set × 3 styles, pose-locked restyle
(hand OpenPose + depth hold the hand; the prompt drives style + object). Reuses the proven
pod transport + graph from new-story.

  python3 batch_hands_pod.py --pod <id>              # all plate-sets × 3 styles
  python3 batch_hands_pod.py --pod <id> --only glass_closeup
"""
import argparse, json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.normpath(os.path.join(HERE, "..", "..", "..", "new-story")))
sys.path.insert(0, HERE)
import hands_manifest as HM
from pod_backend import Backend
import render_shot as RS

PLATES = os.path.join(HERE, "renders", "hands")
OUT = os.path.join(HERE, "renders", "hands-gen")
W, H = 832, 1040
CN_CANNY = "controlnet-canny-sdxl.safetensors"
CN_DEPTH = "controlnet-depth-sdxl.safetensors"
CN_POSE = "controlnet-openpose-sdxl.safetensors"


def graph(prompt, seed, prefix, shaded_name, depth_name, pose_name):
    # shaded→canny gives the hand real FORM (openpose alone was ambiguous → mangled hands);
    # depth separates fingers/object; openpose holds the gesture. Same fix that saved faces.
    return {
        "ckpt": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": "sd_xl_base_1.0.safetensors"}},
        "pos": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt, "clip": ["ckpt", 1]}},
        "neg": {"class_type": "CLIPTextEncode", "inputs": {"text": RS.NEG, "clip": ["ckpt", 1]}},
        "latent": {"class_type": "EmptyLatentImage", "inputs": {"width": W, "height": H, "batch_size": 1}},
        "shimg": {"class_type": "LoadImage", "inputs": {"image": shaded_name}},
        "canny": {"class_type": "Canny", "inputs": {"image": ["shimg", 0], "low_threshold": 0.12, "high_threshold": 0.35}},
        "depimg": {"class_type": "LoadImage", "inputs": {"image": depth_name}},
        "posimg": {"class_type": "LoadImage", "inputs": {"image": pose_name}},
        "cn_c": {"class_type": "ControlNetLoader", "inputs": {"control_net_name": CN_CANNY}},
        "cn_d": {"class_type": "ControlNetLoader", "inputs": {"control_net_name": CN_DEPTH}},
        "cn_p": {"class_type": "ControlNetLoader", "inputs": {"control_net_name": CN_POSE}},
        "a1": {"class_type": "ControlNetApplyAdvanced", "inputs": {"positive": ["pos", 0], "negative": ["neg", 0],
               "control_net": ["cn_c", 0], "image": ["canny", 0], "strength": 0.55, "start_percent": 0.0, "end_percent": 0.8, "vae": ["ckpt", 2]}},
        "a2": {"class_type": "ControlNetApplyAdvanced", "inputs": {"positive": ["a1", 0], "negative": ["a1", 1],
               "control_net": ["cn_d", 0], "image": ["depimg", 0], "strength": 0.50, "start_percent": 0.0, "end_percent": 0.75, "vae": ["ckpt", 2]}},
        "a3": {"class_type": "ControlNetApplyAdvanced", "inputs": {"positive": ["a2", 0], "negative": ["a2", 1],
               "control_net": ["cn_p", 0], "image": ["posimg", 0], "strength": 0.55, "start_percent": 0.0, "end_percent": 0.8, "vae": ["ckpt", 2]}},
        "ks": {"class_type": "KSampler", "inputs": {"model": ["ckpt", 0], "positive": ["a3", 0], "negative": ["a3", 1],
               "latent_image": ["latent", 0], "seed": seed, "steps": 28, "cfg": 6.5, "sampler_name": "dpmpp_2m", "scheduler": "karras", "denoise": 1.0}},
        "vd": {"class_type": "VAEDecode", "inputs": {"samples": ["ks", 0], "vae": ["ckpt", 2]}},
        "sv": {"class_type": "SaveImage", "inputs": {"filename_prefix": prefix, "images": ["vd", 0]}},
    }


def style_text(s):
    return RS.STYLE_TXT if s["style"] == "__LOCKED__" else s["style"]


def subj_of(job_key):
    for s in HM.SUBJECTS:
        if job_key.startswith(s["key"] + "_"):
            # longest match wins (fist vs fist_side)
            pass
    best = None
    for s in HM.SUBJECTS:
        if job_key.startswith(s["key"] + "_") and (best is None or len(s["key"]) > len(best["key"])):
            best = s
    return best


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pod", required=True)
    ap.add_argument("--only", default=None)
    a = ap.parse_args()
    only = set(a.only.split(",")) if a.only else None

    bk = Backend(a.pod)
    jobs = [j for j in HM.plate_jobs() if (not only or j["key"] in only)]
    print(f"[hands] {len(jobs)} plate-sets × {len(HM.STYLES)} styles = {len(jobs)*len(HM.STYLES)} renders", flush=True)

    for job in jobs:
        subj = subj_of(job["key"]); shot = job["shot"]
        pd = os.path.join(PLATES, job["key"])
        sh_up = bk.upload(os.path.join(pd, "shaded_plate.png"))
        op_up = bk.upload(os.path.join(pd, "openpose.png"))
        dep_up = bk.upload(os.path.join(pd, "depth_plate.png"))
        outdir = os.path.join(OUT, job["key"]); os.makedirs(outdir, exist_ok=True)
        prompts = {}
        for s in HM.STYLES:
            prompt = HM.prompt_for(subj, shot, style_text(s))
            g = graph(prompt, 7000 + hash(job["key"]) % 1000, f"{job['key']}_{s['key']}",
                      shaded_name=sh_up, depth_name=dep_up, pose_name=op_up)
            dest = os.path.join(outdir, f"gen_{s['key']}.png")
            try:
                dt = bk.run(g, dest); prompts[s["key"]] = prompt
                print(f"  [{job['key']}/{s['key']}] {dt:.0f}s", flush=True)
            except Exception as e:
                print(f"  [{job['key']}/{s['key']}] FAILED {repr(e)[:150]}", flush=True)
        json.dump({"subject": subj["key"], "shot": shot, "prompts": prompts},
                  open(os.path.join(outdir, "prompts.json"), "w"), indent=1)
    print("HANDS_BATCH_DONE", flush=True)


if __name__ == "__main__":
    main()
