"""
BLUELINE — Grease Pencil v3 LINE ART (working version, Blender 5.1)
====================================================================
Lessons from debug session:
  1. grease_pencil_add(type='EMPTY') creates an obj with a default "Black" material
     at slot 0 and a default "Layer" — the Line Art modifier writes to THESE by default.
     Don't override them; instead, configure the existing ones.
  2. source_type='OBJECT' works reliably. SCENE/COLLECTION may exclude the GP object
     itself from the source if they share a collection — move geometry to a separate
     collection OR use SCENE source but put GP in Scene Collection root.
  3. bpy.ops.lineart.bake_strokes() was removed in Blender 5.x — Line Art renders
     live (no pre-bake needed). The modifier evaluates at render time.
  4. Noise and Thickness modifiers DO exist and work on the GP v3 object.
     Correct prop names: factor/factor_strength/noise_scale (Noise), thickness (Thickness).

Three variants of 'confident calligraphic ink' with increasing art direction.
"""
import bpy, math, os, random

OUT = "/Users/loudonstearns/Documents/The Palace/Projects/BLUELINE/proofs/blender-handdrawn/followups/grease-pencil-lineart"
os.makedirs(OUT, exist_ok=True)
RES = (560, 700)

def eevee():
    items = [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items]
    for c in ('BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE'):
        if c in items: return c
    return items[0]

def ink_mat():
    """White emission material for mesh objects."""
    m = bpy.data.materials.new("paper"); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    em = nt.nodes.new('ShaderNodeEmission'); em.inputs['Color'].default_value = (0.96, 0.96, 0.96, 1)
    out = nt.nodes.new('ShaderNodeOutputMaterial'); nt.links.new(em.outputs['Emission'], out.inputs['Surface']); return m

def build_city_in_collection(coll):
    """Build city meshes inside `coll` (not the scene root collection)."""
    random.seed(7); pm = ink_mat()
    def add_obj(fn, *args, **kwargs):
        fn(*args, **kwargs)
        obj = bpy.context.active_object
        # Move to target collection
        for c in list(obj.users_collection):
            c.objects.unlink(obj)
        coll.objects.link(obj)
        return obj

    add_obj(bpy.ops.mesh.primitive_plane_add, size=90, location=(0, 0, 0)).data.materials.append(pm)
    for side in (-1, 1):
        for i in range(7):
            y = 6 + i*7; h = random.uniform(9, 22); w = random.uniform(3.2, 4.6)
            b = add_obj(bpy.ops.mesh.primitive_cube_add, size=1, location=(side*6.5, y, h/2))
            b.scale = (w, random.uniform(3.5, 5), h); b.data.materials.append(pm)
            f = add_obj(bpy.ops.mesh.primitive_cube_add, size=1, location=(side*6.5, y-2, h*0.55))
            f.scale = (w*0.55, 0.4, h*0.5); f.data.materials.append(pm)
    add_obj(bpy.ops.mesh.primitive_cylinder_add, radius=0.55, depth=2, location=(0.4, 11, 1.2)).data.materials.append(pm)
    add_obj(bpy.ops.mesh.primitive_uv_sphere_add, radius=0.5, location=(0.4, 11, 2.5)).data.materials.append(pm)

def build_scene_root():
    """Build light, camera, world — these stay in scene root collection."""
    d = bpy.data.lights.new('S', 'SUN'); d.energy = 5
    o = bpy.data.objects.new('S', d); bpy.context.scene.collection.objects.link(o)
    o.rotation_euler = (math.radians(58), math.radians(8), math.radians(35))
    cd = bpy.data.cameras.new('C'); cd.lens = 26
    c = bpy.data.objects.new('C', cd); bpy.context.scene.collection.objects.link(c)
    c.location = (0.4, -7, 1.5)
    c.rotation_euler = (math.radians(86), 0, 0)
    c.rotation_euler.rotate_axis('Z', math.radians(-8))
    bpy.context.scene.camera = c
    w = bpy.data.worlds.new('W'); bpy.context.scene.world = w; w.use_nodes = True
    w.node_tree.nodes.get('Background').inputs['Color'].default_value = (1, 1, 1, 1)

