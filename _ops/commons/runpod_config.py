"""Where the RunPod key lives — the one place that knows.

The API key and endpoint id are a gitignored file in RunPod GPU Backend's bundle,
`Shop/RunPod GPU Backend/studio/config.json`, guarded by two ignore rules
(`studio/.gitignore` and an explicit line in the root `.gitignore`). A reader asks
here instead of spelling the path, so the next move changes one line.

Resolution order:
  1. `$RUNPOD_CONFIG`, when set — an explicit override always wins.
  2. This checkout's copy.
  3. The owner (primary) checkout's copy, found through git's common dir — so a
     worktree made without the key's symlink still finds it, and the reaper still
     sees this agent's pods instead of skipping them.

Missing everywhere raises FileNotFoundError naming every place it looked. It never
returns a path that isn't there, so a caller can't mistake "no key" for "no pods".

This module never reads the key itself; it only says where the file is.
"""
from __future__ import annotations

import os
import subprocess
from pathlib import Path

REL = Path("Shop") / "RunPod GPU Backend" / "studio" / "config.json"


def _checkout_root() -> Path:
    # _ops/commons/runpod_config.py -> _ops/commons -> _ops -> checkout root
    return Path(__file__).resolve().parents[2]


def _owner_root(checkout: Path) -> Path | None:
    try:
        common = subprocess.run(
            ["git", "-C", str(checkout), "rev-parse", "--path-format=absolute", "--git-common-dir"],
            capture_output=True, text=True, check=True).stdout.strip()
    except (OSError, subprocess.CalledProcessError):
        return None
    return Path(common).parent if common else None


def candidates() -> list[Path]:
    """Every place the key may live, most specific first (duplicates dropped)."""
    out: list[Path] = []
    env = os.environ.get("RUNPOD_CONFIG")
    if env:
        out.append(Path(env).expanduser())
    here = _checkout_root()
    out.append(here / REL)
    owner = _owner_root(here)
    if owner is not None:
        out.append(owner / REL)
    seen, uniq = set(), []
    for p in out:
        key = str(p.resolve()) if p.exists() else str(p)
        if key not in seen:
            seen.add(key)
            uniq.append(p)
    return uniq


def runpod_config_path() -> Path:
    """The key file's path. Raises FileNotFoundError, naming every place looked."""
    looked = candidates()
    for p in looked:
        if p.is_file():
            return p
    raise FileNotFoundError(
        "RunPod key not found. Looked in: " + "; ".join(str(p) for p in looked)
        + ". Set $RUNPOD_CONFIG, or restore Shop/RunPod GPU Backend/studio/config.json "
          "in the primary checkout.")
