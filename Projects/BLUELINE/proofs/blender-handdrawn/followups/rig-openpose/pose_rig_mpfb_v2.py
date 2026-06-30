"""
BLUELINE — Unified Rig + OpenPose, Blender half — MPFB2 BODY MESH edition v2.

v2 CHANGE: Replaces ARMATURE_ENVELOPE skinning (which fuses legs into a skirt)
with Python proximity weighting: each vertex is assigned to the nearest 1-2 bones
by closest-point-on-segment distance in rest space. This gives clean leg/arm
separation because paired bones (thigh.L vs thigh.R) are no longer competing via
overlapping envelopes — each vertex goes to whichever bone is geometrically closest.

For paired left/right bones the algorithm also enforces a side constraint:
  - .L bones only consider verts where the signed world-X > -OVERLAP (X >= -0.02)
  - .R bones only consider verts where the signed world-X < +OVERLAP (X <= +0.02)
This is a belt-and-suspenders guard: for most verts on the left leg thigh.L will
win purely by proximity; the side guard prevents any cross-wiring for verts near
the inner-thigh midline.

Weighting strategy (soft 2-bone blend):
  - For each vertex, find the 2 nearest bones (by closest-point-on-segment dist).
  - Compute w_i = 1 / (d_i + EPS)^2, normalize so sum=1.
  - If second bone weight < MIN_SECONDARY_WEIGHT, assign 100% to nearest only.
This gives rigid-ish results (closest bone dominates) with some blending at joints.

Everything else — armature, poses, camera, materials, openpose_keypoints, render
passes, CLI — is identical to pose_rig_mpfb.py. The only changed function is
load_mpfb_body(); all other functions are reproduced unchanged.

Run:
  blender -b --factory-startup -P pose_rig_mpfb_v2.py -- --pose A
  blender -b --factory-startup -P pose_rig_mpfb_v2.py -- --pose B
  blender -b --factory-startup -P pose_rig_mpfb_v2.py -- --pose C

Outputs: renders/mpfb-body/pose_<X>/  (same paths — overwrites v1 output)
"""
import bpy, bmesh, math, os, sys, json, argparse, mathutils
from bpy_extras.object_utils import world_to_camera_view

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_BASE    = os.path.join(SCRIPT_DIR, "renders", "mpfb-body")

# Default path for the MH base mesh.
DEFAULT_BASE_OBJ = os.path.join(
    os.path.dirname(SCRIPT_DIR),          # followups/
    os.pardir,                             # blender-handdrawn/
    os.pardir,                             # proofs/
    os.pardir,                             # BLUELINE/
    "_tools", "mpfb2-base", "base.obj"    # keep it out of the rig-openpose dir
)
# Development fallback
_SCRATCHPAD_BASE_OBJ = (
    "/private/tmp/claude-501/-Users-loudonstearns-Documents-The-Palace"
    "/8915d379-19a3-450e-bd1e-26011dd89d26/scratchpad"
    "/mpfb2_extracted/makehumancommunity-mpfb2-f47e9a1/src/mpfb/data/3dobjs/base.obj"
)

RES         = (832, 1040)

MPFB_IMPORT_SCALE = 0.11584   # dm → m at rig height
MPFB_LIFT_Z       = 0.9787    # meters to shift mesh up after import

# Proximity weighting constants
WEIGHT_FALLOFF_K      = 2.0   # exponent: w ∝ 1/(d+eps)^k
WEIGHT_EPS            = 1e-5  # avoid div-zero
MIN_SECONDARY_WEIGHT  = 0.05  # below this, collapse to single-bone assignment
SIDE_OVERLAP          = 0.02  # metres — lateral tolerance for .L/.R side guard

# Zone-based bone eligibility: verts in the leg zone (Z < LEG_ZONE_MAX_Z) must
# be claimed by leg bones only (thigh/shin/foot/toe), not by spine/root/pelvis/arm
# bones. This prevents crotch-area verts from being pinned to the torso (which
# caused the lower-body leg-fusion skirt).
#
# Pelvis bones (pelvis.L, pelvis.R) are excluded from the leg zone too:
# they're short structural connectors at the hip; when they claim inner-thigh verts
# and the thigh rotates, those verts don't follow the leg — they stay at the hip.
# Forcing thigh.L/R to claim those verts (they're within ~0.15m of the thigh bone)
# means they deform correctly with the leg sweep.
LEG_ZONE_MAX_Z    = 1.15   # metres — everything below this is "leg territory"
ARM_ZONE_MIN_Z    = 1.35   # metres — everything above this is "arm/torso territory"
# Bones that CANNOT claim verts in the strict leg zone
LEG_ZONE_EXCLUDED = {
    "root", "spine", "spine.001", "spine.002", "spine.003",
    "spine.004", "spine.005", "spine.006",
    "shoulder.L", "shoulder.R",
    "upper_arm.L", "upper_arm.R",
    "forearm.L", "forearm.R",
    "hand.L", "hand.R",
    "pelvis.L", "pelvis.R",   # structural hip connectors — let thigh own the skin
}

