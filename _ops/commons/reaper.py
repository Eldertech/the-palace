"""The reaper — cross-agent-SAFE cleanup of leaked resources.

An agent that pauses, stalls, or is hard-interrupted (its `finally` never runs) leaves
a resource billing with nothing watching it. The reaper is the backstop. The one thing
it must NEVER do is kill a LIVE agent's *booting* resource (that was the 2026-07-02
outage, re-introduced from the other direction). So a resource is reapable only if ALL
three gates hold:

  1. AGE      — older than GRACE (> worst-case boot+download). A booting pod is protected.
  2. LIVENESS — its owner has posted no liveness/lease mark within LIVENESS_TTL.
  3. POSTURE  — --self (my own slug, the safe default) or --cross-slug (opt-in).

Postures:
  --self (default)   reap only MY slug's stale leaks (from a prior crashed run of mine).
                     --force actually terminates; without it, report-only.
  --cross-slug       another agent's stale leaks. FLAG-for-review ONLY. Cross-slug
                     --force is DISABLED IN CODE (not just default-off) until liveness
                     heartbeat coverage is proven — see CROSS_SLUG_FORCE_ENABLED.

Report-only (the default when not --force) posts the candidate list as a FLAG to the
FLAGS board for a human/steward to confirm, and terminates nothing.

Self-reap spares the run's CURRENT pod: a resource whose id is in my pod-id handoff
file is my live keep-alive pod, never a leak.
"""
import time
from datetime import datetime

from . import board, identity
from . import providers as _providers

GRACE = 45 * 60            # 2700s — past worst-case model-download boot; a younger pod is protected
LIVENESS_TTL = 30 * 60     # 1800s — a live owner must have marked within this to protect its pods

# Cross-slug termination is disabled at the code level (not merely default-off) until
# every live agent reliably emits a liveness heartbeat. Until then, cross-slug is
# report-only no matter what flags are passed. Flip to True only with heartbeat coverage.
CROSS_SLUG_FORCE_ENABLED = False


# ── the three gates, as a pure, unit-testable predicate ──────────────────────

def is_reapable(resource, now: float, liveness: dict, grace: float = GRACE, ttl: float = LIVENESS_TTL) -> bool:
    if resource.owner_slug is None:
        return False                              # not Commons-managed → never touch
    if resource.created_ts is None:
        return False                              # unknown age → conservative, never reap
    if now - resource.created_ts <= grace:
        return False                              # too young (booting) → protected
    last = liveness.get(resource.owner_slug)
    if last is not None and now - last <= ttl:
        return False                              # owner is alive → protected
    return True


def find_candidates(resources, now, liveness, mode, my_slug, *,
                    grace=GRACE, ttl=LIVENESS_TTL, exclude_ids=()) -> list:
    out = []
    for r in resources:
        if not is_reapable(r, now, liveness, grace, ttl):
            continue
        if r.id in exclude_ids:
            continue                              # my current keep-alive pod
        if mode == "self" and r.owner_slug != my_slug:
            continue
        out.append(r)
    return out


# ── board-derived liveness ───────────────────────────────────────────────────

def owner_liveness(now: float | None = None) -> dict:
    """Latest liveness timestamp per owner slug, from provider heartbeats + lease acquires."""
    now = now or time.time()
    live: dict[str, float] = {}

    def pred(m):
        return m.get("payload", {}).get("kind") in ("commons_liveness", "commons_lease")

    for m in board.read(pred):
        p = m["payload"]
        slug = p.get("slug")
        if not slug:
            continue
        if p.get("kind") == "commons_lease" and p.get("action") != "acquire":
            continue
        try:
            ts = datetime.fromisoformat(m["ts"]).timestamp()
        except Exception:
            ts = now
        if slug not in live or ts > live[slug]:
            live[slug] = ts
    return live


def _my_current_pod_ids() -> set:
    """Pod ids this run knows it owns (from the handoff files), to spare keep-alive pods."""
    ids = set()
    try:
        f = identity.pod_id_file()
        if f.exists():
            ids.add(f.read_text().strip())
    except Exception:
        pass
    return ids


def _post_flag(candidates, mode):
    """Report-only: surface suspected leaks to the FLAGS board for review (never terminate)."""
    listed = [{"id": r.id, "name": r.name, "owner": r.owner_slug} for _, r in candidates[:20]]
    payload = {
        "kind": "commons_leak_candidates",
        "mode": mode,
        "count": len(candidates),
        "candidates": listed,
        "claim": f"{len(candidates)} suspected leaked resource(s) ({mode})",
        "headline": f"reaper: {len(candidates)} suspected leaked resource(s) [{mode}] — review before cleanup.",
    }
    try:
        board.post(board.make_message("FLAG", "FLAGS", payload, from_="RunPod GPU Backend"), silent=True)
    except Exception:
        pass


# ── the driver ───────────────────────────────────────────────────────────────

def reap(mode: str = "self", force: bool = False, *, grace: float = GRACE, ttl: float = LIVENESS_TTL,
         now: float | None = None, providers_iter=None, post_flag: bool = True) -> dict:
    """Find (and, for --self --force, terminate) leaked resources. Returns a summary dict."""
    now = now or time.time()
    my = identity.agent_slug()
    liveness = owner_liveness(now)
    exclude = _my_current_pod_ids()

    candidates = []
    for name, prov in (providers_iter if providers_iter is not None else _providers.instance_providers()):
        try:
            resources = prov.list_all()
        except Exception as e:
            print(f"[reaper] {name}: could not list ({type(e).__name__})")
            continue
        for r in find_candidates(resources, now, liveness, mode, my, grace=grace, ttl=ttl, exclude_ids=exclude):
            candidates.append((prov, r))

    # Safety: cross-slug --force is disabled in code.
    do_terminate = force and mode == "self"
    if mode == "cross-slug" and force and not CROSS_SLUG_FORCE_ENABLED:
        print("[reaper] cross-slug --force is DISABLED by design (heartbeat coverage not proven) — report-only.")

    terminated = []
    if do_terminate:
        for prov, r in candidates:
            if prov.terminate(r):
                terminated.append(r.id)
                print(f"[reaper] terminated leaked {r.id} ({r.name})")
    else:
        if post_flag and candidates:
            _post_flag(candidates, mode)
        for _, r in candidates:
            verb = "would terminate" if mode == "self" else "FLAGged for review"
            print(f"[reaper] CANDIDATE {r.id} ({r.name}) owner={r.owner_slug} — {verb}")

    return {"mode": mode, "terminated": terminated,
            "candidates": [r.id for _, r in candidates], "report_only": not do_terminate}
