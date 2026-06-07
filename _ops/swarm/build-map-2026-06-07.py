#!/usr/bin/env python3
"""
Map Build Ceremony — full survey, frontmatter-only.
Produces palace-map-full-2026-04-27.{tsv,json,adjacency.txt}
Outputs ghost taxonomy: error_ghosts, ops_ghosts, forward_ghosts.

Per Map Build Ceremony spec:
- Reads frontmatter only (~40 lines per file).
- Excludes Artifacts/, entries/, _ops/maps/, _ops/swarm/sessions/, __pycache__, .git, .obsidian, .claude.
- _ops/*.md are valid link targets but not mapped as graph nodes — they classify as ops_ghosts when referenced.
"""
from __future__ import annotations
import os
import re
import json
import sys
from pathlib import Path
from collections import defaultdict

PALACE = Path("/Users/loudonstearns/Documents/The Palace")
DATE = "2026-06-07"
OUT_DIR = PALACE / "_ops" / "maps"

# Directories that contain palace nodes (mapped as graph nodes)
NODE_DIRS = [
    PALACE,                                     # root
    PALACE / "Projects",
    PALACE / "Palace development",
    PALACE / "Modes of collaboration",
    PALACE / "Crystal Audio",
    PALACE / "People",
]

# _ops .md files — valid link targets but NOT mapped as graph nodes (per ceremony spec)
OPS_DIR = PALACE / "_ops"

# Hard exclusions — never recurse here
EXCLUDE_DIRS = {
    PALACE / "Artifacts",
    PALACE / "entries",
    PALACE / ".git",
    PALACE / ".obsidian",
    PALACE / ".claude",
    PALACE / "__pycache__",
    PALACE / "_ops" / "maps",
    PALACE / "_ops" / "swarm" / "sessions",
    PALACE / "_ops" / "swarm" / "persistent",
    PALACE / "_ops" / "swarm" / "experiments",
    PALACE / "_ops" / "stigmergy",
    PALACE / "_ops" / "agents",
    PALACE / "_ops" / "sample-libraries",
    PALACE / "_ops" / "loudon-live",
    PALACE / "_tools",
    PALACE / "Projects" / "2D Torus Wavetable Synthesizer" / "Wavetables",
    PALACE / "Projects" / "2D Torus Wavetable Synthesizer" / "RNBO",
    PALACE / "Projects" / "2D Torus Wavetable Synthesizer" / "Tools",
}

# Name-based exclusions — any directory matching these names is skipped wherever it appears.
# Catches vendored deps (node_modules), virtualenvs, build/cache dirs that appear under bundles.
EXCLUDE_DIR_NAMES = {
    "node_modules",
    "venv",
    ".venv",
    ".venvs",
    "__pycache__",
    "dist",
    "build",
    ".next",
    ".cache",
    "site-packages",
}

FRONTMATTER_RE = re.compile(r"^---\n(.*?)\n---", re.DOTALL)
LINK_TARGET_RE = re.compile(r'target:\s*"?\[\[([^\]]+)\]\]"?')
LINK_TYPE_RE = re.compile(r'type:\s*([a-z\-]+)', re.IGNORECASE)


def is_excluded(path: Path) -> bool:
    p = path.resolve()
    # Path-rooted exclusions
    for ex in EXCLUDE_DIRS:
        try:
            p.relative_to(ex)
            return True
        except ValueError:
            continue
    # Name-based exclusions — any segment matching is enough
    for part in p.parts:
        if part in EXCLUDE_DIR_NAMES:
            return True
    return False


def is_bundle_file(path: Path, all_entry_stems: set[str]) -> bool:
    """A .md is a bundle file if any parent directory's name matches an existing entry's filename stem.
    Per SCHEMA §8: entry bundles are sibling folders named identically to the entry. Files inside
    them are bundle content, not first-class nodes."""
    # Walk up from the file; if any parent dir name matches an entry stem, treat as bundle.
    for parent in path.parents:
        if parent == PALACE:
            break
        if parent.name in all_entry_stems:
            return True
        # Also handle Archive/ subdirectory inside a bundle
        if parent.name == "Archive" and parent.parent.name in all_entry_stems:
            return True
    return False


def collect_md_files(roots, recursive=True) -> list[Path]:
    files = []
    for root in roots:
        if not root.exists():
            continue
        if recursive:
            for p in root.rglob("*.md"):
                if not is_excluded(p):
                    files.append(p)
        else:
            for p in root.glob("*.md"):
                if not is_excluded(p):
                    files.append(p)
    return files


