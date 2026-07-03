#!/usr/bin/env python3
"""
BLUELINE Session 7 — THE AFTERMATH FRAME: the still remembers the motion.

A dramatic still is the *record* of a motion that just happened. Here: a sword has just struck a
wooden column. The frame is the moment AFTER impact — the figure in follow-through, wood shards
spraying from the contact, dusty air torn along the blade's swing arc, speed-lines on the blade.
Nothing moves, yet the frame IS the swing: everything is DERIVED FROM ONE AUTHORED MOTION (the arc)
and advanced to 'now'. (Comics call this closure — the reader runs the swing backwards from the debris.)

Layers, one source (the swing arc from windup→impact):
  • follow-through POSE  (the real MPFB2/Rigify figure)
  • the swing WAKE       (dust kicked along the blade's path, decaying with time-since-passage)
  • impact SHARDS        (wood chunks, ballistic from the contact, mid-flight at 'now')
  • SPEED-LINES          (streaks trailing the blade tip along its recent arc)

  build:  blender -b figure_rig_studio.blend -P build_aftermath.py -- --render out/s7_aftermath.png
"""
import bpy, bmesh, sys, os, math
import numpy as np
from mathutils import Vector, Matrix, Euler

argv = sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
def arg(n,d): return argv[argv.index(n)+1] if n in argv else d
RENDER = arg("--render","out/s7_aftermath.png")
SAVE   = arg("--save","")
os.makedirs(os.path.dirname(RENDER) or ".", exist_ok=True)
rng = np.random.default_rng(11)

# ── geometry of the moment (world coords; figure will face +X toward the column) ──
CONTACT = Vector((0.92, 0.02, 1.06))          # blade meets the near face of the column
COLUMN  = Vector((1.30, 0.05, 1.05))          # column centre
GRIP    = Vector((0.36, -0.05, 1.14))         # where the hands hold the sword
WINDUP  = Vector((0.05, 0.42, 2.18))          # top of the backswing
MIDARC  = Vector((0.72, 0.16, 1.80))          # bezier control → a curved overhead chop
TNOW    = 5.0                                  # 'frames' since impact (shards/wake advance)
G       = Vector((0,0,-9.8))

def bez(t):                                    # quadratic bezier windup→mid→contact (the swing path)
    return (1-t)**2*WINDUP + 2*(1-t)*t*MIDARC + t**2*CONTACT
def bez_vel(t):
    return 2*(1-t)*(MIDARC-WINDUP) + 2*t*(CONTACT-MIDARC)

# ── material helper ───────────────────────────────────────────────────────────
def mat(name, rgb, rough=0.6, metal=0.0):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name); m.use_nodes=True
    b = m.node_tree.nodes.get("Principled BSDF")
    if b:
        b.inputs["Base Color"].default_value=(*rgb,1)
        if "Roughness" in b.inputs: b.inputs["Roughness"].default_value=rough
        if "Metallic" in b.inputs: b.inputs["Metallic"].default_value=metal
    return m

# ── 1. pose the figure into a follow-through, facing +X toward the column ──────
rig = bpy.data.objects.get("FigureRig"); body = bpy.data.objects.get("FigureBody")
if rig:
    rig.rotation_euler = Euler((0,0,math.radians(90)),'XYZ')          # face +X
    bpy.context.view_layer.update()
    bpy.context.view_layer.objects.active = rig
    try: bpy.ops.object.mode_set(mode='POSE')
    except Exception as e: print("[s7] pose mode:", e)
    def place(bone, world, rot=None):
        pb = rig.pose.bones.get(bone)
        if not pb: return
        R = (rot if rot is not None else pb.matrix.to_3x3())
        Mw = Matrix.Translation(world) @ R.to_4x4()
        pb.matrix = rig.matrix_world.inverted() @ Mw
        bpy.context.view_layer.update()
    # reach both hands forward-low toward the column (sword just chopped down); lunge; lean in
    HTGT = Vector((0.60,-0.02,1.02))
    place("hand_ik_r", HTGT + Vector((0,-0.05,0)))
    place("hand_ik_l", HTGT + Vector((-0.03,0.06,0.03)))
    place("foot_ik_l", Vector((0.55,-0.18,0.0)))       # front foot (lunge)
    place("foot_ik_r", Vector((-0.42,0.20,0.0)))       # back foot
    tp = rig.pose.bones.get("torso");  ch = rig.pose.bones.get("chest")
    if tp: tp.rotation_mode='XYZ'; tp.rotation_euler=Euler((math.radians(22),0,0),'XYZ')
    if ch: ch.rotation_mode='XYZ'; ch.rotation_euler=Euler((math.radians(14),0,0),'XYZ')
    bpy.context.view_layer.update()
    # attach the sword to the ACTUAL right-hand position (robust — no IK guessing)
    try: GRIP = (rig.matrix_world @ rig.pose.bones['hand_ik_r'].matrix).translation.copy()
    except Exception as e: print("[s7] grip read:", e)
    try: bpy.ops.object.mode_set(mode='OBJECT')
    except Exception: pass
