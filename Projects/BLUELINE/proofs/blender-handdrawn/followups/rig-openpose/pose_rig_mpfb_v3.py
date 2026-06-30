"""
BLUELINE — Figure Rig, Blender half — MPFB2 NATIVE PIPELINE edition (v3).

THE REBUILD (2026-06-30). v1/v2 force-fit MakeHuman's CC0 base.obj onto a hand-built
FK rig (BONES_DEF) and skinned it with envelope (v1) or a Python proximity-weight +
inner-thigh-seam-split hack (v2). That masked-but-never-fixed the core defect: the
skeleton did not line up with the skin, the legs fused into a skirt, and there was no
real bind. v3 stops force-fitting. It generates the mesh AND its matched skeleton
TOGETHER with MPFB2's own pipeline:

  HumanService.create_human(macro_detail_dict)         # parametric body (gender/age/...)
  HumanService.add_builtin_rig(bm,"default",            # MPFB's own 163-bone rig,
                               import_weights=True)      # with its OWN imported weights

This gives a clean weighted ARMATURE deform (legs stay separated under pose — verified
4.2cm gap in a hard stride) and parametric variation for free: male/female/young/old
are a one-line edit to the macro dict, exposed here as CLI flags.

WHAT IS KEPT (the proven seam): the 18-canonical-OpenPose projection (drawn downstream
by draw_openpose.py with the real comfyui_controlnet_aux draw_bodypose), the keypoints.json
format, the shared camera, Freestyle ink, the depth material, and the D2 redraw recipe.
Only the body+skeleton SOURCE changed — and the OpenPose keypoints are now read from the
MPFB rig's own bone heads/tails via a name map (OPENPOSE_BONE_MAP).

Requires MPFB2 (v2.0.17, blender_version_min 4.2.0) installed as a Blender extension at
  ~/Library/Application Support/Blender/<ver>/extensions/user_default/mpfb
Verified on Blender 5.1.2 / Mac MPS, 2026-06-30.

GOTCHA: do NOT pass --factory-startup (it disables the MPFB addon). Run:
  blender -b -P pose_rig_mpfb_v3.py -- --pose B --gender 0.0 --age 0.25 --label B_male
  blender -b -P pose_rig_mpfb_v3.py -- --pose B --gender 1.0 --age 0.25 --label B_female

Outputs: renders/mpfb-v3/pose_<label>/{ink_plate,depth_plate}.png + keypoints.json
"""
import bpy, math, os, sys, json, argparse, mathutils

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_BASE   = os.path.join(SCRIPT_DIR, "renders", "mpfb-v3")
RES        = (832, 1040)

MPFB_MODULE = "bl_ext.user_default.mpfb"

# ---- camera (shared by all three plates) ----------------------------------------
# Look-at framing tuned for MPFB's ~1.66m default body (v2's fixed-rotation camera
# was set for a 1.96m figure and left the subject small/high in frame — a larger
# subject conditions the gen-AI redraw better). Aims at mid-body; all three plates
# share this exact camera so ink/depth/openpose register.
CAM_LOC    = (1.45, -2.75, 1.05)
CAM_TARGET = (0.0, 0.0, 0.92)
CAM_LENS   = 40

# ---- OpenPose keypoint → MPFB default-rig bone map ------------------------------
# 18 canonical OpenPose keypoints. Index order IS the controlnet_aux limbSeq order:
#   0 nose, 1 neck, 2 RShoulder, 3 RElbow, 4 RWrist, 5 LShoulder, 6 LElbow, 7 LWrist,
#   8 RHip, 9 RKnee, 10 RAnkle, 11 LHip, 12 LKnee, 13 LAnkle, 14 REye, 15 LEye,
#   16 REar, 17 LEar.  (R = subject's right = world -X in MakeHuman convention.)
# Each entry: (bone_name, "head"|"tail"). nose + eyes/ears are derived from the head
# bone's posed frame below, not from this map.
OPENPOSE_BONE_MAP = {
    1:  ("neck01",     "head"),
    2:  ("upperarm01.R", "head"),
    3:  ("lowerarm01.R", "head"),
    4:  ("wrist.R",    "head"),
    5:  ("upperarm01.L", "head"),
    6:  ("lowerarm01.L", "head"),
    7:  ("wrist.L",    "head"),
    8:  ("upperleg01.R", "head"),
    9:  ("lowerleg01.R", "head"),
    10: ("foot.R",     "head"),
    11: ("upperleg01.L", "head"),
    12: ("lowerleg01.L", "head"),
    13: ("foot.L",     "head"),
}

