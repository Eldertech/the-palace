#!/usr/bin/env python3
"""A/B/C prep: extract the schema/elder arms from the workflow journal, put the child arm beside
them, flatten each arm's proposals into comparable items, draw a seeded sample for the blind
judge, and relabel arms X/Y/Z per room. The unblinding key goes OUTSIDE the worktree."""
import json, random, sys, os, glob
HERE = os.path.dirname(os.path.abspath(__file__))
JOURNAL, KEY = sys.argv[1], sys.argv[2]
ROOMS = ["L1", "L4", "L6", "F-Shop", "F-small-families", "C1.2", "C2.2", "C5.2+C7+C8", "B1", "B5"]
arms = {"child": {}, "schema": {}, "elder": {}}
for f in glob.glob(os.path.join(HERE, "..", "workers", "*", "*.json")):
    w = json.load(open(f))
    if w["cluster"] in ROOMS: arms["child"][w["cluster"]] = w
TDIR = os.path.dirname(JOURNAL)
def arm_of(agent_id):
    """The journal key is a hash; the arm is recovered from the agent's own first prompt."""
    for f in glob.glob(os.path.join(TDIR, "**", f"*{agent_id}*.jsonl"), recursive=True):
        head = open(f, encoding="utf-8", errors="ignore").read(20000)
        if "GROW UP" in head: return "elder"
        if "read the palace's type system" in head: return "schema"
    return None
unknown = 0
for line in open(JOURNAL):
    d = json.loads(line)
    if d.get("type") != "result" or not isinstance(d.get("result"), dict) or "cluster" not in d["result"]: continue
    arm = arm_of(d.get("agentId", ""))
    if arm: arms[arm][d["result"]["cluster"]] = d["result"]
    else: unknown += 1
print("results with unrecovered arm:", unknown)
os.makedirs(os.path.join(HERE, "raw"), exist_ok=True)
for a in arms:
    for r, w in arms[a].items():
        json.dump(w, open(os.path.join(HERE, "raw", f"{a}__{r}.json"), "w"), indent=1)
missing = [(a, r) for a in arms for r in ROOMS if r not in arms[a]]
print("missing:", missing)

def items(w):
    out = []
    for x in w.get("typed_relations", []):
        out.append({"kind": "relation", "source": x.get("source"), "type": x.get("type"), "target": x.get("target"), "label": x.get("label"), "rationale": x.get("rationale"), "evidence": x.get("evidence")})
    for x in w.get("unsung_paths", []):
        out.append({"kind": "unsung", "source": x.get("entry"), "type": x.get("type"), "target": x.get("target"), "label": x.get("label"), "rationale": x.get("phrase")})
    for x in w.get("bridge_findings", []):
        out.append({"kind": "bridge", "source": x.get("tool"), "type": x.get("proposed_type"), "target": x.get("thought"), "rationale": x.get("shared_structure"), "evidence": f"{x.get('quote_tool')} || {x.get('quote_thought')}"})
    for x in w.get("entry_health_flags", []):
        sp = (x.get("stage_proposed") or "").strip()
        if sp and sp.lower() not in ("null", "none") and sp != x.get("stage_current"):
            out.append({"kind": "stage", "source": x.get("entry"), "type": f"{x.get('stage_current')}->{sp}", "rationale": x.get("vector_issue") or x.get("graffiti_note")})
    for k, kk in (("merge_candidates", "merge"), ("compost_candidates", "compost"), ("demote_candidates", "demote")):
        for x in w.get(k, []):
            out.append({"kind": kk, "source": x.get("absorb") or x.get("entry") or x.get("file"), "target": x.get("into"), "rationale": x.get("rationale")})
    return out

key = {}
os.makedirs(os.path.join(HERE, "judge"), exist_ok=True)
for i, r in enumerate(ROOMS):
    rng = random.Random(9240 + i)
    order = ["child", "schema", "elder"]; rng.shuffle(order)
    key[r] = dict(zip("XYZ", order))
    os.makedirs(os.path.join(HERE, "judge", r), exist_ok=True)
    for L, a in key[r].items():
        its = items(arms[a].get(r, {}))
        samp = rng.sample(its, min(8, len(its)))
        for j, it in enumerate(samp): it["item_id"] = f"{L}{j+1}"
        json.dump({"arm": L, "room": r, "total_proposals": len(its), "sample": samp},
                  open(os.path.join(HERE, "judge", r, f"{L}.json"), "w"), indent=1)
os.makedirs(os.path.dirname(KEY), exist_ok=True)
json.dump(key, open(KEY, "w"), indent=1)
print("blinded", len(ROOMS), "rooms; key ->", KEY)
