"""
Figure Rig — HANDS. Extend the OpenPose plate with a 21-keypoint hand (draw_handpose)
projected from the MPFB `default` rig's own finger bones. Presents the RIGHT hand to a
framed camera (closeup / medium / full), poses the fingers (fist / point / grip / open),
and emits body(18) + hand(21) keypoints for the combined OpenPose draw.

Run (NOT --factory-startup — disables MPFB):
  blender -b -P hands_rig.py -- --hand-pose fist --shot closeup --label fist_close
Outputs -> renders/hands/<label>/{ink_plate,depth_plate}.png + keypoints.json (with "hands")
"""
import bpy, math, os, sys, json, argparse, mathutils

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_BASE = os.path.join(SCRIPT_DIR, "renders", "hands")
RES = (832, 1040)
MPFB_MODULE = "bl_ext.user_default.mpfb"
HERO_DIR = (mathutils.Vector((1.45, -2.75, 1.05)) - mathutils.Vector((0, 0, 0.92))).normalized()

# Body 18-keypoint map (default rig), same as v3.
OPENPOSE_BONE_MAP = {
    1: ("neck01", "head"),
    2: ("upperarm01.R", "head"), 3: ("lowerarm01.R", "head"), 4: ("wrist.R", "head"),
    5: ("upperarm01.L", "head"), 6: ("lowerarm01.L", "head"), 7: ("wrist.L", "head"),
    8: ("upperleg01.R", "head"), 9: ("lowerleg01.R", "head"), 10: ("foot.R", "head"),
    11: ("upperleg01.L", "head"), 12: ("lowerleg01.L", "head"), 13: ("foot.L", "head"),
}

# 21-keypoint hand: wrist + 5 fingers × (3 joint heads + distal tail).
# finger1 = thumb, finger2..5 = index/middle/ring/pinky.
def hand_bone_map(side):
    m = {0: (f"wrist.{side}", "head")}
    for kp0, f in zip((1, 5, 9, 13, 17), (1, 2, 3, 4, 5)):
        m[kp0]   = (f"finger{f}-1.{side}", "head")
        m[kp0+1] = (f"finger{f}-2.{side}", "head")
        m[kp0+2] = (f"finger{f}-3.{side}", "head")
        m[kp0+3] = (f"finger{f}-3.{side}", "tail")
    return m

# ---- finger poses (deg on finger{f}-{j}.R; +X curls toward the palm) --------------
def curl(side, joints, amounts):
    """amounts = (a1,a2,a3) applied to fingers listed in `joints` (1..5)."""
    d = {}
    for f in joints:
        for j, a in zip((1, 2, 3), amounts):
            d[f"finger{f}-{j}.{side}"] = [a, 0, 0]
    return d

def finger_pose(name, side="R"):
    if name == "fist":
        d = curl(side, (2, 3, 4, 5), (75, 90, 70)); d.update(curl(side, (1,), (35, 40, 30))); return d
    if name == "point":
        d = curl(side, (3, 4, 5), (80, 95, 70)); d.update(curl(side, (1,), (30, 45, 20)))
        d.update(curl(side, (2,), (0, 0, 0))); return d          # index straight
    if name == "grip":  # loose curl to wrap an object
        d = curl(side, (2, 3, 4, 5), (45, 55, 45)); d.update(curl(side, (1,), (25, 30, 25))); return d
    if name == "pinch":  # thumb + index meet, other fingers softly curled (delicate hold)
        d = curl(side, (3, 4, 5), (28, 34, 28)); d.update(curl(side, (2,), (34, 22, 16)))
        d.update(curl(side, (1,), (26, 34, 20))); return d
    if name == "open":
        return {}
    return {}

# ---- arm presentation: raise the R hand into open space in front of the torso -----
# (the closeup camera looks down the palm normal, so this only needs the hand un-occluded)
ARM_PRESENT = {
    "upperarm01.R": [-38, 0, 58], "lowerarm01.R": [-82, 0, 0],
    "upperarm01.L": [0, 0, -15],
    "spine02": [0, 0, 3],
}

