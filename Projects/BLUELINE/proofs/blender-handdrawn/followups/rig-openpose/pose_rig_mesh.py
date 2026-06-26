"""
BLUELINE — Unified Rig + OpenPose, Blender half — MANNEQUIN MESH edition.
Replaces the capsule (cylinder+sphere) skin of pose_rig.py with a proper
articulated wooden-artist's-mannequin mesh:
  * Tapered, beveled limb segments (icosphere-based ellipsoids, slightly
    tapered toward joints so they read as limb sticks, not raw cylinders)
  * Torso built as a flattened chest block + pelvis wedge
  * Egg-shaped head with a clear NOSE NUB (face-forward indicator) built
    from a UV-sphere + a small sphere merged/parented in front
  * Each mesh part is parented to its controlling bone via Armature modifier
    (whole-body automatic weights) so apply_pose() deforms it correctly

Head-bone-derived facing:
  The openpose_keypoints() function derives the nose/eyes/ears offsets from
  the ACTUAL posed spine.006 bone matrix — not from a world-space constant.
  This means the face keypoints track correctly on profile angles and head
  turns instead of always assuming -Y facing.

Same CLI, camera, output format as pose_rig.py — draw_openpose.py and
redraw_test.py work unchanged.

Run: blender -b --factory-startup -P pose_rig_mesh.py -- --pose A
     blender -b --factory-startup -P pose_rig_mesh.py -- --pose B
     blender -b --factory-startup -P pose_rig_mesh.py -- --pose C
Outputs (renders/pose_<X>/): ink_plate.png, depth_plate.png, keypoints.json
"""
import bpy, bmesh, math, os, sys, json, argparse, mathutils
from bpy_extras.object_utils import world_to_camera_view

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_BASE    = os.path.join(SCRIPT_DIR, "renders")
RES         = (832, 1040)

# ---- rig definition (identical to pose_rig.py — same Rigify bone names) -------
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

# ---- pose definitions (identical to pose_rig.py) --------------------------------
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

# camera (identical to pose_rig.py)
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
    return p.parse_args(argv)

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

# ---- armature ------------------------------------------------------------------
def build_armature():
    ad = bpy.data.armatures.new("Skel")
    ao = bpy.data.objects.new("Armature", ad)
    bpy.context.collection.objects.link(ao)
    bpy.context.view_layer.objects.active = ao; ao.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    ebs = ad.edit_bones; bm = {}
    for n,h,t,par in BONES_DEF:
        eb = ebs.new(n); eb.head = h; eb.tail = t; eb.roll = 0; eb.use_connect = False; bm[n] = eb
    for n,h,t,par in BONES_DEF:
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

# ---- mannequin mesh building ---------------------------------------------------

def make_limb_segment(name, head_world, tail_world, radius_head, radius_tail, segs=8):
    """
    Build a tapered cylinder (mannequin limb stick) in world space, aligned
    between head_world and tail_world.  radius_head > radius_tail for joint-
    ball taper (or equal for forearms / shins).
    Returns the mesh object (location at origin, rotation applied).
    """
    hw = mathutils.Vector(head_world)
    tw = mathutils.Vector(tail_world)
    axis = tw - hw
    L = axis.length
    if L < 0.005:
        return None
    mid = (hw + tw) * 0.5

    # Build the mesh with bmesh: tapered cylinder, capped
    me = bpy.data.meshes.new(name + "_me")
    bm = bmesh.new()
    # top ring (at +L/2 along local Z) = tail = narrower
    # bottom ring (at -L/2 along local Z) = head = wider
    for i in range(segs):
        angle = 2 * math.pi * i / segs
        c, s = math.cos(angle), math.sin(angle)
        bm.verts.new((c * radius_tail, s * radius_tail,  L * 0.5))
        bm.verts.new((c * radius_head, s * radius_head, -L * 0.5))
    bm.verts.ensure_lookup_table()
    # side quads
    for i in range(segs):
        i0 = i * 2;     i1 = i * 2 + 1
        i2 = ((i+1) % segs) * 2; i3 = ((i+1) % segs) * 2 + 1
        bm.faces.new([bm.verts[i0], bm.verts[i2], bm.verts[i3], bm.verts[i1]])
    # end caps
    top  = [bm.verts[i*2]     for i in range(segs)]
    bot  = [bm.verts[i*2 + 1] for i in range(segs)]
    bm.faces.new(top)
    bm.faces.new(list(reversed(bot)))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me); bm.free()
    me.update()

    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)

    # orient: local Z -> bone axis
    rot_q = mathutils.Vector((0, 0, 1)).rotation_difference(axis.normalized())
    ob.rotation_euler = rot_q.to_euler()
    ob.location = mid

    bpy.context.view_layer.objects.active = ob; ob.select_set(True)
    bpy.ops.object.shade_smooth()
    ob.select_set(False)
    return ob


