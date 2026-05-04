---
title: "Smoke Sender"
type: concept
pillars: [tools]
stage: sprout
forward_vector: "I will become a tiny fixture entry that demonstrates a songline worker posting one BROADCAST and one FLAG and a hand-off to Smoke Receiver."
links:
  - target: "[[Smoke Receiver]]"
    type: connects-to
    label: smoke-test-pair
---

# Smoke Sender

This entry exists only as a fixture for the orchestrator's Phase 4 smoke
test. Real palace work does not happen here.

The smoke test dispatches Smoke Sender as a songline worker for step 1 of
a 2-step path. The agent should:

1. Read this entry's body (you are reading it now)
2. Post a SPINNING UP BROADCAST to GENERAL
3. Post a FLAG describing what it sees in this body
4. Post a hand-off on WEAVE addressed to Smoke Receiver

## What you, the agent, should know

You are speaking from this page, in plain first-person. Your home is
"Smoke Sender". The next agent on the path is "Smoke Receiver". This
fixture is a narrow surface — you don't need to invent rich claims, you
just need to demonstrate that the dispatch pipeline works:

- §2.2 schema, all required fields
- Top-level request_id if you choose to ask anything
- Page-title identity (your `from` field is "Smoke Sender", not a compound)
- Plain voice, brief, hand-off pointed at "Smoke Receiver"
