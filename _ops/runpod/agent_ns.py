"""Back-compat shim — agent identity now lives in _ops/commons/identity.py.

Kept at this EXACT path (_ops/runpod/agent_ns.py) because the RunPod
orchestrators' `_find_runpod_ns()` bootstrap imports `agent_ns` from here. This
module just re-exports the Commons identity surface, so the ~13 files already
doing `from agent_ns import ...` need no edit.

The whole point of The Commons is that this slug is NOT RunPod-specific — it is
the one per-agent namespace for every shared external service. See
_ops/commons/identity.py and _ops/commons/__init__.py.
"""
import os as _os
import sys as _sys

# _ops/runpod/agent_ns.py -> _ops -> add it so `commons` is importable as a package.
_ops_dir = _os.path.abspath(_os.path.join(_os.path.dirname(__file__), ".."))
if _ops_dir not in _sys.path:
    _sys.path.insert(0, _ops_dir)

from commons.identity import (  # noqa: E402
    agent_slug,
    owner_tag,
    owner_name,
    owns_name,
    slug_from_name,
    pod_id_file,
    read_pod_id,
)

# Legacy names the RunPod callers import.
pod_name = owner_name           # old name for owner_name(base) -> "<base>-<slug>"
SLUG = agent_slug()             # recomputed on every (re)import — test_multi_agent relies on this


if __name__ == "__main__":
    print(f"slug        = {SLUG}")
    print(f"pod_name(x) = {pod_name('blueline-sdxl-pose-cn')}")
    print(f"pod_id_file = {pod_id_file()}")
