"""
BLUELINE — FIRE TONGUES FINAL
v3 showed good flame columns but clipped at top, empty lower half.
The camera is seeing the flame TOPS only.

Analysis: with cam at y=-6, z=1, rot_x=78° (12° up), 24mm:
  The center of view is at z = 1 + 9*tan(12°) = 1+1.9 = ~3
  For cone at y=3, height=10, center at z=5 — that IS in frame.
  But why clipped? The camera-to-flame dist is 9 units, FOV=84°
  tan(42°)=0.9, so half-height at dist 9 = 8.1 units
  Frame spans z = 3 ± 8.1 = -5.1 to 11.1 — should fit 10-tall cones!

  The clipping must be near-clip or something else.
  Actually looking again at v3 image: flames ARE in top part with taper visible.
  Ground horizon is in the middle. Bottom half is ground.
  Solution: RAISE camera to z=3, look slightly more up (rot_x=74° = 16° above),
  and place flame cluster at y=5 (slightly further). This shifts the ground
  line lower in frame and brings flame column center-frame.
"""
import bpy, math, os, random

OUT="/Users/loudonstearns/Documents/The Palace/Projects/BLUELINE/proofs/blender-handdrawn/followups/motion-tiles-refine"
os.makedirs(OUT,exist_ok=True)
FRAMES=24; RES=(560,560)
random.seed(42)

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

def emit(name,c=(1,1,1)):
    m=bpy.data.materials.new(name); m.use_nodes=True
    nt=m.node_tree; nt.nodes.clear()
    em=nt.nodes.new('ShaderNodeEmission'); em.inputs['Color'].default_value=(*c,1)
    out=nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(em.outputs['Emission'],out.inputs['Surface']); return m

def freestyle_setup(thick=2.8,crease=120):
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
    try:
        g.new(name='pn',type='PERLIN_NOISE_1D'); m=g[-1]
        m.amplitude=2.0; m.frequency=8; m.octaves=2; m.seed=1
    except Exception: pass
    t=st.thickness_modifiers; t.new(name='c',type='CALLIGRAPHY'); cm=t[-1]
    cm.orientation=math.radians(90); cm.thickness_min=0.8; cm.thickness_max=6.0
    return st

def add_boil(linestyle):
    def boil(scene):
        f=scene.frame_current
        for gm in linestyle.geometry_modifiers:
            if gm.type=='PERLIN_NOISE_1D': gm.seed=(f//2)+1
    bpy.app.handlers.frame_change_pre.append(boil)

def disp(o,scale,strength):
    d=o.modifiers.new('d','DISPLACE')
    tex=bpy.data.textures.new('t','CLOUDS'); tex.noise_scale=scale
    d.texture=tex; d.strength=strength

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

    w=bpy.data.worlds.new('W'); sc.world=w; w.use_nodes=True
    w.node_tree.nodes.get('Background').inputs['Color'].default_value=(0.93,0.93,0.90,1)

    d=bpy.data.lights.new('Sun','SUN'); d.energy=8
    o=bpy.data.objects.new('Sun',d); bpy.context.collection.objects.link(o)
    o.rotation_euler=(math.radians(40),0,math.radians(45))

    # Ground — just a strip
    bpy.ops.mesh.primitive_plane_add(size=24,location=(0,4,0))
    bpy.context.active_object.data.materials.append(
        toon('gnd',(0.15,0.15,0.15),(0.72,0.72,0.72)))

    core_mat = emit('core',(1.0,1.0,1.0))
    mid_mat  = toon('mid', (0.52,0.52,0.52),(0.96,0.96,0.96),mid=(0.80,0.80,0.80))
    out_mat  = toon('out', (0.20,0.20,0.22),(0.88,0.88,0.88),mid=(0.60,0.60,0.62))

    # Camera: raised to z=3, rot_x=72° (18° above horizon)
    # Distance to flames at y=5: dist=5-(-6)=11 units
    # Center of view z = 3 + 11*tan(18°) = 3+3.6 = 6.6
    # Half FOV (84°/2=42°): top = 6.6+11*tan(42°)=6.6+9.9=16.5, bottom=6.6-9.9=-3.3
    # Flames z=0..10 → appear from lower-middle to near-top ✓
    cd=bpy.data.cameras.new('C'); cd.lens=28
    cam=bpy.data.objects.new('C',cd); bpy.context.collection.objects.link(cam)
    cam.location=(0,-6,2.5)
    cam.rotation_euler=(math.radians(72),0,math.radians(-5))
    sc.camera=cam

    tongue_specs=[
        # x,   base_r, height, mat,    phase
        (-3.0,  0.95,   7.5, 'out',   0.0),
        (-1.8,  0.88,   9.5, 'mid',   0.7),
        (-0.8,  1.02,   9.0, 'core',  1.4),
        ( 0.0,  1.12,  10.2, 'core',  2.0),   # tallest center
        ( 0.8,  1.00,   9.0, 'mid',   2.8),
        ( 1.8,  0.90,   9.5, 'mid',   1.1),
        ( 3.0,  0.85,   7.8, 'out',   3.2),
        (-2.4,  0.62,   6.0, 'out',   3.8),
        ( 2.4,  0.60,   5.8, 'out',   0.5),
        (-0.4,  0.72,   7.5, 'mid',   2.5),
        ( 0.5,  0.68,   8.0, 'mid',   3.5),
    ]
    mat_map={'core':core_mat,'mid':mid_mat,'out':out_mat}

    flame_objs=[]
    for x,br,h,mat_key,phase in tongue_specs:
        bpy.ops.mesh.primitive_cone_add(
            radius1=br, radius2=0.04, depth=h,
            location=(x,5.0,h/2))  # placed at y=5
        c=bpy.context.active_object; bpy.ops.object.shade_smooth()
        disp(c, 0.5, br*0.30)
        c.rotation_euler.x=math.radians(random.uniform(-4,3))
        c.rotation_euler.z=math.radians(random.uniform(-8,8))
        c.data.materials.append(mat_map[mat_key])
        flame_objs.append((c,x,h/2,phase))

    st=freestyle_setup(thick=2.8,crease=120)

    for f in range(1,FRAMES+1):
        t=(f-1)/max(FRAMES-1,1)
        angle=t*2*math.pi
        for obj,x0,z0,phase in flame_objs:
            sway=math.sin(angle*2.5+phase)*0.22
            obj.location.x=x0+sway
            flutter=1.0+math.sin(angle*3.0+phase*1.3)*0.16
            obj.scale.z=flutter
            obj.scale.x=1.0+math.sin(angle*2.0+phase)*0.08
            obj.scale.y=obj.scale.x
            obj.keyframe_insert('location',frame=f)
            obj.keyframe_insert('scale',frame=f)

    add_boil(st)
    return sc

sc=build()

sc.frame_set(6)
sc.render.image_settings.file_format='PNG'
sc.render.filepath=os.path.join(OUT,"fire_tongues_FINAL.png")
bpy.ops.render.render(write_still=True)
print("  wrote fire_tongues_FINAL.png")

folder=os.path.join(OUT,"fire_tongues_final_frames")
os.makedirs(folder,exist_ok=True)
sc.frame_start=1; sc.frame_end=FRAMES
sc.render.filepath=os.path.join(folder,"frame_")
bpy.ops.render.render(animation=True)
print("  rendered clip")
print("FIRE FINAL DONE")
