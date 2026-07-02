#!/usr/bin/env python3
"""Phase 5 gate — the reaper is cross-agent SAFE.

Fully mocked (a fake provider, injected liveness, a fixed `now`; no network, no board
writes). Proves the three gates, the posture rules, and — encoded permanently — the
2026-07-02 outage regression: an agent's BOOTING pod is never reaped, and cross-slug
--force cannot terminate. Exit 0 = pass.
"""
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from commons import reaper                                   # noqa: E402
from commons.provider import InstanceProvider, Resource      # noqa: E402

NOW = 1_000_000.0
checks = []


def check(desc, cond):
    checks.append((desc, cond))
    print(("  PASS " if cond else "  FAIL ") + desc)


def R(rid, slug, age, name=None):
    return Resource(id=rid, name=name or (f"blueline-x--{slug}" if slug else rid),
                    owner_slug=slug, created_ts=(None if age is None else NOW - age),
                    kind="pod", provider="fake")


class FakeProvider(InstanceProvider):
    name = "fake"
    kind = "pod"

    def __init__(self, resources):
        self._res = {r.id: r for r in resources}

    def create(self, spec):
        raise NotImplementedError

    def list_all(self):
        return list(self._res.values())

    def terminate(self, r):
        rid = r.id if isinstance(r, Resource) else r
        return self._res.pop(rid, None) is not None


OLD = 4000      # > GRACE (2700)
YOUNG = 120     # < GRACE — a booting pod


def main():
    G, T = reaper.GRACE, reaper.LIVENESS_TTL

    # ── gate 1: age (the booting-pod protection — the outage lesson) ──
    check("booting pod (young) is NOT reapable, even with a silent owner",
          reaper.is_reapable(R("p", "a", YOUNG), NOW, {}, G, T) is False)
    check("old pod with a silent owner IS reapable",
          reaper.is_reapable(R("p", "a", OLD), NOW, {}, G, T) is True)

    # ── gate 2: liveness ──
    check("old pod whose owner is ALIVE (fresh mark) is NOT reapable",
          reaper.is_reapable(R("p", "a", OLD), NOW, {"a": NOW - 100}, G, T) is False)
    check("old pod whose owner went silent past TTL IS reapable",
          reaper.is_reapable(R("p", "a", OLD), NOW, {"a": NOW - (T + 100)}, G, T) is True)

    # ── never-touch cases ──
    check("unmanaged resource (owner None) is NEVER reapable",
          reaper.is_reapable(R("p", None, OLD), NOW, {}, G, T) is False)
    check("unknown-age resource is NEVER reapable (conservative)",
          reaper.is_reapable(R("p", "a", None), NOW, {}, G, T) is False)

    # ── posture (find_candidates) ──
    res = [R("mine", "me", OLD), R("foreign", "other", OLD)]
    self_c = reaper.find_candidates(res, NOW, {}, "self", "me", grace=G, ttl=T)
    check("--self considers only my slug", [r.id for r in self_c] == ["mine"])
    cross_c = reaper.find_candidates(res, NOW, {}, "cross-slug", "me", grace=G, ttl=T)
    check("--cross-slug considers all owners", {r.id for r in cross_c} == {"mine", "foreign"})
    excl = reaper.find_candidates(res, NOW, {}, "self", "me", grace=G, ttl=T, exclude_ids={"mine"})
    check("my current keep-alive pod (excluded id) is spared", excl == [])

    # ── driver: --self --force clears my prior-run leak, spares keep-alive & foreign ──
    os.environ["COMMONS_AGENT_SLUG"] = "me"
    reaper.owner_liveness = lambda now=None: {}                    # nobody alive
    reaper._my_current_pod_ids = lambda: {"mine-live"}            # my current pod
    fp = FakeProvider([R("mine-leak", "me", OLD), R("mine-live", "me", OLD), R("foreign", "other", OLD)])
    summary = reaper.reap("self", force=True, now=NOW, providers_iter=[("fake", fp)], post_flag=False)
    ids = set(fp._res)
    check("self --force terminated my prior-run leak", summary["terminated"] == ["mine-leak"])
    check("my keep-alive pod SURVIVES self-reap", "mine-live" in ids)
    check("a foreign pod SURVIVES self-reap", "foreign" in ids)

    # ── THE OUTAGE REGRESSION: B reaps cross-slug --force while A boots → A survives ──
    os.environ["COMMONS_AGENT_SLUG"] = "agent-b"
    reaper._my_current_pod_ids = lambda: set()
    fp2 = FakeProvider([R("a-booting", "agent-a", YOUNG), R("a-stale", "agent-a", OLD)])
    summary2 = reaper.reap("cross-slug", force=True, now=NOW, providers_iter=[("fake", fp2)], post_flag=False)
    ids2 = set(fp2._res)
    check("cross-slug --force terminates NOTHING (disabled in code)", summary2["terminated"] == [])
    check("A's BOOTING pod survives B's cross-slug --force reap (outage regression)", "a-booting" in ids2)
    check("A's stale pod survives too (cross-slug is report-only)", "a-stale" in ids2)
    check("A's stale pod IS surfaced as a candidate for review", "a-stale" in summary2["candidates"])
    check("A's booting pod is NOT even a candidate (age-gated)", "a-booting" not in summary2["candidates"])

    ok = all(c for _, c in checks)
    print(f"\n{'ALL PASS' if ok else 'FAILURES PRESENT'} — {sum(c for _,c in checks)}/{len(checks)} checks")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
