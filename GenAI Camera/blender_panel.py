"""
GenAI Camera — Blender N-panel (register in the running Blender via the MCP or:
  exec(open('.../GenAI Camera/blender_panel.py').read())   ).

Emits the camera's conditioning streams from the scene camera and fires the headless driver
(genai_camera.py) non-blocking. Depth uses an AUTO near/far range computed from the visible
subject's camera-space extent every render — the BLUELINE Track-IV lesson: bracket the subject
tightly so the depth pass carries volume/recession, not a flat silhouette (a wide range crushes
the gradient to an outline). See [[GenAI Camera]] and BLUELINE proofs/track-IV-bench/bench.py.
"""
import bpy, os, json, shutil, subprocess, datetime, mathutils
from bpy_extras.object_utils import world_to_camera_view
from bpy.props import StringProperty, FloatProperty, IntProperty, BoolProperty

PROOF  = "/Users/loudonstearns/Documents/The Palace/GenAI Camera"
DRIVER = os.path.join(PROOF, "genai_camera.py")
VENV   = "/Users/loudonstearns/Documents/The Palace/_tools/ComfyUI/venv/bin/python3"

# ---------------- depth auto-range (Track-IV lesson) ----------------
def cam_z_range(coll_name, margin=0.03, default=(3.6, 4.8)):
    """Tight near/far from the visible subject's camera-space depth, so the depth pass fills 0..1."""
    sc = bpy.context.scene; cam = sc.camera
    if not cam: return default
    dg = bpy.context.evaluated_depsgraph_get(); zs = []
    coll = bpy.data.collections.get(coll_name)
    objs = [o for o in coll.objects if o.type == 'MESH'] if coll else []
    for o in objs:
        ev = o.evaluated_get(dg); me = ev.to_mesh(); mw = ev.matrix_world
        n = len(me.vertices); step = max(1, n // 2000)
        for i in range(0, n, step):
            z = world_to_camera_view(sc, cam, mw @ me.vertices[i].co).z
            if z > 0: zs.append(z)
        ev.to_mesh_clear()
    if not zs: return default
    return min(zs) - margin, max(zs) + margin

def _depth_mat(near, far):
    m = bpy.data.materials.get("GENAI_DEPTH") or bpy.data.materials.new("GENAI_DEPTH")
    m.use_nodes = True; nt = m.node_tree
    for n in list(nt.nodes): nt.nodes.remove(n)
    cd = nt.nodes.new('ShaderNodeCameraData'); mr = nt.nodes.new('ShaderNodeMapRange')
    mr.inputs['From Min'].default_value = near; mr.inputs['From Max'].default_value = far
    mr.inputs['To Min'].default_value = 1.0;   mr.inputs['To Max'].default_value = 0.0; mr.clamp = True
    em = nt.nodes.new('ShaderNodeEmission'); out = nt.nodes.new('ShaderNodeOutputMaterial')
    z = cd.outputs.get('View Z Depth') or cd.outputs.get('View Distance')
    nt.links.new(z, mr.inputs['Value']); nt.links.new(mr.outputs['Result'], em.inputs['Color'])
    nt.links.new(em.outputs['Emission'], out.inputs['Surface'])
    return m

# ---------------- plates ----------------
def render_plates(res, only_coll, transparent, suffix):
    sc = bpy.context.scene; vl = bpy.context.view_layer
    try: sc.render.engine = 'BLENDER_EEVEE_NEXT'
    except Exception: sc.render.engine = 'BLENDER_EEVEE'
    sc.render.resolution_x, sc.render.resolution_y = res; sc.render.resolution_percentage = 100
    sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_mode = 'RGBA'
    sc.view_settings.view_transform = 'Standard'
    try: sc.use_nodes = False
    except Exception: pass
    saved = {}
    for cn in ("GenAI_Figure", "GenAI_Env"):
        c = bpy.data.collections.get(cn)
        if c: saved[cn] = c.hide_render; c.hide_render = (only_coll is not None and cn != only_coll)
    sfx = ("_" + suffix) if suffix else ""
    def _r(name):
        sc.render.filepath = os.path.join(PROOF, name); bpy.ops.render.render(write_still=True)
    sc.render.film_transparent = transparent; vl.material_override = None; _r("beauty" + sfx)
    sc.render.film_transparent = False
    near, far = cam_z_range(only_coll or "GenAI_Figure")   # auto depth range for THIS subject
    ow = sc.world; vl.material_override = _depth_mat(near, far); sc.world = None; _r("depth" + sfx)
    vl.material_override = None; sc.world = ow
    for cn, h in saved.items():
        c = bpy.data.collections.get(cn)
        if c: c.hide_render = h
    sc.render.film_transparent = False

# ---------------- pose plate (ORG bones -> COCO-18) ----------------
_BODY = {1:"ORG-neck_01", 2:"ORG-upperarm_r",3:"ORG-lowerarm_r",4:"ORG-hand_r",
         5:"ORG-upperarm_l",6:"ORG-lowerarm_l",7:"ORG-hand_l",
         8:"ORG-thigh_r",9:"ORG-calf_r",10:"ORG-foot_r",
         11:"ORG-thigh_l",12:"ORG-calf_l",13:"ORG-foot_l"}
def emit_keypoints(res, armname="FigureRig", out="keypoints.json"):
    sc = bpy.context.scene; cam = sc.camera; arm = bpy.data.objects.get(armname)
    if not (cam and arm): return False
    mw = arm.matrix_world; W, H = res; world = [None]*18
    for idx, bn in _BODY.items():
        pb = arm.pose.bones.get(bn)
        if pb: world[idx] = mw @ pb.head
    hb = arm.pose.bones.get("ORG-head")
    if hb:
        # place face points ON the face (proportional to the head bone), not at the crown.
        base = mw @ hb.head; top = mw @ hb.tail; hv = top - base; hl = hv.length or 0.18
        FWD = mathutils.Vector((0,-1,0)); RIGHT = mathutils.Vector((-1,0,0))
        world[0]  = base + hv*0.45 + FWD*hl*0.55                    # nose (~45% up the head, forward)
        world[14] = base + hv*0.58 + FWD*hl*0.42 + RIGHT*hl*0.22    # R eye
        world[15] = base + hv*0.58 + FWD*hl*0.42 - RIGHT*hl*0.22    # L eye
        world[16] = base + hv*0.52 + RIGHT*hl*0.5                   # R ear
        world[17] = base + hv*0.52 - RIGHT*hl*0.5                   # L ear
    kps = []
    for wp in world:
        if wp is None: kps.append([0,0,0]); continue
        co = world_to_camera_view(sc, cam, wp)
        vis = 1 if (co.z > 0 and 0 <= co.x <= 1 and 0 <= co.y <= 1) else 0
        kps.append([round(co.x*W,1), round((1-co.y)*H,1), vis])
    json.dump({"res":[W,H], "keypoints":kps}, open(os.path.join(PROOF, out),"w"))
    return True

# ---------------- minimal environment (for multi-cam) ----------------
def ensure_env():
    if bpy.data.collections.get("GenAI_Env"): return
    col = bpy.data.collections.new("GenAI_Env"); bpy.context.scene.collection.children.link(col)
    bpy.ops.mesh.primitive_plane_add(size=14, location=(0,0,0)); g = bpy.context.active_object; g.name = "Env_Ground"
    bpy.ops.mesh.primitive_cylinder_add(radius=0.34, depth=3.4, location=(-1.6,1.5,1.7)); p = bpy.context.active_object; p.name = "Env_Pillar"
    bpy.ops.mesh.primitive_cube_add(size=0.8, location=(1.7,1.7,0.4)); r = bpy.context.active_object; r.name = "Env_Block"
    for o in (g,p,r):
        for c in list(o.users_collection): c.objects.unlink(o)
        col.objects.link(o)

# ---------------- operators + panel ----------------
def _res(sc): return (512,768) if sc.genai_fast else (768,1024)

class GENAI_OT_render(bpy.types.Operator):
    bl_idname = "genai.render_frame"; bl_label = "Render GenAI Frame"
    bl_description = "Live: shoot the camera's streams to ComfyUI (non-blocking). Watch live.html; nothing is kept unless you Save."
    def execute(self, context):
        sc = context.scene
        if not sc.camera: self.report({'ERROR'}, "No active camera"); return {'CANCELLED'}
        render_plates(_res(sc), "GenAI_Figure", False, "")
        args = [VENV, DRIVER, "--mode","live", "--prompt", sc.genai_prompt,
                "--denoise", f"{sc.genai_denoise:.2f}", "--seed", str(sc.genai_seed)]
        if sc.genai_fast: args.append("--fast")
        if sc.genai_pose and emit_keypoints(_res(sc)): args.append("--pose")
        if sc.genai_note: args += ["--note", sc.genai_note]
        subprocess.Popen(args)
        self.report({'INFO'}, "Sent to ComfyUI — watch live.html"); return {'FINISHED'}

class GENAI_OT_save(bpy.types.Operator):
    bl_idname = "genai.save_frame"; bl_label = "Save Frame"
    bl_description = "Keep the latest gen-AI frame in saved/ (the live workflow keeps nothing otherwise)"
    def execute(self, context):
        latest = os.path.join(PROOF, "latest.png")
        if not os.path.exists(latest): self.report({'ERROR'}, "No frame yet"); return {'CANCELLED'}
        name = "genai_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S") + ".png"
        shutil.copyfile(latest, os.path.join(PROOF, "saved", name))
        self.report({'INFO'}, "Saved " + name); return {'FINISHED'}

