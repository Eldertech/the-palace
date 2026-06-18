#!/usr/bin/env python3
"""
BLUELINE — Blender Render Gallery (Seam A stress test).

Takes the animatic's staging vocabulary into Blender grey-box LAYOUT across a GALLERY of DRAMATIC
poses x DRAMATIC camera perspectives, and emits the conditioning passes (rgb / normal / depth /
geometric OpenPose keypoints) for each — so we can SEE where the 2D->3D handoff (Seam A) breaks:
foreshortening collapse, L/R limb ambiguity, keypoints projecting off-frame at extreme angles,
depth near/far at steep perspectives, the front-on default.

Self-contained (copies the proven metaball/camera/material machinery from track-IV-bench/bench.py;
adds camera ROLL for dutch, a per-grammar UP hint for top-down, and a dramatic pose+camera matrix).

Run headless:
  /opt/homebrew/bin/blender --background --python gallery.py
Then (ComfyUI venv, for cv2): python gallery_post.py    # draws openpose.png + canny.png per shot
View: gallery.html  (served from this folder)
"""
import bpy, json, math, os
from mathutils import Vector, Quaternion, Matrix
from bpy_extras.object_utils import world_to_camera_view

HERE = os.path.dirname(os.path.abspath(__file__))
P_DIR = os.path.join(HERE, "passes"); B_DIR = os.path.join(HERE, "boards"); BL_DIR = os.path.join(HERE, "blends")
for d in (P_DIR, B_DIR, BL_DIR): os.makedirs(d, exist_ok=True)
RES_X, RES_Y = 832, 1216           # SDXL portrait bucket (landscape grammars override below)

import sys; sys.path.insert(0, os.path.join(HERE, "..", "..", "staging-skeleton"))
import staging_skeleton as SK            # ONE skeleton — the canonical OpenPose limb topology from the shared module
LIMBS = [tuple(l) for l in SK.OPENPOSE_LIMBS]

# ───────────────────────── DRAMATIC POSE LIBRARY (COCO-18 world coords, Z up) ─────────────────────────
# `face` = which way +Y the chest points ("-Y" toward a default front camera). Indices:
# 0 nose 1 neck 2 Rsho 3 Relb 4 Rwri 5 Lsho 6 Lelb 7 Lwri 8 Rhip 9 Rknee 10 Rank 11 Lhip 12 Lknee 13 Lank 14/15 eyes 16/17 ears
def lunge():   # proven worm's-eye sword-draw lunge (carried from the bench for comparison); faces -Y
    return {0:( .04,-.20,1.55),1:( .00,-.10,1.42),2:(-.20,-.04,1.38),3:(-.34,.18,1.10),
            4:(-.30,.40,.88),5:( .20,-.02,1.40),6:( .30,-.30,1.25),7:( .30,-.62,1.05),
            8:(-.14,0,.92),9:(-.18,.42,.55),10:(-.22,.92,.28),11:( .14,0,.95),
            12:( .16,-.40,.52),13:( .18,-.78,.10),14:( .02,-.25,1.60),15:( .09,-.25,1.59),
            16:(-.05,-.20,1.58),17:( .13,-.18,1.57)}
def punch_at_cam():  # RIGHT fist thrust hard toward the camera (-Y) -> EXTREME foreshortening of the arm
    return {0:(0,-.16,1.60),1:(0,-.06,1.46),2:(-.20,-.02,1.42),3:(-.26,-.40,1.38),
            4:(-.20,-1.05,1.34),                                  # R-wrist far toward cam: the foreshortened punch
            5:(.22,.02,1.42),6:(.30,.16,1.16),7:(.30,.30,.92),
            8:(-.15,0,.95),9:(-.22,-.30,.55),10:(-.26,-.55,.12),  # weight on the back leg
            11:(.15,.04,.95),12:(.20,.34,.55),13:(.24,.62,.12),
            14:(-.05,-.21,1.65),15:(.05,-.21,1.65),16:(-.11,-.14,1.63),17:(.11,-.14,1.63)}
