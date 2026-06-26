"""
BLUELINE seam-comp-layer PROOF — Step 4 (optional)
Short camera-move clip so the composited blobs parallax over the inked plate.

Renders 12 frames of:
  a) city plate at each camera position (Blender headless)
  b) blobs-only RGBA at each camera position (Blender headless)

Then gen-AI redraws each city plate frame (or reuses the ink look directly — we skip
the expensive per-frame gen-AI redraw for the parallax clip and instead use the
Blender ink plate directly so the clip runs in reasonable time).

Final: composites blobs over each city-ink frame, encodes as ProRes + H.264 clip.

This script does NOT gen-AI redraw each frame (too slow at 12 frames × ~40s each).
It uses the Blender ink render directly as the 'plate' for the parallax clip.
The gen-AI comparison is already in the stills (comp_depth.png vs inked_baked.png).
"""
import bpy, math, os, glob, json, random, subprocess

ROOT = "/Users/loudonstearns/Documents/The Palace/Projects/BLUELINE/proofs/blender-handdrawn"
BLOB_LIB = os.path.join(ROOT, "blob-library")
PROOF = os.path.join(ROOT, "followups/seam-comp-layer")
FRAMES_CITY = os.path.join(PROOF, "clip_city")
FRAMES_BLOBS = os.path.join(PROOF, "clip_blobs")
FRAMES_COMP = os.path.join(PROOF, "clip_comp")
for d in (FRAMES_CITY, FRAMES_BLOBS, FRAMES_COMP):
    os.makedirs(d, exist_ok=True)

RES = (832, 1040)
NFRAMES = 12
random.seed(42)

SYNTH = sorted(glob.glob(os.path.join(BLOB_LIB, "synth", "synth_*.png")))
if not SYNTH:
    SYNTH = sorted(glob.glob(os.path.join(BLOB_LIB, "blob_*.png")))
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
    try: img.alpha_mode = 'STRAIGHT'
    except Exception: pass
    tex = nt.nodes.new('ShaderNodeTexImage')
    tex.image = img; tex.extension = 'CLIP'; tex.interpolation = 'Linear'
    thr = nt.nodes.new('ShaderNodeMath'); thr.operation = 'GREATER_THAN'; thr.inputs[1].default_value = 0.45
    transp = nt.nodes.new('ShaderNodeBsdfTransparent')
    emis = nt.nodes.new('ShaderNodeEmission'); emis.inputs['Color'].default_value = (0, 0, 0, 1)
    mix = nt.nodes.new('ShaderNodeMixShader')
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(tex.outputs['Alpha'], thr.inputs[0])
    nt.links.new(thr.outputs['Value'], mix.inputs['Fac'])
    nt.links.new(transp.outputs['BSDF'], mix.inputs[1])
    nt.links.new(emis.outputs['Emission'], mix.inputs[2])
    nt.links.new(mix.outputs['Shader'], out.inputs['Surface'])
    for attr, val in (('surface_render_method', 'DITHERED'), ('blend_method', 'CLIP'),
                      ('alpha_threshold', 0.5), ('shadow_method', 'NONE')):
        try: setattr(m, attr, val)
        except Exception: pass
    return m

def link_obj(o, coll):
    for c in list(o.users_collection): c.objects.unlink(o)
    coll.objects.link(o)

def build_city_scene(coll, pm):
    random.seed(7)
    bpy.ops.mesh.primitive_plane_add(size=120, location=(0, 0, 0))
    g = bpy.context.active_object; link_obj(g, coll); g.data.materials.append(pm)
    for side in (-1, 1):
        for i in range(8):
            y = 6 + i*6.5; h = random.uniform(9, 22); w = random.uniform(3.2, 4.6)
            bpy.ops.mesh.primitive_cube_add(size=1, location=(side*6.5, y, h/2))
            b = bpy.context.active_object; b.scale = (w, random.uniform(3.5, 5), h)
            link_obj(b, coll); b.data.materials.append(pm)
            bpy.ops.mesh.primitive_cube_add(size=1, location=(side*6.5, y-2, h*0.55))
            f = bpy.context.active_object; f.scale = (w*0.55, 0.4, h*0.5)
            link_obj(f, coll); f.data.materials.append(pm)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.55, depth=2, location=(0.4, 16, 1.2))
    bpy.context.active_object.data.materials.append(pm); link_obj(bpy.context.active_object, coll)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.5, location=(0.4, 16, 2.5))
    bpy.context.active_object.data.materials.append(pm); link_obj(bpy.context.active_object, coll)
    d = bpy.data.lights.new('S', 'SUN'); d.energy = 5
    o = bpy.data.objects.new('S', d); bpy.context.collection.objects.link(o); link_obj(o, coll)
    o.rotation_euler = (math.radians(58), math.radians(8), math.radians(35))