if body:
    body.data.materials.clear(); body.data.materials.append(mat("s7_body",(0.34,0.35,0.38)))

# ── 2. the sword (blade + guard + grip), resting at the contact ───────────────
def box(name, size, loc, mat_):
    bm=bmesh.new(); bmesh.ops.create_cube(bm, size=1.0);
    for v in bm.verts: v.co=Vector((v.co.x*size[0], v.co.y*size[1], v.co.z*size[2]))
    me=bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o=bpy.data.objects.new(name, me); bpy.context.collection.objects.link(o); o.location=loc
    o.data.materials.append(mat_); return o
steel=mat("s7_steel",(0.30,0.31,0.34),rough=0.25,metal=0.9)
blade_dir=(CONTACT-GRIP).normalized()
blade_len=(CONTACT-GRIP).length+0.06
blade_ctr=GRIP+blade_dir*(blade_len*0.5)
sword=box("s7_blade",(blade_len,0.05,0.012),(0,0,0),steel)
# orient blade along blade_dir
z=Vector((1,0,0)); q=z.rotation_difference(blade_dir); sword.rotation_mode='QUATERNION'; sword.rotation_quaternion=q; sword.location=blade_ctr
box("s7_guard",(0.03,0.16,0.03),GRIP+blade_dir*0.03,steel)
box("s7_grip",(0.14,0.03,0.03),GRIP-blade_dir*0.06,mat("s7_grip",(0.05,0.04,0.03)))

# ── 3. the wooden column ──────────────────────────────────────────────────────
wood=mat("s7_wood",(0.28,0.17,0.08),rough=0.8)
bm=bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=20, radius1=0.16, radius2=0.16, depth=2.2)
me=bpy.data.meshes.new("s7_column"); bm.to_mesh(me); bm.free()
col=bpy.data.objects.new("s7_column",me); bpy.context.collection.objects.link(col); col.location=COLUMN; col.data.materials.append(wood)

# ── 4. impact SHARDS — ballistic wood chunks from the contact, mid-flight ──────
NSH=46
shbm=bmesh.new()
for i in range(NSH):
    spray = blade_dir + Vector((rng.normal(0,0.5),rng.normal(0,0.5),rng.normal(0.4,0.4)))
    spray = spray.normalized()*rng.uniform(1.2,3.4)
    p = CONTACT + Vector(tuple(rng.normal(0,0.04,3)))
    pos = p + spray*(TNOW*0.06) + 0.5*G*(TNOW*0.06)**2      # ballistic to 'now'
    s = rng.uniform(0.02,0.06)
    c = bmesh.ops.create_cube(shbm, size=1.0)["verts"]
    for v in c: v.co=Vector((v.co.x*s*rng.uniform(0.5,1.5), v.co.y*s*0.5, v.co.z*s*rng.uniform(0.5,1.5)))
    ro=Euler(tuple(rng.uniform(0,6.28,3)),'XYZ').to_matrix()
    bmesh.ops.rotate(shbm, verts=c, cent=Vector((0,0,0)), matrix=ro)
    bmesh.ops.translate(shbm, verts=c, vec=pos)
