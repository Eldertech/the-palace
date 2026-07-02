"""Provider registry — the one place every Commons provider is discoverable.

The reaper and the `commons` CLI iterate this map generically, so adding a new
service is: implement the right protocol, register it here, done — no core change.
Entries are factories (callables returning a provider) so construction (config,
API keys) is lazy and only happens for providers actually used.
"""
from .runpod_pod import RunpodPodProvider
from .runpod_serverless import RunpodServerlessProvider

# name -> factory. Keep instance providers here so the reaper can sweep them all.
PROVIDERS: dict[str, callable] = {
    "runpod_pod": RunpodPodProvider,
    "runpod_serverless": RunpodServerlessProvider,
}


def get(name: str, **kwargs):
    """Instantiate a registered provider by name."""
    if name not in PROVIDERS:
        raise KeyError(f"unknown provider {name!r}; known: {sorted(PROVIDERS)}")
    return PROVIDERS[name](**kwargs)


def instance_providers(**kwargs):
    """Instantiate every registered provider, skipping any that can't construct
    (e.g. missing API config) — yields (name, provider)."""
    from ..provider import InstanceProvider
    for name, factory in PROVIDERS.items():
        try:
            p = factory(**kwargs) if _accepts_kwargs(factory) else factory()
        except Exception as e:
            print(f"[providers] skip {name}: {type(e).__name__}: {e}")
            continue
        if isinstance(p, InstanceProvider):
            yield name, p


def _accepts_kwargs(factory) -> bool:
    try:
        import inspect
        return bool(inspect.signature(factory).parameters)
    except (ValueError, TypeError):
        return False
