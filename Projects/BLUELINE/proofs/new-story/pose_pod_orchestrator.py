#!/usr/bin/env python3
"""
BLUELINE · FRAME DESIGNER — SDXL + OpenPose-ControlNet POD orchestrator (move generation off the Mac).

Boots the proven worker-comfyui image and downloads, into it (volume-free -> any datacenter):
  - sd_xl_base_1.0           (SDXL keeps the hand-drawn ink; FLUX smooths it away)
  - xinsir openpose SDXL CN  -> controlnet-openpose-sdxl.safetensors   (the names the pipeline's RS.graph uses)
  - xinsir depth SDXL CN     -> controlnet-depth-sdxl.safetensors
GATEs readiness on (ComfyUI up + SDXL ckpt present + openpose CN present), runs a render script against the
pod via the proxy, and ALWAYS terminates in finally. Create-retry across GPU types for capacity.

  python3 pose_pod_orchestrator.py                                   # runs rich_pipeline.py --pod <id>
  python3 pose_pod_orchestrator.py --render-script scene_pipeline.py --render-args "--seed 1100 --tag A --ngens 2"
  python3 pose_pod_orchestrator.py --terminate-only <podId>

MULTI-TENANT (2026-07-02): safe to run concurrently with other Claudes on the SAME RunPod account.
Every pod is named "blueline-sdxl-pose-cn-<slug>" where <slug> is this agent's namespace (see
_ops/runpod/agent_ns.py: $RUNPOD_AGENT_SLUG -> git worktree name -> host). The startup guard, cleanup,
cull, pod-id file and terminate are ALL scoped to that name, so an agent only ever sees and touches its
OWN pods -- it can no longer strangle another agent's booting pod (the "dud node" outage of 2026-07-02).
Optional: RUNPOD_LEASE=1 announces a cooperative GPU lease on the STIGMERGY board (advisory; add
RUNPOD_LEASE_STRICT=1 to abort if another agent already holds it). See Shop/RunPod GPU Backend.md.
"""
import argparse, json, ssl, subprocess, sys, time
import urllib.request, urllib.error
from pathlib import Path

# ── per-agent namespace (multi-agent safety) ─────────────────────────────────
# Locate the single-sourced slug helpers under _ops/runpod/, CWD-independent.
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
from agent_ns import SLUG, pod_name, pod_id_file   # fail-closed: import error > single-tenant run
import gpu_lease
from commons.providers.runpod_pod import RunpodPodProvider   # pod lifecycle lives in the Commons provider

PALACE = Path("/Users/loudonstearns/Documents/The Palace")
CONFIG = PALACE / "RunPod Images" / "studio" / "config.json"
HERE = Path(__file__).resolve().parent
IMAGE = "runpod/worker-comfyui:5.8.4-flux1-dev-fp8"
GPU_IDS = ["NVIDIA GeForce RTX 4090","NVIDIA GeForce RTX 3090","NVIDIA RTX A5000","NVIDIA L40","NVIDIA L40S",
           "NVIDIA RTX A6000","NVIDIA A40"]
CKPT = "sd_xl_base_1.0.safetensors"
CN_POSE = "controlnet-openpose-sdxl.safetensors"
SDXL_URL = "https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_base_1.0.safetensors"
OP_URL = "https://huggingface.co/xinsir/controlnet-openpose-sdxl-1.0/resolve/main/diffusion_pytorch_model.safetensors"
DEPTH_URL = "https://huggingface.co/xinsir/controlnet-depth-sdxl-1.0/resolve/main/diffusion_pytorch_model.safetensors"
CANNY_URL = "https://huggingface.co/xinsir/controlnet-canny-sdxl-1.0/resolve/main/diffusion_pytorch_model.safetensors"
import os as _os
_WITH_CANNY = bool(_os.environ.get("POD_CANNY"))  # faces want ink→canny + depth + openpose
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
try:
    import certifi; CTX = ssl.create_default_context(cafile=certifi.where())
except Exception:
    CTX = ssl._create_unverified_context()

_PROV = RunpodPodProvider(config_path=CONFIG)   # create/list/cull/terminate, all slug-scoped

def proxy_get(pid, path, timeout=15):
    req = urllib.request.Request(f"https://{pid}-8188.proxy.runpod.net{path}", headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout, context=CTX) as r: return r.read()

START = (
  'set -e\n'
  'mkdir -p /comfyui/models/checkpoints /comfyui/models/controlnet\n'
  'dl() {\n'
  '  if [ ! -e "$2" ]; then echo "[dl] start $(basename "$2")"; wget -q -O "$2.part" "$1"; '
  'SZ=$(stat -c%s "$2.part" 2>/dev/null || echo 0); '
  'if [ "$SZ" -gt "$3" ]; then mv "$2.part" "$2"; echo "[dl] ready $(basename "$2") ($SZ)"; '
  'else echo "[dl] FAILED $(basename "$2") ($SZ)"; rm -f "$2.part"; fi; fi; }\n'
  f'( dl "{SDXL_URL}" "/comfyui/models/checkpoints/{CKPT}" 1000000000 \n'
  f'  dl "{OP_URL}" "/comfyui/models/controlnet/{CN_POSE}" 1000000000 \n'
  + (f'  dl "{CANNY_URL}" "/comfyui/models/controlnet/controlnet-canny-sdxl.safetensors" 1000000000 \n' if _WITH_CANNY else '')
  + f'  dl "{DEPTH_URL}" "/comfyui/models/controlnet/controlnet-depth-sdxl.safetensors" 1000000000 ) &\n'
  'echo "[pod] launch ComfyUI (model downloads running in background)"\n'
  'cd /comfyui && exec python -u main.py --disable-auto-launch --disable-metadata --listen --port 8188\n'
)

