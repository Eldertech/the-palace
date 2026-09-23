#!/usr/bin/env python3
"""Leave-one-relation-out, under the CLEAN config (global norm, uniform +1 gain),
multi-seed. Asks: which of Loudon's link types connect entries a text-similarity
model would already have put near each other, and which connect across distance?
"""
import random, statistics as stat, numpy as np
import palace_gnn as G
from disentangle import aggregate, prop

d, _ = G.load_map()
nodes, idx, N, rel, _ = G.build(d)
H0 = G.features(nodes)
SEEDS = [3, 17, 42, 101, 777, 1234, 90210]
UNIFORM = {t: 1.0 for t in rel}
K, L = 2.0, 3

def evaluate(coup, seeds=SEEDS):
    vals = []
    for sd in seeds:
        rng = random.Random(sd)
        alle = [(i, j, ty) for ty, ps in rel.items() for (i, j) in ps]
        rng.shuffle(alle); held = alle[:int(0.15*len(alle))]
        hold = set(held)
        M = aggregate(rel, coup, "global", holdout=hold)
        H = prop(H0, M, K, L)
        rc, _, _ = G.recall_at_k(H, held, rel, N)
        vals.append(rc[1000])
    return vals

full = evaluate(UNIFORM)
print(f"baseline · all relations at +1 · recall@1000 = {stat.mean(full):.4f} (sd {stat.pstdev(full):.4f})\n")
print(f"  {'relation removed':<16} {'edges':>6} {'recall':>8} {'delta':>9} {'t':>7}  seeds-worse")
rows = []
for ty in sorted(rel, key=lambda t: -len(rel[t])):
    c = dict(UNIFORM); c[ty] = 0.0
    v = evaluate(c)
    da = [x-y for x, y in zip(v, full)]
    m, s = stat.mean(da), stat.pstdev(da)
    t = m/(s/len(da)**0.5) if s > 0 else 0.0
    worse = sum(1 for x in da if x < 0)
    rows.append((ty, len(rel[ty]), stat.mean(v), m, t, worse))
    print(f"  {ty:<16} {len(rel[ty]):>6} {stat.mean(v):>8.4f} {m:>+9.4f} {t:>+7.1f}  {worse}/{len(SEEDS)}")

print("\n  ranked by value per 100 edges (positive = removing it HURTS = it carries signal):")
for ty, n, mv, dl, t, w in sorted(rows, key=lambda r: -(-r[3])/(r[1]/100)):
    print(f"    {ty:<16} {(-dl)/(n/100):>+8.4f}   ({n} edges, t={t:+.1f})")

# Direct homophily measure, independent of the GNN: how close are the two ends
# of each link type in RAW text space, before any message passing?
print("\n  raw text-space cosine across each link type (no message passing at all):")
sims = {}
for ty, ps in sorted(rel.items(), key=lambda kv: -len(kv[1])):
    ii = np.array([p[0] for p in ps]); jj = np.array([p[1] for p in ps])
    sims[ty] = float(np.mean(np.sum(H0[ii]*H0[jj], axis=1)))
rng = random.Random(1)
rand = [np.dot(H0[rng.randrange(N)], H0[rng.randrange(N)]) for _ in range(20000)]
base = float(np.mean(rand))
print(f"    {'(random pair)':<16} {base:>7.4f}")
for ty, v in sorted(sims.items(), key=lambda kv: -kv[1]):
    print(f"    {ty:<16} {v:>7.4f}   {v-base:+.4f} vs random")
