"""
BLUELINE — Redraw Posed Figure Proof · Step 1: Blender renders
Builds a posed mannequin from primitives (crouching/landing hero pose),
then renders three plates:
  (a) ink_plate.png    — flat ink/toon plate for img2img init
  (b) depth_plate.png  — normalised depth (mist) for depth ControlNet
  (c) openpose.png     — 2D skeleton dots/lines (manual, no external lib)

Run headless:
  /Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup -P 01_render_figure.py
"""
import bpy, math, os

OUT = "/Users/loudonstearns/Documents/The Palace/Projects/BLUELINE/proofs/blender-handdrawn/followups/redraw-posed-figure"
os.makedirs(OUT, exist_ok=True)

RES = (832, 1040)  # portrait, matches prior work

# ---------------------------------------------------------------------------
def wipe():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def eevee_engine():
    items = [e.identifier for e in
             bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items]
    for cand in ('BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE'):
        if cand in items:
            return cand
    return items[0]

def ink_mat(name, value=0.93):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    em = nt.nodes.new('ShaderNodeEmission')
    em.inputs['Color'].default_value = (value, value, value, 1)
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(em.outputs['Emission'], out.inputs['Surface'])
    return m

def toon_mat(name, tint=(1, 1, 1)):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    diff = nt.nodes.new('ShaderNodeBsdfDiffuse')
    diff.inputs['Color'].default_value = (tint[0], tint[1], tint[2], 1)
    s2rgb = nt.nodes.new('ShaderNodeShaderToRGB')
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.interpolation = 'CONSTANT'
    e = ramp.color_ramp.elements
    e[0].position = 0.0;  e[0].color = (0.04, 0.04, 0.05, 1)
    e[1].position = 0.45; e[1].color = (0.97, 0.97, 0.97, 1)
    em = nt.nodes.new('ShaderNodeEmission')
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(diff.outputs['BSDF'], s2rgb.inputs['Shader'])
    nt.links.new(s2rgb.outputs['Color'], ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'], em.inputs['Color'])
    nt.links.new(em.outputs['Emission'], out.inputs['Surface'])
    return m

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
    for attr, val in (('select_silhouette', True), ('select_border', True),
                      ('select_crease', True), ('select_contour', True),
                      ('select_external_contour', True),
                      ('select_material_boundary', True)):
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
        m = g[-1]; m.amplitude = 3.5; m.scale = 14; m.octaves = 2; m.smooth = True
    except Exception: pass
    try:
        t = st.thickness_modifiers
        t.new(name='calli', type='CALLIGRAPHY')
        cm = t[-1]; cm.orientation = math.radians(45)
        cm.thickness_min = 0.5; cm.thickness_max = 4.0
    except Exception: pass

def set_world(value):
    w = bpy.data.worlds.new('W'); bpy.context.scene.world = w
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
    except Exception: pass
    sc.render.resolution_x, sc.render.resolution_y = RES
    sc.render.resolution_percentage = 100
    sc.render.image_settings.file_format = 'PNG'
    sc.render.filepath = path
    try: sc.eevee.taa_render_samples = 24
    except Exception: pass
    bpy.ops.render.render(write_still=True)
    print("  wrote", path)

# ---------------------------------------------------------------------------
def add_part(name, shape, location, scale, rot_euler=(0,0,0), smooth=False):
    """Add a primitive body part and return the object."""
    if shape == 'sphere':
        bpy.ops.mesh.primitive_uv_sphere_add(radius=1.0, location=location)
    elif shape == 'cylinder':
        bpy.ops.mesh.primitive_cylinder_add(radius=1.0, depth=2.0, location=location)
    elif shape == 'capsule':
        # capsule = cylinder + two sphere caps; use icosphere as a simple stand-in
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=1.0, location=location)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = scale
    obj.rotation_euler = [math.radians(r) for r in rot_euler]
    if smooth:
        bpy.ops.object.shade_smooth()
    return obj

