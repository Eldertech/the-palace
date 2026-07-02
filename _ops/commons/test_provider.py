#!/usr/bin/env python3
"""Phase 2 gate — the RunpodPodProvider re-passes the collision-point proof.

Drives the REAL provider under two agent slugs against one shared mocked RunPod
account (no network, no board writes) and re-asserts the three collision points the
2026-07-02 outage came from: distinct owner-tagged names; B's scoped view can't see
A's booting pod; B's cull/terminate spares A's pod. Exit 0 = pass.
"""
import os
import sys
import time as _time
import types
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from commons import identity                                    # noqa: E402
from commons.providers import runpod_pod as rp                  # noqa: E402

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


def prov(store):
    p = rp.RunpodPodProvider(api_key="test")
    p.api = make_fake_api(store)
    p._heartbeat = lambda base: None                            # no board writes in the test
    return p


SPEC = {"base": "blueline-x", "image": "img", "gpuTypeIds": ["G"],
        "containerDiskInGb": 10, "dockerStartCmd": ["bash"]}


def set_slug(s):
    os.environ["RUNPOD_AGENT_SLUG"] = s


def main():
    rp.time = types.SimpleNamespace(sleep=lambda *a: None, time=_time.time)   # no real waits
    store = []
    A, B = prov(store), prov(store)

    set_slug("agent-a"); name_a = identity.owner_name("blueline-x")
    set_slug("agent-b"); name_b = identity.owner_name("blueline-x")
    check("agents get distinct owner-tagged names", name_a != name_b)
    check("names are unambiguously attributable",
          identity.owner_of_name(name_a) == "agent-a" and identity.owner_of_name(name_b) == "agent-b")

    # A boots a pod.
    set_slug("agent-a")
    ra = A.create(dict(SPEC))
    check("A's pod is owned by agent-a", ra.owner_slug == "agent-a")

    # Collision point 2: A's booting pod is invisible to B's scoped view.
    set_slug("agent-b")
    check("B.list_mine() does NOT see A's booting pod", B.list_mine() == [])

    # B boots its own.
    rb = B.create(dict(SPEC))
    check("account holds both pods", len(store) == 2)
    set_slug("agent-a")
    check("A sees only its own pod", [r.id for r in A.list_mine()] == [ra.id])
    set_slug("agent-b")
    check("B sees only its own pod", [r.id for r in B.list_mine()] == [rb.id])

    # Collision point 3a: a leaked-twin cull scoped to B's name spares A's pod.
    store.append({"id": "pod-leak", "name": rb.name, "desiredStatus": "RUNNING"})
    B._cull_extras(rb.name, keep=rb.id)
    ids = {p["id"] for p in store}
    check("cull removed B's leaked twin", "pod-leak" not in ids)
    check("A's pod SURVIVES B's cull", ra.id in ids)

    # Collision point 3b: terminate is per-resource, never touches A's.
    B.terminate(rb)
    ids = {p["id"] for p in store}
    check("B.terminate removed B's pod", rb.id not in ids)
    check("A's pod STILL survives B's terminate", ra.id in ids)

    ok = all(c for _, c in checks)
    print(f"\n{'ALL PASS' if ok else 'FAILURES PRESENT'} — {sum(c for _,c in checks)}/{len(checks)} checks")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
