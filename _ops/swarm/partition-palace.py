#!/usr/bin/env python3
"""Partition the palace map into clusters — one lens at a time.

A **lens is a parameter.** The Multi-Lens Weave (see [[Swarm Weave]] § The
Multi-Lens Weave) reads that an entry's connections are not a fixed set — they
depend on the lens you read it in. This tool cuts the *same* map several
different ways so nexus entries land in each family they belong to. Run it once
per lens; the coordinator reads agreement across lenses (confidence) and
single-lens sightings (surprise gems).

Pure and deterministic — stdlib only, no network, no writes to canon. Reads the
newest `_ops/maps/palace-map-full-*.json` (or `--map`) and emits, per cluster,
its **member entries** and its **boundary edges** (edges crossing the cut).
Sibling to the other `_ops/swarm/` helpers; the map builder is its upstream.

Lenses
------
  random     the anti-lens (oblique): a chance cover with no organizing axis, so
             it can surface connections no principled cut would ever put in one
             room (a Cage/Eno move). Each entry lands in `--cover` distinct groups
             (default 2 — two lottery tickets per entry; a surprise seen in both
             rooms is real, not an artifact). Seeded (`--seed`) for reproducibility.
             Its mandate is its own: hunt ONLY the odd/surprising, null is valid.
  folder     directory families (organizational coherence — Shop/, Projects/, …).
             `(root)` is the flat general population, flagged as a non-coherence
             unit: it is a pile, not a family, and should be subdivided or
             skipped rather than handed to one agent.
  community  dependency-free label propagation on the undirected edge list
             (topological communities → cross-domain connection). Deterministic:
             async updates in sorted node order, ties broken by smallest label.
             The graph is dense (avg degree ~15), so vanilla LPA tends to
             collapse into a few giant blobs; `--demote-hubs N` lifts the top-N
             degree nodes out before propagation and reattaches each to its
             plurality community afterward, which lets real communities separate.
  mirror     connected components over one link type (default `mirrors`) — the
             rhymes-across-domains that surface the deepest synthesis (gems).
             Nodes touching no such edge are reported as `unclustered`.
  lifecycle  the walk (2026-09): rooms of ~5 under-reached targets — newcomers under
             the inbound target plus the unreachable — grouped by community, each
             target carrying its 1-hop neighbours and a CAPPED 2-hop set (hubs are
             neither walked through nor offered; ranked by shared community, then by
             how many paths reach it). Targets come from
             `new-entry-catchup.py --since-last-weave --json` via `--targets`.
             Composting entries are skipped (the composting block decides them).
  bridge     the bipartite cut (2026-09): tool-side entries (project · specialist ·
             maker, topped up by concept/practice/hub carrying `tools` without
             `philosophy`) against thought-side entries (person, topped up by
             `philosophy` without `tools`). Four-pillar and both/neither entries sit
             out, as do composting/dormant entries and ceremony cards. Each room is
             `--per-side` T + `--per-side` P, dealt round-robin by community so no room is
             one dense cluster. Default rooms = enough to seat the whole smaller side;
             the larger side's seats go to the entries with the FEWEST other-side
             neighbours within 2 hops (the never-paired). Mines "one mind, two vocabularies".
  stratified random with a ceiling (2026-09): each room holds at most its fair share
             from any one community (resting entries sit out), so chance pairs cross clusters instead of landing
             inside one (~40% of plain-random pairs did, in July). The ceiling is each
             community's proportional share plus one. `--cover`, `--groups`,
             `--seed` as for random.

Usage
-----
  python3 _ops/swarm/partition-palace.py --lens folder
  python3 _ops/swarm/partition-palace.py --lens community --demote-hubs 12
  python3 _ops/swarm/partition-palace.py --lens mirror
  python3 _ops/swarm/partition-palace.py --lens community --out clusters.json --json
  python3 _ops/swarm/new-entry-catchup.py --since-last-weave --json > targets.json
  python3 _ops/swarm/partition-palace.py --lens lifecycle --targets targets.json
  python3 _ops/swarm/partition-palace.py --lens bridge --groups 8
  python3 _ops/swarm/partition-palace.py --lens stratified --groups 12 --cover 2

By default prints a human summary; `--out PATH` writes the full JSON (members +
boundary edges); `--json` also dumps the JSON to stdout.
"""
import argparse
import json
import math
import re
import random as _random
import sys
from collections import Counter, defaultdict, deque
from pathlib import Path

PALACE = Path(__file__).resolve().parent.parent.parent
MAPS = PALACE / "_ops" / "maps"


