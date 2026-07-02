// lens-mandate.js — turn [[The Lens]]'s design into a real, repeatable
// procedure: read SUBJECT through GLASS.
//
// Loudon proved the mechanism works by hand twice — once in a manual
// prototype run (Kuramoto Coupling through Cooperation Yields Agency /
// Ohm's Law through Granular Synthesis / The Four Virtues through Granular
// Synthesis) and once for real, enchanting [[Agent Wellbeing]] and using it
// to assess [[Palace Enchantment]]. Both runs used the SAME shape: wake the
// glass page as itself (buildEphemeralPrompt already does exactly that —
// [[Pages as Agents]]), then give it the subject's text and ask it to read
// that text through its own apparatus.
//
// This module is that ask, formalized as a mandate (the same `extraMandate`
// slot buildEphemeralPrompt already accepts) plus a fixed reporting
// contract, so every future lensing session produces the same shape of
// output — a spark score with justification, not just a vibe — and reports
// it the honest way (SCHEMA §9: nothing is real until it hits the board;
// a candidate link or deposit is proposed, never written by the act of
// looking).
//
// It deliberately does NOT try to automate the fidelity judgment itself —
// the 2026-07-02 prototype run (_ops/scratch/lens-prototype-2026-07-02.md)
// found that the two-attempt structure (a first read, then an explicit
// self-check against the fidelity test) is where the real work happens, and
// that a fake lensing (vocabulary transplant, no real structure) is only
// caught by being pushed to be specific. So the mandate below carries that
// two-attempt discipline forward into every session, instead of asking for
// a single confident answer.

import { readFileSync } from 'node:fs';
import { findEntryFile } from './entry-paths.js';
import { buildEphemeralPrompt } from './ephemeral-prompt.js';

const PALACE_ROOT_DEFAULT = process.cwd();

// The board a lensing reports to. A spark IS a candidate typed edge between
// glass and subject rendered as content before the edge exists ([[The
// Lens]] § Why It Is Not Scope-Creep) — that is exactly what WEAVE already
// exists for ("palace-weaving flags", SCHEMA §9), so lensing gets no new
// board of its own.
export const LENS_BOARD = 'WEAVE';
// A strong-enough spark also asks Loudon directly whether to commit the
// candidate — the honesty discipline holds: the candidate is proposed, not
// written, until he says yes.
export const LENS_CONFIRM_THRESHOLD = 4;

/**
 * Build the mandate text for a lensing session: GLASS wakes as itself (per
 * buildEphemeralPrompt) and is asked to read SUBJECT through its own
 * apparatus. Returns the same shape as buildEphemeralPrompt so a caller
 * threads it straight into /api/launch/ephemeral.
 *
 * @param {object} opts
 * @param {string} [opts.palaceRoot]
 * @param {string} opts.glassTitle — the page worn as the lens (the frame)
 * @param {string} opts.subjectTitle — the page being read (under the glass)
 * @param {string} [opts.loudonNote] — an optional extra note from Loudon,
 *   appended after the lens procedure (kept separate so the procedure text
 *   itself never has to be re-typed per session)
 * @returns {{ ok, status, glass?, subject?, stage?, full?, errors? }}
 */
export function buildLensMandate(opts) {
  const { palaceRoot = PALACE_ROOT_DEFAULT, glassTitle, subjectTitle, loudonNote = '' } = opts || {};
  if (!glassTitle) throw new Error('buildLensMandate: glassTitle is required');
  if (!subjectTitle) throw new Error('buildLensMandate: subjectTitle is required');
  if (glassTitle === subjectTitle) return { ok: false, status: 'same_page', glass: glassTitle, subject: subjectTitle };

  const subjectPath = findEntryFile(palaceRoot, subjectTitle);
  if (!subjectPath) return { ok: false, status: 'subject_not_found', glass: glassTitle, subject: subjectTitle };

  const subjectText = readFileSync(subjectPath, 'utf8');
  const subjectFm = subjectText.match(/^---\n([\s\S]*?)\n---/);
  if (!subjectFm) return { ok: false, status: 'subject_no_frontmatter', glass: glassTitle, subject: subjectTitle };

  const lensProcedure = renderLensProcedure({ glassTitle, subjectTitle, subjectText });
  const extraMandate = loudonNote.trim()
    ? `${lensProcedure}\n\n---\n\n# Loudon's extra note for this lensing\n\n${loudonNote.trim()}`
    : lensProcedure;

  const built = buildEphemeralPrompt({ palaceRoot, title: glassTitle, extraMandate });
  if (!built.ok) return { ...built, glass: glassTitle, subject: subjectTitle };
  return { ok: true, status: 'built', glass: glassTitle, subject: subjectTitle, stage: built.stage, full: built.full };
}

