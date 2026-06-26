"""
BLUELINE — Posed Mannequin Master Script
pose_mannequin.py

Builds a rigged human armature (Rigify-derived proportions, no external files needed),
poses it from a clean Python API, and renders THREE plates per pose:
  (a) ink_plate.png   — Freestyle ink render (toon shading)
  (b) depth_plate.png — camera-distance depth (near=white, far=dark)
  (c) openpose.png    — OpenPose-style coloured skeleton on black background

Run headless (example — Pose A, crouching landing):
  /Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup -P pose_mannequin.py -- --pose A

Run all 3 poses:
  for P in A B C; do
    /Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup -P pose_mannequin.py -- --pose $P
  done

Output goes to mannequin-solution/renders/pose_<X>/  (ink_plate.png, depth_plate.png, openpose.png)

APPROACH:
  No external downloads. Skeleton built from Rigify human-metarig proportions using pure bpy.
  Armature has named bones (thigh.L, shin.L, upper_arm.L, forearm.L, etc).
  Poses are driven by bone rotations in Euler space — fully reproducible.
  A simple skin mesh (capsule per bone) is auto-generated for rendering.
"""

import bpy
import math
import os
import sys
import mathutils
import argparse

# ─────────────────────────────────────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_BASE   = os.path.join(SCRIPT_DIR, "renders")
RES        = (832, 1040)

# ─────────────────────────────────────────────────────────────────────────────
# PARSE ARGS  (everything after "--" is passed to the Python script)
# ─────────────────────────────────────────────────────────────────────────────
def parse_args():
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1:]
    else:
        argv = []
    parser = argparse.ArgumentParser()
    parser.add_argument("--pose", default="A", help="Pose label: A (crouch/landing), B (stride), C (arms-raised)")
    args = parser.parse_args(argv)
    return args


# ─────────────────────────────────────────────────────────────────────────────
# SKELETON DEFINITION  (Rigify human-metarig proportions, world-space coords)
# Bones: (name, head_xyz, tail_xyz, parent_name_or_None)
# The figure stands 1.98 m tall, T-pose rest.
# ─────────────────────────────────────────────────────────────────────────────
BONES_DEF = [
    # --- spine chain ---
    ("root",        (0.0000,  0.0552, 0.9000),  (0.0000,  0.0552, 1.0099), None),
    ("spine",       (0.0000,  0.0552, 1.0099),  (0.0000,  0.0172, 1.1573), "root"),
    ("spine.001",   (0.0000,  0.0172, 1.1573),  (0.0000,  0.0004, 1.2929), "spine"),
    ("spine.002",   (0.0000,  0.0004, 1.2929),  (0.0000,  0.0059, 1.4657), "spine.001"),
    ("spine.003",   (0.0000,  0.0059, 1.4657),  (0.0000,  0.0114, 1.6582), "spine.002"),
    ("spine.004",   (0.0000,  0.0114, 1.6582),  (0.0000, -0.0130, 1.7197), "spine.003"),
    ("spine.005",   (0.0000, -0.0130, 1.7197),  (0.0000, -0.0247, 1.7813), "spine.004"),
    ("spine.006",   (0.0000, -0.0247, 1.7813),  (0.0000, -0.0247, 1.9796), "spine.005"),

    # --- shoulders ---
    ("shoulder.L",  ( 0.0183, -0.0684, 1.6051), ( 0.1694,  0.0205, 1.6050), "spine.003"),
    ("shoulder.R",  (-0.0183, -0.0684, 1.6051), (-0.1694,  0.0205, 1.6050), "spine.003"),

    # --- arms ---
    ("upper_arm.L", ( 0.1953,  0.0267, 1.5846), ( 0.4424,  0.0885, 1.4491), "shoulder.L"),
    ("upper_arm.R", (-0.1953,  0.0267, 1.5846), (-0.4424,  0.0885, 1.4491), "shoulder.R"),
    ("forearm.L",   ( 0.4424,  0.0885, 1.4491), ( 0.6594,  0.0492, 1.3061), "upper_arm.L"),
    ("forearm.R",   (-0.4424,  0.0885, 1.4491), (-0.6594,  0.0492, 1.3061), "upper_arm.R"),
    ("hand.L",      ( 0.6594,  0.0492, 1.3061), ( 0.7600,  0.0412, 1.2400), "forearm.L"),
    ("hand.R",      (-0.6594,  0.0492, 1.3061), (-0.7600,  0.0412, 1.2400), "forearm.R"),

    # --- hips/pelvis ---
    ("pelvis.L",    ( 0.0000,  0.0552, 1.0099), ( 0.0980,  0.0124, 1.0720), "root"),
    ("pelvis.R",    ( 0.0000,  0.0552, 1.0099), (-0.0980,  0.0124, 1.0720), "root"),

    # --- legs ---
    ("thigh.L",     ( 0.0980,  0.0124, 1.0720), ( 0.0980, -0.0286, 0.5372), "pelvis.L"),
    ("thigh.R",     (-0.0980,  0.0124, 1.0720), (-0.0980, -0.0286, 0.5372), "pelvis.R"),
    ("shin.L",      ( 0.0980, -0.0286, 0.5372), ( 0.0980,  0.0162, 0.0852), "thigh.L"),
    ("shin.R",      (-0.0980, -0.0286, 0.5372), (-0.0980,  0.0162, 0.0852), "thigh.R"),
    ("foot.L",      ( 0.0980,  0.0162, 0.0852), ( 0.0980, -0.0934, 0.0167), "shin.L"),
    ("foot.R",      (-0.0980,  0.0162, 0.0852), (-0.0980, -0.0934, 0.0167), "shin.R"),
    ("toe.L",       ( 0.0980, -0.0934, 0.0167), ( 0.0980, -0.1606, 0.0167), "foot.L"),
    ("toe.R",       (-0.0980, -0.0934, 0.0167), (-0.0980, -0.1606, 0.0167), "foot.R"),
]

