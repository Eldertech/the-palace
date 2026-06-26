"""
BLUELINE — Flow-Field Biased Spatter Proof
==========================================
Proves that ink-blob billboards can be DENSITY and DIRECTION biased by a
2D flow field so the splatter reads as authored by motion, not random.

Flow field: curl-noise composite of a few attractor/sweep terms evoking
BLUELINE's speed-line energy — strong horizontal rush through frame center
that fans out near top/bottom edges.

Changes from blob_swarm.py:
  - scatter_blobs_flowfield() replaces scatter_blobs()
  - Blobs placed by rejection-sampling positions weighted by field |magnitude|
  - Each blob's plane is ROTATED so its synth tail aligns with the local field angle
  - The flip-axis trick from blob_swarm.py still applies (random flip=±1 on X)
  - BEFORE pass (MODE='before'): pure random scatter, same pipeline, same frame
  - AFTER pass (MODE='after'): flow-biased scatter
  - Both rendered to separate dirs; a 24-frame clip (AFTER) shows camera truck

Run modes:
  python flowfield_spatter.py before
  python flowfield_spatter.py after
  (invoked twice by the shell driver)

Output dirs (relative to PROOF_ROOT):
  followups/flowfield-spatter/before/  — 1 still (frame_before.png)
  followups/flowfield-spatter/after/   — 1 still (frame_after.png)
  followups/flowfield-spatter/clip/    — 24 frames for ffmpeg
  followups/flowfield-spatter/field_preview.png  — field visualisation
"""
import bpy, math, os, json, glob, random, sys

# ── paths ────────────────────────────────────────────────────────────────────
ROOT = "/Users/loudonstearns/Documents/The Palace/Projects/BLUELINE/proofs/blender-handdrawn"
LIB  = os.path.join(ROOT, "blob-library")
HERE = os.path.join(ROOT, "followups", "flowfield-spatter")
os.makedirs(HERE, exist_ok=True)

# ── mode from argv (blender -b -P script.py -- before|after) ─────────────────
argv = sys.argv
MODE = "after"
if "--" in argv:
    rest = argv[argv.index("--") + 1:]
    if rest and rest[0] in ("before", "after", "clip"):
        MODE = rest[0]

OUTDIR = os.path.join(HERE, MODE)
os.makedirs(OUTDIR, exist_ok=True)
FRAMES = 24
RES = (1120, 880)
random.seed(42)

# ── blob library ──────────────────────────────────────────────────────────────
# Prefer the LOCAL higher-spiky synth set (synth_spiky.py) for legible thrown tails;
# fall back to the canonical blob-library/synth if the local one hasn't been built.
LOCAL_SYNTH = os.path.join(HERE, "synth")
SYNTH = sorted(glob.glob(os.path.join(LOCAL_SYNTH, "synth_*.png")))
if SYNTH:
    print(f"[flowfield] using LOCAL higher-spiky synth ({len(SYNTH)} blobs)")
else:
    SYNTH = sorted(glob.glob(os.path.join(LIB, "synth", "synth_*.png")))
    print(f"[flowfield] using canonical synth ({len(SYNTH)} blobs)")
assert SYNTH, "no synth blobs — run synth_spiky.py (local) or blob_synth.py first"
CHAR = {}
try: CHAR = json.load(open(os.path.join(LIB, "blob-character.json")))
except Exception: pass
diam  = CHAR.get("diameter_px", {})
D_LO  = diam.get("p10", 5)
D_MED = diam.get("p50", 14)
D_HI  = diam.get("p90", 40)

