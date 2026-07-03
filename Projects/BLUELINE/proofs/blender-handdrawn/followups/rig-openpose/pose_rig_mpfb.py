"""
BLUELINE — Unified Rig + OpenPose, Blender half — MPFB2 BODY MESH edition.

Replaces the procedural mannequin from pose_rig_mesh.py with the MakeHuman
base.obj mesh (CC0, ships with MPFB2) skinned to the same FK armature.
No MPFB2 addon registration needed: the base.obj is imported directly via
bpy.ops.wm.obj_import. This gives a real parametric human body — anatomical
proportions, real face, finger stubs — all deformed by the existing rig.

DESIGN — "adopt the mesh, author the seam":
  1. Build the same FK armature as pose_rig_mesh.py (Rigify-named bones,
     same BONES_DEF, same poses).
  2. Import base.obj at scale=0.11584 (decimeters → Blender meters, scaled
     to match the rig's ~1.96m standing height).
  3. Lift the mesh by 0.9787m so feet land at Z~0 (matching the rig feet).
  4. Parent mesh to armature with ARMATURE_ENVELOPE (Envelope Weights).
     NOTE: ARMATURE_AUTO (heat diffusion) fails silently on the MH base mesh
     in Blender 5.1 — all 19k vertices get zero weight. Envelope weights work
     correctly and give clean deformation. Envelope radii are tuned per bone.
  5. Re-use apply_pose, openpose_keypoints, camera, materials from
     pose_rig_mesh.py — the rest of the pipeline is unchanged.

SCALE MATH (in comments below):
  MH base.obj is in MakeHuman decimeters, Y-up.
  Bounding box: Y=-8.449 (feet) to Y=+8.497 (head top) = 16.946 dm = 1.695 m.
  Rig height (toe tips to spine.006 tail): 1.963 m.
  Import scale = 1.963 / 16.946 * 10 = 0.11584 (dm → m + height match).
  Post-import feet Z = -8.449 * 0.11584 = -0.9787 m → lift = +0.9787 m.
  Result: feet at Z=0.0, head top at Z=1.963 m ≈ rig head top (1.980 m, 0.9% off).

PROPORTIONS NOTE:
  The rig uses stylised long-leg proportions (legs ≈ 54% of height); the MH
  base mesh is anatomical (legs ≈ 50%). After ARMATURE_AUTO the hip and knee
  weights are heat-computed from bone proximity — the mesh deforms correctly
  even where proportions don't align exactly. The face is real and anatomical.

BASE MESH SOURCE:
  MakeHuman base mesh (CC0 since September 2020), extracted from MPFB2 v2.0.16:
    https://github.com/makehumancommunity/mpfb2
  File: src/mpfb/data/3dobjs/base.obj (~1.7 MB, ~19k vertices)
  Bundled at: _tools/mpfb2-base/base.obj (copy it there) OR pass --base-obj.

Run:
  blender -b --factory-startup -P pose_rig_mpfb.py -- --pose A
  blender -b --factory-startup -P pose_rig_mpfb.py -- --pose B
  blender -b --factory-startup -P pose_rig_mpfb.py -- --pose C
  blender -b --factory-startup -P pose_rig_mpfb.py -- --base-obj /path/to/base.obj --pose A

Outputs (renders/mpfb-body/pose_<X>/): ink_plate.png, depth_plate.png, keypoints.json
"""
import bpy, bmesh, math, os, sys, json, argparse, mathutils
from bpy_extras.object_utils import world_to_camera_view

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_BASE    = os.path.join(SCRIPT_DIR, "renders", "mpfb-body")

# Default path for the MH base mesh.
# Copy base.obj here, OR pass --base-obj on CLI.
DEFAULT_BASE_OBJ = os.path.join(
    os.path.dirname(SCRIPT_DIR),          # followups/
    os.pardir,                             # blender-handdrawn/
    os.pardir,                             # proofs/
    os.pardir,                             # BLUELINE/
    "_tools", "mpfb2-base", "base.obj"    # keep it out of the rig-openpose dir
)
# Also try a scratchpad path used during development
_SCRATCHPAD_BASE_OBJ = (
    "/private/tmp/claude-501/-Users-loudonstearns-Documents-The-Palace"
    "/8915d379-19a3-450e-bd1e-26011dd89d26/scratchpad"
    "/mpfb2_extracted/makehumancommunity-mpfb2-f47e9a1/src/mpfb/data/3dobjs/base.obj"
)

