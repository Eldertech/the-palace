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
    default:
      return genericPrompt(ctx);
  }
}

const ORIENT = 'First, orient yourself: read CLAUDE.md, JEWEL.md, and _ops/Substrate Skill.md.';

function handoffPrompt({ sourcePath, entry, from, id, summary }) {
  const path = sourcePath || '(baton path missing — find the handoff_ready announcement on the board)';
  const lines = [
    'You are catching an in-progress baton in The Palace, in a fresh interactive',
    'session at the palace root. Pick up the move and run with it in dialogue —',
    'Loudon is watching and will steer.',
    '',
    `1. ${ORIENT}`,
    `2. Read the baton:  ${path}`,
  ];
  if (entry) lines.push(`   ...and its parent entry [[${String(entry).replace(/\.md$/, '')}]].`);
  if (summary) lines.push(`   The move (handoff ${id || '?'}, from ${from || '?'}): "${summary}"`);
  lines.push(
    '3. Follow the baton\'s own "On pickup" checklist (it rides inside the baton):',
    '   mark it caught, then delete the baton file — git is its archive.',
    '4. Pick up the move exactly where it left off and keep going, interactively.',
    '',
    `(The QUEUE item for handoff ${id || '?'} has been marked picked up.)`,
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
