#!/usr/bin/env python3
"""Precompute the sweep the HTML scrubs: curves + a 2D PCA projection per depth.

The projection basis is FIXED at depth 0 for each run, so the collapse is real
motion in one frame rather than a re-fit that hides it.
"""
import json, numpy as np
from pathlib import Path
import palace_gnn as G

HERE = Path(__file__).resolve().parent
d, mappath = G.load_map()
nodes, idx, N, rel, dropped = G.build(d)
H0 = G.features(nodes)
mats = G.adjacency(N, rel)
DEPTH = 10
Ks  = [0.0, 0.25, 0.5, 1.0, 1.5, 2.0]
RES = [0.0, 0.3]
CON = {"repulsive": -1.0, "off": 0.0, "disarmed": 1.0}

# fixed basis from the initial features
c0 = H0.mean(0, keepdims=True)
U, S_, Vt = np.linalg.svd(H0 - c0, full_matrices=False)
basis = Vt[:2].T
scale = float(np.abs((H0 - c0) @ basis).max())

runs = {}
for cname, cval in CON.items():
    coup = dict(G.COUPLINGS); coup["contradicts"] = cval
    for K in Ks:
        for r in RES:
            Hs = G.propagate(H0, mats, coup, K=K, layers=DEPTH, residual=r)
            key = f"{cname}|{K}|{r}"
            proj = [((h - c0) @ basis / scale).round(3).tolist() for h in Hs]
            gaps = [G.contradiction_gap(h, rel, mats, coup) for h in Hs]
            runs[key] = {
                "spread":    [round(G.spread(h), 5) for h in Hs],
                "dirichlet": [round(G.dirichlet(h, mats, coup), 5) for h in Hs],
                "contra":    [round(g[0], 4) for g in gaps],
                "mirror":    [round(g[1], 4) for g in gaps],
                "proj": proj,
            }

res = json.load(open(HERE / "results.json"))
out = {
    "meta": {"map": Path(mappath).name, "n_nodes": N,
             "n_edges": sum(len(v) for v in rel.values()),
             "depth": DEPTH, "Ks": Ks, "RES": RES, "CON": list(CON),
             "couplings": G.COUPLINGS,
             "edge_types": {t: len(v) for t, v in sorted(rel.items(), key=lambda kv: -len(kv[1]))}},
    "nodes": [{"id": n["id"], "type": n["type"], "stage": n.get("stage"),
               "deg": n.get("inbound_count", 0) + n.get("outbound_count", 0)} for n in nodes],
    "runs": runs,
    "ghosts": res["ghosts"],
    "linkpred": res["linkpred_validation"],
}
p = HERE / "viz-data.json"
p.write_text(json.dumps(out, separators=(",", ":")))
print(f"wrote {p}  ({p.stat().st_size/1e6:.2f} MB, {len(runs)} runs)")
