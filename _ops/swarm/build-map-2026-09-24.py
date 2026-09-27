#!/usr/bin/env python3
"""Palace Map builder — 2026-09-24.

Builds `_ops/maps/palace-map-full-<date>.{json,tsv,adjacency.txt}` — the map the linters,
partition-palace.py, new-entry-catchup.py and STIGMERGY's /api/topology all read.

Node selection is FRONTMATTER-DRIVEN: a .md is a graph node iff it carries a canonical
`type:`; frontmatter-less files and bundle companions with minimal frontmatter are skipped.
Frontmatter is parsed as YAML (PyYAML, refusing duplicate keys as js-yaml does), so the map
and STIGMERGY's PULSE agree on what is canon, and one-line `- { target, type, label }` links
keep their type and label. A file whose frontmatter will not parse is not a node; it is listed
in `meta.yaml_errors` and printed, so a typo never drops an entry silently.

A link target that exists as a file but is not a node — a bundle file, a frontmatter-less
material, an `_ops/` card without a canon type — is a `file_ghost`: the link is valid, and it
is not a forward ghost.

**Ceremonies are woven (Loudon, 2026-09-23).** A ceremony card under `_ops/` (directly in
`_ops/`, or one level into a non-machinery subfolder) that carries a canonical `type:` is now
a full node: its links count in both directions and it lands in partitions like any entry.
Before this, ceremony cards were link *targets* only — their outbound links never counted, so
an entry that only ceremonies pointed at looked unreachable, and no weave worker ever read a
ceremony. A link to an `_ops/` card without a canonical type is a file ghost, like any link to
a file that is not a node.
Nodes carry `"ops_card": true|false`.

Usage:
  python3 _ops/swarm/build-map-2026-09-24.py                 # dated today, into _ops/maps/
  python3 _ops/swarm/build-map-2026-09-24.py --date 2026-09-24 --out-dir /tmp/maps

`--date` retires the copy-a-dated-builder habit: this file keeps its name as the newest
builder (Weave Ceremony Step 6.5 runs the newest `build-map-*.py`), and the date is an
argument. Output schema is the 08-26 builder's plus the `ops_card` node field.

**Use replaces activation (SCHEMA v1.26, 2026-09-26).** Nodes no longer carry the hand-kept
`last_activated` / `activation_count`; they carry `use` — page edit days, bundle edit days, and
entries that formed a link to them, all-time and over the recent window — plus `last_used`,
computed from git by `entry-use.py`. The map is a snapshot, so its `use` is as of `--date`.
"""
import argparse, datetime, importlib.util
import re, json
from pathlib import Path
from collections import Counter, defaultdict

import yaml

PALACE = Path(__file__).resolve().parent.parent.parent
_ap = argparse.ArgumentParser(description="Build the palace map.")
_ap.add_argument("--date", default=datetime.date.today().isoformat(), help="map date stamp (default: today)")
_ap.add_argument("--out-dir", type=Path, default=PALACE / "_ops" / "maps", help="output folder")
_args = _ap.parse_args()
OUT_DIR = _args.out_dir
DATE = _args.date

CANON_TYPES = {"concept","hub","project","source","meta",
               "practice","person","question","spore","specialist","maker"}

EXCLUDE_PARTS = {".git",".obsidian",".claude","__pycache__","node_modules","venv",".venv",
                 ".venvs","dist","build",".next",".cache","site-packages","_tools","entries",
                 "_manim_media"}
OPS = PALACE / "_ops"
# machinery subtrees under _ops that are not link-target ceremony cards
OPS_EXCLUDE = {"swarm","stigmergy","agents","sample-libraries","loudon-live","maps","scratch",
               "claude-code-prompts","heartbeat","lost-and-found","Harvest Ceremony"}

# The frontmatter fence, as STIGMERGY's yaml-frontmatter.js finds it.
FM_OPEN = re.compile(r"^---\s*\r?\n")
FM_CLOSE = re.compile(r"\r?\n---\s*(\r?\n|$)")
WIKI_RE = re.compile(r"^\[\[(.+?)\]\]$")

class _Loader(getattr(yaml, "CSafeLoader", yaml.SafeLoader)):
    """Safe YAML that refuses a repeated key, as js-yaml does."""

