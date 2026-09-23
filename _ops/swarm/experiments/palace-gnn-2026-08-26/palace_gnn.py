#!/usr/bin/env python3
"""Palace GNN — message passing on the palace's own typed-link graph.

Nothing is trained. Every weight is a number Loudon chose, so each run is an
argument about how a relation behaves rather than a fit to a loss.

Architecture: an R-GCN (relational graph convolution) reduced to its honest core.
A full R-GCN gives every relation type its own learned matrix W_r. Here W_r is a
SCALAR times the identity — one coupling constant per link type. That keeps the
whole model readable (ten numbers) and makes `contradicts` expressible as a
negative coupling, which is the point of the experiment.

    H_{l+1} = (1-res)*[ s*H_l + K * sum_r  a_r * D_r^-1 A_r H_l ] + res*H_0

Adopted, not rebuilt: the graph comes from the Map Build Ceremony's dated JSON
(`_ops/maps/palace-map-full-*.json`), the same file STIGMERGY's /api/topology
serves. This script never re-parses the vault for structure — only for body text.
"""
import json, re, math, glob, os, sys, hashlib
from pathlib import Path
from collections import defaultdict
import numpy as np

PALACE = Path(__file__).resolve().parents[4]
HERE = Path(__file__).resolve().parent

# ---------------------------------------------------------------- relation kinds
# symmetric per SCHEMA §4; the rest are directed and get an inverse channel.
SYMMETRIC = {"connects-to", "mirrors", "contradicts", "couples-with"}
DIRECTED  = {"enables", "deepens", "spawned", "emerged-from", "exemplifies", "member-of"}

# The coupling constants. This dict IS the model.
COUPLINGS = {
    "connects-to":  0.5,
    "mirrors":      1.0,   # deep structural identity -> pulls hard
    "couples-with": 1.0,   # co-activation, Kuramoto-style
    "deepens":      0.8,
    "enables":      0.6,
    "exemplifies":  0.7,
    "member-of":    0.5,
    "spawned":      0.4,   # lineage, not similarity
    "emerged-from": 0.4,
    "contradicts": -1.0,   # <- the anti-smoothing edge. flip to +1.0 to disarm it.
}

STAGES = ["seed","sprout","growing","mature","fruiting","dormant","composting","foundational"]
TYPES  = ["concept","hub","project","source","meta","practice","person",
          "question","spore","specialist","maker"]

TEXT_DIM = 128
STOP = set("""the a an and or but if of to in on at for with as is are was were be been being
it its this that these those from by not no do does did so such than then there here what which
who whom whose when where why how all any both each few more most other some only own same too
very can will just i you he she they we our your their my me him her them us not into over under
again further once about against between during before after above below up down out off""".split())

# ---------------------------------------------------------------- graph loading
def load_map(path=None):
    if path is None:
        cands = sorted(glob.glob(str(PALACE / "_ops" / "maps" / "palace-map-full-*.json")))
        if not cands:
            sys.exit("no palace map found — run _ops/swarm/build-map-<date>.py first")
        path = cands[-1]
    d = json.load(open(path))
    return d, path

def build(d):
    nodes = d["nodes"]
    idx = {n["id"]: i for i, n in enumerate(nodes)}
    N = len(nodes)
    # per-relation edge lists; ghost targets (no node) are dropped
    rel = defaultdict(list)
    dropped = 0
    for e in d["edges"]:
        s, t, ty = e["source"], e["target"], e["type"]
        if s not in idx or t not in idx or ty not in COUPLINGS:
            dropped += 1
            continue
        i, j = idx[s], idx[t]
        if i == j:
            continue
        rel[ty].append((i, j))
    return nodes, idx, N, rel, dropped

