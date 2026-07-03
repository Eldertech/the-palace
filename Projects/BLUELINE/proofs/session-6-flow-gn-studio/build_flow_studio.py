#!/usr/bin/env python3
"""
BLUELINE Session 6 — the Geometry-Nodes FLOW STUDIO on the real Figure Rig.

Opens the hand-posable MPFB2/Rigify studio (figure_rig_studio.blend), and wires a Geometry Nodes
flow field + particle Simulation Zone onto it, so you can OPEN the .blend and:
  • POSE the figure  — grab an IK control on `FigureRig` (foot_ik / hand_ik / torso / head …).
  • TWEAK the field  — move the `Vortex_A` / `Vortex_B` empties in the viewport (swirl centres), and
                       slide the modifier inputs on `FlowDust` (Wind, strengths, Core, Dt, Count …).
Then scrub the timeline: dust advects through the authored field and PARTS AROUND the posed body
(the obstacle is the live evaluated FigureBody mesh via Geometry Proximity — re-poses update it).

  build:  blender -b figure_rig_studio.blend -P build_flow_studio.py -- --save out/flow_studio.blend [--render out/s6_preview.png --settle 60]
"""
import bpy, sys, os
from mathutils import Vector

argv = sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
def arg(n, d): return argv[argv.index(n)+1] if n in argv else d
SAVE   = arg("--save", "out/flow_studio.blend")
RENDER = arg("--render", "")
SETTLE = int(arg("--settle", 60))
os.makedirs(os.path.dirname(SAVE) or ".", exist_ok=True)

# ── the figure + its world-space bbox (domain sizing) ─────────────────────────
fig = bpy.data.objects.get("FigureBody")
if fig is None:
    fig = max((o for o in bpy.data.objects if o.type=="MESH" and not o.name.startswith("WGT")),
              key=lambda o: len(o.data.vertices), default=None)
assert fig, "no FigureBody mesh"
deps = bpy.context.evaluated_depsgraph_get()
me = fig.evaluated_get(deps).to_mesh(); M = fig.matrix_world
co = [M @ v.co for v in me.vertices]
bmin = Vector((min(c[i] for c in co) for i in range(3)))
bmax = Vector((max(c[i] for c in co) for i in range(3)))
fig.evaluated_get(deps).to_mesh_clear()
ctr = (bmin+bmax)/2; size = (bmax-bmin).length
print(f"[s6] figure {fig.name} bbox {tuple(round(v,2) for v in bmin)}..{tuple(round(v,2) for v in bmax)} size~{size:.2f}")
mar = 0.55*size
dmin = Vector((bmin.x-1.1*size, bmin.y-mar, bmin.z-0.3*size))   # domain: long along +X (wind)
dmax = Vector((bmax.x+1.1*size, bmax.y+mar, bmax.z+0.5*size))

# ── tweak-handle empties (moveable swirl centres) ─────────────────────────────
def empty(name, loc):
    e = bpy.data.objects.get(name)
    if e is None:
        e = bpy.data.objects.new(name, None); bpy.context.collection.objects.link(e)
    e.empty_display_type='PLAIN_AXES'; e.empty_display_size=0.25*size; e.location=loc
    return e
vA = empty("Vortex_A", ctr + Vector((0.45*size, 0, 0.10*size)))   # lee / wake
vB = empty("Vortex_B", ctr + Vector((-0.15*size, 0.30*size, 0)))  # windward eddy

# ── the Geometry Nodes tree ───────────────────────────────────────────────────
ng = bpy.data.node_groups.new("BluelineFlow3D", "GeometryNodeTree")
nodes, links = ng.nodes, ng.links
def N(t, **kw):
    nd = nodes.new(t)
    for k,v in kw.items(): setattr(nd,k,v)
    return nd
def L(a,ao,b,bi): links.new(a.outputs[ao], b.inputs[bi])

# interface (modifier-exposed, tweakable)
def sock(name, itype, default=None, mn=None, mx=None, in_out='INPUT'):
    s = ng.interface.new_socket(name, in_out=in_out, socket_type=itype)
    if default is not None: s.default_value = default
    if mn is not None: s.min_value = mn
    if mx is not None: s.max_value = mx
    return s
