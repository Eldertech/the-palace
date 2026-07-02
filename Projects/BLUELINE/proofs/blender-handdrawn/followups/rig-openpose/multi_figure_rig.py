"""
Figure Rig — MULTI-FIGURE staging. Place N MPFB humans in ONE scene, pose each, frame the group
with one shared camera, and emit the conditioning stack for a whole scene:

  ink_plate.png     Freestyle line over the group
  shaded_plate.png  greyscale form (feeds canny)
  depth_plate.png   near=white, over the whole in-frame group (who is in front)
  colorid_plate.png FLAT per-figure color-ID (each figure a distinct hue, bg black)  <- §2 separation
  keypoints.json    {res, figures:[{body:18, hands:{...}} ...]}  -> multi-skeleton OpenPose

The color-ID pass is the multi-figure payoff: it tells the model "these pixels are person A, those
are person B" so intertwined figures don't melt into one. Body poses are authored as real geometry
so contact (a reach, a cradle, a lift) is true, not a prompt guess.

Run (NOT --factory-startup — disables MPFB):
  blender -b -P multi_figure_rig.py -- --scene B2_one_turns
Outputs -> renders/multi/<scene>/
"""
import bpy, math, os, sys, json, mathutils
from types import SimpleNamespace

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, SCRIPT_DIR)
import hands_rig as HR   # reuse human/pose/materials/lights/freestyle/depth/projection

OUT_BASE = os.path.join(SCRIPT_DIR, "renders", "multi")
RES = (1216, 832)  # widescreen — scenes are wider than the single-figure portrait

# per-figure flat color-ID palette (distinct hues; bg stays black)
IDPAL = [(0.85, 0.12, 0.12), (0.12, 0.45, 0.85), (0.15, 0.75, 0.30), (0.85, 0.65, 0.10),
         (0.65, 0.20, 0.75), (0.20, 0.75, 0.75), (0.85, 0.40, 0.15), (0.45, 0.45, 0.85)]

MACRO_DEFAULT = dict(gender=0.5, age=0.5, muscle=0.5, weight=0.5, height=0.55)

# ---- body pose library (euler deg on the default rig; extend per beat) ------------
def relax_arms(side_both=True):
    """Bring the A-pose arms down along the body (crowd default)."""
    d = {"upperarm01.L": [0, 0, -62], "lowerarm01.L": [0, 0, -12],
         "upperarm01.R": [0, 0, 62],  "lowerarm01.R": [0, 0, 12]}
    return d

REACH_IN = {"upperarm01.L": [72, 0, -32], "lowerarm01.L": [-42, 0, -8],
            "upperarm01.R": [72, 0, 32],  "lowerarm01.R": [-42, 0, 8]}    # both arms forward+down toward centre

def body_pose(name):
    if name == "stand":
        return relax_arms()
    if name == "stand_hands_pocket":
        d = relax_arms(); d.update({"lowerarm01.L": [-40, 0, -20], "lowerarm01.R": [-40, 0, 20]}); return d
    if name == "bend_over":      # lean over the fallen and reach a hand down
        d = relax_arms(); d.update({"spine01": [34, 0, 0], "spine02": [16, 0, 0]}); d.update(REACH_DOWN_R); return d
    if name == "cradle":         # crouch forward, both forearms forward to gather a body up
        d = relax_arms(); d.update({"spine01": [22, 0, 0]}); d.update(CRADLE); return d
    if name == "reach_in":       # bend in and reach both arms toward the centre (crowd, many hands)
        d = relax_arms(); d.update({"spine01": [20, 0, 0]}); d.update(REACH_IN); return d
    if name == "support_up":     # arms raised overhead to hold a body aloft
        d = dict(ARMS_UP); return d
    return {}

# ---- scenes -----------------------------------------------------------------------
# figure spec: pos=(x,y,z) rot=Z-deg tilt=X-deg(lie) pose=<lib> macro hand=<finger_pose> present=<extra pose>
def _f(pos, rot, pose="stand", macro=None, hand=None, present=None, tilt=0.0):
    return dict(pos=pos, rot=rot, pose=pose, macro=macro or {}, hand=hand, present=present, tilt=tilt)

