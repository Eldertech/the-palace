"""
BLUELINE — Redraw Posed Figure Proof · Step 1b: Depth + Openpose plates
Renders the depth plate using a camera-distance material (no compositor needed),
then renders the openpose skeleton.

Run headless:
  /Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup -P 01b_render_depth_pose.py
"""
import bpy, math, os
import mathutils

OUT = "/Users/loudonstearns/Documents/The Palace/Projects/BLUELINE/proofs/blender-handdrawn/followups/redraw-posed-figure"
os.makedirs(OUT, exist_ok=True)
RES = (832, 1040)

def wipe():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def eevee_engine():
    items = [e.identifier for e in
             bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items]
    for cand in ('BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE'):
        if cand in items:
            return cand
    return items[0]

def set_world(value):
    w = bpy.data.worlds.new('W'); bpy.context.scene.world = w
    try:
        w.use_nodes = True
        bg = w.node_tree.nodes.get('Background')
        if bg:
            bg.inputs['Color'].default_value = (value, value, value, 1)
            bg.inputs['Strength'].default_value = 1.0
    except Exception:
        pass

def render_to(path):
    sc = bpy.context.scene
    try:
        sc.view_settings.view_transform = 'Standard'
        sc.view_settings.look = 'None'
    except Exception: pass
    sc.render.resolution_x, sc.render.resolution_y = RES
    sc.render.resolution_percentage = 100
    sc.render.image_settings.file_format = 'PNG'
    sc.render.filepath = path
    try: sc.eevee.taa_render_samples = 16
    except Exception: pass
    bpy.ops.render.render(write_still=True)
    print("  wrote", path)

def add_part(name, shape, location, scale, rot_euler=(0,0,0), smooth=False):
    if shape == 'sphere':
        bpy.ops.mesh.primitive_uv_sphere_add(radius=1.0, location=location)
    elif shape == 'cylinder':
        bpy.ops.mesh.primitive_cylinder_add(radius=1.0, depth=2.0, location=location)
    elif shape == 'capsule':
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=1.0, location=location)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = scale
    obj.rotation_euler = [math.radians(r) for r in rot_euler]
    if smooth:
        bpy.ops.object.shade_smooth()
    return obj

def build_crouching_hero():
    parts = []
    parts.append(add_part('Head', 'sphere', (0.0, 0.0, 2.4), (0.32, 0.32, 0.38), smooth=True))
    parts.append(add_part('Neck', 'cylinder', (0.0, 0.0, 2.05), (0.12, 0.12, 0.18), rot_euler=(5, 0, 0)))
    parts.append(add_part('Torso', 'capsule', (0.02, -0.02, 1.53), (0.38, 0.22, 0.42), rot_euler=(10, 0, 2)))
    parts.append(add_part('Hips', 'capsule', (0.0, 0.0, 1.20), (0.35, 0.20, 0.18)))
    parts.append(add_part('UpperArm_L', 'cylinder', (-0.82, 0.08, 1.57), (0.12, 0.12, 0.34), rot_euler=(-15, 5, -50)))
    parts.append(add_part('Forearm_L', 'cylinder', (-1.22, 0.22, 1.07), (0.10, 0.10, 0.32), rot_euler=(-35, -5, -55)))
    parts.append(add_part('UpperArm_R', 'cylinder', (0.80, -0.08, 1.69), (0.12, 0.12, 0.34), rot_euler=(10, -8, 55)))
    parts.append(add_part('Forearm_R', 'cylinder', (1.14, -0.20, 1.57), (0.10, 0.10, 0.30), rot_euler=(-5, 12, 40)))
    parts.append(add_part('Thigh_L', 'cylinder', (-0.43, -0.17, 0.90), (0.14, 0.14, 0.40), rot_euler=(-25, 5, -8)))
    parts.append(add_part('Shin_L', 'cylinder', (-0.57, -0.42, 0.33), (0.11, 0.11, 0.38), rot_euler=(48, 2, -5)))
    parts.append(add_part('Foot_L', 'capsule', (-0.62, -0.52, 0.06), (0.09, 0.20, 0.07), rot_euler=(0, 10, 0)))
    parts.append(add_part('Thigh_R', 'cylinder', (0.38, 0.10, 0.87), (0.14, 0.14, 0.40), rot_euler=(-20, -4, 10)))
    parts.append(add_part('Shin_R', 'cylinder', (0.47, 0.28, 0.30), (0.11, 0.11, 0.36), rot_euler=(42, -3, 6)))
    parts.append(add_part('Foot_R', 'capsule', (0.50, 0.36, 0.05), (0.09, 0.20, 0.07), rot_euler=(0, -8, 0)))
    bpy.ops.mesh.primitive_plane_add(size=20, location=(0, 0, -0.01))
    ground = bpy.context.active_object; ground.name = 'Ground'
    parts.append(ground)
    return parts

