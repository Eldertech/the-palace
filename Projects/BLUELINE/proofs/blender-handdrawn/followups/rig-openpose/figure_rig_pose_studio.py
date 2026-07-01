"""
BLUELINE — Figure Rig · POSE STUDIO builder (IK edition).

Builds the figure Loudon poses by hand. Generates an MPFB2 parametric human, gives it
a FULL RIGIFY IK/FK control rig (foot_ik / hand_ik / torso / hips / chest / head — the
standard posable human rig), drops in the render scene (look-at camera, lights, ground,
toon material, Freestyle ink), and SAVES a self-contained .blend. The saved file opens
in vanilla Blender — MPFB and Rigify are only needed to BUILD it, not to pose or render it.

It also writes an embedded text block "render_plates" into the .blend: after Loudon poses,
he runs it (Text editor ▸ Run Script) to render ink_plate + depth_plate + keypoints.json
from the CURRENT pose — reading the 18 OpenPose keypoints off the Rigify rig's own ORG-
bones. Then draw_openpose.py + redraw_test.py finish the gen-AI redraw (outside Blender).

Run (NOT --factory-startup, that disables MPFB):
  blender -b -P figure_rig_pose_studio.py -- --gender 0.0 --age 0.3 --out figure_rig_studio.blend
"""
import bpy, math, os, sys, json, argparse, mathutils

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
RES = (832, 1040)
CAM_LOC = (1.45, -2.75, 1.05)
CAM_TARGET = (0.0, 0.0, 0.92)
CAM_LENS = 40

# OpenPose joint → Rigify ORG-bone (game-engine naming: _l/_r, subject-left = +X).
# Candidates per joint for resilience across MPFB versions. nose/eyes/ears derive
# from the head bone frame (added by the render script).
RIGIFY_OP = {
    1:  (["ORG-neck_01", "ORG-neck", "ORG-spine_03"], "head"),       # neck
    2:  (["ORG-upperarm_r"], "head"),  3: (["ORG-lowerarm_r"], "head"),  4: (["ORG-hand_r"], "head"),
    5:  (["ORG-upperarm_l"], "head"),  6: (["ORG-lowerarm_l"], "head"),  7: (["ORG-hand_l"], "head"),
    8:  (["ORG-thigh_r"], "head"),     9: (["ORG-calf_r"], "head"),     10: (["ORG-foot_r"], "head"),
    11: (["ORG-thigh_l"], "head"),    12: (["ORG-calf_l"], "head"),     13: (["ORG-foot_l"], "head"),
}


def parse_args():
    argv = sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--gender", type=float, default=0.5)
    p.add_argument("--age",    type=float, default=0.35)
    p.add_argument("--muscle", type=float, default=0.5)
    p.add_argument("--weight", type=float, default=0.5)
    p.add_argument("--height", type=float, default=0.55)
    p.add_argument("--out", default="figure_rig_studio.blend")
    return p.parse_args(argv)


# ---- materials / scene (shared with v3) ----------------------------------------
def eevee():
    items = [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items]
    for c in ('BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE'):
        if c in items:
            return c
    return items[0]

def skin_mat():
    m = bpy.data.materials.new("figure_skin"); m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (0.82, 0.80, 0.78, 1)
        if "Roughness" in bsdf.inputs:
            bsdf.inputs["Roughness"].default_value = 0.6
    return m

def add_lights():
    for nm, e, rot in (("Key", 4.0, (48, 15, -40)), ("Rim", 1.6, (52, -12, 140)),
                       ("Fill", 1.4, (60, 20, 60))):
        d = bpy.data.lights.new(nm, 'SUN'); d.energy = e
        o = bpy.data.objects.new(nm, d); bpy.context.collection.objects.link(o)
        o.rotation_euler = tuple(math.radians(a) for a in rot)

def add_camera():
    cd = bpy.data.cameras.new('Cam'); cd.lens = CAM_LENS
    c = bpy.data.objects.new('Cam', cd); bpy.context.collection.objects.link(c)
    c.location = CAM_LOC
    direction = mathutils.Vector(CAM_TARGET) - mathutils.Vector(CAM_LOC)
    c.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
    bpy.context.scene.camera = c
    return c

def add_ground():
    bpy.ops.mesh.primitive_plane_add(size=20, location=(0, 0, 0.0))
    g = bpy.context.active_object; g.name = "Ground"
    m = bpy.data.materials.new("ground"); m.use_nodes = True
    g.data.materials.append(m)
    return g