def newest_map() -> Path:
    cands = sorted(MAPS.glob("palace-map-full-*.json"))
    if not cands:
        sys.exit("No palace-map-full-*.json found in _ops/maps/ — run a build-map-*.py first.")
    return cands[-1]


def load_map(path: Path):
    d = json.loads(path.read_text())
    nodes = {n["id"]: n for n in d["nodes"]}
    # keep only intra-graph edges (both endpoints are real nodes); drop self-loops.
    edges = []
    for e in d["edges"]:
        s, t = e["source"], e["target"]
        if s in nodes and t in nodes and s != t:
            edges.append({"source": s, "target": t, "type": e["type"], "label": e.get("label")})
    return nodes, edges


# ---------------------------------------------------------------- shared helpers

def undirected_adj(edges, node_ids, link_types=None):
    """Undirected adjacency, deduped. Optionally restrict to given link types."""
    adj = defaultdict(set)
    for e in edges:
        if link_types is not None and e["type"] not in link_types:
            continue
        adj[e["source"]].add(e["target"])
        adj[e["target"]].add(e["source"])
    return adj


def assemble(cluster_of, nodes, edges, unclustered=None):
    """Given a node->cluster_id map, build the cluster records with boundary edges."""
    members = defaultdict(list)
    for nid in sorted(nodes):
        if nid in cluster_of:
            members[cluster_of[nid]].append(nid)

    internal = Counter()
    boundary = defaultdict(list)
    for e in edges:
        cs = cluster_of.get(e["source"])
        ct = cluster_of.get(e["target"])
        if cs is None or ct is None:
            continue
        if cs == ct:
            internal[cs] += 1
        else:
            rec = {"source": e["source"], "target": e["target"], "type": e["type"]}
            if e.get("label"):
                rec["label"] = e["label"]
            boundary[cs].append(rec)
            boundary[ct].append(rec)

    clusters = []
    for cid in sorted(members, key=lambda c: (-len(members[c]), str(c))):
        clusters.append({
            "id": cid,
            "size": len(members[cid]),
            "members": members[cid],
            "internal_edge_count": internal[cid],
            "boundary_edge_count": len(boundary[cid]),
            "boundary_edges": boundary[cid],
        })
    out = {"cluster_count": len(clusters), "clusters": clusters}
    if unclustered:
        out["unclustered"] = sorted(unclustered)
    return out


# ---------------------------------------------------------------- lens: folder

def lens_folder(nodes, edges):
    def family(path):
        return path.split("/")[0] if "/" in path else "(root)"
    cluster_of = {nid: family(n["path"]) for nid, n in nodes.items()}
    out = assemble(cluster_of, nodes, edges)
    # flag the flat general population as a non-coherence unit
    for c in out["clusters"]:
        c["coherence_unit"] = c["id"] != "(root)"
    return out


# ---------------------------------------------------------------- lens: community

def lens_community(nodes, edges, iterations=100, demote_hubs=0):
    node_ids = set(nodes)
    full_adj = undirected_adj(edges, node_ids)

    demoted = []
    if demote_hubs > 0:
        by_deg = sorted(node_ids, key=lambda n: (-len(full_adj[n]), n))
        demoted = set(by_deg[:demote_hubs])
    else:
        demoted = set()

    active = sorted(n for n in node_ids if n not in demoted)
    adj = {n: {m for m in full_adj[n] if m not in demoted} for n in active}

    # deterministic asynchronous label propagation
    label = {n: n for n in active}
    for _ in range(iterations):
        changed = False
        for n in active:  # sorted, fixed order → deterministic
            if not adj[n]:
                continue
            counts = Counter(label[m] for m in adj[n])
            # tie-break: highest count, then lexicographically smallest label
            top = max(counts.values())
            best = min(lab for lab, c in counts.items() if c == top)
            if label[n] != best:
                label[n] = best
                changed = True
        if not changed:
            break

    cluster_of = {n: label[n] for n in active}

    # reattach demoted hubs to their plurality community
    reattached = {}
    for h in sorted(demoted):
        neigh_labels = Counter(cluster_of[m] for m in full_adj[h] if m in cluster_of)
        if neigh_labels:
            top = max(neigh_labels.values())
            cluster_of[h] = sorted(lab for lab, c in neigh_labels.items() if c == top)[0]
            reattached[h] = cluster_of[h]
        else:
            cluster_of[h] = h  # isolated hub becomes its own singleton

    # relabel cluster ids to stable human names: "C1", "C2", ... by descending size
    order = sorted(Counter(cluster_of.values()).items(), key=lambda kv: (-kv[1], str(kv[0])))
    rename = {old: f"C{i+1}" for i, (old, _) in enumerate(order)}
    cluster_of = {n: rename[c] for n, c in cluster_of.items()}

    out = assemble(cluster_of, nodes, edges)
    out["params"] = {"iterations": iterations, "demote_hubs": demote_hubs,
                     "demoted_hubs": sorted(demoted)}
    return out