BASE = "blueline-sdxl-pose-cn"
NAME = pod_name(BASE)          # display only; the provider owns naming ("<base>--<slug>")
POD_ID_FILE = pod_id_file()    # "/tmp/pod_id-<slug>", never the shared "/tmp/pod_id"

def _spec():
    return {"base": BASE, "image": IMAGE, "gpuTypeIds": GPU_IDS, "gpuCount": 1,
            "ports": ["8188/http"], "containerDiskInGb": 55, "dockerStartCmd": ["bash", "-c", START]}

def create_pod():
    """Delegate create (with flaky-500 recover-by-name + cull) to the slug-scoped provider."""
    r = _PROV.create(_spec())
    POD_ID_FILE.write_text(r.id)
    return r.id

def cleanup_named():
    mine = _PROV.list_mine(); print(f"[cleanup] {len(mine)} '{NAME}' pod(s): {[r.id for r in mine]}")
    for r in mine:
        _PROV.terminate(r)
    return len(mine)

def terminate(pid):
    return _PROV.terminate(pid)

def _opts(pid, node, field):
    try:
        info = json.loads(proxy_get(pid, f"/object_info/{node}", timeout=10))
        v = info.get(node, {}).get("input", {}).get("required", {}).get(field, [[]])
        return v[0] if v and isinstance(v[0], list) else []
    except Exception:
        return []

def wait_ready(pid, boot_timeout=1800):
    t0 = time.time(); up = False
    while time.time() - t0 < boot_timeout:
        el = int(time.time()-t0)
        if not up:
            try: proxy_get(pid, "/system_stats", timeout=10); up = True; print(f"[ready] ComfyUI HTTP up at ~{el}s")
            except Exception:
                g,_ = _PROV.api("GET", f"/pods/{pid}"); ds = g.get("desiredStatus") if isinstance(g,dict) else "?"
                print(f"[ready] waiting… {el}s (status={ds})"); time.sleep(10); continue
        cnames = _opts(pid, "ControlNetLoader", "control_net_name")
        ck = CKPT in _opts(pid, "CheckpointLoaderSimple", "ckpt_name")
        cn = CN_POSE in cnames
        cy = (not _WITH_CANNY) or ("controlnet-canny-sdxl.safetensors" in cnames)
        print(f"[ready] {el}s sdxl={ck} openpose_cn={cn} canny_cn={cy}")
        if ck and cn and cy: print(f"[ready] PASS at ~{el}s (sdxl+canny confirmed)"); return True
        time.sleep(10)
    return False

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--terminate-only", default=None)
    ap.add_argument("--render-script", default="rich_pipeline.py")
    ap.add_argument("--render-args", default="")
    ap.add_argument("--keep-alive", action="store_true", help="don't terminate (for batching multiple runs)")
    ap.add_argument("--cleanup", action="store_true", help=f"terminate MY '{NAME}' pods and exit")
    a = ap.parse_args()
    print(f"[ns] agent slug={SLUG}  pod name={NAME}")
    if a.cleanup: cleanup_named(); return
    if a.terminate_only: terminate(a.terminate_only); return
    # Guard on MY namespace only — another agent's pods are invisible here, so a concurrent
    # Claude on the same account no longer trips this abort (and I never see theirs to kill).
    mine = _PROV.list_mine()
    if mine:
        print(f"[guard] my pod '{NAME}' already exists {[r.id for r in mine]} — abort. "
              f"Run with --cleanup to remove it first."); sys.exit(2)
    gpu_lease.acquire("blueline-sdxl-pose-cn")   # opt-in via RUNPOD_LEASE; no-op otherwise
    pid = create_pod(); rc = 1
    try:
        if not wait_ready(pid): raise RuntimeError("pod did not reach ready")
        print(f"[render] {a.render_script} --pod {pid} {a.render_args}")
        rc = subprocess.run([sys.executable, str(HERE/a.render_script), "--pod", pid] + a.render_args.split(),
                            cwd=str(HERE)).returncode
        print(f"[render] {a.render_script} exited {rc}")
    finally:
        if a.keep_alive and rc == 0:
            print(f"[finally] --keep-alive: pod {pid} LEFT RUNNING — terminate with --terminate-only {pid}")
        else:
            print("[finally] tearing down pod (guaranteed)"); terminate(pid)
        gpu_lease.release("blueline-sdxl-pose-cn")
    sys.exit(rc)

if __name__ == "__main__":
    main()
