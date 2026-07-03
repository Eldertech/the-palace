"""
Hypothesis: lines ARE rendering in city scene but radius too small to see.
Test with large radius + OBJECT source targeting a city cube in frame.
Also test: do ALL cubes work when listed via multiple OBJECT modifiers?
"""
import bpy, math, os, random

OUT = "/Users/loudonstearns/Documents/The Palace/Projects/BLUELINE/proofs/blender-handdrawn/followups/grease-pencil-lineart"

def eevee():
    items = [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items]
    for c in ('BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE'):
        if c in items: return c
    return items[0]

# ── TEST 6: City SCENE source, large radius 0.05 ────────────────────────────
print("\n=== TEST 6: City SCENE source, large radius ===")
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.render.engine = eevee()

random.seed(7)
pm = bpy.data.materials.new("paper"); pm.use_nodes = True; nt = pm.node_tree; nt.nodes.clear()
em = nt.nodes.new('ShaderNodeEmission'); em.inputs['Color'].default_value = (0.96, 0.96, 0.96, 1)
out_node = nt.nodes.new('ShaderNodeOutputMaterial'); nt.links.new(em.outputs['Emission'], out_node.inputs['Surface'])

bpy.ops.mesh.primitive_plane_add(size=90, location=(0, 0, 0)); bpy.context.active_object.data.materials.append(pm)
mesh_objs = []
for side in (-1, 1):
    for i in range(7):
        y = 6 + i*7; h = random.uniform(9, 22); w = random.uniform(3.2, 4.6)
        bpy.ops.mesh.primitive_cube_add(size=1, location=(side*6.5, y, h/2))
        b = bpy.context.active_object; b.scale = (w, random.uniform(3.5, 5), h); b.data.materials.append(pm)
        mesh_objs.append(b)
        bpy.ops.mesh.primitive_cube_add(size=1, location=(side*6.5, y-2, h*0.55))
        f = bpy.context.active_object; f.scale = (w*0.55, 0.4, h*0.5); f.data.materials.append(pm)
        mesh_objs.append(f)
bpy.ops.mesh.primitive_cylinder_add(radius=0.55, depth=2, location=(0.4, 11, 1.2)); bpy.context.active_object.data.materials.append(pm); mesh_objs.append(bpy.context.active_object)
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.5, location=(0.4, 11, 2.5)); bpy.context.active_object.data.materials.append(pm); mesh_objs.append(bpy.context.active_object)

d = bpy.data.lights.new('S', 'SUN'); d.energy = 5; o = bpy.data.objects.new('S', d); bpy.context.collection.objects.link(o)
o.rotation_euler = (math.radians(58), math.radians(8), math.radians(35))
cd = bpy.data.cameras.new('C'); cd.lens = 26; c = bpy.data.objects.new('C', cd); bpy.context.collection.objects.link(c)
c.location = (0.4, -7, 1.5); c.rotation_euler = (math.radians(86), 0, 0); c.rotation_euler.rotate_axis('Z', math.radians(-8))
bpy.context.scene.camera = c
w = bpy.data.worlds.new('W'); bpy.context.scene.world = w; w.use_nodes = True
w.node_tree.nodes.get('Background').inputs['Color'].default_value = (1, 1, 1, 1)

print(f"  Mesh objs in scene: {len(mesh_objs)}")
print(f"  All objects: {[o.name for o in bpy.context.scene.objects]}")

bpy.ops.object.grease_pencil_add(type='EMPTY')
gp6 = bpy.context.active_object
mat6 = gp6.data.materials[0]
bpy.data.materials.create_gpencil_data(mat6)
gpm6 = mat6.grease_pencil
gpm6.show_stroke = True; gpm6.show_fill = False
gpm6.color = (0, 0, 0, 1); gpm6.mode = 'LINE'; gpm6.stroke_style = 'SOLID'

bpy.ops.object.modifier_add(type='LINEART')
mod6 = gp6.modifiers[-1]
mod6.source_type = 'SCENE'
mod6.use_contour = True; mod6.use_crease = True; mod6.use_loose = True
mod6.crease_threshold = math.radians(20)
mod6.target_layer = gp6.data.layers[0].name
mod6.target_material = mat6
mod6.radius = 0.05  # LARGE radius — test visibility

sc6 = bpy.context.scene
sc6.render.resolution_x, sc6.render.resolution_y = 560, 700
sc6.render.image_settings.file_format = 'PNG'
sc6.render.filepath = os.path.join(OUT, "test6_scene_large_radius.png")
try: sc6.view_settings.view_transform = 'Standard'
except: pass
bpy.ops.render.render(write_still=True)
print("  wrote test6_scene_large_radius.png")

