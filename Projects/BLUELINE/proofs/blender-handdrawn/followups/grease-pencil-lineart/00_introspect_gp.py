"""
Introspection: discover GP v3 API in Blender 5.1 for Line Art modifier.
Prints available GP object types, modifier types, material properties.
"""
import bpy

print("=== BLENDER VERSION ===")
print(bpy.app.version_string)

print("\n=== OBJECT TYPES that contain 'GREASE' or 'GP' ===")
for item in bpy.types.Object.bl_rna.properties['type'].enum_items:
    if 'GREASE' in item.identifier or 'GP' in item.identifier:
        print(f"  {item.identifier}: {item.name}")

print("\n=== ALL OBJECT TYPES ===")
for item in bpy.types.Object.bl_rna.properties['type'].enum_items:
    print(f"  {item.identifier}")

print("\n=== GP-related ops ===")
for name in dir(bpy.ops.object):
    if 'grease' in name.lower() or 'gpencil' in name.lower() or 'gp_' in name.lower():
        print(f"  bpy.ops.object.{name}")

print("\n=== bpy.ops.gpencil ===")
try:
    for name in dir(bpy.ops.gpencil):
        print(f"  bpy.ops.gpencil.{name}")
except Exception as e:
    print(f"  ERROR: {e}")

print("\n=== bpy.ops.grease_pencil ===")
try:
    for name in dir(bpy.ops.grease_pencil):
        print(f"  bpy.ops.grease_pencil.{name}")
except Exception as e:
    print(f"  ERROR: {e}")

print("\n=== Try adding a GP object ===")
bpy.ops.wm.read_factory_settings(use_empty=True)
try:
    bpy.ops.object.grease_pencil_add(type='EMPTY')
    print("  grease_pencil_add(EMPTY) -> SUCCESS")
    gp = bpy.context.active_object
    print(f"  object type: {gp.type}")
    print(f"  data type: {type(gp.data)}")
    print(f"  data class: {gp.data.__class__.__name__}")
except Exception as e:
    print(f"  grease_pencil_add FAILED: {e}")
    # try legacy
    try:
        bpy.ops.object.gpencil_add(type='EMPTY')
        print("  gpencil_add(EMPTY) -> SUCCESS (legacy)")
        gp = bpy.context.active_object
        print(f"  object type: {gp.type}")
    except Exception as e2:
        print(f"  gpencil_add FAILED too: {e2}")

print("\n=== Modifier types on GP object ===")
try:
    gp = bpy.context.active_object
    if gp:
        print(f"  Active obj type: {gp.type}")
        # list available modifier enum items
        for item in bpy.types.GreasePencilModifier.bl_rna.properties.get('type', None).enum_items if hasattr(bpy.types, 'GreasePencilModifier') else []:
            print(f"    {item.identifier}")
except Exception as e:
    print(f"  ERROR listing modifiers: {e}")

# Try to introspect via operator
try:
    bpy.ops.object.modifier_add(type='GREASE_PENCIL_LINEART')
    print("  modifier_add GREASE_PENCIL_LINEART -> SUCCESS (new)")
except Exception as e:
    print(f"  GREASE_PENCIL_LINEART failed: {e}")
    try:
        bpy.ops.object.modifier_add(type='GP_LINEART')
        print("  modifier_add GP_LINEART -> SUCCESS (legacy)")
    except Exception as e2:
        print(f"  GP_LINEART failed: {e2}")

# List all modifier types to search for line art
print("\n=== All modifier types (search for line) ===")
try:
    for item in bpy.types.Modifier.bl_rna.properties['type'].enum_items:
        if 'LINE' in item.identifier or 'GREASE' in item.identifier:
            print(f"  {item.identifier}: {item.name}")
except Exception as e:
    print(f"  ERROR: {e}")

print("\nINTROSPECT DONE")
