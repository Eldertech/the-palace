"""
Figure Rig — combined FACES + HANDS pod runner. One pod, both matrices, then the
orchestrator's finally tears it down (invoke WITHOUT --keep-alive). Solves the baton's
"boot one pod, run both, never leave it idle" while reusing the exact tested batch code.

Gates on ALL THREE controlnets (canny + depth + openpose) being present before the first
job — the orchestrator only waits on openpose, but the START download order is
SDXL → openpose → canny → depth, so canny/depth can still be mid-download at ready.

  POD_CANNY=1 python3 pose_pod_orchestrator.py \
      --render-script <abs path to this file>          # no --keep-alive: teardown after
Invoked by the orchestrator as:  this_file.py --pod <id>
"""
import argparse, json, os, ssl, subprocess, sys, time, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
try:
    import certifi; CTX = ssl.create_default_context(cafile=certifi.where())
except Exception:
    CTX = ssl._create_unverified_context()

NEED_CN = ["controlnet-openpose-sdxl.safetensors",
           "controlnet-canny-sdxl.safetensors",
           "controlnet-depth-sdxl.safetensors"]


def _cn_present(pid, timeout=10):
    url = f"https://{pid}-8188.proxy.runpod.net/object_info/ControlNetLoader"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout, context=CTX) as r:
        info = json.loads(r.read())
    v = info.get("ControlNetLoader", {}).get("input", {}).get("required", {}).get("control_net_name", [[]])
    return set(v[0] if v and isinstance(v[0], list) else [])


def wait_all_cn(pid, timeout=900):
    t0 = time.time()
    while time.time() - t0 < timeout:
        try:
            have = _cn_present(pid)
        except Exception as e:
            print(f"[cn-gate] object_info retry: {repr(e)[:120]}", flush=True); time.sleep(8); continue
        missing = [c for c in NEED_CN if c not in have]
        el = int(time.time() - t0)
        print(f"[cn-gate] {el}s present={sorted(have)} missing={missing}", flush=True)
        if not missing:
            print(f"[cn-gate] all 3 controlnets present at ~{el}s", flush=True); return True
        time.sleep(10)
    return False


def run_batch(script, pid):
    path = os.path.join(HERE, script)
    print(f"\n===== {script} --pod {pid} =====", flush=True)
    rc = subprocess.run([sys.executable, path, "--pod", pid], cwd=HERE).returncode
    print(f"===== {script} exited {rc} =====", flush=True)
    return rc


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pod", required=True)
    a = ap.parse_args()

    if not wait_all_cn(a.pod):
        sys.exit("[cn-gate] canny/depth never arrived — aborting before wasting the pod")

    rc_f = run_batch("batch_faces_pod.py", a.pod)
    rc_h = run_batch("batch_hands_pod.py", a.pod)

    print(f"\nCOMBINED_DONE faces_rc={rc_f} hands_rc={rc_h}", flush=True)
    # Non-zero only if a whole batch crashed; per-render failures are logged inside each batch.
    sys.exit(0 if (rc_f == 0 and rc_h == 0) else 1)


if __name__ == "__main__":
    main()