def _mapping(loader, node, deep=False):
    seen = set()
    for k, _ in node.value:
        if isinstance(k, yaml.ScalarNode):
            if k.value in seen:
                raise yaml.constructor.ConstructorError(
                    None, None, f"duplicated mapping key {k.value!r}", k.start_mark)
            seen.add(k.value)
    return loader.construct_mapping(node, deep=deep)

_Loader.add_constructor(yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG, _mapping)

def excluded(p: Path) -> bool:
    return any(part in EXCLUDE_PARTS for part in p.parts)

def _links(raw):
    """The links array as { target, type, label }, the way STIGMERGY's normalizeLinks reads it."""
    out = []
    for l in raw if isinstance(raw, list) else []:
        if not isinstance(l, dict) or not isinstance(l.get("target"), str):
            continue
        t = l["target"].strip()
        m = WIKI_RE.match(t)
        t = m.group(1).strip() if m else t
        if not t:
            continue
        ty = l.get("type") if isinstance(l.get("type"), str) else "connects-to"
        lab = l.get("label") if isinstance(l.get("label"), str) and l["label"].strip() else None
        out.append({"target": t, "type": ty, "label": lab})
    return out

def parse_fm(path: Path):
    """None when the file has no frontmatter; {"error": ...} when it will not parse."""
    try:
        text = path.read_text(encoding="utf-8")
    except Exception:
        return None
    if not FM_OPEN.match(text):
        return None
    rest = FM_OPEN.sub("", text, count=1)
    close = FM_CLOSE.search(rest)
    if not close:
        return {"error": "unterminated frontmatter"}
    try:
        fm = yaml.load(rest[:close.start()], Loader=_Loader)
    except yaml.YAMLError as e:
        return {"error": " ".join(str(e).split())}
    if fm is None:
        return None
    if not isinstance(fm, dict):
        return {"error": f"frontmatter is not a mapping (got {type(fm).__name__})"}
    return {"type": fm["type"] if isinstance(fm.get("type"), str) else None,
            "stage": str(fm["stage"]) if fm.get("stage") is not None else None,
            "has_forward_vector": "forward_vector" in fm,
            "links": _links(fm.get("links"))}

def basename(t):
    t = t.split("|")[0].split("#")[0].strip()
    if t.endswith(".md"): t = t[:-3]
    if "/" in t: t = t.split("/")[-1]
    return t.strip()

# collect nodes (canon-typed) and every other file a link may land on (bundle files,
# materials, _ops cards without a canon type) — those make file ghosts, not forward ones
node_files, other_files, yaml_errors = [], [], []
for p in PALACE.rglob("*.md"):
    # Skip symlinks: the 5 `_`-underscore files at root (Cooperation_Yields_Agency.md,
    # FOUR_PILLARS.md, etc.) are symlinks to their spaced originals, existing ONLY so
    # CLAUDE.md's @import floor can resolve (the spaces bug). rglob yields them and
    # parse_fm follows the link, minting phantom duplicate nodes with underscore ids
    # and no bundle avatar. They are not entries — the spaced originals are. (listEntries
    # already skips them: a symlink Dirent reports isFile()===false.)
    if p.is_symlink(): continue
    if excluded(p): continue
    rel = p.relative_to(PALACE)
    # ops ceremony card = directly in _ops/ or one level into a non-machinery subdir
    in_ops = rel.parts[0] == "_ops"
    ops_card = in_ops and (len(rel.parts) == 2 or (len(rel.parts) == 3 and rel.parts[1] not in OPS_EXCLUDE))
    if in_ops and not ops_card:
        other_files.append(p)
        continue
    fm = parse_fm(p)
    if fm and "error" in fm:
        yaml_errors.append({"path": str(rel), "error": fm["error"]})
        fm = None
    if fm and fm["type"] in CANON_TYPES:
        node_files.append((p, fm))   # a ceremony card with canon type is woven as a node too
    else:
        other_files.append(p)

node_meta = {p.stem: {"path": str(p.relative_to(PALACE)), "fm": fm} for p, fm in node_files}
node_ids = set(node_meta)
file_ids = {p.stem for p in other_files} - node_ids
ci_node = {k.lower(): k for k in node_ids}
# Nodes are keyed by filename, so two entries with one name would collapse into one node.
dup_ids = sorted(k for k, n in Counter(p.stem for p, _ in node_files).items() if n > 1)

