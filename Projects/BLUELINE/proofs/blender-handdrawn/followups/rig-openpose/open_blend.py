"""
BLUELINE — save a .blend of the Figure Rig + mannequin for interactive viewing/posing.
Reuses pose_rig_mesh.py's build functions (without running its render main()), builds
the rig + skinned mannequin in a clean T-pose (clean Automatic-Weights bind), and saves
figure_rig.blend. Open it in the Blender GUI; select the Armature, enter Pose Mode, pose.

Run: blender -b --factory-startup -P open_blend.py
"""
import bpy, os

HERE = os.path.dirname(os.path.abspath(__file__))
MOD = os.path.join(HERE, "pose_rig_mesh.py")
BLEND = os.path.join(HERE, "figure_rig.blend")

# exec the module's definitions WITHOUT its trailing main() render call
src = open(MOD).read().rstrip()
if src.endswith("main()"):
    src = src[:-len("main()")]
g = {"__file__": MOD, "__name__": "pose_rig_mesh"}
exec(compile(src, MOD, "exec"), g)

bpy.ops.wm.read_factory_settings(use_empty=True)

ao = g["build_armature"]()           # rig (Rigify-named FK bones), T-pose
mat = g["toon_mat"]()
g["build_mannequin_mesh"](ao, mat)   # skin the mannequin to the rig (auto weights @ rest)
g["add_ground"](mat)
g["add_lights"]()
g["add_camera"]()

sc = bpy.context.scene
sc.render.engine = g["eevee"]()
try:
    sc.view_settings.view_transform = "Standard"
    sc.view_settings.look = "None"
except Exception:
    pass
g["set_world"](1.0)

# make the rig easy to grab in the viewport
ao.show_in_front = True
try: ao.data.display_type = "OCTAHEDRAL"
except Exception: pass
bpy.ops.object.select_all(action="DESELECT")
ao.select_set(True)
bpy.context.view_layer.objects.active = ao

bpy.ops.wm.save_as_mainfile(filepath=BLEND)
print("SAVED", BLEND)
