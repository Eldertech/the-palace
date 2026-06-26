"""
BLUELINE seam-comp-layer PROOF — Step 1
Renders THREE outputs from one Blender scene, same camera:
  city_plate.png       — Freestyle ink city (white fill), opaque (for gen-AI init + canny ctrl)
  blobs_rgba.png       — blobs-only over transparent (RGBA) — the authored comp layer
  city_with_blobs.png  — baked composite: blobs burned INTO Blender (for the 'baked' comparison)

All at 832x1040. Camera matches the existing city_toon / city_ink plates.
"""
import bpy, math, os, glob, json, random

ROOT = "/Users/loudonstearns/Documents/The Palace/Projects/BLUELINE/proofs/blender-handdrawn"
BLOB_LIB = os.path.join(ROOT, "blob-library")
OUT = "/Users/loudonstearns/Documents/The Palace/Projects/BLUELINE/proofs/blender-handdrawn/followups/seam-comp-layer"
os.makedirs(OUT, exist_ok=True)
RES = (832, 1040)
random.seed(42)

SYNTH = sorted(glob.glob(os.path.join(BLOB_LIB, "synth", "synth_*.png")))
if not SYNTH:
    SYNTH = sorted(glob.glob(os.path.join(BLOB_LIB, "blob_*.png")))
assert SYNTH, "No blob mattes found — run blob_synth.py first"

CHAR = {}
try:
    CHAR = json.load(open(os.path.join(BLOB_LIB, "blob-character.json")))
except Exception:
    pass
diam = CHAR.get("diameter_px", {})
D_LO  = diam.get("p10", 5)
D_MED = diam.get("p50", 14)
D_HI  = diam.get("p90", 40)

# ---------------------------------------------------------------------------
def eevee():
    items = [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items]
    for c in ('BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE'):
        if c in items:
            return c
    return items[0]

def world(brightness=1.0):
    w = bpy.data.worlds.new('W')
    bpy.context.scene.world = w
    w.use_nodes = True
    bg = w.node_tree.nodes.get('Background')
    bg.inputs['Color'].default_value = (brightness, brightness, brightness, 1)
    bg.inputs['Strength'].default_value = 1.0

def common_render(transparent=False):
    sc = bpy.context.scene
    sc.render.engine = eevee()
    try:
        sc.view_settings.view_transform = 'Standard'
        sc.view_settings.look = 'None'
    except Exception:
        pass
    sc.render.resolution_x, sc.render.resolution_y = RES
    sc.render.image_settings.file_format = 'PNG'
    sc.render.film_transparent = transparent
    try:
        sc.eevee.taa_render_samples = 32
    except Exception:
        pass

def ink_mat(name='paper', v=0.95):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    em = nt.nodes.new('ShaderNodeEmission')
    em.inputs['Color'].default_value = (v, v, v, 1)
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(em.outputs['Emission'], out.inputs['Surface'])
    return m

def blob_material(path, idx):
    m = bpy.data.materials.new(f"blob_{idx}")
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    img = bpy.data.images.load(path)
    try:
        img.alpha_mode = 'STRAIGHT'
    except Exception:
        pass
    tex = nt.nodes.new('ShaderNodeTexImage')
    tex.image = img
    tex.extension = 'CLIP'
    tex.interpolation = 'Linear'
    thr = nt.nodes.new('ShaderNodeMath')
    thr.operation = 'GREATER_THAN'
    thr.inputs[1].default_value = 0.45
    transp = nt.nodes.new('ShaderNodeBsdfTransparent')
    emis = nt.nodes.new('ShaderNodeEmission')
    emis.inputs['Color'].default_value = (0, 0, 0, 1)
    mix = nt.nodes.new('ShaderNodeMixShader')
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(tex.outputs['Alpha'], thr.inputs[0])
    nt.links.new(thr.outputs['Value'], mix.inputs['Fac'])
    nt.links.new(transp.outputs['BSDF'], mix.inputs[1])
    nt.links.new(emis.outputs['Emission'], mix.inputs[2])
    nt.links.new(mix.outputs['Shader'], out.inputs['Surface'])
    for attr, val in (('surface_render_method', 'DITHERED'), ('blend_method', 'CLIP'),
                      ('alpha_threshold', 0.5), ('use_raytrace_refraction', False),
                      ('shadow_method', 'NONE'), ('show_transparent_back', False),
                      ('use_backface_culling', False), ('use_transparent_shadow', False)):
        try:
            setattr(m, attr, val)
        except Exception:
            pass
    return m