def make_ball(name, loc_world, radius):
    """Small UV-sphere for joints."""
    bpy.ops.mesh.primitive_uv_sphere_add(
        radius=radius, location=loc_world,
        segments=12, ring_count=8)
    ob = bpy.context.active_object
    ob.name = name
    bpy.ops.object.shade_smooth()
    ob.select_set(False)
    return ob


def make_box(name, loc_world, sx, sy, sz):
    """Axis-aligned box primitive — used for torso blocks."""
    me = bpy.data.meshes.new(name + "_me")
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    # scale verts
    for v in bm.verts:
        v.co.x *= sx; v.co.y *= sy; v.co.z *= sz
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me); bm.free()
    me.update()
    ob = bpy.data.objects.new(name, me)
    ob.location = loc_world
    bpy.context.collection.objects.link(ob)
    bpy.context.view_layer.objects.active = ob; ob.select_set(True)
    bpy.ops.object.shade_smooth()
    ob.select_set(False)
    return ob


def make_head_egg(name, center_world, radius, facing_dir, up_dir):
    """
    Egg-shaped head (slightly elongated UV sphere) with a NOSE NUB on the
    front face.  facing_dir points out of the face (subject's -Y in rest pose).
    The nose nub is a small sphere offset in front — unambiguous in silhouette.
    Returns a list of [head_body_ob, nose_ob].
    """
    cx, cy, cz = center_world

    # Main head: slightly tall UV sphere
    bpy.ops.mesh.primitive_uv_sphere_add(
        radius=radius, location=(cx, cy, cz),
        segments=16, ring_count=12)
    head_ob = bpy.context.active_object; head_ob.name = name
    # Elongate vertically (taller than wide = egg shape)
    head_ob.scale = (0.88, 0.82, 1.08)
    bpy.ops.object.transform_apply(scale=True)
    bpy.ops.object.shade_smooth()
    head_ob.select_set(False)

    # Nose nub: sphere sitting proud of the face
    fn = mathutils.Vector(facing_dir).normalized()
    nose_offset = fn * radius * 0.82   # just in front of head surface
    nose_center = mathutils.Vector((cx, cy, cz)) + nose_offset
    bpy.ops.mesh.primitive_uv_sphere_add(
        radius=radius * 0.22,
        location=(nose_center.x, nose_center.y, nose_center.z),
        segments=10, ring_count=8)
    nose_ob = bpy.context.active_object; nose_ob.name = name + "_nose"
    bpy.ops.object.shade_smooth()
    nose_ob.select_set(False)

    # Brow ridge: small ellipsoid above nose, reinforces facing
    brow_offset = fn * radius * 0.76 + mathutils.Vector(up_dir).normalized() * radius * 0.28
    brow_center = mathutils.Vector((cx, cy, cz)) + brow_offset
    bpy.ops.mesh.primitive_uv_sphere_add(
        radius=radius * 0.14,
        location=(brow_center.x, brow_center.y, brow_center.z),
        segments=10, ring_count=6)
    brow_ob = bpy.context.active_object; brow_ob.name = name + "_brow"
    brow_ob.scale = (1.8, 0.9, 0.55)
    bpy.ops.object.transform_apply(scale=True)
    bpy.ops.object.shade_smooth()
    brow_ob.select_set(False)

    return [head_ob, nose_ob, brow_ob]


