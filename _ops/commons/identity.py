"""The Commons — service-agnostic agent identity & resource ownership.

The ONE place an agent's namespace slug is defined, for ANY shared external
service. Two Claudes routinely share one account; scoping everything an agent
creates to a per-agent slug is what stops them strangling each other's
resources ([[assume multi-agent]]).

  slug priority:  $COMMONS_AGENT_SLUG  (service-agnostic, preferred)
                  → $RUNPOD_AGENT_SLUG (back-compat with the tactical retrofit)
                  → git worktree/checkout dir name  (stable per-worktree)
                  → host-<hostname>                 (last resort)

Ownership is expressed one of three ways depending on what the service's API
allows, all derived from the slug:
  - name suffix   "<base>-<slug>"     (RunPod pods: the only handle the API gives)
  - metadata tag  "owner=<slug>"      (AWS/Modal/etc.: real resource tags)
  - key prefix    "owner=<slug>/..."  (object storage)

Design note (a real test trap): agent_slug() reads the environment on EVERY call
and caches NOTHING at module level, so a consumer re-imported under a changed
$..._AGENT_SLUG gets a fresh slug. Do NOT introduce a module-level SLUG here —
only the thin re-export shims (agent_ns.py) may bind SLUG at their own import.
"""
import os, re, socket, subprocess
from pathlib import Path


def agent_slug() -> str:
    """A short, filesystem/pod-name-safe per-agent namespace token."""
    s = (os.environ.get("COMMONS_AGENT_SLUG", "").strip()
         or os.environ.get("RUNPOD_AGENT_SLUG", "").strip())
    if not s:
        try:
            here = os.path.dirname(os.path.abspath(__file__))
            s = os.path.basename(subprocess.run(
                ["git", "-C", here, "rev-parse", "--show-toplevel"],
                capture_output=True, text=True, timeout=5).stdout.strip())
        except Exception:
            s = ""
    if not s:
        s = "host-" + socket.gethostname()
    s = re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")
    return s[:32] or "default"


# ── ownership helpers (each derives from the slug) ───────────────────────────

def owner_tag(slug: str | None = None) -> str:
    """Metadata/prefix ownership tag: 'owner=<slug>'."""
    return f"owner={slug or agent_slug()}"


def owner_name(base: str, slug: str | None = None) -> str:
    """Name-suffix ownership: '<base>-<slug>' (e.g. RunPod pod names)."""
    return f"{base}-{slug or agent_slug()}"


def owns_name(name: str, base: str, slug: str | None = None) -> bool:
    """True iff a resource name belongs to this agent (or the given slug)."""
    return name == owner_name(base, slug)


def slug_from_name(name: str, base: str) -> str | None:
    """Extract the owner slug from a '<base>-<slug>' name, or None if it doesn't fit."""
    prefix = f"{base}-"
    return name[len(prefix):] if name.startswith(prefix) and len(name) > len(prefix) else None


# ── per-agent local handoff state (never a shared path) ──────────────────────

def pod_id_file(tag: str = "pod_id", slug: str | None = None) -> Path:
    """The per-agent handoff path: '/tmp/<tag>-<slug>'. Never the shared '/tmp/<tag>'."""
    return Path(f"/tmp/{tag}-{slug or agent_slug()}")


def read_pod_id(explicit: str | None = None, tag: str = "pod_id") -> str:
    """Resolve a resource id for a transport/worker script.

    Priority: an explicit --pod value → this agent's slugged handoff file →
    a legacy unslugged '/tmp/<tag>' (back-compat for a human standalone run).
    Raises if none resolve, so a worker never silently drives the wrong resource.
    """
    if explicit:
        return explicit
    f = pod_id_file(tag)
    if f.exists():
        return f.read_text().strip()
    legacy = Path(f"/tmp/{tag}")
    if legacy.exists():
        return legacy.read_text().strip()
    raise SystemExit(
        f"[pod-id] no pod id — pass --pod <id>, or one of {f} / {legacy} must exist")


if __name__ == "__main__":
    print(f"slug          = {agent_slug()}")
    print(f"owner_tag     = {owner_tag()}")
    print(f"owner_name(x) = {owner_name('blueline-sdxl-pose-cn')}")
    print(f"pod_id_file   = {pod_id_file()}")
