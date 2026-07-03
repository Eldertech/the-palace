#!/usr/bin/env python3
"""
Doc-Drift Linter - the Weave's checkable postcondition for foundational-doc consistency.

Companion to lint-link-directions.py. Where that linter checks the *graph* (typed-link
directionality), this one checks the *prose*: the recurring ways foundational docs drift
out of sync with each other and with the filesystem. Mechanical, deterministic, no API
calls, reads markdown directly. Exit code 0 = clean (no errors), 1 = errors found.

The six drift mechanisms (see Palace Foundational Doc Drift Assessment, 2026-06-09):
  A  unmanaged mirrors        D  path/case drift (case-insensitive-FS masked)
  B  copied facts             E  stale snapshots
  C  dangling pins            F  trigger gaps

Checks implemented:
  ERRORS (high confidence - fail the build):
  E1  Case-colliding files  - two DISTINCT real files (different inodes) differing only by
                              case. On a case-insensitive volume two spellings of ONE file
                              share an inode and are NOT a collision - those are filtered out.
  E3  Wrong-case reference   - a referenced filename whose case doesn't match the real file
                              (a case-insensitive match exists). The FS resolves it; the
                              reference still misleads agents about the canonical name.

  WARNINGS (lower confidence - review, don't necessarily block):
  W0  Broken path reference - a backtick-quoted CONCRETE path (no placeholder / command /
                              glob markers) resolving to neither a file nor a directory.
  W1  Dangling section pin  - a "[[Doc]] section" reference whose target file has no heading
                              matching those words.
  W2  Trigger coverage gap  - a **Trigger:** phrase in a ceremony spec not present in
                              CLAUDE.md's trigger table. Bracketed slots are stripped before
                              comparison ("revive [entry]" -> "revive").

Usage: python3 _ops/swarm/lint-doc-drift.py [palace-root]
       (defaults to the palace root two levels above this script)
"""
from __future__ import annotations
import os, re, sys
from collections import defaultdict

# Skipped when INDEXING the filesystem (these hold no referenceable palace artifacts).
# Note: Archive/ is intentionally NOT skipped here - docs legitimately reference archived
# files, so they must be in the index. Archive/working docs are excluded from the SCAN set
# instead (see TRANSIENT_MARKERS / foundational_scan_set).
SKIP_DIRS = {".git", ".obsidian", ".claude", "node_modules", ".venvs", "_tools",
             "venv", "__pycache__"}
REF_EXTS = (".md", ".py", ".jsonl", ".json", ".css", ".js", ".jsx", ".html",
            ".svg", ".tex", ".mjs", ".sh", ".yaml", ".yml")
# Markers that mean a backtick token is a template/command/glob, not a concrete path.
PLACEHOLDER_CHARS = set("[]<>{}|*")
PLACEHOLDER_STRS = ("...", "…", "  ")
COMMAND_WORDS = ("grep", "ls ", "cd ", "rm ", "mv ", "cp ", "node ", "python", "git ",
                 "cat ", "echo ", "find ", "ls-", "--", "<date>", "YYYY")
PLACEHOLDER_STEMS = {"foo", "entry", "entryname", "theme", "ceremony name", "slug",
                     "any-entry", "entry name", "x"}

PALACE_DEFAULT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))

# Illustrative-example allowlist. Docs that describe the linters (or SCHEMA rules about
# naming) deliberately quote a *wrong* path to show what a broken/miscased reference looks
# like - e.g. Weave Ceremony §2f explains the entry-naming linter's E1 error by showing
# `Modes of collaboration/` beside `Modes of Collaboration.md`. Those strings are
# documentation, not real references, so path/case checks must not flag them. The allowlist
# is keyed on (citing-file, exact-token) so it stays precise: it exempts only the specific
# example in the specific doc, never masking a genuine drift elsewhere in the same file. To
# add an example that trips the linter, add its (relpath, token) pair here - don't edit the
# doc's example string (it's correct as documentation).
EXAMPLE_REF_ALLOWLIST = {
    ("_ops/Weave Ceremony.md", "Modes of collaboration/"),
}


def walk(root):
    for dp, dns, fns in os.walk(root):
        dns[:] = [d for d in dns if d not in SKIP_DIRS]
        for fn in fns:
            ap = os.path.join(dp, fn)
            yield ap, os.path.relpath(ap, root), False  # file
        yield dp, os.path.relpath(dp, root), True        # dir


def build_index(root):
    files = set(); dirs = set()
    lower_file = defaultdict(list)        # lower(relpath) -> [(relpath, inode), ...]
    basenames_lower = defaultdict(list)   # lower(basename) -> [relpath, ...]
    for ap, rp, is_dir in walk(root):
        if is_dir:
            dirs.add(rp.rstrip("/") + "/")
            continue
        files.add(rp)
        try:
            ino = os.stat(ap).st_ino
        except OSError:
            ino = -1
        lower_file[rp.lower()].append((rp, ino))
        basenames_lower[os.path.basename(rp).lower()].append(rp)
    return files, dirs, lower_file, basenames_lower


