#!/usr/bin/env python3
"""
BLUELINE Session 8 — THE SWING SOLVER: real motion, amplified consequences.

Session 7 faked the swing (a hand-authored bezier). This models it as what it physically is: a
ROTATION. You author only { pivot, axis, angular trajectory θ(t) with a peak-at-impact speed
profile, blade rigid body }; EVERYTHING else is derived — the arc, every point's velocity
(v = ω × r), the contact velocity, the tip speed. The figure's hands IK-FOLLOW the grip along the
derived arc, so the pose is a *consequence of the swing*, not hand-set.

Split (per Loudon 2026-07-03): the MOTION is real (accurate arc, real character trajectory, somewhat-
real pose); the CONSEQUENCES are physically-sourced but COMIC-AMPLIFIED (comics are super-physical —
faster, outsized impact). So shard/​wake DIRECTIONS + relative speeds come from the derived contact
velocity; a comic gain scales the count / spread / streak-length, never the motion.

  build:  blender -b figure_rig_studio.blend -P build_swing.py -- --render out/s8_swing.png
"""
import bpy, bmesh, sys, os, math
import numpy as np
from mathutils import Vector, Matrix, Euler

argv = sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
def arg(n,d): return argv[argv.index(n)+1] if n in argv else d
RENDER = arg("--render","out/swing.png"); SAVE = arg("--save","")
SWING  = arg("--swing","chop")                 # chop | side | rising
os.makedirs(os.path.dirname(RENDER) or ".", exist_ok=True)
rng = np.random.default_rng(8)

COLUMN  = Vector((1.30, 0.05, 1.05))

# ═══ THREE SWINGS — each is just a different {pivot, windup dir, contact}; the
#     model DERIVES the arc, tip speed, contact velocity, and every consequence. ═══
#  pivot: the rotation centre · d_wind: blade direction at the top of the windup ·
#  contact: where the blade meets the column · hand: IK follow-through target ·
#  torso: (leanX, 0, twistZ)° · cam: OTS/side camera to read that swing.
SWINGS = {
  # overhead chop: pivot high, blade up-back → forward-down; contact chest height
  'chop':   dict(pivot=(0.12,0.00,1.40), d_wind=(-0.34, 0.00, 0.94), contact=(0.92,0.02,1.06),
                 hand=(0.62,0.00,1.00), torso=(24,0,0),  cam=(-1.15, 1.25,1.95)),
  # horizontal side slash: pivot at the spine, blade drawn back to the RIGHT (−Y) →
  # sweeps horizontally to +X; rotation axis ≈ vertical (Z); contact mid height
  'side':   dict(pivot=(0.10,0.00,1.16), d_wind=(-0.15,-0.96, 0.05), contact=(0.90,0.02,1.16),
                 hand=(0.60,-0.06,1.14), torso=(6,0,-26), cam=(-0.35,-2.05,1.55)),
  # rising cut: pivot low (hips), blade down-back → up-forward; contact higher;
  # rotation axis ≈ horizontal (Y); v_contact points UP
  'rising': dict(pivot=(0.08,0.00,0.92), d_wind=(-0.30, 0.00,-0.90), contact=(0.90,0.02,1.32),
                 hand=(0.60,0.00,1.16), torso=(-4,0,0),  cam=(-1.05, 1.35,1.05)),
}
cfg = SWINGS[SWING]

# ── THE SWING MODEL — a rotation about a pivot; author ω(t), derive the rest ──
CONTACT = Vector(cfg['contact'])
PIVOT   = Vector(cfg['pivot'])                 # the rotation centre
R_GRIP  = 0.52                                 # pivot→hands (arm reach)
R_TIP   = 1.42                                 # pivot→blade tip (arm + blade)
T_IMPACT= 0.25                                 # seconds windup→impact (a fast swing)
FPS     = 24
ACCEL_K = 2.5                                  # θ(u)=Δθ·u^K  → ω peaks at impact (loading→snap)
d_wind  = Vector(cfg['d_wind']).normalized()   # blade direction at the top of the windup
d_imp   = (CONTACT - PIVOT).normalized()             # blade points to the contact at impact
ROT_AX  = d_wind.cross(d_imp).normalized()           # the swing's rotation axis (DERIVED)
DTHETA  = d_wind.angle(d_imp)                         # swing amplitude (derived)