def build_mannequin_mesh(ao, mat):
    """
    Build the full mannequin mesh from evaluated (posed) bone matrices.
    Each part is a separate mesh object; they are all joined into a single
    object and parented to the armature with Automatic Weights so the rig
    deforms the combined mesh.
    """
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    ae = ao.evaluated_get(dg)
    mw = ae.matrix_world

    def H(bn):  # world-space bone head
        return mw @ ae.pose.bones[bn].head if bn in ae.pose.bones else None
    def T(bn):  # world-space bone tail
        return mw @ ae.pose.bones[bn].tail if bn in ae.pose.bones else None

    all_obs = []

    # ---- limb segments (tapered: slightly wider at proximal joint) -----------
    # Each entry: (bone_name, radius_head_prox, radius_tail_distal)
    LIMBS = [
        # spine chain: wide at lumbar, narrowing to neck
        ("spine",     0.130, 0.120),
        ("spine.001", 0.120, 0.115),
        ("spine.002", 0.115, 0.110),
        ("spine.003", 0.110, 0.105),
        ("spine.004", 0.085, 0.078),
        ("spine.005", 0.078, 0.070),
        # upper arms: slightly tapered toward elbow
        ("upper_arm.L", 0.072, 0.058),
        ("upper_arm.R", 0.072, 0.058),
        # forearms: taper toward wrist
        ("forearm.L",   0.055, 0.040),
        ("forearm.R",   0.055, 0.040),
        # hands: flat paddle
        ("hand.L",  0.040, 0.032),
        ("hand.R",  0.040, 0.032),
        # thighs: taper toward knee
        ("thigh.L", 0.092, 0.072),
        ("thigh.R", 0.092, 0.072),
        # shins: taper toward ankle
        ("shin.L",  0.068, 0.048),
        ("shin.R",  0.068, 0.048),
        # feet: horizontal, flat block
        ("foot.L",  0.040, 0.032),
        ("foot.R",  0.040, 0.032),
    ]

    for bn, r_head, r_tail in LIMBS:
        if H(bn) is None or T(bn) is None: continue
        ob = make_limb_segment(bn, H(bn), T(bn), r_head, r_tail)
        if ob: all_obs.append(ob)

    # ---- joint balls ---------------------------------------------------------
    JOINTS = [
        # shoulder balls
        ("jball_sho_L",  "upper_arm.L", 0.065),
        ("jball_sho_R",  "upper_arm.R", 0.065),
        # elbow balls
        ("jball_elb_L",  "forearm.L",   0.050),
        ("jball_elb_R",  "forearm.R",   0.050),
        # wrist balls
        ("jball_wri_L",  "hand.L",      0.038),
        ("jball_wri_R",  "hand.R",      0.038),
        # hip balls
        ("jball_hip_L",  "thigh.L",     0.078),
        ("jball_hip_R",  "thigh.R",     0.078),
        # knee balls
        ("jball_kne_L",  "shin.L",      0.060),
        ("jball_kne_R",  "shin.R",      0.060),
        # ankle balls
        ("jball_ank_L",  "foot.L",      0.042),
        ("jball_ank_R",  "foot.R",      0.042),
        # neck ball (top of spine.005)
        ("jball_neck",   "spine.006",   0.058),
    ]
    for jname, bn, r in JOINTS:
        loc = H(bn)
        if loc: all_obs.append(make_ball(jname, loc, r))

    # ---- chest block (spine.002 to spine.003 region) -------------------------
    # Chest is a flattened box sitting between spine.002 and spine.003
    c2_h = H("spine.002"); c3_t = T("spine.003")
    if c2_h and c3_t:
        chest_center = (c2_h + c3_t) * 0.5
        # Orient the box to the spine axis
        spine_axis = (c3_t - c2_h).normalized()
        spine_len  = (c3_t - c2_h).length
        chest_ob = make_box("chest_block",
                            (chest_center.x, chest_center.y, chest_center.z),
                            0.26, 0.13, spine_len * 1.05)
        # Rotate box to match spine
        rot_q = mathutils.Vector((0,0,1)).rotation_difference(spine_axis)
        chest_ob.rotation_euler = rot_q.to_euler()
        all_obs.append(chest_ob)

    # ---- pelvis wedge --------------------------------------------------------
    # Pelvis: squat box around the root / pelvis.L / pelvis.R region
    root_h = H("root"); root_t = T("root")
    if root_h and root_t:
        pelvis_center = (root_h + root_t) * 0.5
        pelvis_ob = make_box("pelvis_block",
                             (pelvis_center.x, pelvis_center.y, pelvis_center.z),
                             0.24, 0.12, 0.10)
        all_obs.append(pelvis_ob)

    # ---- EGG HEAD with NOSE NUB --------------------------------------------
    head_bone = ae.pose.bones.get("spine.006")
    if head_bone:
        # Get the world-space head matrix to extract true facing
        head_mat_world = mw @ head_bone.matrix
        # In Blender bone convention, Y axis points along the bone (head→tail)
        # so the bone's world Y = up-along-neck direction.
        # Subject's facing (nose direction) in rest pose is -Y world.
        # After posing, we read it from the bone matrix's -Y column:
        bone_y_world = mathutils.Vector(
            (head_mat_world[0][1], head_mat_world[1][1], head_mat_world[2][1])
        )  # bone local Y in world space
        bone_z_world = mathutils.Vector(
            (head_mat_world[0][2], head_mat_world[1][2], head_mat_world[2][2])
        )  # bone local Z (roughly world Z / up in rest)

        # Head center: partway up the spine.006 bone
        neck_w = mw @ head_bone.head
        top_w  = mw @ head_bone.tail
        head_center = neck_w + (top_w - neck_w) * 0.55

        # face direction: in T-pose the subject faces -Y world.
        # The bone's local X axis cross product gives us a stable facing:
        # bone +X = subject's left → subject's facing = bone_y × bone_x cross.
        # Simpler: the face normal in bone-local space is (0,-1,0) (rest facing -Y)
        # transformed to world by the head bone matrix.
        face_local = mathutils.Vector((0, -1, 0))
        face_world_dir = head_mat_world.to_3x3() @ face_local

        head_obs = make_head_egg(
            "mannequin_head",
            (head_center.x, head_center.y, head_center.z),
            radius=0.118,
            facing_dir=face_world_dir,
            up_dir=bone_z_world,
        )
        all_obs.extend(head_obs)

    # ---- assign material to all parts ----------------------------------------
    for ob in all_obs:
        ob.data.materials.clear()
        ob.data.materials.append(mat)

    # ---- join all parts into one mesh ----------------------------------------
    # Deselect everything, then select all mannequin pieces
    bpy.ops.object.select_all(action='DESELECT')
    for ob in all_obs:
        ob.select_set(True)
    if not all_obs:
        return

    bpy.context.view_layer.objects.active = all_obs[0]
    bpy.ops.object.join()
    mannequin = bpy.context.active_object
    mannequin.name = "Mannequin"

    # ---- parent to armature with Automatic Weights ---------------------------
    # Reset the mannequin to object mode; select armature last (it becomes active)
    bpy.ops.object.select_all(action='DESELECT')
    mannequin.select_set(True)
    ao.select_set(True)
    bpy.context.view_layer.objects.active = ao
    bpy.ops.object.parent_set(type='ARMATURE_AUTO')

    # Shade smooth after parenting
    bpy.context.view_layer.objects.active = mannequin
    bpy.ops.object.shade_smooth()

    return mannequin


