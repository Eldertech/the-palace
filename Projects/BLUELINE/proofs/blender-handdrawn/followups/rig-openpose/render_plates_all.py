"""Render the 8 example people's Blender plates (ink/depth/openpose) from the manifest.
Sequential Blender (v3) per person, then draw_openpose. Run with system python3."""
import subprocess, json, os, sys
import examples_manifest as EM

HERE = os.path.dirname(os.path.abspath(__file__))
BL = "/Applications/Blender.app/Contents/MacOS/Blender"
COMFYPY = "/Users/loudonstearns/Documents/The Palace/_tools/ComfyUI/venv/bin/python3"
V3 = os.path.join(HERE, "pose_rig_mpfb_v3.py")

only = sys.argv[1:] if len(sys.argv) > 1 else None
for p in EM.PEOPLE:
    if only and p["key"] not in only:
        continue
    m = p["macro"]
    print(f"\n=== {p['key']} ===", flush=True)
    r = subprocess.run([BL, "-b", "-P", V3, "--",
        "--label", p["key"],
        "--gender", str(m["gender"]), "--age", str(m["age"]), "--muscle", str(m["muscle"]),
        "--weight", str(m["weight"]), "--height", str(m["height"]),
        "--pose-json", json.dumps(p["pose"])], capture_output=True, text=True)
    tail = "\n".join(l for l in r.stdout.splitlines() if any(k in l for k in ("human:", "visible", "Error", "Traceback", "WARN")))
    print(tail or r.stdout[-300:], flush=True)
    posedir = os.path.join(HERE, "renders", "mpfb-v3", "pose_" + p["key"])
    d = subprocess.run([COMFYPY, os.path.join(HERE, "draw_openpose.py"), posedir],
                       capture_output=True, text=True)
    print("  " + (d.stdout.strip() or d.stderr.strip()[-200:]), flush=True)
print("\nALL PLATES DONE")
