#!/usr/bin/env python3
"""
BLUELINE Session 5 — the flow field goes 3D, in Blender, around a POSED figure.

Moves [[The Flow Field is the Spine]] out of the 2D plane and into the actual 3D scene where the
Figure & Pose thread already lives. One AUTHORED, divergence-free field (uniform drift + vortex
filaments — the 3D form of Session 3/4's curl-of-potential) is read TWO ways in the SAME 3D scene:
  1. particles advected through it (the sim / cinema leg), and
  2. streamlines integrated through it (the drawn / comic leg),
both PARTING AROUND the posed body — the obstacle is the real 3D figure mesh (a BVH of it), not a
2D mannequin mask (closes Session 4's honest limit). Single-source: both legs read the one field.

Determinism: numpy default_rng(SEED) + a fixed field → the whole run is reproducible (an instrument,
not a simulation you re-roll). Blender-local, no GPU rent.

  run:  blender -b <posed>.blend -P session5_flow3d.py -- --out out --still 80 [--seq 0 --frames 96]
        (defaults to the track-IV-bench figure it is launched on: IV-A = sword-draw lunge, worm's-eye)
"""
import bpy, bmesh, sys, os, math
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree

# ── args (after `--`) ────────────────────────────────────────────────────────
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
def arg(name, default):
    return argv[argv.index(name) + 1] if name in argv else default
OUT   = arg("--out", os.path.join(os.path.dirname(bpy.data.filepath) or ".", "out"))
STILL = int(arg("--still", 80))     # settle N frames, then render one still
SEQ   = int(arg("--seq", 0))        # 1 = also render a frame sequence
FRAMES= int(arg("--frames", 96))
SEED  = int(arg("--seed", 7))
N     = int(arg("--n", 1400))       # particle count
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(SEED)

# ── 1. the posed body → a BVH obstacle (metaball or mesh, evaluated, world space) ──
body = next((o for o in bpy.data.objects if o.type in ("META", "MESH")
             and o.name.lower().startswith(("body", "figure", "mannequin", "human"))), None)
if body is None:
    body = max((o for o in bpy.data.objects if o.type in ("META", "MESH")),
               key=lambda o: o.dimensions.length, default=None)
if body is None:
    raise SystemExit("[s5] no body object found in the blend")
print(f"[s5] obstacle: {body.name} ({body.type})")

deps = bpy.context.evaluated_depsgraph_get()
me = body.evaluated_get(deps).to_mesh()
M = body.matrix_world
verts_w = [M @ v.co for v in me.vertices]
polys = [tuple(p.vertices) for p in me.polygons]
bvh = BVHTree.FromPolygons([tuple(v) for v in verts_w], polys, all_triangles=False)
vw = np.array([tuple(v) for v in verts_w])
bmin, bmax = vw.min(0), vw.max(0)
ctr = (bmin + bmax) / 2
size = float(np.linalg.norm(bmax - bmin))
print(f"[s5] body bbox {np.round(bmin,2)}..{np.round(bmax,2)}  size~{size:.2f}")
body.evaluated_get(deps).to_mesh_clear()

# ── 2. the AUTHORED 3D field — divergence-free: uniform drift + vortex filaments ──
# v(p) = drift + Σ g_i · (a_i × r⊥) / (|r⊥|² + core²),  r = p−c_i, r⊥ = r − (r·a_i)a_i.
# Each term is divergence-free (a curl). The wind is aligned to the CAMERA (blows screen
# left→right at the figure's depth) so the parting-around-the-body reads from this shot.
def _unit(v):
    v = np.array(v, float); n = np.linalg.norm(v); return v / n if n else v
