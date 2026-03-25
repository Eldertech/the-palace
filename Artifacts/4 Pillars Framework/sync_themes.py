#!/usr/bin/env python3
"""
sync_themes.py — 4 Pillars Framework
=====================================
Syncs weekly_themes_database.json into theme_planner.html.

Run this from the terminal after editing the JSON:

    python3 sync_themes.py

The JSON is the source of truth. The HTML embeds a copy so it works
inside Obsidian's sandboxed HTML renderer (which blocks fetch calls).
"""

import json
import re
import sys
from pathlib import Path

folder = Path(__file__).parent
json_file = folder / "weekly_themes_database.json"
html_file = folder / "theme_planner.html"


def main():
    # --- Read and validate the JSON ---
    if not json_file.exists():
        sys.exit(f"ERROR: {json_file.name} not found in {folder}")

    with open(json_file, encoding="utf-8") as f:
        raw_json = f.read()

    try:
        json.loads(raw_json)  # validate
    except json.JSONDecodeError as e:
        sys.exit(f"ERROR: {json_file.name} is not valid JSON — {e}")

    # --- Inject into the HTML ---
    if not html_file.exists():
        sys.exit(f"ERROR: {html_file.name} not found in {folder}")

    html = html_file.read_text(encoding="utf-8")

    pattern = r'(<script type="application/json" id="themes-data">)(.*?)(</script>)'
    replacement = r'\1\n' + raw_json + r'\n    \3'
    new_html, count = re.subn(pattern, replacement, html, flags=re.DOTALL)

    if count == 0:
        sys.exit(
            "ERROR: themes-data block not found in theme_planner.html.\n"
            "Make sure the HTML contains: <script type=\"application/json\" id=\"themes-data\">"
        )

    html_file.write_text(new_html, encoding="utf-8")
    print(f"✓ Synced  {json_file.name}  →  {html_file.name}")

    # --- Summary ---
    data = json.loads(raw_json)
    fundamental = len(data.get("fundamental_themes", []))
    deep = len(data.get("deep_themes", []))
    print(f"  {fundamental} fundamental themes, {deep} deep themes ({fundamental + deep} total)")


if __name__ == "__main__":
    main()
