#!/usr/bin/env python3
"""
BLUELINE Session 2 — SceneCraft path.
Pattern: LLM -> Blender-Python -> scene-graph w/ numerical constraints -> assets.

Consumes the shared spec (../alley-shot.staging.json) and assembles a hand-editable
greybox .blend: OTS camera (from the declarative solve), a run + sword-drawn metaball
mannequin facing down the alley, and a procedural alley receding to a vanishing point.

Run headless:
  /opt/homebrew/bin/blender --background --python scenecraft_build.py
"""
import bpy, json, os, math, sys
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
# Reusable Blender backend: optional `-- <spec> <out_blend> <out_png>` lets the
# Three.js path drive the SAME assembler on its exported spec (the spec is the
# interchange format — see threejs_to_blender.py).
_argv = sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
SPEC_PATH = _argv[0] if len(_argv) > 0 else os.path.join(HERE, "..", "alley-shot.staging.json")
OUT_BLEND = _argv[1] if len(_argv) > 1 else os.path.join(HERE, "alley-scenecraft.blend")
OUT_PNG   = _argv[2] if len(_argv) > 2 else os.path.abspath(os.path.join(HERE, "..", "renders", "scenecraft.png"))
SPEC = json.load(open(SPEC_PATH))
os.makedirs(os.path.dirname(OUT_PNG), exist_ok=True)
RES_X, RES_Y = 1216, 832

R = SPEC["resolved"]

# ---- run + sword-drawn pose (COCO-18), figure faces +Y (down the alley) -------
root = Vector(R["subject"]["root"])
def P(x, y, z): return root + Vector((x, y, z))
J = {
    0:  P(0.03, 0.20, 1.58),  1: P(0.02, 0.08, 1.45),
    2:  P(0.20, 0.02, 1.40),  3: P(0.42, -0.12, 1.16), 4: P(0.62, -0.22, 1.05),  # R arm = sword
    5:  P(-0.18, 0.02, 1.40), 6: P(-0.30, 0.26, 1.22), 7: P(-0.26, 0.46, 1.34),  # L arm swing
    8:  P(0.14, 0.0, 0.94),   9: P(0.16, -0.34, 0.60), 10: P(0.18, -0.64, 0.20),  # R leg back
    11: P(-0.14, 0.02, 0.96), 12: P(-0.16, 0.34, 0.58), 13: P(-0.14, 0.62, 0.16), # L leg forward
    14: P(0.07, 0.24, 1.62), 15: P(-0.02, 0.24, 1.62), 16: P(0.12, 0.20, 1.60), 17: P(-0.06, 0.20, 1.60),
}
LIMBS = [(1,2),(1,5),(2,3),(3,4),(5,6),(6,7),(1,8),(8,9),(9,10),
         (1,11),(11,12),(12,13),(1,0)]

# ---- clean ----
for d in (bpy.data.objects, bpy.data.meshes, bpy.data.materials, bpy.data.metaballs,
          bpy.data.armatures, bpy.data.cameras, bpy.data.lights):
    for x in list(d): d.remove(x)
scene = bpy.context.scene
coll = scene.collection

def grey(name, v):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes.get("Principled BSDF")
    b.inputs["Base Color"].default_value = (*v, 1)
    if "Roughness" in b.inputs: b.inputs["Roughness"].default_value = 0.7
    return m

# ---- metaball mannequin (the hero) -------------------------------------------
mb = bpy.data.metaballs.new("hero"); mb.resolution = 0.07; mb.render_resolution = 0.04; mb.threshold = 0.6
hero = bpy.data.objects.new("Hero", mb); coll.objects.link(hero)
hero.data.materials.append(grey("hero_mat", (0.55, 0.56, 0.6)))
def m_at(c, r): e = mb.elements.new(); e.co = Vector(c); e.radius = r
def m_line(a, b, r, step=0.08):
    a, b = Vector(a), Vector(b); d = b - a; n = max(2, int(d.length/step)+1)
    for i in range(n+1): m_at(a + d*(i/n), r)
LR = {(2,3):.085,(3,4):.075,(5,6):.085,(6,7):.075,(8,9):.092,(9,10):.08,
      (11,12):.092,(12,13):.08,(1,2):.10,(1,5):.10,(1,8):.10,(1,11):.10,(1,0):.085}
for a,b in LIMBS: m_line(J[a], J[b], LR.get((a,b), .08))
m_line(J[1], (J[8]+J[11])*0.5, 0.155); m_line(J[8], J[11], 0.11)
m_at(J[0], 0.15); m_at((J[0]+J[1])*0.5, 0.11)

