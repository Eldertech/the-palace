"""
Diagnostic: render GP Line Art on DARK grey background.
If lines appear properly BLACK on grey, the issue is EEVEE's alpha-blend
with the white geometry. If they still look grey-on-grey, there's a deeper
material opacity issue.

Also try: use a HOLDOUT material on mesh geometry so depth is still tracked
but geometry doesn't contribute to the colour channel.
"""
import bpy, math, os, random

OUT = "/Users/loudonstearns/Documents/The Palace/Projects/BLUELINE/proofs/blender-handdrawn/followups/grease-pencil-lineart"

def eevee():
    items = [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items]
    for c in ('BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE'):
        if c in items: return c
    return items[0]

def build_city_holdout():
    """Build city with HOLDOUT material — depth tracked but colour transparent."""
    random.seed(7)
    # Holdout material
    hm = bpy.data.materials.new("holdout"); hm.use_nodes = True; nt = hm.node_tree; nt.nodes.clear()
    hold = nt.nodes.new('ShaderNodeHoldout')
    out_node = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(hold.outputs['Holdout'], out_node.inputs['Surface'])

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

def build_gp(radius=0.035, crease_deg=20):
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
    mod.radius = radius; mod.opacity = 1.0; mod.use_cache = False
    return gp, mod

def render(name, world_color=(1,1,1,1)):
    sc = bpy.context.scene
    w = bpy.data.worlds.new('Wld'); sc.world = w; w.use_nodes = True
    w.node_tree.nodes.get('Background').inputs['Color'].default_value = world_color
    try: sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'
    except: pass
    sc.render.resolution_x, sc.render.resolution_y = 560, 700
    try: sc.eevee.taa_render_samples = 32
    except: pass
    sc.render.image_settings.file_format = 'PNG'
    sc.render.filepath = os.path.join(OUT, f"{name}.png")
    bpy.ops.render.render(write_still=True)
    print(f"  wrote {name}.png")

# ── TEST: Dark grey background — reveals if GP strokes are truly black ───────
print("\n=== TEST: Dark grey background ===")
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

gp, mod = build_gp(radius=0.035, crease_deg=20)
bpy.ops.object.modifier_add(type='GREASE_PENCIL_NOISE')
n = gp.modifiers[-1]; n.factor = 0.22; n.noise_scale = 1.8; n.use_random = True
bpy.ops.object.modifier_add(type='GREASE_PENCIL_THICKNESS')
t = gp.modifiers[-1]; t.thickness = 20

# Dark grey background to see if strokes are black
render("test_dark_bg", world_color=(0.15, 0.15, 0.15, 1))

# ── TEST: Holdout material on geometry — pure white background ────────────────
print("\n=== TEST: Holdout geometry + white world ===")
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.render.engine = eevee()
build_city_holdout()

gp2, mod2 = build_gp(radius=0.035, crease_deg=20)
bpy.ops.object.modifier_add(type='GREASE_PENCIL_NOISE')
n2 = gp2.modifiers[-1]; n2.factor = 0.22; n2.noise_scale = 1.8; n2.use_random = True
bpy.ops.object.modifier_add(type='GREASE_PENCIL_THICKNESS')
t2 = gp2.modifiers[-1]; t2.thickness = 20

render("test_holdout_geo", world_color=(1, 1, 1, 1))

print("\nDONE")
