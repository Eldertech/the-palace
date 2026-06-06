// @stigmergy/core/schema — the §2.2 wire contract, owned in one place.
//
// validator.js — the strict structural §2.2 validator (validateMessage): the
//   gatekeeper for every write to the blackboard. The §2.2 wire schema is sacred.
// posting.js  — §3.4 posting discipline on top of the schema (validateForPosting):
//   request_id / re correlation, board routing, SPINNING-UP, duplicate-FLAG.
//
// The lenient render-side validator (app/src/lib/schema.js, returns _warnings for
// UI feedback) deliberately stays in the app — gate-vs-feedback divergence, audit §6.
export * from './validator.js';
export * from './posting.js';