def make_camera(coll=None):
    cd = bpy.data.cameras.new('Cam'); cd.lens = 26
    cam = bpy.data.objects.new('Cam', cd)
    bpy.context.collection.objects.link(cam)
    if coll: link_obj(cam, coll)
    cam.rotation_euler = (math.radians(86), 0, 0)
    cam.rotation_euler.rotate_axis('Z', math.radians(-8))
    bpy.context.scene.camera = cam
    return cam

def cam_pos(t):
    """Sideways truck for strong parallax."""
    return (-3.0 + 6.0 * t, -7.5 + 1.0 * t, 1.5)

def freestyle_setup(sc):
    sc.render.use_freestyle = True; sc.render.line_thickness_mode = 'ABSOLUTE'
    vl = sc.view_layers[0]; vl.use_freestyle = True
    fs = vl.freestyle_settings
    if len(fs.linesets) == 0: fs.linesets.new('LS')
    ls = fs.linesets[0]
    if ls.linestyle is None: ls.linestyle = bpy.data.linestyles.new('Ink')
    for a, v in (('select_silhouette', True), ('select_border', True), ('select_crease', True), ('select_external_contour', True)):
        try: setattr(ls, a, v)
        except Exception: pass
    try: ls.crease_angle = math.radians(134)
    except Exception: pass
    st = ls.linestyle; st.color = (0, 0, 0); st.thickness = 3.0; st.use_chaining = True
    try: st.chaining = 'PLAIN'
    except Exception: pass
    try: st.geometry_modifiers.new(name='samp', type='SAMPLING'); st.geometry_modifiers[-1].sampling = 3.0
    except Exception: pass
    try: st.geometry_modifiers.new(name='bz', type='BEZIER_CURVE'); st.geometry_modifiers[-1].error = 3.0
    except Exception: pass
    try:
        st.thickness_modifiers.new(name='c', type='CALLIGRAPHY'); cm = st.thickness_modifiers[-1]
        cm.orientation = math.radians(38); cm.thickness_min = 1.0; cm.thickness_max = 9.0
    except Exception: pass

def scatter_blobs_static(cam, blob_coll, mats):
    random.seed(42)
    STRIKE = (0.6, 12, 2.2)
    def ws(px): return max(0.18, px * 0.055)
    for _ in range(50):
        r = random.random()**1.8*9; a = random.uniform(0, 6.28)
        x = STRIKE[0]+math.cos(a)*r; z = STRIKE[2]+math.sin(a)*r*0.7+random.uniform(-0.5, 2.0)
        y = STRIKE[1]+random.uniform(-3, 3); px = random.uniform(D_MED, D_HI)*(1.6-r/12)
        d = ws(max(D_LO, px))
        bpy.ops.mesh.primitive_plane_add(size=1, location=(x, max(0.1, z), y))
        p = bpy.context.active_object; link_obj(p, blob_coll); p.data.materials.append(random.choice(mats))
        con = p.constraints.new('COPY_ROTATION'); con.target = cam
        p.scale = (random.choice([-1,1])*d, d, d)
    for _ in range(100):
        y = random.uniform(-4, 44); x = random.uniform(-11, 11); z = random.uniform(0.2, 20)
        near = max(0.05, 1.0-(y+5)/50); px = random.uniform(D_LO, D_MED)*(0.9+near*3.0)
        d = ws(px)
        bpy.ops.mesh.primitive_plane_add(size=1, location=(x, y, z))
        p = bpy.context.active_object; link_obj(p, blob_coll); p.data.materials.append(random.choice(mats))
        con = p.constraints.new('COPY_ROTATION'); con.target = cam
        p.scale = (random.choice([-1,1])*d, d, d)
    for _ in range(8):
        y = random.uniform(-5.5, 1.5); x = random.uniform(-8, 8); z = random.uniform(0.4, 14)
        d = random.uniform(0.7, 1.8)
        bpy.ops.mesh.primitive_plane_add(size=1, location=(x, y, z))
        p = bpy.context.active_object; link_obj(p, blob_coll); p.data.materials.append(random.choice(mats))
        con = p.constraints.new('COPY_ROTATION'); con.target = cam
        p.scale = (random.choice([-1,1])*d, d, d)

