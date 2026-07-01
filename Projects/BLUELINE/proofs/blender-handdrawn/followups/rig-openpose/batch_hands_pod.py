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
POSE_STRENGTH, POSE_END = 0.70, 0.80
DEPTH_STRENGTH, DEPTH_END = 0.50, 0.70


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
        op_up = bk.upload(os.path.join(pd, "openpose.png"))
        dep_up = bk.upload(os.path.join(pd, "depth_plate.png"))
        outdir = os.path.join(OUT, job["key"]); os.makedirs(outdir, exist_ok=True)
        prompts = {}
        for s in HM.STYLES:
            prompt = HM.prompt_for(subj, shot, style_text(s))
            g = RS.graph(prompt, W, H, 7000 + hash(job["key"]) % 1000, f"{job['key']}_{s['key']}",
                         pose_name=op_up, depth_name=dep_up)
            g["ap_pose"]["inputs"]["strength"] = POSE_STRENGTH
            g["ap_pose"]["inputs"]["end_percent"] = POSE_END
            g["ap_depth"]["inputs"]["strength"] = DEPTH_STRENGTH
            g["ap_depth"]["inputs"]["end_percent"] = DEPTH_END
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
