#!/usr/bin/env python3
"""Proof that two concurrently-run agents no longer collide on one RunPod account.

Loads the REAL pose_pod_orchestrator twice — once as agent-a, once as agent-b (two
different RUNPOD_AGENT_SLUG values, i.e. two Claudes / two worktrees) — against a
single shared in-memory "account" of pods. Then asserts the three collision points
from the 2026-07-02 outage are gone:

  1. NAME collision      — each agent's pod carries its own "-<slug>" name.
  2. account-wide guard   — agent B's guard (list_named) never sees agent A's pod,
                            so A's booting pod cannot abort B (and vice-versa).
  3. name-based cull/cleanup — B's cleanup_named / _cull_extras delete ONLY B's pods;
                            A's pod survives (the exact move that strangled the other
                            agent's pod mid-boot).

Also checks the pod-id handoff file is per-agent (no shared /tmp/pod_id).

Run:  python3 _ops/runpod/test_multi_agent.py     (no RunPod account needed — fully mocked)
Exit 0 = pass.
"""
import importlib.util, os, sys, types
import time as _real_time
from pathlib import Path

HERE = Path(__file__).resolve().parent
ORCH = HERE.parent.parent / "Projects" / "BLUELINE" / "proofs" / "new-story" / "pose_pod_orchestrator.py"

_counter = [0]


def make_fake_api(store):
    """A stand-in for the shared RunPod account: one pod list, many agents."""
    def api(method, path, body=None, timeout=60):
        if method == "GET" and path == "/pods":
            return [dict(p) for p in store], 200
        if method == "GET" and path.startswith("/pods/"):
            pid = path.rsplit("/", 1)[-1]
            for p in store:
                if p["id"] == pid:
                    return dict(p), 200
            return {}, 404
        if method == "POST" and path == "/pods":
            _counter[0] += 1
            pid = f"pod{_counter[0]}"
            store.append({"id": pid, "name": body["name"], "desiredStatus": "RUNNING"})
            return {"id": pid}, 201
        if method == "DELETE" and path.startswith("/pods/"):
            pid = path.rsplit("/", 1)[-1]
            store[:] = [p for p in store if p["id"] != pid]
            return {}, 200
        return {}, 400
    return api


def load_agent(slug, store):
    """Load the real orchestrator module under a given agent slug, wired to a shared account.

    In production each agent is a separate PROCESS, so agent_ns computes SLUG once at
    import and that is correct. To simulate two agents in ONE test process we must drop the
    cached agent_ns/gpu_lease so each load recomputes SLUG from the freshly-set env var."""
    os.environ["RUNPOD_AGENT_SLUG"] = slug
    for cached in ("agent_ns", "gpu_lease"):
        sys.modules.pop(cached, None)
    spec = importlib.util.spec_from_file_location(f"orch_{slug}", str(ORCH))
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    m.api = make_fake_api(store)                       # share the one account
    m.time = types.SimpleNamespace(sleep=lambda *a: None, time=_real_time.time)  # no real waits
    return m


def main():
    account = []                                        # the single shared RunPod account
    A = load_agent("agent-a", account)
    B = load_agent("agent-b", account)

    checks = []

    def check(desc, cond):
        checks.append((desc, cond))
        print(("  PASS " if cond else "  FAIL ") + desc)

    print(f"agent A name = {A.NAME}")
    print(f"agent B name = {B.NAME}")
    check("agents get distinct pod names", A.NAME != B.NAME)
    check("agents get distinct pod-id files", str(A.POD_ID_FILE) != str(B.POD_ID_FILE))

    # Agent A boots a pod (guard sees no A-pod yet, so it proceeds).
    check("A guard clear before A boots", A.list_named() == [])
    a_pid = A.create_pod()
    print(f"A created {a_pid}; account now has {len(account)} pod(s)")

    # Collision point 2: A's booting pod must be INVISIBLE to B's guard.
    check("B does NOT see A's pod (guard would not abort B)", B.list_named() == [])

    # Agent B boots its own pod while A's is still up.
    b_pid = B.create_pod()
    print(f"B created {b_pid}; account now has {len(account)} pod(s)")
    check("account holds both pods", len(account) == 2)
    check("A sees only its own pod", [p["id"] for p in A.list_named()] == [a_pid])
    check("B sees only its own pod", [p["id"] for p in B.list_named()] == [b_pid])

    # Collision point 3a: B's cleanup must not touch A's pod.
    n = B.cleanup_named()
    surviving = {p["id"] for p in account}
    check("B.cleanup_named removed exactly 1 (its own)", n == 1)
    check("A's pod SURVIVES B's cleanup", a_pid in surviving)
    check("B's pod is gone after B cleanup", b_pid not in surviving)

    # Collision point 3b: a leaked-duplicate cull scoped to B must never delete A's pod.
    b2 = B.create_pod()                                 # B boots a fresh pod
    account.append({"id": "pod-leak", "name": B.NAME, "desiredStatus": "RUNNING"})  # flaky-500 twin
    b_ids = {p["id"] for p in B.list_named()}
    check("B sees its 2 pods (leak simulated)", b_ids == {b2, "pod-leak"})
    B._cull_extras(keep=b2)                             # keep the real one, cull the leaked twin
    after = {p["id"] for p in account}
    check("cull kept B's real pod", b2 in after)
    check("cull removed the leaked twin", "pod-leak" not in after)
    check("A's pod STILL survives B's cull", a_pid in after)

    ok = all(c for _, c in checks)
    print(f"\n{'ALL PASS' if ok else 'FAILURES PRESENT'} — {sum(c for _,c in checks)}/{len(checks)} checks")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