def common(sc, transparent=False):
    sc.render.engine = eevee()
    try: sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'
    except Exception: pass
    sc.render.resolution_x, sc.render.resolution_y = RES
    sc.render.image_settings.file_format = 'PNG'
    sc.render.film_transparent = transparent
    try: sc.eevee.taa_render_samples = 24
    except Exception: pass

# ===========================================================================
# RENDER A — city ink frames (camera truck)
print("\n=== Rendering city ink frames ===")
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
coll = bpy.data.collections.new("SCENE"); bpy.context.scene.collection.children.link(coll)
pm = ink_mat(); build_city_scene(coll, pm); cam = make_camera()
world(1.0); freestyle_setup(sc); common(sc, transparent=False)
sc.frame_start = 1; sc.frame_end = NFRAMES
for f in range(1, NFRAMES+1):
    t = (f-1)/(NFRAMES-1); loc = cam_pos(t)
    cam.location = loc; cam.keyframe_insert('location', frame=f)
sc.render.filepath = os.path.join(FRAMES_CITY, "city_")
bpy.ops.render.render(animation=True)
print(f"  {NFRAMES} city frames rendered")

# ===========================================================================
# RENDER B — blobs RGBA frames (same camera truck)
print("\n=== Rendering blob RGBA frames ===")
bpy.ops.wm.read_factory_settings(use_empty=True)
sc2 = bpy.context.scene
scene_coll2 = bpy.data.collections.new("SCENE"); bpy.context.scene.collection.children.link(scene_coll2)
blob_coll2 = bpy.data.collections.new("BLOBS"); bpy.context.scene.collection.children.link(blob_coll2)
pm2 = ink_mat('paper2'); build_city_scene(scene_coll2, pm2)
cam2 = make_camera()
mats2 = [blob_material(p, i) for i, p in enumerate(SYNTH)]
scatter_blobs_static(cam2, blob_coll2, mats2)
# Exclude SCENE from render — blobs only
vl2 = sc2.view_layers[0]; vl2.use_freestyle = False
lc_scene2 = vl2.layer_collection.children.get("SCENE")
if lc_scene2: lc_scene2.exclude = True
lc_blobs2 = vl2.layer_collection.children.get("BLOBS")
if lc_blobs2: lc_blobs2.exclude = False
world(1.0); common(sc2, transparent=True)
sc2.render.image_settings.color_mode = 'RGBA'
sc2.frame_start = 1; sc2.frame_end = NFRAMES
for f in range(1, NFRAMES+1):
    t = (f-1)/(NFRAMES-1); loc = cam_pos(t)
    cam2.location = loc; cam2.keyframe_insert('location', frame=f)
sc2.render.filepath = os.path.join(FRAMES_BLOBS, "blobs_")
bpy.ops.render.render(animation=True)
print(f"  {NFRAMES} blob frames rendered")

# ===========================================================================
# COMPOSITE each frame with ImageMagick, then encode
print("\n=== Compositing frames ===")
for f in range(1, NFRAMES+1):
    city_f = os.path.join(FRAMES_CITY, f"city_{f:04d}.png")
    blob_f = os.path.join(FRAMES_BLOBS, f"blobs_{f:04d}.png")
    comp_f = os.path.join(FRAMES_COMP, f"comp_{f:04d}.png")
    if os.path.exists(city_f) and os.path.exists(blob_f):
        subprocess.run(["convert", city_f, blob_f, "-composite", comp_f], check=True)

print("  compositing done")

# ===========================================================================
# ENCODE
print("\n=== Encoding clips ===")
# H.264 (B&W line-art: use -crf 6 -tune animation to avoid macroblock artifacts)
h264 = os.path.join(PROOF, "parallax_clip.mp4")
subprocess.run([
    "ffmpeg", "-y", "-framerate", "12",
    "-i", os.path.join(FRAMES_COMP, "comp_%04d.png"),
    "-vcodec", "libx264", "-crf", "6", "-tune", "animation",
    "-pix_fmt", "yuv420p",
    h264
], check=True)
print(f"  parallax_clip.mp4 done ({os.path.getsize(h264)//1024}KB)")

# ProRes (archival — sharper for B&W)
prores = os.path.join(PROOF, "parallax_clip.mov")
subprocess.run([
    "ffmpeg", "-y", "-framerate", "12",
    "-i", os.path.join(FRAMES_COMP, "comp_%04d.png"),
    "-vcodec", "prores_ks", "-profile:v", "3",
    "-pix_fmt", "yuv422p10le",
    prores
], check=True)
print(f"  parallax_clip.mov done ({os.path.getsize(prores)//1024}KB)")

print("\nSTEP 4 COMPLETE")
