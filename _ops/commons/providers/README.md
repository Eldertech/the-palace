# Adding a resource to The Commons

The whole point of The Commons is that adding the *next* shared service is a recipe,
not a core change. No file under `_ops/commons/` outside `providers/` should need
editing to add a provider.

## The five obligations (what every provider guarantees)

1. **identity** — one per-agent slug (`identity.agent_slug()`), shared across all services.
2. **ownership** — tag everything you create with `owner=<slug>`.
3. **scoping** — `list_mine()` never enumerates-all-then-acts-all; it filters `list_all()` by `owns()`.
4. **leasing** — serialize on genuinely-scarce singletons (advisory today; see `../lease.py`).
5. **reaping** — leaks are attributable and cleanable (`../reaper.py` sweeps `list_all()`).

## Steps

1. **Pick the shape** and subclass the matching protocol in `../provider.py`:
   | shape | protocol | methods |
   |---|---|---|
   | instances (pods / VMs) | `InstanceProvider` | `create`, `list_all`, `terminate` (`list_mine` inherited) |
   | rate / budget (API keys) | `LeaseProvider` | `acquire`, `release`, `holders` |
   | object storage (buckets) | `StorageProvider` | `list_mine_prefixes`, `stale_prefixes`, `reap_prefix` |

2. **Tag ownership** using the mechanism your API allows, all derived from the slug:
   - name suffix — `identity.owner_name(base)` → `"<base>--<slug>"` (RunPod: name is the only handle).
   - metadata tag — `identity.owner_tag()` → `"owner=<slug>"` (AWS/Modal resource tags).
   - key prefix — `f"{identity.owner_tag()}/"` (object storage).
   Read it back in `list_all()` so every resource carries an `owner_slug`
   (`identity.owner_of_name(name)` for name-suffix ownership). A resource with no
   owner marker gets `owner_slug=None` — the reaper treats it as not-Commons-managed
   and **never** touches it.

3. **Register** in `__init__.py` `PROVIDERS[name] = YourProvider` (the `name` attribute
   must match the key). The reaper and `commons` CLI iterate this map generically.

4. **Emit liveness** (instance providers): call `board.post(...)` with a
   `commons_liveness` payload on `create()`/poll, so the reaper protects your live
   resources (a live owner's resources are never reaped).

5. **Test** it: copy the mock-account harness from `_ops/runpod/test_multi_agent.py`
   (two slugs against one fake account) and re-assert the three collision points —
   distinct names, B can't see A's booting resource, B's cleanup/cull spares A's.

See `TEMPLATE.py` for a working skeleton and `runpod_pod.py` for the real RunPod adapter.