def build_gp_lineart(city_coll, ink_color=(0, 0, 0, 1), stroke_radius=0.004, crease_deg=20):
    """
    Add GP v3 object with Line Art modifier pointing at city_coll.
    Uses the auto-created 'Black' material and 'Layer' from grease_pencil_add.
    Configures the default material to be black ink.
    Returns (gp_obj, lineart_mod).
    """
    # Add GP object — comes with 'Black' material + 'Layer' built in
    bpy.ops.object.grease_pencil_add(type='EMPTY')
    gp = bpy.context.active_object
    gp.name = "GP_LineArt"

    # Configure the default 'Black' material (slot 0)
    mat = gp.data.materials[0]
    bpy.data.materials.create_gpencil_data(mat)
    gpm = mat.grease_pencil
    gpm.show_stroke = True
    gpm.show_fill = False
    gpm.color = ink_color
    gpm.mode = 'LINE'
    gpm.stroke_style = 'SOLID'

    # Get the default layer name
    default_layer = gp.data.layers[0].name
    print(f"  Default layer: '{default_layer}'")
    print(f"  Default material: '{mat.name}'")

    # Add Line Art modifier
    bpy.ops.object.modifier_add(type='LINEART')
    mod = gp.modifiers[-1]
    mod.source_type = 'COLLECTION'
    mod.source_collection = city_coll
    mod.use_contour   = True
    mod.use_crease    = True
    mod.use_loose     = True
    mod.use_edge_mark = True
    mod.use_intersection = True
    mod.crease_threshold = math.radians(crease_deg)
    mod.target_layer = default_layer     # write to the layer that already exists
    mod.target_material = mat            # write using the configured material
    mod.radius = stroke_radius
    mod.opacity = 1.0
    mod.use_cache = False
    print(f"  mod.target_layer='{mod.target_layer}', target_material='{mod.target_material.name if mod.target_material else None}'")
    return gp, mod

def add_noise(gp, factor=0.5, noise_scale=1.0, use_random=True):
    bpy.context.view_layer.objects.active = gp
    bpy.ops.object.modifier_add(type='GREASE_PENCIL_NOISE')
    m = gp.modifiers[-1]; m.name = "Noise"
    m.factor = factor         # position offset
    m.noise_scale = noise_scale
    m.use_random = use_random
    return m

def add_thickness(gp, thickness=20):
    bpy.context.view_layer.objects.active = gp
    bpy.ops.object.modifier_add(type='GREASE_PENCIL_THICKNESS')
    m = gp.modifiers[-1]; m.name = "Thickness"
    m.thickness = thickness
    return m

def render(name):
    sc = bpy.context.scene
    try: sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'
    except: pass
    sc.render.resolution_x, sc.render.resolution_y = RES
    try: sc.eevee.taa_render_samples = 32
    except: pass
    sc.render.image_settings.file_format = 'PNG'
    sc.render.filepath = os.path.join(OUT, f"{name}.png")
    bpy.ops.render.render(write_still=True)
    print(f"  wrote {name}.png")

# ── VARIANT A: Clean base (minimal noise) ────────────────────────────────────
print("\n=== VARIANT A: Clean GP Line Art ===")
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.render.engine = eevee()

city_coll_a = bpy.data.collections.new("City")
bpy.context.scene.collection.children.link(city_coll_a)
build_city_in_collection(city_coll_a)
build_scene_root()

gp_a, mod_a = build_gp_lineart(city_coll_a, stroke_radius=0.003, crease_deg=20)
add_noise(gp_a, factor=0.05, noise_scale=1.0)
add_thickness(gp_a, thickness=12)
render("A_gp_clean")

# ── VARIANT B: Confident calligraphic (medium noise + thickness) ──────────────
print("\n=== VARIANT B: GP Confident Calligraphic ===")
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.render.engine = eevee()

city_coll_b = bpy.data.collections.new("City")
bpy.context.scene.collection.children.link(city_coll_b)
build_city_in_collection(city_coll_b)
build_scene_root()

gp_b, mod_b = build_gp_lineart(city_coll_b, stroke_radius=0.005, crease_deg=18)
add_noise(gp_b, factor=0.18, noise_scale=1.4)
add_thickness(gp_b, thickness=22)
render("B_gp_confident_calligraphic")

# ── VARIANT C: Heavy brush / expressive ──────────────────────────────────────
print("\n=== VARIANT C: GP Heavy Brush ===")
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.render.engine = eevee()

city_coll_c = bpy.data.collections.new("City")
bpy.context.scene.collection.children.link(city_coll_c)
build_city_in_collection(city_coll_c)
build_scene_root()

gp_c, mod_c = build_gp_lineart(city_coll_c, stroke_radius=0.007, crease_deg=15)
add_noise(gp_c, factor=0.40, noise_scale=2.0)
add_thickness(gp_c, thickness=40)
render("C_gp_heavy_brush")

print("\nALL GP VARIANTS DONE")