# ---- args -----------------------------------------------------------------------
def parse_args():
    argv = sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--hand-pose", default="fist")
    p.add_argument("--shot", default="closeup", choices=["closeup", "medium", "full"])
    p.add_argument("--hand", default="R")
    p.add_argument("--angle", type=float, default=0.0, help="closeup: rotate camera around the hand (deg)")
    p.add_argument("--label", default=None)
    p.add_argument("--gender", type=float, default=0.5)
    p.add_argument("--age", type=float, default=0.5)
    p.add_argument("--muscle", type=float, default=0.5)
    p.add_argument("--weight", type=float, default=0.5)
    p.add_argument("--height", type=float, default=0.55)
    return p.parse_args(argv)

def enable_mpfb():
    import addon_utils
    addon_utils.enable(MPFB_MODULE, default_set=True, persistent=True)

def clear_scene():
    bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete()

def make_human(a):
    from bl_ext.user_default.mpfb.services.humanservice import HumanService
    macro = {"gender": a.gender, "age": a.age, "muscle": a.muscle, "weight": a.weight,
             "proportions": 0.5, "height": a.height, "cupsize": 0.5, "firmness": 0.5,
             "race": {"asian": 0.33, "caucasian": 0.34, "african": 0.33}}
    bm = HumanService.create_human(macro_detail_dict=macro)
    arm = HumanService.add_builtin_rig(bm, "default", import_weights=True)
    bpy.context.view_layer.update()
    return bm, arm

def apply_pose(arm, pd):
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='POSE')
    for bn, r in pd.items():
        pb = arm.pose.bones.get(bn)
        if pb:
            pb.rotation_mode = 'XYZ'
            pb.rotation_euler = tuple(math.radians(x) for x in r)
    bpy.ops.object.mode_set(mode='OBJECT')
    bpy.context.view_layer.update()

# ---- scene helpers (from v3) ----------------------------------------------------
def eevee():
    items = [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items]
    for c in ('BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE'):
        if c in items: return c
    return items[0]

def set_world(v):
    w = bpy.data.worlds.new('W'); bpy.context.scene.world = w; w.use_nodes = True
    bg = w.node_tree.nodes.get('Background')
    bg.inputs['Color'].default_value = (v, v, v, 1); bg.inputs['Strength'].default_value = 1

def toon_mat():
    m = bpy.data.materials.new("toon"); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    d = nt.nodes.new('ShaderNodeBsdfDiffuse'); d.inputs['Color'].default_value = (0.9, 0.9, 0.9, 1)
    s = nt.nodes.new('ShaderNodeShaderToRGB')
    r = nt.nodes.new('ShaderNodeValToRGB'); r.color_ramp.interpolation = 'CONSTANT'
    e = r.color_ramp.elements
    e[0].position = 0; e[0].color = (0.05, 0.05, 0.06, 1); e[1].position = 0.42; e[1].color = (0.96, 0.96, 0.96, 1)
    em = nt.nodes.new('ShaderNodeEmission'); o = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(d.outputs['BSDF'], s.inputs['Shader']); nt.links.new(s.outputs['Color'], r.inputs['Fac'])
    nt.links.new(r.outputs['Color'], em.inputs['Color']); nt.links.new(em.outputs['Emission'], o.inputs['Surface'])
    return m

def grey_mat():
    m = bpy.data.materials.new("grey"); m.use_nodes = True
    b = m.node_tree.nodes.get("Principled BSDF")
    if b:
        b.inputs["Base Color"].default_value = (0.62, 0.62, 0.62, 1)
        if "Roughness" in b.inputs: b.inputs["Roughness"].default_value = 0.55
    return m

