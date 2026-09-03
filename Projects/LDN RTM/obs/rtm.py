#!/usr/bin/env python3
"""rtm — the recording-day driver for LDN RTM.

The title card reads title.txt / subtitle.txt off disk, so advancing a video means
writing two small files, never touching OBS. State lives in .rtm-state.json beside
this script, so the position survives quitting everything.

  python3 rtm.py setup            size + place the Live window, exactly
  python3 rtm.py show             what's queued right now
  python3 rtm.py next             advance to the next section, write the card
  python3 rtm.py goto 29.3        jump to a section by its manual number
  python3 rtm.py done             mark current recorded, advance
  python3 rtm.py remaining        how much of the manual is left

Run from anywhere; paths resolve relative to this file.
"""
import json
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
CHECKLIST = HERE.parent / "LDN RTM — Live 12 checklist.tsv"
STATE = HERE / ".rtm-state.json"
TITLE, SUBTITLE = HERE / "title.txt", HERE / "subtitle.txt"

SERIES = "LDN RTM · Live 12"
WINDOW = (0, 38, 1920, 1080)          # measured 2026-09-02; see the series entry
ZOOM_NOTE = "Live display zoom must be 150% — Cmd , → Display & Input"


def rows():
    """In-scope sections, manual order. Level 1 = a top-level section."""
    out = []
    with open(CHECKLIST, encoding="utf-8") as f:
        header = f.readline().rstrip("\n").split("\t")
        for line in f:
            parts = line.rstrip("\n").split("\t")
            if len(parts) != len(header):
                continue
            r = dict(zip(header, parts))
            if r["level"] == "1":
                out.append(r)
    return out


def state():
    if STATE.exists():
        return json.loads(STATE.read_text())
    return {"index": 0, "recorded": []}


def save(s):
    STATE.write_text(json.dumps(s, indent=2))


def write_card(r):
    TITLE.write_text(f"{r['num']}  {r['title']}")
    SUBTITLE.write_text(SERIES)


def describe(r, s):
    mark = "recorded" if r["num"] in s["recorded"] else "not yet"
    return (f"{r['num']}  {r['title']}\n"
            f"    manual p.{r['pdf_page']} (~{r['pages']} pp)   ch.{r['chapter']}   [{mark}]")


def cmd_setup(_):
    x, y, w, h = WINDOW
    script = (f'tell application "Live" to activate\n'
              f'delay 0.5\n'
              f'tell application "System Events" to tell process "Live" to tell window 1 '
              f'to set {{position, size}} to {{{{{x}, {y}}}, {{{w}, {h}}}}}\n'
              f'delay 0.3\n'
              f'tell application "System Events" to tell process "Live" to get size of window 1')
    try:
        got = subprocess.run(["osascript", "-e", script], capture_output=True,
                             text=True, timeout=15)
    except Exception as e:
        print(f"could not run osascript: {e}")
        return 1
    if got.returncode != 0:
        print(got.stderr.strip())
        print("\nIf this says 'not allowed assistive access', grant Accessibility to the")
        print("app running this (System Settings → Privacy & Security → Accessibility),")
        print("then restart it.")
        return 1
    size = got.stdout.strip()
    ok = size.replace(" ", "") == f"{w},{h}"
    print(f"Live window: {size}  {'OK' if ok else '<-- NOT the expected ' + f'{w}, {h}'}")
    print(ZOOM_NOTE)
    return 0 if ok else 1


def cmd_show(_):
    s, rs = state(), rows()
    if s["index"] >= len(rs):
        print("series complete — every in-scope section is behind you.")
        return 0
    print(describe(rs[s["index"]], s))
    if s["index"] + 1 < len(rs):
        print(f"    next: {rs[s['index']+1]['num']}  {rs[s['index']+1]['title']}")
    return 0


def cmd_next(_):
    s, rs = state(), rows()
    s["index"] = min(s["index"] + 1, len(rs) - 1)
    save(s)
    write_card(rs[s["index"]])
    print(describe(rs[s["index"]], s))
    return 0


def cmd_goto(args):
    if not args:
        print("goto needs a section number, e.g. goto 29.3")
        return 1
    s, rs = state(), rows()
    for i, r in enumerate(rs):
        if r["num"] == args[0]:
            s["index"] = i
            save(s)
            write_card(r)
            print(describe(r, s))
            return 0
    print(f"no section {args[0]} in scope")
    return 1


def cmd_done(_):
    s, rs = state(), rows()
    cur = rs[s["index"]]
    if cur["num"] not in s["recorded"]:
        s["recorded"].append(cur["num"])
    print(f"recorded: {cur['num']}  {cur['title']}")
    s["index"] = min(s["index"] + 1, len(rs) - 1)
    save(s)
    write_card(rs[s["index"]])
    print(f"    up next: {rs[s['index']]['num']}  {rs[s['index']]['title']}")
    return 0


def cmd_remaining(_):
    s, rs = state(), rows()
    n = len(s["recorded"])
    print(f"{n} of {len(rs)} in-scope sections recorded ({n * 100 // max(len(rs),1)}%)")
    left = {}
    for r in rs:
        if r["num"] not in s["recorded"]:
            left[r["chapter"]] = left.get(r["chapter"], 0) + 1
    print("open by chapter: " + "  ".join(f"ch{c}:{k}" for c, k in sorted(left.items(), key=lambda x: int(x[0]))))
    return 0


COMMANDS = {"setup": cmd_setup, "show": cmd_show, "next": cmd_next,
            "goto": cmd_goto, "done": cmd_done, "remaining": cmd_remaining}

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "show"
    if cmd not in COMMANDS:
        print(__doc__)
        sys.exit(1)
    sys.exit(COMMANDS[cmd](sys.argv[2:]))