def configure_freestyle():
    sc = bpy.context.scene
    sc.render.engine = eevee()
    sc.render.use_freestyle = True
    sc.render.line_thickness_mode = 'ABSOLUTE'
    sc.render.resolution_x, sc.render.resolution_y = RES
    try:
        sc.view_settings.view_transform = 'Standard'
    except Exception:
        pass
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
    sc.render.use_freestyle = False   # OFF by default so the viewport/preview is normal


# ---- MPFB human + Rigify IK rig -------------------------------------------------
def build_figure(a):
    import addon_utils
    addon_utils.enable("bl_ext.user_default.mpfb", default_set=True, persistent=True)
    addon_utils.enable("rigify", default_set=True, persistent=True)
    from bl_ext.user_default.mpfb.services.humanservice import HumanService
    from bl_ext.user_default.mpfb.entities.rigging.rigifyhelpers.rigifyhelpers import RigifyHelpers

    bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete()
    macro = {
        "gender": a.gender, "age": a.age, "muscle": a.muscle, "weight": a.weight,
        "proportions": 0.5, "height": a.height, "cupsize": 0.5, "firmness": 0.5,
        "race": {"asian": 0.33, "caucasian": 0.34, "african": 0.33},
    }
    bm = HumanService.create_human(macro_detail_dict=macro)
    bm.name = "FigureBody"
    arm = HumanService.add_builtin_rig(bm, "game_engine", import_weights=True)
    bpy.ops.object.mode_set(mode='OBJECT'); bpy.ops.object.select_all(action='DESELECT')
    arm.select_set(True); bpy.context.view_layer.objects.active = arm
    bpy.ops.object.transform_apply(location=True, scale=False, rotation=False)
    RigifyHelpers.get_instance(
        {"produce": True, "meta_rig_action": "hide", "name": "FigureRig"}
    ).convert_to_rigify(arm)
    gen = bpy.data.objects["FigureRig"]
    gen.show_in_front = True
    print(f"  figure: {len(bm.data.vertices)} verts | rigify rig {len(gen.data.bones)} bones")
    return bm, gen


