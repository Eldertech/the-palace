"""Render all face plate-sets (ink/depth/openpose-face) from faces_manifest. System python3."""
import subprocess, os, sys
import faces_manifest as FM
HERE = os.path.dirname(os.path.abspath(__file__))
BL = "/Applications/Blender.app/Contents/MacOS/Blender"
COMFYPY = "/Users/loudonstearns/Documents/The Palace/_tools/ComfyUI/venv/bin/python3"
RIG = os.path.join(HERE, "faces_rig.py")

only = set(sys.argv[1:]) if len(sys.argv) > 1 else None
for label, pk, ex, shot in FM.plate_jobs():
    if only and label not in only:
        continue
    p = FM.PEOPLE[pk]
    print(f"\n=== {label} ({p['subject']} · {ex} · {shot}) ===", flush=True)
    r = subprocess.run([BL, "-b", "-P", RIG, "--",
        "--expression", ex, "--gender", str(p["gender"]), "--age", str(p["age"]),
        "--shot", shot, "--label", label], capture_output=True, text=True)
    print("\n".join(l for l in r.stdout.splitlines() if "face pts" in l or "Error" in l or "MISSING" in l) or r.stdout[-160:], flush=True)
    pd = os.path.join(HERE, "renders", "faces-rig", label)
    d = subprocess.run([COMFYPY, os.path.join(HERE, "draw_openpose.py"), pd], capture_output=True, text=True)
    print("  " + (d.stdout.strip() or d.stderr.strip()[-140:]), flush=True)
print("\nFACE PLATES DONE")
