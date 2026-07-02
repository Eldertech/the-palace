---
title: assume multi-agent
type: practice
pillars:
  - tools
  - practice
born: 2026-07
stage: sprout
last_activated: 2026-07
activation_count: 1
forward_vector: "I want every tool the palace builds to expect siblings from its first line — to namespace what it owns, scope what it touches, and lease what is scarce — so that two Claudes are a feature, never a collision."
links:
  - target: "[[STIGMERGY]]"
    type: emerged-from
    label: "the-palace-is-a-swarm"
  - target: "[[RunPod GPU Backend]]"
    type: connects-to
    label: "cautionary-tale"
  - target: "[[The Shop]]"
    type: connects-to
    label: "house-standard"
  - target: "[[Cooperation Yields Agency]]"
    type: couples-with
    label: "coordination-not-collision"
---

# assume multi-agent

**Build every palace tool as if two Claudes will run it at once — because they will.** The palace
is a swarm by design ([[STIGMERGY]], [[SCHEMA]] §9): multiple AI stewards plus the human node,
often working the same repo, the same services, the same accounts, at the same time. A tool that
quietly assumes it is the only caller is not simpler — it is a latent collision waiting for the
second agent to arrive.

## The cautionary tale (2026-07-02)
A full day of RunPod work read as an infrastructure outage: pods booted to `RUNNING` but ComfyUI
never came up, and the orchestrator timed out on ~10 "dud nodes" in a row. The real cause was a
**second Claude on the same RunPod account** — the pod tooling was single-tenant, and the two agents
strangled each other's pods mid-boot. Three account-wide assumptions did it: all pods shared **one
name** (so name-based cleanup killed the other's pod); the startup guard **aborted if any pod
existed** (couldn't tell mine from theirs); and the stray-sweeps did **`GET /pods` → DELETE all**
(so each agent's sweep terminated the other's booting pod). A pod killed at ~120s looks exactly
like a slow boot that never finishes. The lesson cost a day of phantom debugging. See
[[RunPod GPU Backend]] § Operational playbook.

## The discipline
When building anything that owns state or touches a shared service:

1. **Namespace what you create by agent** — pod/session/branch/file names carry a per-agent slug
   (the `session_id` kebab-slug from [[SCHEMA]] §9 is the natural key), never one global name.
2. **Scope every read/list/delete to your own namespace** — `list *my* pods`, `sweep *my* strays`,
   `guard on *my* name`. Never `GET all → act on all`; that is a foot-gun the moment a sibling exists.
3. **Per-agent state paths** — no shared `/tmp/pod_id`, no single lockfile another agent clobbers.
   The append-only STIGMERGY board is the pattern: one writer path, never `-A` in an N-writer repo.
4. **Lease what is genuinely scarce** — a single GPU account, a rate-limited API: don't race for it,
   post a TRICKSTER `RESOURCE_REQUEST` and wait for the grant. Coordination, not collision — the
   swarm already has the handshake ([[Cooperation Yields Agency]] at the infrastructure layer).

## Retrofit vs. born-with-it
Retrofitting single-tenant tooling is the expensive path (the RunPod tool now needs every
list/cull/sweep rewritten). Assuming multi-agent from the first line costs almost nothing — a slug
in a name, a filter on a query. **The default posture for a new palace tool is multi-tenant;
single-tenant is the exception that must be justified and loudly flagged.**
