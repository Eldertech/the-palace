"""TEMPLATE — copy this to add a new resource to The Commons.

Adding a service (a new GPU cloud, a rate-limited API key, a storage bucket) is a
recipe, not a core change. See providers/README.md for the full checklist. In short:

  1. Pick the shape and subclass the matching protocol from ..provider:
       instances (pods/VMs) -> InstanceProvider   (create / list_all / terminate)
       rate/budget          -> LeaseProvider       (acquire / release / holders)
       object storage       -> StorageProvider     (list_mine_prefixes / stale_prefixes / reap_prefix)
  2. Tag EVERYTHING you create with `owner=<slug>`:
       - name suffix   -> identity.owner_name(base)   (RunPod: the only handle the API gives)
       - real metadata -> identity.owner_tag()        (AWS/Modal tags)
       - key prefix    -> f"{identity.owner_tag()}/"  (object storage)
     and read it back so list_all() can attribute every resource to an owner_slug
     (identity.owner_of_name for name-suffix ownership). Un-owned -> owner_slug=None,
     which the reaper treats as not-Commons-managed and NEVER touches.
  3. Register it in providers/__init__.py PROVIDERS.
  4. Instance providers: emit a liveness heartbeat via board.post on create()/poll, so
     the reaper protects your live resources. You appear in the reaper's sweep for free.
  5. Add a mock-account test mirroring _ops/runpod/test_multi_agent.py (two slugs, then
     re-assert the three collision points: distinct names; B can't see A's booting
     resource; B's cleanup spares A's).
"""
import time

from .. import board, identity
from ..provider import InstanceProvider, Resource


class ExampleProvider(InstanceProvider):
    name = "example"          # must match its key in providers/__init__.py PROVIDERS
    kind = "example_instance"

    def __init__(self, api_key: str | None = None, steward: str = "The Commons"):
        self.steward = steward
        # self.client = SomeSDK(api_key or os.environ["EXAMPLE_KEY"])

    def create(self, spec: dict) -> Resource:
        base = spec["base"]
        name = identity.owner_name(base)                     # "<base>--<slug>" ownership in the name
        self._heartbeat(base)
        # raw = self.client.create(name=name, ...)
        raw = {"id": "example-123", "name": name}
        return Resource(id=raw["id"], name=name, owner_slug=self.slug(),
                        created_ts=time.time(), kind=self.kind, provider=self.name, raw=raw)

    def list_all(self) -> list[Resource]:
        # raw_list = self.client.list()
        raw_list: list[dict] = []
        return [Resource(id=r["id"], name=r["name"], owner_slug=identity.owner_of_name(r["name"]),
                         created_ts=r.get("created_ts"), kind=self.kind, provider=self.name, raw=r)
                for r in raw_list]

    # list_mine() is inherited — filters list_all() by owns(); do not override.

    def terminate(self, resource: Resource) -> bool:
        # return self.client.delete(resource.id)
        return True

    def _heartbeat(self, base: str) -> None:
        try:
            board.post(board.make_message(
                "BROADCAST", "GENERAL",
                {"kind": "commons_liveness", "provider": self.name, "slug": self.slug(), "base": base},
                from_=self.steward), silent=True)
        except Exception:
            pass
