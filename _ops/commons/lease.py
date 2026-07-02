"""Advisory capacity lease over the STIGMERGY board (Commons LeaseProvider).

Namespacing (identity + providers) already stops agents DESTROYING each other's
resources. This addresses the softer problem: two agents both grabbing scarce
capacity (the one GPU account) at once. An `acquire` leaves a stigmergic BROADCAST
mark on the board; before booting, an agent checks for another agent's fresh,
un-released mark on the same key.

ENFORCEMENT SEAM (advisory now; the interface won't change when the rest land):
  "advisory" — post a BROADCAST announce; warn on a foreign holder (or abort if
               strict). WIRED.
  "blocking" — (future) post a RESOURCE_REQUEST (top-level request_id) to TRICKSTER
               and poll for a RESOURCE_GRANT/DENY correlated by `re`. NOT wired.
  "broker"   — (future) an auto-granting daemon reads TRICKSTER and answers. NOT wired.

Default OFF: no board writes unless $COMMONS_LEASE (or legacy $RUNPOD_LEASE) is set,
so the core render path never touches the board. Fail-silent: a board it can't reach
never breaks a render. Advisory is cooperative, not a hard mutex (a true
two-agents-at-once race can still slip past — TOCTOU); the blocking seam is the
upgrade path when serialization is actually needed.

This replaces the old _ops/runpod/gpu_lease.py, whose hand-rolled envelope failed the
canonical §9 validator; every mark here goes through board.post (validated).
"""
import os
import time
from datetime import datetime

from . import board, identity
from .provider import Lease, LeaseProvider

LEASE_KIND = "commons_lease"
FRESH_SECONDS = 2 * 3600          # an acquire older than this is treated as stale/abandoned
STEWARD = "RunPod GPU Backend"


def _enabled() -> bool:
    return bool(os.environ.get("COMMONS_LEASE", "").strip()
                or os.environ.get("RUNPOD_LEASE", "").strip())


def _strict_env() -> bool:
    return bool(os.environ.get("COMMONS_LEASE_STRICT", "").strip()
                or os.environ.get("RUNPOD_LEASE_STRICT", "").strip())


class GpuAccountLease(LeaseProvider):
    name = "gpu_account_lease"

    def __init__(self, steward: str = STEWARD):
        self.steward = steward

    def _mark(self, action: str, key: str, context: dict | None = None) -> dict:
        payload = {"kind": LEASE_KIND, "action": action, "key": key, "slug": self.slug(),
                   "headline": f"{self.steward}: agent '{self.slug()}' {action}s lease on {key}."}
        if context:
            payload.update(context)
        return board.make_message("BROADCAST", "GENERAL", payload, from_=self.steward)

    def holders(self, key: str) -> list[Lease]:
        """Fresh, un-released holders of `key` (all slugs), reconstructed from the board."""
        now = time.time()
        acquired: dict[str, float] = {}
        released: set[str] = set()

        def is_lease(m):
            p = m.get("payload", {})
            return p.get("kind") == LEASE_KIND and p.get("key") == key

        for m in board.read(is_lease):
            p = m["payload"]
            slug = p.get("slug")
            if not slug:
                continue
            try:
                ts = datetime.fromisoformat(m["ts"]).timestamp()
            except Exception:
                ts = now
            if p.get("action") == "release":
                released.add(slug)
                acquired.pop(slug, None)
            elif p.get("action") == "acquire" and now - ts <= FRESH_SECONDS:
                acquired[slug] = ts
                released.discard(slug)
        return [Lease(key=key, holder_slug=s, acquired_ts=t)
                for s, t in acquired.items() if s not in released]

    def acquire(self, key: str, enforcement: str = "advisory",
                strict: bool | None = None, context: dict | None = None) -> Lease:
        if enforcement in ("blocking", "broker"):
            raise NotImplementedError(
                f"lease enforcement '{enforcement}' is a documented seam, not yet wired — "
                "advisory only for now (post a RESOURCE_REQUEST + poll for GRANT to add blocking).")
        if enforcement != "advisory":
            raise ValueError(f"unknown enforcement {enforcement!r}")

        me = self.slug()
        mine = Lease(key=key, holder_slug=me, acquired_ts=time.time())
        if not _enabled():
            return mine                       # default OFF: no board footprint

        foreign = [h for h in self.holders(key) if h.holder_slug != me]
        if foreign:
            who = ", ".join(f"{h.holder_slug}(since {int(time.time()-h.acquired_ts)}s ago)" for h in foreign)
            note = f"[lease] foreign holder(s) of {key}: {who}"
            use_strict = strict if strict is not None else _strict_env()
            if use_strict:
                raise SystemExit(note + " — strict lease set, aborting. Wait for release.")
            print(note + " — proceeding anyway (advisory; set COMMONS_LEASE_STRICT=1 to serialize).")

        board.post(self._mark("acquire", key, context), silent=True)
        print(f"[lease] acquired {key} as slug={me}")
        return mine

    def release(self, lease: Lease) -> None:
        if not _enabled():
            return
        board.post(self._mark("release", lease.key), silent=True)
        print(f"[lease] released {lease.key} as slug={self.slug()}")


# ── module-level convenience (back-compat with gpu_lease's acquire/release(pod_base)) ──

_ACCOUNT_KEY = "runpod-account:default"
_default = GpuAccountLease()


def acquire(pod_base: str | None = None):
    """Advisory acquire of the RunPod account key (pod_base kept as board context)."""
    return _default.acquire(_ACCOUNT_KEY, context={"pod_base": pod_base} if pod_base else None)


def release(pod_base: str | None = None):
    return _default.release(Lease(key=_ACCOUNT_KEY, holder_slug=identity.agent_slug(), acquired_ts=time.time()))
