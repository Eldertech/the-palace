#!/usr/bin/env python3
"""Palace Map builder — 2026-07-04 (straight re-run of build-map-2026-06-16.py).

Same logic as the 06-16 builder — node selection is FRONTMATTER-DRIVEN (a .md is a
graph node iff it carries a canonical `type:`; frontmatter-less files and bundle
companions with minimal frontmatter are skipped). The only change is DATE, so the
rebuild lands as `palace-map-full-2026-07-04.json` — the freshest file, which is what
the STIGMERGY /api/topology endpoint serves (it sorts dated maps newest-first).

Run this AFTER the bundle-content demotions (stripping `type:` from the ~21 project
working-docs / catalog files that should be SCHEMA §8 bundle files, not nodes). Those
files then lack `type:` and drop out automatically — no logic change needed here, just
a fresh snapshot that reflects the corrected canon.

Output schema is identical to the 06-16 builder so the linters consume it unchanged.
"""
import re, json
from pathlib import Path
from collections import defaultdict

PALACE = Path(__file__).resolve().parent.parent.parent
OUT_DIR = PALACE / "_ops" / "maps"
DATE = "2026-07-04"

CANON_TYPES = {"concept","hub","project","breakthrough","source","meta",
               "practice","person","question","spore","specialist","maker"}

EXCLUDE_PARTS = {".git",".obsidian",".claude","__pycache__","node_modules","venv",".venv",
                 ".venvs","dist","build",".next",".cache","site-packages","_tools","entries",
                 "_manim_media"}
OPS = PALACE / "_ops"
# machinery subtrees under _ops that are not link-target ceremony cards
OPS_EXCLUDE = {"swarm","stigmergy","agents","sample-libraries","loudon-live","maps","scratch",
               "claude-code-prompts","heartbeat","lost-and-found","Harvest Ceremony"}

FM_RE = re.compile(r"^---\n(.*?)\n---", re.DOTALL)
LINK_TARGET_RE = re.compile(r'target:\s*"?\[\[([^\]]+)\]\]"?')

def excluded(p: Path) -> bool:
    return any(part in EXCLUDE_PARTS for part in p.parts)

def parse_fm(path: Path):
    try:
        with open(path, encoding="utf-8") as f:
            head = "".join([f.readline() for _ in range(200)])
    except Exception:
        return None
    m = FM_RE.match(head)
    if not m:
        return None
    raw = m.group(1)
    ty = re.search(r"^type:\s*['\"]?([A-Za-z\-]+)", raw, re.M)
    stage = re.search(r"^stage:\s*(\S+)", raw, re.M)
    fv = re.search(r"^forward_vector:", raw, re.M)
    last = re.search(r"^last_activated:\s*(\S+)", raw, re.M)
    act = re.search(r"^activation_count:\s*(\S+)", raw, re.M)
    # links (target + nearest type + label), within the links: array
    links = []
    in_links = False
    cur_t = cur_ty = cur_lab = None
    for ln in raw.split("\n"):
        if re.match(r"^links:\s*$", ln): in_links = True; continue
        if in_links and re.match(r"^[A-Za-z_].*:", ln) and not ln.startswith(" "): in_links = False
        if not in_links: continue
        tm = LINK_TARGET_RE.search(ln)
        if tm:
            if cur_t: links.append({"target":cur_t,"type":cur_ty or "connects-to","label":cur_lab})
            cur_t = tm.group(1).strip(); cur_ty=None; cur_lab=None; continue
        tym = re.search(r"^\s*type:\s*([a-z\-]+)", ln, re.I)
        if tym and cur_t: cur_ty = tym.group(1).strip(); continue
        lm = re.search(r"^\s*label:\s*(.+)$", ln)
        if lm and cur_t: cur_lab = lm.group(1).strip().strip('"').strip("'")
    if cur_t: links.append({"target":cur_t,"type":cur_ty or "connects-to","label":cur_lab})
    return {"type": ty.group(1).lower() if ty else None,
            "stage": stage.group(1) if stage else None,
            "has_forward_vector": fv is not None,
            "last_activated": last.group(1) if last else None,
            "activation_count": act.group(1) if act else None,
            "links": links}