# ─────────────────────────────────────────────────────────────────────────────
#  FLOW FIELD
#  Domain: x in [-12, 12], z in [0, 20] (world XZ plane, viewed from -Y)
#  Returns (angle_radians, magnitude) for a point (x, z)
# ─────────────────────────────────────────────────────────────────────────────
def flow_field(x, z):
    """
    Composite field evoking BLUELINE speed-lines:
      1. Central horizontal rush  — strong horizontal sweep across mid-height
      2. Radial burst at strike   — ink explodes outward from (0.6, 2.2)
      3. Vortex curl at top-right — creates fan/arc drama in upper corner
    Each term carries weight; magnitude is the blend sum.
    """
    # normalise to [-1,1] domain for cleaner arithmetic
    nx = x / 12.0
    nz = (z - 10.0) / 10.0   # z=10 -> 0, z=0 -> -1, z=20 -> +1

    # 1. Horizontal rush: strongest near z=2.5 (mid-low), fades top/bottom
    rush_str = math.exp(-((nz + 0.75)**2) / 0.18)   # gaussian centred at z~2.5
    rush_angle = 0.0 + 0.18 * nz                     # slight upward fan away from center
    rush_x = math.cos(rush_angle) * rush_str
    rush_z = math.sin(rush_angle) * rush_str

    # 2. Radial burst from strike point (0.6, 2.2)
    bx, bz = x - 0.6, z - 2.2
    bd = math.sqrt(bx*bx + bz*bz) + 0.001
    burst_str = 0.55 * math.exp(-(bd**2) / 16.0)     # strength falloff with distance
    burst_x = (bx / bd) * burst_str
    burst_z = (bz / bd) * burst_str

    # 3. Vortex curl at upper-right corner (8, 16)
    vx, vz = x - 8.0, z - 16.0
    vd = math.sqrt(vx*vx + vz*vz) + 0.001
    vortex_str = 0.35 * math.exp(-(vd**2) / 40.0)
    # curl: perpendicular to radial direction
    vort_x = (-vz / vd) * vortex_str
    vort_z = ( vx / vd) * vortex_str

    fx = rush_x + burst_x + vort_x
    fz = rush_z + burst_z + vort_z
    angle = math.atan2(fz, fx)
    magnitude = math.sqrt(fx*fx + fz*fz)
    return angle, magnitude

# ─────────────────────────────────────────────────────────────────────────────
#  FLOW FIELD PREVIEW (PNG, runs in pure Python, no Blender)
# ─────────────────────────────────────────────────────────────────────────────
def save_field_preview():
    try:
        from PIL import Image, ImageDraw
    except ImportError:
        print("PIL not available; skipping field preview")
        return
    W, H = 480, 320
    img = Image.new("RGB", (W, H), (245, 240, 230))
    d = ImageDraw.Draw(img)
    step = 24
    for px in range(step//2, W, step):
        for py in range(step//2, H, step):
            # map pixel -> world
            wx = (px / W) * 24 - 12
            wz = (1.0 - py / H) * 20
            angle, mag = flow_field(wx, wz)
            ln = step * 0.42 * min(1.0, mag)
            ex = px + math.cos(angle) * ln
            ey = py - math.sin(angle) * ln   # screen y flips
            # colour by magnitude
            r = int(min(255, mag * 320))
            g = int(max(0, 80 - mag * 60))
            b = int(max(0, 180 - r))
            d.line([(px, py), (ex, ey)], fill=(r, g, b), width=2)
            d.ellipse([px-2, py-2, px+2, py+2], fill=(r, g, b))
    out = os.path.join(HERE, "field_preview.png")
    img.save(out)
    print(f"Field preview saved: {out}")

# ─────────────────────────────────────────────────────────────────────────────
#  BLENDER HELPERS (mirrored from blob_swarm.py)
# ─────────────────────────────────────────────────────────────────────────────
def eevee():
    items = [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items]
    for c in ('BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE'):
        if c in items: return c
    return items[0]

bpy.ops.wm.read_factory_settings(use_empty=True)
scene_coll = bpy.data.collections.new("SCENE"); bpy.context.scene.collection.children.link(scene_coll)
blob_coll  = bpy.data.collections.new("BLOBS");  bpy.context.scene.collection.children.link(blob_coll)

def link(o, coll):
    for c in list(o.users_collection): c.objects.unlink(o)
    coll.objects.link(o)

def ink_mat():
    m = bpy.data.materials.new("paper"); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    em = nt.nodes.new('ShaderNodeEmission'); em.inputs['Color'].default_value = (0.95,0.95,0.95,1)
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(em.outputs['Emission'], out.inputs['Surface']); return m

def build_scene():
    pm = ink_mat()
    bpy.ops.mesh.primitive_plane_add(size=120, location=(0,0,0))
    g = bpy.context.active_object; link(g, scene_coll); g.data.materials.append(pm)
    for side in (-1, 1):
        for i in range(7):
            y = 6 + i*7; h = random.uniform(9, 22); w = random.uniform(3.2, 4.6)
            bpy.ops.mesh.primitive_cube_add(size=1, location=(side*6.5, y, h/2))
            b = bpy.context.active_object; b.scale = (w, random.uniform(3.5,5), h)
            link(b, scene_coll); b.data.materials.append(pm)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.55, depth=2.0, location=(0.4,12,1.2))
    t = bpy.context.active_object; link(t, scene_coll); t.data.materials.append(pm)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.5, location=(0.4,12,2.5))
    hd = bpy.context.active_object; link(hd, scene_coll); hd.data.materials.append(pm)

