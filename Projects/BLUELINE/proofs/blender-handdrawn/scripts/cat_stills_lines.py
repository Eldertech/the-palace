"""
BLUELINE — STILLS line-treatment CATALOG. Same city scene, many Freestyle line
styles, to find the 'confident calligraphy pen' look (vs the tentative/searching one).
What's modifiable: chaining (PLAIN single vs SKETCHY searching), noise amplitude
(wobble), calligraphy thickness (angle-driven thick/thin pen), Bezier smoothing,
base weight, crease angle (line density).

Run headless; outputs catalog/lines/<name>.png + a labeled grid.
"""
import bpy, math, os, random
OUT = "/Users/loudonstearns/Documents/The Palace/Projects/BLUELINE/proofs/blender-handdrawn/catalog/lines"
os.makedirs(OUT, exist_ok=True)
RES = (560, 700)

def eevee():
    items = [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items]
    for c in ('BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE'):
        if c in items: return c
    return items[0]

def ink_mat():
    m = bpy.data.materials.new("paper"); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    em = nt.nodes.new('ShaderNodeEmission'); em.inputs['Color'].default_value = (0.96, 0.96, 0.96, 1)
    out = nt.nodes.new('ShaderNodeOutputMaterial'); nt.links.new(em.outputs['Emission'], out.inputs['Surface']); return m

def build_city():
    random.seed(7); pm = ink_mat()
    bpy.ops.mesh.primitive_plane_add(size=90, location=(0, 0, 0)); bpy.context.active_object.data.materials.append(pm)
    for side in (-1, 1):
        for i in range(7):
            y = 6 + i*7; h = random.uniform(9, 22); w = random.uniform(3.2, 4.6)
            bpy.ops.mesh.primitive_cube_add(size=1, location=(side*6.5, y, h/2))
            b = bpy.context.active_object; b.scale = (w, random.uniform(3.5, 5), h); b.data.materials.append(pm)
            bpy.ops.mesh.primitive_cube_add(size=1, location=(side*6.5, y-2, h*0.55))
            f = bpy.context.active_object; f.scale = (w*0.55, 0.4, h*0.5); f.data.materials.append(pm)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.55, depth=2, location=(0.4, 11, 1.2)); bpy.context.active_object.data.materials.append(pm)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.5, location=(0.4, 11, 2.5)); bpy.context.active_object.data.materials.append(pm)
    d = bpy.data.lights.new('S', 'SUN'); d.energy = 5; o = bpy.data.objects.new('S', d); bpy.context.collection.objects.link(o)
    o.rotation_euler = (math.radians(58), math.radians(8), math.radians(35))
    cd = bpy.data.cameras.new('C'); cd.lens = 26; c = bpy.data.objects.new('C', cd); bpy.context.collection.objects.link(c)
    c.location = (0.4, -7, 1.5); c.rotation_euler = (math.radians(86), 0, 0); c.rotation_euler.rotate_axis('Z', math.radians(-8))
    bpy.context.scene.camera = c
    w = bpy.data.worlds.new('W'); bpy.context.scene.world = w; w.use_nodes = True
    w.node_tree.nodes.get('Background').inputs['Color'].default_value = (1, 1, 1, 1)

def line_style(chaining='PLAIN', rounds=1, base=2.6, crease=130, sp_amp=0.0, pn_amp=0.0,
               calli=None, bezier_err=0.0, sampling=0.0):
    sc = bpy.context.scene; sc.render.use_freestyle = True; sc.render.line_thickness_mode = 'ABSOLUTE'
    vl = sc.view_layers[0]; vl.use_freestyle = True; fs = vl.freestyle_settings
    if len(fs.linesets) == 0: fs.linesets.new('LS')
    ls = fs.linesets[0]
    ls.linestyle = bpy.data.linestyles.new('S')                      # fresh each variant
    for a, v in (('select_silhouette', True), ('select_border', True), ('select_crease', True),
                 ('select_external_contour', True)):
        try: setattr(ls, a, v)
        except Exception: pass
    try: ls.crease_angle = math.radians(crease)
    except Exception: pass
    st = ls.linestyle; st.color = (0, 0, 0); st.thickness = base; st.use_chaining = True
    try: st.chaining = chaining; st.rounds = rounds
    except Exception: pass
    g = st.geometry_modifiers
    if sampling:                                                     # resample -> smoother, less jitter
        try: g.new(name='samp', type='SAMPLING'); g[-1].sampling = sampling
        except Exception: pass
    if sp_amp:
        try: g.new(name='sp', type='SPATIAL_NOISE'); m = g[-1]; m.amplitude = sp_amp; m.scale = 18; m.octaves = 2; m.smooth = True
        except Exception: pass
    if pn_amp:
        try: g.new(name='pn', type='PERLIN_NOISE_1D'); m = g[-1]; m.amplitude = pn_amp; m.frequency = 6; m.octaves = 2
        except Exception: pass
    if bezier_err:                                                   # fit smooth bezier = confident curves
        try: g.new(name='bz', type='BEZIER_CURVE'); g[-1].error = bezier_err
        except Exception: pass
    if calli:
        try:
            t = st.thickness_modifiers; t.new(name='c', type='CALLIGRAPHY'); cm = t[-1]
            cm.orientation = math.radians(calli['orient']); cm.thickness_min = calli['min']; cm.thickness_max = calli['max']
        except Exception: pass

VARIANTS = [
  ("1_baseline_tentative", dict(chaining='SKETCHY', rounds=3, base=2.6, sp_amp=4.5, pn_amp=2.5,
                                calli=dict(min=0.6, max=4.5, orient=45))),
  ("2_plain_clean",        dict(chaining='PLAIN', base=2.4, crease=130)),
  ("3_calligraphic_bold",  dict(chaining='PLAIN', base=3.0, crease=134, calli=dict(min=0.8, max=9, orient=40))),
  ("4_calligraphic_bezier",dict(chaining='PLAIN', base=3.0, crease=134, bezier_err=4.0, sampling=4.0,
                                calli=dict(min=0.9, max=10, orient=40))),
  ("5_brush_heavy",        dict(chaining='PLAIN', base=5.0, crease=138, bezier_err=3.0, calli=dict(min=1.2, max=13, orient=35))),
  ("6_fine_confident",     dict(chaining='PLAIN', base=1.7, crease=128, bezier_err=2.0)),
  ("7_marker_uniform",     dict(chaining='PLAIN', base=6.0, crease=140, sampling=3.0)),
  ("8_calli_alive",        dict(chaining='PLAIN', base=3.0, crease=134, pn_amp=1.0, sampling=3.0,
                                calli=dict(min=0.9, max=10, orient=42))),
  ("9_confident_min_wobble",dict(chaining='PLAIN', base=3.2, crease=132, sp_amp=1.4, bezier_err=3.0,
                                calli=dict(min=1.0, max=9, orient=38))),
]

for name, params in VARIANTS:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.render.engine = eevee()
    build_city()
    line_style(**params)
    sc = bpy.context.scene
    try: sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'
    except Exception: pass
    sc.render.resolution_x, sc.render.resolution_y = RES
    try: sc.eevee.taa_render_samples = 24
    except Exception: pass
    sc.render.image_settings.file_format = 'PNG'; sc.render.filepath = os.path.join(OUT, f"{name}.png")
    bpy.ops.render.render(write_still=True); print("  wrote", name)
print("LINES CATALOG DONE")
