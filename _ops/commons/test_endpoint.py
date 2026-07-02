#!/usr/bin/env python3
"""Gate — the serverless endpoint worker WEDGE is fixed by reference counting.

The bug: three concurrent renderers, and the first to finish parks workersMax to 0 in
its finally, stalling the other two. The fix: workersMax tracks live holders on the
board, so it only reaches 0 when the LAST renderer leaves. Writes go to a TEMP board;
workersMax PATCHes are mocked (no RunPod). Exit 0 = pass.
"""
import os
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from commons import endpoint                                  # noqa: E402

checks = []
seq = []


def check(desc, cond):
    checks.append((desc, cond))
    print(("  PASS " if cond else "  FAIL ") + desc)


def set_slug(s):
    os.environ["COMMONS_AGENT_SLUG"] = s


def main():
    with tempfile.TemporaryDirectory() as td:
        os.environ["COMMONS_BOARD_PATH"] = str(Path(td) / "board.jsonl")

        def mock_set(n):
            seq.append((os.environ.get("COMMONS_AGENT_SLUG"), n))
            return n

        A = endpoint.EndpointWorkers("ep-test", "key")
        B = endpoint.EndpointWorkers("ep-test", "key")
        C = endpoint.EndpointWorkers("ep-test", "key")
        for ew in (A, B, C):
            ew._set_workers = mock_set

        # three renderers enter → workers ramp 1,2,3
        set_slug("a"); A.enter()
        set_slug("b"); B.enter()
        set_slug("c"); C.enter()
        check("workersMax ramps 1→2→3 as agents enter", [n for _, n in seq] == [1, 2, 3])
        set_slug("a"); check("board shows all 3 holders", set(A.holders()) == {"a", "b", "c"})

        seq.clear()
        # first to finish must NOT park to 0 (the wedge) — 2 others still hold
        set_slug("a"); A.exit()
        check("first exit sets workersMax=2 (NOT 0 — the wedge is gone)", seq[-1] == ("a", 2))
        set_slug("b"); B.exit()
        check("second exit sets workersMax=1", seq[-1] == ("b", 1))
        set_slug("c"); C.exit()
        check("LAST exit parks workersMax=0", seq[-1] == ("c", 0))
        check("full exit sequence is 2,1,0 (no premature park)", [n for _, n in seq] == [2, 1, 0])

        # baseline: a solo renderer parks to 0 on its own exit
        seq.clear()
        set_slug("solo"); A.enter(); A.exit()
        check("solo renderer: enter=1, exit=0", [n for _, n in seq] == [1, 0])

    ok = all(c for _, c in checks)
    print(f"\n{'ALL PASS' if ok else 'FAILURES PRESENT'} — {sum(c for _,c in checks)}/{len(checks)} checks")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