class GENAI_OT_multi(bpy.types.Operator):
    bl_idname = "genai.render_multi"; bl_label = "Render Multi-Cam"
    bl_description = "Two locked cameras (matched optics): figure + environment, each its own prompt, composited"
    def execute(self, context):
        sc = context.scene
        if not sc.camera: self.report({'ERROR'}, "No active camera"); return {'CANCELLED'}
        ensure_env(); res = _res(sc)
        render_plates(res, "GenAI_Env", False, "env")           # base
        render_plates(res, "GenAI_Figure", True, "figure")      # transparent -> inpaint region
        emit_keypoints(res, "FigureRig", "keypoints_figure.json")
        op = os.path.join(PROOF, "openpose_figure.png")         # force redraw from fresh keypoints
        if os.path.exists(op): os.remove(op)
        # env = generated base (depth+canny); figure = inpainted in (pose), the shootout winner
        json.dump([{"name": "env", "prompt": sc.genai_env_prompt, "cn": ["depth", "canny"]},
                   {"name": "figure", "prompt": sc.genai_prompt, "pose": True, "dilate": 81}],
                  open(os.path.join(PROOF, "layers.json"), "w"))
        args = [VENV, DRIVER, "--mode","live", "--multi",
                "--denoise", f"{sc.genai_denoise:.2f}", "--seed", str(sc.genai_seed)]
        if sc.genai_fast: args.append("--fast")
        subprocess.Popen(args)
        self.report({'INFO'}, "Multi-cam (inpaint) sent — watch live.html"); return {'FINISHED'}