sG   = sock("Geometry","NodeSocketGeometry")
sFig = sock("Figure","NodeSocketObject")
sVA  = sock("Vortex A","NodeSocketObject");  sVB = sock("Vortex B","NodeSocketObject")
sWind= sock("Wind","NodeSocketVector", default=(1.35*size,0,0.12*size))
sGA  = sock("Vortex A Strength","NodeSocketFloat", default=0.5*size)
sGB  = sock("Vortex B Strength","NodeSocketFloat", default=-0.32*size)
sCore= sock("Core","NodeSocketFloat", default=0.24*size, mn=0.01)
sDt  = sock("Dt","NodeSocketFloat", default=0.055, mn=0.0)
sShell=sock("Shell","NodeSocketFloat", default=0.20*size, mn=0.0)
sCtr = sock("Figure Center","NodeSocketVector", default=tuple(ctr))
sCnt = sock("Count","NodeSocketInt", default=3000, mn=0)
sDMin= sock("Domain Min","NodeSocketVector", default=tuple(dmin))
sDMax= sock("Domain Max","NodeSocketVector", default=tuple(dmax))
sDust= sock("Dust Size","NodeSocketFloat", default=0.012*size, mn=0.0)
sock("Geometry","NodeSocketGeometry", in_out='OUTPUT')

gin  = N('NodeGroupInput'); gout = N('NodeGroupOutput')

# --- seed a point cloud scattered in the domain box (deterministic by index) ---
pts   = N('GeometryNodePoints'); L(gin,"Count",pts,"Count")
idx   = N('GeometryNodeInputIndex')
rnd   = N('FunctionNodeRandomValue'); rnd.data_type='FLOAT_VECTOR'
L(gin,"Domain Min",rnd,"Min"); L(gin,"Domain Max",rnd,"Max"); L(idx,"Index",rnd,"Seed")
setp0 = N('GeometryNodeSetPosition'); L(pts,"Points",setp0,"Geometry"); L(rnd,"Value",setp0,"Position")

# --- Simulation Zone ---
sin = N('GeometryNodeSimulationInput'); sout = N('GeometryNodeSimulationOutput')
try: sin.pair_with_output(sout)
except Exception as e: print("[s6] pair:", e)
if len(sout.state_items)==0: sout.state_items.new('GEOMETRY','Geometry')
L(setp0,"Geometry",sin,0)                     # initial state = the scattered points

pos = N('GeometryNodeInputPosition')

# field: wind + Σ vortex_i(axis=world-Z): g·cross(Z, r⊥)/(|r⊥|²+core²), r⊥ = (rx,ry,0)
def vortex(vObj_sock, gStr_sock):
    oi = N('GeometryNodeObjectInfo'); oi.transform_space='RELATIVE'
    links.new(vObj_sock, oi.inputs["Object"])
    r   = N('ShaderNodeVectorMath', operation='SUBTRACT'); L(pos,"Position",r,0); L(oi,"Location",r,1)
    rperp = N('ShaderNodeVectorMath', operation='MULTIPLY'); L(r,"Vector",rperp,0)
    rperp.inputs[1].default_value=(1,1,0)
    zaxis = N('FunctionNodeInputVector'); zaxis.vector=(0,0,1)
    cr  = N('ShaderNodeVectorMath', operation='CROSS_PRODUCT'); L(zaxis,"Vector",cr,0); L(rperp,"Vector",cr,1)
    d2  = N('ShaderNodeVectorMath', operation='DOT_PRODUCT'); L(rperp,"Vector",d2,0); L(rperp,"Vector",d2,1)
    core2 = N('ShaderNodeMath', operation='MULTIPLY'); L(gin,"Core",core2,0); L(gin,"Core",core2,1)
    den = N('ShaderNodeMath', operation='ADD'); L(d2,"Value",den,0); L(core2,"Value",den,1)
    gg  = N('ShaderNodeMath', operation='DIVIDE'); links.new(gStr_sock, gg.inputs[0]); L(den,"Value",gg,1)
    term= N('ShaderNodeVectorMath', operation='SCALE'); L(cr,"Vector",term,0); L(gg,"Value",term,3)
    return term
tA = vortex(gin.outputs["Vortex A"], gin.outputs["Vortex A Strength"])
tB = vortex(gin.outputs["Vortex B"], gin.outputs["Vortex B Strength"])
vsum = N('ShaderNodeVectorMath', operation='ADD'); L(gin,"Wind",vsum,0); L(tA,"Vector",vsum,1)
vfield= N('ShaderNodeVectorMath', operation='ADD'); L(vsum,"Vector",vfield,0); L(tB,"Vector",vfield,1)

