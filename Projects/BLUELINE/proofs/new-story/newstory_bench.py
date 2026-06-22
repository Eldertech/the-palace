#!/usr/bin/env python3
"""
BLUELINE · NEW STORY — Blender blocking (Track IV path) for the powered-noir tragedy's character shots.

Reuses the proven Track IV bench machinery (metaball mannequin, camera-grammar solvers, pass emission)
and only adds the new story's COCO-18 poses + camera grammars + a per-shot camera-FILL. Each shot emits
registered passes (geometric OpenPose keypoints + Blender depth/normal/rgb) into new-story/passes; post.py
draws the OpenPose PNG; validate_pose.py scores the pose on the cheap greybox; render_shot.py renders it in
locked pen-flow via the Seam-B path.

The autonomous loop: edit pose -> blender (greybox, fast) -> validate_pose.py + eyeball -> adjust -> render.

Run headless:  /opt/homebrew/bin/blender --background --python newstory_bench.py
Then (comfy venv): python post.py ; python validate_pose.py ; python render_shot.py --shot 05 --pose passes/NS-05_openpose.png --depth passes/NS-05_depth.png
"""
import bpy, os, sys
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
BENCH = os.path.normpath(os.path.join(HERE, "..", "track-IV-bench"))
sys.path.insert(0, BENCH)
import bench  # reuse build_body / fit_camera / materials / emit_shot / write_board / GRAMMARS

bench.P_DIR = os.path.join(HERE, "passes"); bench.B_DIR = os.path.join(HERE, "boards"); bench.BL_DIR = os.path.join(HERE, "blends")
for d in (bench.P_DIR, bench.B_DIR, bench.BL_DIR): os.makedirs(d, exist_ok=True)

# ---- NEW STORY POSES (COCO-18, Z up; -Y = chest faces the camera) -----------------------------------
def hero_point():   # shot 02: standing, right arm thrust forward pointing at the crowd
    return {0:(0,-.10,1.66),1:(0,-.04,1.50),2:(-.22,-.02,1.46),3:(-.30,-.34,1.40),4:(-.34,-.66,1.36),
            5:(.22,-.02,1.46),6:(.30,.12,1.18),7:(.34,.14,.92),8:(-.16,0,.96),9:(-.18,-.04,.54),
            10:(-.18,0,.10),11:(.16,0,.96),12:(.18,-.04,.54),13:(.18,0,.10),
            14:(-.04,-.16,1.71),15:(.04,-.16,1.71),16:(-.10,-.10,1.69),17:(.10,-.10,1.69)}

def leap_legs():    # shot 03: explosive crouch LOADED to spring (close-up frames the legs)
    return {0:(0,-.10,1.05),1:(0,-.04,.92),2:(-.18,-.02,.88),3:(-.22,.10,.70),4:(-.20,.22,.55),
            5:(.18,-.02,.88),6:(.22,.10,.70),7:(.20,.22,.55),8:(-.16,0,.62),9:(-.24,-.22,.30),
            10:(-.22,-.05,.05),11:(.16,0,.62),12:(.24,-.22,.30),13:(.22,-.05,.05),
            14:(-.04,-.14,1.09),15:(.04,-.14,1.09),16:(-.09,-.08,1.07),17:(.09,-.08,1.07)}

def plummet():      # shot 04: falling, arms trailing UP, legs back (seen from below)
    return {0:(0,.05,1.70),1:(0,0,1.52),2:(-.20,-.05,1.50),3:(-.34,-.10,1.74),4:(-.42,-.12,1.96),
            5:(.20,-.05,1.50),6:(.34,-.10,1.74),7:(.42,-.12,1.96),8:(-.15,0,.96),9:(-.18,.12,.55),
            10:(-.16,.22,.16),11:(.15,0,.96),12:(.18,.12,.55),13:(.16,.22,.16),
            14:(-.04,.09,1.74),15:(.04,.09,1.74),16:(-.10,.03,1.72),17:(.10,.03,1.72)}

