#!/usr/bin/env python3
"""
New-Entry Catch-Up — the deterministic math behind Weave Ceremony Step 0b.

A newborn entry is the least-alive node in the palace: a deposit writes its OUTBOUND links,
but the inbound links that make it reachable live in other entries' files, and only a Weave
can place them. This helper computes the catch-up the Weave owes each newcomer, so the
coordinator pastes real numbers into `{{NEW_ENTRIES}}` rather than eyeballing the median.

It is the deterministic half (values-primary: the math is a script; the reach-toward-them
judgment is the worker's). Reads the latest palace map for inbound counts; reads `born` from the
files for newcomer detection.

Newcomer (in precedence order) = young AND under the INBOUND target, where young =
  --since-last-weave   -> git-added since the most recent 'Weave ' commit, OR born in/after
                          that commit's month (born is often month-granular; the OR catches
                          entries a git rename hid from --diff-filter=A) — use for a real Weave
  --since-commit <ref> -> same, from an explicit ref
  --since YYYY-MM      -> born >= that month
  (none)               -> activation_count == 1 (the card's Step 0b proxy)

Measured on REACH (2026-09-24): entries that point at it, plus partners on symmetric links,
which hold both ways. Originally (2026-09-23) inbound only: Step 0b exists for the links only a Weave can
place — the ones in other entries' files. Total degree hid the gap (OBS read as degree 7 with
0 inbound). Target = ~0.8 x the median inbound of established entries. Ceremony cards are map
nodes since build-map-2026-09-24.py, so ceremony links count; links from bundle files do not
(bundle files are not graph nodes).

Also lists the UNREACHABLE: inbound 0, any age (composting ones marked). Unreachable
`_ops/` files with canon frontmatter are listed apart as a bundle-hygiene question.

The worker paste block (--block) states only "currently N inbound" — never the deficit. A
number handed to a worker becomes a quota, and a quota invents links. The deficit is for the
coordinator's table. Targets are guidelines, not gates.

Usage:
  python3 _ops/swarm/new-entry-catchup.py --since-last-weave [--block|--json]   # precise, typical
  python3 _ops/swarm/new-entry-catchup.py [--since-commit <ref>] [--since 2026-06] [--map PATH]
"""
from __future__ import annotations
import glob, json, math, os, re, statistics, subprocess, sys

PALACE_ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
BORN_RE = re.compile(r'^born:\s*["\']?(\d{4}-\d{2}(?:-\d{2})?)', re.M)
ACT_RE = re.compile(r'^activation_count:\s*["\']?(\d+)', re.M)


def _git(args):
    """Run a git command in the palace root; return stdout, or None on failure."""
    try:
        out = subprocess.run(["git", "-C", PALACE_ROOT, "-c", "core.quotePath=false", *args],
                             capture_output=True, text=True, check=True)
        return out.stdout
    except (subprocess.CalledProcessError, FileNotFoundError):
        return None


def last_weave_ref():
    """The most recent formal Weave commit — its SUBJECT starts 'Weave ' (the
    'Weave — <date> — ...' convention), or None. Checks the subject line only; a plain
    --grep would false-match a body that merely mentions the Weave."""
    out = _git(["log", "-n", "400", "--format=%H %s"])
    if not out:
        return None
    for line in out.splitlines():
        h, _, subj = line.partition(" ")
        if subj.startswith("Weave "):
            return h
    return None


def git_added_md_since(ref):
    """Set of palace-relative .md paths git-added between ref and HEAD; None on git failure.
    This is the card's exact 'files git-added since the last Weave commit' — precise where
    born (often month-granular in frontmatter) is not."""
    out = _git(["diff", "--diff-filter=A", "--name-only", ref, "HEAD"])
    if out is None:
        return None
    return {ln.strip() for ln in out.splitlines() if ln.strip().endswith(".md")}


