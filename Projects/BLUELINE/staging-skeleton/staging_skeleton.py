"""
staging_skeleton — ONE skeleton for BLUELINE (Python reference; mirrored by staging_skeleton.js).

The author-facing STAGING FRAME (the shoulder-shoulder-pelvis triangle, the chest-facing tick, and the
L/R handedness) is a PURE FUNCTION of canonical COCO-18 (BODY_18) OpenPose keypoints — the order the
SDXL/FLUX OpenPose ControlNet expects. The discipline (the whole point of this module):

    We never invent a keypoint the ControlNet wasn't trained on. Our frame is a DERIVED VIEW over the
    canonical points; the emit to the render is canonical OpenPose (OPENPOSE_LIMBS / OPENPOSE_COLORS),
    untouched. Authoring our frame and conditioning the render are then the SAME act.

This reconciles the "opposite skeleton" observation: OpenPose draws the torso as a neck-HUB (the neck is
the apex; four limbs radiate down to the shoulders and hips), so it "points up" to the neck. Our staging
frame is a shoulder-shoulder-PELVIS triangle (the shoulder line is the wide base on top, converging to a
pelvis apex below), so it "points down". Same points, opposite apex — and the pelvis apex is the one thing
COCO-18 lacks natively (no mid-hip), so we DERIVE it as midpoint(R_hip, L_hip). (BODY_25 has a native
mid-hip + feet; staying COCO-18 keeps us ControlNet-safe and we derive the apex — see README.)

Both languages are validated against the same golden file: staging-skeleton.fixtures.json.
Run `python staging_skeleton.py --gen` to (re)generate the fixtures from the SAMPLES below.
"""
import math, json, os, sys

# Canonical COCO-18 / BODY_18 index map — the OpenPose order the ControlNet reads.
IDX = {"nose":0,"neck":1,"r_sho":2,"r_elb":3,"r_wri":4,"l_sho":5,"l_elb":6,"l_wri":7,
       "r_hip":8,"r_kne":9,"r_ank":10,"l_hip":11,"l_kne":12,"l_ank":13,
       "r_eye":14,"l_eye":15,"r_ear":16,"l_ear":17}

# The canonical neck-hub limb topology + the standard OpenPose limb colors. Emit these UNTOUCHED to the
# ControlNet — this module is the single source so the bench (post.py) and the comic renderer stop
# hardcoding their own copies.
OPENPOSE_LIMBS = [(1,2),(1,5),(2,3),(3,4),(5,6),(6,7),(1,8),(8,9),(9,10),
                  (1,11),(11,12),(12,13),(1,0),(0,14),(14,16),(0,15),(15,17)]
OPENPOSE_COLORS = [(255,0,0),(255,85,0),(255,170,0),(255,255,0),(170,255,0),(85,255,0),(0,255,0),
                   (0,255,85),(0,255,170),(0,255,255),(0,170,255),(0,85,255),(0,0,255),(85,0,255),
                   (170,0,255),(255,0,255),(255,0,170),(255,0,85)]

# Anatomical sides — the character's OWN left/right (the laterality DECLARATION, the #1 render-error fix:
# we DECLARE which keypoint is R vs L so a swapped/merged hand stops being the estimator's guess).
R_SIDE = (2,3,4,8,9,10)     # char RIGHT -> green
L_SIDE = (5,6,7,11,12,13)   # char LEFT  -> coral
def lr_side(idx):
    if idx in R_SIDE: return "R"
    if idx in L_SIDE: return "L"
    return "C"              # centerline: nose/neck/eyes/ears

# A front-facing shoulder span (|L_sho.x - R_sho.x| / |neck-pelvis|) calibrated to our mannequin's
# proportions — the reference the facing ESTIMATE uses to read frontality. Mannequin-calibrated on purpose.
FRONT_SHOULDER_RATIO = 0.42

def r4(x):                  # identical rounding in Python and JS: sign * floor(|x|*1e4 + 0.5)/1e4
    return (1 if x >= 0 else -1) * math.floor(abs(x)*1e4 + 0.5) / 1e4

def _p(kp, i):              # tolerate {int:..} or {str:..} and [x,y] or [x,y,conf]
    v = kp.get(i, kp.get(str(i)))
    return (float(v[0]), float(v[1]))
def _mid(a, b): return ((a[0]+b[0])/2.0, (a[1]+b[1])/2.0)
def _sub(a, b): return (a[0]-b[0], a[1]-b[1])
def _norm(v):
    d = math.hypot(v[0], v[1]) or 1.0
    return (v[0]/d, v[1]/d)
def _r4p(p): return [r4(p[0]), r4(p[1])]

