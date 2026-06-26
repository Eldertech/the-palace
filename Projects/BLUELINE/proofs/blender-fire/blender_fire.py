#!/usr/bin/env python3
"""
BLUELINE movement solvers — particle streak flames in Blender (the sim-leg's Blender-bake fork).

A very simple greybox — ground, a boxy car, a primitive mannequin, a building plane behind — with a
particle system emitting upward streaks bent by a TURBULENCE force field (the curl/flow tie-in). The
streaks are emissive, aligned to velocity, so they read as licking flame. PASS 1 here renders the
mockup WITH the greybox visible to validate the scene + flame look; a later pass makes the greybox a
holdout so only the flames composite into the shot-02 drawing.

  /opt/homebrew/bin/blender --background --python blender_fire.py
"""
import bpy, os, math

HERE = os.path.dirname(os.path.abspath(__file__))
MODE = os.environ.get("BL_MODE", "mockup")   # 'mockup' = greybox visible; 'holdout' = flames only on transparent, greybox occludes
OUT = os.path.join(HERE, "renders", "flames_holdout_f40.png" if MODE == "holdout" else "fire_mockup_f40.png")
os.makedirs(os.path.dirname(OUT), exist_ok=True)

# ---- clean ----
for col in (bpy.data.objects, bpy.data.meshes, bpy.data.materials, bpy.data.cameras,
            bpy.data.lights, bpy.data.particles):
    for x in list(col):
        col.remove(x)
scene = bpy.context.scene

def grey(name, v, rough=0.85):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes.get("Principled BSDF")
    if b:
        b.inputs["Base Color"].default_value = (v, v, v, 1.0)
        b.inputs["Roughness"].default_value = rough
    return m

def emissive(name, color, strength):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    e = nt.nodes.new("ShaderNodeEmission"); e.inputs[0].default_value = (*color, 1.0); e.inputs[1].default_value = strength
    o = nt.nodes.new("ShaderNodeOutputMaterial"); nt.links.new(e.outputs[0], o.inputs["Surface"])
    return m

def flame_material():
    # colour + brightness driven by WORLD HEIGHT (Particle-Info Age doesn't vary for object instances in
    # EEVEE-Next) → white-hot at the base, cooling up through orange to deep red at the tips.
    m = bpy.data.materials.new("flame"); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    geo = nt.nodes.new("ShaderNodeNewGeometry")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ"); nt.links.new(geo.outputs["Position"], sep.inputs[0])
    zr = nt.nodes.new("ShaderNodeMapRange")                                        # world Z (base→top) → 0..1
    zr.inputs["From Min"].default_value = 0.8; zr.inputs["From Max"].default_value = 4.2; zr.clamp = True
    nt.links.new(sep.outputs["Z"], zr.inputs["Value"])
    ramp = nt.nodes.new("ShaderNodeValToRGB"); cr = ramp.color_ramp
    cr.elements[0].position = 0.0; cr.elements[0].color = (1.0, 0.95, 0.72, 1)     # white-hot base
    cr.elements[1].position = 1.0; cr.elements[1].color = (0.5, 0.04, 0.0, 1)      # deep red tip
    cr.elements.new(0.25).color = (1.0, 0.72, 0.22, 1)                             # yellow
    cr.elements.new(0.55).color = (1.0, 0.33, 0.05, 1)                             # orange
    nt.links.new(zr.outputs["Result"], ramp.inputs["Fac"])
    sr = nt.nodes.new("ShaderNodeMapRange")                                        # bright low → dim high
    sr.inputs["To Min"].default_value = 3.0; sr.inputs["To Max"].default_value = 0.6
    nt.links.new(zr.outputs["Result"], sr.inputs["Value"])
    emi = nt.nodes.new("ShaderNodeEmission")
    nt.links.new(ramp.outputs["Color"], emi.inputs["Color"]); nt.links.new(sr.outputs["Result"], emi.inputs["Strength"])
    out = nt.nodes.new("ShaderNodeOutputMaterial"); nt.links.new(emi.outputs[0], out.inputs["Surface"])
    return m

def box(name, loc, size, mat):
    bpy.ops.mesh.primitive_cube_add(location=loc)
    o = bpy.context.active_object; o.name = name
    o.scale = (size[0] / 2, size[1] / 2, size[2] / 2); o.data.materials.append(mat); return o

def cyl(name, loc, r, h, mat):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=h, location=loc)
    o = bpy.context.active_object; o.name = name; o.data.materials.append(mat); return o

def sph(name, loc, r, mat):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc)
    o = bpy.context.active_object; o.name = name; o.data.materials.append(mat); return o

# ---- NO greybox ----
# The image mask (hero_mask) handles occlusion in the 2D composite, and the 3D greybox was never
# camera-matched to the drawing — the car's holdout was carving a wrong-shaped gap into the flames.
# So the Blender scene is JUST the flame (emitter + particles + turbulence) on transparent.

# ---- flame emitter + particle streaks ----
streak_mat = flame_material()   # age-ramped fire colour (white-hot base → orange → red tips)
bpy.ops.mesh.primitive_cone_add(radius1=0.02, radius2=0.0, depth=0.6, location=(0, 0, -100))  # a long THIN streak (was 0.035 — fat ones blobbed)
streak = bpy.context.active_object; streak.name = "streak"; streak.data.materials.append(streak_mat)