# ---- rig definition (identical to pose_rig_mpfb.py) ----------------------------
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

# ---- pose definitions (identical) -----------------------------------------------
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


# ---- armature ------------------------------------------------------------------
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


# ---- inner-thigh mesh surgery --------------------------------------------------
# The MH base mesh in T-pose has inner thighs touching (zero clearance).
# When left/right thigh bones rotate apart, the bridging inner-thigh triangles
# prevent visual separation — the mesh forms a skirt/tent between the legs.
# Solution: seam-rip the mesh at the crotch midline (X≈0, Z < SPLIT_MAX_Z) by
# duplicating the shared edge-loop vertices and separating them slightly.
# This creates a gap along the inner-thigh seam so each leg is a topologically
# independent surface in the deforming zone.

SPLIT_MAX_Z     = 1.10   # metres — seam rip applies below this Z (raised to cover full inner thigh)
SPLIT_X_BAND    = 0.018  # metres — vertices within ±this of X=0 are "midline"
SPLIT_OFFSET    = 0.008  # metres — amount to displace ripped verts off midline


def split_inner_thigh_seam(body):
    """
    Rip the mesh along the inner-thigh midline (X≈0, Z < SPLIT_MAX_Z).

    Method:
    1. Enter Edit mode with bmesh.
    2. Find edges that cross the X=0 plane in the seam zone:
       - Both endpoints have |x| < SPLIT_X_BAND and z < SPLIT_MAX_Z, OR
       - The edge straddles X=0 (one vertex x>0, other x<0) in the zone.
    3. For straddle edges: rip (create a seam) by selecting those edges and
       using bmesh edge-split / vertex-rip to separate the geometry.
    4. After rip, nudge separated verts off X=0 toward their respective sides.

    Simpler equivalent (what we actually do): find all verts near X=0 in the
    leg zone, duplicate each into a .L copy (x → +SPLIT_OFFSET) and a .R copy
    (x → -SPLIT_OFFSET), then reassign all faces to use the copy on their side.
    """
    print("  Splitting inner-thigh seam ...")
    bpy.context.view_layer.objects.active = body
    bpy.ops.object.mode_set(mode='EDIT')

    bm = bmesh.from_edit_mesh(body.data)
    bm.verts.ensure_lookup_table()
    bm.edges.ensure_lookup_table()
    bm.faces.ensure_lookup_table()

    # Identify midline vertices in the seam zone
    midline_verts = {v.index: v for v in bm.verts
                     if v.co.z < SPLIT_MAX_Z and abs(v.co.x) < SPLIT_X_BAND}

    if not midline_verts:
        print("  No midline verts found — skipping seam split.")
        bpy.ops.object.mode_set(mode='OBJECT')
        return

    print(f"  Found {len(midline_verts)} midline verts in seam zone (Z<{SPLIT_MAX_Z}, |x|<{SPLIT_X_BAND})")

    # For each midline vert, determine which side each adjacent face is on
    # Face side = average x of its non-midline verts (or 0 if all midline)
    # We'll use bmesh.utils.face_split or vertex rip via seam edges.
    #
    # Practical approach: find edges that connect a midline vert to a non-midline
    # vert. These are the "seam edges". Rip the midline verts along these edges
    # using bmesh edge-loop selection + rip.
    #
    # Even simpler: for each midline vert, duplicate it. Assign all faces with
    # avg_x > 0 to the +x copy, all faces with avg_x < 0 to the -x copy.
    # Then delete the original vert (it becomes orphaned).

    split_count = 0
    for vi, mv in list(midline_verts.items()):
        co = mv.co.copy()
        if not mv.link_faces:
            continue

        # Separate faces into left (x>0) and right (x<0) groups
        left_faces  = []  # x>0 = .L side
        right_faces = []  # x<0 = .R side

        for f in mv.link_faces:
            # Face centroid x (excluding this vert for the decision)
            other_xs = [v.co.x for v in f.verts if v.index != vi]
            if not other_xs:
                avg_x = 0.0
            else:
                avg_x = sum(other_xs) / len(other_xs)
            if avg_x >= 0:
                left_faces.append(f)
            else:
                right_faces.append(f)

        if not left_faces or not right_faces:
            # All faces on one side — just nudge the vert
            if left_faces:
                mv.co.x = max(mv.co.x, SPLIT_OFFSET * 0.5)
            else:
                mv.co.x = min(mv.co.x, -SPLIT_OFFSET * 0.5)
            continue

        # Duplicate vert for the right side; original goes to left
        new_v = bm.verts.new(co)
        new_v.co.x = -SPLIT_OFFSET   # right side (.R, negative x)
        mv.co.x    =  SPLIT_OFFSET   # left side  (.L, positive x)

        # Reassign right-side faces to use the new vert
        for f in right_faces:
            # Replace mv with new_v in this face
            new_verts = [new_v if v.index == vi else v for v in f.verts]
            # bmesh doesn't support in-place face vert swap easily;
            # use the safe method: delete face, create new face
            mat_idx = f.material_index
            bm.faces.remove(f)
            try:
                nf = bm.faces.new(new_verts)
                nf.material_index = mat_idx
            except Exception:
                pass   # degenerate face — skip

        split_count += 1

    bm.verts.ensure_lookup_table()
    bm.edges.ensure_lookup_table()
    bm.faces.ensure_lookup_table()
    bm.normal_update()
    bmesh.update_edit_mesh(body.data)
    bpy.ops.object.mode_set(mode='OBJECT')
    print(f"  Inner-thigh seam split: {split_count} verts ripped into L/R pairs.")


