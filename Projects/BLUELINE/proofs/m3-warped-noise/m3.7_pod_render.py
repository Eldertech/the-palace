#!/usr/bin/env python3
"""
BLUELINE M3.7 + M4 — batched on ONE pod (saves a boot). Reuses m3_pod_render's hardened Pod/graph/transport.

M3.7 — cumulative SEQUENCE (renders-seq/): a 6-frame coil->leap motion, two conditions, cinematic prompt:
   s0 = A (N_A, pose_s0) shared start; then per frame s1..s5:
   B_s{i}_seedlock (N_A, pose_s{i})   vs   B_s{i}_warped (chained warp N_chain_s{i}, pose_s{i}).
   Question: does the per-step warped chain read as SMOOTHER motion (higher adjacent-frame coherence)
   than fixed-noise seed-lock?  -> 11 frames.

M4 — comic <-> hyperreal PAIR (renders-m4/): the SAME board (same pose + same noise N_A) rendered in two
   style registers, for boards A (coil) and B (leap). Question: does identity/scene survive the style jump
   with NO identity model? (establishes the baseline Track II's PuLID must beat.)  -> 4 frames.

Run via the orchestrator (--render-script m3.7_pod_render.py), or: python3 m3.7_pod_render.py --pod <id>
"""
import argparse, json, sys, time
from pathlib import Path
from m3_pod_render import Pod, graph, b64_of, PROMPT, HERE

# ── per-agent namespace (multi-agent safety) ─────────────────────────────────
import os as _bootstrap_os
def _find_runpod_ns():
    d = _bootstrap_os.path.dirname(_bootstrap_os.path.abspath(__file__))
    for _ in range(10):
        cand = _bootstrap_os.path.join(d, "_ops", "runpod")
        if _bootstrap_os.path.isfile(_bootstrap_os.path.join(cand, "agent_ns.py")):
            return cand
        nd = _bootstrap_os.path.dirname(d)
        if nd == d:
            break
        d = nd
    return None
_ns_dir = _find_runpod_ns()
if _ns_dir and _ns_dir not in sys.path:
    sys.path.insert(0, _ns_dir)
from agent_ns import read_pod_id, SLUG

# M4 two-register prompts — SAME subject as PROMPT, only the rendering register differs.
SUBJ = "a lone figure in a charcoal flight jacket, copper undercut, surreal mathematical landscape"
HYPER = (f"{SUBJ}, hyperreal cinematic photograph, dramatic key light, volumetric haze, film grain, "
         "shallow depth of field, photorealistic skin, 8k, dramatic impact moment, sharp focus")
COMIC = (f"{SUBJ}, bande dessinée comic panel, bold black ink outlines, flat cel-shaded color, "
         "screen-tone shading, graphic-novel illustration, clean linework, sharp focus")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pod", default=None)
    a = ap.parse_args()
    pid = read_pod_id(a.pod)
    pod = Pod(pid); print(f"pod {pid} | base {pod.B}")
    if not pod.alive(): sys.exit(f"pod {pid} not reachable at {pod.B}/system_stats")
    time.sleep(10)  # settle

    seq = json.load(open(HERE / "seq" / "seq-manifest.json"))["frames"]
    # (outdir, label, noise_rel, pose_rel, prompt)
    frames = []
    f0 = seq[0]
    frames.append(("renders-seq", "A", f0["seedlock_noise"], f0["pose_png"], PROMPT))   # shared start
    for f in seq[1:]:
        frames.append(("renders-seq", f"B_s{f['i']}_seedlock", f["seedlock_noise"], f["pose_png"], PROMPT))
        frames.append(("renders-seq", f"B_s{f['i']}_warped",   f["warped_noise"],   f["pose_png"], PROMPT))
    poseA, poseB = seq[0]["pose_png"], seq[-1]["pose_png"]
    frames += [("renders-m4", "A_hyper", "N_A.npy", poseA, HYPER),
               ("renders-m4", "A_comic", "N_A.npy", poseA, COMIC),
               ("renders-m4", "B_hyper", "N_A.npy", poseB, HYPER),
               ("renders-m4", "B_comic", "N_A.npy", poseB, COMIC)]

    for od in {f[0] for f in frames}: (HERE / od).mkdir(parents=True, exist_ok=True)
    uploaded, b64cache, results = {}, {}, {}
    for _, _, _, pose, _ in frames:
        if pose not in uploaded:
            uploaded[pose] = pod.upload(str(HERE / pose)); print(f"  uploaded {pose} -> {uploaded[pose]}")
    for od, label, noise_rel, pose, prompt in frames:
        if noise_rel not in b64cache: b64cache[noise_rel] = b64_of(noise_rel)
        wf = graph(prompt, uploaded[pose], b64cache[noise_rel], f"m37_{label}")
        t0 = time.time(); jid = pod.submit(wf)
        print(f"  [{od}/{label}] submitted {jid} — waiting…")
        hist = pod.wait(jid)
        if hist.get("status", {}).get("status_str") != "success":
            raise RuntimeError(f"[{label}] failed: {json.dumps(hist.get('status',{}))[:300]}")
        dest = pod.fetch(hist, str(HERE / od / f"{label}.png"))
        results[f"{od}/{label}"] = dest
        print(f"  [{od}/{label}] SAVED {dest}  ({time.time()-t0:.0f}s)")
    json.dump({"pod": pid, "hyper": HYPER, "comic": COMIC, "base": PROMPT, "frames": results},
              open(HERE / "renders-seq" / "render-manifest.json", "w"), indent=2)
    print("M37_M4_POD_RENDER_DONE", json.dumps(list(results.keys())))

if __name__ == "__main__":
    main()