# ─────────────────────────────────────────────────────────────────────────────
# POSE DEFINITIONS
# Each pose is a dict of bone_name -> (rot_x_deg, rot_y_deg, rot_z_deg)
# applied additively in POSE mode (relative to the rest pose).
# Bone rotation mode is XYZ Euler.
# ─────────────────────────────────────────────────────────────────────────────

POSE_A = {
    # Crouching/landing hero — deep crouch, one arm reaching down
    # Bone rest pose: spine is vertical, arms straight out sideways, legs straight down
    "spine":        (-12,  0,  2),   # torso leans forward
    "spine.001":    (-10,  0,  0),
    "spine.002":    ( -8,  0,  0),
    "spine.003":    ( -5,  0,  0),
    "spine.004":    (  2,  0, -3),
    "spine.005":    (  5,  0, -2),
    "spine.006":    ( 15,  0,  0),   # head pitched forward (nodding down)

    # Left arm: reaching forward/down (arm was horizontal in rest — rotate down)
    "shoulder.L":   (  5,  0, -10),
    "upper_arm.L":  (-20, 5, -50),   # swing arm down and forward
    "forearm.L":    (-40,-5, -20),
    "hand.L":       (-15, 0,  -5),

    # Right arm: raised blocking
    "shoulder.R":   (  5,  0,  10),
    "upper_arm.R":  ( 15,-8,  55),
    "forearm.R":    ( -5,12,  15),
    "hand.R":       (  5, 0,   0),

    # Left leg: deep crouch — thigh.L rest is pointing straight down
    # Positive X = knee swings forward
    "thigh.L":      (-45, 5, -8),   # knee swings forward 45 deg
    "shin.L":       ( 80, 2, -5),   # shin bends back behind knee
    "foot.L":       (-15, 0,  0),   # foot levels out

    # Right leg: crouched but less extreme
    "thigh.R":      (-38,-4,  10),
    "shin.R":       ( 70,-3,   6),
    "foot.R":       (-12, 0,   0),
}