def impact_landing():  # shot 05: three-point landing — head UP, central planted fist, wide stance
    return {0:(0,-.12,.92),1:(0,-.05,.78),2:(-.18,-.05,.72),3:(-.10,-.20,.40),4:(0,-.32,.05),
            5:(.18,-.05,.72),6:(.42,.10,.74),7:(.62,.20,.74),8:(-.12,0,.52),9:(-.16,-.18,.12),
            10:(-.16,-.40,.05),11:(.14,.05,.52),12:(.36,.22,.18),13:(.44,.34,.05),
            14:(-.04,-.16,.95),15:(.04,-.16,.95),16:(-.09,-.10,.93),17:(.09,-.10,.93)}

def kiss():         # shot 06: leaning down, head forward-down, arms forward cradling (intimate close)
    return {0:(0,-.30,1.10),1:(0,-.12,1.20),2:(-.18,-.10,1.18),3:(-.22,-.28,1.02),4:(-.18,-.44,.92),
            5:(.18,-.10,1.18),6:(.22,-.28,1.02),7:(.18,-.44,.92),8:(-.14,.05,.80),9:(-.16,.10,.45),
            10:(-.14,.05,.08),11:(.14,.05,.80),12:(.16,.10,.45),13:(.14,.05,.08),
            14:(-.05,-.32,1.12),15:(.03,-.32,1.12),16:(-.10,-.26,1.10),17:(.06,-.26,1.10)}

bench.POSES.update({
    "hero_point": (hero_point, "-Y"), "leap_legs": (leap_legs, "-Y"), "plummet": (plummet, "-Y"),
    "impact_landing": (impact_landing, "-Y"), "kiss": (kiss, "-Y"),
})

# per-shot camera FILL (the bench's fit_camera hardcodes 0.82; wrap it to read a per-shot value).
_real_fit = bench.fit_camera
def _fit(scene, cam, J, target, dir_off, lens, fill=0.82):
    return _real_fit(scene, cam, J, target, dir_off, lens, fill=getattr(bench, "_ns_fill", 0.82))
bench.fit_camera = _fit

# ---- NEW CAMERA GRAMMARS (reuse worms_eye/low_hero/ots from the bench otherwise) ----
def grammar_medium(J, face):
    f = Vector((0,-1,0)) if face=="-Y" else Vector((0,1,0))
    return dict(target=J[1], dir_off=f*1.0 + Vector((0.12,0,0.04)), lens=50, note="medium eye-level")
def grammar_close_legs(J, face):
    f = Vector((0,-1,0)) if face=="-Y" else Vector((0,1,0))
    return dict(target=(J[9]+J[12])*0.5, dir_off=f*1.0 + Vector((0.10,0,-0.20)), lens=45, note="close on the legs (high fill)")
def grammar_from_below(J, face):
    f = Vector((0,-1,0)) if face=="-Y" else Vector((0,1,0))
    return dict(target=(J[8]+J[11])*0.5, dir_off=f*0.6 + Vector((0,0,-1.4)), lens=24, note="from below, looking up")
def grammar_close_up(J, face):
    f = Vector((0,-1,0)) if face=="-Y" else Vector((0,1,0))
    return dict(target=J[0], dir_off=f*1.0 + Vector((0.10,0,0.12)), lens=70, note="extreme close-up on head/hands")
bench.GRAMMARS.update({"medium": grammar_medium, "close_legs": grammar_close_legs,
                       "from_below": grammar_from_below, "close_up": grammar_close_up})

# ---- the dynamic character shots (NS-02 already done) ----
NS_SHOTS = [
    ("NS-03", "leap_legs",      "close_legs", 1.50),  # crop to the exploding legs
    ("NS-04", "plummet",        "from_below", 0.70),  # figure looms above, falling toward cam
    ("NS-05", "impact_landing", "low_hero",   0.50),  # heroic low angle, wide for the ground ring
    ("NS-06", "kiss",           "close_up",   1.10),  # head + hands fill the frame
]

if __name__ == "__main__":
    for sid, pose, gram, fill in NS_SHOTS:
        bench._ns_fill = fill
        g, face = bench.emit_shot(sid, pose, gram)
        bench.write_board(sid, pose, gram, g, face)
        print("EMITTED", sid, pose, gram, f"fill={fill}", flush=True)
    print("NEWSTORY_BENCH_DONE")
