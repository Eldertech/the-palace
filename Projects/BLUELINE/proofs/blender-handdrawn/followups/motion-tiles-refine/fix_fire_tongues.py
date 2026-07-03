"""
BLUELINE — FIRE TONGUES FIX
Replaces cat_motion.py 'fire · tongues' which rendered as a seismograph zigzag.

Problem: 4 tall cones at z=1.3, height=2.6 (tops at z=2.6), camera at z=2.6 looking
nearly flat. Camera was at or ABOVE the cone tops, seeing only cross-section edges —
producing the zigzag seismograph silhouette.

Fix strategy:
  - TALLER flames: base wider, taper more dramatically to tips at z=8+
  - More licking tongues: 7-9 overlapping shapes for organic cluster
  - Camera LOWER (z=0.5) and looking UP at ~70° tilt — seeing the full flame height
  - Animated flickering: each tongue keyframed with x-sway and z-scale flutter
  - White core emission + ink contour = classic hand-drawn flame look
  - Procedural displaced cones + tapered blob tips for organic taper
  - Bright white world bg (0.92) so ink silhouettes pop
"""
import bpy, math, os, random

OUT = "/Users/loudonstearns/Documents/The Palace/Projects/BLUELINE/proofs/blender-handdrawn/followups/motion-tiles-refine"
os.makedirs(OUT, exist_ok=True)

FRAMES = 24
RES = (560, 560)
RENDER_STILL = True
RENDER_CLIP  = True