# ---- embedded render-from-pose text block ---------------------------------------
RENDER_PLATES_SRC = r'''"""
render_plates — run AFTER you pose FigureRig.  Text editor ▸ Run Script (Alt-P).
Renders ink_plate.png + depth_plate.png + keypoints.json from the CURRENT pose into
//pose_out/ (next to this .blend). Then, in a terminal:

  PY="/Users/loudonstearns/Documents/The Palace/_tools/ComfyUI/venv/bin/python3"
  D="<this .blend folder>/pose_out"
  "$PY" <rig-openpose>/draw_openpose.py "$D"      # draws the canonical OpenPose
  "$PY" <rig-openpose>/redraw_test.py  "$D"       # gen-AI pen-flow redraw (needs ComfyUI up)
"""
import bpy, os, json, math, mathutils
from bpy_extras.object_utils import world_to_camera_view

RES = (832, 1040)
RIGIFY_OP = {
    1:(["ORG-neck_01","ORG-neck","ORG-spine_03"],"head"),
    2:(["ORG-upperarm_r"],"head"),3:(["ORG-lowerarm_r"],"head"),4:(["ORG-hand_r"],"head"),
    5:(["ORG-upperarm_l"],"head"),6:(["ORG-lowerarm_l"],"head"),7:(["ORG-hand_l"],"head"),
    8:(["ORG-thigh_r"],"head"),9:(["ORG-calf_r"],"head"),10:(["ORG-foot_r"],"head"),
    11:(["ORG-thigh_l"],"head"),12:(["ORG-calf_l"],"head"),13:(["ORG-foot_l"],"head"),
}
out = bpy.path.abspath("//pose_out"); os.makedirs(out, exist_ok=True)
sc = bpy.context.scene
arm = bpy.data.objects.get("FigureRig")
body = bpy.data.objects.get("FigureBody")
cam = sc.camera

def pick(arm, cands):
    for n in cands:
        if n in arm.pose.bones: return n
    return None

def keypoints():
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get(); ae = arm.evaluated_get(dg); mw = ae.matrix_world
    head_b = pick(arm, ["ORG-head","head"])
    neck_n = pick(arm, ["ORG-neck_01","ORG-neck","ORG-spine_03"])
    head_pb = ae.pose.bones[head_b]
    neck = mw @ ae.pose.bones[neck_n].head
    head_top = mw @ head_pb.tail
    head_c = neck + (head_top - neck) * 0.6
    hm = (mw @ head_pb.matrix).to_3x3()
    # rest-frame local dirs computed live (approx): forward = -Y, up=+Z, right=-X
    inv = (mw @ ae.pose.bones[head_b].bone.matrix_local.to_3x3()).inverted() if False else hm.inverted()
    facing = (hm @ (inv @ mathutils.Vector((0,-1,0)))).normalized()
    up = (hm @ (inv @ mathutils.Vector((0,0,1)))).normalized()
    right = (hm @ (inv @ mathutils.Vector((-1,0,0)))).normalized()
    rr = 0.11
    world = [None]*18
    world[0] = head_c + facing*rr
    for i,(cands,end) in RIGIFY_OP.items():
        n = pick(arm, cands); pb = ae.pose.bones[n]
        world[i] = (mw @ pb.tail) if end=="tail" else (mw @ pb.head)
    world[14]=head_c+facing*rr*0.85+right*0.045+up*0.04
    world[15]=head_c+facing*rr*0.85-right*0.045+up*0.04
    world[16]=head_c+right*0.075
    world[17]=head_c-right*0.075
    o=[]
    for wp in world:
        co=world_to_camera_view(sc,cam,mathutils.Vector(wp)); o.append([round(co.x,5),round(1.0-co.y,5),1 if co.z>0 else 0])
    return o

# ink
mat_cache = {o.name: list(o.data.materials) for o in bpy.data.objects if o.type=='MESH'}
sc.render.use_freestyle = True
w = sc.world; orig_world = (w.use_nodes, None)
if w and w.use_nodes:
    bg = w.node_tree.nodes.get('Background'); bgcol = bg.inputs['Color'].default_value[:]; bg.inputs['Color'].default_value=(1,1,1,1)
sc.render.filepath = os.path.join(out,"ink_plate.png"); bpy.ops.render.render(write_still=True)
# depth
dm = bpy.data.materials.new("depth"); dm.use_nodes=True; nt=dm.node_tree; nt.nodes.clear()
cd=nt.nodes.new('ShaderNodeCameraData'); mr=nt.nodes.new('ShaderNodeMapRange')
mr.inputs['From Min'].default_value=2.0; mr.inputs['From Max'].default_value=5.5
mr.inputs['To Min'].default_value=1.0; mr.inputs['To Max'].default_value=0.0; mr.clamp=True
em=nt.nodes.new('ShaderNodeEmission'); op=nt.nodes.new('ShaderNodeOutputMaterial')
nt.links.new(cd.outputs['View Z Depth'],mr.inputs['Value']); nt.links.new(mr.outputs['Result'],em.inputs['Color']); nt.links.new(em.outputs['Emission'],op.inputs['Surface'])
for o in bpy.data.objects:
    if o.type=='MESH': o.data.materials.clear(); o.data.materials.append(dm)
sc.render.use_freestyle=False
if w and w.use_nodes: bg.inputs['Color'].default_value=(0,0,0,1)
sc.render.filepath=os.path.join(out,"depth_plate.png"); bpy.ops.render.render(write_still=True)
# restore
for o in bpy.data.objects:
    if o.type=='MESH' and o.name in mat_cache:
        o.data.materials.clear()
        for m in mat_cache[o.name]: o.data.materials.append(m)
if w and w.use_nodes: bg.inputs['Color'].default_value=bgcol
sc.render.use_freestyle=False
json.dump({"res":list(RES),"keypoints":keypoints()}, open(os.path.join(out,"keypoints.json"),"w"), indent=1)
print("render_plates: wrote ink_plate.png, depth_plate.png, keypoints.json ->", out)
'''


def main():
    a = parse_args()
    bm, gen = build_figure(a)

    # render scene
    bm.data.materials.clear(); bm.data.materials.append(skin_mat())
    add_ground(); add_lights(); add_camera(); configure_freestyle()

    # embed the render-from-pose script
    txt = bpy.data.texts.new("render_plates"); txt.write(RENDER_PLATES_SRC)

    # leave the rig active + in pose mode, body shade-smooth
    bpy.context.view_layer.objects.active = bm; bm.select_set(True)
    bpy.ops.object.shade_smooth()
    bpy.ops.object.select_all(action='DESELECT')
    gen.select_set(True); bpy.context.view_layer.objects.active = gen
    try:
        bpy.ops.object.mode_set(mode='POSE')
    except Exception:
        pass

    out_path = a.out if os.path.isabs(a.out) else os.path.join(SCRIPT_DIR, a.out)
    bpy.ops.wm.save_as_mainfile(filepath=out_path)
    print("SAVED", out_path)


main()
