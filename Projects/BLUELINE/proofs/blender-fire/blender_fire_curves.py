#!/usr/bin/env python3
"""
BLUELINE blender-fire — flame as flowing CURVE TONGUES (not discrete particles).

Discrete velocity-aligned streak-cones read as sparks. Flame is continuous, so this builds many
tapered curves that rise and curl through a time-varying curl field (the flow-field tie-in): thick,
white-hot at the base; thin, deep-red at the licking tip. Rebuilt every frame so the tongues lick and
drift — a loopable animated flame on transparent, to composite behind the masked hero.

  /opt/homebrew/bin/blender --background --python blender_fire_curves.py
"""
import bpy, os, math, random, json

HERE = os.path.dirname(os.path.abspath(__file__)); SEQDIR = os.path.join(HERE, "renders", "seq")
os.makedirs(SEQDIR, exist_ok=True)
N_SEEDS, KMAX, DT, SPEED = 70, 50, 0.085, 0.22                 # fewer tendrils (was 130)
random.seed(11)
SEEDS = [(random.uniform(-1.6, 1.6), random.uniform(2.5, 3.5), 0.8) for _ in range(N_SEEDS)]
PHASES = [random.uniform(0, 6.283) for _ in range(N_SEEDS)]    # each tongue licks on its own phase
LENGTHS = [random.randint(24, KMAX) for _ in range(N_SEEDS)]   # varied heights → ragged, distinct tips
BASER = [random.uniform(0.65, 1.0) for _ in range(N_SEEDS)]    # varied tongue thickness

# IMAGE-DERIVED PHYSICS: the drawn smoke's lean-by-height (analyze_smoke.py) drives the field
PHYS = json.load(open(os.path.join(HERE, "smoke_physics.json")))
LB = sorted(PHYS["bands"], key=lambda d: d["z_norm"]); LEAN_SCALE = 0.8
def lean_at(zn):
    zn = max(0.0, min(1.0, zn))
    for i in range(len(LB) - 1):
        if zn <= LB[i + 1]["z_norm"]:
            a, b = LB[i], LB[i + 1]; f = (zn - a["z_norm"]) / max(1e-6, b["z_norm"] - a["z_norm"])
            return a["lean"] + (b["lean"] - a["lean"]) * f
    return LB[-1]["lean"]

for col in (bpy.data.objects, bpy.data.curves, bpy.data.meshes, bpy.data.materials, bpy.data.cameras, bpy.data.lights):
    for x in list(col):
        col.remove(x)
scene = bpy.context.scene

def flame_material():
    m = bpy.data.materials.new("flame"); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    geo = nt.nodes.new("ShaderNodeNewGeometry"); sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(geo.outputs["Position"], sep.inputs[0])
    zr = nt.nodes.new("ShaderNodeMapRange"); zr.inputs["From Min"].default_value = 0.8
    zr.inputs["From Max"].default_value = 4.4; zr.clamp = True
    nt.links.new(sep.outputs["Z"], zr.inputs["Value"])
    ramp = nt.nodes.new("ShaderNodeValToRGB"); cr = ramp.color_ramp
    cr.elements[0].position = 0.0; cr.elements[0].color = (1.0, 0.95, 0.72, 1)
    cr.elements[1].position = 1.0; cr.elements[1].color = (0.5, 0.04, 0.0, 1)
    cr.elements.new(0.25).color = (1.0, 0.72, 0.22, 1); cr.elements.new(0.55).color = (1.0, 0.33, 0.05, 1)
    nt.links.new(zr.outputs["Result"], ramp.inputs["Fac"])
    sr = nt.nodes.new("ShaderNodeMapRange"); sr.inputs["To Min"].default_value = 3.2; sr.inputs["To Max"].default_value = 0.5
    nt.links.new(zr.outputs["Result"], sr.inputs["Value"])
    emi = nt.nodes.new("ShaderNodeEmission")
    nt.links.new(ramp.outputs["Color"], emi.inputs["Color"]); nt.links.new(sr.outputs["Result"], emi.inputs["Strength"])
    out = nt.nodes.new("ShaderNodeOutputMaterial"); nt.links.new(emi.outputs[0], out.inputs["Surface"])
    return m

