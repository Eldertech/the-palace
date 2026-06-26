"""
BLUELINE seam-comp-layer PROOF — Step 5: real Z-pass depth render

Renders two depth (Z) passes to OpenEXR, sharing the EXACT same camera as the
step1 plates (26mm, low-canted, seed=7 city, blob seed=42):

  city_depth.exr   — Z of the city geometry only (buildings/ground/figure)
  blob_depth.exr   — Z of the blob billboards only

These are read in numpy (cv2) in step6 to compute the per-pixel occlusion mask
(city_Z > blob_Z => blob is closer => show it).

Z pass via the Blender 5.x compositor: RenderLayers.Depth -> File Output (OPEN_EXR),
which writes the raw camera-space Z in metres (inf where nothing is hit).
"""
import bpy, math, os, glob, json, random

ROOT = "/Users/loudonstearns/Documents/The Palace/Projects/BLUELINE/proofs/blender-handdrawn"
BLOB_LIB = os.path.join(ROOT, "blob-library")
OUT = os.path.join(ROOT, "followups/seam-comp-layer")
os.makedirs(OUT, exist_ok=True)
RES = (832, 1040)
random.seed(42)

SYNTH = sorted(glob.glob(os.path.join(BLOB_LIB, "synth", "synth_*.png")))
if not SYNTH:
    SYNTH = sorted(glob.glob(os.path.join(BLOB_LIB, "blob_*.png")))
assert SYNTH, "No blob mattes found"

CHAR = {}
try:
    CHAR = json.load(open(os.path.join(BLOB_LIB, "blob-character.json")))
except Exception:
    pass
diam = CHAR.get("diameter_px", {})
D_LO  = diam.get("p10", 5)
D_MED = diam.get("p50", 14)
D_HI  = diam.get("p90", 40)


def eevee():
    items = [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items]
    for c in ('BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE'):
        if c in items:
            return c
    return items[0]


def world(v=1.0):
    w = bpy.data.worlds.new('W')
    bpy.context.scene.world = w
    w.use_nodes = True
    bg = w.node_tree.nodes.get('Background')
    bg.inputs['Color'].default_value = (v, v, v, 1)
    bg.inputs['Strength'].default_value = 1.0


def flat_mat(name='m', v=0.8):
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
    """Same hard-alpha ink billboard material as step1 so the Z pass is tight to
    the blob silhouette (transparent fragments do NOT write depth under DITHERED)."""
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


def link_obj(o, coll):
    for c in list(o.users_collection):
        c.objects.unlink(o)
    coll.objects.link(o)


def build_scene(scene_coll, pm):
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
    """IDENTICAL distribution to step1 scatter_blobs (same seed sequence)."""
    STRIKE = (0.6, 12, 2.2)
    def world_size(px):
        return max(0.18, px * 0.055)
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


def setup_depth_output(out_path_noext):
    """Route RenderLayers.Depth -> compositing-group Image output, then render the SCENE
    to a single-layer OPEN_EXR (the depth, in metres, becomes the image). cv2 reads it
    directly as float32. Background (no geometry hit) = a very large value (~1e10).

    Blender 5.1's File Output node only allows OPEN_EXR_MULTILAYER, which cv2 can't read
    cleanly; the scene render output DOES allow single-layer OPEN_EXR, so we drive the
    final render with the depth value instead. The group's 'Image' output replaces the
    render result in Blender 5.x."""
    sc = bpy.context.scene
    vl = sc.view_layers[0]
    vl.use_pass_z = True
    sc.use_nodes = True
    tree = bpy.data.node_groups.new("DepthOut", "CompositorNodeTree")
    tree.interface.new_socket("Image", in_out='OUTPUT', socket_type='NodeSocketColor')
    nodes, links = tree.nodes, tree.links
    rl = nodes.new('CompositorNodeRLayers')
    rl.scene = sc
    rl.layer = vl.name
    depth_socket = rl.outputs.get('Depth') or rl.outputs.get('Z')
    # Combine the single depth value into an RGB so the EXR carries it on (at least) R.
    comb = nodes.new('CompositorNodeCombineColor')
    comb.mode = 'RGB'
    links.new(depth_socket, comb.inputs['Red'])
    links.new(depth_socket, comb.inputs['Green'])
    links.new(depth_socket, comb.inputs['Blue'])
    gout = nodes.new('NodeGroupOutput')
    links.new(comb.outputs[0], gout.inputs[0])
    sc.compositing_node_group = tree
    # render output -> single-layer float EXR
    sc.render.image_settings.file_format = 'OPEN_EXR'
    sc.render.image_settings.color_mode = 'RGB'
    sc.render.image_settings.color_depth = '32'
    sc.render.image_settings.exr_codec = 'NONE'
    sc.render.filepath = out_path_noext  # Blender appends .exr
    return None, os.path.basename(out_path_noext)


def common(sc, transparent=False):
    sc.render.engine = eevee()
    try:
        sc.view_settings.view_transform = 'Standard'
        sc.view_settings.look = 'None'
    except Exception:
        pass
    sc.render.resolution_x, sc.render.resolution_y = RES
    sc.render.film_transparent = transparent
    try:
        sc.eevee.taa_render_samples = 8  # depth doesn't need AA samples
    except Exception:
        pass


# ===========================================================================
# DEPTH 1 — city geometry Z
# ===========================================================================
print("\n=== DEPTH 1: city_depth ===")
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
scene_coll = bpy.data.collections.new("SCENE")
sc.collection.children.link(scene_coll)
pm = flat_mat('city')
build_scene(scene_coll, pm)
cam = make_camera()
world(1.0)
sc.view_layers[0].use_freestyle = False
common(sc, transparent=False)
fo, slot = setup_depth_output(os.path.join(OUT, "city_depth"))
sc.frame_set(1)
bpy.ops.render.render(write_still=True)
print(f"  wrote city_depth (slot={slot})")

# ===========================================================================
# DEPTH 2 — blob billboards Z (same camera, same scatter)
# ===========================================================================
print("\n=== DEPTH 2: blob_depth ===")
bpy.ops.wm.read_factory_settings(use_empty=True)
sc2 = bpy.context.scene
scene_coll2 = bpy.data.collections.new("SCENE")
sc2.collection.children.link(scene_coll2)
blob_coll = bpy.data.collections.new("BLOBS")
sc2.collection.children.link(blob_coll)
pm2 = flat_mat('city2')
build_scene(scene_coll2, pm2)   # build scene so RNG sequence + camera-billboard match step1 exactly
cam2 = make_camera()
mats = [blob_material(p, i) for i, p in enumerate(SYNTH)]
scatter_blobs(cam2, blob_coll, mats)
# render BLOBS only
vl2 = sc2.view_layers[0]
vl2.use_freestyle = False
lc_scene = vl2.layer_collection.children.get("SCENE")
if lc_scene:
    lc_scene.exclude = True
lc_blobs = vl2.layer_collection.children.get("BLOBS")
if lc_blobs:
    lc_blobs.exclude = False
world(1.0)
common(sc2, transparent=True)   # transparent so non-blob pixels read background depth
fo2, slot2 = setup_depth_output(os.path.join(OUT, "blob_depth"))
sc2.frame_set(1)
bpy.ops.render.render(write_still=True)
print(f"  wrote blob_depth (slot={slot2})")

print("\nSTEP 5 COMPLETE — depth EXRs written to", OUT)
print("NOTE: File Output appends a frame number; step6 globs for the actual filenames.")