# ---- pose definitions (local XYZ-Euler degrees on MPFB default-rig bones) --------
# Verified convention on this rig: upperleg/lowerleg local-X = sagittal swing
# (negative = forward), local-Z = abduction (spread). Arms local-Z swings the arm
# up/down from the T-rest. Kept deliberately simple; legs are the load-bearing proof.
POSE_A = {  # action crouch — weight forward, knees bent, both arms raised
    "spine03": (8, 0, 0), "spine02": (6, 0, 0),
    "upperleg01.L": (-48, 0, 9),  "lowerleg01.L": (72, 0, 0), "foot.L": (-18, 0, 0),
    "upperleg01.R": (-18, 0, -9), "lowerleg01.R": (42, 0, 0), "foot.R": (-12, 0, 0),
    "upperarm01.L": (0, 0, -95), "lowerarm01.L": (-35, 0, 0),
    "upperarm01.R": (0, 0, 95),  "lowerarm01.R": (-35, 0, 0),
}
POSE_B = {  # walking stride — legs split sagittally + slight abduction
    "upperleg01.L": (-35, 0, 8),  "lowerleg01.L": (20, 0, 0), "foot.L": (-10, 0, 0),
    "upperleg01.R": (35, 0, -8),  "lowerleg01.R": (12, 0, 0), "foot.R": (-8, 0, 0),
    "upperarm01.L": (0, 0, -28), "lowerarm01.L": (-20, 0, 0),
    "upperarm01.R": (0, 0, 22),  "lowerarm01.R": (-12, 0, 0),
}
POSE_C = {  # standing, thighs spread, arms out — clean separated-leg reference
    "upperleg01.L": (0, 0, 14), "upperleg01.R": (0, 0, -14),
    "foot.L": (-6, 0, 0), "foot.R": (-6, 0, 0),
    "upperarm01.L": (0, 0, -55), "upperarm01.R": (0, 0, 55),
}
ALL_POSES = {"A": POSE_A, "B": POSE_B, "C": POSE_C}


# ---- args -----------------------------------------------------------------------
def parse_args():
    argv = sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--pose", default="B")
    p.add_argument("--pose-json", default=None, help='{"upperleg01.L":[-35,0,8],...}')
    p.add_argument("--label", default=None)
    # parametric body (macro detail) — male/female/young/old come from here
    p.add_argument("--gender", type=float, default=0.5)  # 0=male 1=female
    p.add_argument("--age",    type=float, default=0.5)  # 0=baby .25=young 1=old
    p.add_argument("--muscle", type=float, default=0.5)
    p.add_argument("--weight", type=float, default=0.5)
    p.add_argument("--height", type=float, default=0.55)
    return p.parse_args(argv)


# ---- MPFB native human + rig ----------------------------------------------------
def enable_mpfb():
    import addon_utils
    addon_utils.enable(MPFB_MODULE, default_set=True, persistent=True)

def clear_scene():
    # Do NOT use --factory-startup / read_factory_settings — that disables MPFB.
    # Remove every object from the default scene instead.
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for coll in (bpy.data.meshes, bpy.data.armatures, bpy.data.materials):
        for blk in list(coll):
            if blk.users == 0:
                coll.remove(blk)

def make_human(a):
    from bl_ext.user_default.mpfb.services.humanservice import HumanService
    macro = {
        "gender": a.gender, "age": a.age, "muscle": a.muscle, "weight": a.weight,
        "proportions": 0.5, "height": a.height, "cupsize": 0.5, "firmness": 0.5,
        "race": {"asian": 0.33, "caucasian": 0.34, "african": 0.33},
    }
    bm = HumanService.create_human(macro_detail_dict=macro)
    arm = HumanService.add_builtin_rig(bm, "default", import_weights=True)
    bpy.context.view_layer.update()
    print(f"  human: {len(bm.data.vertices)} verts | rig: {len(arm.data.bones)} bones "
          f"| gender={a.gender} age={a.age}")
    return bm, arm


