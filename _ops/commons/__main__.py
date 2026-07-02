"""The `commons` CLI — one glance at the shared-resource situation, and (Phase 5)
easy cleanup.

  python3 -m commons status              # every resource across all providers + owners + age
  python3 -m commons whoami              # this agent's slug and namespace

Run from the _ops dir, or with the repo's _ops on PYTHONPATH. reap/terminate arrive
in Phase 5 (the reaper).
"""
import argparse
import sys
import time

from . import identity
from . import providers as _providers


def _age(created_ts: float | None) -> str:
    if not created_ts:
        return "age?"
    secs = max(0, int(time.time() - created_ts))
    if secs < 90:
        return f"{secs}s"
    if secs < 5400:
        return f"{secs // 60}m"
    return f"{secs // 3600}h{(secs % 3600) // 60}m"


def cmd_whoami(_args):
    slug = identity.agent_slug()
    print(f"slug       = {slug}")
    print(f"owner_tag  = {identity.owner_tag()}")
    print(f"owner_name = {identity.owner_name('<base>')}")


def cmd_status(_args):
    me = identity.agent_slug()
    print(f"agent slug: {me}\n")
    any_provider = False
    for name, prov in _providers.instance_providers():
        any_provider = True
        try:
            resources = prov.list_all()
        except Exception as e:
            print(f"[{name}] could not list: {type(e).__name__}: {e}")
            continue
        if not resources:
            print(f"[{name}] no resources")
            continue
        print(f"[{name}] {len(resources)} resource(s):")
        for r in sorted(resources, key=lambda r: (r.owner_slug or "", r.name)):
            mine = " (MINE)" if r.owner_slug == me else ""
            owner = r.owner_slug or "unmanaged"
            print(f"    {r.id:<16} {r.name:<48} owner={owner:<24} {_age(r.created_ts):>7}{mine}")
    if not any_provider:
        print("(no instance providers could be constructed — check API config)")


def main(argv=None):
    ap = argparse.ArgumentParser(prog="commons", description="The Commons — shared-resource coordination")
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("whoami", help="print this agent's slug/namespace").set_defaults(func=cmd_whoami)
    sub.add_parser("status", help="list resources across all providers with owners").set_defaults(func=cmd_status)
    args = ap.parse_args(argv)
    args.func(args)


if __name__ == "__main__":
    sys.exit(main())
