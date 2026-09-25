#!/usr/bin/env python3
"""Split oversized community clusters for one-worker rooms (weave 2026-09-24).
Sub-communities come from label propagation on each cluster's own induced subgraph,
with that cluster's top hubs lifted out first; leftovers are packed by sub-community.
Session-local helper, not canon machinery."""
import json, sys, importlib.util
from collections import Counter
from pathlib import Path
here = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("pp", here.parents[1] / "partition-palace.py")
pp = importlib.util.module_from_spec(spec); spec.loader.exec_module(pp)
MAX = 40
nodes, edges = pp.load_map(sorted((here.parents[2] / "maps").glob("palace-map-full-*.json"))[-1])
src = json.loads((here / "partitions" / "community.json").read_text())
rooms = []
small = []
for c in src["clusters"]:
    mem = c["members"]
    if len(mem) <= MAX:
        (small if len(mem) < 10 else rooms).append((c["id"], mem)); continue
    sub_nodes = {m: nodes[m] for m in mem}
    sub_edges = [e for e in edges if e["source"] in sub_nodes and e["target"] in sub_nodes]
    r = pp.lens_community(sub_nodes, sub_edges, demote_hubs=3)
    parts = sorted((sc["members"] for sc in r["clusters"]), key=len, reverse=True)
    packed = []
    for p in parts:                      # first-fit pack sub-communities into rooms <= MAX
        while len(p) > MAX:
            packed.append(p[:MAX]); p = p[MAX:]
        for b in packed:
            if len(b) + len(p) <= MAX:
                b.extend(p); break
        else:
            packed.append(list(p))
    for i, b in enumerate(packed):
        rooms.append((f"{c['id']}.{i+1}", sorted(b)))
# fold tiny clusters into the smallest room
for cid, mem in small:
    rooms.sort(key=lambda r: len(r[1]))
    name, m = rooms[0]; rooms[0] = (f"{name}+{cid}", sorted(m + mem))
rooms.sort(key=lambda r: r[0])
out = {"lens": "community", "split_from": "community.json", "max": MAX,
       "cluster_count": len(rooms),
       "clusters": [{"id": r, "size": len(m), "members": m} for r, m in rooms]}
(here / "partitions" / "community-split.json").write_text(json.dumps(out, indent=2))
print([(r, len(m)) for r, m in rooms], sum(len(m) for _, m in rooms))