# deflect off the posed figure using its TRUE surface normal (robust in/out sign)
foi = N('GeometryNodeObjectInfo'); foi.transform_space='RELATIVE'
links.new(gin.outputs["Figure"], foi.inputs["Object"])
prox= N('GeometryNodeProximity'); prox.target_element='FACES'
L(foi,"Geometry",prox,"Geometry"); L(pos,"Position",prox,"Source Position")
signrm = N('GeometryNodeInputNormal')
sns = N('GeometryNodeSampleNearestSurface')
try: sns.data_type='FLOAT_VECTOR'
except Exception as e: print("[s6] sns dtype:", e)
L(foi,"Geometry",sns,"Mesh"); L(signrm,"Normal",sns,"Value"); L(pos,"Position",sns,"Sample Position")
# robust normal: the sampled surface normal, or normalize(pos−nearest) if the sample degenerates
flen= N('ShaderNodeVectorMath', operation='LENGTH'); L(sns,"Value",flen,0)
fbv = N('ShaderNodeVectorMath', operation='SUBTRACT'); L(pos,"Position",fbv,0); L(gin,"Figure Center",fbv,1)
fbn = N('ShaderNodeVectorMath', operation='NORMALIZE'); L(fbv,"Vector",fbn,0)
ncd = N('FunctionNodeCompare'); ncd.data_type='FLOAT'; ncd.operation='GREATER_THAN'; L(flen,"Value",ncd,0); ncd.inputs[1].default_value=0.5
nrmR= N('GeometryNodeSwitch'); nrmR.input_type='VECTOR'; L(ncd,"Result",nrmR,"Switch"); L(fbn,"Vector",nrmR,"False"); L(sns,"Value",nrmR,"True")
# cancel the velocity component INTO the surface → flow slides around the body
vn  = N('ShaderNodeVectorMath', operation='DOT_PRODUCT'); L(vfield,"Vector",vn,0); L(nrmR,"Output",vn,1)
inw = N('ShaderNodeMath', operation='MINIMUM'); L(vn,"Value",inw,0); inw.inputs[1].default_value=0.0
proj= N('ShaderNodeVectorMath', operation='SCALE'); L(nrmR,"Output",proj,0); L(inw,"Value",proj,3)
vdef= N('ShaderNodeVectorMath', operation='SUBTRACT'); L(vfield,"Vector",vdef,0); L(proj,"Vector",vdef,1)
step= N('ShaderNodeVectorMath', operation='SCALE'); L(vdef,"Vector",step,0); L(gin,"Dt",step,3)
np_ = N('ShaderNodeVectorMath', operation='ADD'); L(pos,"Position",np_,0); L(step,"Vector",np_,1)
# hard standoff: if signed distance (pos−nearest)·n < Shell, snap to nearest + n·Shell (kills sticking)
rel = N('ShaderNodeVectorMath', operation='SUBTRACT'); L(pos,"Position",rel,0); L(prox,"Position",rel,1)
signed = N('ShaderNodeVectorMath', operation='DOT_PRODUCT'); L(rel,"Vector",signed,0); L(nrmR,"Output",signed,1)
nsh = N('ShaderNodeVectorMath', operation='SCALE'); L(nrmR,"Output",nsh,0); L(gin,"Shell",nsh,3)
snap= N('ShaderNodeVectorMath', operation='ADD'); L(prox,"Position",snap,0); L(nsh,"Vector",snap,1)
# RECYCLE any particle that breaches the shell → teleport to a fresh UPWIND inlet slab.
# (Most particles deflect around via the velocity-cancel above; only the few that would
#  penetrate get recycled, so nothing ever accumulates on the body across playback.)
rmin= N('ShaderNodeSeparateXYZ'); L(gin,"Domain Min",rmin,0)
rmax= N('ShaderNodeSeparateXYZ'); L(gin,"Domain Max",rmax,0)
rlen= N('ShaderNodeMath', operation='SUBTRACT'); L(rmax,"X",rlen,0); L(rmin,"X",rlen,1)
rinx= N('ShaderNodeMath', operation='MULTIPLY_ADD'); L(rlen,"Value",rinx,0); rinx.inputs[1].default_value=0.15; L(rmin,"X",rinx,2)
rinM= N('ShaderNodeCombineXYZ'); L(rinx,"Value",rinM,"X"); L(rmax,"Y",rinM,"Y"); L(rmax,"Z",rinM,"Z")
reseed= N('FunctionNodeRandomValue'); reseed.data_type='FLOAT_VECTOR'
L(gin,"Domain Min",reseed,"Min"); L(rinM,"Vector",reseed,"Max"); L(idx,"Index",reseed,"Seed")
cond= N('FunctionNodeCompare'); cond.data_type='FLOAT'; cond.operation='LESS_THAN'
L(signed,"Value",cond,0); L(gin,"Shell",cond,1)
sw  = N('GeometryNodeSwitch'); sw.input_type='VECTOR'
L(cond,"Result",sw,"Switch"); L(np_,"Vector",sw,"False"); L(reseed,"Value",sw,"True")
# toroidal wrap into [DomainMin,DomainMax] per axis (density stays constant)
sx=N('ShaderNodeSeparateXYZ'); L(sw,"Output",sx,0)
smin=N('ShaderNodeSeparateXYZ'); L(gin,"Domain Min",smin,0)
smax=N('ShaderNodeSeparateXYZ'); L(gin,"Domain Max",smax,0)
def wrap(axis):
    w=N('ShaderNodeMath', operation='WRAP'); L(sx,axis,w,0); L(smax,axis,w,1); L(smin,axis,w,2); return w
