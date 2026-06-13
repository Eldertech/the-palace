#!/usr/bin/env python3
"""
LEG 3b — SIM, OFFLINE fork (Blender): particles advected by THE field, rendered
as beveled-curve trails with real 3D geometry + emissive shading. The offline
counterpart to the real-time Three.js fork — the fidelity (true tubes, depth,
compositing-ready) the browser can't hold.

PER-LEG MASSAGING: velocity scale + dt + re-seed (same kind as the Three.js fork).
Field read untouched from ../flow-field.json.

Run: /opt/homebrew/bin/blender --background --python blender_particles.py
"""
import bpy, json, os, math, random
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
FIELD = json.load(open(os.path.join(HERE, "..", "flow-field.json")))
OUT = os.path.abspath(os.path.join(HERE, "..", "renders", "03b-sim-blender.png"))
GW, GH, ASP = FIELD["grid"]["w"], FIELD["grid"]["h"], FIELD["grid"]["aspect"]
V = FIELD["vectors"]; MAGMAX = FIELD["mag_max"]
random.seed(7)

def sample(x, y):
    fx = min(max(x/ASP, 0), 1)*(GW-1); fy = min(max(y, 0), 1)*(GH-1)
    x0, y0 = int(fx), int(fy); x1, y1 = min(x0+1, GW-1), min(y0+1, GH-1)
    tx, ty = fx-x0, fy-y0
    a, b, c, d = V[y0][x0], V[y0][x1], V[y1][x0], V[y1][x1]
    return (a[0]*(1-tx)*(1-ty)+b[0]*tx*(1-ty)+c[0]*(1-tx)*ty+d[0]*tx*ty,
            a[1]*(1-tx)*(1-ty)+b[1]*tx*(1-ty)+c[1]*(1-tx)*ty+d[1]*tx*ty)

# clean
for col in (bpy.data.objects, bpy.data.meshes, bpy.data.curves, bpy.data.materials,
            bpy.data.cameras, bpy.data.lights):
    for x in list(col): col.remove(x)
scene = bpy.context.scene

# advect N particles, each -> a spline of K points (per-leg: SCALE + dt)
N, K, SCALE, DT = 320, 70, 0.011, 1.0
cu = bpy.data.curves.new("trails", 'CURVE'); cu.dimensions = '3D'
cu.bevel_depth = 0.0016; cu.bevel_resolution = 1
for _ in range(N):
    x, y = random.random()*ASP, random.random()
    pts = [(x, y)]
    for _ in range(K):
        vx, vy = sample(x, y); m = math.hypot(vx, vy)+1e-6
        x += vx*SCALE*DT; y += vy*SCALE*DT
        if not (0 <= x <= ASP and 0 <= y <= 1): break
        pts.append((x, y))
    if len(pts) < 4: continue
    sp = cu.splines.new('POLY'); sp.points.add(len(pts)-1)
    for i, (px, py) in enumerate(pts):
        sp.points[i].co = (px, py, 0.0, 1.0)
obj = bpy.data.objects.new("Trails", cu); scene.collection.objects.link(obj)

# emissive material (warm)
m = bpy.data.materials.new("glow"); m.use_nodes = True
nt = m.node_tree; nt.nodes.clear()
emi = nt.nodes.new("ShaderNodeEmission"); emi.inputs[0].default_value = (1.0, 0.66, 0.28, 1)
emi.inputs[1].default_value = 1.6
out = nt.nodes.new("ShaderNodeOutputMaterial"); nt.links.new(emi.outputs[0], out.inputs["Surface"])
cu.materials.append(m)

# top-down ortho camera over the domain
cam_d = bpy.data.cameras.new("Cam"); cam_d.type = 'ORTHO'; cam_d.ortho_scale = ASP
cam = bpy.data.objects.new("Cam", cam_d); scene.collection.objects.link(cam); scene.camera = cam
cam.location = (ASP/2, 0.5, 2.0); cam.rotation_euler = (0, 0, 0)

world = bpy.data.worlds.new("W"); scene.world = world; world.use_nodes = True
bg = world.node_tree.nodes["Background"]; bg.inputs[0].default_value=(0.02,0.022,0.03,1); bg.inputs[1].default_value=1.0

scene.render.resolution_x = 960; scene.render.resolution_y = int(960/ASP)
scene.render.image_settings.file_format = 'PNG'
try: scene.render.engine = 'BLENDER_EEVEE_NEXT'
except Exception: scene.render.engine = 'BLENDER_EEVEE'
# Standard view transform so emission reads as authored (AgX was desaturating + lifting the bg)
try: scene.view_settings.view_transform = 'Standard'
except Exception: pass
scene.render.filepath = OUT
bpy.ops.render.render(write_still=True)
print("WROTE", OUT)
print("BLENDER_SIM_DONE")
