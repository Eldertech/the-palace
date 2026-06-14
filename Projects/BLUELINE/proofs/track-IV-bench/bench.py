#!/usr/bin/env python3
"""
BLUELINE Track IV — THE BENCH (authored control: blocking, pose, camera).

Grows Session 1's single-pose geometric emission into:
  - a POSE LIBRARY (named COCO-18 held poses), and
  - CAMERA-GRAMMAR SOLVERS (OTS / worm's-eye / low-hero) — declarative on-screen-layout
    constraint solvers, not hand-typed coordinates.
For each shot (pose x grammar) it emits registered passes + writes a board record
(the BLUELINE — Board Record Schema, with the converged CAMERA_GRAMMAR + FLAGGED fields).

Run headless:
  /opt/homebrew/bin/blender --background --python bench.py
Then: <comfy venv> post.py   (draws the geometric OpenPose skeleton + canny EDGE)
"""
import bpy, bmesh, json, math, os
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

HERE = os.path.dirname(os.path.abspath(__file__))
P_DIR = os.path.join(HERE, "passes"); B_DIR = os.path.join(HERE, "boards")
BL_DIR = os.path.join(HERE, "blends")
for d in (P_DIR, B_DIR, BL_DIR): os.makedirs(d, exist_ok=True)
RES_X, RES_Y = 832, 1216

LIMBS = [(1,2),(1,5),(2,3),(3,4),(5,6),(6,7),(1,8),(8,9),(9,10),
         (1,11),(11,12),(12,13),(1,0),(0,14),(14,16),(0,15),(15,17)]

# ----- POSE LIBRARY (COCO-18 world coords, Z up). `face` = which way +Y the chest points
def lunge():   # Session 1's proven worm's-eye sword-draw lunge; faces -Y (toward cam)
    return {0:( .04,-.20,1.55),1:( .00,-.10,1.42),2:(-.20,-.04,1.38),3:(-.34,.18,1.10),
            4:(-.30,.40,.88),5:( .20,-.02,1.40),6:( .30,-.30,1.25),7:( .30,-.62,1.05),
            8:(-.14,0,.92),9:(-.18,.42,.55),10:(-.22,.92,.28),11:( .14,0,.95),
            12:( .16,-.40,.52),13:( .18,-.78,.10),14:( .02,-.25,1.60),15:( .09,-.25,1.59),
            16:(-.05,-.20,1.58),17:( .13,-.18,1.57)}
def defiant():  # standing tall, chest out, right fist raised; faces -Y
    return {0:(0,-.10,1.66),1:(0,-.04,1.50),2:(-.22,-.02,1.46),3:(-.34,-.16,1.20),
            4:(-.30,-.30,1.55),5:(.22,-.02,1.46),6:(.32,.06,1.18),7:(.36,.05,.90),
            8:(-.16,0,.96),9:(-.20,-.06,.55),10:(-.20,-.02,.10),11:(.16,0,.96),
            12:(.20,-.06,.55),13:(.20,-.02,.10),14:(-.04,-.16,1.71),15:(.04,-.16,1.71),
            16:(-.10,-.10,1.69),17:(.10,-.10,1.69)}
def overhead():  # sword raised overhead mid-strike, left leg forward; faces +Y (away)
    return {0:(0,.16,1.60),1:(0,.08,1.46),2:(-.22,.04,1.42),3:(-.30,.10,1.70),
            4:(-.18,.20,1.98),5:(.22,.04,1.42),6:(.28,.12,1.70),7:(.10,.22,1.98),
            8:(-.15,0,.94),9:(-.20,.30,.55),10:(-.22,.10,.12),11:(.15,.04,.96),
            12:(.18,.42,.58),13:(.16,.74,.20),14:(-.04,.20,1.65),15:(.04,.20,1.65),
            16:(-.10,.14,1.63),17:(.10,.14,1.63)}
POSES = {"sword_draw_lunge": (lunge,  "-Y"),
         "defiant_stand":    (defiant,"-Y"),
         "overhead_strike":  (overhead,"+Y")}

def asV(tbl): return {k: Vector(v) for k, v in tbl.items()}

# ----- CAMERA-GRAMMAR SOLVERS: place a camera so on-screen-layout targets land.
# Shared fitter: aim at `target`, then push along the view ray until the figure's
# projected vertical span fills ~`fill` of frame height (the declarative size constraint).
def fit_camera(scene, cam, J, target, dir_off, lens, fill=0.82):
    cam.data.lens = lens
    cam.location = target + dir_off.normalized() * 2.4
    def aim():
        cam.rotation_euler = (target - cam.location).to_track_quat('-Z','Y').to_euler()
        bpy.context.view_layer.update()
    aim()
    for _ in range(6):
        ys = [world_to_camera_view(scene, cam, p).y for p in J.values()]
        h = max(ys) - min(ys)
        if h <= 1e-4: break
        d = (target - cam.location); dist = d.length
        cam.location = target - d.normalized() * (dist * (h / fill))
        aim()

