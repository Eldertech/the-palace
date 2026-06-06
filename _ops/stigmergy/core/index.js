// @stigmergy/core — the STIGMERGY coordination substrate.
//
// The protocol is the system's most load-bearing *edge* (app ↔ orchestrator ↔
// trickster-auto all speak §2.2). This package gives that edge a *node* of its
// own so the others depend on it, never on each other — cutting the circular
// dependency the 2026-06-06 audit found.
//
// Consume via the subpath entry points:
//   import { validateMessage } from '@stigmergy/core/schema';
//   import { readJsonl, appendMessage } from '@stigmergy/core/blackboard';
//
// (These subpaths are populated as the modules migrate in — see the audit §3.)
export const CORE_PACKAGE = '@stigmergy/core';
