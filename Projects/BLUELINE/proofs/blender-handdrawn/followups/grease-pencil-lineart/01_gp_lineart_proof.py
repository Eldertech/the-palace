"""
BLUELINE — Grease Pencil v3 LINE ART proof (Blender 5.1)
=========================================================
Renders the same city scene with GP Line Art instead of Freestyle,
targeting the 'confident calligraphic ink' look (variant #9 from cat_stills_lines.py).

GP v3 specifics (Blender 5.1.2):
  - Object type:       GREASEPENCIL  (bpy.ops.object.grease_pencil_add)
  - Line Art modifier: type='LINEART'  (class: GreasePencilLineartModifier)
  - Noise modifier:    type='GREASE_PENCIL_NOISE'
  - Thickness mod:     type='GREASE_PENCIL_THICKNESS'
  - Layer API:         gp_data.layers  (bpy.ops.grease_pencil.layer_add())
  - GP material:       bpy.data.materials.create_gpencil_data(mat)  -> mat.grease_pencil

Outputs: three GP renders varying noise/thickness art direction.
"""
import bpy, math, os, random

OUT = "/Users/loudonstearns/Documents/The Palace/Projects/BLUELINE/proofs/blender-handdrawn/followups/grease-pencil-lineart"
os.makedirs(OUT, exist_ok=True)
RES = (560, 700)

# ── helpers ─────────────────────────────────────────────────────────────────

def eevee():
    items = [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items]
    for c in ('BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE'):
        if c in items: return c
    return items[0]

def ink_mat():
    """White emission material for mesh objects (no shading — clean line ground)."""
    m = bpy.data.materials.new("paper")
    m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    em = nt.nodes.new('ShaderNodeEmission')
    em.inputs['Color'].default_value = (0.96, 0.96, 0.96, 1)
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(em.outputs['Emission'], out.inputs['Surface'])
    return m

def build_city():
    """Identical city to cat_stills_lines.py for apples-to-apples comparison."""
    random.seed(7); pm = ink_mat()
    bpy.ops.mesh.primitive_plane_add(size=90, location=(0, 0, 0))
    bpy.context.active_object.data.materials.append(pm)
    for side in (-1, 1):
        for i in range(7):
            y = 6 + i*7; h = random.uniform(9, 22); w = random.uniform(3.2, 4.6)
            bpy.ops.mesh.primitive_cube_add(size=1, location=(side*6.5, y, h/2))
            b = bpy.context.active_object; b.scale = (w, random.uniform(3.5, 5), h)
            b.data.materials.append(pm)
            bpy.ops.mesh.primitive_cube_add(size=1, location=(side*6.5, y-2, h*0.55))
            f = bpy.context.active_object; f.scale = (w*0.55, 0.4, h*0.5)
            f.data.materials.append(pm)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.55, depth=2, location=(0.4, 11, 1.2))
    bpy.context.active_object.data.materials.append(pm)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.5, location=(0.4, 11, 2.5))
    bpy.context.active_object.data.materials.append(pm)
    # Sun
    d = bpy.data.lights.new('S', 'SUN'); d.energy = 5
    o = bpy.data.objects.new('S', d); bpy.context.collection.objects.link(o)
    o.rotation_euler = (math.radians(58), math.radians(8), math.radians(35))
    # Camera
    cd = bpy.data.cameras.new('C'); cd.lens = 26
    c = bpy.data.objects.new('C', cd); bpy.context.collection.objects.link(c)
    c.location = (0.4, -7, 1.5)
    c.rotation_euler = (math.radians(86), 0, 0)
    c.rotation_euler.rotate_axis('Z', math.radians(-8))
    bpy.context.scene.camera = c
    # World
    w = bpy.data.worlds.new('W'); bpy.context.scene.world = w; w.use_nodes = True
    w.node_tree.nodes.get('Background').inputs['Color'].default_value = (1, 1, 1, 1)

def make_gp_ink_material(name="GP_Ink", color=(0, 0, 0, 1), stroke_width=4.0):
    """Create a GP stroke-only material with solid black ink."""
    mat = bpy.data.materials.new(name)
    bpy.data.materials.create_gpencil_data(mat)
    gpm = mat.grease_pencil
    gpm.color = color          # stroke color (RGBA)
    gpm.mode = 'LINE'
    gpm.stroke_style = 'SOLID'
    gpm.show_stroke = True
    gpm.show_fill = False
    return mat

def add_gp_lineart_object(scene, target_collection, layer_name="Lines", target_material=None):
    """
    Add a Grease Pencil v3 object with:
      - a LINEART modifier targeting the scene collection
      - one layer for the line art to write into
    Returns the GP object + modifier.
    """
    bpy.ops.object.grease_pencil_add(type='EMPTY')
    gp_obj = bpy.context.active_object
    gp_obj.name = "GP_LineArt"
    gp_data = gp_obj.data

    # Add a layer (Line Art modifier writes strokes into the named layer)
    bpy.ops.grease_pencil.layer_add()
    layer = gp_data.layers[-1]
    layer.name = layer_name

    # Assign material
    if target_material:
        gp_obj.data.materials.append(target_material)

    # Add the Line Art modifier
    bpy.ops.object.modifier_add(type='LINEART')
    mod = gp_obj.modifiers[-1]
    mod.name = "LineArt"

    # Source = scene collection (all geometry)
    mod.source_type = 'COLLECTION'
    mod.source_collection = target_collection

    # Edge types to detect
    mod.use_contour   = True
    mod.use_crease    = True
    mod.use_loose     = True
    mod.use_edge_mark = True
    mod.use_intersection = True

    # Crease threshold (lower = more edge lines, like silhouettes + interior)
    mod.crease_threshold = math.radians(20)  # ~20 deg

    # Target: write strokes into the layer we created
    mod.target_layer = layer_name
    if target_material:
        mod.target_material = target_material

    # Line radius (thickness in world units) — this is the base stroke width
    mod.radius = 0.004  # thin but present; we'll thicken via GP_THICKNESS mod

    return gp_obj, mod