def blob_material(path, idx):
    m = bpy.data.materials.new(f"blob_{idx}"); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    img = bpy.data.images.load(path)
    try: img.alpha_mode = 'STRAIGHT'
    except Exception: pass
    tex = nt.nodes.new('ShaderNodeTexImage'); tex.image = img
    tex.extension = 'CLIP'; tex.interpolation = 'Linear'
    thr = nt.nodes.new('ShaderNodeMath'); thr.operation = 'GREATER_THAN'
    thr.inputs[1].default_value = 0.45
    transp = nt.nodes.new('ShaderNodeBsdfTransparent')
    emis = nt.nodes.new('ShaderNodeEmission'); emis.inputs['Color'].default_value = (0,0,0,1)
    mix = nt.nodes.new('ShaderNodeMixShader')
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(tex.outputs['Alpha'], thr.inputs[0])
    nt.links.new(thr.outputs['Value'], mix.inputs['Fac'])
    nt.links.new(transp.outputs['BSDF'], mix.inputs[1])
    nt.links.new(emis.outputs['Emission'], mix.inputs[2])
    nt.links.new(mix.outputs['Shader'], out.inputs['Surface'])
    for attr, val in (('surface_render_method','DITHERED'),('blend_method','CLIP'),
                      ('alpha_threshold',0.5),('use_raytrace_refraction',False),
                      ('shadow_method','NONE'),('show_transparent_back',False),
                      ('use_backface_culling',False),('use_transparent_shadow',False)):
        try: setattr(m, attr, val)
        except Exception: pass
    return m

def make_camera():
    cd = bpy.data.cameras.new('Cam'); cd.lens = 26
    cam = bpy.data.objects.new('Cam', cd); bpy.context.scene.collection.objects.link(cam)
    cam.rotation_euler = (math.radians(86), 0, 0)
    cam.rotation_euler.rotate_axis('Z', math.radians(-7))
    bpy.context.scene.camera = cam
    return cam

# ─────────────────────────────────────────────────────────────────────────────
#  SCATTER — BEFORE (random, baseline identical to blob_swarm)
# ─────────────────────────────────────────────────────────────────────────────
def scatter_blobs_random(cam, mats_synth):
    """Pure random scatter — baseline/BEFORE pass."""
    def world_size(px): return max(0.18, px * 0.055)
    def add_blob(x, y, z, world_d):
        bpy.ops.mesh.primitive_plane_add(size=1, location=(x, y, z))
        p = bpy.context.active_object; link(p, blob_coll)
        p.data.materials.append(random.choice(mats_synth))
        con = p.constraints.new('COPY_ROTATION'); con.target = cam
        fx = random.choice([-1,1])
        p.scale = (fx*world_d, world_d, world_d)
    for _ in range(220):
        y = random.uniform(-4, 44)
        x = random.uniform(-11, 11)
        z = random.uniform(0.2, 20)
        px = random.uniform(D_LO, D_HI)
        add_blob(x, y, z, world_size(px))