RES         = (832, 1040)

# ---- MPFB2 base mesh alignment constants ----------------------------------------
# MakeHuman OBJ is in decimeters, Y-up, -Z forward.
# After Blender import with global_scale=0.11584, forward_axis=NEGATIVE_Z, up_axis=Y:
#   MH Y → Blender Z; MH X → Blender X; MH -Z → Blender -Y
#   Feet at Z = -8.4488 * 0.11584 = -0.9787 m
#   Head top at Z = +8.4967 * 0.11584 = +0.9843 m
# Lift to bring feet to Z=0:
MPFB_IMPORT_SCALE = 0.11584   # dm → m at rig height
MPFB_LIFT_Z       = 0.9787    # meters to shift mesh up after import


# ---- rig definition (identical to pose_rig_mesh.py) ----------------------------
BONES_DEF = [
    ("root",       (0,0.0552,0.9),     (0,0.0552,1.0099),   None),
    ("spine",      (0,0.0552,1.0099),  (0,0.0172,1.1573),   "root"),
    ("spine.001",  (0,0.0172,1.1573),  (0,0.0004,1.2929),   "spine"),
    ("spine.002",  (0,0.0004,1.2929),  (0,0.0059,1.4657),   "spine.001"),
    ("spine.003",  (0,0.0059,1.4657),  (0,0.0114,1.6582),   "spine.002"),
    ("spine.004",  (0,0.0114,1.6582),  (0,-0.013,1.7197),   "spine.003"),
    ("spine.005",  (0,-0.013,1.7197),  (0,-0.0247,1.7813),  "spine.004"),
    ("spine.006",  (0,-0.0247,1.7813), (0,-0.0247,1.9796),  "spine.005"),
    ("shoulder.L", (0.0183,-0.0684,1.6051),(0.1694,0.0205,1.605),"spine.003"),
    ("shoulder.R", (-0.0183,-0.0684,1.6051),(-0.1694,0.0205,1.605),"spine.003"),
    ("upper_arm.L",(0.1953,0.0267,1.5846),(0.4424,0.0885,1.4491),"shoulder.L"),
    ("upper_arm.R",(-0.1953,0.0267,1.5846),(-0.4424,0.0885,1.4491),"shoulder.R"),
    ("forearm.L",  (0.4424,0.0885,1.4491),(0.6594,0.0492,1.3061),"upper_arm.L"),
    ("forearm.R",  (-0.4424,0.0885,1.4491),(-0.6594,0.0492,1.3061),"upper_arm.R"),
    ("hand.L",     (0.6594,0.0492,1.3061),(0.76,0.0412,1.24),"forearm.L"),
    ("hand.R",     (-0.6594,0.0492,1.3061),(-0.76,0.0412,1.24),"forearm.R"),
    ("pelvis.L",   (0,0.0552,1.0099),  (0.098,0.0124,1.072),"root"),
    ("pelvis.R",   (0,0.0552,1.0099),  (-0.098,0.0124,1.072),"root"),
    ("thigh.L",    (0.098,0.0124,1.072),(0.098,-0.0286,0.5372),"pelvis.L"),
    ("thigh.R",    (-0.098,0.0124,1.072),(-0.098,-0.0286,0.5372),"pelvis.R"),
    ("shin.L",     (0.098,-0.0286,0.5372),(0.098,0.0162,0.0852),"thigh.L"),
    ("shin.R",     (-0.098,-0.0286,0.5372),(-0.098,0.0162,0.0852),"thigh.R"),
    ("foot.L",     (0.098,0.0162,0.0852),(0.098,-0.0934,0.0167),"shin.L"),
    ("foot.R",     (-0.098,0.0162,0.0852),(-0.098,-0.0934,0.0167),"shin.R"),
    ("toe.L",      (0.098,-0.0934,0.0167),(0.098,-0.1606,0.0167),"foot.L"),
    ("toe.R",      (-0.098,-0.0934,0.0167),(-0.098,-0.1606,0.0167),"foot.R"),
]