POSE_B = {
    # Confident stride — mid-stride, weight forward, arms swinging
    "spine":        (-3,  0,  0),
    "spine.001":    (-2,  0,  0),
    "spine.002":    ( 0,  0,  4),   # slight torso twist
    "spine.003":    ( 0,  0,  4),
    "spine.004":    ( 0,  0, -2),
    "spine.005":    ( 0,  0, -2),
    "spine.006":    ( 5,  0,  0),   # chin slightly up

    # Left arm: swinging back
    "shoulder.L":   ( 0,  0,  0),
    "upper_arm.L":  ( 25, 0,  10),
    "forearm.L":    (-20, 0,   0),
    "hand.L":       (  0, 0,   0),

    # Right arm: swinging forward
    "shoulder.R":   ( 0,  0,  0),
    "upper_arm.R":  (-30, 0,  -8),
    "forearm.R":    ( 15, 0,   0),
    "hand.R":       (  0, 0,   0),

    # Left leg: stride forward (front leg)
    "thigh.L":      (-35, 0,  0),
    "shin.L":       ( 10, 0,  0),
    "foot.L":       (-10, 0,  0),

    # Right leg: push-off (back leg)
    "thigh.R":      ( 25, 0,  0),
    "shin.R":       (-10, 0,  0),
    "foot.R":       ( 20, 0,  0),
}

POSE_C = {
    # Arms raised high — triumphant V-shape
    # Empirically determined: X=-150 on upper_arm raises hand to z=1.70 (above shoulder)
    # Add negative Z rotation to splay outward (V shape)
    "spine":        ( 5,  0,  0),   # slight arch backward/chest out
    "spine.001":    ( 5,  0,  0),
    "spine.002":    ( 3,  0,  0),
    "spine.003":    ( 2,  0,  0),
    "spine.004":    (-2,  0,  0),
    "spine.005":    (-3,  0,  0),
    "spine.006":    (-12, 0,  0),   # head tilts back looking up

    # Left arm raised — X=-150 rotates arm up, Z=-20 splays outward
    "shoulder.L":   (  0,  0, -12),
    "upper_arm.L":  (-150, 0, -20),
    "forearm.L":    ( 20,  0,  0),
    "hand.L":       (  0,  0,  0),

    # Right arm raised mirror (Z positive splays right)
    "shoulder.R":   (  0,  0,  12),
    "upper_arm.R":  (-150, 0,  20),
    "forearm.R":    ( 20,  0,  0),
    "hand.R":       (  0,  0,  0),

    # Feet slightly apart, standing upright
    "thigh.L":      (  0,  0,  5),
    "shin.L":       (  2,  0,  0),
    "foot.L":       ( -8,  0,  0),

    "thigh.R":      (  0,  0, -5),
    "shin.R":       (  2,  0,  0),
    "foot.R":       ( -8,  0,  0),
}

ALL_POSES = {"A": POSE_A, "B": POSE_B, "C": POSE_C}


# ─────────────────────────────────────────────────────────────────────────────
# SCENE UTILITIES
# ─────────────────────────────────────────────────────────────────────────────
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
    w = bpy.data.worlds.new('W')
    bpy.context.scene.world = w
    w.use_nodes = True
    bg = w.node_tree.nodes.get('Background')
    if bg:
        bg.inputs['Color'].default_value = (value, value, value, 1)
        bg.inputs['Strength'].default_value = 1.0

def render_to(path):
    sc = bpy.context.scene
    try:
        sc.view_settings.view_transform = 'Standard'
        sc.view_settings.look = 'None'
    except Exception:
        pass
    sc.render.resolution_x, sc.render.resolution_y = RES
    sc.render.resolution_percentage = 100
    sc.render.image_settings.file_format = 'PNG'
    sc.render.filepath = path
    try:
        sc.eevee.taa_render_samples = 24
    except Exception:
        pass
    bpy.ops.render.render(write_still=True)
    print(f"  wrote {path}")

def add_scene_lighting():
    d = bpy.data.lights.new('Key', 'SUN')
    d.energy = 5.5
    try: d.angle = math.radians(3)
    except Exception: pass
    o = bpy.data.objects.new('Key', d)
    bpy.context.collection.objects.link(o)
    o.rotation_euler = (math.radians(48), math.radians(15), math.radians(-40))

    d2 = bpy.data.lights.new('Rim', 'SUN')
    d2.energy = 1.8
    try: d2.angle = math.radians(5)
    except Exception: pass
    o2 = bpy.data.objects.new('Rim', d2)
    bpy.context.collection.objects.link(o2)
    o2.rotation_euler = (math.radians(52), math.radians(-12), math.radians(140))