def add_lights():
    for nm, e, rot in (("Key",5.5,(48,15,-40)),("Rim",1.8,(52,-12,140))):
        d = bpy.data.lights.new(nm,'SUN'); d.energy = e
        o = bpy.data.objects.new(nm, d); bpy.context.collection.objects.link(o)
        o.rotation_euler = tuple(math.radians(a) for a in rot)

def add_camera():
    cd = bpy.data.cameras.new('Cam'); cd.lens = CAM_LENS
    c  = bpy.data.objects.new('Cam', cd); bpy.context.collection.objects.link(c)
    c.location = CAM_LOC; c.rotation_euler = CAM_ROT
    bpy.context.scene.camera = c; return c

def add_ground(mat):
    bpy.ops.mesh.primitive_plane_add(size=20, location=(0,0,-0.01))
    g = bpy.context.active_object
    g.data.materials.clear(); g.data.materials.append(mat)

def configure_freestyle():
    sc = bpy.context.scene; sc.render.use_freestyle = True
    sc.render.line_thickness_mode = 'ABSOLUTE'
    vl = sc.view_layers[0]; vl.use_freestyle = True
    fs = vl.freestyle_settings
    if len(fs.linesets) == 0: fs.linesets.new('LS')
    ls = fs.linesets[0]; ls.linestyle = bpy.data.linestyles.new('Ink')
    for a, v in (('select_silhouette',True),('select_border',True),
                 ('select_crease',True),('select_external_contour',True)):
        try: setattr(ls, a, v)
        except: pass
    try: fs.crease_angle = math.radians(134)
    except: pass
    st = ls.linestyle; st.color = (0,0,0); st.thickness = 2.8; st.use_chaining = True
    try: st.chaining = 'PLAIN'
    except: pass
    g = st.geometry_modifiers
    try: g.new(name='samp',type='SAMPLING'); g[-1].sampling = 3.0
    except: pass
    try: g.new(name='bz',type='BEZIER_CURVE'); g[-1].error = 2.5
    except: pass
    t = st.thickness_modifiers
    try:
        t.new(name='c',type='CALLIGRAPHY'); cm = t[-1]
        cm.orientation = math.radians(38); cm.thickness_min = 0.8; cm.thickness_max = 7.0
    except: pass