def build_crouching_hero():
    """
    Landing/crouching hero — low-angle dramatic pose.
    Viewed from front-low (camera at knee height looking slightly up).

    Skeleton joints (world coords):
      head:          (0.0,  0.0,  2.40)
      neck:          (0.0,  0.0,  2.00)
      shoulder_L:   (-0.55, 0.0,  1.85)
      shoulder_R:    (0.55, 0.0,  1.85)
      elbow_L:      (-1.10, 0.15, 1.30)
      elbow_R:       (1.05,-0.15, 1.50)
      hand_L:       (-1.35, 0.30, 0.85)  <- reaching forward/down
      hand_R:        (1.20,-0.25, 1.70)  <- raised slightly
      hip_L:        (-0.32, 0.0,  1.20)
      hip_R:         (0.32, 0.0,  1.20)
      knee_L:       (-0.55,-0.35, 0.60)  <- bent deep
      knee_R:        (0.45, 0.20, 0.55)
      foot_L:       (-0.60,-0.50, 0.05)
      foot_R:        (0.50, 0.35, 0.05)
    """
    parts = []

    # HEAD
    parts.append(add_part('Head', 'sphere', (0.0, 0.0, 2.4), (0.32, 0.32, 0.38), smooth=True))

    # NECK / TORSO  (elongated capsule, slightly leaning)
    parts.append(add_part('Neck', 'cylinder', (0.0, 0.0, 2.05), (0.12, 0.12, 0.18), rot_euler=(5, 0, 0)))
    parts.append(add_part('Torso', 'capsule', (0.02, -0.02, 1.53), (0.38, 0.22, 0.42), rot_euler=(10, 0, 2)))

    # HIPS (wide block)
    parts.append(add_part('Hips', 'capsule', (0.0, 0.0, 1.20), (0.35, 0.20, 0.18), rot_euler=(0, 0, 0)))

    # LEFT ARM — reaching forward-down
    parts.append(add_part('UpperArm_L', 'cylinder', (-0.82, 0.08, 1.57), (0.12, 0.12, 0.34),
                          rot_euler=(-15, 5, -50)))
    parts.append(add_part('Forearm_L', 'cylinder', (-1.22, 0.22, 1.07), (0.10, 0.10, 0.32),
                          rot_euler=(-35, -5, -55)))

    # RIGHT ARM — raised/blocking
    parts.append(add_part('UpperArm_R', 'cylinder', (0.80, -0.08, 1.69), (0.12, 0.12, 0.34),
                          rot_euler=(10, -8, 55)))
    parts.append(add_part('Forearm_R', 'cylinder', (1.14, -0.20, 1.57), (0.10, 0.10, 0.30),
                          rot_euler=(-5, 12, 40)))

    # LEFT LEG — deep crouch, knee forward
    parts.append(add_part('Thigh_L', 'cylinder', (-0.43, -0.17, 0.90), (0.14, 0.14, 0.40),
                          rot_euler=(-25, 5, -8)))
    parts.append(add_part('Shin_L', 'cylinder', (-0.57, -0.42, 0.33), (0.11, 0.11, 0.38),
                          rot_euler=(48, 2, -5)))
    parts.append(add_part('Foot_L', 'capsule', (-0.62, -0.52, 0.06), (0.09, 0.20, 0.07),
                          rot_euler=(0, 10, 0)))

    # RIGHT LEG — crouched but less extreme
    parts.append(add_part('Thigh_R', 'cylinder', (0.38, 0.10, 0.87), (0.14, 0.14, 0.40),
                          rot_euler=(-20, -4, 10)))
    parts.append(add_part('Shin_R', 'cylinder', (0.47, 0.28, 0.30), (0.11, 0.11, 0.36),
                          rot_euler=(42, -3, 6)))
    parts.append(add_part('Foot_R', 'capsule', (0.50, 0.36, 0.05), (0.09, 0.20, 0.07),
                          rot_euler=(0, -8, 0)))

    # Ground plane
    bpy.ops.mesh.primitive_plane_add(size=20, location=(0, 0, -0.01))
    ground = bpy.context.active_object; ground.name = 'Ground'
    parts.append(ground)

    return parts

def add_scene_lighting():
    # Key light: hard low-angle (dramatic shadow under chin, legs)
    d = bpy.data.lights.new('Key', 'SUN'); d.energy = 5.5
    try: d.angle = math.radians(3)
    except Exception: pass
    o = bpy.data.objects.new('Key', d)
    bpy.context.collection.objects.link(o)
    o.rotation_euler = (math.radians(48), math.radians(15), math.radians(-40))

    # Rim light: opposite side, cooler
    d2 = bpy.data.lights.new('Rim', 'SUN'); d2.energy = 1.8
    try: d2.angle = math.radians(5)
    except Exception: pass
    o2 = bpy.data.objects.new('Rim', d2)
    bpy.context.collection.objects.link(o2)
    o2.rotation_euler = (math.radians(52), math.radians(-12), math.radians(140))