def skin_mat():
    m = bpy.data.materials.new("skin"); m.use_nodes = True
    b = m.node_tree.nodes.get("Principled BSDF")
    if b:
        b.inputs["Base Color"].default_value = (0.80, 0.62, 0.52, 1)
        if "Roughness" in b.inputs: b.inputs["Roughness"].default_value = 0.5
    return m

def subject_depth_range(objs, cam):
    inv = cam.matrix_world.inverted(); zs = []
    for o in objs:
        if o.type != 'MESH':
            continue
        for v in o.data.vertices:
            zs.append(-(inv @ (o.matrix_world @ v.co)).z)
    if not zs:
        return 0.2, 3.5
    near, far = min(zs), max(zs)
    pad = (far - near) * 0.06 + 0.004
    return max(near - pad, 0.01), far + pad

def depth_mat(near=0.2, far=3.5):
    m = bpy.data.materials.new("depth"); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    cd = nt.nodes.new('ShaderNodeCameraData'); mr = nt.nodes.new('ShaderNodeMapRange')
    mr.inputs['From Min'].default_value = near; mr.inputs['From Max'].default_value = far
    mr.inputs['To Min'].default_value = 1.0; mr.inputs['To Max'].default_value = 0.0; mr.clamp = True
    em = nt.nodes.new('ShaderNodeEmission'); o = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(cd.outputs['View Z Depth'], mr.inputs['Value']); nt.links.new(mr.outputs['Result'], em.inputs['Color'])
    nt.links.new(em.outputs['Emission'], o.inputs['Surface'])
    return m

def add_lights():
    for nm, e, rot in (("Key", 5.5, (48, 15, -40)), ("Rim", 1.8, (52, -12, 140))):
        d = bpy.data.lights.new(nm, 'SUN'); d.energy = e
        o = bpy.data.objects.new(nm, d); bpy.context.collection.objects.link(o)
        o.rotation_euler = tuple(math.radians(a) for a in rot)

def add_ground(mat):
    bpy.ops.mesh.primitive_plane_add(size=20, location=(0, 0, -0.01))
    g = bpy.context.active_object; g.data.materials.clear(); g.data.materials.append(mat)

def configure_freestyle():
    sc = bpy.context.scene; sc.render.use_freestyle = True; sc.render.line_thickness_mode = 'ABSOLUTE'
    vl = sc.view_layers[0]; vl.use_freestyle = True; fs = vl.freestyle_settings
    if len(fs.linesets) == 0: fs.linesets.new('LS')
    ls = fs.linesets[0]; ls.linestyle = bpy.data.linestyles.new('Ink')
    for at, v in (('select_silhouette', True), ('select_border', True), ('select_crease', True), ('select_external_contour', True)):
        try: setattr(ls, at, v)
        except Exception: pass
    try: fs.crease_angle = math.radians(134)
    except Exception: pass
    st = ls.linestyle; st.color = (0, 0, 0); st.thickness = 2.2; st.use_chaining = True
    t = st.thickness_modifiers
    try:
        t.new(name='c', type='CALLIGRAPHY'); cm = t[-1]
        cm.orientation = math.radians(38); cm.thickness_min = 0.7; cm.thickness_max = 5.0
    except Exception: pass

def render_to(path, freestyle, worldval):
    sc = bpy.context.scene; sc.render.engine = eevee()
    try: sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'
    except Exception: pass
    sc.render.use_freestyle = freestyle; set_world(worldval)
    sc.render.resolution_x, sc.render.resolution_y = RES
    sc.render.image_settings.file_format = 'PNG'
    try: sc.eevee.taa_render_samples = 24
    except Exception: pass
    sc.render.filepath = path; bpy.ops.render.render(write_still=True)

# ---- camera: frame the hand (closeup/medium) or the whole body (full) -----------
def bbox_of_bones(arm, bone_names):
    dg = bpy.context.evaluated_depsgraph_get(); ae = arm.evaluated_get(dg); mw = ae.matrix_world
    pts = []
    for n in bone_names:
        pb = ae.pose.bones.get(n)
        if pb: pts += [mw @ pb.head, mw @ pb.tail]
    return pts