# ---- proximity weighting -------------------------------------------------------

def _closest_point_on_segment(p, a, b):
    """
    Return the closest point on segment a→b to point p (all mathutils.Vector).
    Uses parametric projection t = dot(p-a, b-a) / |b-a|^2, clamped to [0,1].
    """
    ab = b - a
    ab_len_sq = ab.dot(ab)
    if ab_len_sq < 1e-12:
        return a.copy()
    t = max(0.0, min(1.0, (p - a).dot(ab) / ab_len_sq))
    return a + t * ab


def build_proximity_weights(body, armature_ob):
    """
    Assign vertex groups to body using proximity weighting computed in Python.

    For each mesh vertex (in world/rest space, after transforms applied):
      1. Compute distance to each bone's segment (head→tail in REST pose world space).
      2. Apply side guard: .L bones exclude verts with X < -SIDE_OVERLAP;
                           .R bones exclude verts with X > +SIDE_OVERLAP.
         (X > 0 = subject's left = .L side in MakeHuman/Blender convention)
      3. Among eligible bones, find nearest 2.
      4. Assign weights: w_i = 1/(d_i + EPS)^k, normalized.
         If second-best weight < MIN_SECONDARY_WEIGHT → collapse to single bone.
      5. Write into per-bone vertex groups.

    Then add Armature modifier (no auto/envelope).

    Returns: dict of coverage stats.
    """
    mesh = body.data
    n_verts = len(mesh.vertices)
    print(f"  Proximity weighting {n_verts} vertices to {len(BONES_DEF)} bones ...")

    # Gather bone rest-space head/tail in world coordinates.
    # The armature is at origin with no transform, so world == local == rest.
    # We use BONES_DEF directly (they ARE the rest pose edit-bone positions).
    bones_ws = []  # list of (name, head_V, tail_V, side)
    for name, h, t, _par in BONES_DEF:
        hv = mathutils.Vector(h)
        tv = mathutils.Vector(t)
        # side: 'L' if name ends .L, 'R' if .R, else None
        if name.endswith('.L'):
            side = 'L'
        elif name.endswith('.R'):
            side = 'R'
        else:
            side = None
        bones_ws.append((name, hv, tv, side))

    # Pre-create vertex groups for every deform bone
    vg_map = {}  # bone_name → vertex_group
    for name, _, _, _ in BONES_DEF:
        if name not in body.vertex_groups:
            vg = body.vertex_groups.new(name=name)
        else:
            vg = body.vertex_groups[name]
        vg_map[name] = vg

    # The mesh has had transform_apply() called, so mesh vertex coords are in
    # world space (object transform is identity). We can use co directly.
    # Build vertex coordinate array for speed
    verts_co = [mathutils.Vector(v.co) for v in mesh.vertices]

    # Accumulate weights per vertex: dict[bone_name] = weight
    # We'll build lists per bone for batch assignment
    bone_verts  = {name: [] for name, _, _, _ in BONES_DEF}   # idx → weight
    bone_weights = {name: [] for name, _, _, _ in BONES_DEF}

    zero_weight_count = 0

    for vi, co in enumerate(verts_co):
        vx = co.x  # used for side guard
        vz = co.z  # used for zone filter

        # Zone-based eligibility: verts in the leg zone must use leg bones only.
        # This prevents spine/root/pelvis from pinning inner-thigh verts to the
        # torso, which caused the lower-body to remain fused when legs spread.
        in_leg_zone = vz < LEG_ZONE_MAX_Z

        # Compute distance to each eligible bone segment
        dists = []  # (dist, bone_name)
        for name, hv, tv, side in bones_ws:
            # Zone exclusion: strict leg zone rejects torso/arm bones
            if in_leg_zone and name in LEG_ZONE_EXCLUDED:
                continue

            # Side guard for paired bones
            if side == 'L' and vx < -SIDE_OVERLAP:
                continue  # .L bone ignores verts solidly on the .R side
            if side == 'R' and vx > SIDE_OVERLAP:
                continue  # .R bone ignores verts solidly on the .L side

            cp = _closest_point_on_segment(co, hv, tv)
            d  = (co - cp).length
            dists.append((d, name))

        if not dists:
            # Fallback: no eligible bone (shouldn't happen) — use root
            zero_weight_count += 1
            bone_verts["root"].append(vi)
            bone_weights["root"].append(1.0)
            continue

        # Sort by distance, take nearest 2
        dists.sort(key=lambda x: x[0])
        top = dists[:2]

        if len(top) == 1:
            bone_verts[top[0][1]].append(vi)
            bone_weights[top[0][1]].append(1.0)
        else:
            d0, n0 = top[0]
            d1, n1 = top[1]
            w0 = 1.0 / (d0 + WEIGHT_EPS) ** WEIGHT_FALLOFF_K
            w1 = 1.0 / (d1 + WEIGHT_EPS) ** WEIGHT_FALLOFF_K
            wsum = w0 + w1
            w0n = w0 / wsum
            w1n = w1 / wsum
            if w1n < MIN_SECONDARY_WEIGHT:
                # Collapse to single bone
                bone_verts[n0].append(vi)
                bone_weights[n0].append(1.0)
            else:
                bone_verts[n0].append(vi)
                bone_weights[n0].append(w0n)
                bone_verts[n1].append(vi)
                bone_weights[n1].append(w1n)

    # Batch-assign vertex groups
    total_assignments = 0
    for name, _, _, _ in BONES_DEF:
        vis  = bone_verts[name]
        wgts = bone_weights[name]
        if vis:
            vg_map[name].add(vis, 1.0, 'REPLACE')  # placeholder
            # Set per-vertex weights individually (bpy VG.add sets same weight for all)
            # Use per-vert assignment for accurate weights
            for idx, w in zip(vis, wgts):
                vg_map[name].add([idx], w, 'REPLACE')
            total_assignments += len(vis)

    print(f"  Proximity weighting done: {total_assignments} assignments, "
          f"{zero_weight_count} fallback-to-root verts.")

    # Sanity check: count verts with no group
    unweighted = sum(1 for v in mesh.vertices if not v.groups)
    print(f"  Unweighted verts after proximity pass: {unweighted} / {n_verts}")

    return {
        "n_verts": n_verts,
        "total_assignments": total_assignments,
        "zero_weight_fallbacks": zero_weight_count,
        "unweighted_after": unweighted,
    }


