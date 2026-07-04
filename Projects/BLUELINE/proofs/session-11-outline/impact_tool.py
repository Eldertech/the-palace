#!/usr/bin/env python3
"""
BLUELINE — THE IMPACT TOOL.  (generalized from session-10 build_impact.py)

An opinionated instrument that turns ONE authored action into a manipulable comic aftermath frame.
You author only the ACTION (pivot · windup · contact · pose targets · camera); the tool DERIVES the
arc, every point's velocity (v = ω × r), the contact velocity, the wound, the debris, and the single-
sweep flow guide. It hands you a .blend with NAMED COLLECTIONS you can grab and hand-tune, plus a free
outline PNG (the fast inner loop), plus — on demand — the conditioning plates the cloud render needs.

DESIGN INVARIANT: the MOTION is real (accurate arc, real pose). The CONSEQUENCES are comic-amplified —
the `punch` dial scales debris spread/count/streak and CANNOT touch the motion. "Motion real,
consequences super." Loudon's locked look (2026-07-04): spray=arc, thinned, guide LEADS.

PARAMETER SURFACE
  --action   chop | side | rising        the authored swing (the only real input)
  --punch    0..1     the ONE energy dial → debris spread · count · streak (never the motion)
  --preset   grounded | heroic | super   presets for --punch (0.35 / 0.6 / 1.0)
  --spray    arc | out                   arc = debris trails the swing (default); out = splash outward
  --density  0..1     thin/dense on top of punch (declutter without losing punch character)
  --guide-w  0.14     single-sweep half-width (raise to make the swoosh LEAD louder)
  --style    outline | greybox           outline = black-ink draft (default); greybox = shaded proxy
  --plates   0 | 1                        also emit depth / openpose / canny conditioning plates
  --save     out/impact.blend             the manipulable scene (named collections)
  --render   out/impact.png               the frame

  /opt/homebrew/bin/blender -b -P impact_tool.py -- --action chop --render out/frame.png --save out/frame.blend
"""
import bpy, bmesh, sys, os, math
import numpy as np
from mathutils import Vector, Matrix, Euler

argv = sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
def arg(n, d): return argv[argv.index(n)+1] if n in argv else d
RIG     = arg("--rig", "../blender-handdrawn/followups/rig-openpose/figure_rig_studio.blend")
ACTION  = arg("--action", "chop")
PRESETS = {"grounded": 0.35, "heroic": 0.6, "super": 1.0}
PUNCH   = float(arg("--punch", str(PRESETS.get(arg("--preset", "heroic"), 0.6))))
SPRAY   = arg("--spray", "arc")                  # LOCKED default: arc (frame-5)
DENSITY = float(arg("--density", "0.45"))        # LOCKED default: thinned
GUIDE_W = float(arg("--guide-w", "0.14"))
STYLE   = arg("--style", "outline")
PLATES  = arg("--plates", "0") == "1"
THICK   = float(arg("--thick", "2.2"))
SAVE    = arg("--save", "")
RENDER  = arg("--render", "out/impact.png")
SEED    = int(arg("--seed", "8"))
os.makedirs(os.path.dirname(RENDER) or ".", exist_ok=True)
rng = np.random.default_rng(SEED)

# ═══ THE ACTIONS — each is just a different {pivot, windup, contact}; the model DERIVES the rest ═══
COLUMN = Vector((1.30, 0.05, 1.05))
ACTIONS = {
  'chop':   dict(pivot=(0.12,0.00,1.40), d_wind=(-0.34, 0.00, 0.94), contact=(0.92,0.02,1.06),
                 hand=(0.62,0.00,1.00), torso=(24,0,0),  cam=(-1.15, 1.25,1.95)),
  'side':   dict(pivot=(0.10,0.00,1.16), d_wind=(-0.15,-0.96, 0.05), contact=(0.90,0.02,1.16),
                 hand=(0.60,-0.06,1.14), torso=(6,0,-26), cam=(-0.35,-2.05,1.55)),
  'rising': dict(pivot=(0.08,0.00,0.92), d_wind=(-0.30, 0.00,-0.90), contact=(0.90,0.02,1.32),
                 hand=(0.60,0.00,1.16), torso=(-4,0,0),  cam=(-1.05, 1.35,1.05)),
}
cfg = ACTIONS[ACTION]

