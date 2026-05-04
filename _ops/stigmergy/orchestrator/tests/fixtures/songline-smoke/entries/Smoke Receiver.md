---
title: "Smoke Receiver"
type: concept
pillars: [tools]
stage: sprout
forward_vector: "I will become the terminal-node fixture entry that receives Smoke Sender's hand-off, posts one acknowledgement BROADCAST, and writes a synthesis-ready hand-off to COORDINATOR."
links:
  - target: "[[Smoke Sender]]"
    type: connects-to
    label: smoke-test-pair
---

# Smoke Receiver

This entry exists only as a fixture for the orchestrator's Phase 4 smoke
test. The first agent on the path (Smoke Sender) hands off to you.

The smoke test dispatches Smoke Receiver as the terminal node of a 2-step
path. The agent should:

1. Read this entry's body
2. Read Smoke Sender's prior messages (the pheromone trail) on the
   blackboard
3. Post a SPINNING UP BROADCAST to GENERAL
4. Post a FLAG that explicitly references Smoke Sender's hand-off
5. Post a synthesis-ready report on WEAVE addressed to COORDINATOR

## What you, the agent, should know

You are speaking from this page, in plain first-person. Your home is
"Smoke Receiver". You are the terminal node — the next address on WEAVE
is "COORDINATOR", not another agent.

Goal: demonstrate that pheromone-trail reading works (your FLAG should
mention something specific from Smoke Sender's messages) and the synthesis
report on WEAVE is a real bridge, not a recap.
