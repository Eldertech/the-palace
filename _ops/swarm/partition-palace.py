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

Usage
-----
  python3 _ops/swarm/partition-palace.py --lens folder
  python3 _ops/swarm/partition-palace.py --lens community --demote-hubs 12
  python3 _ops/swarm/partition-palace.py --lens mirror
  python3 _ops/swarm/partition-palace.py --lens community --out clusters.json --json

By default prints a human summary; `--out PATH` writes the full JSON (members +
boundary edges); `--json` also dumps the JSON to stdout.
"""
import argparse
import json
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


# ---------------------------------------------------------------- reporting

def human_summary(result, nodes, lens, map_name):
    lines = []
    lines.append(f"Partition — lens: {lens} — map: {map_name}")
    lines.append(f"Nodes: {len(nodes)} | clusters: {result['cluster_count']}"
                 + (f" | unclustered: {len(result['unclustered'])}" if result.get("unclustered") else ""))
    if result.get("params"):
        p = result["params"]
        bits = []
        if "iterations" in p:
            bits.append(f"iterations={p['iterations']}")
        bits.append(f"demote_hubs={p['demote_hubs']}")
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
    ap.add_argument("--lens", required=True, choices=["folder", "community", "mirror"])
    ap.add_argument("--map", type=Path, default=None, help="map JSON (default: newest)")
    ap.add_argument("--out", type=Path, default=None, help="write full JSON here")
    ap.add_argument("--json", action="store_true", help="also dump full JSON to stdout")
    ap.add_argument("--iterations", type=int, default=100, help="community: max LPA iterations")
    ap.add_argument("--demote-hubs", type=int, default=0, help="community: lift top-N degree nodes before LPA")
    ap.add_argument("--link-type", default="mirrors", help="mirror lens: link type to component on")
    args = ap.parse_args()

    map_path = args.map or newest_map()
    nodes, edges = load_map(map_path)

    if args.lens == "folder":
        result = lens_folder(nodes, edges)
    elif args.lens == "community":
        result = lens_community(nodes, edges, iterations=args.iterations, demote_hubs=args.demote_hubs)
    else:
        result = lens_mirror(nodes, edges, link_type=args.link_type, demote_hubs=args.demote_hubs)

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
