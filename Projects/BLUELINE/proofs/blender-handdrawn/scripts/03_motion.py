"""
BLUELINE — hand-drawn MOTION research demo (water / clouds / smoke).
Headless-robust: no Mantaflow bake. Procedural motion rendered through EEVEE toon
+ sketchy Freestyle ink, with a per-frame line 'boil' so the ink wavers frame to
frame like traditional hand-drawn animation.

Run:
  /Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup -P 03_motion.py
Then assemble each motion/<name>/ folder to mp4/gif with ffmpeg.
"""
import bpy, math, os

OUT = "/Users/loudonstearns/Documents/The Palace/Projects/BLUELINE/proofs/blender-handdrawn/motion"
os.makedirs(OUT, exist_ok=True)
RES = (768, 768)
FRAMES = 24            # play at 12fps -> 2s, 'on twos' feel

def wipe():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for h in list(bpy.app.handlers.frame_change_pre):
        bpy.app.handlers.frame_change_pre.remove(h)

def eevee_engine():
    items = [e.identifier for e in
             bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items]
    for c in ('BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE'):
        if c in items: return c
    return items[0]

def toon_mat(name, shadow=(0.05, 0.05, 0.06), light=(0.97, 0.97, 0.97), tint=(1, 1, 1), mid=None):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    diff = nt.nodes.new('ShaderNodeBsdfDiffuse')
    diff.inputs['Color'].default_value = (*tint, 1)
    s2 = nt.nodes.new('ShaderNodeShaderToRGB')
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.interpolation = 'CONSTANT'
    e = ramp.color_ramp.elements
    e[0].position = 0.0;  e[0].color = (*shadow, 1)
    e[1].position = 0.5;  e[1].color = (*light, 1)
    if mid is not None:
        m2 = ramp.color_ramp.elements.new(0.28); m2.color = (*mid, 1)
    em = nt.nodes.new('ShaderNodeEmission')
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(diff.outputs['BSDF'], s2.inputs['Shader'])
    nt.links.new(s2.outputs['Color'], ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'], em.inputs['Color'])
    nt.links.new(em.outputs['Emission'], out.inputs['Surface'])
    return m

def freestyle(thickness=2.2, crease_deg=130):
    sc = bpy.context.scene
    sc.render.use_freestyle = True
    sc.render.line_thickness_mode = 'ABSOLUTE'
    vl = sc.view_layers[0]; vl.use_freestyle = True
    fs = vl.freestyle_settings
    if len(fs.linesets) == 0: fs.linesets.new('LS')
    ls = fs.linesets[0]
    if ls.linestyle is None: ls.linestyle = bpy.data.linestyles.new('Ink')
    for a, v in (('select_silhouette', True), ('select_border', True),
                 ('select_crease', True), ('select_contour', True),
                 ('select_external_contour', True), ('select_material_boundary', True)):
        try: setattr(ls, a, v)
        except Exception: pass
    try: ls.crease_angle = math.radians(crease_deg)
    except Exception: pass
    st = ls.linestyle
    st.color = (0, 0, 0); st.thickness = thickness
    st.use_chaining = True
    try: st.chaining = 'SKETCHY'; st.rounds = 2
    except Exception: pass
    g = st.geometry_modifiers
    try:
        g.new(name='sp', type='SPATIAL_NOISE'); m = g[-1]
        m.amplitude = 3.5; m.scale = 16; m.octaves = 2; m.smooth = True
    except Exception: pass
    try:
        g.new(name='pn', type='PERLIN_NOISE_1D'); m = g[-1]
        m.amplitude = 2.5; m.frequency = 8; m.octaves = 3; m.seed = 1
    except Exception: pass
    try:
        t = st.thickness_modifiers; t.new(name='c', type='CALLIGRAPHY'); cm = t[-1]
        cm.orientation = math.radians(45); cm.thickness_min = 0.5; cm.thickness_max = 3.8
    except Exception: pass
    return st

def add_boil(linestyle):
    """Re-seed the line noise 'on twos' so the ink wavers each frame (hand-drawn boil)."""
    def boil(scene):
        f = scene.frame_current
        for gm in linestyle.geometry_modifiers:
            if gm.type == 'PERLIN_NOISE_1D':
                gm.seed = (f // 2) + 1
    bpy.app.handlers.frame_change_pre.append(boil)

def _set_linear(obj):
    """Set all keyframe interpolation to LINEAR across legacy + slotted action APIs."""
    ad = obj.animation_data
    if not ad or not ad.action: return
    act = ad.action
    fcurves = []
    try:                                   # legacy (<=4.3)
        fcurves = list(act.fcurves)
    except Exception:
        try:                               # slotted actions (4.4+/5.x)
            for layer in act.layers:
                for strip in layer.strips:
                    for cb in getattr(strip, 'channelbags', []):
                        fcurves.extend(cb.fcurves)
        except Exception:
            return
    for fc in fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'

def add_camera(loc, rot, lens=35, dutch=0):
    cd = bpy.data.cameras.new('C'); cd.lens = lens
    c = bpy.data.objects.new('C', cd); bpy.context.collection.objects.link(c)
    c.location = loc; c.rotation_euler = rot
    if dutch: c.rotation_euler.rotate_axis('Z', math.radians(dutch))
    bpy.context.scene.camera = c

def add_sun(rot, e=4.5):
    d = bpy.data.lights.new('S', 'SUN'); d.energy = e
    o = bpy.data.objects.new('S', d); bpy.context.collection.objects.link(o)
    o.rotation_euler = rot

def set_world(v):
    w = bpy.data.worlds.new('W'); bpy.context.scene.world = w; w.use_nodes = True
    bg = w.node_tree.nodes.get('Background')
    bg.inputs['Color'].default_value = (v, v, v, 1); bg.inputs['Strength'].default_value = 1

def common_render(name):
    sc = bpy.context.scene
    sc.render.engine = eevee_engine()
    try:
        sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'
    except Exception: pass
    sc.render.resolution_x, sc.render.resolution_y = RES
    try: sc.eevee.taa_render_samples = 16
    except Exception: pass
    sc.frame_start = 1; sc.frame_end = FRAMES
    folder = os.path.join(OUT, name); os.makedirs(folder, exist_ok=True)
    sc.render.image_settings.file_format = 'PNG'
    sc.render.filepath = os.path.join(folder, "frame_")
    bpy.ops.render.render(animation=True)
    print("  rendered", name, FRAMES, "frames")

# ----------------------------------------------------------------- WATER (ocean)
def scene_water():
    bpy.ops.mesh.primitive_plane_add(size=40, location=(0, 0, 0))
    p = bpy.context.active_object
    oc = p.modifiers.new('Ocean', 'OCEAN')
    for attr, val in (('resolution', 9), ('spatial_size', 18), ('wave_scale', 1.3),
                      ('choppiness', 0.9), ('wind_velocity', 14), ('wave_alignment', 0.4)):
        try: setattr(oc, attr, val)
        except Exception: pass
    # animate the swell
    oc.time = 1.0; oc.keyframe_insert('time', frame=1)
    oc.time = 4.2; oc.keyframe_insert('time', frame=FRAMES)
    _set_linear(p)  # steady swell (best-effort across Blender action API versions)
    p.data.materials.append(toon_mat('water', shadow=(0.08, 0.09, 0.12),
                                     light=(0.96, 0.97, 0.99), mid=(0.5, 0.55, 0.6)))
    set_world(0.55)
    add_sun((math.radians(38), 0, math.radians(30)), e=5)
    add_camera((0, -16, 4.2), (math.radians(74), 0, 0), lens=30, dutch=-3)
    st = freestyle(thickness=2.0, crease_deg=138)
    add_boil(st)

# ----------------------------------------------------------------- CLOUDS (drift)
def scene_clouds():
    set_world(0.78)  # bright sky
    add_sun((math.radians(50), 0, math.radians(-30)), e=5)
    mat = toon_mat('cloud', shadow=(0.45, 0.46, 0.5), light=(0.99, 0.99, 0.99),
                   mid=(0.78, 0.79, 0.82))
    blobs = []
    spots = [(-6, 12, 4, 3.2), (2, 16, 6, 4.0), (9, 13, 3.2, 2.6), (-2, 20, 8, 3.4)]
    for i, (x, y, z, r) in enumerate(spots):
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3, radius=r, location=(x, y, z))
        b = bpy.context.active_object; bpy.ops.object.shade_smooth()
        d = b.modifiers.new('d', 'DISPLACE')
        tex = bpy.data.textures.new(f'c{i}', 'CLOUDS'); tex.noise_scale = 0.5
        d.texture = tex; d.strength = r * 0.5
        b.scale = (1.3, 0.7, 0.8)
        b.data.materials.append(mat)
        blobs.append((b, x))
    # drift left + gentle bob, keyframed
    for f in range(1, FRAMES + 1):
        t = (f - 1) / (FRAMES - 1)
        for b, x0 in blobs:
            b.location.x = x0 - 5.0 * t
            b.location.z = b.location.z  # keep
            b.keyframe_insert('location', frame=f)
    add_camera((0, -3, 6), (math.radians(82), 0, 0), lens=35, dutch=-2)
    st = freestyle(thickness=2.4, crease_deg=120)
    add_boil(st)

# ----------------------------------------------------------------- SMOKE/FIRE (plume)
def scene_smoke():
    set_world(0.92)  # paper sky so ink plume reads
    add_sun((math.radians(55), 0, math.radians(20)), e=4)
    # ground hint
    bpy.ops.mesh.primitive_plane_add(size=30, location=(0, 0, 0))
    g = bpy.context.active_object
    g.data.materials.append(toon_mat('ground', shadow=(0.2, 0.2, 0.22), light=(0.9, 0.9, 0.9)))
    # rising ink plume: stack of churning blobs
    smat = toon_mat('smoke', shadow=(0.06, 0.06, 0.07), light=(0.62, 0.62, 0.64),
                    mid=(0.32, 0.32, 0.34))
    blobs = []
    for i in range(6):
        z = 1.2 + i * 1.7
        r = 1.1 + i * 0.42
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3, radius=r, location=(0, 4, z))
        b = bpy.context.active_object; bpy.ops.object.shade_smooth()
        d = b.modifiers.new('d', 'DISPLACE')
        tex = bpy.data.textures.new(f's{i}', 'CLOUDS'); tex.noise_scale = 0.4
        d.texture = tex; d.strength = r * 0.6
        b.scale = (0.8, 0.8, 1.15)
        b.data.materials.append(smat)
        blobs.append((b, z, r, i))
    # churn upward: wobble x by sine, drift up, grow
    for f in range(1, FRAMES + 1):
        t = (f - 1) / (FRAMES - 1)
        for b, z0, r, i in blobs:
            ph = i * 1.3
            b.location.x = math.sin(t * 6.28 + ph) * (0.25 + i * 0.18)
            b.location.z = z0 + t * 2.4
            s = 1.0 + t * (0.12 + i * 0.04)
            b.scale = (0.8 * s, 0.8 * s, 1.15 * s)
            b.keyframe_insert('location', frame=f)
            b.keyframe_insert('scale', frame=f)
    add_camera((0, -9, 4), (math.radians(80), 0, 0), lens=30, dutch=-5)
    st = freestyle(thickness=2.3, crease_deg=124)
    add_boil(st)

# ----------------------------------------------------------------- run
for name, builder in (('water', scene_water), ('clouds', scene_clouds), ('smoke', scene_smoke)):
    wipe(); builder(); common_render(name)
print("MOTION DONE")