# ─────────────────────────────────────────────────────────────────────────────
#  SCATTER — AFTER (flow-field biased density + direction)
# ─────────────────────────────────────────────────────────────────────────────
def scatter_blobs_flowfield(cam, mats_synth):
    """
    Flow-field biased placement:
      - Sample candidate positions across XZ space
      - Accept/reject proportional to field |magnitude| (denser where field is strong)
      - Rotate billboard plane so the blob's synth tail points along the field angle
      - Size: larger blobs where magnitude is higher (more energy = bigger splatter)
      - Flip trick retained: random ±X flip for variety within same matte
    """
    def world_size(px, mag_boost=1.0):
        return max(0.18, px * 0.055 * mag_boost)

    # elongation gain: strong-field blobs become streaks, weak ones stay round
    ELONG_K = 2.6

    def add_blob_directed(x, y, z, world_d, field_angle, mag_norm, fx=1):
        """
        DIRECTION LEGIBILITY (the key change):
          - Elongate the billboard's LOCAL X by (1 + ELONG_K * mag_norm) so a
            strong-field blob is a long streak and a weak-field blob is ~round.
          - The synth tail points along texture +X (synth_spiky.py), and local +X
            is the stretch axis, so the tail stretches WITH the streak.
          - Roll the billboard in its own plane by field_angle (local Z euler,
            added on top of the camera-facing COPY_ROTATION via use_offset) so the
            stretched +X axis lands along the flow direction on screen.
        """
        bpy.ops.mesh.primitive_plane_add(size=1, location=(x, y, z))
        p = bpy.context.active_object; link(p, blob_coll)
        p.data.materials.append(random.choice(mats_synth))
        con = p.constraints.new('COPY_ROTATION'); con.target = cam
        try:
            con.use_offset = True                 # add p.rotation_euler ON TOP of cam-facing
            p.rotation_euler = (0, 0, field_angle) # screen-plane roll -> +X aligns with flow
        except Exception:
            pass
        elong = 1.0 + ELONG_K * mag_norm          # >1 along tail/flow axis
        # local X = tail axis (stretched); local Y = cross axis (unstretched).
        # fx flips the tail front/back for variety WITHOUT shrinking the streak.
        p.scale = (fx * world_d * elong, world_d, world_d)

    # Pre-build sample grid: stratified jitter over XZ world plane
    # Rejection sample: accept with prob ~ magnitude / max_mag
    MAX_MAG = 0.0
    candidates = []
    for xi in range(60):
        for zi in range(40):
            x = -12 + (xi + random.uniform(0.2, 0.8)) * 24/60
            z = 0.2 + (zi + random.uniform(0.2, 0.8)) * 19.6/40
            angle, mag = flow_field(x, z)
            candidates.append((x, z, angle, mag))
            if mag > MAX_MAG: MAX_MAG = mag

    MAX_MAG = max(MAX_MAG, 0.01)

    # We want ~220 blobs, with density proportional to magnitude
    placed = 0
    random.shuffle(candidates)
    for (x, z, angle, mag) in candidates:
        if placed >= 220: break
        prob = 0.15 + 0.85 * (mag / MAX_MAG)   # min 15% everywhere, up to 100% at peak
        if random.random() > prob:
            continue
        # y depth: spread through scene, slight bias near strike depth
        y = random.uniform(-4, 44)
        # size: larger where magnitude is higher
        mag_norm = mag / MAX_MAG
        mag_boost = 0.7 + 1.3 * mag_norm
        px = random.uniform(D_LO, D_HI)
        fx = random.choice([-1, 1])
        world_d = world_size(px, mag_boost)
        add_blob_directed(x, y, z, world_d, angle, mag_norm, fx)
        placed += 1

    print(f"[flowfield] placed {placed} blobs")