# ---- MPFB2 mesh loading (v2: proximity weighting) ------------------------------
def load_mpfb_body(base_obj_path, armature_ob, mat):
    """
    Import the MakeHuman base mesh, scale/lift to align with FK armature,
    apply toon material, then skin to armature via Python proximity weighting
    (v2 — replaces ARMATURE_ENVELOPE which fused legs into a skirt).
    """
    print(f"  Importing MH base mesh: {base_obj_path}")

    bpy.ops.object.select_all(action='DESELECT')

    bpy.ops.wm.obj_import(
        filepath=base_obj_path,
        global_scale=MPFB_IMPORT_SCALE,
        forward_axis='NEGATIVE_Z',
        up_axis='Y',
        use_split_objects=False,
        use_split_groups=False,
        import_vertex_groups=False,
        validate_meshes=True,
    )

    body = bpy.context.active_object
    if body is None or body.type != 'MESH':
        body = next((o for o in bpy.context.selected_objects if o.type == 'MESH'), None)
    if body is None:
        raise RuntimeError("OBJ import failed — no mesh object created.")

    body.name = "MPFBBody"
    print(f"  Imported: {body.name} ({len(body.data.vertices)} vertices)")

    # Bounding box before lift
    bb = [body.matrix_world @ mathutils.Vector(v) for v in body.bound_box]
    zmin = min(v.z for v in bb)
    zmax = max(v.z for v in bb)
    print(f"  BB Z: {zmin:.4f} to {zmax:.4f} (before lift)")

    # Lift mesh so feet land at Z≈0
    body.location.z += MPFB_LIFT_Z
    # Apply transforms so vertex coords are in world/rest space
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    # Verify after lift
    bpy.context.view_layer.update()
    bb2 = [body.matrix_world @ mathutils.Vector(v) for v in body.bound_box]
    zmin2 = min(v.z for v in bb2)
    zmax2 = max(v.z for v in bb2)
    print(f"  BB Z after lift: {zmin2:.4f} to {zmax2:.4f} (target: 0.0 to ~1.96)")

    # Material
    body.data.materials.clear()
    body.data.materials.append(mat)
    bpy.ops.object.shade_smooth()

    # --- v2: mesh surgery + proximity weighting in Python ---
    # Step 1: Split the inner-thigh seam so left/right legs are topologically
    # independent. Without this, bridging triangles at X≈0 form a "skirt" when
    # the thighs spread. Must be done BEFORE weighting so new verts get assigned.
    split_inner_thigh_seam(body)

    # Step 2: Proximity weighting in Python.
    # Do this BEFORE parenting (no Armature modifier yet) so vertex group
    # assignments are clean and we control exactly which bone gets which vert.
    stats = build_proximity_weights(body, armature_ob)

    # Parent to armature WITHOUT auto/envelope — use 'ARMATURE_NAME' which
    # creates an Armature modifier and uses existing vertex groups.
    bpy.ops.object.select_all(action='DESELECT')
    body.select_set(True)
    armature_ob.select_set(True)
    bpy.context.view_layer.objects.active = armature_ob
    bpy.ops.object.parent_set(type='ARMATURE_NAME')

    # Re-shade smooth
    bpy.context.view_layer.objects.active = body
    body.select_set(True)
    bpy.ops.object.shade_smooth()

    print(f"  v2 skinning complete. Vertex groups: {len(body.vertex_groups)}")
    return body


