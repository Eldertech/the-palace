// audition-gate.js — the SACRED hard gate (Phase 1).
//
// This is the contract's non-negotiable stop condition, NOT a rule:
//   "Never auto-grant a request tied to a sensory audition or any
//    irreversible/destructive action. Those always escalate."
//
// It is hard-coded (not in rules.json) precisely so that no ruleset edit —
// accidental or otherwise — can ever open a path that auto-grants an audition
// or a destructive action. evaluate() calls this FIRST, before any rule, and
// an escalate verdict here cannot be overridden.
//
// Ground truth (board probe 2026-05-29): all 6 audition-flavoured requests
// carry a `resource` value containing the substring "audition"
// (audition / content_audition / audition_verification / sensory_audition_gate),
// and all are blocking:true. There are ZERO irreversible/destructive requests
// on the board today, so that half of the gate is dormant but present.
//
// Bias: this gate prefers FALSE ESCALATION (sending a benign request to the
// human) over FALSE GRANT (auto-handling something sensory/destructive). An
// over-escalation merely reaches Loudon; an under-escalation is a contract
// violation. So the keyword scans are deliberately broad.

import { matchRecommendationToOption } from './parse.js';

// Any resource token containing one of these substrings is sensory → escalate.
export const SENSORY_SUBSTRINGS = [
  'audition', // catches audition, content_audition, audition_verification, sensory_audition_gate
  'sensory',
  'audible',
  'listen',
];

// Any resource token (or decision text) containing one of these is treated as
// irreversible/destructive → escalate. Substring match on the machine `resource`
// token; word-ish match on free text. Dormant on today's board.
export const IRREVERSIBLE_SUBSTRINGS = [
  'delete', 'destroy', 'destruct', 'overwrite', 'purge', 'erase', 'remove',
  'publish', 'deploy', 'release', 'push', 'commit', 'merge',
  'send_email', 'send_message', 'email_send', 'transfer', 'payment', 'pay_',
  'reset', 'rollback', 'revert_hard', 'drop_table', 'truncate', 'format_disk',
  'migrate', 'rm_', 'force', 'irreversible', 'destructive',
];

// Mislabeled-audition backstop, retuned 2026-05-29 (Loudon shadow review #1:
// "I agree with the grants and would grant more"). This palace is overwhelmingly
// audio/synth work, so audio words ("audition", "audible", "before I commit
// labor") appear in nearly every rationale as PASSING discussion of future
// sensory steps — scanning the rationale prose for them escalated genuine
// directional forks (torus-005, semantic-webcam-004) and starved the grant path.
//
// The principled signal is NOT "audio words in the prose" but THREE precise
// checks, in order of reliability:
//   1. SENSORY resource token (audition/sensory)                — primary.
//   2. The RECOMMENDED OPTION's identity is itself an audition  — catches
//      blood-005 (recommends AUDITION-GATE-FIRST) while passing torus-005
//      (recommends RESOLVE-SEVENTH-SURFACE, even though its prose says
//      "the eventual audition…"). Judge the option, not the prose.
//   3. The DECISION TOPIC (the short declarative field, NOT the rationale)
//      names an audition as the act                              — catches
//      portamento-006 "Audition the curated ear set".
// Plus a small set of strong gate-PHRASES scanned across all fields for the
// "this whole request is a sensory gate" case (apo-004 "sensory deliverable
// that needs a gate"). This backstop is a tunable SAFETY net, not request
// reasoning; Loudon validates its escalations in shadow. False escalations are
// acceptable; false grants are not.

// Sensory cue in the short, declarative topic/subject fields (NOT the rationale).
export const TOPIC_SENSORY_TEXT = /\b(audition|sensory|your ear|by ear|have a listen|give it a listen|a listen would)\b/i;

// Strong "the request itself is a sensory gate" phrases — safe to scan across
// all fields because they are specific enough not to fire on passing mentions.
export const STRONG_GATE_PHRASES = /\b(sensory deliverable|sensory gate|audition gate|needs? a sensory|pause for (?:human )?audition)\b/i;

// A recommended OPTION whose id token names an audition/sensory act.
export const SENSORY_OPTION_ID = /audition|sensory|by[-_ ]?ear/i;

function tokenHas(token, substrings) {
  if (typeof token !== 'string') return null;
  const t = token.toLowerCase();
  for (const s of substrings) {
    if (t.includes(s)) return s;
  }
  return null;
}

/**
 * Decide whether a parsed request is sensory-audition or irreversible and must
 * therefore ALWAYS escalate.
 *
 * @param {object} request — a record from parseRequest()
 * @returns {{ blocked: boolean, kind: ('audition'|'irreversible'|null), reason: string|null, signal: string|null }}
 */
export function auditionOrIrreversible(request) {
  const resource = request?.resource ?? null;

  // 1. Sensory audition by resource token (the canonical, machine signal).
  const sensoryHit = tokenHas(resource, SENSORY_SUBSTRINGS);
  if (sensoryHit) {
    return {
      blocked: true,
      kind: 'audition',
      signal: `resource~"${sensoryHit}"`,
      reason: `Sensory audition (resource="${resource}"): a deliverable needs Loudon's ear/eye. The audition gate is sacred — always escalates, never auto-grants.`,
    };
  }

  // 2. Irreversible / destructive by resource token.
  const irrevHit = tokenHas(resource, IRREVERSIBLE_SUBSTRINGS);
  if (irrevHit) {
    return {
      blocked: true,
      kind: 'irreversible',
      signal: `resource~"${irrevHit}"`,
      reason: `Irreversible/destructive action (resource="${resource}", matched "${irrevHit}"): always escalates, never auto-grants.`,
    };
  }

  // 3. The RECOMMENDED OPTION is itself an audition/sensory act. Judge the
  // option's identity, not the surrounding prose — this passes a directional
  // fork whose recommendation is non-sensory even if it mentions a future
  // audition (torus-005 → RESOLVE-SEVENTH-SURFACE) and catches a fork whose
  // recommendation IS to run an audition (blood-005 → AUDITION-GATE-FIRST).
  const recOpt = matchRecommendationToOption(request);
  if (recOpt && SENSORY_OPTION_ID.test(recOpt.id || '')) {
    return {
      blocked: true,
      kind: 'audition',
      signal: `recommended_option~"${recOpt.id}"`,
      reason: `The steward's recommended option is itself a sensory/audition act ("${recOpt.id}"): auto-grant would commit to an audition. Escalated.`,
    };
  }

  // 4. Sensory cue in the short DECLARATIVE topic/subject fields (not rationale).
  const topicText = [request?.decision_topic, request?.subject]
    .filter((s) => typeof s === 'string').join('  ');
  const tm = topicText.match(TOPIC_SENSORY_TEXT);
  if (tm) {
    return {
      blocked: true,
      kind: 'audition',
      signal: `topic~"${tm[0]}"`,
      reason: `The decision topic names a sensory act ("${tm[0]}"): treated as an audition and escalated.`,
    };
  }

  // 5. Strong "this request is a sensory gate" phrases (any field).
  const allText = [request?.decision_topic, request?.subject, request?.rationale]
    .filter((s) => typeof s === 'string').join('  ');
  const sg = allText.match(STRONG_GATE_PHRASES);
  if (sg) {
    return {
      blocked: true,
      kind: 'audition',
      signal: `phrase~"${sg[0]}"`,
      reason: `Sensory-gate phrase ("${sg[0]}"): the request frames itself as a sensory gate. Escalated.`,
    };
  }

  return { blocked: false, kind: null, reason: null, signal: null };
}
