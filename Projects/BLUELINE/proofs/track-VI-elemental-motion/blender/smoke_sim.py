#!/usr/bin/env python3
"""
BLUELINE · Track VI — headless Mantaflow SMOKE (or FIRE) -> grayscale-on-white sequence,
a stylizable ink substrate. Built on bpy.ops.object.quick_smoke (version-robust), then
tuned to dark medium against a white world and rendered with Cycles.

  blender --background --python smoke_sim.py -- --res 48 --frames 60 --rres 640 \
          --samples 24 --mode smoke --out <abs renders dir>

--mode smoke|fire|both. Output: <out>/frames/<mode>_####.png (L) + <out>/<mode>_strip.png
"""
import bpy, sys, os, math, argparse
from mathutils import Vector


def args():
    a = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--res", type=int, default=48)        # domain resolution_max
    p.add_argument("--frames", type=int, default=60)
    p.add_argument("--rres", type=int, default=640)      # render pixels (square)
    p.add_argument("--samples", type=int, default=24)
    p.add_argument("--mode", default="smoke", choices=["smoke", "fire", "both"])
    p.add_argument("--noise", action="store_true")       # high-res noise (slow, detailed)
    p.add_argument("--puff", type=int, default=0,         # stop inflow after N frames -> rising plume
                   help="0 = continuous inflow; N = a discrete puff that rises and clears")
    p.add_argument("--out", required=True)
    return p.parse_args(a)


def reset():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for c in (bpy.data.meshes, bpy.data.materials):
        for d in list(c):
            c.remove(d)


def look_at(cam, target):
    d = (cam.location - Vector(target))
    cam.rotation_euler = d.to_track_quat("Z", "Y").to_euler()


def main():
    a = args()
    os.makedirs(os.path.join(a.out, "frames"), exist_ok=True)
    cache = os.path.join(a.out, "cache"); os.makedirs(cache, exist_ok=True)
    reset()

    # emitter -> quick smoke builds domain + flow + Principled Volume material
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3, radius=0.7, location=(0, 0, 0.8))
    flow = bpy.context.active_object; flow.name = "Emitter"
    bpy.ops.object.modifier_add(type="COLLISION") if False else None
    bpy.ops.object.select_all(action="DESELECT")
    flow.select_set(True); bpy.context.view_layer.objects.active = flow
    bpy.ops.object.quick_smoke()

    # locate domain + flow modifiers
    domain = None
    for o in bpy.context.scene.objects:
        m = o.modifiers.get("Fluid")
        if m and m.fluid_type == "DOMAIN":
            domain = o; break
    ds = domain.modifiers["Fluid"].domain_settings
    fs = flow.modifiers["Fluid"].flow_settings

    flow.hide_render = True   # the emitter mesh must not show — only the volume it seeds
    # flow: continuous inflow; pick smoke / fire / both
    fs.flow_behavior = "INFLOW"
    fs.use_inflow = True
    fs.flow_type = {"smoke": "SMOKE", "fire": "FIRE", "both": "BOTH"}[a.mode]
    if hasattr(fs, "temperature"):
        fs.temperature = 1.5
    fs.density = 1.0
    if hasattr(fs, "use_initial_velocity"):   # launch the medium upward so it visibly rises
        fs.use_initial_velocity = True
        fs.velocity_coord = (0.0, 0.0, 2.0)
    if a.puff > 0:                       # discrete puff via a frame handler (Blender-5 safe, no fcurves)
        _n = a.puff
        def _puff(scene, depsgraph=None, _fs=fs, _n=_n):
            _fs.density = 1.0 if scene.frame_current <= _n else 0.0
        bpy.app.handlers.frame_change_pre.append(_puff)

    # domain: resolution, cache, buoyancy gives the rise
    ds.resolution_max = a.res
    ds.use_noise = a.noise
    ds.cache_directory = cache
    ds.cache_frame_start = 1
    ds.cache_frame_end = a.frames
    if hasattr(ds, "alpha"):   # buoyancy: low density-weight so smoke doesn't sink
        ds.alpha = 0.1
    if hasattr(ds, "beta"):    # heat buoyancy: high so it climbs
        ds.beta = 2.0
    if hasattr(ds, "vorticity"):
        ds.vorticity = 0.3     # curl/turbulence for organic wisps
    ds.use_adaptive_domain = True

    sc = bpy.context.scene
    sc.frame_start, sc.frame_end = 1, a.frames

    # white world (lights the scene + is the white paper background)
    world = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
    sc.world = world; world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    bg.inputs[0].default_value = (1, 1, 1, 1); bg.inputs[1].default_value = 1.0

    # domain volume material -> dark smoke, kill flame glow for pure ink substrate
    mat = domain.active_material
    if mat and mat.use_nodes:
        for n in mat.node_tree.nodes:
            if n.type == "PRINCIPLED_VOLUME":
                if "Color" in n.inputs:
                    n.inputs["Color"].default_value = (0.02, 0.02, 0.02, 1)
                if "Density" in n.inputs:
                    n.inputs["Density"].default_value = 6.0      # punchy contrast
                if a.mode != "smoke" and "Emission Strength" in n.inputs:
                    n.inputs["Emission Strength"].default_value = 0.0
                if "Blackbody Intensity" in n.inputs:
                    n.inputs["Blackbody Intensity"].default_value = 0.0

    # camera
    cam_d = bpy.data.cameras.new("Cam"); cam = bpy.data.objects.new("Cam", cam_d)
    sc.collection.objects.link(cam); sc.camera = cam
    cam.location = Vector((0, -11, 4.5)); look_at(cam, (0, 0, 3.2))
    cam_d.lens = 50

    # render: Cycles CPU, low samples, square, grayscale on white
    sc.render.engine = "CYCLES"
    sc.cycles.samples = a.samples
    try: sc.cycles.device = "CPU"
    except Exception: pass
    sc.render.resolution_x = sc.render.resolution_y = a.rres
    sc.render.film_transparent = False
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "BW"
    # CRITICAL: Blender 5.x defaults to AgX which crushes white->grey & kills contrast.
    # Standard keeps the white world white and the smoke high-contrast (stylizable).
    try:
        sc.view_settings.view_transform = "Standard"
        sc.view_settings.look = "None"
    except Exception as e:
        print("[smoke_sim] view_transform set failed:", e)

    # bake
    print(f"[smoke_sim] baking mode={a.mode} res={a.res} frames={a.frames} ...", flush=True)
    bpy.context.view_layer.objects.active = domain
    for o in sc.objects:
        o.select_set(o == domain)
    try:
        with bpy.context.temp_override(scene=sc, active_object=domain, object=domain,
                                       selected_objects=[domain]):
            bpy.ops.fluid.bake_all()
    except Exception as e:
        print("[smoke_sim] override bake failed, plain bake:", e, flush=True)
        bpy.ops.fluid.bake_all()
    print("[smoke_sim] bake done; rendering ...", flush=True)

    for f in range(1, a.frames + 1):
        sc.frame_set(f)
        sc.render.filepath = os.path.join(a.out, "frames", f"{a.mode}_{f:04d}.png")
        bpy.ops.render.render(write_still=True)
        if f % 10 == 0:
            print(f"[smoke_sim] rendered {f}/{a.frames}", flush=True)
    print(f"SMOKE_SIM_DONE {a.mode} -> {a.out}", flush=True)


if __name__ == "__main__":
    main()
