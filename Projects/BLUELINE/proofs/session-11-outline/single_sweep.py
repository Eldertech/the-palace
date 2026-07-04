#!/usr/bin/env python3
"""
BLUELINE Session 11 — THE SINGLE-SWEEP ARC GUIDE.

Loudon's steer (2026-07-03): the 5-line speed-line FAN reads as vertical streaks, not as the swing.
Replace it with ONE bold sweep that FOLLOWS THE BLADE'S ARC — a strong, single flow guide gen-AI can
distinguish (and key a 2nd pass off). The arc is not decoration; it IS the motion made legible.

The sweep is DERIVED, not drawn: the blade rotates d_wind → d_imp about ROT_AX (the same rotation the
solver already computes). We trace the tip's path over the recent swing u∈[U0,U1], U1<1 so it GAPS off
the blade, and give it a comic swoosh WIDTH that tapers thin→bold toward the impact. It rides in the
swing plane, so it faces the OTS camera and reads as one clean gesture.

  /opt/homebrew/bin/blender -b -P single_sweep.py -- --render out/s11_sweep_flat.png
"""
import bpy, bmesh, sys, os, math
import numpy as np
from mathutils import Vector, Matrix

argv = sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
def arg(n, d): return argv[argv.index(n)+1] if n in argv else d
BLEND  = arg("--blend", "../session-10-impact/out/impact.blend")
RENDER = arg("--render", "out/s11_sweep_flat.png")
SAVE   = arg("--save", "out/impact_sweep.blend")
THICK  = float(arg("--thick", "2.2"))            # freestyle line weight
FLAT   = arg("--flat", "1") == "1"               # white-emission ink mode
# ── the single-sweep arc parameters (the flow-guide control surface) ──
U0     = float(arg("--u0", "0.55"))              # arc START (further back = longer sweep)
U1     = float(arg("--u1", "0.92"))              # arc END (<1 → GAP off the blade)
R_CEN  = float(arg("--r",  "1.02"))              # center radius, ×contact-radius (sits on the blade span)
W_MAX  = float(arg("--w",  "0.30"))              # max half-width (boldness near the blade)
TAPER  = float(arg("--taper", "2.0"))            # width growth exponent (thin trail → bold head)
SOLID  = float(arg("--solid", "0.02"))           # extrude thickness so Freestyle silhouettes it
os.makedirs(os.path.dirname(RENDER) or ".", exist_ok=True)

bpy.ops.wm.open_mainfile(filepath=os.path.abspath(BLEND))
scn = bpy.context.scene

# ── recover the swing geometry from the saved scene ───────────────────────────
# The solver named the pieces; we re-derive the rotation from the blade + contact it left behind.
col   = bpy.data.objects.get("s8_col")
blade = bpy.data.objects.get("s8_blade")
COLUMN = col.location.copy() if col else Vector((1.30, 0.05, 1.05))
# The solver's SWINGS['chop'] pivot/contact (impact.blend was built with the default 'chop').
PIVOT   = Vector((0.12, 0.00, 1.40))
CONTACT = Vector((0.92, 0.02, 1.06))
d_wind  = Vector((-0.34, 0.00, 0.94)).normalized()
d_imp   = (CONTACT - PIVOT).normalized()
ROT_AX  = d_wind.cross(d_imp).normalized()
DTHETA  = d_wind.angle(d_imp)
# The GUIDE samples the arc by ANGLE, uniformly — its job is to show the PATH, not the accel
# profile (which bunches u near the windup). a∈[0,DTHETA] sweeps d_wind → d_imp about ROT_AX.
def guide_dir(a):
    return (Matrix.Rotation(a, 3, ROT_AX) @ d_wind)
Rc = (CONTACT - PIVOT).length

# ── remove the old 5-line fan ─────────────────────────────────────────────────
old = bpy.data.objects.get("s8_speed")
if old:
    bpy.data.objects.remove(old, do_unlink=True)
    print("[s11] removed the 5-line fan")

# ── build ONE bold swoosh ribbon tracing the blade arc ────────────────────────
# Two rails offset ±w(u) along the radial (blade) direction, swept along the arc. In-plane, so it
# faces the OTS cam. Width tapers thin (trail) → bold (head), and GAPS off the blade at U1<1.
N = 40
angs = np.linspace(U0*DTHETA, U1*DTHETA, N)   # U0/U1 now read as FRACTIONS of the swing angle
def w(t):  # half-width along the arc (t∈[0,1]) — thin at the trail, W_MAX toward the head
    return max(0.006, W_MAX * (t ** TAPER))