class GENAI_PT_panel(bpy.types.Panel):
    bl_label = "GenAI Camera"; bl_idname = "GENAI_PT_panel"
    bl_space_type = 'VIEW_3D'; bl_region_type = 'UI'; bl_category = "GenAI Cam"
    def draw(self, context):
        sc = context.scene; L = self.layout
        L.prop(sc, "genai_prompt", text="")
        r = L.row(align=True); r.prop(sc, "genai_denoise"); r.prop(sc, "genai_seed")
        r2 = L.row(align=True); r2.prop(sc, "genai_fast", toggle=True); r2.prop(sc, "genai_pose", toggle=True)
        L.prop(sc, "genai_note", text="note")
        row = L.row(align=True); row.scale_y = 1.3
        row.operator("genai.render_frame", icon='RENDER_STILL')
        row.operator("genai.save_frame", icon='FILE_TICK')
        c = L.column(align=True); c.label(text="Multi-camera (composite):")
        c.prop(sc, "genai_env_prompt", text="env")
        c.operator("genai.render_multi", icon='RENDERLAYERS')
        b = L.box(); b.scale_y = 0.65
        b.label(text="live:  127.0.0.1:8830/live.html")
        b.label(text="proofs: 127.0.0.1:8830  (scroll)")

_classes = (GENAI_OT_render, GENAI_OT_save, GENAI_OT_multi, GENAI_PT_panel)

def register():
    for c in _classes:
        try: bpy.utils.unregister_class(c)
        except Exception: pass
    S = bpy.types.Scene
    S.genai_prompt     = StringProperty(name="Prompt", default="a lone warrior standing ready, dramatic action manga, dynamic ink")
    S.genai_env_prompt = StringProperty(name="Env", default="ancient ruined stone temple, broken pillars, dramatic manga ink background")
    S.genai_denoise    = FloatProperty(name="Denoise", default=0.90, min=0.0, max=1.0)
    S.genai_seed       = IntProperty(name="Seed", default=7, min=0)
    S.genai_fast       = BoolProperty(name="Fast", default=False)
    S.genai_pose       = BoolProperty(name="Pose", default=True)
    S.genai_note       = StringProperty(name="Note", default="")
    for c in _classes: bpy.utils.register_class(c)

register()
