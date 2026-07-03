#!/usr/bin/env python3
"""Build the A-vs-B comparison board: mattes · composite · motion, for both routes."""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, os.path.join(HERE, "lib"))
import board
P = lambda *a: os.path.join(HERE, *a)
rows = [
 [("A · separate — mattes", P("report-assets", "sky_separate_mattes.png"), "extract + infill"),
  ("A · composite", P("renders", "sky_separate", "still.png"), "one coherent drawing"),
  ("A · motion", P("renders", "sky_separate", "sky_separate_anaglyph.png"), "clouds drift / ridge locked")],
 [("B · generate — mattes", P("report-assets", "sky_generate_mattes.png"), "two SDXL passes"),
  ("B · composite", P("renders", "sky_generate", "still.png"), "stacked layers"),
  ("B · motion", P("renders", "sky_generate", "sky_generate_anaglyph.png"), "clouds drift / ridge locked")],
]
board.grid(rows, title="SKY · two routes to the same 2.5D paper stack",
           sub="A: cut a finished drawing along the black line (extract+infill).   "
               "B: generate each sheet separately (clean alpha by construction).",
           out=P("report-assets", "routes_compare.png"), cell_w=360)
print("COMPARE_BOARD_DONE")
