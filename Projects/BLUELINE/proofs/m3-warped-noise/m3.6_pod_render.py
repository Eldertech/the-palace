#!/usr/bin/env python3
"""
BLUELINE M3.6 — render the DELTA SWEEP on the pod. Reuses the hardened transport + FLUX graph from
m3_pod_render (Pod, graph, b64_of, PROMPT). Reads sweep/sweep-manifest.json and renders, on ONE pod:

  A                       : noise N_A, pose A_coil           (the anchor)
  B_t{tag}_seedlock       : noise N_A, pose_t{tag}           (reuse the latent — the baseline)
  B_t{tag}_warped         : noise N_warp_t{tag}, pose_t{tag} (the flow-warped noise at this delta)

for each delta t. Same prompt + params throughout. Output -> renders-sweep/. Does NOT manage the pod
lifecycle (the orchestrator owns create/terminate). Run via the orchestrator, or: python3 m3.6_pod_render.py --pod <id>
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

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pod", default=None)
    ap.add_argument("--out", default="renders-sweep")
    a = ap.parse_args()
    pid = read_pod_id(a.pod)
    out = (HERE / a.out); out.mkdir(parents=True, exist_ok=True)
    man = json.load(open(HERE / "sweep" / "sweep-manifest.json"))
    pod = Pod(pid)
    print(f"pod {pid} | base {pod.B} | {len(man['deltas'])} deltas")
    if not pod.alive():
        sys.exit(f"pod {pid} not reachable at {pod.B}/system_stats")
    time.sleep(10)  # settle (fast-booted ComfyUI answers /object_info before /upload is live)

    # build the frame list: anchor A, then seedlock+warped per delta
    frames = [("A", "N_A.npy", "passes/A_coil_openpose.png")]
    for d in man["deltas"]:
        tag = d["tag"]
        frames.append((f"B_t{tag}_seedlock", "N_A.npy", d["pose_png"]))
        frames.append((f"B_t{tag}_warped",   d["warp_npy"], d["pose_png"]))

    uploaded, b64cache, results = {}, {}, {}
    for _, _, pose in frames:
        if pose not in uploaded:
            uploaded[pose] = pod.upload(str(HERE / pose))
            print(f"  uploaded {pose} -> {uploaded[pose]}")
    for label, noise_rel, pose in frames:
        if noise_rel not in b64cache: b64cache[noise_rel] = b64_of(noise_rel)
        wf = graph(PROMPT, uploaded[pose], b64cache[noise_rel], f"m36_{label}")
        t0 = time.time()
        jid = pod.submit(wf)
        print(f"  [{label}] submitted {jid} (noise={noise_rel}, pose={Path(pose).name}) — waiting…")
        hist = pod.wait(jid)
        st = hist.get("status", {}).get("status_str")
        if st != "success":
            raise RuntimeError(f"[{label}] render failed: {json.dumps(hist.get('status',{}))[:400]}")
        dest = pod.fetch(hist, str(out / f"{label}.png"))
        results[label] = dest
        print(f"  [{label}] SAVED {dest}  ({time.time()-t0:.0f}s)")
    json.dump({"pod": pid, "prompt": PROMPT, "deltas": man["deltas"], "frames": results},
              open(out / "render-manifest.json", "w"), indent=2)
    print("M36_POD_RENDER_DONE", json.dumps(list(results.keys())))

if __name__ == "__main__":
    main()
