#!/usr/bin/env python3
"""
BLUELINE cloud-I2V — pod LIFECYCLE owner (the spend). Creates a RunPod ComfyUI pod on the
blueline-models volume, downloads SVD-XT to the volume (cached for next time), GATES on readiness
(ComfyUI up + svd_xt.safetensors in the checkpoint list), runs the SVD img2vid test via
svd_render.py, and ALWAYS terminates the pod in finally — a boot/render failure costs minutes,
not a leaked GPU. Loudon greenlit ~$1-3 for this run.

Mirrors the proven m3_pod_orchestrator; the only differences are: download SVD (non-gated mirror)
instead of the FLUX ControlNet, no custom node, and a longer boot timeout for the 9.6 GB download.

MULTI-AGENT (2026-07-03): the pod is per-agent-namespaced — "blueline-cloud-i2v--<slug>" (see
_ops/runpod/agent_ns.py + _ops/commons). Lifecycle is delegated to the Commons RunpodPodProvider,
so guard (list_mine), create (flaky-500 recover-by-name + cull), and terminate are all scoped to
THIS agent's slug — safe to run concurrently with other Claudes on the same RunPod account. A
best-effort `reap --self --force` in finally sweeps any older leaked pod of MINE (a prior crashed
run whose finally never fired); it can never touch this run's pod (spared) or another agent's.

  python3 svd_orchestrator.py
  python3 svd_orchestrator.py --terminate-only <podId>
"""
import argparse, json, ssl, subprocess, sys, time
import urllib.request, urllib.error
from pathlib import Path

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
from agent_ns import SLUG, pod_name, pod_id_file       # noqa: E402
from commons.providers.runpod_pod import RunpodPodProvider   # pod lifecycle lives in the Commons provider  # noqa: E402
from commons import reaper                             # noqa: E402  (best-effort self-reap backstop)

PALACE = Path("/Users/loudonstearns/Documents/The Palace")
CONFIG = PALACE / "RunPod Images" / "studio" / "config.json"
HERE = Path(__file__).resolve().parent

VOLUME_ID = "aqm8oev4b0"                       # blueline-models (EU-RO-1)
IMAGE = "runpod/worker-comfyui:5.8.4-flux1-dev-fp8"   # ComfyUI worker; SVD nodes are core
GPU_IDS = ["NVIDIA GeForce RTX 4090", "NVIDIA L40S", "NVIDIA L40",
           "NVIDIA RTX A6000", "NVIDIA A40", "NVIDIA RTX A5000"]
CKPT = "svd_xt.safetensors"
SVD_HF = ("https://huggingface.co/thingthatis/stable-video-diffusion-img2vid-xt/"
          "resolve/main/svd_xt.safetensors")     # non-gated mirror of stabilityai SVD-XT (weights-only)
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"

try:
    import certifi; CTX = ssl.create_default_context(cafile=certifi.where())
except Exception:
    CTX = ssl._create_unverified_context()

_PROV = RunpodPodProvider(config_path=CONFIG)   # create/list_mine/cull/terminate, all slug-scoped

BASE = "blueline-cloud-i2v"
NAME = pod_name(BASE)          # display only; the provider owns naming ("<base>--<slug>")
POD_ID_FILE = pod_id_file()    # per-agent handoff: /tmp/pod_id-<slug>, never the shared path

def proxy_get(pid, path, timeout=15):
    url = f"https://{pid}-8188.proxy.runpod.net{path}"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout, context=CTX) as r:
        return r.read()

def start_script():
    # Volume-cache aware + aria2c (parallel, fast, resumable). If a COMPLETE copy (>9GB) is already on
    # the network volume, symlink it and boot in ~1 min. Otherwise aria2c-download to the fast container
    # disk (16 connections), then copy to the volume IN BACKGROUND so the slow volume *write* never
    # blocks ComfyUI and every future run is cached. The >9GB size check rejects any stale partial.
    return (
        'set -e\n'
        'mkdir -p /comfyui/models/checkpoints\n'
        f'CK=/comfyui/models/checkpoints/{CKPT}\n'
        f'VOL=/workspace/{CKPT}\n'
        'if [ -s "$VOL" ] && [ "$(stat -c%s "$VOL" 2>/dev/null || echo 0)" -gt 9000000000 ]; then\n'
        '  echo "[svd] using volume cache"; ln -sf "$VOL" "$CK";\n'
        'elif [ ! -s "$CK" ]; then\n'
        '  rm -f "$VOL" "$CK.part"\n'
        '  echo "[svd] fetch SVD-XT (~9.6GB)"\n'
        '  command -v aria2c >/dev/null || { apt-get update -qq && apt-get install -y -qq aria2 || true; }\n'
        '  if command -v aria2c >/dev/null; then\n'
        f'    aria2c -x16 -s16 -k1M --file-allocation=none --console-log-level=warn --dir=/comfyui/models/checkpoints -o {CKPT}.part "{SVD_HF}" && mv "$CK.part" "$CK";\n'
        '  else\n'
        f'    wget -q -O "$CK.part" "{SVD_HF}" && mv "$CK.part" "$CK";\n'
        '  fi\n'
        '  ( cp "$CK" "$VOL.part" && mv "$VOL.part" "$VOL" && echo "[svd] cached to volume" ) &\n'
        'fi\n'
        'ls -la /comfyui/models/checkpoints/ || true\n'
        'echo "[svd] launch ComfyUI"\n'
        'cd /comfyui && exec python -u main.py --disable-auto-launch --disable-metadata --listen --port 8188\n'
    )

