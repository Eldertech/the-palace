"""Per-agent RunPod namespace — the ONE place the multi-agent slug is defined.

Two (or more) Claudes routinely share a single RunPod account. Any tool that
names, lists, guards, culls, sweeps or terminates pods account-wide will strangle
the *other* agent's pods mid-boot — which on 2026-07-02 read as a full day of
phantom "dud node" RunPod outage. The fix (the [[assume multi-agent]] discipline):
scope EVERYTHING an agent creates or destroys to a per-agent slug, so an agent only
ever sees and touches its own pods.

  slug priority:  $RUNPOD_AGENT_SLUG  (e.g. a STIGMERGY session_id kebab-slug)
                  → git worktree/checkout dir name  (stable per-worktree)
                  → host-<hostname>                 (last resort)

Pod NAME becomes  "<base>-<slug>"  and the pod-id handoff file becomes
"/tmp/<tag>-<slug>", so two differently-slugged agents are invisible to each other.

Every RunPod caller in the palace imports from here rather than re-deriving a slug,
so the namespace is single-sourced. See Shop/RunPod GPU Backend.md § Operational
playbook for the full story and the caller audit.
"""
import os, re, socket, subprocess
from pathlib import Path


def agent_slug() -> str:
    """A short, filesystem/pod-name-safe per-agent namespace token."""
    s = os.environ.get("RUNPOD_AGENT_SLUG", "").strip()
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


SLUG = agent_slug()


def pod_name(base: str) -> str:
    """The account-unique pod name for THIS agent: '<base>-<slug>'."""
    return f"{base}-{SLUG}"


def pod_id_file(tag: str = "pod_id") -> Path:
    """The per-agent pod-id handoff path: '/tmp/<tag>-<slug>'. Never shared."""
    return Path(f"/tmp/{tag}-{SLUG}")


def read_pod_id(explicit: str | None = None, tag: str = "pod_id") -> str:
    """Resolve a pod id for a transport/worker script.

    Priority: an explicit --pod value → this agent's slugged handoff file →
    a legacy unslugged '/tmp/<tag>' (back-compat for a human standalone run).
    Raises if none resolve, so a worker never silently drives the wrong pod.
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
    # `python3 agent_ns.py` — print this agent's namespace (handy for debugging).
    print(f"slug         = {SLUG}")
    print(f"pod_name(x)  = {pod_name('blueline-sdxl-pose-cn')}")
    print(f"pod_id_file  = {pod_id_file()}")
