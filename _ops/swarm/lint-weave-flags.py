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

Resolution follows the board's own rule (`queue-model.js` reconcileQueue), so the
linter and the STIGMERGY board tell one truth:
  - explicit: a commit carries `Palace-Resolves: <id>`, or names the flag id in its body
    (a `Declined flag <id>: <reason>` line, or an older acknowledgment); or
  - touched: a commit AFTER the flag touched a file named exactly `<source_entry>.md`.
    Exact name, source entries only. (Until 2026-09-23 this linter also counted the
    target entry and matched `*<entry>*.md`, so a touch to `X — scroll.md` or
    `X — gotchas.md` "closed" a flag on X — flags went invisible without being done.)
A touch is reported as TOUCHED-UNVERIFIED: the contract accepts it (Weave Ceremony
Step 1c, Closing Well gotcha 19), but entry files are high-traffic, so the Weave reads
each one by hand. `--strict` previews a trailer-only rule (touches count as open);
it is not the contract unless Loudon changes Step 1c, and then reconcileQueue changes too.
`--board PATH` reads another board file — from a worktree, pass main's live
`_ops/swarm/persistent/blackboard.jsonl` (the worktree's copy is only what was committed).

Older flags carry `target` + `note` instead of `source_entries` + `proposed_action`.
The board can't touch-close those (it watches source_entries only), so neither does
this linter: they close by trailer or decline. They are displayed with their real ask.

Exit 1 if any OPEN flags remain; run it in the Step 6.5 closing-linter block.
Read-only — it never resolves a flag; the Weave does that by acting and recording it.
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


def parse_ts(t):
    from datetime import datetime
    try:
        return datetime.fromisoformat(str(t).replace("Z", "+00:00")).timestamp()
    except Exception:
        return None


def commit_log(since_ts):
    """[(epoch, body, {basenames of touched .md files})] for commits since the oldest flag."""
    out = git(["-c", "core.quotePath=false", "log", f"--since={since_ts}",
               "--format=\x1e%cI\x1f%B\x1f", "--name-only"])
    commits = []
    for chunk in out.split("\x1e"):
        if not chunk.strip():
            continue
        date, _, rest = chunk.partition("\x1f")
        body, _, files = rest.partition("\x1f")
        names = {Path(f.strip()).stem for f in files.splitlines() if f.strip().endswith(".md")}
        commits.append((parse_ts(date.strip()), body, names))
    return commits


def main():
    global BOARD
    strict = "--strict" in sys.argv
    if "--board" in sys.argv:   # a worktree carries its own committed board; point at main's live one
        BOARD = Path(sys.argv[sys.argv.index("--board") + 1])
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

    stamps = [parse_ts(f["ts"]) for f in flags.values() if parse_ts(f["ts"])]
    oldest = min(stamps) if stamps else 0
    from datetime import datetime, timezone
    commits = commit_log(datetime.fromtimestamp(oldest, timezone.utc).isoformat()) if stamps else []
    all_bodies = git(["log", "--format=%B"])   # explicit ids may predate the oldest flag's clock

    open_flags, touched, explicit = [], [], []
    for fid, f in flags.items():
        p = f["p"]
        if fid and fid in all_bodies:
            explicit.append((fid, f))
            continue
        ft = parse_ts(f["ts"])
        sources = {basename(e) for e in (p.get("source_entries") or []) if basename(e)}
        hit = None
        if ft is not None and sources:
            hit = next((c for c in commits if c[0] is not None and c[0] > ft and sources & c[2]), None)
        if hit and not strict:
            touched.append((fid, f))
        else:
            open_flags.append((fid, f))

    def ask(p):
        act = p.get("proposed_action") or p.get("note") or ""
        return act.replace("\n", " ")

    def where(p):
        src = ", ".join(p.get("source_entries") or [])
        if src:
            return f"source: {src}"
        return f"target: {p.get('target') or p.get('target_entry') or '—'}  (older flag shape — closes by trailer/decline only)"

    print(f"weave-flags: {len(flags)} on WEAVE board | {len(explicit)} resolved explicitly (trailer/decline/ack) | "
          f"{len(touched)} TOUCHED-UNVERIFIED | {len(open_flags)} OPEN" + ("  [--strict: touches counted open]" if strict else ""))
    if touched:
        print("\nTOUCHED-UNVERIFIED — a commit touched a source entry after the flag; read each by hand:")
        for fid, f in sorted(touched, key=lambda x: x[1]["ts"]):
            print(f"  ◐ {fid}  [{f['ts'][:10]} · {f['from']}]  {where(f['p'])}")
            print(f"      → {ask(f['p'])[:140]}")
    if open_flags:
        print("\nOPEN weave_flags — act (and carry Palace-Resolves: <id>) or decline in the Weave commit body:")
        for fid, f in sorted(open_flags, key=lambda x: x[1]["ts"]):
            print(f"  ● {fid}  [{f['ts'][:10]} · {f['from']}]  type={f['p'].get('flag_type')}")
            print(f"      {where(f['p'])}")
            print(f"      → {ask(f['p'])[:140]}")
    print(f"\nsummary: {len(open_flags)} open, {len(touched)} touched-unverified")
    return 1 if open_flags else 0


if __name__ == "__main__":
    sys.exit(main())
