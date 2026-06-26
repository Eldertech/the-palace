"""
BLUELINE — Unified Rig + OpenPose, Blender half.
Builds the FK rig (Rigify-named bones), poses it, renders the ink + depth plates,
and PROJECTS the 18 canonical OpenPose keypoints to 2D normalized screen coords
(via world_to_camera_view) — written to keypoints.json. The OpenPose IMAGE is then
drawn by draw_openpose.py using the real controlnet_aux draw_bodypose (pixel-exact).

Run: blender -b --factory-startup -P pose_rig.py -- --pose A
     blender -b --factory-startup -P pose_rig.py -- --pose-json '{"thigh.L":[-40,0,0], ...}'
Outputs (renders/pose_<X>/): ink_plate.png, depth_plate.png, keypoints.json
"""
import bpy, math, os, sys, json, argparse, mathutils
from bpy_extras.object_utils import world_to_camera_view

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_BASE = os.path.join(SCRIPT_DIR, "renders")
RES = (832, 1040)

# ---- rig (Rigify human-metarig proportions; world-space rest, T-pose) ----------
BONES_DEF = [
    ("root", (0,0.0552,0.9), (0,0.0552,1.0099), None),
    ("spine", (0,0.0552,1.0099), (0,0.0172,1.1573), "root"),
    ("spine.001", (0,0.0172,1.1573), (0,0.0004,1.2929), "spine"),
    ("spine.002", (0,0.0004,1.2929), (0,0.0059,1.4657), "spine.001"),
    ("spine.003", (0,0.0059,1.4657), (0,0.0114,1.6582), "spine.002"),
    ("spine.004", (0,0.0114,1.6582), (0,-0.013,1.7197), "spine.003"),
    ("spine.005", (0,-0.013,1.7197), (0,-0.0247,1.7813), "spine.004"),
    ("spine.006", (0,-0.0247,1.7813), (0,-0.0247,1.9796), "spine.005"),
    ("shoulder.L", (0.0183,-0.0684,1.6051), (0.1694,0.0205,1.605), "spine.003"),
    ("shoulder.R", (-0.0183,-0.0684,1.6051), (-0.1694,0.0205,1.605), "spine.003"),
    ("upper_arm.L", (0.1953,0.0267,1.5846), (0.4424,0.0885,1.4491), "shoulder.L"),
    ("upper_arm.R", (-0.1953,0.0267,1.5846), (-0.4424,0.0885,1.4491), "shoulder.R"),
    ("forearm.L", (0.4424,0.0885,1.4491), (0.6594,0.0492,1.3061), "upper_arm.L"),
    ("forearm.R", (-0.4424,0.0885,1.4491), (-0.6594,0.0492,1.3061), "upper_arm.R"),
    ("hand.L", (0.6594,0.0492,1.3061), (0.76,0.0412,1.24), "forearm.L"),
    ("hand.R", (-0.6594,0.0492,1.3061), (-0.76,0.0412,1.24), "forearm.R"),
    ("pelvis.L", (0,0.0552,1.0099), (0.098,0.0124,1.072), "root"),
    ("pelvis.R", (0,0.0552,1.0099), (-0.098,0.0124,1.072), "root"),
    ("thigh.L", (0.098,0.0124,1.072), (0.098,-0.0286,0.5372), "pelvis.L"),
    ("thigh.R", (-0.098,0.0124,1.072), (-0.098,-0.0286,0.5372), "pelvis.R"),
    ("shin.L", (0.098,-0.0286,0.5372), (0.098,0.0162,0.0852), "thigh.L"),
    ("shin.R", (-0.098,-0.0286,0.5372), (-0.098,0.0162,0.0852), "thigh.R"),
    ("foot.L", (0.098,0.0162,0.0852), (0.098,-0.0934,0.0167), "shin.L"),
    ("foot.R", (-0.098,0.0162,0.0852), (-0.098,-0.0934,0.0167), "shin.R"),
    ("toe.L", (0.098,-0.0934,0.0167), (0.098,-0.1606,0.0167), "foot.L"),
    ("toe.R", (-0.098,-0.0934,0.0167), (-0.098,-0.1606,0.0167), "foot.R"),
]
POSE_A = {"spine":(-12,0,2),"spine.001":(-10,0,0),"spine.002":(-8,0,0),"spine.003":(-5,0,0),
    "spine.006":(15,0,0),"shoulder.L":(5,0,-10),"upper_arm.L":(-20,5,-50),"forearm.L":(-40,-5,-20),
    "shoulder.R":(5,0,10),"upper_arm.R":(15,-8,55),"forearm.R":(-5,12,15),
    "thigh.L":(-45,5,-8),"shin.L":(80,2,-5),"foot.L":(-15,0,0),
    "thigh.R":(-38,-4,10),"shin.R":(70,-3,6),"foot.R":(-12,0,0)}
