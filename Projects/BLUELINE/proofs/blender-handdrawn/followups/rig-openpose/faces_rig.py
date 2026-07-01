"""
Figure Rig — FACES. Expressive faces guided by OpenPose. Expressions are applied to the
MPFB mesh via raw FACS units (offline; the ARKit-named targets aren't bundled), so the
face geometry deforms — and the face OpenPose is projected from mesh landmark verts
(eyes, brows, nose, mouth, jaw), so the drawn keypoints MOVE with the expression. That
plus the ink + depth renders (which also carry the expression) guide the gen-AI.

Run (NOT --factory-startup — disables MPFB):
  blender -b -P faces_rig.py -- --expression smile --gender 0.0 --age 0.5 --shot closeup --label smile_yw
Outputs -> renders/faces-rig/<label>/{ink_plate,depth_plate}.png + keypoints.json (with "face")
"""
import bpy, math, os, sys, json, argparse, mathutils
from mathutils import Vector

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_BASE = os.path.join(SCRIPT_DIR, "renders", "faces-rig")
RES = (832, 1040)
MPFB_MODULE = "bl_ext.user_default.mpfb"
UNITS_DIR = os.path.expanduser("~/Library/Application Support/Blender/5.1/extensions/user_default/mpfb/data/targets/expression/units/caucasian")

# expression → raw FACS units (unit, weight). Verified present in the caucasian unit pack.
EXPRESSIONS = {
    "neutral":   [],
    "smile":     [("mouth-corner-puller", 1.0), ("mouth-upward-retraction", 0.5)],
    "laugh":     [("mouth-corner-puller", 1.0), ("mouth-open", 0.45), ("mouth-upward-retraction", 0.6),
                  ("eye-left-slit", 0.35), ("eye-right-slit", 0.35)],
    "surprised": [("mouth-open", 0.8), ("eyebrows-left-up", 0.9), ("eyebrows-right-up", 0.9),
                  ("eye-left-opened-up", 0.65), ("eye-right-opened-up", 0.65)],
    "angry":     [("eyebrows-left-down", 0.95), ("eyebrows-right-down", 0.95),
                  ("nose-left-dilatation", 0.5), ("nose-right-dilatation", 0.5), ("mouth-compression", 0.6)],
    "sad":       [("mouth-depression", 0.9), ("eyebrows-left-inner-up", 0.75), ("eyebrows-right-inner-up", 0.75)],
    "fear":      [("mouth-open", 0.45), ("eyebrows-left-inner-up", 0.85), ("eyebrows-right-inner-up", 0.85),
                  ("eye-left-opened-up", 0.7), ("eye-right-opened-up", 0.7)],
    "disgust":   [("nose-left-elevation", 0.75), ("nose-right-elevation", 0.75),
                  ("mouth-upward-retraction", 0.45), ("eyebrows-left-down", 0.4), ("eyebrows-right-down", 0.4)],
}


def parse_args():
    argv = sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--expression", default="smile")
    p.add_argument("--gender", type=float, default=0.5)
    p.add_argument("--age", type=float, default=0.5)
    p.add_argument("--muscle", type=float, default=0.5)
    p.add_argument("--weight", type=float, default=0.5)
    p.add_argument("--height", type=float, default=0.5)
    p.add_argument("--shot", default="closeup", choices=["closeup", "medium", "full"])
    p.add_argument("--label", default=None)
    return p.parse_args(argv)


def enable_mpfb():
    import addon_utils
    addon_utils.enable(MPFB_MODULE, default_set=True, persistent=True)


def make_face(a):
    from bl_ext.user_default.mpfb.services.humanservice import HumanService
    from bl_ext.user_default.mpfb.services.targetservice import TargetService
    bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete()
    macro = {"gender": a.gender, "age": a.age, "muscle": a.muscle, "weight": a.weight,
             "proportions": 0.5, "height": a.height, "cupsize": 0.5, "firmness": 0.5,
             "race": {"asian": 0.33, "caucasian": 0.34, "african": 0.33}}
    bm = HumanService.create_human(macro_detail_dict=macro)
    for unit, w in EXPRESSIONS.get(a.expression, []):
        path = os.path.join(UNITS_DIR, unit + ".target.gz")
        if os.path.isfile(path):
            TargetService.load_target(bm, path, weight=w, name="!ex-" + unit)
        else:
            print("  MISSING unit", unit)
    bpy.context.view_layer.update()
    return bm