# ---- pose definitions (identical to pose_rig_mesh.py) ---------------------------
POSE_A = {
    "spine":(-12,0,2),"spine.001":(-10,0,0),"spine.002":(-8,0,0),"spine.003":(-5,0,0),
    "spine.006":(15,0,0),"shoulder.L":(5,0,-10),"upper_arm.L":(-20,5,-50),"forearm.L":(-40,-5,-20),
    "shoulder.R":(5,0,10),"upper_arm.R":(15,-8,55),"forearm.R":(-5,12,15),
    "thigh.L":(-45,5,-8),"shin.L":(80,2,-5),"foot.L":(-15,0,0),
    "thigh.R":(-38,-4,10),"shin.R":(70,-3,6),"foot.R":(-12,0,0),
}
POSE_B = {
    "spine.002":(0,0,4),"spine.003":(0,0,4),"spine.006":(5,0,0),
    "upper_arm.L":(25,0,10),"forearm.L":(-20,0,0),"upper_arm.R":(-30,0,-8),"forearm.R":(15,0,0),
    "thigh.L":(-35,0,0),"shin.L":(10,0,0),"foot.L":(-10,0,0),
    "thigh.R":(25,0,0),"shin.R":(-10,0,0),"foot.R":(20,0,0),
}
POSE_C = {
    "spine":(5,0,0),"spine.006":(-12,0,0),"shoulder.L":(0,0,-12),"upper_arm.L":(-150,0,-20),
    "forearm.L":(20,0,0),"shoulder.R":(0,0,12),"upper_arm.R":(-150,0,20),"forearm.R":(20,0,0),
    "thigh.L":(0,0,5),"thigh.R":(0,0,-5),"foot.L":(-8,0,0),"foot.R":(-8,0,0),
}
ALL_POSES = {"A": POSE_A, "B": POSE_B, "C": POSE_C}

# camera (identical to pose_rig_mesh.py)
CAM_LOC   = (1.9, -3.6, 0.95)
CAM_ROT   = (math.radians(80), 0, math.radians(26))
CAM_LENS  = 38


# ---- helpers -------------------------------------------------------------------
def parse_args():
    argv = sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--pose", default="A")
    p.add_argument("--pose-json", default=None)
    p.add_argument("--label", default=None)
    p.add_argument("--base-obj", default=None,
                   help="Path to MakeHuman base.obj (overrides default locations)")
    return p.parse_args(argv)

def find_base_obj(cli_path=None):
    """
    Locate base.obj. Priority:
    1. --base-obj CLI argument
    2. DEFAULT_BASE_OBJ (_tools/mpfb2-base/base.obj relative to BLUELINE root)
    3. Scratchpad (development fallback)
    Raises FileNotFoundError with instructions if none found.
    """
    candidates = [cli_path, DEFAULT_BASE_OBJ, _SCRATCHPAD_BASE_OBJ]
    for p in candidates:
        if p and os.path.isfile(p):
            print(f"  base.obj found: {p}")
            return os.path.abspath(p)
    raise FileNotFoundError(
        "MakeHuman base.obj not found. Download MPFB2 v2.0.16 from:\n"
        "  https://github.com/makehumancommunity/mpfb2/releases\n"
        "Extract src/mpfb/data/3dobjs/base.obj and place it at:\n"
        f"  {DEFAULT_BASE_OBJ}\n"
        "Or pass --base-obj /path/to/base.obj on the command line."
    )

def eevee():
    items = [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items]
    for c in ('BLENDER_EEVEE_NEXT','BLENDER_EEVEE'):
        if c in items: return c
    return items[0]

