"""
Figure Rig — RunPod batch: 8 people × 3 styles, all guided by OpenPose.

Pose-locked restyle (RunPod playbook): full SDXL generation conditioned on the figure's
OpenPose (+depth) ControlNet, so the OpenPose holds the pose while the prompt has free
rein over style. Same skeleton → 3 distinct styles.

Reuses the proven pod transport (pod_backend.Backend) + graph (render_shot.graph), run
from new-story/. Plates are read from ../blender-handdrawn/followups/rig-openpose/renders/mpfb-v3/pose_<key>/.

  # boot one pod (--keep-alive), then:
  python3 batch_pod.py --pod <id>                 # all 8 × 3
  python3 batch_pod.py --pod <id> --only musc_man # one person (verify-before-batch)
"""
import argparse, json, os, sys, importlib.util

HERE = os.path.dirname(os.path.abspath(__file__))
NEWSTORY = os.path.normpath(os.path.join(HERE, "..", "..", "..", "new-story"))
sys.path.insert(0, NEWSTORY)   # pod_backend + render_shot live here
sys.path.insert(0, HERE)       # examples_manifest

import examples_manifest as EM
from pod_backend import Backend
import render_shot as RS

PLATES = os.path.join(HERE, "renders", "mpfb-v3")
OUT = os.path.join(HERE, "renders", "examples")
W, H = 832, 1040
POSE_STRENGTH, POSE_END = 0.72, 0.80
DEPTH_STRENGTH, DEPTH_END = 0.50, 0.70


def style_text(s):
    return RS.STYLE_TXT if s["style"] == "__LOCKED__" else s["style"]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pod", required=True)
    ap.add_argument("--only", default=None, help="comma-sep person keys")
    ap.add_argument("--styles", default=None, help="comma-sep style keys")
    a = ap.parse_args()
    only = set(a.only.split(",")) if a.only else None
    style_keys = set(a.styles.split(",")) if a.styles else None

    bk = Backend(a.pod)
    people = [p for p in EM.PEOPLE if (not only or p["key"] in only)]
    styles = [s for s in EM.STYLES if (not style_keys or s["key"] in style_keys)]
    print(f"[batch] {len(people)} people × {len(styles)} styles = {len(people)*len(styles)} renders", flush=True)

    for p in people:
        key = p["key"]
        pd = os.path.join(PLATES, "pose_" + key)
        op_up = bk.upload(os.path.join(pd, "openpose.png"))
        dep_up = bk.upload(os.path.join(pd, "depth_plate.png"))
        outdir = os.path.join(OUT, key); os.makedirs(outdir, exist_ok=True)
        prompts = {}
        for s in styles:
            prompt = f"{p['subject']}, full body, {style_text(s)}"
            g = RS.graph(prompt, W, H, p["seed"], f"{key}_{s['key']}",
                         pose_name=op_up, depth_name=dep_up)
            g["ap_pose"]["inputs"]["strength"] = POSE_STRENGTH
            g["ap_pose"]["inputs"]["end_percent"] = POSE_END
            g["ap_depth"]["inputs"]["strength"] = DEPTH_STRENGTH
            g["ap_depth"]["inputs"]["end_percent"] = DEPTH_END
            dest = os.path.join(outdir, f"gen_{s['key']}.png")
            try:
                dt = bk.run(g, dest)
                prompts[s["key"]] = prompt
                print(f"  [{key}/{s['key']}] {dt:.0f}s -> {os.path.relpath(dest, HERE)}", flush=True)
            except Exception as e:
                print(f"  [{key}/{s['key']}] FAILED: {repr(e)[:200]}", flush=True)
        json.dump({"subject": p["subject"], "label": p["label"], "macro": p["macro"],
                   "prompts": prompts, "neg": RS.NEG},
                  open(os.path.join(outdir, "prompts.json"), "w"), indent=1)
    print("BATCH_DONE", flush=True)


if __name__ == "__main__":
    main()