# ---- posing (local Euler) -------------------------------------------------------
def capture_head_frame(arm):
    """Capture the head bone's REST world frame, and the bone-LOCAL directions that
    point world-forward(-Y) / up(+Z) / subject-right(-X) at rest. After posing,
    facing = posed_head_matrix @ face_local — so the face tracks head turns."""
    bpy.context.view_layer.update()
    rest = (arm.matrix_world @ arm.pose.bones["head"].matrix).to_3x3()
    inv = rest.inverted()
    return {
        "face":  inv @ mathutils.Vector((0, -1, 0)),
        "up":    inv @ mathutils.Vector((0,  0, 1)),
        "right": inv @ mathutils.Vector((-1, 0, 0)),  # subject's right
    }

def apply_pose(arm, pd):
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='POSE')
    for bn, r in pd.items():
        pb = arm.pose.bones.get(bn)
        if pb:
            pb.rotation_mode = 'XYZ'
            pb.rotation_euler = tuple(math.radians(x) for x in r)
        else:
            print(f"  WARN: pose bone not found: {bn}")
    bpy.ops.object.mode_set(mode='OBJECT')
    bpy.context.view_layer.update()


# ---- materials / world / render (keepers from v2) -------------------------------
def eevee():
    items = [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items]
    for c in ('BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE'):
        if c in items:
            return c
    return items[0]

def set_world(v):
    w = bpy.data.worlds.new('W'); bpy.context.scene.world = w; w.use_nodes = True
    bg = w.node_tree.nodes.get('Background')
    bg.inputs['Color'].default_value = (v, v, v, 1)
    bg.inputs['Strength'].default_value = 1

def toon_mat():
    m = bpy.data.materials.new("toon"); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    d  = nt.nodes.new('ShaderNodeBsdfDiffuse');  d.inputs['Color'].default_value = (0.9, 0.9, 0.9, 1)
    s  = nt.nodes.new('ShaderNodeShaderToRGB')
    r  = nt.nodes.new('ShaderNodeValToRGB');     r.color_ramp.interpolation = 'CONSTANT'
    e  = r.color_ramp.elements
    e[0].position = 0;    e[0].color = (0.05, 0.05, 0.06, 1)
    e[1].position = 0.42; e[1].color = (0.96, 0.96, 0.96, 1)
    em = nt.nodes.new('ShaderNodeEmission')
    o  = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(d.outputs['BSDF'],      s.inputs['Shader'])
    nt.links.new(s.outputs['Color'],     r.inputs['Fac'])
    nt.links.new(r.outputs['Color'],     em.inputs['Color'])
    nt.links.new(em.outputs['Emission'], o.inputs['Surface'])
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
    nt.links.new(em.outputs['Emission'],      o.inputs['Surface'])
    return m

def add_lights():
    for nm, e, rot in (("Key", 5.5, (48, 15, -40)), ("Rim", 1.8, (52, -12, 140))):
        d = bpy.data.lights.new(nm, 'SUN'); d.energy = e
        o = bpy.data.objects.new(nm, d); bpy.context.collection.objects.link(o)
        o.rotation_euler = tuple(math.radians(a) for a in rot)

def add_camera():
    cd = bpy.data.cameras.new('Cam'); cd.lens = CAM_LENS
    c  = bpy.data.objects.new('Cam', cd); bpy.context.collection.objects.link(c)
    c.location = CAM_LOC
    direction = mathutils.Vector(CAM_TARGET) - mathutils.Vector(CAM_LOC)
    c.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
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
    if len(fs.linesets) == 0:
        fs.linesets.new('LS')
    ls = fs.linesets[0]; ls.linestyle = bpy.data.linestyles.new('Ink')
    for at, v in (('select_silhouette', True), ('select_border', True),
                  ('select_crease', True), ('select_external_contour', True)):
        try: setattr(ls, at, v)
        except Exception: pass
    try: fs.crease_angle = math.radians(134)
    except Exception: pass
    st = ls.linestyle; st.color = (0, 0, 0); st.thickness = 2.8; st.use_chaining = True
    try: st.chaining = 'PLAIN'
    except Exception: pass
    g = st.geometry_modifiers
    try: g.new(name='samp', type='SAMPLING'); g[-1].sampling = 3.0
    except Exception: pass
    try: g.new(name='bz', type='BEZIER_CURVE'); g[-1].error = 2.5
    except Exception: pass
    t = st.thickness_modifiers
    try:
        t.new(name='c', type='CALLIGRAPHY'); cm = t[-1]
        cm.orientation = math.radians(38); cm.thickness_min = 0.8; cm.thickness_max = 7.0
    except Exception: pass