def blade_dir(u):                              # unit blade direction at swing param u∈[0,1]
    return (Matrix.Rotation(DTHETA*(u**ACCEL_K), 3, ROT_AX) @ d_wind)
def omega(u):                                  # angular speed magnitude (rad/s) — dθ/dt, peaks at u=1
    return DTHETA*ACCEL_K*(max(u,1e-6)**(ACCEL_K-1)) / T_IMPACT
def grip(u):  return PIVOT + blade_dir(u)*R_GRIP
def tip(u):   return PIVOT + blade_dir(u)*R_TIP
def vel(r,u):                                  # velocity of a point r on the rigid blade: ω × (r−pivot)
    return (omega(u)*ROT_AX).cross(r - PIVOT)

V_CONTACT = vel(CONTACT, 1.0)                  # THE physical driver of every consequence
print(f"[s9] {SWING.upper():7} Δθ={math.degrees(DTHETA):.0f}°  ω={omega(1.0):.1f} rad/s"
      f"  tip={omega(1.0)*R_TIP:.1f} m/s  |v_c|={V_CONTACT.length:.1f} m/s"
      f"  axis={tuple(round(v,2) for v in ROT_AX)}  v_c_dir={tuple(round(v,2) for v in V_CONTACT.normalized())}")

# ── comic amplification (consequences only — NEVER the motion) ────────────────
GAIN_SPREAD = 1.8      # wider spray cone than physical
GAIN_COUNT  = 2.2      # more debris than physical
GAIN_STREAK = 2.4      # longer motion-streaks (the super-physical read)
DT_STILL    = 0.018    # seconds after impact we sample the still (tuned so debris frames well)

def mat(name, rgb, rough=0.6, metal=0.0):
    m=bpy.data.materials.get(name) or bpy.data.materials.new(name); m.use_nodes=True
    b=m.node_tree.nodes.get("Principled BSDF")
    if b:
        b.inputs["Base Color"].default_value=(*rgb,1)
        if "Roughness" in b.inputs: b.inputs["Roughness"].default_value=rough
        if "Metallic" in b.inputs: b.inputs["Metallic"].default_value=metal
    return m

# ── 1. pose the figure; hands IK-FOLLOW the derived grip at impact (follow-through) ──
rig=bpy.data.objects.get("FigureRig"); body=bpy.data.objects.get("FigureBody")
GRIP = grip(1.0)
if rig:
    rig.rotation_euler=Euler((0,0,math.radians(90)),'XYZ'); bpy.context.view_layer.update()
    bpy.context.view_layer.objects.active=rig
    try: bpy.ops.object.mode_set(mode='POSE')
    except Exception as e: print("[s8] pose mode:",e)
    def place(bone, world):
        pb=rig.pose.bones.get(bone)
        if not pb: return
        Mw=Matrix.Translation(world) @ pb.matrix.to_3x3().to_4x4()
        pb.matrix=rig.matrix_world.inverted() @ Mw; bpy.context.view_layer.update()
    HT=Vector(cfg['hand'])                              # follow-through hand target for this swing
    place("hand_ik_r", HT+Vector((0,-0.05,0)))
    place("hand_ik_l", HT+Vector((-0.03,0.06,0.02)))
    place("foot_ik_l", Vector((0.58,-0.18,0)))          # lunge, weight forward
    place("foot_ik_r", Vector((-0.40,0.20,0)))
    lx,_,lz = cfg['torso']                               # (leanX, -, twistZ) degrees
    for b,f in (("torso",1.0),("chest",0.6)):
        pb=rig.pose.bones.get(b)
        if pb: pb.rotation_mode='XYZ'; pb.rotation_euler=Euler((math.radians(lx*f),0,math.radians(lz*f)),'XYZ')
    bpy.context.view_layer.update()
    try: GRIP=(rig.matrix_world @ rig.pose.bones['hand_ik_r'].matrix).translation.copy()
    except Exception as e: print("[s8] grip read:",e)
    try: bpy.ops.object.mode_set(mode='OBJECT')
    except Exception: pass
if body: body.data.materials.clear(); body.data.materials.append(mat("s8_body",(0.34,0.35,0.38)))

