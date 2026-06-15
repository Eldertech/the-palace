#!/usr/bin/env python3
"""
BLUELINE Track II — emit a CHARACTER-SHEET pose set (varied stances + framings) as
geometric OpenPose keypoints, for generating a consistent-identity LoRA dataset.
Projection only (no mesh/render). Run headless:
  /opt/homebrew/bin/blender --background --python poseset.py
Then: <comfy venv> draw_poses.py
"""
import bpy, json, os
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

HERE = os.path.dirname(os.path.abspath(__file__)); P = os.path.join(HERE, "poses")
os.makedirs(P, exist_ok=True)
RES_X, RES_Y = 832, 1216
LIMBS = [(1,2),(1,5),(2,3),(3,4),(5,6),(6,7),(1,8),(8,9),(9,10),
         (1,11),(11,12),(12,13),(1,0),(0,14),(14,16),(0,15),(15,17)]

# COCO-18 poses (Z up, facing -Y toward camera). Each: (joints, cam_dist) — cam_dist
# small = closeup (portrait), large = full body.  All faces the camera for a char sheet.
def base(over={}):
    j = {0:(0,-0.05,1.62),1:(0,0,1.46),2:(-0.20,0,1.42),5:(0.20,0,1.42),
         8:(-0.13,0,0.95),11:(0.13,0,0.96),
         3:(-0.24,0,1.18),4:(-0.26,0,0.92),6:(0.24,0,1.18),7:(0.26,0,0.92),
         9:(-0.14,0,0.55),10:(-0.14,0,0.10),12:(0.14,0,0.55),13:(0.14,0,0.10),
         14:(-0.04,-0.06,1.66),15:(0.04,-0.06,1.66),16:(-0.09,-0.02,1.64),17:(0.09,-0.02,1.64)}
    j.update(over); return j

POSES = {
 "stand_front": (base(), 3.0),
 "stand_3q":    (base({2:(-0.10,0.10,1.42),5:(0.26,-0.10,1.42),4:(-0.20,0.05,0.92),7:(0.30,-0.08,0.92),
                       8:(-0.05,0.08,0.95),11:(0.18,-0.06,0.96)}), 3.0),
 "guard":       (base({12:(0.16,-0.30,0.55),13:(0.18,-0.55,0.12),9:(-0.16,0.22,0.55),10:(-0.18,0.42,0.16),
                       6:(0.30,-0.18,1.22),7:(0.40,-0.30,1.20),3:(-0.26,0.10,1.12),4:(-0.20,0.22,0.95)}), 2.7),
 "reach_up":    (base({6:(0.26,-0.05,1.65),7:(0.20,-0.05,1.95),3:(-0.26,-0.05,1.65),4:(-0.20,-0.05,1.95),
                       0:(0.02,0.02,1.66)}), 3.0),
 "walk":        (base({12:(0.15,-0.18,0.55),13:(0.16,-0.34,0.14),9:(-0.16,0.16,0.55),10:(-0.17,0.30,0.16),
                       4:(-0.22,-0.14,0.95),7:(0.24,0.12,0.92)}), 3.0),
 "crouch":      (base({1:(0,0.06,1.18),0:(0,0.02,1.34),2:(-0.20,0.04,1.15),5:(0.20,0.04,1.15),
                       8:(-0.13,0,0.70),11:(0.13,0,0.71),9:(-0.18,-0.10,0.40),12:(0.18,-0.10,0.40),
                       10:(-0.18,-0.20,0.06),13:(0.18,-0.20,0.06),3:(-0.22,0,0.95),4:(-0.20,-0.06,0.74),
                       6:(0.22,0,0.95),7:(0.20,-0.06,0.74),
                       14:(-0.04,-0.04,1.38),15:(0.04,-0.04,1.38),16:(-0.09,0,1.36),17:(0.09,0,1.36)}), 2.6),
 "portrait":    (base(), 1.7),   # closeup framing via near camera
 "hero_turn":   (base({0:(0.06,-0.10,1.62),2:(-0.22,0.04,1.42),5:(0.16,-0.08,1.42),
                       4:(-0.30,0.05,0.95),7:(0.20,-0.10,0.92),11:(0.16,-0.05,0.96)}), 2.9),
}

for d in (bpy.data.objects, bpy.data.cameras):
    for x in list(d): d.remove(x)
scene = bpy.context.scene
scene.render.resolution_x = RES_X; scene.render.resolution_y = RES_Y

for name, (joints, dist) in POSES.items():
    for o in list(bpy.data.objects):
        if o.type == 'CAMERA': bpy.data.objects.remove(o)
    cam_d = bpy.data.cameras.new("Cam"); cam_d.lens = 50
    cam = bpy.data.objects.new("Cam", cam_d); scene.collection.objects.link(cam); scene.camera = cam
    tgt = Vector((0, 0, 1.55 if name == "portrait" else 1.0))
    cam.location = Vector((0.0, -dist, tgt.z))
    cam.rotation_euler = (tgt - cam.location).to_track_quat('-Z','Y').to_euler()
    bpy.context.view_layer.update()
    J = {k: Vector(v) for k, v in joints.items()}
    kp = {}
    for i, p in J.items():
        co = world_to_camera_view(scene, cam, p)
        kp[i] = [round(co.x*RES_X,1), round((1-co.y)*RES_Y,1),
                 1.0 if (0<=co.x<=1 and 0<=co.y<=1 and co.z>0) else 0.3]
    json.dump({"width":RES_X,"height":RES_Y,"keypoints":kp,"limbs":LIMBS},
              open(os.path.join(P, name+"_keypoints.json"), "w"))
    print("WROTE", name, flush=True)
print("POSESET_DONE")