# ---------------------------------------------------------------- lens: mirror

def lens_mirror(nodes, edges, link_type="mirrors", demote_hubs=0):
    node_ids = set(nodes)
    full_adj = undirected_adj(edges, node_ids, link_types={link_type})

    # The whole-graph `mirrors` component is one giant knot (everything rhymes
    # *through* the super-connectors Spinoza / Kuramoto / Hyperdimensional Prism).
    # Lifting the top-N mirror-degree nodes lets the small rhyme-families — the
    # actual gems — fall out as their own components. Demoted hubs are reported,
    # not reattached: the gem pass wants the sub-families, not the known knot.
    demoted = set()
    if demote_hubs > 0:
        by_deg = sorted((n for n in full_adj if full_adj[n]), key=lambda n: (-len(full_adj[n]), n))
        demoted = set(by_deg[:demote_hubs])
    adj = {n: {m for m in full_adj[n] if m not in demoted} for n in full_adj if n not in demoted}

    seen = set()
    cluster_of = {}
    comp_idx = 0
    # deterministic BFS over sorted nodes that touch a link-of-type edge
    touched = sorted(n for n in adj if adj[n])
    for start in touched:
        if start in seen:
            continue
        comp_idx += 1
        cid = f"M{comp_idx}"
        q = deque([start])
        seen.add(start)
        while q:
            cur = q.popleft()
            cluster_of[cur] = cid
            for m in sorted(adj[cur]):
                if m not in seen:
                    seen.add(m)
                    q.append(m)
    unclustered = [n for n in node_ids if n not in cluster_of and n not in demoted]
    # rename components by descending size for readability
    sizes = Counter(cluster_of.values())
    order = sorted(sizes.items(), key=lambda kv: (-kv[1], kv[0]))
    rename = {old: f"M{i+1}" for i, (old, _) in enumerate(order)}
    cluster_of = {n: rename[c] for n, c in cluster_of.items()}
    out = assemble(cluster_of, nodes, edges, unclustered=unclustered)
    out["link_type"] = link_type
    out["params"] = {"demote_hubs": demote_hubs, "demoted_hubs": sorted(demoted)}
    return out


# ---------------------------------------------------------------- lens: random (oblique)

def lens_random(nodes, edges, groups=12, cover=2, seed=20260706):
    """A chance cover: each entry assigned to `cover` DISTINCT random groups.

    No organizing axis — the point is bias-free adjacency. Deterministic given
    `seed`. Boundary edges are omitted (meaningless for an arbitrary cut); what
    matters is which strangers share a room."""
    rng = _random.Random(seed)
    ids = sorted(nodes)
    if cover > groups:
        sys.exit(f"--cover ({cover}) cannot exceed --groups ({groups}).")
    members = defaultdict(list)
    # greedy-balanced: each entry picks `cover` distinct groups, biased toward
    # the currently-smallest groups so sizes stay even without a rebalance pass.
    sizes = {g: 0 for g in range(groups)}
    for nid in ids:
        # candidate groups sorted by current size (smallest first), ties broken randomly
        order = sorted(range(groups), key=lambda g: (sizes[g], rng.random()))
        chosen = order[:cover]
        for g in chosen:
            members[g].append(nid)
            sizes[g] += 1
    clusters = []
    for g in sorted(members, key=lambda g: (-len(members[g]), g)):
        clusters.append({
            "id": f"R{g+1}",
            "size": len(members[g]),
            "members": sorted(members[g]),
            "internal_edge_count": None,
            "boundary_edge_count": None,
            "boundary_edges": [],
        })
    return {"cluster_count": len(clusters), "clusters": clusters,
            "params": {"groups": groups, "cover": cover, "seed": seed}}


# ---------------------------------------------------------------- shared: communities, pillars

def communities(nodes, edges, demote_hubs=12):
    """node -> community id, plus the demoted hubs, from the community lens."""
    r = lens_community(nodes, edges, demote_hubs=demote_hubs)
    comm = {m: c["id"] for c in r["clusters"] for m in c["members"]}
    return comm, set(r["params"]["demoted_hubs"])