def add_camera(pose_label):
    cd = bpy.data.cameras.new('Cam')
    cd.lens = 35
    cam = bpy.data.objects.new('Cam', cd)
    bpy.context.collection.objects.link(cam)

    if pose_label == "A":
        # Low hero angle (crouching) — pulled closer, slight dutch tilt
        cam.location = (0.2, -3.5, 0.7)
        cam.rotation_euler = (math.radians(82), 0, math.radians(2))
        cam.rotation_mode = 'XYZ'
        cam.rotation_euler.rotate_axis('Z', math.radians(-8))
    elif pose_label == "B":
        # 3/4 side view for stride — slightly lower to show legs
        cam.location = (-2.2, -3.8, 1.0)
        cam.rotation_euler = (math.radians(76), 0, math.radians(-28))
    elif pose_label == "C":
        # Front view, camera at waist height looking straight ahead to show full figure
        # Figure arms go to ~1.7m, feet at 0; camera at 0.85m height, looking at target
        cam.location = (0.0, -5.0, 0.85)
        cam.rotation_euler = (math.radians(90), 0, 0)

    bpy.context.scene.camera = cam
    return cam


# ─────────────────────────────────────────────────────────────────────────────
# ARMATURE BUILDER
# Builds the skeleton from BONES_DEF, no Rigify required.
# ─────────────────────────────────────────────────────────────────────────────
def build_armature():
    arm_data = bpy.data.armatures.new("Mannequin_Skeleton")
    arm_obj  = bpy.data.objects.new("Mannequin_Armature", arm_data)
    bpy.context.collection.objects.link(arm_obj)
    bpy.context.view_layer.objects.active = arm_obj
    arm_obj.select_set(True)

    bpy.ops.object.mode_set(mode='EDIT')
    ebs = arm_data.edit_bones

    bone_map = {}  # name -> edit_bone
    for (name, head, tail, parent_name) in BONES_DEF:
        eb = ebs.new(name)
        eb.head = head
        eb.tail = tail
        eb.roll = 0.0
        eb.use_connect = False
        bone_map[name] = eb

    # Set parents
    for (name, head, tail, parent_name) in BONES_DEF:
        if parent_name and parent_name in bone_map:
            bone_map[name].parent = bone_map[parent_name]

    bpy.ops.object.mode_set(mode='POSE')
    # Set all bones to XYZ Euler
    for pb in arm_obj.pose.bones:
        pb.rotation_mode = 'XYZ'

    bpy.ops.object.mode_set(mode='OBJECT')
    return arm_obj


# ─────────────────────────────────────────────────────────────────────────────
# POSE APPLICATION
# ─────────────────────────────────────────────────────────────────────────────
def apply_pose(arm_obj, pose_dict):
    """Apply rotation offsets to pose bones. bone_name -> (rx_deg, ry_deg, rz_deg)"""
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.mode_set(mode='POSE')

    for bone_name, rots in pose_dict.items():
        if bone_name in arm_obj.pose.bones:
            pb = arm_obj.pose.bones[bone_name]
            pb.rotation_mode = 'XYZ'
            pb.rotation_euler = tuple(math.radians(r) for r in rots)
        else:
            print(f"  [WARN] bone not found: {bone_name}")

    bpy.ops.object.mode_set(mode='OBJECT')

    # Update deps so world matrices are current
    bpy.context.view_layer.update()
    bpy.context.evaluated_depsgraph_get()