random.seed(42)

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
    e[1].position = 0.5; e[1].color = (*light,  1)
    if mid:
        e2 = ramp.color_ramp.elements.new(0.28); e2.color = (*mid, 1)
    em  = nt.nodes.new('ShaderNodeEmission')
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(diff.outputs['BSDF'], s2.inputs['Shader'])
    nt.links.new(s2.outputs['Color'], ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'], em.inputs['Color'])
    nt.links.new(em.outputs['Emission'], out.inputs['Surface'])
    return m

def emit(name, c=(1,1,1)):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    em  = nt.nodes.new('ShaderNodeEmission'); em.inputs['Color'].default_value = (*c, 1)
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(em.outputs['Emission'], out.inputs['Surface'])
    return m

def freestyle_setup(thick=2.6, crease=120):
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
    try:
        g.new(name='pn', type='PERLIN_NOISE_1D'); m = g[-1]
        m.amplitude = 2.0; m.frequency = 8; m.octaves = 2; m.seed = 1
    except Exception: pass
    t = st.thickness_modifiers
    t.new(name='calli', type='CALLIGRAPHY'); cm = t[-1]
    cm.orientation = math.radians(90); cm.thickness_min = 0.8; cm.thickness_max = 7.0
    return st

def add_boil(linestyle):
    def boil(scene):
        f = scene.frame_current
        for gm in linestyle.geometry_modifiers:
            if gm.type == 'PERLIN_NOISE_1D':
                gm.seed = (f // 2) + 1
    bpy.app.handlers.frame_change_pre.append(boil)

def disp(o, scale, strength):
    d = o.modifiers.new('d', 'DISPLACE')
    tex = bpy.data.textures.new('t', 'CLOUDS'); tex.noise_scale = scale
    d.texture = tex; d.strength = strength

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

    # Near-white world so ink silhouettes read hard
    w = bpy.data.worlds.new('W'); sc.world = w; w.use_nodes = True
    w.node_tree.nodes.get('Background').inputs['Color'].default_value = (0.94, 0.94, 0.92, 1)

    # Light from above-behind: strong overhead sun creates dark shadow on flame sides
    d = bpy.data.lights.new('Sun', 'SUN'); d.energy = 8
    o = bpy.data.objects.new('Sun', d); bpy.context.collection.objects.link(o)
    o.rotation_euler = (math.radians(30), 0, math.radians(40))

    # Ground plane
    bpy.ops.mesh.primitive_plane_add(size=20, location=(0, 0, 0))
    gnd = bpy.context.active_object
    gnd.data.materials.append(toon('gnd', (0.18, 0.18, 0.18), (0.82, 0.82, 0.82)))

    # FLAME MATERIALS
    # Bright core — near-white emission for the innermost tongue
    core_mat  = emit('flame_core', (1.0, 1.0, 1.0))
    # Mid flame — toon with bright lit face, darker edge
    mid_mat   = toon('flame_mid',  (0.55, 0.55, 0.55), (0.97, 0.97, 0.97),
                     mid=(0.80, 0.80, 0.80))
    # Outer/tip — slightly darker to define the edge
    outer_mat = toon('flame_outer', (0.20, 0.20, 0.22), (0.90, 0.90, 0.90),
                     mid=(0.62, 0.62, 0.64))

    # FLAME GEOMETRY
    # Key insight: TALL tapered cones (base z=0, tip z=6-9), camera low (z=0.5) looking up
    # Use a cluster of overlapping tongues with varied heights, slight x-offsets
    # Each tongue = cone (base r, tall depth) + displaced + tapered tip sphere
    tongue_specs = [
        # (x_base, base_r, height, mat,       phase_offset)
        (-2.2,   0.90,  7.5, 'outer',  0.0),
        (-1.1,   0.80,  9.2, 'mid',    0.7),
        ( 0.0,   1.05,  8.5, 'core',   1.4),   # center tallest bright core
        ( 1.1,   0.85,  7.8, 'mid',    2.1),
        ( 2.2,   0.75,  6.8, 'outer',  2.8),
        (-1.7,   0.55,  5.5, 'outer',  3.5),   # shorter side tongues
        ( 1.7,   0.50,  5.2, 'outer',  0.4),
        (-0.5,   0.65,  6.5, 'mid',    1.8),   # inner fill
        ( 0.6,   0.60,  7.0, 'mid',    3.1),
    ]
    mat_map = {'core': core_mat, 'mid': mid_mat, 'outer': outer_mat}

    flame_objs = []
    for x, br, h, mat_key, phase in tongue_specs:
        # Place cone with base at z=0, tip pointing up
        # primitive_cone_add: depth = total height, centered at location
        bpy.ops.mesh.primitive_cone_add(
            radius1=br, radius2=0.04,  # pointed tip
            depth=h, location=(x, 3.0, h/2),  # centered vertically
            end_fill_type='NOTHING'    # open base for more organic look
        )
        c = bpy.context.active_object
        bpy.ops.object.shade_smooth()
        # Displace for organic warping
        disp(c, 0.6, br * 0.55)
        # Slight forward lean (toward camera) for visual interest
        c.rotation_euler.x = math.radians(random.uniform(-8, 6))
        c.rotation_euler.z = math.radians(random.uniform(-12, 12))
        c.data.materials.append(mat_map[mat_key])
        flame_objs.append((c, x, h/2, phase))

    # Camera: LOW (z=0.5) looking UP at ~65° from horizontal
    # rot_x = 25° means looking 65° up from flat = seeing full flame column against sky
    cd = bpy.data.cameras.new('C'); cd.lens = 28
    cam = bpy.data.objects.new('C', cd); bpy.context.collection.objects.link(cam)
    cam.location = (0, -5.5, 0.5)
    cam.rotation_euler = (math.radians(72), 0, 0)  # 72° tilt = steep upward view
    sc.camera = cam

    # Freestyle ink
    st = freestyle_setup(thick=2.8, crease=118)

    # ANIMATION: each tongue flickers with x-sway + z-scale (height flutter)
    for f in range(1, FRAMES + 1):
        t = (f - 1) / max(FRAMES - 1, 1)
        angle = t * 2 * math.pi
        for obj, x0, z0, phase in flame_objs:
            # Horizontal flicker sway
            sway = math.sin(angle * 2.5 + phase) * 0.18
            obj.location.x = x0 + sway
            # Height flutter (scale z ±15%)
            flutter = 1.0 + math.sin(angle * 3.0 + phase * 1.3) * 0.14
            obj.scale.z = flutter
            # Slight taper variation (scale x narrows/widens)
            obj.scale.x = 1.0 + math.sin(angle * 2.0 + phase) * 0.08
            obj.scale.y = obj.scale.x
            obj.keyframe_insert('location', frame=f)
            obj.keyframe_insert('scale',    frame=f)

    add_boil(st)
    return sc

# ---- RENDER ----
sc = build_scene()

if RENDER_STILL:
    sc.frame_set(6)
    sc.render.image_settings.file_format = 'PNG'
    sc.render.filepath = os.path.join(OUT, "fire_tongues_FIX.png")
    bpy.ops.render.render(write_still=True)
    print("  wrote fire_tongues_FIX.png")

if RENDER_CLIP:
    folder = os.path.join(OUT, "fire_tongues_frames")
    os.makedirs(folder, exist_ok=True)
    sc.frame_start = 1; sc.frame_end = FRAMES
    sc.render.filepath = os.path.join(folder, "frame_")
    bpy.ops.render.render(animation=True)
    print("  rendered fire_tongues clip frames")

print("FIRE TONGUES FIX DONE")