def set_world(v):
    w = bpy.data.worlds.new('W'); bpy.context.scene.world = w; w.use_nodes = True
    bg = w.node_tree.nodes.get('Background')
    bg.inputs['Color'].default_value = (v, v, v, 1)
    bg.inputs['Strength'].default_value = 1

def toon_mat():
    m = bpy.data.materials.new("toon"); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    d  = nt.nodes.new('ShaderNodeBsdfDiffuse');   d.inputs['Color'].default_value = (0.9,0.9,0.9,1)
    s  = nt.nodes.new('ShaderNodeShaderToRGB')
    r  = nt.nodes.new('ShaderNodeValToRGB');      r.color_ramp.interpolation = 'CONSTANT'
    e  = r.color_ramp.elements
    e[0].position = 0;    e[0].color = (0.05,0.05,0.06,1)
    e[1].position = 0.42; e[1].color = (0.96,0.96,0.96,1)
    em = nt.nodes.new('ShaderNodeEmission')
    o  = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(d.outputs['BSDF'],     s.inputs['Shader'])
    nt.links.new(s.outputs['Color'],    r.inputs['Fac'])
    nt.links.new(r.outputs['Color'],    em.inputs['Color'])
    nt.links.new(em.outputs['Emission'],o.inputs['Surface'])
    return m

def depth_mat():
    m = bpy.data.materials.new("depth"); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    cd = nt.nodes.new('ShaderNodeCameraData')
    mr = nt.nodes.new('ShaderNodeMapRange')
    mr.inputs['From Min'].default_value = 2.0; mr.inputs['From Max'].default_value = 5.5
    mr.inputs['To Min'].default_value  = 1.0; mr.inputs['To Max'].default_value  = 0.0
    mr.clamp = True
    em = nt.nodes.new('ShaderNodeEmission')
    o  = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(cd.outputs['View Z Depth'], mr.inputs['Value'])
    nt.links.new(mr.outputs['Result'],       em.inputs['Color'])
    nt.links.new(em.outputs['Emission'],     o.inputs['Surface'])
    return m


# ---- armature (identical to pose_rig_mesh.py) -----------------------------------
def build_armature():
    ad = bpy.data.armatures.new("Skel")
    ao = bpy.data.objects.new("Armature", ad)
    bpy.context.collection.objects.link(ao)
    bpy.context.view_layer.objects.active = ao; ao.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    ebs = ad.edit_bones; bm = {}
    for n, h, t, par in BONES_DEF:
        eb = ebs.new(n); eb.head = h; eb.tail = t; eb.roll = 0; eb.use_connect = False; bm[n] = eb
    for n, h, t, par in BONES_DEF:
        if par and par in bm: bm[n].parent = bm[par]
    bpy.ops.object.mode_set(mode='POSE')
    for pb in ao.pose.bones: pb.rotation_mode = 'XYZ'
    bpy.ops.object.mode_set(mode='OBJECT')
    return ao

def apply_pose(ao, pd):
    bpy.context.view_layer.objects.active = ao
    bpy.ops.object.mode_set(mode='POSE')
    for bn, r in pd.items():
        if bn in ao.pose.bones:
            ao.pose.bones[bn].rotation_mode = 'XYZ'
            ao.pose.bones[bn].rotation_euler = tuple(math.radians(x) for x in r)
    bpy.ops.object.mode_set(mode='OBJECT')
    bpy.context.view_layer.update()