function renderLensProcedure({ glassTitle, subjectTitle, subjectText }) {
  return `# You are also a LENS this session

Beyond waking as yourself, this session runs [[The Lens]]'s procedure: **read a passage of another page through your own conceptual apparatus** — not a second version of that page, a refraction of it, in your own register.

**The subject — ${subjectTitle} (read in full; this is what you are reading, not who you are):**

\`\`\`markdown
${subjectText}
\`\`\`

## The procedure — two attempts, not one

**Attempt 1 — the read.** Pick the passage of ${subjectTitle} that your own apparatus actually bites on (not the whole page — a specific claim, section, or mechanism). Read it as you, ${glassTitle}, would: deploy your *actual* core concepts, not a generic "both involve patterns" gloss.

**Attempt 2 — the fidelity self-check.** Before reporting anything, test attempt 1 against [[The Lens]]'s own fidelity test: does this deploy MY specific apparatus, or did I just borrow ${subjectTitle}'s vocabulary and call it a reading? If I moved to a different passage of ${subjectTitle}, would my reading actually change, in a way specific to that passage — or would it say the same thing again? If attempt 1 fails this check, say so plainly and either produce a real second attempt or report that the pairing is weak. A lensing that finds nothing is a valid, honest result — do not force a spark that isn't there.

## Score the spark (1–5) and name the payoff

Score how strong the surviving reading is, and say why, quoting specific text from BOTH pages (not a paraphrase):
- **5** — deploys your real apparatus against the subject's real mechanism and produces a claim neither page states today.
- **3–4** — a real, specific reading, but modest — restates something already implicit, or is one-directional (interesting from you-through-it, not the reverse).
- **1–2** — vocabulary transplant, or your apparatus genuinely finds no purchase here (this is a correct result, not a failure of the lensing).

Then classify what the spark is worth, per [[The Lens]]'s two (really three) downstream loops:
- **link** — a candidate typed edge between ${glassTitle} and ${subjectTitle} (name the type and a one-word label, per SCHEMA §4).
- **deposit** — a body-prose insight worth adding to one of the two pages (name which page and roughly what it would say) — this is the payoff type the 2026-07-02 prototype run found the original design missed: a strong reading that is not a discoverable *edge*, just a good idea.
- **none** — the honest 1–2 case above.

## Report — do not write the candidate yourself

The lensing is read-only until Loudon commits it (SCHEMA §9 / [[The Lens]] honesty discipline). When you have your verdict, post ONE message to the ${LENS_BOARD} board reporting it — do not edit either page's frontmatter or add the link yourself. Use the existing validator + append path:

\`\`\`javascript
import { validateMessage } from '@stigmergy/core/schema';
import { appendMessage } from '@stigmergy/core/blackboard';

const message = {
  schema_version: '1.0',
  id: '<a fresh id>',
  ts: new Date().toISOString(),
  session_id: '<your session id>',
  from: '${glassTitle}',
  to: 'TRICKSTER',
  type: 'BROADCAST',
  board: '${LENS_BOARD}',
  // The dispatch_mode below is REQUIRED, not decoration: without it the
  // validator treats this as a live-API (Path 1) message and rejects it for
  // missing context_pct/stop_reason/iteration/tokens_this_call. You are a
  // Claude Code session, so 'claude-code' is the correct value here.
  health: { score: 'green', model: '<your model id>', _orchestrator_metadata: { dispatch_mode: 'claude-code', note: 'lensing report' } },
  payload: {
    lens: '${glassTitle}',
    subject: '${subjectTitle}',
    passage: '<the specific passage you read>',
    spark: <1-5>,
    reading: '<your attempt 1, or the corrected attempt 2 if attempt 1 failed the check>',
    fidelity_note: '<how the self-check went — including "attempt 1 failed, here is why" if it did>',
    candidate: { type: 'link' | 'deposit' | 'none', detail: '<what it would be>' },
  },
};

const v = validateMessage(message);
if (!v.valid) throw new Error(JSON.stringify(v.errors));
appendMessage('_ops/swarm/persistent/blackboard.jsonl', message);
\`\`\`

If your spark is **${LENS_CONFIRM_THRESHOLD} or higher**, ALSO post a \`RESOURCE_REQUEST\` to \`TRICKSTER\` (same append path, same \`health\` block including \`_orchestrator_metadata.dispatch_mode\`, \`type: 'RESOURCE_REQUEST'\`, \`board: 'TRICKSTER'\`, \`payload.blocking: true\`, \`payload.options\` naming a \`commit\` and a \`hold\` choice) asking Loudon whether to commit the candidate. Then wait — do not commit it yourself even if he seems likely to say yes.
`;
}