_cam = next((o for o in bpy.data.objects if o.type == "CAMERA"), None)
_mw = _cam.matrix_world.to_3x3() if _cam else None
RIGHT = _unit(_mw @ Vector((1,0,0))) if _mw else np.array([1.,0,0])   # screen →
UP    = _unit(_mw @ Vector((0,1,0))) if _mw else np.array([0,0,1.])   # screen ↑
FWD   = _unit(_mw @ Vector((0,0,-1))) if _mw else np.array([0,1.,0])  # into screen (depth)
WIND = RIGHT * (1.05 * size)
# vortices in camera frame: a lee swirl just downwind of the body (visible wake), a rising
# eddy on the windward shoulder, a counter-swirl for asymmetry — all divergence-free.
VORT = [
    dict(c=ctr + RIGHT*(0.34*size) + UP*(0.12*size), a=FWD,  g= 0.85*size, core=0.14*size),  # wake (tight, near-body)
    dict(c=ctr - RIGHT*(0.30*size) + UP*(0.15*size), a=FWD,  g=-0.55*size, core=0.22*size),  # windward eddy
    dict(c=ctr + RIGHT*(0.10*size) - UP*(0.20*size), a=UP,   g= 0.45*size, core=0.20*size),  # low cross-swirl
]
def field(P):                          # P: (K,3) -> (K,3), vectorised
    V = np.tile(WIND, (P.shape[0], 1)).astype(np.float64)
    for w in VORT:
        r = P - w["c"]
        rpar = (r @ w["a"])[:, None] * w["a"]
        rperp = r - rpar
        cross = np.cross(np.tile(w["a"], (P.shape[0], 1)), rperp)
        denom = (np.einsum("ij,ij->i", rperp, rperp) + w["core"]**2)[:, None]
        V += w["g"] * cross / denom
    return V

# ── obstacle deflection: cancel inward velocity + keep particles off the surface ──
R = 0.16 * size                        # influence shell
def deflect(P, V):
    for i in range(P.shape[0]):
        loc, nrm, idx, dist = bvh.find_nearest(Vector(P[i]), R * 2.5)
        if idx is None or dist is None or dist > R:
            continue
        n = np.array(nrm); vn = V[i] @ n
        if vn < 0:                     # moving into the body → slide along the surface
            V[i] -= vn * n
        if dist < R * 0.55:            # too close → push back out along the normal
            P[i] = np.array(loc) + n * (R * 0.55)
    return P, V

# ── 3. seed an upwind CURTAIN in the camera frame, concentrated at the body's depth ──
# spread across screen-up (tall), a NARROW depth band around the body (so particles actually
# meet the figure and must part), starting upwind (−RIGHT). Flow then sweeps left→right.
def seed(k):
    s = -0.65*size + rng.uniform(0, 0.30*size, k)      # upwind offset along RIGHT
    u = rng.uniform(-0.75*size, 0.95*size, k)          # screen-vertical span
    d = rng.uniform(-0.38*size, 0.38*size, k)          # depth band around the body
    return ctr + s[:,None]*RIGHT + u[:,None]*UP + d[:,None]*FWD
P = seed(N)
S_OUT = 0.8*size                       # recycle once a particle is this far downwind (along RIGHT)
DT, SUB = 0.9/max(size,1e-6), 3       # step; small substeps for clean deflection

def step():
    global P
    for _ in range(SUB):
        V = field(P)
        P, _v = deflect(P, V)
        P = P + V * (DT / SUB)
    s = (P - ctr) @ RIGHT              # downwind coordinate
    out = s > S_OUT                    # recycle exited particles back at the upwind curtain
    if out.any():
        P[out] = seed(int(out.sum()))

# ── 4. streamlines from the SAME field (the drawn leg) — also part around the body ──
def streamlines(nu=9, nd=4, steps=280, h=None):
    h = h or (0.45/max(size,1e-6))
    us = np.linspace(-0.65*size, 0.85*size, nu)        # screen-vertical seeds
    ds = np.linspace(-0.30*size, 0.30*size, nd)        # a few depths near the body
    lines = []
    for uu in us:
        for dd in ds:
            p = ctr - RIGHT*(0.60*size) + UP*uu + FWD*dd
            pts = [p.copy()]
            for _ in range(steps):
                v = field(p[None])[0]
                p2 = p + v*h
                loc, nrm, idx, dist = bvh.find_nearest(Vector(p2), R*2.5)
                if idx is not None and dist is not None and dist < R:
                    n = np.array(nrm); vn = v @ n
                    if vn < 0: v = v - vn*n
                    p2 = p + v*h
                    if dist < R*0.55: p2 = np.array(loc) + n*(R*0.55)
                p = p2; pts.append(p.copy())
                if (p - ctr) @ RIGHT > S_OUT: break
            if len(pts) > 8: lines.append(np.array(pts))
    return lines