def render_to(path, freestyle, worldval):
    sc = bpy.context.scene; sc.render.engine = eevee()
    try: sc.view_settings.view_transform='Standard'; sc.view_settings.look='None'
    except: pass
    sc.render.use_freestyle = freestyle; set_world(worldval)
    sc.render.resolution_x, sc.render.resolution_y = RES
    sc.render.image_settings.file_format = 'PNG'
    try: sc.eevee.taa_render_samples = 24
    except: pass
    sc.render.filepath = path; bpy.ops.render.render(write_still=True)
    print("  wrote", path)


# ---- 18 canonical OpenPose keypoints, face derived from head bone matrix ------
def openpose_keypoints(ao, cam):
    """
    Projects the 18 canonical OpenPose keypoints to normalised screen coords.
    KEY IMPROVEMENT over pose_rig.py: nose, eyes, and ears are derived from
    the POSED spine.006 bone matrix — so they track the actual head direction
    on profiles and head-turns, not just straight-on -Y.
    """
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    ae = ao.evaluated_get(dg)
    mw = ae.matrix_world

    def H(bn): return mw @ ae.pose.bones[bn].head
    def T(bn): return mw @ ae.pose.bones[bn].tail

    neck     = H("spine.006")
    head_top = T("spine.006")
    head_c   = neck + (head_top - neck) * 0.6   # head centre

    # ---- derive face directions from the POSED spine.006 bone matrix ---------
    head_bone = ae.pose.bones.get("spine.006")
    head_mat_world = mw @ head_bone.matrix

    # Bone local axes in world space:
    #   mat column 0 = bone local X  (subject's LEFT in rest T-pose)
    #   mat column 1 = bone local Y  (bone axis, head→tail = up in rest)
    #   mat column 2 = bone local Z  (world forward / "into screen" in rest)
    bone_x_world = mathutils.Vector(
        (head_mat_world[0][0], head_mat_world[1][0], head_mat_world[2][0])).normalized()
    # Subject's left = +bone_X → subject's right = -bone_X
    subj_right = -bone_x_world

    bone_y_world = mathutils.Vector(
        (head_mat_world[0][1], head_mat_world[1][1], head_mat_world[2][1])).normalized()
    # In rest pose bone Y points up; after posing it tilts with the head.
    up_dir = bone_y_world

    # Face direction (nose out): rest-pose local (0,-1,0) → world
    # Note: in Blender "front" is -Y local (subject faces -Y world at rest).
    face_local = mathutils.Vector((0, -1, 0))
    facing = (head_mat_world.to_3x3() @ face_local).normalized()

    rr = 0.11   # head radius (world units)

    world = [
        # 0  nose: offset in facing direction from head centre
        head_c + facing * rr,
        # 1  neck
        neck,
        # 2-4 R shoulder, elbow, wrist
        H("upper_arm.R"), H("forearm.R"), T("hand.R"),
        # 5-7 L shoulder, elbow, wrist
        H("upper_arm.L"), H("forearm.L"), T("hand.L"),
        # 8-10 R hip, knee, ankle
        H("thigh.R"), H("shin.R"), H("foot.R"),
        # 11-13 L hip, knee, ankle
        H("thigh.L"), H("shin.L"), H("foot.L"),
        # 14 R eye — forward+right+up
        head_c + facing * rr * 0.85 + subj_right * 0.045 + up_dir * 0.04,
        # 15 L eye
        head_c + facing * rr * 0.85 - subj_right * 0.045 + up_dir * 0.04,
        # 16 R ear — pure right side of head
        head_c + subj_right * 0.075,
        # 17 L ear
        head_c - subj_right * 0.075,
    ]

    sc = bpy.context.scene; out = []
    for wp in world:
        co  = world_to_camera_view(sc, cam, mathutils.Vector(wp))
        vis = 1 if co.z > 0 else 0
        out.append([round(co.x, 5), round(1.0 - co.y, 5), vis])  # flip y to image-top
    return out


