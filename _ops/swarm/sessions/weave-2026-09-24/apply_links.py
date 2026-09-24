#!/usr/bin/env python3
"""Weave 2026-09-24 — the mechanical write-back (signed: decisions.json). Frontmatter only:
typed links (add / retype-in-place / label), stages, one type change. Edits text in place,
preserving each file's link style. --dry-run prints every change and writes nothing.
Authorship (body edits, merges, deletions + repoints) is NOT here — that's write-agents' work."""
import json, re, sys, os, glob
DRY = "--dry-run" in sys.argv
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", "..", "..", ".."))
M = json.load(open(os.path.join(ROOT, "_ops/maps/palace-map-full-2026-09-24.json")))
PATH = {n["id"]: os.path.join(ROOT, n["path"]) for n in M["nodes"]}
TYPE = {n["id"]: n["type"] for n in M["nodes"]}
SYM = {"connects-to", "mirrors", "contradicts", "couples-with"}
log, problems = [], []

def split(path):
    t = open(path, encoding="utf-8").read()
    m = re.match(r"^---\n(.*?)\n---\n", t, re.S)
    if not m: raise ValueError(f"no frontmatter: {path}")
    return t, m.group(1), m.end()

def link_blocks(fm):
    """(start,end,target,type) of each link item in the links: block, by line index."""
    lines = fm.split("\n"); out = []; inl = False; i = 0
    while i < len(lines):
        ln = lines[i]
        if re.match(r"^links:\s*$", ln): inl = True; i += 1; continue
        if inl and re.match(r"^[A-Za-z_]", ln): break
        if inl and re.match(r"^\s*-\s", ln):
            j = i + 1
            while j < len(lines) and not re.match(r"^\s*-\s", lines[j]) and not re.match(r"^[A-Za-z_]", lines[j]): j += 1
            blk = "\n".join(lines[i:j])
            tg = re.search(r'target:\s*"?\[\[([^\]|#]+)', blk); ty = re.search(r'\btype:\s*"?([a-z\-]+)', blk)
            out.append((i, j, tg.group(1).split("/")[-1].strip() if tg else None, ty.group(1) if ty else None))
            i = j; continue
        i += 1
    return lines, out

def write(path, fm_new, t, end):
    if not DRY: open(path, "w", encoding="utf-8").write("---\n" + fm_new + "\n---\n" + t[end:])

def add_link(src, tgt, typ, label=None):
    p = PATH.get(src)
    if not p or tgt not in PATH: problems.append(f"unknown entry: {src} → {tgt}"); return
    t, fm, end = split(p); lines, blocks = link_blocks(fm)
    if any(b[2] == tgt and b[3] == typ for b in blocks): log.append(f"= already: {src} —{typ}→ {tgt}"); return
    inline = any(re.match(r"^\s*-\s*\{", lines[b[0]]) for b in blocks)
    lab = f', label: "{label}"' if (inline and label) else ""
    new = [f'  - {{ target: "[[{tgt}]]", type: {typ}{lab} }}'] if inline else \
          [f'  - target: "[[{tgt}]]"', f"    type: {typ}"] + ([f"    label: {label}"] if label else [])
    if blocks: ins = blocks[-1][1]
    else:
        li = next((k for k, l in enumerate(lines) if re.match(r"^links:\s*(\[\])?\s*$", l)), None)
        if li is None: lines.append("links:"); li = len(lines) - 1
        lines[li] = "links:"; ins = li + 1
    lines[ins:ins] = new
    write(p, "\n".join(lines), t, end); log.append(f"+ {src} —{typ}→ {tgt}" + (f" [{label}]" if label else ""))

def remove_link(src, tgt, typ):
    p = PATH[src]; t, fm, end = split(p); lines, blocks = link_blocks(fm)
    hit = [b for b in blocks if b[2] == tgt and b[3] == typ]
    if not hit: return False
    s, e = hit[0][0], hit[0][1]; del lines[s:e]
    write(p, "\n".join(lines), t, end); log.append(f"- {src} —{typ}→ {tgt} (retyped)"); return True

def set_label(src, tgt, typ, label):
    p = PATH[src]; t, fm, end = split(p); lines, blocks = link_blocks(fm)
    hit = [b for b in blocks if b[2] == tgt and b[3] == typ]
    if not hit: problems.append(f"no link to label: {src} —{typ}→ {tgt}"); return
    s, e = hit[0][0], hit[0][1]; blk = lines[s:e]
    if any("label:" in l for l in blk): problems.append(f"already labelled: {src} → {tgt}"); return
    lines[e:e] = [f"    label: {label}"]; write(p, "\n".join(lines), t, end); log.append(f"~ label {src} —{typ}→ {tgt} [{label}]")

def retype_in_place(src, tgt, typ, label):
    """Remove an existing connects-to on the pair (either file), then write the typed link."""
    if not (remove_link(src, tgt, "connects-to") or remove_link(tgt, src, "connects-to")):
        log.append(f"  (no connects-to to remove on {src}|{tgt})")
    add_link(src, tgt, typ, label)

def set_field(ent, field, value):
    p = PATH[ent]; t, fm, end = split(p)
    if re.search(rf"^{field}:.*$", fm, re.M): fm2 = re.sub(rf"^{field}:.*$", f"{field}: {value}", fm, count=1, flags=re.M)
    else: fm2 = fm + f"\n{field}: {value}"
    if fm2 != fm: write(p, fm2, t, end); log.append(f"* {ent}: {field} → {value}")