bm = bmesh.new()
rail_in, rail_out = [], []
for i, a in enumerate(angs):
    bd = guide_dir(a); t = i/(N-1)
    rail_in.append(bm.verts.new(PIVOT + bd * (R_CEN*Rc - w(t))))
    rail_out.append(bm.verts.new(PIVOT + bd * (R_CEN*Rc + w(t))))
for i in range(N-1):
    bm.faces.new((rail_in[i], rail_out[i], rail_out[i+1], rail_in[i+1]))
# give it a hair of thickness so Freestyle reads a silhouette (not a zero-volume plane)
if SOLID > 0:
    geom = bmesh.ops.extrude_face_region(bm, geom=bm.faces[:])
    verts = [g for g in geom["geom"] if isinstance(g, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, verts=verts, vec=ROT_AX * SOLID)
me = bpy.data.meshes.new("s11_sweep"); bm.to_mesh(me); bm.free()
sweep = bpy.data.objects.new("s11_sweep", me); scn.collection.objects.link(sweep)
ink = bpy.data.materials.new("s11_sweep_ink"); ink.use_nodes = True
b = ink.node_tree.nodes.get("Principled BSDF")
if b: b.inputs["Base Color"].default_value = (0.02, 0.02, 0.03, 1)
sweep.data.materials.append(ink)
print(f"[s11] single sweep: u[{U0},{U1}] r={R_CEN}×Rc w<{W_MAX} taper={TAPER} → {N*2} rail verts")

# ── DIAG: isolate the sweep to confirm placement (red, no freestyle, debris hidden) ──
if arg("--diag", "0") == "1":
    for nm in ("s8_shards", "s8_wake"):
        o = bpy.data.objects.get(nm)
        if o: o.hide_render = True
    red = bpy.data.materials.new("diag_red"); red.use_nodes = True
    rb = red.node_tree.nodes.get("Principled BSDF")
    if rb: rb.inputs["Base Color"].default_value = (1, 0, 0, 1)
    sweep.data.materials.clear(); sweep.data.materials.append(red)
    scn.render.engine = 'CYCLES'
    try: scn.cycles.samples = 8; scn.cycles.device = 'CPU'
    except Exception: pass
    scn.render.use_freestyle = False
    wd = scn.world or bpy.data.worlds.new("W"); scn.world = wd; wd.use_nodes = True
    bgn = wd.node_tree.nodes.get("Background")
    if bgn: bgn.inputs[0].default_value = (0.9, 0.9, 0.9, 1); bgn.inputs[1].default_value = 1.0
    scn.render.image_settings.file_format = 'PNG'
    scn.render.filepath = os.path.abspath(RENDER)
    bpy.ops.render.render(write_still=True)
    print(f"[s11] DIAG sweep -> {RENDER}")
    sys.exit(0)

# ── outline pipeline (Freestyle + Cycles, flat-white ink) — same as outline_test ──
scn.render.engine = 'CYCLES'
try: scn.cycles.samples = 16; scn.cycles.device = 'CPU'
except Exception as e: print("[s11] cycles:", e)
w_ = scn.world or bpy.data.worlds.new("W"); scn.world = w_; w_.use_nodes = True
bg = w_.node_tree.nodes.get("Background")
if bg:
    bg.inputs[0].default_value = (1, 1, 1, 1); bg.inputs[1].default_value = 1.0
if FLAT:
    white = bpy.data.materials.new("s11_flat_white"); white.use_nodes = True
    nt = white.node_tree
    for n in list(nt.nodes): nt.nodes.remove(n)
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs[0].default_value = (1, 1, 1, 1); em.inputs[1].default_value = 1.0
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(em.outputs[0], out.inputs[0])
    for o in scn.objects:
        if o.type == 'MESH':
            o.data.materials.clear(); o.data.materials.append(white)
scn.render.use_freestyle = True
scn.render.line_thickness_mode = 'ABSOLUTE'; scn.render.line_thickness = THICK
vl = scn.view_layers[0]; vl.use_freestyle = True
fs = vl.freestyle_settings
lineset = fs.linesets[0] if fs.linesets else fs.linesets.new("ls")
for flag in ("select_silhouette", "select_border", "select_crease", "select_contour"):
    try: setattr(lineset, flag, True)
    except Exception: pass
ls = lineset.linestyle
ls.color = (0, 0, 0); ls.thickness = THICK

scn.render.image_settings.file_format = 'PNG'
if SAVE:
    os.makedirs(os.path.dirname(SAVE) or ".", exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(SAVE)); print(f"[s11] saved {SAVE}")
scn.render.filepath = os.path.abspath(RENDER)
bpy.ops.render.render(write_still=True)
print(f"[s11] SINGLE-SWEEP outline -> {RENDER}")
