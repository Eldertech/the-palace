#!/usr/bin/env python3
"""Coordinator curation (weave 2026-09-24): the elder's judgment made explicit as rules +
named overrides, applied to synthesis-data.json. Output: pile-a.json (one yes, sampled),
held.json (trails for the board), declined.json (with reasons). Pile B is written by hand."""
import json
d = json.load(open('synthesis-data.json'))
LINEAGE = {"spawned", "emerged-from", "enables"}
BRIDGE_IN_B = set()   # bridge gems go to Pile B / held by hand, never auto-A
DECLINE = {
  ("Kuramoto Coupling","Remotion"): "passing mention (a demo card), not a relation",
  ("Kuramoto Coupling","Skills Are Enchantable Pages"): "passing mention",
  ("SCHEMA — Reference","The Shop"): "passing mention",
  ("CLAUDE","Return Ceremony"): "the birth file stays minimal; its links are its @imports",
  ("CLAUDE","The Palace Voice"): "the birth file stays minimal; its links are its @imports",
  ("The Remembering Page","Weaving Memory into the Palace"): "worker didn't read the target (said so)",
  ("Making a Palace Citizen","Palace To-Do"): "the To-Do is a transient queue, not a neighbour",
  ("Palace To-Do","The Palace Voice"): "the To-Do is a transient queue, not a neighbour",
  ("SMPTE LTC","Trickster"): "the word 'trickster', not the entry",
  ("Diversity of Thought in Many-Agent Systems","RNBO codebox~ smith"): "passing mention",
  ("Quadratic Interpolation in DSP","Reflective Practice"): "rationale describes PID, not this entry — worker error",
  ("SMPTE LTC","Spinoza"): "fails the fidelity test — any shared clock would read the same",
  ("Dispersion Table","Spinoza"): "fails the fidelity test — any feedback loop would read the same",
  ("Buckminster Fuller","Christopher Alexander"): "superseded by the contradicts proposal on the same pair (Pile B)",
  ("Epictetus","Worktree Practice"): "the rhyme lives in Worktree's prose; Worktree gets genuine inbound elsewhere this weave",
  ("Frequency-Time Duality","SMPTE LTC"): "mirrors is a strong claim on one reader's inference — held as a trail",
  ("Loudon Live","SUBSTRATE"): "false premise — SUBSTRATE:134 says Loudon Live emits no links; the map shows 17 outbound. Fix SUBSTRATE:134 instead (Concierge)",
}
for rp in ["Weave Ceremony","Return Ceremony","Spore Check Ceremony","Revival Ceremony","Walk Ceremony"]:
    DECLINE[("Reflective Practice", rp)] = "covered by the ceremony's own exemplifies → Reflective Practice (one link per pair)"
FLIP = {  # (source,target) -> (new_source,new_target,new_type or None)
  ("Agent Toolbox","Palace Orchestrator"): ("Palace Orchestrator","Agent Toolbox",None),
  ("Agent Toolbox","The Practice Rediscovers Its Philosophy"): ("The Practice Rediscovers Its Philosophy","Agent Toolbox",None),
  ("Agent Toolbox","ELDER"): ("ELDER","Agent Toolbox",None),
  ("Agent Toolbox","The Palace Practices on Itself"): ("The Palace Practices on Itself","Agent Toolbox",None),
  ("Block It in Blender, Ink It in genAI","Frame Designer"): ("Frame Designer","Block It in Blender, Ink It in genAI",None),
  ("ELDER","README - The Palace Guide"): ("README - The Palace Guide","ELDER",None),
  ("Search Before You Build","Tool Builder"): ("Tool Builder","Search Before You Build",None),
  ("SCHEMA","Self-Describing Knowledge Module"): ("Self-Describing Knowledge Module","SCHEMA",None),
  ("Creative Coach","Lateral Access"): ("Lateral Access","Creative Coach",None),
  ("Making a Palace Citizen","SCHEMA — Reference"): ("SCHEMA — Reference","Making a Palace Citizen",None),
}
PILE_B_PAIRS = set()  # anything touching these goes to B, not A
B_TYPES = {"contradicts","mirrors"}  # a new mirrors/contradicts is a permanent claim → never auto-A
CITIZEN_FAMILY = {"Epictetus","Marcus Aurelius","Seneca","Martin Buber","Martin Heidegger","Spinoza","John Cage","Donella Meadows"}
pileA, held, declined, pileB, newcomer = [], [], [], [], []
for o in d['relations']:
    if o['status'] == 'exists': continue
    s, t, ty = o['source'], o['target'], o['type']
    if (s, t) in DECLINE: declined.append({**o, "reason": DECLINE[(s, t)]}); continue
    if (s, t) in FLIP:
        ns, nt, nty = FLIP[(s, t)]; o = {**o, "source": ns, "target": nt, "type": nty or ty, "flipped": True}; s, t, ty = o['source'], o['target'], o['type']
    # citizen family: X —exemplifies→ Making a Palace Citizen (B, one decision)
    if "Making a Palace Citizen" in (s, t) and ({s, t} & CITIZEN_FAMILY):
        cit = s if s in CITIZEN_FAMILY else t
        pileB.append({**o, "source": cit, "target": "Making a Palace Citizen", "type": "exemplifies", "family": "citizens-exemplify-the-method"}); continue
    if t == "The Blindspot Is the Surprise Fuel" and s in CITIZEN_FAMILY:
        pileB.append({**o, "family": "citizen-blindspots"}); continue
    ex = set(o['existing_types'])
    if ex:
        if ex == {"connects-to"} and ty != "connects-to":
            o = {**o, "op": "upgrade-connects-to"}
        elif ty in LINEAGE and ex & (LINEAGE | {"emerged-from"}):
            o = {**o, "op": "add-lineage-reciprocal"}
        elif ty == "exemplifies" and s in {"Closing Well"}:
            o = {**o, "op": "replace-reverse-connects-to"}
        else:
            declined.append({**o, "reason": f"pair already carries {sorted(ex)} — one link per pair"}); continue
    kinds = set(o['kinds'])
    if ty in B_TYPES or 'bridge' in kinds:
        (pileB if (ty == 'contradicts' or o['max_spark'] >= 4 or len(o['lenses']) > 1 or o['july']) else held).append(o); continue
    # Pile A takes only moves whose judgment was made elsewhere: prose (unsung), a signed flag,
    # or an in-place retype / lineage reciprocal. Walk links go to the newcomer cards (one yes per
    # card); new introductions (Step 3b) are held unless two lenses saw them. (Concierge, 2026-09-24.)
    if o.get('op') == 'upgrade-connects-to': o = {**o, "op": "retype-in-place: remove the existing connects-to on this pair, write this link"}
    if o.get('op') or kinds <= {'unsung', 'flag'}:
        pileA.append(o)
    elif kinds & {'inbound-walk', 'newcomer'}:
        newcomer.append(o)
    elif len(o['lenses']) > 1:
        pileB.append({**o, "group": "cross-lens-new"})
    else:
        held.append(o)
json.dump(pileA, open('pile-a.json','w'), indent=1)
json.dump(held, open('held.json','w'), indent=1)
json.dump(declined, open('declined.json','w'), indent=1)
json.dump(pileB, open('pile-b-candidates.json','w'), indent=1)
json.dump(newcomer, open('newcomer-cards.json','w'), indent=1)
print("A", len(pileA), "| newcomer-cards", len(newcomer), "| B-candidates", len(pileB), "| held", len(held), "| declined", len(declined))
from collections import Counter
print("A ops:", Counter(o.get('op','add') for o in pileA))
print("B families:", Counter(o.get('family', o['type']) for o in pileB))
