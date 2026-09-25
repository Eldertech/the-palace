#!/usr/bin/env python3
"""Phase 3 aggregation for the 2026-09-24 weave: reads workers/*/*.json + the map only
(never entry bodies). Deterministic; the judgment happens after, by the coordinator."""
import json, glob, re
from collections import defaultdict, Counter
M = json.load(open('../../../../maps/palace-map-full-2026-09-24.json'))
ids = {n['id'] for n in M['nodes']}; low = {i.lower(): i for i in ids}
node = {n['id']: n for n in M['nodes']}
TYPES = {"connects-to","mirrors","enables","deepens","spawned","emerged-from","contradicts","couples-with","exemplifies","member-of"}
SYM = {"connects-to","mirrors","contradicts","couples-with"}
existing = defaultdict(set)
for e in M['edges']:
    existing[(e['source'], e['target'])].add(e['type'])
def canon(x):
    if not x: return None
    x = re.sub(r'^\[\[|\]\]$', '', str(x).strip()).split('|')[0].split('/')[-1].strip()
    if x.endswith('.md'): x = x[:-3]
    return x if x in ids else low.get(x.lower())
W = {}
for f in glob.glob('workers/*/*.json'):
    w = json.load(open(f)); W[(w['lens'], w['cluster'])] = w
room_members = {}
for f in glob.glob('rooms/*.json'):
    r = json.load(open(f))
    mem = [m['id'] for k in ('members','targets','tool_side','thought_side') for m in r.get(k, [])]
    for t, wk in r.get('walk', {}).items(): mem += [m['id'] for m in wk['hop1'] + wk['hop2']]
    room_members[r['id']] = set(mem)
rel = defaultdict(list); bad = []
def add(src, tgt, typ, lab, kind, why, lens, room, extra=None):
    s, t = canon(src), canon(tgt)
    if not s or not t or s == t or typ not in TYPES:
        bad.append({"room": room, "source": src, "target": tgt, "type": typ, "why": "unknown entry or type"}); return
    if node[s]['type'] == 'hub' and typ == 'member-of':
        bad.append({"room": room, "source": s, "target": t, "type": typ, "why": "hub emits member-of"}); return
    key = tuple(sorted((s, t))) + (typ,) if typ in SYM else (s, t, typ)
    rel[key].append({"lens": lens, "room": room, "label": lab, "kind": kind, "why": why, **(extra or {})})
for (lens, room), w in W.items():
    for r in w.get('typed_relations', []):
        rt = (r.get('type') or '').strip()
        if rt not in TYPES and r.get('kind') in ('unsung', None) : rt = 'connects-to'
        add(r.get('source'), r.get('target'), rt, r.get('label'), r.get('kind'), r.get('rationale'), lens, room,
            {"evidence": r.get('evidence'), "spark": r.get('spark'), "deep_pattern": r.get('deep_pattern'), "current_type": r.get('current_type')})
    for u in w.get('unsung_paths', []):
        ut = (u.get('type') or '').strip()
        add(u.get('entry'), u.get('target'), ut if ut in TYPES else 'connects-to', u.get('label'), 'unsung',
            u.get('phrase'), lens, room, {"significant": u.get('structurally_significant')})
# classify
out = []
for key, props in rel.items():
    s, t, typ = key if len(key) == 3 else (key[0], key[1], key[2])
    already = existing[(s, t)] | (existing[(t, s)] if typ in SYM else set())
    have_any = existing[(s, t)] | existing[(t, s)]
    lenses = sorted({p['lens'] for p in props}); rooms = sorted({p['room'] for p in props})
    kinds = Counter(p['kind'] for p in props)
    out.append({"source": s, "target": t, "type": typ, "lenses": lenses, "rooms": rooms, "n": len(props),
                "status": "exists" if typ in already else ("retype-or-add" if have_any else "new"),
                "existing_types": sorted(have_any), "kinds": dict(kinds),
                "labels": sorted({p['label'] for p in props if p.get('label')}),
                "max_spark": max([p.get('spark') or 0 for p in props]),
                "deep_patterns": sorted({p['deep_pattern'] for p in props if p.get('deep_pattern') and p['deep_pattern'].lower() not in ('none','null','')}),
                "why": [p['why'] for p in props][:3], "evidence": [p.get('evidence') for p in props if p.get('evidence')][:2]})
# direction conflicts: same unordered pair, different proposals
pairs = defaultdict(list)
for o in out:
    if o['status'] != 'exists': pairs[tuple(sorted((o['source'], o['target'])))].append(o)
conflicts = {f"{a} | {b}": [(o['source'], o['type'], o['target'], o['lenses']) for o in v] for (a, b), v in pairs.items() if len(v) > 1}
# july held + GNN
held = open('july-held.md').read()
def in_held(a, b): return a in held and b in held and any(a in ln and b in ln for ln in held.splitlines())
try:
    gnn = json.load(open('../../../experiments/palace-gnn-2026-08-26/ghosts-clean.json'))
    gl = gnn if isinstance(gnn, list) else gnn.get('predictions') or gnn.get('links') or []
    gset = {tuple(sorted((canon(g.get('source') or g.get('a') or g[0]) or '', canon(g.get('target') or g.get('b') or g[1]) or ''))) for g in gl}
except Exception as ex:
    gset = set(); print("GNN load:", ex)
for o in out:
    o['july'] = in_held(o['source'], o['target'])
    o['gnn'] = tuple(sorted((o['source'], o['target']))) in gset
# hub emergence: inbound proposals from rooms that don't hold the target as a member
inbound_rooms = defaultdict(set)
for o in out:
    if o['status'] == 'exists': continue
    tgts = [o['target']] + ([o['source']] if o['type'] in SYM else [])
    for t in tgts:
        for rm in o['rooms']:
            if t not in room_members.get(rm, set()): inbound_rooms[t].add(rm)
hub_signal = sorted(((t, len(r)) for t, r in inbound_rooms.items() if len(r) >= 3 and node[t]['type'] != 'hub'), key=lambda x: -x[1])
# other lists
agg = defaultdict(list)
for (lens, room), w in W.items():
    for k in ('merge_candidates','compost_candidates','demote_candidates','entry_health_flags','walk_results','open_question_resolutions','coherence_findings','bridge_findings','flag_responses','synthesis_spawn_flag'):
        for x in w.get(k, []): agg[k].append({"lens": lens, "room": room, **x})
new = [o for o in out if o['status'] != 'exists']
res = {"relations": out, "bad": bad, "conflicts": conflicts, "hub_signal": hub_signal, **agg,
       "stats": {"proposals_raw": sum(len(v) for v in rel.values()), "unique": len(out), "already_exist": sum(o['status']=='exists' for o in out),
                 "new_or_retype": len(new), "cross_lens": sum(len(o['lenses'])>=2 for o in new), "july_refinds": sum(o['july'] for o in new),
                 "gnn_matches": sum(o['gnn'] for o in new), "bad": len(bad), "conflicting_pairs": len(conflicts)}}
json.dump(res, open('synthesis-data.json', 'w'), indent=1)
print(json.dumps(res['stats'], indent=1)); print("hub signal:", hub_signal[:12])
print({k: len(v) for k, v in agg.items()})
