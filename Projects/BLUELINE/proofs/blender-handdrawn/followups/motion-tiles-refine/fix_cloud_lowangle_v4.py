"""
BLUELINE — CLOUD LOW-ANGLE v4
Goal: clouds fill upper 60% of frame with dramatic B&W ink.

After v2/v3 analysis: clouds kept sliding to top strip because camera
tilted too far up. v4 approach:
  - Camera: rot_x=38° (looking ~52° above horizontal) — sees horizon at bottom 40%
  - Clouds: VERY CLOSE (y=3-6) and LARGE (r=4-7) — they overhang the camera
  - Dark background (0.20) for maximum contrast
  - 3 overlapping cloud masses = cinematic "storm overhead" composition
  - Thin dark ground strip = context that reads as low-angle
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
    e=ramp.color_ramp.elements
    e[0].position=0.0; e[0].color=(*shadow,1)
    e[1].position=0.5; e[1].color=(*light,1)
    if mid: ee=ramp.color_ramp.elements.new(0.28); ee.color=(*mid,1)
    em=nt.nodes.new('ShaderNodeEmission'); out=nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(diff.outputs['BSDF'],s2.inputs['Shader'])
    nt.links.new(s2.outputs['Color'],ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'],em.inputs['Color'])
    nt.links.new(em.outputs['Emission'],out.inputs['Surface']); return m

def freestyle_setup(thick=3.4,crease=108):
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
    cm.orientation=math.radians(38); cm.thickness_min=1.0; cm.thickness_max=8.0
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

    # Very dark sky — stormy
    w=bpy.data.worlds.new('W'); sc.world=w; w.use_nodes=True
    w.node_tree.nodes.get('Background').inputs['Color'].default_value=(0.18,0.18,0.22,1)

    # Strong overhead sun — lights tops white, bottoms dark
    d=bpy.data.lights.new('Sun','SUN'); d.energy=10
    o=bpy.data.objects.new('Sun',d); bpy.context.collection.objects.link(o)
    o.rotation_euler=(math.radians(40),0,math.radians(-45))

    dark=toon('dark',(0.04,0.04,0.06),(0.55,0.55,0.58),mid=(0.22,0.22,0.26))
    bright=toon('bright',(0.25,0.25,0.28),(0.97,0.97,0.99))

    # Ground — thin dark strip context
    bpy.ops.mesh.primitive_plane_add(size=100,location=(0,30,-2))
    bpy.context.active_object.data.materials.append(
        toon('gnd',(0.03,0.03,0.04),(0.22,0.22,0.24)))

    # Camera: rot_x=38° = looking ~52° above horizon
    # Lens=20mm (very wide) — captures large dome of sky
    cd=bpy.data.cameras.new('C'); cd.lens=20
    cam=bpy.data.objects.new('C',cd); bpy.context.collection.objects.link(cam)
    cam.location=(0,-1,0.5)
    cam.rotation_euler=(math.radians(38),0,math.radians(-8))  # slight dutch
    sc.camera=cam

    # With cam at y=-1, rot_x=38°, lens=20mm (~94° FOV):
    # Center of view points toward y≈4, z≈2 at distance ~5
    # Clouds at y=3-8, z=0.5-5, r=4-7 = fill frame
    specs=[
        # x,   y,   z,   r,    dark,  sqz,   sqx
        (-7,   4,  0.8, 5.5, True,  0.65,  1.35),   # LEFT foreground belly — huge
        ( 6,   4,  0.6, 5.0, True,  0.67,  1.30),   # RIGHT foreground belly
        ( 0,   6,  1.8, 6.5, True,  0.72,  1.20),   # CENTER belly — dominant
        (-9,   7,  1.5, 4.0, True,  0.68,  1.25),   # far left belly
        ( 8,   7,  1.2, 3.8, True,  0.70,  1.22),   # far right belly
        (-4,   8,  4.0, 5.0, False, 0.80,  1.12),   # upper left bright tower
        ( 4,   8,  3.8, 4.8, False, 0.80,  1.12),   # upper right bright tower
        ( 0,  10,  5.5, 5.5, False, 0.85,  1.08),   # central pinnacle
    ]

    blobs=[]
    for x,y,z,r,d2,sqz,sqx in specs:
        b=cloud_blob((x,y,z),r,sqz=sqz,sqx=sqx)
        b.data.materials.append(dark if d2 else bright)
        blobs.append((b,x,y,z))

    st=freestyle_setup(thick=3.4,crease=108)

    for f in range(1,FRAMES+1):
        t=(f-1)/max(FRAMES-1,1)
        for b,x0,y0,z0 in blobs:
            b.location.x=x0-2.0*t
            b.keyframe_insert('location',frame=f)

    add_boil(st)
    return sc

sc=build()

sc.frame_set(8)
sc.render.image_settings.file_format='PNG'
sc.render.filepath=os.path.join(OUT,"cloud_lowangle_v4.png")
bpy.ops.render.render(write_still=True)
print("  wrote cloud_lowangle_v4.png")

folder=os.path.join(OUT,"cloud_lowangle_v4_frames")
os.makedirs(folder,exist_ok=True)
sc.frame_start=1; sc.frame_end=FRAMES
sc.render.filepath=os.path.join(folder,"frame_")
bpy.ops.render.render(animation=True)
print("  rendered clip")
print("CLOUD v4 DONE")
