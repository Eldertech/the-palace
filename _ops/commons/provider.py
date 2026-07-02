"""The Commons — provider protocols.

Three thin protocols over one ownership mixin, because the three resource shapes
share only identity + ownership, not a lifecycle:

  InstanceProvider — provisioned instances (pods/VMs): create / list / terminate.
  LeaseProvider    — rate/budget slices: acquire / release (advisory, board-backed).
  StorageProvider  — namespaced storage: prefix ownership + stale-prefix reaping.

A single ABC would force every concrete class to stub two-thirds of its surface
(what is `terminate()` on a budget slice?). These keep each provider's surface true.
To add a provider, copy providers/TEMPLATE.py.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field

from . import identity


@dataclass
class Resource:
    """A single provisioned thing an agent owns (a pod, a VM, ...)."""
    id: str
    name: str
    owner_slug: str | None          # parsed from the name/tag; None = not Commons-managed
    created_ts: float | None        # epoch seconds, or None if the API doesn't expose it
    kind: str                       # "pod", "vm", ...
    provider: str                   # provider registry name, e.g. "runpod_pod"
    raw: dict = field(default_factory=dict)


@dataclass
class Lease:
    """An advisory claim on a scarce shared key (an account, a rate budget)."""
    key: str
    holder_slug: str
    acquired_ts: float
    released: bool = False


class OwnershipMixin:
    """Identity + ownership — the only leg all three provider shapes share."""

    def slug(self) -> str:
        return identity.agent_slug()

    def owner_tag(self) -> str:
        return identity.owner_tag()

    def owns(self, r: Resource) -> bool:
        return r.owner_slug is not None and r.owner_slug == self.slug()

    def owner_of(self, r: Resource) -> str | None:
        return r.owner_slug


class InstanceProvider(OwnershipMixin, ABC):
    """Provisioned instances tagged with `owner=<slug>` (name suffix / metadata)."""
    name: str = "instance"
    kind: str = "instance"

    @abstractmethod
    def create(self, spec: dict) -> Resource: ...

    @abstractmethod
    def list_all(self) -> list[Resource]:
        """EVERY instance on the account with owner attributed (reaper-only, privileged)."""

    def list_mine(self) -> list[Resource]:
        """Only THIS agent's instances — the scoped view every guard/cull is built on."""
        return [r for r in self.list_all() if self.owns(r)]

    @abstractmethod
    def terminate(self, resource: Resource) -> bool: ...


class LeaseProvider(OwnershipMixin, ABC):
    """Advisory leases over a scarce shared key, coordinated on the STIGMERGY board."""
    name: str = "lease"

    @abstractmethod
    def acquire(self, key: str, enforcement: str = "advisory") -> Lease: ...

    @abstractmethod
    def release(self, lease: Lease) -> None: ...

    @abstractmethod
    def holders(self, key: str) -> list[Lease]:
        """Currently-active (fresh, unreleased) holders of `key`, from the board."""


class StorageProvider(OwnershipMixin, ABC):
    """Namespaced object storage; ownership by key prefix `owner=<slug>/`."""
    name: str = "storage"

    @abstractmethod
    def list_mine_prefixes(self) -> list[str]: ...

    @abstractmethod
    def stale_prefixes(self, ttl_seconds: float) -> list[str]: ...

    @abstractmethod
    def reap_prefix(self, prefix: str) -> bool: ...
