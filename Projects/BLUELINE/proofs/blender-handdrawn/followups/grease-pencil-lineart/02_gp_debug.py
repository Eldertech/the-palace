"""
Debug: why GP Line Art strokes don't appear in the render.
Try multiple approaches:
  1. Check modifier target_layer matches actual layer name
  2. Try bpy.ops.lineart.bake_strokes() before render
  3. Try scene frame_set to force depsgraph
  4. Verify GP material is assigned and correct
  5. Check if GP object is in the right collection vs source collection
"""
import bpy, math, os, random

OUT = "/Users/loudonstearns/Documents/The Palace/Projects/BLUELINE/proofs/blender-handdrawn/followups/grease-pencil-lineart"

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

# ────────────────────────────────────────────────────────────────────────────

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.render.engine = eevee()
build_city()

scene_col = bpy.context.scene.collection
print(f"\nScene collection: {scene_col.name}")
print(f"Objects in scene: {[o.name for o in bpy.context.scene.objects]}")

# Create GP material
mat = bpy.data.materials.new("GP_Ink")
bpy.data.materials.create_gpencil_data(mat)
gpm = mat.grease_pencil
gpm.show_stroke = True
gpm.show_fill = False
gpm.color = (0, 0, 0, 1)
gpm.mode = 'LINE'
gpm.stroke_style = 'SOLID'
print(f"\nGP material: {mat.name}")
print(f"  show_stroke={gpm.show_stroke}, color={list(gpm.color)}")
print(f"  is_stroke_visible={gpm.is_stroke_visible}")

# Add GP object
bpy.ops.object.grease_pencil_add(type='EMPTY')
gp_obj = bpy.context.active_object
gp_data = gp_obj.data
print(f"\nGP object: {gp_obj.name}, collection: {list(gp_obj.users_collection)}")

# Add layer
bpy.ops.grease_pencil.layer_add()
layer = gp_data.layers[-1]
layer.name = "Lines"
print(f"Layer name: '{layer.name}'")
print(f"All layers: {[l.name for l in gp_data.layers]}")

# Assign material
gp_obj.data.materials.append(mat)
print(f"GP materials: {[m.name for m in gp_obj.data.materials]}")
print(f"Material index: {gp_obj.active_material_index}")

# Add Line Art modifier
bpy.ops.object.modifier_add(type='LINEART')
mod = gp_obj.modifiers[-1]
print(f"\nModifier: {mod.name}, type: {mod.type}")

# IMPORTANT: source_type = 'SCENE' might be more reliable than COLLECTION
# Try SCENE first
mod.source_type = 'SCENE'
print(f"source_type: {mod.source_type}")

mod.use_contour   = True
mod.use_crease    = True
mod.use_loose     = True
mod.use_edge_mark = True
mod.use_intersection = True
mod.crease_threshold = math.radians(20)

# Critical: target_layer and target_material MUST be set correctly
print(f"\nBefore setting: target_layer='{mod.target_layer}', target_material={mod.target_material}")
mod.target_layer = "Lines"
mod.target_material = mat
print(f"After setting:  target_layer='{mod.target_layer}', target_material={mod.target_material}")

mod.radius = 0.004
mod.opacity = 1.0
mod.use_cache = False

# ── Approach 1: Try baking strokes before render ─────────────────────────────

print("\n=== Approach 1: bake strokes ===")
print(f"Available lineart ops: {[n for n in dir(bpy.ops.lineart) if not n.startswith('_')]}")

# Try lineart bake
try:
    bpy.ops.lineart.bake_strokes()
    print("  bake_strokes -> OK")
except Exception as e:
    print(f"  bake_strokes failed: {e}")

try:
    bpy.ops.lineart.bake_strokes_all()
    print("  bake_strokes_all -> OK")
except Exception as e:
    print(f"  bake_strokes_all failed: {e}")

# ── Force depsgraph update ────────────────────────────────────────────────────
print("\n=== Force depsgraph ===")
bpy.context.scene.frame_set(1)
bpy.context.view_layer.update()
dg = bpy.context.evaluated_depsgraph_get()
dg.update()
print("  depsgraph updated")

# Check if strokes were generated in the layer
print(f"\nGP data strokes check:")
try:
    gp_eval = gp_obj.evaluated_get(dg)
    print(f"  evaluated GP: {gp_eval}")
    eval_data = gp_eval.data
    print(f"  layers: {list(eval_data.layers)}")
    for layer in eval_data.layers:
        print(f"    layer '{layer.name}': has frames? checking...")
        # v3 GP uses frames differently
        try:
            print(f"      frames: {list(layer.frames)}")
        except Exception as e:
            print(f"      frames error: {e}")
except Exception as e:
    print(f"  eval error: {e}")

