"""
BLUELINE — ink blobs/splatter that LIVE IN 3D, for parallax.
Scatters analyzed blob mattes (blob-library/) as camera-facing alpha billboards
across a depth shell around the scene, excluded from Freestyle so they stay pure
ink. Trucks the camera to reveal real parallax (near specks streak, far blobs drift).

Run: /Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup -P blob_swarm.py
Outputs: blobspace/ frames + blobspace.mp4, plus blobspace_pair.png (near/far).
"""
import bpy, math, os, json, glob, random

ROOT = "/Users/loudonstearns/Documents/The Palace/Projects/BLUELINE/proofs/blender-handdrawn"
LIB = os.path.join(ROOT, "blob-library")
OUT = os.path.join(ROOT, "blobspace"); os.makedirs(OUT, exist_ok=True)
RES = (1120, 880); FRAMES = 30
random.seed(11)

EXTRACT = sorted(glob.glob(os.path.join(LIB, "blob_*.png")))          # authentic small specks
SYNTH = sorted(glob.glob(os.path.join(LIB, "synth", "synth_*.png")))  # crisp hi-res masses
assert EXTRACT, "run blob_analyze.py first (no mattes in blob-library/)"
if not SYNTH: SYNTH = EXTRACT  # fall back if blob_synth.py hasn't run
MATTES = EXTRACT
CHAR = {}
try: CHAR = json.load(open(os.path.join(LIB, "blob-character.json")))
except Exception: pass
diam = CHAR.get("diameter_px", {})
D_LO, D_MED, D_HI = diam.get("p10", 5), diam.get("p50", 14), diam.get("p90", 40)

def eevee():
    items = [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items]
    for c in ('BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE'):
        if c in items: return c
    return items[0]

# ---- collections so Freestyle can exclude the blobs ----
bpy.ops.wm.read_factory_settings(use_empty=True)
scene_coll = bpy.data.collections.new("SCENE"); bpy.context.scene.collection.children.link(scene_coll)
blob_coll = bpy.data.collections.new("BLOBS"); bpy.context.scene.collection.children.link(blob_coll)

def link(o, coll):
    for c in list(o.users_collection): c.objects.unlink(o)
    coll.objects.link(o)

def ink_mat():
    m = bpy.data.materials.new("paper"); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    em = nt.nodes.new('ShaderNodeEmission'); em.inputs['Color'].default_value = (0.95, 0.95, 0.95, 1)
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(em.outputs['Emission'], out.inputs['Surface']); return m

# ---- scene: low-canted burning street (depth for the blobs to parallax against) ----
def build_scene():
    pm = ink_mat()
    bpy.ops.mesh.primitive_plane_add(size=120, location=(0, 0, 0)); g = bpy.context.active_object
    link(g, scene_coll); g.data.materials.append(pm)
    for side in (-1, 1):
        for i in range(7):
            y = 6 + i * 7; h = random.uniform(9, 22); w = random.uniform(3.2, 4.6)
            bpy.ops.mesh.primitive_cube_add(size=1, location=(side * 6.5, y, h/2))
            b = bpy.context.active_object; b.scale = (w, random.uniform(3.5, 5), h)
            link(b, scene_coll); b.data.materials.append(pm)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.55, depth=2.0, location=(0.4, 12, 1.2))
    t = bpy.context.active_object; link(t, scene_coll); t.data.materials.append(pm)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.5, location=(0.4, 12, 2.5))
    hd = bpy.context.active_object; link(hd, scene_coll); hd.data.materials.append(pm)

