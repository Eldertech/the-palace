"""
BLUELINE — MOTION treatment CATALOG (representative stills). Range of:
  water  : calm ripples / rolling swell / choppy storm
  clouds : cumulus / thunderhead+lightning / wispy / low-angle
  smoke  : wispy tendril / thick billow
  fire   : flame tongues / fire+smoke
All EEVEE toon + confident Freestyle ink. One frame each -> labeled grid.
"""
import bpy, math, os, random
OUT = "/Users/loudonstearns/Documents/The Palace/Projects/BLUELINE/proofs/blender-handdrawn/catalog/motion"
os.makedirs(OUT, exist_ok=True)
RES = (560, 560)

def eevee():
    items = [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items]
    for c in ('BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE'):
        if c in items: return c
    return items[0]

def toon(name, shadow, light, mid=None, tint=(1, 1, 1)):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    diff = nt.nodes.new('ShaderNodeBsdfDiffuse'); diff.inputs['Color'].default_value = (*tint, 1)
    s2 = nt.nodes.new('ShaderNodeShaderToRGB'); ramp = nt.nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.interpolation = 'CONSTANT'; e = ramp.color_ramp.elements
    e[0].position = 0.0; e[0].color = (*shadow, 1); e[1].position = 0.5; e[1].color = (*light, 1)
    if mid: e2 = ramp.color_ramp.elements.new(0.28); e2.color = (*mid, 1)
    em = nt.nodes.new('ShaderNodeEmission'); out = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(diff.outputs['BSDF'], s2.inputs['Shader']); nt.links.new(s2.outputs['Color'], ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'], em.inputs['Color']); nt.links.new(em.outputs['Emission'], out.inputs['Surface'])
    return m

def emit(name, c):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    em = nt.nodes.new('ShaderNodeEmission'); em.inputs['Color'].default_value = (*c, 1)
    out = nt.nodes.new('ShaderNodeOutputMaterial'); nt.links.new(em.outputs['Emission'], out.inputs['Surface']); return m

def freestyle(thick=2.6, crease=132, calli=(1.0, 8.0, 38)):
    sc = bpy.context.scene; sc.render.use_freestyle = True; sc.render.line_thickness_mode = 'ABSOLUTE'
    vl = sc.view_layers[0]; vl.use_freestyle = True; fs = vl.freestyle_settings
    if len(fs.linesets) == 0: fs.linesets.new('LS')
    ls = fs.linesets[0]; ls.linestyle = bpy.data.linestyles.new('S')
    for a, v in (('select_silhouette', True), ('select_border', True), ('select_crease', True), ('select_external_contour', True)):
        try: setattr(ls, a, v)
        except Exception: pass
    try: fs.crease_angle = math.radians(crease)
    except Exception: pass
    st = ls.linestyle; st.color = (0, 0, 0); st.thickness = thick; st.use_chaining = True
    try: st.chaining = 'PLAIN'
    except Exception: pass
    g = st.geometry_modifiers
    try: g.new(name='samp', type='SAMPLING'); g[-1].sampling = 3.0
    except Exception: pass
    try: g.new(name='bz', type='BEZIER_CURVE'); g[-1].error = 2.5
    except Exception: pass
    t = st.thickness_modifiers; t.new(name='c', type='CALLIGRAPHY'); cm = t[-1]
    cm.orientation = math.radians(calli[2]); cm.thickness_min = calli[0]; cm.thickness_max = calli[1]

def sun(rot, e=5):
    d = bpy.data.lights.new('S', 'SUN'); d.energy = e; o = bpy.data.objects.new('S', d)
    bpy.context.collection.objects.link(o); o.rotation_euler = rot

def cam(loc, rot, lens=32, dutch=0):
    cd = bpy.data.cameras.new('C'); cd.lens = lens; c = bpy.data.objects.new('C', cd)
    bpy.context.collection.objects.link(c); c.location = loc; c.rotation_euler = rot
    if dutch: c.rotation_euler.rotate_axis('Z', math.radians(dutch)); bpy.context.scene.camera = c
    bpy.context.scene.camera = c

def world(v):
    w = bpy.data.worlds.new('W'); bpy.context.scene.world = w; w.use_nodes = True
    w.node_tree.nodes.get('Background').inputs['Color'].default_value = (v, v, v, 1)

def disp(o, scale, strength):
    d = o.modifiers.new('d', 'DISPLACE'); tex = bpy.data.textures.new('t', 'CLOUDS'); tex.noise_scale = scale
    d.texture = tex; d.strength = strength

def blob(loc, r, sub=3):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=sub, radius=r, location=loc)
    o = bpy.context.active_object; bpy.ops.object.shade_smooth(); return o

