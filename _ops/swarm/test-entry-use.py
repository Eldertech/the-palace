#!/usr/bin/env python3
"""Tests for entry-use.py — builds a throwaway git palace with dated commits and checks each rule:
page days, bundle days, one day per session, sweeps earn no days, links count once per linker,
and a title rename forms no new links.

  python3 _ops/swarm/test-entry-use.py      # exits 0 on ALL PASS
"""
import importlib.util, os, subprocess, sys, tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("entry_use", HERE / "entry-use.py")
eu = importlib.util.module_from_spec(spec)
spec.loader.exec_module(eu)

FAILS = []


def check(name, cond):
    print(("  PASS " if cond else "  FAIL ") + name)
    if not cond:
        FAILS.append(name)


def entry(root, rel, body="", links=()):
    p = root / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    fm = "---\ntitle: %s\ntype: concept\nlinks:\n" % p.stem
    fm += "".join('  - target: "[[%s]]"\n    type: connects-to\n' % t for t in links)
    p.write_text(fm + "---\n" + body + "\n", encoding="utf-8")


def commit(root, day, msg):
    env = {**os.environ, "GIT_AUTHOR_DATE": f"{day}T12:00:00", "GIT_COMMITTER_DATE": f"{day}T12:00:00"}
    subprocess.run(["git", "-C", str(root), "add", "-A"], check=True)
    subprocess.run(["git", "-C", str(root), "commit", "-qm", msg], check=True, env=env)


with tempfile.TemporaryDirectory() as tmp:
    root = Path(tmp)
    subprocess.run(["git", "-C", tmp, "init", "-q"], check=True)
    subprocess.run(["git", "-C", tmp, "config", "user.email", "t@t"], check=True)
    subprocess.run(["git", "-C", tmp, "config", "user.name", "t"], check=True)

    entry(root, "Alpha.md", "Alpha leans on [[Beta]].")
    entry(root, "Beta.md", links=["Alpha"])
    commit(root, "2026-01-05", "seed Alpha and Beta")

    (root / "Alpha").mkdir()
    (root / "Alpha" / "Alpha — scroll.md").write_text("---\ntitle: Alpha — scroll\n---\nnow\n")
    commit(root, "2026-01-10", "Alpha's scroll")
    entry(root, "Alpha.md", "Alpha leans on [[Beta]], and grew.")
    commit(root, "2026-01-10", "Alpha grows the same day")

    for i in range(11):   # one commit, eleven entries: a sweep
        entry(root, f"Swept {i}.md", links=["Alpha"])
    entry(root, "Beta.md", "touched in the sweep", links=["Alpha"])
    commit(root, "2026-02-01", "sweep: eleven entries")

    subprocess.run(["git", "-C", tmp, "mv", "Beta.md", "Delta.md"], check=True)
    entry(root, "Delta.md", "touched in the sweep", links=["Alpha"])
    entry(root, "Alpha.md", "Alpha leans on [[Delta]], and grew.")
    commit(root, "2026-03-01", "rename Beta to Delta")

    entry(root, "Gamma.md", "a new page that reaches for [[Alpha]] twice: [[Alpha|here]].")
    commit(root, "2026-03-20", "Gamma links to Alpha")

    data = eu.compute(root, window_days=30, today="2026-03-25")
    E = data["entries"]
    a, d, g = E["Alpha"], E["Delta"], E["Gamma"]

    print("== entry use ==")
    check("Alpha page days: seed, same-day grow counted once, rename edit (3)", a["page"] == 3)
    check("Alpha bundle days: its scroll (1)", a["bundle"] == 1)
    check("the eleven-entry commit is a sweep", data["meta"]["sweeps_skipped"] == 1)
    check("a sweep earns no page day (Swept 0 has 0)", E["Swept 0"]["page"] == 0)
    check("a sweep's links still count (Swept 0..10 linked Alpha)",
          all(f"Swept {i}" in eu.compute(root, today="2026-03-25", detail=True)["entries"]["Alpha"]["linked_by"]
              for i in range(11)))
    check("Alpha linked by Delta (as Beta), 11 swept, Gamma once = 13", a["linked"] == 13)
    check("rename resolves history: Delta's page days include Beta's seed", d["page"] == 2)
    check("rename forms no link: Delta linked only by Alpha, first on the seed day",
          d["linked"] == 1 and eu.compute(root, today="2026-03-25", detail=True)
          ["entries"]["Delta"]["linked_by"] == {"Alpha": "2026-01-05"})
    check("use = page + bundle + linked", a["use"] == a["page"] + a["bundle"] + a["linked"])
    check("last_used is the latest of any kind", a["last_used"] == "2026-03-20")
    check("recent window counts only its days (Alpha: rename edit + Gamma's link = 2)",
          a["recent"]["use"] == 2 and a["recent"]["page"] == 1 and a["recent"]["linked"] == 1)
    check("Gamma: one page day, nothing links to it", g["page"] == 1 and g["linked"] == 0)

print("\nALL PASS" if not FAILS else f"\n{len(FAILS)} FAILED")
sys.exit(1 if FAILS else 0)