def _spec():
    # base (not name): the provider tags ownership into the name as "<base>--<slug>".
    # max_tries/delay preserve this pod's patient capacity-retry (SVD wants a specific volume DC).
    return {"base": BASE, "image": IMAGE, "gpuTypeIds": GPU_IDS, "gpuCount": 1,
            "networkVolumeId": VOLUME_ID, "volumeMountPath": "/workspace",
            "ports": ["8188/http", "22/tcp"], "containerDiskInGb": 30,
            "dockerStartCmd": ["bash", "-c", start_script()],
            "max_tries": 12, "delay": 30}

def create_pod():
    r = _PROV.create(_spec())           # flaky-500 recover-by-name + cull-extras, all slug-scoped
    POD_ID_FILE.write_text(r.id)
    print(f"[create] pod {r.id} ({r.name}) — id at {POD_ID_FILE}")
    return r.id

def terminate(pid):
    return _PROV.terminate(pid)

def wait_ready(pid, boot_timeout=2400):     # worst case: a slow first download (cached runs boot in ~1 min)
    t0 = time.time(); comfy_up = False
    while time.time() - t0 < boot_timeout:
        el = int(time.time() - t0)
        if not comfy_up:
            try:
                proxy_get(pid, "/system_stats", timeout=10); comfy_up = True
                print(f"[ready] ComfyUI HTTP up at ~{el}s")
            except Exception:
                g, _ = _PROV.api("GET", f"/pods/{pid}")
                ds = g.get("desiredStatus") if isinstance(g, dict) else "?"
                print(f"[ready] waiting… {el}s (status={ds})"); time.sleep(10); continue
        try:
            ld = json.loads(proxy_get(pid, "/object_info/ImageOnlyCheckpointLoader", timeout=10))
            opts = ld.get("ImageOnlyCheckpointLoader", {}).get("input", {}).get("required", {}).get("ckpt_name", [[]])
            lst = opts[0] if opts and isinstance(opts[0], list) else []
            print(f"[ready] checkpoints: {lst}")
            if CKPT in lst: print(f"[ready] PASS at ~{el}s"); return True
        except Exception as e:
            print(f"[ready] probe retry ({el}s): {repr(e)[:120]}")
        time.sleep(10)
    return False

def _self_reap():
    """Best-effort backstop: sweep any older leaked pod of MINE. Never touches this run's pod
    (spared by the handoff file) or another agent's (scoped to my slug). Never breaks the run."""
    try:
        summary = reaper.reap(mode="self", force=True)
        if summary.get("terminated"):
            print(f"[reap] swept prior leaked pod(s): {summary['terminated']}")
    except Exception as e:
        print(f"[reap] skipped ({type(e).__name__}: {repr(e)[:100]})")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--terminate-only", default=None)
    ap.add_argument("--render-args", default="")
    a = ap.parse_args()
    print(f"[ns] agent slug={SLUG}  pod name={NAME}")
    if a.terminate_only: terminate(a.terminate_only); return

    # guard: don't stack MY pods (another agent's pods are invisible here)
    mine = _PROV.list_mine()
    if mine:
        print(f"[guard] my pod '{NAME}' already exists {[r.id for r in mine]} — abort. Run --terminate-only to remove it first."); sys.exit(2)

    pid = create_pod(); rc = 1
    try:
        if not wait_ready(pid): raise RuntimeError("pod did not reach render-ready state within timeout")
        print("[render] starting svd_render.py")
        cmd = [sys.executable, str(HERE / "svd_render.py"), "--pod", pid] + a.render_args.split()
        rc = subprocess.run(cmd, cwd=str(HERE)).returncode
        print(f"[render] svd_render exited {rc}")
    finally:
        print("[finally] tearing down pod (guaranteed)"); terminate(pid)
        _self_reap()
    sys.exit(rc)

if __name__ == "__main__":
    main()