# ---- mesh-based face landmarks (move with the expression shape keys) -------------
def face_landmarks(bm):
    mw = bm.matrix_world
    V = bm.data.vertices

    def gverts(name):
        if name not in bm.vertex_groups:
            return []
        gi = bm.vertex_groups[name].index
        return [i for i, v in enumerate(V) if any(g.group == gi for g in v.groups)]

    def W(i):
        return mw @ V[i].co

    pts = []

    # eyes (6 each) + brows (5 each) + eye centers
    eye_centers = {}
    for side in ("l", "r"):
        ring = gverts(f"helper-{side}-eye")
        if not ring:
            continue
        c = sum((W(i) for i in ring), Vector()) / len(ring)
        eye_centers[side] = c
        ring.sort(key=lambda i: math.atan2(W(i).z - c.z, W(i).x - c.x))
        for k in range(6):
            pts.append(W(ring[k * len(ring) // 6]))
        # brows: a clean 4-point arc above the eye (computed, not scattered ring verts)
        xs = [W(i).x for i in ring]; xmin, xmax = min(xs), max(xs)
        for k in range(4):
            fx = xmin + (xmax - xmin) * k / 3.0
            arch = 0.015 + 0.004 * math.sin(math.pi * k / 3.0)
            pts.append(Vector((fx, c.y - 0.004, c.z + arch)))

    # pupils
    for side in ("l", "r"):
        if side in eye_centers:
            pts.append(eye_centers[side])

    face_c = sum(eye_centers.values(), Vector()) / len(eye_centers) if eye_centers else Vector((0, -0.14, 1.5))

    # nose: tip (most forward near midline below eyes) + bridge + nostrils
    head = [i for i in range(len(V)) if W(i).z < face_c.z + 0.02 and W(i).z > face_c.z - 0.14]
    mid = [i for i in head if abs(W(i).x) < 0.02]
    if mid:
        tip_i = min(mid, key=lambda i: W(i).y)
        tip = W(tip_i)
        for t in (0.25, 0.5, 0.75):
            pts.append(face_c.lerp(tip, t))
        pts.append(tip)
        # nostrils
        for sx in (0.018, -0.018):
            cand = [i for i in head if abs(W(i).x - sx) < 0.012 and W(i).z > tip.z - 0.02 and W(i).z < tip.z + 0.02]
            if cand:
                pts.append(W(min(cand, key=lambda i: W(i).y)))

    # mouth: outer lip contour from the `lips` group (moves with smile/frown)
    lips = gverts("lips")
    if lips:
        mc = sum((W(i) for i in lips), Vector()) / len(lips)
        bins = {}
        for i in lips:
            p = W(i)
            a = math.atan2(p.z - mc.z, p.x - mc.x)
            b = int((a + math.pi) / (2 * math.pi) * 16)
            r = (Vector((p.x, p.z)) - Vector((mc.x, mc.z))).length
            if b not in bins or r > bins[b][0]:
                bins[b] = (r, p)
        for b in sorted(bins):
            pts.append(bins[b][1])

    # jaw: chin + a few points up each side of the lower-face silhouette
    lower = [i for i in range(len(V)) if W(i).z < face_c.z - 0.03 and W(i).z > face_c.z - 0.18 and W(i).y < -0.02]
    if lower:
        chin = min(lower, key=lambda i: W(i).z)
        pts.append(W(chin))
        for sgn in (1, -1):
            side_v = [i for i in lower if (W(i).x * sgn) > 0.02]
            zlevels = sorted(set(round(W(i).z, 2) for i in side_v))
            for zl in zlevels[::max(1, len(zlevels)//4)][:4]:
                cand = [i for i in side_v if abs(W(i).z - zl) < 0.015]
                if cand:
                    pts.append(W(max(cand, key=lambda i: abs(W(i).x))))
    return pts


# ---- scene (reuse v3 look) ------------------------------------------------------
def eevee():
    items = [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items]
    for c in ('BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE'):
        if c in items:
            return c
    return items[0]

def set_world(v):
    w = bpy.data.worlds.new('W'); bpy.context.scene.world = w; w.use_nodes = True
    bg = w.node_tree.nodes.get('Background'); bg.inputs['Color'].default_value = (v, v, v, 1); bg.inputs['Strength'].default_value = 1

def toon_mat():
    m = bpy.data.materials.new("toon"); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    d = nt.nodes.new('ShaderNodeBsdfDiffuse'); d.inputs['Color'].default_value = (0.9, 0.9, 0.9, 1)
    s = nt.nodes.new('ShaderNodeShaderToRGB'); r = nt.nodes.new('ShaderNodeValToRGB'); r.color_ramp.interpolation = 'CONSTANT'
    e = r.color_ramp.elements; e[0].position = 0; e[0].color = (0.05, 0.05, 0.06, 1); e[1].position = 0.42; e[1].color = (0.96, 0.96, 0.96, 1)
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

def depth_mat():
    m = bpy.data.materials.new("depth"); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    cd = nt.nodes.new('ShaderNodeCameraData'); mr = nt.nodes.new('ShaderNodeMapRange')
    mr.inputs['From Min'].default_value = 0.2; mr.inputs['From Max'].default_value = 3.5
    mr.inputs['To Min'].default_value = 1.0; mr.inputs['To Max'].default_value = 0.0; mr.clamp = True
    em = nt.nodes.new('ShaderNodeEmission'); o = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(cd.outputs['View Z Depth'], mr.inputs['Value']); nt.links.new(mr.outputs['Result'], em.inputs['Color'])
    nt.links.new(em.outputs['Emission'], o.inputs['Surface'])
    return m

def add_lights():
    for nm, e, rot in (("Key", 4.0, (52, 12, -28)), ("Fill", 1.6, (60, 18, 55))):
        d = bpy.data.lights.new(nm, 'SUN'); d.energy = e
        o = bpy.data.objects.new(nm, d); bpy.context.collection.objects.link(o)
        o.rotation_euler = tuple(math.radians(a) for a in rot)

def configure_freestyle():
    sc = bpy.context.scene; sc.render.use_freestyle = True; sc.render.line_thickness_mode = 'ABSOLUTE'
    vl = sc.view_layers[0]; vl.use_freestyle = True; fs = vl.freestyle_settings
    if len(fs.linesets) == 0: fs.linesets.new('LS')
    ls = fs.linesets[0]; ls.linestyle = bpy.data.linestyles.new('Ink')
    for at, v in (('select_silhouette', True), ('select_border', True), ('select_crease', True), ('select_external_contour', True)):
        try: setattr(ls, at, v)
        except Exception: pass
    try: fs.crease_angle = math.radians(120)   # lower → catch face creases (smile lines, brow)
    except Exception: pass
    st = ls.linestyle; st.color = (0, 0, 0); st.thickness = 1.8; st.use_chaining = True

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


def add_camera(bm, face_c, shot):
    cd = bpy.data.cameras.new('Cam'); c = bpy.data.objects.new('Cam', cd)
    bpy.context.collection.objects.link(c); bpy.context.scene.camera = c
    if shot == "closeup":
        cd.lens = 80; dist = 0.42
        target = face_c
    elif shot == "medium":
        cd.lens = 55; dist = 1.1
        target = face_c - Vector((0, 0, 0.18))   # head + shoulders
    else:  # full
        cd.lens = 45
        dg = bpy.context.evaluated_depsgraph_get(); me = bm.evaluated_get(dg)
        zs = [(bm.matrix_world @ v.co).z for v in me.data.vertices]
        target = Vector((0, -0.05, (max(zs) + min(zs)) / 2)); dist = (max(zs) - min(zs)) * 1.9 * 1.05
    c.location = target + Vector((0.06, -1, 0.02)).normalized() * dist
    c.rotation_euler = (target - c.location).to_track_quat('-Z', 'Y').to_euler()
    return c, target


def main():
    a = parse_args()
    enable_mpfb()
    bm = make_face(a)
    bm.data.materials.clear(); bm.data.materials.append(toon_mat())
    bpy.context.view_layer.objects.active = bm; bpy.ops.object.shade_smooth()

    lms = face_landmarks(bm)
    face_c = sum(lms, Vector()) / len(lms) if lms else Vector((0, -0.12, 1.5))
    cam, target = add_camera(bm, face_c, a.shot)
    add_lights(); configure_freestyle()

    label = a.label or f"{a.expression}_{a.shot}"
    out = os.path.join(OUT_BASE, label); os.makedirs(out, exist_ok=True)
    print(f"=== FACE {label} ({a.expression}/{a.shot}) landmarks={len(lms)} ===")

    render_to(os.path.join(out, "ink_plate.png"), True, 1.0)              # 1) line art
    bm.data.materials.clear(); bm.data.materials.append(grey_mat())
    render_to(os.path.join(out, "shaded_plate.png"), False, 0.55)          # 2) shaded greyscale (form)
    bm.data.materials.clear(); bm.data.materials.append(skin_mat())
    render_to(os.path.join(out, "color_plate.png"), False, 0.85)           # 3) shaded color
    md = depth_mat()
    for o in bpy.data.objects:
        if o.type == 'MESH': o.data.materials.clear(); o.data.materials.append(md)
    render_to(os.path.join(out, "depth_plate.png"), False, 0.0)            # 4) depth

    from bpy_extras.object_utils import world_to_camera_view
    sc = bpy.context.scene
    face_kp = []
    for p in lms:
        co = world_to_camera_view(sc, cam, p)
        face_kp.append([round(co.x, 5), round(1.0 - co.y, 5), 1 if co.z > 0 else 0])
    json.dump({"res": RES, "keypoints": [[0, 0, 0]] * 18, "face": face_kp},
              open(os.path.join(out, "keypoints.json"), "w"), indent=1)
    print(f"  face pts {sum(k[2] for k in face_kp)}/{len(face_kp)} visible")
    print(f"=== {label} DONE ===")


main()