# ── 2. the sword along the impact blade direction, from the (actual) hands ─────
def box(name,size,loc,mat_,rot=None):
    bm=bmesh.new(); c=bmesh.ops.create_cube(bm,size=1.0)["verts"]
    for v in c: v.co=Vector((v.co.x*size[0],v.co.y*size[1],v.co.z*size[2]))
    if rot is not None: bmesh.ops.rotate(bm,verts=c,cent=Vector((0,0,0)),matrix=rot)
    me=bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o=bpy.data.objects.new(name,me); bpy.context.collection.objects.link(o); o.location=loc
    o.data.materials.append(mat_); return o
steel=mat("s8_steel",(0.30,0.31,0.34),rough=0.25,metal=0.9)
bdir=(CONTACT-GRIP).normalized(); blen=(CONTACT-GRIP).length+0.05
Rq=Vector((1,0,0)).rotation_difference(bdir).to_matrix()
box("s8_blade",(blen,0.05,0.012),GRIP+bdir*(blen*0.5),steel,rot=Rq)
box("s8_guard",(0.03,0.16,0.03),GRIP+bdir*0.03,steel,rot=Rq)
box("s8_grip",(0.13,0.03,0.03),GRIP-bdir*0.055,mat("s8_grip_m",(0.05,0.04,0.03)),rot=Rq)

# ── 3. the wooden column — WITH the wound the blade actually cut ───────────────
# DEFORMATION IS REAL HERE: the wound = the blade's swept volume, subtracted from the column
# (boolean). The column loses material exactly where the blade passed; the shards below spray
# from that gash. (Physical-max version = Cell Fracture, where the shards ARE the removed chunks.)
wood=mat("s8_wood",(0.28,0.17,0.08),rough=0.8)
bm=bmesh.new(); bmesh.ops.create_cone(bm,cap_ends=True,segments=48,radius1=0.16,radius2=0.16,depth=2.2)
me=bpy.data.meshes.new("s8_col"); bm.to_mesh(me); bm.free()
col=bpy.data.objects.new("s8_col",me); bpy.context.collection.objects.link(col); col.location=COLUMN; col.data.materials.append(wood)
kerf=box("s8_kerf",(blen+0.7, 0.11, 0.05), GRIP+bdir*((blen+0.7)*0.5), wood, rot=Rq)  # widened blade, through the column
bmod=col.modifiers.new("wound","BOOLEAN"); bmod.operation='DIFFERENCE'
try: bmod.solver='EXACT'
except Exception: pass
bmod.object=kerf; kerf.hide_render=True; kerf.hide_viewport=True
print(f"[s9] WOUND cut along the blade (kerf {round(blen+0.7,2)}×0.11×0.05 m) — material removed from the column")

# ── 4. SHARDS — direction+relative-speed from the REAL v_contact; count/spread AMPLIFIED ──
vc_dir=V_CONTACT.normalized(); vc_mag=V_CONTACT.length
tangent=ROT_AX; perp=vc_dir.cross(ROT_AX).normalized()
OUTN=(CONTACT-COLUMN).normalized()                        # column surface normal at the wound (outward)
NSH=int(40*GAIN_COUNT)
shbm=bmesh.new()
for i in range(NSH):
    burst=(vc_dir + 1.5*OUTN + Vector((0,0,rng.uniform(-0.1,0.7)))).normalized()   # blade thrust + spray off the wound
    cone=(burst + GAIN_SPREAD*(rng.normal(0,0.4)*tangent + rng.normal(0,0.4)*perp)).normalized()
    sp = vc_mag*rng.uniform(0.5,1.4)                      # relative speeds are physical
    origin = CONTACT + bdir*rng.uniform(-0.14,0.05) + Vector(tuple(rng.normal(0,0.025,3)))   # emerge FROM the gash
    pos = origin + cone*(sp*DT_STILL*rng.uniform(0.6,1.7))   # framed displacement
    s=rng.uniform(0.02,0.06)
    c=bmesh.ops.create_cube(shbm,size=1.0)["verts"]
    for v in c: v.co=Vector((v.co.x*s*rng.uniform(0.5,1.6),v.co.y*s*0.5,v.co.z*s*rng.uniform(0.5,1.6)))
    bmesh.ops.rotate(shbm,verts=c,cent=Vector((0,0,0)),matrix=Euler(tuple(rng.uniform(0,6.28,3)),'XYZ').to_matrix())
    bmesh.ops.translate(shbm,verts=c,vec=pos)
