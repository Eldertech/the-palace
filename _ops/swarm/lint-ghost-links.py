#!/usr/bin/env python3
"""
Ghost-Link Linter - the Weave's flag for dead body wikilinks.

Fourth mechanical scan alongside lint-link-directions.py (graph directionality),
lint-doc-drift.py (foundational-prose consistency), and lint-entry-naming.py
(entry<->filesystem naming). This one checks *reachability of reference*: body
`[[wikilinks]]` whose target resolves to no file in the vault.

Detection is mechanical; the DISPOSITION is judgment and belongs to the Weave. A dead
wikilink is not always a bug - CLAUDE.md holds that "missing connections are invitations":
a forward-ghost (a deliberate pointer to an entry that should exist but doesn't yet) reads
identically to a typo or a stale link. So every finding is a WARNING, never an error, and
this linter never gates a commit. The mind running the Weave decides per finding:
  - invitation -> leave it (a named intention to write the entry)
  - typo       -> fix the target
  - stale      -> cut the link

Obsidian resolves `[[X]]` by FILENAME (stem), across the whole vault, case-insensitively,
regardless of folder. This linter mirrors that: a link resolves if any real file anywhere
under the palace root (minus system dirs) has that stem. Embeds `![[X.png]]` resolve
against full filenames too. Frontmatter, fenced code, and inline code are not scanned -
their `[[wikilinks]]` are typed-link targets or documentation examples, not body prose.

Mechanical, deterministic, no API calls, reads markdown directly.
Exit code 0 always (flag-only, never a gate). Warnings are the review list.

Usage: python3 _ops/swarm/lint-ghost-links.py [palace-root]
       (defaults to the palace root two levels above this script)
"""
from __future__ import annotations
import os, re, sys

# Dirs never walked - system/build/dep, plus heavy tool trees. Mirrors the sibling linters.
SKIP_DIRS = {".git", ".obsidian", ".claude", "node_modules", ".venvs", "_tools",
             "venv", "__pycache__"}
# Palace-relative prefixes holding machinery/work-product markdown, not canon entries.
# A body file under any of these is not SCANNED for ghosts (its example wikilinks are
# scaffolding). These files ARE still valid resolution TARGETS - Obsidian sees them.
SKIP_SCAN_PREFIXES = ("_ops/stigmergy/app/", "_ops/stigmergy/orchestrator/",
                      "_ops/stigmergy/trickster-auto/", "_ops/swarm/",
                      "Enrichment/card-", "Enrichment/Archive/")

# Only canon entries (SCHEMA §1 type) are scanned - the graph the reader traverses.
# Bundle files / working drafts carry a title but no canon type; their stray wikilinks
# are noise, and they are exempt (same line the naming linter draws).
CANON_TYPES = {"concept", "hub", "project", "breakthrough", "source", "meta",
               "practice", "person", "question", "spore", "specialist", "maker"}

PALACE_DEFAULT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))

TYPE_RE = re.compile(r'^type:\s*(.+?)\s*$', re.M)
# Every wikilink or embed: optional leading ! (embed), then [[ ... ]] with no nested ].
WIKILINK_RE = re.compile(r'(!?)\[\[([^\]]+)\]\]')


def _unquote(val):
    val = val.strip()
    if len(val) >= 2 and val[0] == val[-1] and val[0] in ("'", '"'):
        val = val[1:-1]
    return val


def split_frontmatter(text):
    """Return (frontmatter_str_or_None, body_str). Frontmatter is the leading block
    between the first two '---' fences."""
    if not text.startswith("---"):
        return None, text
    end = text.find("\n---", 3)
    if end == -1:
        return None, text
    # advance past the closing fence line
    nl = text.find("\n", end + 1)
    if nl == -1:
        return text[3:end], ""
    return text[3:end], text[nl + 1:]


def entry_type(frontmatter):
    if not frontmatter:
        return None
    m = TYPE_RE.search(frontmatter)
    return _unquote(m.group(1)) if m else None


