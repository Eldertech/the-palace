#!/usr/bin/env python3
"""
build-preloaded-prompt.py — Gemma Mode 2 worker prompt builder

Coordinator reads all files and embeds content directly into the prompt.
No tool calls required from the model (pre-loaded architecture).

Usage:
    python3 _ops/swarm/build-preloaded-prompt.py "Entry Name" [max_intros]

    max_intros defaults to 3. Use 9 for entries born after the last Weave.

Then pipe to Ollama:
    python3 _ops/swarm/build-preloaded-prompt.py "Entry Name" | \\
      curl -s http://localhost:11434/api/generate \\
        -H "Content-Type: application/json" \\
        -d "$(python3 -c \"import json,sys; print(json.dumps({'model': 'gemma4:26b', 'stream': False, 'prompt': sys.stdin.read()}))\") " \\
      | python3 -c "import json,sys; print(json.load(sys.stdin).get('response',''))"

Validated: 2026-04-08 against SCHEMA and Endosymbiosis entries.
Model: gemma4:26b (Q4_K_M, ~17GB, requires 32GB+ unified memory).
"""

import sys
import os
import glob
import re

PALACE = "/Users/loudonstearns/Documents/The Palace"
ENTRY = sys.argv[1] if len(sys.argv) > 1 else None
MAX_INTROS = sys.argv[2] if len(sys.argv) > 2 else "3"

if not ENTRY:
    print("Usage: python3 build-preloaded-prompt.py \"Entry Name\" [max_intros]", file=sys.stderr)
    sys.exit(1)


def find_file(title):
    for p in glob.glob(os.path.join(PALACE, "**", "*.md"), recursive=True):
        if any(x in p for x in ['.git/', '.claude/', '.obsidian/']):
            continue
        if os.path.splitext(os.path.basename(p))[0].lower() == title.lower():
            return p
    return None


def read_file(path, max_chars=5000):
    try:
        with open(path) as f:
            c = f.read()
        return c[:max_chars] + "\n[TRUNCATED]" if len(c) > max_chars else c
    except Exception:
        return "[COULD NOT READ]"


def all_titles():
    titles = []
    for p in glob.glob(os.path.join(PALACE, "**", "*.md"), recursive=True):
        if any(x in p for x in ['.git/', '.claude/', '.obsidian/']):
            continue
        titles.append(os.path.splitext(os.path.basename(p))[0])
    return sorted(titles)


home_path = find_file(ENTRY)
if not home_path:
    print(f"ERROR: could not find entry '{ENTRY}'", file=sys.stderr)
    sys.exit(1)

home_content = read_file(home_path)

neighbor_titles = list(dict.fromkeys(re.findall(r'\[\[([^\]]+)\]\]', home_content[:2000])))[:6]
neighbor_sections = []
for title in neighbor_titles:
    path = find_file(title)
    if path:
        with open(path) as f:
            lines = f.readlines()[:40]
        neighbor_sections.append(f"### {title}\n{''.join(lines)}")

titles = all_titles()

print(f"""You are a Palace Single-Doc Worker auditing one knowledge graph entry's structural health.

## PALACE CONTEXT
The Palace is a web of interconnected markdown files. Every entry has typed YAML frontmatter links. The Four Pillars — Creation, Tools, Philosophy, Practice — tag everything.

## LINK TYPES (use only these exact values in ALL type fields)
connects-to, mirrors, enables, deepens, spawned, emerged-from, contradicts, couples-with

## STAGE VALUES (use only these exact values)
seed, sprout, growing, mature, fruiting, dormant, composting

Stage reflects content maturity and connection density — NOT the entry's structural role or importance. Guidance:
- seed: stub, minimal content, few or no links
- sprout: body taking shape, 1-3 links
- growing: substantive body, several links, actively developing
- mature: well-developed body, dense links, stable
- fruiting: generating new entries or connections, actively spawning
- dormant: no recent activation, disconnected from current work
- composting: marked for absorption or deletion
An entry can be architecturally foundational AND stage:mature. "Foundational" describes role, not stage.

## LABEL CONVENTION
A label is a single evocative word or short hyphenated phrase naming the specific register of a relationship. It is NOT the entry name and NOT the link type. Good labels: "biological-foundation", "merger-as-threshold", "distributed-routing", "oblique-access", "stigmergic-memory", "ontological-substrate", "mathematical-resonance". Labels add nuance beyond the type — use them when the body already names the relationship more specifically than the type alone does.

## HOME ENTRY: {ENTRY}
---
{home_content}
---

## KEY NEIGHBORS (frontmatter only)
{chr(10).join(neighbor_sections)}

## ALL PALACE ENTRY TITLES (exact strings — use for unsung path matching only)
{chr(10).join(titles)}

## YOUR TASKS

**TASK 1 — UNSUNG PATHS (narrow definition):**
Scan the HOME ENTRY body text above for two things:
(a) Any title from "ALL PALACE ENTRY TITLES" that appears as plain text in the body WITHOUT [[wikilink]] brackets AND without a corresponding YAML frontmatter link.
(b) Any [[wikilink]] in the body that has no matching YAML frontmatter link.
For each find, `proposed_type` must be a LINK TYPE from the list above (e.g. "mirrors", "deepens") — NOT an entry type like "concept" or "hub".
Do NOT report titles that already have YAML frontmatter links. Do NOT invent entries not in the titles list.

**TASK 2 — MISSING CONNECTIONS:**
Propose up to {MAX_INTROS} new typed links to entries from the titles list NOT already mentioned in the body. For each, `proposed_label` must be an evocative word (see LABEL CONVENTION above) — not the entry name, not the link type.

**TASK 3 — LINK TYPE UPGRADES:**
Identify existing YAML links whose type could be more semantically precise. For each, `proposed_label` must follow LABEL CONVENTION.

**TASK 4 — STAGE ASSESSMENT:**
Is the current stage correct? Use only canonical stage values. Remember: stage = content maturity, not structural importance.

**TASK 5 — BODY HEALTH:**
Word count estimate, has_origin_section, has_cross_pillar, has_forward_vectors, thin_spots.

**TASK 6 — FORWARD VECTOR:**
Is a `forward_vector` field present in the YAML? Rate specificity: high, medium, low, or none.

## OUTPUT
Return ONLY valid JSON with no code fences and no prose before or after:
{{
  "home": "{ENTRY}",
  "stage_assessment": {{"current_stage": "...", "recommended_stage": "...", "rationale": "..."}},
  "forward_vector_quality": {{"has_forward_vectors": true/false, "specificity": "high/medium/low/none", "notes": "..."}},
  "unsung_paths": [{{"mentioned_in_body": "exact phrase from body", "has_typed_link": false, "proposed_type": "link-type-here", "proposed_label": "evocative-label"}}],
  "missing_connections": [{{"target": "exact title from titles list", "proposed_type": "link-type-here", "proposed_label": "evocative-label", "rationale": "one sentence"}}],
  "link_type_upgrades": [{{"current": {{"target": "...", "type": "..."}}, "proposed_type": "link-type-here", "proposed_label": "evocative-label", "rationale": "one sentence"}}],
  "body_health": {{"word_count_estimate": 0, "has_origin_section": true/false, "has_cross_pillar": true/false, "has_forward_vectors": true/false, "thin_spots": ["..."]}},
  "summary": "One paragraph synthesis."
}}""")
