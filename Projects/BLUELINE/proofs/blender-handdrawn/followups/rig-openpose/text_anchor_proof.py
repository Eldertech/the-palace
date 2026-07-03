"""
BLUELINE — Text Layer, placement mode #1 (ANCHOR IN BLENDER), proof.

The claim (from [[The 2.5D Paper Stack]] + [[BLUELINE — Text Layer]]): a dialogue
balloon is a *sheet at a depth*, not a sticker composited flat-last. If its anchor lives
in the Blender scene — parented to the speaker's head — then its SCREEN position AND its
STACK depth both fall out of the *same* camera projection that already makes the OpenPose
and depth plates. Parallax, head-tracking, and occlusion then come for free.

This script proves the WHERE half. It reuses the proven rig from pose_rig_mpfb_v3.py
(same MPFB human, same camera, same depth mapping) and adds a text anchor. It renders a
short "camera drift + head turn" sequence and, per frame, projects each anchor with the
SAME world_to_camera_view the keypoints use — emitting placement_record.json. It writes
NO overlays (Blender has no PIL); the raster half is draw_text_anchor.py under COMFYPY,
exactly mirroring render_plates_all.py / draw_openpose.py.

Run (do NOT pass --factory-startup — it disables MPFB):
  /Applications/Blender.app/Contents/MacOS/Blender -b -P text_anchor_proof.py
Outputs: renders/text-anchor/frame_<NN>/{ink_plate,depth_plate}.png + placement.json
         renders/text-anchor/placement_record.json  (all frames)
"""
import bpy, os, sys, json, math, mathutils
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)       # Blender -P does not add the script dir to sys.path
import pose_rig_mpfb_v3 as R   # importable now that its main() is guarded

OUT     = os.path.join(HERE, "renders", "text-anchor")

# MUST match R.depth_mat's MapRange (View Z Depth [near,far] -> [1,0], clamped).
DEPTH_NEAR, DEPTH_FAR = 2.0, 5.5

# The speaker: a clean standing pose (separated legs) so the head + torso read cleanly.
POSE = dict(R.POSE_C)

# One dialogue event. Offsets are in the head's own frame (up / subject-right / facing),
# so the balloon rides the head when it turns — the whole point of anchoring in Blender.
BALLOON_OFFSET = dict(up=0.30, right=-0.36, facing=0.05)   # up + to subject's left, slightly forward
# A control anchor deliberately placed BEHIND the CHEST, to exercise the occlusion branch:
# it projects squarely onto the figure's torso but sits deeper, so the depth plate must
# let the figure's ink cut across it. chest = 0.45m below head center; 0.5m behind.
BEHIND_DOWN, BEHIND_BACK = 0.45, 0.50


def norm_depth(zview):
    """View-Z distance (Blender units) -> the SAME 0..1 scale as depth_plate (near=1)."""
    t = (zview - DEPTH_NEAR) / (DEPTH_FAR - DEPTH_NEAR)
    t = max(0.0, min(1.0, t))
    return round(1.0 - t, 5)


def head_basis(arm, head_frame):
    """Posed head center + world-space up/right/facing unit dirs (same math as
    R.openpose_keypoints), plus a mouth point for the tail target."""
    dg = bpy.context.evaluated_depsgraph_get()
    ae = arm.evaluated_get(dg); mw = ae.matrix_world
    neck     = mw @ ae.pose.bones["neck01"].head
    head_top = mw @ ae.pose.bones["head"].tail
    head_c   = neck + (head_top - neck) * 0.6
    hm = (mw @ ae.pose.bones["head"].matrix).to_3x3()
    facing = (hm @ head_frame["face"]).normalized()
    up     = (hm @ head_frame["up"]).normalized()
    right  = (hm @ head_frame["right"]).normalized()     # subject's right
    mouth  = head_c + facing * 0.10 - up * 0.05
    return head_c, up, right, facing, mouth


def anchor_world(head_c, up, right, facing, off):
    return head_c + up * off["up"] + right * off["right"] + facing * off["facing"]


def project(scene, cam, wp):
    from bpy_extras.object_utils import world_to_camera_view
    co = world_to_camera_view(scene, cam, mathutils.Vector(wp))
    return {
        "px":    [round(co.x, 5), round(1.0 - co.y, 5)],   # normalized, y from image-top
        "zview": round(co.z, 5),
        "z_norm": norm_depth(co.z),
        "vis":   1 if co.z > 0 else 0,
    }


def orbit(cam, center, deg):
    """Swing the camera around the world-Z axis through `center`, then re-aim at it —
    a horizontal camera drift that keeps the subject framed."""
    v = cam.location - center
    rot = mathutils.Matrix.Rotation(math.radians(deg), 3, 'Z')
    cam.location = center + rot @ v
    cam.rotation_euler = (center - cam.location).to_track_quat('-Z', 'Y').to_euler()


