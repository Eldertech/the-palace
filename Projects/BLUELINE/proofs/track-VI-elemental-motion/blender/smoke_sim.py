#!/usr/bin/env python3
"""
BLUELINE · Track VI — headless Mantaflow SMOKE (or FIRE) -> grayscale-on-white sequence,
a stylizable ink substrate. Built on bpy.ops.object.quick_smoke (version-robust), then
tuned to dark medium against a white world and rendered with Cycles.

  blender --background --python smoke_sim.py -- --res 96 --frames 72 --rres 640 \
          --samples 16 --mode smoke --noise --vorticity 2.5 --beta 3.0 \
          --density 12.0 --dissolve --domain-height 2.5 --out <abs renders dir>

--mode smoke|fire|both. Output: <out>/frames/<mode>_####.png (L) + <out>/<mode>_strip.png

NEW LEVERS (art direction):
  --vorticity     curl/turbulence strength (default 0.3; 1.5-4.0 for dramatic wisps)
  --alpha         density buoyancy (default 0.1; keep low so smoke doesn't sink)
  --beta          heat buoyancy (default 2.0; 3-5 makes it climb hard)
  --density       Principled Volume density multiplier (default 6.0; 10-16 for rich blacks)
  --dissolve      enable smoke dissolve (old smoke fades -> delicate tips)
  --dissolve-speed frames until fully dissolved (default 20; lower = faster fade)
  --domain-height  Y-scale of domain (default 1.0; 2-3 for tall chimney proportions)
  --emitter-size  emitter sphere radius (default 0.7; smaller = thinner column)
  --launch-z      upward velocity at emission (default 2.0; higher = faster climb)
  --temp          flow temperature (default 1.5; higher = more heat-driven rise)
"""
import bpy, sys, os, math, argparse
from mathutils import Vector


