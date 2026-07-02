"""Optional cooperative GPU lease over the STIGMERGY persistent board.

Namespacing (agent_ns.py) already stops two agents from *destroying* each other's
pods — each only ever sees its own. This module addresses the softer problem:
two agents both grabbing scarce GPU capacity at once. It leaves a stigmergic mark
on the shared board announcing "I'm about to use the one RunPod account", and
checks for another agent's un-released mark before booting.

DEFAULT OFF. It does nothing unless RUNPOD_LEASE=1 is set, so the core render path
never touches the board and never blocks. When enabled it is *advisory*:
  - it WARNS (and, under RUNPOD_LEASE_STRICT=1, ABORTS) if a foreign lease is live;
  - it is best-effort and fail-silent — a board it can't read or write never breaks
    a render;
  - it is a cooperative announce, not a hard mutex (a genuine two-agents-hit-at-once
    race can still slip past — TOCTOU). For true serialization, promote this to a
    human-brokered TRICKSTER RESOURCE_REQUEST with blocking:true and wait for the
    RESOURCE_GRANT (SCHEMA §9). This module is the lightweight floor under that.

Envelope mirrors a real steward RESOURCE_REQUEST (e.g. gsl-steward-040) so the
strict §2.2 validator and the STIGMERGY reader accept it.
"""
import json, os, subprocess, time
from datetime import datetime
from pathlib import Path

from agent_ns import SLUG

STEWARD = "RunPod GPU Backend"          # the real palace steward page for this resource
LEASE_KIND = "gpu_lease"
FRESH_SECONDS = 2 * 3600                 # a lease older than this is treated as stale/abandoned


def _enabled() -> bool:
    return bool(os.environ.get("RUNPOD_LEASE", "").strip())


def _strict() -> bool:
    return bool(os.environ.get("RUNPOD_LEASE_STRICT", "").strip())


def _board_path() -> Path | None:
    """The OWNER worktree's persistent board — the single write path (SCHEMA §9).
    Resolved via git's common dir so a run from any linked worktree still appends
    to the one canonical file rather than a per-branch copy."""
    try:
        here = os.path.dirname(os.path.abspath(__file__))
        common = subprocess.run(["git", "-C", here, "rev-parse", "--git-common-dir"],
                                capture_output=True, text=True, timeout=5).stdout.strip()
        if not common:
            return None
        common = Path(common).resolve()          # <owner>/.git
        board = common.parent / "_ops" / "swarm" / "persistent" / "blackboard.jsonl"
        return board if board.exists() else None
    except Exception:
        return None


def _now_iso() -> str:
    return datetime.now().astimezone().isoformat(timespec="seconds")


def _msg(mtype: str, board: str, payload: dict) -> dict:
    return {
        "schema_version": "1.0",
        "id": f"runpod-lease-{SLUG}-{int(time.time()*1000)}",
        "ts": _now_iso(),
        "session_id": f"runpod-{SLUG}",
        "from": STEWARD,
        "to": "TRICKSTER" if mtype == "RESOURCE_REQUEST" else "*",
        "type": mtype,
        "board": board,
        "health": {
            "score": "green",
            "model": "loudon-trickster",
            "_orchestrator_metadata": {"dispatch_mode": "path2-script",
                                       "note": "advisory GPU lease, not a steward cycle"},
        },
        "payload": payload,
    }


def _append(board: Path, msg: dict) -> None:
    with open(board, "a") as f:
        f.write(json.dumps(msg) + "\n")


def _foreign_active_lease(board: Path, pod_base: str):
    """Latest un-released, fresh gpu_lease from a DIFFERENT slug, or None."""
    acquired, released = {}, set()
    now = time.time()
    try:
        for line in board.read_text().splitlines():
            if LEASE_KIND not in line:
                continue
            try:
                m = json.loads(line)
            except Exception:
                continue
            p = m.get("payload", {})
            if p.get("kind") != LEASE_KIND:
                continue
            slug = p.get("slug")
            if not slug or slug == SLUG:
                continue
            action = p.get("action")
            if action == "release":
                released.add(slug)
            elif action == "acquire":
                try:
                    ts = datetime.fromisoformat(m["ts"]).timestamp()
                except Exception:
                    ts = now
                if now - ts <= FRESH_SECONDS:
                    acquired[slug] = (m.get("ts"), p.get("pod_base"))
                released.discard(slug)
    except Exception:
        return None
    for slug, (ts, base) in acquired.items():
        if slug not in released:
            return {"slug": slug, "ts": ts, "pod_base": base}
    return None


def acquire(pod_base: str) -> None:
    """Announce this agent is taking the GPU account; warn/abort on a foreign lease."""
    if not _enabled():
        return
    board = _board_path()
    if board is None:
        return
    foreign = _foreign_active_lease(board, pod_base)
    if foreign:
        note = (f"[lease] another agent holds the GPU account: slug={foreign['slug']} "
                f"pod_base={foreign['pod_base']} since {foreign['ts']}")
        if _strict():
            raise SystemExit(note + " — RUNPOD_LEASE_STRICT set, aborting. "
                             "Wait for its release or run with a different account.")
        print(note + " — proceeding anyway (set RUNPOD_LEASE_STRICT=1 to serialize).")
    try:
        _append(board, _msg("RESOURCE_REQUEST", "TRICKSTER", {
            "resource": "gpu_account",
            "kind": LEASE_KIND,
            "action": "acquire",
            "slug": SLUG,
            "pod_base": pod_base,
            "blocking": False,
            "headline": f"{STEWARD}: agent '{SLUG}' is taking the RunPod GPU account "
                        f"for pod '{pod_base}-{SLUG}'.",
            "ground": "advisory lease · namespacing already prevents pod collision · "
                      "this only flags capacity contention",
        }))
        print(f"[lease] acquired GPU lease as slug={SLUG}")
    except Exception:
        pass  # fail-silent: a lease write must never break a render


def release(pod_base: str) -> None:
    """Announce this agent is done with the GPU account."""
    if not _enabled():
        return
    board = _board_path()
    if board is None:
        return
    try:
        _append(board, _msg("BROADCAST", "GENERAL", {
            "resource": "gpu_account",
            "kind": LEASE_KIND,
            "action": "release",
            "slug": SLUG,
            "pod_base": pod_base,
            "headline": f"{STEWARD}: agent '{SLUG}' released the RunPod GPU account.",
            "ground": "advisory lease released",
        }))
        print(f"[lease] released GPU lease as slug={SLUG}")
    except Exception:
        pass