def back_arch():  # head thrown back, chest arched up (a scream / power pose); faces -Y
    return {0:(0,.22,1.74),1:(0,.06,1.54),2:(-.24,.04,1.50),3:(-.40,.10,1.34),4:(-.50,.18,1.10),
            5:(.24,.04,1.50),6:(.40,.10,1.34),7:(.50,.18,1.10),
            8:(-.16,-.06,.96),9:(-.20,-.14,.54),10:(-.22,-.08,.10),
            11:(.16,-.06,.96),12:(.20,-.14,.54),13:(.22,-.08,.10),
            14:(-.05,.28,1.78),15:(.05,.28,1.78),16:(-.12,.20,1.74),17:(.12,.20,1.74)}
def high_kick():  # right leg kicked up high to head height; arms counterbalance; faces -Y
    return {0:(.02,-.10,1.58),1:(.02,-.04,1.44),2:(-.20,-.06,1.40),3:(-.34,-.14,1.18),4:(-.42,-.20,.96),
            5:(.22,-.02,1.40),6:(.34,.06,1.16),7:(.42,.10,.92),
            8:(-.14,0,.92),9:(-.16,-.40,1.10),10:(-.18,-.70,1.46),   # R leg up high (ankle near head height)
            11:(.16,0,.92),12:(.18,.04,.50),13:(.20,.06,.08),        # L leg planted
            14:(-.04,-.16,1.63),15:(.06,-.16,1.62),16:(-.10,-.10,1.61),17:(.12,-.09,1.60)}
def fallen():  # lying on the ground, on the back, head toward -Y; the body is HORIZONTAL (z ~ 0.15)
    return {0:(0,-.95,.20),1:(0,-.70,.18),2:(-.22,-.66,.18),3:(-.30,-.40,.16),4:(-.34,-.16,.14),
            5:(.22,-.66,.18),6:(.30,-.42,.16),7:(.34,-.18,.14),
            8:(-.15,.02,.16),9:(-.18,.46,.16),10:(-.20,.88,.14),
            11:(.15,.02,.16),12:(.18,.46,.16),13:(.20,.88,.14),
            14:(-.05,-1.00,.22),15:(.05,-1.00,.22),16:(-.11,-.92,.20),17:(.11,-.92,.20)}
def spin_slash():  # mid-twist, both arms swung across the body to screen-left -> L/R limbs CROSS (the ambiguity test)
    return {0:(.06,-.10,1.58),1:(.02,-.04,1.44),2:(-.18,.06,1.40),3:(.02,-.18,1.30),4:(.28,-.30,1.24),
            5:(.22,-.06,1.40),6:(.34,-.22,1.28),7:(.40,-.40,1.18),  # both wrists swung to +x (screen side) — crossing
            8:(-.14,.04,.92),9:(-.10,-.30,.52),10:(.04,-.52,.10),    # legs mid-pivot
            11:(.16,-.04,.92),12:(.22,.20,.52),13:(.28,.40,.10),
            14:(.01,-.15,1.63),15:(.11,-.15,1.62),16:(-.05,-.10,1.61),17:(.15,-.08,1.60)}
def overhead():  # sword raised overhead mid-strike, left leg forward; faces +Y (away from a front cam)
    return {0:(0,.16,1.60),1:(0,.08,1.46),2:(-.22,.04,1.42),3:(-.30,.10,1.70),4:(-.18,.20,1.98),
            5:(.22,.04,1.42),6:(.28,.12,1.70),7:(.10,.22,1.98),
            8:(-.15,0,.94),9:(-.20,.30,.55),10:(-.22,.10,.12),11:(.15,.04,.96),
            12:(.18,.42,.58),13:(.16,.74,.20),14:(-.04,.20,1.65),15:(.04,.20,1.65),
            16:(-.10,.14,1.63),17:(.10,.14,1.63)}
POSES = {"lunge":(lunge,"-Y"), "punch_at_cam":(punch_at_cam,"-Y"), "back_arch":(back_arch,"-Y"),
         "high_kick":(high_kick,"-Y"), "fallen":(fallen,"-Y"), "spin_slash":(spin_slash,"-Y"),
         "overhead":(overhead,"+Y")}

def asV(tbl): return {k: Vector(v) for k, v in tbl.items()}