def add_scene_lighting():
    for lname, loc_energy, rot_e in [
        ('Key', 5.5, (48, 15, -40)),
        ('Rim', 1.8, (52, -12, 140)),
    ]:
        d = bpy.data.lights.new(lname, 'SUN'); d.energy = loc_energy
        try: d.angle = math.radians(3)
        except Exception: pass
        o = bpy.data.objects.new(lname, d)
        bpy.context.collection.objects.link(o)
        o.rotation_euler = tuple(math.radians(r) for r in rot_e)

def add_hero_camera():
    cd = bpy.data.cameras.new('Cam'); cd.lens = 35
    cam = bpy.data.objects.new('Cam', cd)
    bpy.context.collection.objects.link(cam)
    cam.location = (0.3, -4.5, 0.9)
    cam.rotation_euler = (math.radians(80), 0, math.radians(2))
    cam.rotation_mode = 'XYZ'
    cam.rotation_euler.rotate_axis('Z', math.radians(-7))
    bpy.context.scene.camera = cam
    return cam

# ---------------------------------------------------------------------------
# DEPTH PLATE — camera-distance gradient material on a black world
# Uses a Geometry node (position) + vector distance to camera, normalised
# ---------------------------------------------------------------------------
print("\n=== DEPTH PLATE ===")
wipe()
parts = build_crouching_hero()
add_scene_lighting()
cam = add_hero_camera()
bpy.context.scene.render.engine = eevee_engine()
bpy.context.scene.render.use_freestyle = False
set_world(0.0)

# Build a camera-distance material using Camera Data node
# Camera Data gives 'View Z Depth' (distance from camera to surface)
# We'll normalise: near ~1.5m, far ~8m => ramp to 0-1 white=near, black=far
for o in parts:
    if o.type != 'MESH':
        continue
    m = bpy.data.materials.new(f"depth_{o.name}")
    try: m.use_nodes = True
    except Exception: pass
    nt = m.node_tree; nt.nodes.clear()

    cam_data_node = nt.nodes.new('ShaderNodeCameraData')
    # ViewZDepth output = distance from camera (float)

    # Map Range: near=1.5 -> 1.0 (white), far=8.0 -> 0.0 (black)
    mr = nt.nodes.new('ShaderNodeMapRange')
    mr.inputs['From Min'].default_value = 1.5
    mr.inputs['From Max'].default_value = 8.0
    mr.inputs['To Min'].default_value = 1.0
    mr.inputs['To Max'].default_value = 0.0
    mr.clamp = True

    em = nt.nodes.new('ShaderNodeEmission')
    em.inputs['Strength'].default_value = 1.0
    outn = nt.nodes.new('ShaderNodeOutputMaterial')

    nt.links.new(cam_data_node.outputs['View Z Depth'], mr.inputs['Value'])
    nt.links.new(mr.outputs['Result'], em.inputs['Color'])
    nt.links.new(em.outputs['Emission'], outn.inputs['Surface'])

    o.data.materials.clear(); o.data.materials.append(m)

render_to(os.path.join(OUT, "depth_plate.png"))

# ---------------------------------------------------------------------------
# OPENPOSE SKELETON
# ---------------------------------------------------------------------------
print("\n=== OPENPOSE SKELETON ===")

JOINTS = {
    'head':       (0.0,   0.0,  2.40),
    'neck':       (0.0,   0.0,  2.00),
    'shoulder_L': (-0.55, 0.0,  1.85),
    'shoulder_R': ( 0.55, 0.0,  1.85),
    'elbow_L':    (-1.10, 0.15, 1.30),
    'elbow_R':    ( 1.05,-0.15, 1.50),
    'hand_L':     (-1.35, 0.30, 0.85),
    'hand_R':     ( 1.20,-0.25, 1.70),
    'hip_L':      (-0.32, 0.0,  1.20),
    'hip_R':      ( 0.32, 0.0,  1.20),
    'knee_L':     (-0.55,-0.35, 0.60),
    'knee_R':     ( 0.45, 0.20, 0.55),
    'foot_L':     (-0.60,-0.50, 0.05),
    'foot_R':     ( 0.50, 0.35, 0.05),
}

