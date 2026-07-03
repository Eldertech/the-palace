"""
BLUELINE — GP v3 Line Art FINAL proof (Blender 5.1)
====================================================
Working configuration:
  source_type = 'SCENE'      (not COLLECTION or OBJECT for full city)
  radius = scene-scaled      (0.02–0.05 for a ~20-unit-tall city scene)
  Default 'Black' material   (configure grease_pencil sub-data in-place)
  Default 'Layer'            (written to by modifier automatically)

Three art-directed variants aimed at 'confident calligraphic ink':
  A: Clean fine line (low noise, thin)
  B: Confident calligraphic (medium noise, thicker — target to beat vs Freestyle #9)
  C: Heavy brush / expressive (high noise, thick, more edges)

Plus: copy Freestyle reference to output dir for easy comparison.
"""
import bpy, math, os, random, shutil

OUT = "/Users/loudonstearns/Documents/The Palace/Projects/BLUELINE/proofs/blender-handdrawn/followups/grease-pencil-lineart"
FREESTYLE_REF = "/Users/loudonstearns/Documents/The Palace/Projects/BLUELINE/proofs/blender-handdrawn/catalog/lines/9_confident_min_wobble.png"
os.makedirs(OUT, exist_ok=True)
RES = (560, 700)

# Copy Freestyle reference into output dir
if os.path.exists(FREESTYLE_REF):
    shutil.copy2(FREESTYLE_REF, os.path.join(OUT, "REF_freestyle_9_confident_min_wobble.png"))
    print("  Copied Freestyle reference")

def eevee():
    items = [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items]
    for c in ('BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE'):
        if c in items: return c
    return items[0]

def ink_mat():
    m = bpy.data.materials.new("paper"); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    em = nt.nodes.new('ShaderNodeEmission'); em.inputs['Color'].default_value = (0.96, 0.96, 0.96, 1)
    out = nt.nodes.new('ShaderNodeOutputMaterial'); nt.links.new(em.outputs['Emission'], out.inputs['Surface']); return m

def build_city():
    """Identical to cat_stills_lines.py city — flat scene root collection."""
    random.seed(7); pm = ink_mat()
    bpy.ops.mesh.primitive_plane_add(size=90, location=(0, 0, 0)); bpy.context.active_object.data.materials.append(pm)
    for side in (-1, 1):
        for i in range(7):
            y = 6 + i*7; h = random.uniform(9, 22); w = random.uniform(3.2, 4.6)
            bpy.ops.mesh.primitive_cube_add(size=1, location=(side*6.5, y, h/2))
            b = bpy.context.active_object; b.scale = (w, random.uniform(3.5, 5), h); b.data.materials.append(pm)
            bpy.ops.mesh.primitive_cube_add(size=1, location=(side*6.5, y-2, h*0.55))
            f = bpy.context.active_object; f.scale = (w*0.55, 0.4, h*0.5); f.data.materials.append(pm)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.55, depth=2, location=(0.4, 11, 1.2)); bpy.context.active_object.data.materials.append(pm)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.5, location=(0.4, 11, 2.5)); bpy.context.active_object.data.materials.append(pm)
    d = bpy.data.lights.new('S', 'SUN'); d.energy = 5; o = bpy.data.objects.new('S', d); bpy.context.collection.objects.link(o)
    o.rotation_euler = (math.radians(58), math.radians(8), math.radians(35))
    cd = bpy.data.cameras.new('C'); cd.lens = 26; c = bpy.data.objects.new('C', cd); bpy.context.collection.objects.link(c)
    c.location = (0.4, -7, 1.5); c.rotation_euler = (math.radians(86), 0, 0); c.rotation_euler.rotate_axis('Z', math.radians(-8))
    bpy.context.scene.camera = c
    w = bpy.data.worlds.new('W'); bpy.context.scene.world = w; w.use_nodes = True
    w.node_tree.nodes.get('Background').inputs['Color'].default_value = (1, 1, 1, 1)

def build_gp(radius=0.025, crease_deg=20):
    """
    Add GP v3 object with Line Art modifier.
    KEY LEARNINGS:
      - Use default 'Black' material (configure it, don't replace it)
      - Use default 'Layer' as target_layer
      - source_type='SCENE' works headless; COLLECTION with child-coll does NOT
      - radius must be scaled to scene (~0.025 for 20-unit buildings)
    """
    bpy.ops.object.grease_pencil_add(type='EMPTY')
    gp = bpy.context.active_object

    # Configure the auto-created default material
    mat = gp.data.materials[0]
    bpy.data.materials.create_gpencil_data(mat)
    gpm = mat.grease_pencil
    gpm.show_stroke = True; gpm.show_fill = False
    gpm.color = (0, 0, 0, 1); gpm.mode = 'LINE'; gpm.stroke_style = 'SOLID'

    # Line Art modifier
    bpy.ops.object.modifier_add(type='LINEART')
    mod = gp.modifiers[-1]
    mod.source_type = 'SCENE'             # SCENE works headless; COLLECTION does not
    mod.use_contour   = True
    mod.use_crease    = True
    mod.use_loose     = True
    mod.use_edge_mark = True
    mod.use_intersection = True
    mod.crease_threshold = math.radians(crease_deg)
    mod.target_layer  = gp.data.layers[0].name  # 'Layer'
    mod.target_material = mat
    mod.radius  = radius
    mod.opacity = 1.0
    mod.use_cache = False

    return gp, mod

def add_noise(gp, factor=0.3, noise_scale=1.5, use_random=True):
    """GREASE_PENCIL_NOISE: factor=position offset, noise_scale=spatial frequency."""
    bpy.context.view_layer.objects.active = gp
    bpy.ops.object.modifier_add(type='GREASE_PENCIL_NOISE')
    m = gp.modifiers[-1]; m.name = "Noise"
    m.factor       = factor       # position offset amplitude
    m.noise_scale  = noise_scale  # spatial scale of noise
    m.use_random   = use_random
    return m

def add_thickness(gp, thickness=20):
    """GREASE_PENCIL_THICKNESS: thickness in pixels."""
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

# ── VARIANT A: Clean fine line ────────────────────────────────────────────────
print("\n=== VARIANT A: Clean fine line ===")
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.render.engine = eevee()
build_city()
gp_a, mod_a = build_gp(radius=0.020, crease_deg=22)
add_noise(gp_a, factor=0.06, noise_scale=1.0)
add_thickness(gp_a, thickness=8)
render("GP_A_fine_line")

# ── VARIANT B: Confident calligraphic (the Freestyle #9 target) ───────────────
print("\n=== VARIANT B: Confident calligraphic ===")
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.render.engine = eevee()
build_city()
gp_b, mod_b = build_gp(radius=0.030, crease_deg=20)
add_noise(gp_b, factor=0.20, noise_scale=1.6)
add_thickness(gp_b, thickness=18)
render("GP_B_confident_calligraphic")

# ── VARIANT C: Heavy brush / expressive ──────────────────────────────────────
print("\n=== VARIANT C: Heavy brush ===")
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.render.engine = eevee()
build_city()
gp_c, mod_c = build_gp(radius=0.042, crease_deg=17)
add_noise(gp_c, factor=0.45, noise_scale=2.2)
add_thickness(gp_c, thickness=35)
render("GP_C_heavy_brush")

print("\nALL FINAL VARIANTS DONE")