def configure_freestyle(lineset_collection=None, collection_mode='INCLUSIVE'):
    sc = bpy.context.scene
    sc.render.use_freestyle = True
    sc.render.line_thickness_mode = 'ABSOLUTE'
    vl = sc.view_layers[0]
    vl.use_freestyle = True
    fs = vl.freestyle_settings
    if len(fs.linesets) == 0:
        fs.linesets.new('LS')
    ls = fs.linesets[0]
    if ls.linestyle is None:
        ls.linestyle = bpy.data.linestyles.new('Ink')
    for a, v in (('select_silhouette', True), ('select_border', True),
                 ('select_crease', True), ('select_external_contour', True)):
        try:
            setattr(ls, a, v)
        except Exception:
            pass
    if lineset_collection is not None:
        try:
            ls.select_by_collection = True
            ls.collection = lineset_collection
            ls.collection_negation = collection_mode
        except Exception as e:
            print("  collection-limit failed:", e)
    try:
        ls.crease_angle = math.radians(134)
    except Exception:
        pass
    st = ls.linestyle
    st.color = (0, 0, 0)
    st.thickness = 3.0
    st.use_chaining = True
    try:
        st.chaining = 'PLAIN'
    except Exception:
        pass
    g = st.geometry_modifiers
    try:
        g.new(name='samp', type='SAMPLING')
        g[-1].sampling = 3.0
    except Exception:
        pass
    try:
        g.new(name='bz', type='BEZIER_CURVE')
        g[-1].error = 3.0
    except Exception:
        pass
    try:
        t = st.thickness_modifiers
        t.new(name='c', type='CALLIGRAPHY')
        cm = t[-1]
        cm.orientation = math.radians(38)
        cm.thickness_min = 1.0
        cm.thickness_max = 9.0
    except Exception:
        pass

def link_obj(o, coll):
    for c in list(o.users_collection):
        c.objects.unlink(o)
    coll.objects.link(o)

def build_scene(scene_coll, pm):
    """Replicate the same city layout as seam_temporal_render.py / 01_stills.py (seed=7)."""
    random.seed(7)
    bpy.ops.mesh.primitive_plane_add(size=120, location=(0, 0, 0))
    ground = bpy.context.active_object
    link_obj(ground, scene_coll)
    ground.data.materials.append(pm)
    for side in (-1, 1):
        for i in range(8):
            y = 6 + i * 6.5
            h = random.uniform(9, 22)
            w = random.uniform(3.2, 4.6)
            bpy.ops.mesh.primitive_cube_add(size=1, location=(side * 6.5, y, h / 2))
            b = bpy.context.active_object
            b.scale = (w, random.uniform(3.5, 5), h)
            link_obj(b, scene_coll)
            b.data.materials.append(pm)
            bpy.ops.mesh.primitive_cube_add(size=1, location=(side * 6.5, y - 2, h * 0.55))
            f = bpy.context.active_object
            f.scale = (w * 0.55, 0.4, h * 0.5)
            link_obj(f, scene_coll)
            f.data.materials.append(pm)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.55, depth=2, location=(0.4, 16, 1.2))
    bpy.context.active_object.data.materials.append(pm)
    link_obj(bpy.context.active_object, scene_coll)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.5, location=(0.4, 16, 2.5))
    bpy.context.active_object.data.materials.append(pm)
    link_obj(bpy.context.active_object, scene_coll)
    d = bpy.data.lights.new('S', 'SUN')
    d.energy = 5
    o = bpy.data.objects.new('S', d)
    bpy.context.collection.objects.link(o)
    link_obj(o, scene_coll)
    o.rotation_euler = (math.radians(58), math.radians(8), math.radians(35))

def make_camera():
    """Same camera as seam_temporal_render.py."""
    cd = bpy.data.cameras.new('Cam')
    cd.lens = 26
    cam = bpy.data.objects.new('Cam', cd)
    bpy.context.collection.objects.link(cam)
    cam.location = (0.4, -9, 1.5)
    cam.rotation_euler = (math.radians(86), 0, 0)
    cam.rotation_euler.rotate_axis('Z', math.radians(-8))
    bpy.context.scene.camera = cam
    return cam

def scatter_blobs(cam, blob_coll, mats):
    """A static field at frame 1 — same distribution as blob_swarm but no animation."""
    STRIKE = (0.6, 12, 2.2)
    def world_size(px):
        return max(0.18, px * 0.055)
    # strike cluster
    for _ in range(50):
        r = random.random() ** 1.8 * 9
        a = random.uniform(0, 2 * math.pi)
        x = STRIKE[0] + math.cos(a) * r
        z = STRIKE[2] + math.sin(a) * r * 0.7 + random.uniform(-0.5, 2.0)
        y = STRIKE[1] + random.uniform(-3, 3)
        px = random.uniform(D_MED, D_HI) * (1.6 - r / 12)
        d = world_size(max(D_LO, px))
        bpy.ops.mesh.primitive_plane_add(size=1, location=(x, max(0.1, z), y))
        p = bpy.context.active_object
        link_obj(p, blob_coll)
        p.data.materials.append(random.choice(mats))
        con = p.constraints.new('COPY_ROTATION')
        con.target = cam
        fx = random.choice([-1, 1])
        p.scale = (fx * d, d, d)
    # depth field specks
    for _ in range(100):
        y = random.uniform(-4, 44)
        x = random.uniform(-11, 11)
        z = random.uniform(0.2, 20)
        near = max(0.05, 1.0 - (y + 5) / 50)
        px = random.uniform(D_LO, D_MED) * (0.9 + near * 3.0)
        d = world_size(px)
        bpy.ops.mesh.primitive_plane_add(size=1, location=(x, y, z))
        p = bpy.context.active_object
        link_obj(p, blob_coll)
        p.data.materials.append(random.choice(mats))
        con = p.constraints.new('COPY_ROTATION')
        con.target = cam
        p.scale = (random.choice([-1, 1]) * d, d, d)
    # big foreground masses
    for _ in range(8):
        y = random.uniform(-5.5, 1.5)
        x = random.uniform(-8, 8)
        z = random.uniform(0.4, 14)
        d = random.uniform(0.7, 1.8)
        bpy.ops.mesh.primitive_plane_add(size=1, location=(x, y, z))
        p = bpy.context.active_object
        link_obj(p, blob_coll)
        p.data.materials.append(random.choice(mats))
        con = p.constraints.new('COPY_ROTATION')
        con.target = cam
        p.scale = (random.choice([-1, 1]) * d, d, d)

