#!/usr/bin/env python3
"""
Face Audit - the Weave's two lists: faces to add, faces to retire.

Faces (hero.png / icon.png in an entry's bundle) are load-bearing: they are how STIGMERGY's
state view grabs the eye in search, so they shape how Loudon re-enters the palace. This scan
applies the face policy (Weave Ceremony Step 5c) and produces two lists the Weave presents:

  ADD     - an entry that merits a face and lacks one. Split into:
              definite  = an always-type (foundational · hub / >=5 links · project ·
                          person · specialist · maker) - it gets a face regardless of stage.
              grey      = a judgment call the worker/Loudon rules: growing+ concepts
                          (esp. philosophy-pillar), breakthroughs, high-activation entries.
  RETIRE  - an entry wearing a face that no longer earns one: a spore or a composting entry.
            Face-loss is a degradation signal - a spore sheds its face as it goes dormant,
            and the state view should never wear a face for a dormant or dead entry.

Detection is mechanical; the render is gated and costs money, so this scan never renders.
The definite ADD list is what feeds the worker (which writes the hero/icon prompts) and then
Shop/Hero and Avatar Maker/make_faces.py (the gated batch Loudon approves). Grey ADDs are
proposals; RETIREs are removals Loudon confirms.

NEVER get a NEW face: seed/sprout concepts, composting, spores, questions, and bundle files
(no canon type). But only spores and composting entries have an EXISTING face retired -
thinness blocks adding a face, it never strips one an entry was deliberately given.

Mechanical, deterministic, no API calls. Exit 0 always (an audit, never a gate).

Usage: python3 _ops/swarm/face-audit.py [palace-root]
"""
from __future__ import annotations
import os, re, sys

SKIP_DIRS = {".git", ".obsidian", ".claude", "node_modules", ".venvs", "_tools",
             "venv", "__pycache__"}
SKIP_PREFIXES = ("_ops/stigmergy/app/", "_ops/stigmergy/orchestrator/",
                 "_ops/stigmergy/trickster-auto/", "_ops/swarm/",
                 "Enrichment/card-", "Enrichment/Archive/")

CANON_TYPES = {"concept", "hub", "project", "breakthrough", "source", "meta",
               "practice", "person", "question", "spore", "specialist", "maker"}
# Types that always earn a face, regardless of stage.
ALWAYS_TYPES = {"hub", "project", "person", "specialist", "maker"}
# Types/stages that never get a face (and are retired if they hold one).
NEVER_TYPES = {"spore", "question"}
NEVER_STAGES = {"seed", "sprout", "composting"}
# Stages that open the grey band for a concept.
GREY_STAGES = {"growing", "mature", "fruiting"}
HIGH_ACTIVATION = 5

PALACE_DEFAULT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))

FIELD_RE = {
    "type": re.compile(r'^type:\s*(.+?)\s*$', re.M),
    "stage": re.compile(r'^stage:\s*(.+?)\s*$', re.M),
    "activation_count": re.compile(r'^activation_count:\s*(\d+)', re.M),
}


def _unquote(v):
    v = v.strip()
    if len(v) >= 2 and v[0] == v[-1] and v[0] in ("'", '"'):
        v = v[1:-1]
    return v


def read_frontmatter(path):
    """Return a dict with type, stage, activation_count, pillars_has_philosophy, link_count.
    None if the file has no frontmatter block."""
    try:
        with open(path, encoding="utf-8", errors="ignore") as f:
            head = f.read(8192)
    except OSError:
        return None
    if not head.startswith("---"):
        return None
    end = head.find("\n---", 3)
    if end == -1:
        return None
    block = head[3:end]
    fm = {"type": None, "stage": None, "activation_count": 0}
    for k, rx in FIELD_RE.items():
        m = rx.search(block)
        if m:
            fm[k] = _unquote(m.group(1)) if k != "activation_count" else int(m.group(1))
    # philosophy-pillar: inspect the `pillars:` FIELD only (inline [a,b] or a bullet list),
    # never the whole block — a link label like "philosophy of science" must not read as a pillar.
    pm = re.search(r'^pillars:[ \t]*(\[[^\]]*\]|(?:\n[ \t]+-[^\n]*)+)', block, re.M)
    fm["pillars_has_philosophy"] = bool(pm and re.search(r'\bphilosophy\b', pm.group(1), re.I))
    # count typed links: only `- target:` entries inside the `links:` block, not another field
    # that happens to use `- target:` (e.g. `related:`). Latent today, masked by classify() order.
    links_at = block.find("links:")
    fm["link_count"] = len(re.findall(r'^\s*-\s*target:', block[links_at:], re.M)) if links_at != -1 else 0
    return fm


