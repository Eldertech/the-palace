#!/usr/bin/env python3
"""
BLUELINE · NEW STORY — Blender blocking (Track IV path) for the powered-noir tragedy's character shots.

Reuses the proven Track IV bench machinery (metaball mannequin, camera-grammar solvers, pass emission)
and only adds the new story's COCO-18 poses + any new camera grammars. Each shot emits registered passes
(geometric OpenPose keypoints + Blender depth/normal/rgb) into new-story/passes; post.py then draws the
OpenPose PNG; render_shot.py renders it in locked pen-flow via the Seam-B path.

Run headless:  /opt/homebrew/bin/blender --background --python newstory_bench.py
Then (comfy venv): python post.py   ;   python render_shot.py --shot 05 --pose passes/NS-05_openpose.png --depth passes/NS-05_depth.png
"""
import bpy, os, sys
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
BENCH = os.path.normpath(os.path.join(HERE, "..", "track-IV-bench"))
sys.path.insert(0, BENCH)
import bench  # reuse build_body / fit_camera / materials / emit_shot / write_board / GRAMMARS

# redirect the bench's outputs to the new-story bundle
bench.P_DIR = os.path.join(HERE, "passes"); bench.B_DIR = os.path.join(HERE, "boards"); bench.BL_DIR = os.path.join(HERE, "blends")
for d in (bench.P_DIR, bench.B_DIR, bench.BL_DIR): os.makedirs(d, exist_ok=True)

# ---- NEW STORY POSES (COCO-18, Z up; -Y = chest faces the camera) -----------------------------------
def hero_point():   # shot 02: standing on the car, right arm thrust FORWARD pointing at the crowd
    return {0:(0,-.10,1.66),1:(0,-.04,1.50),2:(-.22,-.02,1.46),3:(-.30,-.34,1.40),4:(-.34,-.66,1.36),
            5:(.22,-.02,1.46),6:(.30,.12,1.18),7:(.34,.14,.92),8:(-.16,0,.96),9:(-.18,-.04,.54),
            10:(-.18,0,.10),11:(.16,0,.96),12:(.18,-.04,.54),13:(.18,0,.10),
            14:(-.04,-.16,1.71),15:(.04,-.16,1.71),16:(-.10,-.10,1.69),17:(.10,-.10,1.69)}

def impact_landing():  # shot 05: three-point superhero landing — deep crouch, fist planted forward
    return {0:(-.04,-.32,.72),1:(-.02,-.18,.78),2:(-.20,-.12,.76),3:(-.22,-.28,.42),4:(-.22,-.40,.04),
            5:(.16,-.10,.76),6:(.34,.02,.60),7:(.46,.06,.50),8:(-.15,.05,.55),9:(-.18,-.25,.30),
            10:(-.16,-.42,.06),11:(.15,.12,.52),12:(.20,.45,.14),13:(.22,.70,.04),
            14:(-.07,-.34,.76),15:(-.01,-.34,.76),16:(-.11,-.28,.74),17:(.03,-.28,.74)}

bench.POSES.update({
    "hero_point":     (hero_point,     "-Y"),
    "impact_landing": (impact_landing, "-Y"),
})

# per-shot camera FILL: the bench's fit_camera fills 82% of frame height, which crops a low compact
# crouch (the legs + ground vanish). Wrap it so a shot can ask for a wider frame (lower fill) -> room
# for the ground ring / fallen body / crowd that the render prompt adds around the figure.
_real_fit = bench.fit_camera
def _fit(scene, cam, J, target, dir_off, lens, fill=0.82):
    return _real_fit(scene, cam, J, target, dir_off, lens, fill=getattr(bench, "_ns_fill", 0.82))
bench.fit_camera = _fit

# ---- NEW CAMERA GRAMMAR (medium, eye-level) — reuse worms_eye/low_hero/ots from the bench otherwise ----
def grammar_medium(J, face):
    f = Vector((0, -1, 0)) if face == "-Y" else Vector((0, 1, 0))
    return dict(target=J[1], dir_off=f * 1.0 + Vector((0.12, 0, 0.04)), lens=50,
                note="medium: near eye-level, centered, normal lens")
bench.GRAMMARS.update({"medium": grammar_medium})

# ---- the new-story character shots that have a pose authored so far ----------------------------------
NS_SHOTS = [
    ("NS-02", "hero_point",     "low_hero", 0.82),  # elevated, commanding -> low hero angle, tight on the figure
    ("NS-05", "impact_landing", "medium",   0.46),  # the landing -> eye-level, WIDE: room for the ground ring + body + crowd
]

if __name__ == "__main__":
    for sid, pose, gram, fill in NS_SHOTS:
        bench._ns_fill = fill
        g, face = bench.emit_shot(sid, pose, gram)
        bench.write_board(sid, pose, gram, g, face)
        print("EMITTED", sid, pose, gram, f"fill={fill}", flush=True)
    print("NEWSTORY_BENCH_DONE")
