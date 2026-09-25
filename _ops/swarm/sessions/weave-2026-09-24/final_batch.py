#!/usr/bin/env python3
"""Final batch-signed candidates (Pile A + newcomer cards) from v1 (Concierge-fixed) and v2,
with the rule fixes found this afternoon. Output: batch-items.json for the skeptic pass."""
import json, re
v1A = json.load(open('pile-a.json')); v2A = json.load(open('v2/pile-a.json')); cards = json.load(open('v2/newcomer-cards.json'))
AA = "The Adjacent Affordance"
DECL = {("Tool Builder", "Harvest Ceremony"): "prose says Harvest grows Tool Builder's checklist; the reverse is kept",
        ("The Remembering Page", "Palace Enchantment"): "prose: 'Palace Enchantment loads it'; the reverse is kept"}
out, dropped, seen = [], [], {}
def clean_label(o):
    lab = (o.get('labels') or [None])[0]
    return lab if lab and len(lab) <= 40 and ' ' not in lab.strip() else None
for src, pile in (("v2", v2A), ("v2-card", cards), ("v1", v1A)):
    for o in pile:
        s, t, ty = o['source'], o['target'], o['type']
        if s == "CLAUDE" or "Palace To-Do" in (s, t):
            dropped.append((s, ty, t, "birth file / transient queue")); continue
        if (s, t) in DECL: dropped.append((s, ty, t, DECL[(s, t)])); continue
        if t == AA and ty == "connects-to": s, t = AA, s      # the entry voices them: its own frontmatter carries the cast
        pair = frozenset((s, t))
        if pair in seen: continue                             # v2 first, then cards, then v1: one link per pair
        seen[pair] = True
        out.append({"id": f"b{len(out)+1:03d}", "from": src, "source": s, "type": ty, "target": t,
                    "label": clean_label(o), "op": o.get('op', 'add'), "kind": sorted(o['kinds']),
                    "rationale": (o['why'][0] or '')[:400], "evidence": (o.get('evidence') or [None])[0]})
json.dump(out, open('batch-items.json', 'w'), indent=1)
print(len(out), "batch items;", len(dropped), "dropped by rule")
for d in dropped: print("  drop:", d)
from collections import Counter; print(Counter(o['from'] for o in out))
