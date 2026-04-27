#!/usr/bin/env python3
"""
Apply Tier B (unsung paths) and Tier C (worker introductions) link additions.
Reads weave-2026-04-27-additions.json and patches each source entry's frontmatter.

For each addition:
1. Find the source file (use map JSON as registry)
2. Read frontmatter
3. Append to links: array (preserving order)
4. Write back

Idempotent: skips additions that already exist (target+type match).
"""
from __future__ import annotations
import json
import re
import sys
from pathlib import Path

PALACE = Path("/Users/loudonstearns/Documents/The Palace")
ADDITIONS = PALACE / "_ops" / "swarm" / "sessions" / "weave-2026-04-27-additions.json"
MAP = PALACE / "_ops" / "maps" / "palace-map-full-2026-04-27.json"

FRONTMATTER_RE = re.compile(r"^(---\n)(.*?)(\n---\n)", re.DOTALL)


def find_source_file(source_id: str, map_data: dict) -> Path | None:
    for n in map_data["nodes"]:
        if n["id"] == source_id:
            return PALACE / n["path"]
    # Fall back to ops files
    for sub in [PALACE / "_ops"] + list((PALACE / "_ops").iterdir()):
        if sub.is_dir():
            cand = sub / f"{source_id}.md"
            if cand.exists():
                return cand
    cand = PALACE / "_ops" / f"{source_id}.md"
    if cand.exists():
        return cand
    return None


def link_already_exists(fm_text: str, target: str, link_type: str | None = None) -> bool:
    """Check if a link with this target (and optional type) already exists in frontmatter."""
    # Match target lines
    target_pattern = re.compile(
        rf'-\s*target:\s*"?\[\[{re.escape(target)}\]\]"?\s*\n(\s*type:\s*([a-z\-]+))?',
        re.MULTILINE
    )
    for m in target_pattern.finditer(fm_text):
        if link_type is None:
            return True
        existing_type = m.group(2)
        if existing_type and existing_type.strip() == link_type:
            return True
    return False


def append_link(fm_text: str, target: str, link_type: str, label: str | None) -> str:
    """Append a new link entry to the links: array in frontmatter."""
    label_line = f'    label: {label}\n' if label else ''
    new_block = (
        f'  - target: "[[{target}]]"\n'
        f'    type: {link_type}\n'
        f'{label_line}'
    )

    # Strategy: find "links:" line, then find the end of its array (last `- target:` block before next top-level key or end of fm)
    lines = fm_text.split("\n")
    out = []
    in_links = False
    inserted = False
    last_link_block_end = -1

    # Find the links: section bounds
    links_start = -1
    links_end = len(lines)
    for i, ln in enumerate(lines):
        if re.match(r"^links:\s*$", ln):
            links_start = i
            break
    if links_start == -1:
        # No links: section — add one at end
        if not fm_text.endswith("\n"):
            fm_text += "\n"
        return fm_text + f"links:\n{new_block.rstrip()}\n"

    # Find end of links section: first non-indented non-blank line after links_start, or end
    for i in range(links_start + 1, len(lines)):
        ln = lines[i]
        if ln == "":
            continue
        # New top-level key (not indented)
        if re.match(r"^[A-Za-z_][A-Za-z0-9_-]*:", ln):
            links_end = i
            break

    # Insert new block right before links_end
    new_lines = lines[:links_end] + new_block.rstrip("\n").split("\n") + lines[links_end:]
    return "\n".join(new_lines)


def patch_file(path: Path, target: str, link_type: str, label: str | None) -> tuple[bool, str]:
    """Returns (applied, reason). applied=False means skipped."""
    try:
        text = path.read_text(encoding="utf-8")
    except Exception as e:
        return False, f"read-error: {e}"

    m = FRONTMATTER_RE.match(text)
    if not m:
        return False, "no-frontmatter"

    fm_text = m.group(2)
    if link_already_exists(fm_text, target, link_type):
        return False, "already-exists"

    new_fm = append_link(fm_text, target, link_type, label)
    new_text = f"{m.group(1)}{new_fm}{m.group(3)}{text[m.end():]}"
    path.write_text(new_text, encoding="utf-8")
    return True, "applied"


def main():
    additions = json.loads(ADDITIONS.read_text())
    map_data = json.loads(MAP.read_text())

    all_to_apply = additions["tier_b_unsung_paths"] + additions["tier_c_worker_introductions"]

    applied = 0
    skipped_exists = 0
    skipped_no_file = 0
    skipped_no_fm = 0
    skipped_other = 0

    for add in all_to_apply:
        src = add["source"]
        path = find_source_file(src, map_data)
        if not path:
            print(f"  ! NO FILE: {src}")
            skipped_no_file += 1
            continue
        ok, reason = patch_file(path, add["target"], add["type"], add.get("label"))
        if ok:
            applied += 1
            label_str = f' [{add["label"]}]' if add.get("label") else ''
            print(f"  + {src} → {add['target']} ({add['type']}){label_str}")
        else:
            if reason == "already-exists":
                skipped_exists += 1
            elif reason == "no-frontmatter":
                skipped_no_fm += 1
                print(f"  ! NO-FM: {src}")
            else:
                skipped_other += 1
                print(f"  ! {reason}: {src}")

    print()
    print(f"Applied: {applied}")
    print(f"Skipped (already exists): {skipped_exists}")
    print(f"Skipped (no file): {skipped_no_file}")
    print(f"Skipped (no frontmatter): {skipped_no_fm}")
    print(f"Skipped (other): {skipped_other}")


if __name__ == "__main__":
    main()