# ───────────────────────── DRAMATIC CAMERA GRAMMARS ─────────────────────────
# Each returns target / dir_off (direction from target to camera) / lens / optional roll (rad) /
# up ('Y' default; 'Z' for steep top-down to avoid gimbal) / aspect ('portrait'|'landscape') / note.
def g_extreme_worms(J, face):
    f = Vector((0,-1,0)) if face=="-Y" else Vector((0,1,0))
    tgt = (J[8]+J[11])*0.5                                  # aim at the hips so the figure looms over the lens
    return dict(target=tgt, dir_off=f*0.7+Vector((0.15,0,-0.95)), lens=18, note="extreme worm's-eye, 18mm — towering, steep up-angle")
def g_dutch(J, face):
    f = Vector((0,-1,0)) if face=="-Y" else Vector((0,1,0))
    return dict(target=J[1], dir_off=f*1.0+Vector((0.3,0,0.05)), lens=35, roll=math.radians(22), note="dutch tilt 22deg — destabilized horizon")
def g_top_down(J, face):
    tgt = (J[8]+J[11])*0.5
    return dict(target=tgt, dir_off=Vector((0.12,-0.28,1.0)), lens=35, up='Z', note="near top-down (bird's-eye) — the figure read from above")
def g_profile(J, face):
    return dict(target=J[1], dir_off=Vector((1.0,0.05,0.05)), lens=50, note="pure profile (camera on +x) — depth carries the body, pose goes flat")
def g_hero_push(J, face):
    f = Vector((0,-1,0)) if face=="-Y" else Vector((0,1,0))
    return dict(target=(J[0]+J[1])*0.5, dir_off=f*1.0+Vector((0.1,0,-0.12)), lens=65, note="hero push-in, 65mm — chest/face, compressed")
def g_worms_eye(J, face):
    f = Vector((0,-1,0)) if face=="-Y" else Vector((0,1,0))
    tgt = (J[1] + (J[8]+J[11])*0.5)*0.5
    return dict(target=tgt, dir_off=f*0.9+Vector((0.35,0,-0.55)), lens=28, note="worm's-eye (the proven bench grammar) — comparison baseline")
GRAMMARS = {"extreme_worms":g_extreme_worms, "dutch":g_dutch, "top_down":g_top_down,
            "profile":g_profile, "hero_push":g_hero_push, "worms_eye":g_worms_eye}

# ───────────────────────── the GALLERY matrix (dramatic pose x dramatic camera) ─────────────────────────
# Chosen to maximise the gotcha surface, not full cross-product.
SHOTS = [
    ("G01","punch_at_cam","worms_eye",   "foreshortened fist toward camera — does the arm read or melt?"),
    ("G02","punch_at_cam","hero_push",   "same punch, long lens — compression vs the wide foreshortening"),
    ("G03","high_kick",   "extreme_worms","leg above the head at 18mm — extreme limb angle + tower"),
    ("G04","spin_slash",  "dutch",       "crossed L/R arms on a tilted horizon — the laterality ambiguity test"),
    ("G05","back_arch",   "extreme_worms","arched scream from far below — chest over the lens"),
    ("G06","fallen",      "top_down",    "body on the ground seen from above — non-standing + bird's-eye"),
    ("G07","fallen",      "profile",     "fallen body in pure profile — depth must carry it, pose flattens"),
    ("G08","lunge",       "profile",     "the proven lunge, but side-on — how much pose survives a profile"),
    ("G09","overhead",    "dutch",       "overhead strike (faces away) on a dutch — back + tilt"),
    ("G10","spin_slash",  "top_down",    "the twist from above — do crossed limbs separate or fuse?"),
]

# ───────────────────────── scene building (metaball mannequin + emission), from bench.py ─────────────────────────
def wipe():
    for d in (bpy.data.objects, bpy.data.meshes, bpy.data.materials, bpy.data.metaballs,
              bpy.data.armatures, bpy.data.cameras, bpy.data.lights):
        for x in list(d): d.remove(x)