def parse_frontmatter(path: Path) -> dict:
    """Read first ~80 lines and extract YAML frontmatter as a string."""
    try:
        with open(path, "r", encoding="utf-8") as f:
            head = "".join([next(f) for _ in range(120)])
    except StopIteration:
        with open(path, "r", encoding="utf-8") as f:
            head = f.read()
    except Exception:
        return {"raw": "", "links": [], "type": None, "stage": None}
    m = FRONTMATTER_RE.match(head)
    if not m:
        return {"raw": "", "links": [], "type": None, "stage": None,
                "has_forward_vector": False, "last_activated": None, "activation_count": None}
    raw = m.group(1)
    # Extract type, stage, pillars
    type_m = re.search(r"^type:\s*(\S+)", raw, re.MULTILINE)
    stage_m = re.search(r"^stage:\s*(\S+)", raw, re.MULTILINE)
    fv_m = re.search(r"^forward_vector:", raw, re.MULTILINE)
    last_m = re.search(r"^last_activated:\s*(\S+)", raw, re.MULTILINE)
    act_m = re.search(r"^activation_count:\s*(\S+)", raw, re.MULTILINE)
    # Extract links — preserve order, capture target + nearest type
    lines = raw.split("\n")
    links = []
    cur_target = None
    cur_type = None
    cur_label = None
    for ln in lines:
        t_m = LINK_TARGET_RE.search(ln)
        if t_m:
            if cur_target:
                links.append({"target": cur_target, "type": cur_type or "connects-to", "label": cur_label})
            cur_target = t_m.group(1).strip()
            cur_type = None
            cur_label = None
            continue
        ty_m = re.search(r"^\s*type:\s*([a-z\-]+)", ln, re.IGNORECASE)
        if ty_m and cur_target:
            cur_type = ty_m.group(1).strip()
            continue
        lab_m = re.search(r"^\s*label:\s*(.+)$", ln)
        if lab_m and cur_target:
            cur_label = lab_m.group(1).strip().strip('"').strip("'")
    if cur_target:
        links.append({"target": cur_target, "type": cur_type or "connects-to", "label": cur_label})
    return {
        "raw": raw,
        "links": links,
        "type": type_m.group(1) if type_m else None,
        "stage": stage_m.group(1) if stage_m else None,
        "has_forward_vector": fv_m is not None,
        "last_activated": last_m.group(1) if last_m else None,
        "activation_count": act_m.group(1) if act_m else None,
    }