# ---------------- builders (each sets up a full scene, single frame) -------------
def ocean(wave, chop, wind, res=8):
    bpy.ops.mesh.primitive_plane_add(size=40); p = bpy.context.active_object
    oc = p.modifiers.new('Ocean', 'OCEAN')
    for k, v in (('resolution', res), ('spatial_size', 18), ('wave_scale', wave), ('choppiness', chop), ('wind_velocity', wind)):
        try: setattr(oc, k, v)
        except Exception: pass
    oc.time = 3.0
    p.data.materials.append(toon('w', (0.08, 0.09, 0.12), (0.96, 0.97, 0.99), mid=(0.5, 0.55, 0.6)))
    world(0.55); sun((math.radians(38), 0, math.radians(30))); cam((0, -16, 4.2), (math.radians(74), 0, 0), 30, -3)
    freestyle(2.2, 138)

def clouds(kind):
    world(0.8); sun((math.radians(50), 0, math.radians(-30)))
    cm = toon('cl', (0.45, 0.46, 0.5), (0.99, 0.99, 0.99), mid=(0.78, 0.79, 0.82))
    dark = toon('cd', (0.12, 0.12, 0.15), (0.55, 0.55, 0.6), mid=(0.3, 0.3, 0.34))
    if kind == 'cumulus':
        for x, y, z, r in [(-5, 12, 4, 3.2), (1, 15, 5, 4.0), (8, 12, 3.5, 2.8)]:
            b = blob((x, y, z), r); disp(b, 0.5, r*0.5); b.scale = (1.3, 0.7, 0.8); b.data.materials.append(cm)
        cam((0, -3, 6), (math.radians(82), 0, 0), 35, -2)
    elif kind == 'thunderhead':
        for i, (z, r) in enumerate([(3, 5), (7, 5.5), (11.5, 6), (16, 4)]):  # tall anvil
            b = blob((0, 18, z), r); disp(b, 0.45, r*0.5); b.scale = (1.1, 0.8, 1.0)
            b.data.materials.append(dark if i < 2 else cm)
        # lightning bolt
        pts = [(2, 16, 14), (0.5, 16, 10), (1.8, 16, 6), (0, 16, 2)]
        for a, c in zip(pts, pts[1:]):
            mid = ((a[0]+c[0])/2, 16, (a[2]+c[2])/2)
            bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=((a[0]-c[0])**2+(a[2]-c[2])**2)**0.5, location=mid)
            bz = bpy.context.active_object; bz.rotation_euler = (math.atan2(a[0]-c[0], c[2]-a[2]), 0, 0)
            bz.data.materials.append(emit('bolt', (1, 1, 1)))
        world(0.32); cam((0, -6, 7), (math.radians(82), 0, 0), 30, -3)
    elif kind == 'wispy':
        for x, y, z in [(-6, 14, 6), (-1, 16, 7), (5, 13, 6.5)]:
            b = blob((x, y, z), 3.0); disp(b, 0.8, 2.6); b.scale = (2.4, 0.5, 0.4); b.data.materials.append(cm)
        cam((0, -3, 6.5), (math.radians(84), 0, 0), 38, -2)
    elif kind == 'lowangle':
        for x, y, z, r in [(-4, 14, 7, 3.4), (3, 17, 8, 4.2), (9, 13, 6, 2.8)]:
            b = blob((x, y, z), r); disp(b, 0.5, r*0.5); b.scale = (1.4, 0.8, 0.8); b.data.materials.append(cm)
        cam((0, -8, 1.5), (math.radians(58), 0, 0), 30, -4)  # looking UP
    freestyle(2.4, 122)