def strip_code(body):
    """Blank out fenced code blocks and inline code so example wikilinks in them are
    not scanned. Lines are preserved (replaced with blanks) so line numbers stay true."""
    out_lines = []
    in_fence = False
    fence_re = re.compile(r'^\s*(```|~~~)')
    for line in body.split("\n"):
        if fence_re.match(line):
            in_fence = not in_fence
            out_lines.append("")
            continue
        if in_fence:
            out_lines.append("")
            continue
        # strip inline code spans on the line
        out_lines.append(re.sub(r'`[^`]*`', "", line))
    return out_lines


def is_skip_scan(rel):
    r = rel.replace(os.sep, "/")
    return any(r.startswith(p) for p in SKIP_SCAN_PREFIXES)


def build_target_index(root):
    """All resolvable names in the vault (Obsidian namespace). Returns (stems, names):
    stems = lowercased filename-without-extension; names = lowercased full filename.
    Every file under root except SKIP_DIRS is a valid target, regardless of folder."""
    stems, names = set(), set()
    for dp, dns, fns in os.walk(root):
        dns[:] = [d for d in dns if d not in SKIP_DIRS]
        for fn in fns:
            names.add(fn.lower())
            stem = fn.rsplit(".", 1)[0] if "." in fn else fn
            stems.add(stem.lower())
    return stems, names


def link_target(raw):
    """Normalize a wikilink interior to the file it points at. Strips alias (|...),
    section (#...), and any folder path, returning the basename to resolve."""
    t = raw.split("|", 1)[0]
    t = t.split("#", 1)[0]
    t = t.strip()
    if not t:
        return None  # pure same-page section link [[#Heading]]
    # a target may be written with a folder path; Obsidian resolves on basename
    t = t.replace("\\", "/").split("/")[-1]
    return t.strip()


def check(root):
    stems, names = build_target_index(root)
    findings = []  # (rel, lineno, kind, target)
    for dp, dns, fns in os.walk(root):
        dns[:] = [d for d in dns if d not in SKIP_DIRS]
        for fn in fns:
            if not fn.endswith(".md"):
                continue
            ap = os.path.join(dp, fn)
            rel = os.path.relpath(ap, root)
            if is_skip_scan(rel):
                continue
            if os.path.islink(ap):
                continue
            try:
                with open(ap, encoding="utf-8", errors="ignore") as f:
                    text = f.read()
            except OSError:
                continue
            fm, body = split_frontmatter(text)
            if entry_type(fm) not in CANON_TYPES:
                continue
            # line offset of body within file, so reported line numbers match the file
            body_start_line = text[:len(text) - len(body)].count("\n") + 1 if body else 1
            # Match per line by design: Obsidian does not resolve a wikilink whose brackets
            # span lines (`[[a\nb]]` is literal text, not a link), so a per-line scan is
            # correct — a bracket pair split across lines is not a dead link to flag.
            for i, line in enumerate(strip_code(body)):
                for m in WIKILINK_RE.finditer(line):
                    is_embed = m.group(1) == "!"
                    tgt = link_target(m.group(2))
                    if tgt is None:
                        continue
                    low = tgt.lower()
                    if is_embed:
                        # embeds may carry an extension (image/note); resolve either way
                        if low in names or low in stems:
                            continue
                        stem = low.rsplit(".", 1)[0] if "." in low else low
                        if stem in stems:
                            continue
                        kind = "embed"
                    else:
                        if low in stems:
                            continue
                        kind = "link"
                    findings.append((rel, body_start_line + i, kind, tgt))
    return findings


def main():
    root = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else PALACE_DEFAULT)
    if not os.path.isdir(root):
        sys.exit(f"not a directory: {root}")

    findings = sorted(set(check(root)))
    print(f"ghost-link lint - root: {root}\n")
    if findings:
        print(f"WARNINGS ({len(findings)}) - dead body wikilinks; the Weave decides "
              f"invitation / fix / cut:")
        for rel, ln, kind, tgt in findings:
            print(f'  W  ghost {kind} in {rel}:{ln}:  [[{tgt}]]  (resolves to no file)')
        print()
    else:
        print("clean - every body wikilink resolves to a file.\n")
    print(f"summary: 0 errors, {len(findings)} warnings")
    sys.exit(0)  # flag-only: ghosts never gate a commit (a ghost may be an invitation)


if __name__ == "__main__":
    main()
