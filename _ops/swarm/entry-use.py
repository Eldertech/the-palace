#!/usr/bin/env python3
"""Entry use — how each palace entry is being used, read from git (SCHEMA — Reference §3, v1.26).

The palace used to ask every agent to hand-bump `activation_count` / `last_activated` in an
entry's frontmatter whenever it read the page. Almost nobody could (a child may not write the
house), so the number measured who remembered, not what happened. Use is computed here instead,
from the record, and never written back into an entry.

Three kinds of activity count as use:

  page     days the entry's own .md was edited
  bundle   days anything in its bundle folder was edited — faces, scroll, memory, workshop.
           This is where a page is played, made with, and run, so it is the strongest signal
           that the page is being USED rather than only described.
  linked   other entries that formed a link to it — a typed link or a body [[wikilink]] —
           counted once per linking entry, on the day the link first appeared

`use` is the sum of the three. `last_used` is the latest day any of them happened.
Everything is reported all-time and over a recent window (default 90 days).

Sweeps are not use. A commit that edits more than --sweep entries (default 10) is maintenance —
a schema migration, a mass rename, a scroll refresh, a Weave's frontmatter pass — so it earns no
page or bundle days. Its links still count: a Weave that forms a link has formed a link. Title renames resolve
through git's rename records, so a rename that rewrites every [[Old]] into [[New]] forms nothing.

Days, not commits: one session that commits twelve times is one day of use.

Usage:
  python3 _ops/swarm/entry-use.py                   # table, most-used (recent) first
  python3 _ops/swarm/entry-use.py --json out.json   # the full record ('-' for stdout)
  python3 _ops/swarm/entry-use.py --entry "Kuramoto Coupling"
Importable: `compute(palace_root) -> dict` (the map builder and the Stigmergy app read it).
"""
import argparse, datetime, json, re, subprocess, sys
from collections import defaultdict
from pathlib import Path

PALACE = Path(__file__).resolve().parent.parent.parent

CANON_TYPES = {"concept", "hub", "project", "source", "meta",
               "practice", "person", "question", "spore", "specialist", "maker"}
EXCLUDE_PARTS = {".git", ".obsidian", ".claude", "__pycache__", "node_modules", "venv", ".venv",
                 ".venvs", "dist", "build", ".next", ".cache", "site-packages", "_tools",
                 "_manim_media"}
TYPE_RE = re.compile(r"^type:\s*['\"]?([A-Za-z\-]+)", re.M)
WIKI_RE = re.compile(r"\[\[([^\]\n]+?)\]\]")
COMMIT_MARK = "\x1ecommit "

DEFAULT_SWEEP = 10
DEFAULT_WINDOW = 90


def _frontmatter(p: Path):
    """The YAML block between the opening and closing `---`, or None."""
    try:
        with open(p, encoding="utf-8") as f:
            if f.readline().rstrip("\n") != "---":
                return None
            lines = []
            for ln in f:
                if ln.rstrip("\n") == "---":
                    return "".join(lines)
                lines.append(ln)
    except (OSError, UnicodeDecodeError):
        pass
    return None


def _entries(root: Path):
    """title -> relative path, for every .md carrying a canonical `type:` (the map's node rule)."""
    out = {}
    for p in root.rglob("*.md"):
        if p.is_symlink() or any(part in EXCLUDE_PARTS for part in p.parts):
            continue
        fm = _frontmatter(p)
        if fm is None:
            continue
        ty = TYPE_RE.search(fm)
        if ty and ty.group(1).lower() in CANON_TYPES:
            out.setdefault(p.stem, str(p.relative_to(root)))
    return out


def _git(root: Path, *args):
    return subprocess.run(["git", "-C", str(root), "-c", "core.quotePath=false", *args],
                          capture_output=True, text=True,
                          errors="replace", check=True).stdout


def _target(raw: str):
    t = raw.split("|")[0].split("#")[0].strip()
    if t.endswith(".md"):
        t = t[:-3]
    return t.rsplit("/", 1)[-1].strip()


