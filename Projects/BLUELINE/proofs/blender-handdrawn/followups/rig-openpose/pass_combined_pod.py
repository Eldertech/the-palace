"""
Figure Rig — combined pod runner: hands+objects gen + Route B (B4, B6) on ONE pod.
RunPod boots are the bottleneck and flaky, so batch all three jobs per boot. No --keep-alive:
the orchestrator tears down after. Each sub-batch has its own CN-gate.

  POD_CANNY=1 python3 pose_pod_orchestrator.py --render-script <abs pass_combined_pod.py>
Invoked as: pass_combined_pod.py --pod <id>
"""
import argparse, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))


def run(script, pid, extra=()):
    path = os.path.join(HERE, script)
    print(f"\n===== {script} {' '.join(extra)} --pod {pid} =====", flush=True)
    rc = subprocess.run([sys.executable, path, "--pod", pid, *extra], cwd=HERE).returncode
    print(f"===== {script} exited {rc} =====", flush=True)
    return rc


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pod", required=True)
    a = ap.parse_args()
    rcs = []
    rcs.append(run("batch_hands_objects_pod.py", a.pod))
    rcs.append(run("multi_regionB_pod.py", a.pod, ["--scene", "B4_cradle"]))
    rcs.append(run("multi_regionB_pod.py", a.pod, ["--scene", "B6_held_up"]))
    rcs.append(run("multi_batch_pod.py", a.pod, ["--only", "A5_impact,A6_kiss"]))  # BLUELINE A5/A6' Route A
    print(f"\nCOMBINED_PASS_DONE rcs={rcs}", flush=True)
    sys.exit(0 if all(r == 0 for r in rcs) else 1)


if __name__ == "__main__":
    main()