# ── the swing model — a rotation about a pivot; author ω(t), derive everything ──
CONTACT = Vector(cfg['contact']); PIVOT = Vector(cfg['pivot'])
R_GRIP, R_TIP, T_IMPACT, ACCEL_K = 0.52, 1.42, 0.25, 2.5
d_wind = Vector(cfg['d_wind']).normalized()
d_imp  = (CONTACT - PIVOT).normalized()
ROT_AX = d_wind.cross(d_imp).normalized()
DTHETA = d_wind.angle(d_imp)
Rc = (CONTACT - PIVOT).length
def blade_dir(u): return (Matrix.Rotation(DTHETA*(u**ACCEL_K), 3, ROT_AX) @ d_wind)
def guide_dir(a): return (Matrix.Rotation(a, 3, ROT_AX) @ d_wind)   # angle-uniform: PATH not accel
def omega(u):     return DTHETA*ACCEL_K*(max(u,1e-6)**(ACCEL_K-1)) / T_IMPACT
def grip(u):      return PIVOT + blade_dir(u)*R_GRIP
def vel(r,u):     return (omega(u)*ROT_AX).cross(r - PIVOT)
V_CONTACT = vel(CONTACT, 1.0)
vc_dir, vc_mag = V_CONTACT.normalized(), V_CONTACT.length
print(f"[tool] {ACTION.upper()} Δθ={math.degrees(DTHETA):.0f}° |v_c|={vc_mag:.1f} m/s"
      f"  punch={PUNCH} spray={SPRAY} density={DENSITY}")

# ── the punch dial → the three consequence gains (structurally cannot touch motion) ──
GAIN_SPREAD = 0.6 + 2.0*PUNCH
GAIN_COUNT  = 0.6 + 2.6*PUNCH
GAIN_STREAK = 0.8 + 2.4*PUNCH
DT_STILL    = 0.018

# ── NAMED COLLECTIONS — the manipulable layers Loudon grabs and hand-tunes ──────
def coll(name):
    c = bpy.data.collections.get(name)
    if not c:
        c = bpy.data.collections.new(name); bpy.context.scene.collection.children.link(c)
    return c
COLLS = {}                                         # populated AFTER the rig file is opened (open wipes data)
def put(obj, name):                                # move an object into a named collection
    for c in obj.users_collection: c.objects.unlink(obj)
    COLLS[name].objects.link(obj)

def mat(name, rgb, rough=0.6, metal=0.0):
    m=bpy.data.materials.get(name) or bpy.data.materials.new(name); m.use_nodes=True
    b=m.node_tree.nodes.get("Principled BSDF")
    if b:
        b.inputs["Base Color"].default_value=(*rgb,1)
        if "Roughness" in b.inputs: b.inputs["Roughness"].default_value=rough
        if "Metallic" in b.inputs:  b.inputs["Metallic"].default_value=metal
    return m
def box(name,size,loc,mat_,rot=None):
    bm=bmesh.new(); c=bmesh.ops.create_cube(bm,size=1.0)["verts"]
    for v in c: v.co=Vector((v.co.x*size[0],v.co.y*size[1],v.co.z*size[2]))
    if rot is not None: bmesh.ops.rotate(bm,verts=c,cent=Vector((0,0,0)),matrix=rot)
    me=bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o=bpy.data.objects.new(name,me); bpy.context.scene.collection.objects.link(o); o.location=loc
    o.data.materials.append(mat_); return o

# ═══ BUILD ═══════════════════════════════════════════════════════════════════════
bpy.ops.wm.open_mainfile(filepath=os.path.abspath(RIG))
scn = bpy.context.scene
COLLS.update({n: coll(n) for n in ("FIGURE","BLADE","TARGET","WOUND","DEBRIS","GUIDE")})

