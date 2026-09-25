#!/usr/bin/env python3
"""Unblind the judges (only after all have returned) and score J1–J3 against the pre-registered
rule in DESIGN.md. Usage: score.py <judge journal.jsonl> <key.json>"""
import json, sys, os
from collections import defaultdict, Counter
HERE = os.path.dirname(os.path.abspath(__file__))
journal, keyf = sys.argv[1], sys.argv[2]
key = json.load(open(keyf))
J = {}
for line in open(journal):
    d = json.loads(line)
    if d.get("type") == "result" and isinstance(d.get("result"), dict) and "room" in d["result"]:
        J[d["result"]["room"]] = d["result"]
arms = ("child", "schema", "elder")
n = Counter(); invalid = Counter(); stand = Counter(); first = Counter(); verd = defaultdict(Counter)
rank_pts = Counter(); per_room = {}
for room, r in sorted(J.items()):
    k = key[room]
    for it in r["items"]:
        L = it["item_id"][0]; a = k.get(L)
        if not a: continue
        n[a] += 1; verd[a][it["verdict"]] += 1
        if it["verdict"] != "valid": invalid[a] += 1
        if it.get("stand_behind"): stand[a] += 1
    rk = [k[x] for x in r["ranking"] if x in k]
    if rk: first[rk[0]] += 1
    for i, a in enumerate(rk): rank_pts[a] += 2 - i
    per_room[room] = {"ranking": rk, "reason": r.get("ranking_reason"), "best_find": r.get("best_find"),
                      "best_find_arm": k.get((r.get("best_find") or " ")[0])}
print(f"rooms judged: {len(J)}\n")
print(f"{'arm':8} {'judged':>6} {'J1 invalid':>12} {'J2 stand-behind':>16} {'J3 first':>9} {'rank pts':>9}")
for a in arms:
    print(f"{a:8} {n[a]:>6} {invalid[a]:>4} ({invalid[a]/max(n[a],1):4.0%}) {stand[a]:>8} ({stand[a]/max(n[a],1):4.0%}) {first[a]:>9} {rank_pts[a]:>9}")
print("\nverdict mix:")
for a in arms: print(f"  {a:7}", dict(verd[a].most_common()))
print("\nper room (best first):")
for room, v in per_room.items(): print(f"  {room:18} {' > '.join(v['ranking'])}   best find: {v['best_find_arm']} — {(v['reason'] or '')[:110]}")
ci, ei, si = (invalid[a] / max(n[a], 1) for a in ("child", "elder", "schema"))
rule_E = ei <= ci * (2/3) and stand["elder"] >= stand["child"] and first["elder"] >= 6
rule_S = (not rule_E and si <= ci * (2/3)) or (rule_E and si <= ei * 1.25)
print(f"\nPRE-REGISTERED RULE → elders-as-rule: {rule_E} · schema-only captures it: {rule_S}")
json.dump({"per_room": per_room, "n": n, "invalid": invalid, "stand": stand, "first": first,
           "verdicts": {a: dict(verd[a]) for a in arms}}, open(os.path.join(HERE, "scores.json"), "w"), indent=1)
