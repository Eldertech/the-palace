#!/usr/bin/env python3
"""Deterministic metrics M1–M4 over EVERY proposal of each arm (raw/<arm>__<room>.json),
checked against the 2026-09-24 map. M5 (tokens) is read from the two workflow journals' usage."""
import json, glob, os, re
from collections import defaultdict
HERE = os.path.dirname(os.path.abspath(__file__))
M = json.load(open(os.path.join(HERE, "..", "..", "..", "..", "maps", "palace-map-full-2026-09-24.json")))
ids = {n["id"] for n in M["nodes"]}; low = {i.lower(): i for i in ids}; node = {n["id"]: n for n in M["nodes"]}
TYPES = {"connects-to","mirrors","enables","deepens","spawned","emerged-from","contradicts","couples-with","exemplifies","member-of"}
ex = set(); ext = {}
for e in M["edges"]: ex.add((e["source"], e["target"])); ext.setdefault((e["source"], e["target"]), set()).add(e["type"])
SYMT = {"connects-to","mirrors","contradicts","couples-with"}
def canon(x):
    if not x: return None
    x = re.sub(r"^\[\[|\]\]$", "", str(x).strip()).split("|")[0].split("/")[-1].strip()
    x = x[:-3] if x.endswith(".md") else x
    return x if x in ids else low.get(x.lower())
res = defaultdict(lambda: defaultdict(int))
for f in sorted(glob.glob(os.path.join(HERE, "raw", "*.json"))):
    arm = os.path.basename(f).split("__")[0]; w = json.load(open(f))
    links = [(x.get("source"), x.get("target"), x.get("type")) for x in w.get("typed_relations", [])]
    links += [(x.get("entry"), x.get("target"), x.get("type")) for x in w.get("unsung_paths", [])]
    for s, t, ty in links:
        r = res[arm]; r["links"] += 1
        cs, ct = canon(s), canon(t); ty = (ty or "").strip()
        if not cs or not ct or ty not in TYPES: r["M2_unmappable"] += 1; continue
        same = ty in ext.get((cs, ct), set()) or (ty in SYMT and ty in ext.get((ct, cs), set()))
        if same: r["M1a_duplicate"] += 1
        elif (cs, ct) in ex or (ct, cs) in ex: r["M1b_pair_already_linked"] += 1
        if node[cs]["type"] == "hub" and ty == "member-of": r["M3_direction"] += 1
        if ty == "exemplifies" and node[ct]["type"] == "person" and node[cs]["type"] in ("practice", "concept", "meta", "hub"): r["M3_direction"] += 1
    for x in w.get("entry_health_flags", []):
        e = canon(x.get("entry")); sp = (x.get("stage_proposed") or "").lower()
        if e and node[e]["type"] == "person" and any(k in sp for k in ("sprout", "growing", "mature")) and node[e]["stage"] in ("seed", "sprout"):
            res[arm]["M4_citizen_stage"] += 1
    res[arm]["rooms"] += 1
print(f"{'arm':8} {'links':>6} {'M1a dup':>10} {'M1b linked':>11} {'M2 unmap':>9} {'M3 dir':>7} {'M4 cit':>7}")
for a in ("child", "schema", "elder"):
    r = res[a]; L = max(r["links"], 1)
    f = lambda k: f"{r[k]:>3} ({r[k]/L:4.0%})"
    print(f"{a:8} {r['links']:>6} {f('M1a_duplicate'):>10} {f('M1b_pair_already_linked'):>11} {f('M2_unmappable'):>9} {r['M3_direction']:>7} {r['M4_citizen_stage']:>7}")
json.dump(res, open(os.path.join(HERE, "metrics.json"), "w"), indent=1)