PILLARS_INLINE = re.compile(r"^pillars:\s*\[([^\]]*)\]", re.M)
PILLARS_BLOCK = re.compile(r"^pillars:\s*\n((?:\s*-\s*.+\n)+)", re.M)


def pillars_of(path):
    try:
        head = (PALACE / path).read_text(encoding="utf-8", errors="ignore")[:4000]
    except OSError:
        return set()
    m = PILLARS_INLINE.search(head)
    if m:
        return {x.strip().strip("'\"").lower() for x in m.group(1).split(",") if x.strip()}
    m = PILLARS_BLOCK.search(head)
    if m:
        return {ln.strip()[1:].strip().strip("'\"").lower() for ln in m.group(1).splitlines() if ln.strip()}
    return set()


# ---------------------------------------------------------------- lens: lifecycle (the walk)

def lens_lifecycle(nodes, edges, targets_path, per_room=5, hop2_cap=12):
    if not targets_path:
        sys.exit("--lens lifecycle needs --targets (new-entry-catchup.py --since-last-weave --json).")
    t = json.loads(Path(targets_path).read_text())
    ids = [n["id"] for n in t.get("newcomers", [])]
    ids += [u["id"] for u in t.get("unreachable", []) if u.get("stage") != "composting"]
    targets, seen, missing = [], set(), []
    for i in ids:
        if i in seen:
            continue
        seen.add(i)
        (targets if i in nodes else missing).append(i)
    comm, hubs = communities(nodes, edges)
    adj = undirected_adj(edges, set(nodes))

    walks = {}
    for tg in targets:
        hop1 = sorted(adj[tg])
        paths = Counter()
        for n in hop1:
            if n in hubs:            # don't walk through a hub — its neighbourhood is the palace
                continue
            for m in adj[n]:
                if m != tg and m not in adj[tg] and m not in hubs:
                    paths[m] += 1
        ranked = sorted(paths, key=lambda m: (comm.get(m) != comm.get(tg), -paths[m], m))
        walks[tg] = {"community": comm.get(tg), "hop1": hop1, "hop2": ranked[:hop2_cap],
                     "hop2_dropped": max(0, len(ranked) - hop2_cap),
                     "note": None if hop1 else "no typed edges at all — the walk has no road; search by title and body text"}

    # pack rooms community-first: whole-community chunks, then pool the remainders
    by_comm = defaultdict(list)
    for tg in targets:
        by_comm[comm.get(tg, "none")].append(tg)
    rooms, leftovers = [], []
    for c in sorted(by_comm, key=lambda c: (-len(by_comm[c]), str(c))):
        grp = sorted(by_comm[c])
        while len(grp) >= per_room:
            rooms.append(grp[:per_room]); grp = grp[per_room:]
        leftovers += grp
    for i in range(0, len(leftovers), per_room):
        rooms.append(leftovers[i:i + per_room])

    clusters = []
    for k, room in enumerate(rooms):
        files = set(room)
        for tg in room:
            files |= set(walks[tg]["hop1"]) | set(walks[tg]["hop2"])
        clusters.append({"id": f"L{k+1}", "size": len(room), "members": room,
                         "walk": {tg: walks[tg] for tg in room},
                         "files_in_reach": len(files),
                         "internal_edge_count": None, "boundary_edge_count": None, "boundary_edges": []})
    out = {"cluster_count": len(clusters), "clusters": clusters,
           "params": {"per_room": per_room, "hop2_cap": hop2_cap, "targets": len(targets)}}
    if missing:
        out["unclustered"] = missing   # named by the catch-up but absent from this map
    return out


# ---------------------------------------------------------------- lens: bridge (tool x thought)

RESTING = {"composting", "dormant"}


