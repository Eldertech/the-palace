#!/usr/bin/env python3
"""
Bundle-Hygiene Linter - the Weave's flag for frontmatter that wants demoting.

Fifth mechanical scan in the Weave's linter suite. It catches the palace's most-repeated
hand-sweep: files wearing full canon entry frontmatter that are really entry-owned working
substrate (plans, logs, specs, proofs, context companions) and should carry minimal §8
bundle frontmatter instead. Two checks:

  E1  Invalid type            - a file whose `type:` is present but is NOT one of the
                                SCHEMA §1 canon types (e.g. `proof`, `spec`, `artifact`
                                jammed into `type:`). No valid entry has a non-canon type,
                                and a bundle file should carry NO `type:` at all - so this
                                is unambiguous field misuse. An ERROR (gates the commit).
                                Fix: demote to §8 bundle frontmatter (drop type/pillars/
                                stage, keep/add forward_vector), or correct the type.

  W1  Canon frontmatter in a  - a file carrying canon frontmatter (a valid `type:`) that
      bundle folder             lives INSIDE a bundle folder (a folder with a twin `.md`,
                                per SCHEMA §8). Probably working substrate that should be
                                demoted - BUT nested canon legitimately exists (catalogue
                                sub-entries under a parent bundle). So this is a WARNING:
                                the Weave rules substrate-vs-nested-canon per finding.
                                Demotion now; promotion (bundle -> canon) waits for Loudon.

The bundle-vs-organizational-folder distinction is the discriminator. A BUNDLE folder has a
twin sibling `.md` (`Foo/` next to `Foo.md`). An ORGANIZATIONAL folder does not (`Projects/`,
`Shop/`, `_ops/`) - canon entries live there normally and are never flagged. The twin-`.md`
test is what separates the two, so the linter never nags legit entries in Projects/ or Shop/.

Detection is mechanical; every demotion is Loudon's call (values-primary: the linter flags,
the mind rules). This linter never demotes anything.

Mechanical, deterministic, no API calls, reads markdown directly.
Exit code 0 = clean (no errors), 1 = errors found (invalid types). Warnings never gate.

Usage: python3 _ops/swarm/lint-bundle-hygiene.py [palace-root]
       (defaults to the palace root two levels above this script)
"""
from __future__ import annotations
import os, re, sys

SKIP_DIRS = {".git", ".obsidian", ".claude", "node_modules", ".venvs", "_tools",
             "venv", "__pycache__"}
# Machinery/work-product trees whose markdown carries non-canon `type:` by design
# (templates, orchestrator docs). Not entries, not substrate to demote - fully exempt.
SKIP_PREFIXES = ("_ops/stigmergy/app/", "_ops/stigmergy/orchestrator/",
                 "_ops/stigmergy/trickster-auto/", "_ops/swarm/",
                 "Enrichment/card-", "Enrichment/Archive/")

CANON_TYPES = {"concept", "hub", "project", "breakthrough", "source", "meta",
               "practice", "person", "question", "spore", "specialist", "maker"}

PALACE_DEFAULT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))

TYPE_RE = re.compile(r'^type:\s*(.+?)\s*$', re.M)


def _unquote(val):
    val = val.strip()
    if len(val) >= 2 and val[0] == val[-1] and val[0] in ("'", '"'):
        val = val[1:-1]
    return val


def read_type(path):
    """Return the `type:` value from the leading frontmatter block, or None if the file
    has no frontmatter or no type field."""
    try:
        with open(path, encoding="utf-8", errors="ignore") as f:
            head = f.read(4096)
    except OSError:
        return None
    if not head.startswith("---"):
        return None
    end = head.find("\n---", 3)
    if end == -1:
        return None
    m = TYPE_RE.search(head[3:end])
    return _unquote(m.group(1)) if m else None


def is_skipped_prefix(rel):
    r = rel.replace(os.sep, "/")
    return any(r.startswith(p) for p in SKIP_PREFIXES)


def enclosing_bundle(ap, root):
    """If the file lives inside a bundle folder (any ancestor dir D that has a twin
    sibling D.md), return that bundle's name; else None. Walks ancestors up to root, so a
    file in `Foo/Archive/` is still seen as inside bundle `Foo`."""
    d = os.path.dirname(os.path.abspath(ap))
    root = os.path.abspath(root)
    while len(d) >= len(root) and d.startswith(root):
        name = os.path.basename(d)
        twin = os.path.join(os.path.dirname(d), name + ".md")
        if os.path.isfile(twin):
            return name
        if d == root:
            break
        d = os.path.dirname(d)
    return None


def check(root, only=None):
    errors, warnings = [], []
    for dp, dns, fns in os.walk(root):
        dns[:] = [d for d in dns if d not in SKIP_DIRS]
        for fn in fns:
            if not fn.endswith(".md"):
                continue
            ap = os.path.join(dp, fn)
            rel = os.path.relpath(ap, root)
            if only is not None and rel.replace(os.sep, "/") not in only:
                continue
            if is_skipped_prefix(rel) or os.path.islink(ap):
                continue
            typ = read_type(ap)
            if typ is None:
                continue  # no type: -> a bundle file / draft, correctly shaped
            if typ not in CANON_TYPES:
                errors.append(
                    f'E1  invalid type "{typ}" in {rel}:  not a SCHEMA §1 type '
                    f'- demote to §8 bundle frontmatter (drop type) or correct it')
                continue
            # valid canon type: flag only if it sits inside a bundle folder
            bundle = enclosing_bundle(ap, root)
            if bundle is not None:
                warnings.append(
                    f'W1  canon type "{typ}" inside bundle "{bundle}/":  {rel} '
                    f'- substrate to demote, or genuine nested canon? (Weave rules)')
    return errors, warnings


def parse_args():
    """[palace-root] positional + optional --paths a,b,c (root-relative files to check)."""
    root, only = None, None
    args = sys.argv[1:]
    i = 0
    while i < len(args):
        if args[i] == "--paths" and i + 1 < len(args):
            only = {p.strip().lstrip("./") for p in args[i + 1].split(",") if p.strip()}
            i += 2
        elif not args[i].startswith("--"):
            root = args[i]; i += 1
        else:
            i += 1
    return os.path.abspath(root or PALACE_DEFAULT), only


def main():
    root, only = parse_args()
    if not os.path.isdir(root):
        sys.exit(f"not a directory: {root}")

    errors, warnings = check(root, only)
    errors = sorted(set(errors))
    warnings = sorted(set(warnings))

    print(f"bundle-hygiene lint - root: {root}\n")
    if errors:
        print(f"ERRORS ({len(errors)}):")
        for x in errors:
            print("  " + x)
        print()
    if warnings:
        print(f"WARNINGS ({len(warnings)}) - demotion candidates; the Weave rules each:")
        for x in warnings:
            print("  " + x)
        print()
    if not errors and not warnings:
        print("clean - no invalid types, no canon frontmatter stranded in a bundle.\n")
    print(f"summary: {len(errors)} errors, {len(warnings)} warnings")
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