# ─────────────────────────────────────────────────────────────────────────────
#  FREESTYLE (identical to blob_swarm.py — city lines only)
# ─────────────────────────────────────────────────────────────────────────────
def configure_freestyle():
    sc = bpy.context.scene
    sc.render.use_freestyle = True; sc.render.line_thickness_mode = 'ABSOLUTE'
    vl = sc.view_layers[0]; vl.use_freestyle = True
    fs = vl.freestyle_settings
    if len(fs.linesets) == 0: fs.linesets.new('LS')
    ls = fs.linesets[0]
    if ls.linestyle is None: ls.linestyle = bpy.data.linestyles.new('Ink')
    for a, v in (('select_silhouette',True),('select_border',True),('select_crease',True),
                 ('select_external_contour',True)):
        try: setattr(ls, a, v)
        except Exception: pass
    try:
        ls.select_by_collection = True; ls.collection = scene_coll
        ls.collection_negation = 'INCLUSIVE'
    except Exception as e:
        print("collection-limit failed:", e)
    try: ls.crease_angle = math.radians(134)
    except Exception: pass
    st = ls.linestyle; st.color = (0,0,0); st.thickness = 3.0
    st.use_chaining = True
    try: st.chaining = 'PLAIN'
    except Exception: pass
    g = st.geometry_modifiers
    try: g.new(name='samp', type='SAMPLING'); g[-1].sampling = 3.0
    except Exception: pass
    try: g.new(name='bz', type='BEZIER_CURVE'); g[-1].error = 3.0
    except Exception: pass
    try:
        g.new(name='pn', type='PERLIN_NOISE_1D'); m2 = g[-1]
        m2.amplitude = 1.0; m2.frequency = 6; m2.octaves = 2; m2.seed = 1
    except Exception: pass
    try:
        t = st.thickness_modifiers; t.new(name='c', type='CALLIGRAPHY'); cm = t[-1]
        cm.orientation = math.radians(38); cm.thickness_min = 1.0; cm.thickness_max = 9.0
    except Exception: pass
    def boil(scene):
        for gm in st.geometry_modifiers:
            if gm.type == 'PERLIN_NOISE_1D':
                gm.seed = (scene.frame_current // 2) + 1
    bpy.app.handlers.frame_change_pre.append(boil)

def set_world(v=1.0):
    w = bpy.data.worlds.new('W'); bpy.context.scene.world = w; w.use_nodes = True
    bg = w.node_tree.nodes.get('Background')
    bg.inputs['Color'].default_value = (v,v,v,1); bg.inputs['Strength'].default_value = 1

def common():
    sc = bpy.context.scene; sc.render.engine = eevee()
    try: sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'
    except Exception: pass
    try: sc.eevee.taa_render_samples = 32
    except Exception: pass
    sc.render.resolution_x, sc.render.resolution_y = RES
    sc.render.image_settings.file_format = 'PNG'

def setup_two_layer_composite():
    sc = bpy.context.scene
    sc.render.film_transparent = True
    city = sc.view_layers[0]; city.name = "City"
    blobs_vl = sc.view_layers.get("Blobs") or sc.view_layers.new("Blobs")
    city.use_pass_z = True; blobs_vl.use_pass_z = True
    city.use_freestyle = True; blobs_vl.use_freestyle = False
    def excl(vl, name, val):
        lc = vl.layer_collection.children.get(name)
        if lc is not None: lc.exclude = val
    excl(city, "BLOBS", True);  excl(city, "SCENE", False)
    excl(blobs_vl, "BLOBS", False); excl(blobs_vl, "SCENE", True)
    sc.use_nodes = True
    tree = bpy.data.node_groups.new("BlobComp", "CompositorNodeTree")
    tree.interface.new_socket("Image", in_out='OUTPUT', socket_type='NodeSocketColor')
    nodes, links = tree.nodes, tree.links
    rc = nodes.new('CompositorNodeRLayers'); rc.scene = sc; rc.layer = "City"
    rb = nodes.new('CompositorNodeRLayers'); rb.scene = sc; rb.layer = "Blobs"
    def depth(rl):
        return rl.outputs.get('Depth') or rl.outputs.get('Z')
    sub = nodes.new('ShaderNodeMath'); sub.operation = 'SUBTRACT'
    links.new(depth(rc), sub.inputs[0]); links.new(depth(rb), sub.inputs[1])
    gt = nodes.new('ShaderNodeMath'); gt.operation = 'GREATER_THAN'; gt.inputs[1].default_value = 0.0
    links.new(sub.outputs[0], gt.inputs[0])
    white = nodes.new('CompositorNodeRGB'); white.outputs[0].default_value = (1,1,1,1)
    cityW = nodes.new('CompositorNodeAlphaOver')
    links.new(white.outputs[0], cityW.inputs['Background'])
    links.new(rc.outputs['Image'], cityW.inputs['Foreground'])
    blobOver = nodes.new('CompositorNodeAlphaOver')
    links.new(cityW.outputs['Image'], blobOver.inputs['Background'])
    links.new(rb.outputs['Image'], blobOver.inputs['Foreground'])
    links.new(gt.outputs[0], blobOver.inputs['Factor'])
    gout = nodes.new('NodeGroupOutput')
    links.new(blobOver.outputs['Image'], gout.inputs[0])
    sc.compositing_node_group = tree

# ─────────────────────────────────────────────────────────────────────────────
#  CAMERA ANIMATION (sideways truck, identical to blob_swarm.py)
# ─────────────────────────────────────────────────────────────────────────────
def cam_at(cam, t):
    cam.location = (-3.4 + 6.8*t, -7 + 1.5*t, 1.5 + 0.3*t)

# ─────────────────────────────────────────────────────────────────────────────
#  MAIN
# ─────────────────────────────────────────────────────────────────────────────
print(f"\n[flowfield_spatter] MODE={MODE}\n")

# Field preview always (fast, pure Python)
save_field_preview()

build_scene()
cam = make_camera()
mats_synth = [blob_material(p, i) for i, p in enumerate(SYNTH)]

if MODE in ("before",):
    scatter_blobs_random(cam, mats_synth)
else:
    scatter_blobs_flowfield(cam, mats_synth)

configure_freestyle()
set_world(1.0)
common()
setup_two_layer_composite()

sc = bpy.context.scene
sc.frame_start = 1; sc.frame_end = FRAMES

# camera keyframes
for f in range(1, FRAMES+1):
    cam_at(cam, (f-1)/(FRAMES-1)); cam.keyframe_insert('location', frame=f)

if MODE == "before":
    # Single representative still at frame 12
    sc.frame_set(12)
    sc.render.filepath = os.path.join(OUTDIR, "frame_before.png")
    bpy.ops.render.render(write_still=True)
    print(f"[flowfield_spatter] BEFORE still -> {sc.render.filepath}")

elif MODE == "after":
    # Single representative still at frame 12
    sc.frame_set(12)
    sc.render.filepath = os.path.join(OUTDIR, "frame_after.png")
    bpy.ops.render.render(write_still=True)
    print(f"[flowfield_spatter] AFTER still -> {sc.render.filepath}")

elif MODE == "clip":
    # Full 24-frame animation
    clip_dir = os.path.join(HERE, "clip")
    os.makedirs(clip_dir, exist_ok=True)
    sc.render.filepath = os.path.join(clip_dir, "frame_")
    bpy.ops.render.render(animation=True)
    print(f"[flowfield_spatter] CLIP frames -> {clip_dir}")

print("[flowfield_spatter] DONE")