# ---- lights, camera, ground (identical to pose_rig_mpfb.py) --------------------
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


# ---- 18 canonical OpenPose keypoints (identical) --------------------------------
def openpose_keypoints(ao, cam):
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
    rr = 0.11

    world = [
        head_c + facing * rr,
        neck,
        H("upper_arm.R"), H("forearm.R"), T("hand.R"),
        H("upper_arm.L"), H("forearm.L"), T("hand.L"),
        H("thigh.R"),     H("shin.R"),    H("foot.R"),
        H("thigh.L"),     H("shin.L"),    H("foot.L"),
        head_c + facing * rr * 0.85 + subj_right * 0.045 + up_dir * 0.04,
        head_c + facing * rr * 0.85 - subj_right * 0.045 + up_dir * 0.04,
        head_c + subj_right * 0.075,
        head_c - subj_right * 0.075,
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
    print(f"=== POSE {label} (MPFB2 body mesh v2 — proximity weighting) -> {out} ===")

    bpy.ops.wm.read_factory_settings(use_empty=True)

    ao = build_armature()
    apply_pose(ao, pd)
    ao.display_type = 'WIRE'

    mt = toon_mat()
    body = load_mpfb_body(base_obj_path, ao, mt)

    add_ground(mt)
    add_lights()
    cam = add_camera()
    configure_freestyle()

    render_to(os.path.join(out, "ink_plate.png"), True, 1.0)

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
