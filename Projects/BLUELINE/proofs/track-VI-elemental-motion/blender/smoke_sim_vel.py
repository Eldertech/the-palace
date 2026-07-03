#!/usr/bin/env python3
"""
BLUELINE · Track VI — headless Mantaflow SMOKE -> grayscale density frames,
same as smoke_sim.py but also saves the Mantaflow velocity field to .npy files.

Strategy: export domain velocity via a Vector pass on an OpenEXR render.
Blender's fluid domain exposes velocity as a render pass when using Cycles
with the VECTOR pass enabled. We render each frame twice — once as PNG for
visual density, once as EXR for velocity — then read the EXR with numpy.

If the EXR velocity pass doesn't carry usable data (known Mantaflow quirk
with some Blender builds where fluid velocity pass isn't populated), we fall
back silently: the caller's optical-flow script handles that case.

  blender --background --python smoke_sim_vel.py -- \
          --res 56 --frames 72 --rres 512 --samples 16 --mode smoke \
          --out <abs dir>

Output:
  <out>/frames/smoke_####.png    — grayscale density (for visual reference + optical flow)
  <out>/vel/vel_####.npy         — float32 (2,H,W) [vx, vy] from EXR vector pass, if available
  <out>/vel_source.txt           — "exr" or "optical_flow" (what actually worked)
"""
import bpy, sys, os, math, numpy as np, argparse
from mathutils import Vector


def args():
    a = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--res", type=int, default=56)
    p.add_argument("--frames", type=int, default=72)
    p.add_argument("--rres", type=int, default=512)
    p.add_argument("--samples", type=int, default=16)
    p.add_argument("--mode", default="smoke", choices=["smoke", "fire", "both"])
    p.add_argument("--out", required=True)
    return p.parse_args(a)


def reset():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for c in (bpy.data.meshes, bpy.data.materials):
        for d in list(c):
            c.remove(d)


def look_at(cam, target):
    d = cam.location - Vector(target)
    cam.rotation_euler = d.to_track_quat("Z", "Y").to_euler()


def setup_compositor_vel(sc, exr_dir):
    """Wire a compositor that saves the Vector pass to EXR files.
    Returns True if successfully set up."""
    try:
        sc.use_nodes = True
        tree = sc.node_tree
        tree.nodes.clear()

        rl = tree.nodes.new("CompositorNodeRLayers")
        rl.location = (0, 0)

        # Enable vector pass on the view layer
        vl = sc.view_layers[0]
        vl.use_pass_vector = True

        fo = tree.nodes.new("CompositorNodeOutputFile")
        fo.location = (400, 0)
        fo.base_path = exr_dir
        fo.format.file_format = "OPEN_EXR"
        fo.format.color_mode = "RGBA"
        fo.format.color_depth = "32"
        fo.file_slots[0].path = "vel_"
        fo.file_slots[0].use_node_format = True

        # Connect Vector pass -> EXR output
        tree.links.new(rl.outputs.get("Vector") or rl.outputs[0], fo.inputs[0])
        print("[smoke_sim_vel] compositor vector pass set up", flush=True)
        return True
    except Exception as e:
        print(f"[smoke_sim_vel] compositor setup failed: {e}", flush=True)
        return False