def _pts(vs):
    xs = [p.x for p in vs]; ys = [p.y for p in vs]; zs = [p.z for p in vs]
    center = mathutils.Vector(((min(xs)+max(xs))/2, (min(ys)+max(ys))/2, (min(zs)+max(zs))/2))
    return center, xs, ys, zs

def add_camera(arm, body, shot, hand, angle=0.0):
    cd = bpy.data.cameras.new('Cam'); c = bpy.data.objects.new('Cam', cd)
    bpy.context.collection.objects.link(c); bpy.context.scene.camera = c
    dg = bpy.context.evaluated_depsgraph_get(); ae = arm.evaluated_get(dg); mw = ae.matrix_world

    if shot == "closeup":
        cd.lens = 55
        def hh(n): return mw @ ae.pose.bones[n].head
        wrist = hh(f"wrist.{hand}"); idx = hh(f"finger2-1.{hand}"); pky = hh(f"finger5-1.{hand}")
        mid = hh(f"finger3-1.{hand}")
        hand_bones = [f"finger{f}-{j}.{hand}" for f in range(1, 6) for j in range(1, 4)] + [f"wrist.{hand}"]
        center, xs, ys, zs = _pts(bbox_of_bones(arm, hand_bones))
        normal = (idx - wrist).cross(pky - wrist)
        if normal.length < 1e-6: normal = mathutils.Vector((0, -1, 0))
        normal.normalize()
        if normal.y > 0: normal = -normal          # face the world-front (camera hemisphere)
        up = (mid - wrist).normalized()
        if angle:                                   # rotate the viewpoint around the hand's up axis
            normal = (mathutils.Matrix.Rotation(math.radians(angle), 4, up) @ normal).normalized()
        span = max(max(xs)-min(xs), max(ys)-min(ys), max(zs)-min(zs), 0.05)
        c.location = center + normal * span * 2.4
        z = (c.location - center).normalized()            # camera +Z (points back toward camera)
        x = up.cross(z)
        if x.length < 1e-6: x = mathutils.Vector((1, 0, 0))
        x.normalize(); y = z.cross(x).normalized()
        c.rotation_euler = mathutils.Matrix((x, y, z)).transposed().to_euler()
    elif shot == "medium":
        cd.lens = 42
        names = [f"finger{f}-{j}.{hand}" for f in range(1, 6) for j in range(1, 4)]
        names += [f"wrist.{hand}", "upperarm01.R", "upperarm01.L", "lowerarm01.R",
                  "head", "neck01", "spine01", "spine02", "upperleg01.L", "upperleg01.R"]
        center, xs, ys, zs = _pts(bbox_of_bones(arm, names))
        extent = max(max(zs)-min(zs), (max(xs)-min(xs))*1.25); dist = extent * 1.9 * 1.05
        c.location = center + HERO_DIR * dist
        c.rotation_euler = (center - c.location).to_track_quat('-Z', 'Y').to_euler()
    else:  # full
        cd.lens = 40
        me = body.evaluated_get(dg)
        center, xs, ys, zs = _pts([body.matrix_world @ v.co for v in me.data.vertices])
        extent = max(max(zs)-min(zs), (max(xs)-min(xs))*1.25); dist = extent * 1.9 * 1.12
        c.location = center + HERO_DIR * dist
        c.rotation_euler = (center - c.location).to_track_quat('-Z', 'Y').to_euler()
    return c

