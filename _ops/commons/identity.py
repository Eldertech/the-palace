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
#
# Name-suffix ownership uses a DOUBLE-hyphen separator: "<base>--<slug>". Bases and
# slugs are both single-hyphen kebab (my slugify collapses runs of non-alnum to one
# '-'), so "--" never occurs inside either — which makes `rsplit("--", 1)` an
# unambiguous (base, slug) split. That's what lets the reaper attribute any pod to
# its owner from the name alone, and lets a pod with no "--" be recognized as
# not-Commons-managed (owner None → never reaped).

OWNER_SEP = "--"


def owner_tag(slug: str | None = None) -> str:
    """Metadata/prefix ownership tag: 'owner=<slug>' (for APIs with real tags/prefixes)."""
    return f"owner={slug or agent_slug()}"


def owner_name(base: str, slug: str | None = None) -> str:
    """Name-suffix ownership: '<base>--<slug>' (e.g. RunPod pod names)."""
    return f"{base}{OWNER_SEP}{slug or agent_slug()}"


def owner_of_name(name: str) -> str | None:
    """The owner slug encoded in a '<base>--<slug>' name, or None if unmanaged."""
    return name.rsplit(OWNER_SEP, 1)[1] if OWNER_SEP in name else None


def base_of_name(name: str) -> str:
    """The base of a '<base>--<slug>' name (the whole name if unmanaged)."""
    return name.rsplit(OWNER_SEP, 1)[0] if OWNER_SEP in name else name


def owns_name(name: str, slug: str | None = None) -> bool:
    """True iff a resource name is owned by this agent (or the given slug)."""
    return owner_of_name(name) == (slug or agent_slug())


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