def grammar_worms_eye(J, face):
    # in FRONT of the chest + BELOW the hips, wide lens -> looking up, foreshortened
    f = Vector((0,-1,0)) if face == "-Y" else Vector((0,1,0))
    tgt = (J[1] + (J[8]+J[11])*0.5) * 0.5
    return dict(target=tgt, dir_off=f*0.9 + Vector((0.35,0,-0.55)), lens=28,
                note="OTS? no — worm's-eye: front + below; shoulder line above horizon")
def grammar_ots(J, face):
    # BEHIND + ABOVE the near shoulder; subject faces away (back-3/4 hero).
    # NOTE: this frames the figure centered; a TRUE shoulder-in-foreground OTS aims PAST
    # the figure down-scene — that needs an environment to look into (Track IV+env). Flagged.
    back = Vector((0,-1,0)) if face == "+Y" else Vector((0,1,0))   # camera goes behind the chest
    return dict(target=J[1], dir_off=back*1.0 + Vector((0.5,0,0.45)), lens=34,
                note="over-the-shoulder (back-3/4 approx; true OTS aims past the figure)")
def grammar_low_hero(J, face):
    f = Vector((0,-1,0)) if face == "-Y" else Vector((0,1,0))
    tgt = J[1]
    return dict(target=tgt, dir_off=f*1.0 + Vector((0.15,0,-0.18)), lens=40,
                note="low-hero: near eye-level-low, centered, slight up-tilt, longer lens")
GRAMMARS = {"worms_eye": grammar_worms_eye, "ots": grammar_ots, "low_hero": grammar_low_hero}

# ----- the shot list (the smallest-useful Track IV test)
SHOTS = [
    ("IV-A", "sword_draw_lunge", "worms_eye"),
    ("IV-B", "defiant_stand",    "low_hero"),
    ("IV-C", "overhead_strike",  "ots"),
]

# ----- scene building (metaball mannequin + emission) — from Session 1, parameterised
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

def render(scene, body, mat, path):
    body.data.materials.clear(); body.data.materials.append(mat)
    scene.render.filepath=path; bpy.ops.render.render(write_still=True)

def emit_shot(shot_id, pose_name, grammar_name):
    wipe(); scene=bpy.context.scene
    pose_fn, face = POSES[pose_name]; J = asV(pose_fn())
    body = build_body(scene, J)
    cam_d=bpy.data.cameras.new("Cam"); cam=bpy.data.objects.new("Cam",cam_d)
    scene.collection.objects.link(cam); scene.camera=cam
    g = GRAMMARS[grammar_name](J, face)
    fit_camera(scene, cam, J, g["target"], g["dir_off"], g["lens"])
    # lights + world
    sun_d=bpy.data.lights.new("Sun",'SUN'); sun_d.energy=3.0
    sun=bpy.data.objects.new("Sun",sun_d); scene.collection.objects.link(sun)
    sun.rotation_euler=(math.radians(55),math.radians(12),math.radians(-50))
    world=bpy.data.worlds.new("W"); scene.world=world; world.use_nodes=True
    bg=world.node_tree.nodes["Background"]; bg.inputs[0].default_value=(0,0,0,1); bg.inputs[1].default_value=0.0
    scene.render.resolution_x=RES_X; scene.render.resolution_y=RES_Y
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
    # geometric OpenPose keypoints (the reliable pose channel)
    kp={}
    for i,p in J.items():
        co=world_to_camera_view(scene,cam,p)
        kp[i]=[round(co.x*RES_X,1), round((1-co.y)*RES_Y,1), 1.0 if (0<=co.x<=1 and 0<=co.y<=1 and co.z>0) else 0.3]
    json.dump({"width":RES_X,"height":RES_Y,"keypoints":kp,"limbs":LIMBS},
              open(base+"_keypoints.json","w"))
    render(scene, body, clay(), base+"_rgb.png")  # restore clay for the saved blend
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(BL_DIR, shot_id+".blend"))
    return g, face

def write_board(shot_id, pose_name, grammar_name, g, face):
    sx,sy = g["target"].x, g["target"].z
    block = f"""# === BOARD ===
SHOT_ID: {shot_id}
CAMERA_GRAMMAR: {grammar_name} | lens {g['lens']} | {g['note']}
ANGLE: {grammar_name} (solved, not typed) | face {face}
CHARS: HERO ({pose_name.replace('_',' ')})
POSE: passes/{shot_id}_keypoints.json -> passes/{shot_id}_openpose.png
DEPTH: passes/{shot_id}_depth.png
EDGE: passes/{shot_id}_canny.png
NORMAL: passes/{shot_id}_normal.png
IDREF: <flagged: hero_identity>
SEED: 4471
FLUX_SEED: 88120
FLAGGED: asset_kit(no environment yet); hero_identity(->IDREF, Track II); motion_treatment(->flow-field, Track V)
POSITIVE: <author or staging-AI fills; the block above is the authored control>
NOTES: Track IV bench emission — geometric pose + Blender depth/normal; canny EDGE on SDXL.
"""
    open(os.path.join(B_DIR, shot_id+".board.txt"),"w").write(block)

if __name__ == "__main__":
    for shot_id, pose_name, grammar_name in SHOTS:
        g, face = emit_shot(shot_id, pose_name, grammar_name)
        write_board(shot_id, pose_name, grammar_name, g, face)
        print("EMITTED", shot_id, pose_name, grammar_name, flush=True)
    print("BENCH_DONE")
