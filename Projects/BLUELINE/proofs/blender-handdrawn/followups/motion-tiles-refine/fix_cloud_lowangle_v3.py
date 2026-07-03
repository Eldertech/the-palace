"""
BLUELINE — CLOUD LOW-ANGLE FIX v3
After v2: clouds visible + good toon, but jammed into top strip.
Fix: camera rot_x 50° (not 62°), clouds z lowered -1.5 units, wider spread.
Goal: lower half = dark ground/horizon, upper half-to-2/3 = dramatic storm clouds.
"""
import bpy, math, os

OUT = "/Users/loudonstearns/Documents/The Palace/Projects/BLUELINE/proofs/blender-handdrawn/followups/motion-tiles-refine"
os.makedirs(OUT, exist_ok=True)
FRAMES = 24; RES = (560, 560)

def eevee():
    items = [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items]
    for c in ('BLENDER_EEVEE_NEXT','BLENDER_EEVEE'):
        if c in items: return c
    return items[0]

def toon(name, shadow, light, mid=None):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    diff = nt.nodes.new('ShaderNodeBsdfDiffuse'); diff.inputs['Color'].default_value=(1,1,1,1)
    s2 = nt.nodes.new('ShaderNodeShaderToRGB')
    ramp = nt.nodes.new('ShaderNodeValToRGB'); ramp.color_ramp.interpolation='CONSTANT'
    e = ramp.color_ramp.elements
    e[0].position=0.0; e[0].color=(*shadow,1)
    e[1].position=0.5; e[1].color=(*light,1)
    if mid: e2=ramp.color_ramp.elements.new(0.28); e2.color=(*mid,1)
    em = nt.nodes.new('ShaderNodeEmission'); out = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(diff.outputs['BSDF'],s2.inputs['Shader'])
    nt.links.new(s2.outputs['Color'],ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'],em.inputs['Color'])
    nt.links.new(em.outputs['Emission'],out.inputs['Surface']); return m

def freestyle_setup(thick=3.2, crease=110):
    sc=bpy.context.scene; sc.render.use_freestyle=True; sc.render.line_thickness_mode='ABSOLUTE'
    vl=sc.view_layers[0]; vl.use_freestyle=True; fs=vl.freestyle_settings
    if len(fs.linesets)==0: fs.linesets.new('LS')
    ls=fs.linesets[0]
    if not ls.linestyle: ls.linestyle=bpy.data.linestyles.new('Ink')
    for a,v in (('select_silhouette',True),('select_border',True),
                ('select_crease',True),('select_external_contour',True)):
        try: setattr(ls,a,v)
        except Exception: pass
    try: fs.crease_angle=math.radians(crease)
    except Exception: pass
    st=ls.linestyle; st.color=(0,0,0); st.thickness=thick; st.use_chaining=True
    try: st.chaining='PLAIN'
    except Exception: pass
    g=st.geometry_modifiers
    try: g.new(name='samp',type='SAMPLING'); g[-1].sampling=3.0
    except Exception: pass
    try: g.new(name='bz',type='BEZIER_CURVE'); g[-1].error=2.5
    except Exception: pass
    t=st.thickness_modifiers; t.new(name='calli',type='CALLIGRAPHY'); cm=t[-1]
    cm.orientation=math.radians(38); cm.thickness_min=1.2; cm.thickness_max=9.0
    return st

def add_boil(linestyle):
    def boil(scene):
        f=scene.frame_current
        for gm in linestyle.geometry_modifiers:
            if gm.type=='PERLIN_NOISE_1D': gm.seed=(f//2)+1
    bpy.app.handlers.frame_change_pre.append(boil)

def cloud_blob(loc, r, sub=4, sqz=0.82, sqx=1.18):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=sub, radius=r, location=loc)
    o=bpy.context.active_object; bpy.ops.object.shade_smooth()
    sm=o.modifiers.new('smooth','SMOOTH'); sm.iterations=3; sm.factor=0.5
    o.scale=(sqx,1.0,sqz); return o

def build():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for h in list(bpy.app.handlers.frame_change_pre):
        bpy.app.handlers.frame_change_pre.remove(h)
    sc=bpy.context.scene; sc.render.engine=eevee()
    try: sc.view_settings.view_transform='Standard'; sc.view_settings.look='None'
    except Exception: pass
    sc.render.resolution_x,sc.render.resolution_y=RES
    try: sc.eevee.taa_render_samples=32
    except Exception: pass

    # Dark stormy world
    w=bpy.data.worlds.new('W'); sc.world=w; w.use_nodes=True
    w.node_tree.nodes.get('Background').inputs['Color'].default_value=(0.22,0.22,0.26,1)

    # Strong side-light from upper right
    d=bpy.data.lights.new('Sun','SUN'); d.energy=9
    o=bpy.data.objects.new('Sun',d); bpy.context.collection.objects.link(o)
    o.rotation_euler=(math.radians(50),0,math.radians(-50))

    dark_belly=toon('cd',(0.06,0.06,0.08),(0.65,0.65,0.68),mid=(0.28,0.28,0.32))
    bright_top =toon('cb',(0.28,0.28,0.32),(0.97,0.97,0.99))

    # Ground — thin dark strip at bottom of frame
    bpy.ops.mesh.primitive_plane_add(size=80, location=(0,15,-1.5))
    bpy.context.active_object.data.materials.append(
        toon('gnd',(0.04,0.04,0.05),(0.28,0.28,0.30)))

    # Camera: rot_x=50° = looking 40° above horizon
    # At y=-2, z=0.4 looking at elevation 40°
    # Horizon line roughly 1/3 from bottom, clouds fill upper 2/3
    cd=bpy.data.cameras.new('C'); cd.lens=24
    cam=bpy.data.objects.new('C',cd); bpy.context.collection.objects.link(cam)
    cam.location=(0,-2,0.4)
    cam.rotation_euler=(math.radians(50),0,math.radians(-6))
    sc.camera=cam

    # Cloud layout — v3: lower z, spread across y range
    # With cam rot_x=50°, center of view is at ~y=7, z=2.5 at range 8 units
    # Lower belt (z=1-3, dark bellied) fills middle of frame
    # Upper towers (z=4-8, bright) fill top of frame
    specs = [
        # x,  y,   z,   r,    dark,  sqz,  sqx
        (-6,  6,  1.2, 3.8,  True,  0.68, 1.30),  # lower left belly
        ( 5,  6,  1.0, 3.4,  True,  0.70, 1.22),  # lower right belly
        ( 0,  8,  2.5, 4.8,  True,  0.75, 1.15),  # center foreground belly
        (-8,  8,  2.0, 3.0,  True,  0.72, 1.20),  # far left belly
        ( 7,  9,  2.2, 3.2,  True,  0.73, 1.18),  # far right belly
        (-4, 11,  4.5, 4.0, False,  0.82, 1.10),  # upper left tower
        ( 4, 11,  4.2, 3.8, False,  0.80, 1.12),  # upper right tower
        ( 0, 13,  6.0, 4.5, False,  0.85, 1.08),  # center pinnacle bright
        (-6, 13,  5.5, 3.0, False,  0.82, 1.10),  # upper left bg
        ( 6, 14,  5.2, 2.8, False,  0.80, 1.08),  # upper right bg
    ]

    blobs=[]
    for x,y,z,r,dark,sqz,sqx in specs:
        b=cloud_blob((x,y,z),r,sqz=sqz,sqx=sqx)
        b.data.materials.append(dark_belly if dark else bright_top)
        blobs.append((b,x,y,z))

    st=freestyle_setup(thick=3.2,crease=112)

    for f in range(1,FRAMES+1):
        t=(f-1)/max(FRAMES-1,1)
        for b,x0,y0,z0 in blobs:
            b.location.x=x0-2.5*t
            b.location.y=y0-1.0*t
            b.keyframe_insert('location',frame=f)

    add_boil(st)
    return sc

sc=build()

# Still at frame 8
sc.frame_set(8)
sc.render.image_settings.file_format='PNG'
sc.render.filepath=os.path.join(OUT,"cloud_lowangle_v3.png")
bpy.ops.render.render(write_still=True)
print("  wrote cloud_lowangle_v3.png")

# Clip
folder=os.path.join(OUT,"cloud_lowangle_v3_frames")
os.makedirs(folder,exist_ok=True)
sc.frame_start=1; sc.frame_end=FRAMES
sc.render.filepath=os.path.join(folder,"frame_")
bpy.ops.render.render(animation=True)
print("  rendered clip")
print("CLOUD v3 DONE")
