#!/usr/bin/env python3
"""Phase 1 gate — the board bridge (Python speaks validated §9).

Proves: owner-tree resolution (multi-worktree spine); a valid message round-trips
through the CANONICAL validator + appender; a §9-invalid message is REJECTED (not
silently written); and infra failure (bad core) surfaces as an error, never as
silent success. All writes go to a TEMP board — the real persistent board is never
touched. Exit 0 = pass.
"""
import sys, tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))   # put _ops on sys.path
from commons import board   # noqa: E402

checks = []


def check(desc, cond):
    checks.append((desc, cond))
    print(("  PASS " if cond else "  FAIL ") + desc)


def main():
    # ── owner-tree resolution (the multi-worktree spine) ──
    root = board.owner_root()
    check(f"owner_root resolves to a real dir ({root.name!r})", root.is_dir())
    check("owner core has the canonical validator", (board.core_dir() / "schema" / "posting.js").exists())
    default_board = board.board_path()
    check("default board is the owner persistent blackboard",
          str(default_board).endswith("_ops/swarm/persistent/blackboard.jsonl"))
    check("owner board lives under owner_root (not this worktree)", str(default_board).startswith(str(root)))

    with tempfile.TemporaryDirectory() as td:
        tmp = Path(td) / "blackboard.jsonl"

        # ── valid message round-trips ──
        msg = board.make_message("BROADCAST", "GENERAL", {"kind": "commons_selftest", "headline": "hello"})
        res = board.post(msg, silent=False, board_file=tmp)
        check("valid BROADCAST posts ok", res.get("ok") is True)
        back = board.read(board_file=tmp)
        check("posted message reads back by id", any(m.get("id") == msg["id"] for m in back))

        # ── §9-invalid message is rejected, not written ──
        bad = board.make_message("RESOURCE_REQUEST", "TRICKSTER", {"resource": "x"}, to="TRICKSTER")
        vres = board.validate(bad)
        check("RESOURCE_REQUEST w/o request_id is REJECTED by validator",
              vres.get("ok") is False and any("request_id" in e.get("path", "") for e in vres.get("errors", [])))
        raised = False
        try:
            board.post(bad, silent=False, board_file=tmp)
        except board.ValidationError:
            raised = True
        check("post(silent=False) RAISES on an invalid message", raised)
        check("the invalid message was NOT written (only the 1 good one)", len(board.read(board_file=tmp)) == 1)

        # ── a valid RESOURCE_REQUEST WITH request_id passes ──
        good_rr = board.make_message("RESOURCE_REQUEST", "TRICKSTER", {"resource": "gpu_account"},
                                     to="TRICKSTER", request_id="req-selftest-1")
        check("RESOURCE_REQUEST with request_id validates", board.validate(good_rr).get("ok") is True)

        # ── payload cap keeps writes atomic ──
        big = board.make_message("BROADCAST", "GENERAL", {"blob": "x" * 3000})
        bigres = board.validate(big)
        check("oversized payload is rejected by the atomic-append cap",
              bigres.get("ok") is False and any("payload" in e.get("path", "") for e in bigres.get("errors", [])))

    # ── infra failure surfaces, never silent success ──
    orig = board.core_dir
    board.core_dir = lambda: Path("/nonexistent/commons/core")
    try:
        raised = False
        try:
            board.post(board.make_message("BROADCAST", "GENERAL", {"k": 1}), silent=False, board_file=Path("/tmp/never.jsonl"))
        except board.BridgeError:
            raised = True
        check("infra failure (bad core) RAISES under silent=False", raised)
        sres = board.post(board.make_message("BROADCAST", "GENERAL", {"k": 1}), silent=True, board_file=Path("/tmp/never.jsonl"))
        check("infra failure is swallowed under silent=True (best-effort)", sres.get("ok") is False)
    finally:
        board.core_dir = orig

    ok = all(c for _, c in checks)
    print(f"\n{'ALL PASS' if ok else 'FAILURES PRESENT'} — {sum(c for _, c in checks)}/{len(checks)} checks")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
