#!/usr/bin/env python3
"""
BLUELINE Track IV — environment extension (closes the flagged OTS limit).

Track IV's report flagged it: `grammar_ots` framed the figure centered (back-3/4) because a
TRUE over-the-shoulder aims PAST the figure down-scene — which needs an environment to look
into. This adds:
  - an ENVIRONMENT LIBRARY (`alley_urban`, the S2 procedural alley → vanishing point), and
  - `grammar_ots_env` — a real OTS solve: camera behind+above the near shoulder, aimed past
    the figure to the environment's vanishing point (shoulder foreground, scene receding).
and emits IV-D (run + sword-drawn × true-OTS × alley) as a complete board record, registered
passes included. Reuses the bench's body/material/keypoint helpers (imported, not duplicated).

Run headless:  /opt/homebrew/bin/blender --background --python bench_env.py
Then:          <comfy venv> post.py   (draws IV-D openpose + canny, auto-discovered)
"""
import bpy, json, os, math, sys
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))  # Blender --python doesn't add it
import bench  # the Track IV bench — helpers only (its run-loop is guarded under __main__)

HERE = bench.HERE; P_DIR = bench.P_DIR; B_DIR = bench.B_DIR; BL_DIR = bench.BL_DIR
LIMBS = bench.LIMBS
RES_X, RES_Y = 1216, 832          # landscape (env shot frames the alley; matches the BIBLE's 16:9-ish)

# ----- running + sword-drawn pose (from S2), faces +Y (running away down the alley) -----
def run_sword_drawn():
    root = Vector((-0.05, 1.40, 0.0))
    off = {0:(.03,.20,1.58),1:(.02,.08,1.45),2:(.20,.02,1.40),3:(.42,-.12,1.16),4:(.62,-.22,1.05),
           5:(-.18,.02,1.40),6:(-.30,.26,1.22),7:(-.26,.46,1.34),8:(.14,0,.94),9:(.16,-.34,.60),
           10:(.18,-.64,.20),11:(-.14,.02,.96),12:(-.16,.34,.58),13:(-.14,.62,.16),
           14:(.07,.24,1.62),15:(-.02,.24,1.62),16:(.12,.20,1.60),17:(-.06,.20,1.60)}
    return {k: root + Vector(v) for k, v in off.items()}

# ----- environment library --------------------------------------------------------------
def build_alley_urban(scene):
    """Two facade rows receding +Y to a vanishing point, ground, greybox props. Returns (objs, vp)."""
    objs = []
    def box(name, loc, scale):
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=loc)
        o = bpy.context.active_object; o.name = name; o.scale = scale; objs.append(o); return o
    Y_TO, X = 24.0, 2.3
    box("Ground", (0, Y_TO/2, 0), (X, Y_TO/2, 0.02))
    bay = 2.4; y = 0.0
    while y < Y_TO:
        for sx in (-X, X):
            h = 7.5 * (0.92 + 0.16*((int(y/bay)) % 3)/2.0)
            box(f"facade_{sx:+.0f}_{y:.0f}", (sx, y+bay*0.5, h/2), (0.30, bay*0.5, h/2))
        y += bay
    for kind, at in (("dumpster", (-1.55, 6.0)), ("fire_escape", (2.05, 9.5)), ("crates", (1.4, 4.2))):
        box(f"prop_{kind}", (at[0], at[1], 0.45), (0.45, 0.5, 0.45))
    vp = Vector((0.0, Y_TO, 2.0))
    e = bpy.data.objects.new("VanishingPoint", None); e.location = vp; e.empty_display_size = 0.5
    scene.collection.objects.link(e)
    return objs, vp

ENVIRONMENTS = {"alley_urban": build_alley_urban}

# ----- TRUE OTS solver (uses the environment's vanishing point) --------------------------
def grammar_ots_env(J, vp):
    neck = J[1]
    location = neck + Vector((0.42, -1.45, 0.42))         # behind + above + to the near (R) shoulder
    look_at  = Vector((neck.x + 0.18, vp.y * 0.5, neck.z - 0.10))  # past the figure, down to the VP
    return dict(location=location, look_at=look_at, lens=34,
                note="true OTS: shoulder foreground, aims PAST the figure to the vanishing point")

# ----- render N objects with a swapped material ------------------------------------------
def render_objs(scene, objs, mat, path):
    for o in objs:
        o.data.materials.clear(); o.data.materials.append(mat)
    scene.render.filepath = path; bpy.ops.render.render(write_still=True)