# ── TEST 7: Add ONE lineart modifier per city cube (OBJECT source, stacked) ──
print("\n=== TEST 7: SCENE source, GP in separate collection ===")
# The key hypothesis: maybe SCENE source excludes GP objects themselves
# Solution: put GP in a dedicated 'GP' collection, city in 'City' collection
# Source = City collection (not scene root)

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.render.engine = eevee()

# Create separate collections
city_coll = bpy.data.collections.new("City")
bpy.context.scene.collection.children.link(city_coll)

random.seed(7)
pm2 = bpy.data.materials.new("paper"); pm2.use_nodes = True; nt2 = pm2.node_tree; nt2.nodes.clear()
em2 = nt2.nodes.new('ShaderNodeEmission'); em2.inputs['Color'].default_value = (0.96, 0.96, 0.96, 1)
out2 = nt2.nodes.new('ShaderNodeOutputMaterial'); nt2.links.new(em2.outputs['Emission'], out2.inputs['Surface'])

def add_to_coll(fn, coll, *args, **kwargs):
    fn(*args, **kwargs)
    obj = bpy.context.active_object
    for c in list(obj.users_collection):
        c.objects.unlink(obj)
    coll.objects.link(obj)
    return obj

add_to_coll(bpy.ops.mesh.primitive_plane_add, city_coll, size=90, location=(0, 0, 0)).data.materials.append(pm2)
for side in (-1, 1):
    for i in range(7):
        y = 6 + i*7; h = random.uniform(9, 22); w = random.uniform(3.2, 4.6)
        b = add_to_coll(bpy.ops.mesh.primitive_cube_add, city_coll, size=1, location=(side*6.5, y, h/2))
        b.scale = (w, random.uniform(3.5, 5), h); b.data.materials.append(pm2)
        f = add_to_coll(bpy.ops.mesh.primitive_cube_add, city_coll, size=1, location=(side*6.5, y-2, h*0.55))
        f.scale = (w*0.55, 0.4, h*0.5); f.data.materials.append(pm2)
add_to_coll(bpy.ops.mesh.primitive_cylinder_add, city_coll, radius=0.55, depth=2, location=(0.4, 11, 1.2)).data.materials.append(pm2)
add_to_coll(bpy.ops.mesh.primitive_uv_sphere_add, city_coll, radius=0.5, location=(0.4, 11, 2.5)).data.materials.append(pm2)

d = bpy.data.lights.new('S', 'SUN'); d.energy = 5; o = bpy.data.objects.new('S', d); bpy.context.scene.collection.objects.link(o)
o.rotation_euler = (math.radians(58), math.radians(8), math.radians(35))
cd = bpy.data.cameras.new('C'); cd.lens = 26; c = bpy.data.objects.new('C', cd); bpy.context.scene.collection.objects.link(c)
c.location = (0.4, -7, 1.5); c.rotation_euler = (math.radians(86), 0, 0); c.rotation_euler.rotate_axis('Z', math.radians(-8))
bpy.context.scene.camera = c
w = bpy.data.worlds.new('W'); bpy.context.scene.world = w; w.use_nodes = True
w.node_tree.nodes.get('Background').inputs['Color'].default_value = (1, 1, 1, 1)

print(f"  City collection objects: {[o.name for o in city_coll.objects]}")

# GP object in scene root collection (not in City)
bpy.ops.object.grease_pencil_add(type='EMPTY')
gp7 = bpy.context.active_object
print(f"  GP in collections: {[c.name for c in gp7.users_collection]}")

mat7 = gp7.data.materials[0]
bpy.data.materials.create_gpencil_data(mat7)
gpm7 = mat7.grease_pencil
gpm7.show_stroke = True; gpm7.show_fill = False
gpm7.color = (0, 0, 0, 1); gpm7.mode = 'LINE'; gpm7.stroke_style = 'SOLID'

bpy.ops.object.modifier_add(type='LINEART')
mod7 = gp7.modifiers[-1]
mod7.source_type = 'COLLECTION'
mod7.source_collection = city_coll   # target the City child collection
mod7.use_contour = True; mod7.use_crease = True; mod7.use_loose = True
mod7.crease_threshold = math.radians(20)
mod7.target_layer = gp7.data.layers[0].name
mod7.target_material = mat7
mod7.radius = 0.006
print(f"  source_collection: '{mod7.source_collection.name}'")
print(f"  GP not in City collection: {gp7 not in list(city_coll.objects)}")

sc7 = bpy.context.scene
sc7.render.resolution_x, sc7.render.resolution_y = 560, 700
sc7.render.image_settings.file_format = 'PNG'
sc7.render.filepath = os.path.join(OUT, "test7_child_collection.png")
try: sc7.view_settings.view_transform = 'Standard'
except: pass
bpy.ops.render.render(write_still=True)
print("  wrote test7_child_collection.png")

print("\nDONE")