def body_center(body):
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    me = body.evaluated_get(dg)
    pts = [body.matrix_world @ v.co for v in me.data.vertices]
    xs = [p.x for p in pts]; ys = [p.y for p in pts]; zs = [p.z for p in pts]
    return mathutils.Vector(((min(xs)+max(xs))/2, (min(ys)+max(ys))/2, (min(zs)+max(zs))/2))


def render_frame(fdir, body):
    """Ink plate (toon + Freestyle) then depth plate — same recipe as R.main()."""
    os.makedirs(fdir, exist_ok=True)
    mt = R.toon_mat()
    for o in bpy.data.objects:
        if o.type == 'MESH':
            o.data.materials.clear(); o.data.materials.append(mt)
    bpy.context.view_layer.objects.active = body
    R.render_to(os.path.join(fdir, "ink_plate.png"), True, 1.0)
    md = R.depth_mat()
    for o in bpy.data.objects:
        if o.type == 'MESH':
            o.data.materials.clear(); o.data.materials.append(md)
    R.render_to(os.path.join(fdir, "depth_plate.png"), False, 0.0)


class Args:  # R.make_human wants an argparse-like object
    gender = 1.0; age = 0.35; muscle = 0.5; weight = 0.5; height = 0.6


def main():
    os.makedirs(OUT, exist_ok=True)
    R.enable_mpfb(); R.clear_scene()

    body, arm = R.make_human(Args())
    arm.display_type = 'WIRE'
    head_frame = R.capture_head_frame(arm)     # BEFORE posing
    R.apply_pose(arm, POSE)

    bpy.context.view_layer.objects.active = body
    bpy.ops.object.shade_smooth()
    R.add_ground(R.toon_mat()); R.add_lights()
    cam = R.add_camera(); R.frame_camera(cam, body)
    R.configure_freestyle()

    center = body_center(body)
    base_loc = cam.location.copy()

    # frame plan: (label, camera azimuth from base, extra head-turn degrees on Z)
    FRAMES = [
        ("00_drift_left",   -14, 0),
        ("01_center",         0, 0),
        ("02_drift_right",  +14, 0),
        ("03_head_turn",      0, 30),   # camera centered, head turns — balloon must follow
    ]

    scene = bpy.context.scene
    records = []
    for i, (label, az, head_turn) in enumerate(FRAMES):
        # camera drift
        cam.location = base_loc.copy()
        orbit(cam, center, az)
        # head turn (re-pose head bone; keep the rest of the pose)
        pose = dict(POSE)
        if head_turn:
            pose["head"] = (0, 0, head_turn)
        R.apply_pose(arm, pose)
        bpy.context.view_layer.update()

        fdir = os.path.join(OUT, f"frame_{i:02d}")
        render_frame(fdir, body)

        head_c, up, right, facing, mouth = head_basis(arm, head_frame)
        balloon_w = anchor_world(head_c, up, right, facing, BALLOON_OFFSET)
        chest_c   = head_c - up * BEHIND_DOWN
        behind_w  = chest_c - facing * BEHIND_BACK           # behind the torso → occluded

        rec = {
            "frame": i, "label": label, "res": R.RES,
            "cam_azimuth_deg": az, "head_turn_deg": head_turn,
            "ink_plate": "ink_plate.png", "depth_plate": "depth_plate.png",
            "mouth": project(scene, cam, mouth),
            "anchors": {
                # voice=world → in-world dialogue balloon, a sheet inside the scene volume
                "balloon": {"voice": "world", "kind": "dialogue",
                            **project(scene, cam, balloon_w)},
                # a control sheet placed behind the figure to prove the occlusion test
                "behind_test": {"voice": "world", "kind": "occlusion-control",
                                **project(scene, cam, behind_w)},
            },
        }
        json.dump(rec, open(os.path.join(fdir, "placement.json"), "w"), indent=1)
        records.append(rec)
        print(f"  frame {i} {label}: balloon px={rec['anchors']['balloon']['px']} "
              f"z_norm={rec['anchors']['balloon']['z_norm']} | behind z_norm="
              f"{rec['anchors']['behind_test']['z_norm']}", flush=True)

    out = {"note": "BLUELINE text placement mode #1 — anchor in Blender",
           "depth_map": {"near_bu": DEPTH_NEAR, "far_bu": DEPTH_FAR, "near_value": 1.0},
           "frames": records}
    json.dump(out, open(os.path.join(OUT, "placement_record.json"), "w"), indent=1)
    print("\nWROTE", os.path.join(OUT, "placement_record.json"), "-", len(records), "frames")


if __name__ == "__main__":
    main()
