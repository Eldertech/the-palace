#!/usr/bin/env python3
"""
BLUELINE / Shop·Blender — Session 1 conditioning keystone.

Run headless:
  /opt/homebrew/bin/blender --background --python pose_and_emit.py

Builds a fused-metaball humanoid in a dramatic worm's-eye, foreshortened
sword-draw lunge, auto-frames a low camera, and emits — all registered to the
same framed view:
  - rgb.png      clay/form render (EEVEE)        -> feeds canny + lineart + DWPose preproc
  - depth.png    camera Z depth (material swap)   -> ControlNet depth channel
  - normal.png   camera-space normals (mat swap)  -> emitted artifact
  - pose_keypoints.json  COCO-18 joints projected to pixel space
                 -> drawn into the exact OpenPose skeleton by draw_openpose.py
And saves the hand-editable scene: dramatic-lunge.blend (armature + metaball body).

This is the *bespoke geometric pass-emission* alternative the toyxyz recipe names
as an open question: the pose skeleton is geometric (projected bones), not
estimated, so it is exact no matter how abstract the proxy reads.

Re-pose loop (hand-editable): open the .blend, grab the armature bones in the GUI,
move the matching J[] coords (or re-run with a new J table), re-run this script ->
fresh passes that track the new pose.
"""
import bpy, bmesh, json, math, os
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_PASSES = os.path.abspath(os.path.join(HERE, "..", "passes"))
OUT_BLEND = os.path.join(HERE, "dramatic-lunge.blend")
os.makedirs(OUT_PASSES, exist_ok=True)
RES_X, RES_Y = 832, 1216  # SDXL-friendly portrait bucket

# ---- COCO-18 OpenPose joints (world coords, Z up; "toward camera" = -Y) -------
J = {
    0:  Vector(( 0.04, -0.20, 1.55)),  # nose
    1:  Vector(( 0.00, -0.10, 1.42)),  # neck
    2:  Vector((-0.20, -0.04, 1.38)),  # r-shoulder
    3:  Vector((-0.34,  0.18, 1.10)),  # r-elbow (drawn back)
    4:  Vector((-0.30,  0.40, 0.88)),  # r-wrist (sword hand, behind hip)
    5:  Vector(( 0.20, -0.02, 1.40)),  # l-shoulder
    6:  Vector(( 0.30, -0.30, 1.25)),  # l-elbow (thrust toward lens)
    7:  Vector(( 0.30, -0.62, 1.05)),  # l-wrist (reaching at camera)
    8:  Vector((-0.14,  0.00, 0.92)),  # r-hip
    9:  Vector((-0.18,  0.42, 0.55)),  # r-knee (trailing, back)
    10: Vector((-0.22,  0.92, 0.28)),  # r-ankle (extended back on toe)
    11: Vector(( 0.14,  0.00, 0.95)),  # l-hip
    12: Vector(( 0.16, -0.40, 0.52)),  # l-knee (leading, toward lens)
    13: Vector(( 0.18, -0.78, 0.10)),  # l-ankle (planted forward)
    14: Vector(( 0.02, -0.25, 1.60)),  # r-eye
    15: Vector(( 0.09, -0.25, 1.59)),  # l-eye
    16: Vector((-0.05, -0.20, 1.58)),  # r-ear
    17: Vector(( 0.13, -0.18, 1.57)),  # l-ear
}
LIMBS = [(1,2),(1,5),(2,3),(3,4),(5,6),(6,7),(1,8),(8,9),(9,10),
         (1,11),(11,12),(12,13),(1,0),(0,14),(14,16),(0,15),(15,17)]

# ---- clean scene --------------------------------------------------------------
for d in (bpy.data.objects, bpy.data.meshes, bpy.data.materials, bpy.data.metaballs,
          bpy.data.armatures, bpy.data.cameras, bpy.data.lights):
    for x in list(d):
        d.remove(x)
scene = bpy.context.scene

# ---- fused metaball body ------------------------------------------------------
mb = bpy.data.metaballs.new("body")
mb.resolution = 0.06
mb.render_resolution = 0.035
mb.threshold = 0.6
body = bpy.data.objects.new("Body", mb)
scene.collection.objects.link(body)

