"""Back-compat shim — the GPU lease now lives in _ops/commons/lease.py.

Kept at this path because the RunPod orchestrators do `import gpu_lease` and call
`gpu_lease.acquire(pod_base)` / `gpu_lease.release(pod_base)`. The old implementation
here hand-rolled the §9 envelope and FAILED the canonical validator; the Commons
lease posts through the validated board bridge instead. Same default-OFF, fail-silent
posture; enable with $COMMONS_LEASE (or legacy $RUNPOD_LEASE); $COMMONS_LEASE_STRICT
(or $RUNPOD_LEASE_STRICT) to abort on a foreign holder.
"""
import os as _os
import sys as _sys

_ops_dir = _os.path.abspath(_os.path.join(_os.path.dirname(__file__), ".."))
if _ops_dir not in _sys.path:
    _sys.path.insert(0, _ops_dir)

from commons.lease import acquire, release, GpuAccountLease  # noqa: E402,F401