# ---- keypoints (body 18 + hand 21) ----------------------------------------------
def project_all(arm, cam, head_frame, hand):
    from bpy_extras.object_utils import world_to_camera_view
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get(); ae = arm.evaluated_get(dg); mw = ae.matrix_world
    sc = bpy.context.scene

    def wof(bone, end):
        pb = ae.pose.bones.get(bone)
        if not pb: return None
        return mw @ (pb.tail if end == "tail" else pb.head)

    def proj(wp):
        if wp is None: return [0, 0, 0]
        co = world_to_camera_view(sc, cam, mathutils.Vector(wp))
        return [round(co.x, 5), round(1.0 - co.y, 5), 1 if co.z > 0 else 0]

    # body
    neck = wof("neck01", "head"); head_top = mw @ ae.pose.bones["head"].tail
    head_c = neck + (head_top - neck) * 0.6
    hm = (mw @ ae.pose.bones["head"].matrix).to_3x3()
    facing = (hm @ head_frame["face"]).normalized(); up = (hm @ head_frame["up"]).normalized()
    right = (hm @ head_frame["right"]).normalized(); rr = 0.11
    bw = [None]*18
    bw[0] = head_c + facing*rr
    for i, (bone, end) in OPENPOSE_BONE_MAP.items(): bw[i] = wof(bone, end)
    bw[14] = head_c + facing*rr*0.85 + right*0.045 + up*0.04
    bw[15] = head_c + facing*rr*0.85 - right*0.045 + up*0.04
    bw[16] = head_c + right*0.075; bw[17] = head_c - right*0.075
    body = [proj(w) for w in bw]
    # hand
    hm2 = hand_bone_map(hand)
    hand_kp = [proj(wof(*hm2[i])) for i in range(21)]
    return body, {hand: hand_kp}

def capture_head_frame(arm):
    bpy.context.view_layer.update()
    rest = (arm.matrix_world @ arm.pose.bones["head"].matrix).to_3x3(); inv = rest.inverted()
    return {"face": inv @ mathutils.Vector((0, -1, 0)), "up": inv @ mathutils.Vector((0, 0, 1)),
            "right": inv @ mathutils.Vector((-1, 0, 0))}

def main():
    a = parse_args()
    enable_mpfb(); clear_scene()
    body, arm = make_human(a); arm.display_type = 'WIRE'
    head_frame = capture_head_frame(arm)
    pose = dict(ARM_PRESENT); pose.update(finger_pose(a.hand_pose, a.hand))
    apply_pose(arm, pose)

    label = a.label or f"{a.hand_pose}_{a.shot}"
    out = os.path.join(OUT_BASE, label); os.makedirs(out, exist_ok=True)
    print(f"=== HAND {label} ({a.hand_pose}/{a.shot}) ===")

    mt = toon_mat(); body.data.materials.clear(); body.data.materials.append(mt)
    bpy.context.view_layer.objects.active = body; bpy.ops.object.shade_smooth()
    add_ground(mt); add_lights()
    cam = add_camera(arm, body, a.shot, a.hand, a.angle)
    configure_freestyle()
    render_to(os.path.join(out, "ink_plate.png"), True, 1.0)
    body.data.materials.clear(); body.data.materials.append(grey_mat())
    render_to(os.path.join(out, "shaded_plate.png"), False, 0.55)          # shaded greyscale (form)
    body.data.materials.clear(); body.data.materials.append(skin_mat())
    render_to(os.path.join(out, "color_plate.png"), False, 0.85)           # shaded color

    near, far = subject_depth_range([body], cam)                           # auto-fit → real contour
    md = depth_mat(near, far)
    for o in bpy.data.objects:
        if o.type == 'MESH': o.data.materials.clear(); o.data.materials.append(md)
    render_to(os.path.join(out, "depth_plate.png"), False, 0.0)
    print(f"  depth range {near:.3f}–{far:.3f} m")

    body_kp, hands_kp = project_all(arm, cam, head_frame, a.hand)
    json.dump({"res": RES, "keypoints": body_kp, "hands": hands_kp},
              open(os.path.join(out, "keypoints.json"), "w"), indent=1)
    vis_h = sum(k[2] for k in hands_kp[a.hand])
    print(f"  body visible {sum(k[2] for k in body_kp)}/18 | hand({a.hand}) visible {vis_h}/21")
    print(f"=== {label} DONE ===")

main()
