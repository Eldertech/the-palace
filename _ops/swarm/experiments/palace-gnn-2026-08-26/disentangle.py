#!/usr/bin/env python3
"""Is 'untyped beats typed' real, or an artefact of gain and normalisation?

Three things were varying at once in the first comparison:
  (a) whether relations get separate channels at all
  (b) the total coupling gain reaching a node
  (c) per-relation row normalisation, which makes ONE mirrors-neighbour weigh
      as much as ALL twenty connects-to neighbours

(c) is R-GCN's actual normalisation and is the interesting suspect.
"""
import random, statistics as stat, numpy as np
import palace_gnn as G

d, _ = G.load_map()
nodes, idx, N, rel, _ = G.build(d)
H0 = G.features(nodes)

def raw_mats(rel_):
    """Un-normalised per-relation adjacency, with inverse channels as usual."""
    out = {}
    for ty, pairs in rel_.items():
        f = np.zeros((N, N), np.float32); iv = np.zeros((N, N), np.float32)
        for i, j in pairs:
            f[i, j] = 1.0; iv[j, i] = 1.0
        out[ty] = [np.maximum(f, iv)] if ty in G.SYMMETRIC else [f, iv]
    return out

def aggregate(rel_, coup, norm, holdout=None):
    """norm='per_relation' -> each relation row-normalised separately (R-GCN).
       norm='global'       -> one matrix, normalised by TOTAL degree."""
    hold = holdout or set()
    r2 = {ty: [(i, j) for (i, j) in ps if (i, j, ty) not in hold] for ty, ps in rel_.items()}
    R = raw_mats(r2)
    if norm == "per_relation":
        M = np.zeros((N, N), np.float32)
        for ty, chans in R.items():
            a = coup.get(ty, 0.0)
            if a == 0.0: continue
            for A in chans:
                M += (a/len(chans)) * G.row_norm(A)
        return M
    M = np.zeros((N, N), np.float32)
    for ty, chans in R.items():
        a = coup.get(ty, 0.0)
        if a == 0.0: continue
        for A in chans:
            M += (a/len(chans)) * A
    deg = np.abs(M).sum(1, keepdims=True); deg[deg == 0] = 1.0
    return M/deg

def prop(H0, M, K, layers):
    H = H0.copy()
    for _ in range(layers):
        H = G.l2(H + K*(M @ H))
    return H

UNIFORM = {t: 1.0 for t in rel}
NOCON = dict(G.COUPLINGS); NOCON["contradicts"] = 0.0
flat = {"connects-to": [p for ps in rel.values() for p in ps]}

CONFIGS = [
    ("typed  · per-relation norm · Loudon couplings", rel,  G.COUPLINGS, "per_relation"),
    ("typed  · per-relation norm · uniform +1",       rel,  UNIFORM,     "per_relation"),
    ("typed  · GLOBAL norm       · Loudon couplings", rel,  G.COUPLINGS, "global"),
    ("typed  · GLOBAL norm       · no contradicts",   rel,  NOCON,       "global"),
    ("typed  · GLOBAL norm       · uniform +1",       rel,  UNIFORM,     "global"),
    ("untyped· one channel",                          flat, {"connects-to":1.0}, "global"),
]
SEEDS = [3, 17, 42, 101, 777]
GAINS = [0.5, 1.0, 2.0]

print("recall@1000 · depth 3 · best gain per config shown\n")
print(f"  {'config':<46} {'mean':>7} {'sd':>7}  {'K':>4}")
store = {}
for label, r, coup, norm in CONFIGS:
    best = None
    for K in GAINS:
        vals = []
        for sd in SEEDS:
            rng = random.Random(sd)
            edges = [(i, j, ty) for ty, ps in r.items() for (i, j) in ps]
            rng.shuffle(edges)
            held_r = edges[:int(0.15*len(edges))]
            # always evaluate against the SAME ground-truth edge set
            rng2 = random.Random(sd)
            alle = [(i, j, ty) for ty, ps in rel.items() for (i, j) in ps]
            rng2.shuffle(alle); held = alle[:int(0.15*len(alle))]
            hold_eval = {(i, j) for i, j, _ in held}
            hold_apply = {(i, j, ty) for ty, ps in r.items() for (i, j) in ps
                          if (i, j) in hold_eval}
            M = aggregate(r, coup, norm, holdout=hold_apply)
            H = prop(H0, M, K, 3)
            rc, _, _ = G.recall_at_k(H, held, rel, N)
            vals.append(rc[1000])
        m = stat.mean(vals)
        if best is None or m > best[0]: best = (m, stat.pstdev(vals), K, vals)
    store[label] = best
    print(f"  {label:<46} {best[0]:>7.4f} {best[1]:>7.4f}  {best[2]:>4}")

print("\npaired differences (at each config's best gain, same seeds):")
def cmp(a, b):
    va, vb = store[a][3], store[b][3]
    da = [x-y for x, y in zip(va, vb)]
    m, s = stat.mean(da), stat.pstdev(da)
    t = m/(s/len(da)**0.5) if s > 0 else float('inf')
    print(f"  {a.strip():<46}\n    minus {b.strip():<44} {m:+.4f}  (t={t:+.1f}, {sum(1 for x in da if x>0)}/{len(da)})")
cmp("typed  · GLOBAL norm       · Loudon couplings", "typed  · per-relation norm · Loudon couplings")
cmp("untyped· one channel", "typed  · GLOBAL norm       · Loudon couplings")
cmp("typed  · GLOBAL norm       · no contradicts", "typed  · GLOBAL norm       · Loudon couplings")
cmp("typed  · GLOBAL norm       · Loudon couplings", "typed  · GLOBAL norm       · uniform +1")