def add_hero_camera():
    """Low canted angle — camera at about knee height, looking up slightly."""
    cam_data = bpy.data.cameras.new('Cam'); cam_data.lens = 35
    cam = bpy.data.objects.new('Cam', cam_data)
    bpy.context.collection.objects.link(cam)
    cam.location = (0.3, -4.5, 0.9)
    cam.rotation_euler = (math.radians(80), 0, math.radians(2))
    # Dutch tilt
    cam.rotation_mode = 'XYZ'
    cam.rotation_euler.rotate_axis('Z', math.radians(-7))
    bpy.context.scene.camera = cam
    return cam

# ---------------------------------------------------------------------------
# PASS 1: INK PLATE (toon-shaded with Freestyle = good Canny source)
# ---------------------------------------------------------------------------
print("\n=== PASS 1: INK PLATE ===")
wipe()
parts = build_crouching_hero()
add_scene_lighting()
add_hero_camera()

bpy.context.scene.render.engine = eevee_engine()
set_world(1.0)
im = ink_mat('ink')
for o in parts:
    if o.type == 'MESH':
        o.data.materials.clear(); o.data.materials.append(im)
configure_freestyle(thickness=2.8)
render_to(os.path.join(OUT, "ink_plate.png"))

# ---------------------------------------------------------------------------
# PASS 2: TOON PLATE (richer init for img2img)
# ---------------------------------------------------------------------------
print("\n=== PASS 2: TOON PLATE ===")
wipe()
parts = build_crouching_hero()
add_scene_lighting()
add_hero_camera()

bpy.context.scene.render.engine = eevee_engine()
set_world(0.15)
tm = toon_mat('toon')
for o in parts:
    if o.type == 'MESH':
        o.data.materials.clear(); o.data.materials.append(tm)
configure_freestyle(thickness=2.6)
render_to(os.path.join(OUT, "toon_plate.png"))

# ---------------------------------------------------------------------------
# PASS 3: DEPTH PLATE (mist pass, normalised to 0-1 image)
# ---------------------------------------------------------------------------
print("\n=== PASS 3: DEPTH PLATE ===")
wipe()
parts = build_crouching_hero()
add_scene_lighting()
add_hero_camera()

sc = bpy.context.scene
sc.render.engine = eevee_engine()
set_world(0.0)

# Flat black materials — only the mist/depth will matter
bm = bpy.data.materials.new('depth_base'); bm.use_nodes = True
nt = bm.node_tree; nt.nodes.clear()
em = nt.nodes.new('ShaderNodeEmission')
em.inputs['Color'].default_value = (0.5, 0.5, 0.5, 1)
out = nt.nodes.new('ShaderNodeOutputMaterial')
nt.links.new(em.outputs['Emission'], out.inputs['Surface'])
for o in parts:
    if o.type == 'MESH':
        o.data.materials.clear(); o.data.materials.append(bm)

sc.render.use_freestyle = False

# Enable mist pass
sc.world = bpy.data.worlds.new('DepthWorld')
sc.world.use_nodes = True
bg = sc.world.node_tree.nodes.get('Background')
if bg:
    bg.inputs['Color'].default_value = (1.0, 1.0, 1.0, 1)
    bg.inputs['Strength'].default_value = 1.0

# Mist settings on scene
sc.world.mist_settings.use_mist = True
sc.world.mist_settings.start = 0.5   # starts right in front of camera
sc.world.mist_settings.depth = 12.0  # full black at 12 units
sc.world.mist_settings.falloff = 'LINEAR'

# Enable the mist pass on the view layer
vl = sc.view_layers[0]
vl.use_pass_mist = True

# Setup compositor to output mist as the image
sc.use_nodes = True
tree = sc.node_tree
tree.nodes.clear()

rl = tree.nodes.new('CompositorNodeRLayers')
rl.location = (0, 0)

# Invert the mist so near=white, far=dark (closer = more structure for depth CN)
inv = tree.nodes.new('CompositorNodeInvert')
inv.location = (250, 0)

comp = tree.nodes.new('CompositorNodeComposite')
comp.location = (500, 0)

