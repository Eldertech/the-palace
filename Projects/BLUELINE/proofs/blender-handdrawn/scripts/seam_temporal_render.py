"""
BLUELINE seam · TEMPORAL — render a camera move THROUGH the city (confident ink),
so each frame can be stylized and assembled. Tests temporal coherence of the redraw.
Outputs: temporal/ink_####.png  (used as both img2img init and canny control)
"""
import bpy, math, os, random
OUT = "/Users/loudonstearns/Documents/The Palace/Projects/BLUELINE/proofs/blender-handdrawn/temporal"
os.makedirs(OUT, exist_ok=True)
RES = (832, 1040); FRAMES = 12

def eevee():
    items = [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items]
    for c in ('BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE'):
        if c in items: return c
    return items[0]

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.render.engine = eevee()
m = bpy.data.materials.new("paper"); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
em = nt.nodes.new('ShaderNodeEmission'); em.inputs['Color'].default_value = (0.96, 0.96, 0.96, 1)
out = nt.nodes.new('ShaderNodeOutputMaterial'); nt.links.new(em.outputs['Emission'], out.inputs['Surface'])
random.seed(7)
bpy.ops.mesh.primitive_plane_add(size=120); bpy.context.active_object.data.materials.append(m)
for side in (-1, 1):
    for i in range(8):
        y = 6 + i*6.5; h = random.uniform(9, 22); w = random.uniform(3.2, 4.6)
        bpy.ops.mesh.primitive_cube_add(size=1, location=(side*6.5, y, h/2))
        b = bpy.context.active_object; b.scale = (w, random.uniform(3.5, 5), h); b.data.materials.append(m)
        bpy.ops.mesh.primitive_cube_add(size=1, location=(side*6.5, y-2, h*0.55))
        f = bpy.context.active_object; f.scale = (w*0.55, 0.4, h*0.5); f.data.materials.append(m)
bpy.ops.mesh.primitive_cylinder_add(radius=0.55, depth=2, location=(0.4, 16, 1.2)); bpy.context.active_object.data.materials.append(m)
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.5, location=(0.4, 16, 2.5)); bpy.context.active_object.data.materials.append(m)
d = bpy.data.lights.new('S', 'SUN'); d.energy = 5; o = bpy.data.objects.new('S', d); bpy.context.collection.objects.link(o)
o.rotation_euler = (math.radians(58), math.radians(8), math.radians(35))
cd = bpy.data.cameras.new('C'); cd.lens = 26; cam = bpy.data.objects.new('C', cd); bpy.context.collection.objects.link(cam)
cam.rotation_euler = (math.radians(86), 0, 0); cam.rotation_euler.rotate_axis('Z', math.radians(-8)); bpy.context.scene.camera = cam
w = bpy.data.worlds.new('W'); bpy.context.scene.world = w; w.use_nodes = True
w.node_tree.nodes.get('Background').inputs['Color'].default_value = (1, 1, 1, 1)

# confident calligraphic Freestyle
sc = bpy.context.scene; sc.render.use_freestyle = True; sc.render.line_thickness_mode = 'ABSOLUTE'
vl = sc.view_layers[0]; vl.use_freestyle = True; fs = vl.freestyle_settings
if len(fs.linesets) == 0: fs.linesets.new('LS')
ls = fs.linesets[0]; ls.linestyle = bpy.data.linestyles.new('S')
for a, v in (('select_silhouette', True), ('select_border', True), ('select_crease', True), ('select_external_contour', True)):
    try: setattr(ls, a, v)
    except Exception: pass
try: fs.crease_angle = math.radians(134)
except Exception:
    try: ls.crease_angle = math.radians(134)
    except Exception: pass
st = ls.linestyle; st.color = (0, 0, 0); st.thickness = 3.0; st.use_chaining = True
st.chaining = 'PLAIN'
g = st.geometry_modifiers
g.new(name='samp', type='SAMPLING'); g[-1].sampling = 3.0
g.new(name='bz', type='BEZIER_CURVE'); g[-1].error = 3.0
t = st.thickness_modifiers; t.new(name='c', type='CALLIGRAPHY'); cm = t[-1]
cm.orientation = math.radians(38); cm.thickness_min = 1.0; cm.thickness_max = 9.0

try: sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'
except Exception: pass
sc.render.resolution_x, sc.render.resolution_y = RES
try: sc.eevee.taa_render_samples = 24
except Exception: pass
sc.render.image_settings.file_format = 'PNG'
# dolly down the street (camera moves THROUGH the scene)
sc.frame_start = 1; sc.frame_end = FRAMES
for f in range(1, FRAMES + 1):
    t01 = (f - 1) / (FRAMES - 1)
    cam.location = (0.4 + 0.6*t01, -9 + 13*t01, 1.5 + 0.4*t01)
    cam.keyframe_insert('location', frame=f)
sc.render.filepath = os.path.join(OUT, "ink_")
bpy.ops.render.render(animation=True)
print("TEMPORAL RENDER DONE", FRAMES, "frames")
