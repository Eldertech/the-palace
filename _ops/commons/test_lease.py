#!/usr/bin/env python3
"""Phase 4 gate — the advisory lease on the validated board bridge.

All writes go to a TEMP board (COMMONS_BOARD_PATH) — never the real persistent board.
Proves: every lease mark passes the canonical validator; holder reconstruction from
the append-only board; foreign-holder detection; strict abort; the 2h freshness gate;
the enforcement seam; default-OFF writes nothing. Exit 0 = pass.
"""
import os
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from commons import board, lease                              # noqa: E402

checks = []


def check(desc, cond):
    checks.append((desc, cond))
    print(("  PASS " if cond else "  FAIL ") + desc)


def set_slug(s):
    os.environ["COMMONS_AGENT_SLUG"] = s


def main():
    with tempfile.TemporaryDirectory() as td:
        os.environ["COMMONS_BOARD_PATH"] = str(Path(td) / "board.jsonl")
        os.environ["COMMONS_LEASE"] = "1"
        L = lease.GpuAccountLease()
        KEY = "test-account"

        # every mark is validator-clean (the whole point of moving off the hand-rolled envelope)
        set_slug("agent-a")
        check("lease mark passes the canonical validator", board.validate(L._mark("acquire", KEY)).get("ok") is True)
        check("posting a lease mark is accepted (fail-loud)", board.post(L._mark("acquire", KEY), silent=False).get("ok") is True)

        # A acquires → A is a holder
        la = L.acquire(KEY)
        check("A holds after acquire", any(h.holder_slug == "agent-a" for h in L.holders(KEY)))

        # B sees A as a foreign holder
        set_slug("agent-b")
        foreign = [h.holder_slug for h in L.holders(KEY) if h.holder_slug != "agent-b"]
        check("B sees A's foreign lease", foreign == ["agent-a"])

        # advisory: B proceeds despite the foreign holder; both now hold
        L.acquire(KEY)
        check("both A and B hold (advisory, not a hard mutex)",
              {h.holder_slug for h in L.holders(KEY)} == {"agent-a", "agent-b"})

        # A releases → only B holds
        set_slug("agent-a"); L.release(la)
        check("after A releases, only B holds", {h.holder_slug for h in L.holders(KEY)} == {"agent-b"})

        # strict: a foreign holder present → abort
        L.acquire(KEY)                          # A re-acquires
        set_slug("agent-b")
        raised = False
        try:
            L.acquire(KEY, strict=True)
        except SystemExit:
            raised = True
        check("strict acquire aborts on a foreign holder", raised)

        # freshness gate: an acquire older than FRESH_SECONDS is not a holder
        orig_fresh = lease.FRESH_SECONDS
        lease.FRESH_SECONDS = -1
        try:
            check("stale (past-TTL) acquires are ignored", L.holders(KEY) == [])
        finally:
            lease.FRESH_SECONDS = orig_fresh

        # enforcement seam: blocking/broker are declared-but-not-wired
        seam = False
        try:
            L.acquire(KEY, enforcement="blocking")
        except NotImplementedError:
            seam = True
        check("blocking enforcement is a documented, not-yet-wired seam", seam)

        # default OFF: no board writes when disabled
        del os.environ["COMMONS_LEASE"]
        n_before = len(board.read())
        L.acquire(KEY)
        check("disabled lease writes nothing to the board", len(board.read()) == n_before)

    ok = all(c for _, c in checks)
    print(f"\n{'ALL PASS' if ok else 'FAILURES PRESENT'} — {sum(c for _,c in checks)}/{len(checks)} checks")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