class _Resolver:
    """Maps any path or link target, current or historical, to the entry that owns it."""

    def __init__(self, root: Path, entries: dict):
        self.entries = entries
        self.alias = {}           # old title -> newer title (from git rename records)
        self.bundle_file = {}     # stem of a file inside a bundle -> owning entry
        for title, rel in entries.items():
            page = root / rel
            bundle = page.parent if page.parent.name == title else page.with_suffix("")
            if bundle.is_dir():
                for f in bundle.rglob("*"):
                    if f.is_file() and not any(part in EXCLUDE_PARTS for part in f.parts):
                        self.bundle_file.setdefault(f.stem, title)

    def title(self, name: str):
        seen = set()
        while name in self.alias and name not in seen:
            seen.add(name)
            name = self.alias[name]
        return name if name in self.entries else None

    def owner(self, path: str):
        """(entry, 'page'|'bundle') for a repo path, or (None, None)."""
        parts = path.split("/")
        if any(part in EXCLUDE_PARTS for part in parts):
            return None, None
        if parts[-1].endswith(".md"):
            t = self.title(parts[-1][:-3])
            if t:
                return t, "page"
        for part in reversed(parts[:-1]):   # deepest bundle folder wins
            t = self.title(part)
            if t:
                return t, "bundle"
        return None, None

    def link(self, raw: str):
        name = _target(raw)
        return self.title(name) or self.bundle_file.get(name)


def _commits(root: Path, resolver: _Resolver):
    """Newest-first list of (sha, day, [(status, old, new)]), learning title renames on the way."""
    log = _git(root, "log", "--no-merges", "-M", "--name-status",
               f"--format={COMMIT_MARK}%H %ad", "--date=short")
    commits = []
    for block in log.split(COMMIT_MARK)[1:]:
        lines = block.strip("\n").split("\n")
        sha, day = lines[0].split(" ", 1)
        changes = []
        for ln in lines[1:]:
            if not ln.strip():
                continue
            cols = ln.split("\t")
            status = cols[0]
            if status.startswith("R") and len(cols) == 3:
                old, new = cols[1], cols[2]
                if old.endswith(".md") and new.endswith(".md"):
                    o, n = Path(old).stem, Path(new).stem
                    if o != n and o not in resolver.entries:
                        resolver.alias.setdefault(o, n)
                changes.append((status, old, new))
            elif len(cols) >= 2:
                changes.append((status, cols[-1], cols[-1]))
        commits.append((sha, day, changes))
    return commits


def _links_formed(root: Path, resolver: _Resolver):
    """{(source, target): first day} — net-new [[targets]] per file per commit, oldest day kept."""
    diff = _git(root, "log", "--no-merges", "-M", "-p", "--unified=0", "--no-color",
                f"--format={COMMIT_MARK}%H %ad", "--date=short", "--", "*.md")
    first = {}
    for block in diff.split(COMMIT_MARK)[1:]:
        day = block[:block.index("\n")].split(" ", 1)[1]
        for fdiff in block.split("\ndiff --git ")[1:]:
            path = None
            added, removed = defaultdict(int), defaultdict(int)
            for ln in fdiff.split("\n"):
                if ln.startswith("+++ "):
                    path = ln[6:].rstrip("\t") if ln.startswith("+++ b/") else None
                elif ln.startswith("--- "):
                    continue
                elif ln.startswith("+"):
                    for raw in WIKI_RE.findall(ln):
                        added[raw] += 1
                elif ln.startswith("-"):
                    for raw in WIKI_RE.findall(ln):
                        removed[raw] += 1
            if not path or not added:
                continue
            src, _ = resolver.owner(path)
            src = src or path
            net = defaultdict(int)
            for raw, n in added.items():
                t = resolver.link(raw)
                if t:
                    net[t] += n
            for raw, n in removed.items():
                t = resolver.link(raw)
                if t:
                    net[t] -= n
            for t, n in net.items():
                if n > 0 and t != src:
                    key = (src, t)
                    if key not in first or day < first[key]:
                        first[key] = day
    return first