def build_body(scene, J):
    mb = bpy.data.metaballs.new("body"); mb.resolution=0.06; mb.render_resolution=0.035; mb.threshold=0.6
    body = bpy.data.objects.new("Body", mb); scene.collection.objects.link(body)
    def at(c,r): e=mb.elements.new(); e.co=Vector(c); e.radius=r
    def line(a,b,r,step=0.075):
        a,b=Vector(a),Vector(b); d=b-a; n=max(2,int(d.length/step)+1)
        for i in range(n+1): at(a+d*(i/n), r)
    LR={(2,3):.085,(3,4):.075,(5,6):.085,(6,7):.075,(8,9):.092,(9,10):.08,(11,12):.092,
        (12,13):.08,(1,2):.10,(1,5):.10,(1,8):.10,(1,11):.10,(1,0):.085}
    for a,b in LIMBS:
        if a in (0,14,15,16,17) or b in (14,15,16,17): continue
        line(J[a],J[b],LR.get((a,b),.08))
    line(J[1],(J[8]+J[11])*0.5,0.155); line(J[8],J[11],0.11); at(J[0],0.15); at((J[0]+J[1])*0.5,0.11)
    return body

def clay():
    m=bpy.data.materials.new("clay"); m.use_nodes=True
    b=m.node_tree.nodes.get("Principled BSDF"); b.inputs["Base Color"].default_value=(.62,.62,.64,1)
    if "Roughness" in b.inputs: b.inputs["Roughness"].default_value=.5
    return m
def normal_mat():
    m=bpy.data.materials.new("normal"); m.use_nodes=True; nt=m.node_tree; nt.nodes.clear()
    geo=nt.nodes.new("ShaderNodeNewGeometry"); vt=nt.nodes.new("ShaderNodeVectorTransform")
    vt.vector_type='NORMAL'; vt.convert_from='WORLD'; vt.convert_to='CAMERA'
    mad=nt.nodes.new("ShaderNodeVectorMath"); mad.operation='MULTIPLY_ADD'
    mad.inputs[1].default_value=(.5,.5,-.5); mad.inputs[2].default_value=(.5,.5,.5)
    emi=nt.nodes.new("ShaderNodeEmission"); out=nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(geo.outputs["Normal"],vt.inputs[0]); nt.links.new(vt.outputs[0],mad.inputs[0])
    nt.links.new(mad.outputs[0],emi.inputs[0]); nt.links.new(emi.outputs[0],out.inputs["Surface"]); return m
def depth_mat(near,far):
    m=bpy.data.materials.new("depth"); m.use_nodes=True; nt=m.node_tree; nt.nodes.clear()
    cam=nt.nodes.new("ShaderNodeCameraData"); mr=nt.nodes.new("ShaderNodeMapRange")
    mr.inputs["From Min"].default_value=near; mr.inputs["From Max"].default_value=far
    mr.inputs["To Min"].default_value=1.0; mr.inputs["To Max"].default_value=0.0; mr.clamp=True
    emi=nt.nodes.new("ShaderNodeEmission"); out=nt.nodes.new("ShaderNodeOutputMaterial")
    z=cam.outputs.get("View Z Depth") or cam.outputs[1]
    nt.links.new(z,mr.inputs["Value"]); nt.links.new(mr.outputs[0],emi.inputs[0])
    nt.links.new(emi.outputs[0],out.inputs["Surface"]); return m

def fit_camera(scene, cam, J, target, dir_off, lens, fill=0.82, roll=0.0, up='Y'):
    cam.data.lens = lens
    cam.location = target + dir_off.normalized() * 2.4
    def aim():
        q = (target - cam.location).to_track_quat('-Z', up)
        if roll: q = q @ Quaternion((0,0,1), roll)          # roll about the view axis -> dutch tilt
        cam.rotation_euler = q.to_euler()
        bpy.context.view_layer.update()
    aim()
    for _ in range(6):
        ys = [world_to_camera_view(scene, cam, p).y for p in J.values()]
        h = max(ys) - min(ys)
        if h <= 1e-4: break
        d = (target - cam.location); dist = d.length
        cam.location = target - d.normalized() * (dist * (h / fill))
        aim()