POSE_B = {"spine.002":(0,0,4),"spine.003":(0,0,4),"spine.006":(5,0,0),
    "upper_arm.L":(25,0,10),"forearm.L":(-20,0,0),"upper_arm.R":(-30,0,-8),"forearm.R":(15,0,0),
    "thigh.L":(-35,0,0),"shin.L":(10,0,0),"foot.L":(-10,0,0),
    "thigh.R":(25,0,0),"shin.R":(-10,0,0),"foot.R":(20,0,0)}
POSE_C = {"spine":(5,0,0),"spine.006":(-12,0,0),"shoulder.L":(0,0,-12),"upper_arm.L":(-150,0,-20),
    "forearm.L":(20,0,0),"shoulder.R":(0,0,12),"upper_arm.R":(-150,0,20),"forearm.R":(20,0,0),
    "thigh.L":(0,0,5),"thigh.R":(0,0,-5),"foot.L":(-8,0,0),"foot.R":(-8,0,0)}
ALL_POSES = {"A": POSE_A, "B": POSE_B, "C": POSE_C}

# camera: one dramatic low 3/4 hero angle (works for all poses)
CAM_LOC = (1.9, -3.6, 0.95)
CAM_ROT = (math.radians(80), 0, math.radians(26))
CAM_LENS = 38

def parse_args():
    argv = sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--pose", default="A")
    p.add_argument("--pose-json", default=None, help="JSON dict bone->[rx,ry,rz]; overrides --pose")
    p.add_argument("--label", default=None)
    return p.parse_args(argv)

def eevee():
    items = [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items]
    for c in ('BLENDER_EEVEE_NEXT','BLENDER_EEVEE'):
        if c in items: return c
    return items[0]

def set_world(v):
    w = bpy.data.worlds.new('W'); bpy.context.scene.world = w; w.use_nodes = True
    bg = w.node_tree.nodes.get('Background')
    bg.inputs['Color'].default_value=(v,v,v,1); bg.inputs['Strength'].default_value=1

def toon_mat():
    m = bpy.data.materials.new("toon"); m.use_nodes=True; nt=m.node_tree; nt.nodes.clear()
    d=nt.nodes.new('ShaderNodeBsdfDiffuse'); d.inputs['Color'].default_value=(0.9,0.9,0.9,1)
    s=nt.nodes.new('ShaderNodeShaderToRGB'); r=nt.nodes.new('ShaderNodeValToRGB')
    r.color_ramp.interpolation='CONSTANT'; e=r.color_ramp.elements
    e[0].position=0; e[0].color=(0.05,0.05,0.06,1); e[1].position=0.42; e[1].color=(0.96,0.96,0.96,1)
    em=nt.nodes.new('ShaderNodeEmission'); o=nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(d.outputs['BSDF'],s.inputs['Shader']); nt.links.new(s.outputs['Color'],r.inputs['Fac'])
    nt.links.new(r.outputs['Color'],em.inputs['Color']); nt.links.new(em.outputs['Emission'],o.inputs['Surface'])
    return m

def depth_mat():
    m=bpy.data.materials.new("depth"); m.use_nodes=True; nt=m.node_tree; nt.nodes.clear()
    cd=nt.nodes.new('ShaderNodeCameraData'); mr=nt.nodes.new('ShaderNodeMapRange')
    mr.inputs['From Min'].default_value=2.0; mr.inputs['From Max'].default_value=5.5
    mr.inputs['To Min'].default_value=1.0; mr.inputs['To Max'].default_value=0.0; mr.clamp=True
    em=nt.nodes.new('ShaderNodeEmission'); o=nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(cd.outputs['View Z Depth'],mr.inputs['Value']); nt.links.new(mr.outputs['Result'],em.inputs['Color'])
    nt.links.new(em.outputs['Emission'],o.inputs['Surface']); return m

BONE_RADIUS={"spine":0.10,"spine.001":0.10,"spine.002":0.095,"spine.003":0.09,"spine.004":0.075,
    "spine.005":0.06,"spine.006":0.055,"upper_arm.L":0.06,"upper_arm.R":0.06,"forearm.L":0.048,
    "forearm.R":0.048,"hand.L":0.042,"hand.R":0.042,"thigh.L":0.078,"thigh.R":0.078,"shin.L":0.058,
    "shin.R":0.058,"foot.L":0.042,"foot.R":0.042,"toe.L":0.025,"toe.R":0.025}
