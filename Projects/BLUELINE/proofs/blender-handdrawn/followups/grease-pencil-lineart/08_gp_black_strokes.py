"""
Fix: GP strokes appear grey/light because EEVEE blends them with white geometry.
Solutions to try:
  1. Set material blend_mode to OPAQUE (not alpha blend)
  2. Check if mix_factor or other color settings affect stroke darkness
  3. Try setting stroke color to pure black with alpha=1
  4. Add a GREASE_PENCIL_OPACITY modifier with full opacity
  5. Check if 'is_stroke_visible' properly forces full black rendering
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

# ── Introspect material properties more carefully ────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.object.grease_pencil_add(type='EMPTY')
gp = bpy.context.active_object
mat = gp.data.materials[0]
bpy.data.materials.create_gpencil_data(mat)

print("\n=== Material top-level properties ===")
for prop in mat.bl_rna.properties:
    if prop.identifier in ('rna_type',): continue
    try:
        val = getattr(mat, prop.identifier)
        if 'blend' in prop.identifier.lower() or 'shadow' in prop.identifier.lower() or 'surface' in prop.identifier.lower():
            print(f"  {prop.identifier} = {val!r}")
    except: pass

print("\n=== blend_method values ===")
try:
    for item in mat.bl_rna.properties['blend_method'].enum_items:
        print(f"  {item.identifier}: {item.name}")
except Exception as e:
    print(f"  ERROR: {e}")

# ── TEST 8: Explicit blend_method = OPAQUE ───────────────────────────────────
print("\n=== TEST 8: blend_method=OPAQUE + stroke_depth_offset adjustment ===")
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.render.engine = eevee()
build_city()

bpy.ops.object.grease_pencil_add(type='EMPTY')
gp8 = bpy.context.active_object
mat8 = gp8.data.materials[0]
bpy.data.materials.create_gpencil_data(mat8)
gpm8 = mat8.grease_pencil
gpm8.show_stroke = True; gpm8.show_fill = False
gpm8.color = (0, 0, 0, 1)
gpm8.mode = 'LINE'; gpm8.stroke_style = 'SOLID'

# Try setting blend_method on the material
try:
    mat8.blend_method = 'OPAQUE'
    print(f"  blend_method set to: {mat8.blend_method}")
except Exception as e:
    print(f"  blend_method error: {e}")

# Also try surface render method
try:
    print(f"  surface_render_method: {mat8.surface_render_method}")
    mat8.surface_render_method = 'DITHERED'
    print(f"  surface_render_method set")
except Exception as e:
    print(f"  surface_render_method error: {e}")

bpy.ops.object.modifier_add(type='LINEART')
mod8 = gp8.modifiers[-1]
mod8.source_type = 'SCENE'
mod8.use_contour = True; mod8.use_crease = True; mod8.use_loose = True
mod8.crease_threshold = math.radians(20)
mod8.target_layer = gp8.data.layers[0].name
mod8.target_material = mat8
mod8.radius = 0.030
mod8.stroke_depth_offset = 0.001  # pull strokes slightly toward camera

bpy.ops.object.modifier_add(type='GREASE_PENCIL_NOISE')
noise8 = gp8.modifiers[-1]; noise8.name = "Noise"
noise8.factor = 0.20; noise8.noise_scale = 1.6; noise8.use_random = True

bpy.ops.object.modifier_add(type='GREASE_PENCIL_THICKNESS')
thk8 = gp8.modifiers[-1]; thk8.name = "Thickness"
thk8.thickness = 18

sc8 = bpy.context.scene
sc8.render.resolution_x, sc8.render.resolution_y = 560, 700
sc8.render.image_settings.file_format = 'PNG'
sc8.render.filepath = os.path.join(OUT, "test8_opaque_blend.png")
try: sc8.view_settings.view_transform = 'Standard'
except: pass
bpy.ops.render.render(write_still=True)
print("  wrote test8_opaque_blend.png")

# ── TEST 9: Use GREASE_PENCIL_OPACITY modifier for full opacity ───────────────
print("\n=== TEST 9: GREASE_PENCIL_OPACITY modifier ===")
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.render.engine = eevee()
build_city()

bpy.ops.object.grease_pencil_add(type='EMPTY')
gp9 = bpy.context.active_object
mat9 = gp9.data.materials[0]
bpy.data.materials.create_gpencil_data(mat9)
gpm9 = mat9.grease_pencil
gpm9.show_stroke = True; gpm9.show_fill = False
gpm9.color = (0, 0, 0, 1); gpm9.mode = 'LINE'; gpm9.stroke_style = 'SOLID'

bpy.ops.object.modifier_add(type='LINEART')
mod9 = gp9.modifiers[-1]
mod9.source_type = 'SCENE'
mod9.use_contour = True; mod9.use_crease = True; mod9.use_loose = True
mod9.crease_threshold = math.radians(20)
mod9.target_layer = gp9.data.layers[0].name
mod9.target_material = mat9
mod9.radius = 0.030
mod9.opacity = 1.0

# Add OPACITY modifier to force full alpha
bpy.ops.object.modifier_add(type='GREASE_PENCIL_OPACITY')
op9 = gp9.modifiers[-1]; op9.name = "Opacity"
print(f"  Opacity mod props: {[p.identifier for p in op9.bl_rna.properties if p.identifier not in ('rna_type','name','type','show_viewport','show_render','show_in_editmode','show_on_cage','show_expanded','is_active','use_pin_to_last','is_override_data','use_apply_on_spline','execution_time','persistent_uid')]}")
try: op9.opacity = 1.0
except: pass
try: op9.factor = 1.0
except: pass

bpy.ops.object.modifier_add(type='GREASE_PENCIL_NOISE')
n9 = gp9.modifiers[-1]; n9.factor = 0.20; n9.noise_scale = 1.6; n9.use_random = True

bpy.ops.object.modifier_add(type='GREASE_PENCIL_THICKNESS')
t9 = gp9.modifiers[-1]; t9.thickness = 20

sc9 = bpy.context.scene
sc9.render.resolution_x, sc9.render.resolution_y = 560, 700
sc9.render.image_settings.file_format = 'PNG'
sc9.render.filepath = os.path.join(OUT, "test9_opacity_modifier.png")
try: sc9.view_settings.view_transform = 'Standard'
except: pass
bpy.ops.render.render(write_still=True)
print("  wrote test9_opacity_modifier.png")

# ── TEST 10: Check GP material color attr vs render ──────────────────────────
# Try mix_factor = 0.0 (no white mix)
print("\n=== TEST 10: mix_factor=0 on GP material ===")
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.render.engine = eevee()
build_city()

bpy.ops.object.grease_pencil_add(type='EMPTY')
gp10 = bpy.context.active_object
mat10 = gp10.data.materials[0]
bpy.data.materials.create_gpencil_data(mat10)
gpm10 = mat10.grease_pencil
gpm10.show_stroke = True; gpm10.show_fill = False
gpm10.color = (0, 0, 0, 1)
gpm10.mix_factor = 0.0       # no color mixing
gpm10.mix_stroke_factor = 0.0
gpm10.mode = 'LINE'; gpm10.stroke_style = 'SOLID'
# Also check mix_color
try:
    gpm10.mix_color = (0, 0, 0, 1)
    print(f"  mix_color set to black")
except: pass

print(f"  color: {list(gpm10.color)}")
print(f"  mix_factor: {gpm10.mix_factor}")
print(f"  is_stroke_visible: {gpm10.is_stroke_visible}")

bpy.ops.object.modifier_add(type='LINEART')
mod10 = gp10.modifiers[-1]
mod10.source_type = 'SCENE'
mod10.use_contour = True; mod10.use_crease = True; mod10.use_loose = True
mod10.crease_threshold = math.radians(20)
mod10.target_layer = gp10.data.layers[0].name
mod10.target_material = mat10
mod10.radius = 0.035

bpy.ops.object.modifier_add(type='GREASE_PENCIL_NOISE')
n10 = gp10.modifiers[-1]; n10.factor = 0.20; n10.noise_scale = 1.6; n10.use_random = True
bpy.ops.object.modifier_add(type='GREASE_PENCIL_THICKNESS')
t10 = gp10.modifiers[-1]; t10.thickness = 20

sc10 = bpy.context.scene
sc10.render.resolution_x, sc10.render.resolution_y = 560, 700
sc10.render.image_settings.file_format = 'PNG'
sc10.render.filepath = os.path.join(OUT, "test10_mix_factor_zero.png")
try: sc10.view_settings.view_transform = 'Standard'
except: pass
bpy.ops.render.render(write_still=True)
print("  wrote test10_mix_factor_zero.png")

print("\nDONE")
