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

// Free-text backstop (scanned over decision_topic / subject / rationale) for an
// audition MISLABELED as a routine resource. CURATED on the live board: this
// palace is overwhelmingly audio/synth work, so bare domain words ("audible",
// "playback", "hear it") appear in almost every rationale and are NOT signal —
// matching them escalated everything and starved the auto-grant path. Instead
// we match the literal act-word "audition" plus phrases where the DECISION
// ITSELF is sensory or gated ("sensory deliverable", "needs a gate", "your
// ear", "before I commit labor"). Verified split (2026-05-29): catches the
// genuinely mislabeled auditions (apo-004 "sensory deliverable that needs a
// gate", portamento-006 "Audition the ear set") while leaving true design
// forks (gwl-015 "which parameter is the primary sweep", semantic-delay-004
// "wire the model vs build standalone") grantable. This backstop is a tunable
// SAFETY net, not request-reasoning; Loudon validates its escalations in
// shadow mode. False escalations are acceptable; false grants are not.
export const SENSORY_DECISION_TEXT = /\b(audition|sensory deliverable|sensory gate|needs? a gate|gate before|your ear|by ear|survives? your ear|survived your ear|needs? a listen|have a listen|give it a listen|a listen would|audition target|before i commit labor)\b/i;

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

  // 3. Sensory/gated DECISION cue in the decision text (curated backstop for a
  // mislabeled audition; see SENSORY_DECISION_TEXT note above).
  const text = [request?.decision_topic, request?.subject, request?.rationale]
    .filter((s) => typeof s === 'string')
    .join('  ');
  const tm = text.match(SENSORY_DECISION_TEXT);
  if (tm) {
    return {
      blocked: true,
      kind: 'audition',
      signal: `text~"${tm[0]}"`,
      reason: `Sensory/gated decision cue in text ("${tm[0]}"): a request whose resource looks routine but whose own framing says the decision is sensory/gated. Treated as an audition and escalated.`,
    };
  }

  return { blocked: false, kind: null, reason: null, signal: null };
}
