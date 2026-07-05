#!/usr/bin/env python3
"""
New-Entry Catch-Up — the deterministic math behind Weave Ceremony Step 0b.

A newborn entry is the least-alive node in the palace: a deposit writes its OUTBOUND links,
but the inbound links that make it reachable live in other entries' files, and only a Weave
can place them. This helper computes the catch-up the Weave owes each newcomer, so the
coordinator pastes real numbers into `{{NEW_ENTRIES}}` rather than eyeballing median degree.

It is the deterministic half (values-primary: the math is a script; the reach-toward-them
judgment is the worker's). Reads the latest palace map for degrees; reads `born` from the
files for newcomer detection.

Newcomer =
  --since YYYY-MM given -> entries with `born` >= that month (the last Weave's month), OR
  no --since          -> entries with activation_count == 1 (the card's Step 0b proxy).

For each newcomer: degree (inbound+outbound), a catch-up TARGET of ~0.8 x M (M = median
degree of established entries), and the deficit to reach it. Targets are guidelines, not
gates. The coordinator lifts the established workers' MAX_INTRODUCTIONS ~20% to fund the
catch-up; a newcomer's own worker gets a generous allotment.

Output (default: human report; --block: the {{NEW_ENTRIES}} paste block; --json: machine):
feeds extract-neighborhood.py --new-entries-file / --max-introductions.

Usage:
  python3 _ops/swarm/new-entry-catchup.py [--since 2026-06] [--map PATH] [--block|--json]
"""
from __future__ import annotations
import glob, json, math, os, re, statistics, sys

PALACE_ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
BORN_RE = re.compile(r'^born:\s*["\']?(\d{4}-\d{2}(?:-\d{2})?)', re.M)
ACT_RE = re.compile(r'^activation_count:\s*["\']?(\d+)', re.M)
BASE_MAX_INTROS = 5  # the established-worker guideline; lifted ~20% in a catch-up Weave


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


def compute(map_path, since):
    with open(map_path, encoding="utf-8") as f:
        data = json.load(f)
    nodes = []
    for n in data["nodes"]:
        degree = int(n.get("outbound_count", 0)) + int(n.get("inbound_count", 0))
        born, act = read_born_and_act(n["path"])
        if act is None:
            m = ACT_RE.search("")  # activation may be in map as string
            act_raw = n.get("activation_count")
            act = int(act_raw) if str(act_raw).isdigit() else None
        newcomer = (born is not None and born >= since) if since else (act == 1)
        nodes.append({"id": n["id"], "path": n["path"], "degree": degree,
                      "born": born, "newcomer": newcomer})
    established = [n["degree"] for n in nodes if not n["newcomer"]]
    M = statistics.median(established) if established else 0
    target = round(0.8 * M)
    newcomers = []
    for n in nodes:
        if not n["newcomer"]:
            continue
        deficit = max(0, target - n["degree"])
        newcomers.append({**n, "target": target,
                          "deficit": deficit,
                          "suggested_max_introductions": max(deficit, BASE_MAX_INTROS)})
    newcomers.sort(key=lambda x: (-x["deficit"], x["id"]))
    return {
        "since": since, "median_degree": M, "catch_up_target": target,
        "base_max_introductions": BASE_MAX_INTROS,
        "established_max_introductions": math.ceil(BASE_MAX_INTROS * 1.2),  # ~20% lift
        "newcomers": newcomers,
    }


def block(result):
    """The {{NEW_ENTRIES}} paste block for worker prompts."""
    if not result["newcomers"]:
        return "(none born since the last Weave)"
    lines = []
    for n in result["newcomers"]:
        want = f"wants ~{n['deficit']} more inbound links" if n["deficit"] else "at target"
        lines.append(f"- [[{n['id']}]] (degree {n['degree']}, {want})")
    return "\n".join(lines)


def main():
    args = sys.argv[1:]
    since = None
    map_path = latest_map()
    mode = "report"
    i = 0
    while i < len(args):
        if args[i] == "--since" and i + 1 < len(args):
            since = args[i + 1]; i += 2
        elif args[i] == "--map" and i + 1 < len(args):
            map_path = args[i + 1]; i += 2
        elif args[i] == "--block":
            mode = "block"; i += 1
        elif args[i] == "--json":
            mode = "json"; i += 1
        else:
            sys.exit(f"unknown arg: {args[i]}")

    result = compute(map_path, since)
    if mode == "json":
        print(json.dumps(result, ensure_ascii=False, indent=2))
    elif mode == "block":
        print(block(result))
    else:
        print(f"new-entry catch-up — map: {os.path.basename(map_path)}")
        print(f"newcomer rule: {'born >= ' + since if since else 'activation_count == 1 (proxy)'}")
        print(f"median degree (established): {result['median_degree']}  ->  "
              f"catch-up target ~0.8×M = {result['catch_up_target']}")
        print(f"MAX_INTRODUCTIONS: established {result['established_max_introductions']} "
              f"(~20% lift over base {result['base_max_introductions']}); "
              f"a newcomer's own worker: its suggested value below\n")
        print(f"newcomers ({len(result['newcomers'])}):")
        for n in result["newcomers"]:
            print(f"  [[{n['id']}]]  degree {n['degree']} → target {n['target']}, "
                  f"deficit {n['deficit']}  (its worker MAX_INTRODUCTIONS "
                  f"{n['suggested_max_introductions']})")
        print(f"\n{{{{NEW_ENTRIES}}}} paste block:\n{block(result)}")
    sys.exit(0)


if __name__ == "__main__":
    main()
