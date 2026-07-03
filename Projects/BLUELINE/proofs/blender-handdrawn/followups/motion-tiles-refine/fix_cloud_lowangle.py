"""
BLUELINE — CLOUD LOW-ANGLE FIX
Replaces cat_motion.py 'lowangle' clouds which rendered nearly empty.

Problem: cam at (0,-8,1.5) rot=(58°,0,0) with clouds at y=13-17,z=6-8 and
lens=30 caused the upper frame to be mostly empty sky; clouds were far away and
small in frame.

Fix strategy:
  - Camera at ground level (z=0.4), rotated almost straight up (rot_x=20° = 70° tilt
    from horizon), lens=18 (wide) for dramatic foreshortening
  - Clouds placed DIRECTLY overhead: y=0..6, z=4..9 — filling the top 2/3 of frame
  - Thunderstorm cumulus: large blobs (r=4-6), stacked to form a towering column
  - Dark underside toon for dramatic B&W contrast
  - Bright rim-lit tops vs dark bellies = strong toon reads
"""
import bpy, math, os, sys

OUT = "/Users/loudonstearns/Documents/The Palace/Projects/BLUELINE/proofs/blender-handdrawn/followups/motion-tiles-refine"
os.makedirs(OUT, exist_ok=True)

FRAMES = 24
RES = (560, 560)
RENDER_STILL = True
RENDER_CLIP  = True

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
    s2  = nt.nodes.new('ShaderNodeShaderToRGB')
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

def freestyle_setup(thick=2.8, crease=118):
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
    cm.orientation = math.radians(38); cm.thickness_min = 1.0; cm.thickness_max = 8.0
    return st

def add_boil(linestyle):
    def boil(scene):
        f = scene.frame_current
        for gm in linestyle.geometry_modifiers:
            if gm.type == 'PERLIN_NOISE_1D':
                gm.seed = (f // 2) + 1
    bpy.app.handlers.frame_change_pre.append(boil)

def blob_cloud(loc, r, sub=4):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=sub, radius=r, location=loc)
    o = bpy.context.active_object; bpy.ops.object.shade_smooth(); return o

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

    # Sky — bright overcast light from above
    w = bpy.data.worlds.new('W'); sc.world = w; w.use_nodes = True
    w.node_tree.nodes.get('Background').inputs['Color'].default_value = (0.88, 0.88, 0.88, 1)

    # Light from above-behind (rim-lighting the cloud tops)
    d = bpy.data.lights.new('Sun', 'SUN'); d.energy = 7
    o = bpy.data.objects.new('Sun', d); bpy.context.collection.objects.link(o)
    o.rotation_euler = (math.radians(20), 0, math.radians(-30))  # nearly overhead, slight angle

    # Materials — dark belly, bright lit top
    dark_belly = toon('cloud_dark',
                      shadow=(0.04, 0.04, 0.06),   # very dark underside
                      light=(0.52, 0.52, 0.56),    # mid gray when lit
                      mid=(0.22, 0.22, 0.26))
    bright_top  = toon('cloud_bright',
                       shadow=(0.36, 0.36, 0.40),  # shadow side
                       light=(0.98, 0.98, 0.99))   # bright white top

    # CLOUD GEOMETRY — towering cumulus seen from below
    # Camera is at ground looking almost straight up, so clouds fill the overhead dome
    # Place clouds at y=-2..4, z=3..12, clustered overhead
    cloud_specs = [
        # (x, y, z, r, dark?)  — large base blobs are dark-bellied
        (-3.5,  0.5, 3.5, 4.2, True),   # near left, dark belly faces camera
        ( 2.5, -0.5, 4.0, 4.8, True),   # near right
        (-1.0,  2.0, 6.5, 4.0, True),   # center mid
        ( 4.0,  1.0, 5.5, 3.6, True),   # right mid
        (-4.0,  1.5, 7.5, 3.2, False),  # upper left, bright
        ( 1.5,  0.5, 9.0, 3.8, False),  # towering top center
        (-1.5, -1.0, 11.0, 3.0, False), # highest point, bright
        ( 5.0,  0.0, 8.5, 2.8, False),  # upper right
        (-6.0, -0.5, 5.5, 2.4, True),   # far left mid, dark
    ]
    blobs_for_anim = []
    for x, y, z, r, dark in cloud_specs:
        b = blob_cloud((x, y, z), r)
        disp(b, 0.45, r * 0.48)
        # squash slightly horizontally to look like real cloud lumps
        b.scale = (1.15, 1.0, 0.9)
        b.data.materials.append(dark_belly if dark else bright_top)
        blobs_for_anim.append((b, x, y, z))

    # Camera: ground level, looking almost straight up (dramatic low-angle)
    # rot_x = 15° means looking 75° up from horizontal = nearly overhead
    cd = bpy.data.cameras.new('C'); cd.lens = 16  # ultra-wide for dramatic overhead view
    cam = bpy.data.objects.new('C', cd); bpy.context.collection.objects.link(cam)
    cam.location = (0, 0, 0.3)  # ground level
    cam.rotation_euler = (math.radians(15), 0, math.radians(-5))  # looking almost straight up
    sc.camera = cam

    # Add boil-ready freestyle
    st = freestyle_setup(thick=2.6, crease=115)

    # Animate: slow drift overhead (clouds pass across)
    for f in range(1, FRAMES + 1):
        t = (f - 1) / max(FRAMES - 1, 1)
        for b, x0, y0, z0 in blobs_for_anim:
            b.location.x = x0 - 1.8 * t   # drift left
            b.location.y = y0 - 0.8 * t   # drift slightly toward cam
            b.keyframe_insert('location', frame=f)

    add_boil(st)
    return sc

# ---- RENDER ----
sc = build_scene()

if RENDER_STILL:
    sc.frame_set(8)   # frame 8 — clouds well in view
    sc.render.image_settings.file_format = 'PNG'
    sc.render.filepath = os.path.join(OUT, "cloud_lowangle_FIX.png")
    bpy.ops.render.render(write_still=True)
    print("  wrote cloud_lowangle_FIX.png")

if RENDER_CLIP:
    folder = os.path.join(OUT, "cloud_lowangle_frames")
    os.makedirs(folder, exist_ok=True)
    sc.frame_start = 1; sc.frame_end = FRAMES
    sc.render.filepath = os.path.join(folder, "frame_")
    bpy.ops.render.render(animation=True)
    print("  rendered cloud_lowangle clip frames")

print("CLOUD LOW-ANGLE FIX DONE")
