"""
BLUELINE — Figure Rig · FACE STUDIO builder.

A posable Blender figure Loudon can open and manipulate by hand: a full Rigify IK rig (head +
body), REAL CC0 MakeHuman eyes seated by MHCLO fitting, a grab-able GAZE TARGET empty (move it →
both eyes converge on it = focus), and a set of EXPRESSION shape-key sliders (smile, brows, blink,
jaw...) on the face mesh. Eyes + gaze target are bone-parented to the head, so they follow when you
pose the head. Saves a self-contained .blend that opens without MPFB/Rigify.

Run (NOT --factory-startup — it disables MPFB):
  blender -b -P figure_face_studio.py -- --gender 0.0 --age 0.5 --out figure_face_studio.blend
Then open figure_face_studio.blend: grab 'eye_target' (G) to aim the eyes; slide the 'EX: ...'
shape keys (Object Data ▸ Shape Keys) for expression; pose 'FigureRig' for the head/body.
"""
import bpy, os, sys, math, argparse, mathutils
from mathutils import Vector

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MHCLO_EYES = os.path.join(SCRIPT_DIR, "assets", "eyes", "low-poly.mhclo")
UNITS_DIR = os.path.expanduser("~/Library/Application Support/Blender/5.1/extensions/user_default/mpfb/data/targets/expression/units/caucasian")

# Curated FACS units exposed as zero-weight shape-key sliders.
EXPR_SLIDERS = [
    ("EX: smile", "mouth-corner-puller"), ("EX: mouth open", "mouth-open"),
    ("EX: frown", "mouth-depression"), ("EX: lips compress", "mouth-compression"),
    ("EX: brow up L", "eyebrows-left-up"), ("EX: brow up R", "eyebrows-right-up"),
    ("EX: brow down L", "eyebrows-left-down"), ("EX: brow down R", "eyebrows-right-down"),
    ("EX: brow inner up L", "eyebrows-left-inner-up"), ("EX: brow inner up R", "eyebrows-right-inner-up"),
    ("EX: blink L", "eye-left-closure"), ("EX: blink R", "eye-right-closure"),
    ("EX: eye wide L", "eye-left-opened-up"), ("EX: eye wide R", "eye-right-opened-up"),
]


def parse_args():
    argv = sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--gender", type=float, default=0.0)
    p.add_argument("--age", type=float, default=0.5)
    p.add_argument("--out", default="figure_face_studio.blend")
    return p.parse_args(argv)


