"""
Solution: hide mesh geometry from render (or use holdout) so GP strokes
render against white world background cleanly (dark black lines on white).
This mirrors what Freestyle does — lines on white background, no mesh fill.

Also: the existing cat_stills_lines.py uses white emission so that the mesh
geometry IS white in the final render (buildings are white-on-white, defined
only by the line). GP can achieve the same: show lines but hide/white-out mesh.
"""
import bpy, math, os, random

OUT = "/Users/loudonstearns/Documents/The Palace/Projects/BLUELINE/proofs/blender-handdrawn/followups/grease-pencil-lineart"

def eevee():
    items = [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items]
    for c in ('BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE'):
        if c in items: return c
    return items[0]

def build_city_hidden():
    """Build city but hide mesh from render — only GP strokes will show."""
    random.seed(7)
    objs = []
    bpy.ops.mesh.primitive_plane_add(size=90, location=(0, 0, 0))
    objs.append(bpy.context.active_object)
    for side in (-1, 1):
        for i in range(7):
            y = 6 + i*7; h = random.uniform(9, 22); w = random.uniform(3.2, 4.6)
            bpy.ops.mesh.primitive_cube_add(size=1, location=(side*6.5, y, h/2))
            b = bpy.context.active_object; b.scale = (w, random.uniform(3.5, 5), h)
            objs.append(b)
            bpy.ops.mesh.primitive_cube_add(size=1, location=(side*6.5, y-2, h*0.55))
            f = bpy.context.active_object; f.scale = (w*0.55, 0.4, h*0.5)
            objs.append(f)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.55, depth=2, location=(0.4, 11, 1.2))
    objs.append(bpy.context.active_object)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.5, location=(0.4, 11, 2.5))
    objs.append(bpy.context.active_object)

    # Hide all mesh objects from render
    for obj in objs:
        obj.hide_render = True

    d = bpy.data.lights.new('S', 'SUN'); d.energy = 5; o = bpy.data.objects.new('S', d); bpy.context.collection.objects.link(o)
    o.rotation_euler = (math.radians(58), math.radians(8), math.radians(35))
    cd = bpy.data.cameras.new('C'); cd.lens = 26; c = bpy.data.objects.new('C', cd); bpy.context.collection.objects.link(c)
    c.location = (0.4, -7, 1.5); c.rotation_euler = (math.radians(86), 0, 0); c.rotation_euler.rotate_axis('Z', math.radians(-8))
    bpy.context.scene.camera = c
    w = bpy.data.worlds.new('W'); bpy.context.scene.world = w; w.use_nodes = True
    w.node_tree.nodes.get('Background').inputs['Color'].default_value = (1, 1, 1, 1)
    print(f"  Mesh objects (hidden): {len(objs)}")
    return objs

def build_base_gp(radius=0.030, crease_deg=20):
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
    mod.crease_threshold = math.radians(crease_deg)
    mod.target_layer = gp.data.layers[0].name
    mod.target_material = mat
    mod.radius = radius; mod.opacity = 1.0
    return gp, mod

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

# ── TEST D: Mesh hidden, GP Line Art only ────────────────────────────────────
print("\n=== TEST D: Mesh hidden from render ===")
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.render.engine = eevee()
mesh_objs = build_city_hidden()

gp_d, mod_d = build_base_gp(radius=0.030, crease_deg=20)
bpy.ops.object.modifier_add(type='GREASE_PENCIL_NOISE')
n = gp_d.modifiers[-1]; n.factor = 0.20; n.noise_scale = 1.6; n.use_random = True
bpy.ops.object.modifier_add(type='GREASE_PENCIL_THICKNESS')
t = gp_d.modifiers[-1]; t.thickness = 18
render("testD_mesh_hidden")

# ── TEST E: Mesh hidden + fine line ──────────────────────────────────────────
print("\n=== TEST E: Mesh hidden + fine line ===")
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.render.engine = eevee()
build_city_hidden()
gp_e, mod_e = build_base_gp(radius=0.020, crease_deg=22)
bpy.ops.object.modifier_add(type='GREASE_PENCIL_NOISE')
n = gp_e.modifiers[-1]; n.factor = 0.08; n.noise_scale = 1.0; n.use_random = True
bpy.ops.object.modifier_add(type='GREASE_PENCIL_THICKNESS')
t = gp_e.modifiers[-1]; t.thickness = 10
render("testE_fine_line_hidden")

# ── TEST F: Mesh visible (white emission) but also add offset for lines ───────
# Back to white-emission-on (same as Freestyle test), but check:
# does Line Art render properly against the EEVEE white mesh?
print("\n=== TEST F: White emission mesh VISIBLE — GP lines on top ===")
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.render.engine = eevee()

random.seed(7)
pm = bpy.data.materials.new("paper"); pm.use_nodes = True; nt = pm.node_tree; nt.nodes.clear()
em = nt.nodes.new('ShaderNodeEmission'); em.inputs['Color'].default_value = (0.96, 0.96, 0.96, 1)
out_node = nt.nodes.new('ShaderNodeOutputMaterial'); nt.links.new(em.outputs['Emission'], out_node.inputs['Surface'])

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

gp_f, mod_f = build_base_gp(radius=0.035, crease_deg=20)
mod_f.stroke_depth_offset = 0.0  # 0 = at surface (no offset)
gp_f.show_in_front = True  # try rendering GP in front of everything
bpy.ops.object.modifier_add(type='GREASE_PENCIL_NOISE')
n = gp_f.modifiers[-1]; n.factor = 0.20; n.noise_scale = 1.6; n.use_random = True
bpy.ops.object.modifier_add(type='GREASE_PENCIL_THICKNESS')
t = gp_f.modifiers[-1]; t.thickness = 18
render("testF_white_mesh_show_in_front")

print("\nDONE")