wc=N('ShaderNodeCombineXYZ'); L(wrap("X"),"Value",wc,"X"); L(wrap("Y"),"Value",wc,"Y"); L(wrap("Z"),"Value",wc,"Z")

setp = N('GeometryNodeSetPosition'); L(sin,1,setp,"Geometry"); L(wc,"Vector",setp,"Position")  # sin OUT 1 = Geometry (0 = Delta Time)
L(setp,"Geometry",sout,1)                                                                       # sout IN 1 = Geometry (0 = Skip)

# --- instance dust on the advected points, render-ready ---
ico = N('GeometryNodeMeshIcoSphere'); ico.inputs["Subdivisions"].default_value=1
L(gin,"Dust Size",ico,"Radius")
inst= N('GeometryNodeInstanceOnPoints'); L(sout,0,inst,"Points"); L(ico,"Mesh",inst,"Instance")
real= N('GeometryNodeRealizeInstances'); L(inst,"Instances",real,"Geometry")
setm= N('GeometryNodeSetMaterial'); L(real,"Geometry",setm,"Geometry")
mdust = bpy.data.materials.get("s6_dust") or bpy.data.materials.new("s6_dust")
mdust.use_nodes=True
bsdf=mdust.node_tree.nodes.get("Principled BSDF")
if bsdf: bsdf.inputs["Base Color"].default_value=(0.02,0.02,0.03,1)
setm.inputs["Material"].default_value=mdust
L(setm,"Geometry",gout,"Geometry")

# ── host object + modifier, wire the inputs ───────────────────────────────────
dust = bpy.data.objects.get("FlowDust")
if dust is None:
    m = bpy.data.meshes.new("FlowDust"); dust = bpy.data.objects.new("FlowDust", m)
    bpy.context.collection.objects.link(dust)
for mod in list(dust.modifiers): dust.modifiers.remove(mod)
gm = dust.modifiers.new("Flow3D","NODES"); gm.node_group = ng
def setin(sockobj, val):
    try: gm[sockobj.identifier] = val
    except Exception as e: print(f"[s6] setin {sockobj.name}: {e}")
setin(sFig, fig); setin(sVA, vA); setin(sVB, vB)
gm.show_viewport = True

# ── save + optional preview render ────────────────────────────────────────────
bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(SAVE))
print(f"[s6] saved studio -> {SAVE}")
if RENDER:
    scn=bpy.context.scene
    scn.render.resolution_x, scn.render.resolution_y = 900,1200
    try: scn.eevee.taa_render_samples=24
    except Exception: pass
    for f in range(scn.frame_start, scn.frame_start+SETTLE):   # step so the sim accumulates
        scn.frame_set(f)
    scn.render.filepath=os.path.abspath(RENDER); scn.render.image_settings.file_format='PNG'
    bpy.ops.render.render(write_still=True); print(f"[s6] preview -> {RENDER}")
print("[s6] DONE")