# ─────────────────────────────────────────────────────────────────────────────
# SKIN MESH BUILDER
# Creates a capsule-like cylinder per bone segment, parented to the armature.
# This gives the figure volume for Freestyle ink rendering and depth.
# ─────────────────────────────────────────────────────────────────────────────
BONE_RADIUS = {
    # Override per-bone radius (fallback 0.05)
    "spine":      0.100,
    "spine.001":  0.100,
    "spine.002":  0.095,
    "spine.003":  0.090,
    "spine.004":  0.075,
    "spine.005":  0.060,
    "spine.006":  0.070,   # neck
    "shoulder.L": 0.045,
    "shoulder.R": 0.045,
    "upper_arm.L":0.060,
    "upper_arm.R":0.060,
    "forearm.L":  0.048,
    "forearm.R":  0.048,
    "hand.L":     0.042,
    "hand.R":     0.042,
    "pelvis.L":   0.055,
    "pelvis.R":   0.055,
    "thigh.L":    0.075,
    "thigh.R":    0.075,
    "shin.L":     0.058,
    "shin.R":     0.058,
    "foot.L":     0.042,
    "foot.R":     0.042,
    "toe.L":      0.025,
    "toe.R":      0.025,
    "root":       0.000,  # invisible
}

# Bones to skip (invisible / tiny)
SKIP_BONES = {"root", "pelvis.L", "pelvis.R"}

def build_skin(arm_obj, material):
    """
    For each bone, place a cylinder segment aligned to bone's world space vector.
    Parent each mesh to the armature via an Armature modifier + vertex group
    so it deforms with the pose.
    """
    skin_parts = []
    bpy.context.view_layer.update()
    depsgraph = bpy.context.evaluated_depsgraph_get()
    arm_eval  = arm_obj.evaluated_get(depsgraph)

    for bone in arm_eval.pose.bones:
        if bone.name in SKIP_BONES:
            continue
        radius = BONE_RADIUS.get(bone.name, 0.05)
        if radius < 0.01:
            continue

        # Bone head/tail in WORLD space
        head_w = arm_eval.matrix_world @ bone.head
        tail_w = arm_eval.matrix_world @ bone.tail
        direction = (tail_w - head_w)
        length = direction.length
        if length < 0.005:
            continue

        mid = (head_w + tail_w) / 2
        direction_norm = direction.normalized()
        z_axis = mathutils.Vector((0, 0, 1))
        rot_quat = z_axis.rotation_difference(direction_norm)

        bpy.ops.mesh.primitive_cylinder_add(radius=radius, depth=length, location=mid)
        part = bpy.context.active_object
        part.name = f"skin_{bone.name}"
        part.rotation_euler = rot_quat.to_euler()
        bpy.ops.object.shade_smooth()
        part.data.materials.clear()
        part.data.materials.append(material)
        skin_parts.append(part)

    # Head sphere
    head_bone = arm_eval.pose.bones.get("spine.006")
    if head_bone:
        head_tail_w = arm_eval.matrix_world @ head_bone.tail
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.115, location=head_tail_w)
        hs = bpy.context.active_object
        hs.name = "skin_head"
        bpy.ops.object.shade_smooth()
        hs.data.materials.clear()
        hs.data.materials.append(material)
        skin_parts.append(hs)

    return skin_parts


