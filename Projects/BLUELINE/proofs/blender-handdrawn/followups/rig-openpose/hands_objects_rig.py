"""
Figure Rig — HANDS + OBJECTS (proxy geometry). Extends hands_rig.py: instead of leaving the
held object to the prompt, drop a greybox PROXY into the grip so the hand wraps real form, and
render the proxy into every conditioning pass. This is §5 of the conditioning-stack note:
"give the model the form, don't hope the prompt invents it."

Proxies (simple primitives — position/scale/occlusion/contact, not surface):
  glass  -> vertical cylinder standing through the grip
  snake  -> torus threaded through the curled fingers (reads as a coil)
  flower -> thin stem cylinder + a flat disk head, held in the pinch

Passes emitted per object (all one shared camera, like the rest of the rig):
  ink_plate.png    Freestyle line (proxy silhouette included)
  shaded_plate.png greyscale form  (proxy = grey)         -> feeds canny
  depth_plate.png  near=white      (proxy included in the range)
  colorid_plate.png FLAT color-ID  (body = red, proxy = cyan, bg = black)  -> §2 separation channel
  keypoints.json   hand(21)+body(18) OpenPose (unchanged — proxy has no skeleton)

Run (NOT --factory-startup — disables MPFB):
  blender -b -P hands_objects_rig.py -- --object glass --label glass_proxy_closeup
Outputs -> renders/hands-objects/<label>/
"""
import bpy, math, os, sys, json, mathutils

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, SCRIPT_DIR)
import hands_rig as HR   # reuse the proven human/pose/camera/plate machinery

OUT_BASE = os.path.join(SCRIPT_DIR, "renders", "hands-objects")
RES = HR.RES

# object -> (grip finger-pose, proxy kind, per-object placement tweaks)
OBJECTS = {
    "glass":  {"pose": "grip",  "proxy": "cylinder", "radius": 0.032, "length": 0.150,
               "along": 0.02, "outward": 0.030},
    "snake":  {"pose": "grip",  "proxy": "torus",    "radius": 0.055, "thick": 0.014,
               "along": 0.00, "outward": 0.028},
    "flower": {"pose": "pinch", "proxy": "flower",   "radius": 0.006, "length": 0.170,
               "head": 0.030, "along": 0.03, "outward": 0.045},
}


def parse_args():
    argv = sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument("--object", default="glass", choices=list(OBJECTS.keys()))
    p.add_argument("--shot", default="closeup", choices=["closeup", "medium", "full"])
    p.add_argument("--hand", default="R")
    p.add_argument("--angle", type=float, default=0.0)
    p.add_argument("--label", default=None)
    p.add_argument("--gender", type=float, default=0.5)
    p.add_argument("--age", type=float, default=0.5)
    p.add_argument("--muscle", type=float, default=0.5)
    p.add_argument("--weight", type=float, default=0.5)
    p.add_argument("--height", type=float, default=0.55)
    return p.parse_args(argv)


def grip_frame(arm, hand):
    """Palm centre + a hand-local basis, from the bones — where the proxy sits and how it orients."""
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get(); ae = arm.evaluated_get(dg); mw = ae.matrix_world

    def hh(n): return mw @ ae.pose.bones[n].head

    wrist = hh(f"wrist.{hand}")
    knuckles = [hh(f"finger{f}-1.{hand}") for f in range(2, 6)]
    palm = sum(knuckles, mathutils.Vector((0, 0, 0))) / len(knuckles)
    up = (hh(f"finger3-1.{hand}") - wrist).normalized()            # along the hand (wrist->mid knuckle)
    idx = hh(f"finger2-1.{hand}"); pky = hh(f"finger5-1.{hand}")
    normal = (idx - wrist).cross(pky - wrist)                      # palm normal
    if normal.length < 1e-6: normal = mathutils.Vector((0, -1, 0))
    normal.normalize()
    if normal.y > 0: normal = -normal                             # face world-front (camera side)
    return palm, up, normal