# 1 — pose the figure; hands IK-FOLLOW the derived grip (pose = consequence of the swing)
rig=bpy.data.objects.get("FigureRig"); body=bpy.data.objects.get("FigureBody")
GRIP = grip(1.0)
if rig:
    rig.rotation_euler=Euler((0,0,math.radians(90)),'XYZ'); bpy.context.view_layer.update()
    bpy.context.view_layer.objects.active=rig
    try: bpy.ops.object.mode_set(mode='POSE')
    except Exception as e: print("[tool] pose mode:",e)
    def place(bone, world):
        pb=rig.pose.bones.get(bone)
        if not pb: return
        Mw=Matrix.Translation(world) @ pb.matrix.to_3x3().to_4x4()
        pb.matrix=rig.matrix_world.inverted() @ Mw; bpy.context.view_layer.update()
    HT=Vector(cfg['hand'])
    place("hand_ik_r", HT+Vector((0,-0.05,0)));    place("hand_ik_l", HT+Vector((-0.03,0.06,0.02)))
    place("foot_ik_l", Vector((0.58,-0.18,0)));     place("foot_ik_r", Vector((-0.40,0.20,0)))
    lx,_,lz = cfg['torso']
    for b,f in (("torso",1.0),("chest",0.6)):
        pb=rig.pose.bones.get(b)
        if pb: pb.rotation_mode='XYZ'; pb.rotation_euler=Euler((math.radians(lx*f),0,math.radians(lz*f)),'XYZ')
    bpy.context.view_layer.update()
    try: GRIP=(rig.matrix_world @ rig.pose.bones['hand_ik_r'].matrix).translation.copy()
    except Exception as e: print("[tool] grip read:",e)
    try: bpy.ops.object.mode_set(mode='OBJECT')
    except Exception: pass
    put(rig,"FIGURE")
if body:
    body.data.materials.clear(); body.data.materials.append(mat("body",(0.34,0.35,0.38))); put(body,"FIGURE")

# 2 — the sword along the impact blade direction, from the actual hands
steel=mat("steel",(0.30,0.31,0.34),rough=0.25,metal=0.9)
bdir=(CONTACT-GRIP).normalized(); blen=(CONTACT-GRIP).length+0.05
Rq=Vector((1,0,0)).rotation_difference(bdir).to_matrix()
for o in (box("blade",(blen,0.05,0.012),GRIP+bdir*(blen*0.5),steel,rot=Rq),
          box("guard",(0.03,0.16,0.03),GRIP+bdir*0.03,steel,rot=Rq),
          box("grip",(0.13,0.03,0.03),GRIP-bdir*0.055,mat("grip_m",(0.05,0.04,0.03)),rot=Rq)):
    put(o,"BLADE")

# 3 — the wooden column WITH the wound the blade cut (boolean = real deformation)
wood=mat("wood",(0.28,0.17,0.08),rough=0.8)
bm=bmesh.new(); bmesh.ops.create_cone(bm,cap_ends=True,segments=48,radius1=0.16,radius2=0.16,depth=2.2)
me=bpy.data.meshes.new("col"); bm.to_mesh(me); bm.free()
col=bpy.data.objects.new("col",me); scn.collection.objects.link(col); col.location=COLUMN; col.data.materials.append(wood)
kerf=box("kerf",(blen+0.7,0.11,0.05), GRIP+bdir*((blen+0.7)*0.5), wood, rot=Rq)
bmod=col.modifiers.new("wound","BOOLEAN"); bmod.operation='DIFFERENCE'
try: bmod.solver='EXACT'
except Exception: pass
bmod.object=kerf; kerf.hide_render=True; kerf.hide_viewport=True
put(col,"TARGET"); put(kerf,"WOUND")

# 4 — DEBRIS (shards + wake) — direction from real v_contact; punch/spray shape the look
OUTN=(CONTACT-COLUMN).normalized(); tangent=ROT_AX; perp=vc_dir.cross(ROT_AX).normalized()
def burst_dir():
    if SPRAY=="arc": return (vc_dir + 0.20*OUTN + Vector((0,0,rng.uniform(-0.05,0.15)))).normalized()
    return (vc_dir + 1.5*OUTN + Vector((0,0,rng.uniform(-0.1,0.7)))).normalized()
NSH=max(6,int(40*GAIN_COUNT*DENSITY)); shbm=bmesh.new()
for i in range(NSH):
    cone=(burst_dir() + GAIN_SPREAD*(rng.normal(0,0.4)*tangent + rng.normal(0,0.4)*perp)).normalized()
    sp=vc_mag*rng.uniform(0.5,1.4)
    origin=CONTACT + bdir*rng.uniform(-0.14,0.05) + Vector(tuple(rng.normal(0,0.025,3)))
    pos=origin + cone*(sp*DT_STILL*GAIN_STREAK*rng.uniform(0.6,1.7)); s=rng.uniform(0.02,0.06)
    c=bmesh.ops.create_cube(shbm,size=1.0)["verts"]
    for v in c: v.co=Vector((v.co.x*s*rng.uniform(0.5,1.6),v.co.y*s*0.5,v.co.z*s*rng.uniform(0.5,1.6)))
    bmesh.ops.rotate(shbm,verts=c,cent=Vector((0,0,0)),matrix=Matrix.Rotation(rng.uniform(0,6.28),3,tuple(rng.normal(0,1,3))))
    bmesh.ops.translate(shbm,verts=c,vec=pos)
