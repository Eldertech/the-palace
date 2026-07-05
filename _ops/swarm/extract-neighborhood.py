#!/usr/bin/env python3
"""
Extract a palace entry's neighborhood from the palace map JSON.

Usage:
  python3 extract-neighborhood.py "Entry Name"
  python3 extract-neighborhood.py "Entry Name" --template   # outputs filled prompt
  python3 extract-neighborhood.py --list                     # lists all entries
  python3 extract-neighborhood.py --batch "Entry1" "Entry2"  # multiple entries

Reads: _ops/maps/palace-map-full-*.json (uses most recent)
"""

import json
import glob
import sys
import os

PALACE_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def load_map():
    pattern = os.path.join(PALACE_ROOT, "_ops/maps/palace-map-full-*.json")
    files = sorted(glob.glob(pattern))
    if not files:
        print("ERROR: No palace map JSON found in _ops/maps/", file=sys.stderr)
        sys.exit(1)
    with open(files[-1]) as f:
        return json.load(f), files[-1]

def get_neighborhood(data, target):
    edges = [e for e in data['edges'] if e['from'] == target or e['to'] == target]
    neighbors = set()
    for e in edges:
        neighbors.add(e['from'] if e['to'] == target else e['to'])
    return edges, sorted(neighbors)

def find_entry_path(entry_name):
    """Search for the entry file across palace directories."""
    candidates = [
        f"{entry_name}.md",
        f"Projects/{entry_name}.md",
        f"Palace development/{entry_name}.md",
        f"_ops/{entry_name}.md",
        f"Modes of collaboration/{entry_name}.md",
    ]
    for c in candidates:
        full = os.path.join(PALACE_ROOT, c)
        if os.path.exists(full):
            return full
    return f"{PALACE_ROOT}/{entry_name}.md"  # fallback

def format_edges(edges):
    lines = []
    for e in edges:
        lines.append(f"{e['from']} --[{e['rel']}]--> {e['to']}")
    return "\n".join(lines)

def fill_template(entry_name, edges, neighbors, max_intros=3, new_entries=None):
    edge_list = format_edges(edges)
    neighbor_list = ", ".join(neighbors)
    entry_path = find_entry_path(entry_name)

    template_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "worker-prompt-template.md")
    with open(template_path) as f:
        template = f.read()

    # Extract just the prompt block between the ``` markers
    lines = template.split("\n")
    in_block = False
    prompt_lines = []
    for line in lines:
        if line.strip() == "```" and in_block:
            break
        if in_block:
            prompt_lines.append(line)
        if line.strip().startswith("```") and not in_block and "You are a Palace" not in line:
            continue
        if "You are a Palace Single-Doc Worker" in line:
            in_block = True
            prompt_lines.append(line)

    prompt = "\n".join(prompt_lines)
    prompt = prompt.replace("{{ENTRY_NAME}}", entry_name)
    prompt = prompt.replace("{{EDGE_COUNT}}", str(len(edges)))
    prompt = prompt.replace("{{EDGE_LIST}}", edge_list)
    prompt = prompt.replace("{{NEIGHBOR_LIST}}", neighbor_list)
    prompt = prompt.replace("{{ENTRY_PATH}}", entry_path)
    # Step 0b catch-up placeholders — never leak a raw {{...}} into a worker prompt.
    prompt = prompt.replace("{{MAX_INTRODUCTIONS}}", str(max_intros))
    prompt = prompt.replace(
        "{{NEW_ENTRIES}}",
        new_entries if new_entries
        else "(none flagged this run — run new-entry-catchup.py --block to compute)")
    return prompt

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 extract-neighborhood.py 'Entry Name' [--template]")
        sys.exit(1)

    data, map_file = load_map()

    if sys.argv[1] == "--list":
        for node in sorted(data['nodes'], key=lambda n: n['id']):
            print(f"{node['id']} ({node['type']}, {node['stage']})")
        return

    if sys.argv[1] == "--batch":
        entries = sys.argv[2:]
        for entry in entries:
            edges, neighbors = get_neighborhood(data, entry)
            print(f"\n=== {entry} ({len(edges)} edges, {len(neighbors)} neighbors) ===")
            print(format_edges(edges))
        return

    entry_name = sys.argv[1]
    edges, neighbors = get_neighborhood(data, entry_name)

    if not edges:
        print(f"WARNING: No edges found for '{entry_name}'", file=sys.stderr)
        # Check for close matches
        all_ids = [n['id'] for n in data['nodes']]
        close = [n for n in all_ids if entry_name.lower() in n.lower()]
        if close:
            print(f"Did you mean: {', '.join(close)}", file=sys.stderr)
        return

    if "--template" in sys.argv:
        max_intros = 3
        new_entries = None
        if "--max-introductions" in sys.argv:
            max_intros = sys.argv[sys.argv.index("--max-introductions") + 1]
        if "--new-entries-file" in sys.argv:
            with open(sys.argv[sys.argv.index("--new-entries-file") + 1]) as f:
                new_entries = f.read().strip()
        print(fill_template(entry_name, edges, neighbors, max_intros, new_entries))
    else:
        print(f"HOME: {entry_name}")
        print(f"MAP: {map_file}")
        print(f"EDGES ({len(edges)}):")
        print(format_edges(edges))
        print(f"\nNEIGHBORS ({len(neighbors)}): {', '.join(neighbors)}")

if __name__ == "__main__":
    main()
