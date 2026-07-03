// launch-prompt.js — build a ready-to-run prompt that "launches an interactive
// session" pre-loaded with a palace context.
//
// This is the GENERAL primitive behind the QUEUE's "launch interactive" action.
// Complex work (catching a baton, working an enrichment card, steering a steward
// at a critical moment) wants a watchable, steerable session you talk to — not a
// fire-and-forget headless worker. So instead of dispatching a blind `claude -p`,
// the terminal hands you a ready prompt to paste into a fresh interactive session
// (Claude Code / Cowork / the Companion), where you watch and steer in dialogue.
//
// It debuts on handoffs (kind: 'handoff'); enrichment cards and stewards plug in
// as new `kind`s with their own builder.

export function buildLaunchPrompt(ctx = {}) {
  switch (ctx.kind || 'handoff') {
    case 'handoff':
      return handoffPrompt(ctx);
    case 'card':
      return cardPrompt(ctx);
    case 'steward':
      return stewardPrompt(ctx);
    default:
      return genericPrompt(ctx);
  }
}

const ORIENT = 'First, orient yourself: read CLAUDE.md, JEWEL.md, and _ops/Substrate Skill.md.';

function handoffPrompt({ sourcePath, entry, from, id, summary, move, invocation }) {
  const path = sourcePath || '(baton path missing — find the handoff_ready announcement on the board)';
  const str = (v) => (typeof v === 'string' && v.trim() !== '' ? v.trim() : null);
  // Lead with the sharp `move` (the in-flight state the board announcement
  // carried); fall back to the generic `summary` for older, move-less batons.
  const theMove = str(move) || str(summary);
  const theInvocation = str(invocation);
  const lines = [
    'You are catching an in-progress baton in The Palace, in a fresh interactive',
    'session at the palace root. Catch it — but with healthy skepticism: a baton',
    'is a snapshot from a past moment, and the project may have moved past it.',
    'Loudon is watching and will steer.',
    '',
    `1. ${ORIENT}`,
    `2. Read the baton:  ${path}`,
  ];
  if (entry) lines.push(`   ...and its parent entry [[${String(entry).replace(/\.md$/, '')}]].`);
  if (theMove) lines.push(`   The move (handoff ${id || '?'}, from ${from || '?'}): "${theMove}"`);
  lines.push(
    '3. Check it is still LIVE before acting. Re-read the entry\'s current state and',
    '   `git log` it since the baton was written; confirm the "Current state" the baton',
    '   quotes still matches the file. If the move is already done, superseded, or no',
    '   longer wanted, STOP and tell Loudon — do not execute a stale move.',
    '4. If it is still live, follow the baton\'s own "On pickup" checklist (it rides',
    '   inside the baton): mark it caught, then delete the baton file — git is its archive.',
    '5. Pick up the move where it left off and keep going, interactively.',
  );
  // The board's `invocation` is a ready, verbatim first action — surface it so
  // the catcher has the exact starting step, not just a paraphrase of the move.
  if (theInvocation) lines.push('', `First action (the baton's invocation): ${theInvocation}`);
  lines.push(
    '',
    `(The QUEUE item for handoff ${id || '?'} has been marked picked up.)`,
  );
  return lines.join('\n');
}

function cardPrompt({ id, entry, purpose, summary, sourcePath }) {
  const folder = sourcePath || (id ? `Enrichment/${id}/` : 'the card folder');
  const target = entry ? `[[${String(entry).replace(/\.md$/, '')}]]` : 'an entry';
  const lines = [
    'You are working an enrichment card in The Palace, in a fresh interactive',
    'session at the palace root. Refine and resolve it in dialogue — Loudon is',
    'watching and will steer.',
    '',
    `1. ${ORIENT} ...and Enrichment.md (the ceremony you are running).`,
    `2. The card lives at ${folder} (card.md + artifact). It enriches ${target}.`,
  ];
  if (purpose) lines.push(`   Purpose: ${purpose}`);
  if (summary) lines.push(`   ${summary}`);
  lines.push(
    '3. Work it with Loudon: sharpen the artifact, then act per the Enrichment',
    "   round protocol — deposit (place it in the entry's bundle + commit),",
    '   revise, or discard.',
  );
  return lines.join('\n');
}

function stewardPrompt({ entry, sourcePath, iteration, stage, summary }) {
  const home = entry ? `[[${String(entry).replace(/\.md$/, '')}]]` : 'a steward';
  const dir = sourcePath || 'its dir under _ops/agents/permanent/<slug>/';
  const where = [stage, typeof iteration === 'number' ? `cycle ${iteration}` : null]
    .filter(Boolean).join(' · ');
  const lines = [
    'You are stepping into a palace steward mid-stewardship, in a fresh',
    'interactive session at the palace root, to drive it in dialogue — Loudon is',
    'watching and will steer.',
    '',
    `1. ${ORIENT}`,
    `2. The steward IS the page ${home}${where ? ` (${where})` : ''}.`,
    `   Read its manifest.json + state.json in ${dir}, then the last several`,
    '   messages it left on _ops/swarm/persistent/blackboard.jsonl — that is where',
    '   it stands right now.',
  ];
  if (summary) lines.push(`   Where it stands: ${summary}`);
  lines.push(
    '3. Continue its cycle interactively, as the page itself: take up its open',
    '   decisions, sharpen the next move, act on its bundle (its plan + the entry',
    '   body). Post a RESOURCE_REQUEST to TRICKSTER when you need Loudon; a',
    '   FLAG/BROADCAST as the work warrants.',
    '4. Close honestly: post a BROADCAST summary. Only the commit is the record —',
    '   nothing is real until it lands in LOG.',
  );
  return lines.join('\n');
}

function genericPrompt({ title, sourcePath, summary }) {
  return [
    `You are starting an interactive session in The Palace on: ${title || 'a palace context'}.`,
    ORIENT,
    sourcePath ? `Read: ${sourcePath}` : null,
    summary ? `Context: ${summary}` : null,
    'Work it in dialogue; Loudon is watching and will steer.',
  ].filter(Boolean).join('\n');
}