me=bpy.data.meshes.new("shards"); shbm.to_mesh(me); shbm.free()
sh=bpy.data.objects.new("shards",me); scn.collection.objects.link(sh); sh.data.materials.append(mat("shard",(0.30,0.18,0.08),rough=0.85)); put(sh,"DEBRIS")
dbm=bmesh.new(); NW=max(20,int(180*GAIN_COUNT*DENSITY))
for k in range(NW):
    u=rng.uniform(0.2,1.0); base=PIVOT+blade_dir(u)*rng.uniform(R_GRIP,R_TIP)
    age=(1.0-u)*T_IMPACT + DT_STILL; spread=(0.02+0.14*age)*GAIN_SPREAD
    kick=vel(base,u).normalized()*(vel(base,u).length*age*0.010*GAIN_STREAK)
    p=base+kick+Vector(tuple(rng.normal(0,spread,3)))
    c=bmesh.ops.create_icosphere(dbm,subdivisions=1,radius=0.012)["verts"]; bmesh.ops.translate(dbm,verts=c,vec=p)
me=bpy.data.meshes.new("wake"); dbm.to_mesh(me); dbm.free()
wk=bpy.data.objects.new("wake",me); scn.collection.objects.link(wk); wk.data.materials.append(mat("dust",(0.06,0.05,0.05),rough=1.0)); put(wk,"DEBRIS")

# 5 — the SINGLE-SWEEP GUIDE — one bold swoosh tracing the blade arc, gapped off the blade
GU0,GU1,GR,GTAP = 0.10,0.90,1.0,1.2
N=40; angs=np.linspace(GU0*DTHETA, GU1*DTHETA, N)
def gw(t): return max(0.006, GUIDE_W*(t**GTAP))
gbm=bmesh.new(); ri,ro=[],[]
for i,a in enumerate(angs):
    bd=guide_dir(a); t=i/(N-1)
    ri.append(gbm.verts.new(PIVOT+bd*(GR*Rc-gw(t)))); ro.append(gbm.verts.new(PIVOT+bd*(GR*Rc+gw(t))))
for i in range(N-1): gbm.faces.new((ri[i],ro[i],ro[i+1],ri[i+1]))
geom=bmesh.ops.extrude_face_region(gbm,geom=gbm.faces[:])
bmesh.ops.translate(gbm,verts=[g for g in geom["geom"] if isinstance(g,bmesh.types.BMVert)],vec=ROT_AX*0.02)
me=bpy.data.meshes.new("sweep"); gbm.to_mesh(me); gbm.free()
sweep=bpy.data.objects.new("sweep",me); scn.collection.objects.link(sweep); sweep.data.materials.append(mat("ink",(0.02,0.02,0.03))); put(sweep,"GUIDE")

# 6 — camera reads the swing
cam=bpy.data.objects.get("Cam")
if cam:
    cam.location=Vector(cfg['cam']); look=(CONTACT+GRIP)/2+Vector((0,0,-0.05))
    cam.rotation_mode='XYZ'; cam.rotation_euler=(look-cam.location).to_track_quat('-Z','Y').to_euler()
    scn.camera=cam
    if cam.data: cam.data.lens=45

# 7 — SAVE the manipulable scene BEFORE the render override touches materials
if SAVE:
    os.makedirs(os.path.dirname(SAVE) or ".", exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(SAVE)); print(f"[tool] saved manipulable scene {SAVE}")

# 8 — RENDER: outline ink (default) or greybox proxy
def render_to(path):
    scn.render.image_settings.file_format='PNG'; scn.render.filepath=os.path.abspath(path)
    bpy.ops.render.render(write_still=True)
scn.render.resolution_x, scn.render.resolution_y = 1000, 1250
if STYLE=="outline":
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
else:  # greybox proxy
    scn.render.engine='CYCLES'
    try: scn.cycles.samples=24; scn.cycles.device='CPU'
    except Exception: pass
render_to(RENDER)
print(f"[tool] {STYLE.upper()} frame -> {RENDER}")
print(f"[tool] collections: {', '.join(COLLS)}")