def add_proxy(kind, spec, palm, up, normal):
    """Create the primitive and seat it in the grip. Returns the object."""
    center = palm + up * spec.get("along", 0.0) + normal * spec.get("outward", 0.0)
    # a rotation whose Z axis = `up` (so cylinders/stems stand along the hand)
    z = up.normalized(); x = normal.cross(z).normalized(); y = z.cross(x).normalized()
    basis = mathutils.Matrix((x, y, z)).transposed()
    rot = basis.to_euler()

    if kind == "cylinder":
        bpy.ops.mesh.primitive_cylinder_add(radius=spec["radius"], depth=spec["length"], location=center)
        ob = bpy.context.active_object; ob.rotation_euler = rot
    elif kind == "torus":
        bpy.ops.mesh.primitive_torus_add(major_radius=spec["radius"], minor_radius=spec["thick"], location=center)
        ob = bpy.context.active_object
        ob.rotation_euler = (mathutils.Matrix((x, y, z)).transposed() @
                             mathutils.Matrix.Rotation(math.radians(90), 3, 'X')).to_euler()  # thread through fingers
    elif kind == "flower":
        bpy.ops.mesh.primitive_cylinder_add(radius=spec["radius"], depth=spec["length"], location=center)
        stem = bpy.context.active_object; stem.rotation_euler = rot
        head_c = center + z * (spec["length"] / 2)
        bpy.ops.mesh.primitive_cylinder_add(radius=spec["head"], depth=0.010, location=head_c)
        head = bpy.context.active_object; head.rotation_euler = rot
        # join head into stem so it is one proxy object
        bpy.ops.object.select_all(action='DESELECT')
        head.select_set(True); stem.select_set(True)
        bpy.context.view_layer.objects.active = stem
        bpy.ops.object.join()
        ob = stem
    else:
        raise ValueError(kind)
    ob.name = "PROXY"
    bpy.ops.object.shade_smooth()
    return ob


def flat_emit(name, rgb):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    em = nt.nodes.new('ShaderNodeEmission'); o = nt.nodes.new('ShaderNodeOutputMaterial')
    em.inputs['Color'].default_value = (*rgb, 1.0)
    nt.links.new(em.outputs['Emission'], o.inputs['Surface'])
    return m


def main():
    a = parse_args()
    spec = OBJECTS[a.object]
    HR.enable_mpfb(); HR.clear_scene()
    body, arm = HR.make_human(a); arm.display_type = 'WIRE'
    head_frame = HR.capture_head_frame(arm)
    pose = dict(HR.ARM_PRESENT); pose.update(HR.finger_pose(spec["pose"], a.hand))
    HR.apply_pose(arm, pose)

    palm, up, normal = grip_frame(arm, a.hand)
    proxy = add_proxy(spec["proxy"], spec, palm, up, normal)

    label = a.label or f"{a.object}_proxy_{a.shot}"
    out = os.path.join(OUT_BASE, label); os.makedirs(out, exist_ok=True)
    print(f"=== HAND+OBJECT {label} ({a.object}/{spec['proxy']}) ===")

    # INK (Freestyle) — body toon + proxy toon so the line wraps both
    mt = HR.toon_mat(); body.data.materials.clear(); body.data.materials.append(mt)
    proxy.data.materials.clear(); proxy.data.materials.append(mt)
    bpy.context.view_layer.objects.active = body; bpy.ops.object.shade_smooth()
    HR.add_ground(mt); HR.add_lights()
    cam = HR.add_camera(arm, body, a.shot, a.hand, a.angle)
    HR.configure_freestyle()
    HR.render_to(os.path.join(out, "ink_plate.png"), True, 1.0)

    # SHADED greyscale (form) — proxy slightly lighter so canny sees its contour as a distinct object
    body.data.materials.clear(); body.data.materials.append(HR.grey_mat())
    proxy.data.materials.clear(); proxy.data.materials.append(HR.grey_mat())
    HR.render_to(os.path.join(out, "shaded_plate.png"), False, 0.55)

    # COLOR-ID (flat) — body red, proxy cyan, background black (the §2 separation channel)
    body.data.materials.clear(); body.data.materials.append(flat_emit("id_body", (0.85, 0.12, 0.12)))
    proxy.data.materials.clear(); proxy.data.materials.append(flat_emit("id_prox", (0.12, 0.75, 0.85)))
    HR.render_to(os.path.join(out, "colorid_plate.png"), False, 0.0)

    # DEPTH — include the proxy in the in-frame range so near/far spans hand+object
    near, far = HR.subject_depth_range([body, proxy], cam)
    md = HR.depth_mat(near, far)
    for o in bpy.data.objects:
        if o.type == 'MESH': o.data.materials.clear(); o.data.materials.append(md)
    HR.render_to(os.path.join(out, "depth_plate.png"), False, 0.0)
    print(f"  depth range {near:.3f}-{far:.3f} m")

    body_kp, hands_kp = HR.project_all(arm, cam, head_frame, a.hand)
    json.dump({"res": RES, "keypoints": body_kp, "hands": hands_kp, "object": a.object},
              open(os.path.join(out, "keypoints.json"), "w"), indent=1)
    print(f"  hand({a.hand}) visible {sum(k[2] for k in hands_kp[a.hand])}/21")
    print(f"=== {label} DONE ===")


main()
