#!/usr/bin/env python3
"""Driver: runs the four experiments and dumps results.json for the visualiser."""
import json, random, numpy as np
from pathlib import Path
import palace_gnn as G

random.seed(11); np.random.seed(11)
HERE = Path(__file__).resolve().parent

d, mappath = G.load_map()
nodes, idx, N, rel, dropped = G.build(d)
print(f"map      : {Path(mappath).name}")
print(f"nodes    : {N}   edges kept: {sum(len(v) for v in rel.values())}   dropped(ghost/self): {dropped}")
H0 = G.features(nodes)
print(f"features : {H0.shape[1]}d  ({len(G.TYPES)+len(G.STAGES)+3} structural + {G.TEXT_DIM} hashed-tfidf)")

mats = G.adjacency(N, rel)
DEPTH = 10
results = {"meta": {"map": Path(mappath).name, "n_nodes": N,
                    "n_edges": sum(len(v) for v in rel.values()),
                    "couplings": G.COUPLINGS, "depth": DEPTH},
           "nodes": [n["id"] for n in nodes]}

# ---- A. oversmoothing sweep -------------------------------------------------
print("\n[A] oversmoothing — spread(H) by depth, per coupling gain K")
Ks = [0.1, 0.25, 0.5, 1.0, 1.5, 2.0]
A = {}
for K in Ks:
    Hs = G.propagate(H0, mats, G.COUPLINGS, K=K, layers=DEPTH)
    A[str(K)] = {"spread":    [G.spread(h) for h in Hs],
                 "dirichlet": [G.dirichlet(h, mats, G.COUPLINGS) for h in Hs]}
    s = A[str(K)]["spread"]
    print(f"  K={K:<4} spread  " + " ".join(f"{v:.4f}" for v in s))
results["oversmoothing"] = {"Ks": Ks, "curves": A}

# ---- B. contradicts as anti-smoothing --------------------------------------
print("\n[B] contradicts: -1.0 (repulsive) vs +1.0 (disarmed)")
B = {}
for name, cval in (("repulsive", -1.0), ("disarmed", 1.0)):
    c = dict(G.COUPLINGS); c["contradicts"] = cval
    m = G.adjacency(N, rel)
    Hs = G.propagate(H0, m, c, K=1.0, layers=DEPTH)
    gaps = [G.contradiction_gap(h, rel, m, c) for h in Hs]
    B[name] = {"contradicts_dist": [g[0] for g in gaps],
               "mirrors_dist":     [g[1] for g in gaps],
               "spread":           [G.spread(h) for h in Hs]}
    print(f"  {name:<10} contra-dist " + " ".join(f"{g[0]:.3f}" for g in gaps))
    print(f"  {'':<10} mirror-dist " + " ".join(f"{g[1]:.3f}" for g in gaps))
results["contradicts"] = B

# ---- C. residual (the entry remembers what it was) --------------------------
print("\n[C] residual connections vs oversmoothing (K=1.0)")
C = {}
for r in (0.0, 0.15, 0.3, 0.5):
    Hs = G.propagate(H0, mats, G.COUPLINGS, K=1.0, layers=DEPTH, residual=r)
    C[str(r)] = {"spread": [G.spread(h) for h in Hs]}
    print(f"  res={r:<5} " + " ".join(f"{G.spread(h):.4f}" for h in Hs))
results["residual"] = C

# ---- D. link prediction + held-out validation -------------------------------
print("\n[D] link prediction")
all_edges = [(i, j, ty) for ty, ps in rel.items() for (i, j) in ps]
random.shuffle(all_edges)
n_hold = int(0.15 * len(all_edges))
held = all_edges[:n_hold]
mats_h = G.adjacency(N, rel, holdout=set(held))

best = None
for L in (1, 2, 3, 4):
    Hs = G.propagate(H0, mats_h, G.COUPLINGS, K=1.0, layers=L)
    rc, nh, ncand = G.recall_at_k(Hs[-1], held, rel, N)
    base_rc, _, _ = G.recall_at_k(H0, held, rel, N)
    print(f"  depth {L}: recall@50={rc[50]:.3f} @200={rc[200]:.3f} @1000={rc[1000]:.3f}"
          f"   (text-only baseline @1000={base_rc[1000]:.3f})")
    if best is None or rc[1000] > best[1]:
        best = (L, rc[1000])
results["linkpred_validation"] = {"held_out": n_hold, "best_depth": best[0]}

L = best[0]
# residual keeps the embedding from saturating, so mutual rank stays informative
Hs = G.propagate(H0, mats, G.COUPLINGS, K=1.0, layers=L, residual=0.25)
ghosts = G.predict_links(Hs[-1], nodes, rel, top=40)
results["ghosts"] = ghosts
print(f"\n  top ghost-node candidates (depth {L}, all real edges present):")
for g in ghosts[:20]:
    print(f"    mr={g['mutual_rank']:<4} {g['a']}  ~  {g['b']}   [{g['a_type']}/{g['b_type']}]")

(HERE / "results.json").write_text(json.dumps(results, indent=1))
print(f"\nwrote {HERE/'results.json'}")
