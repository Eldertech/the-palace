#!/usr/bin/env python3
"""lint-weave-flags.py — the mechanical check for Weave postcondition 2b.

Reads the persistent blackboard, finds `weave_flag` BROADCASTs on the WEAVE
board, and reports which are still OPEN — not yet addressed by a commit that
touched one of the flag's `source_entries` (the entry-touch auto-close), and not
acknowledged/declined by flag-id in a commit body. Mirrors the git-touch
resolution logic of `_ops/stigmergy/list-handoffs.mjs`.

Why this exists: postcondition 2b ("the weave_flag inbox has been read and every
open flag acted on or explicitly declined") was honour-system — the sibling
postconditions 2d/2e/2f each have a linter that gates the commit, but 2b did not,
so a Weave launched by a side door (e.g. a baton whose move-list omits Step 1c)
could silently skip it. This makes 2b mechanical, so it can no longer be missed
regardless of how the Weave was launched. (The Palace Hardens Around Values: a
rule earns a gate once its check proves mechanical — and this one is.)

Exit 1 if any OPEN flags remain; run it in the Step 6.5 closing-linter block.
Read-only — it never resolves a flag; the Weave does that by touching the entry
or recording a decline in the commit body.
"""
import json
import subprocess
import sys
from pathlib import Path

PALACE = Path(__file__).resolve().parent.parent.parent
BOARD = PALACE / "_ops" / "swarm" / "persistent" / "blackboard.jsonl"


def git(args):
    try:
        return subprocess.check_output(["git", "-C", str(PALACE)] + args,
                                       text=True, stderr=subprocess.DEVNULL).strip()
    except Exception:
        return ""


def basename(t):
    t = str(t).split("|")[0].split("#")[0].strip().strip("[]")
    if t.endswith(".md"):
        t = t[:-3]
    if "/" in t:
        t = t.split("/")[-1]
    return t.strip()


def main():
    if not BOARD.exists():
        print("no persistent board found — nothing to check.")
        return 0

    # Collect weave_flag BROADCASTs (latest object per id wins).
    flags = {}
    for line in BOARD.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or '"weave_flag"' not in line:
            continue
        try:
            m = json.loads(line)
        except Exception:
            continue
        p = m.get("payload", {})
        if p.get("kind") != "weave_flag":
            continue
        flags[m.get("id", "")] = {"ts": m.get("ts", ""), "from": m.get("from", ""), "p": p}

    # All commit bodies once, for flag-id acknowledgment/decline detection.
    all_bodies = git(["log", "--format=%B"])

    open_flags, addressed, acked = [], [], []
    for fid, f in flags.items():
        p = f["p"]
        ts = f["ts"]
        entries = [basename(e) for e in (p.get("source_entries") or [])]
        if p.get("target_entry"):
            entries.append(basename(p["target_entry"]))
        touched = False
        for e in entries:
            if not e:
                continue
            # any commit AFTER the flag's ts touching a file matching the entry name
            if ts and git(["log", "--since", ts, "-1", "--format=%h", "--", f"*{e}*.md"]):
                touched = True
                break
        if touched:
            addressed.append((fid, p))
        elif fid and fid in all_bodies:
            acked.append((fid, p))
        else:
            open_flags.append((fid, f))

    print(f"weave-flags: {len(flags)} on WEAVE board | "
          f"{len(addressed)} addressed (entry touched since) | "
          f"{len(acked)} acknowledged in a commit | {len(open_flags)} OPEN")
    if open_flags:
        print("\nOPEN weave_flags — address (touch a source_entry) or explicitly decline in the Weave commit body:")
        for fid, f in sorted(open_flags, key=lambda x: x[1]["ts"]):
            p = f["p"]
            print(f"  ● {fid}  [{f['ts'][:10]} · {f['from']}]  type={p.get('flag_type')}")
            src = ", ".join(p.get("source_entries") or []) or "—"
            print(f"      source: {src}")
            act = (p.get("proposed_action") or "").replace("\n", " ")
            print(f"      → {act[:120]}")
    print(f"\nsummary: {len(open_flags)} open")
    return 1 if open_flags else 0


if __name__ == "__main__":
    sys.exit(main())