def main():
    a = parse_args()
    if a.pose_json:
        pd    = {k: tuple(v) for k, v in json.loads(a.pose_json).items()}
        label = a.label or "JSON"
    else:
        label = a.pose.upper(); pd = ALL_POSES.get(label, POSE_A)

    out = os.path.join(OUT_BASE, f"pose_{label}")
    os.makedirs(out, exist_ok=True)
    print(f"=== POSE {label} (mannequin mesh) -> {out} ===")

    bpy.ops.wm.read_factory_settings(use_empty=True)

    ao = build_armature()
    apply_pose(ao, pd)
    ao.display_type = 'WIRE'

    mt  = toon_mat()
    build_mannequin_mesh(ao, mt)
    add_ground(mt)
    add_lights()
    cam = add_camera()
    configure_freestyle()

    # Ink plate
    render_to(os.path.join(out, "ink_plate.png"), True, 1.0)

    # Depth plate: swap materials, freestyle off
    md = depth_mat()
    for o in bpy.data.objects:
        if o.type == 'MESH':
            o.data.materials.clear(); o.data.materials.append(md)
    render_to(os.path.join(out, "depth_plate.png"), False, 0.0)

    kpts = openpose_keypoints(ao, cam)
    json.dump({"res": RES, "keypoints": kpts},
              open(os.path.join(out, "keypoints.json"), "w"), indent=1)
    print("  wrote keypoints.json:", sum(k[2] for k in kpts), "visible /18")
    print(f"=== POSE {label} DONE ===")


main()
