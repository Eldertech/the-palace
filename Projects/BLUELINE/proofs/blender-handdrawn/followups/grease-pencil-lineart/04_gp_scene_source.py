"""
Test: SCENE source_type (targets everything in scene) vs COLLECTION.
Also test: whether moving GP to a child collection vs keeping in scene root matters.
Uses city geometry. Tries different source_type values.
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

def build_scene():
    """Build everything in Scene Collection (simple, no child collections)."""
    random.seed(7); pm = ink_mat()
    bpy.ops.mesh.primitive_plane_add(size=90, location=(0, 0, 0))
    bpy.context.active_object.data.materials.append(pm)
    for side in (-1, 1):
        for i in range(7):
            y = 6 + i*7; h = random.uniform(9, 22); w = random.uniform(3.2, 4.6)
            bpy.ops.mesh.primitive_cube_add(size=1, location=(side*6.5, y, h/2))
            b = bpy.context.active_object; b.scale = (w, random.uniform(3.5, 5), h); b.data.materials.append(pm)
            bpy.ops.mesh.primitive_cube_add(size=1, location=(side*6.5, y-2, h*0.55))
            f = bpy.context.active_object; f.scale = (w*0.55, 0.4, h*0.5); f.data.materials.append(pm)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.55, depth=2, location=(0.4, 11, 1.2))
    bpy.context.active_object.data.materials.append(pm)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.5, location=(0.4, 11, 2.5))
    bpy.context.active_object.data.materials.append(pm)

def build_camera_light():
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

# ── TEST 1: SCENE source type (no collection needed) ─────────────────────────
print("\n=== TEST 1: source_type='SCENE' ===")
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.render.engine = eevee()
build_scene()
build_camera_light()

print(f"  Scene objects: {len(list(bpy.context.scene.objects))}")

bpy.ops.object.grease_pencil_add(type='EMPTY')
gp = bpy.context.active_object
mat = gp.data.materials[0]
bpy.data.materials.create_gpencil_data(mat)
gpm = mat.grease_pencil
gpm.show_stroke = True; gpm.show_fill = False
gpm.color = (0, 0, 0, 1); gpm.mode = 'LINE'; gpm.stroke_style = 'SOLID'

bpy.ops.object.modifier_add(type='LINEART')
mod = gp.modifiers[-1]
mod.source_type = 'SCENE'  # Key: SCENE targets everything
print(f"  source_type: {mod.source_type}")
mod.use_contour   = True
mod.use_crease    = True
mod.crease_threshold = math.radians(20)
mod.target_layer = gp.data.layers[0].name
mod.target_material = mat
mod.radius = 0.004

sc = bpy.context.scene
sc.render.resolution_x, sc.render.resolution_y = 560, 700
sc.render.image_settings.file_format = 'PNG'
sc.render.filepath = os.path.join(OUT, "test1_scene_source.png")
try: sc.view_settings.view_transform = 'Standard'
except: pass
bpy.ops.render.render(write_still=True)
print("  wrote test1_scene_source.png")

# ── TEST 2: Check if GP excludes itself from its own SCENE source ─────────────
# Introspect the available source_type enum values
print("\n=== Available source_type values ===")
for item in bpy.types.GreasePencilLineartModifier.bl_rna.properties['source_type'].enum_items:
    print(f"  {item.identifier}: {item.name}")

# ── TEST 3: source_type='COLLECTION', collection = scene root ─────────────────
print("\n=== TEST 3: source_type='COLLECTION', collection=Scene Collection ===")
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.render.engine = eevee()
build_scene()
build_camera_light()

bpy.ops.object.grease_pencil_add(type='EMPTY')
gp3 = bpy.context.active_object
mat3 = gp3.data.materials[0]
bpy.data.materials.create_gpencil_data(mat3)
gpm3 = mat3.grease_pencil
gpm3.show_stroke = True; gpm3.show_fill = False
gpm3.color = (0, 0, 0, 1); gpm3.mode = 'LINE'; gpm3.stroke_style = 'SOLID'

bpy.ops.object.modifier_add(type='LINEART')
mod3 = gp3.modifiers[-1]
mod3.source_type = 'COLLECTION'
scene_root = bpy.context.scene.collection
print(f"  Scene collection: '{scene_root.name}', type: {type(scene_root)}")
mod3.source_collection = scene_root  # this IS the scene root collection
mod3.use_contour = True; mod3.use_crease = True
mod3.crease_threshold = math.radians(20)
mod3.target_layer = gp3.data.layers[0].name
mod3.target_material = mat3
mod3.radius = 0.004

sc3 = bpy.context.scene
sc3.render.resolution_x, sc3.render.resolution_y = 560, 700
sc3.render.image_settings.file_format = 'PNG'
sc3.render.filepath = os.path.join(OUT, "test3_scene_root_collection.png")
try: sc3.view_settings.view_transform = 'Standard'
except: pass
bpy.ops.render.render(write_still=True)
print("  wrote test3_scene_root_collection.png")

print("\nDONE")