def filename_to_id(path: Path) -> str:
    """Entry ID = filename without .md extension."""
    return path.stem


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    # 1. Collect palace node files (mapped) and ops files (linkable, not mapped)
    node_files = collect_md_files(NODE_DIRS, recursive=True)
    ops_files = collect_md_files([OPS_DIR], recursive=False)
    # Also include _ops one level deep but not the excluded subdirs
    for p in OPS_DIR.iterdir():
        if p.is_dir() and not is_excluded(p):
            for sub in p.glob("*.md"):
                if not is_excluded(sub):
                    ops_files.append(sub)

    # Deduplicate (in case a file matched twice)
    node_files = sorted(set(node_files), key=lambda p: str(p))
    ops_files = sorted(set(ops_files), key=lambda p: str(p))

    # Bundle-file filter: a .md is an entry-bundle file (SCHEMA §8) when any ancestor folder
    # matches another entry's stem. Compute on the candidate set itself so the rule is
    # self-defining: every sibling [Entry].md spawns a bundle namespace.
    all_stems = {p.stem for p in node_files} | {p.stem for p in ops_files}
    node_files = [p for p in node_files if not is_bundle_file(p, all_stems)]
    ops_files = [p for p in ops_files if not is_bundle_file(p, all_stems)]

    node_ids = {filename_to_id(p): p for p in node_files}
    ops_ids = {filename_to_id(p): p for p in ops_files}
    # node IDs case-insensitive lookup for error_ghost detection
    ci_node = {k.lower(): k for k in node_ids}
    ci_ops = {k.lower(): k for k in ops_ids}

    # 2. Parse frontmatter for nodes
    node_meta = {}
    for p in node_files:
        fm = parse_frontmatter(p)
        node_meta[filename_to_id(p)] = {"path": str(p.relative_to(PALACE)), "fm": fm}

    # Also parse ops frontmatter so coordinator can reason about ops nodes if needed
    ops_meta = {}
    for p in ops_files:
        fm = parse_frontmatter(p)
        ops_meta[filename_to_id(p)] = {"path": str(p.relative_to(PALACE)), "fm": fm}

    # 3. Build edge list and ghost classification
    edges = []          # (source, type, target, label)
    error_ghosts = []   # case-mismatch — entry exists, link broken
    ops_ghosts = set()  # valid ops references
    forward_ghosts = defaultdict(list)  # target -> sources who reference it
    inbound = defaultdict(list)  # target -> [source]

    for src_id, meta in node_meta.items():
        for link in meta["fm"]["links"]:
            target_raw = link["target"]
            # Strip http/https
            if target_raw.lower().startswith(("http://", "https://")):
                continue
            tgt = target_raw.strip()
            link_type = link["type"]
            label = link["label"]
            edges.append({"source": src_id, "type": link_type, "target": tgt, "label": label})

            # Classify
            if tgt in node_ids:
                inbound[tgt].append(src_id)
            elif tgt.lower() in ci_node and tgt != ci_node[tgt.lower()]:
                error_ghosts.append({"source": src_id, "target": tgt, "resolves_to": ci_node[tgt.lower()]})
            elif tgt in ops_ids:
                ops_ghosts.add(tgt)
            elif tgt.lower() in ci_ops:
                # case-insensitive ops match — also error_ghost-ish but ops scope
                if tgt != ci_ops[tgt.lower()]:
                    error_ghosts.append({"source": src_id, "target": tgt, "resolves_to": ci_ops[tgt.lower()] + " (in _ops/)"})
                else:
                    ops_ghosts.add(tgt)
            else:
                forward_ghosts[tgt].append(src_id)

    # 4. Build outputs
    # TSV
    tsv_lines = ["source\trelation\ttarget"]
    for e in edges:
        tsv_lines.append(f"{e['source']}\t{e['type']}\t{e['target']}")
    tsv_path = OUT_DIR / f"palace-map-full-{DATE}.tsv"
    tsv_path.write_text("\n".join(tsv_lines) + "\n")

    # Adjacency (bidirectional — needed for swarm self-location)
    adj_lines = []
    out_edges = defaultdict(list)
    in_edges = defaultdict(list)
    for e in edges:
        if e["source"] in node_ids and e["target"] in node_ids:
            out_edges[e["source"]].append(f"{e['type']}:{e['target']}")
            in_edges[e["target"]].append(f"{e['type']}:{e['source']}")
    for nid in sorted(node_ids):
        outs = ", ".join(out_edges[nid])
        ins = ", ".join(in_edges[nid])
        adj_lines.append(f"{nid}: out[{outs}] in[{ins}]")
    adj_path = OUT_DIR / f"palace-map-full-{DATE}-adjacency.txt"
    adj_path.write_text("\n".join(adj_lines) + "\n")

    # JSON
    nodes_out = []
    for nid in sorted(node_ids):
        m = node_meta[nid]["fm"]
        nodes_out.append({
            "id": nid,
            "path": node_meta[nid]["path"],
            "type": m["type"],
            "stage": m["stage"],
            "has_forward_vector": m["has_forward_vector"],
            "last_activated": m["last_activated"],
            "activation_count": m["activation_count"],
            "outbound_count": len(out_edges[nid]),
            "inbound_count": len(in_edges[nid]),
        })
    json_data = {
        "meta": {
            "generated": DATE,
            "scope": "full",
            "node_count": len(node_ids),
            "ops_node_count": len(ops_ids),
            "edge_count": len(edges),
            "ghost_taxonomy": {
                "error_ghosts": error_ghosts,
                "ops_ghosts": sorted(ops_ghosts),
                "forward_ghosts": [{"target": k, "sources": v} for k, v in sorted(forward_ghosts.items())],
            },
        },
        "nodes": nodes_out,
        "edges": edges,
    }
    json_path = OUT_DIR / f"palace-map-full-{DATE}.json"
    json_path.write_text(json.dumps(json_data, indent=2))

    # Print summary
    print(f"Map written: {tsv_path.name}, {adj_path.name}, {json_path.name}")
    print(f"Nodes: {len(node_ids)}")
    print(f"Ops nodes (linkable, not mapped): {len(ops_ids)}")
    print(f"Edges: {len(edges)}")
    print(f"Error ghosts: {len(error_ghosts)}")
    print(f"Ops ghosts: {len(ops_ghosts)}")
    print(f"Forward ghosts: {len(forward_ghosts)}")
    if error_ghosts:
        print("\nError ghosts (broken refs to existing entries):")
        for e in error_ghosts[:20]:
            print(f"  {e['source']} → '{e['target']}' (resolves to {e['resolves_to']})")
    if forward_ghosts:
        print(f"\nForward ghosts (references to non-existent entries) — top 30:")
        sorted_fg = sorted(forward_ghosts.items(), key=lambda kv: -len(kv[1]))
        for tgt, srcs in sorted_fg[:30]:
            print(f"  {tgt}  ← {len(srcs)} source(s): {', '.join(srcs[:3])}{'...' if len(srcs) > 3 else ''}")

    # Orphan and isolation analysis
    isolated = [nid for nid in node_ids if not in_edges[nid] and not out_edges[nid]]
    no_inbound = [nid for nid in node_ids if not in_edges[nid] and out_edges[nid]]
    no_outbound = [nid for nid in node_ids if not out_edges[nid] and in_edges[nid]]
    print(f"\nIsolated (no in or out): {len(isolated)}")
    if isolated:
        for nid in isolated[:20]:
            print(f"  {nid}")
    print(f"\nNo inbound (have out but no one points to them): {len(no_inbound)}")
    if no_inbound:
        for nid in no_inbound[:20]:
            print(f"  {nid}")


if __name__ == "__main__":
    main()
