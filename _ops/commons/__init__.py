"""The Commons — the palace's multi-agent coordination layer for shared,
metered, external services (RunPod GPU pods, other GPU clouds, rate-limited API
keys, cloud storage). It encodes the five obligations every such tool otherwise
re-invents badly: identity, ownership, scoping, leasing, reaping.

Born 2026-07-02 out of the RunPod "dud node" outage, where two Claude agents on
one account strangled each other's pods. Principle: [[assume multi-agent]].

Submodules:
  identity  — who am I (per-agent slug) and how resources are owner-tagged.
  board     — "Python speaks validated §9": post/read the STIGMERGY blackboard.
  provider  — InstanceProvider / LeaseProvider / StorageProvider + registry.
  providers — concrete adapters (runpod_pod, runpod_serverless, ...).
  lease     — advisory (for now) capacity lease over the board.
  reaper    — cross-agent-safe cleanup of leaked resources.
"""