def latest_map():
    files = sorted(glob.glob(os.path.join(PALACE_ROOT, "_ops/maps/palace-map-full-*.json")))
    if not files:
        sys.exit("no palace map in _ops/maps/ — run the map builder first")
    return files[-1]


def read_born_and_act(path):
    try:
        with open(os.path.join(PALACE_ROOT, path), encoding="utf-8", errors="ignore") as f:
            head = f.read(4096)
    except OSError:
        return None, None
    b = BORN_RE.search(head)
    a = ACT_RE.search(head)
    return (b.group(1) if b else None), (int(a.group(1)) if a else None)


def ref_month(ref):
    """YYYY-MM of a commit — the born-month floor paired with the git-added rule."""
    out = _git(["log", "-1", "--format=%cs", ref])
    return out.strip()[:7] if out else None


def compute(map_path, since, added_set=None, rule="activation_count == 1 (proxy)", born_floor=None):
    """Inbound, not total degree: Step 0b exists for the links only a Weave can place —
    the ones in OTHER entries' files. Total degree hid the gap (OBS read as degree 7 with
    0 inbound). A newcomer is born since the last Weave OR git-added since it, AND under
    the inbound target — so an entry a deposit already wired well is not dragged in."""
    with open(map_path, encoding="utf-8") as f:
        data = json.load(f)
    # Reach, not raw inbound: a symmetric link (connects-to, mirrors, contradicts, couples-with)
    # holds BOTH ways (SCHEMA §4), so it reaches its source as well as its target. Counting it one
    # way told the 2026-09-24 weave that 25 newcomers were under-reached when 5 were; its walk
    # workers dutifully re-proposed the reverse of links that already existed.
    SYM = {"connects-to", "mirrors", "contradicts", "couples-with"}
    ids = {n["id"] for n in data["nodes"]}
    reach = {i: set() for i in ids}
    for e in data.get("edges", []):
        s, t = e.get("source"), e.get("target")
        if s in ids and t in ids and s != t:
            reach[t].add(s)
            if e.get("type") in SYM:
                reach[s].add(t)
    nodes = []
    for n in data["nodes"]:
        inbound = len(reach[n["id"]])
        born, act = read_born_and_act(n["path"])
        if act is None:  # fall back to the activation_count carried in the map
            act_raw = n.get("activation_count")
            act = int(act_raw) if str(act_raw).isdigit() else None
        if added_set is not None:          # git-added since the last Weave, or born since its month
            young = n["path"] in added_set or (born_floor is not None and born is not None and born >= born_floor)
        elif since:                        # born >= month (coarse; born is month-granular)
            young = born is not None and born >= since
        else:                              # proxy: never-reactivated entries
            young = act == 1
        nodes.append({"id": n["id"], "path": n["path"], "inbound": inbound,
                      "stage": n.get("stage"), "born": born, "young": young,
                      "ops_card": bool(n.get("ops_card"))})
    established = [n["inbound"] for n in nodes if not n["young"]]
    M = statistics.median(established) if established else 0
    target = round(0.8 * M)
    newcomers = [{**n, "target": target, "deficit": target - n["inbound"]}
                 for n in nodes if n["young"] and n["inbound"] < target]
    newcomers.sort(key=lambda x: (x["inbound"], x["id"]))
    unreachable = sorted(({"id": n["id"], "path": n["path"], "stage": n["stage"]}
                          for n in nodes if n["inbound"] == 0 and not n["ops_card"]), key=lambda x: x["id"])
    # An _ops/ file with canon frontmatter that nothing points to is usually working
    # substrate (a handoff, a log, a proposal) wearing entry clothes — a bundle-hygiene
    # question (demote?), not a walk target. Listed apart; never pasted to workers.
    unreachable_ops = sorted(({"id": n["id"], "path": n["path"], "stage": n["stage"]}
                              for n in nodes if n["inbound"] == 0 and n["ops_card"]), key=lambda x: x["id"])
    return {
        "rule": rule, "since": since, "median_inbound": M, "catch_up_target": target,
        "young_at_or_over_target": sum(1 for n in nodes if n["young"] and n["inbound"] >= target),
        "newcomers": newcomers, "unreachable": unreachable, "unreachable_ops": unreachable_ops,
    }