def adjacency(N, rel, holdout=None):
    """Row-normalised A_r per relation. Symmetric types get both directions;
    directed types get a separate inverse channel (standard R-GCN practice)."""
    mats = {}
    hold = holdout or set()
    for ty, pairs in rel.items():
        fwd = np.zeros((N, N), dtype=np.float32)
        inv = np.zeros((N, N), dtype=np.float32)
        for i, j in pairs:
            if (i, j, ty) in hold:
                continue
            fwd[i, j] = 1.0
            inv[j, i] = 1.0
        if ty in SYMMETRIC:
            A = np.maximum(fwd, inv)
            mats[ty] = [row_norm(A)]
        else:
            mats[ty] = [row_norm(fwd), row_norm(inv)]
    return mats

def row_norm(A):
    deg = A.sum(1, keepdims=True)
    deg[deg == 0] = 1.0
    return A / deg

# ---------------------------------------------------------------- node features
def hashed_tfidf(texts, dim=TEXT_DIM):
    """Pure-numpy hashed bag of words with idf weighting. Crude on purpose:
    no model download, no network, reproducible."""
    N = len(texts)
    counts = np.zeros((N, dim), dtype=np.float32)
    df = np.zeros(dim, dtype=np.float32)
    for n, t in enumerate(texts):
        seen = set()
        for w in re.findall(r"[a-z][a-z'-]{2,}", t.lower()):
            if w in STOP:
                continue
            h = int(hashlib.blake2b(w.encode(), digest_size=4).hexdigest(), 16) % dim
            counts[n, h] += 1.0
            seen.add(h)
        for h in seen:
            df[h] += 1.0
    idf = np.log((N + 1.0) / (df + 1.0)) + 1.0
    X = np.log1p(counts) * idf
    return l2(X)

def l2(X):
    n = np.linalg.norm(X, axis=1, keepdims=True)
    n[n == 0] = 1.0
    return X / n

def features(nodes):
    texts = []
    for n in nodes:
        p = PALACE / n["path"]
        try:
            raw = p.read_text(errors="ignore")
        except OSError:
            raw = n["id"]
        body = re.sub(r"^---\n.*?\n---\n", "", raw, flags=re.DOTALL)
        texts.append(n["id"] + " " + body[:20000])
    T = hashed_tfidf(texts)

    S = np.zeros((len(nodes), len(TYPES) + len(STAGES) + 3), dtype=np.float32)
    for i, n in enumerate(nodes):
        if n.get("type") in TYPES:
            S[i, TYPES.index(n["type"])] = 1.0
        if n.get("stage") in STAGES:
            S[i, len(TYPES) + STAGES.index(n["stage"])] = 1.0
        o = len(TYPES) + len(STAGES)
        S[i, o + 0] = math.log1p(n.get("outbound_count", 0)) / 4.0
        S[i, o + 1] = math.log1p(n.get("inbound_count", 0)) / 4.0
        try:
            S[i, o + 2] = math.log1p(float(n.get("activation_count") or 0)) / 4.0
        except (TypeError, ValueError):
            pass
    # text carries the meaning; structure is a modest side channel
    return l2(np.hstack([0.35 * S, T]))

# ---------------------------------------------------------------- the layer
def propagate(H0, mats, couplings, K=1.0, layers=6, self_w=1.0, residual=0.0,
              renorm=True):
    """Returns the list of H at every depth 0..layers."""
    H = H0.copy()
    out = [H.copy()]
    for _ in range(layers):
        agg = np.zeros_like(H)
        for ty, chans in mats.items():
            a = couplings.get(ty, 0.0)
            if a == 0.0:
                continue
            for A in chans:
                agg += (a / len(chans)) * (A @ H)
        H = self_w * H + K * agg
        if residual > 0.0:
            H = (1.0 - residual) * H + residual * H0
        if renorm:
            H = l2(H)          # keeps scale out of the smoothing measurement
        out.append(H.copy())
    return out

# ---------------------------------------------------------------- metrics
def spread(H):
    """Mean squared distance of each node from the centroid. Oversmoothing is
    this number going to zero: every entry becoming the same entry."""
    c = H.mean(0, keepdims=True)
    return float(np.mean(np.sum((H - c) ** 2, axis=1)))