# arm gestures (euler deg on the default rig) — approximate, tuned by render-inspect
POINT_R = {"upperarm01.R": [18, 0, 40], "lowerarm01.R": [-8, 0, 5]}     # right arm thrust out to point
REACH_DOWN_R = {"upperarm01.R": [45, 0, 30], "lowerarm01.R": [-15, 0, 8]}  # kneeling reach toward the ground
CRADLE = {"upperarm01.L": [78, 0, -14], "lowerarm01.L": [-55, 0, -8],
          "upperarm01.R": [78, 0, 14],  "lowerarm01.R": [-55, 0, 8]}     # both arms forward + up, cradling a body
ARMS_UP = {"upperarm01.L": [0, 0, -150], "upperarm01.R": [0, 0, 150],
           "lowerarm01.L": [-20, 0, 0],  "lowerarm01.R": [-20, 0, 0]}    # lifted figure, arms open overhead

SCENES = {
    # B2 — "one turns": a crowd with backs to camera streaming past, one figure turned to face us.
    # Provable with placement + root rotation alone (no kneel/lie) — the pipeline smoke test.
    "B2_one_turns": [
        _f((-1.30, 1.6, 0), 168, macro=dict(gender=0.9, height=0.6)),
        _f((-0.35, 2.1, 0), 190, macro=dict(gender=0.1, height=0.5)),
        _f(( 0.75, 1.7, 0), 172, macro=dict(gender=0.85, height=0.58)),
        _f(( 1.70, 2.3, 0), 195, macro=dict(gender=0.15, height=0.52)),
        _f(( 0.15, 0.2, 0),   6, macro=dict(gender=0.2, height=0.53)),   # the one who turns (faces camera)
    ],

    # B1 — "alone in the crowd": a figure fallen on the pavement, the crowd streaming past, not seeing.
    "B1_alone": [
        _f((0.0, 0.4, 0.12), 92, tilt=90, macro=dict(gender=0.15, height=0.52)),   # the fallen one (lying)
        _f((-1.5, 1.8, 0), 168, macro=dict(gender=0.9, height=0.6)),
        _f((-0.6, 2.4, 0), 178, macro=dict(gender=0.1, height=0.5)),
        _f(( 1.2, 1.9, 0), 190, macro=dict(gender=0.85, height=0.58)),
        _f(( 2.0, 2.6, 0), 172, macro=dict(gender=0.2, height=0.55)),
    ],

    # A2 (BLUELINE) — hero elevated, arm thrust out pointing at a sparse frightened crowd below/ahead.
    "A2_hero_points": [
        _f((0.0, 2.2, 0.45), 8, present=POINT_R, hand="point", macro=dict(gender=0.85, muscle=0.75, height=0.66)),  # hero, raised
        _f((-1.4, 0.5, 0), 20, macro=dict(gender=0.1, height=0.5)),     # crowd, closer + smaller, facing hero
        _f((-0.5, 0.9, 0), -12, macro=dict(gender=0.2, height=0.52)),
        _f(( 0.7, 0.6, 0), 8, macro=dict(gender=0.85, height=0.55)),
        _f(( 1.6, 1.0, 0), -18, macro=dict(gender=0.15, height=0.5)),
    ],

    # B3 — "the reach": one passerby leans over the fallen one and extends a hand down.
    "B3_reach": [
        _f((0.35, 0.7, 0.12), 92, tilt=90, macro=dict(gender=0.15, height=0.52)),   # the fallen one (lying)
        _f((-0.55, 0.6, 0), 60, pose="bend_over", hand="open", macro=dict(gender=0.2, height=0.55)),  # the reacher
        _f((-1.7, 2.0, 0), 172, macro=dict(gender=0.9, height=0.6)),                # crowd still passing
        _f(( 1.6, 2.1, 0), 184, macro=dict(gender=0.85, height=0.58)),
    ],

    # B4 — "the cradle": the passerby gathers the fallen one up, arms underneath, heads close.
    "B4_cradle": [
        _f((0.05, 0.85, 0.62), 35, tilt=40, macro=dict(gender=0.15, height=0.5)),   # fallen, half-upright in the arms
        _f((-0.15, 0.75, 0), 30, pose="cradle", macro=dict(gender=0.25, height=0.6)),  # the cradler, arms forward+up
        _f((-1.9, 2.2, 0), 170, macro=dict(gender=0.9, height=0.6)),
        _f(( 1.8, 2.3, 0), 188, macro=dict(gender=0.15, height=0.55)),
    ],

    # B5 — "many hands": a ring of people stop and reach in, many hands going under the body.
    "B5_many_hands": [
        _f((0.0, 1.1, 0.35), 90, tilt=90, macro=dict(gender=0.15, height=0.5)),     # the body, low, centre
        _f((-1.3, 0.7, 0), 45, pose="reach_in", macro=dict(gender=0.2, height=0.55)),
        _f((-0.6, 0.3, 0), 18, pose="reach_in", macro=dict(gender=0.85, height=0.6)),
        _f(( 0.6, 0.3, 0), -18, pose="reach_in", macro=dict(gender=0.15, height=0.53)),
        _f(( 1.3, 0.7, 0), -45, pose="reach_in", macro=dict(gender=0.8, height=0.58)),
        _f(( 0.0, 2.0, 0), 8, pose="reach_in", macro=dict(gender=0.3, height=0.56)),
    ],

    # B6 — "held up": the fallen one raised overhead on many hands, arms open, above the crowd.
    "B6_held_up": [
        _f((0.0, 1.2, 1.18), 90, tilt=90, pose="support_up", macro=dict(gender=0.15, height=0.52)),  # lifted, arms open
        _f((-1.3, 0.9, 0), 12, pose="support_up", macro=dict(gender=0.2, height=0.55)),
        _f((-0.5, 0.6, 0), 6, pose="support_up", macro=dict(gender=0.85, height=0.6)),
        _f(( 0.5, 0.6, 0), -6, pose="support_up", macro=dict(gender=0.15, height=0.53)),
        _f(( 1.3, 0.9, 0), -12, pose="support_up", macro=dict(gender=0.8, height=0.58)),
    ],
}