MAT = flame_material()

def field(p, t, ph):
    x, y, z = p
    vz = 1.0 + 0.2 * math.sin(z * 2.0 + t + ph)                               # rise, pulsing per tongue
    s = 0.55                                                                  # gentler per-tongue curl (lean now carries the direction)
    vx = s * math.sin(2.1 * z + t * 1.3 + ph * 3.0) + 0.4 * s * math.sin(4.2 * z - t * 0.9 + ph)
    vy = s * math.cos(1.9 * z + t * 1.05 + ph * 2.0)
    zn = (z - 0.8) / 3.6                                                      # normalised flame height
    vx += lean_at(zn) * LEAN_SCALE * vz - 0.08 * x                           # ← the DRAWN smoke's rightward lean drives the drift
    return vx, vy, vz

CUR = None
def build(t):
    global CUR
    cu = bpy.data.curves.new("flames", 'CURVE'); cu.dimensions = '3D'
    cu.bevel_depth = 0.045; cu.bevel_resolution = 1; cu.use_fill_caps = True
    for idx, (sx, sy, sz) in enumerate(SEEDS):
        ph = PHASES[idx]; kk = LENGTHS[idx]
        pts = [(sx, sy, sz)]; p = [sx, sy, sz]
        for _ in range(kk):
            vx, vy, vz = field(p, t, ph); p = [p[0] + vx * DT, p[1] + vy * DT, p[2] + vz * DT]
            pts.append(tuple(p))
        sp = cu.splines.new('POLY'); sp.points.add(len(pts) - 1); n = len(pts)
        for i, (px, py, pz) in enumerate(pts):
            sp.points[i].co = (px, py, pz, 1.0)
            sp.points[i].radius = BASER[idx] * max(0.04, (1.0 - i / (n - 1)) ** 0.75)   # thick base → thin tip, per-tongue thickness
    cu.materials.append(MAT)
    CUR = bpy.data.objects.new("Flames", cu); scene.collection.objects.link(CUR)

def clear():
    global CUR
    if CUR:
        d = CUR.data; bpy.data.objects.remove(CUR, do_unlink=True); bpy.data.curves.remove(d); CUR = None

def on_frame(scn, depsgraph=None):
    clear(); build(scn.frame_current * SPEED)

# camera + world
cam_d = bpy.data.cameras.new("Cam"); cam_d.lens = 38
cam = bpy.data.objects.new("Cam", cam_d); scene.collection.objects.link(cam); scene.camera = cam
cam.location = (0.4, -7.5, 1.7); cam.rotation_euler = (math.radians(85), 0, math.radians(2))
scene.world = bpy.data.worlds.new("W"); scene.world.use_nodes = True
scene.world.node_tree.nodes["Background"].inputs[0].default_value = (0, 0, 0, 1)

scene.render.resolution_x = 624; scene.render.resolution_y = 912
scene.render.image_settings.file_format = 'PNG'
scene.render.film_transparent = True
try: scene.render.engine = 'BLENDER_EEVEE'
except Exception: scene.render.engine = 'BLENDER_EEVEE_NEXT'
try: scene.view_settings.view_transform = 'Standard'
except Exception: pass

if os.environ.get("BL_ONE"):                      # fast single-frame look test
    f = int(os.environ["BL_ONE"]); scene.frame_set(f); clear(); build(f * SPEED)
    scene.render.filepath = os.path.join(HERE, "renders", "curve_test.png")
    bpy.ops.render.render(write_still=True); print("CURVE_ONE_DONE")
else:
    bpy.app.handlers.frame_change_pre.append(on_frame)
    scene.frame_start = 1; scene.frame_end = 48
    scene.render.filepath = os.path.join(SEQDIR, "flame_")
    bpy.ops.render.render(animation=True)
    print("CURVE_FLAME_DONE", SEQDIR)
