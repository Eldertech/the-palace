"""Render all hand plate-sets (ink/depth/openpose+hands) from hands_manifest. System python3."""
import subprocess, os, sys
import hands_manifest as HM

HERE = os.path.dirname(os.path.abspath(__file__))
BL = "/Applications/Blender.app/Contents/MacOS/Blender"
COMFYPY = "/Users/loudonstearns/Documents/The Palace/_tools/ComfyUI/venv/bin/python3"
RIG = os.path.join(HERE, "hands_rig.py")

only = set(sys.argv[1:]) if len(sys.argv) > 1 else None
for job in HM.plate_jobs():
    if only and job["key"] not in only and job["subject"] not in only:
        continue
    print(f"\n=== {job['key']} ===", flush=True)
    r = subprocess.run([BL, "-b", "-P", RIG, "--",
        "--hand-pose", job["hand_pose"], "--shot", job["shot"],
        "--angle", str(job["angle"]), "--label", job["key"]],
        capture_output=True, text=True)
    print("\n".join(l for l in r.stdout.splitlines() if "visible" in l or "Error" in l or "Traceback" in l) or r.stdout[-200:], flush=True)
    pd = os.path.join(HERE, "renders", "hands", job["key"])
    d = subprocess.run([COMFYPY, os.path.join(HERE, "draw_openpose.py"), pd], capture_output=True, text=True)
    print("  " + (d.stdout.strip() or d.stderr.strip()[-160:]), flush=True)
print("\nHAND PLATES DONE")