def compute(root: Path = PALACE, window_days: int = DEFAULT_WINDOW, sweep: int = DEFAULT_SWEEP,
            today: str = None, detail: bool = False):
    root = Path(root)
    entries = _entries(root)
    resolver = _Resolver(root, entries)
    commits = _commits(root, resolver)
    links = _links_formed(root, resolver)
    today = today or datetime.date.today().isoformat()
    since = (datetime.date.fromisoformat(today) - datetime.timedelta(days=window_days)).isoformat()

    page_days, bundle_days = defaultdict(set), defaultdict(set)
    sweeps = 0
    for _sha, day, changes in commits:
        touched = {}
        for _status, _old, new in changes:
            t, kind = resolver.owner(new)
            if t:
                touched.setdefault(t, set()).add(kind)
        if len(touched) > sweep:
            sweeps += 1
            continue
        for t, kinds in touched.items():
            if "page" in kinds:
                page_days[t].add(day)
            if "bundle" in kinds:
                bundle_days[t].add(day)

    linkers = defaultdict(dict)   # target -> {source: first day}
    for (src, t), day in links.items():
        linkers[t][src] = day

    def tally(days_p, days_b, link_days, floor):
        p = sum(1 for d in days_p if d >= floor)
        b = sum(1 for d in days_b if d >= floor)
        l = sum(1 for d in link_days if d >= floor)
        return {"page": p, "bundle": b, "linked": l, "use": p + b + l}

    out = {}
    for title, rel in sorted(entries.items()):
        dp, db, dl = page_days[title], bundle_days[title], list(linkers[title].values())
        every = list(dp) + list(db) + dl
        out[title] = {
            "path": rel,
            **tally(dp, db, dl, ""),
            "last_used": max(every) if every else None,
            "recent": tally(dp, db, dl, since),
        }
        if detail:
            out[title]["page_days"] = sorted(dp)
            out[title]["bundle_days"] = sorted(db)
            out[title]["linked_by"] = dict(sorted(linkers[title].items(), key=lambda kv: kv[1]))
    head = _git(root, "rev-parse", "--short", "HEAD").strip()
    return {"meta": {"generated": today, "head": head, "window_days": window_days,
                     "window_since": since, "sweep_threshold": sweep,
                     "commits_read": len(commits), "sweeps_skipped": sweeps,
                     "entry_count": len(out)},
            "entries": out}


def main():
    ap = argparse.ArgumentParser(description="How each palace entry is being used, from git.")
    ap.add_argument("--json", metavar="PATH", help="write the full record ('-' for stdout)")
    ap.add_argument("--entry", help="show one entry, with who linked to it")
    ap.add_argument("--window", type=int, default=DEFAULT_WINDOW, help="recent window in days")
    ap.add_argument("--sweep", type=int, default=DEFAULT_SWEEP,
                    help="a commit touching more entries than this is a sweep, not use")
    ap.add_argument("--top", type=int, default=30, help="rows in the table")
    ap.add_argument("--root", type=Path, default=PALACE)
    a = ap.parse_args()

    data = compute(a.root, a.window, a.sweep, detail=bool(a.entry))
    if a.json:
        text = json.dumps(data, indent=2, ensure_ascii=False)
        if a.json == "-":
            sys.stdout.write(text + "\n")
        else:
            Path(a.json).write_text(text + "\n", encoding="utf-8")
            print(f"wrote {a.json} ({data['meta']['entry_count']} entries)")
        return
    m = data["meta"]
    if a.entry:
        e = data["entries"].get(a.entry)
        if not e:
            sys.exit(f"no entry titled {a.entry!r}")
        print(json.dumps({a.entry: e}, indent=2, ensure_ascii=False))
        return
    rows = sorted(data["entries"].items(),
                  key=lambda kv: (-kv[1]["recent"]["use"], -kv[1]["use"], kv[0]))
    print(f"entry use @ {m['head']} — {m['entry_count']} entries, {m['commits_read']} commits "
          f"({m['sweeps_skipped']} sweeps skipped), recent = since {m['window_since']}")
    print(f"{'recent':>6} {'page':>5} {'bndl':>5} {'link':>5} {'all':>5}  {'last used':<10}  entry")
    for title, e in rows[:a.top]:
        r = e["recent"]
        print(f"{r['use']:>6} {r['page']:>5} {r['bundle']:>5} {r['linked']:>5} {e['use']:>5}  "
              f"{e['last_used'] or '—':<10}  {title}")


if __name__ == "__main__":
    main()