# ===========================================================================
# RENDER 1 — city plate only (opaque white, Freestyle ink, no blobs)
# ===========================================================================
print("\n=== RENDER 1: city_plate.png ===")
bpy.ops.wm.read_factory_settings(use_empty=True)
scene_coll = bpy.data.collections.new("SCENE")
bpy.context.scene.collection.children.link(scene_coll)
pm = ink_mat()
build_scene(scene_coll, pm)
cam = make_camera()
world(1.0)
configure_freestyle()
common_render(transparent=False)
bpy.context.scene.frame_set(1)
bpy.context.scene.render.filepath = os.path.join(OUT, "city_plate.png")
bpy.ops.render.render(write_still=True)
print("  city_plate.png done")

# ===========================================================================
# RENDER 2 — blobs ONLY over transparent (RGBA comp layer)
# ===========================================================================
print("\n=== RENDER 2: blobs_rgba.png ===")
bpy.ops.wm.read_factory_settings(use_empty=True)
scene_coll2 = bpy.data.collections.new("SCENE")
bpy.context.scene.collection.children.link(scene_coll2)
blob_coll = bpy.data.collections.new("BLOBS")
bpy.context.scene.collection.children.link(blob_coll)
pm2 = ink_mat('paper2')
build_scene(scene_coll2, pm2)  # need scene geo for camera-relative billboard orientations
cam2 = make_camera()
mats = [blob_material(p, i) for i, p in enumerate(SYNTH)]
scatter_blobs(cam2, blob_coll, mats)
# Exclude SCENE layer from render — blobs only
sc2 = bpy.context.scene
# disable scene geometry rendering (keep only blobs)
vl = sc2.view_layers[0]
vl.use_freestyle = False  # no freestyle on blobs
# Hide SCENE objects from render (set them to not renderable)
lc_scene = vl.layer_collection.children.get("SCENE")
if lc_scene:
    lc_scene.exclude = True
lc_blobs = vl.layer_collection.children.get("BLOBS")
if lc_blobs:
    lc_blobs.exclude = False
world(1.0)
common_render(transparent=True)  # film transparent = blobs on alpha
sc2.render.image_settings.color_mode = 'RGBA'
sc2.frame_set(1)
sc2.render.filepath = os.path.join(OUT, "blobs_rgba.png")
bpy.ops.render.render(write_still=True)
print("  blobs_rgba.png done")

# ===========================================================================
# RENDER 3 — city + blobs baked together (for the 'baked into gen-AI' comparison)
# This is the city plate with blobs composited IN Blender using depth-ordered layers
# ===========================================================================
print("\n=== RENDER 3: city_with_blobs_baked.png ===")
bpy.ops.wm.read_factory_settings(use_empty=True)
scene_coll3 = bpy.data.collections.new("SCENE")
bpy.context.scene.collection.children.link(scene_coll3)
blob_coll3 = bpy.data.collections.new("BLOBS")
bpy.context.scene.collection.children.link(blob_coll3)
pm3 = ink_mat('paper3')
build_scene(scene_coll3, pm3)
cam3 = make_camera()
mats3 = [blob_material(p, i) for i, p in enumerate(SYNTH)]
random.seed(42)  # reset seed so blob placement matches render 2
scatter_blobs(cam3, blob_coll3, mats3)
world(1.0)
configure_freestyle(lineset_collection=scene_coll3)  # Freestyle: SCENE only, no blob outlines
common_render(transparent=False)
bpy.context.scene.frame_set(1)
bpy.context.scene.render.filepath = os.path.join(OUT, "city_with_blobs_baked.png")
bpy.ops.render.render(write_still=True)
print("  city_with_blobs_baked.png done")

print("\nSTEP 1 COMPLETE — three plates rendered to", OUT)