# emitter tucked INSIDE the car body (z<1.0 top) so it's occluded — 5.1's hide_render would kill the particles
bpy.ops.mesh.primitive_plane_add(size=1.0, location=(0, 3, 0.7))
emitter = bpy.context.active_object; emitter.name = "flame_emitter"; emitter.scale = (2.6, 1.1, 1.0)   # wider base → less concentrated

# turbulence force field — the curl/flow that makes the flame lick (milder, so it rises more than it blows)
bpy.ops.object.effector_add(type='TURBULENCE', location=(0, 3, 2.5))
turb = bpy.context.active_object; turb.name = "turb"
turb.field.strength = 1.8; turb.field.size = 1.8; turb.field.flow = 0.4   # gentler lick (was 3.5/1.0)

psm = emitter.modifiers.new("flames", 'PARTICLE_SYSTEM'); pset = emitter.particle_systems[-1].settings
pset.count = 4000
pset.frame_start = 1; pset.frame_end = 140; pset.lifetime = 110   # SLOW rise → long life keeps the flame height
pset.emit_from = 'FACE'; pset.use_emit_random = True
pset.physics_type = 'NEWTON'
pset.normal_factor = 1.9; pset.factor_random = 1.0              # gentle rise (slow fire) + more spread so the base doesn't clump
pset.effector_weights.gravity = 0.0
pset.render_type = 'OBJECT'; pset.instance_object = streak
pset.particle_size = 0.7; pset.size_random = 0.9               # smaller + more varied (was 1.1) → distinct streaks, not a solid mass
pset.use_rotations = True; pset.rotation_mode = 'VEL'; pset.use_dynamic_rotation = True
emitter.hide_render = False   # emitter is occluded inside the car, so it's safe to leave renderable (keeps particles)
if os.environ.get("BL_NOFLAME"):   # isolation test: turn off the flame instances to see what geometry remains
    pset.render_type = 'NONE'

# ---- camera + world ----
cam_d = bpy.data.cameras.new("Cam"); cam_d.lens = 38
cam = bpy.data.objects.new("Cam", cam_d); scene.collection.objects.link(cam); scene.camera = cam
cam.location = (0.4, -7.5, 1.7); cam.rotation_euler = (math.radians(85), 0, math.radians(2))

scene.world = bpy.data.worlds.new("W"); scene.world.use_nodes = True
bg = scene.world.node_tree.nodes["Background"]; bg.inputs[0].default_value = (0.015, 0.016, 0.02, 1); bg.inputs[1].default_value = 1.0

# dim key so the greybox reads (flames self-illuminate)
kl = bpy.data.lights.new("key", 'AREA'); kl.energy = 120; kl.size = 6
ko = bpy.data.objects.new("key", kl); scene.collection.objects.link(ko)
ko.location = (-5, -4, 7); ko.rotation_euler = (math.radians(50), 0, math.radians(-35))

# ---- render: portrait to match shot 02; step the sim to frame 40 then still ----
scene.render.resolution_x = 624; scene.render.resolution_y = 912
scene.render.image_settings.file_format = 'PNG'
scene.render.use_motion_blur = True; scene.render.motion_blur_shutter = 0.6   # smooth the streak sparkle
try: scene.render.engine = 'BLENDER_EEVEE'
except Exception: scene.render.engine = 'BLENDER_EEVEE_NEXT'
try: scene.view_settings.view_transform = 'Standard'
except Exception: pass
# (EEVEE-Next 5.1 dropped the legacy bloom toggle — glow would come from a compositor Glare node; skip for the validation pass)
if MODE in ("holdout", "holdout_seq"):
    hm = bpy.data.materials.new("holdout"); hm.use_nodes = True
    hnt = hm.node_tree; hnt.nodes.clear()
    ho = hnt.nodes.new("ShaderNodeHoldout"); hout = hnt.nodes.new("ShaderNodeOutputMaterial")
    hnt.links.new(ho.outputs[0], hout.inputs["Surface"])
    # NOTE the emitter must be a holdout too: in this pass the car (which hid it in the mockup) is
    # transparent, so a materialless emitter renders as a solid square block behind the man.
    for nm in ("ground", "building", "car_body", "car_cabin", "leg_L", "leg_R", "torso", "arm_L", "arm_R", "head", "flame_emitter"):
        ob = bpy.data.objects.get(nm)
        if ob and ob.type == 'MESH':
            ob.data.materials.clear(); ob.data.materials.append(hm)
    scene.render.film_transparent = True       # flames on alpha; the holdout greybox cuts what's behind it
    bg.inputs[0].default_value = (0, 0, 0, 1)
if MODE == "holdout_seq":
    SEQDIR = os.path.join(HERE, "renders", "seq"); os.makedirs(SEQDIR, exist_ok=True)
    scene.frame_start = 70; scene.frame_end = 117       # 48 well-developed steady frames (slow fire)
    scene.render.filepath = os.path.join(SEQDIR, "flame_")
    bpy.ops.render.render(animation=True)
    print("WROTE SEQ", SEQDIR)
else:
    for f in range(1, 41):
        scene.frame_set(f)
    scene.render.filepath = OUT
    bpy.ops.render.render(write_still=True)
    print("WROTE", OUT)
print("BLENDER_FIRE_DONE")