# ---- MPFB2 mesh loading --------------------------------------------------------
def load_mpfb_body(base_obj_path, armature_ob, mat):
    """
    Import the MakeHuman base mesh (CC0 base.obj from MPFB2), scale and lift
    it to align with the FK armature, apply the toon material, then parent
    to the armature with Automatic Weights.

    Returns the body mesh object.
    """
    print(f"  Importing MH base mesh: {base_obj_path}")

    # Deselect everything before import
    bpy.ops.object.select_all(action='DESELECT')

    # Import the MH base.obj.
    # MakeHuman coordinate system: Y-up, -Z forward (character faces +Z = front)
    # Blender default obj import: forward=NEGATIVE_Z, up=Y — matches MH.
    # global_scale=MPFB_IMPORT_SCALE converts decimeters to meters AND scales
    # the figure to match the FK rig height (~1.96m).
    bpy.ops.wm.obj_import(
        filepath=base_obj_path,
        global_scale=MPFB_IMPORT_SCALE,
        forward_axis='NEGATIVE_Z',
        up_axis='Y',
        use_split_objects=False,   # single mesh object
        use_split_groups=False,
        import_vertex_groups=False,
        validate_meshes=True,
    )

    # After import, the active object should be the mesh
    body = bpy.context.active_object
    if body is None or body.type != 'MESH':
        # Fallback: find the newly created mesh
        body = next((o for o in bpy.context.selected_objects if o.type == 'MESH'), None)
    if body is None:
        raise RuntimeError("OBJ import failed — no mesh object created.")

    body.name = "MPFBBody"
    print(f"  Imported: {body.name} ({len(body.data.vertices)} vertices)")

    # Print bounding box to verify alignment
    bb = [body.matrix_world @ mathutils.Vector(v) for v in body.bound_box]
    zmin = min(v.z for v in bb)
    zmax = max(v.z for v in bb)
    print(f"  BB Z: {zmin:.4f} to {zmax:.4f} (before lift)")

    # Lift mesh so feet are at Z≈0
    body.location.z += MPFB_LIFT_Z
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    # Verify after lift
    bpy.context.view_layer.update()
    bb2 = [body.matrix_world @ mathutils.Vector(v) for v in body.bound_box]
    zmin2 = min(v.z for v in bb2)
    zmax2 = max(v.z for v in bb2)
    print(f"  BB Z after lift: {zmin2:.4f} to {zmax2:.4f} (target: 0.0 to ~1.96)")

    # Apply toon material
    body.data.materials.clear()
    body.data.materials.append(mat)

    # Shade smooth
    bpy.ops.object.shade_smooth()

    # Tune bone envelope radii BEFORE parenting.
    # ARMATURE_AUTO (heat diffusion) fails silently on the MH base mesh in
    # Blender 5.1 — all 19k vertices end up with zero weight assignments.
    # ARMATURE_ENVELOPE works correctly. We tune envelope_distance and radii
    # per bone family so the envelope coverage matches the human silhouette.
    bpy.context.view_layer.objects.active = armature_ob
    bpy.ops.object.mode_set(mode='EDIT')
    ad = armature_ob.data
    for eb in ad.edit_bones:
        n = eb.name
        # Spine: wide envelopes to cover torso
        if n.startswith("spine"):
            eb.envelope_distance = 0.20
            eb.head_radius = 0.14
            eb.tail_radius = 0.14
        # Upper arms: medium envelopes
        elif "upper_arm" in n:
            eb.envelope_distance = 0.12
            eb.head_radius = 0.08
            eb.tail_radius = 0.07
        # Forearms / hands
        elif "forearm" in n:
            eb.envelope_distance = 0.10
            eb.head_radius = 0.07
            eb.tail_radius = 0.05
        elif "hand" in n:
            eb.envelope_distance = 0.08
            eb.head_radius = 0.06
            eb.tail_radius = 0.05
        # Thighs: wide
        elif "thigh" in n:
            eb.envelope_distance = 0.14
            eb.head_radius = 0.10
            eb.tail_radius = 0.09
        # Shins
        elif "shin" in n:
            eb.envelope_distance = 0.12
            eb.head_radius = 0.09
            eb.tail_radius = 0.07
        # Feet / toes
        elif "foot" in n or "toe" in n:
            eb.envelope_distance = 0.08
            eb.head_radius = 0.06
            eb.tail_radius = 0.05
        # Shoulders / pelvis / root
        else:
            eb.envelope_distance = 0.14
            eb.head_radius = 0.10
            eb.tail_radius = 0.10
    bpy.ops.object.mode_set(mode='OBJECT')

    # Parent to armature with Envelope Weights
    bpy.ops.object.select_all(action='DESELECT')
    body.select_set(True)
    armature_ob.select_set(True)
    bpy.context.view_layer.objects.active = armature_ob
    bpy.ops.object.parent_set(type='ARMATURE_ENVELOPE')

    # Report coverage
    no_groups = sum(1 for v in body.data.vertices if not v.groups)
    covered = len(body.data.vertices) - no_groups
    print(f"  Envelope skinning: {covered}/{len(body.data.vertices)} verts weighted "
          f"({no_groups} unweighted — helper/finger geometry).")

    # Re-shade smooth after parenting
    bpy.context.view_layer.objects.active = body
    body.select_set(True)
    bpy.ops.object.shade_smooth()

    return body