# ── Fix A (Seam-A round-trip): SHOT-SIZE framing — honor an authored CU/MS/WIDE instead of fitting the
#    whole figure. The crop is defined by WHICH keypoints the camera frames (the subject set) + the target
#    fill for that set; the rest of the figure falls out of frame, which is correct for a CU. Pass the
#    subject subset + this fill to fit_camera. (gallery.emit_shot does NOT use this — it stays WIDE-ish.) ──
SUBJECT = {"CU":   [0,1,2,5,14,15,16,17],                       # head + shoulders
           "MS":   [0,1,2,3,5,6,8,11,14,15,16,17],              # head -> hips (upper body)
           "WIDE": list(range(18))}
SHOT_FILL = {"CU": 0.86, "MS": 0.70, "WIDE": 0.46}              # the subject set fills this fraction of frame height
def frame_for_shot(J, shot):
    idxs = [i for i in SUBJECT.get(shot, SUBJECT["WIDE"]) if i in J]
    pts = [J[i] for i in idxs]
    c = Vector((sum(p.x for p in pts)/len(pts), sum(p.y for p in pts)/len(pts), sum(p.z for p in pts)/len(pts)))
    return {i: J[i] for i in idxs}, c, SHOT_FILL.get(shot, 0.46)

# ── Fix B (Seam-A round-trip): HEAD-AIM — carry M1's oriented head into the 3D bench. The eyeline metric
#    measures the head DIRECTION (ear-midpoint -> nose), so we align that 3D nose-vector to the GAZE RAY
#    (head -> the world point that projects to the board record's EYELINE target), pivoting at the head
#    centre so the head turns IN PLACE (the nose doesn't swing off a tight CU). A proper look-at, not a
#    screen-position nudge. Call AFTER the camera is fitted, BEFORE build_body.
def aim_head(scene, cam, J, target_screen, blend=1.0):
    head_ids = [0, 14, 15, 16, 17]
    ear_mid = (J[16] + J[17]) * 0.5                            # the head centre / pivot
    nose_vec = (J[0] - ear_mid)
    if nose_vec.length < 1e-5: return J
    nose_vec = nose_vec.normalized()
    cam_pos = cam.matrix_world.translation
    R3 = cam.matrix_world.to_3x3()
    right = R3.col[0].normalized(); up = R3.col[1].normalized(); fwd = (-R3.col[2]).normalized()
    D = max(0.3, (ear_mid - cam_pos).length)                  # put the look-target at the head's distance
    half_w = D * math.tan((cam.data.angle_x or cam.data.angle) * 0.5)
    half_h = D * math.tan((cam.data.angle_y or cam.data.angle) * 0.5)
    sx, sy = target_screen[0], target_screen[1]               # board y is top-down
    ox = (sx - 0.5) * 2.0 * half_w
    oy = (0.5 - sy) * 2.0 * half_h                            # screen-down -> world-up
    world_t = cam_pos + fwd * D + right * ox + up * oy
    gaze = (world_t - ear_mid)
    if gaze.length < 1e-5: return J
    gaze = gaze.normalized()
    q = nose_vec.rotation_difference(gaze)                    # rotate the head so the nose-vector -> gaze
    if blend < 1.0: q = Quaternion().slerp(q, blend)
    M = q.to_matrix()
    for i in head_ids:
        J[i] = ear_mid + M @ (J[i] - ear_mid)
    bpy.context.view_layer.update()
    return J

def render(scene, body, mat, path):
    body.data.materials.clear(); body.data.materials.append(mat)
    scene.render.filepath=path; bpy.ops.render.render(write_still=True)