def basename(t):
    t = t.split("|")[0].split("#")[0].strip()
    if t.endswith(".md"): t = t[:-3]
    if "/" in t: t = t.split("/")[-1]
    return t.strip()

# collect nodes (canon-typed, not in _ops) and ops targets (_ops ceremony cards)
node_files, ops_files = [], []
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
    if rel.parts[0] == "_ops":
        # ops ceremony card = directly in _ops/ or one level into a non-machinery subdir
        if len(rel.parts) == 2 or (len(rel.parts) == 3 and rel.parts[1] not in OPS_EXCLUDE):
            ops_files.append(p)
        continue
    fm = parse_fm(p)
    if fm and fm["type"] in CANON_TYPES:
        node_files.append((p, fm))

node_meta = {p.stem: {"path": str(p.relative_to(PALACE)), "fm": fm} for p, fm in node_files}
node_ids = set(node_meta)
ops_ids = {p.stem for p in ops_files}
ci_node = {k.lower(): k for k in node_ids}

edges, error_ghosts = [], []
ops_ghosts = set()
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
        elif key in ops_ids:
            ops_ghosts.add(key)
        else:
            forward_ghosts[key].append(src)

nodes_out = [{"id": nid, "path": node_meta[nid]["path"], "type": node_meta[nid]["fm"]["type"],
             "stage": node_meta[nid]["fm"]["stage"],
             "has_forward_vector": node_meta[nid]["fm"]["has_forward_vector"],
             "last_activated": node_meta[nid]["fm"]["last_activated"],
             "activation_count": node_meta[nid]["fm"]["activation_count"],
             "outbound_count": len(out_edges[nid]), "inbound_count": len(in_edges[nid])}
            for nid in sorted(node_ids)]
json_data = {"meta": {"generated": DATE, "scope": "full", "node_count": len(node_ids),
             "ops_node_count": len(ops_ids), "edge_count": len(edges),
             "ghost_taxonomy": {"error_ghosts": error_ghosts, "ops_ghosts": sorted(ops_ghosts),
             "forward_ghosts": [{"target": k, "sources": v} for k, v in sorted(forward_ghosts.items())]}},
             "nodes": nodes_out, "edges": edges}

OUT_DIR.mkdir(parents=True, exist_ok=True)
(OUT_DIR / f"palace-map-full-{DATE}.json").write_text(json.dumps(json_data, indent=2))
tsv = ["source\trelation\ttarget"] + [f"{e['source']}\t{e['type']}\t{e['target']}" for e in edges]
(OUT_DIR / f"palace-map-full-{DATE}.tsv").write_text("\n".join(tsv) + "\n")
adj = [f"{nid}: out[{', '.join(out_edges[nid])}] in[{', '.join(in_edges[nid])}]" for nid in sorted(node_ids)]
(OUT_DIR / f"palace-map-full-{DATE}-adjacency.txt").write_text("\n".join(adj) + "\n")

print(f"Map written: palace-map-full-{DATE}.{{json,tsv,adjacency.txt}}")
print(f"Nodes: {len(node_ids)} | Ops targets: {len(ops_ids)} | Edges: {len(edges)}")
print(f"Error ghosts: {len(error_ghosts)} | Ops ghosts: {len(ops_ghosts)} | Forward ghosts: {len(forward_ghosts)}")
by_type = defaultdict(int)
for n in nodes_out: by_type[n["type"]] += 1
print("By type:", dict(sorted(by_type.items(), key=lambda x:-x[1])))
if error_ghosts:
    print("\nERROR GHOSTS:")
    for e in error_ghosts: print(f"  {e['source']} -> '{e['target']}' (resolves to {e['resolves_to']})")
print("\nForward ghosts (top 25):")
for tgt, srcs in sorted(forward_ghosts.items(), key=lambda kv:-len(kv[1]))[:25]:
    print(f"  {len(srcs):2d}x  {tgt}")