def make_figure(spec, idx):
    a = SimpleNamespace(**{**MACRO_DEFAULT, **spec["macro"]})
    body, arm = HR.make_human(a)
    arm.display_type = 'WIRE'
    # place: rotate about Z (facing) + translate. move the mesh too if it is not parented to the arm.
    rot_e = (math.radians(spec.get("tilt", 0.0)), 0, math.radians(spec["rot"]))   # tilt X (lie) + face Z
    arm.rotation_mode = 'XYZ'; arm.rotation_euler = rot_e
    arm.location = mathutils.Vector(spec["pos"])
    if body.parent is not arm:
        body.rotation_mode = 'XYZ'; body.rotation_euler = rot_e
        body.location = mathutils.Vector(spec["pos"])
    bpy.context.view_layer.update()
    head_frame = HR.capture_head_frame(arm)
    pose = body_pose(spec["pose"])
    if spec["present"]:
        pose.update(spec["present"])
    if spec["hand"]:
        pose.update(HR.finger_pose(spec["hand"], "R"))
    HR.apply_pose(arm, pose)
    return body, arm, head_frame


def group_bounds(bodies):
    dg = bpy.context.evaluated_depsgraph_get()
    pts = []
    for b in bodies:
        me = b.evaluated_get(dg); mw = b.matrix_world
        for v in me.data.vertices:
            pts.append(mw @ v.co)
    xs = [p.x for p in pts]; ys = [p.y for p in pts]; zs = [p.z for p in pts]
    center = mathutils.Vector(((min(xs)+max(xs))/2, (min(ys)+max(ys))/2, (min(zs)+max(zs))/2))
    return center, (max(xs)-min(xs), max(ys)-min(ys), max(zs)-min(zs))


