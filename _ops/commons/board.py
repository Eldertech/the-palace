"""Python speaks validated §9 — the STIGMERGY board bridge.

Any palace Python tool posts to / reads from the append-only blackboard through
here. Posting goes through the CANONICAL JS validator (`validateForPosting`) via a
short-lived `node` subprocess, single-sourced to the OWNER tree — so Python never
hand-rolls an envelope the STIGMERGY reader would reject (the exact bug in the old
gpu_lease.py). Reads are done directly in Python (no validation needed).

Owner-tree resolution (the multi-worktree spine): both the validator and the board
resolve through `git rev-parse --git-common-dir`, so a run from ANY linked worktree
targets the one canonical owner board — never a per-branch copy (SCHEMA §9's "one
write path").

Failure posture (two seams over one bridge):
  - `post(msg, silent=True)`  — fail-silent on infra (node missing, etc.); returns a
    result dict. For advisory/best-effort paths (the lease, render hooks).
  - `post(msg, silent=False)` / `validate(msg)` — fail-LOUD: raises on infra AND on a
    validation error (a validation error means we built a bad message — a bug). For
    safety-critical paths (the reaper must never post an invalid FLAG).
"""
import json
import os
import subprocess
from datetime import datetime
from pathlib import Path

from . import identity

HERE = Path(__file__).resolve().parent
BRIDGE = HERE / "board-post.mjs"
STEWARD_DEFAULT = "RunPod GPU Backend"   # the real palace steward page for GPU resources
STUB_DISPATCH = "claude-code"            # in the validator's stub-health exempt set


class BridgeError(RuntimeError):
    """Infrastructure failure talking to the node bridge (not a validation error)."""


class ValidationError(ValueError):
    """The message failed the canonical §9 validator (a programming bug)."""

    def __init__(self, errors):
        self.errors = errors
        super().__init__("; ".join(f"{e.get('path')}: {e.get('message')}" for e in (errors or [])))


# ── owner-tree resolution ────────────────────────────────────────────────────

def owner_root() -> Path:
    """The owner (main) worktree root, via git's common dir — CWD/worktree-independent."""
    out = subprocess.run(["git", "-C", str(HERE), "rev-parse", "--git-common-dir"],
                         capture_output=True, text=True, timeout=5).stdout.strip()
    if not out:
        raise BridgeError("could not resolve git --git-common-dir")
    gitdir = Path(out)
    if not gitdir.is_absolute():
        gitdir = (HERE / out).resolve()
    return gitdir.parent            # strip the trailing '.git'


def core_dir() -> Path:
    return owner_root() / "_ops" / "stigmergy" / "core"


def board_path(explicit: str | Path | None = None) -> Path:
    """Target board file. Priority: explicit arg → $COMMONS_BOARD_PATH (tests) →
    the owner's persistent blackboard (cross-session/agent coordination)."""
    if explicit:
        return Path(explicit)
    env = os.environ.get("COMMONS_BOARD_PATH")
    if env:
        return Path(env)
    return owner_root() / "_ops" / "swarm" / "persistent" / "blackboard.jsonl"


# ── message construction ─────────────────────────────────────────────────────

def make_message(type: str, board: str, payload: dict, *,
                 from_: str = STEWARD_DEFAULT, to: str = "*",
                 session_id: str | None = None, model: str | None = None,
                 request_id: str | None = None, re: str | None = None) -> dict:
    """Build a §9 envelope with a green stub-health block (Path-2 tooling; no API usage)."""
    slug = identity.agent_slug()
    # a monotonic-ish unique id without Date.now flakiness concerns (this is a normal script)
    stamp = datetime.now().astimezone()
    msg = {
        "schema_version": "1.0",
        "id": f"commons-{slug}-{int(stamp.timestamp() * 1000)}",
        "ts": stamp.isoformat(timespec="seconds"),
        "session_id": session_id or f"commons-{slug}",
        "from": from_,
        "to": to,
        "type": type,
        "board": board,
        "health": {
            "score": "green",
            "model": model or os.environ.get("COMMONS_MODEL", STUB_DISPATCH),
            "_orchestrator_metadata": {"dispatch_mode": STUB_DISPATCH,
                                       "note": "commons board bridge (path-2 tooling)"},
        },
        "payload": payload,
    }
    if request_id is not None:
        msg["request_id"] = request_id
    if re is not None:
        msg["re"] = re
    return msg


# ── the bridge calls ─────────────────────────────────────────────────────────

def _run_bridge(msg: dict, mode: str, board_file: Path | None = None) -> dict:
    args = ["node", str(BRIDGE), "--core-dir", str(core_dir())]
    if mode == "--post":
        args += ["--board-path", str(board_path(board_file))]
    args.append(mode)
    try:
        proc = subprocess.run(args, input=json.dumps(msg), capture_output=True, text=True, timeout=20)
    except FileNotFoundError as e:
        raise BridgeError(f"node not found: {e}")
    except subprocess.TimeoutExpired as e:
        raise BridgeError(f"board bridge timed out: {e}")
    if proc.returncode != 0:
        raise BridgeError(f"board bridge infra failure (exit {proc.returncode}): {proc.stderr.strip()[:300]}")
    line = (proc.stdout.strip().splitlines() or [""])[-1]
    try:
        return json.loads(line)
    except Exception:
        raise BridgeError(f"board bridge bad output: stdout={proc.stdout[:200]!r} stderr={proc.stderr[:200]!r}")


def validate(msg: dict) -> dict:
    """Validate a message against the canonical validator without writing. Raises
    BridgeError on infra failure; returns the bridge result ({ok, errors?})."""
    return _run_bridge(msg, "--validate-only")


def post(msg: dict, *, silent: bool = True, board_file: Path | None = None) -> dict:
    """Post a validated message to the board.

    silent=True  → swallow infra failure (returns {ok:False,reason:...}); best-effort.
    silent=False → raise BridgeError on infra failure and ValidationError on a bad message.
    A validation failure is always surfaced in the returned dict; with silent=False it raises.
    """
    try:
        res = _run_bridge(msg, "--post", board_file)
    except BridgeError:
        if silent:
            return {"ok": False, "reason": "infra"}
        raise
    if not res.get("ok") and not silent:
        raise ValidationError(res.get("errors"))
    return res


# ── reads (direct, no node) ──────────────────────────────────────────────────

def read(predicate=None, board_file: Path | None = None) -> list[dict]:
    """Read the board as parsed messages, optionally filtered by predicate(msg)->bool.
    Skips malformed lines rather than raising (a reader must tolerate a half-written tail)."""
    p = board_path(board_file)
    if not p.exists():
        return []
    out = []
    for line in p.read_text().splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            m = json.loads(line)
        except Exception:
            continue
        if predicate is None or predicate(m):
            out.append(m)
    return out