def facing_from_keypoints(kp):
    """ESTIMATE chest yaw in [-1 (screen-L) .. 0 (camera) .. +1 (screen-R)] from a 2D/projected skeleton.
    HONEST LIMITS: 2D carries a front/back ambiguity (a back-facing chest reads like a front one), so the
    animatic AUTHORS facing and the 3D bench is authoritative. This estimate exists for the fidelity DIFF
    (build #2), never for authoring. Mannequin-calibrated via FRONT_SHOULDER_RATIO."""
    rs, ls = _p(kp, 2), _p(kp, 5)
    pelvis = _mid(_p(kp, 8), _p(kp, 11))
    neck = _p(kp, 1)
    scale = math.hypot(*_sub(neck, pelvis)) or 1.0
    span = (ls[0] - rs[0]) / scale                          # ~+FRONT_RATIO at full front, ~0 in profile
    frontality = max(0.0, min(1.0, abs(span) / FRONT_SHOULDER_RATIO))
    mag = 1.0 - frontality                                  # more turned -> larger |facing|
    nose = _p(kp, 0); sh_mid = _mid(rs, ls)
    yaw_dir = (nose[0] - sh_mid[0]) / scale                 # which way the head leads -> the sign
    s = 1.0 if yaw_dir >= 0 else -1.0
    return r4(max(-1.0, min(1.0, s * mag)))

def staging_frame(kp, facing=None):
    """Derive the author-facing staging frame from canonical COCO-18 keypoints. `facing` is the AUTHORED
    chest yaw (-1..+1) when known (animatic / board record); if None it is ESTIMATED (see above)."""
    rs, ls = _p(kp, 2), _p(kp, 5)
    pelvis = _mid(_p(kp, 8), _p(kp, 11))                    # DERIVED mid-hip (the apex COCO-18 lacks)
    neck = _p(kp, 1)
    sh_mid = _mid(rs, ls)
    src = "authored"
    if facing is None:
        facing = facing_from_keypoints(kp); src = "estimated"
    f = max(-1.0, min(1.0, float(facing)))
    tick = (f, math.sqrt(max(0.0, 1.0 - f*f)))             # chest-normal in image space (+y down) — M2's convention
    nose = _p(kp, 0)
    ear_mid = _mid(_p(kp, 16), _p(kp, 17))
    head = _norm(_sub(nose, ear_mid))                       # head-yaw direction (ear midpoint -> nose)
    return {
        "shoulder_R": _r4p(rs), "shoulder_L": _r4p(ls),
        "pelvis": _r4p(pelvis), "pelvis_derived": True,
        "neck": _r4p(neck), "shoulder_mid": _r4p(sh_mid),
        "triangle": [_r4p(rs), _r4p(ls), _r4p(pelvis)],     # R_sho, L_sho, pelvis  (the ▽)
        "facing": r4(f), "facing_source": src,
        "facing_tick": [r4(tick[0]), r4(tick[1])],
        "head": _r4p(nose), "head_facing": [r4(head[0]), r4(head[1])],
        "lr": {"R": list(R_SIDE), "L": list(L_SIDE)},
    }

# ── sample poses (image-space COCO-18, 832x1216) used to generate the golden fixtures ──
SAMPLES = {
  "front_stand": {  # symmetric, facing the camera
    0:[416,300,1],1:[416,360,1],2:[340,380,1],3:[320,520,1],4:[316,650,1],5:[492,380,1],6:[512,520,1],
    7:[516,650,1],8:[372,720,1],9:[368,900,1],10:[364,1080,1],11:[460,720,1],12:[464,900,1],13:[468,1080,1],
    14:[400,292,1],15:[432,292,1],16:[384,300,1],17:[448,300,1]},
  "turned_right": {  # chest yawed toward screen-right; shoulders foreshortened, head leads right
    0:[470,302,1],1:[420,360,1],2:[372,372,1],3:[360,510,1],4:[358,640,1],5:[468,378,1],6:[500,512,1],
    7:[512,640,1],8:[392,720,1],9:[388,900,1],10:[384,1080,1],11:[452,722,1],12:[456,902,1],13:[460,1082,1],
    14:[452,294,1],15:[486,296,1],16:[430,302,1],17:[470,304,1]},
  "profile_right": {  # near-profile to screen-right; shoulders nearly overlap
    0:[492,304,1],1:[424,360,1],2:[404,366,1],3:[398,508,1],4:[396,636,1],5:[440,368,1],6:[470,510,1],
    7:[492,636,1],8:[416,722,1],9:[412,902,1],10:[408,1082,1],11:[440,724,1],12:[444,904,1],13:[448,1084,1],
    14:[476,296,1],15:[502,298,1],16:[452,304,1],17:[486,306,1]},
}
# authored facing for the deterministic golden cases (the estimate is tested separately, looser)
AUTHORED = {"front_stand":0.0, "turned_right":0.55, "profile_right":0.92}

def _gen():
    cases = []
    for name, kp in SAMPLES.items():
        cases.append({"name":name, "keypoints":kp, "authored_facing":AUTHORED[name],
                      "frame_authored": staging_frame(kp, AUTHORED[name]),
                      "frame_estimated": staging_frame(kp, None),
                      "facing_estimate": facing_from_keypoints(kp)})
    doc = {"note":"golden fixtures for staging_skeleton — Python and JS must reproduce frame_* and "
                  "facing_estimate exactly (r4 rounding). Generated by staging_skeleton.py --gen.",
           "openpose_limbs": [list(l) for l in OPENPOSE_LIMBS],
           "cases": cases}
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "staging-skeleton.fixtures.json")
    json.dump(doc, open(out, "w"), indent=2)
    print("wrote", out, "—", len(cases), "cases")

if __name__ == "__main__":
    if "--gen" in sys.argv: _gen()
    else: print("staging_skeleton — run with --gen to write fixtures; import for staging_frame()/OPENPOSE_LIMBS")