JOINT_COLORS = {
    'head':       (1.0, 0.0, 0.0),
    'neck':       (1.0, 0.5, 0.0),
    'shoulder_L': (0.0, 1.0, 0.0),
    'shoulder_R': (0.0, 0.8, 0.8),
    'elbow_L':    (0.0, 0.6, 0.0),
    'elbow_R':    (0.0, 0.6, 0.6),
    'hand_L':     (0.2, 1.0, 0.2),
    'hand_R':     (0.2, 0.8, 1.0),
    'hip_L':      (1.0, 1.0, 0.0),
    'hip_R':      (0.8, 0.6, 0.0),
    'knee_L':     (1.0, 0.6, 0.0),
    'knee_R':     (0.8, 0.4, 0.0),
    'foot_L':     (1.0, 0.8, 0.2),
    'foot_R':     (0.9, 0.5, 0.1),
}

BONES = [
    ('head', 'neck'),
    ('neck', 'shoulder_L'), ('neck', 'shoulder_R'),
    ('shoulder_L', 'elbow_L'), ('elbow_L', 'hand_L'),
    ('shoulder_R', 'elbow_R'), ('elbow_R', 'hand_R'),
    ('neck', 'hip_L'), ('neck', 'hip_R'),
    ('hip_L', 'hip_R'),
    ('hip_L', 'knee_L'), ('knee_L', 'foot_L'),
    ('hip_R', 'knee_R'), ('knee_R', 'foot_R'),
]

wipe()
set_world(0.0)
bpy.context.scene.render.use_freestyle = False
bpy.context.scene.render.engine = eevee_engine()

# Camera
cd = bpy.data.cameras.new('Cam'); cd.lens = 35
cam2 = bpy.data.objects.new('Cam', cd)
bpy.context.collection.objects.link(cam2)
cam2.location = (0.3, -4.5, 0.9)
cam2.rotation_euler = (math.radians(80), 0, math.radians(2))
cam2.rotation_mode = 'XYZ'
cam2.rotation_euler.rotate_axis('Z', math.radians(-7))
bpy.context.scene.camera = cam2

# Joint spheres
for jname, jpos in JOINTS.items():
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.12, location=jpos)
    js = bpy.context.active_object; js.name = f"joint_{jname}"
    bpy.ops.object.shade_smooth()
    m = bpy.data.materials.new(f"jmat_{jname}")
    try: m.use_nodes = True
    except Exception: pass
    nt = m.node_tree; nt.nodes.clear()
    col = JOINT_COLORS[jname]
    em = nt.nodes.new('ShaderNodeEmission')
    em.inputs['Color'].default_value = (col[0], col[1], col[2], 1)
    em.inputs['Strength'].default_value = 10.0
    outn = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(em.outputs['Emission'], outn.inputs['Surface'])
    js.data.materials.append(m)

# Bone cylinders
for bone in BONES:
    pa = mathutils.Vector(JOINTS[bone[0]])
    pb = mathutils.Vector(JOINTS[bone[1]])
    mid = (pa + pb) / 2
    length = (pb - pa).length
    direction = (pb - pa).normalized()
    z_axis = mathutils.Vector((0, 0, 1))
    rot_quat = z_axis.rotation_difference(direction)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.04, depth=length, location=mid)
    bo = bpy.context.active_object; bo.name = f"bone_{bone[0]}_{bone[1]}"
    bo.rotation_euler = rot_quat.to_euler()
    bm2 = bpy.data.materials.new("bonemat")
    try: bm2.use_nodes = True
    except Exception: pass
    nt2 = bm2.node_tree; nt2.nodes.clear()
    em2 = nt2.nodes.new('ShaderNodeEmission')
    em2.inputs['Color'].default_value = (0.6, 0.6, 0.6, 1)
    em2.inputs['Strength'].default_value = 3.0
    outn2 = nt2.nodes.new('ShaderNodeOutputMaterial')
    nt2.links.new(em2.outputs['Emission'], outn2.inputs['Surface'])
    bo.data.materials.append(bm2)

try:
    bpy.context.scene.view_settings.view_transform = 'Standard'
    bpy.context.scene.view_settings.look = 'None'
except Exception: pass
bpy.context.scene.render.resolution_x, bpy.context.scene.render.resolution_y = RES
bpy.context.scene.render.resolution_percentage = 100
bpy.context.scene.render.image_settings.file_format = 'PNG'
bpy.context.scene.render.filepath = os.path.join(OUT, "openpose.png")
try: bpy.context.scene.eevee.taa_render_samples = 16
except Exception: pass
bpy.ops.render.render(write_still=True)
print("  wrote openpose.png")

print("\nDEPTH + OPENPOSE DONE")