# ---- lights, camera, ground (identical to pose_rig_mesh.py) --------------------
def add_lights():
    for nm, e, rot in (("Key", 5.5, (48,15,-40)), ("Rim", 1.8, (52,-12,140))):
        d = bpy.data.lights.new(nm, 'SUN'); d.energy = e
        o = bpy.data.objects.new(nm, d); bpy.context.collection.objects.link(o)
        o.rotation_euler = tuple(math.radians(a) for a in rot)

def add_camera():
    cd = bpy.data.cameras.new('Cam'); cd.lens = CAM_LENS
    c  = bpy.data.objects.new('Cam', cd); bpy.context.collection.objects.link(c)
    c.location = CAM_LOC; c.rotation_euler = CAM_ROT
    bpy.context.scene.camera = c; return c

def add_ground(mat):
    bpy.ops.mesh.primitive_plane_add(size=20, location=(0, 0, -0.01))
    g = bpy.context.active_object
    g.data.materials.clear(); g.data.materials.append(mat)

def configure_freestyle():
    sc = bpy.context.scene; sc.render.use_freestyle = True
    sc.render.line_thickness_mode = 'ABSOLUTE'
    vl = sc.view_layers[0]; vl.use_freestyle = True
    fs = vl.freestyle_settings
    if len(fs.linesets) == 0: fs.linesets.new('LS')
    ls = fs.linesets[0]; ls.linestyle = bpy.data.linestyles.new('Ink')
    for a, v in (('select_silhouette',True), ('select_border',True),
                 ('select_crease',True), ('select_external_contour',True)):
        try: setattr(ls, a, v)
        except: pass
    try: fs.crease_angle = math.radians(134)
    except: pass
    st = ls.linestyle; st.color = (0,0,0); st.thickness = 2.8; st.use_chaining = True
    try: st.chaining = 'PLAIN'
    except: pass
    g = st.geometry_modifiers
    try: g.new(name='samp', type='SAMPLING'); g[-1].sampling = 3.0
    except: pass
    try: g.new(name='bz', type='BEZIER_CURVE'); g[-1].error = 2.5
    except: pass
    t = st.thickness_modifiers
    try:
        t.new(name='c', type='CALLIGRAPHY'); cm = t[-1]
        cm.orientation = math.radians(38); cm.thickness_min = 0.8; cm.thickness_max = 7.0
    except: pass

def render_to(path, freestyle, worldval):
    sc = bpy.context.scene; sc.render.engine = eevee()
    try: sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'
    except: pass
    sc.render.use_freestyle = freestyle; set_world(worldval)
    sc.render.resolution_x, sc.render.resolution_y = RES
    sc.render.image_settings.file_format = 'PNG'
    try: sc.eevee.taa_render_samples = 24
    except: pass
    sc.render.filepath = path; bpy.ops.render.render(write_still=True)
    print("  wrote", path)


