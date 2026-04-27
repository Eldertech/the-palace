#!/usr/bin/env python3
"""
Mechanical audit pass — no LLM tokens needed.
Produces findings for: unsung paths, graffiti, missing forward vectors,
metadata gaps, link case inconsistencies, isolation/orphan analysis,
forward ghosts, stage staleness signals.

Reads the map output from build-map-2026-04-27.py to know the node set.
Then reads each entry's BODY (after frontmatter) to find unsung paths and graffiti.
"""
from __future__ import annotations
import json
import re
import sys
from pathlib import Path
from collections import defaultdict

PALACE = Path("/Users/loudonstearns/Documents/The Palace")
DATE = "2026-04-27"
MAP_PATH = PALACE / "_ops" / "maps" / f"palace-map-full-{DATE}.json"
OUT_PATH = PALACE / "_ops" / "swarm" / "sessions" / f"mechanical-audit-{DATE}.json"

FRONTMATTER_RE = re.compile(r"^---\n(.*?)\n---\n", re.DOTALL)
WIKILINK_RE = re.compile(r"\[\[([^\]\|#]+?)(?:\|[^\]]*)?(?:#[^\]]*)?\]\]")
COMMENT_RE = re.compile(r"<!--(.*?)-->", re.DOTALL)
LINK_TARGET_FM_RE = re.compile(r'target:\s*"?\[\[([^\]]+)\]\]"?')


def read_entry(path: Path) -> tuple[str, str]:
    """Return (frontmatter_str, body_str)."""
    try:
        text = path.read_text(encoding="utf-8")
    except Exception:
        return ("", "")
    m = FRONTMATTER_RE.match(text)
    if m:
        fm = m.group(1)
        body = text[m.end():]
        return (fm, body)
    return ("", text)


