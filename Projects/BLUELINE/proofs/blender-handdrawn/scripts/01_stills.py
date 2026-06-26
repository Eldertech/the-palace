"""
BLUELINE — Blender hand-drawn STILLS research demo.
Renders two scenes (a low-canted 'burning street' cityscape and an NPR figure test),
each in two looks:
  * ink  — flat white fill + sketchy Freestyle ink lines (reads as pen-on-paper;
           also doubles as the Canny/lineart control image for img2img).
  * toon — EEVEE Shader-to-RGB 2-tone ink-wash + the same Freestyle ink lines.

Run headless:
  /Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup -P 01_stills.py
"""
import bpy, math, os, random

OUT = "/Users/loudonstearns/Documents/The Palace/Projects/BLUELINE/proofs/blender-handdrawn/blender"
os.makedirs(OUT, exist_ok=True)
RES = (832, 1040)   # portrait, low-canted noir framing

# ----------------------------------------------------------------------------- helpers
def wipe():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def eevee_engine():
    items = [e.identifier for e in
             bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items]
    for cand in ('BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE'):
        if cand in items:
            return cand
    return items[0]

def new_mat(name, base=(0.8, 0.8, 0.8, 1)):
    m = bpy.data.materials.new(name); m.use_nodes = True
    bsdf = m.node_tree.nodes.get('Principled BSDF')
    if bsdf:
        bsdf.inputs['Base Color'].default_value = base
        if 'Roughness' in bsdf.inputs: bsdf.inputs['Roughness'].default_value = 0.9
    return m

def ink_mat(name, value=0.93):
    """Flat near-white emission so the fill is paper, lines carry the drawing."""
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    em = nt.nodes.new('ShaderNodeEmission')
    em.inputs['Color'].default_value = (value, value, value, 1)
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(em.outputs['Emission'], out.inputs['Surface'])
    return m

def toon_mat(name, tint=(1, 1, 1)):
    """Diffuse -> Shader to RGB -> 2-band ColorRamp (ink shadow / paper).
    Shader to RGB is EEVEE-only; gives flat noir ink-wash banding."""
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    diff = nt.nodes.new('ShaderNodeBsdfDiffuse')
    diff.inputs['Color'].default_value = (tint[0], tint[1], tint[2], 1)
    s2rgb = nt.nodes.new('ShaderNodeShaderToRGB')
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.interpolation = 'CONSTANT'
    e = ramp.color_ramp.elements
    e[0].position = 0.0;  e[0].color = (0.04, 0.04, 0.05, 1)   # ink shadow
    e[1].position = 0.45; e[1].color = (0.97, 0.97, 0.97, 1)   # paper light
    em = nt.nodes.new('ShaderNodeEmission')
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(diff.outputs['BSDF'], s2rgb.inputs['Shader'])
    nt.links.new(s2rgb.outputs['Color'], ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'], em.inputs['Color'])
    nt.links.new(em.outputs['Emission'], out.inputs['Surface'])
    return m

def configure_freestyle(thickness=2.4, sketchy=True):
    sc = bpy.context.scene
    sc.render.use_freestyle = True
    sc.render.line_thickness_mode = 'ABSOLUTE'
    vl = sc.view_layers[0]
    vl.use_freestyle = True
    fs = vl.freestyle_settings
    if len(fs.linesets) == 0:
        fs.linesets.new('LineSet')
    ls = fs.linesets[0]
    if ls.linestyle is None:
        ls.linestyle = bpy.data.linestyles.new('InkLineStyle')
    for attr, val in (('select_silhouette', True), ('select_border', True),
                      ('select_crease', True), ('select_contour', True),
                      ('select_external_contour', True),
                      ('select_material_boundary', True),
                      ('select_edge_mark', False),
                      ('select_ridge_valley', False),
                      ('select_suggestive_contour', False)):
        try: setattr(ls, attr, val)
        except Exception: pass
    try: ls.crease_angle = math.radians(125)
    except Exception: pass
    st = ls.linestyle
    st.color = (0, 0, 0)
    st.thickness = thickness
    st.use_chaining = True
    if sketchy:
        try:
            st.chaining = 'SKETCHY'; st.rounds = 3
        except Exception: pass
    try: st.use_same_object = True
    except Exception: pass
    # geometry wobble -> hand-drawn waver
    g = st.geometry_modifiers
    try:
        g.new(name='spatial', type='SPATIAL_NOISE')
        m = g[-1]; m.amplitude = 4.5; m.scale = 18; m.octaves = 2
        m.smooth = True; m.use_pure_random = False
    except Exception: pass
    try:
        g.new(name='perlin', type='PERLIN_NOISE_1D')
        m = g[-1]; m.amplitude = 3.0; m.frequency = 8; m.octaves = 3; m.seed = 2
    except Exception: pass
    # calligraphic thickness -> ink-pen pressure
    try:
        t = st.thickness_modifiers
        t.new(name='calli', type='CALLIGRAPHY')
        cm = t[-1]; cm.orientation = math.radians(45)
        cm.thickness_min = 0.6; cm.thickness_max = 4.5
    except Exception: pass

def add_camera(loc, rot_euler, lens=30, dutch=0.0):
    cam_data = bpy.data.cameras.new('Cam'); cam_data.lens = lens
    cam = bpy.data.objects.new('Cam', cam_data)
    bpy.context.collection.objects.link(cam)
    cam.location = loc
    cam.rotation_euler = rot_euler
    if dutch:  # roll the camera on its local view axis for the canted angle
        cam.rotation_mode = 'XYZ'
        cam.rotation_euler.rotate_axis('Z', math.radians(dutch))
    bpy.context.scene.camera = cam
    return cam

def add_sun(rot, energy=4.0):
    d = bpy.data.lights.new('Sun', 'SUN'); d.energy = energy
    try: d.angle = math.radians(2)
    except Exception: pass
    o = bpy.data.objects.new('Sun', d)
    bpy.context.collection.objects.link(o)
    o.rotation_euler = rot
    return o

def set_world(value):
    w = bpy.data.worlds.new('W'); bpy.context.scene.world = w
    w.use_nodes = True
    bg = w.node_tree.nodes.get('Background')
    if bg:
        bg.inputs['Color'].default_value = (value, value, value, 1)
        bg.inputs['Strength'].default_value = 1.0

def render_to(path):
    sc = bpy.context.scene
    try:
        sc.view_settings.view_transform = 'Standard'  # keep white paper white (not AgX grey)
        sc.view_settings.look = 'None'
    except Exception: pass
    sc.render.resolution_x, sc.render.resolution_y = RES
    sc.render.resolution_percentage = 100
    sc.render.image_settings.file_format = 'PNG'
    sc.render.filepath = path
    try:
        sc.eevee.taa_render_samples = 24
    except Exception: pass
    bpy.ops.render.render(write_still=True)
    print("  wrote", path)

# ----------------------------------------------------------------------------- scenes
def build_city():
    """Low-canted 'burning street': an avenue of tall blocks receding, a lone figure."""
    random.seed(7)
    # ground
    bpy.ops.mesh.primitive_plane_add(size=80, location=(0, 0, 0))
    ground = bpy.context.active_object; ground.name = 'Ground'
    # two rows of buildings down the +Y avenue
    blds = []
    for side in (-1, 1):
        for i in range(7):
            y = 6 + i * 7
            h = random.uniform(8, 22)
            w = random.uniform(3.0, 4.6)
            bpy.ops.mesh.primitive_cube_add(size=1, location=(side * 6.5, y, h / 2))
            b = bpy.context.active_object
            b.scale = (w, random.uniform(3.5, 5.5), h)
            blds.append(b)
            # a few window-mullion insets so crease lines read as architecture
            bpy.ops.mesh.primitive_cube_add(size=1,
                location=(side * (6.5 - w * 0.5 * 0.0), y - random.uniform(1.5, 2.4), h * 0.55))
            f = bpy.context.active_object
            f.scale = (w * 0.55, 0.4, h * 0.5)
            blds.append(f)
    # lone figure mid-street (blocky proxy: torso + head)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.55, depth=2.0, location=(0.4, 11, 1.2))
    torso = bpy.context.active_object; torso.name = 'Figure'
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.5, location=(0.4, 11, 2.5))
    head = bpy.context.active_object
    # billowing smoke column behind (ico displaced) — a still cloud motif
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3, radius=4.5, location=(-3, 46, 16))
    smoke = bpy.context.active_object; smoke.name = 'Smoke'
    m = smoke.modifiers.new('disp', 'DISPLACE')
    tex = bpy.data.textures.new('cloud', 'CLOUDS'); tex.noise_scale = 0.6
    m.texture = tex; m.strength = 3.2
    smoke.scale = (1.0, 0.6, 1.4)
    objs = [ground] + blds + [torso, head, smoke]
    add_sun((math.radians(58), math.radians(8), math.radians(35)), energy=5.0)
    add_camera((0.4, -7, 1.5), (math.radians(86), 0, 0), lens=26, dutch=-8)
    return objs

