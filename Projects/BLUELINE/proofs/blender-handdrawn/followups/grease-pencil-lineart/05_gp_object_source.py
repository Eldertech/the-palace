"""
Test: Use source_type='OBJECT' on a single cube to confirm the city geometry
      can be targeted. Then try COLLECTION with a proper child collection.
Also investigate why city scene with white emission material looks blank even
with GP strokes — the mesh is white-on-white. Try a different background approach.
"""
import bpy, math, os, random

OUT = "/Users/loudonstearns/Documents/The Palace/Projects/BLUELINE/proofs/blender-handdrawn/followups/grease-pencil-lineart"

def eevee():
    items = [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items]
    for c in ('BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE'):
        if c in items: return c
    return items[0]

# ── TEST 4: Single cube OBJECT source — confirm GP fires ─────────────────────
print("\n=== TEST 4: Single cube, OBJECT source ===")
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.render.engine = eevee()

bpy.ops.mesh.primitive_cube_add(size=2, location=(0, 0, 0))
cube = bpy.context.active_object

# White emission (same as city)
pm = bpy.data.materials.new("paper"); pm.use_nodes = True; nt = pm.node_tree; nt.nodes.clear()
em = nt.nodes.new('ShaderNodeEmission'); em.inputs['Color'].default_value = (0.96, 0.96, 0.96, 1)
out_node = nt.nodes.new('ShaderNodeOutputMaterial'); nt.links.new(em.outputs['Emission'], out_node.inputs['Surface'])
cube.data.materials.append(pm)

cd = bpy.data.cameras.new('C'); c = bpy.data.objects.new('C', cd); bpy.context.collection.objects.link(c)
c.location = (4, -4, 3); c.rotation_euler = (math.radians(65), 0, math.radians(45))
bpy.context.scene.camera = c

w = bpy.data.worlds.new('W'); bpy.context.scene.world = w; w.use_nodes = True
w.node_tree.nodes.get('Background').inputs['Color'].default_value = (1, 1, 1, 1)

# GP object
bpy.ops.object.grease_pencil_add(type='EMPTY')
gp4 = bpy.context.active_object
mat4 = gp4.data.materials[0]
bpy.data.materials.create_gpencil_data(mat4)
gpm4 = mat4.grease_pencil
gpm4.show_stroke = True; gpm4.show_fill = False
gpm4.color = (0, 0, 0, 1); gpm4.mode = 'LINE'; gpm4.stroke_style = 'SOLID'

bpy.ops.object.modifier_add(type='LINEART')
mod4 = gp4.modifiers[-1]
mod4.source_type = 'OBJECT'
mod4.source_object = cube
mod4.use_contour = True; mod4.use_crease = True
mod4.crease_threshold = math.radians(20)
mod4.target_layer = gp4.data.layers[0].name
mod4.target_material = mat4
mod4.radius = 0.006

sc4 = bpy.context.scene
sc4.render.resolution_x, sc4.render.resolution_y = 400, 400
sc4.render.image_settings.file_format = 'PNG'
sc4.render.filepath = os.path.join(OUT, "test4_single_cube.png")
try: sc4.view_settings.view_transform = 'Standard'
except: pass
bpy.ops.render.render(write_still=True)
print("  wrote test4_single_cube.png")

# ── TEST 5: Build city, use OBJECT source on ONE cube ──────────────────────
print("\n=== TEST 5: City scene, OBJECT source on one cube ===")
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.render.engine = eevee()

random.seed(7)
pm = bpy.data.materials.new("paper"); pm.use_nodes = True; nt = pm.node_tree; nt.nodes.clear()
em = nt.nodes.new('ShaderNodeEmission'); em.inputs['Color'].default_value = (0.96, 0.96, 0.96, 1)
out_node = nt.nodes.new('ShaderNodeOutputMaterial'); nt.links.new(em.outputs['Emission'], out_node.inputs['Surface'])

bpy.ops.mesh.primitive_plane_add(size=90, location=(0, 0, 0))
bpy.context.active_object.data.materials.append(pm)
first_cube = None
for side in (-1, 1):
    for i in range(7):
        y = 6 + i*7; h = random.uniform(9, 22); w = random.uniform(3.2, 4.6)
        bpy.ops.mesh.primitive_cube_add(size=1, location=(side*6.5, y, h/2))
        b = bpy.context.active_object; b.scale = (w, random.uniform(3.5, 5), h); b.data.materials.append(pm)
        if first_cube is None: first_cube = b
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

print(f"  first_cube: {first_cube.name if first_cube else 'None'}")
print(f"  All mesh objects: {[o.name for o in bpy.context.scene.objects if o.type == 'MESH']}")

bpy.ops.object.grease_pencil_add(type='EMPTY')
gp5 = bpy.context.active_object
mat5 = gp5.data.materials[0]
bpy.data.materials.create_gpencil_data(mat5)
gpm5 = mat5.grease_pencil
gpm5.show_stroke = True; gpm5.show_fill = False
gpm5.color = (0, 0, 0, 1); gpm5.mode = 'LINE'; gpm5.stroke_style = 'SOLID'

bpy.ops.object.modifier_add(type='LINEART')
mod5 = gp5.modifiers[-1]
mod5.source_type = 'OBJECT'
mod5.source_object = first_cube
mod5.use_contour = True; mod5.use_crease = True
mod5.crease_threshold = math.radians(20)
mod5.target_layer = gp5.data.layers[0].name
mod5.target_material = mat5
mod5.radius = 0.006

sc5 = bpy.context.scene
sc5.render.resolution_x, sc5.render.resolution_y = 560, 700
sc5.render.image_settings.file_format = 'PNG'
sc5.render.filepath = os.path.join(OUT, "test5_city_one_cube.png")
try: sc5.view_settings.view_transform = 'Standard'
except: pass
bpy.ops.render.render(write_still=True)
print("  wrote test5_city_one_cube.png")

print("\nDONE")