# ── 5. bake into Blender geometry + materials, render natively ────────────────
def mat(name, rgb, emit=0.0):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True; bsdf = m.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (*rgb, 1)
        if "Roughness" in bsdf.inputs: bsdf.inputs["Roughness"].default_value = 0.6
        for k in ("Emission Color", "Emission"):
            if k in bsdf.inputs:
                try: bsdf.inputs[k].default_value = (*[c*emit for c in rgb], 1)
                except Exception: pass
        if "Emission Strength" in bsdf.inputs: bsdf.inputs["Emission Strength"].default_value = emit
    return m

def points_mesh(P, name, r):
    bm = bmesh.new()
    for p in P:
        c = bmesh.ops.create_icosphere(bm, subdivisions=1, radius=r)["verts"]
        bmesh.ops.translate(bm, verts=c, vec=Vector(p))
    me2 = bpy.data.meshes.new(name); bm.to_mesh(me2); bm.free()
    ob = bpy.data.objects.new(name, me2); bpy.context.collection.objects.link(ob)
    ob.data.materials.append(mat("s5_dust", (0.02,0.02,0.03), 0.0))
    return ob

def curves_obj(lines, name):
    cu = bpy.data.curves.new(name, 'CURVE'); cu.dimensions='3D'
    cu.bevel_depth = 0.006*size; cu.bevel_resolution = 1
    for pts in lines:
        sp = cu.splines.new('POLY'); sp.points.add(len(pts)-1)
        for i,p in enumerate(pts): sp.points[i].co = (*p, 1)
    ob = bpy.data.objects.new(name, cu); bpy.context.collection.objects.link(ob)
    cu.materials.append(mat("s5_flow", (0.03,0.05,0.12), 0.0))
    return ob

# world → light bg so the dark flow reads; figure → matte grey silhouette
w = bpy.context.scene.world or bpy.data.worlds.new("W")
bpy.context.scene.world = w; w.use_nodes = True
bg = w.node_tree.nodes.get("Background")
if bg: bg.inputs[0].default_value = (0.88,0.89,0.9,1); bg.inputs[1].default_value = 1.0
body.data.materials.clear()                     # META and MESH both carry .materials
body.data.materials.append(mat("s5_body", (0.30, 0.31, 0.34)))

scn = bpy.context.scene
scn.camera = next((o for o in bpy.data.objects if o.type=="CAMERA"), scn.camera)
try:
    scn.render.resolution_x, scn.render.resolution_y = 900, 1200
    scn.eevee.taa_render_samples = 24
except Exception: pass
scn.render.image_settings.file_format = 'PNG'

def render(path):
    scn.render.filepath = path
    bpy.ops.render.render(write_still=True)
    print(f"[s5] wrote {path}")

# streamlines are static (one field) — build once
sl = curves_obj(streamlines(), "s5_streamlines")

# settle the particle flow, then render the still
for f in range(STILL): step()
det = float(np.round(P.sum(), 4))       # determinism fingerprint
print(f"[s5] settled {STILL} frames; particle-sum fingerprint = {det}")
dust = points_mesh(P, "s5_dust_pts", r=0.012*size)
render(os.path.join(OUT, "s5_still.png"))

# optional: a short sequence to see it move (PNG seq → assemble with ffmpeg later)
if SEQ:
    for f in range(FRAMES):
        step()
        for o in list(bpy.data.objects):
            if o.name == "s5_dust_pts":
                bpy.data.objects.remove(o, do_unlink=True)
        points_mesh(P, "s5_dust_pts", r=0.012*size)
        render(os.path.join(OUT, f"seq_{f:03d}.png"))
    print(f"[s5] sequence: {FRAMES} frames in {OUT}")
print("[s5] DONE")