SKIP={"root","pelvis.L","pelvis.R","shoulder.L","shoulder.R"}

def build_armature():
    ad=bpy.data.armatures.new("Skel"); ao=bpy.data.objects.new("Armature",ad)
    bpy.context.collection.objects.link(ao); bpy.context.view_layer.objects.active=ao; ao.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT'); ebs=ad.edit_bones; bm={}
    for n,h,t,par in BONES_DEF:
        eb=ebs.new(n); eb.head=h; eb.tail=t; eb.roll=0; eb.use_connect=False; bm[n]=eb
    for n,h,t,par in BONES_DEF:
        if par and par in bm: bm[n].parent=bm[par]
    bpy.ops.object.mode_set(mode='POSE')
    for pb in ao.pose.bones: pb.rotation_mode='XYZ'
    bpy.ops.object.mode_set(mode='OBJECT'); return ao

def apply_pose(ao, pd):
    bpy.context.view_layer.objects.active=ao; bpy.ops.object.mode_set(mode='POSE')
    for bn,r in pd.items():
        if bn in ao.pose.bones:
            ao.pose.bones[bn].rotation_mode='XYZ'
            ao.pose.bones[bn].rotation_euler=tuple(math.radians(x) for x in r)
    bpy.ops.object.mode_set(mode='OBJECT'); bpy.context.view_layer.update()

def build_skin(ao, mat):
    bpy.context.view_layer.update(); dg=bpy.context.evaluated_depsgraph_get(); ae=ao.evaluated_get(dg)
    for b in ae.pose.bones:
        if b.name in SKIP: continue
        rad=BONE_RADIUS.get(b.name,0.05)
        hw=ae.matrix_world@b.head; tw=ae.matrix_world@b.tail; dv=tw-hw; L=dv.length
        if L<0.005: continue
        q=mathutils.Vector((0,0,1)).rotation_difference(dv.normalized())
        bpy.ops.mesh.primitive_cylinder_add(radius=rad,depth=L,location=(hw+tw)/2)
        p=bpy.context.active_object; p.rotation_euler=q.to_euler(); bpy.ops.object.shade_smooth()
        p.data.materials.clear(); p.data.materials.append(mat)
        # smooth joints: a sphere at each bone head
        bpy.ops.mesh.primitive_uv_sphere_add(radius=rad*1.02, location=hw)
        s=bpy.context.active_object; bpy.ops.object.shade_smooth(); s.data.materials.append(mat)
    hb=ae.pose.bones.get("spine.006")
    if hb:
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.115, location=ae.matrix_world@hb.tail)
        h=bpy.context.active_object; bpy.ops.object.shade_smooth(); h.data.materials.append(mat)

def add_lights():
    for nm,e,rot in (("Key",5.5,(48,15,-40)),("Rim",1.8,(52,-12,140))):
        d=bpy.data.lights.new(nm,'SUN'); d.energy=e; o=bpy.data.objects.new(nm,d)
        bpy.context.collection.objects.link(o); o.rotation_euler=tuple(math.radians(a) for a in rot)

def add_camera():
    cd=bpy.data.cameras.new('Cam'); cd.lens=CAM_LENS; c=bpy.data.objects.new('Cam',cd)
    bpy.context.collection.objects.link(c); c.location=CAM_LOC; c.rotation_euler=CAM_ROT
    bpy.context.scene.camera=c; return c

def add_ground(mat):
    bpy.ops.mesh.primitive_plane_add(size=20,location=(0,0,-0.01))
    g=bpy.context.active_object; g.data.materials.clear(); g.data.materials.append(mat)

def configure_freestyle():
    sc=bpy.context.scene; sc.render.use_freestyle=True; sc.render.line_thickness_mode='ABSOLUTE'
    vl=sc.view_layers[0]; vl.use_freestyle=True; fs=vl.freestyle_settings
    if len(fs.linesets)==0: fs.linesets.new('LS')
    ls=fs.linesets[0]; ls.linestyle=bpy.data.linestyles.new('Ink')
    for a,v in (('select_silhouette',True),('select_border',True),('select_crease',True),('select_external_contour',True)):
        try: setattr(ls,a,v)
        except: pass
    try: fs.crease_angle=math.radians(134)
    except: pass
    st=ls.linestyle; st.color=(0,0,0); st.thickness=2.8; st.use_chaining=True
    try: st.chaining='PLAIN'
    except: pass
    g=st.geometry_modifiers
    try: g.new(name='samp',type='SAMPLING'); g[-1].sampling=3.0
    except: pass
    try: g.new(name='bz',type='BEZIER_CURVE'); g[-1].error=2.5
    except: pass
    t=st.thickness_modifiers
    try: t.new(name='c',type='CALLIGRAPHY'); cm=t[-1]; cm.orientation=math.radians(38); cm.thickness_min=0.8; cm.thickness_max=7.0
    except: pass