def main():
    a = args()
    frames_dir = os.path.join(a.out, "frames")
    vel_dir = os.path.join(a.out, "vel")
    exr_dir = os.path.join(a.out, "vel_exr")
    os.makedirs(frames_dir, exist_ok=True)
    os.makedirs(vel_dir, exist_ok=True)
    os.makedirs(exr_dir, exist_ok=True)
    cache = os.path.join(a.out, "cache")
    os.makedirs(cache, exist_ok=True)
    reset()

    # ── emitter + quick_smoke ──────────────────────────────────────────────
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3, radius=0.7, location=(0, 0, 0.8))
    flow = bpy.context.active_object
    flow.name = "Emitter"
    bpy.ops.object.select_all(action="DESELECT")
    flow.select_set(True)
    bpy.context.view_layer.objects.active = flow
    bpy.ops.object.quick_smoke()

    domain = None
    for o in bpy.context.scene.objects:
        m = o.modifiers.get("Fluid")
        if m and m.fluid_type == "DOMAIN":
            domain = o
            break
    ds = domain.modifiers["Fluid"].domain_settings
    fs = flow.modifiers["Fluid"].flow_settings

    flow.hide_render = True
    fs.flow_behavior = "INFLOW"
    fs.use_inflow = True
    fs.flow_type = {"smoke": "SMOKE", "fire": "FIRE", "both": "BOTH"}[a.mode]
    if hasattr(fs, "temperature"):
        fs.temperature = 1.5
    fs.density = 1.0
    if hasattr(fs, "use_initial_velocity"):
        fs.use_initial_velocity = True
        fs.velocity_coord = (0.0, 0.0, 2.0)

    ds.resolution_max = a.res
    ds.use_noise = False
    ds.cache_directory = cache
    ds.cache_frame_start = 1
    ds.cache_frame_end = a.frames
    if hasattr(ds, "alpha"):
        ds.alpha = 0.1
    if hasattr(ds, "beta"):
        ds.beta = 2.0
    if hasattr(ds, "vorticity"):
        ds.vorticity = 0.3
    ds.use_adaptive_domain = True

    sc = bpy.context.scene
    sc.frame_start, sc.frame_end = 1, a.frames

    # ── white world ───────────────────────────────────────────────────────
    world = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
    sc.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    bg.inputs[0].default_value = (1, 1, 1, 1)
    bg.inputs[1].default_value = 1.0

    # ── domain material ───────────────────────────────────────────────────
    mat = domain.active_material
    if mat and mat.use_nodes:
        for n in mat.node_tree.nodes:
            if n.type == "PRINCIPLED_VOLUME":
                if "Color" in n.inputs:
                    n.inputs["Color"].default_value = (0.02, 0.02, 0.02, 1)
                if "Density" in n.inputs:
                    n.inputs["Density"].default_value = 6.0
                if "Emission Strength" in n.inputs:
                    n.inputs["Emission Strength"].default_value = 0.0
                if "Blackbody Intensity" in n.inputs:
                    n.inputs["Blackbody Intensity"].default_value = 0.0

    # ── camera ─────────────────────────────────────────────────────────────
    cam_d = bpy.data.cameras.new("Cam")
    cam = bpy.data.objects.new("Cam", cam_d)
    sc.collection.objects.link(cam)
    sc.camera = cam
    cam.location = Vector((0, -11, 4.5))
    look_at(cam, (0, 0, 3.2))
    cam_d.lens = 50

    # ── render settings ────────────────────────────────────────────────────
    sc.render.engine = "CYCLES"
    sc.cycles.samples = a.samples
    try:
        sc.cycles.device = "CPU"
    except Exception:
        pass
    sc.render.resolution_x = sc.render.resolution_y = a.rres
    sc.render.film_transparent = False
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "BW"
    try:
        sc.view_settings.view_transform = "Standard"
        sc.view_settings.look = "None"
    except Exception as e:
        print("[smoke_sim_vel] view_transform set failed:", e)

    # ── try to set up EXR vector pass via compositor ────────────────────
    compositor_ok = setup_compositor_vel(sc, exr_dir)

    # ── bake ────────────────────────────────────────────────────────────
    print(f"[smoke_sim_vel] baking mode={a.mode} res={a.res} frames={a.frames} ...", flush=True)
    bpy.context.view_layer.objects.active = domain
    for o in sc.objects:
        o.select_set(o == domain)
    try:
        with bpy.context.temp_override(scene=sc, active_object=domain, object=domain,
                                       selected_objects=[domain]):
            bpy.ops.fluid.bake_all()
    except Exception as e:
        print("[smoke_sim_vel] override bake failed, plain bake:", e, flush=True)
        bpy.ops.fluid.bake_all()
    print("[smoke_sim_vel] bake done; rendering ...", flush=True)

    # ── render frames ────────────────────────────────────────────────────
    exr_got = []
    for f in range(1, a.frames + 1):
        sc.frame_set(f)
        # PNG density frame
        sc.render.filepath = os.path.join(frames_dir, f"smoke_{f:04d}.png")
        sc.render.image_settings.file_format = "PNG"
        sc.render.image_settings.color_mode = "BW"
        bpy.ops.render.render(write_still=True)

        if f % 10 == 0:
            print(f"[smoke_sim_vel] rendered {f}/{a.frames}", flush=True)

    # ── try to read EXR velocity files ──────────────────────────────────
    # Blender names compositor file outputs as <path><frame number with padding>
    vel_source = "optical_flow"
    if compositor_ok:
        import glob
        exr_files = sorted(glob.glob(os.path.join(exr_dir, "vel_*.exr")))
        print(f"[smoke_sim_vel] found {len(exr_files)} EXR velocity files", flush=True)
        if len(exr_files) >= a.frames // 2:
            # Try to read them with numpy via OpenEXR / struct parsing
            try:
                import struct, zlib
                # Minimal EXR reader for float32 channels
                def read_exr_channels(path):
                    with open(path, "rb") as fh:
                        data = fh.read()
                    # Use PIL/numpy to load EXR if available via imageio
                    try:
                        import imageio
                        arr = imageio.v3.imread(path, plugin="OpenEXR")
                        return arr[:, :, :2]  # vx, vy in first two channels
                    except Exception:
                        return None

                sample = read_exr_channels(exr_files[0])
                if sample is not None and sample.shape[2] >= 2:
                    print("[smoke_sim_vel] EXR readable — saving velocity npy files", flush=True)
                    for i, ef in enumerate(exr_files[:a.frames]):
                        arr = read_exr_channels(ef)
                        if arr is not None:
                            # arr shape (H, W, >=2); take first two channels as vx, vy
                            vel = arr[:, :, :2].transpose(2, 0, 1).astype(np.float32)  # (2,H,W)
                            np.save(os.path.join(vel_dir, f"vel_{i+1:04d}.npy"), vel)
                    exr_got = sorted([f for f in os.listdir(vel_dir) if f.endswith(".npy")])
                    if len(exr_got) >= a.frames // 2:
                        vel_source = "exr"
                        print(f"[smoke_sim_vel] EXR velocity: {len(exr_got)} frames saved", flush=True)
            except Exception as e:
                print(f"[smoke_sim_vel] EXR read failed: {e}", flush=True)

    with open(os.path.join(a.out, "vel_source.txt"), "w") as fh:
        fh.write(vel_source + "\n")

    print(f"SMOKE_SIM_VEL_DONE mode={a.mode} vel_source={vel_source} -> {a.out}", flush=True)


if __name__ == "__main__":
    main()
