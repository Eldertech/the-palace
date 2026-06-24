#!/usr/bin/env python3
"""
BLUELINE M3 — emit a LARGE-DELTA board pair (coil -> leap) as FLUX-ControlNet conditioning
(rgb / depth / geometric OpenPose keypoints) from ONE shared camera. The big delta is the point:
this is where seed-locking (Track V, similar poses) is expected to break, and where flow-warped noise
should hold the look. Reuses the gallery rig (build_body / depth_mat / fit_camera / clay / render).

Run headless:  /opt/homebrew/bin/blender --background --python pair.py
Then:          <comfy venv> pair_post.py     # draws the OpenPose skeleton per phase
"""
import bpy, sys, os, json, math
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "blender-gallery"))
import gallery as G
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

P_DIR = os.path.join(HERE, "passes"); os.makedirs(P_DIR, exist_ok=True)
RES_X, RES_Y = 832, 1216

# Two phases of one explosive move, large delta: COMPACT-LOW coil -> EXTENDED-TALL leap. (COCO-18, Z up, faces -Y.)
def coil():
    return {0:(0,-.05,1.05),1:(0,-.02,.92),2:(-.18,-.02,.90),3:(-.20,-.10,.74),4:(-.12,-.16,.66),
            5:(.18,-.02,.90),6:(.20,-.10,.74),7:(.12,-.16,.66),8:(-.13,0,.50),9:(-.16,-.18,.28),
            10:(-.16,.02,.04),11:(.13,0,.50),12:(.16,-.18,.28),13:(.16,.02,.04),
            14:(-.04,-.10,1.08),15:(.04,-.10,1.08),16:(-.09,-.04,1.06),17:(.09,-.04,1.06)}
def leap():
    return {0:(0,-.10,1.95),1:(0,-.05,1.80),2:(-.20,-.04,1.76),3:(-.34,-.10,1.95),4:(-.42,-.16,2.12),
            5:(.20,-.04,1.76),6:(.34,-.10,1.95),7:(.42,-.16,2.12),8:(-.14,0,1.30),9:(-.24,.28,1.05),
            10:(-.30,.52,.82),11:(.14,0,1.30),12:(.22,-.30,1.05),13:(.28,-.55,.82),
            14:(-.04,-.16,1.99),15:(.04,-.16,1.99),16:(-.09,-.10,1.97),17:(.09,-.10,1.97)}
PHASES = {"A_coil": coil(), "B_leap": leap()}

def asV(t): return {k: Vector(v) for k, v in t.items()}

# ONE shared camera framing the UNION of both phases (a motion pair must share the view).
G.wipe(); scene = bpy.context.scene
cam_d = bpy.data.cameras.new("Cam"); cam = bpy.data.objects.new("Cam", cam_d)
scene.collection.objects.link(cam); scene.camera = cam
scene.render.resolution_x = RES_X; scene.render.resolution_y = RES_Y
allpts = [Vector(v) for t in PHASES.values() for v in t.values()]
ctr = sum(allpts, Vector((0,0,0))) / len(allpts)
union = {i: p for i, p in enumerate(allpts)}                 # fit on every point of both poses
G.fit_camera(scene, cam, union, ctr, Vector((0.25,-1,0)).normalized()*1.0 + Vector((0,0,-0.05)), 40, fill=0.78)
sun_d = bpy.data.lights.new("Sun",'SUN'); sun_d.energy=3.0
sun = bpy.data.objects.new("Sun",sun_d); scene.collection.objects.link(sun)
sun.rotation_euler=(math.radians(55),math.radians(12),math.radians(-50))
world = bpy.data.worlds.new("W"); scene.world=world; world.use_nodes=True
bg=world.node_tree.nodes["Background"]; bg.inputs[0].default_value=(0,0,0,1); bg.inputs[1].default_value=0.0
try: scene.render.engine='BLENDER_EEVEE_NEXT'
except Exception: scene.render.engine='BLENDER_EEVEE'
try: scene.view_settings.view_transform='Standard'
except Exception: pass
scene.render.image_settings.file_format='PNG'
camloc = cam.location.copy()

manifest = {"width": RES_X, "height": RES_Y, "camera": list(camloc), "phases": {}}
for name, tbl in PHASES.items():
    J = asV(tbl)
    # remove prior body, build this phase's body
    for o in [o for o in scene.objects if o.type=='MESH']:
        bpy.data.objects.remove(o, do_unlink=True)
    body = G.build_body(scene, J)
    dists=[(p-camloc).length for p in J.values()]; near,far=min(dists)*0.82, max(dists)*1.12
    base=os.path.join(P_DIR, name)
    G.render(scene, body, G.clay(), base+"_rgb.png")
    G.render(scene, body, G.depth_mat(near,far), base+"_depth.png")
    kp={};
    for i,p in J.items():
        co=world_to_camera_view(scene,cam,p)
        kp[i]=[round(co.x*RES_X,1), round((1-co.y)*RES_Y,1), 1.0 if (0<=co.x<=1 and 0<=co.y<=1 and co.z>0) else 0.3]
    json.dump({"width":RES_X,"height":RES_Y,"keypoints":kp,"limbs":G.LIMBS}, open(base+"_keypoints.json","w"))
    G.render(scene, body, G.clay(), base+"_rgb.png")   # restore clay
    manifest["phases"][name]=kp
    print("EMITTED", name, flush=True)
json.dump(manifest, open(os.path.join(HERE,"pair-manifest.json"),"w"), indent=2)
print("PAIR_DONE")
