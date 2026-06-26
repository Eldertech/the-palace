# GP v3 Line Art Proof — Blender 5.1 Report

**Date:** 2026-06-26  
**Blender:** 5.1.2  
**Scene:** City scene from cat_stills_lines.py (identical geometry and camera)  
**Reference:** Freestyle variant 9 (9_confident_min_wobble.png — confident calligraphic)

## Verdict

GP Line Art works headless in Blender 5.1 and produces correct editable GP stroke line drawings. It is architecturally different from Freestyle in ways that define when to pick each. Freestyle wins on ink richness, depth-cued weight variation, and calligraphic quality. GP Line Art wins on editability, animation, motion pipeline integration, and art-direction precision.

## Blender 5.1 GP v3 — Correct API Identifiers

The GP v3 API changed significantly from legacy Blender 2.x/3.x GP. These are the confirmed correct identifiers for Blender 5.1.2:

| Thing | Blender 5.1 identifier |
|---|---|
| Add GP object | bpy.ops.object.grease_pencil_add(type='EMPTY') |
| Object type enum | GREASEPENCIL |
| Data class | bpy.types.GreasePencil |
| Line Art modifier type | 'LINEART' (not GREASE_PENCIL_LINEART) |
| Noise modifier | 'GREASE_PENCIL_NOISE' |
| Thickness modifier | 'GREASE_PENCIL_THICKNESS' |
| Opacity modifier | 'GREASE_PENCIL_OPACITY' |
| Tint modifier | 'GREASE_PENCIL_TINT' |
| Layer add | bpy.ops.grease_pencil.layer_add() |
| Bake strokes | REMOVED in Blender 5.x — lines bake live at render time |

## Working Recipe

```python
import bpy, math

# 1. Add GP object — comes with default 'Black' material at slot 0 and 'Layer'
bpy.ops.object.grease_pencil_add(type='EMPTY')
gp = bpy.context.active_object

# 2. Configure the auto-created 'Black' material IN PLACE (do not replace it)
mat = gp.data.materials[0]
bpy.data.materials.create_gpencil_data(mat)
gpm = mat.grease_pencil
gpm.show_stroke = True; gpm.show_fill = False
gpm.color = (0, 0, 0, 1)
gpm.mode = 'LINE'; gpm.stroke_style = 'SOLID'
gpm.mix_factor = 0.0; gpm.mix_stroke_factor = 0.0

# 3. Line Art modifier
bpy.ops.object.modifier_add(type='LINEART')
mod = gp.modifiers[-1]
mod.source_type = 'SCENE'   # 'SCENE' works headless; 'COLLECTION'+child does NOT
mod.use_contour = True; mod.use_crease = True; mod.use_loose = True
mod.use_edge_mark = True; mod.use_intersection = True
mod.crease_threshold = math.radians(20)
mod.target_layer = gp.data.layers[0].name   # 'Layer'
mod.target_material = mat
mod.radius = 0.028   # MUST be scene-scaled: 0.02-0.05 for 20-unit buildings
mod.opacity = 1.0; mod.use_cache = False

# 4. Art direction: noise and thickness
bpy.ops.object.modifier_add(type='GREASE_PENCIL_NOISE')
n = gp.modifiers[-1]
n.factor = 0.22        # position offset amplitude
n.noise_scale = 1.8    # spatial frequency
n.use_random = True

bpy.ops.object.modifier_add(type='GREASE_PENCIL_THICKNESS')
t = gp.modifiers[-1]
t.thickness = 20       # pixels

# 5. For clean black-on-white rendering, use HOLDOUT on mesh geometry
#    (depth-tracked but colour-transparent; GP lines render cleanly on white world)
hm = bpy.data.materials.new("holdout")
hm.use_nodes = True; nt = hm.node_tree; nt.nodes.clear()
nt.links.new(nt.nodes.new('ShaderNodeHoldout').outputs['Holdout'],
             nt.nodes.new('ShaderNodeOutputMaterial').inputs['Surface'])
# Assign hm to all mesh objects; set world background to (1,1,1,1)
```

## Blockers Encountered

**1. bpy.ops.lineart.bake_strokes() removed in Blender 5.x.**  
The entire `bpy.ops.lineart` namespace is gone. Line Art computes live at render time. No pre-baking is needed or available.

**2. source_type='COLLECTION' with a child collection fails headless.**  
Produces blank renders in `--factory-startup` headless context. The view layer collection include/exclude flags are not initialized for child collections. Workaround: use `source_type='SCENE'` (targets everything in scene) or `source_type='OBJECT'` (single mesh target).

**3. White emission mesh makes GP strokes appear grey.**  
The strokes ARE pixel-correct black lines, but thin dark lines on top of large white emission surfaces appear washed out at thumbnail scale. Confirmed via zoom: lines are black. Fix: use HOLDOUT material on geometry. Holdout lets the depth buffer track silhouettes while the colour channel stays transparent, so GP lines render against the white world background directly.

**4. blend_method = 'OPAQUE' silently ignored on GP materials.**  
EEVEE's GP compositor handles alpha differently from mesh materials. Setting blend_method on the material does not make GP strokes more opaque.