def add_real_eyes(bm, gaze=(0.0, 0.0)):
    """Real MHCLO eyes: seat per-subject, split L/R, white sclera + dark iris/pupil disk, aimed at
    a gaze-target empty via Damped Track. Returns (eye_objs, iris_objs, target)."""
    from bl_ext.user_default.mpfb.services.humanservice import HumanService
    eyes = HumanService.add_mhclo_asset(MHCLO_EYES, bm, asset_type="Eyes",
                                        set_up_rigging=False, import_weights=False, import_subrig=False)
    bpy.context.view_layer.update()
    bpy.ops.object.select_all(action='DESELECT')
    eyes.select_set(True); bpy.context.view_layer.objects.active = eyes
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.separate(type='LOOSE'); bpy.ops.object.mode_set(mode='OBJECT')
    eye_objs = [o for o in bpy.context.selected_objects if o.type == 'MESH']
    if eyes.name in bpy.data.objects and eyes not in eye_objs:
        eye_objs.append(eyes)

    def center(o):
        bb = [o.matrix_world @ Vector(c) for c in o.bound_box]
        return sum(bb, Vector()) / 8
    mid = sum((center(o) for o in eye_objs), Vector()) / len(eye_objs)
    tgt = bpy.data.objects.new("eye_target", None)
    tgt.empty_display_type = 'SPHERE'; tgt.empty_display_size = 0.02
    tgt.location = mid + Vector((gaze[0], -0.6, gaze[1]))
    bpy.context.collection.objects.link(tgt)

    # White sclera sphere + FLAT iris/pupil disks on the cornea — visible in EVERY viewport mode
    # (Solid included; a UV texture only shows in Material-Preview/Rendered). diffuse_color drives
    # the Solid-mode look; disks are parented to the eyeball so they rotate with gaze.
    def mat(name, col, rough=0.4):
        m = bpy.data.materials.new(name); m.use_nodes = True
        b = m.node_tree.nodes.get("Principled BSDF")
        if b:
            b.inputs["Base Color"].default_value = (*col, 1)
            if "Roughness" in b.inputs: b.inputs["Roughness"].default_value = rough
        m.diffuse_color = (*col, 1)
        return m
    sclera, iris_m, pupil_m = mat("sclera", (0.90, 0.90, 0.88)), mat("iris", (0.34, 0.19, 0.09)), mat("pupil", (0.02, 0.02, 0.02))
    for o in eye_objs:
        o.name = "eye_" + ("l" if center(o).x >= 0 else "r")
        o.data.materials.clear(); o.data.materials.append(sclera)
        bpy.ops.object.select_all(action='DESELECT'); o.select_set(True)
        bpy.context.view_layer.objects.active = o
        bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
        bpy.ops.object.shade_smooth()
        bb = [o.matrix_world @ Vector(c) for c in o.bound_box]
        r = (max(p.x for p in bb) - min(p.x for p in bb)) / 2 or 0.012
        # recess into the socket (+Y) + shrink so it seats without bulging (lighter recess = forward)
        o.matrix_world = mathutils.Matrix.Translation(Vector((0, r * 0.30, 0))) @ o.matrix_world
        o.scale *= 0.90; bpy.context.view_layer.update()
        rs = r * 0.90; ec = o.matrix_world.translation
        for rad, mtl, off, nm in ((rs * 0.52, iris_m, 0.0004, "iris_"), (rs * 0.26, pupil_m, 0.0007, "pupil_")):
            bpy.ops.mesh.primitive_circle_add(radius=rad, fill_type='NGON',
                location=ec + Vector((0, -(rs + off), 0)), rotation=(math.radians(90), 0, 0))
            d = bpy.context.active_object; d.name = nm + o.name[-1]
            d.data.materials.append(mtl); d.parent = o; d.matrix_parent_inverse = o.matrix_world.inverted()
        c = o.constraints.new('DAMPED_TRACK'); c.target = tgt; c.track_axis = 'TRACK_NEGATIVE_Y'
    return eye_objs, [], tgt


def bone_parent(obj, rig, bone):
    """Bone-parent obj to rig's bone, keeping its current world transform."""
    mw = obj.matrix_world.copy()
    obj.parent = rig; obj.parent_type = 'BONE'; obj.parent_bone = bone
    obj.matrix_world = mw