def main():
    with open(MAP_PATH) as f:
        map_data = json.load(f)

    # Build canonical node title set (case-insensitive lookup)
    node_titles = {n["id"]: n for n in map_data["nodes"]}
    ci_lookup = {nid.lower(): nid for nid in node_titles}

    # Build canonical YAML-link set per entry (so we know what's already typed)
    fm_links_by_entry: dict[str, set[str]] = defaultdict(set)
    for e in map_data["edges"]:
        fm_links_by_entry[e["source"]].add(e["target"])

    # Findings buckets
    unsung_paths = []          # body wikilink not in frontmatter
    graffiti = []              # HTML comments
    missing_forward_vector = []
    case_inconsistencies = []  # link target case doesn't match canonical filename
    stage_staleness = []       # entries with last_activated > 60 days old
    metadata_gaps = []         # missing last_activated or activation_count
    body_wikilink_only = []    # link present in body but not in frontmatter, no canonical match → forward_ghost candidate

    # OPS files we should treat as valid linkable targets
    ops_files = {p.stem for p in (PALACE / "_ops").glob("*.md")}
    for sub in (PALACE / "_ops").iterdir():
        if sub.is_dir() and sub.name not in ("maps", "stigmergy"):
            for p in sub.glob("*.md"):
                ops_files.add(p.stem)
    ci_ops_lookup = {f.lower(): f for f in ops_files}

    for node in map_data["nodes"]:
        nid = node["id"]
        path = PALACE / node["path"]
        if not path.exists():
            continue
        fm, body = read_entry(path)

        # Forward vector
        if not node.get("has_forward_vector"):
            missing_forward_vector.append(nid)

        # Metadata gaps
        gaps = []
        if not node.get("last_activated"):
            gaps.append("last_activated")
        if not node.get("activation_count"):
            gaps.append("activation_count")
        if gaps:
            metadata_gaps.append({"entry": nid, "missing": gaps})

        # Stage staleness — entries without a stage
        if not node.get("stage"):
            stage_staleness.append({"entry": nid, "issue": "no stage field"})

        # Body wikilinks
        body_links = WIKILINK_RE.findall(body)
        seen_in_body = set()
        for wl in body_links:
            wl_clean = wl.strip()
            seen_in_body.add(wl_clean)

        # Frontmatter link set for this entry (canonical names)
        fm_targets = fm_links_by_entry.get(nid, set())
        fm_targets_ci = {t.lower() for t in fm_targets}

        for wl in seen_in_body:
            wl_lower = wl.lower()
            # Skip wikilinks pointing at self
            if wl_lower == nid.lower():
                continue
            # Already typed in frontmatter (case-insensitive match)?
            if wl_lower in fm_targets_ci:
                continue
            # Resolves to a known node (case-insensitive)?
            if wl_lower in ci_lookup:
                canonical = ci_lookup[wl_lower]
                # Unsung path — body mentions known entry, no typed link
                # Determine structural significance heuristically: appears in heading or first 3 paragraphs
                first_chunk = body[:1500]
                significant = wl in first_chunk or any(
                    re.search(rf"^#+.*\[\[{re.escape(wl)}", body, re.MULTILINE)
                    for _ in [0]
                )
                unsung_paths.append({
                    "source": nid,
                    "body_phrase": wl,
                    "canonical_target": canonical,
                    "structurally_significant": significant,
                })
            elif wl_lower in ci_ops_lookup:
                # Reference to ops file — also valid; could be unsung
                canonical = ci_ops_lookup[wl_lower]
                if canonical not in fm_targets:
                    unsung_paths.append({
                        "source": nid,
                        "body_phrase": wl,
                        "canonical_target": canonical,
                        "structurally_significant": False,
                        "is_ops": True,
                    })
            else:
                # Forward-ghost in body
                body_wikilink_only.append({"source": nid, "body_phrase": wl})

        # Graffiti audit
        comments = COMMENT_RE.findall(body)
        for c in comments:
            text = c.strip()
            if not text:
                continue
            direction = "claude_to_loudon" if text.startswith("CLAUDE") or "CLAUDE →" in text or "CLAUDE→" in text else "loudon_to_claude"
            # References inside comment
            refs = WIKILINK_RE.findall(text)
            graffiti.append({
                "source": nid,
                "direction": direction,
                "content": text[:300],
                "wikilink_refs": refs,
            })

    # Frontmatter case-inconsistency check (link target not exact canonical filename)
    for e in map_data["edges"]:
        tgt = e["target"]
        if tgt in node_titles:
            continue
        if tgt.lower() in ci_lookup and tgt != ci_lookup[tgt.lower()]:
            case_inconsistencies.append({
                "source": e["source"],
                "wrong_case": tgt,
                "canonical": ci_lookup[tgt.lower()],
            })

    # Isolation analysis
    in_edges = defaultdict(list)
    out_edges = defaultdict(list)
    for e in map_data["edges"]:
        if e["source"] in node_titles and e["target"] in node_titles:
            out_edges[e["source"]].append(e["target"])
            in_edges[e["target"]].append(e["source"])

    isolated = [nid for nid in node_titles if not in_edges[nid] and not out_edges[nid]]
    no_inbound = [nid for nid in node_titles if not in_edges[nid] and out_edges[nid]]
    no_outbound = [nid for nid in node_titles if not out_edges[nid] and in_edges[nid]]

    # Hub analysis (≥5 typed links total)
    hubs = []
    for nid in node_titles:
        total = len(in_edges[nid]) + len(out_edges[nid])
        if total >= 5:
            hubs.append({"entry": nid, "in": len(in_edges[nid]), "out": len(out_edges[nid]), "total": total})
    hubs.sort(key=lambda h: -h["total"])

    findings = {
        "meta": {
            "date": DATE,
            "node_count": len(node_titles),
            "edge_count": len(map_data["edges"]),
        },
        "unsung_paths": unsung_paths,
        "graffiti": graffiti,
        "missing_forward_vector": missing_forward_vector,
        "metadata_gaps": metadata_gaps,
        "stage_staleness": stage_staleness,
        "case_inconsistencies": case_inconsistencies,
        "body_forward_ghosts": body_wikilink_only,
        "isolated": isolated,
        "no_inbound": no_inbound,
        "no_outbound": no_outbound,
        "hubs": hubs,
        "forward_ghosts_from_yaml": map_data["meta"]["ghost_taxonomy"]["forward_ghosts"],
    }

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(findings, indent=2))

    # Summary
    print(f"=== Mechanical Audit — {DATE} ===")
    print(f"Nodes: {len(node_titles)}, Edges: {len(map_data['edges'])}")
    print(f"Unsung paths: {len(unsung_paths)}")
    print(f"Graffiti items: {len(graffiti)}")
    print(f"Missing forward_vector: {len(missing_forward_vector)}")
    print(f"Metadata gaps: {len(metadata_gaps)}")
    print(f"Stage staleness flags: {len(stage_staleness)}")
    print(f"Case inconsistencies: {len(case_inconsistencies)}")
    print(f"Body forward-ghosts (wikilink to non-existent): {len(body_wikilink_only)}")
    print(f"Isolated: {len(isolated)}")
    print(f"No inbound: {len(no_inbound)}")
    print(f"No outbound: {len(no_outbound)}")
    print(f"Hubs (≥5 links): {len(hubs)}")
    print(f"\nTop hubs:")
    for h in hubs[:15]:
        print(f"  {h['entry']:50s}  in={h['in']:3d}  out={h['out']:3d}  total={h['total']:3d}")
    print(f"\nWritten: {OUT_PATH.relative_to(PALACE)}")


if __name__ == "__main__":
    main()
