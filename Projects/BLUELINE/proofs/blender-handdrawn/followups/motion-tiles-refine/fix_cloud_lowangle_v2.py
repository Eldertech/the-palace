"""
BLUELINE — CLOUD LOW-ANGLE FIX v2
Revised after v1 rendered nearly empty.

Root causes of v1 failure:
1. World color (0.88) nearly matched toon light value (0.52-0.98), no contrast
2. Displacement warping blobs outside the view frustum
3. Freestyle 'strokes set empty' on smooth displaced spheres at unusual angles

v2 strategy:
  - Camera at (0, -3, 0.5) rot_x=55° (looking UP at 35° above horizon) —
    this is a TRUE low-angle "hero shot" not straight-up
  - Clouds at y=5..14, z=2..8 — filling the UPPER HALF of frame
    (the sky above a horizon line: dramatic storm-from-below composition)
  - DARK world (0.25) = stormy sky, clouds are BRIGHT white by contrast
  - NO displacement — use subdivided icosphere + Smooth Modifier for organic shape
    (displacement was pushing verts outside frustum)
  - Toon mat: shadow dark (0.12), light BRIGHT white (0.98) = maximum contrast
  - Multiple cloud layers: foreground large dark belly, background bright towers
  - Wider lens (24mm) to capture more sky, slight dutch tilt
"""
import bpy, math, os

OUT = "/Users/loudonstearns/Documents/The Palace/Projects/BLUELINE/proofs/blender-handdrawn/followups/motion-tiles-refine"
os.makedirs(OUT, exist_ok=True)

FRAMES = 24
RES = (560, 560)

def eevee():
    items = [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items]
    for c in ('BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE'):
        if c in items: return c
    return items[0]