def render_to(path, freestyle, worldval):
    sc = bpy.context.scene; sc.render.engine = eevee()
    try:
        sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'
    except Exception: pass
    sc.render.use_freestyle = freestyle; set_world(worldval)
    sc.render.resolution_x, sc.render.resolution_y = RES
    sc.render.image_settings.file_format = 'PNG'
    try: sc.eevee.taa_render_samples = 24
    except Exception: pass
    sc.render.filepath = path; bpy.ops.render.render(write_still=True)
    print("  wrote", path)


# ---- 18 canonical OpenPose keypoints from the MPFB rig --------------------------
def openpose_keypoints(arm, cam, head_frame):
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    ae = arm.evaluated_get(dg)
    mw = ae.matrix_world

    def world_of(bone, end):
        pb = ae.pose.bones[bone]
        return mw @ (pb.tail if end == "tail" else pb.head)

    neck     = world_of("neck01", "head")
    head_top = mw @ ae.pose.bones["head"].tail
    head_c   = neck + (head_top - neck) * 0.6

    head_mat = (mw @ ae.pose.bones["head"].matrix).to_3x3()
    facing     = (head_mat @ head_frame["face"]).normalized()
    up_dir     = (head_mat @ head_frame["up"]).normalized()
    subj_right = (head_mat @ head_frame["right"]).normalized()
    rr = 0.11

    world = [None] * 18
    world[0] = head_c + facing * rr                                            # nose
    for idx, (bone, end) in OPENPOSE_BONE_MAP.items():
        world[idx] = world_of(bone, end)
    world[14] = head_c + facing * rr * 0.85 + subj_right * 0.045 + up_dir * 0.04  # REye
    world[15] = head_c + facing * rr * 0.85 - subj_right * 0.045 + up_dir * 0.04  # LEye
    world[16] = head_c + subj_right * 0.075                                       # REar
    world[17] = head_c - subj_right * 0.075                                       # LEar

    from bpy_extras.object_utils import world_to_camera_view
    sc = bpy.context.scene; out = []
    for wp in world:
        co  = world_to_camera_view(sc, cam, mathutils.Vector(wp))
        vis = 1 if co.z > 0 else 0
        out.append([round(co.x, 5), round(1.0 - co.y, 5), vis])
    return out


# ---- main -----------------------------------------------------------------------
def main():
    a = parse_args()
    enable_mpfb()
    clear_scene()

    if a.pose_json:
        pd = {k: tuple(v) for k, v in json.loads(a.pose_json).items()}
        label = a.label or "JSON"
    else:
        key = a.pose.upper(); pd = ALL_POSES.get(key, POSE_B)
        label = a.label or key

    out = os.path.join(OUT_BASE, f"pose_{label}")
    os.makedirs(out, exist_ok=True)
    print(f"=== POSE {label} (MPFB2 NATIVE v3) -> {out} ===")

    body, arm = make_human(a)
    arm.display_type = 'WIRE'
    head_frame = capture_head_frame(arm)   # capture BEFORE posing
    apply_pose(arm, pd)

    mt = toon_mat()
    body.data.materials.clear(); body.data.materials.append(mt)
    bpy.context.view_layer.objects.active = body
    bpy.ops.object.shade_smooth()

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

    kpts = openpose_keypoints(arm, cam, head_frame)
    json.dump({"res": RES, "keypoints": kpts},
              open(os.path.join(out, "keypoints.json"), "w"), indent=1)
    print("  wrote keypoints.json:", sum(k[2] for k in kpts), "visible /18")
    print(f"=== POSE {label} DONE ===")


main()
