#!/usr/bin/env python3
"""
BLUELINE Session 11 — DEBRIS BEHAVIOUR SPREAD.

Loudon's read on the swoosh spread: the debris DOMINATES the frame, so tuning the guide barely moves
it. The real lever is the debris. This regenerates the shards + wake with a controllable surface so we
can vary the axis that actually changes the composition:

  --punch  0..1   ONE dial → shard count · spray spread · streak length (the comic super-physics dial)
  --spray  out|arc   out = splash outward off the wound (current look, rains vertical);
                     arc = debris CARRIES ALONG the swing tangent, trailing the swoosh (motion-led)
  --density 0..1  thin/dense multiplier on top of punch (declutter without losing punch character)

Everything is DERIVED from the same rotation the solver uses (v_contact = ω × r). The single-sweep
guide is redrawn too, so each frame is a complete look. Outline ink, free + fast.

  /opt/homebrew/bin/blender -b -P debris_spread.py -- --render out/x.png --punch 0.6 --spray arc
"""
import bpy, bmesh, sys, os, math
import numpy as np
from mathutils import Vector, Matrix

argv = sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
def arg(n, d): return argv[argv.index(n)+1] if n in argv else d
BLEND   = arg("--blend", "../session-10-impact/out/impact.blend")
RENDER  = arg("--render", "out/debris.png")
THICK   = float(arg("--thick", "2.2"))
PUNCH   = float(arg("--punch", "0.6"))
SPRAY   = arg("--spray", "out")                  # out | arc
DENSITY = float(arg("--density", "1.0"))
SEED    = int(arg("--seed", "8"))
# guide params (the good single-sweep from the last pass; boldness dial-able)
GU0, GU1, GR, GTAP = 0.10, 0.90, 1.0, 1.2
GW = float(arg("--gw", "0.14"))                  # guide half-width — raise to make the swoosh LEAD
os.makedirs(os.path.dirname(RENDER) or ".", exist_ok=True)
rng = np.random.default_rng(SEED)

bpy.ops.wm.open_mainfile(filepath=os.path.abspath(BLEND))
scn = bpy.context.scene

# ── recover the swing rotation (impact.blend built with SWINGS['chop']) ───────
col = bpy.data.objects.get("s8_col")
COLUMN  = col.location.copy() if col else Vector((1.30, 0.05, 1.05))
PIVOT   = Vector((0.12, 0.00, 1.40))
CONTACT = Vector((0.92, 0.02, 1.06))
d_wind  = Vector((-0.34, 0.00, 0.94)).normalized()
d_imp   = (CONTACT - PIVOT).normalized()
ROT_AX  = d_wind.cross(d_imp).normalized()
DTHETA  = d_wind.angle(d_imp)
ACCEL_K, T_IMPACT = 2.5, 0.25
def guide_dir(a): return (Matrix.Rotation(a, 3, ROT_AX) @ d_wind)
def blade_dir(u): return (Matrix.Rotation(DTHETA*(u**ACCEL_K), 3, ROT_AX) @ d_wind)
Rc = (CONTACT - PIVOT).length
def omega(u): return DTHETA*ACCEL_K*(max(u,1e-6)**(ACCEL_K-1)) / T_IMPACT
def vel(r,u): return (omega(u)*ROT_AX).cross(r - PIVOT)
V_CONTACT = vel(CONTACT, 1.0)
vc_dir, vc_mag = V_CONTACT.normalized(), V_CONTACT.length
bdir = d_imp                                     # blade direction at impact (approx)

# ── the PUNCH dial → the three consequence gains (never touches motion) ───────
GAIN_SPREAD = 0.6 + 2.0*PUNCH                     # spray cone width
GAIN_COUNT  = 0.6 + 2.6*PUNCH                     # debris amount
GAIN_STREAK = 0.8 + 2.4*PUNCH                     # motion-streak length
DT_STILL    = 0.018

# ── remove baked debris + old guide ───────────────────────────────────────────
for nm in ("s8_shards", "s8_wake", "s8_speed"):
    o = bpy.data.objects.get(nm)
    if o: bpy.data.objects.remove(o, do_unlink=True)

# ── SPRAY direction: out (splash off wound) vs arc (carry along the swing) ─────
OUTN = (CONTACT - COLUMN).normalized()
tangent, perp = ROT_AX, vc_dir.cross(ROT_AX).normalized()
def burst_dir():
    if SPRAY == "arc":                            # debris continues along the motion, hugs the arc
        return (vc_dir + 0.20*OUTN + Vector((0,0, rng.uniform(-0.05,0.15)))).normalized()
    return (vc_dir + 1.5*OUTN + Vector((0,0, rng.uniform(-0.1,0.7)))).normalized()  # current splash

def mat(name, rgb, rough=0.7):
    m=bpy.data.materials.get(name) or bpy.data.materials.new(name); m.use_nodes=True
    b=m.node_tree.nodes.get("Principled BSDF")
    if b: b.inputs["Base Color"].default_value=(*rgb,1)
    return m

