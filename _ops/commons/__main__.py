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
from . import reaper as _reaper


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


def cmd_reap(args):
    mode = "cross-slug" if args.cross_slug else "self"
    summary = _reaper.reap(mode=mode, force=args.force, grace=args.grace, ttl=args.ttl)
    if summary["report_only"]:
        print(f"\nreport-only: {len(summary['candidates'])} candidate(s), terminated 0. "
              f"{'(cross-slug --force is disabled by design) ' if mode == 'cross-slug' and args.force else ''}"
              f"Re-run with --force (only valid with --self) to terminate your own leaks.")
    else:
        print(f"\nterminated {len(summary['terminated'])} of my leaked resource(s): {summary['terminated']}")


def cmd_terminate(args):
    for name, prov in _providers.instance_providers():
        for r in prov.list_all():
            if r.id == args.id:
                ok = prov.terminate(r)
                print(f"terminate {args.id} ({r.name}) via {name}: {'ok' if ok else 'UNCONFIRMED'}")
                return
    print(f"resource {args.id!r} not found on any provider")


def main(argv=None):
    ap = argparse.ArgumentParser(prog="commons", description="The Commons — shared-resource coordination")
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("whoami", help="print this agent's slug/namespace").set_defaults(func=cmd_whoami)
    sub.add_parser("status", help="list resources across all providers with owners").set_defaults(func=cmd_status)

    rp = sub.add_parser("reap", help="find/clean leaked resources (report-only unless --self --force)")
    rp.add_argument("--cross-slug", action="store_true", help="consider other agents' leaks (report-only always)")
    rp.add_argument("--force", action="store_true", help="terminate (only honored with --self)")
    rp.add_argument("--grace", type=float, default=_reaper.GRACE, help="min age (s) before a resource is eligible")
    rp.add_argument("--ttl", type=float, default=_reaper.LIVENESS_TTL, help="owner liveness window (s)")
    rp.set_defaults(func=cmd_reap)

    tm = sub.add_parser("terminate", help="terminate a specific resource by id (escape hatch)")
    tm.add_argument("id")
    tm.set_defaults(func=cmd_terminate)

    args = ap.parse_args(argv)
    args.func(args)


if __name__ == "__main__":
    sys.exit(main())