# 1. the batch (49, skeptic-passed)
for o in json.load(open(os.path.join(HERE, "batch-final.json"))):
    if o["op"].startswith("retype-in-place"): retype_in_place(o["source"], o["target"], o["type"], o.get("label"))
    else: add_link(o["source"], o["target"], o["type"], o.get("label"))
# 2. Pile B links (signed: all recommendations; Agnes Martin both)
B = [("Douglas Hofstadter","contradicts","Iain McGilchrist","computation-earns-comprehension-after-all"),
 ("BLUELINE","contradicts","Christopher Alexander","fabrication-vs-unfolding"),
 ("Annie Dillard","contradicts","BLUELINE","beautiful-horror"),
 ("The View From Above","contradicts","Zoom Out to the Structure","zoom-direction-inverted"),
 ("Progressive Staging","contradicts","Symbiotic Skills","staged-design-vs-organic-growth"),
 ("Does Personifying an Agent Change What It Does","contradicts","Steer the Generator","words-as-control"),
 ("Andy Goldsworthy","contradicts","OBS","ephemeral-vs-the-record"),
 ("Martin Buber","contradicts","Martin Heidegger","they-vs-thou"),
 ("Excellent Adventure","contradicts","Martin Buber","meeting-cannot-be-method"),
 ("The Shop","exemplifies","The Dichotomy of Control","refuse-and-route"),
 ("Wavetable Scanner","exemplifies","Progressive Staging","sketch-study-piece-is-staging"),
 ("Buckminster Fuller","exemplifies","Found ↔ Made","made-pole"),
 ("Christopher Alexander","exemplifies","Found ↔ Made","found-pole"),
 ("Agent Wellbeing","mirrors","LaMa","plausible-not-true"),
 ("Christopher Alexander","mirrors","Synth Archetypes","pattern-language"),
 ("Iain McGilchrist","mirrors","Martin Buber","i-thou-is-comprehending-attention"),
 ("Christopher Alexander","mirrors","Iain McGilchrist","totalizing-framework"),
 ("Martin Heidegger","mirrors","The Substrate Drifts","breakdown-reveals-ground"),
 ("Martin Heidegger","mirrors","Remnants in Depth","breaks-into-object"),
 ("Iain McGilchrist","mirrors","Merleau-Ponty","comprehending-not-representing"),
 ("Buckminster Fuller","mirrors","Simondon","synergy-is-concretization"),
 ("Agnes Martin","mirrors","Move the Ink, Don't Redraw It","fixed-substrate-reveals-drift"),
 ("Agnes Martin","contradicts","Move the Ink, Don't Redraw It","redraws-by-hand"),
 ("VCV Patch Generator","exemplifies","Audition Gate","proves-structure-not-feel"),
 ("Web Audio Worklet","exemplifies","Zoom Out to the Structure","gotcha-becomes-concept"),
 ("Quadratic Interpolation in DSP","mirrors","Reflective Practice","controller-that-listens"),
 ("Martin Buber","exemplifies","The Blindspot Is the Surprise Fuel","the-refusal-is-the-proof"),
 ("Martin Heidegger","exemplifies","The Blindspot Is the Surprise Fuel","unresolved-not-flattened")]
for s, ty, t, lab in B: add_link(s, t, ty, lab)
set_label("OBS", "Maker", "connects-to", "producer-layer-pressure") if "Maker" in PATH else None
# 3. citizens made by the method (a person with a dossier bundle file), retyping MPC's connects-to in place
cit = [i for i, ty in TYPE.items() if ty == "person" and glob.glob(os.path.join(os.path.dirname(PATH[i]), i, f"{i} — dossier*.md"))]
log.append(f"# citizens with a dossier: {len(cit)}: {', '.join(sorted(cit))}")
for c in sorted(cit): retype_in_place(c, "Making a Palace Citizen", "exemplifies", "made-by-this-method")
# 4. hub, stages, composting starts
set_field("Self-Describing Knowledge Module", "type", "hub")
UP = {"seed→growing": ["Closing Well Ceremony","Return Ceremony","No Mind Checks Itself","Tract Mirror","Waveguide Synthesizer","Trickster Commit","Blocked, Not Prompted"],
      "sprout→growing": ["Palace Map","Concierge","Pheromone Trail","BBS Design System","Search Before You Build","Skills Are Enchantable Pages","The Metaphor Stretch","DSP in Looping Dimensions","Walk That Weaves"],
      "growing→mature": ["The Palace Hardens Around Values"]}
for mv, ents in UP.items():
    for e in ents:
        if e not in PATH: problems.append(f"stage: unknown {e}"); continue
        want_from, to = mv.split("→")
        cur = next((n["stage"] for n in M["nodes"] if n["id"] == e), None)
        if cur != want_from: problems.append(f"stage: {e} is {cur}, expected {want_from} — skipped"); continue
        set_field(e, "stage", to)
for e in ["Graffiti Pass — Handoff 2026-04-30", "Graffiti Pass — Handoff 2026-05-02", "Graffiti Pass — Handoff 2026-05-02 — Session 2", "Schema Ceremony Proposal — exemplifies + member-of"]:
    if e in PATH: set_field(e, "stage", "composting")
    else: problems.append(f"composting start: unknown {e}")
print("\n".join(log)); print(f"\n{sum(1 for l in log if l[0] in '+-~*')} changes" + (" (DRY RUN — nothing written)" if DRY else ""))
if problems: print("\nPROBLEMS:\n  " + "\n  ".join(problems))
