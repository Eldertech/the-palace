#!/usr/bin/env python3
"""Adversarial checks on the first run's claims. Each one has a deflationary
reading; these are the controls that decide between them."""
import json, random, numpy as np
import palace_gnn as G

random.seed(23); np.random.seed(23)
d, mappath = G.load_map()
nodes, idx, N, rel, dropped = G.build(d)
H0 = G.features(nodes)
mats = G.adjacency(N, rel)
DEPTH = 10

print("="*74)
print("CHECK 1 — is repulsion doing work, or is it enough to just remove attraction?")
print("  deflationary reading: contradicts=-1 'works' trivially because I built it in.")
print("="*74)
def probe(coup, label, m=None):
    m = m or mats
    Hs = G.propagate(H0, m, coup, K=1.0, layers=DEPTH)
    h = Hs[-1]
    con, mir = G.contradiction_gap(h, rel, m, coup)
    ratio = con/mir if mir > 1e-9 else float('inf')
    print(f"  {label:<34} spread {G.spread(h):.4f}   contra {con:.4f}   mirror {mir:.4f}   ratio {ratio:7.1f}x")
    return G.spread(h), ratio

for v, lab in ((-1.0,"contradicts = -1 (repel)"), (0.0,"contradicts =  0 (edge ignored)"),
               (1.0,"contradicts = +1 (attract)")):
    c = dict(G.COUPLINGS); c["contradicts"] = v
    probe(c, lab)

# control: same number of edges, same negative weight, but RANDOM pairs
n_con = len(rel["contradicts"])
rng = random.Random(5)
fake = []
while len(fake) < n_con:
    i, j = rng.randrange(N), rng.randrange(N)
    if i != j: fake.append((i, j))
rel_fake = dict(rel); rel_fake["contradicts"] = fake
mats_fake = G.adjacency(N, rel_fake)
c = dict(G.COUPLINGS); c["contradicts"] = -1.0
Hs = G.propagate(H0, mats_fake, c, K=1.0, layers=DEPTH)
h = Hs[-1]
con, mir = G.contradiction_gap(h, rel, mats, c)   # measured on the REAL contradicts pairs
print(f"  {'-1 on 60 RANDOM pairs (control)':<34} spread {G.spread(h):.4f}   "
      f"real-contra {con:.4f}   mirror {mir:.4f}   ratio {con/mir if mir>1e-9 else 0:7.1f}x")

print()
print("="*74)
print("CHECK 2 — which link types actually carry predictive signal? (ablation)")
print("  deflationary reading: the typed-link ontology is decoration; only degree matters.")
print("="*74)
all_edges = [(i, j, ty) for ty, ps in rel.items() for (i, j) in ps]
rng2 = random.Random(77)
rng2.shuffle(all_edges)
held = all_edges[:int(0.15*len(all_edges))]
hold = set(held)

def score(rel_used, label, depth=3):
    m = G.adjacency(N, rel_used, holdout=hold)
    Hs = G.propagate(H0, m, G.COUPLINGS, K=1.0, layers=depth)
    rc, nh, _ = G.recall_at_k(Hs[-1], held, rel, N)
    print(f"  {label:<36} recall@1000 {rc[1000]:.4f}   @200 {rc[200]:.4f}")
    return rc[1000]

base_txt, _, _ = G.recall_at_k(H0, held, rel, N)
print(f"  {'text only, no message passing':<36} recall@1000 {base_txt[1000]:.4f}   @200 {base_txt[200]:.4f}")
full = score(rel, "all relations")

# degree-only control: same edges, all types collapsed to one untyped channel
rel_flat = {"connects-to": [p for ps in rel.values() for p in ps]}
flat = score(rel_flat, "UNTYPED (all edges, one channel)")

print("  --- leave-one-out ---")
deltas = []
for ty in sorted(rel, key=lambda t: -len(rel[t])):
    r2 = {k: v for k, v in rel.items() if k != ty}
    s = score(r2, f"without {ty} ({len(rel[ty])} edges)")
    deltas.append((ty, len(rel[ty]), s - full))

print("\n  contribution (drop in recall@1000 when removed, per 100 edges):")
for ty, n, dl in sorted(deltas, key=lambda x: x[2]):
    per100 = (-dl)/(n/100)
    print(f"    {ty:<16} {n:>5} edges   delta {dl:+.4f}   per-100-edges {per100:+.4f}")