def check_case_collisions(lower_file):
    """E1 - distinct inodes that differ only by case (genuine collision, not one file)."""
    out = []
    for lp, entries in sorted(lower_file.items()):
        inodes = {ino for _, ino in entries if ino >= 0}
        names = sorted({rp for rp, _ in entries})
        if len(names) > 1 and len(inodes) > 1:
            out.append("E1  case-colliding distinct files (edit to one diverges from the other): "
                       + "  vs  ".join(names))
    return out


PATH_RE = re.compile(r"`([^`\n]+?)`")


def is_concrete_path(tok):
    t = tok.strip()
    if not t or t.startswith(("http", "[[", "$", "//", "@", ".", "/")):
        return False          # leading "." kills bare-extension fragments (`.md`, `.svg`)
    if "://" in t:
        return False          # protocol URIs (obsidian://, file://, computer:///)
    if any(c in PLACEHOLDER_CHARS for c in t):
        return False
    if any(s in t for s in PLACEHOLDER_STRS):
        return False
    low = t.lower()
    if any(w in low for w in COMMAND_WORDS):
        return False
    stem = os.path.splitext(os.path.basename(t.rstrip("/")))[0].lower()
    if stem in PLACEHOLDER_STEMS:
        return False
    # placeholder example words appearing anywhere in the token (README's `Foo - handoff.md`,
    # SCHEMA's `Foo - source - borges.md`)
    if re.search(r"\b(foo|borges|entryname|nnn|yyyy|slug)\b", low):
        return False
    # must be a dir-ish path or a real-extension file
    return t.endswith("/") or ("/" in t and low.endswith(REF_EXTS)) or low.endswith(REF_EXTS)


def check_path_refs(root, files, dirs, basenames_lower, scan):
    """E3 wrong-case (ERROR) + W0 broken concrete path (WARN). Resolves refs both
    palace-root-relative AND relative to the citing doc's own directory."""
    errs, warns = [], []
    for rp in scan:
        docdir = os.path.dirname(rp)
        try:
            text = open(os.path.join(root, rp), encoding="utf-8", errors="ignore").read()
        except OSError:
            continue
        for m in PATH_RE.finditer(text):
            raw = m.group(1)
            if not is_concrete_path(raw):
                continue
            if (rp, raw.strip()) in EXAMPLE_REF_ALLOWLIST:
                continue  # deliberate illustrative example, not a real reference
            ref = raw.strip().lstrip("./")
            # candidate resolutions: as-given (root-relative) and doc-relative
            cands = {ref}
            if docdir:
                cands.add(os.path.normpath(os.path.join(docdir, ref)))
            if ref.endswith("/"):
                norm = {c.rstrip("/") + "/" for c in cands}
                if norm & dirs:
                    continue
                ci = [d for d in dirs if d.lower() in {c.lower() for c in norm}]
                if ci:
                    errs.append(f"E3  wrong-case dir ref in {rp}:  `{raw}`  ->  {ci[0]}")
                else:
                    warns.append(f"W0  broken dir ref in {rp}:  `{raw}`  (no such directory)")
                continue
            if cands & files:
                continue
            base = os.path.basename(ref)
            ci_base = basenames_lower.get(base.lower(), [])
            if ci_base:
                if not any(os.path.basename(r) == base for r in ci_base):
                    errs.append(f"E3  wrong-case ref in {rp}:  `{raw}`  ->  real file is  {ci_base[0]}")
            else:
                rel_ci = [r for r in files if r.lower() in {c.lower() for c in cands}]
                if rel_ci:
                    errs.append(f"E3  wrong-case ref in {rp}:  `{raw}`  ->  real file is  {rel_ci[0]}")
                else:
                    warns.append(f"W0  broken path ref in {rp}:  `{raw}`  (no such file)")
    return errs, warns


HEADING_RE = re.compile(r"^#{1,6}\s+(.*\S)\s*$", re.M)
PIN_RE = re.compile(r"\[\[([^\]]+?)\]\]\s*§\s*([A-Za-z0-9][^.,;:\n)]{2,40})")


def resolve_wikilink(name, basenames_lower):
    name = name.split("|")[0].split("#")[0].strip()
    return basenames_lower.get((name + ".md").lower(), [])