edges, error_ghosts = [], []
file_ghosts = set()
forward_ghosts = defaultdict(list)
out_edges, in_edges = defaultdict(list), defaultdict(list)
for src, meta in node_meta.items():
    for link in meta["fm"]["links"]:
        raw = link["target"].strip()
        if raw.lower().startswith(("http://","https://")): continue
        key = basename(raw)
        edges.append({"source": src, "type": link["type"], "target": key, "label": link["label"]})
        if key in node_ids:
            out_edges[src].append(f"{link['type']}:{key}"); in_edges[key].append(f"{link['type']}:{src}")
        elif key.lower() in ci_node and key != ci_node[key.lower()]:
            error_ghosts.append({"source": src, "target": key, "resolves_to": ci_node[key.lower()]})
        elif key in file_ids:
            file_ghosts.add(key)
        else:
            forward_ghosts[key].append(src)

_spec = importlib.util.spec_from_file_location("entry_use", Path(__file__).with_name("entry-use.py"))
_entry_use = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(_entry_use)
USE = _entry_use.compute(PALACE, today=DATE)
def _use(nid):
    u = USE["entries"].get(nid)
    if not u:
        return None
    return {k: u[k] for k in ("page", "bundle", "linked", "use", "recent")}

nodes_out = [{"id": nid, "path": node_meta[nid]["path"], "type": node_meta[nid]["fm"]["type"],
             "stage": node_meta[nid]["fm"]["stage"],
             "has_forward_vector": node_meta[nid]["fm"]["has_forward_vector"],
             "last_used": (USE["entries"].get(nid) or {}).get("last_used"),
             "use": _use(nid),
             "outbound_count": len(out_edges[nid]), "inbound_count": len(in_edges[nid]),
             "ops_card": node_meta[nid]["path"].startswith("_ops/")}
            for nid in sorted(node_ids)]
json_data = {"meta": {"generated": DATE, "scope": "full", "node_count": len(node_ids),
             "use": {k: USE["meta"][k] for k in ("head", "window_days", "window_since", "sweep_threshold")},
             "edge_count": len(edges),
             "yaml_errors": yaml_errors,
             "ghost_taxonomy": {"error_ghosts": error_ghosts, "file_ghosts": sorted(file_ghosts),
             "forward_ghosts": [{"target": k, "sources": v} for k, v in sorted(forward_ghosts.items())]}},
             "nodes": nodes_out, "edges": edges}

OUT_DIR.mkdir(parents=True, exist_ok=True)
(OUT_DIR / f"palace-map-full-{DATE}.json").write_text(json.dumps(json_data, indent=2))
tsv = ["source\trelation\ttarget"] + [f"{e['source']}\t{e['type']}\t{e['target']}" for e in edges]
(OUT_DIR / f"palace-map-full-{DATE}.tsv").write_text("\n".join(tsv) + "\n")
adj = [f"{nid}: out[{', '.join(out_edges[nid])}] in[{', '.join(in_edges[nid])}]" for nid in sorted(node_ids)]
(OUT_DIR / f"palace-map-full-{DATE}-adjacency.txt").write_text("\n".join(adj) + "\n")

print(f"Map written: palace-map-full-{DATE}.{{json,tsv,adjacency.txt}}")
print(f"Nodes: {len(node_ids)} ({sum(1 for n in nodes_out if n['ops_card'])} ceremony cards) | Edges: {len(edges)}")
print(f"Error ghosts: {len(error_ghosts)} | File ghosts: {len(file_ghosts)} | Forward ghosts: {len(forward_ghosts)}")
by_type = defaultdict(int)
for n in nodes_out: by_type[n["type"]] += 1
print("By type:", dict(sorted(by_type.items(), key=lambda x:-x[1])))
if yaml_errors:
    print("\nFRONTMATTER THAT WILL NOT PARSE (so not a node):")
    for e in yaml_errors: print(f"  {e['path']}: {e['error']}")
if dup_ids:
    print("\nTWO ENTRIES SHARE A NAME (collapsed into one node):", ", ".join(dup_ids))
if error_ghosts:
    print("\nERROR GHOSTS:")
    for e in error_ghosts: print(f"  {e['source']} -> '{e['target']}' (resolves to {e['resolves_to']})")
print("\nForward ghosts (top 25):")
for tgt, srcs in sorted(forward_ghosts.items(), key=lambda kv:-len(kv[1]))[:25]:
    print(f"  {len(srcs):2d}x  {tgt}")