def toon(name, shadow, light, mid=None):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    diff = nt.nodes.new('ShaderNodeBsdfDiffuse')
    diff.inputs['Color'].default_value = (1, 1, 1, 1)
    s2   = nt.nodes.new('ShaderNodeShaderToRGB')
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.interpolation = 'CONSTANT'
    e = ramp.color_ramp.elements
    e[0].position = 0.0; e[0].color = (*shadow, 1)
    e[1].position = 0.5; e[1].color = (*light, 1)
    if mid:
        e2 = ramp.color_ramp.elements.new(0.28); e2.color = (*mid, 1)
    em  = nt.nodes.new('ShaderNodeEmission')
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(diff.outputs['BSDF'], s2.inputs['Shader'])
    nt.links.new(s2.outputs['Color'], ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'], em.inputs['Color'])
    nt.links.new(em.outputs['Emission'], out.inputs['Surface'])
    return m

def freestyle_setup(thick=3.0, crease=110):
    sc = bpy.context.scene
    sc.render.use_freestyle = True
    sc.render.line_thickness_mode = 'ABSOLUTE'
    vl = sc.view_layers[0]; vl.use_freestyle = True
    fs = vl.freestyle_settings
    if len(fs.linesets) == 0: fs.linesets.new('LS')
    ls = fs.linesets[0]
    if not ls.linestyle: ls.linestyle = bpy.data.linestyles.new('Ink')
    for a, v in (('select_silhouette', True), ('select_border', True),
                 ('select_crease', True), ('select_external_contour', True)):
        try: setattr(ls, a, v)
        except Exception: pass
    try: fs.crease_angle = math.radians(crease)
    except Exception: pass
    st = ls.linestyle
    st.color = (0,0,0); st.thickness = thick; st.use_chaining = True
    try: st.chaining = 'PLAIN'
    except Exception: pass
    g = st.geometry_modifiers
    try: g.new(name='samp', type='SAMPLING'); g[-1].sampling = 3.0
    except Exception: pass
    try: g.new(name='bz', type='BEZIER_CURVE'); g[-1].error = 2.5
    except Exception: pass
    t = st.thickness_modifiers
    t.new(name='calli', type='CALLIGRAPHY'); cm = t[-1]
    cm.orientation = math.radians(38); cm.thickness_min = 1.2; cm.thickness_max = 9.0
    return st

def add_boil(linestyle):
    def boil(scene):
        f = scene.frame_current
        for gm in linestyle.geometry_modifiers:
            if gm.type == 'PERLIN_NOISE_1D':
                gm.seed = (f // 2) + 1
    bpy.app.handlers.frame_change_pre.append(boil)

def make_cloud_blob(loc, r, sub=4, squash_z=0.85, squash_x=1.2):
    """Smooth icosphere — no displacement, smooth modifier instead."""
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=sub, radius=r, location=loc)
    o = bpy.context.active_object
    bpy.ops.object.shade_smooth()
    # Add smooth modifier for organic bubbling without displacement artifacts
    sm = o.modifiers.new('smooth', 'SMOOTH')
    sm.iterations = 3; sm.factor = 0.5
    o.scale = (squash_x, 1.0, squash_z)
    return o

# ---- SCENE SETUP ----
def build_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for h in list(bpy.app.handlers.frame_change_pre):
        bpy.app.handlers.frame_change_pre.remove(h)

    sc = bpy.context.scene
    sc.render.engine = eevee()
    try:
        sc.view_settings.view_transform = 'Standard'
        sc.view_settings.look = 'None'
    except Exception: pass
    sc.render.resolution_x, sc.render.resolution_y = RES
    try: sc.eevee.taa_render_samples = 32
    except Exception: pass

    # DARK stormy sky — so white clouds POP
    w = bpy.data.worlds.new('W'); sc.world = w; w.use_nodes = True
    w.node_tree.nodes.get('Background').inputs['Color'].default_value = (0.22, 0.22, 0.25, 1)

    # Strong side-light (from upper-right) — casts dark undersides
    d = bpy.data.lights.new('Sun', 'SUN'); d.energy = 8
    o = bpy.data.objects.new('Sun', d); bpy.context.collection.objects.link(o)
    o.rotation_euler = (math.radians(55), 0, math.radians(-40))

    # Cloud materials
    # Dark-bellied: undersides face the low camera = dark → high contrast
    dark_belly = toon('cloud_dark',
                      shadow=(0.08, 0.08, 0.10),
                      light=(0.70, 0.70, 0.72),
                      mid=(0.32, 0.32, 0.36))
    bright_top  = toon('cloud_bright',
                       shadow=(0.30, 0.30, 0.33),
                       light=(0.98, 0.98, 0.99))

    # Ground plane (horizon anchor — subtle)
    bpy.ops.mesh.primitive_plane_add(size=60, location=(0, 20, -0.1))
    gnd = bpy.context.active_object
    gnd.data.materials.append(toon('gnd', (0.05, 0.05, 0.06), (0.35, 0.35, 0.38)))

    # CAMERA: Low angle, proper "looking up at storm" composition
    # At z=0.5, looking at elevation ~35° above horizon (rot_x=55° from straight-down)
    # Clouds placed at y=6..16, z=2..8 — filling upper frame
    cd = bpy.data.cameras.new('C'); cd.lens = 24
    cam = bpy.data.objects.new('C', cd); bpy.context.collection.objects.link(cam)
    cam.location = (0, -2, 0.5)
    cam.rotation_euler = (math.radians(62), 0, math.radians(-5))  # steep upward tilt
    sc.camera = cam

    # CLOUD GEOMETRY
    # With camera at y=-2, z=0.5, rot_x=62°:
    # The camera looks forward+up: center of view is roughly y=5..10, z=4..7
    # Wide lens (24mm) = ~84° FOV — generous
    cloud_specs = [
        # (x, y, z, r, dark_belly, squash_z, squash_x)
        (-5,  6, 2.5, 3.8, True,  0.70, 1.30),  # lower left, dark belly toward cam
        ( 4,  6, 2.0, 3.4, True,  0.72, 1.20),  # lower right
        ( 0,  8, 4.5, 4.5, True,  0.78, 1.15),  # center foreground, dramatic dark belly
        (-7,  9, 3.5, 3.0, True,  0.75, 1.25),  # left mid
        ( 6,  9, 3.8, 3.2, True,  0.73, 1.20),  # right mid
        (-3, 12, 6.0, 4.0, False, 0.80, 1.10),  # upper left, bright-lit top
        ( 3, 11, 5.5, 3.8, False, 0.82, 1.12),  # upper right
        ( 0, 14, 7.5, 4.8, False, 0.85, 1.08),  # towering center top, bright
        (-5, 14, 6.5, 3.2, False, 0.83, 1.10),  # upper left background
        ( 5, 15, 6.0, 2.8, False, 0.82, 1.08),  # upper right background
    ]

    blobs_for_anim = []
    for x, y, z, r, dark, sqz, sqx in cloud_specs:
        b = make_cloud_blob((x, y, z), r, sub=4, squash_z=sqz, squash_x=sqx)
        b.data.materials.append(dark_belly if dark else bright_top)
        blobs_for_anim.append((b, x, y, z))

    st = freestyle_setup(thick=3.0, crease=112)

    # Animation: slow drift across + tiny bob
    for f in range(1, FRAMES + 1):
        t = (f - 1) / max(FRAMES - 1, 1)
        for b, x0, y0, z0 in blobs_for_anim:
            b.location.x = x0 - 2.5 * t  # drift left across frame
            b.location.y = y0 - 1.0 * t  # slight approach
            b.keyframe_insert('location', frame=f)

    add_boil(st)
    return sc

sc = build_scene()

# Render still (frame 8 = mid-drift)
sc.frame_set(8)
sc.render.image_settings.file_format = 'PNG'
sc.render.filepath = os.path.join(OUT, "cloud_lowangle_v2.png")
bpy.ops.render.render(write_still=True)
print("  wrote cloud_lowangle_v2.png")

# Render clip
folder = os.path.join(OUT, "cloud_lowangle_v2_frames")
os.makedirs(folder, exist_ok=True)
sc.frame_start = 1; sc.frame_end = FRAMES
sc.render.filepath = os.path.join(folder, "frame_")
bpy.ops.render.render(animation=True)
print("  rendered cloud_lowangle_v2 clip")

print("CLOUD LOW-ANGLE v2 DONE")
