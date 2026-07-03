"""
Fix: make GP strokes render as dark/black.
Approaches:
  A. show_in_front=True on GP object (renders on top of geometry)
  B. GREASE_PENCIL_OPACITY with hardness_factor=2.0 (>1 = darken/strengthen)
  C. Tint modifier (GREASE_PENCIL_TINT) to set absolute black
  D. Use opacity * hardness_factor combination
"""
import bpy, math, os, random

OUT = "/Users/loudonstearns/Documents/The Palace/Projects/BLUELINE/proofs/blender-handdrawn/followups/grease-pencil-lineart"

def eevee():
    items = [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items]
    for c in ('BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE'):
        if c in items: return c
    return items[0]

def build_city():
    random.seed(7)
    pm = bpy.data.materials.new("paper"); pm.use_nodes = True; nt = pm.node_tree; nt.nodes.clear()
    em = nt.nodes.new('ShaderNodeEmission'); em.inputs['Color'].default_value = (0.96, 0.96, 0.96, 1)
    out = nt.nodes.new('ShaderNodeOutputMaterial'); nt.links.new(em.outputs['Emission'], out.inputs['Surface'])
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

def build_base_gp(radius=0.030):
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
    mod.crease_threshold = math.radians(20)
    mod.target_layer = gp.data.layers[0].name
    mod.target_material = mat
    mod.radius = radius; mod.opacity = 1.0
    return gp, mod, mat

def render(name):
    sc = bpy.context.scene
    try: sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'
    except: pass
    sc.render.resolution_x, sc.render.resolution_y = 560, 700
    try: sc.eevee.taa_render_samples = 32
    except: pass
    sc.render.image_settings.file_format = 'PNG'
    sc.render.filepath = os.path.join(OUT, f"{name}.png")
    bpy.ops.render.render(write_still=True)
    print(f"  wrote {name}.png")

# ── Introspect TINT modifier ───────────────────────────────────────────────────
print("\n=== Tint modifier props ===")
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.object.grease_pencil_add(type='EMPTY')
gp_t = bpy.context.active_object
bpy.ops.object.modifier_add(type='GREASE_PENCIL_TINT')
tint = gp_t.modifiers[-1]
print(f"  Tint props: {[p.identifier for p in tint.bl_rna.properties if p.identifier not in ('rna_type','name','type','show_viewport','show_render','show_in_editmode','show_on_cage','show_expanded','is_active','use_pin_to_last','is_override_data','use_apply_on_spline','execution_time','persistent_uid')]}")

# ── TEST A: show_in_front = True ──────────────────────────────────────────────
print("\n=== TEST A: show_in_front=True ===")
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.render.engine = eevee()
build_city()
gp_a, mod_a, mat_a = build_base_gp(radius=0.030)
gp_a.show_in_front = True  # render GP strokes in front of everything
print(f"  show_in_front: {gp_a.show_in_front}")
bpy.ops.object.modifier_add(type='GREASE_PENCIL_NOISE')
n = gp_a.modifiers[-1]; n.factor = 0.20; n.noise_scale = 1.6; n.use_random = True
bpy.ops.object.modifier_add(type='GREASE_PENCIL_THICKNESS')
t = gp_a.modifiers[-1]; t.thickness = 18
render("testA_show_in_front")

# ── TEST B: Tint modifier with black color + NORMAL mode ─────────────────────
print("\n=== TEST B: TINT modifier forcing black ===")
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.render.engine = eevee()
build_city()
gp_b, mod_b, mat_b = build_base_gp(radius=0.030)
bpy.context.view_layer.objects.active = gp_b
bpy.ops.object.modifier_add(type='GREASE_PENCIL_TINT')
tint_b = gp_b.modifiers[-1]; tint_b.name = "Tint"
# Try to set tint color
for attr in ('color', 'tint_color', 'factor', 'tint_factor', 'mode', 'tint_mode'):
    try:
        val = getattr(tint_b, attr)
        print(f"  tint.{attr} = {val!r}")
    except: pass
try: tint_b.color = (0, 0, 0, 1)
except:
    try: tint_b.tint_color = (0, 0, 0)
    except: pass
try: tint_b.factor = 1.0
except: pass
try: tint_b.mode = 'UNIFORM'
except: pass
bpy.ops.object.modifier_add(type='GREASE_PENCIL_NOISE')
n = gp_b.modifiers[-1]; n.factor = 0.20; n.noise_scale = 1.6; n.use_random = True
bpy.ops.object.modifier_add(type='GREASE_PENCIL_THICKNESS')
t = gp_b.modifiers[-1]; t.thickness = 18
render("testB_tint_black")

# ── TEST C: hardness_factor on opacity modifier ────────────────────────────────
print("\n=== TEST C: OPACITY hardness_factor=2.0 ===")
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.render.engine = eevee()
build_city()
gp_c, mod_c, mat_c = build_base_gp(radius=0.030)
bpy.context.view_layer.objects.active = gp_c
bpy.ops.object.modifier_add(type='GREASE_PENCIL_OPACITY')
op_c = gp_c.modifiers[-1]; op_c.name = "Opacity"
try: op_c.hardness_factor = 2.0; print(f"  hardness_factor set to 2.0")
except Exception as e: print(f"  hardness_factor: {e}")
try: op_c.color_factor = 0.0; print(f"  color_factor set to 0.0 (darken)")
except Exception as e: print(f"  color_factor: {e}")
bpy.ops.object.modifier_add(type='GREASE_PENCIL_NOISE')
n = gp_c.modifiers[-1]; n.factor = 0.20; n.noise_scale = 1.6; n.use_random = True
bpy.ops.object.modifier_add(type='GREASE_PENCIL_THICKNESS')
t = gp_c.modifiers[-1]; t.thickness = 18
render("testC_opacity_hardness")

print("\nDONE")
