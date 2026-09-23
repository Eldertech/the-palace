#!/usr/bin/env python3
"""Repeat the decisive contrasts across seeds. ~360 held-out edges is small;
a 0.03 gap needs to survive resampling before it means anything."""
import random, numpy as np, statistics as stat
import palace_gnn as G

d, _ = G.load_map()
nodes, idx, N, rel, _ = G.build(d)
H0 = G.features(nodes)

CONFIGS = {}
CONFIGS["text only (no passing)"]      = ("text", None)
CONFIGS["typed, all relations"]        = ("rel", (rel, G.COUPLINGS))
c_nc = dict(G.COUPLINGS); c_nc["contradicts"] = 0.0
CONFIGS["typed, contradicts disabled"] = ("rel", (rel, c_nc))
c_nm = dict(G.COUPLINGS); c_nm["mirrors"] = 0.0
CONFIGS["typed, mirrors disabled"]     = ("rel", (rel, c_nm))
rel_flat = {"connects-to": [p for ps in rel.values() for p in ps]}
CONFIGS["untyped (one channel)"]       = ("rel", (rel_flat, {"connects-to": 1.0}))
c_pos = dict(G.COUPLINGS); c_pos["contradicts"] = 1.0
CONFIGS["typed, contradicts POSITIVE"] = ("rel", (rel, c_pos))

res = {k: [] for k in CONFIGS}
SEEDS = [3, 17, 42, 101, 777, 1234, 90210]
for sd in SEEDS:
    rng = random.Random(sd)
    edges = [(i, j, ty) for ty, ps in rel.items() for (i, j) in ps]
    rng.shuffle(edges)
    held = edges[:int(0.15*len(edges))]
    hold = set(held)
    for name, (kind, cfg) in CONFIGS.items():
        if kind == "text":
            H = H0
        else:
            r, coup = cfg
            m = G.adjacency(N, r, holdout=hold)
            H = G.propagate(H0, m, coup, K=1.0, layers=3)[-1]
        rc, _, _ = G.recall_at_k(H, held, rel, N)
        res[name].append(rc[1000])

print(f"recall@1000, {len(SEEDS)} seeds, 15% held out (~{int(0.15*sum(len(v) for v in rel.values()))} edges)\n")
print(f"  {'config':<32} {'mean':>7} {'sd':>7}   runs")
base = None
for name in CONFIGS:
    v = res[name]; m = stat.mean(v); s = stat.pstdev(v)
    if base is None: base = m
    print(f"  {name:<32} {m:>7.4f} {s:>7.4f}   " + " ".join(f"{x:.3f}" for x in v))

def cmp(a, b):
    da = [x-y for x, y in zip(res[a], res[b])]
    m, s = stat.mean(da), stat.pstdev(da)
    t = m/(s/len(da)**0.5) if s > 0 else float('inf')
    wins = sum(1 for x in da if x > 0)
    print(f"  {a:<32} minus {b:<30} {m:+.4f}  (paired t={t:+.1f}, {wins}/{len(da)} seeds)")

print("\npaired differences:")
cmp("typed, contradicts disabled", "typed, all relations")
cmp("untyped (one channel)", "typed, all relations")
cmp("typed, mirrors disabled", "typed, all relations")
cmp("typed, contradicts disabled", "untyped (one channel)")