def dirichlet(H, mats, couplings):
    """Graph Dirichlet energy over the positively-coupled edges: how much
    neighbours still disagree. The field's standard oversmoothing measure."""
    tot, cnt = 0.0, 0
    for ty, chans in mats.items():
        if couplings.get(ty, 0.0) <= 0:
            continue
        A = chans[0]
        ii, jj = np.nonzero(A)
        if len(ii) == 0:
            continue
        tot += float(np.sum((H[ii] - H[jj]) ** 2))
        cnt += len(ii)
    return tot / max(cnt, 1)

def contradiction_gap(H, rel, mats, couplings):
    """Mean distance across `contradicts` edges vs across `mirrors` edges.
    A healthy palace keeps contraries far apart and mirrors close."""
    def mean_d(pairs):
        if not pairs:
            return float("nan")
        ii = np.array([p[0] for p in pairs]); jj = np.array([p[1] for p in pairs])
        return float(np.mean(np.sum((H[ii] - H[jj]) ** 2, axis=1)))
    return mean_d(rel.get("contradicts", [])), mean_d(rel.get("mirrors", []))

# ---------------------------------------------------------------- link prediction
def predict_links(H, nodes, rel, top=30, exclude=None, drop_specialist_pairs=True):
    """Ranked by MUTUAL RANK, not raw cosine. At useful depths every score is
    ~0.999, so raw similarity stops discriminating; asking instead "is j near the
    top of i's list AND i near the top of j's" recovers the signal. Same trick
    the recommender people call reciprocal rank."""
    S = H @ H.T
    np.fill_diagonal(S, -9e9)
    existing = set()
    for pairs in rel.values():
        for i, j in pairs:
            existing.add((i, j)); existing.add((j, i))
    for i, j in (exclude or set()):
        existing.add((i, j)); existing.add((j, i))
    N = len(nodes)
    rank = np.empty((N, N), dtype=np.int32)
    for i in range(N):
        rank[i, np.argsort(-S[i])] = np.arange(N)
    iu, ju = np.triu_indices(N, 1)
    mr = np.maximum(rank[iu, ju], rank[ju, iu]).astype(np.float64)   # lower is better
    order = np.argsort(mr)
    out = []
    for k in order:
        i, j = int(iu[k]), int(ju[k])
        if (i, j) in existing:
            continue
        if drop_specialist_pairs and nodes[i]["type"] == "specialist" and nodes[j]["type"] == "specialist":
            continue
        out.append({"a": nodes[i]["id"], "b": nodes[j]["id"],
                    "mutual_rank": int(mr[k]),
                    "score": round(float(S[i, j]), 4),
                    "a_type": nodes[i]["type"], "b_type": nodes[j]["type"]})
        if len(out) >= top:
            break
    return out

def recall_at_k(H, held, rel_all, N, ks=(50, 200, 1000)):
    """Hold-out edges we hid from message passing: does geometry rank them high
    among all candidate pairs? This is what makes the Weave falsifiable."""
    S = H @ H.T
    np.fill_diagonal(S, -9e9)
    known = set()
    for pairs in rel_all.values():
        for i, j in pairs:
            known.add((min(i,j), max(i,j)))
    held_u = {(min(i,j), max(i,j)) for i, j, _ in held}
    iu, ju = np.triu_indices(N, 1)
    mask = np.array([ (int(a),int(b)) in held_u or (int(a),int(b)) not in known
                      for a, b in zip(iu, ju) ])
    ii, jj = iu[mask], ju[mask]
    sc = S[ii, jj]
    order = np.argsort(-sc)
    ranked = [(int(ii[k]), int(jj[k])) for k in order]
    pos = {p: r for r, p in enumerate(ranked)}
    res = {}
    for k in ks:
        hit = sum(1 for p in held_u if pos.get(p, 10**9) < k)
        res[k] = hit / max(len(held_u), 1)
    return res, len(held_u), len(ranked)