def has_face(md_path):
    """(has_hero, has_icon): does the entry's bundle folder hold a hero/icon png?
    Bundle = sibling folder named exactly like the entry (SCHEMA §8). Accepts the
    title-matched name or any `* — hero.png` / `* — icon.png` (STIGMERGY's rule)."""
    stem = os.path.basename(md_path)[:-3]
    bundle = os.path.join(os.path.dirname(md_path), stem)
    if not os.path.isdir(bundle):
        return False, False
    hero = icon = False
    try:
        for f in os.listdir(bundle):
            if f.endswith("— hero.png") or f.endswith("- hero.png"):
                hero = True
            elif f.endswith("— icon.png") or f.endswith("- icon.png"):
                icon = True
    except OSError:
        pass
    return hero, icon


def is_skipped_prefix(rel):
    r = rel.replace(os.sep, "/")
    return any(r.startswith(p) for p in SKIP_PREFIXES)


def classify(fm):
    """Return 'always', 'grey', or 'never' for an entry's face-worthiness."""
    typ, stage = fm["type"], fm["stage"]
    if stage == "foundational":
        return "always"
    # NEVER precedence is intentional: a spore/composting entry (or seed/sprout concept)
    # is never proposed for a face even with a high link count. Do not reorder below the
    # link-count / always-type checks or spores with >=5 links would wrongly qualify.
    if typ in NEVER_TYPES or stage in NEVER_STAGES:
        return "never"
    if typ in ALWAYS_TYPES or fm["link_count"] >= 5:
        return "always"
    if typ == "breakthrough":
        return "grey"
    if typ == "concept" and (stage in GREY_STAGES or fm["pillars_has_philosophy"]):
        return "grey"
    if fm["activation_count"] >= HIGH_ACTIVATION:
        return "grey"
    return "never"


def audit(root, only=None):
    add_definite, add_grey, retire = [], [], []
    for dp, dns, fns in os.walk(root):
        dns[:] = [d for d in dns if d not in SKIP_DIRS]
        for fn in fns:
            if not fn.endswith(".md"):
                continue
            ap = os.path.join(dp, fn)
            rel = os.path.relpath(ap, root)
            if only is not None and rel.replace(os.sep, "/") not in only:
                continue
            if is_skipped_prefix(rel) or os.path.islink(ap):
                continue
            fm = read_frontmatter(ap)
            if not fm or fm["type"] not in CANON_TYPES:
                continue
            hero, icon = has_face(ap)
            faced = hero and icon
            # RETIRE: genuine degradation only - a spore or a composting entry that still
            # wears a face. A seed/sprout entry deliberately given a face keeps it; thinness
            # is a reason not to ADD a face, never to strip one.
            if (hero or icon) and (fm["type"] == "spore" or fm["stage"] == "composting"):
                retire.append(f'{rel}  (type {fm["type"]}, stage {fm["stage"]}) '
                              f'- holds a face; retire it (degradation)')
                continue
            # ADD: an entry that merits a face and lacks one.
            klass = classify(fm)
            if klass != "never" and not faced:
                miss = "no hero+icon" if not (hero or icon) else (
                    "missing icon" if hero else "missing hero")
                row = f'{rel}  (type {fm["type"]}, stage {fm["stage"]}, {fm["link_count"]} links) - {miss}'
                (add_definite if klass == "always" else add_grey).append(row)
    return add_definite, add_grey, retire


def parse_args():
    """[palace-root] positional + optional --paths a,b,c (root-relative files to audit)."""
    root, only = None, None
    args = sys.argv[1:]
    i = 0
    while i < len(args):
        if args[i] == "--paths" and i + 1 < len(args):
            only = {p.strip().lstrip("./") for p in args[i + 1].split(",") if p.strip()}
            i += 2
        elif not args[i].startswith("--"):
            root = args[i]; i += 1
        else:
            i += 1
    return os.path.abspath(root or PALACE_DEFAULT), only


def main():
    root, only = parse_args()
    if not os.path.isdir(root):
        sys.exit(f"not a directory: {root}")

    add_definite, add_grey, retire = (sorted(x) for x in audit(root, only))
    print(f"face audit - root: {root}\n")
    print(f"ADD - definite ({len(add_definite)}) - always-types lacking a face -> render batch:")
    for x in add_definite:
        print("  + " + x)
    print(f"\nADD - grey ({len(add_grey)}) - judgment; the worker/Loudon rules:")
    for x in add_grey:
        print("  ? " + x)
    print(f"\nRETIRE ({len(retire)}) - faces on now-dormant entries; Loudon confirms:")
    for x in retire:
        print("  - " + x)
    print(f"\nsummary: {len(add_definite)} definite adds, {len(add_grey)} grey adds, "
          f"{len(retire)} retires")
    sys.exit(0)


if __name__ == "__main__":
    main()