# ---- blob billboard materials: pure-black ink cutout, HARD alpha, correct layering ----
def blob_material(path, idx):
    m = bpy.data.materials.new(f"blob_{idx}"); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    img = bpy.data.images.load(path)
    try: img.alpha_mode = 'STRAIGHT'
    except Exception: pass
    tex = nt.nodes.new('ShaderNodeTexImage'); tex.image = img
    tex.extension = 'CLIP'           # outside the matte = nothing (kills the square frame)
    tex.interpolation = 'Linear'
    # binarize the alpha -> a hard ink edge, no grey halo, no square
    thr = nt.nodes.new('ShaderNodeMath'); thr.operation = 'GREATER_THAN'
    thr.inputs[1].default_value = 0.45
    transp = nt.nodes.new('ShaderNodeBsdfTransparent')
    emis = nt.nodes.new('ShaderNodeEmission'); emis.inputs['Color'].default_value = (0, 0, 0, 1)  # pure ink
    mix = nt.nodes.new('ShaderNodeMixShader')
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(tex.outputs['Alpha'], thr.inputs[0])
    nt.links.new(thr.outputs['Value'], mix.inputs['Fac'])
    nt.links.new(transp.outputs['BSDF'], mix.inputs[1])
    nt.links.new(emis.outputs['Emission'], mix.inputs[2])
    nt.links.new(mix.outputs['Shader'], out.inputs['Surface'])
    # Blobs are isolated in their own view layer now (no Freestyle), so DITHERED is safe and
    # CORRECT: it discards the transparent fragments entirely -> no square plane edge, and the
    # depth pass is tight to the blob shape (only opaque fragments write Z).
    for attr, val in (('surface_render_method', 'DITHERED'), ('blend_method', 'CLIP'),
                      ('alpha_threshold', 0.5), ('use_raytrace_refraction', False),
                      ('shadow_method', 'NONE'), ('show_transparent_back', False),
                      ('use_backface_culling', False), ('use_transparent_shadow', False)):
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

def scatter_blobs(cam, mats_synth):
    """Place billboards across depth; cluster near a strike point with a size gradient.
    ALL blobs use crisp hi-res synth mattes (no low-res square specks). ~70% animate
    their scale so splatter appears (lands) and vanishes through the shot."""
    STRIKE = (0.6, 12, 2.2)
    def keyframe_life(p, d, fx):
        b = 1 + random.uniform(0, 0.72) * (FRAMES - 1)              # birth frame, staggered
        death = min(FRAMES + 4, b + random.uniform(0.25, 0.55) * FRAMES)
        def k(fr, mult):
            fr = max(1, min(FRAMES, int(round(fr))))
            p.scale = (fx*d*mult, d*mult, d*mult); p.keyframe_insert('scale', frame=fr)
        k(b-1, 0.001); k(b+1, 1.18); k(b+2, 1.0); k(death, 1.0); k(death+3, 0.001)  # pop in, hold, vanish
    def add_blob(x, y, z, world_d):
        bpy.ops.mesh.primitive_plane_add(size=1, location=(x, y, z))
        p = bpy.context.active_object; link(p, blob_coll)
        p.data.materials.append(random.choice(mats_synth))          # synth only -> crisp, no square
        con = p.constraints.new('COPY_ROTATION'); con.target = cam  # billboard: face camera
        fx = random.choice([-1, 1])                                 # random flip = more variety
        if random.random() < 0.7:
            keyframe_life(p, world_d, fx)                           # appear + vanish
        else:
            p.scale = (fx*world_d, world_d, world_d)                # persistent
        return p
    # px diameter -> world units. Shape character comes from the matte; size is
    # art-directed up for impact (the measured splatter was small-resolution).
    def world_size(px): return max(0.18, px * 0.055)
    # 1) strike cluster: dense near impact, big masses falling off with radius
    for _ in range(70):
        r = random.random() ** 1.8 * 9        # bias toward center
        a = random.uniform(0, 2*math.pi)
        x = STRIKE[0] + math.cos(a) * r
        z = STRIKE[2] + math.sin(a) * r * 0.7 + random.uniform(-0.5, 2.0)
        y = STRIKE[1] + random.uniform(-3, 3)
        px = random.uniform(D_MED, D_HI) * (1.6 - r/12)       # bigger near strike
        add_blob(x, max(0.1, z), y, world_size(max(D_LO, px)))
    # 2) depth field: specks spanning camera-near to far (the parallax spread)
    for _ in range(150):
        y = random.uniform(-4, 44)                            # depth: near cam (-7) to far
        x = random.uniform(-11, 11)
        z = random.uniform(0.2, 20)
        near = max(0.05, 1.0 - (y + 5) / 50)                  # nearer -> bigger on screen
        px = random.uniform(D_LO, D_MED) * (0.9 + near * 3.0)
        add_blob(x, y, z, world_size(px))
    # 3) big foreground masses very near the camera -> dramatic parallax sweep
    for _ in range(10):
        y = random.uniform(-5.5, 1.5)
        x = random.uniform(-8, 8)
        z = random.uniform(0.4, 14)
        add_blob(x, y, z, random.uniform(0.7, 1.8))