def smoke(kind):
    world(0.92); sun((math.radians(55), 0, math.radians(20)), 4)
    bpy.ops.mesh.primitive_plane_add(size=30); bpy.context.active_object.data.materials.append(toon('g', (0.2, 0.2, 0.22), (0.9, 0.9, 0.9)))
    sm = toon('s', (0.06, 0.06, 0.07), (0.62, 0.62, 0.64), mid=(0.32, 0.32, 0.34))
    if kind == 'wispy':
        for i in range(5):
            b = blob((math.sin(i)*0.6, 4, 1.5+i*1.7), 0.8+i*0.18); disp(b, 0.6, (0.8+i*0.18)*0.7)
            b.scale = (0.5, 0.5, 1.5); b.data.materials.append(sm)
    else:  # billow
        for i in range(6):
            b = blob((math.sin(i*1.3)*0.4, 4, 1.2+i*1.6), 1.1+i*0.42); disp(b, 0.4, (1.1+i*0.42)*0.6)
            b.scale = (1.0, 1.0, 1.1); b.data.materials.append(sm)
    cam((0, -9, 4), (math.radians(80), 0, 0), 30, -5); freestyle(2.3, 124)

def fire(kind):
    world(0.9); sun((math.radians(55), 0, math.radians(20)), 4)
    bpy.ops.mesh.primitive_plane_add(size=30); bpy.context.active_object.data.materials.append(toon('g', (0.2, 0.2, 0.22), (0.9, 0.9, 0.9)))
    flame = toon('fl', (0.25, 0.25, 0.25), (1.0, 1.0, 1.0), mid=(0.7, 0.7, 0.7))  # bright flame, ink edge
    # licking tongues = tall cones displaced
    for i, x in enumerate((-1.4, -0.4, 0.5, 1.5)):
        bpy.ops.mesh.primitive_cone_add(radius1=0.7-0.08*i, depth=2.6+0.5*((i+1) % 3), location=(x, 4, 1.3))
        c = bpy.context.active_object; bpy.ops.object.shade_smooth(); disp(c, 0.7, 0.5); c.scale = (1, 1, 1.2 + 0.2*i)
        c.data.materials.append(flame)
    if kind == 'fire_smoke':
        sm = toon('s', (0.06, 0.06, 0.07), (0.6, 0.6, 0.62), mid=(0.3, 0.3, 0.32))
        for i in range(4):
            b = blob((math.sin(i)*0.4, 4, 4.0+i*1.5), 1.0+i*0.4); disp(b, 0.45, (1.0+i*0.4)*0.6); b.data.materials.append(sm)
    cam((0, -7, 2.6), (math.radians(82), 0, 0), 30, -4); freestyle(2.3, 126)

JOBS = [
    ("water_1_calm", lambda: ocean(0.4, 0.2, 6)),
    ("water_2_swell", lambda: ocean(1.3, 0.9, 14)),
    ("water_3_storm", lambda: ocean(2.3, 1.4, 24, res=9)),
    ("cloud_1_cumulus", lambda: clouds('cumulus')),
    ("cloud_2_thunderhead", lambda: clouds('thunderhead')),
    ("cloud_3_wispy", lambda: clouds('wispy')),
    ("cloud_4_lowangle", lambda: clouds('lowangle')),
    ("smoke_1_wispy", lambda: smoke('wispy')),
    ("smoke_2_billow", lambda: smoke('billow')),
    ("fire_1_tongues", lambda: fire('flames')),
    ("fire_2_fire_smoke", lambda: fire('fire_smoke')),
]
for name, builder in JOBS:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.render.engine = eevee()
    builder()
    sc = bpy.context.scene
    try: sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'
    except Exception: pass
    sc.render.resolution_x, sc.render.resolution_y = RES
    try: sc.eevee.taa_render_samples = 24
    except Exception: pass
    sc.render.image_settings.file_format = 'PNG'; sc.render.filepath = os.path.join(OUT, f"{name}.png")
    bpy.ops.render.render(write_still=True); print("  wrote", name)
print("MOTION CATALOG DONE")