# ─────────────────────────────────────────────────────────────────────────────
# MATERIAL BUILDERS
# ─────────────────────────────────────────────────────────────────────────────
def toon_mat(name, tint=(0.92, 0.92, 0.92)):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    diff = nt.nodes.new('ShaderNodeBsdfDiffuse')
    diff.inputs['Color'].default_value = (tint[0], tint[1], tint[2], 1)
    s2rgb = nt.nodes.new('ShaderNodeShaderToRGB')
    ramp  = nt.nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.interpolation = 'CONSTANT'
    e = ramp.color_ramp.elements
    e[0].position = 0.0;  e[0].color = (0.05, 0.05, 0.06, 1)
    e[1].position = 0.42; e[1].color = (0.96, 0.96, 0.96, 1)
    em  = nt.nodes.new('ShaderNodeEmission')
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(diff.outputs['BSDF'],   s2rgb.inputs['Shader'])
    nt.links.new(s2rgb.outputs['Color'], ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'],  em.inputs['Color'])
    nt.links.new(em.outputs['Emission'], out.inputs['Surface'])
    return m

def depth_mat(name):
    """Camera-distance gradient: near=white, far=dark."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    cd  = nt.nodes.new('ShaderNodeCameraData')
    mr  = nt.nodes.new('ShaderNodeMapRange')
    mr.inputs['From Min'].default_value = 1.5
    mr.inputs['From Max'].default_value = 9.0
    mr.inputs['To Min'].default_value   = 1.0
    mr.inputs['To Max'].default_value   = 0.0
    mr.clamp = True
    em  = nt.nodes.new('ShaderNodeEmission')
    em.inputs['Strength'].default_value = 1.0
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(cd.outputs['View Z Depth'], mr.inputs['Value'])
    nt.links.new(mr.outputs['Result'],        em.inputs['Color'])
    nt.links.new(em.outputs['Emission'],      out.inputs['Surface'])
    return m


# ─────────────────────────────────────────────────────────────────────────────
# FREESTYLE CONFIG
# ─────────────────────────────────────────────────────────────────────────────
def configure_freestyle(thickness=2.6):
    sc = bpy.context.scene
    sc.render.use_freestyle = True
    sc.render.line_thickness_mode = 'ABSOLUTE'
    vl = sc.view_layers[0]
    vl.use_freestyle = True
    fs = vl.freestyle_settings
    if len(fs.linesets) == 0:
        fs.linesets.new('LineSet')
    ls = fs.linesets[0]
    if ls.linestyle is None:
        ls.linestyle = bpy.data.linestyles.new('InkStyle')
    for attr, val in (
        ('select_silhouette', True), ('select_border', True),
        ('select_crease',     True), ('select_contour', True),
        ('select_external_contour', True),
        ('select_material_boundary', True),
    ):
        try: setattr(ls, attr, val)
        except Exception: pass
    try: ls.crease_angle = math.radians(120)
    except Exception: pass
    st = ls.linestyle
    st.color = (0, 0, 0)
    st.thickness = thickness
    st.use_chaining = True
    try: st.chaining = 'SKETCHY'; st.rounds = 3
    except Exception: pass
    try: st.use_same_object = True
    except Exception: pass
    g = st.geometry_modifiers
    try:
        g.new(name='noise', type='SPATIAL_NOISE')
        m2 = g[-1]
        m2.amplitude = 3.0; m2.scale = 12; m2.octaves = 2; m2.smooth = True
    except Exception: pass
    try:
        t = st.thickness_modifiers
        t.new(name='calli', type='CALLIGRAPHY')
        cm = t[-1]
        cm.orientation = math.radians(45)
        cm.thickness_min = 0.4; cm.thickness_max = 3.8
    except Exception: pass


# ─────────────────────────────────────────────────────────────────────────────
# OPENPOSE SKELETON  — read bone world positions FROM the armature pose
# ─────────────────────────────────────────────────────────────────────────────

# Mapping: OpenPose joint name -> (bone_name, use_head_or_tail)
OPENPOSE_JOINT_MAP = {
    "head":       ("spine.006",  "tail"),
    "neck":       ("spine.006",  "head"),
    "shoulder_L": ("upper_arm.L","head"),
    "shoulder_R": ("upper_arm.R","head"),
    "elbow_L":    ("forearm.L",  "head"),
    "elbow_R":    ("forearm.R",  "head"),
    "hand_L":     ("hand.L",     "tail"),
    "hand_R":     ("hand.R",     "tail"),
    "hip_L":      ("thigh.L",    "head"),
    "hip_R":      ("thigh.R",    "head"),
    "knee_L":     ("shin.L",     "head"),
    "knee_R":     ("shin.R",     "head"),
    "foot_L":     ("foot.L",     "tail"),
    "foot_R":     ("foot.R",     "tail"),
}

JOINT_COLORS = {
    "head":       (1.0, 0.0, 0.0),
    "neck":       (1.0, 0.5, 0.0),
    "shoulder_L": (0.0, 1.0, 0.0),
    "shoulder_R": (0.0, 0.8, 0.8),
    "elbow_L":    (0.0, 0.6, 0.0),
    "elbow_R":    (0.0, 0.6, 0.6),
    "hand_L":     (0.2, 1.0, 0.2),
    "hand_R":     (0.2, 0.8, 1.0),
    "hip_L":      (1.0, 1.0, 0.0),
    "hip_R":      (0.8, 0.6, 0.0),
    "knee_L":     (1.0, 0.6, 0.0),
    "knee_R":     (0.8, 0.4, 0.0),
    "foot_L":     (1.0, 0.8, 0.2),
    "foot_R":     (0.9, 0.5, 0.1),
}

OPENPOSE_LIMBS = [
    ("head",       "neck"),
    ("neck",       "shoulder_L"), ("neck",       "shoulder_R"),
    ("shoulder_L", "elbow_L"),    ("elbow_L",    "hand_L"),
    ("shoulder_R", "elbow_R"),    ("elbow_R",    "hand_R"),
    ("neck",       "hip_L"),      ("neck",       "hip_R"),
    ("hip_L",      "hip_R"),
    ("hip_L",      "knee_L"),     ("knee_L",     "foot_L"),
    ("hip_R",      "knee_R"),     ("knee_R",     "foot_R"),
]

def get_joint_world_positions(arm_obj):
    """Read joint world-space positions from the posed armature."""
    bpy.context.view_layer.update()
    depsgraph = bpy.context.evaluated_depsgraph_get()
    arm_eval  = arm_obj.evaluated_get(depsgraph)
    mw = arm_eval.matrix_world

    joints = {}
    for jname, (bone_name, which_end) in OPENPOSE_JOINT_MAP.items():
        pb = arm_eval.pose.bones.get(bone_name)
        if pb is None:
            print(f"  [WARN] joint bone missing: {bone_name}")
            continue
        if which_end == "head":
            pos_world = mw @ pb.head
        else:
            pos_world = mw @ pb.tail
        joints[jname] = tuple(pos_world)

    return joints


def build_openpose_scene(joints, cam_location, cam_rotation_euler, cam_lens=35):
    """Build the OpenPose skeleton as coloured emissive spheres + cylinders."""
    # Camera
    cd  = bpy.data.cameras.new('SkeletonCam')
    cd.lens = cam_lens
    cam = bpy.data.objects.new('SkeletonCam', cd)
    bpy.context.collection.objects.link(cam)
    cam.location     = cam_location
    cam.rotation_euler = cam_rotation_euler
    bpy.context.scene.camera = cam

    # Joint spheres
    for jname, jpos in joints.items():
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.055, location=jpos)
        js = bpy.context.active_object
        js.name = f"joint_{jname}"
        bpy.ops.object.shade_smooth()
        col = JOINT_COLORS[jname]
        m = bpy.data.materials.new(f"jmat_{jname}")
        m.use_nodes = True
        nt = m.node_tree; nt.nodes.clear()
        em  = nt.nodes.new('ShaderNodeEmission')
        em.inputs['Color'].default_value = (col[0], col[1], col[2], 1)
        em.inputs['Strength'].default_value = 10.0
        out = nt.nodes.new('ShaderNodeOutputMaterial')
        nt.links.new(em.outputs['Emission'], out.inputs['Surface'])
        js.data.materials.append(m)

    # Limb cylinders
    for (ja, jb) in OPENPOSE_LIMBS:
        if ja not in joints or jb not in joints:
            continue
        pa = mathutils.Vector(joints[ja])
        pb = mathutils.Vector(joints[jb])
        mid       = (pa + pb) / 2
        length    = (pb - pa).length
        direction = (pb - pa).normalized()
        z_axis    = mathutils.Vector((0, 0, 1))
        rot_quat  = z_axis.rotation_difference(direction)

        bpy.ops.mesh.primitive_cylinder_add(radius=0.022, depth=length, location=mid)
        cyl = bpy.context.active_object
        cyl.name = f"limb_{ja}_{jb}"
        cyl.rotation_euler = rot_quat.to_euler()
        bm = bpy.data.materials.new("limbmat")
        bm.use_nodes = True
        nt2 = bm.node_tree; nt2.nodes.clear()
        em2  = nt2.nodes.new('ShaderNodeEmission')
        em2.inputs['Color'].default_value = (0.55, 0.55, 0.55, 1)
        em2.inputs['Strength'].default_value = 3.0
        out2 = nt2.nodes.new('ShaderNodeOutputMaterial')
        nt2.links.new(em2.outputs['Emission'], out2.inputs['Surface'])
        cyl.data.materials.append(bm)


# ─────────────────────────────────────────────────────────────────────────────
# GROUND PLANE
# ─────────────────────────────────────────────────────────────────────────────
def add_ground(material):
    bpy.ops.mesh.primitive_plane_add(size=20, location=(0, 0, -0.01))
    g = bpy.context.active_object
    g.name = "Ground"
    g.data.materials.clear()
    g.data.materials.append(material)
    return g


# ─────────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────────
def main():
    args    = parse_args()
    pose_label = args.pose.upper()
    if pose_label not in ALL_POSES:
        print(f"Unknown pose '{pose_label}'. Choose from: {list(ALL_POSES.keys())}")
        return

    pose_dict = ALL_POSES[pose_label]
    out_dir   = os.path.join(OUT_BASE, f"pose_{pose_label}")
    os.makedirs(out_dir, exist_ok=True)
    print(f"\n=== MANNEQUIN POSE {pose_label} ===  output -> {out_dir}\n")

    # ── PASS 1: INK PLATE ──────────────────────────────────────────────────
    print("--- Pass 1: Ink Plate ---")
    wipe()
    arm_obj = build_armature()
    apply_pose(arm_obj, pose_dict)
    arm_obj.display_type = 'WIRE'
    arm_obj.show_in_front = False

    m_toon = toon_mat("toon")
    skin_parts = build_skin(arm_obj, m_toon)
    ground = add_ground(m_toon)

    add_scene_lighting()
    cam = add_camera(pose_label)

    sc = bpy.context.scene
    sc.render.engine = eevee_engine()
    set_world(1.0)
    configure_freestyle(thickness=2.8)

    render_to(os.path.join(out_dir, "ink_plate.png"))

    # ── PASS 2: DEPTH PLATE ────────────────────────────────────────────────
    print("--- Pass 2: Depth Plate ---")
    wipe()
    arm_obj = build_armature()
    apply_pose(arm_obj, pose_dict)
    arm_obj.display_type = 'WIRE'

    m_depth = depth_mat("depth")
    skin_parts = build_skin(arm_obj, m_depth)
    add_ground(m_depth)

    add_scene_lighting()
    add_camera(pose_label)

    sc = bpy.context.scene
    sc.render.engine = eevee_engine()
    sc.render.use_freestyle = False
    set_world(0.0)

    render_to(os.path.join(out_dir, "depth_plate.png"))

    # ── PASS 3: OPENPOSE SKELETON ──────────────────────────────────────────
    print("--- Pass 3: OpenPose Skeleton ---")
    wipe()
    arm_obj = build_armature()
    apply_pose(arm_obj, pose_dict)

    # Grab joint positions BEFORE wiping
    joints = get_joint_world_positions(arm_obj)
    print(f"  Got {len(joints)} joints: {list(joints.keys())}")

    # Now build the skeleton-only scene
    wipe()
    sc = bpy.context.scene
    sc.render.engine = eevee_engine()
    sc.render.use_freestyle = False
    set_world(0.0)

    # Determine camera params from pose label
    if pose_label == "A":
        cam_loc = (0.2, -3.5, 0.7)
        cam_rot = (math.radians(82), 0, math.radians(2))
    elif pose_label == "B":
        cam_loc = (-2.2, -3.8, 1.0)
        cam_rot = (math.radians(76), 0, math.radians(-28))
    elif pose_label == "C":
        cam_loc = (0.0, -5.0, 0.85)
        cam_rot = (math.radians(90), 0, 0)

    build_openpose_scene(joints, cam_loc, cam_rot)

    render_to(os.path.join(out_dir, "openpose.png"))

    print(f"\n=== POSE {pose_label} COMPLETE ===")
    print(f"  ink_plate.png    -> {out_dir}")
    print(f"  depth_plate.png  -> {out_dir}")
    print(f"  openpose.png     -> {out_dir}")


main()
