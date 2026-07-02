#!/usr/bin/env python3
"""Two concurrently-run agents don't collide — now at the ORCHESTRATOR level.

Since Phase 3 the pod lifecycle lives in the Commons RunpodPodProvider (collision
points proven directly in _ops/commons/test_provider.py). This test confirms the
migrated pose_pod_orchestrator *delegates* correctly: loaded under two agent slugs
against one shared mocked account, its guard (`_PROV.list_mine`) and cleanup
(`_PROV.list_mine` + terminate) are scoped so agent B never sees or kills agent A's
pod. Fully mocked — no RunPod account, no board. Exit 0 = pass.
"""
import importlib.util, os, sys, types
import time as _real_time
from pathlib import Path

HERE = Path(__file__).resolve().parent
ORCH = HERE.parent.parent / "Projects" / "BLUELINE" / "proofs" / "new-story" / "pose_pod_orchestrator.py"

_counter = [0]
checks = []


def check(desc, cond):
    checks.append((desc, cond))
    print(("  PASS " if cond else "  FAIL ") + desc)


def make_fake_api(store):
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
    """Load the migrated orchestrator under a given slug, wired to a shared mocked account.
    Each agent is a separate process in production; here we drop cached agent_ns/gpu_lease so
    the shim recomputes SLUG from the freshly-set env before the module bakes its NAME."""
    os.environ["RUNPOD_AGENT_SLUG"] = slug
    for cached in ("agent_ns", "gpu_lease"):
        sys.modules.pop(cached, None)
    spec = importlib.util.spec_from_file_location(f"orch_{slug}", str(ORCH))
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    m._PROV.api = make_fake_api(store)                        # share the one account
    m._PROV._heartbeat = lambda base: None                   # no board writes in the test
    import commons.providers.runpod_pod as rp
    rp.time = types.SimpleNamespace(sleep=lambda *a: None, time=_real_time.time)
    return m


def set_slug(s):
    os.environ["RUNPOD_AGENT_SLUG"] = s


def main():
    account = []
    A = load_agent("agent-a", account)
    B = load_agent("agent-b", account)

    check("agents bake distinct pod names", A.NAME != B.NAME)

    # A boots via its orchestrator (create_pod delegates to the provider + writes the handoff).
    set_slug("agent-a")
    a_pid = A.create_pod()
    check("A booted a pod", any(p["id"] == a_pid for p in account))

    # The orchestrator guard is _PROV.list_mine() — B's must not see A's booting pod.
    set_slug("agent-b")
    check("B's guard (list_mine) does NOT see A's pod", B._PROV.list_mine() == [])

    b_pid = B.create_pod()
    check("account holds both pods", len(account) == 2)
    set_slug("agent-a")
    check("A's guard sees only A's pod", [r.id for r in A._PROV.list_mine()] == [a_pid])
    set_slug("agent-b")
    check("B's guard sees only B's pod", [r.id for r in B._PROV.list_mine()] == [b_pid])

    # B's cleanup (--cleanup path) terminates only B's pods.
    n = B.cleanup_named()
    ids = {p["id"] for p in account}
    check("B.cleanup_named removed exactly 1 (its own)", n == 1)
    check("A's pod SURVIVES B's cleanup", a_pid in ids)
    check("B's pod is gone after B cleanup", b_pid not in ids)

    ok = all(c for _, c in checks)
    print(f"\n{'ALL PASS' if ok else 'FAILURES PRESENT'} — {sum(c for _,c in checks)}/{len(checks)} checks")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
