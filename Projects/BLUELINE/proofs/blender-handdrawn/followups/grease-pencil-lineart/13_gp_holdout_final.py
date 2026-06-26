"""
BLUELINE — GP v3 Line Art FINAL with Holdout Geometry (Blender 5.1)
====================================================================
CONFIRMED WORKING SETUP:
  - Mesh geometry: HOLDOUT material (depth-tracked but colour-transparent)
  - GP Line Art: source_type='SCENE', default 'Black' material
  - World: pure white background
  - Result: proper black ink lines on white paper — like Freestyle

Three art-directed variants, comparable to Freestyle #9.
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

def holdout_mat():
    """Holdout: depth-tracked, colour transparent. GP lines render on top cleanly."""
    hm = bpy.data.materials.new("holdout")
    hm.use_nodes = True; nt = hm.node_tree; nt.nodes.clear()
    hold = nt.nodes.new('ShaderNodeHoldout')
    out_node = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(hold.outputs['Holdout'], out_node.inputs['Surface'])
    # Use alpha blend so holdout creates transparent pixels
    try: hm.blend_method = 'BLEND'
    except: pass
    return hm

def build_city():
    random.seed(7)
    hm = holdout_mat()
    bpy.ops.mesh.primitive_plane_add(size=90, location=(0, 0, 0)); bpy.context.active_object.data.materials.append(hm)
    for side in (-1, 1):
        for i in range(7):
            y = 6 + i*7; h = random.uniform(9, 22); w = random.uniform(3.2, 4.6)
            bpy.ops.mesh.primitive_cube_add(size=1, location=(side*6.5, y, h/2))
            b = bpy.context.active_object; b.scale = (w, random.uniform(3.5, 5), h); b.data.materials.append(hm)
            bpy.ops.mesh.primitive_cube_add(size=1, location=(side*6.5, y-2, h*0.55))
            f = bpy.context.active_object; f.scale = (w*0.55, 0.4, h*0.5); f.data.materials.append(hm)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.55, depth=2, location=(0.4, 11, 1.2)); bpy.context.active_object.data.materials.append(hm)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.5, location=(0.4, 11, 2.5)); bpy.context.active_object.data.materials.append(hm)
    d = bpy.data.lights.new('S', 'SUN'); d.energy = 5; o = bpy.data.objects.new('S', d); bpy.context.collection.objects.link(o)
    o.rotation_euler = (math.radians(58), math.radians(8), math.radians(35))
    cd = bpy.data.cameras.new('C'); cd.lens = 26; c = bpy.data.objects.new('C', cd); bpy.context.collection.objects.link(c)
    c.location = (0.4, -7, 1.5); c.rotation_euler = (math.radians(86), 0, 0); c.rotation_euler.rotate_axis('Z', math.radians(-8))
    bpy.context.scene.camera = c
    w = bpy.data.worlds.new('W'); bpy.context.scene.world = w; w.use_nodes = True
    w.node_tree.nodes.get('Background').inputs['Color'].default_value = (1, 1, 1, 1)

def build_gp(radius=0.030, crease_deg=20):
    bpy.ops.object.grease_pencil_add(type='EMPTY')
    gp = bpy.context.active_object
    mat = gp.data.materials[0]
    bpy.data.materials.create_gpencil_data(mat)
    gpm = mat.grease_pencil
    gpm.show_stroke = True; gpm.show_fill = False
    gpm.color = (0, 0, 0, 1); gpm.mode = 'LINE'; gpm.stroke_style = 'SOLID'
    gpm.mix_factor = 0.0; gpm.mix_stroke_factor = 0.0
    bpy.ops.object.modifier_add(type='LINEART')
    mod = gp.modifiers[-1]
    mod.source_type = 'SCENE'
    mod.use_contour = True; mod.use_crease = True; mod.use_loose = True
    mod.use_edge_mark = True; mod.use_intersection = True
    mod.crease_threshold = math.radians(crease_deg)
    mod.target_layer = gp.data.layers[0].name
    mod.target_material = mat
    mod.radius = radius; mod.opacity = 1.0; mod.use_cache = False
    return gp, mod

def add_noise(gp, factor=0.2, noise_scale=1.5):
    bpy.context.view_layer.objects.active = gp
    bpy.ops.object.modifier_add(type='GREASE_PENCIL_NOISE')
    m = gp.modifiers[-1]; m.name = "Noise"
    m.factor = factor; m.noise_scale = noise_scale; m.use_random = True
    return m

def add_thickness(gp, thickness=18):
    bpy.context.view_layer.objects.active = gp
    bpy.ops.object.modifier_add(type='GREASE_PENCIL_THICKNESS')
    m = gp.modifiers[-1]; m.name = "Thickness"; m.thickness = thickness
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

# ── FINAL A: Fine clean line ──────────────────────────────────────────────────
print("\n=== HOLDOUT FINAL A: Fine clean line ===")
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.render.engine = eevee()
build_city()
gp_a, mod_a = build_gp(radius=0.020, crease_deg=22)
add_noise(gp_a, factor=0.07, noise_scale=1.0)
add_thickness(gp_a, thickness=9)
render("HOLDOUT_FINAL_A_fine_clean")

# ── FINAL B: Confident calligraphic ─────────────────────────────────────────
print("\n=== HOLDOUT FINAL B: Confident calligraphic ===")
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.render.engine = eevee()
build_city()
gp_b, mod_b = build_gp(radius=0.028, crease_deg=20)
add_noise(gp_b, factor=0.22, noise_scale=1.8)
add_thickness(gp_b, thickness=20)
render("HOLDOUT_FINAL_B_confident")

# ── FINAL C: Heavy brush ──────────────────────────────────────────────────────
print("\n=== HOLDOUT FINAL C: Heavy brush ===")
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.render.engine = eevee()
build_city()
gp_c, mod_c = build_gp(radius=0.045, crease_deg=17)
add_noise(gp_c, factor=0.50, noise_scale=2.5)
add_thickness(gp_c, thickness=38)
render("HOLDOUT_FINAL_C_heavy")

print("\nHOLDOUT FINALS DONE")
