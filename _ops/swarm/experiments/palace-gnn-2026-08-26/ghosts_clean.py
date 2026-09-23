#!/usr/bin/env python3
"""Regenerate ghost candidates under the config the controls endorsed
(global normalisation, uniform +1) and measure overlap with the first list."""
import json, numpy as np
import palace_gnn as G
from disentangle import aggregate, prop

d, _ = G.load_map()
nodes, idx, N, rel, _ = G.build(d)
H0 = G.features(nodes)
UNIFORM = {t: 1.0 for t in rel}

M = aggregate(rel, UNIFORM, "global")
H = prop(H0, M, 2.0, 3)
clean = G.predict_links(H, nodes, rel, top=40)

old = json.load(open("results.json"))["ghosts"]
def key(g): return tuple(sorted([g["a"], g["b"]]))
so, sc = {key(g) for g in old}, {key(g) for g in clean}
print(f"overlap in top 40: {len(so & sc)}/40")
print(f"overlap in top 20: {len({key(g) for g in old[:20]} & {key(g) for g in clean[:20]})}/20\n")
print("clean config · top 20:")
for i, g in enumerate(clean[:20], 1):
    mark = " *" if key(g) in so else "  "
    print(f" {i:>2}{mark} {g['a']}  ~  {g['b']}   [{g['a_type']}/{g['b_type']}]")
print("\n * = also in the first list")
json.dump(clean, open("ghosts-clean.json", "w"), indent=1)
