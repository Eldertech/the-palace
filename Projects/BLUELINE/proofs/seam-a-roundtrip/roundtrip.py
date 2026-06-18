#!/usr/bin/env python3
"""
BLUELINE Seam A — the animatic->Blender ROUND-TRIP realizer (Blender headless).

Tests THE TRANSITION (2D animatic -> 3D Blender layout -> reproject to 2D), not just the Blender half.
Each test shot is a tiny BOARD RECORD: a 3D pose + camera grammar (the realization) PLUS the staging
vocabulary the animatic AUTHORED (facing / eyeline / shot-size). Blender realizes it and reprojects the
canonical COCO-18 keypoints to screen; `roundtrip_diff.py` then diffs the REALIZED staging frame against
the AUTHORED one (shared staging-skeleton). The disagreement IS the Seam-A loss.

Reuses the gallery rig (poses / camera grammars / fit_camera / metaball body) so the realization is the
same machinery the gallery stress-tests.

Run:  /opt/homebrew/bin/blender --background --python roundtrip.py
Then: python3 roundtrip_diff.py     (computes the staging-fidelity verdicts; no Blender needed)
"""
import bpy, json, math, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "blender-gallery"))   # the gallery rig (poses/grammars/helpers)
import gallery as G
from bpy_extras.object_utils import world_to_camera_view

P_DIR = os.path.join(HERE, "passes"); os.makedirs(P_DIR, exist_ok=True)
RES_X, RES_Y = 832, 1216

# Test shots — a 3D realization (pose x grammar, from the gallery) + the AUTHORED staging vocabulary the
# animatic specified. shot-size bands (figure-fill fraction of frame height): WIDE .30-.55, MS .50-.80, CU .70-1.00.
SHOTS = [
  {"id":"R01","pose":"lunge","grammar":"worms_eye","facing":-0.15,"eyeline":[0.50,0.20],"shot":"MS",
   "note":"front-ish lunge from below — facing should survive cleanly, head leads up"},
  {"id":"R02","pose":"punch_at_cam","grammar":"hero_push","facing":0.00,"eyeline":[0.50,0.50],"shot":"CU",
   "note":"fist at camera, tight — does facing read ~0 and the shot-size land CU?"},
  {"id":"R03","pose":"spin_slash","grammar":"dutch","facing":0.30,"eyeline":[0.85,0.45],"shot":"MS",
   "note":"crossed limbs on a tilt — the laterality-crossing test"},
  {"id":"R04","pose":"overhead","grammar":"profile","facing":0.90,"eyeline":[0.90,0.20],"shot":"MS",
   "note":"profile of an away-facing strike — the 2D front/back ambiguity (expect facing to wobble)"},
  {"id":"R05","pose":"high_kick","grammar":"hero_push","facing":-0.10,"eyeline":[0.40,0.30],"shot":"CU",
   "note":"leg to head height, tight — extreme limb + shot-size"},
]

def realize(shot):
    G.wipe(); scene = bpy.context.scene
    pose_fn, face = G.POSES[shot["pose"]]; J = G.asV(pose_fn())
    cam_d = bpy.data.cameras.new("Cam"); cam = bpy.data.objects.new("Cam", cam_d)
    scene.collection.objects.link(cam); scene.camera = cam
    g = G.GRAMMARS[shot["grammar"]](J, face)
    scene.render.resolution_x = RES_X; scene.render.resolution_y = RES_Y
    # Fix A — shot-size: frame the subject set (CU/MS/WIDE) to its fill, not the whole figure
    subject, target, fill = G.frame_for_shot(J, shot["shot"])
    G.fit_camera(scene, cam, subject, target, g["dir_off"], g["lens"], fill=fill, roll=g.get("roll", 0.0), up=g.get("up", 'Y'))
    # Fix B — head-aim toward the authored EYELINE target
    G.aim_head(scene, cam, J, shot["eyeline"])
    # re-fit: aim_head moved the head keypoints (part of a CU's subject set), so re-frame on the aimed pose
    subject, target, fill = G.frame_for_shot(J, shot["shot"])
    G.fit_camera(scene, cam, subject, target, g["dir_off"], g["lens"], fill=fill, roll=g.get("roll", 0.0), up=g.get("up", 'Y'))
    body = G.build_body(scene, J)
    sun_d = bpy.data.lights.new("Sun", 'SUN'); sun_d.energy = 3.0
    sun = bpy.data.objects.new("Sun", sun_d); scene.collection.objects.link(sun)
    sun.rotation_euler = (math.radians(55), math.radians(12), math.radians(-50))
    world = bpy.data.worlds.new("W"); scene.world = world; world.use_nodes = True
    bg = world.node_tree.nodes["Background"]; bg.inputs[0].default_value = (0,0,0,1); bg.inputs[1].default_value = 0.0
    try: scene.render.engine = 'BLENDER_EEVEE_NEXT'
    except Exception: scene.render.engine = 'BLENDER_EEVEE'
    try: scene.view_settings.view_transform = 'Standard'
    except Exception: pass
    scene.render.image_settings.file_format = 'PNG'
    base = os.path.join(P_DIR, shot["id"])
    G.render(scene, body, G.clay(), base + "_rgb.png")
    # reproject canonical COCO-18 to screen (the "back to 2D" leg of the round-trip).
    # figure_fill = the vertical span of the SUBJECT SET (what defines the shot) — the right shot-size test
    # ("did the solver frame the subject to its band?"); all-in-frame span is noisy when a tight crop leaves
    # only a few scattered keypoints. off-frame counts ALL keypoints (the informational crop indicator).
    subj_ids = set(subject.keys())
    kp = {}; ys = []; subj_ys = []; off = 0; behind = 0
    for i, p in J.items():
        co = world_to_camera_view(scene, cam, p)
        infr = (0 <= co.x <= 1 and 0 <= co.y <= 1 and co.z > 0)
        if not (0 <= co.x <= 1 and 0 <= co.y <= 1): off += 1
        if co.z <= 0: behind += 1
        if infr: ys.append(co.y)
        if infr and i in subj_ids: subj_ys.append(co.y)
        # 4th element = camera-space depth (units in front); the laterality diff uses it to tell a
        # foreshortened forward limb (depth-resolved) from a genuine L/R swap.
        kp[i] = [round(co.x * RES_X, 1), round((1 - co.y) * RES_Y, 1), 1.0 if infr else 0.3, round(co.z, 4)]
    fill = (max(subj_ys) - min(subj_ys)) if subj_ys else ((max(ys) - min(ys)) if ys else 0.0)
    # also draw the geometric openpose so the viewer can show it (reuse the gallery color order via the module)
    return {"id": shot["id"], "pose": shot["pose"], "grammar": shot["grammar"], "note": shot["note"],
            "authored": {"facing": shot["facing"], "eyeline": shot["eyeline"], "shot": shot["shot"]},
            "realized": {"figure_fill": round(fill, 4), "offframe": off, "behind": behind,
                         "lens": g["lens"], "grammar_note": g["note"]},
            "keypoints": kp, "width": RES_X, "height": RES_Y}

if __name__ == "__main__":
    out = [realize(s) for s in SHOTS]
    json.dump({"shots": out}, open(os.path.join(HERE, "roundtrip-realized.json"), "w"), indent=2)
    for s in out:
        print(f"REALIZED {s['id']} {s['pose']}x{s['grammar']} fill={s['realized']['figure_fill']} off={s['realized']['offframe']}", flush=True)
    print("ROUNDTRIP_REALIZE_DONE")
