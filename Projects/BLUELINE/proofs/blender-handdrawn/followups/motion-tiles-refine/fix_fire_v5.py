"""
BLUELINE — FIRE TONGUES FIX v5
v4 better but displacement creates spiny artifacts; cones too thin/tall.

Fixes:
1. NO displacement modifier — it creates spurious Freestyle strokes
2. Add a Smooth modifier instead for organic shape
3. Wider flames: base_r 1.5-2.5, height 5-8 (shorter, fatter = flame-shaped)
4. More x overlap: cluster -2..+2 so they read as a fire MASS
5. Slight lean (rotation_euler.x=-5° = leaning toward camera) looks better
6. Camera same proven setup (0,-9,4) rot_x=80° lens=30
7. Mix of icosphere tips on top of cone bases for more organic top
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

def freestyle_setup(thick=2.6,crease=126):
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

def smooth_mod(o,iters=4,fac=0.6):
    sm=o.modifiers.new('smooth','SMOOTH')
    sm.iterations=iters; sm.factor=fac

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
    w.node_tree.nodes.get('Background').inputs['Color'].default_value=(0.92,0.92,0.88,1)

    d=bpy.data.lights.new('Sun','SUN'); d.energy=8
    o=bpy.data.objects.new('Sun',d); bpy.context.collection.objects.link(o)
    o.rotation_euler=(math.radians(55),0,math.radians(20))

    bpy.ops.mesh.primitive_plane_add(size=30,location=(0,0,0))
    bpy.context.active_object.data.materials.append(
        toon('gnd',(0.2,0.2,0.22),(0.9,0.9,0.9)))

    core_mat = emit('core',(1.0,1.0,1.0))
    mid_mat  = toon('mid', (0.50,0.50,0.50),(0.96,0.96,0.96),mid=(0.78,0.78,0.78))
    out_mat  = toon('out', (0.22,0.22,0.24),(0.86,0.86,0.87),mid=(0.58,0.58,0.60))

    # PROVEN camera
    cd=bpy.data.cameras.new('C'); cd.lens=30
    cam=bpy.data.objects.new('C',cd); bpy.context.collection.objects.link(cam)
    cam.location=(0,-9,4)
    cam.rotation_euler=(math.radians(80),0,math.radians(-5))
    sc.camera=cam

    # FATTER shorter flames: base_r=1.5-2.5, height=5-9
    # At this width/height ratio they read as flames not antenna spikes
    # x=-2.5..+2.5, overlapping cluster
    tongue_specs=[
        # x,   base_r, height,  mat,    phase, lean_z
        (-2.5,  1.60,   7.5, 'out',   0.0,  8),
        (-1.5,  1.80,   9.5, 'mid',   0.7, -5),
        (-0.6,  2.10,   9.0, 'core',  1.4,  3),
        ( 0.0,  2.40,  10.5, 'core',  2.0,  0),   # tallest center
        ( 0.6,  2.05,   9.0, 'mid',   2.8, -3),
        ( 1.5,  1.82,   9.5, 'mid',   1.1,  5),
        ( 2.5,  1.55,   7.5, 'out',   3.2, -8),
        (-2.0,  1.20,   6.0, 'out',   3.8, 12),
        ( 2.0,  1.18,   5.8, 'out',   0.5,-12),
        (-0.8,  1.50,   7.5, 'mid',   2.5,  6),
        ( 0.8,  1.45,   8.0, 'mid',   3.5, -6),
    ]
    mat_map={'core':core_mat,'mid':mid_mat,'out':out_mat}

    flame_objs=[]
    for x,br,h,mat_key,phase,lean in tongue_specs:
        bpy.ops.mesh.primitive_cone_add(
            vertices=16,            # smoother cone
            radius1=br, radius2=0.06, depth=h,
            location=(x,4.0,h/2))
        c=bpy.context.active_object; bpy.ops.object.shade_smooth()
        smooth_mod(c,iters=3,fac=0.5)  # smooth instead of displace
        # Lean: rotate around Y so tip leans left/right (lean in degrees)
        c.rotation_euler.z=math.radians(lean)
        # Slight forward lean
        c.rotation_euler.x=math.radians(random.uniform(-3,2))
        c.data.materials.append(mat_map[mat_key])
        flame_objs.append((c,x,h/2,phase))

    st=freestyle_setup(thick=2.6,crease=126)

    for f in range(1,FRAMES+1):
        t=(f-1)/max(FRAMES-1,1)
        angle=t*2*math.pi
        for obj,x0,z0,phase in flame_objs:
            sway=math.sin(angle*2.5+phase)*0.25
            obj.location.x=x0+sway
            flutter=1.0+math.sin(angle*3.0+phase*1.3)*0.14
            obj.scale.z=flutter
            obj.scale.x=1.0+math.sin(angle*2.0+phase)*0.09
            obj.scale.y=obj.scale.x
            obj.keyframe_insert('location',frame=f)
            obj.keyframe_insert('scale',frame=f)

    add_boil(st)
    return sc

sc=build()

sc.frame_set(6)
sc.render.image_settings.file_format='PNG'
sc.render.filepath=os.path.join(OUT,"fire_tongues_v5.png")
bpy.ops.render.render(write_still=True)
print("  wrote fire_tongues_v5.png")

folder=os.path.join(OUT,"fire_tongues_v5_frames")
os.makedirs(folder,exist_ok=True)
sc.frame_start=1; sc.frame_end=FRAMES
sc.render.filepath=os.path.join(folder,"frame_")
bpy.ops.render.render(animation=True)
print("  rendered clip")
print("FIRE v5 DONE")