def emit_shot(shot_id, pose_name, grammar_name, note):
    wipe(); scene=bpy.context.scene
    pose_fn, face = POSES[pose_name]; J = asV(pose_fn())
    body = build_body(scene, J)
    cam_d=bpy.data.cameras.new("Cam"); cam=bpy.data.objects.new("Cam",cam_d)
    scene.collection.objects.link(cam); scene.camera=cam
    g = GRAMMARS[grammar_name](J, face)
    rx, ry = (RES_Y, RES_X) if g.get("aspect")=="landscape" else (RES_X, RES_Y)
    scene.render.resolution_x=rx; scene.render.resolution_y=ry
    fit_camera(scene, cam, J, g["target"], g["dir_off"], g["lens"], roll=g.get("roll",0.0), up=g.get("up",'Y'))
    sun_d=bpy.data.lights.new("Sun",'SUN'); sun_d.energy=3.0
    sun=bpy.data.objects.new("Sun",sun_d); scene.collection.objects.link(sun)
    sun.rotation_euler=(math.radians(55),math.radians(12),math.radians(-50))
    world=bpy.data.worlds.new("W"); scene.world=world; world.use_nodes=True
    bg=world.node_tree.nodes["Background"]; bg.inputs[0].default_value=(0,0,0,1); bg.inputs[1].default_value=0.0
    scene.render.image_settings.file_format='PNG'; scene.render.film_transparent=False
    try: scene.render.engine='BLENDER_EEVEE_NEXT'
    except Exception: scene.render.engine='BLENDER_EEVEE'
    try: scene.view_settings.view_transform='Standard'
    except Exception: pass
    dists=[(p-cam.location).length for p in J.values()]; near,far=min(dists)*0.82, max(dists)*1.12
    base=os.path.join(P_DIR, shot_id)
    render(scene, body, clay(), base+"_rgb.png")
    render(scene, body, normal_mat(), base+"_normal.png")
    render(scene, body, depth_mat(near,far), base+"_depth.png")
    # geometric OpenPose keypoints + an off-frame / behind tally (the Seam-A gotcha meter)
    kp={}; off=0; behind=0
    for i,p in J.items():
        co=world_to_camera_view(scene,cam,p)
        infr = (0<=co.x<=1 and 0<=co.y<=1 and co.z>0)
        if not (0<=co.x<=1 and 0<=co.y<=1): off+=1
        if co.z<=0: behind+=1
        kp[i]=[round(co.x*rx,1), round((1-co.y)*ry,1), 1.0 if infr else 0.3]
    json.dump({"width":rx,"height":ry,"keypoints":kp,"limbs":LIMBS,
               "shot":shot_id,"pose":pose_name,"grammar":grammar_name,"note":note,
               "offframe_keypoints":off,"behind_camera_keypoints":behind,
               "lens":g["lens"],"grammar_note":g["note"]},
              open(base+"_keypoints.json","w"))
    render(scene, body, clay(), base+"_rgb.png")          # restore clay for the saved blend
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(BL_DIR, shot_id+".blend"))
    return g, face, off, behind

def write_board(shot_id, pose_name, grammar_name, note, g, face, off, behind):
    block = f"""# === BOARD (gallery) ===
SHOT_ID: {shot_id}
CAMERA_GRAMMAR: {grammar_name} | lens {g['lens']} | {g['note']}
ANGLE: {grammar_name} (solved) | face {face}
CHARS: HERO ({pose_name.replace('_',' ')})
POSE: passes/{shot_id}_keypoints.json -> passes/{shot_id}_openpose.png
DEPTH: passes/{shot_id}_depth.png
EDGE: passes/{shot_id}_canny.png
NORMAL: passes/{shot_id}_normal.png
SEAM_A_METER: offframe_keypoints={off}  behind_camera_keypoints={behind}
NOTE: {note}
"""
    open(os.path.join(B_DIR, shot_id+".board.txt"),"w").write(block)

if __name__ == "__main__":
    manifest=[]
    for shot_id, pose_name, grammar_name, note in SHOTS:
        g, face, off, behind = emit_shot(shot_id, pose_name, grammar_name, note)
        write_board(shot_id, pose_name, grammar_name, note, g, face, off, behind)
        manifest.append({"shot":shot_id,"pose":pose_name,"grammar":grammar_name,"note":note,
                         "lens":g["lens"],"grammar_note":g["note"],"offframe":off,"behind":behind})
        print(f"EMITTED {shot_id}  {pose_name} x {grammar_name}  offframe={off} behind={behind}", flush=True)
    json.dump(manifest, open(os.path.join(HERE,"gallery-manifest.json"),"w"), indent=2)
    print("GALLERY_DONE")
