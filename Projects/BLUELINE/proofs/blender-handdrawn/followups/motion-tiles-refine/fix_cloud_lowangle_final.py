"""
BLUELINE — CLOUD LOW-ANGLE FINAL
v4 showed great dark bellies but too close — only flat underside visible.
Final: clouds at y=5-14, z=1-7, cam rot_x=45° lens=22mm.
Composition: lower 1/3 = empty sky/horizon, middle = dark cloud bellies with ink,
upper 1/3 = bright lit cloud tops. Classic thunderstorm from below.
"""
import bpy, math, os

OUT="/Users/loudonstearns/Documents/The Palace/Projects/BLUELINE/proofs/blender-handdrawn/followups/motion-tiles-refine"
os.makedirs(OUT,exist_ok=True)
FRAMES=24; RES=(560,560)

def eevee():
    items=[e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items]
    for c in ('BLENDER_EEVEE_NEXT','BLENDER_EEVEE'):
        if c in items: return c
    return items[0]

def toon(name,shadow,light,mid=None):
    m=bpy.data.materials.new(name); m.use_nodes=True
    nt=m.node_tree; nt.nodes.clear()
    diff=nt.nodes.new('ShaderNodeBsdfDiffuse'); diff.inputs['Color'].default_value=(1,1,1,1)
    s2=nt.nodes.new('ShaderNodeShaderToRGB')
    ramp=nt.nodes.new('ShaderNodeValToRGB'); ramp.color_ramp.interpolation='CONSTANT'
    e=ramp.color_ramp.elements; e[0].position=0.0; e[0].color=(*shadow,1)
    e[1].position=0.5; e[1].color=(*light,1)
    if mid: ee=ramp.color_ramp.elements.new(0.28); ee.color=(*mid,1)
    em=nt.nodes.new('ShaderNodeEmission'); out=nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(diff.outputs['BSDF'],s2.inputs['Shader'])
    nt.links.new(s2.outputs['Color'],ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'],em.inputs['Color'])
    nt.links.new(em.outputs['Emission'],out.inputs['Surface']); return m

def freestyle_setup(thick=3.0,crease=110):
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
    try: g.new(name='samp',type='SAMPLING'); g[-1].sampling=2.5
    except Exception: pass
    try: g.new(name='bz',type='BEZIER_CURVE'); g[-1].error=2.0
    except Exception: pass
    t=st.thickness_modifiers; t.new(name='c',type='CALLIGRAPHY'); cm=t[-1]
    cm.orientation=math.radians(38); cm.thickness_min=1.2; cm.thickness_max=9.0
    return st

def add_boil(linestyle):
    def boil(scene):
        f=scene.frame_current
        for gm in linestyle.geometry_modifiers:
            if gm.type=='PERLIN_NOISE_1D': gm.seed=(f//2)+1
    bpy.app.handlers.frame_change_pre.append(boil)

def cloud_blob(loc,r,sub=4,sqz=0.82,sqx=1.18):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=sub,radius=r,location=loc)
    o=bpy.context.active_object; bpy.ops.object.shade_smooth()
    sm=o.modifiers.new('smooth','SMOOTH'); sm.iterations=4; sm.factor=0.6
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

    # Dark stormy sky
    w=bpy.data.worlds.new('W'); sc.world=w; w.use_nodes=True
    w.node_tree.nodes.get('Background').inputs['Color'].default_value=(0.20,0.20,0.24,1)

    # Strong top-light
    d=bpy.data.lights.new('Sun','SUN'); d.energy=10
    o2=bpy.data.objects.new('Sun',d); bpy.context.collection.objects.link(o2)
    o2.rotation_euler=(math.radians(38),0,math.radians(-50))

    dark=toon('dark',(0.04,0.04,0.06),(0.58,0.58,0.62),mid=(0.24,0.24,0.28))
    bright=toon('bright',(0.28,0.28,0.32),(0.97,0.97,0.99))

    # Ground context strip
    bpy.ops.mesh.primitive_plane_add(size=80,location=(0,25,-2))
    bpy.context.active_object.data.materials.append(
        toon('gnd',(0.03,0.03,0.04),(0.18,0.18,0.20)))

    # Camera: rot_x=45° = looking 45° above horizon
    # lens=22mm (~82° FOV) = wide enough to see dramatic clouds
    cd=bpy.data.cameras.new('C'); cd.lens=22
    cam=bpy.data.objects.new('C',cd); bpy.context.collection.objects.link(cam)
    cam.location=(0,-1,0.5)
    cam.rotation_euler=(math.radians(45),0,math.radians(-8))
    sc.camera=cam

    # Cloud composition:
    # With rot_x=45°, horizon is ~in the middle, upper half = sky
    # Foreground clouds (y=5-7, z=0.5-2) = dark bellies filling center of frame
    # Background towers (y=9-14, z=3-8) = bright tops filling upper frame
    specs=[
        # x,  y,  z,   r,   dark, sqz,  sqx
        (-8,  5,  1.0, 5.0, True,  0.65, 1.35),  # left foreground belly
        ( 6,  5,  0.8, 4.5, True,  0.68, 1.28),  # right foreground belly
        ( 0,  7,  1.5, 5.8, True,  0.70, 1.18),  # center foreground belly
        (-5,  7,  1.2, 3.8, True,  0.67, 1.22),  # left mid belly
        ( 5,  7,  1.0, 3.5, True,  0.68, 1.20),  # right mid belly
        (-4,  9,  3.8, 4.8, False, 0.80, 1.12),  # upper left tower bright
        ( 4,  9,  3.5, 4.5, False, 0.80, 1.12),  # upper right tower bright
        ( 0, 12,  5.5, 5.5, False, 0.85, 1.08),  # central pinnacle brightest
        (-8, 11,  4.0, 3.2, False, 0.82, 1.10),  # far left upper
        ( 8, 10,  3.8, 3.0, False, 0.80, 1.10),  # far right upper
    ]

    blobs=[]
    for x,y,z,r,dk,sqz,sqx in specs:
        b=cloud_blob((x,y,z),r,sqz=sqz,sqx=sqx)
        b.data.materials.append(dark if dk else bright)
        blobs.append((b,x,y,z))

    st=freestyle_setup(thick=3.0,crease=110)

    for f in range(1,FRAMES+1):
        t=(f-1)/max(FRAMES-1,1)
        for b,x0,y0,z0 in blobs:
            b.location.x=x0-2.5*t
            b.keyframe_insert('location',frame=f)

    add_boil(st)
    return sc

sc=build()

sc.frame_set(8)
sc.render.image_settings.file_format='PNG'
sc.render.filepath=os.path.join(OUT,"cloud_lowangle_FINAL.png")
bpy.ops.render.render(write_still=True)
print("  wrote cloud_lowangle_FINAL.png")

folder=os.path.join(OUT,"cloud_lowangle_final_frames")
os.makedirs(folder,exist_ok=True)
sc.frame_start=1; sc.frame_end=FRAMES
sc.render.filepath=os.path.join(folder,"frame_")
bpy.ops.render.render(animation=True)
print("  rendered clip")
print("CLOUD FINAL DONE")
