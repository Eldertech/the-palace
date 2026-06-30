"""
Save a PROPERLY DEFORM-RIGGED .blend of the MPFB2 human body for interactive posing.
Binds the single MPFB mesh to the rig at REST (so re-posing in the GUI deforms cleanly),
verifies by applying a test pose + rendering, then resets to rest and saves.

Run: blender -b --factory-startup -P open_blend_mpfb.py
Outputs: figure_rig_mpfb.blend (rest pose, poseable) + _blend_posetest.png (deform check)
"""
import bpy, os, math

HERE  = os.path.dirname(os.path.abspath(__file__))
MOD   = os.path.join(HERE, "pose_rig_mpfb_v2.py")
BLEND = os.path.join(HERE, "figure_rig_mpfb.blend")
BASE  = "/Users/loudonstearns/Documents/The Palace/Projects/BLUELINE/_tools/mpfb2-base/base.obj"

src = open(MOD).read().rstrip()
if src.endswith("main()"):
    src = src[:-len("main()")]
g = {"__file__": MOD, "__name__": "pose_rig_mpfb_v2"}
exec(compile(src, MOD, "exec"), g)

bpy.ops.wm.read_factory_settings(use_empty=True)

base = g["find_base_obj"](BASE)
ao   = g["build_armature"]()                 # REST pose (no apply_pose first)
mt   = g["toon_mat"]()
body = g["load_mpfb_body"](base, ao, mt)     # bind the single mesh at REST -> clean deform

g["add_ground"](mt)
g["add_lights"]()
cam = g["add_camera"]()
sc = bpy.context.scene
sc.render.engine = g["eevee"]()
try:
    sc.view_settings.view_transform = "Standard"; sc.view_settings.look = "None"
except Exception:
    pass
g["set_world"](1.0)

# --- VERIFY: apply a test pose and render; the single mesh should deform & hold together
g["apply_pose"](ao, {
    "upper_arm.L": [10, 0, -55], "forearm.L": [-30, 0, 0],
    "thigh.R": [-45, 0, 8], "shin.R": [60, 0, 0],
    "thigh.L": [18, 0, -6], "spine.003": [0, 0, 8], "spine.006": [8, 0, 0],
})
g["configure_freestyle"]()
g["render_to"](os.path.join(HERE, "_blend_posetest.png"), True, 1.0)

# --- reset to REST and save the poseable file
for pb in ao.pose.bones:
    pb.rotation_euler = (0.0, 0.0, 0.0)
    pb.location = (0.0, 0.0, 0.0)
bpy.context.view_layer.update()

ao.show_in_front = True
try: ao.data.display_type = "OCTAHEDRAL"
except Exception: pass
bpy.ops.object.select_all(action="DESELECT")
ao.select_set(True)
bpy.context.view_layer.objects.active = ao

bpy.ops.wm.save_as_mainfile(filepath=BLEND)
print("SAVED", BLEND)
