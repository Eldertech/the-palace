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
# Real CC0 MakeHuman low-poly eyes (iris/sclera), committed under assets/ (the mhclo references
# ../materials/brown.mhmat). MHCLO fitting seats them in each subject's socket and tracks the head.
MHCLO_EYES = os.path.join(SCRIPT_DIR, "assets", "eyes", "low-poly.mhclo")

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
    p.add_argument("--gaze", default="0,0", help="eye-target offset 'x,z' (right,up); 0,0 = look forward")
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
def eval_coords(bm):
    """World coords of every vertex on the EVALUATED mesh (shape keys applied), indexed by the
    original vertex index. The macro (gender/age/build) lives in shape keys — it is invisible in
    bm.data.vertices, so reading rest coords put a child's eyes at adult height. The MASK modifier
    is disabled while sampling so the index order is preserved."""
    masks = [m for m in bm.modifiers if m.type == 'MASK']
    prev = [(m, m.show_viewport) for m in masks]
    for m in masks:
        m.show_viewport = False
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    ev = bm.evaluated_get(dg)
    mw = bm.matrix_world
    coords = [mw @ v.co for v in ev.data.vertices]
    for m, s in prev:
        m.show_viewport = s
    bpy.context.view_layer.update()
    return coords

def face_landmarks(bm, EV):
    V = bm.data.vertices

    def gverts(name):
        if name not in bm.vertex_groups:
            return []
        gi = bm.vertex_groups[name].index
        return [i for i, v in enumerate(V) if any(g.group == gi for g in v.groups)]

    def W(i):
        return EV[i]

    pts = []

    # eyes (6 each) + brows (5 each) + eye centers
    eye_centers = {}
    for side in ("l", "r"):
        ring = gverts(f"helper-{side}-eye")
        if not ring:
            continue
        c = sum((W(i) for i in ring), Vector()) / len(ring)
        eye_centers[side] = c
        # eye contour: 6 points sampled from the inner rim (filter to the tightest ring,
        # so lashes/socket verts don't scatter the contour)
        rr = sorted((W(i) - c).length for i in ring)
        rmax = rr[int(len(rr) * 0.55)]                      # inner 55% = the lid rim
        rim = [i for i in ring if (W(i) - c).length <= rmax] or ring
        rim.sort(key=lambda i: math.atan2(W(i).z - c.z, W(i).x - c.x))
        for k in range(6):
            pts.append(W(rim[k * len(rim) // 6]))
        # brows: REAL brow-ridge verts above the eye — they deform with the FACS brow units,
        # so angry (down) / surprised (up) actually move the drawn brow points.
        brow = [i for i in range(len(V))
                if c.z + 0.007 < W(i).z < c.z + 0.032 and abs(W(i).x - c.x) < 0.038
                and c.y - 0.055 < W(i).y < c.y + 0.02]
        brow.sort(key=lambda i: W(i).x)
        for k in range(5):
            if brow:
                pts.append(W(brow[min(k * len(brow) // 5, len(brow) - 1)]))

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

    # jaw: chin + 3 silhouette points up each side (clean, even z-sampling)
    lower = [i for i in range(len(V)) if face_c.z - 0.19 < W(i).z < face_c.z - 0.04 and W(i).y < -0.015]
    if lower:
        chin = W(min(lower, key=lambda i: W(i).z)); pts.append(chin)
        ztop = face_c.z - 0.05
        for sgn in (1, -1):
            side_v = [i for i in lower if W(i).x * sgn > 0.02]
            for t in (0.3, 0.6, 0.9):
                zl = chin.z + (ztop - chin.z) * t
                cand = [i for i in side_v if abs(W(i).z - zl) < 0.02]
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

def add_real_eyes(bm, gaze=(0.0, 0.0)):
    """Real CC0 MakeHuman low-poly eyes (sclera + iris/pupil), attached by MHCLO fitting so they
    seat in each subject's socket and TRACK THE HEAD across body macros — no offset-hacking (the
    old proxy spheres drifted for non-reference heads). Split into L/R and aimed at a gaze-target
    empty via Damped Track, so gaze (and vergence = focus) is directable: `gaze=(x,z)` moves the
    target right/up; (0,0) looks straight ahead. Eyes are separate objects, so they keep their
    iris material through the ink/shaded/color passes while only the face mesh swaps material."""
    from bl_ext.user_default.mpfb.services.humanservice import HumanService
    if not os.path.isfile(MHCLO_EYES):
        print("  WARN: MHCLO eyes not found at", MHCLO_EYES, "— no eyes added")
        return []
    eyes = HumanService.add_mhclo_asset(MHCLO_EYES, bm, asset_type="Eyes",
                                        set_up_rigging=False, import_weights=False, import_subrig=False)
    if not eyes:
        print("  WARN: add_mhclo_asset returned no eyes")
        return []
    bpy.context.view_layer.update()
    # split the single eyes mesh into the two eyeballs (they're disconnected → loose parts)
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
    centers = [center(o) for o in eye_objs] or [Vector((0, -0.11, 1.5))]
    mid = sum(centers, Vector()) / len(centers)

    # gaze target 0.6 m in front (−Y) of the eyes; offset by (x=right, z=up)
    tgt = bpy.data.objects.new("eye_target", None)
    tgt.empty_display_type = 'PLAIN_AXES'; tgt.empty_display_size = 0.03
    tgt.location = mid + Vector((gaze[0], -0.6, gaze[1]))
    bpy.context.collection.objects.link(tgt)
    # The MHCLO eyeball gives the correct per-subject sclera position/size; we give it a plain
    # white EEVEE material (the MakeHuman litsphere material renders black in EEVEE) and add a
    # dark iris+pupil disk on the cornea. Each eyeball's origin is re-centred first so the Damped
    # Track rotates it about its own centre (gaze), and the iris is parented so it tracks with it.
    def white_mat():
        m = bpy.data.materials.new("sclera"); m.use_nodes = True
        b = m.node_tree.nodes.get("Principled BSDF")
        if b:
            b.inputs["Base Color"].default_value = (0.93, 0.93, 0.91, 1)
            if "Roughness" in b.inputs: b.inputs["Roughness"].default_value = 0.4
        return m
    made = []
    for o in eye_objs:
        o.name = "eye_" + ("l" if center(o).x >= 0 else "r")
        o.data.materials.clear(); o.data.materials.append(white_mat())
        bpy.ops.object.select_all(action='DESELECT'); o.select_set(True)
        bpy.context.view_layer.objects.active = o
        bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')   # spin about eye centre
        bpy.ops.object.shade_smooth()
        bb = [o.matrix_world @ Vector(c) for c in o.bound_box]
        r = (max(p.x for p in bb) - min(p.x for p in bb)) / 2 or 0.012
        # The MPFB base mesh's eyelids don't drape over the eyeball, so a full-size sphere reads as
        # a bulging ball (verified in profile). Recess it into the socket (+Y = into the head) and
        # shrink slightly so it seats like a real eye. Tied to r → scales with the head.
        o.matrix_world = mathutils.Matrix.Translation(Vector((0, r * 0.42, 0))) @ o.matrix_world
        o.scale *= 0.88; bpy.context.view_layer.update()
        r *= 0.88; ec = o.matrix_world.translation
        # iris+pupil: a dark sphere on the cornea (−Y front), parented so gaze carries it
        bpy.ops.mesh.primitive_uv_sphere_add(radius=r * 0.46, location=ec + Vector((0, -r * 0.80, 0)))
        iris = bpy.context.active_object; iris.name = "iris_" + o.name[-1]
        mi = bpy.data.materials.new("iris"); mi.use_nodes = True
        bi = mi.node_tree.nodes.get("Principled BSDF")
        if bi: bi.inputs["Base Color"].default_value = (0.10, 0.07, 0.05, 1)   # dark brown, reads as iris+pupil
        iris.data.materials.append(mi); bpy.ops.object.shade_smooth()
        iris.parent = o; iris.matrix_parent_inverse = o.matrix_world.inverted()
        c = o.constraints.new('DAMPED_TRACK'); c.target = tgt; c.track_axis = 'TRACK_NEGATIVE_Y'
        made += [o, iris]
    print(f"  real eyes: {len(eye_objs)} eyeball(s) + iris + gaze target at offset {gaze}")
    return made + [tgt]

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
    """Near/far (camera View-Z) over only the verts INSIDE the camera frame — so the depth plate
    spends its full black→white range on what's actually shown (a closeup head), not the whole
    body (feet, back of skull) that left the face one flat grey. Uses evaluated meshes so the
    macro-shifted geometry is measured. Returns padded (near, far)."""
    from bpy_extras.object_utils import world_to_camera_view
    sc = bpy.context.scene
    deps = bpy.context.evaluated_depsgraph_get()
    inv = cam.matrix_world.inverted(); zs = []
    for o in objs:
        if o.type != 'MESH':
            continue
        me = o.evaluated_get(deps); mw = o.matrix_world
        for v in me.data.vertices:
            wp = mw @ v.co
            co = world_to_camera_view(sc, cam, wp)
            if -0.03 <= co.x <= 1.03 and -0.03 <= co.y <= 1.03 and co.z > 0:   # in (padded) frame
                zs.append(-(inv @ wp).z)
    if len(zs) < 8:
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


def add_camera(bm, face_c, shot, EV):
    cd = bpy.data.cameras.new('Cam'); c = bpy.data.objects.new('Cam', cd)
    bpy.context.collection.objects.link(c); bpy.context.scene.camera = c
    # Everything reads the EVALUATED mesh (EV) so the macro (child = small head) is reflected.
    V = bm.data.vertices
    def gcent(n):
        if n not in bm.vertex_groups: return None
        gi = bm.vertex_groups[n].index
        P = [EV[i] for i, v in enumerate(V) if any(g.group == gi for g in v.groups)]
        return sum(P, Vector()) / len(P) if P else None
    el = gcent("helper-l-eye"); er = gcent("helper-r-eye")
    eye_c = (el + er) / 2 if (el and er) else face_c
    # Head bounding box from the mesh: verts near the crown, narrow in X (excludes shoulders) →
    # robust head height for any subject. Fit that height in frame at the lens FOV.
    P = EV
    crown = max(p.z for p in P)
    head = [p for p in P if p.z > crown - 0.30 and abs(p.x - eye_c.x) < 0.13]
    hz = [p.z for p in head]; head_h = (max(hz) - min(hz)) or 0.24
    head_cz = (max(hz) + min(hz)) / 2
    import math as _m
    def fit_dist(height_m, margin=1.25):
        fov = 2 * _m.atan(0.5 * cd.sensor_width / cd.lens)
        return (height_m * margin) / (2 * _m.tan(fov / 2))
    if shot == "closeup":
        cd.lens = 80
        target = Vector((eye_c.x, eye_c.y, eye_c.z - head_h * 0.18))  # eyes-to-mouth centre
        dist = fit_dist(head_h * 0.72)                                # tight on the face
    elif shot == "medium":
        cd.lens = 60
        target = Vector((eye_c.x, eye_c.y, head_cz - head_h * 0.9))   # head + shoulders
        dist = fit_dist(head_h * 2.4)
    else:  # full
        cd.lens = 45
        zs = [p.z for p in P]
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
    EV = eval_coords(bm)                               # macro-applied (evaluated) world coords
    try:
        gx, gz = (float(v) for v in a.gaze.split(","))
    except Exception:
        gx, gz = 0.0, 0.0
    add_real_eyes(bm, (gx, gz))                         # real MHCLO eyes, head-tracking + gaze

    lms = face_landmarks(bm, EV)
    face_c = sum(lms, Vector()) / len(lms) if lms else Vector((0, -0.12, 1.5))
    cam, target = add_camera(bm, face_c, a.shot, EV)
    add_lights(); configure_freestyle()

    label = a.label or f"{a.expression}_{a.shot}"
    out = os.path.join(OUT_BASE, label); os.makedirs(out, exist_ok=True)
    print(f"=== FACE {label} ({a.expression}/{a.shot}) landmarks={len(lms)} ===")

    render_to(os.path.join(out, "ink_plate.png"), True, 1.0)              # 1) line art
    bm.data.materials.clear(); bm.data.materials.append(grey_mat())
    render_to(os.path.join(out, "shaded_plate.png"), False, 0.55)          # 2) shaded greyscale (form)
    bm.data.materials.clear(); bm.data.materials.append(skin_mat())
    render_to(os.path.join(out, "color_plate.png"), False, 0.85)           # 3) shaded color
    subj = [o for o in bpy.data.objects if o.type == 'MESH']
    near, far = subject_depth_range(subj, cam)
    md = depth_mat(near, far)                                              # auto-fit → real contour
    for o in subj:
        o.data.materials.clear(); o.data.materials.append(md)
    render_to(os.path.join(out, "depth_plate.png"), False, 0.0)            # 4) depth
    print(f"  depth range {near:.3f}–{far:.3f} m")

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