def emit_env_shot(shot_id, env_name):
    bench.wipe(); scene = bpy.context.scene
    J = run_sword_drawn()
    body = bench.build_body(scene, J)
    env_objs, vp = ENVIRONMENTS[env_name](scene)
    render_set = [body] + env_objs
    cam_d = bpy.data.cameras.new("Cam"); cam = bpy.data.objects.new("Cam", cam_d)
    scene.collection.objects.link(cam); scene.camera = cam
    g = grammar_ots_env(J, vp)
    cam.data.lens = g["lens"]; cam.location = g["location"]
    cam.rotation_euler = (g["look_at"] - cam.location).to_track_quat('-Z', 'Y').to_euler()
    bpy.context.view_layer.update()
    # lights + world
    sun_d = bpy.data.lights.new("Sun", 'SUN'); sun_d.energy = 3.2
    sun = bpy.data.objects.new("Sun", sun_d); scene.collection.objects.link(sun)
    sun.rotation_euler = (math.radians(55), math.radians(10), math.radians(60))
    world = bpy.data.worlds.new("W"); scene.world = world; world.use_nodes = True
    bg = world.node_tree.nodes["Background"]; bg.inputs[0].default_value = (0,0,0,1); bg.inputs[1].default_value = 0.0
    scene.render.resolution_x = RES_X; scene.render.resolution_y = RES_Y
    scene.render.image_settings.file_format = 'PNG'; scene.render.film_transparent = False
    try: scene.render.engine = 'BLENDER_EEVEE_NEXT'
    except Exception: scene.render.engine = 'BLENDER_EEVEE'
    try: scene.view_settings.view_transform = 'Standard'
    except Exception: pass
    # near/far over the WHOLE scene (figure + receding alley) so depth shows the recession
    sample = list(J.values()) + [vp, Vector((2.3,24,0)), Vector((-2.3,24,0)), Vector((0,0.2,0))]
    dists = [(p - cam.location).length for p in sample]
    near, far = min(dists) * 0.9, max(dists) * 1.05
    base = os.path.join(P_DIR, shot_id)
    render_objs(scene, render_set, bench.clay(), base + "_rgb.png")
    render_objs(scene, render_set, bench.normal_mat(), base + "_normal.png")
    render_objs(scene, render_set, bench.depth_mat(near, far), base + "_depth.png")
    # geometric OpenPose keypoints — figure only (the pose channel is the hero, not the alley)
    kp = {}
    for i, p in J.items():
        co = world_to_camera_view(scene, cam, p)
        kp[i] = [round(co.x*RES_X,1), round((1-co.y)*RES_Y,1),
                 1.0 if (0<=co.x<=1 and 0<=co.y<=1 and co.z>0) else 0.3]
    json.dump({"width":RES_X,"height":RES_Y,"keypoints":kp,"limbs":LIMBS}, open(base+"_keypoints.json","w"))
    render_objs(scene, render_set, bench.clay(), base + "_rgb.png")  # restore clay for the saved blend
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(BL_DIR, shot_id + ".blend"))
    return g

def write_board_env(shot_id, env_name, g):
    block = f"""# === BOARD ===
SHOT_ID: {shot_id}
CAMERA_GRAMMAR: ots_env | lens {g['lens']} | {g['note']}
ANGLE: true over-the-shoulder (solved against the environment vanishing point) | AR 1216x832
CHARS: HERO (running, sword drawn — faces away, down the alley)
LOCATION: ALLEY_URBAN = urban alley, facades receding to a vanishing point (greybox; asset-kit flagged)
SETTING: ALLEY_URBAN | depth + canny carry the recession; figure occludes the near third
POSE: passes/{shot_id}_keypoints.json -> passes/{shot_id}_openpose.png
DEPTH: passes/{shot_id}_depth.png
EDGE: passes/{shot_id}_canny.png
NORMAL: passes/{shot_id}_normal.png
IDREF: <flagged: hero_identity -> Track II>
SEED: 4471
FLUX_SEED: 88120
FLAGGED: asset_kit(greybox alley, real kit later); hero_identity(->IDREF, Track II); motion_treatment("rushing by" -> flow-field, Track V)
POSITIVE: <author or staging-AI fills; the block above is the authored control>
NOTES: Track IV env extension — closes the OTS-needs-an-environment flag. Camera aims PAST the figure
       to the vanishing point; depth/edge now carry the receding alley, not just the figure.
"""
    open(os.path.join(B_DIR, shot_id + ".board.txt"), "w").write(block)

if __name__ == "__main__":
    g = emit_env_shot("IV-D", "alley_urban")
    write_board_env("IV-D", "alley_urban", g)
    print("EMITTED IV-D run_sword_drawn ots_env alley_urban", flush=True)
    print("BENCH_ENV_DONE")
