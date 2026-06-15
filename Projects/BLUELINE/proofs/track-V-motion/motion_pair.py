#!/usr/bin/env python3
"""
BLUELINE Track V — emit a 2-pose MOTION PAIR (two run-cycle phases) as geometric
OpenPose keypoints, from one shared camera. Projection only (no mesh/render) — fast.

Run headless:  /opt/homebrew/bin/blender --background --python motion_pair.py
Then:          <comfy venv> draw_pair.py   (draws the two openpose skeletons)
"""
import bpy, json, os
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

HERE = os.path.dirname(os.path.abspath(__file__)); P = os.path.join(HERE, "passes")
os.makedirs(P, exist_ok=True)
RES_X, RES_Y = 832, 1216
LIMBS = [(1,2),(1,5),(2,3),(3,4),(5,6),(6,7),(1,8),(8,9),(9,10),
         (1,11),(11,12),(12,13),(1,0),(0,14),(14,16),(0,15),(15,17)]

# running figure facing -Y (toward camera); forward = -Y. Two stride phases.
def run(phase):  # phase=+1 left-leg-fwd / right-arm-fwd ; phase=-1 mirrored
    s = phase
    return {
     0:(0,-0.05,1.62),1:(0,0,1.46),2:(-0.20,0,1.42),5:(0.20,0,1.42),
     8:(-0.13,0,0.95),11:(0.13,0,0.96),
     12:(0.15,-0.22*s,0.55 if s>0 else 0.52), 13:(0.16,-0.42*s,0.12 if s>0 else 0.20),  # left leg
     9:(-0.15,0.20*s,0.52 if s>0 else 0.55), 10:(-0.17,0.40*s,0.20 if s>0 else 0.12),    # right leg
     3:(-0.28,-0.18*s,1.18 if s>0 else 1.16), 4:(-0.22,-0.34*s,1.32 if s>0 else 1.00),   # right arm
     6:(0.28,0.16*s,1.16 if s>0 else 1.18), 7:(0.24,0.30*s,1.00 if s>0 else 1.32),       # left arm
     14:(-0.04,-0.08,1.66),15:(0.04,-0.08,1.66),16:(-0.09,-0.03,1.64),17:(0.09,-0.03,1.64),
    }

# clean + one shared camera
for d in (bpy.data.objects, bpy.data.cameras):
    for x in list(d): d.remove(x)
scene = bpy.context.scene
cam_d = bpy.data.cameras.new("Cam"); cam_d.lens = 40
cam = bpy.data.objects.new("Cam", cam_d); scene.collection.objects.link(cam); scene.camera = cam
cam.location = Vector((0.3, -2.6, 1.0))
cam.rotation_euler = (Vector((0,0,1.05)) - cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.resolution_x = RES_X; scene.render.resolution_y = RES_Y
bpy.context.view_layer.update()

for name, phase in [("runA", 1), ("runB", -1)]:
    J = {k: Vector(v) for k, v in run(phase).items()}
    kp = {}
    for i, p in J.items():
        co = world_to_camera_view(scene, cam, p)
        kp[i] = [round(co.x*RES_X,1), round((1-co.y)*RES_Y,1),
                 1.0 if (0<=co.x<=1 and 0<=co.y<=1 and co.z>0) else 0.3]
    json.dump({"width":RES_X,"height":RES_Y,"keypoints":kp,"limbs":LIMBS},
              open(os.path.join(P, name+"_keypoints.json"), "w"))
    print("WROTE", name, "_keypoints.json", flush=True)
print("MOTION_PAIR_DONE")