**5. Do not replace the auto-created 'Black' material.**  
If you append a new material, it goes to slot 1. The Line Art modifier targets mat by direct reference — but the default layer/material combo at construction targets slot 0. Configure 'Black' in-place to avoid mismatches.

## GREASE_PENCIL_NOISE Property Reference

```
factor             position offset amplitude (the main wobble control)
factor_strength    stroke pressure amplitude
factor_thickness   thickness variation (can approximate calligraphic pressure)
factor_uvs         UV offset amplitude
noise_scale        spatial frequency of noise
noise_offset       phase offset
use_random         randomize seed per frame
seed               random seed
random_mode        STEP / KEYFRAME / FRAME
step               frames between random seed updates
```

## LINEART Modifier Property Reference

```
source_type        SCENE / COLLECTION / OBJECT
source_collection  target collection (COLLECTION source)
source_object      target mesh object (OBJECT source)
use_contour / use_crease / use_loose / use_edge_mark / use_intersection
crease_threshold   in radians (math.radians(20) = good general setting)
radius             stroke width in world units — MUST BE SCENE-SCALED
                   (0.003 looked blank; 0.028 correct for 20-unit buildings)
opacity            0.0-1.0
stroke_depth_offset z-nudge toward camera
target_layer       name of GP layer to write strokes into
target_material    material to assign to generated strokes
use_cache          set False for deterministic fresh renders
```

## Side-by-Side Verdict

Reference: comparison_HOLDOUT_3wide.png  
(Left: Freestyle #9 | Center: GP Line Art B confident | Right: GP Line Art C heavy)

**Freestyle #9 wins on:**
- Variable weight: lines automatically thicken at silhouette corners and narrow at transitions
- Depth cueing: near objects produce heavier lines, distant geometry produces finer lines
- Shadow fill integration: deep recesses darken naturally from geometry shading
- Overall ink presence: reads as a confident architectural ink sketch at small scale

**GP Line Art wins on:**
- Editability: output is actual GP strokes, editable in Grease Pencil mode
- Animation: strokes can be interpolated between keyframes, morphed, driven by bones
- Art direction separation: noise, thickness, and edge selection are independent modifier layers
- BLUELINE motion pipeline fit: stroke geometry can be warped frame-to-frame (key for the noise-walk motion pipeline)
- Clean print line: uniform weight better for technical/CAD-style illustration
- Seam-B candidate: lighter, editable strokes may survive img2img stylization better than Freestyle's heavy fills

**Pick by use case:**

| Use case | Pick |
|---|---|
| Hero calligraphic frame for still | Freestyle |
| BLUELINE motion pipeline (animated strokes) | GP Line Art |
| Lines that need deformation or noise-walk | GP Line Art |
| Seam-B stylization chain input | GP Line Art |
| Quick non-edited reference frame | Freestyle |
| Feed into Seam-A roundtrip for compositing | Either, test both |

**Calligraphic gap:** Freestyle achieves thick/thin via the CALLIGRAPHY thickness modifier (angle-driven). GP Line Art can approximate this via factor_thickness in GREASE_PENCIL_NOISE (random variation) but cannot yet do angle-driven calligraphic pressure without a custom curve + facing-angle vertex group. This is the main quality gap.

**Noise quality difference:** GP GREASE_PENCIL_NOISE at factor=0.22, noise_scale=1.8 produces light wavering — similar to Freestyle minimum-wobble but more uniform and pencil-like rather than ink-like. At factor=0.50 lines become gestural/expressive. Good for sketch/storyboard aesthetic.

## File List

| File | Description |
|---|---|
| REF_freestyle_9_confident_min_wobble.png | Freestyle variant 9 (reference) |
| HOLDOUT_FINAL_A_fine_clean.png | GP fine line: radius 0.020, noise 0.07, thickness 9 |
| HOLDOUT_FINAL_B_confident.png | GP confident: radius 0.028, noise 0.22, thickness 20 |
| HOLDOUT_FINAL_C_heavy.png | GP heavy brush: radius 0.045, noise 0.50, thickness 38 |
| comparison_HOLDOUT_3wide.png | Side-by-side: Freestyle vs GP B vs GP C |
| debug_approach3_suzanne.png | Suzanne proof-of-concept (OBJECT source working) |
| test6_scene_large_radius.png | City scene with radius 0.05 (visible line test) |
| test_holdout_geo.png | Holdout geometry test |
| test_dark_bg.png | Dark background test confirming strokes are black |
| 00_introspect_gp.py | GP object types and ops introspection |
| 00b_introspect_lineart_mod.py | LINEART modifier properties introspection |
| 07_gp_final_variants.py | Three variants with emission geometry |
| 13_gp_holdout_final.py | Final working recipe with holdout geometry |

## Forward Vector

- Test angle-driven calligraphic thickness via vertex groups and custom curve on GREASE_PENCIL_THICKNESS
- Investigate source_type=COLLECTION headless fix via view_layer.layer_collection traversal
- Test whether GP strokes survive and deform correctly in the BLUELINE noise-walk motion pipeline
- Feed HOLDOUT_FINAL_B into Seam-B stylization chain; compare stylization survival vs Freestyle input
