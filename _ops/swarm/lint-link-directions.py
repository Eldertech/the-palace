#!/usr/bin/env python3
"""
Link-Direction Linter — the Weave's checkable postcondition for typed-link directionality.

Reads a palace map JSON (produced by build-map-*.py) and flags the directional
errors that the 2026-06-05 Schema Ceremony (SCHEMA v1.9) made canonical. Mechanical,
deterministic, no API calls. Exit code 0 = clean, 1 = errors found.

Rules (SCHEMA §4):
  E1  Reciprocal contradiction — an asymmetric type used in BOTH directions between
      a pair (A type B AND B type A). Impossible: A can't be derived-from B and B
      derived-from A at once. Asymmetric types: deepens, emerged-from, exemplifies,
      member-of, enables, spawned.
  E2  Hub emits member-of — a `type: hub` entry pointing member-of at another entry.
      Collections never declare their own membership; members point in.
  W1  Ground emits lineage link — an entry that is a strong `deepens`/`emerged-from`
      TARGET (a foundational ground, inbound >= threshold) also EMITS that link.
      Likely a backwards arrow (ground should be the target, not the source).
  W2  member-of / exemplifies toward a leaf — the target has fewer inbound links than
      the source. Instances/members usually point at a more-connected class/collection.

Usage: python3 _ops/swarm/lint-link-directions.py [path-to-map.json]
       (defaults to the newest _ops/maps/palace-map-full-*.json)
"""
from __future__ import annotations
import json, sys, glob, os
from collections import defaultdict

ASYMMETRIC = {"deepens", "emerged-from", "exemplifies", "member-of", "enables", "spawned"}
LINEAGE = {"deepens", "emerged-from"}
GROUND_INBOUND_THRESHOLD = 3   # inbound lineage links that mark an entry as a "ground"

def newest_map():
    maps = sorted(glob.glob(os.path.join(os.path.dirname(__file__), "..", "maps", "palace-map-full-*.json")))
    if not maps:
        sys.exit("no map JSON found in _ops/maps/")
    return maps[-1]

def main():
    path = sys.argv[1] if len(sys.argv) > 1 else newest_map()
    d = json.load(open(path, encoding="utf-8"))
    nodes = {n["id"]: n for n in d["nodes"]}
    edges = [(e["source"], e["type"], e["target"], e.get("label")) for e in d["edges"]]
    edgeset = {(s, t, tp) for s, tp, t, _ in edges}

    errors, warns = [], []

    # E1 — reciprocal contradictions
    seen = set()
    for s, tp, t, _ in edges:
        if tp in ASYMMETRIC and (t, s, tp) in edgeset:
            key = tuple(sorted((s, t))) + (tp,)
            if key not in seen:
                seen.add(key)
                errors.append(f"E1  reciprocal {tp}:  {s}  <->  {t}  (both directions present)")

    # E2 — hub emits member-of
    for s, tp, t, _ in edges:
        if tp == "member-of" and nodes.get(s, {}).get("type") == "hub":
            errors.append(f"E2  hub emits member-of:  {s} (hub) --member-of--> {t}  (members declare membership, not the hub)")

    # W1 — ground emits lineage
    inbound_lineage = defaultdict(int)
    for s, tp, t, _ in edges:
        if tp in LINEAGE:
            inbound_lineage[t] += 1
    grounds = {n for n, c in inbound_lineage.items() if c >= GROUND_INBOUND_THRESHOLD}
    for s, tp, t, _ in edges:
        if tp in LINEAGE and s in grounds:
            warns.append(f"W1  ground emits {tp}:  {s} (inbound {tp}={inbound_lineage[s]}) --{tp}--> {t}  (verify arrow: grounds are usually targets)")

    # W2 — member-of / exemplifies toward a leaf
    for s, tp, t, _ in edges:
        if tp in ("member-of", "exemplifies"):
            ti, si = nodes.get(t, {}).get("inbound_count"), nodes.get(s, {}).get("inbound_count")
            if ti is not None and si is not None and ti < si:
                warns.append(f"W2  {tp} toward less-central target:  {s} (inbound {si}) --{tp}--> {t} (inbound {ti})")

    print(f"Link-Direction Linter — {os.path.basename(path)}")
    print(f"  nodes={len(nodes)}  edges={len(edges)}\n")
    if errors:
        print(f"ERRORS ({len(errors)}):")
        for e in errors: print("  " + e)
    else:
        print("ERRORS: none")
    print()
    if warns:
        print(f"WARNINGS ({len(warns)}) — review, not all are bugs:")
        for w in warns: print("  " + w)
    else:
        print("WARNINGS: none")

    sys.exit(1 if errors else 0)

if __name__ == "__main__":
    main()
