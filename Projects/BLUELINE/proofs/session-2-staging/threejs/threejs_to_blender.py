#!/usr/bin/env python3
"""
BLUELINE Session 2 — Three.js path, the Blender export leg.

The Three.js stager (stager.html) edits the staging spec live and exports it
(`alley-shot.exported.json`). Because the spec IS the interchange format, the
"export to Blender" step is just running the shared Blender backend on that spec —
no lossy conversion, no separate importer. This proves the challenger lands a
hand-editable .blend exactly like the SceneCraft path.

Usage:
  python3 threejs_to_blender.py [exported-spec.json]
  (defaults to the canonical spec when no export file is given)
"""
import os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, ".."))
BLENDER = "/opt/homebrew/bin/blender"
BUILDER = os.path.join(ROOT, "scenecraft", "scenecraft_build.py")

spec = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "alley-shot.staging.json")
out_blend = os.path.join(HERE, "alley-threejs-export.blend")
out_png = os.path.join(ROOT, "renders", "threejs-export.png")

cmd = [BLENDER, "--background", "--python", BUILDER, "--", spec, out_blend, out_png]
print("running:", " ".join(cmd))
r = subprocess.run(cmd, capture_output=True, text=True)
ok = "SCENECRAFT_DONE" in r.stdout
print("export ok:", ok)
if not ok:
    print(r.stdout[-1500:]); print(r.stderr[-800:])
print("WROTE", out_blend if ok else "(failed)")