def lens_bridge(nodes, edges, groups=None, per_side=6, seed=20260924):
    T_TYPES, P_TYPES, TOPUP = {"project", "specialist", "maker"}, {"person"}, {"concept", "practice", "hub"}
    side, excluded = {}, []
    for nid, n in nodes.items():
        ty = n.get("type")
        if n.get("stage") in RESTING or n.get("ops_card"):
            continue   # resting entries are decided elsewhere; ceremonies aren't the maker's tools
        if ty in T_TYPES:
            side[nid] = "T"
        elif ty in P_TYPES:
            side[nid] = "P"
        elif ty in TOPUP:
            pl = pillars_of(n["path"])
            if len(pl) >= 4:
                excluded.append(nid)
            elif "tools" in pl and "philosophy" not in pl:
                side[nid] = "T"
            elif "philosophy" in pl and "tools" not in pl:
                side[nid] = "P"
            else:
                excluded.append(nid)
    T = sorted(k for k, v in side.items() if v == "T")
    P = sorted(k for k, v in side.items() if v == "P")
    adj = undirected_adj(edges, set(nodes))
    comm, _ = communities(nodes, edges)

    def near_other(nid):
        """How many other-side entries sit within 2 hops — few means never-paired."""
        other = "P" if side[nid] == "T" else "T"
        reach = set(adj[nid])
        for m in list(adj[nid]):
            reach |= adj[m]
        return sum(1 for m in reach if side.get(m) == other)

    rng = _random.Random(seed)
    if not groups:   # default: enough rooms that every entry on the smaller side gets one
        groups = max(1, math.ceil(min(len(T), len(P)) / per_side))
    need = groups * per_side

    def pick(pool):
        ranked = sorted(pool, key=lambda n: (near_other(n), rng.random()))
        chosen = ranked[:need]
        # deal round-robin by community so each room mixes clusters
        chosen.sort(key=lambda n: (str(comm.get(n)), n))
        return chosen

    tc, pc = pick(T), pick(P)
    rooms = defaultdict(list)
    for i, n in enumerate(tc):
        rooms[i % groups].append(n)
    for i, n in enumerate(pc):
        rooms[i % groups].append(n)
    clusters = []
    for g in sorted(rooms):
        mem = rooms[g]
        linked = sum(1 for a in mem for b in mem if a < b and b in adj[a] and side[a] != side[b])
        clusters.append({"id": f"B{g+1}", "size": len(mem), "members": sorted(mem),
                         "tool_side": sorted(m for m in mem if side[m] == "T"),
                         "thought_side": sorted(m for m in mem if side[m] == "P"),
                         "cross_pairs_already_linked": linked,
                         "internal_edge_count": None, "boundary_edge_count": None, "boundary_edges": []})
    return {"cluster_count": len(clusters), "clusters": clusters,
            "params": {"groups": groups, "per_side": per_side, "seed": seed,
                       "tool_side_size": len(T), "thought_side_size": len(P),
                       "tool_side_in_rooms": len(tc), "thought_side_in_rooms": len(pc),
                       "excluded_both_or_neither": len(excluded)},
            "unclustered": sorted(set(T) - set(tc)) + sorted(set(P) - set(pc))}


# ---------------------------------------------------------------- lens: stratified random

def lens_stratified(nodes, edges, groups=12, cover=2, seed=20260924):
    """Random rooms under a proportional ceiling: a community may fill a room only up to
    its share of the palace (plus one), so no room turns into one dense cluster. Resting
    (composting/dormant) entries sit out."""
    if cover > groups:
        sys.exit(f"--cover ({cover}) cannot exceed --groups ({groups}).")
    comm, _ = communities(nodes, edges)
    live = sorted(n for n in nodes if nodes[n].get("stage") not in RESTING)
    csize = Counter(comm.get(n) for n in live)
    cap = {c: math.ceil(k * cover / groups) + 1 for c, k in csize.items()}
    rng = _random.Random(seed)
    members = defaultdict(list)
    per = defaultdict(Counter)
    sizes = {g: 0 for g in range(groups)}
    overflow = 0
    for nid in sorted(live, key=lambda n: rng.random()):
        c = comm.get(nid)
        ok = [g for g in range(groups) if per[g][c] < cap[c]]
        if len(ok) < cover:          # ceiling full everywhere: relax for this entry
            ok = list(range(groups)); overflow += 1
        chosen = sorted(ok, key=lambda g: (sizes[g], rng.random()))[:cover]
        for g in chosen:
            members[g].append(nid); per[g][c] += 1; sizes[g] += 1
    clusters = [{"id": f"S{g+1}", "size": len(members[g]), "members": sorted(members[g]),
                 "max_from_one_community": max(per[g].values()) if per[g] else 0,
                 "internal_edge_count": None, "boundary_edge_count": None, "boundary_edges": []}
                for g in sorted(members, key=lambda g: (-len(members[g]), g))]
    return {"cluster_count": len(clusters), "clusters": clusters,
            "params": {"groups": groups, "cover": cover, "seed": seed, "communities": len(csize),
                       "ceiling_by_community": {str(c): cap[c] for c in sorted(cap, key=str)},
                       "ceiling_relaxed_for": overflow}}


# ---------------------------------------------------------------- reporting