def meta_at(center, radius, stiff=2.0):
    e = mb.elements.new(); e.co = Vector(center); e.radius = radius; e.stiffness = stiff

def meta_line(p1, p2, radius, step=0.075):
    p1, p2 = Vector(p1), Vector(p2); d = p2 - p1; L = d.length
    n = max(2, int(L / step) + 1)
    for i in range(n + 1):
        meta_at(p1 + d * (i / n), radius)

LIMB_R = {  # per-limb tube radius
    (2,3):0.085,(3,4):0.075,(5,6):0.085,(6,7):0.075,           # arms
    (8,9):0.092,(9,10):0.08,(11,12):0.092,(12,13):0.08,        # legs
    (1,2):0.10,(1,5):0.10,(1,8):0.10,(1,11):0.10,(1,0):0.085,  # trunk links
}
for a, b in LIMBS:
    if a in (0,14,15,16,17) or b in (14,15,16,17):
        continue  # face handled by the head ball
    meta_line(J[a], J[b], LIMB_R.get((a, b), 0.08))
# solid trunk + pelvis + head
meta_line(J[1], (J[8] + J[11]) * 0.5, 0.155)
meta_line(J[8], J[11], 0.11)
meta_at(J[0], 0.15)                      # head
meta_at((J[0] + J[1]) * 0.5, 0.11)       # jaw/neck blend

# ---- hand-editable armature (for re-posing in the GUI) ------------------------
arm_data = bpy.data.armatures.new("rig")
arm = bpy.data.objects.new("Mannequin_Rig", arm_data)
scene.collection.objects.link(arm)
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='EDIT')
BONES = {"neck":(1,0),"r_upper_arm":(2,3),"r_forearm":(3,4),"l_upper_arm":(5,6),
         "l_forearm":(6,7),"r_thigh":(8,9),"r_shin":(9,10),"l_thigh":(11,12),
         "l_shin":(12,13),"shoulders":(2,5),"hips":(8,11)}
eb = arm_data.edit_bones
sb = eb.new("spine"); sb.head = (J[8] + J[11]) * 0.5; sb.tail = J[1]
for name, (h, t) in BONES.items():
    bb = eb.new(name); bb.head = J[h]; bb.tail = J[t]
bpy.ops.object.mode_set(mode='OBJECT')

# ---- camera: worm's-eye, wide lens, auto-fit to fill the frame ----------------
centroid = sum(J.values(), Vector()) / len(J)
target = Vector((centroid.x, centroid.y, centroid.z))
cam_data = bpy.data.cameras.new("Cam"); cam_data.lens = 30.0
cam = bpy.data.objects.new("Cam", cam_data); scene.collection.objects.link(cam)
scene.camera = cam
# camera sits at target+off: +X (figure's left), in front (-Y), BELOW (-z) => 3/4 worm's-eye
off = Vector((0.95, -0.95, -0.5)).normalized()
cam.location = target + off * 2.4
scene.render.resolution_x = RES_X; scene.render.resolution_y = RES_Y

def aim():
    cam.rotation_euler = (target - cam.location).to_track_quat('-Z', 'Y').to_euler()
    bpy.context.view_layer.update()

def vspan():
    ys = []
    for p in J.values():
        ys.append(world_to_camera_view(scene, cam, p).y)
    return min(ys), max(ys)

aim()
for _ in range(5):  # converge figure to ~82% of frame height
    y0, y1 = vspan(); h = y1 - y0
    if h <= 0: break
    viewdir = (target - cam.location); dist = viewdir.length; viewdir.normalize()
    cam.location = target - viewdir * (dist * (h / 0.82))
    aim()

# ---- render config + world ----------------------------------------------------
scene.render.image_settings.file_format = 'PNG'
scene.render.film_transparent = False
try: scene.render.engine = 'BLENDER_EEVEE_NEXT'
except Exception: scene.render.engine = 'BLENDER_EEVEE'
world = bpy.data.worlds.new("W"); scene.world = world; world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs[0].default_value = (0, 0, 0, 1); bg.inputs[1].default_value = 0.0

# auto depth range from camera-space joint distances
dists = [(p - cam.location).length for p in J.values()]
NEAR, FAR = min(dists) * 0.82, max(dists) * 1.12

