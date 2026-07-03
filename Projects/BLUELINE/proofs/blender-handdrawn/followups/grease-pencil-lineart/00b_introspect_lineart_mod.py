"""
Introspect LINEART modifier properties on a GP v3 object in Blender 5.1.
Also introspect GP material stroke properties.
"""
import bpy

bpy.ops.wm.read_factory_settings(use_empty=True)

# Add a GP object
bpy.ops.object.grease_pencil_add(type='EMPTY')
gp_obj = bpy.context.active_object
print(f"GP obj: {gp_obj.name}, type: {gp_obj.type}")

# Add the Line Art modifier
bpy.ops.object.modifier_add(type='LINEART')
mod = gp_obj.modifiers[-1]
print(f"\nModifier name: {mod.name}, type: {mod.type}")
print(f"Modifier class: {mod.__class__.__name__}")

print("\n=== LINEART modifier properties ===")
for prop in mod.bl_rna.properties:
    if prop.identifier in ('rna_type', 'name', 'type'): continue
    try:
        val = getattr(mod, prop.identifier)
        print(f"  {prop.identifier} = {val!r}  [{prop.type}]")
    except Exception as e:
        print(f"  {prop.identifier} ERROR: {e}  [{prop.type}]")

# GP Material
print("\n=== Creating GP stroke material ===")
mat = bpy.data.materials.new("GP_Ink")
bpy.data.materials.create_gpencil_data(mat)
print(f"  mat.grease_pencil: {mat.grease_pencil}")
gp_mat = mat.grease_pencil
print("\n  GP material properties:")
for prop in gp_mat.bl_rna.properties:
    if prop.identifier in ('rna_type',): continue
    try:
        val = getattr(gp_mat, prop.identifier)
        print(f"    {prop.identifier} = {val!r}")
    except Exception as e:
        print(f"    {prop.identifier} ERROR: {e}")

# GP data / layers in v3
print("\n=== GP data (GreasePencil v3) ===")
gp_data = gp_obj.data
print(f"  data class: {gp_data.__class__.__name__}")
for prop in gp_data.bl_rna.properties:
    print(f"  {prop.identifier}: {prop.type}")

# Check for layers
print("\n=== Layers ===")
try:
    for attr in ('layers', 'layer_groups'):
        if hasattr(gp_data, attr):
            coll = getattr(gp_data, attr)
            print(f"  {attr}: {list(coll)}")
except Exception as e:
    print(f"  layers error: {e}")

# Try adding a layer
print("\n=== Add layer ===")
try:
    bpy.ops.grease_pencil.layer_add()
    print("  layer_add -> OK")
    print(f"  layers: {list(gp_data.layers)}")
except Exception as e:
    print(f"  layer_add failed: {e}")
    # Try data API
    try:
        layer = gp_data.layers.new("Lines")
        print(f"  layers.new -> {layer}")
    except Exception as e2:
        print(f"  layers.new failed: {e2}")

print("\nINTROSPECT B DONE")