def human_summary(result, nodes, lens, map_name):
    lines = []
    lines.append(f"Partition — lens: {lens} — map: {map_name}")
    lines.append(f"Nodes: {len(nodes)} | clusters: {result['cluster_count']}"
                 + (f" | unclustered: {len(result['unclustered'])}" if result.get("unclustered") else ""))
    if result.get("params"):
        p = result["params"]
        bits = [f"{k}={v}" for k, v in p.items() if k != "demoted_hubs"]
        lines.append("Params: " + " ".join(bits)
                     + (f" (demoted: {', '.join(p['demoted_hubs'])})" if p.get('demoted_hubs') else ""))
    lines.append("")
    for c in result["clusters"]:
        flag = ""
        if "coherence_unit" in c and not c["coherence_unit"]:
            flag = "  ⚠ not a coherence unit (flat general population)"
        lines.append(f"[{c['id']}]  {c['size']} entries | "
                     f"{c['internal_edge_count']} internal / {c['boundary_edge_count']} boundary edges{flag}")
        # show up to 12 members inline; the rest elided
        ms = c["members"]
        preview = ", ".join(ms[:12]) + (f", … (+{len(ms)-12})" if len(ms) > 12 else "")
        lines.append(f"       {preview}")
        lines.append("")
    if result.get("unclustered"):
        u = result["unclustered"]
        lines.append(f"Unclustered ({len(u)}): " + ", ".join(u[:20]) + (" …" if len(u) > 20 else ""))
    return "\n".join(lines)


def main():
    ap = argparse.ArgumentParser(description="Partition the palace map by a lens.")
    ap.add_argument("--lens", required=True, choices=["folder", "community", "mirror", "random", "lifecycle", "bridge", "stratified"])
    ap.add_argument("--map", type=Path, default=None, help="map JSON (default: newest)")
    ap.add_argument("--out", type=Path, default=None, help="write full JSON here")
    ap.add_argument("--json", action="store_true", help="also dump full JSON to stdout")
    ap.add_argument("--iterations", type=int, default=100, help="community: max LPA iterations")
    ap.add_argument("--demote-hubs", type=int, default=0, help="community: lift top-N degree nodes before LPA")
    ap.add_argument("--link-type", default="mirrors", help="mirror lens: link type to component on")
    ap.add_argument("--groups", type=int, default=None, help="random/stratified: rooms (default 12); bridge: rooms (default: seat the smaller side)")
    ap.add_argument("--cover", type=int, default=2, help="random lens: distinct groups each entry lands in")
    ap.add_argument("--seed", type=int, default=None, help="random/stratified/bridge: RNG seed (reproducible)")
    ap.add_argument("--targets", type=Path, default=None, help="lifecycle: new-entry-catchup.py --json output")
    ap.add_argument("--per-room", type=int, default=5, help="lifecycle: targets per room")
    ap.add_argument("--hop2-cap", type=int, default=12, help="lifecycle: max 2-hop candidates per target")
    ap.add_argument("--per-side", type=int, default=6, help="bridge: tool-side and thought-side entries per room")
    args = ap.parse_args()

    map_path = args.map or newest_map()
    nodes, edges = load_map(map_path)

    if args.lens == "folder":
        result = lens_folder(nodes, edges)
    elif args.lens == "community":
        result = lens_community(nodes, edges, iterations=args.iterations, demote_hubs=args.demote_hubs)
    elif args.lens == "mirror":
        result = lens_mirror(nodes, edges, link_type=args.link_type, demote_hubs=args.demote_hubs)
    elif args.lens == "lifecycle":
        result = lens_lifecycle(nodes, edges, args.targets, per_room=args.per_room, hop2_cap=args.hop2_cap)
    elif args.lens == "bridge":
        result = lens_bridge(nodes, edges, groups=args.groups,
                             per_side=args.per_side, seed=args.seed or 20260924)
    elif args.lens == "stratified":
        result = lens_stratified(nodes, edges, groups=args.groups or 12, cover=args.cover, seed=args.seed or 20260924)
    else:
        result = lens_random(nodes, edges, groups=args.groups or 12, cover=args.cover, seed=args.seed or 20260706)

    result["lens"] = args.lens
    result["map"] = map_path.name
    result["node_count"] = len(nodes)

    print(human_summary(result, nodes, args.lens, map_path.name))

    if args.out:
        args.out.write_text(json.dumps(result, indent=2))
        print(f"\nJSON written: {args.out}")
    if args.json:
        print("\n" + json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
