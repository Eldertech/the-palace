#!/usr/bin/env python3
"""
BLUELINE Session 11 — OUTLINE feedback test.

Load the session-10 aftermath scene and render it as a clean comic OUTLINE
(Freestyle + Cycles, white world, black lines). This is the fast LOCAL feedback
loop Loudon named: outline output from Blender, gen-AI adds a layer on top.

  /opt/homebrew/bin/blender -b -P outline_test.py -- --render out/s11_outline.png
"""
import bpy, sys, os

argv = sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
def arg(n, d): return argv[argv.index(n)+1] if n in argv else d
BLEND  = arg("--blend", "../session-10-impact/out/impact.blend")
RENDER = arg("--render", "out/s11_outline.png")
THICK  = float(arg("--thick", "2.2"))
os.makedirs(os.path.dirname(RENDER) or ".", exist_ok=True)

bpy.ops.wm.open_mainfile(filepath=os.path.abspath(BLEND))
scn = bpy.context.scene

# ── Cycles (Freestyle needs Cycles in 5.1; EEVEE-Next dropped it) ──
scn.render.engine = 'CYCLES'
try:
    scn.cycles.samples = 16          # cheap — we only want geometry + lines
    scn.cycles.device = 'CPU'
except Exception as e:
    print("[s11] cycles cfg:", e)

# ── white world so the outline reads as ink on paper ──
w = scn.world or bpy.data.worlds.new("W"); scn.world = w; w.use_nodes = True
bg = w.node_tree.nodes.get("Background")
if bg:
    bg.inputs[0].default_value = (1, 1, 1, 1)
    bg.inputs[1].default_value = 1.0

# ── flatten every surface to pure white EMISSION so only the black lines read
#    (clean ink-on-paper — gen-AI adds the ink/colour layer on top) ──
FLAT = arg("--flat", "1") == "1"
if FLAT:
    white = bpy.data.materials.new("s11_flat_white")
    white.use_nodes = True
    nt = white.node_tree
    for n in list(nt.nodes): nt.nodes.remove(n)
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs[0].default_value = (1, 1, 1, 1); em.inputs[1].default_value = 1.0
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(em.outputs[0], out.inputs[0])
    for o in scn.objects:
        if o.type == 'MESH':
            o.data.materials.clear(); o.data.materials.append(white)

# ── Freestyle: thick black lines on every silhouette/crease/border ──
scn.render.use_freestyle = True
scn.render.line_thickness_mode = 'ABSOLUTE'
scn.render.line_thickness = THICK
vl = scn.view_layers[0]
vl.use_freestyle = True
fs = vl.freestyle_settings
lineset = fs.linesets[0] if fs.linesets else fs.linesets.new("ls")
# fire on the edge types a comic reads: silhouette, border, crease, contour
for flag in ("select_silhouette", "select_border", "select_crease", "select_contour"):
    try: setattr(lineset, flag, True)
    except Exception: pass
try: lineset.select_edge_mark = True
except Exception: pass
ls = lineset.linestyle
ls.color = (0, 0, 0)
ls.thickness = THICK

scn.render.image_settings.file_format = 'PNG'
scn.render.filepath = os.path.abspath(RENDER)
bpy.ops.render.render(write_still=True)
print(f"[s11] OUTLINE -> {RENDER}")
