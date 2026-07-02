"""Serverless-endpoint worker coordinator — reference-counted over the board.

A RunPod serverless endpoint has ONE shared `workersMax` knob. The naive pattern
(set it to 1 at render start, PARK it to 0 in a `finally`) is a multi-agent WEDGE:
agent A's finally parks workers to 0 while agents B/C still have jobs in flight, and
their jobs stall on a 0-worker endpoint. This coordinator fixes it by reference-
counting active renderers on the STIGMERGY board: `workersMax` tracks the number of
live holders, so it only falls to 0 when the LAST renderer leaves.

It's the LeaseProvider shape applied to a rate/capacity resource. Unlike the advisory
GPU lease this is NOT opt-in — the coordination IS the safety — but it stays best-
effort: if the board is unreachable it degrades to single-tenant scaling with a loud
warning rather than crashing a render.
"""
import json
import sys
import time
import urllib.request
from datetime import datetime

from . import board, identity


def _log(msg: str) -> None:
    # Diagnostics go to STDERR: callers like regen_one.py emit ONLY result JSON on stdout.
    print(msg, file=sys.stderr, flush=True)

KIND = "endpoint_worker"
FRESH_SECONDS = 30 * 60          # a holder older than this is treated as abandoned
STEWARD = "Hero and Avatar Maker"


class EndpointWorkers:
    def __init__(self, endpoint_id: str, api_key: str, cap: int = 5, steward: str = STEWARD):
        self.ep = endpoint_id
        self.key = api_key
        self.cap = cap
        self.steward = steward

    def _bkey(self) -> str:
        return f"runpod-endpoint:{self.ep}:workers"

    def _mark(self, action: str) -> dict:
        slug = identity.agent_slug()
        return board.make_message("BROADCAST", "GENERAL", {
            "kind": KIND, "action": action, "key": self._bkey(), "slug": slug, "endpoint": self.ep,
            "headline": f"{self.steward}: '{slug}' {action}s a worker on endpoint {self.ep}.",
        }, from_=self.steward)

    def holders(self) -> list[str]:
        """Live (fresh, un-released) renderer slugs on this endpoint, from the board."""
        now = time.time()
        acquired: dict[str, float] = {}
        released: set[str] = set()

        def pred(m):
            p = m.get("payload", {})
            return p.get("kind") == KIND and p.get("key") == self._bkey()

        for m in board.read(pred):
            p = m["payload"]
            s = p.get("slug")
            if not s:
                continue
            try:
                ts = datetime.fromisoformat(m["ts"]).timestamp()
            except Exception:
                ts = now
            if p.get("action") == "release":
                released.add(s)
                acquired.pop(s, None)
            elif p.get("action") == "acquire" and now - ts <= FRESH_SECONDS:
                acquired[s] = ts
                released.discard(s)
        return [s for s in acquired if s not in released]

    def _set_workers(self, n: int) -> int:
        req = urllib.request.Request(
            f"https://rest.runpod.io/v1/endpoints/{self.ep}",
            data=json.dumps({"workersMin": 0, "workersMax": n}).encode(), method="PATCH",
            headers={"Authorization": f"Bearer {self.key}", "Content-Type": "application/json"})
        urllib.request.urlopen(req, timeout=30).read()
        return n

    def enter(self) -> None:
        """Register as an active renderer; ensure workersMax covers all live holders."""
        res = board.post(self._mark("acquire"), silent=True)
        if res.get("ok"):
            n = min(self.cap, max(1, len(self.holders())))
        else:
            _log("[endpoint] WARN board unreachable — degrading to single-tenant worker scaling")
            n = 1
        self._set_workers(n)
        _log(f"[endpoint] workersMax={n} (holders after my acquire)")

    def exit(self) -> None:
        """Deregister; park to the count of REMAINING holders — 0 only if I'm the last."""
        res = board.post(self._mark("release"), silent=True)
        n = min(self.cap, len(self.holders())) if res.get("ok") else 0
        self._set_workers(n)
        _log(f"[endpoint] workersMax={n} (holders after my release)")