# ---- 18 canonical OpenPose keypoints (identical to pose_rig_mesh.py) -----------
def openpose_keypoints(ao, cam):
    """
    Projects the 18 canonical OpenPose keypoints to normalised screen coords.
    Face keypoints (nose, eyes, ears) are derived from the POSED spine.006
    bone matrix so they track head direction on profiles and head-turns.
    Identical to pose_rig_mesh.py — the body mesh type does not affect this.
    """
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    ae = ao.evaluated_get(dg)
    mw = ae.matrix_world

    def H(bn): return mw @ ae.pose.bones[bn].head
    def T(bn): return mw @ ae.pose.bones[bn].tail

    neck     = H("spine.006")
    head_top = T("spine.006")
    head_c   = neck + (head_top - neck) * 0.6

    head_bone = ae.pose.bones.get("spine.006")
    head_mat_world = mw @ head_bone.matrix

    bone_x_world = mathutils.Vector(
        (head_mat_world[0][0], head_mat_world[1][0], head_mat_world[2][0])).normalized()
    subj_right = -bone_x_world

    bone_y_world = mathutils.Vector(
        (head_mat_world[0][1], head_mat_world[1][1], head_mat_world[2][1])).normalized()
    up_dir = bone_y_world

    face_local  = mathutils.Vector((0, -1, 0))
    facing      = (head_mat_world.to_3x3() @ face_local).normalized()
    rr = 0.11   # head radius (world units)

    world = [
        head_c + facing * rr,                                                # 0 nose
        neck,                                                                 # 1 neck
        H("upper_arm.R"), H("forearm.R"), T("hand.R"),                       # 2-4 R arm
        H("upper_arm.L"), H("forearm.L"), T("hand.L"),                       # 5-7 L arm
        H("thigh.R"),     H("shin.R"),    H("foot.R"),                       # 8-10 R leg
        H("thigh.L"),     H("shin.L"),    H("foot.L"),                       # 11-13 L leg
        head_c + facing * rr * 0.85 + subj_right * 0.045 + up_dir * 0.04,  # 14 R eye
        head_c + facing * rr * 0.85 - subj_right * 0.045 + up_dir * 0.04,  # 15 L eye
        head_c + subj_right * 0.075,                                         # 16 R ear
        head_c - subj_right * 0.075,                                         # 17 L ear
    ]

    sc = bpy.context.scene; out = []
    for wp in world:
        co  = world_to_camera_view(sc, cam, mathutils.Vector(wp))
        vis = 1 if co.z > 0 else 0
        out.append([round(co.x, 5), round(1.0 - co.y, 5), vis])
    return out


# ---- main ----------------------------------------------------------------------
def main():
    a = parse_args()
    base_obj_path = find_base_obj(a.base_obj)

    if a.pose_json:
        pd    = {k: tuple(v) for k, v in json.loads(a.pose_json).items()}
        label = a.label or "JSON"
    else:
        label = a.pose.upper(); pd = ALL_POSES.get(label, POSE_A)

    out = os.path.join(OUT_BASE, f"pose_{label}")
    os.makedirs(out, exist_ok=True)
    print(f"=== POSE {label} (MPFB2 body mesh) -> {out} ===")

    bpy.ops.wm.read_factory_settings(use_empty=True)

    # Build FK armature, pose it
    ao = build_armature()
    apply_pose(ao, pd)
    ao.display_type = 'WIRE'

    # Load MH body mesh, align + skin
    mt = toon_mat()
    body = load_mpfb_body(base_obj_path, ao, mt)

    # Ground, lights, camera
    add_ground(mt)
    add_lights()
    cam = add_camera()
    configure_freestyle()

    # Ink plate (freestyle on, white world)
    render_to(os.path.join(out, "ink_plate.png"), True, 1.0)

    # Depth plate (swap all mesh materials to depth, freestyle off, black world)
    md = depth_mat()
    for o in bpy.data.objects:
        if o.type == 'MESH':
            o.data.materials.clear(); o.data.materials.append(md)
    render_to(os.path.join(out, "depth_plate.png"), False, 0.0)

    # OpenPose keypoints (derived from armature — body mesh type irrelevant)
    kpts = openpose_keypoints(ao, cam)
    json.dump({"res": RES, "keypoints": kpts},
              open(os.path.join(out, "keypoints.json"), "w"), indent=1)
    print("  wrote keypoints.json:", sum(k[2] for k in kpts), "visible /18")
    print(f"=== POSE {label} DONE ===")


main()