def add_noise_modifier(gp_obj, amplitude=0.12, scale=1.0, factor=0.8, name="Noise"):
    """Add GREASE_PENCIL_NOISE to make strokes hand-drawn wavering."""
    bpy.context.view_layer.objects.active = gp_obj
    bpy.ops.object.modifier_add(type='GREASE_PENCIL_NOISE')
    noise_mod = gp_obj.modifiers[-1]
    noise_mod.name = name
    # Inspect what props are available
    props = [p.identifier for p in noise_mod.bl_rna.properties
             if p.identifier not in ('rna_type', 'name', 'type',
                                      'show_viewport', 'show_render',
                                      'show_in_editmode', 'show_on_cage',
                                      'show_expanded', 'is_active',
                                      'use_pin_to_last', 'is_override_data',
                                      'use_apply_on_spline', 'execution_time',
                                      'persistent_uid')]
    print(f"  Noise mod props: {props}")
    try: noise_mod.factor = factor
    except: pass
    try: noise_mod.factor_strength = amplitude
    except: pass
    try: noise_mod.amplitude = amplitude
    except: pass
    try: noise_mod.noise_scale = scale
    except: pass
    try: noise_mod.scale = scale
    except: pass
    try: noise_mod.use_random = True
    except: pass
    return noise_mod

def add_thickness_modifier(gp_obj, thickness=20, use_uniform=False, name="Thickness"):
    """Add GREASE_PENCIL_THICKNESS to control stroke weight."""
    bpy.context.view_layer.objects.active = gp_obj
    bpy.ops.object.modifier_add(type='GREASE_PENCIL_THICKNESS')
    thk_mod = gp_obj.modifiers[-1]
    thk_mod.name = name
    props = [p.identifier for p in thk_mod.bl_rna.properties
             if p.identifier not in ('rna_type', 'name', 'type',
                                      'show_viewport', 'show_render',
                                      'show_in_editmode', 'show_on_cage',
                                      'show_expanded', 'is_active',
                                      'use_pin_to_last', 'is_override_data',
                                      'use_apply_on_spline', 'execution_time',
                                      'persistent_uid')]
    print(f"  Thickness mod props: {props}")
    try: thk_mod.thickness = thickness
    except: pass
    try: thk_mod.thickness_factor = thickness / 100.0
    except: pass
    try: thk_mod.use_uniform_thickness = use_uniform
    except: pass
    return thk_mod

# ── render helper ────────────────────────────────────────────────────────────

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

# ── VARIANT A: Base GP Line Art, minimal noise (compare with Freestyle clean) ─

print("\n=== VARIANT A: GP Line Art — clean base ===")
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.render.engine = eevee()
build_city()

scene_col = bpy.context.scene.collection
ink_m = make_gp_ink_material("GP_Ink_A")
gp_obj, mod = add_gp_lineart_object(
    bpy.context.scene, scene_col, "Lines", ink_m
)
# Small noise to prove hand-drawn feel
add_noise_modifier(gp_obj, amplitude=0.05, scale=1.2, factor=0.3)
# Medium thickness
add_thickness_modifier(gp_obj, thickness=15)
render("A_gp_lineart_clean")

# ── VARIANT B: GP Line Art — medium noise, thicker (confident calligraphic) ──

print("\n=== VARIANT B: GP Line Art — confident calligraphic ===")
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.render.engine = eevee()
build_city()

scene_col = bpy.context.scene.collection
ink_m2 = make_gp_ink_material("GP_Ink_B")
gp_obj2, mod2 = add_gp_lineart_object(
    bpy.context.scene, scene_col, "Lines", ink_m2
)
mod2.radius = 0.006
add_noise_modifier(gp_obj2, amplitude=0.15, scale=1.5, factor=0.6, name="Noise_B")
add_thickness_modifier(gp_obj2, thickness=25, name="Thick_B")
render("B_gp_lineart_confident")

# ── VARIANT C: GP Line Art — heavy noise + thick (brush/ink wash feel) ────────

print("\n=== VARIANT C: GP Line Art — heavy brush / ink wash ===")
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.render.engine = eevee()
build_city()

scene_col = bpy.context.scene.collection
ink_m3 = make_gp_ink_material("GP_Ink_C")
gp_obj3, mod3 = add_gp_lineart_object(
    bpy.context.scene, scene_col, "Lines", ink_m3
)
mod3.radius = 0.008
mod3.crease_threshold = math.radians(15)  # even more crease lines
add_noise_modifier(gp_obj3, amplitude=0.3, scale=2.0, factor=0.9, name="Noise_C")
add_thickness_modifier(gp_obj3, thickness=40, name="Thick_C")
render("C_gp_lineart_heavy_brush")

print("\nALL GP LINE ART VARIANTS DONE")
