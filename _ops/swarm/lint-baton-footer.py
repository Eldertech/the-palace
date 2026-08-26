#!/usr/bin/env python3
"""lint-baton-footer.py — the On-pickup checklist must exist exactly once, and every
live baton must carry that exact text.

Why this linter exists
----------------------
The catcher's checklist is the one half of the Baton Ceremony that the *catcher*
actually reads: it arrives on a work invocation, opens the baton and the entry, and
never opens the ceremony spec. So the text has to ride inside the artifact — which
means it gets copied, which means it drifts.

It did. The three-state lifecycle (claim → close, 2026-07-07) landed in
`_ops/Baton Ceremony.md` and never reached `_ops/closing-well/baton-executor.mjs`,
which carried its own hardcoded copy and called itself canonical. For seven weeks
every machine-written baton shipped a checklist that told the catcher to delete the
baton at pickup and post a bare `handoff_picked_up` — and a pickup without
`lifecycle: "claim"` folds as a LEGACY terminal pickup (handoff-model.mjs), silently
retiring the card with no commit cited. Nothing caught it because nothing checked.

Two rules, both cheap:

  E1  exactly ONE source copy of the checklist exists (the fragment). A second copy
      in any spec, prompt, or script is drift waiting to happen.
  E2  every live baton's footer matches the fragment verbatim.

W1 flags a baton with no footer at all — legal for a steward baton (never caught,
never closed), a warning everywhere else.

Usage:  python3 _ops/swarm/lint-baton-footer.py [--palace <root>] [--quiet]
Exit:   0 clean · 1 errors found
"""

import argparse
import os
import re
import sys

HEADING = "## On pickup"
FRAGMENT_REL = os.path.join("_ops", "Baton Ceremony", "Baton Ceremony — on-pickup.md")

SKIP_DIRS = {".git", ".obsidian", ".claude", "node_modules", ".venvs", "Archive"}

# Files allowed to *mention* the heading without holding a copy: the ceremony points
# at the fragment, the linter documents it, git history is not a live copy.
MENTION_OK = {
    os.path.join("_ops", "Baton Ceremony.md"),
    os.path.join("_ops", "swarm", "lint-baton-footer.py"),
}

# A steward baton is updated in place and never caught or closed, so it carries no
# catcher's checklist. Match the SCHEMA §8 naming for one.
STEWARD_RE = re.compile(r"steward", re.I)


def walk(root):
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for fn in filenames:
            full = os.path.join(dirpath, fn)
            yield os.path.relpath(full, root), full


def read(path):
    try:
        with open(path, encoding="utf-8", errors="ignore") as fh:
            return fh.read()
    except OSError:
        return ""


def footer_of(text):
    """The checklist as it appears in a file: the heading through end-of-block."""
    at = text.find(HEADING)
    if at < 0:
        return None
    return text[at:].strip()


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    ap = argparse.ArgumentParser()
    ap.add_argument("--palace", default=os.path.normpath(os.path.join(here, "..", "..")))
    ap.add_argument("--quiet", action="store_true")
    args = ap.parse_args()
    root = args.palace

    errors, warnings = [], []

    # --- the fragment itself ------------------------------------------------
    frag_path = os.path.join(root, FRAGMENT_REL)
    if not os.path.exists(frag_path):
        print(f"E1  the canonical checklist is missing: {FRAGMENT_REL}")
        print("    Every baton depends on it and baton-executor.mjs refuses to run without it.")
        return 1
    canonical = footer_of(read(frag_path))
    if not canonical:
        print(f'E1  {FRAGMENT_REL} has no "{HEADING}" heading — it is not the checklist.')
        return 1

    # --- E1: no second source copy -----------------------------------------
    # A "copy" reproduces the checklist's PROSE. Naming its parts does not count —
    # the spec points at it, this linter documents it, and the executor's test asserts
    # on its beat names; none of those can drift, because none of them is text a
    # catcher would read. So the test is: does a long canonical sentence appear here
    # verbatim? That is the thing that goes stale when the fragment is edited.
    canonical_sentences = [
        s.strip() for s in re.split(r"(?<=[.!?])\s+", canonical)
        if len(s.strip()) >= 100
    ]
    for rel, full in walk(root):
        if rel == FRAGMENT_REL or rel in MENTION_OK:
            continue
        if not rel.lower().endswith((".md", ".mjs", ".js", ".py", ".txt")):
            continue
        is_baton = rel.lower().endswith("— baton.md") or "— baton —" in rel.lower()
        if is_baton:
            continue  # handled by E2 below
        text = read(full)
        echoed = [s for s in canonical_sentences if s in text]
        if echoed:
            errors.append(
                f"E1  second copy of the On-pickup checklist in {rel}\n"
                f"    {len(echoed)} canonical sentence(s) reproduced verbatim, e.g.:\n"
                f"      \"{echoed[0][:88]}…\"\n"
                f"    The checklist has ONE home: {FRAGMENT_REL}. Point at it; do not restate it.\n"
                f"    (This is exactly how baton-executor.mjs drifted for seven weeks.)"
            )

    # --- E2: every live baton matches --------------------------------------
    batons = [
        (rel, full) for rel, full in walk(root)
        if rel.lower().endswith("— baton.md") or "— baton —" in rel.lower()
    ]
    for rel, full in sorted(batons):
        text = read(full)
        body = footer_of(text)
        if body is None:
            if STEWARD_RE.search(text[:2000]):
                continue  # steward baton: updated in place, never caught
            warnings.append(
                f"W1  {rel} has no On-pickup checklist.\n"
                f"    The catcher reads the baton, not the ceremony — without it they have no close step."
            )
            continue
        if body != canonical:
            errors.append(
                f"E2  {rel} carries a STALE On-pickup checklist (does not match the fragment).\n"
                f"    Replace it verbatim:  cat \"{FRAGMENT_REL}\"\n"
                f"    A stale footer is not cosmetic — the pre-2026-07-07 text tells the catcher to\n"
                f"    delete the baton at pickup and never post a close, which silently retires the card."
            )

    if not args.quiet:
        for e in errors:
            print(e)
        for w in warnings:
            print(w)
        print(f"\nsummary: {len(errors)} errors, {len(warnings)} warnings "
              f"({len(batons)} baton(s) checked against {FRAGMENT_REL})")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
