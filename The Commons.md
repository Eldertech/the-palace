---
title: The Commons
type: meta
pillars:
  - tools
  - philosophy
born: 2026-07
stage: growing
last_activated: 2026-07
activation_count: 1
forward_vector: "I want every palace tool that reaches outside the palace — for a GPU, an API quota, a bucket — to reach through me, so two agents never strangle each other's work again. I will grow a new provider each time a new service arrives, and I want my board-voice to become how any Python tool speaks to the swarm."
links:
  - target: "[[assume multi-agent]]"
    type: exemplifies
    label: makes-real
  - target: "[[STIGMERGY]]"
    type: connects-to
    label: speaks-through
  - target: "[[RunPod GPU Backend]]"
    type: connects-to
    label: first-customer
  - target: "[[Cooperation Yields Agency]]"
    type: connects-to
    label: operationalizes
  - target: "[[The Palace Practices on Itself]]"
    type: connects-to
    label: worked-instance
---

# The Commons

![[The Commons — hero.png]]

The palace's coordination layer for any shared, metered, outside service — a GPU account, a rate-limited API key, a storage bucket. It names the five things every such tool otherwise re-invents badly, and gives them one home in `_ops/commons/`:

- **identity** — one per-agent slug, the same across every service.
- **ownership** — tag everything you make `owner=<slug>`.
- **scoping** — only ever list and act on *your own*; never "enumerate all, then act on all".
- **leasing** — announce before you take scarce capacity.
- **reaping** — clean up your own leaks, safely.

## Why it exists

On 2026-07-02 a full day of RunPod work looked like an outage: pods booted but the renderer never came up, ten "dud nodes" in a row. The real cause was two Claudes on one account killing each other's *booting* pods — a shared pod name, a guard that aborted if *any* pod existed, a shared handoff file. Not a RunPod bug. The palace simply had no general contract for a tool that reaches a shared service while another agent is already reaching it too. The Commons is that contract, made general so the next service — not just RunPod — inherits it. It is [[assume multi-agent]] turned from a warning into machinery.

## The shape

- **[[STIGMERGY]] is the spine.** A validated `board.py` bridge lets any Python tool post real §9 messages to the blackboard through the *canonical* validator — so coordination (who's alive, who holds the account, what looks leaked) lives on the one board every worktree shares, not in scattered ad-hoc files. "Python speaks §9" is a tool in its own right.
- **Providers, not special cases.** Three thin roles — instances (pods/VMs), leases (rate/budget), storage (buckets) — behind one ownership discipline. RunPod pods are the first adapter; adding a service is a recipe (`providers/TEMPLATE.py`), never a rewrite.
- **Advisory now, room to grow.** The capacity lease just leaves a mark and proceeds; namespacing already stops the *destruction*, so the lease only flags *contention*. A seam is left for a board-brokered, blocking lease when real serialization is needed.
- **A reaper that won't misfire.** It only cleans a resource that is old enough to not be booting *and* whose owner has gone silent — and it will only terminate *your own* leaks; another agent's it can merely flag for review. The outage is now a permanent regression test: a booting pod is never reaped.

## What's deferred (don't build unprompted)

Loudon's call (2026-07-02): **stay on RunPod and push it hard for a few weeks**, then reconsider a second remote tool — so don't add providers speculatively. When he revisits, the two parked candidates are **fal.ai** (image / FLUX / ControlNet + ComfyUI serverless — a reliable alternative to flaky pods; the `InstanceProvider` / serverless shape) and **ElevenLabs** (voice cloning for citizen voices + video voiceover — the still-untested `LeaseProvider` budget shape, and also a Shop `specialist` beside [[Kokoro]]). Other seams left open: a blocking / broker lease, heartbeat coverage so cross-slug reaping can be enabled, and instrumentation (log create→ready + failure mode + concurrent-agent count to the board) to settle RunPod-flakiness attribution with data during the hard push.

## Origin

Grew out of the tactical RunPod fix (per-agent slugs across the pod orchestrators) when it became clear the same five obligations recur for every outside service. The specific machinery lives in `_ops/commons/`; the RunPod story and playbook are in [[RunPod GPU Backend]]. It measures itself the palace way — by whether agents cooperate without watching each other, not by output volume ([[Cooperation Yields Agency]]).