# ── SHARDS ────────────────────────────────────────────────────────────────────
NSH = max(6, int(40*GAIN_COUNT*DENSITY))
shbm = bmesh.new()
for i in range(NSH):
    cone = (burst_dir() + GAIN_SPREAD*(rng.normal(0,0.4)*tangent + rng.normal(0,0.4)*perp)).normalized()
    sp = vc_mag*rng.uniform(0.5,1.4)
    origin = CONTACT + bdir*rng.uniform(-0.14,0.05) + Vector(tuple(rng.normal(0,0.025,3)))
    pos = origin + cone*(sp*DT_STILL*GAIN_STREAK*rng.uniform(0.6,1.7))
    s = rng.uniform(0.02,0.06)
    c = bmesh.ops.create_cube(shbm,size=1.0)["verts"]
    for v in c: v.co=Vector((v.co.x*s*rng.uniform(0.5,1.6), v.co.y*s*0.5, v.co.z*s*rng.uniform(0.5,1.6)))
    bmesh.ops.rotate(shbm,verts=c,cent=Vector((0,0,0)),matrix=Matrix.Rotation(rng.uniform(0,6.28),3,tuple(rng.normal(0,1,3))))
    bmesh.ops.translate(shbm,verts=c,vec=pos)
me=bpy.data.meshes.new("s8_shards"); shbm.to_mesh(me); shbm.free()
sh=bpy.data.objects.new("s8_shards",me); scn.collection.objects.link(sh); sh.data.materials.append(mat("s8_shard",(0.30,0.18,0.08)))

# ── WAKE — dust along the swept path, kicked by real blade velocity ───────────
dbm=bmesh.new()
NW = max(20, int(180*GAIN_COUNT*DENSITY))
for k in range(NW):
    u=rng.uniform(0.2,1.0); base=PIVOT+blade_dir(u)*rng.uniform(0.52,1.42)
    age=(1.0-u)*T_IMPACT + DT_STILL
    spread=(0.02+0.14*age)*GAIN_SPREAD
    kick=vel(base,u).normalized()*(vel(base,u).length*age*0.010*GAIN_STREAK)
    p=base+kick+Vector(tuple(rng.normal(0,spread,3)))
    c=bmesh.ops.create_icosphere(dbm,subdivisions=1,radius=0.012)["verts"]; bmesh.ops.translate(dbm,verts=c,vec=p)
me=bpy.data.meshes.new("s8_wake"); dbm.to_mesh(me); dbm.free()
wk=bpy.data.objects.new("s8_wake",me); scn.collection.objects.link(wk); wk.data.materials.append(mat("s8_dust",(0.06,0.05,0.05)))

# ── the single-sweep guide (angle-uniform, gapped off the blade) ──────────────
N=40; angs=np.linspace(GU0*DTHETA, GU1*DTHETA, N)
def gw(t): return max(0.006, GW*(t**GTAP))
gbm=bmesh.new(); ri,ro=[],[]
for i,a in enumerate(angs):
    bd=guide_dir(a); t=i/(N-1)
    ri.append(gbm.verts.new(PIVOT+bd*(GR*Rc-gw(t)))); ro.append(gbm.verts.new(PIVOT+bd*(GR*Rc+gw(t))))
for i in range(N-1): gbm.faces.new((ri[i],ro[i],ro[i+1],ri[i+1]))
geom=bmesh.ops.extrude_face_region(gbm,geom=gbm.faces[:])
bmesh.ops.translate(gbm,verts=[g for g in geom["geom"] if isinstance(g,bmesh.types.BMVert)],vec=ROT_AX*0.02)
me=bpy.data.meshes.new("s11_sweep"); gbm.to_mesh(me); gbm.free()
sweep=bpy.data.objects.new("s11_sweep",me); scn.collection.objects.link(sweep); sweep.data.materials.append(mat("s11_ink",(0.02,0.02,0.03)))

# ── outline ink pipeline (Freestyle + Cycles, flat white) ─────────────────────
scn.render.engine='CYCLES'
try: scn.cycles.samples=16; scn.cycles.device='CPU'
except Exception: pass
wd=scn.world or bpy.data.worlds.new("W"); scn.world=wd; wd.use_nodes=True
bg=wd.node_tree.nodes.get("Background")
if bg: bg.inputs[0].default_value=(1,1,1,1); bg.inputs[1].default_value=1.0
white=bpy.data.materials.new("flatwhite"); white.use_nodes=True; nt=white.node_tree
for n in list(nt.nodes): nt.nodes.remove(n)
em=nt.nodes.new("ShaderNodeEmission"); em.inputs[0].default_value=(1,1,1,1); em.inputs[1].default_value=1.0
out=nt.nodes.new("ShaderNodeOutputMaterial"); nt.links.new(em.outputs[0],out.inputs[0])
for o in scn.objects:
    if o.type=='MESH': o.data.materials.clear(); o.data.materials.append(white)
scn.render.use_freestyle=True; scn.render.line_thickness_mode='ABSOLUTE'; scn.render.line_thickness=THICK
vl=scn.view_layers[0]; vl.use_freestyle=True; fs=vl.freestyle_settings
lineset=fs.linesets[0] if fs.linesets else fs.linesets.new("ls")
for flag in ("select_silhouette","select_border","select_crease","select_contour"):
    try: setattr(lineset,flag,True)
    except Exception: pass
lineset.linestyle.color=(0,0,0); lineset.linestyle.thickness=THICK
scn.render.image_settings.file_format='PNG'; scn.render.filepath=os.path.abspath(RENDER)
bpy.ops.render.render(write_still=True)
print(f"[s11] debris punch={PUNCH} spray={SPRAY} density={DENSITY} shards={NSH} -> {RENDER}")