def render_to(path, freestyle, worldval):
    sc=bpy.context.scene; sc.render.engine=eevee()
    try: sc.view_settings.view_transform='Standard'; sc.view_settings.look='None'
    except: pass
    sc.render.use_freestyle=freestyle; set_world(worldval)
    sc.render.resolution_x,sc.render.resolution_y=RES; sc.render.image_settings.file_format='PNG'
    try: sc.eevee.taa_render_samples=24
    except: pass
    sc.render.filepath=path; bpy.ops.render.render(write_still=True); print("  wrote",path)

# ---- 18 canonical OpenPose keypoints from the rig ------------------------------
def openpose_keypoints(ao, cam):
    bpy.context.view_layer.update(); dg=bpy.context.evaluated_depsgraph_get(); ae=ao.evaluated_get(dg)
    mw=ae.matrix_world
    def H(bn): return mw@ae.pose.bones[bn].head
    def T(bn): return mw@ae.pose.bones[bn].tail
    neck=H("spine.006"); head_top=T("spine.006")
    head_c=neck+(head_top-neck)*0.6
    facing=mathutils.Vector((0,-1,0)); up=mathutils.Vector((0,0,1)); right=mathutils.Vector((-1,0,0))  # subject's right
    rr=0.11
    world=[
        head_c+facing*rr,                                  # 0 nose
        neck,                                              # 1 neck
        H("upper_arm.R"), H("forearm.R"), T("hand.R"),     # 2 Rsho 3 Relb 4 Rwri
        H("upper_arm.L"), H("forearm.L"), T("hand.L"),     # 5 Lsho 6 Lelb 7 Lwri
        H("thigh.R"), H("shin.R"), H("foot.R"),            # 8 Rhip 9 Rkne 10 Rank
        H("thigh.L"), H("shin.L"), H("foot.L"),            # 11 Lhip 12 Lkne 13 Lank
        head_c+facing*rr*0.85+right*0.045+up*0.04,         # 14 Reye
        head_c+facing*rr*0.85-right*0.045+up*0.04,         # 15 Leye
        head_c+right*0.075+up*0.0,                         # 16 Rear
        head_c-right*0.075+up*0.0,                         # 17 Lear
    ]
    sc=bpy.context.scene; out=[]
    for wp in world:
        co=world_to_camera_view(sc, cam, mathutils.Vector(wp))  # x,y in [0,1] (y from bottom), z=depth
        vis = 1 if (co.z>0) else 0
        out.append([round(co.x,5), round(1.0-co.y,5), vis])     # flip y to image-top origin
    return out

def main():
    a=parse_args()
    if a.pose_json:
        pd={k:tuple(v) for k,v in json.loads(a.pose_json).items()}; label=a.label or "JSON"
    else:
        label=a.pose.upper(); pd=ALL_POSES.get(label, POSE_A)
    out=os.path.join(OUT_BASE, f"pose_{label}"); os.makedirs(out, exist_ok=True)
    print(f"=== POSE {label} -> {out} ===")

    # one scene; render ink, then depth, then export keypoints (same camera)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    ao=build_armature(); apply_pose(ao, pd); ao.display_type='WIRE'
    mt=toon_mat(); build_skin(ao, mt); add_ground(mt); add_lights(); cam=add_camera()
    configure_freestyle()
    render_to(os.path.join(out,"ink_plate.png"), True, 1.0)

    # depth: swap materials to depth_mat, freestyle off, black world
    md=depth_mat()
    for o in bpy.data.objects:
        if o.type=='MESH':
            o.data.materials.clear(); o.data.materials.append(md)
    render_to(os.path.join(out,"depth_plate.png"), False, 0.0)

    kpts=openpose_keypoints(ao, cam)
    json.dump({"res":RES,"keypoints":kpts}, open(os.path.join(out,"keypoints.json"),"w"), indent=1)
    print("  wrote keypoints.json:", sum(k[2] for k in kpts), "visible /18")
    print(f"=== POSE {label} DONE ===")

main()