def add_group_camera(bodies):
    cd = bpy.data.cameras.new('Cam'); c = bpy.data.objects.new('Cam', cd)
    bpy.context.collection.objects.link(c); bpy.context.scene.camera = c
    cd.lens = 40
    center, (dx, dy, dz) = group_bounds(bodies)
    aspect = RES[0] / RES[1]
    extent = max(dx / aspect, dz) * 1.32                     # fit width (scaled by aspect) or height, w/ margin
    dist = extent * 1.9
    eye = mathutils.Vector((center.x, center.y - dist, center.z + 0.05))
    c.location = eye
    c.rotation_euler = (center - eye).to_track_quat('-Z', 'Y').to_euler()
    return c


def project_body(arm, cam, head_frame):
    body_kp, _ = HR.project_all(arm, cam, head_frame, "R")
    return body_kp


def main():
    argv = sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
    import argparse
    ap = argparse.ArgumentParser(); ap.add_argument("--scene", default="B2_one_turns")
    a = ap.parse_args(argv)
    specs = SCENES[a.scene]

    HR.enable_mpfb(); HR.clear_scene()
    figs = []
    for i, spec in enumerate(specs):
        figs.append((spec, *make_figure(spec, i)))   # (spec, body, arm, head_frame)
    bodies = [f[1] for f in figs]

    out = os.path.join(OUT_BASE, a.scene); os.makedirs(out, exist_ok=True)
    print(f"=== MULTI {a.scene} : {len(figs)} figures ===")

    HR.add_ground(HR.grey_mat()); HR.add_lights()
    cam = add_group_camera(bodies)

    # INK — freestyle over toon-shaded group
    mt = HR.toon_mat()
    for b in bodies:
        b.data.materials.clear(); b.data.materials.append(mt)
        bpy.context.view_layer.objects.active = b; bpy.ops.object.shade_smooth()
    HR.configure_freestyle()
    HR.render_to(os.path.join(out, "ink_plate.png"), True, 1.0)

    # SHADED greyscale (form -> canny)
    for b in bodies: b.data.materials.clear(); b.data.materials.append(HR.grey_mat())
    HR.render_to(os.path.join(out, "shaded_plate.png"), False, 0.55)

    # COLOR-ID — each figure a distinct flat hue (bg black)
    for i, b in enumerate(bodies):
        b.data.materials.clear()
        b.data.materials.append(_flat_emit(f"id{i}", IDPAL[i % len(IDPAL)]))
    HR.render_to(os.path.join(out, "colorid_plate.png"), False, 0.0)

    # DEPTH — near/far over the whole in-frame group
    near, far = HR.subject_depth_range(bodies, cam)
    md = HR.depth_mat(near, far)
    for o in bpy.data.objects:
        if o.type == 'MESH': o.data.materials.clear(); o.data.materials.append(md)
    HR.render_to(os.path.join(out, "depth_plate.png"), False, 0.0)
    print(f"  depth range {near:.3f}-{far:.3f} m")

    # KEYPOINTS — per-figure body (18) [+ hands if posed]
    figures_kp = []
    for spec, body, arm, hf in figs:
        body_kp, hands_kp = HR.project_all(arm, cam, hf, "R")
        entry = {"body": body_kp}
        if spec["hand"]:
            entry["hands"] = hands_kp
        figures_kp.append(entry)
    json.dump({"res": list(RES), "figures": figures_kp},
              open(os.path.join(out, "keypoints.json"), "w"), indent=1)
    vis = [sum(k[2] for k in fk["body"]) for fk in figures_kp]
    print(f"  body-visible per figure: {vis}")
    print(f"=== {a.scene} DONE ===")


def _flat_emit(name, rgb):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    em = nt.nodes.new('ShaderNodeEmission'); o = nt.nodes.new('ShaderNodeOutputMaterial')
    em.inputs['Color'].default_value = (*rgb, 1.0)
    nt.links.new(em.outputs['Emission'], o.inputs['Surface'])
    return m


main()