def block(result):
    """The {{NEW_ENTRIES}} paste block for worker prompts. States the present count only —
    never the deficit: a number handed to a worker becomes a quota, and a quota invents links."""
    lines = []
    if result["newcomers"]:
        lines.append("Born since the last Weave, still under-reached:")
        lines += [f"- [[{n['id']}]] (currently reached by {n['inbound']})" for n in result["newcomers"]]
    live = [u for u in result["unreachable"] if u["stage"] != "composting"]
    if live:
        lines.append("No entry points to these yet (any age):")
        lines += [f"- [[{u['id']}]]" for u in live]
    return "\n".join(lines) or "(none)"


def main():
    args = sys.argv[1:]
    since = None
    since_commit = None
    since_last_weave = False
    map_path = latest_map()
    mode = "report"
    i = 0
    while i < len(args):
        if args[i] == "--since" and i + 1 < len(args):
            since = args[i + 1]; i += 2
        elif args[i] == "--since-commit" and i + 1 < len(args):
            since_commit = args[i + 1]; i += 2
        elif args[i] == "--since-last-weave":
            since_last_weave = True; i += 1
        elif args[i] == "--map" and i + 1 < len(args):
            map_path = args[i + 1]; i += 2
        elif args[i] == "--block":
            mode = "block"; i += 1
        elif args[i] == "--json":
            mode = "json"; i += 1
        else:
            sys.exit(f"unknown arg: {args[i]}")

    # Precise git-added scoping wins over coarse born-month; both over the activation proxy.
    added_set, rule, born_floor = None, "activation_count == 1 (proxy)", None
    ref = since_commit or (last_weave_ref() if since_last_weave else None)
    if since_last_weave and not ref:
        sys.exit("could not find a prior 'Weave ' commit; pass --since-commit <ref> or --since <YYYY-MM>")
    if ref:
        added_set = git_added_md_since(ref)
        if added_set is None:
            sys.exit(f"git failed resolving files added since {ref}")
        born_floor = ref_month(ref)
        rule = f"git-added since {ref[:12]} or born >= {born_floor}, and under target"
    elif since:
        rule = f"born >= {since}"

    result = compute(map_path, since, added_set, rule, born_floor)
    if mode == "json":
        print(json.dumps(result, ensure_ascii=False, indent=2))
    elif mode == "block":
        print(block(result))
    else:
        print(f"new-entry catch-up — map: {os.path.basename(map_path)}")
        print(f"newcomer rule: {result['rule']}")
        print(f"median INBOUND (established): {result['median_inbound']}  ->  "
              f"catch-up target ~0.8×M = {result['catch_up_target']}")
        print(f"young entries already at/over target (not listed): {result['young_at_or_over_target']}\n")
        print(f"newcomers under target ({len(result['newcomers'])}) — deficit is for the coordinator, never the worker:")
        for n in result["newcomers"]:
            print(f"  [[{n['id']}]]  inbound {n['inbound']} → target {n['target']} (deficit {n['deficit']})")
        print(f"\nunreachable — inbound 0, any age ({len(result['unreachable'])}):")
        for u in result["unreachable"]:
            print(f"  [[{u['id']}]]" + ("  (composting)" if u["stage"] == "composting" else ""))
        if result["unreachable_ops"]:
            print(f"\nunreachable _ops/ files with canon frontmatter — bundle-hygiene review, not the walk ({len(result['unreachable_ops'])}):")
            for u in result["unreachable_ops"]:
                print(f"  [[{u['id']}]]  {u['path']}")
        print(f"\n{{{{NEW_ENTRIES}}}} paste block:\n{block(result)}")
    sys.exit(0)


if __name__ == "__main__":
    main()