def configure_freestyle_scene_only():
    sc = bpy.context.scene
    sc.render.use_freestyle = True; sc.render.line_thickness_mode = 'ABSOLUTE'
    vl = sc.view_layers[0]; vl.use_freestyle = True
    fs = vl.freestyle_settings
    if len(fs.linesets) == 0: fs.linesets.new('LS')
    ls = fs.linesets[0]
    if ls.linestyle is None: ls.linestyle = bpy.data.linestyles.new('Ink')
    for a, v in (('select_silhouette', True), ('select_border', True), ('select_crease', True),
                 ('select_external_contour', True)):
        try: setattr(ls, a, v)
        except Exception: pass
    # EXCLUDE the blob collection: only outline SCENE geometry
    try:
        ls.select_by_collection = True; ls.collection = scene_coll
        ls.collection_negation = 'INCLUSIVE'
    except Exception as e:
        print("collection-limit failed:", e)
    try: ls.crease_angle = math.radians(134)
    except Exception: pass
    st = ls.linestyle; st.color = (0, 0, 0); st.thickness = 3.0
    st.use_chaining = True
    try: st.chaining = 'PLAIN'                                       # confident single stroke (not searching)
    except Exception: pass
    g = st.geometry_modifiers
    try: g.new(name='samp', type='SAMPLING'); g[-1].sampling = 3.0   # resample -> smooth
    except Exception: pass
    try: g.new(name='bz', type='BEZIER_CURVE'); g[-1].error = 3.0    # confident curves
    except Exception: pass
    try:
        g.new(name='pn', type='PERLIN_NOISE_1D'); m = g[-1]; m.amplitude = 1.0; m.frequency = 6; m.octaves = 2; m.seed = 1
    except Exception: pass                                           # tiny life (boil reseeds this)
    try:
        t = st.thickness_modifiers; t.new(name='c', type='CALLIGRAPHY'); cm = t[-1]
        cm.orientation = math.radians(38); cm.thickness_min = 1.0; cm.thickness_max = 9.0
    except Exception: pass
    # boil: re-seed the line noise 'on twos' so the ink wavers like hand-drawn animation
    def boil(scene):
        for gm in st.geometry_modifiers:
            if gm.type == 'PERLIN_NOISE_1D':
                gm.seed = (scene.frame_current // 2) + 1
    bpy.app.handlers.frame_change_pre.append(boil)

def set_world(v=1.0):
    w = bpy.data.worlds.new('W'); bpy.context.scene.world = w; w.use_nodes = True
    bg = w.node_tree.nodes.get('Background')
    bg.inputs['Color'].default_value = (v, v, v, 1); bg.inputs['Strength'].default_value = 1

def common():
    sc = bpy.context.scene; sc.render.engine = eevee()
    try: sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'
    except Exception: pass
    try: sc.eevee.taa_render_samples = 32
    except Exception: pass
    sc.render.resolution_x, sc.render.resolution_y = RES
    sc.render.image_settings.file_format = 'PNG'

def setup_two_layer_composite():
    """City and blobs in SEPARATE view layers so Freestyle only sees the buildings
    (complete lines, never culled behind a blob's square quad). Recombine by depth so
    buildings still occlude blobs."""
    sc = bpy.context.scene
    sc.render.film_transparent = True
    city = sc.view_layers[0]; city.name = "City"
    blobs = sc.view_layers.get("Blobs") or sc.view_layers.new("Blobs")
    city.use_pass_z = True; blobs.use_pass_z = True
    city.use_freestyle = True; blobs.use_freestyle = False
    def excl(vl, name, val):
        lc = vl.layer_collection.children.get(name)
        if lc is not None: lc.exclude = val
    excl(city, "BLOBS", True);  excl(city, "SCENE", False)   # city layer: buildings only
    excl(blobs, "BLOBS", False); excl(blobs, "SCENE", True)  # blob layer: blobs only
    # Blender 5.x compositor = a node group assigned to scene.compositing_node_group
    sc.use_nodes = True
    tree = bpy.data.node_groups.new("BlobComp", "CompositorNodeTree")
    tree.interface.new_socket("Image", in_out='OUTPUT', socket_type='NodeSocketColor')
    nodes, links = tree.nodes, tree.links
    rc = nodes.new('CompositorNodeRLayers'); rc.scene = sc; rc.layer = "City"
    rb = nodes.new('CompositorNodeRLayers'); rb.scene = sc; rb.layer = "Blobs"
    def depth(rl):
        return rl.outputs.get('Depth') or rl.outputs.get('Z')
    # zmask = 1 where a blob is CLOSER than the city pixel behind it (Math = ShaderNodeMath in 5.x)
    sub = nodes.new('ShaderNodeMath'); sub.operation = 'SUBTRACT'
    links.new(depth(rc), sub.inputs[0]); links.new(depth(rb), sub.inputs[1])
    gt = nodes.new('ShaderNodeMath'); gt.operation = 'GREATER_THAN'; gt.inputs[1].default_value = 0.0
    links.new(sub.outputs[0], gt.inputs[0])
    # opaque white paper under the city (Freestyle lines on white)
    white = nodes.new('CompositorNodeRGB'); white.outputs[0].default_value = (1, 1, 1, 1)
    cityW = nodes.new('CompositorNodeAlphaOver')   # sockets: Background / Foreground / Factor
    links.new(white.outputs[0], cityW.inputs['Background'])
    links.new(rc.outputs['Image'], cityW.inputs['Foreground'])
    # blob over city, GATED by zmask via the Alpha Over Factor (0 behind building -> hidden)
    blobOver = nodes.new('CompositorNodeAlphaOver')
    links.new(cityW.outputs['Image'], blobOver.inputs['Background'])
    links.new(rb.outputs['Image'], blobOver.inputs['Foreground'])
    links.new(gt.outputs[0], blobOver.inputs['Factor'])
    gout = nodes.new('NodeGroupOutput')
    links.new(blobOver.outputs['Image'], gout.inputs[0])
    sc.compositing_node_group = tree

# ---- build ----
build_scene()
cam = make_camera()
mats_synth = [blob_material(p, i) for i, p in enumerate(SYNTH)]
scatter_blobs(cam, mats_synth)
configure_freestyle_scene_only()
set_world(1.0)
common()
setup_two_layer_composite()

# camera truck (sideways = strongest parallax) + slight push-in
def cam_at(t):
    cam.location = (-3.4 + 6.8 * t, -7 + 1.5 * t, 1.5 + 0.3 * t)

sc = bpy.context.scene
sc.frame_start = 1; sc.frame_end = FRAMES
for f in range(1, FRAMES + 1):
    cam_at((f - 1) / (FRAMES - 1)); cam.keyframe_insert('location', frame=f)

# static near/far pair (mid frames, fuller field) for an obvious side-by-side
for tag, fr in (("near", 10), ("far", 22)):
    sc.frame_set(fr)
    sc.render.filepath = os.path.join(OUT, f"_pair_{tag}.png")
    bpy.ops.render.render(write_still=True)
# the parallax animation
sc.render.filepath = os.path.join(OUT, "frame_")
bpy.ops.render.render(animation=True)
print("BLOBSPACE DONE -", FRAMES, "frames,", len(MATTES), "mattes,", "scene+blob collections")