me=bpy.data.meshes.new("s8_shards"); shbm.to_mesh(me); shbm.free()
sh=bpy.data.objects.new("s8_shards",me); bpy.context.collection.objects.link(sh); sh.data.materials.append(mat("s8_shard",(0.30,0.18,0.08),rough=0.85))

# ── 5. WAKE — dust along the DERIVED swept path, kicked by the real blade velocity; AMPLIFIED spread ──
dbm=bmesh.new()
for k in range(int(180*GAIN_COUNT)):
    u=rng.uniform(0.2,1.0); base=PIVOT+blade_dir(u)*rng.uniform(R_GRIP,R_TIP)   # a point on the blade at u
    age=(1.0-u)*T_IMPACT + DT_STILL
    spread=(0.02+0.14*age)*GAIN_SPREAD
    kick=vel(base,u).normalized()*(vel(base,u).length*age*0.010*GAIN_STREAK)
    p=base+kick+Vector(tuple(rng.normal(0,spread,3)))
    c=bmesh.ops.create_icosphere(dbm,subdivisions=1,radius=0.012)["verts"]; bmesh.ops.translate(dbm,verts=c,vec=p)
me=bpy.data.meshes.new("s8_wake"); dbm.to_mesh(me); dbm.free()
wk=bpy.data.objects.new("s8_wake",me); bpy.context.collection.objects.link(wk); wk.data.materials.append(mat("s8_dust",(0.06,0.05,0.05),rough=1.0))

# ── 6. SPEED-LINES — ARCS of the swing itself, gapped off the blade ───────────
# Each line traces a point on the blade swept along the DERIVED arc (blade_dir(u) at radius r),
# so it is CURVED — it follows the motion. It runs over the RECENT swing u∈[U0,U1] with U1<1, so
# it STOPS SHORT of the blade (at u=1): a clean gap between the lines and the object they trail.
cu=bpy.data.curves.new("s8_speed",'CURVE'); cu.dimensions='3D'; cu.bevel_depth=0.013; cu.bevel_resolution=2; cu.use_fill_caps=True
Rc=(CONTACT-PIVOT).length                                # contact radius — keep lines on the VISIBLE blade span
U0,U1 = 0.70, 0.93                                        # a SHORT recent trail; U1<1 → never reaches the blade (gap)
for fr in (0.60, 0.75, 0.90, 1.02, 1.12):                # radii spanning the visible blade, fanned just past it
    us=np.linspace(U0,U1,16); sp=cu.splines.new('POLY'); sp.points.add(len(us)-1)
    for i,u in enumerate(us):
        pp=PIVOT + blade_dir(u)*(fr*Rc)                   # a blade point swept along the arc → curved
        sp.points[i].co=(*pp,1)
        sp.points[i].radius=max(0.03, ((u-U0)/(U1-U0))**1.35)   # thin trailing → thick toward the blade (gapped) end
sl=bpy.data.objects.new("s8_speed",cu); bpy.context.collection.objects.link(sl); cu.materials.append(mat("s8_line",(0.02,0.02,0.03)))

# ── 7. OTS camera down the blade; light world; render ─────────────────────────
scn=bpy.context.scene; cam=bpy.data.objects.get("Cam")
if cam:
    cam.location=Vector(cfg['cam']); look=(CONTACT+GRIP)/2+Vector((0,0,-0.05))
    cam.rotation_mode='XYZ'; cam.rotation_euler=(look-cam.location).to_track_quat('-Z','Y').to_euler()
    scn.camera=cam
    if cam.data: cam.data.lens=45
w=scn.world or bpy.data.worlds.new("W"); scn.world=w; w.use_nodes=True
bg=w.node_tree.nodes.get("Background")
if bg: bg.inputs[0].default_value=(0.86,0.87,0.89,1); bg.inputs[1].default_value=1.0
scn.render.resolution_x,scn.render.resolution_y=1000,1250
try: scn.eevee.taa_render_samples=32
except Exception: pass
scn.render.image_settings.file_format='PNG'
if SAVE: bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(SAVE)); print(f"[s8] saved {SAVE}")
scn.render.filepath=os.path.abspath(RENDER); bpy.ops.render.render(write_still=True)
print(f"[s8] swing aftermath -> {RENDER}"); print("[s8] DONE")