me=bpy.data.meshes.new("s7_shards"); shbm.to_mesh(me); shbm.free()
sh=bpy.data.objects.new("s7_shards",me); bpy.context.collection.objects.link(sh); sh.data.materials.append(mat("s7_shard",(0.30,0.18,0.08),rough=0.85))

# ── 5. the swing WAKE — dust kicked along the blade's arc, decaying by recency ─
# emit parcels along the arc; each is kicked by the blade velocity there, then advected to 'now';
# older passages (windup) have dissipated/spread more, recent (near impact) are tight & fast.
pts=[]
for k in range(220):
    t = rng.uniform(0.15,1.0)                 # bias toward the business end of the swing
    base = bez(t); vel = bez_vel(t)
    age = (1.0 - t) * TNOW * 0.9              # time since the blade passed here
    spread = 0.025 + 0.05*age                 # older passages spread more, but keep the trail tight
    seedpts = base + Vector(tuple(rng.normal(0,spread,3)))
    drift = vel.normalized()*rng.uniform(0.0,0.08) + Vector((0,0,rng.uniform(0,0.02*age)))
    pts.append(seedpts + drift)
dbm=bmesh.new()
for p in pts:
    c=bmesh.ops.create_icosphere(dbm, subdivisions=1, radius=0.012)["verts"]
    bmesh.ops.translate(dbm, verts=c, vec=p)
me=bpy.data.meshes.new("s7_wake"); dbm.to_mesh(me); dbm.free()
wk=bpy.data.objects.new("s7_wake",me); bpy.context.collection.objects.link(wk); wk.data.materials.append(mat("s7_dust",(0.06,0.05,0.05),rough=1.0))

# ── 6. SPEED-LINES — a few tapered streaks trailing the blade tip along the arc ─
cu=bpy.data.curves.new("s7_speed",'CURVE'); cu.dimensions='3D'; cu.bevel_depth=0.014; cu.bevel_resolution=2
cu.use_fill_caps=True
for off in (-0.07,-0.025,0.02,0.06,0.10):
    sp=cu.splines.new('POLY'); ts=np.linspace(0.62,1.0,12); sp.points.add(len(ts)-1)
    for i,t in enumerate(ts):
        pp=bez(t)+Vector((0,off,off*0.3)); sp.points[i].co=(*pp,1)
        sp.points[i].radius=max(0.04,((t-0.62)/0.38)**1.6)     # taper thin up the arc → full at the blade tip
sl=bpy.data.objects.new("s7_speed",cu); bpy.context.collection.objects.link(sl); cu.materials.append(mat("s7_line",(0.02,0.02,0.03)))

# ── 7. OTS camera down the blade toward the impact; light world ───────────────
scn=bpy.context.scene
cam=bpy.data.objects.get("Cam")
if cam:
    cam.location=Vector((-1.15,1.25,1.95))                 # behind the figure's left shoulder
    look=(CONTACT+GRIP)/2 + Vector((0,0,-0.05))           # frame the blade + impact
    cam.rotation_mode='XYZ'
    cam.rotation_euler=(look-cam.location).to_track_quat('-Z','Y').to_euler()   # no-roll look-at
    scn.camera=cam
    if cam.data: cam.data.lens=45
w=scn.world or bpy.data.worlds.new("W"); scn.world=w; w.use_nodes=True
bg=w.node_tree.nodes.get("Background")
if bg: bg.inputs[0].default_value=(0.86,0.87,0.89,1); bg.inputs[1].default_value=1.0

scn.render.resolution_x, scn.render.resolution_y = 1000,1250
try: scn.eevee.taa_render_samples=32
except Exception: pass
scn.render.image_settings.file_format='PNG'
if SAVE: bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(SAVE)); print(f"[s7] saved {SAVE}")
scn.render.filepath=os.path.abspath(RENDER); bpy.ops.render.render(write_still=True)
print(f"[s7] aftermath -> {RENDER}")
print("[s7] DONE")