# ── Render approach 1 ─────────────────────────────────────────────────────────
print("\n=== Rendering approach 1 (SCENE source, baked) ===")
sc = bpy.context.scene
try: sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'
except: pass
sc.render.resolution_x, sc.render.resolution_y = 560, 700
try: sc.eevee.taa_render_samples = 32
except: pass
sc.render.image_settings.file_format = 'PNG'
sc.render.filepath = os.path.join(OUT, "debug_approach1_scene_source.png")
bpy.ops.render.render(write_still=True)
print("  wrote debug_approach1_scene_source.png")

# ── Approach 2: Use OBJECT source instead ────────────────────────────────────
# Source type OBJECT targeting a specific mesh
print("\n=== Approach 2: OBJECT source ===")
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.render.engine = eevee()
build_city()

# Find a city building to use as source
cubes = [o for o in bpy.context.scene.objects if o.type == 'MESH' and 'Cube' in o.name]
print(f"  Mesh objects: {[o.name for o in bpy.context.scene.objects if o.type == 'MESH']}")

mat2 = bpy.data.materials.new("GP_Ink2")
bpy.data.materials.create_gpencil_data(mat2)
mat2.grease_pencil.show_stroke = True
mat2.grease_pencil.show_fill = False
mat2.grease_pencil.color = (0, 0, 0, 1)

bpy.ops.object.grease_pencil_add(type='EMPTY')
gp2 = bpy.context.active_object
gp_data2 = gp2.data

bpy.ops.grease_pencil.layer_add()
gp_data2.layers[-1].name = "Lines"
gp2.data.materials.append(mat2)

bpy.ops.object.modifier_add(type='LINEART')
mod2 = gp2.modifiers[-1]
mod2.source_type = 'COLLECTION'
mod2.source_collection = bpy.context.scene.collection
mod2.use_contour = True; mod2.use_crease = True
mod2.crease_threshold = math.radians(20)
mod2.target_layer = "Lines"
mod2.target_material = mat2
mod2.radius = 0.004
mod2.use_cache = False

# Force bake
try:
    bpy.context.view_layer.objects.active = gp2
    bpy.ops.lineart.bake_strokes()
    print("  bake -> OK")
except Exception as e:
    print(f"  bake failed: {e}")

bpy.context.scene.frame_set(1)
bpy.context.view_layer.update()

sc = bpy.context.scene
sc.render.resolution_x, sc.render.resolution_y = 560, 700
sc.render.image_settings.file_format = 'PNG'
sc.render.filepath = os.path.join(OUT, "debug_approach2_collection_baked.png")
try: sc.view_settings.view_transform = 'Standard'
except: pass
bpy.ops.render.render(write_still=True)
print("  wrote debug_approach2_collection_baked.png")

# ── Approach 3: Suzanne (simpler geometry) ──────────────────────────────────
print("\n=== Approach 3: Simple Suzanne test ===")
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.render.engine = eevee()

# Just add Suzanne and a camera
bpy.ops.mesh.primitive_monkey_add(size=2, location=(0, 0, 0))
monkey = bpy.context.active_object

# Minimal camera
cd = bpy.data.cameras.new('C'); c = bpy.data.objects.new('C', cd); bpy.context.collection.objects.link(c)
c.location = (0, -5, 0); c.rotation_euler = (math.radians(90), 0, 0)
bpy.context.scene.camera = c

w = bpy.data.worlds.new('W'); bpy.context.scene.world = w; w.use_nodes = True
w.node_tree.nodes.get('Background').inputs['Color'].default_value = (1, 1, 1, 1)

mat3 = bpy.data.materials.new("GP_Ink3")
bpy.data.materials.create_gpencil_data(mat3)
mat3.grease_pencil.show_stroke = True
mat3.grease_pencil.show_fill = False
mat3.grease_pencil.color = (0, 0, 0, 1)

bpy.ops.object.grease_pencil_add(type='EMPTY')
gp3 = bpy.context.active_object
gp_data3 = gp3.data

bpy.ops.grease_pencil.layer_add()
layer3 = gp_data3.layers[-1]
layer3.name = "Lines"
gp3.data.materials.append(mat3)

bpy.ops.object.modifier_add(type='LINEART')
mod3 = gp3.modifiers[-1]
mod3.source_type = 'OBJECT'
mod3.source_object = monkey
mod3.use_contour = True; mod3.use_crease = True
mod3.target_layer = "Lines"
mod3.target_material = mat3
mod3.radius = 0.006

# Bake
try:
    bpy.context.view_layer.objects.active = gp3
    bpy.ops.lineart.bake_strokes()
    print(f"  Suzanne bake -> OK")
except Exception as e:
    print(f"  Suzanne bake failed: {e}")

bpy.context.scene.frame_set(1)
bpy.context.view_layer.update()

sc3 = bpy.context.scene
sc3.render.resolution_x, sc3.render.resolution_y = 560, 560
sc3.render.image_settings.file_format = 'PNG'
sc3.render.filepath = os.path.join(OUT, "debug_approach3_suzanne.png")
try: sc3.view_settings.view_transform = 'Standard'
except: pass
bpy.ops.render.render(write_still=True)
print("  wrote debug_approach3_suzanne.png")

print("\nDEBUG DONE")