# ---- materials ----------------------------------------------------------------
def clay_mat():
    m = bpy.data.materials.new("clay"); m.use_nodes = True
    b = m.node_tree.nodes.get("Principled BSDF")
    b.inputs["Base Color"].default_value = (0.64, 0.64, 0.66, 1)
    if "Roughness" in b.inputs: b.inputs["Roughness"].default_value = 0.5
    return m

def normal_mat():
    m = bpy.data.materials.new("normal"); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    geo = nt.nodes.new("ShaderNodeNewGeometry")
    vt = nt.nodes.new("ShaderNodeVectorTransform")
    vt.vector_type = 'NORMAL'; vt.convert_from = 'WORLD'; vt.convert_to = 'CAMERA'
    mad = nt.nodes.new("ShaderNodeVectorMath"); mad.operation = 'MULTIPLY_ADD'
    mad.inputs[1].default_value = (0.5, 0.5, -0.5)
    mad.inputs[2].default_value = (0.5, 0.5, 0.5)
    emi = nt.nodes.new("ShaderNodeEmission"); out = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(geo.outputs["Normal"], vt.inputs[0])
    nt.links.new(vt.outputs[0], mad.inputs[0])
    nt.links.new(mad.outputs[0], emi.inputs[0])
    nt.links.new(emi.outputs[0], out.inputs["Surface"])
    return m

def depth_mat(near, far):
    m = bpy.data.materials.new("depth"); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    cd = nt.nodes.new("ShaderNodeCameraData")
    mr = nt.nodes.new("ShaderNodeMapRange")
    mr.inputs["From Min"].default_value = near; mr.inputs["From Max"].default_value = far
    mr.inputs["To Min"].default_value = 1.0; mr.inputs["To Max"].default_value = 0.0
    mr.clamp = True
    emi = nt.nodes.new("ShaderNodeEmission"); out = nt.nodes.new("ShaderNodeOutputMaterial")
    zout = cd.outputs.get("View Z Depth") or cd.outputs[1]
    nt.links.new(zout, mr.inputs["Value"])
    nt.links.new(mr.outputs[0], emi.inputs[0])
    nt.links.new(emi.outputs[0], out.inputs["Surface"])
    return m

def assign(mat):
    body.data.materials.clear(); body.data.materials.append(mat)

def add_lights():
    s = bpy.data.lights.new("Sun", 'SUN'); s.energy = 3.2
    so = bpy.data.objects.new("Sun", s); scene.collection.objects.link(so)
    so.rotation_euler = (math.radians(58), math.radians(12), math.radians(-55))
    f = bpy.data.lights.new("Fill", 'AREA'); f.energy = 300; f.size = 5
    fo = bpy.data.objects.new("Fill", f); scene.collection.objects.link(fo)
    fo.location = (-2.6, -2.2, 1.4); fo.rotation_euler = (math.radians(72), 0, math.radians(-42))

def render_to(name):
    scene.render.filepath = os.path.join(OUT_PASSES, name)
    bpy.ops.render.render(write_still=True)
    print("WROTE", name, flush=True)

# ---- emit passes --------------------------------------------------------------
add_lights()
assign(clay_mat());            render_to("rgb.png")
assign(normal_mat());          render_to("normal.png")
assign(depth_mat(NEAR, FAR));  render_to("depth.png")

# ---- project COCO-18 joints to pixel space (exact OpenPose source) ------------
kp = {}
for i, p in J.items():
    co = world_to_camera_view(scene, cam, p)
    kp[i] = [round(co.x * RES_X, 1), round((1 - co.y) * RES_Y, 1),
             1.0 if (0 <= co.x <= 1 and 0 <= co.y <= 1 and co.z > 0) else 0.3]
with open(os.path.join(OUT_PASSES, "pose_keypoints.json"), "w") as f:
    json.dump({"width": RES_X, "height": RES_Y, "keypoints": kp, "limbs": LIMBS,
               "depth_near": round(NEAR, 3), "depth_far": round(FAR, 3),
               "cam_lens_mm": cam_data.lens}, f, indent=2)
print("WROTE pose_keypoints.json", flush=True)

assign(clay_mat())
bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND)
print("WROTE", os.path.basename(OUT_BLEND), flush=True)
print("DONE_POSE_AND_EMIT", flush=True)