def main():
    a = parse_args()
    import addon_utils
    addon_utils.enable("bl_ext.user_default.mpfb", default_set=True, persistent=True)
    addon_utils.enable("rigify", default_set=True, persistent=True)
    from bl_ext.user_default.mpfb.services.humanservice import HumanService
    from bl_ext.user_default.mpfb.services.targetservice import TargetService
    from bl_ext.user_default.mpfb.entities.rigging.rigifyhelpers.rigifyhelpers import RigifyHelpers

    bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete()
    macro = {"gender": a.gender, "age": a.age, "muscle": 0.5, "weight": 0.5, "proportions": 0.5,
             "height": 0.5, "cupsize": 0.5, "firmness": 0.5,
             "race": {"asian": 0.33, "caucasian": 0.34, "african": 0.33}}
    bm = HumanService.create_human(macro_detail_dict=macro); bm.name = "FaceBody"

    # expression shape-key sliders at weight 0
    made = 0
    for label, unit in EXPR_SLIDERS:
        path = os.path.join(UNITS_DIR, unit + ".target.gz")
        if os.path.isfile(path):
            TargetService.load_target(bm, path, weight=0.0, name=label); made += 1
    print(f"  expression sliders: {made}")

    # eyes (before rigify, on the base mesh)
    eye_objs, irises, tgt = add_real_eyes(bm)

    # Rigify IK rig (head + body posable)
    bpy.ops.object.select_all(action='DESELECT')
    arm = HumanService.add_builtin_rig(bm, "game_engine", import_weights=True)
    bpy.ops.object.mode_set(mode='OBJECT'); bpy.ops.object.select_all(action='DESELECT')
    arm.select_set(True); bpy.context.view_layer.objects.active = arm
    bpy.ops.object.transform_apply(location=True, scale=False, rotation=False)
    RigifyHelpers.get_instance({"produce": True, "meta_rig_action": "hide", "name": "FigureRig"}).convert_to_rigify(arm)
    rig = bpy.data.objects["FigureRig"]; rig.show_in_front = True

    # eyes follow the head: bone-parent to DEF-head
    head_bone = "DEF-head" if "DEF-head" in rig.pose.bones else ("head" if "head" in rig.pose.bones else None)

    # Replace the gaze-target EMPTY with a CONTROL BONE in the rig, so gaze is manipulable in
    # POSE MODE alongside the head/body (an empty is only movable in Object Mode). The bone is
    # parented to the head, so gaze stays head-relative; the eyes' Damped Track re-points at it.
    tgt_world = tgt.matrix_world.translation.copy()
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.mode_set(mode='EDIT')
    eb = rig.data.edit_bones.new("eye_target")
    loc = rig.matrix_world.inverted() @ tgt_world
    eb.head = loc; eb.tail = loc + Vector((0, -0.05, 0)); eb.use_connect = False
    if head_bone and head_bone in rig.data.edit_bones:
        eb.parent = rig.data.edit_bones[head_bone]
    # pre-select it (Bone.select doesn't exist in 5.1; selection lives on the EditBone)
    for b in rig.data.edit_bones:
        b.select = b.select_head = b.select_tail = False
    eb.select = eb.select_head = eb.select_tail = True
    bpy.ops.object.mode_set(mode='OBJECT')
    # put it in a visible bone collection so it shows in Pose Mode
    try:
        gcoll = rig.data.collections.new("GAZE"); gcoll.is_visible = True
        gcoll.assign(rig.data.bones["eye_target"])
    except Exception as e:
        print("  gaze collection:", e)
    # re-point each eye's Damped Track from the empty to the bone, then drop the empty
    for o in eye_objs:
        for c in o.constraints:
            if c.type == 'DAMPED_TRACK':
                c.target = rig; c.subtarget = "eye_target"
    bpy.data.objects.remove(tgt, do_unlink=True)
    if head_bone:
        for o in eye_objs:
            bone_parent(o, rig, head_bone)
        print(f"  eyes bone-parented to {head_bone}; gaze = 'eye_target' CONTROL BONE (Pose Mode)")

    # camera framing the face + lights
    cam_data = bpy.data.cameras.new("FaceCam"); cam_data.lens = 85
    cam = bpy.data.objects.new("FaceCam", cam_data); bpy.context.collection.objects.link(cam)
    head_z = 1.55
    cam.location = (0.0, -1.2, head_z)
    d = Vector((0, 0, head_z)) - cam.location
    cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    bpy.context.scene.camera = cam
    for nm, e, rot in (("Key", 3.5, (55, 10, -35)), ("Fill", 1.6, (60, 15, 55))):
        L = bpy.data.lights.new(nm, 'SUN'); L.energy = e
        o = bpy.data.objects.new(nm, L); bpy.context.collection.objects.link(o)
        o.rotation_euler = tuple(math.radians(x) for x in rot)

    # leave the rig in Pose Mode with the eye_target control bone selected — grab it (G) to aim gaze
    try:
        bpy.ops.object.select_all(action='DESELECT')
        rig.select_set(True); bpy.context.view_layer.objects.active = rig
        bpy.ops.object.mode_set(mode='POSE')
        et = rig.data.bones.get("eye_target")
        if et:
            rig.data.bones.active = et                 # highlight it; it's pre-selected from edit mode
    except Exception as e:
        print("  pose-focus eye_target (cosmetic):", repr(e)[:80])

    out = a.out if os.path.isabs(a.out) else os.path.join(SCRIPT_DIR, a.out)
    bpy.ops.wm.save_as_mainfile(filepath=out)
    print("SAVED", out)


main()