def build_figure():
    """NPR look test on a standard organic subject at a low canted angle."""
    bpy.ops.mesh.primitive_monkey_add(size=2.4, location=(0, 0, 0.6))
    suz = bpy.context.active_object
    bpy.ops.object.shade_smooth()
    sub = suz.modifiers.new('sub', 'SUBSURF'); sub.levels = 2; sub.render_levels = 2
    bpy.ops.mesh.primitive_plane_add(size=30, location=(0, 0, -1.4))
    ground = bpy.context.active_object
    add_sun((math.radians(54), math.radians(12), math.radians(-40)), energy=5.0)
    add_camera((2.6, -4.2, 0.7), (math.radians(82), 0, math.radians(28)), lens=50, dutch=-6)
    return [suz, ground]

# ----------------------------------------------------------------------------- looks
def apply_ink(objs):
    bpy.context.scene.render.engine = eevee_engine()
    set_world(1.0)  # bright paper
    im = ink_mat('paper')
    for o in objs:
        if o.type == 'MESH':
            o.data.materials.clear(); o.data.materials.append(im)
    configure_freestyle(thickness=2.6, sketchy=True)

def apply_toon(objs):
    bpy.context.scene.render.engine = eevee_engine()
    set_world(0.18)  # darker world so the ink-wash shadows read
    tm = toon_mat('toon')
    for o in objs:
        if o.type == 'MESH':
            o.data.materials.clear(); o.data.materials.append(tm)
    configure_freestyle(thickness=2.4, sketchy=True)

# ----------------------------------------------------------------------------- run
JOBS = [('city', build_city), ('figure', build_figure)]
for name, builder in JOBS:
    for look, applier in (('ink', apply_ink), ('toon', apply_toon)):
        wipe()
        objs = builder()
        applier(objs)
        render_to(os.path.join(OUT, f"{name}_{look}.png"))
print("STILLS DONE")