# ---- sword prop in the right hand (blade extends out/back/down) ---------------
blade_len = R["subject"]["prop"]["blade_len"]
wrist = J[4]; bdir = Vector((0.55, -0.35, -0.18)).normalized()
bpy.ops.mesh.primitive_cube_add(size=1.0, location=wrist + bdir*(blade_len*0.5))
sword = bpy.context.active_object; sword.name = "Sword"
sword.scale = (0.03, blade_len*0.5, 0.06)
sword.rotation_euler = bdir.to_track_quat('Y', 'Z').to_euler()
sword.data.materials.append(grey("sword_mat", (0.8, 0.8, 0.85)))

# ---- procedural alley: two facade rows w/ bays, ground, greybox props ---------
env = R["environment"]; fac = env["facades"]
ground_mat = grey("ground", (0.22, 0.22, 0.24)); fac_mat = grey("facade", (0.38, 0.37, 0.40))
prop_mat = grey("prop", (0.30, 0.30, 0.33))
def box(name, loc, scale, mat, parent=None):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=loc)
    o = bpy.context.active_object; o.name = name; o.scale = scale
    o.data.materials.append(mat)
    if parent: o.parent = parent
    return o
# ground
box("Ground", (0, env["ground"]["y_to"]/2, 0), (env["ground"]["x_half"], env["ground"]["y_to"]/2, 0.02), ground_mat)
# facades as bays (gives the receding-to-vanishing-point read)
alley = bpy.data.objects.new("Alley", None); coll.objects.link(alley)  # empty parent
import math as _m
y = fac["y_from"]
bay = fac["bay_step"]
while y < fac["y_to"]:
    for sx in fac["rows_at_x"]:
        h = fac["height"] * (0.92 + 0.16*((int(y/bay)) % 3)/2.0)  # gentle height variation
        # continuous wall bays (depth = full bay so they read as an alley, not posts);
        # a recessed window strip keeps the bay rhythm readable.
        box(f"facade_{sx:+.0f}_{y:.0f}", (sx, y+bay*0.5, h/2),
            (0.30, bay*0.5, h/2), fac_mat, alley)
    y += bay
# greybox props
for p in env["props_greybox"]:
    box(f"prop_{p['kind']}", (p["at"][0], p["at"][1], 0.45),
        (0.45, 0.5, 0.45), prop_mat, alley)
# a marker empty at the vanishing point (editable handle)
vp = bpy.data.objects.new("VanishingPoint", None); vp.location = env["vanishing_point"]
vp.empty_display_size = 0.5; coll.objects.link(vp)

# ---- OTS camera from the declarative solve -----------------------------------
cam_data = bpy.data.cameras.new("Cam")
cam_data.lens = R["camera"]["solved"]["lens_mm"]
cam_data.sensor_width = R["camera"]["solved"].get("sensor_mm", 36)
cam = bpy.data.objects.new("Cam", cam_data); coll.objects.link(cam); scene.camera = cam
cam.location = Vector(R["camera"]["solved"]["location"])
look = Vector(R["camera"]["solved"]["look_at"])
cam.rotation_euler = (look - cam.location).to_track_quat('-Z', 'Y').to_euler()

# ---- lights + world ----
sun_d = bpy.data.lights.new("Sun", 'SUN'); sun_d.energy = 3.5
sun = bpy.data.objects.new("Sun", sun_d); coll.objects.link(sun)
sun.rotation_euler = (math.radians(58), math.radians(8), math.radians(70))
fill_d = bpy.data.lights.new("Fill", 'AREA'); fill_d.energy = 400; fill_d.size = 6
fill = bpy.data.objects.new("Fill", fill_d); coll.objects.link(fill)
fill.location = (-3, 1, 3)
world = bpy.data.worlds.new("W"); scene.world = world; world.use_nodes = True
bg = world.node_tree.nodes["Background"]; bg.inputs[0].default_value=(0.05,0.06,0.08,1); bg.inputs[1].default_value=0.3

# ---- render preview + save ----
scene.render.resolution_x = RES_X; scene.render.resolution_y = RES_Y
scene.render.image_settings.file_format = 'PNG'
try: scene.render.engine = 'BLENDER_EEVEE_NEXT'
except Exception: scene.render.engine = 'BLENDER_EEVEE'
scene.render.filepath = OUT_PNG
bpy.ops.render.render(write_still=True)
print("WROTE", OUT_PNG)
bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND)
print("WROTE", OUT_BLEND)
print("SCENECRAFT_DONE")
