// @stigmergy/core/blackboard — the one home for append-only JSONL I/O.
//
// jsonl.js        — readJsonl + sync appendMessage (the orchestrator/CLI path).
// append-async.js — serializeLine + async appendJsonLine (promise-queued per
//                   file; the app server's concurrency-safe write path).
//
// The blackboard is append-only; git is ground truth. There is one write path.
// NOTE (deferred, audit §3): the sync `appendMessage` and async `appendJsonLine`
// are two append implementations kept side by side here on purpose — unifying
// them (the sync callers would become async) is a behavior change, not the pure
// relocation this extraction is. Collapse them in a dedicated pass with its own tests.
export * from './jsonl.js';
export * from './append-async.js';