def args():
    a = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    # original flags
    p.add_argument("--res", type=int, default=48)        # domain resolution_max
    p.add_argument("--frames", type=int, default=60)
    p.add_argument("--rres", type=int, default=640)      # render pixels (square)
    p.add_argument("--samples", type=int, default=24)
    p.add_argument("--mode", default="smoke", choices=["smoke", "fire", "both"])
    p.add_argument("--noise", action="store_true")       # high-res wavelet noise (detailed wisps)
    p.add_argument("--puff", type=int, default=0,
                   help="0=continuous; N=stop inflow after frame N (rising plume)")
    p.add_argument("--out", required=True)
    # NEW art-direction levers
    p.add_argument("--vorticity", type=float, default=0.3,
                   help="curl/turbulence (0.3=calm, 1.5-4.0=dramatic wisps)")
    p.add_argument("--alpha", type=float, default=0.1,
                   help="density buoyancy: keep low so smoke doesn't sink (default 0.1)")
    p.add_argument("--beta", type=float, default=2.0,
                   help="heat buoyancy: high = climbs fast (default 2.0)")
    p.add_argument("--density", type=float, default=6.0,
                   help="Principled Volume density multiplier (default 6.0; 10-16 for ink blacks)")
    p.add_argument("--dissolve", action="store_true",
                   help="fade old smoke so tips stay delicate (avoids blob buildup)")
    p.add_argument("--dissolve-speed", type=int, default=20,
                   help="frames to full dissolve when --dissolve is on (default 20)")
    p.add_argument("--domain-height", type=float, default=1.0,
                   help="Y-scale multiplier on domain Z (1=square, 2-3=tall chimney)")
    p.add_argument("--emitter-size", type=float, default=0.7,
                   help="emitter sphere radius (default 0.7; smaller = thinner column)")
    p.add_argument("--launch-z", type=float, default=2.0,
                   help="upward launch velocity at emission (default 2.0)")
    p.add_argument("--temp", type=float, default=1.5,
                   help="flow temperature (default 1.5; higher = more heat-driven climb)")
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

    # emitter sphere — smaller = tighter, more chisel-like column
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3, radius=a.emitter_size,
                                           location=(0, 0, 0.6))
    flow = bpy.context.active_object; flow.name = "Emitter"
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

    # tall domain: scale Z so the plume has room to climb without hitting the ceiling
    if a.domain_height != 1.0:
        domain.scale.z *= a.domain_height
        bpy.ops.object.select_all(action="DESELECT")
        domain.select_set(True); bpy.context.view_layer.objects.active = domain
        bpy.ops.object.transform_apply(scale=True)

    flow.hide_render = True   # emitter mesh: invisible — only the smoke it seeds shows
    fs.flow_behavior = "INFLOW"
    fs.use_inflow = True
    fs.flow_type = {"smoke": "SMOKE", "fire": "FIRE", "both": "BOTH"}[a.mode]
    if hasattr(fs, "temperature"):
        fs.temperature = a.temp
    fs.density = 1.0
    if hasattr(fs, "use_initial_velocity"):
        fs.use_initial_velocity = True
        fs.velocity_coord = (0.0, 0.0, a.launch_z)
    if a.puff > 0:
        _n = a.puff
        def _puff(scene, depsgraph=None, _fs=fs, _n=_n):
            _fs.density = 1.0 if scene.frame_current <= _n else 0.0
        bpy.app.handlers.frame_change_pre.append(_puff)

    # domain physics
    ds.resolution_max = a.res
    ds.use_noise = a.noise
    ds.cache_directory = cache
    ds.cache_frame_start = 1
    ds.cache_frame_end = a.frames
    if hasattr(ds, "alpha"):
        ds.alpha = a.alpha
    if hasattr(ds, "beta"):
        ds.beta = a.beta
    if hasattr(ds, "vorticity"):
        ds.vorticity = a.vorticity
    # dissolve: old smoke fades away — the key to delicate wispy tips vs blob buildup
    if a.dissolve and hasattr(ds, "use_dissolve_smoke"):
        ds.use_dissolve_smoke = True
        if hasattr(ds, "dissolve_speed"):
            ds.dissolve_speed = a.dissolve_speed
        # exponential dissolve (if available) keeps the fading natural-looking
        if hasattr(ds, "use_dissolve_smoke_log"):
            ds.use_dissolve_smoke_log = True
    ds.use_adaptive_domain = True

    sc = bpy.context.scene
    sc.frame_start, sc.frame_end = 1, a.frames

    # white world — the white paper background
    world = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
    sc.world = world; world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    bg.inputs[0].default_value = (1, 1, 1, 1); bg.inputs[1].default_value = 1.0

    # volume material: very dark smoke, no flame glow
    mat = domain.active_material
    if mat and mat.use_nodes:
        for n in mat.node_tree.nodes:
            if n.type == "PRINCIPLED_VOLUME":
                if "Color" in n.inputs:
                    n.inputs["Color"].default_value = (0.015, 0.015, 0.015, 1)
                if "Density" in n.inputs:
                    n.inputs["Density"].default_value = a.density
                if a.mode != "smoke" and "Emission Strength" in n.inputs:
                    n.inputs["Emission Strength"].default_value = 0.0
                if "Blackbody Intensity" in n.inputs:
                    n.inputs["Blackbody Intensity"].default_value = 0.0
                # anisotropy: slightly forward-scattering gives more depth
                if "Anisotropy" in n.inputs:
                    n.inputs["Anisotropy"].default_value = 0.2

    # camera: pulled back more for tall domain; looking higher up
    # domain_height affects how tall the scene is; shift camera accordingly
    cam_z = 4.5 + (a.domain_height - 1.0) * 2.0
    look_target_z = 3.5 + (a.domain_height - 1.0) * 1.5
    cam_d = bpy.data.cameras.new("Cam"); cam = bpy.data.objects.new("Cam", cam_d)
    sc.collection.objects.link(cam); sc.camera = cam
    cam.location = Vector((0, -14, cam_z)); look_at(cam, (0, 0, look_target_z))
    cam_d.lens = 50

    # render: Cycles CPU, grayscale on white
    sc.render.engine = "CYCLES"
    sc.cycles.samples = a.samples
    try: sc.cycles.device = "CPU"
    except Exception: pass
    sc.render.resolution_x = sc.render.resolution_y = a.rres
    sc.render.film_transparent = False
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "BW"
    # Standard view transform keeps white white and smoke high-contrast
    try:
        sc.view_settings.view_transform = "Standard"
        sc.view_settings.look = "None"
    except Exception as e:
        print("[smoke_sim] view_transform set failed:", e)

    # bake
    print(f"[smoke_sim] baking mode={a.mode} res={a.res} noise={a.noise} "
          f"vorticity={a.vorticity} beta={a.beta} dissolve={a.dissolve} "
          f"domain_height={a.domain_height} frames={a.frames} ...", flush=True)
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
