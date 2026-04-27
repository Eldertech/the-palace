#!/usr/bin/env python3
"""
Apply forward_vector field to entries that don't yet have one.
Idempotent — skips entries that already have forward_vector in frontmatter.
"""
from __future__ import annotations
import json
import re
from pathlib import Path

PALACE = Path("/Users/loudonstearns/Documents/The Palace")
VECTORS = PALACE / "_ops" / "swarm" / "sessions" / "weave-2026-04-27-forward-vectors.json"
MAP = PALACE / "_ops" / "maps" / "palace-map-full-2026-04-27.json"

FRONTMATTER_RE = re.compile(r"^(---\n)(.*?)(\n---\n)", re.DOTALL)


def find_source_file(source_id: str, map_data: dict) -> Path | None:
    for n in map_data["nodes"]:
        if n["id"] == source_id:
            return PALACE / n["path"]
    cand = PALACE / "_ops" / f"{source_id}.md"
    if cand.exists():
        return cand
    return None


def has_forward_vector(fm_text: str) -> bool:
    return bool(re.search(r"^forward_vector:", fm_text, re.MULTILINE))


def insert_forward_vector(fm_text: str, vector: str) -> str:
    """Insert forward_vector field. Place before links: if it exists, else at end."""
    # Escape vector for YAML — use double-quoted string with escaped quotes
    escaped = vector.replace('\\', '\\\\').replace('"', '\\"')
    line = f'forward_vector: "{escaped}"'

    lines = fm_text.split("\n")
    # Find first occurrence of "links:" at start of line
    insert_at = None
    for i, ln in enumerate(lines):
        if re.match(r"^links:\s*$", ln):
            insert_at = i
            break
    if insert_at is None:
        # Append at end
        if lines and lines[-1] == "":
            lines.insert(len(lines) - 1, line)
        else:
            lines.append(line)
    else:
        lines.insert(insert_at, line)
    return "\n".join(lines)


def main():
    data = json.loads(VECTORS.read_text())
    map_data = json.loads(MAP.read_text())
    vectors = data["vectors"]

    applied = 0
    skipped_exists = 0
    skipped_no_file = 0
    skipped_no_fm = 0

    for entry_id, vector in vectors.items():
        path = find_source_file(entry_id, map_data)
        if not path:
            print(f"  ! NO FILE: {entry_id}")
            skipped_no_file += 1
            continue
        text = path.read_text(encoding="utf-8")
        m = FRONTMATTER_RE.match(text)
        if not m:
            print(f"  ! NO-FM: {entry_id}")
            skipped_no_fm += 1
            continue
        fm_text = m.group(2)
        if has_forward_vector(fm_text):
            skipped_exists += 1
            continue
        new_fm = insert_forward_vector(fm_text, vector)
        new_text = f"{m.group(1)}{new_fm}{m.group(3)}{text[m.end():]}"
        path.write_text(new_text, encoding="utf-8")
        applied += 1
        print(f"  + {entry_id}")

    print()
    print(f"Applied: {applied}")
    print(f"Skipped (already exists): {skipped_exists}")
    print(f"Skipped (no file): {skipped_no_file}")
    print(f"Skipped (no frontmatter): {skipped_no_fm}")


if __name__ == "__main__":
    main()