def check_section_pins(root, basenames_lower, scan):
    warns = []
    cache = {}
    for rp in scan:
        try:
            text = open(os.path.join(root, rp), encoding="utf-8", errors="ignore").read()
        except OSError:
            continue
        for m in PIN_RE.finditer(text):
            doc, section = m.group(1), m.group(2).strip()
            targets = resolve_wikilink(doc, basenames_lower)
            if not targets:
                continue
            tgt = os.path.join(root, targets[0])
            if tgt not in cache:
                try:
                    ttext = open(tgt, encoding="utf-8", errors="ignore").read()
                except OSError:
                    ttext = ""
                cache[tgt] = [h.lower() for h in HEADING_RE.findall(ttext)]
            words = [w for w in re.findall(r"[A-Za-z]+", section.lower()) if len(w) > 2]
            if not words:
                continue
            if not any(any(w in h for w in words) for h in cache[tgt]):
                warns.append(f"W1  dangling section pin in {rp}:  [[{doc}]] §{section}  "
                             f"(no matching heading in {targets[0]})")
    return warns


def strip_slots(phrase):
    """'revive [entry name]' -> 'revive' ; collapse whitespace."""
    return re.sub(r"\s+", " ", re.sub(r"\[[^\]]*\]", "", phrase)).strip()


def check_trigger_coverage(root, basenames_lower):
    warns = []
    claude = basenames_lower.get("claude.md", [])
    if not claude:
        return warns
    ctext = open(os.path.join(root, claude[0]), encoding="utf-8", errors="ignore").read()
    m = re.search(r"Ceremony Triggers(.+?)(?:\n##\s|\Z)", ctext, re.S)
    table = m.group(1) if m else ctext
    claude_triggers = {strip_slots(q.lower()) for q in re.findall(r'"([^"]+)"', table)}
    claude_triggers |= {strip_slots(q.lower()) for q in re.findall(r"[“”]([^“”]+)[“”]", table)}
    claude_triggers.discard("")

    for ap, rp, is_dir in walk(root):
        if is_dir or not rp.lower().endswith(".md"):
            continue
        if "ceremony" not in os.path.basename(rp).lower():
            continue
        try:
            text = open(ap, encoding="utf-8", errors="ignore").read()
        except OSError:
            continue
        for tm in re.finditer(r"\*\*Trigger:?\*\*\s*(.+)", text):
            for a, b in re.findall(r'"([^"]+)"|[“”]([^“”]+)[“”]', tm.group(1)):
                phrase = strip_slots((a or b).lower())
                if not phrase:
                    continue
                if not any(phrase in ct or ct in phrase for ct in claude_triggers):
                    warns.append(f"W2  trigger not in CLAUDE.md table:  \"{phrase}\"  (defined in {rp})")
    return warns


# Transient/working docs are EXPECTED to reference moved/archived/example paths; excluding
# them from path checks keeps the signal on the canonical spec layer. (Case checks still
# run everywhere via E3 since a wrong-case canonical name is wrong wherever it appears.)
TRANSIENT_MARKERS = ("handoff", "audit", "to-do", "graffiti", "archive", "log",
                     "migration", "working doc", "staging", "assessment", "proposal",
                     "deposit archive", "map ")


def is_transient(rp):
    low = os.path.basename(rp).lower()
    return any(mk in low for mk in TRANSIENT_MARKERS)


def foundational_scan_set(files, include_transient=False):
    out = []
    for rp in files:
        if not rp.lower().endswith(".md"):
            continue
        parts = rp.split(os.sep)
        is_floor = len(parts) == 1
        is_ops = parts[0] == "_ops" and (len(parts) == 2 or "design-system" in rp)
        if not (is_floor or is_ops):
            continue
        if not include_transient and is_transient(rp):
            continue
        out.append(rp)
    return out


def main():
    root = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else PALACE_DEFAULT)
    if not os.path.isdir(root):
        sys.exit(f"not a directory: {root}")

    files, dirs, lower_file, basenames_lower = build_index(root)
    scan = foundational_scan_set(files)

    errors, warns = [], []
    errors += check_case_collisions(lower_file)
    e, w = check_path_refs(root, files, dirs, basenames_lower, scan)
    errors += e; warns += w
    warns += check_section_pins(root, basenames_lower, scan)
    warns += check_trigger_coverage(root, basenames_lower)

    errors = sorted(set(errors)); warns = sorted(set(warns))

    print(f"doc-drift lint - root: {root}")
    print(f"  scanned {len(scan)} foundational docs, indexed {len(files)} files, {len(dirs)} dirs\n")
    if errors:
        print(f"ERRORS ({len(errors)}):")
        for x in errors:
            print("  " + x)
        print()
    if warns:
        print(f"WARNINGS ({len(warns)}):")
        for x in warns:
            print("  " + x)
        print()
    if not errors and not warns:
        print("clean - no drift detected.")
    print(f"summary: {len(errors)} errors, {len(warns)} warnings")
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