fov = tree.nodes.new('CompositorNodeViewer')
fov.location = (500, -200)

tree.links.new(rl.outputs['Mist'], inv.inputs['Color'])
tree.links.new(inv.outputs['Color'], comp.inputs['Image'])
tree.links.new(inv.outputs['Color'], fov.inputs['Image'])

try:
    sc.view_settings.view_transform = 'Standard'
    sc.view_settings.look = 'None'
except Exception: pass
sc.render.resolution_x, sc.render.resolution_y = RES
sc.render.resolution_percentage = 100
sc.render.image_settings.file_format = 'PNG'
sc.render.filepath = os.path.join(OUT, "depth_plate.png")
try: sc.eevee.taa_render_samples = 16
except Exception: pass
bpy.ops.render.render(write_still=True)
print("  wrote depth_plate.png")

# ---------------------------------------------------------------------------
# PASS 4: OPENPOSE-STYLE SKELETON (2D projected joint dots + bone lines)
# Rendered as: coloured spheres on the figure joints, on a black background.
# We manually project the known joint positions into screen space.
# ---------------------------------------------------------------------------
print("\n=== PASS 4: OPENPOSE SKELETON ===")

# Joint positions in world space (same as build_crouching_hero geometry centers)
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

# Colour palette matching standard OpenPose output
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
parts = build_crouching_hero()   # rebuild the scene geometry for camera
add_scene_lighting()
cam = add_hero_camera()
bpy.context.scene.render.engine = eevee_engine()

# Remove all built parts — we only want the skeleton spheres
for o in list(bpy.data.objects):
    if o.type == 'MESH':
        bpy.data.objects.remove(o, do_unlink=True)
    elif o.type == 'LIGHT':
        bpy.data.objects.remove(o, do_unlink=True)

# Add camera back (it was removed by the above)
cam_data2 = bpy.data.cameras.new('SkeletonCam'); cam_data2.lens = 35
cam_obj = bpy.data.objects.new('SkeletonCam', cam_data2)
bpy.context.collection.objects.link(cam_obj)
cam_obj.location = (0.3, -4.5, 0.9)
cam_obj.rotation_euler = (math.radians(80), 0, math.radians(2))
cam_obj.rotation_mode = 'XYZ'
cam_obj.rotation_euler.rotate_axis('Z', math.radians(-7))
bpy.context.scene.camera = cam_obj

# Black world
set_world(0.0)
bpy.context.scene.render.use_freestyle = False

# Add joint spheres + emissive coloured materials
for jname, jpos in JOINTS.items():
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.10, location=jpos)
    js = bpy.context.active_object; js.name = f"joint_{jname}"
    bpy.ops.object.shade_smooth()
    m = bpy.data.materials.new(f"jmat_{jname}"); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    col = JOINT_COLORS[jname]
    em = nt.nodes.new('ShaderNodeEmission')
    em.inputs['Color'].default_value = (col[0], col[1], col[2], 1)
    em.inputs['Strength'].default_value = 8.0  # bright
    outn = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(em.outputs['Emission'], outn.inputs['Surface'])
    js.data.materials.append(m)

# Add bone cylinders
for bone in BONES:
    a = JOINTS[bone[0]]; b_pos = JOINTS[bone[1]]
    import mathutils
    pa = mathutils.Vector(a); pb = mathutils.Vector(b_pos)
    mid = (pa + pb) / 2
    length = (pb - pa).length
    direction = (pb - pa).normalized()
    # cylinder default axis is Z; find rotation to align Z to direction
    z_axis = mathutils.Vector((0, 0, 1))
    rot_quat = z_axis.rotation_difference(direction)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.035, depth=length, location=mid)
    bo = bpy.context.active_object; bo.name = f"bone_{bone[0]}_{bone[1]}"
    bo.rotation_euler = rot_quat.to_euler()
    # Use a dim grey material for bones
    bm2 = bpy.data.materials.new(f"bonemat"); bm2.use_nodes = True
    nt2 = bm2.node_tree; nt2.nodes.clear()
    em2 = nt2.nodes.new('ShaderNodeEmission')
    em2.inputs['Color'].default_value = (0.5, 0.5, 0.5, 1)
    em2.inputs['Strength'].default_value = 2.0
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

print("\nALL BLENDER PASSES DONE")
